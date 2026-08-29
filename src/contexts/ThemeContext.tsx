import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeName = 'dark' | 'midnight' | 'amoled';

interface ThemeContextType {
  theme: ThemeName;
  accentColor: string;
  setTheme: (theme: ThemeName) => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [accentColor, setAccentColorState] = useState<string>('#7c3aed');

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('kiku-theme') as ThemeName;
    const savedAccent = localStorage.getItem('kiku-accent');

    if (savedTheme) setThemeState(savedTheme);
    if (savedAccent) setAccentColorState(savedAccent);
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('kiku-theme', newTheme);
  };

  const setAccentColor = (newColor: string) => {
    setAccentColorState(newColor);
    localStorage.setItem('kiku-accent', newColor);
  };

  useEffect(() => {
    // Apply theme variables to document root
    const root = document.documentElement;

    // Apply accent color
    root.style.setProperty('--accent-primary', accentColor);
    
    // Create a secondary accent slightly brighter/different (simplified version)
    root.style.setProperty('--accent-secondary', accentColor);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accentColor}, #4f46e5)`);

    // Apply theme backgrounds
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#111128');
      root.style.setProperty('--bg-secondary', '#1a1a3e');
      root.style.setProperty('--bg-tertiary', '#25254b');
      root.style.setProperty('--bg-card', 'rgba(26, 26, 62, 0.7)');
    } else if (theme === 'midnight') {
      root.style.setProperty('--bg-primary', '#0a0a1a');
      root.style.setProperty('--bg-secondary', '#151530');
      root.style.setProperty('--bg-tertiary', '#1e1e40');
      root.style.setProperty('--bg-card', 'rgba(21, 21, 48, 0.7)');
    } else if (theme === 'amoled') {
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#0a0a0a');
      root.style.setProperty('--bg-tertiary', '#141414');
      root.style.setProperty('--bg-card', 'rgba(10, 10, 10, 0.7)');
    }
  }, [theme, accentColor]);

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
