import { useEffect } from 'react';
import { speak } from '../utils/tts';

const GAMES = [
  { id: 1, emoji: '🔤', title: 'Zvučna Zagonetka',      desc: 'Slušaj i pronađi slovo!',  color: '#5B9A6F' },
  { id: 2, emoji: '🍂', title: 'Kamo je nestao listić?', desc: 'Zapamti i pronađi!',       color: '#C9896D' },
  { id: 3, emoji: '♻️', title: 'Eko-Čistač',             desc: 'Klikni samo otpad!',       color: '#4A7C9F' },
  { id: 4, emoji: '🧩', title: 'Šumska Slagalica',       desc: 'Složi riječ od slova!',   color: '#8B6BAF' },
];

const DIFF_INFO = {
  easy: { label: '😊 Lakše', desc: 'Kraći zadaci · manje rundi · bez tajmera' },
  hard: { label: '🔥 Teže',  desc: 'Duži zadaci · više rundi · tajmer po zadatku' },
};

export default function GameSelector({ onSelect, autoVoice, difficulty, onDifficultyChange, gamesCompleted = new Set() }) {
  const completedCount = gamesCompleted.size;

  useEffect(() => {
    if (autoVoice) speak('Odaberi igru koju želiš igrati!');
  }, [autoVoice]);

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-6">
      <h2
        className="text-2xl sm:text-3xl font-bold tracking-wide"
        style={{ color: 'var(--text-primary)' }}
      >
        Odaberi igru
      </h2>

      {/* ── Progress path strip ───────────────────────────────────────── */}
      {completedCount > 0 && (
        <div
          className="w-full max-w-xl px-5 py-3 rounded-2xl flex items-center gap-3 animate-fade-in"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--card-border)' }}
        >
          <span className="text-2xl" aria-hidden="true">🌲</span>
          <div className="flex-1">
            {/* Dotted trail */}
            <div className="flex items-center gap-1">
              {GAMES.map((g, i) => {
                const done = gamesCompleted.has(g.id);
                return (
                  <div key={g.id} className="flex items-center gap-1 flex-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: done ? 'var(--accent)' : 'var(--card-border)',
                        color: done ? '#fff' : 'var(--text-secondary)',
                      }}
                      title={g.title}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    {i < GAMES.length - 1 && (
                      <div
                        className="h-1 flex-1 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: done ? 'var(--accent)' : 'var(--card-border)',
                          opacity: done ? 0.6 : 0.35,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <span className="text-2xl" aria-hidden="true">🏆</span>
          <span className="text-sm font-bold ml-1 whitespace-nowrap" style={{ color: 'var(--accent)' }}>
            {completedCount}/4
          </span>
        </div>
      )}

      {/* ── Difficulty toggle ─────────────────────────────────────────── */}
      <div className="w-full max-w-xl">
        <p className="text-xs font-semibold text-center mb-2 uppercase tracking-widest"
          style={{ color: 'var(--text-secondary)' }}>
          Težina
        </p>

        <div
          className="flex gap-2 p-1.5 rounded-2xl w-full"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {(['easy', 'hard']).map((d) => (
            <button
              key={d}
              onClick={() => onDifficultyChange(d)}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 px-4 rounded-xl
                transition-all duration-200 font-bold text-base sm:text-lg"
              style={{
                backgroundColor: difficulty === d ? 'var(--accent)' : 'transparent',
                color: difficulty === d ? '#fff' : 'var(--text-secondary)',
                boxShadow: difficulty === d ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
              aria-pressed={difficulty === d}
            >
              {DIFF_INFO[d].label}
              <span
                className="text-xs font-normal hidden sm:block"
                style={{ opacity: 0.85 }}
              >
                {DIFF_INFO[d].desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Game cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {GAMES.map((game, i) => {
          const done = gamesCompleted.has(game.id);
          return (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className="group relative flex flex-col items-center gap-3 p-6 sm:p-7 rounded-2xl
                border-2 transition-all duration-200
                hover:scale-[1.03] active:scale-[0.97]
                shadow-sm hover:shadow-md animate-slide-up"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: done ? 'var(--accent)' : 'var(--card-border)',
                animationDelay: `${i * 80}ms`,
                animationFillMode: 'both',
              }}
              aria-label={`Igra: ${game.title}${done ? ' (završeno)' : ''}`}
            >
              {/* Completion badge */}
              {done && (
                <span
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center
                    text-sm font-bold text-white shadow-sm animate-bounce-in"
                  style={{ backgroundColor: 'var(--accent)' }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}

              <span
                className="text-5xl transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              >
                {game.emoji}
              </span>
              <span
                className="text-lg sm:text-xl font-bold tracking-wide"
                style={{ color: done ? 'var(--accent)' : game.color }}
              >
                {game.title}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {done ? '✅ Završeno · Igraj ponovo' : game.desc}
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
