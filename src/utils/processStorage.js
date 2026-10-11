const PROCESS_KEY = 'habitsnap_work_process_v1';

export const PROCESS_STAGES = [
  {
    id: 'thinking',
    label: 'Thinking',
    shortLabel: 'Think',
    description: 'Ideas, problems and opportunities',
    icon: 'Brain',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    id: 'learning',
    label: 'Learning',
    shortLabel: 'Learn',
    description: 'Research and learn what is needed',
    icon: 'BookOpen',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: 'creating',
    label: 'Creating',
    shortLabel: 'Create',
    description: 'Turn learning into an asset or offer',
    icon: 'Hammer',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    shortLabel: 'Market',
    description: 'Publish, sell and measure results',
    icon: 'Megaphone',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
];

export function loadProcessItems() {
  try {
    const stored = localStorage.getItem(PROCESS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveProcessItems(items) {
  localStorage.setItem(PROCESS_KEY, JSON.stringify(items));
}

export function getProcessStage(id) {
  return PROCESS_STAGES.find(stage => stage.id === id) ?? PROCESS_STAGES[0];
}
