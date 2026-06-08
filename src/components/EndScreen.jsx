import { useEffect } from 'react';
import { speak } from '../utils/tts';

const PRAISE = [
  'Bravo! Odlično odrađeno!',
  'Sjajno! Ti si zvijezda šume!',
  'Fantastično! Nastavite tako!',
  'Super posao! Šuma je ponosna!',
];

export default function EndScreen({ stars, savedStats = {}, badges = [], onRestart, autoVoice }) {
  const praise = PRAISE[Math.min(Math.floor(stars / 3), PRAISE.length - 1)];
  const totalGamesPlayed = Object.values(savedStats.gamesPlayed || {}).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (autoVoice) speak(praise);
  }, [autoVoice, praise]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-7 animate-fade-in">
      <div className="text-7xl sm:text-8xl animate-bounce-in" aria-hidden="true">
        🏆
      </div>

      <div className="text-center space-y-4">
        <h2
          className="text-3xl sm:text-4xl font-extrabold tracking-wide"
          style={{ color: 'var(--accent)' }}
        >
          {praise}
        </h2>

        <div
          className="flex items-center justify-center gap-2 text-4xl sm:text-5xl font-bold"
          style={{ color: 'var(--gold)' }}
        >
          <span aria-hidden="true">⭐</span>
          <span>{stars}</span>
          <span className="text-xl font-medium ml-1" style={{ color: 'var(--text-secondary)' }}>
            zvjezdica
          </span>
        </div>

        <div className="flex justify-center gap-1 text-3xl flex-wrap" aria-hidden="true">
          {Array.from({ length: Math.min(stars, 12) }).map((_, i) => (
            <span
              key={i}
              className="animate-star-pop inline-block"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              ⭐
            </span>
          ))}
        </div>
      </div>

      {/* ── Badge gallery ────────────────────────────────────────────────── */}
      {badges.length > 0 ? (
        <div className="w-full max-w-xl">
          <p
            className="text-xs font-semibold text-center uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Zasluženi bedževi
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((badge, i) => (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center animate-slide-up"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--accent)',
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: 'both',
                }}
              >
                <span className="text-4xl" aria-hidden="true">{badge.icon}</span>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {badge.title}
                </p>
                <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {badge.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="w-full max-w-xl px-5 py-4 rounded-2xl text-center border-2"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-secondary)',
          }}
        >
          <p className="text-3xl mb-2" aria-hidden="true">🎯</p>
          <p className="text-sm font-medium">Igrajte više igara i skupite zvjezdice za bedževe!</p>
        </div>
      )}

      {/* ── Lifetime stats card ──────────────────────────────────────────── */}
      {(savedStats.totalStars > 0 || totalGamesPlayed > 0) && (
        <div
          className="flex gap-0 rounded-2xl overflow-hidden text-center"
          style={{ border: '2px solid var(--card-border)', backgroundColor: 'var(--card-bg)' }}
        >
          <div className="px-6 py-4">
            <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
              ⭐ {savedStats.totalStars ?? 0}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              ukupno zvjezdica
            </p>
          </div>

          <div
            className="px-6 py-4"
            style={{ borderLeft: '2px solid var(--card-border)' }}
          >
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              🏅 {savedStats.bestSession ?? 0}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              rekord
            </p>
          </div>

          {totalGamesPlayed > 0 && (
            <div
              className="px-6 py-4"
              style={{ borderLeft: '2px solid var(--card-border)' }}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                🎮 {totalGamesPlayed}
              </p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                {totalGamesPlayed === 1 ? 'igra odigrana' : 'igara odigrano'}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-2 px-12 py-5 rounded-2xl text-2xl sm:text-3xl font-bold text-white
          shadow-lg hover:shadow-xl active:scale-95
          transition-all duration-200 animate-gentle-pulse"
        style={{ backgroundColor: 'var(--accent)' }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--accent-hover)')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'var(--accent)')}
      >
        IGRAJ PONOVNO
      </button>
    </main>
  );
}
