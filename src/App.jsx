import { useState, useEffect, useCallback, useRef } from 'react';
import { stopSpeaking } from './utils/tts';
import { sfxStar } from './utils/sfx';
import { loadStats, recordSession } from './utils/storage';
import { computeBadges, getBadgeObjects } from './utils/badges';
import PametnaTraka from './components/PametnaTraka';
import StartScreen from './components/StartScreen';
import GameSelector from './components/GameSelector';
import EndScreen from './components/EndScreen';
import GameWrapper from './components/GameWrapper';
import Confetti from './components/Confetti';
import BadgeToast from './components/BadgeToast';
import ZvucnaZagonetka from './components/games/ZvucnaZagonetka';
import KamoJeNestaoListic from './components/games/KamoJeNestaoListic';
import EkoCistac from './components/games/EkoCistac';
import SumskaSlagalica from './components/games/SumskaSlagalica';

const GAME_TITLES = {
  1: 'Zvučna Zagonetka',
  2: 'Kamo je nestao listić?',
  3: 'Eko-Čistač',
  4: 'Šumska Slagalica',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('START');
  const [activeGameId, setActiveGameId]   = useState(null);
  const [stars, setStars]                 = useState(0);
  const [showConfetti, setShowConfetti]   = useState(false);
  const [savedStats, setSavedStats]       = useState(() => loadStats());
  const [difficulty, setDifficulty]       = useState('easy');

  // Session-only: which games were completed (no persistence needed)
  const [gamesCompleted, setGamesCompleted] = useState(new Set());
  const [badgeToast, setBadgeToast]         = useState(null);

  const gamesPlayedRef    = useRef(new Set());
  const activeGameIdRef   = useRef(null);
  const shownBadgesRef    = useRef(new Set()); // prevents showing same badge twice
  const badgeQueueRef     = useRef([]);         // queue for multiple badges at once
  const badgeTimerRef     = useRef(null);

  const [settings, setSettings] = useState({
    highContrast: false,
    largeFont: true,
    autoVoice: true,
  });

  // Keep activeGameId ref in sync
  activeGameIdRef.current = activeGameId;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.highContrast ? 'dark' : 'light');
  }, [settings.highContrast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-fontsize', settings.largeFont ? 'xl' : 'base');
  }, [settings.largeFont]);

  function toggleSetting(key) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function navigateTo(screen, gameId = null) {
    stopSpeaking();
    setCurrentScreen(screen);
    setActiveGameId(gameId);
    if (gameId) gamesPlayedRef.current.add(gameId);
  }

  // ── Show badge toasts (queue one at a time) ────────────────────────────────
  function showNextBadge() {
    if (badgeQueueRef.current.length === 0) return;
    const next = badgeQueueRef.current.shift();
    setBadgeToast(next);
    badgeTimerRef.current = setTimeout(() => {
      setBadgeToast(null);
      // Small gap between consecutive toasts
      setTimeout(showNextBadge, 400);
    }, 3000);
  }

  function triggerNewBadges(newGamesCompleted, newStars) {
    const earned = computeBadges(newGamesCompleted, newStars);
    const fresh  = earned.filter((id) => !shownBadgesRef.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => shownBadgesRef.current.add(id));
    const objects = getBadgeObjects(fresh);
    badgeQueueRef.current.push(...objects);
    // Only start the queue if nothing is currently showing
    if (!badgeTimerRef.current || badgeToast === null) showNextBadge();
  }

  // ── Stars ──────────────────────────────────────────────────────────────────
  const addStar = useCallback(() => {
    setStars((s) => {
      const next = s + 1;
      // Check star-threshold badges whenever stars change
      // (gamesCompleted checked via ref below)
      return next;
    });
    sfxStar();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  }, []);

  // Trigger badge check whenever stars change
  useEffect(() => {
    if (stars === 0) return;
    triggerNewBadges(gamesCompleted, stars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars]);

  // EkoCistac: earn star + sound but no confetti (confetti distracts during gameplay)
  const addStarQuiet = useCallback(() => {
    setStars((s) => s + 1);
    sfxStar();
  }, []);

  // ── Game finish ────────────────────────────────────────────────────────────
  const handleGameFinish = useCallback(() => {
    const gameId = activeGameIdRef.current;
    setGamesCompleted((prev) => {
      const next = new Set(prev);
      next.add(gameId);
      // Trigger badge check with updated set
      setTimeout(() => triggerNewBadges(next, stars), 200);
      return next;
    });
    navigateTo('GAME_SELECTOR');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars]);

  // ── End session ────────────────────────────────────────────────────────────
  function handleEnd() {
    const updated = recordSession(stars, [...gamesPlayedRef.current]);
    setSavedStats(updated);
    navigateTo('END');
  }

  // ── Restart (full reset — fresh for next child) ────────────────────────────
  function handleRestart() {
    setStars(0);
    setGamesCompleted(new Set());
    setBadgeToast(null);
    shownBadgesRef.current   = new Set();
    badgeQueueRef.current    = [];
    gamesPlayedRef.current   = new Set();
    clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current    = null;
    navigateTo('START');
  }

  // ── Render active game ─────────────────────────────────────────────────────
  function renderGame() {
    const props = {
      autoVoice: settings.autoVoice,
      onStar: addStar,
      onFinish: handleGameFinish,
      difficulty,
    };
    switch (activeGameId) {
      case 1: return <ZvucnaZagonetka {...props} />;
      case 2: return <KamoJeNestaoListic {...props} />;
      case 3: return <EkoCistac {...props} onStar={addStarQuiet} />;
      case 4: return <SumskaSlagalica {...props} />;
      default: return null;
    }
  }

  const sessionBadges = getBadgeObjects(computeBadges(gamesCompleted, stars));

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh]">
      <PametnaTraka settings={settings} onToggle={toggleSetting} stars={stars} />
      <Confetti active={showConfetti} />
      <BadgeToast badge={badgeToast} />

      {currentScreen === 'START' && (
        <StartScreen
          onStart={() => navigateTo('GAME_SELECTOR')}
          autoVoice={settings.autoVoice}
          totalStars={savedStats.totalStars}
        />
      )}

      {currentScreen === 'GAME_SELECTOR' && (
        <GameSelector
          onSelect={(id) => navigateTo('PLAYING_GAME', id)}
          autoVoice={settings.autoVoice}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          gamesCompleted={gamesCompleted}
        />
      )}

      {currentScreen === 'PLAYING_GAME' && activeGameId && (
        <GameWrapper
          title={GAME_TITLES[activeGameId]}
          onBack={() => navigateTo('GAME_SELECTOR')}
        >
          {renderGame()}
        </GameWrapper>
      )}

      {currentScreen === 'END' && (
        <EndScreen
          stars={stars}
          savedStats={savedStats}
          badges={sessionBadges}
          onRestart={handleRestart}
          autoVoice={settings.autoVoice}
        />
      )}

      {currentScreen === 'GAME_SELECTOR' && stars > 0 && (
        <div className="px-4 pb-6 flex justify-center">
          <button
            onClick={handleEnd}
            className="px-8 py-3 rounded-xl text-lg font-semibold border-2
              transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
              backgroundColor: 'transparent',
            }}
          >
            Završi i pogledaj rezultat
          </button>
        </div>
      )}
    </div>
  );
}
