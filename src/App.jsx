import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import HabitCard from './components/HabitCard';
import { HabitIcon } from './components/HabitIcon';
import InstallPrompt from './components/InstallPrompt';
import ProgressBar from './components/ProgressBar';
import AddHabitModal from './components/AddHabitModal';
import ImagePreviewModal from './components/ImagePreviewModal';
import HistoryView from './components/HistoryView';
import ScheduleView from './components/ScheduleView';
import WorkProcessView from './components/WorkProcessView';
import BottomNav from './components/BottomNav';
import {
  loadHabits, saveHabits, loadDailyData, saveDailyData,
  getTodayEntries, getStreakForHabit,
} from './utils/storage';
import {
  loadScheduleItems, saveScheduleItems,
  loadScheduleData, saveScheduleData,
} from './utils/scheduleStorage';
import { getTodayKey } from './utils/imageUtils';
import { savePhoto, loadTodayPhotos, pruneOldPhotos } from './utils/photoDb';
import { loadProcessItems, saveProcessItems } from './utils/processStorage';

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function computeMissedIds(habits, todayEntries) {
  const now = new Date();
  return habits.filter(h => {
    if (todayEntries[h.id]?.completed || !h.time) return false;
    const [hr, mn] = h.time.split(':').map(Number);
    const t = new Date(); t.setHours(hr, mn, 0, 0);
    return now > t;
  }).map(h => h.id);
}

function sortHabits(habits, todayEntries) {
  return [...habits].sort((a, b) => {
    const aD = todayEntries[a.id]?.completed ? 1 : 0;
    const bD = todayEntries[b.id]?.completed ? 1 : 0;
    if (aD !== bD) return aD - bD;
    return (a.time || '99:99').localeCompare(b.time || '99:99');
  });
}

const PROCESS_SCHEDULE_META = {
  thinking:  { icon: 'Brain',     category: 'thinking' },
  learning:  { icon: 'BookOpen',  category: 'learning' },
  creating:  { icon: 'Hammer',    category: 'action' },
  marketing: { icon: 'Megaphone', category: 'result' },
};

function processScheduleBlock(item) {
  const meta = PROCESS_SCHEDULE_META[item.stage] ?? PROCESS_SCHEDULE_META.thinking;
  return {
    id: `process_${item.id}`,
    sourceProcessId: item.id,
    title: item.title,
    startTime: item.startTime,
    endTime: item.endTime,
    workDate: item.workDate,
    icon: meta.icon,
    category: meta.category,
  };
}

