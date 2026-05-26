export default function ProgressBar({ completed, total }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const message =
    pct === 100
      ? '🎉 Perfect day! All habits done!'
      : pct >= 75
      ? '🔥 Almost there, keep going!'
      : pct >= 50
      ? '💪 Great momentum, halfway through!'
      : pct >= 25
      ? '✨ Good start, keep it up!'
      : pct > 0
      ? '🌱 You\'ve started — don\'t stop now!'
      : '👋 Ready to build great habits today?';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">Today's Progress</span>
        <span className="text-sm font-bold text-green-600">
          {completed}/{total} <span className="text-gray-400 font-normal">habits</span>
        </span>
      </div>

      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="progress-bar-fill h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background:
              pct === 100
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : pct >= 50
                ? 'linear-gradient(90deg, #86efac, #22c55e)'
                : 'linear-gradient(90deg, #bbf7d0, #86efac)',
          }}
        />
      </div>

      <p className="text-xs text-gray-500 text-center">{message}</p>
    </div>
  );
}
