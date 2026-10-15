import { useState } from 'react';
import { ClipboardPlus, Save, X } from 'lucide-react';

export default function AddActionPlanModal({ editItem, onSave, onClose }) {
  const [title, setTitle] = useState(editItem?.title ?? '');
  const [notes, setNotes] = useState(editItem?.notes ?? '');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Action plan title enter பண்ணுங்க.');
      return;
    }
    onSave({ ...editItem, title: title.trim(), notes: notes.trim() });
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

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3 text-sm text-amber-800 font-semibold">
            Date அல்லது time இப்போது தேவையில்லை. பின்னர் சரியான stage-க்கு move செய்யலாம்.
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
