import { useEffect } from 'react';
import { speak } from '../utils/tts';

export default function StartScreen({ onStart, autoVoice, totalStars = 0 }) {
  useEffect(() => {
    if (autoVoice) {
      speak('Dobrodošli u Šumsku Priču! Pritisnite gumb za početak.');
    }
  }, [autoVoice]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8 animate-fade-in">
      <div className="text-7xl sm:text-8xl" aria-hidden="true">🦉</div>

      <div className="text-center space-y-3">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wide"
          style={{ color: 'var(--accent)' }}
        >
          Šumska Priča
        </h1>
        <p
          className="text-lg sm:text-xl font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Učimo i igramo se u šumi!
        </p>
        <p
          className="text-xs font-normal"
          style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
        >
          Vista ADHD centar
        </p>
      </div>

      {totalStars > 0 && (
        <div className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'var(--card-bg)', color: 'var(--gold)' }}
        >
          <span aria-hidden="true">⭐</span>
          <span>Ukupno skupljeno: {totalStars}</span>
        </div>
      )}

      <button
        onClick={onStart}
        className="mt-4 px-12 py-5 rounded-2xl text-2xl sm:text-3xl font-bold text-white
          shadow-lg hover:shadow-xl active:scale-95
          transition-all duration-200 animate-gentle-pulse"
        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--accent-hover)')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'var(--accent)')}
      >
        ZAPOČNI
      </button>
    </main>
  );
}
