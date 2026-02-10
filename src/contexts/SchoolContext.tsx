import { createContext, useContext, useState, ReactNode } from 'react';

export type SchoolType = 'STFXSA';

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
  schoolId: string;
  region: string;
  division: string;
  district: string;
}

export const SCHOOL_THEMES: Record<SchoolType, SchoolTheme> = {
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
    schoolId: '405678',
    region: 'Region III',
    division: 'Tarlac',
    district: 'Capas',
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
  const [selectedSchool] = useState<SchoolType>('STFXSA');

  // No-op since single school
  const setSelectedSchool = (_school: SchoolType) => {};

  const schoolTheme = SCHOOL_THEMES[selectedSchool];

  return (
    <SchoolContext.Provider value={{
      selectedSchool,
      setSelectedSchool,
      schoolTheme,
      canSwitchSchool: false,
      setCanSwitchSchool: () => {}
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
