import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SchoolType = 'MABDC' | 'STFXSA';

interface SchoolTheme {
  name: string;
  fullName: string;
  sidebarBg: string;
  sidebarText: string;
  menuActiveBg: string;
  menuActiveText: string;
  menuHoverBg: string;
  pageBg: string;
  accentColor: string;
  primaryHue: string;
}

export const SCHOOL_THEMES: Record<SchoolType, SchoolTheme> = {
  MABDC: {
    name: 'MABDC',
    fullName: 'M.A Brain Development Center',
    sidebarBg: 'from-emerald-900 to-emerald-800',
    sidebarText: 'text-emerald-100',
    menuActiveBg: 'bg-emerald-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-emerald-700/50',
    pageBg: 'bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950/20 dark:to-lime-950/20',
    accentColor: '#10b981',
    primaryHue: '152',
  },
  STFXSA: {
    name: 'STFXSA',
    fullName: 'St. Francis Xavier Smart Academy Inc',
    sidebarBg: 'from-blue-900 to-indigo-800',
    sidebarText: 'text-blue-100',
    menuActiveBg: 'bg-blue-500',
    menuActiveText: 'text-white',
    menuHoverBg: 'hover:bg-blue-700/50',
    pageBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
    accentColor: '#3b82f6',
    primaryHue: '217',
  },
};

interface SchoolContextType {
  selectedSchool: SchoolType;
  setSelectedSchool: (school: SchoolType) => void;
  schoolTheme: SchoolTheme;
  canSwitchSchool: boolean;
  setCanSwitchSchool: (can: boolean) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSchool, setSelectedSchoolState] = useState<SchoolType>(() => {
    const saved = localStorage.getItem('selected-school');
    return (saved as SchoolType) || 'MABDC';
  });
  const [canSwitchSchool, setCanSwitchSchool] = useState(false);

  const setSelectedSchool = (school: SchoolType) => {
    setSelectedSchoolState(school);
    localStorage.setItem('selected-school', school);
  };

  const schoolTheme = SCHOOL_THEMES[selectedSchool];

  return (
    <SchoolContext.Provider value={{ 
      selectedSchool, 
      setSelectedSchool, 
      schoolTheme,
      canSwitchSchool,
      setCanSwitchSchool
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
