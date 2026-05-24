import { useState, useEffect, useRef } from 'react';
import { speak } from '../../utils/tts';
import { sfxCorrect, sfxWrong, sfxPop } from '../../utils/sfx';
import ProgressBar from '../ProgressBar';
import TimerBar from '../TimerBar';

// ── Word pools ────────────────────────────────────────────────────────────────
const EASY_WORDS = [
  // 3 letters
  { word: 'VUK',  emoji: '🐺', display: 'Vuk'  },
  { word: 'SOM',  emoji: '🐟', display: 'Som'  },
  { word: 'RAK',  emoji: '🦀', display: 'Rak'  },
  { word: 'JEŽ',  emoji: '🦔', display: 'Jež'  },
  { word: 'KOS',  emoji: '🐦', display: 'Kos'  },
  { word: 'RIS',  emoji: '🐆', display: 'Ris'  },
  { word: 'ZEC',  emoji: '🐇', display: 'Zec'  },
  { word: 'PAS',  emoji: '🐕', display: 'Pas'  },
  { word: 'MIŠ',  emoji: '🐭', display: 'Miš'  },
  // 4 letters
  { word: 'SOVA', emoji: '🦉', display: 'Sova' },
  { word: 'ZEKO', emoji: '🐇', display: 'Zeko' },
  { word: 'RODA', emoji: '🦩', display: 'Roda' },
  { word: 'MRAV', emoji: '🐜', display: 'Mrav' },
  { word: 'ŽABA', emoji: '🐸', display: 'Žaba' },
  { word: 'SRNA', emoji: '🦌', display: 'Srna' },
  { word: 'RIBA', emoji: '🐠', display: 'Riba' },
  { word: 'ORAO', emoji: '🦅', display: 'Orao' },
  { word: 'MEDO', emoji: '🐻', display: 'Medo' },
  { word: 'KONJ', emoji: '🐴', display: 'Konj' },
  { word: 'KOZA', emoji: '🐐', display: 'Koza' },
  { word: 'OVCA', emoji: '🐑', display: 'Ovca' },
  { word: 'BUBA', emoji: '🐛', display: 'Buba' },
];

const HARD_WORDS = [
  // 5 letters
  { word: 'JELEN',   emoji: '🦌', display: 'Jelen'   },
  { word: 'PATKA',   emoji: '🦆', display: 'Patka'   },
  { word: 'PČELA',   emoji: '🐝', display: 'Pčela'   },
  { word: 'KUNIĆ',   emoji: '🐇', display: 'Kunić'   },
  { word: 'VRANA',   emoji: '🐦', display: 'Vrana'   },
  { word: 'GUSKA',   emoji: '🪿', display: 'Guska'   },
  { word: 'RONDA',   emoji: '🐟', display: 'Ronda'   },
  // 6 letters
  { word: 'LISICA',  emoji: '🦊', display: 'Lisica'  },
  { word: 'LEPTIR',  emoji: '🦋', display: 'Leptir'  },
  { word: 'ŠIŠMIŠ',  emoji: '🦇', display: 'Šišmiš'  },
  { word: 'LASICA',  emoji: '🦦', display: 'Lasica'  },
  { word: 'JAZAVAC', emoji: '🦡', display: 'Jazavac' },
  // 7 letters
  { word: 'MEDVJED', emoji: '🐻', display: 'Medvjed' },
  { word: 'FAZANKA', emoji: '🐓', display: 'Fazanka' },
  { word: 'DABAR',   emoji: '🦫', display: 'Dabar'   },
];

