import { useState } from 'react';
import { X, Plus, Clock } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ICON_OPTIONS, HabitIcon, getIconColor } from './HabitIcon';

const PREVIEW_ID = 'preview_habit';

export default function AddHabitModal({ existingNames, onAdd, onClose, editHabit }) {
  const [name, setName] = useState(editHabit?.name || '');
  const [icon, setIcon] = useState(editHabit?.icon || 'Target');
  const [time, setTime] = useState(editHabit?.time || '');
  const [error, setError] = useState('');

  const isEdit = !!editHabit;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Habit name enter பண்ணுங்க.'); return; }
    if (!isEdit && existingNames.includes(trimmed.toLowerCase())) {
      setError('இந்த பெயரில் habit already இருக்கு.');
      return;
    }
    onAdd({ name: trimmed, icon, time });
    onClose();
  };

  function fmt12(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Habit Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Journaling"
              maxLength={40}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          {/* Target Time */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">
              Target Time <span className="text-sm font-normal text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
            </div>
            {time && (
              <p className="text-sm text-green-600 font-medium mt-1 ml-1">⏰ {fmt12(time)} க்கு reminder</p>
            )}
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Icon தேர்வு</label>
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
                      <LucideIcon size={22} style={{ color: selected ? '#16a34a' : color }} strokeWidth={2} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <HabitIcon iconName={icon} habitId={PREVIEW_ID} size={22} />
            <div>
              <p className="text-base font-semibold text-gray-800">{name || 'Habit name'}</p>
              <p className="text-sm text-gray-400">{time ? fmt12(time) : 'No time set'}</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-base font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={20} /> {isEdit ? 'Save Changes' : 'Add Habit'}
          </button>
        </form>
      </div>
    </div>
  );
}
