import { useState, useEffect, useRef } from 'react';
import { speak } from '../../utils/tts';
import { sfxCorrect, sfxWrong } from '../../utils/sfx';
import ProgressBar from '../ProgressBar';
import TimerBar from '../TimerBar';

const ALL_ITEMS = [
  { id: 'zir',     name: 'Žir',     emoji: '🌰' },
  { id: 'gljiva',  name: 'Gljiva',  emoji: '🍄' },
  { id: 'list',    name: 'List',    emoji: '🍂' },
  { id: 'jabuka',  name: 'Jabuka',  emoji: '🍎' },
  { id: 'cvijet',  name: 'Cvijet',  emoji: '🌸' },
  { id: 'bobica',  name: 'Bobica',  emoji: '🫐' },
  { id: 'pero',    name: 'Pero',    emoji: '🪶' },
  { id: 'puz',     name: 'Puž',     emoji: '🐌' },
  { id: 'leptir',  name: 'Leptir',  emoji: '🦋' },
  { id: 'kamen',   name: 'Kamen',   emoji: '🪨' },
  { id: 'jagoda',  name: 'Jagoda',  emoji: '🍓' },
  { id: 'grancica',name: 'Grančica',emoji: '🌿' },
];

// Config per difficulty
const CONFIG = {
  easy: { totalRounds: 3, showItems: 3, showDuration: 3500, timerSeconds: null },
  hard: { totalRounds: 5, showItems: 4, showDuration: 2500, timerSeconds: 10  },
};

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

