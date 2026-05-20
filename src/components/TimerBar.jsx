import { useState, useEffect, useRef } from 'react';

/**
 * Countdown timer bar.
 * Use key={roundKey} on the parent to reset between rounds.
 * Turns red when < 30% remaining.
 * Calls onTimeout() exactly once when it hits 0.
 */
export default function TimerBar({ seconds, onTimeout, paused = false }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const firedRef     = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  // Reset when seconds prop changes (backup for when key-based reset isn't used)
  useEffect(() => {
    setTimeLeft(seconds);
    firedRef.current = false;
  }, [seconds]);

  useEffect(() => {
    if (paused || firedRef.current) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0 && !firedRef.current) {
          firedRef.current = true;
          clearInterval(id);
          onTimeoutRef.current?.();
        }
        return next;
      });
    }, 100);

    return () => clearInterval(id);
  }, [paused]);

  const pct   = (timeLeft / seconds) * 100;
  const isLow = pct < 30;

  return (
    <div className="w-full max-w-xs mx-auto px-4">
      <p
        className="text-xs font-bold text-center mb-1 transition-colors duration-300"
        style={{ color: isLow ? 'var(--coral)' : 'var(--text-secondary)' }}
      >
        ⏱ {Math.ceil(timeLeft)}s
      </p>
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
        role="progressbar"
        aria-valuenow={Math.ceil(timeLeft)}
        aria-valuemax={seconds}
        aria-label="Preostalo vrijeme"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: isLow ? 'var(--coral)' : 'var(--accent)',
            transition: 'width 0.1s linear, background-color 0.3s',
          }}
        />
      </div>
    </div>
  );
}
