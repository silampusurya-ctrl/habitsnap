import { useRef, useState } from 'react';
import { Camera, Trash2, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { compressImage, ALLOWED_TYPES } from '../utils/imageUtils';
import { HabitIcon } from './HabitIcon';

function StatusBadge({ completed, animated }) {
  if (completed) {
    return (
      <CheckCircle2
        size={28}
        className={`flex-shrink-0 text-green-500 ${animated ? 'animate-bounce-in' : ''}`}
        strokeWidth={2.5}
      />
    );
  }
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-gray-300" />
  );
}

export default function HabitCard({ habit, entry, streak, photo, onUpload, onDelete, onThumbnailClick }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [animated, setAnimated] = useState(false);

  const completed = !!entry?.completed;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('JPG, PNG or WebP only.');
      e.target.value = '';
      return;
    }
    setError('');
    setUploading(true);
    try {
      const base64 = await compressImage(file);
      setAnimated(true);
      onUpload(habit.id, base64);
      setTimeout(() => setAnimated(false), 600);
    } catch {
      setError('Could not process image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className={`relative rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition-all duration-300 animate-fade-in ${
        completed ? 'bg-white border-green-200' : 'bg-white border-gray-100'
      }`}
    >
      <HabitIcon iconName={habit.icon} habitId={habit.id} />

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
          {habit.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">
              <Flame size={11} /> {streak}d streak
            </span>
          )}
          {entry?.timestamp && (
            <span className="text-xs text-gray-400">
              {streak > 0 ? '·' : ''} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {/* Proof thumbnail */}
      {photo && (
        <button
          onClick={() => onThumbnailClick(photo)}
          className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden border-2 border-green-200 hover:border-green-400 transition-colors"
          title="View proof"
        >
          <img src={photo} alt="proof" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Upload button */}
      {!completed && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 flex items-center gap-1.5 bg-green-50 hover:bg-green-100 active:bg-green-200 border border-green-200 text-green-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <Camera size={14} />
          {uploading ? '...' : 'Proof'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <StatusBadge completed={completed} animated={animated} />

      {/* Delete on hover */}
      <button
        onClick={() => onDelete(habit.id)}
        className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all text-gray-300 hover:text-red-400"
        title="Delete habit"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
