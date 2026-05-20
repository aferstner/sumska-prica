import { useState, useEffect } from 'react';
import { stopSpeaking } from '../utils/tts';

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  const supported = !!document.documentElement.requestFullscreen;
  return { isFullscreen, toggle, supported };
}

export default function PametnaTraka({ settings, onToggle, stars }) {
  const { highContrast, largeFont, autoVoice } = settings;
  const { isFullscreen, toggle: toggleFullscreen, supported: fsSupported } = useFullscreen();

  function handleVoiceToggle() {
    if (autoVoice) stopSpeaking();
    onToggle('autoVoice');
  }

  return (
    <header
      className="sticky top-0 z-50 w-full px-4 py-2 flex items-center justify-between gap-3 border-b transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--card-border)' }}
    >
      <div
        className="flex items-center gap-2 text-sm font-semibold tracking-wide"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="text-lg" aria-hidden="true">🌲</span>
        <span className="hidden sm:inline">Šumska Priča</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
        <ToggleBtn
          label="🔊"
          ariaLabel={autoVoice ? 'Isključi automatski glas' : 'Uključi automatski glas'}
          active={autoVoice}
          onClick={handleVoiceToggle}
        />
        <ToggleBtn
          label={highContrast ? '☀️' : '🌙'}
          ariaLabel={highContrast ? 'Prebaci na svijetlu temu' : 'Prebaci na tamnu temu'}
          active={highContrast}
          onClick={() => onToggle('highContrast')}
        />
        <ToggleBtn
          label="Aa"
          ariaLabel={largeFont ? 'Smanji font' : 'Povećaj font'}
          active={largeFont}
          onClick={() => onToggle('largeFont')}
          isText
        />

        {/* Fullscreen toggle — shown only when API is supported */}
        {fsSupported && (
          <ToggleBtn
            label={isFullscreen ? '⛶' : '⛶'}
            ariaLabel={isFullscreen ? 'Izađi iz cijelog zaslona' : 'Cijeli zaslon'}
            active={isFullscreen}
            onClick={toggleFullscreen}
            isFullscreen
            isFullscreenActive={isFullscreen}
          />
        )}

        <div
          className="flex items-center gap-1 ml-1 px-3 py-1 rounded-full font-bold text-sm"
          style={{ backgroundColor: 'var(--card-bg)', color: 'var(--gold)' }}
          aria-label={`Ukupno zvjezdica: ${stars}`}
        >
          <span aria-hidden="true">⭐</span>
          <span>{stars}</span>
        </div>
      </div>
    </header>
  );
}

function ToggleBtn({ label, ariaLabel, active, onClick, isText = false, isFullscreen = false, isFullscreenActive = false }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`
        min-w-[44px] min-h-[44px] rounded-xl text-base font-semibold
        border-2 transition-all duration-200
        flex items-center justify-center
        ${active
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm'
          : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)]'
        }
      `}
    >
      {isFullscreen ? (
        /* Custom fullscreen icon using Unicode box-drawing */
        <svg
          width="18" height="18" viewBox="0 0 18 18" fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {isFullscreenActive ? (
            /* Compress icon */
            <>
              <path d="M6 2v4H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 16v-4H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          ) : (
            /* Expand icon */
            <>
              <path d="M2 6V2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 6V2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 12v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          )}
        </svg>
      ) : isText ? (
        <span className={active ? 'text-lg' : 'text-sm'}>{label}</span>
      ) : (
        <span className="text-lg">{label}</span>
      )}
    </button>
  );
}
