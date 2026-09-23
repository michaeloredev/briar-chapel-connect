'use client';

import * as React from 'react';

export type Theme = 'light' | 'dark';

/** Runs before first paint in app/layout.tsx, so it cannot import from here. */
export const THEME_STORAGE_KEY = 'theme';

type ThemeContextValue = {
  theme: Theme;
  /** False until the effect has read the real theme off <html>. */
  ready: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: 'light',
  ready: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return React.useContext(ThemeContext);
}

function applyTheme(theme: Theme) {
  const classes = document.documentElement.classList;
  classes.toggle('dark', theme === 'dark');
  classes.toggle('light', theme === 'light');
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server cannot know the visitor's theme, so render as light and correct
  // on mount. Nothing flashes: the inline script already set the class, and the
  // toggle draws itself from that class rather than from this state.
  const [theme, setThemeState] = React.useState<Theme>('light');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setReady(true);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage: the choice still applies for this
      // page view, it just will not be remembered.
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
  }, [setTheme]);

  // Until a choice is stored, keep following the OS if it changes mid-session.
  React.useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');

    function onChange(event: MediaQueryListEvent) {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        // Unreadable storage means no stored choice to respect.
      }
      if (stored) return;

      const next: Theme = event.matches ? 'dark' : 'light';
      setThemeState(next);
      applyTheme(next);
    }

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const value = React.useMemo(
    () => ({ theme, ready, setTheme, toggleTheme }),
    [theme, ready, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
