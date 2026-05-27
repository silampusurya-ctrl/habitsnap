import { useRef, useState } from 'react';
import { Camera, Trash2, Flame, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { compressImage, ALLOWED_TYPES } from '../utils/imageUtils';
import { HabitIcon } from './HabitIcon';

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function HabitCard({ habit, entry, streak, photo, missed, onUpload, onDelete, onThumbnailClick }) {
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
      setError('Try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Card background
  const cardBg = completed
    ? 'bg-white border-green-200'
    : missed
    ? 'bg-red-50 border-red-200'
    : 'bg-white border-gray-100';

  return (
    <div className={`relative rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition-all duration-300 animate-fade-in ${cardBg}`}>
      <HabitIcon iconName={habit.icon} habitId={habit.id} size={24} />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base truncate ${completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {habit.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {habit.time && !completed && (
            <span className={`flex items-center gap-1 text-sm font-semibold ${missed ? 'text-red-400' : 'text-blue-500'}`}>
              <Clock size={13} /> {fmt12(habit.time)}
              {missed && <span className="text-xs">(missed)</span>}
            </span>
          )}
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-sm text-orange-500 font-semibold">
              <Flame size={13} /> {streak}d streak
            </span>
          )}
          {entry?.timestamp && (
            <span className="text-sm text-green-600 font-medium">
              ✓ {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {/* Thumbnail */}
      {photo && (
        <button onClick={() => onThumbnailClick(photo)} className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-green-200 hover:border-green-400 transition-colors">
          <img src={photo} alt="proof" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Proof button — shows for incomplete (pending OR missed) */}
      {!completed && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex-shrink-0 flex items-center gap-1.5 border text-sm font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 ${
            missed
              ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
              : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
          }`}
        >
          <Camera size={16} />
          {uploading ? '...' : 'Proof'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Status icon */}
      {completed ? (
        <CheckCircle2
          size={30}
          className={`flex-shrink-0 text-green-500 ${animated ? 'animate-bounce-in' : ''}`}
          strokeWidth={2.5}
        />
      ) : missed ? (
        <XCircle size={30} className="flex-shrink-0 text-red-400" strokeWidth={2.5} />
      ) : (
        <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-gray-300" />
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(habit.id)}
        className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all text-gray-300 hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
