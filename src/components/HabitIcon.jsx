import * as Icons from 'lucide-react';

const PALETTE = [
  { bg: '#fff3e0', color: '#e65100' },
  { bg: '#e3f2fd', color: '#1565c0' },
  { bg: '#e0f2f1', color: '#00695c' },
  { bg: '#f3e5f5', color: '#6a1b9a' },
  { bg: '#e8f5e9', color: '#2e7d32' },
  { bg: '#fce4ec', color: '#880e4f' },
  { bg: '#fff9c4', color: '#e65100' },
  { bg: '#e0f7fa', color: '#00838f' },
  { bg: '#ede7f6', color: '#4527a0' },
  { bg: '#fbe9e7', color: '#bf360c' },
];

function hashId(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function getIconColor(habitId) {
  return PALETTE[hashId(habitId) % PALETTE.length];
}

export function HabitIcon({ iconName, habitId, size = 22 }) {
  const { bg, color } = getIconColor(habitId);
  const LucideIcon = Icons[iconName];
  return (
    <div
      className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{ backgroundColor: bg }}
    >
      {LucideIcon
        ? <LucideIcon size={size} style={{ color }} strokeWidth={2.2} />
        : <span className="text-2xl leading-none">{iconName}</span>
      }
    </div>
  );
}

export const ICON_OPTIONS = [
  'Sunrise', 'Dumbbell', 'Droplets', 'BookOpen', 'Brain',
  'Activity', 'Moon', 'Pencil', 'Music', 'Apple',
  'Home', 'Leaf', 'Coffee', 'Bike', 'Sparkles',
  'Star', 'Heart', 'Target', 'Flame', 'Zap',
  'Trophy', 'Shield', 'Clock', 'Wind', 'Smile',
  'Utensils', 'Footprints', 'Sunset', 'Eye', 'Stethoscope',
];
