import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function ImagePreviewModal({ src, habitName, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-800 text-sm">{habitName} — Proof</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <img
          src={src}
          alt={`Proof for ${habitName}`}
          className="w-full object-cover max-h-80"
        />
        <p className="text-center text-xs text-gray-400 py-2">Tap outside to close</p>
      </div>
    </div>
  );
}
