import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ColorTheme {
  sidebarBg: string;
  sidebarText: string;
  menuActiveBg: string;
  menuActiveText: string;
  menuHoverBg: string;
  pageBg: string;
  accentColor: string;
}

const defaultTheme: ColorTheme = {
  sidebarBg: '',
  sidebarText: '',
  menuActiveBg: '',
  menuActiveText: '',
  menuHoverBg: '',
  pageBg: '',
  accentColor: '',
};

const presetThemes: Record<string, ColorTheme> = {
  default: defaultTheme,
  emerald: {
    sidebarBg: 'from-emerald-900 to-emerald-800',
    sidebarText: 'text-emerald-100',
    menuActiveBg: 'bg-emerald-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-emerald-700/50',
    pageBg: 'bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950/20 dark:to-lime-950/20',
    accentColor: '#10b981',
  },
  sunset: {
    sidebarBg: 'from-orange-500 to-amber-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    accentColor: '#f59e0b',
  },
  ocean: {
    sidebarBg: 'from-emerald-500 to-teal-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
    accentColor: '#14b8a6',
  },
  berry: {
    sidebarBg: 'from-pink-600 to-rose-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20',
    accentColor: '#ec4899',
  },
  sky: {
    sidebarBg: 'from-blue-600 to-sky-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20',
    accentColor: '#3b82f6',
  },
  grape: {
    sidebarBg: 'from-purple-700 to-violet-600',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
    accentColor: '#8b5cf6',
  },
  blush: {
    sidebarBg: 'from-pink-400 to-fuchsia-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20',
    accentColor: '#f472b6',
  },
  cherry: {
    sidebarBg: 'from-red-600 to-red-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
    accentColor: '#ef4444',
  },
  slate: {
    sidebarBg: 'from-gray-500 to-slate-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-950/30 dark:to-slate-950/30',
    accentColor: '#64748b',
  },
  navy: {
    sidebarBg: 'from-blue-900 to-indigo-800',
    sidebarText: 'text-blue-100',
    menuActiveBg: 'bg-blue-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-blue-700/50',
    pageBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
    accentColor: '#1e40af',
  },
  royal: {
    sidebarBg: 'from-blue-700 to-blue-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20',
    accentColor: '#2563eb',
  },
  peach: {
    sidebarBg: 'from-orange-400 to-amber-300',
    sidebarText: 'text-orange-900',
    menuActiveBg: 'bg-white/40',
    menuActiveText: 'text-orange-900',
    menuHoverBg: 'hover:bg-white/30',
    pageBg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    accentColor: '#fb923c',
  },
  silver: {
    sidebarBg: 'from-gray-300 to-slate-200',
    sidebarText: 'text-gray-800',
    menuActiveBg: 'bg-gray-600',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-gray-400/50',
    pageBg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30',
    accentColor: '#9ca3af',
  },
  aurora: {
    sidebarBg: 'from-emerald-600 via-teal-600 to-cyan-700',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/20',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/10',
    pageBg: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20',
    accentColor: '#10b981',
  },
  cosmic: {
    sidebarBg: 'from-indigo-700 via-purple-700 to-pink-600',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/20',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/10',
    pageBg: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20',
    accentColor: '#8b5cf6',
  },
  sunrise: {
    sidebarBg: 'from-amber-500 via-orange-600 to-rose-600',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/20',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/10',
    pageBg: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20',
    accentColor: '#f59e0b',
  },
  oceania: {
    sidebarBg: 'from-cyan-600 via-blue-600 to-indigo-700',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/20',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/10',
    pageBg: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-indigo-950/20',
    accentColor: '#3b82f6',
  },
  paradise: {
    sidebarBg: 'from-teal-600 via-emerald-600 to-lime-600',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/20',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/10',
    pageBg: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-teal-50 via-emerald-50 to-lime-50 dark:from-teal-950/20 dark:via-emerald-950/20 dark:to-lime-950/20',
    accentColor: '#14b8a6',
  },
};

interface ColorThemeContextType {
  theme: ColorTheme;
  currentTheme: string;
  selectTheme: (themeName: string) => void;
  presetThemes: Record<string, ColorTheme>;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export const ColorThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<string>('aurora');
  const [theme, setTheme] = useState<ColorTheme>(presetThemes['aurora']);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-color-theme');
    if (savedTheme && presetThemes[savedTheme]) {
      setCurrentTheme(savedTheme);
      setTheme(presetThemes[savedTheme]);
    }
  }, []);

  const selectTheme = (themeName: string) => {
    if (presetThemes[themeName]) {
      setCurrentTheme(themeName);
      setTheme(presetThemes[themeName]);
      localStorage.setItem('app-color-theme', themeName);
    }
  };

  return (
    <ColorThemeContext.Provider value={{ theme, currentTheme, selectTheme, presetThemes }}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
};
