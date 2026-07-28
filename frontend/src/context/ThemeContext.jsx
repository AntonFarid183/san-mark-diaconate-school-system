import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

// Read once, synchronously, so the very first paint already has the right
// theme — a flash of the wrong background on every load looks broken.
const initialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Drives the browser's own UI (form controls, scrollbars, autofill).
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Follow the OS only while the user hasn't made an explicit choice.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e) => setTheme(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Cross-fade only while switching. Leaving the transition on permanently
  // would make every ordinary hover feel laggy.
  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.clearTimeout(toggleTheme._t);
    toggleTheme._t = window.setTimeout(() => root.classList.remove('theme-transition'), 300);
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
