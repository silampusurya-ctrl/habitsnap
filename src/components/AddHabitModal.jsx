import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ICON_OPTIONS, HabitIcon, getIconColor } from './HabitIcon';

const PREVIEW_ID = 'preview_habit';

export default function AddHabitModal({ existingNames, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Target');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a habit name.'); return; }
    if (existingNames.includes(trimmed.toLowerCase())) {
      setError('A habit with this name already exists.');
      return;
    }
    onAdd({ name: trimmed, icon });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">New Habit</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Habit Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Journaling"
              maxLength={40}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Icon</label>
            <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {ICON_OPTIONS.map((iconName) => {
                const LucideIcon = Icons[iconName];
                const selected = icon === iconName;
                const { color } = getIconColor(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${
                      selected
                        ? 'bg-green-100 ring-2 ring-green-400 scale-105'
                        : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                    }`}
                    title={iconName}
                  >
                    {LucideIcon && (
                      <LucideIcon
                        size={20}
                        style={{ color: selected ? '#16a34a' : color }}
                        strokeWidth={2}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <HabitIcon iconName={icon} habitId={PREVIEW_ID} size={20} />
            <div>
              <p className="text-sm font-semibold text-gray-800">{name || 'Habit name'}</p>
              <p className="text-xs text-gray-400">{icon}</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} /> Add Habit
          </button>
        </form>
      </div>
    </div>
  );
}
