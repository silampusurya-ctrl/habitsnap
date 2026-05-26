import { getTodayKey } from './imageUtils';

const HABITS_KEY = 'habitsnap_habits_v2';
const DATA_KEY = 'habitsnap_daily_data_v2';

// Emoji → Lucide icon name migration map
const EMOJI_MAP = {
  '🌅': 'Sunrise', '💪': 'Dumbbell', '💧': 'Droplets',
  '📚': 'BookOpen', '🧘': 'Brain', '🎯': 'Target',
  '🏃': 'Activity', '🥗': 'Utensils', '😴': 'Moon',
  '✍️': 'Pencil', '🎵': 'Music', '🧹': 'Home',
  '🌿': 'Leaf', '☕': 'Coffee', '🚴': 'Bike',
  '🤸': 'Activity', '📝': 'Pencil', '🛁': 'Sparkles',
  '🍎': 'Apple', '💊': 'Shield', '🌱': 'Leaf',
};

function migrateIcon(icon) {
  return EMOJI_MAP[icon] ?? icon;
}

export const DEFAULT_HABITS = [
  { id: '1', name: 'Wake up early', icon: 'Sunrise',  time: '06:00' },
  { id: '2', name: 'Exercise',      icon: 'Dumbbell', time: '07:00' },
  { id: '3', name: 'Drink water',   icon: 'Droplets', time: '08:00' },
  { id: '4', name: 'Read',          icon: 'BookOpen', time: '21:00' },
  { id: '5', name: 'Meditate',      icon: 'Brain',    time: '07:30' },
];

export function loadHabits() {
  try {
    // Try v2 key first
    let stored = localStorage.getItem(HABITS_KEY);
    if (stored) return JSON.parse(stored).map(h => ({ ...h, icon: migrateIcon(h.icon) }));
    // Fall back to v1 key with migration
    stored = localStorage.getItem('habitsnap_habits');
    if (stored) {
      const migrated = JSON.parse(stored).map(h => ({ ...h, icon: migrateIcon(h.icon) }));
      localStorage.setItem(HABITS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return DEFAULT_HABITS;
  } catch {
    return DEFAULT_HABITS;
  }
}

export function saveHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export function loadDailyData() {
  try {
    const stored = localStorage.getItem(DATA_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffKey = cutoff.toISOString().split('T')[0];
    return Object.fromEntries(Object.entries(parsed).filter(([d]) => d >= cutoffKey));
  } catch {
    return {};
  }
}

export function saveDailyData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function getTodayEntries(dailyData) {
  return dailyData[getTodayKey()] ?? {};
}

export function getStreakForHabit(habitId, dailyData) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (dailyData[key]?.[habitId]?.completed) {
      streak++;
    } else if (i === 0) {
      continue; // today not done yet — keep checking yesterday
    } else {
      break;
    }
  }
  return streak;
}
