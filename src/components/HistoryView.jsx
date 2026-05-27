import { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Camera, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { HabitIcon } from './HabitIcon';
import { getPhoto, savePhoto } from '../utils/photoDb';
import { compressImage, ALLOWED_TYPES } from '../utils/imageUtils';

function getPastDays(n = 30) {
  const days = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: d.toISOString().split('T')[0], date: d });
  }
  return days;
}

function formatDay(date, index) {
  if (index === 0) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function HistoryView({ habits, dailyData, onClose, onCorrection }) {
  const [expanded, setExpanded] = useState(null);
  const [photosCache, setPhotosCache] = useState({});
  const [uploading, setUploading] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  const days = getPastDays(30);

  async function handleExpand(key) {
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    if (photosCache[key]) return;
    const result = {};
    await Promise.all(habits.map(async (h) => {
      const p = await getPhoto(key, h.id);
      if (p) result[h.id] = p;
    }));
    setPhotosCache(prev => ({ ...prev, [key]: result }));
  }

  async function handleCorrectionUpload(dateKey, habitId, file) {
    if (!ALLOWED_TYPES.includes(file.type)) return;
    const upKey = `${dateKey}_${habitId}`;
    setUploading(upKey);
    try {
      const base64 = await compressImage(file);
      await savePhoto(dateKey, habitId, base64);
      setPhotosCache(prev => ({
        ...prev,
        [dateKey]: { ...(prev[dateKey] || {}), [habitId]: base64 },
      }));
      onCorrection(dateKey, habitId);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-br from-green-50 via-white to-emerald-50 overflow-y-auto">
      <div className="max-w-md mx-auto px-4 pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 pt-8 pb-5 sticky top-0 bg-gradient-to-b from-green-50 to-transparent z-10">
          <button onClick={onClose} className="p-2.5 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">History</h1>
            <p className="text-sm text-gray-400">Last 30 days</p>
          </div>
        </div>

        {/* Days list */}
        {days.map(({ key, date }, idx) => {
          const dayEntries = dailyData[key] || {};
          const completedCount = habits.filter(h => dayEntries[h.id]?.completed).length;
          const total = habits.length;
          const isExpanded = expanded === key;
          const allDone = completedCount === total && total > 0;
          const noneDone = completedCount === 0;

          return (
            <div key={key} className="mb-3">
              {/* Day row */}
              <button
                onClick={() => handleExpand(key)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 text-left active:scale-98 transition-all"
              >
                {/* Score badge */}
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                  allDone ? 'bg-green-100' : noneDone ? 'bg-gray-100' : 'bg-orange-100'
                }`}>
                  <span className={`text-base font-extrabold ${allDone ? 'text-green-600' : noneDone ? 'text-gray-400' : 'text-orange-600'}`}>
                    {completedCount}/{total}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-800">{formatDay(date, idx)}</p>
                  <p className="text-sm text-gray-400">{key}</p>
                </div>

                {/* Mini status dots */}
                <div className="flex gap-0.5 mr-1">
                  {habits.slice(0, 6).map(h => (
                    <div key={h.id} className={`w-2.5 h-2.5 rounded-full ${dayEntries[h.id]?.completed ? 'bg-green-400' : 'bg-red-300'}`} />
                  ))}
                </div>

                {isExpanded
                  ? <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                  : <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />}
              </button>

              {/* Expanded habits */}
              {isExpanded && (
                <div className="mt-1.5 space-y-1.5 animate-fade-in pl-1 pr-1">
                  {habits.map(h => {
                    const entry = dayEntries[h.id];
                    const completed = !!entry?.completed;
                    const photo = photosCache[key]?.[h.id];
                    const upKey = `${key}_${h.id}`;
                    const isUp = uploading === upKey;

                    return (
                      <div
                        key={h.id}
                        className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
                          completed ? 'bg-white border-green-100' : 'bg-red-50 border-red-100'
                        }`}
                      >
                        <HabitIcon iconName={h.icon} habitId={h.id} size={18} />

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base text-gray-800 truncate">{h.name}</p>
                          {completed && entry?.timestamp && (
                            <p className="text-sm text-green-600 font-medium">
                              {entry.corrected ? '📝 Corrected · ' : ''}
                              ✓ {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {!completed && (
                            <p className="text-sm text-red-400 font-medium">Not completed</p>
                          )}
                        </div>

                        {/* Proof thumbnail */}
                        {photo && (
                          <button onClick={() => setPreviewSrc(photo)} className="flex-shrink-0">
                            <img src={photo} alt="proof" className="w-11 h-11 rounded-xl object-cover border-2 border-green-200" />
                          </button>
                        )}

                        {/* Status / correction */}
                        {completed ? (
                          <CheckCircle2 size={28} className="text-green-500 flex-shrink-0" strokeWidth={2.5} />
                        ) : (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <XCircle size={26} className="text-red-400" strokeWidth={2.5} />
                            <label className={`flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors ${isUp ? 'opacity-50' : ''}`}>
                              <Camera size={14} />
                              {isUp ? '...' : 'Fix'}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                capture="environment"
                                className="hidden"
                                disabled={isUp}
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (f) await handleCorrectionUpload(key, h.id, f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {days.length === 0 && (
          <div className="text-center py-16">
            <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-base">No history yet. Come back tomorrow!</p>
          </div>
        )}
      </div>

      {/* Photo preview */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setPreviewSrc(null)}>
          <img src={previewSrc} alt="proof" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
