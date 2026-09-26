export const SCHEDULE_CATEGORIES = [
  { id: 'thinking', label: 'Thinking', icon: 'Brain', color: '#7c3aed', bg: '#f3e8ff' },
  { id: 'learning', label: 'Learning', icon: 'BookOpen', color: '#2563eb', bg: '#dbeafe' },
  { id: 'action', label: 'Action', icon: 'Zap', color: '#ea580c', bg: '#ffedd5' },
  { id: 'result', label: 'Result / Money', icon: 'IndianRupee', color: '#16a34a', bg: '#dcfce7' },
];

export function getScheduleCategory(id) {
  return SCHEDULE_CATEGORIES.find(category => category.id === id);
}