export default function App() {
  const [tab, setTab] = useState('today');

  // ── Habits ────────────────────────────────────────────────────────────────
  const [habits,     setHabits]     = useState(() => loadHabits());
  const [dailyData,  setDailyData]  = useState(() => loadDailyData());
  const [todayPhotos, setTodayPhotos] = useState({});
  const [showAdd,    setShowAdd]    = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [tick,       setTick]       = useState(0);

  // ── Schedule ──────────────────────────────────────────────────────────────
  const [schedItems, setSchedItems] = useState(() => loadScheduleItems());
  const [schedData,  setSchedData]  = useState(() => loadScheduleData());

  // ── Daily work process ───────────────────────────────────────────────────
  const [processItems, setProcessItems] = useState(() => loadProcessItems());

  const todayKey = getTodayKey();

  useEffect(() => {
    loadTodayPhotos(todayKey, loadHabits().map(h => h.id)).then(setTodayPhotos);
    pruneOldPhotos().catch(() => {});
  }, [todayKey]);

  useEffect(() => { saveHabits(habits); },    [habits]);
  useEffect(() => { saveDailyData(dailyData); }, [dailyData]);
  useEffect(() => { saveScheduleItems(schedItems); }, [schedItems]);
  useEffect(() => { saveScheduleData(schedData); },   [schedData]);
  useEffect(() => { saveProcessItems(processItems); }, [processItems]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const key = getTodayKey();
    const id = setInterval(() => { if (getTodayKey() !== key) window.location.reload(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const todayEntries = getTodayEntries(dailyData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const missedIds = useMemo(() => computeMissedIds(habits, todayEntries), [habits, todayEntries, tick]);

  // ── Habit handlers ────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (habitId, base64) => {
    await savePhoto(todayKey, habitId, base64);
    setTodayPhotos(p => ({ ...p, [habitId]: base64 }));
    setDailyData(p => ({
      ...p, [todayKey]: { ...p[todayKey], [habitId]: { completed: true, timestamp: Date.now() } },
    }));
  }, [todayKey]);

  const handleCorrection = useCallback((dateKey, habitId) => {
    setDailyData(p => ({
      ...p, [dateKey]: { ...p[dateKey], [habitId]: { completed: true, timestamp: Date.now(), corrected: true } },
    }));
  }, []);

  const handleDeleteHabit = useCallback(id => setHabits(p => p.filter(h => h.id !== id)), []);

  const handleAddHabit = useCallback(({ name, icon, time }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setHabits(p => [...p, { id, name, icon, time }]);
  }, []);

  // ── Schedule handlers ─────────────────────────────────────────────────────
  const handleSchedToggle = useCallback(itemId => {
    setSchedData(p => {
      const day = p[todayKey] || {};
      const cur = day[itemId];
      return {
        ...p,
        [todayKey]: { ...day, [itemId]: cur?.completed ? null : { completed: true, timestamp: Date.now() } },
      };
    });
  }, [todayKey]);

  const handleSchedAdd = useCallback(data => {
    const id = `sc_${Date.now()}`;
    setSchedItems(p => [...p, { id, ...data }]);
  }, []);

  const handleSchedEdit = useCallback(updated => {
    setSchedItems(p => p.map(i => i.id === updated.id ? updated : i));
  }, []);

  const handleSchedDelete = useCallback(id => {
    setSchedItems(p => p.filter(i => i.id !== id));
  }, []);

  // ── Work process handlers ────────────────────────────────────────────────
  const handleProcessAdd = useCallback(data => {
    const id = `wp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item = { id, ...data };
    setProcessItems(previous => [...previous, item]);
    setSchedItems(previous => [...previous, processScheduleBlock(item)]);
  }, []);

  const handleProcessEdit = useCallback(updated => {
    setProcessItems(previous => previous.map(item => item.id === updated.id ? updated : item));
    setSchedItems(previous => {
      if (!updated.startTime || !updated.endTime) {
        return previous.filter(item => item.sourceProcessId !== updated.id);
      }
      const block = processScheduleBlock(updated);
      const exists = previous.some(item => item.sourceProcessId === updated.id);
      return exists
        ? previous.map(item => item.sourceProcessId === updated.id ? block : item)
        : [...previous, block];
    });
  }, []);

  const handleProcessDelete = useCallback(id => {
    setProcessItems(previous => previous.filter(item => item.id !== id));
    setSchedItems(previous => previous.filter(item => item.sourceProcessId !== id));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const sortedHabits   = sortHabits(habits, todayEntries);
  const completedCount = habits.filter(h => todayEntries[h.id]?.completed).length;
  const existingNames  = habits.map(h => h.name.toLowerCase());
  const todaySchedData = schedData[todayKey] || {};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">

      {/* ── HISTORY ─────────────────────────────────────────── */}
      {tab === 'history' && (
        <HistoryView
          habits={habits} dailyData={dailyData}
          onClose={() => setTab('today')}
          onCorrection={handleCorrection}
        />
      )}

      {/* ── SCHEDULE ────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <ScheduleView
          scheduleItems={schedItems}
          todayKey={todayKey}
          todayData={todaySchedData}
          onToggle={handleSchedToggle}
          onAdd={handleSchedAdd}
          onEdit={handleSchedEdit}
          onDelete={handleSchedDelete}
        />
      )}

      {/* ── DAILY WORK PROCESS ──────────────────────────────── */}
      {tab === 'process' && (
        <WorkProcessView
          items={processItems}
          onAdd={handleProcessAdd}
          onEdit={handleProcessEdit}
          onDelete={handleProcessDelete}
        />
      )}

      {/* ── TODAY ───────────────────────────────────────────── */}
      {tab === 'today' && (
        <div className="max-w-md mx-auto px-4 pb-28">
          <header className="pt-8 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={26} className="text-green-500" />
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">HabitSnap</h1>
            </div>
            <p className="text-base text-gray-400 font-medium">{getTodayLabel()}</p>
          </header>

          <ProgressBar completed={completedCount} total={habits.length} />

          <div className="space-y-3">
            {sortedHabits.length === 0 && (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">🌱</p>
                <p className="text-gray-500 text-base">No habits yet. Tap + to add one!</p>
              </div>
            )}
            {sortedHabits.map(habit => (
              <div key={habit.id} className="group">
                <HabitCard
                  habit={habit}
                  entry={todayEntries[habit.id] ?? null}
                  streak={getStreakForHabit(habit.id, dailyData)}
                  photo={todayPhotos[habit.id] ?? null}
                  missed={missedIds.includes(habit.id)}
                  onUpload={handleUpload}
                  onDelete={handleDeleteHabit}
                  onThumbnailClick={src => setPreview({ src, habitName: habit.name })}
                />
              </div>
            ))}
          </div>

          {habits.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Current Streaks</p>
              <div className="flex flex-wrap gap-2">
                {habits.map(h => (
                  <div key={h.id} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                    <HabitIcon iconName={h.icon} habitId={h.id} size={14} />
                    <span className="text-sm text-gray-700 font-semibold">{h.name}</span>
                    <span className="text-sm text-orange-500 font-bold">🔥{getStreakForHabit(h.id, dailyData)}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FAB — only Today tab ─── */}
      {tab === 'today' && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-200 transition-all hover:scale-105 active:scale-95 z-20"
        >
          <Plus size={28} />
        </button>
      )}

      {/* ── Bottom nav ───────────────────────────────────────── */}
      <BottomNav active={tab} onChange={setTab} />

      {/* ── Modals ───────────────────────────────────────────── */}
      {showAdd && tab === 'today' && (
        <AddHabitModal existingNames={existingNames} onAdd={handleAddHabit} onClose={() => setShowAdd(false)} />
      )}
      {preview && (
        <ImagePreviewModal src={preview.src} habitName={preview.habitName} onClose={() => setPreview(null)} />
      )}
      <InstallPrompt />
    </div>
  );
}
