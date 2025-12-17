import { useState, useEffect } from 'react';

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
  // Original themes
  emerald: {
    sidebarBg: 'from-emerald-900 to-emerald-800',
    sidebarText: 'text-emerald-100',
    menuActiveBg: 'bg-emerald-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-emerald-700/50',
    pageBg: 'bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950/20 dark:to-lime-950/20',
    accentColor: '#10b981',
  },
  // Gradient 01 - Orange/Yellow
  sunset: {
    sidebarBg: 'from-orange-500 to-amber-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    accentColor: '#f59e0b',
  },
  // Gradient 02 - Green/Teal
  ocean: {
    sidebarBg: 'from-emerald-500 to-teal-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
    accentColor: '#14b8a6',
  },
  // Gradient 03 - Pink/Magenta
  berry: {
    sidebarBg: 'from-pink-600 to-rose-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20',
    accentColor: '#ec4899',
  },
  // Gradient 04 - Blue
  sky: {
    sidebarBg: 'from-blue-600 to-sky-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20',
    accentColor: '#3b82f6',
  },
  // Gradient 05 - Purple/Violet
  grape: {
    sidebarBg: 'from-purple-700 to-violet-600',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
    accentColor: '#8b5cf6',
  },
  // Gradient 06 - Light Pink
  blush: {
    sidebarBg: 'from-pink-400 to-fuchsia-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20',
    accentColor: '#f472b6',
  },
  // Gradient 07 - Red
  cherry: {
    sidebarBg: 'from-red-600 to-red-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
    accentColor: '#ef4444',
  },
  // Gradient 08 - Gray/Silver
  slate: {
    sidebarBg: 'from-gray-500 to-slate-400',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-950/30 dark:to-slate-950/30',
    accentColor: '#64748b',
  },
  // Gradient 09 - Navy Blue
  navy: {
    sidebarBg: 'from-blue-900 to-indigo-800',
    sidebarText: 'text-blue-100',
    menuActiveBg: 'bg-blue-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-blue-700/50',
    pageBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
    accentColor: '#1e40af',
  },
  // Gradient 10 - Royal Blue
  royal: {
    sidebarBg: 'from-blue-700 to-blue-500',
    sidebarText: 'text-white',
    menuActiveBg: 'bg-white/30',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-white/20',
    pageBg: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20',
    accentColor: '#2563eb',
  },
  // Gradient 11 - Peach/Orange
  peach: {
    sidebarBg: 'from-orange-400 to-amber-300',
    sidebarText: 'text-orange-900',
    menuActiveBg: 'bg-white/40',
    menuActiveText: 'text-orange-900',
    menuHoverBg: 'hover:bg-white/30',
    pageBg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    accentColor: '#fb923c',
  },
  // Gradient 12 - Light Gray
  silver: {
    sidebarBg: 'from-gray-300 to-slate-200',
    sidebarText: 'text-gray-800',
    menuActiveBg: 'bg-gray-600',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-gray-400/50',
    pageBg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30',
    accentColor: '#9ca3af',
  },
};

export const useColorTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [theme, setTheme] = useState<ColorTheme>(defaultTheme);

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

  return {
    theme,
    currentTheme,
    selectTheme,
    presetThemes,
  };
};
