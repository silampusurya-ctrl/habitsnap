import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Sparkles, History } from 'lucide-react';
import HabitCard from './components/HabitCard';
import { HabitIcon } from './components/HabitIcon';
import InstallPrompt from './components/InstallPrompt';
import ProgressBar from './components/ProgressBar';
import AddHabitModal from './components/AddHabitModal';
import ImagePreviewModal from './components/ImagePreviewModal';
import HistoryView from './components/HistoryView';
import {
  loadHabits, saveHabits,
  loadDailyData, saveDailyData,
  getTodayEntries, getStreakForHabit,
} from './utils/storage';
import { getTodayKey } from './utils/imageUtils';
import { savePhoto, loadTodayPhotos, pruneOldPhotos } from './utils/photoDb';

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function computeMissedIds(habits, todayEntries) {
  const now = new Date();
  return habits
    .filter(h => {
      if (todayEntries[h.id]?.completed) return false;
      if (!h.time) return false;
      const [hr, mn] = h.time.split(':').map(Number);
      const target = new Date();
      target.setHours(hr, mn, 0, 0);
      return now > target;
    })
    .map(h => h.id);
}

function sortHabits(habits, todayEntries) {
  return [...habits].sort((a, b) => {
    const aDone = todayEntries[a.id]?.completed ? 1 : 0;
    const bDone = todayEntries[b.id]?.completed ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return (a.time || '99:99').localeCompare(b.time || '99:99');
  });
}

export default function App() {
  const [habits, setHabits] = useState(() => loadHabits());
  const [dailyData, setDailyData] = useState(() => loadDailyData());
  const [todayPhotos, setTodayPhotos] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tick, setTick] = useState(0); // ticks every minute for auto-red check

  const todayKey = getTodayKey();

  useEffect(() => {
    const ids = loadHabits().map((h) => h.id);
    loadTodayPhotos(todayKey, ids).then(setTodayPhotos);
    pruneOldPhotos().catch(() => {});
  }, [todayKey]);

  useEffect(() => { saveHabits(habits); }, [habits]);
  useEffect(() => { saveDailyData(dailyData); }, [dailyData]);

  // Tick every minute → triggers missedIds recompute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Reload at midnight
  useEffect(() => {
    const key = getTodayKey();
    const id = setInterval(() => { if (getTodayKey() !== key) window.location.reload(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const todayEntries = getTodayEntries(dailyData);

  // Auto red tick: habits whose target time has passed with no proof
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const missedIds = useMemo(() => computeMissedIds(habits, todayEntries), [habits, todayEntries, tick]);

  const handleUpload = useCallback(async (habitId, base64) => {
    await savePhoto(todayKey, habitId, base64);
    setTodayPhotos((prev) => ({ ...prev, [habitId]: base64 }));
    setDailyData((prev) => ({
      ...prev,
      [todayKey]: {
        ...prev[todayKey],
        [habitId]: { completed: true, timestamp: Date.now() },
      },
    }));
  }, [todayKey]);

  // Correction: mark a past-day habit as completed
  const handleCorrection = useCallback((dateKey, habitId) => {
    setDailyData((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [habitId]: { completed: true, timestamp: Date.now(), corrected: true },
      },
    }));
  }, []);

  const handleDelete = useCallback((habitId) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  }, []);

  const handleAddHabit = useCallback(({ name, icon, time }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setHabits((prev) => [...prev, { id, name, icon, time }]);
  }, []);

  const sortedHabits = sortHabits(habits, todayEntries);
  const completedCount = habits.filter((h) => todayEntries[h.id]?.completed).length;
  const existingNames = habits.map((h) => h.name.toLowerCase());

  if (showHistory) {
    return (
      <HistoryView
        habits={habits}
        dailyData={dailyData}
        onClose={() => setShowHistory(false)}
        onCorrection={handleCorrection}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-md mx-auto px-4 pb-28">

        {/* Header */}
        <header className="pt-8 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={26} className="text-green-500" />
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">HabitSnap</h1>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <History size={16} className="text-gray-500" />
              History
            </button>
          </div>
          <p className="text-base text-gray-400 font-medium mt-1">{getTodayLabel()}</p>
        </header>

        {/* Progress */}
        <ProgressBar completed={completedCount} total={habits.length} />

        {/* Habit cards */}
        <div className="space-y-3">
          {sortedHabits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-5xl mb-3">🌱</p>
              <p className="text-gray-500 text-base">No habits yet. Tap + to add one!</p>
            </div>
          )}
          {sortedHabits.map((habit) => (
            <div key={habit.id} className="group">
              <HabitCard
                habit={habit}
                entry={todayEntries[habit.id] ?? null}
                streak={getStreakForHabit(habit.id, dailyData)}
                photo={todayPhotos[habit.id] ?? null}
                missed={missedIds.includes(habit.id)}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onThumbnailClick={(src) => setPreview({ src, habitName: habit.name })}
              />
            </div>
          ))}
        </div>

        {/* Streaks */}
        {habits.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Current Streaks</p>
            <div className="flex flex-wrap gap-2">
              {habits.map((h) => {
                const streak = getStreakForHabit(h.id, dailyData);
                return (
                  <div key={h.id} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                    <HabitIcon iconName={h.icon} habitId={h.id} size={14} />
                    <span className="text-sm text-gray-700 font-semibold">{h.name}</span>
                    <span className="text-sm text-orange-500 font-bold">🔥{streak}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-green-200 transition-all hover:scale-105 active:scale-95"
        title="Add habit"
      >
        <Plus size={30} />
      </button>

      {showAdd && (
        <AddHabitModal existingNames={existingNames} onAdd={handleAddHabit} onClose={() => setShowAdd(false)} />
      )}
      {preview && (
        <ImagePreviewModal src={preview.src} habitName={preview.habitName} onClose={() => setPreview(null)} />
      )}
      <InstallPrompt />
    </div>
  );
}
