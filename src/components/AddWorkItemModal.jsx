import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { PROCESS_STAGES } from '../utils/processStorage';

export default function AddWorkItemModal({ initialStage = 'thinking', initialDate, editItem, existingItems = [], onSave, onClose }) {
  const [title, setTitle] = useState(editItem?.title ?? '');
  const [notes, setNotes] = useState(editItem?.notes ?? '');
  const [stage, setStage] = useState(editItem?.stage ?? initialStage);
  const [workDate, setWorkDate] = useState(editItem?.workDate ?? initialDate);
  const [startTime, setStartTime] = useState(editItem?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(editItem?.endTime ?? '10:00');
  const [scheduleEnabled, setScheduleEnabled] = useState(
    editItem ? Boolean(editItem.startTime && editItem.endTime) : true,
  );
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Work title enter பண்ணுங்க.');
      return;
    }
    if (scheduleEnabled && (!startTime || !endTime || startTime >= endTime)) {
      setError('End time, start time-ஐ விட அதிகமா இருக்கணும்.');
      return;
    }

    const overlapping = scheduleEnabled && existingItems.some(item => (
      item.id !== editItem?.id
      && item.workDate === workDate
      && item.startTime
      && item.endTime
      && startTime < item.endTime
      && endTime > item.startTime
    ));
    if (overlapping) {
      setError('இந்த நேரத்தில் இன்னொரு Process work இருக்கு. வேறு time தேர்வு பண்ணுங்க.');
      return;
    }

    onSave({
      ...editItem,
      title: title.trim(),
      notes: notes.trim(),
      stage,
      workDate,
      startTime: scheduleEnabled ? startTime : '',
      endTime: scheduleEnabled ? endTime : '',
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">{editItem ? 'Edit Work' : 'Add Daily Work'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Move one useful idea towards the market.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">What are you working on?</label>
            <input
              autoFocus
              type="text"
              value={title}
              maxLength={80}
              onChange={event => { setTitle(event.target.value); setError(''); }}
              placeholder="e.g. Wedding lead generation offer"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              maxLength={1000}
              rows={5}
              onChange={event => setNotes(event.target.value)}
              placeholder="Write the idea, what you learned, next action, links or result..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{notes.length}/1000</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Current Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {PROCESS_STAGES.map(option => {
                const StageIcon = Icons[option.icon];
                const selected = stage === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStage(option.id)}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all"
                    style={{
                      color: selected ? option.color : '#6b7280',
                      background: selected ? option.bg : '#fff',
                      borderColor: selected ? option.color : '#e5e7eb',
                      boxShadow: selected ? `0 0 0 1px ${option.color}` : 'none',
                    }}
                  >
                    <StageIcon size={17} /> {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Work Date</label>
            <input
              type="date"
              value={workDate}
              onChange={event => setWorkDate(event.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-bold text-gray-700">Add timing to Daily Schedule</p>
              <p className="text-xs text-gray-400 mt-0.5">Timing இல்லாமலும் stage-ல் save செய்யலாம்.</p>
            </div>
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={event => { setScheduleEnabled(event.target.checked); setError(''); }}
              className="w-5 h-5 accent-green-500"
            />
          </label>

          {scheduleEnabled && <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={event => { setStartTime(event.target.value); setError(''); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={event => { setEndTime(event.target.value); setError(''); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>}

          {scheduleEnabled && <div className="rounded-xl bg-green-50 border border-green-100 px-3.5 py-3 text-sm text-green-700 font-semibold">
            இந்த timing Daily Schedule-ல் தானாக சேர்க்கப்படும்.
          </div>}

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {editItem ? <Save size={19} /> : <Plus size={20} />}
            {editItem ? 'Save Changes' : 'Add to Process'}
          </button>
        </form>
      </div>
    </div>
  );
}
