import { useTheme } from '../context/ThemeContext';

/**
 * Theme switch. Icon shows the mode you'll GET on click (sun while dark),
 * which is the convention users already read fastest, and the label/title
 * says it in words so it never depends on icon interpretation alone.
 */
export default function ThemeToggle({ size = 38 }) {
  const { theme, toggleTheme } = useTheme();
  const goingLight = theme === 'dark';
  const label = goingLight ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="tap-target"
      style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--glass-border)',
        background: 'var(--surface-2)',
        color: 'var(--accent-gold)',
        cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.18s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-tint)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: Math.round(size * 0.55) }}>
        {goingLight ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
