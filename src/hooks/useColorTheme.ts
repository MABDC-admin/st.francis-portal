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
  emerald: {
    sidebarBg: 'from-emerald-900 to-emerald-800',
    sidebarText: 'text-emerald-100',
    menuActiveBg: 'bg-emerald-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-emerald-700/50',
    pageBg: 'bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950/20 dark:to-lime-950/20',
    accentColor: '#10b981',
  },
  blue: {
    sidebarBg: 'from-blue-900 to-indigo-800',
    sidebarText: 'text-blue-100',
    menuActiveBg: 'bg-blue-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-blue-700/50',
    pageBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
    accentColor: '#3b82f6',
  },
  purple: {
    sidebarBg: 'from-purple-900 to-violet-800',
    sidebarText: 'text-purple-100',
    menuActiveBg: 'bg-purple-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-purple-700/50',
    pageBg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
    accentColor: '#8b5cf6',
  },
  rose: {
    sidebarBg: 'from-rose-900 to-pink-800',
    sidebarText: 'text-rose-100',
    menuActiveBg: 'bg-rose-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-rose-700/50',
    pageBg: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20',
    accentColor: '#f43f5e',
  },
  amber: {
    sidebarBg: 'from-amber-900 to-orange-800',
    sidebarText: 'text-amber-100',
    menuActiveBg: 'bg-amber-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-amber-700/50',
    pageBg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
    accentColor: '#f59e0b',
  },
  slate: {
    sidebarBg: 'from-slate-900 to-slate-800',
    sidebarText: 'text-slate-100',
    menuActiveBg: 'bg-slate-600',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-slate-700/50',
    pageBg: 'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-950/30 dark:to-gray-950/30',
    accentColor: '#64748b',
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
