import { useState, useEffect, useCallback } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import HabitCard from './components/HabitCard';
import { HabitIcon } from './components/HabitIcon';
import InstallPrompt from './components/InstallPrompt';
import ProgressBar from './components/ProgressBar';
import AddHabitModal from './components/AddHabitModal';
import ImagePreviewModal from './components/ImagePreviewModal';
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

export default function App() {
  const [habits, setHabits] = useState(() => loadHabits());
  const [dailyData, setDailyData] = useState(() => loadDailyData());
  const [todayPhotos, setTodayPhotos] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [preview, setPreview] = useState(null);

  const todayKey = getTodayKey();

  // Load today's photos from IndexedDB on mount + prune old ones
  useEffect(() => {
    const ids = loadHabits().map((h) => h.id);
    loadTodayPhotos(todayKey, ids).then(setTodayPhotos);
    pruneOldPhotos().catch(() => {});
  }, [todayKey]);

  useEffect(() => { saveHabits(habits); }, [habits]);
  useEffect(() => { saveDailyData(dailyData); }, [dailyData]);

  // Reload at midnight
  useEffect(() => {
    const key = getTodayKey();
    const id = setInterval(() => { if (getTodayKey() !== key) window.location.reload(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const todayEntries = getTodayEntries(dailyData);

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

  const handleDelete = useCallback((habitId) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  }, []);

  const handleAddHabit = useCallback(({ name, icon }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setHabits((prev) => [...prev, { id, name, icon }]);
  }, []);

  const sortedHabits = [...habits].sort((a, b) => {
    return (todayEntries[a.id]?.completed ? 1 : 0) - (todayEntries[b.id]?.completed ? 1 : 0);
  });

  const completedCount = habits.filter((h) => todayEntries[h.id]?.completed).length;
  const existingNames = habits.map((h) => h.name.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-md mx-auto px-4 pb-28">

        {/* Header */}
        <header className="pt-8 pb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={22} className="text-green-500" />
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">HabitSnap</h1>
            <Sparkles size={22} className="text-green-500" />
          </div>
          <p className="text-sm text-gray-400">{getTodayLabel()}</p>
        </header>

        {/* Progress */}
        <ProgressBar completed={completedCount} total={habits.length} />

        {/* Habit cards */}
        <div className="space-y-3">
          {sortedHabits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🌱</p>
              <p className="text-gray-500 text-sm">No habits yet. Tap + to add one!</p>
            </div>
          )}
          {sortedHabits.map((habit) => (
            <div key={habit.id} className="group">
              <HabitCard
                habit={habit}
                entry={todayEntries[habit.id] ?? null}
                streak={getStreakForHabit(habit.id, dailyData)}
                photo={todayPhotos[habit.id] ?? null}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onThumbnailClick={(src) => setPreview({ src, habitName: habit.name })}
              />
            </div>
          ))}
        </div>

        {/* Streaks strip */}
        {habits.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Streaks</p>
            <div className="flex flex-wrap gap-2">
              {habits.map((h) => {
                const streak = getStreakForHabit(h.id, dailyData);
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2"
                  >
                    <HabitIcon iconName={h.icon} habitId={h.id} size={14} />
                    <span className="text-xs text-gray-700 font-medium">{h.name}</span>
                    <span className="text-xs text-orange-500 font-bold">🔥{streak}d</span>
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
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-200 transition-all hover:scale-105 active:scale-95"
        title="Add habit"
      >
        <Plus size={26} />
      </button>

      {showAdd && (
        <AddHabitModal
          existingNames={existingNames}
          onAdd={handleAddHabit}
          onClose={() => setShowAdd(false)}
        />
      )}
      {preview && (
        <ImagePreviewModal
          src={preview.src}
          habitName={preview.habitName}
          onClose={() => setPreview(null)}
        />
      )}

      <InstallPrompt />
    </div>
  );
}
