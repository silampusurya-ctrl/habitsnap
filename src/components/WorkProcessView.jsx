import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlarmClock,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  Circle,
  Clock3,
  ClipboardList,
  Columns3,
  ChevronLeft,
  ChevronRight,
  Edit2,
  FileText,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import AddWorkItemModal from './AddWorkItemModal';
import AddActionPlanModal from './AddActionPlanModal';
import ImagePreviewModal from './ImagePreviewModal';
import { PROCESS_STAGES } from '../utils/processStorage';
import { ALLOWED_TYPES, compressImage } from '../utils/imageUtils';
import { getPhoto, savePhoto } from '../utils/photoDb';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function formatDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function getDeadline(item) {
  if (!item.deadlineDate || !item.deadlineTime) return null;
  const timestamp = new Date(`${item.deadlineDate}T${item.deadlineTime}:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatDeadline(item) {
  const deadline = getDeadline(item);
  if (!deadline) return '';
  return new Date(deadline).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatRemaining(milliseconds) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function ProcessProof({ item, onPreview }) {
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const photoDate = item.workDate || 'process';
  const photoId = `process_${item.id}`;

  useEffect(() => {
    let active = true;
    getPhoto(photoDate, photoId)
      .then(savedPhoto => { if (active) setPhoto(savedPhoto); })
      .catch(() => {});
    return () => { active = false; };
  }, [photoDate, photoId]);

  async function handleProof(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('JPG, PNG or WebP only.');
      event.target.value = '';
      return;
    }

    setUploading(true);
    setError('');
    try {
      const compressed = await compressImage(file);
      await savePhoto(photoDate, photoId, compressed);
      setPhoto(compressed);
    } catch {
      setError('Could not save proof. Try again.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs font-extrabold text-blue-700 hover:bg-blue-100">
          <Camera size={15} /> {uploading ? 'Saving...' : photo ? 'Update Proof' : 'Proof'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProof} disabled={uploading} />
        </label>
        {photo && (
          <button type="button" onClick={() => onPreview(photo, item.title)} className="w-9 h-9 rounded-lg overflow-hidden border-2 border-blue-200">
            <img src={photo} alt={`${item.title} proof`} className="w-full h-full object-cover" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-semibold mt-1">{error}</p>}
    </div>
  );
}

export default function WorkProcessView({ items, onAdd, onEdit, onDelete }) {
  const [view, setView] = useState('plan');
  const [selectedDate, setSelectedDate] = useState(localDateKey);
  const [modal, setModal] = useState(null);
  const [planModal, setPlanModal] = useState(null);
  const [preview, setPreview] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now);
  const [notificationPermission, setNotificationPermission] = useState(
    () => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  const dailyItems = useMemo(
    () => items.filter(item => item.workDate === selectedDate),
    [items, selectedDate],
  );

  const stageCounts = PROCESS_STAGES.map(stage => dailyItems.filter(item => item.stage === stage.id).length);
  const total = dailyItems.length;
  const marketCount = stageCounts[stageCounts.length - 1];
  const planItems = items.filter(item => item.stage === 'plan');
  const earnedPoints = items.reduce(
    (sum, item) => sum + (item.rewardEarned ? Number(item.rewardPoints) || 0 : 0),
    0,
  );

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    const notified = JSON.parse(localStorage.getItem('habitsnap_deadline_notifications_v1') || '{}');
    let changed = false;
    items.forEach(item => {
      const deadline = getDeadline(item);
      if (!item.completed && deadline && deadline < nowMs && !notified[item.id]) {
        new Notification('EMERGENCY: Task overdue', {
          body: `${item.title} passed its deadline. Take action now.`,
          icon: '/icon-192.png',
        });
        notified[item.id] = true;
        changed = true;
      }
    });
    if (changed) localStorage.setItem('habitsnap_deadline_notifications_v1', JSON.stringify(notified));
  }, [items, notificationPermission, nowMs]);

  function moveItem(item, direction) {
    const currentIndex = PROCESS_STAGES.findIndex(stage => stage.id === item.stage);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= PROCESS_STAGES.length) return;
    onEdit({ ...item, stage: PROCESS_STAGES[nextIndex].id, updatedAt: Date.now() });
  }

  function handleSave(item) {
    if (item.id) {
      onEdit({ ...item, updatedAt: Date.now() });
    } else {
      onAdd({ ...item, createdAt: Date.now(), updatedAt: Date.now() });
    }
  }

  function handlePlanSave(item) {
    if (item.id) {
      onEdit({ ...item, stage: 'plan', workDate: '', startTime: '', endTime: '', updatedAt: Date.now() });
    } else {
      onAdd({
        ...item,
        stage: 'plan',
        workDate: '',
        startTime: '',
        endTime: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  function movePlan(item, stageId) {
    onEdit({
      ...item,
      stage: stageId,
      workDate: localDateKey(),
      startTime: '',
      endTime: '',
    });
    setView('daily');
    setSelectedDate(localDateKey());
  }

  function toggleComplete(item) {
    if (item.completed) {
      onEdit({ ...item, completed: false, completedAt: '', rewardEarned: false });
      return;
    }
    const completedAt = new Date().toISOString();
    const deadline = getDeadline(item);
    const rewardEarned = !deadline || new Date(completedAt).getTime() <= deadline;
    onEdit({ ...item, completed: true, completedAt, rewardEarned });
  }

  async function enableNotifications() {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-32">
      <header className="pt-7 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-green-600 uppercase">Daily execution system</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Work Process</h1>
            <p className="text-sm text-gray-500 mt-1">Think clearly. Learn only what is needed. Create. Take it to market.</p>
          </div>
          <button
            type="button"
            onClick={() => view === 'plan' ? setPlanModal({}) : setModal({ stage: 'thinking' })}
            className={`text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm ${view === 'plan' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            <Plus size={19} /> {view === 'plan' ? 'Add Plan' : 'Add Work'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setView('plan')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-extrabold transition-all ${view === 'plan' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}
          >
            <ClipboardList size={18} /> Action Plan <span className="text-xs">({planItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setView('daily')}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-extrabold transition-all ${view === 'daily' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Columns3 size={18} /> Daily Process
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-extrabold text-amber-600">
            <Trophy size={18} /> {earnedPoints} reward points earned
          </div>
          {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
            <button type="button" onClick={enableNotifications} className="flex items-center gap-1.5 rounded-lg bg-red-50 text-red-600 px-3 py-2 text-xs font-extrabold hover:bg-red-100">
              <Bell size={15} /> Enable deadline alerts
            </button>
          )}
          {notificationPermission === 'granted' && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600"><Bell size={14} /> Deadline alerts enabled</span>
          )}
        </div>

        {view === 'daily' && <div className="mt-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setSelectedDate(date => shiftDate(date, -1))} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Previous day">
              <ChevronLeft size={20} />
            </button>
            <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
              <CalendarDays size={18} className="text-green-500" />
              <span>{selectedDate === localDateKey() ? 'Today' : formatDate(selectedDate)}</span>
              <input type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} className="sr-only" />
            </label>
            <button type="button" onClick={() => setSelectedDate(date => shiftDate(date, 1))} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Next day">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-gray-700">{total} work item{total === 1 ? '' : 's'}</span>
            <span className="text-gray-300">•</span>
            <span className="font-bold text-green-600">{marketCount} in market</span>
          </div>
        </div>}

        {view === 'daily' && total > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {PROCESS_STAGES.map((stage, index) => (
              <div key={stage.id} className="h-2 rounded-full overflow-hidden" style={{ background: stage.bg }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: stageCounts[index] ? '100%' : '0%', background: stage.color }}
                />
              </div>
            ))}
          </div>
        )}
      </header>

      {view === 'plan' && (
        <section className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4">
            <h2 className="font-extrabold text-amber-900 flex items-center gap-2"><ClipboardList size={20} /> Master Action Plan</h2>
            <p className="text-sm text-amber-700 mt-1">Capture every idea and task as notes first. You can save them without a date or time.</p>
          </div>

          <div className="space-y-3">
            {planItems.length === 0 && (
              <button
                type="button"
                onClick={() => setPlanModal({})}
                className="w-full rounded-2xl border-2 border-dashed border-amber-200 bg-white p-10 text-center hover:bg-amber-50"
              >
                <ClipboardList size={34} className="mx-auto text-amber-400 mb-2" />
                <p className="font-extrabold text-gray-700">Your Action Plan is empty</p>
                <p className="text-sm text-gray-400 mt-1">Tap here to capture your first plan.</p>
              </button>
            )}

            {planItems.map(item => (
              <article key={item.id} className={`rounded-2xl border shadow-sm p-4 ${item.completed ? 'bg-green-50 border-green-200' : getDeadline(item) && getDeadline(item) < nowMs ? 'bg-red-50 border-red-300' : 'bg-white border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={`font-extrabold text-lg ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</h3>
                    {item.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap break-words mt-2">{item.notes}</p>}
                    {getDeadline(item) && (
                      <div className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${!item.completed && getDeadline(item) < nowMs ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                        <AlarmClock size={14} />
                        {!item.completed && getDeadline(item) < nowMs ? 'EMERGENCY — OVERDUE' : `${formatDeadline(item)} · ${formatRemaining(getDeadline(item) - nowMs)}`}
                      </div>
                    )}
                    {(item.rewardPoints > 0 || item.rewardLabel) && (
                      <p className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${item.rewardEarned ? 'text-amber-600' : 'text-gray-400'}`}>
                        <Trophy size={14} /> {item.rewardPoints || 0} points{item.rewardLabel ? ` · ${item.rewardLabel}` : ''}{item.rewardEarned ? ' — UNLOCKED' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0">
                    <button type="button" onClick={() => setPlanModal({ editItem: item })} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Edit plan">
                      <Edit2 size={16} className="text-gray-400" />
                    </button>
                    <button type="button" onClick={() => onDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50" aria-label="Delete plan">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleComplete(item)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'}`}
                >
                  {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  {item.completed ? (item.rewardEarned ? 'Completed — Reward Unlocked' : 'Completed Late') : 'Mark Complete'}
                </button>

                {!item.completed && <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Move to today&apos;s stage</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PROCESS_STAGES.map(stage => {
                      const StageIcon = Icons[stage.icon];
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => movePlan(item, stage.id)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-extrabold"
                          style={{ color: stage.color, borderColor: stage.border, background: stage.bg }}
                        >
                          <StageIcon size={14} /> {stage.label}
                        </button>
                      );
                    })}
                  </div>
                </div>}
              </article>
            ))}
          </div>
        </section>
      )}

      {view === 'daily' && <div className="grid grid-cols-1 gap-4 pb-4 lg:grid-cols-4">
        {PROCESS_STAGES.map((stage, stageIndex) => {
          const StageIcon = Icons[stage.icon];
          const stageItems = dailyItems.filter(item => item.stage === stage.id);

          return (
            <section
              key={stage.id}
              className="w-full min-w-0 rounded-2xl border p-3 self-start"
              style={{ background: stage.bg, borderColor: stage.border }}
            >
              <div className="flex items-start justify-between gap-2 px-1 py-1">
                <div className="flex gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm" style={{ color: stage.color }}>
                    <StageIcon size={21} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-gray-900">{stage.label}</h2>
                      <span className="text-xs font-extrabold rounded-full px-2 py-0.5 bg-white" style={{ color: stage.color }}>{stageItems.length}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModal({ stage: stage.id })}
                  className="p-2 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform"
                  style={{ color: stage.color }}
                  aria-label={`Add to ${stage.label}`}
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-3 mt-3 min-h-28">
                {stageItems.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setModal({ stage: stage.id })}
                    className="w-full border-2 border-dashed rounded-xl p-5 text-center bg-white/50 hover:bg-white transition-colors"
                    style={{ borderColor: stage.border }}
                  >
                    <Plus size={20} className="mx-auto mb-1.5" style={{ color: stage.color }} />
                    <span className="text-sm font-bold text-gray-500">Add {stage.shortLabel} work</span>
                  </button>
                )}

                {stageItems.map(item => (
                  <article key={item.id} className={`rounded-xl border shadow-sm p-3.5 animate-fade-in ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-white'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-extrabold leading-snug ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</h3>
                      <div className="flex items-center shrink-0">
                        <button type="button" onClick={() => setModal({ editItem: item })} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Edit work">
                          <Edit2 size={14} className="text-gray-400" />
                        </button>
                        <button type="button" onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50" aria-label="Delete work">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    {item.startTime && item.endTime && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-extrabold" style={{ color: stage.color }}>
                        <Clock3 size={14} /> {item.startTime} – {item.endTime}
                        <span className="font-semibold text-gray-400">• Added to Schedule</span>
                      </div>
                    )}

                    {item.notes ? (
                      <div className="mt-2.5 flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
                        <FileText size={14} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-600 whitespace-pre-wrap break-words line-clamp-6">{item.notes}</p>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setModal({ editItem: item })} className="mt-2 text-xs font-bold text-gray-400 hover:text-gray-600">
                        + Add notes
                      </button>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <ProcessProof item={item} onPreview={(src, title) => setPreview({ src, title })} />
                      <button
                        type="button"
                        onClick={() => toggleComplete(item)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors ${item.completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'}`}
                        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {item.completed ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                        {item.completed ? 'Completed' : 'Complete'}
                      </button>
                    </div>

                    {getDeadline(item) && (
                      <div className={`mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${!item.completed && getDeadline(item) < nowMs ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                        <AlarmClock size={14} />
                        {!item.completed && getDeadline(item) < nowMs ? 'EMERGENCY — OVERDUE' : `${formatDeadline(item)} · ${formatRemaining(getDeadline(item) - nowMs)}`}
                      </div>
                    )}
                    {(item.rewardPoints > 0 || item.rewardLabel) && (
                      <p className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${item.rewardEarned ? 'text-amber-600' : 'text-gray-400'}`}>
                        <Trophy size={14} /> {item.rewardPoints || 0} points{item.rewardLabel ? ` · ${item.rewardLabel}` : ''}{item.rewardEarned ? ' — UNLOCKED' : ''}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={stageIndex === 0}
                        onClick={() => moveItem(item, -1)}
                        className="flex items-center gap-1 text-xs font-bold text-gray-500 disabled:opacity-20 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                      >
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button
                        type="button"
                        disabled={stageIndex === PROCESS_STAGES.length - 1}
                        onClick={() => moveItem(item, 1)}
                        className="flex items-center gap-1 text-xs font-extrabold text-white disabled:opacity-30 px-3 py-1.5 rounded-lg"
                        style={{ background: stage.color }}
                      >
                        {stageIndex === PROCESS_STAGES.length - 1 ? 'In Market' : `Next: ${PROCESS_STAGES[stageIndex + 1].shortLabel}`}
                        {stageIndex < PROCESS_STAGES.length - 1 && <ArrowRight size={14} />}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>}

      {modal && (
        <AddWorkItemModal
          initialStage={modal.stage}
          initialDate={selectedDate}
          editItem={modal.editItem}
          existingItems={items}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {planModal && (
        <AddActionPlanModal
          editItem={planModal.editItem}
          onSave={handlePlanSave}
          onClose={() => setPlanModal(null)}
        />
      )}

      {preview && (
        <ImagePreviewModal
          src={preview.src}
          habitName={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
