import { useRef, useState, useEffect } from 'react';
import { Camera, ImageUp, Trash2, Flame, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import { compressImage, ALLOWED_TYPES } from '../utils/imageUtils';
import { HabitIcon } from './HabitIcon';

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Bottom sheet — Camera or Gallery choice
function ProofPicker({ missed, onCamera, onGallery, onClose }) {
  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-proof-picker]')) onClose();
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div
      data-proof-picker="1"
      className="absolute bottom-full right-0 mb-2 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[160px] animate-slide-up"
    >
      {/* Camera */}
      <button
        onClick={onCamera}
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-green-50 transition-colors text-left"
      >
        <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Camera size={16} className="text-green-600" />
        </div>
        <span className="text-sm font-bold text-gray-800">Camera</span>
      </button>

      {/* Gallery / File */}
      <button
        onClick={onGallery}
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors text-left"
      >
        <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ImageUp size={16} className="text-blue-600" />
        </div>
        <span className="text-sm font-bold text-gray-800">Gallery / File</span>
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <X size={14} className="text-gray-500" />
        </div>
        <span className="text-sm font-medium text-gray-500">Cancel</span>
      </button>
    </div>
  );
}

export default function HabitCard({ habit, entry, streak, photo, missed, onUpload, onDelete, onThumbnailClick }) {
  const cameraRef  = useRef(null); // capture="environment"
  const galleryRef = useRef(null); // no capture → gallery/files
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [animated,    setAnimated]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);

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

      {/* Proof thumbnail */}
      {photo && (
        <button
          onClick={() => onThumbnailClick(photo)}
          className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-green-200 hover:border-green-400 transition-colors"
        >
          <img src={photo} alt="proof" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Proof button + picker */}
      {!completed && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowPicker(p => !p)}
            disabled={uploading}
            className={`flex items-center gap-1.5 border text-sm font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 ${
              missed
                ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
            }`}
          >
            <Camera size={16} />
            {uploading ? '...' : 'Proof'}
          </button>

          {showPicker && (
            <ProofPicker
              missed={missed}
              onCamera={() => { setShowPicker(false); cameraRef.current?.click(); }}
              onGallery={() => { setShowPicker(false); galleryRef.current?.click(); }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      )}

      {/* Hidden file inputs */}
      {/* 1. Camera */}
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp"
        capture="environment" className="hidden" onChange={handleFileChange} />
      {/* 2. Gallery / screenshots */}
      <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handleFileChange} />

      {/* Status icon */}
      {completed ? (
        <CheckCircle2 size={30} className={`flex-shrink-0 text-green-500 ${animated ? 'animate-bounce-in' : ''}`} strokeWidth={2.5} />
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
