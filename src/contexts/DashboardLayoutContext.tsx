import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LayoutStyle = 'modern' | 'classicBlue' | 'apple';

export interface ClassicBlueTheme {
  pageBackground: {
    type: string;
    direction: string;
    colors: string[];
    cssValue: string;
  };
  cards: {
    backgroundColor: string;
    backdropBlur: string;
    borderRadius: string;
    boxShadow: string;
    border: string;
  };
  statsCards: {
    students: { backgroundColor: string; iconBg: string; textColor: string };
    teachers: { backgroundColor: string; iconBg: string; textColor: string };
    classes: { backgroundColor: string; iconBg: string; textColor: string };
    library: { backgroundColor: string; iconBg: string; textColor: string };
  };
  calendarHeader: {
    gradient: string;
    textColor: string;
    borderRadius: string;
  };
  quickActions: {
    backgroundColor: string;
    iconBgOpacity: string;
    borderRadius: string;
    boxShadow: string;
  };
  bottomActions: {
    backgroundColor: string;
    accentCardBg: string;
    borderRadius: string;
  };
  typography: {
    headerWeight: number;
    statNumberSize: string;
    labelSize: string;
  };
}

export interface AppleTheme {
  pageBackground: string;
  cards: {
    backgroundColor: string;
    borderRadius: string;
    boxShadow: string;
    border: string;
  };
  sidebar: {
    backgroundColor: string;
    backdropBlur: string;
    textColor: string;
  };
  accent: string;
  accentLight: string;
  statsColors: {
    green: string;
    blue: string;
    orange: string;
    red: string;
  };
}

interface DashboardLayoutContextType {
  layoutStyle: LayoutStyle;
  setLayoutStyle: (style: LayoutStyle) => void;
  classicTheme: ClassicBlueTheme | null;
  setClassicTheme: (theme: ClassicBlueTheme) => void;
  appleTheme: AppleTheme | null;
  isLoading: boolean;
}

const defaultClassicTheme: ClassicBlueTheme = {
  pageBackground: {
    type: "gradient",
    direction: "135deg",
    colors: ["#4F46E5", "#2563EB", "#0EA5E9"],
    cssValue: "linear-gradient(135deg, #4F46E5 0%, #2563EB 50%, #0EA5E9 100%)"
  },
  cards: {
    backgroundColor: "rgba(255,255,255,0.95)",
    backdropBlur: "12px",
    borderRadius: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    border: "1px solid rgba(255,255,255,0.3)"
  },
  statsCards: {
    students: { backgroundColor: "#22C55E", iconBg: "rgba(255,255,255,0.2)", textColor: "#FFFFFF" },
    teachers: { backgroundColor: "#3B82F6", iconBg: "rgba(255,255,255,0.2)", textColor: "#FFFFFF" },
    classes: { backgroundColor: "#EAB308", iconBg: "rgba(255,255,255,0.2)", textColor: "#FFFFFF" },
    library: { backgroundColor: "#EF4444", iconBg: "rgba(255,255,255,0.2)", textColor: "#FFFFFF" }
  },
  calendarHeader: {
    gradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
    textColor: "#FFFFFF",
    borderRadius: "16px 16px 0 0"
  },
  quickActions: {
    backgroundColor: "rgba(255,255,255,0.95)",
    iconBgOpacity: "0.1",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
  },
  bottomActions: {
    backgroundColor: "rgba(255,255,255,0.95)",
    accentCardBg: "#3B82F6",
    borderRadius: "16px"
  },
  typography: {
    headerWeight: 700,
    statNumberSize: "2rem",
    labelSize: "0.75rem"
  }
};

const defaultAppleTheme: AppleTheme = {
  pageBackground: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)",
  cards: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(0, 0, 0, 0.06)"
  },
  sidebar: {
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    backdropBlur: "20px",
    textColor: "#1d1d1f"
  },
  accent: "#007AFF",
  accentLight: "rgba(0, 122, 255, 0.1)",
  statsColors: {
    green: "#34C759",
    blue: "#007AFF",
    orange: "#FF9500",
    red: "#FF3B30"
  }
};

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

