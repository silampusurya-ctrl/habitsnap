import { useState } from 'react';
import { ClipboardPlus, Save, X } from 'lucide-react';

export default function AddActionPlanModal({ editItem, onSave, onClose }) {
  const [title, setTitle] = useState(editItem?.title ?? '');
  const [notes, setNotes] = useState(editItem?.notes ?? '');
  const [deadlineDate, setDeadlineDate] = useState(editItem?.deadlineDate ?? '');
  const [deadlineTime, setDeadlineTime] = useState(editItem?.deadlineTime ?? '18:00');
  const [rewardPoints, setRewardPoints] = useState(editItem?.rewardPoints ?? 10);
  const [rewardLabel, setRewardLabel] = useState(editItem?.rewardLabel ?? '');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Please enter an action plan title.');
      return;
    }
    if (deadlineDate && !deadlineTime) {
      setError('Please choose a deadline time.');
      return;
    }
    onSave({
      ...editItem,
      title: title.trim(),
      notes: notes.trim(),
      deadlineDate,
      deadlineTime: deadlineDate ? deadlineTime : '',
      rewardPoints: Math.max(0, Number(rewardPoints) || 0),
      rewardLabel: rewardLabel.trim(),
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
            <h2 className="text-xl font-extrabold text-gray-900">{editItem ? 'Edit Action Plan' : 'New Action Plan'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Capture first. Decide the stage later.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">What do you plan to do?</label>
            <input
              autoFocus
              type="text"
              value={title}
              maxLength={100}
              onChange={event => { setTitle(event.target.value); setError(''); }}
              placeholder="e.g. Create a new wedding marketing offer"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              maxLength={2000}
              rows={8}
              onChange={event => setNotes(event.target.value)}
              placeholder="Write every thought, next step, reference, question or expected outcome here..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{notes.length}/2000</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Time Limit / Deadline</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={deadlineDate}
                onChange={event => { setDeadlineDate(event.target.value); setError(''); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="time"
                value={deadlineTime}
                disabled={!deadlineDate}
                onChange={event => { setDeadlineTime(event.target.value); setError(''); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Leave the date empty if this task has no deadline.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Completion Reward</label>
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <div>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={rewardPoints}
                  onChange={event => setRewardPoints(event.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-xs text-gray-400 mt-1 text-center">Points</p>
              </div>
              <input
                type="text"
                maxLength={80}
                value={rewardLabel}
                onChange={event => setRewardLabel(event.target.value)}
                placeholder="e.g. Coffee, movie, 30-minute break"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-sm text-amber-800 font-semibold">
            A deadline is optional. Rewards unlock only when the task is completed within its deadline.
          </div>

          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
            {editItem ? <Save size={19} /> : <ClipboardPlus size={20} />}
            {editItem ? 'Save Changes' : 'Save to Action Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}
