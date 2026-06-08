import { useState, useEffect, useCallback, useRef } from 'react';
import { speak } from '../../utils/tts';
import { sfxCorrect, sfxWrong } from '../../utils/sfx';
import ProgressBar from '../ProgressBar';
import TimerBar from '../TimerBar';

const LETTER_HINT = {
  'A': 'auto',    'O': 'oko',
  'M': 'mama',    'K': 'kuća',
  'S': 'sunce',   'L': 'lopta',
  'T': 'tata',    'N': 'nos',
  'R': 'riba',    'E': 'evo',
  'I': 'igra',    'U': 'uho',
  'V': 'voda',    'P': 'pas',
  'G': 'gora',    'H': 'hlače',
  'C': 'cesta',   'Z': 'zima',
  'J': 'jabuka',  'D': 'drvo',
  'F': 'foto',
  // Lowercase confusables (dyslexia)
  'b': 'brod',    'd': 'drvo',
  'p': 'pas',
  'n': 'nos',     'm': 'more',
  'u': 'uho',
};

// Each round has easy_options (3) and hard_options (4)
const ALL_ROUNDS = [
  // ── Level 1 — clear distinct uppercase letters ──────────────────────────
  { target: 'A', level: 1, easy: ['A','O','M'],     hard: ['A','O','M','E'] },
  { target: 'K', level: 1, easy: ['K','L','S'],     hard: ['K','L','S','T'] },
  { target: 'T', level: 1, easy: ['T','N','R'],     hard: ['T','N','R','L'] },
  { target: 'M', level: 1, easy: ['M','K','R'],     hard: ['M','K','R','N'] },
  { target: 'S', level: 1, easy: ['S','L','T'],     hard: ['S','L','T','Z'] },
  { target: 'O', level: 1, easy: ['O','A','E'],     hard: ['O','A','E','C'] },
  { target: 'R', level: 1, easy: ['R','N','M'],     hard: ['R','N','M','V'] },
  { target: 'E', level: 1, easy: ['E','A','I'],     hard: ['E','A','I','O'] },
  { target: 'I', level: 1, easy: ['I','L','T'],     hard: ['I','L','T','J'] },
  { target: 'V', level: 1, easy: ['V','U','N'],     hard: ['V','U','N','M'] },
  { target: 'P', level: 1, easy: ['P','F','B'],     hard: ['P','F','B','D'] },
  { target: 'G', level: 1, easy: ['G','C','O'],     hard: ['G','C','O','D'] },
  { target: 'H', level: 1, easy: ['H','K','N'],     hard: ['H','K','N','M'] },
  { target: 'C', level: 1, easy: ['C','G','O'],     hard: ['C','G','O','D'] },
  { target: 'Z', level: 1, easy: ['Z','S','N'],     hard: ['Z','S','N','V'] },
  { target: 'J', level: 1, easy: ['J','I','L'],     hard: ['J','I','L','T'] },
  { target: 'D', level: 1, easy: ['D','B','P'],     hard: ['D','B','P','R'] },
  { target: 'L', level: 1, easy: ['L','I','T'],     hard: ['L','I','T','J'] },
  // ── Level 2 — lowercase confusables (dyslexia-focused) ──────────────────
  { target: 'b', level: 2, easy: ['b','d','p'],     hard: ['b','d','p','g'] },
  { target: 'd', level: 2, easy: ['d','b','p'],     hard: ['d','b','p','g'] },
  { target: 'p', level: 2, easy: ['p','b','d'],     hard: ['p','b','d','g'] },
  { target: 'n', level: 2, easy: ['n','m','u'],     hard: ['n','m','u','v'] },
  { target: 'm', level: 2, easy: ['m','n','u'],     hard: ['m','n','u','w'] },
  { target: 'u', level: 2, easy: ['u','n','m'],     hard: ['u','n','m','v'] },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRounds(difficulty) {
  if (difficulty === 'hard') {
    // 5 level-1 rounds + 3 level-2 rounds = 8 total
    const l1 = shuffle(ALL_ROUNDS.filter((r) => r.level === 1)).slice(0, 5);
    const l2 = shuffle(ALL_ROUNDS.filter((r) => r.level === 2)).slice(0, 3);
    return shuffle([...l1, ...l2]);
  }
  // Easy: 4 level-1 + 2 level-2 = 6 total (only clearly distinct letters)
  const l1 = shuffle(ALL_ROUNDS.filter((r) => r.level === 1)).slice(0, 4);
  const l2 = shuffle(ALL_ROUNDS.filter((r) => r.level === 2)).slice(0, 2);
  return [...l1, ...l2];
}

const TIMER_SECONDS = 15;

export default function ZvucnaZagonetka({ autoVoice, onStar, onFinish, difficulty }) {
  const [rounds]                     = useState(() => pickRounds(difficulty));
  const [roundIdx, setRoundIdx]      = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [feedback, setFeedback]      = useState(null); // null | 'correct' | 'wrong'
  const [selectedLetter, setSelectedLetter]   = useState(null);
  const [timedOut, setTimedOut]      = useState(false);
  const errorsRef                    = useRef(0);
  const isHard                       = difficulty === 'hard';

  const round      = rounds[roundIdx];
  const isLastRound = roundIdx >= rounds.length - 1;
  const options    = round ? (isHard ? round.hard : round.easy) : [];

  const speakInstruction = useCallback(() => {
    if (!round) return;
    const hint = LETTER_HINT[round.target] || round.target;
    speak(`Stisni na prvo slovo u riječi ${hint}!`);
  }, [round]);

  useEffect(() => {
    if (!round) return;
    setShuffledOptions(shuffle(options));
    setFeedback(null);
    setSelectedLetter(null);
    setTimedOut(false);
    errorsRef.current = 0;
    if (autoVoice) {
      const t = setTimeout(() => speakInstruction(), 400);
      return () => clearTimeout(t);
    }
  }, [roundIdx, autoVoice, round, speakInstruction, options]);

  function advance() {
    if (isLastRound) onFinish();
    else setRoundIdx((i) => i + 1);
  }

  function handleTimeout() {
    if (feedback) return;
    setTimedOut(true);
    if (autoVoice) speak('Vrijeme je isteklo! Idemo dalje.');
    setTimeout(advance, 1400);
  }

  function handleChoice(letter) {
    if (feedback || timedOut) return;
    setSelectedLetter(letter);

    if (letter === round.target) {
      setFeedback('correct');
      sfxCorrect();
      onStar();
      if (autoVoice) speak('Bravo! Točno!');
      setTimeout(advance, 1200);
    } else {
      setFeedback('wrong');
      sfxWrong();
      errorsRef.current += 1;
      if (autoVoice) {
        const hint = LETTER_HINT[round.target] || round.target;
        speak(errorsRef.current >= 2 ? `Pokušaj ponovo! Traži prvo slovo u ${hint}!` : 'Pokušaj ponovo!');
      }
      setTimeout(() => {
        setFeedback(null);
        setSelectedLetter(null);
      }, 900);
    }
  }

  if (!round) return null;

  // Button size: slightly smaller when 4 options
  const btnSize = options.length >= 4
    ? 'w-20 h-20 sm:w-28 sm:h-28 text-3xl sm:text-4xl'
    : 'w-24 h-24 sm:w-32 sm:h-32 text-4xl sm:text-5xl';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 animate-fade-in">
      <div className="text-center space-y-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Razina {round.level} — Krug {roundIdx + 1}/{rounds.length}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Pronađi slovo!
        </h2>
      </div>

      <ProgressBar current={roundIdx + 1} total={rounds.length} />

      {isHard && !feedback && !timedOut && (
        <TimerBar key={roundIdx} seconds={TIMER_SECONDS} onTimeout={handleTimeout} />
      )}

      {timedOut && (
        <p className="text-xl font-semibold animate-fade-in" style={{ color: 'var(--coral)' }}>
          ⏰ Vrijeme je isteklo!
        </p>
      )}

      <button
        onClick={speakInstruction}
        className="flex items-center gap-3 px-6 py-4 rounded-xl border-2
          text-xl font-semibold transition-all duration-200
          hover:scale-105 active:scale-95"
        style={{
          borderColor: 'var(--accent)',
          backgroundColor: 'var(--card-bg)',
          color: 'var(--accent)',
        }}
        aria-label="Poslušaj uputu"
      >
        <span className="text-3xl" aria-hidden="true">🔊</span>
        Poslušaj
      </button>

      <div className="flex gap-3 sm:gap-5 flex-wrap justify-center">
        {shuffledOptions.map((letter) => {
          const isSelected = selectedLetter === letter;
          let btnStyle = {
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)',
          };
          if (isSelected && feedback === 'correct') btnStyle = { backgroundColor: 'var(--success)', borderColor: 'var(--success)', color: '#fff' };
          if (isSelected && feedback === 'wrong')   btnStyle = { backgroundColor: 'var(--coral)',   borderColor: 'var(--coral)',   color: '#fff' };

          return (
            <button
              key={letter}
              onClick={() => handleChoice(letter)}
              disabled={!!feedback || timedOut}
              className={`
                ${btnSize} rounded-2xl font-bold
                transition-all duration-200
                hover:scale-105 active:scale-95
                shadow-md hover:shadow-lg
                ${isSelected && feedback === 'wrong'   ? 'animate-shake' : ''}
                ${isSelected && feedback === 'correct' ? 'animate-bounce-in' : ''}
              `}
              style={{ ...btnStyle, borderWidth: '3px', borderStyle: 'solid' }}
              aria-label={`Slovo ${letter}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {feedback === 'correct' && (
        <p className="text-2xl font-bold animate-bounce-in" style={{ color: 'var(--success)' }}>⭐ Točno!</p>
      )}
      {feedback === 'wrong' && (
        <p className="text-xl font-semibold animate-fade-in" style={{ color: 'var(--coral)' }}>
          {errorsRef.current >= 2 ? 'Još jednom, polako!' : 'Pokušaj ponovo!'}
        </p>
      )}
    </div>
  );
}
