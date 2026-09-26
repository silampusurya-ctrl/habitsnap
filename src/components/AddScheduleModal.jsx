import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ICON_OPTIONS, HabitIcon, getIconColor } from './HabitIcon';
import { SCHEDULE_CATEGORIES, getScheduleCategory } from '../utils/scheduleCategories';

export default function AddScheduleModal({ onAdd, onClose, editItem }) {
  const [title,     setTitle]     = useState(editItem?.title     || '');
  const [startTime, setStartTime] = useState(editItem?.startTime || '09:00');
  const [endTime,   setEndTime]   = useState(editItem?.endTime   || '10:00');
  const [icon,      setIcon]      = useState(editItem?.icon      || 'Clock');
  const [category,  setCategory]  = useState(editItem?.category  || 'thinking');
  const [error,     setError]     = useState('');

  const previewId = editItem?.id || 'preview_sched';

  function fmt12(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title enter பண்ணுங்க.'); return; }
    if (startTime >= endTime) { setError('End time, start time-ஐ விட அதிகமா இருக்கணும்.'); return; }
    onAdd({ title: title.trim(), startTime, endTime, icon, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up"
           onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{editItem ? 'Edit Block' : 'New Schedule Block'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-1.5">Task / Activity</label>
            <input
              autoFocus type="text" value={title} maxLength={40}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Team Meeting"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          {/* Work mode */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Work Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {SCHEDULE_CATEGORIES.map(option => {
                const CategoryIcon = Icons[option.icon];
                const selected = category === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCategory(option.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left font-semibold transition-all ${
                      selected ? 'ring-2 ring-offset-1' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={selected ? { background: option.bg, color: option.color, borderColor: option.color, '--tw-ring-color': option.color } : {}}
                  >
                    <CategoryIcon size={18} />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Idea → learn → execute → measurable money result.</p>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-1.5">Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-1.5">End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">Icon தேர்வு</label>
            <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {ICON_OPTIONS.map(name => {
                const LI = Icons[name];
                const sel = icon === name;
                const { color } = getIconColor(name);
                return (
                  <button key={name} type="button" onClick={() => setIcon(name)}
                    className={`flex items-center justify-center p-2 rounded-xl transition-all ${
                      sel ? 'bg-green-100 ring-2 ring-green-400 scale-105' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                    }`}>
                    {LI && <LI size={22} style={{ color: sel ? '#16a34a' : color }} strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <HabitIcon iconName={icon} habitId={previewId} size={20} />
            <div>
              <p className="text-base font-bold text-gray-800">{title || 'Activity name'}</p>
              <p className="text-sm text-gray-400">{fmt12(startTime)} – {fmt12(endTime)}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: getScheduleCategory(category)?.color }}>
                {getScheduleCategory(category)?.label}
              </p>
            </div>
          </div>

          <button type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white text-base font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Plus size={20} /> {editItem ? 'Save Changes' : 'Add to Schedule'}
          </button>
        </form>
      </div>
    </div>
  );
}
