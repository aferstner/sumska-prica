import { useState, useEffect, useRef, useCallback } from 'react';
import { speak } from '../../utils/tts';
import { sfxPop, sfxWrong } from '../../utils/sfx';
import ProgressBar from '../ProgressBar';

// ── Item pools per difficulty ─────────────────────────────────────────────────
const EASY_ITEMS = [
  { type: 'bottle',    emoji: '🧴', name: 'Plastična boca', isTarget: true  },
  { type: 'leaf',      emoji: '🍃', name: 'List',           isTarget: false },
  { type: 'ladybug',   emoji: '🐞', name: 'Bubamara',       isTarget: false },
];

const HARD_ITEMS = [
  { type: 'bottle',    emoji: '🧴', name: 'Plastična boca', isTarget: true  },
  { type: 'can',       emoji: '🥤', name: 'Limenka',        isTarget: true  }, // 2nd target!
  { type: 'leaf',      emoji: '🍃', name: 'List',           isTarget: false },
  { type: 'ladybug',   emoji: '🐞', name: 'Bubamara',       isTarget: false },
  { type: 'butterfly', emoji: '🦋', name: 'Leptir',         isTarget: false },
  { type: 'bird',      emoji: '🐦', name: 'Ptica',          isTarget: false },
];

const CONFIG = {
  easy: { goal: 7,  spawnMs: 1600, fallMs: 8500 },
  hard: { goal: 15, spawnMs: 1000, fallMs: 5500 },
};

let idCounter = 0;

export default function EkoCistac({ autoVoice, onStar, onFinish, difficulty }) {
  const cfg       = CONFIG[difficulty] ?? CONFIG.easy;
  const itemPool  = difficulty === 'hard' ? HARD_ITEMS : EASY_ITEMS;
  const isHard    = difficulty === 'hard';

  const [fallingItems, setFallingItems] = useState([]);
  const [score, setScore]               = useState(0);
  const [paused, setPaused]             = useState(false);
  const [started, setStarted]           = useState(false);
  const [wrongClicks, setWrongClicks]   = useState(0);

  const spawnRef    = useRef(null);
  const cleanupRef  = useRef(null);
  const scoreRef    = useRef(0);
  const wrongRef    = useRef(0);
  scoreRef.current  = score;
  wrongRef.current  = wrongClicks;

  // Adaptive: wrong clicks slow things down (easier to catch remaining items)
  const adaptiveSpawn = cfg.spawnMs + Math.min(wrongClicks * 100, 400);
  const adaptiveFall  = cfg.fallMs  + Math.min(wrongClicks * 300, 1200);

  const startGame = useCallback(() => {
    setStarted(true);
    if (autoVoice) {
      const msg = isHard
        ? 'Klikni plastične boce i limenke! Ne diraj ostalo!'
        : 'Klikni samo plastične boce! Pazi da ne klikneš listove ili bubamare.';
      speak(msg);
    }
  }, [autoVoice, isHard]);

  useEffect(() => {
    if (!started || paused) return;

    // Weighted random pick from item pool (target items appear ~40% of the time)
    const targetItems    = itemPool.filter((i) => i.isTarget);
    const nonTargetItems = itemPool.filter((i) => !i.isTarget);

    spawnRef.current = setInterval(() => {
      if (scoreRef.current >= cfg.goal) return;

      const isTargetSpawn = Math.random() < 0.42;
      const pool = isTargetSpawn ? targetItems : nonTargetItems;
      const pick = pool[Math.floor(Math.random() * pool.length)];

      setFallingItems((prev) => [
        ...prev,
        {
          id: ++idCounter,
          ...pick,
          x: 8 + Math.random() * 72,
          startTime: Date.now(),
          fallMs: cfg.fallMs + Math.min(wrongRef.current * 300, 1200),
        },
      ]);
    }, adaptiveSpawn);

    cleanupRef.current = setInterval(() => {
      setFallingItems((prev) =>
        prev.filter((item) => Date.now() - item.startTime < item.fallMs + 1000)
      );
    }, 2000);

    return () => {
      clearInterval(spawnRef.current);
      clearInterval(cleanupRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, paused, adaptiveSpawn]);

  function handleClick(item) {
    if (paused) return;
    setFallingItems((prev) => prev.filter((i) => i.id !== item.id));

    if (item.isTarget) {
      const newScore = scoreRef.current + 1;
      setScore(newScore);
      sfxPop();
      onStar();

      if (newScore >= cfg.goal) {
        clearInterval(spawnRef.current);
        if (autoVoice) speak('Bravo! Očistio si šumu!');
        setTimeout(() => onFinish(), 1500);
      }
    } else {
      sfxWrong();
      setWrongClicks((w) => w + 1);
      setPaused(true);
      if (autoVoice) speak(`To je ${item.name}. Klikni samo ${isHard ? 'boce i limenke' : 'plastične boce'}!`);
      setTimeout(() => setPaused(false), 2000);
    }
  }

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8 animate-fade-in">
        <span className="text-7xl" aria-hidden="true">♻️</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>
          Eko-Čistač
        </h2>

        {isHard ? (
          <div className="text-center space-y-2 max-w-sm">
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Klikni otpad! 🧴 🥤
            </p>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Skupi plastične boce <strong>i</strong> limenke.
              <br />Nemoj kliknuti listove 🍃, bubamare 🐞, leptire 🦋 ili ptice 🐦.
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--coral)' }}>
              Cilj: {cfg.goal} komada otpada
            </p>
          </div>
        ) : (
          <p className="text-lg text-center max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Klikni samo plastične boce! 🧴
            <br />Nemoj kliknuti listove 🍃 ili bubamare 🐞.
          </p>
        )}

        <button
          onClick={startGame}
          className="px-10 py-4 rounded-2xl text-xl font-bold text-white
            shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          IGRAJ
        </button>
      </div>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-4 gap-3 animate-fade-in">
      <div className="flex items-center justify-between w-full max-w-lg">
        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {isHard ? '🧴🥤' : '🧴'} {score} / {cfg.goal}
        </p>
        {paused && (
          <p className="text-sm font-semibold animate-fade-in px-3 py-1 rounded-full"
            style={{ backgroundColor: 'var(--coral)', color: '#fff' }}>
            Samo otpad!
          </p>
        )}
      </div>

      <ProgressBar current={score} total={cfg.goal} />

      <div
        className="relative w-full max-w-lg rounded-2xl border-2 overflow-hidden no-select"
        style={{
          height: 'min(78vh, 650px)',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--card-border)',
        }}
        aria-label="Područje igre"
      >
        {fallingItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="absolute text-4xl sm:text-5xl hover:scale-125 active:scale-90 transition-transform duration-100"
            style={{
              left: `${item.x}%`,
              animation: `fall-down ${item.fallMs}ms linear forwards`,
            }}
            aria-label={item.name}
          >
            {item.emoji}
          </button>
        ))}

        {fallingItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-lg font-medium animate-gentle-pulse" style={{ color: 'var(--text-secondary)' }}>
              Čekam predmete...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
