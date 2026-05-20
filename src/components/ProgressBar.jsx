export default function ProgressBar({ current, total, label }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full max-w-xs mx-auto px-4">
      {label && (
        <p className="text-xs font-medium text-center mb-1" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
      )}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Napredak: ${current} od ${total}`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 100 ? 'var(--success)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}
