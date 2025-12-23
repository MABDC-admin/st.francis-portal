import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ColorThemeProvider } from "@/contexts/ColorThemeContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import Index from "./pages/Index";
import StudentProfile from "./pages/StudentProfile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Theme definitions matching SchoolSettings
const THEME_COLORS: Record<string, Record<string, string>> = {
  default: { primary: '221 83% 53%', secondary: '210 40% 96%', accent: '210 40% 90%' },
  emerald: { primary: '160 84% 39%', secondary: '152 76% 95%', accent: '152 76% 90%' },
  violet: { primary: '263 70% 50%', secondary: '260 60% 96%', accent: '260 60% 90%' },
  amber: { primary: '38 92% 50%', secondary: '48 96% 95%', accent: '48 96% 90%' },
  rose: { primary: '350 89% 60%', secondary: '350 80% 96%', accent: '350 80% 90%' },
  cyan: { primary: '189 94% 43%', secondary: '185 90% 95%', accent: '185 90% 90%' },
  slate: { primary: '215 28% 17%', secondary: '210 40% 96%', accent: '210 40% 90%' },
  teal: { primary: '172 66% 50%', secondary: '166 76% 95%', accent: '166 76% 90%' },
  orange: { primary: '25 95% 53%', secondary: '30 90% 96%', accent: '30 90% 90%' },
  indigo: { primary: '239 84% 67%', secondary: '226 70% 96%', accent: '226 70% 90%' },
};

const App = () => {
  // Load saved theme on app startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && THEME_COLORS[savedTheme]) {
      const root = document.documentElement;
      Object.entries(THEME_COLORS[savedTheme]).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SchoolProvider>
        <AcademicYearProvider>
          <ColorThemeProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/student/:id" element={<StudentProfile />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </ColorThemeProvider>
        </AcademicYearProvider>
      </SchoolProvider>
    </QueryClientProvider>
  );
};

export default App;