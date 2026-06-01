import { Home, CalendarDays, History } from 'lucide-react';

const TABS = [
  { key: 'today',    Icon: Home,         label: 'Today'    },
  { key: 'schedule', Icon: CalendarDays, label: 'Schedule' },
  { key: 'history',  Icon: History,      label: 'History'  },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg flex items-center justify-around"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
      {TABS.map(({ key, Icon, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex flex-col items-center gap-1 py-3 flex-1 transition-colors ${
              isActive ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={23} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-xs font-bold`}>{label}</span>
            {isActive && <span className="absolute bottom-0 w-8 h-0.5 bg-green-500 rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}
