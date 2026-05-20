export default function GameWrapper({ title, onBack, children }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <button
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] rounded-xl border-2 flex items-center justify-center
            text-lg font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            borderColor: 'var(--card-border)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-secondary)',
          }}
          aria-label="Natrag na odabir igara"
        >
          ←
        </button>
        <h3 className="text-lg font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
