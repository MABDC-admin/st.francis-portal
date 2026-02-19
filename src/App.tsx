import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ColorThemeProvider } from "@/contexts/ColorThemeContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import { DashboardLayoutProvider } from "@/contexts/DashboardLayoutContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import StudentProfile from "./pages/StudentProfile";
import Auth from "./pages/Auth";
import Attendance from "./pages/Attendance";
import { WeatherProvider } from "@/components/weather/WeatherContext";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import PublicRegistrationPage from "./pages/PublicRegistrationPage";
import PublicTeacherApplicationPage from "./pages/PublicTeacherApplicationPage";
import HelpdeskIndex from "./pages/Helpdesk";
import TicketDetail from "./pages/Helpdesk/TicketDetail";
import { ZoomRunner } from "./components/zoom/ZoomRunner";
import StudentAssignmentView from "./pages/student/StudentAssignmentView";
import { toast } from "sonner";

// --- Global error handler for React Query ---
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose raw Supabase/network errors to users
    if (error.message.includes('JWT')) return 'Your session has expired. Please log in again.';
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) return 'Network error. Please check your connection.';
    if (error.message.includes('duplicate key')) return 'This record already exists.';
    return error.message;
  }
  return 'An unexpected error occurred.';
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for queries that have already been loaded (background refetch failures)
      if (query.state.data !== undefined) {
        toast.error(`Background refresh failed: ${getErrorMessage(error)}`);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Mutations that don't have their own onError will use this
      toast.error(getErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,    // 30 seconds
      gcTime: 5 * 60_000,   // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Theme definitions matching SchoolSettings
const THEME_COLORS: Record<string, Record<string, string>> = {
  pastel: { primary: '142 40% 60%', secondary: '40 30% 97%', accent: '10 60% 80%' },
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SchoolProvider>
          <AcademicYearProvider>
            <DashboardLayoutProvider>
              <ColorThemeProvider>
                <AuthProvider>
                  <TooltipProvider>
                    <WeatherProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <Routes>
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/attendance" element={<Attendance />} />
                          <Route path="/" element={<Index />} />
                          <Route path="/library/book/:bookId" element={<Index />} />
                          <Route path="/student/:id" element={<StudentProfile />} />
                          <Route path="/student/:studentId/assignment/:assignmentId" element={<StudentAssignmentView />} />
                          <Route path="/admin/zoom-runner" element={<ZoomRunner />} />
                          <Route path="/install" element={<Install />} />
                          <Route path="/register" element={<PublicRegistrationPage />} />
                          <Route path="/apply" element={<PublicTeacherApplicationPage />} />
                          <Route path="/helpdesk" element={<HelpdeskIndex />} />
                          <Route path="/helpdesk/tickets/:ticketId" element={<TicketDetail />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </WeatherProvider>
                  </TooltipProvider>
                </AuthProvider>
              </ColorThemeProvider>
            </DashboardLayoutProvider>
          </AcademicYearProvider>
        </SchoolProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;