const STORAGE_KEY = 'dashboard-layout-style';
const THEME_STORAGE_KEY = 'dashboard-classic-theme';

export const DashboardLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layoutStyle, setLayoutStyleState] = useState<LayoutStyle>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as LayoutStyle) || 'modern';
  });

  const [classicTheme, setClassicThemeState] = useState<ClassicBlueTheme | null>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultClassicTheme;
      }
    }
    return defaultClassicTheme;
  });

  const [appleTheme] = useState<AppleTheme>(defaultAppleTheme);
  const [isLoading, setIsLoading] = useState(false);

  const setLayoutStyle = (style: LayoutStyle) => {
    setLayoutStyleState(style);
    localStorage.setItem(STORAGE_KEY, style);
  };

  const setClassicTheme = (theme: ClassicBlueTheme) => {
    setClassicThemeState(theme);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  };

  // Apply CSS variables when theme is active
  useEffect(() => {
    const root = document.documentElement;
    
    if (layoutStyle === 'classicBlue' && classicTheme) {
      root.style.setProperty('--classic-page-bg', classicTheme.pageBackground.cssValue);
      root.style.setProperty('--classic-card-bg', classicTheme.cards.backgroundColor);
      root.style.setProperty('--classic-card-blur', classicTheme.cards.backdropBlur);
      root.style.setProperty('--classic-card-shadow', classicTheme.cards.boxShadow);
      root.style.setProperty('--classic-card-radius', classicTheme.cards.borderRadius);
      root.style.setProperty('--classic-card-border', classicTheme.cards.border);
      root.style.setProperty('--classic-calendar-header', classicTheme.calendarHeader.gradient);
      root.style.setProperty('--classic-stat-green', classicTheme.statsCards.students.backgroundColor);
      root.style.setProperty('--classic-stat-blue', classicTheme.statsCards.teachers.backgroundColor);
      root.style.setProperty('--classic-stat-yellow', classicTheme.statsCards.classes.backgroundColor);
      root.style.setProperty('--classic-stat-red', classicTheme.statsCards.library.backgroundColor);
    }
    
    if (layoutStyle === 'apple' && appleTheme) {
      root.style.setProperty('--apple-page-bg', appleTheme.pageBackground);
      root.style.setProperty('--apple-card-bg', appleTheme.cards.backgroundColor);
      root.style.setProperty('--apple-card-radius', appleTheme.cards.borderRadius);
      root.style.setProperty('--apple-card-shadow', appleTheme.cards.boxShadow);
      root.style.setProperty('--apple-card-border', appleTheme.cards.border);
      root.style.setProperty('--apple-sidebar-bg', appleTheme.sidebar.backgroundColor);
      root.style.setProperty('--apple-sidebar-blur', appleTheme.sidebar.backdropBlur);
      root.style.setProperty('--apple-accent', appleTheme.accent);
      root.style.setProperty('--apple-accent-light', appleTheme.accentLight);
      root.style.setProperty('--apple-stat-green', appleTheme.statsColors.green);
      root.style.setProperty('--apple-stat-blue', appleTheme.statsColors.blue);
      root.style.setProperty('--apple-stat-orange', appleTheme.statsColors.orange);
      root.style.setProperty('--apple-stat-red', appleTheme.statsColors.red);
    }
  }, [layoutStyle, classicTheme, appleTheme]);

  return (
    <DashboardLayoutContext.Provider value={{ 
      layoutStyle, 
      setLayoutStyle, 
      classicTheme, 
      setClassicTheme,
      appleTheme,
      isLoading 
    }}>
      {children}
    </DashboardLayoutContext.Provider>
  );
};

export const useDashboardLayout = () => {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error('useDashboardLayout must be used within a DashboardLayoutProvider');
  }
  return context;
};
