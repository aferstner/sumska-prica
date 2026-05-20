import { useEffect, useState } from 'react';

/**
 * Animated toast that slides in from the bottom when a badge is earned.
 * Pass a `badge` object to show it; null to hide.
 */
export default function BadgeToast({ badge }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!badge) { setVisible(false); return; }
    // Small delay so the CSS transition fires after mount
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [badge]);

  if (!badge) return null;

  return (
    <div
      className="fixed left-1/2 z-[9990] pointer-events-none
        flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl
        transition-all duration-500"
      style={{
        bottom: visible ? '2rem' : '-6rem',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--accent)',
        color: '#fff',
        minWidth: '240px',
        maxWidth: '90vw',
      }}
      role="status"
      aria-live="polite"
    >
      <span className="text-4xl" aria-hidden="true">{badge.icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
          Novi bedž!
        </p>
        <p className="text-lg font-extrabold leading-tight">{badge.title}</p>
        <p className="text-xs opacity-80">{badge.desc}</p>
      </div>
    </div>
  );
}
