import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, Edit2, Clock, Zap, Plus } from 'lucide-react';
import { HabitIcon } from './HabitIcon';
import AddScheduleModal from './AddScheduleModal';
import { getScheduleCategory } from '../utils/scheduleCategories';

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

function getDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getProgress(start, end) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (nowMins < startMins || nowMins > endMins) return 0;
  return Math.round(((nowMins - startMins) / (endMins - startMins)) * 100);
}

export default function ScheduleView({ scheduleItems, todayData, onToggle, onAdd, onEdit, onDelete }) {
  const [now, setNow] = useState(nowTimeStr);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Refresh every minute
  useEffect(() => {
    const id = setInterval(() => setNow(nowTimeStr()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...scheduleItems].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedCount = sorted.filter(i => todayData?.[i.id]?.completed).length;

  // Find where to insert the NOW line
  let nowIdx = sorted.findIndex(item => item.startTime > now);
  if (nowIdx === -1) nowIdx = sorted.length;

  const handleAdd = (data) => {
    if (editItem) {
      onEdit({ ...editItem, ...data });
      setEditItem(null);
    } else {
      onAdd(data);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-32">

      {/* Header */}
      <header className="pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Schedule</h1>
            <p className="text-base text-gray-400 font-medium mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-gray-400">{completedCount}/{sorted.length} done</p>
          </div>
        </div>

        {/* Progress bar */}
        {sorted.length > 0 && (
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700"
              style={{ width: `${Math.round((completedCount / sorted.length) * 100)}%` }}
            />
          </div>
        )}
      </header>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-16">
          <Clock size={52} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-base">No schedule yet.</p>
          <p className="text-gray-400 text-sm mt-1">Tap + to add your first time block!</p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2.5">
        {sorted.map((item, idx) => {
          const category = getScheduleCategory(item.category);
          const entry = todayData?.[item.id];
          const completed = !!entry?.completed;
          const isCurrent = item.startTime <= now && item.endTime > now;
          const isPast = item.endTime <= now && !completed;
          const progress = isCurrent ? getProgress(item.startTime, item.endTime) : 0;
          const duration = getDuration(item.startTime, item.endTime);

          // Insert NOW line before this item
          const showNow = idx === nowIdx;

          return (
            <div key={item.id}>
              {/* NOW divider */}
              {showNow && (
                <div className="flex items-center gap-2 my-3 animate-fade-in">
                  <div className="flex-1 h-0.5 bg-red-400" />
                  <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <Zap size={11} /> NOW
                  </span>
                  <div className="flex-1 h-0.5 bg-red-400" />
                </div>
              )}

              {/* Schedule block */}
              <div className={`relative rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                completed ? 'bg-white border-green-200' :
                isCurrent ? 'bg-blue-50 border-blue-300 shadow-md' :
                isPast    ? 'bg-gray-50 border-gray-200 opacity-70' :
                            'bg-white border-gray-100'
              }`}>
                {/* Current block progress bar */}
                {isCurrent && progress > 0 && (
                  <div className="absolute top-0 left-0 h-1 bg-blue-400 rounded-tl-2xl transition-all duration-1000"
                       style={{ width: `${progress}%` }} />
                )}

                <div className="p-4 flex items-center gap-3">
                  <HabitIcon iconName={item.icon} habitId={item.id} size={22} />

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base truncate ${completed ? 'line-through text-gray-400' : isCurrent ? 'text-blue-800' : 'text-gray-800'}`}>
                      {item.title}
                      {isCurrent && <span className="ml-2 text-xs font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">In progress</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-500 font-medium">
                        {fmt12(item.startTime)} – {fmt12(item.endTime)}
                      </span>
                      {duration && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{duration}</span>
                      )}
                    </div>
                    {category && (
                      <span
                        className="inline-flex text-xs font-bold px-2 py-0.5 rounded-full mt-1.5"
                        style={{ color: category.color, background: category.bg }}
                      >
                        {category.label}
                      </span>
                    )}
                    {completed && entry?.timestamp && (
                      <p className="text-sm text-green-600 font-medium mt-0.5">
                        ✓ Done at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {isCurrent && progress > 0 && (
                      <p className="text-xs text-blue-500 font-medium mt-0.5">{progress}% through</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditItem(item); setShowAdd(true); }}
                      className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors opacity-40 hover:opacity-100">
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-xl hover:bg-red-50 transition-colors opacity-40 hover:opacity-100">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                    {/* Toggle done */}
                    <button onClick={() => onToggle(item.id)}
                      className="p-1 transition-all hover:scale-110 active:scale-95">
                      {completed
                        ? <CheckCircle2 size={30} className="text-green-500" strokeWidth={2.5} />
                        : <Circle size={30} className={isCurrent ? 'text-blue-300' : 'text-gray-300'} strokeWidth={1.8} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* NOW at end if all items are past */}
        {nowIdx === sorted.length && sorted.length > 0 && (
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-0.5 bg-red-400" />
            <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Zap size={11} /> NOW
            </span>
            <div className="flex-1 h-0.5 bg-red-400" />
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditItem(null); setShowAdd(true); }}
        className="fixed bottom-20 right-5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-200 transition-all hover:scale-105 active:scale-95 z-20"
      >
        <Plus size={28} />
      </button>

      {/* Add / Edit modal */}
      {showAdd && (
        <AddScheduleModal
          editItem={editItem}
          onAdd={handleAdd}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
