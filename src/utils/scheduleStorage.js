const ITEMS_KEY = 'habitsnap_schedule_v1';
const DATA_KEY  = 'habitsnap_sched_data_v1';

export const DEFAULT_SCHEDULE = [
  { id: 's1',  title: 'Morning Routine', startTime: '06:00', endTime: '07:00', icon: 'Sunrise'   },
  { id: 's2',  title: 'Exercise',        startTime: '07:00', endTime: '08:00', icon: 'Dumbbell'  },
  { id: 's3',  title: 'Breakfast',       startTime: '08:00', endTime: '08:45', icon: 'Coffee'    },
  { id: 's4',  title: 'Work / Study',    startTime: '09:00', endTime: '13:00', icon: 'BookOpen'  },
  { id: 's5',  title: 'Lunch Break',     startTime: '13:00', endTime: '14:00', icon: 'Utensils'  },
  { id: 's6',  title: 'Work / Study',    startTime: '14:00', endTime: '18:00', icon: 'Target'    },
  { id: 's7',  title: 'Evening Walk',    startTime: '18:00', endTime: '19:00', icon: 'Activity'  },
  { id: 's8',  title: 'Dinner',          startTime: '19:30', endTime: '20:30', icon: 'Utensils'  },
  { id: 's9',  title: 'Reading / Relax', startTime: '21:00', endTime: '22:00', icon: 'BookOpen'  },
  { id: 's10', title: 'Sleep',           startTime: '22:30', endTime: '23:59', icon: 'Moon'      },
];

export function loadScheduleItems() {
  try {
    const s = localStorage.getItem(ITEMS_KEY);
    return s ? JSON.parse(s) : DEFAULT_SCHEDULE;
  } catch { return DEFAULT_SCHEDULE; }
}
export function saveScheduleItems(items) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function loadScheduleData() {
  try {
    const s = localStorage.getItem(DATA_KEY);
    if (!s) return {};
    const parsed = JSON.parse(s);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const ck = cutoff.toISOString().split('T')[0];
    return Object.fromEntries(Object.entries(parsed).filter(([d]) => d >= ck));
  } catch { return {}; }
}
export function saveScheduleData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}