// Config per difficulty
const CONFIG = {
  easy: { rounds: 4, timerSeconds: null },
  hard: { rounds: 6, timerSeconds: 25   },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWords(difficulty) {
  const pool = difficulty === 'hard' ? HARD_WORDS : EASY_WORDS;
  return shuffle(pool).slice(0, CONFIG[difficulty]?.rounds ?? 4);
}

// Slot entry: null | { id, letter, correct: true } | { id, letter, wrong: true }
export default function SumskaSlagalica({ autoVoice, onStar, onFinish, difficulty }) {
  const cfg = CONFIG[difficulty] ?? CONFIG.easy;

  const [words]              = useState(() => pickWords(difficulty));
  const [wordIdx, setWordIdx]       = useState(0);
  const [slots, setSlots]           = useState([]);
  const [available, setAvailable]   = useState([]);
  const [completed, setCompleted]   = useState(false);
  const [timedOut, setTimedOut]     = useState(false);

  // Ghost (drag visual)
  const [ghostTile, setGhostTile]   = useState(null);
  const [ghostPos,  setGhostPos]    = useState(null);
  const [hoverSlot, setHoverSlot]   = useState(null);

  const slotRefs = useRef([]);
  const slotsRef     = useRef(slots);
  const completedRef = useRef(completed);
  const wordRef      = useRef(words[wordIdx]);
  slotsRef.current     = slots;
  completedRef.current = completed;
  wordRef.current      = words[wordIdx];

  const gestureRef      = useRef(null);
  const preventClickRef = useRef(false);
  const wrongCountRef   = useRef(0);

  const currentWord = words[wordIdx];
  const isLastWord  = wordIdx >= words.length - 1;

  // ── Init / new word ──────────────────────────────────────────────────────
  useEffect(() => {
    const letters = currentWord.word.split('').map((ch, i) => ({
      id: `${ch}-${i}-${wordIdx}`,
      letter: ch,
    }));
    setAvailable(shuffle(letters));
    setSlots(Array(currentWord.word.length).fill(null));
    setCompleted(false);
    setTimedOut(false);
    wrongCountRef.current = 0;
    gestureRef.current = null;
    setGhostTile(null);
    setGhostPos(null);
    setHoverSlot(null);
    slotRefs.current = [];

    if (autoVoice) {
      const t = setTimeout(() => speak(`Složi riječ ${currentWord.display}!`), 400);
      return () => clearTimeout(t);
    }
  }, [wordIdx, autoVoice, currentWord]);

  // ── Win check ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (completed || timedOut) return;
    if (slots.length === 0) return;
    if (!slots.every((s) => s && s.correct)) return;

    setCompleted(true);
    sfxCorrect();
    onStar();
    if (autoVoice) speak(`${currentWord.display}! Bravo!`);
    setTimeout(() => {
      if (isLastWord) onFinish();
      else setWordIdx((i) => i + 1);
    }, 1800);
  }, [slots, completed, timedOut, currentWord, autoVoice, onStar, onFinish, isLastWord]);

  // ── Timer timeout ────────────────────────────────────────────────────────
  function handleTimeout() {
    if (completedRef.current) return;
    setTimedOut(true);
    if (autoVoice) speak('Vrijeme je isteklo! Idemo na sljedeću riječ.');
    setTimeout(() => {
      if (isLastWord) onFinish();
      else setWordIdx((i) => i + 1);
    }, 1800);
  }

  // ── Tile placement (immediate per-letter validation) ─────────────────────
  function placeInSlot(tile, slotIdx) {
    if (completedRef.current || timedOut) return;
    if (slotsRef.current[slotIdx] !== null) return;

    const isCorrect = tile.letter === wordRef.current.word[slotIdx];

    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...tile, correct: isCorrect, wrong: !isCorrect };
      return next;
    });
    setAvailable((prev) => prev.filter((t) => t.id !== tile.id));

    if (isCorrect) {
      sfxPop();
    } else {
      sfxWrong();
      wrongCountRef.current += 1;

      // Adaptive hint after 4 wrong placements
      if (wrongCountRef.current >= 4) {
        setTimeout(() => {
          const hintIdx = slotsRef.current.findIndex((s) => !s?.correct);
          if (hintIdx >= 0) {
            const hintLetter = wordRef.current.word[hintIdx];
            setAvailable((prev) => {
              const match = prev.find((t) => t.letter === hintLetter);
              if (!match) return prev;
              setSlots((s) => {
                const next = [...s];
                if (!next[hintIdx]) next[hintIdx] = { ...match, correct: true };
                return next;
              });
              return prev.filter((t) => t.id !== match.id);
            });
            if (autoVoice) speak(`Hint: slovo ${hintLetter}!`);
            wrongCountRef.current = 0;
          }
        }, 1000);
      }

      setTimeout(() => {
        setSlots((prev) => {
          const next = [...prev];
          if (next[slotIdx]?.id === tile.id && next[slotIdx]?.wrong) next[slotIdx] = null;
          return next;
        });
        setAvailable((prev) => {
          if (prev.some((t) => t.id === tile.id)) return prev;
          return [...prev, tile];
        });
      }, 750);
    }
  }

  function handleSlotClick(slotIdx) {
    const slot = slotsRef.current[slotIdx];
    if (!slot || slot.correct || completedRef.current) return;
    setSlots((prev) => { const next = [...prev]; next[slotIdx] = null; return next; });
    setAvailable((prev) => {
      if (prev.some((t) => t.id === slot.id)) return prev;
      return [...prev, { id: slot.id, letter: slot.letter }];
    });
  }

  function handleTileClick(tile) {
    if (preventClickRef.current) { preventClickRef.current = false; return; }
    if (completedRef.current || timedOut) return;
    const idx = slotsRef.current.findIndex((s) => s === null);
    if (idx >= 0) placeInSlot(tile, idx);
  }

  function handleTilePointerDown(tile, e) {
    if (completedRef.current || timedOut) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    gestureRef.current = { tile, startX: pt.clientX, startY: pt.clientY, isDrag: false };
    preventClickRef.current = false;
  }

  function slotAtPoint(x, y) {
    for (let i = 0; i < slotRefs.current.length; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }

  useEffect(() => {
    function onMove(e) {
      const g = gestureRef.current;
      if (!g) return;
      const pt = e.touches ? e.touches[0] : e;
      if (!g.isDrag) {
        if (Math.abs(pt.clientX - g.startX) > 6 || Math.abs(pt.clientY - g.startY) > 6) {
          g.isDrag = true;
          preventClickRef.current = true;
          setGhostTile(g.tile);
        }
      }
      if (g.isDrag) {
        e.preventDefault();
        setGhostPos({ x: pt.clientX, y: pt.clientY });
        setHoverSlot(slotAtPoint(pt.clientX, pt.clientY));
      }
    }

    function onUp(e) {
      const g = gestureRef.current;
      gestureRef.current = null;
      setGhostTile(null);
      setGhostPos(null);
      setHoverSlot(null);
      if (!g || !g.isDrag) return;
      if (completedRef.current) return;
      const pt  = e.changedTouches ? e.changedTouches[0] : e;
      const idx = slotAtPoint(pt.clientX, pt.clientY);
      if (idx !== null) placeInSlot(g.tile, idx);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
    };
  }, []); // empty deps — uses refs

  // ── Tile sizing ──────────────────────────────────────────────────────────
  const wordLen  = currentWord.word.length;
  const isLong   = wordLen >= 6;
  const isMedium = wordLen === 5;
  // Available pool tiles — fixed size, flex-wrap is fine there
  const tileSize = isLong
    ? 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl'
    : isMedium
      ? 'w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl'
      : 'w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl';
  // Slot tiles — font scales with word length (size handled by CSS grid)
  const slotFont = isLong ? 'text-xl sm:text-2xl' : isMedium ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6 animate-fade-in no-select">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Riječ {wordIdx + 1}/{words.length}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Složi riječ!
        </h2>
      </div>

      <ProgressBar current={wordIdx + 1} total={words.length} />

      {/* Timer — hard mode only, resets per word */}
      {cfg.timerSeconds && !completed && !timedOut && (
        <TimerBar key={wordIdx} seconds={cfg.timerSeconds} onTimeout={handleTimeout} />
      )}

      {timedOut && (
        <p className="text-xl font-semibold animate-fade-in" style={{ color: 'var(--coral)' }}>
          ⏰ Vrijeme je isteklo!
        </p>
      )}

      {/* Animal */}
      <div className="text-6xl sm:text-7xl" aria-hidden="true">{currentWord.emoji}</div>

      {/* Drop slots — CSS grid: always one row, tiles scale to fill width */}
      <div
        className="grid gap-2 sm:gap-3 w-full"
        style={{
          gridTemplateColumns: `repeat(${wordLen}, 1fr)`,
          maxWidth: `min(${wordLen * 80}px, 100%)`,
        }}
      >
        {slots.map((slot, i) => {
          const isHovered = hoverSlot === i && !slot;
          const isWrong   = slot?.wrong   === true;
          const isGood    = slot?.correct === true;

          return (
            <div
              key={i}
              ref={(el) => (slotRefs.current[i] = el)}
              onClick={() => handleSlotClick(i)}
              className={`
                aspect-square rounded-xl font-bold
                flex items-center justify-center
                ${slotFont}
                transition-all duration-150
                ${isWrong   ? 'animate-shake cursor-pointer' : ''}
                ${completed ? 'animate-bounce-in' : ''}
                ${isHovered ? 'scale-110' : ''}
              `}
              style={{
                border: `3px ${slot ? 'solid' : 'dashed'} ${
                  isWrong   ? 'var(--coral)'
                  : completed ? 'var(--success)'
                  : isGood    ? 'var(--success)'
                  : isHovered ? 'var(--accent)'
                  : slot      ? 'var(--accent)'
                  : 'var(--card-border)'
                }`,
                backgroundColor:
                  isWrong   ? 'var(--coral)'
                  : completed ? 'var(--success)'
                  : isGood    ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                  : slot      ? 'var(--card-bg)'
                  : 'transparent',
                color: isWrong || completed ? '#fff' : isGood ? 'var(--success)' : 'var(--text-primary)',
                animationDelay: completed ? `${i * 100}ms` : '0ms',
                animationFillMode: 'both',
              }}
              role="button"
              aria-label={slot ? `Slovo ${slot.letter}` : `Prazno mjesto ${i + 1}`}
            >
              {slot?.letter ?? ''}
            </div>
          );
        })}
      </div>

      {/* Hint */}
      {!completed && !timedOut && available.length > 0 && (
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Povuci slovo na prazno mjesto ili klikni
        </p>
      )}

      {/* Available tiles */}
      {!completed && !timedOut && (
        <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
          {available.map((tile) => {
            const isDragging = ghostTile?.id === tile.id;
            return (
              <div
                key={tile.id}
                onMouseDown={(e) => handleTilePointerDown(tile, e)}
                onTouchStart={(e) => handleTilePointerDown(tile, e)}
                onClick={() => handleTileClick(tile)}
                className={`
                  ${tileSize} rounded-xl font-bold
                  flex items-center justify-center
                  shadow-lg cursor-grab active:cursor-grabbing
                  select-none transition-transform duration-100
                  ${isDragging ? 'opacity-30 scale-90' : 'hover:scale-110'}
                `}
                style={{
                  border: '3px solid var(--accent)',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  touchAction: 'none',
                }}
                role="button"
                aria-label={`Slovo ${tile.letter}`}
              >
                {tile.letter}
              </div>
            );
          })}
        </div>
      )}

      {/* Drag ghost */}
      {ghostTile && ghostPos && (
        <div
          className={`${tileSize} rounded-xl font-bold flex items-center justify-center shadow-2xl pointer-events-none`}
          style={{
            position: 'fixed', zIndex: 9999,
            border: '3px solid var(--accent-hover)',
            backgroundColor: 'var(--accent)', color: '#fff',
            left: ghostPos.x, top: ghostPos.y,
            transform: 'translate(-50%, -50%) scale(1.15) rotate(-3deg)',
          }}
          aria-hidden="true"
        >
          {ghostTile.letter}
        </div>
      )}

      {/* Completion */}
      {completed && (
        <div className="text-center space-y-2 animate-bounce-in">
          <p className="text-3xl font-extrabold" style={{ color: 'var(--success)' }}>⭐ {currentWord.display}!</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>Bravo!</p>
        </div>
      )}
    </div>
  );
}