export default function KamoJeNestaoListic({ autoVoice, onStar, onFinish, difficulty }) {
  const cfg = CONFIG[difficulty] ?? CONFIG.easy;

  const [roundIdx, setRoundIdx]   = useState(0);
  const [phase, setPhase]         = useState('showing'); // showing | covered | guessing | reveal
  const [items, setItems]         = useState([]);
  const [missingItem, setMissingItem] = useState(null);
  const [choices, setChoices]     = useState([]);
  const [feedback, setFeedback]   = useState(null);
  // Adaptive: give more memorisation time after wrong answers
  const [showDuration, setShowDuration] = useState(cfg.showDuration);
  const timerRef = useRef(null);

  // Reset show duration when difficulty changes (shouldn't happen mid-game but just in case)
  useEffect(() => { setShowDuration(cfg.showDuration); }, [cfg.showDuration]);

  useEffect(() => {
    startRound();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIdx, showDuration]);

  function startRound() {
    const picked = pickRandom(ALL_ITEMS, cfg.showItems);
    setItems(picked);
    setPhase('showing');
    setFeedback(null);

    if (autoVoice) speak('Zapamti predmete!');

    timerRef.current = setTimeout(() => {
      setPhase('covered');

      timerRef.current = setTimeout(() => {
        const removeIdx  = Math.floor(Math.random() * picked.length);
        const removed    = picked[removeIdx];
        const remaining  = picked.filter((_, i) => i !== removeIdx);
        const decoyPool  = ALL_ITEMS.filter((it) => !picked.some((p) => p.id === it.id));
        const decoy      = decoyPool[Math.floor(Math.random() * decoyPool.length)];

        setMissingItem(removed);
        setChoices([removed, decoy].sort(() => Math.random() - 0.5));
        setItems(remaining);
        setPhase('guessing');

        if (autoVoice) speak('Koji predmet je nestao?');
      }, 1200);
    }, showDuration);
  }

  function advance() {
    if (roundIdx + 1 >= cfg.totalRounds) onFinish();
    else setRoundIdx((i) => i + 1);
  }

  function handleTimeout() {
    if (feedback || phase !== 'guessing') return;
    // Show the answer briefly
    setPhase('reveal');
    if (autoVoice) speak(`Nestao je ${missingItem?.name}! Idemo dalje.`);
    setTimeout(advance, 1800);
  }

  function handleChoice(item) {
    if (feedback || phase !== 'guessing') return;

    if (item.id === missingItem.id) {
      setFeedback('correct');
      sfxCorrect();
      onStar();
      if (autoVoice) speak(`Točno! Nestao je ${missingItem.name}!`);
      setTimeout(advance, 1400);
    } else {
      setFeedback('wrong');
      sfxWrong();
      if (autoVoice) speak('To nije taj. Pokušaj ponovo!');
      // Adaptive: more show time next round
      setShowDuration((d) => Math.min(d + 500, 5500));
      setTimeout(() => setFeedback(null), 900);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Krug {roundIdx + 1}/{cfg.totalRounds}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {phase === 'showing'  && 'Zapamti predmete!'}
          {phase === 'covered'  && 'Čekaj...'}
          {phase === 'guessing' && 'Što je nestalo?'}
          {phase === 'reveal'   && 'Nestalo je...'}
        </h2>
      </div>

      <ProgressBar current={roundIdx + 1} total={cfg.totalRounds} />

      {/* Timer — only during guessing phase in hard mode */}
      {difficulty === 'hard' && phase === 'guessing' && !feedback && (
        <TimerBar key={`${roundIdx}-guess`} seconds={cfg.timerSeconds} onTimeout={handleTimeout} />
      )}

      {/* Showing phase */}
      {phase === 'showing' && (
        <div className="flex gap-4 sm:gap-8 justify-center flex-wrap animate-fade-in">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {/* Covered phase */}
      {phase === 'covered' && (
        <div className="flex items-center justify-center w-full py-16 animate-fade-in">
          <div className="text-6xl sm:text-7xl animate-gentle-pulse" aria-label="Čekanje">🌫️</div>
        </div>
      )}

      {/* Guessing phase */}
      {(phase === 'guessing' || phase === 'reveal') && (
        <>
          {/* Remaining items + empty slot */}
          <div className="flex gap-4 sm:gap-8 justify-center flex-wrap">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
            {/* Empty / reveal slot */}
            {phase === 'guessing' ? (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl"
                style={{ border: '3px dashed var(--coral)', color: 'var(--coral)' }}
                aria-label="Prazno mjesto"
              >
                ?
              </div>
            ) : (
              /* Reveal: show the missing item */
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center gap-1 animate-bounce-in"
                style={{ border: '3px solid var(--coral)', backgroundColor: 'color-mix(in srgb, var(--coral) 15%, transparent)' }}
              >
                <span className="text-3xl sm:text-4xl">{missingItem?.emoji}</span>
              </div>
            )}
          </div>

          {phase === 'guessing' && (
            <>
              <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Klikni na predmet koji je nestao:
              </p>

              <div className="flex gap-5 justify-center">
                {choices.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleChoice(item)}
                    disabled={!!feedback}
                    className={`
                      flex flex-col items-center gap-2 p-5 rounded-2xl
                      transition-all duration-200 hover:scale-105 active:scale-95
                      shadow-md hover:shadow-lg
                      ${feedback === 'correct' && item.id === missingItem.id ? 'animate-bounce-in' : ''}
                      ${feedback === 'wrong'   && item.id !== missingItem.id ? 'animate-shake'    : ''}
                    `}
                    style={{
                      border: '3px solid',
                      borderColor: feedback === 'correct' && item.id === missingItem.id ? 'var(--success)' : 'var(--card-border)',
                      backgroundColor: feedback === 'correct' && item.id === missingItem.id ? 'var(--success)' : 'var(--card-bg)',
                      color: feedback === 'correct' && item.id === missingItem.id ? '#fff' : 'var(--text-primary)',
                    }}
                    aria-label={item.name}
                  >
                    <span className="text-4xl sm:text-5xl">{item.emoji}</span>
                    <span className="text-sm font-semibold">{item.name}</span>
                  </button>
                ))}
              </div>

              {feedback === 'correct' && (
                <p className="text-2xl font-bold animate-bounce-in" style={{ color: 'var(--success)' }}>⭐ Točno!</p>
              )}
              {feedback === 'wrong' && (
                <p className="text-xl font-semibold animate-fade-in" style={{ color: 'var(--coral)' }}>Pokušaj ponovo!</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function ItemCard({ item }) {
  return (
    <div
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center shadow-sm text-4xl sm:text-5xl"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      aria-label={item.name}
    >
      {item.emoji}
    </div>
  );
}
