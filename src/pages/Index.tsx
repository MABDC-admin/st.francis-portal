import { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, UserPlus, BookUser, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Charts } from '@/components/dashboard/Charts';
import { GlobalStudentSearch } from '@/components/dashboard/GlobalStudentSearch';
import { StudentProfileModal } from '@/components/students/StudentProfileModal';
import { StudentFormModal } from '@/components/students/StudentFormModal';
import { DeleteConfirmModal } from '@/components/students/DeleteConfirmModal';
import { AdminPinModal } from '@/components/admin/AdminPinModal';
import { Button } from '@/components/ui/button';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { Student, StudentFormData } from '@/types/student';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';

// --- Lazy-loaded tab components (code splitting) ---
const TeacherStudentsView = lazy(() => import('@/components/students/TeacherStudentsView').then(m => ({ default: m.TeacherStudentsView })));
const CSVImport = lazy(() => import('@/components/import/CSVImport').then(m => ({ default: m.CSVImport })));
const EnrollmentWizard = lazy(() => import('@/components/enrollment/EnrollmentWizard').then(m => ({ default: m.EnrollmentWizard })));
const AdminPanel = lazy(() => import('@/components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

// Portal Components
const AdminPortal = lazy(() => import('@/components/portals/AdminPortal').then(m => ({ default: m.AdminPortal })));
const RegistrarPortal = lazy(() => import('@/components/portals/RegistrarPortal').then(m => ({ default: m.RegistrarPortal })));
const TeacherPortal = lazy(() => import('@/components/portals/TeacherPortal').then(m => ({ default: m.TeacherPortal })));
const StudentPortal = lazy(() => import('@/components/portals/StudentPortal').then(m => ({ default: m.StudentPortal })));
const ParentPortal = lazy(() => import('@/components/portals/ParentPortal').then(m => ({ default: m.ParentPortal })));
const PrincipalPortal = lazy(() => import('@/components/portals/PrincipalPortal').then(m => ({ default: m.PrincipalPortal })));
const ITPortal = lazy(() => import('@/components/portals/ITPortal').then(m => ({ default: m.ITPortal })));
const TeacherManagement = lazy(() => import('@/components/teachers/TeacherManagement').then(m => ({ default: m.TeacherManagement })));
const TeacherCSVImport = lazy(() => import('@/components/teachers/TeacherCSVImport').then(m => ({ default: m.TeacherCSVImport })));

// Curriculum Components
const SubjectManagement = lazy(() => import('@/components/curriculum/SubjectManagement').then(m => ({ default: m.SubjectManagement })));
const AcademicYearManagement = lazy(() => import('@/components/curriculum/AcademicYearManagement').then(m => ({ default: m.AcademicYearManagement })));
const EnrollmentManagement = lazy(() => import('@/components/curriculum/EnrollmentManagement').then(m => ({ default: m.EnrollmentManagement })));

// Grades and Reports
const GradesManagement = lazy(() => import('@/components/grades/GradesManagement').then(m => ({ default: m.GradesManagement })));
const ReportsHub = lazy(() => import('@/components/reports/ReportsHub').then(m => ({ default: m.ReportsHub })));
const EventsManagement = lazy(() => import('@/components/calendar/EventsManagement').then(m => ({ default: m.EventsManagement })));

// Library, Canva, Notebook, AI Chat, LIS, Messaging, Zoom
const LibraryPage = lazy(() => import('@/components/library/LibraryPage').then(m => ({ default: m.LibraryPage })));
const CanvaStudio = lazy(() => import('@/components/canva/CanvaStudio').then(m => ({ default: m.CanvaStudio })));
const NotebookPage = lazy(() => import('@/components/notebook/NotebookPage').then(m => ({ default: m.NotebookPage })));
const AIChatPage = lazy(() => import('@/components/aichat/AIChatPage').then(m => ({ default: m.AIChatPage })));
const LISPage = lazy(() => import('@/components/lis/LISPage').then(m => ({ default: m.LISPage })));
const MessagingPage = lazy(() => import('@/components/messaging/MessagingPage').then(m => ({ default: m.MessagingPage })));
const ZoomDashboard = lazy(() => import('@/components/zoom/ZoomDashboard').then(m => ({ default: m.ZoomDashboard })));

// Docker App Integrations
const NocoDBDashboard = lazy(() => import('@/components/nocodb/NocoDBDashboard').then(m => ({ default: m.NocoDBDashboard })));
const GoogleDocsDashboard = lazy(() => import('@/components/googledocs/GoogleDocsDashboard').then(m => ({ default: m.GoogleDocsDashboard })));
const ExcalidrawDashboard = lazy(() => import('@/components/excalidraw/ExcalidrawDashboard').then(m => ({ default: m.ExcalidrawDashboard })));
const OmadaDashboard = lazy(() => import('@/components/omada/OmadaDashboard').then(m => ({ default: m.OmadaDashboard })));
const TacticalRMMDashboard = lazy(() => import('@/components/tacticalrmm/TacticalRMMDashboard').then(m => ({ default: m.TacticalRMMDashboard })));
const DocumizeDashboard = lazy(() => import('@/components/documize/DocumizeDashboard').then(m => ({ default: m.DocumizeDashboard })));
const ImpersonatePage = lazy(() => import('@/components/admin/ImpersonatePage').then(m => ({ default: m.ImpersonatePage })));

// Management CRUD Components
const AttendanceManagement = lazy(() => import('@/components/management').then(m => ({ default: m.AttendanceManagement })));
const ScheduleManagement = lazy(() => import('@/components/management').then(m => ({ default: m.ScheduleManagement })));
const AssignmentManagement = lazy(() => import('@/components/management').then(m => ({ default: m.AssignmentManagement })));
const ExamScheduleManagement = lazy(() => import('@/components/management').then(m => ({ default: m.ExamScheduleManagement })));
const AnnouncementManagement = lazy(() => import('@/components/management').then(m => ({ default: m.AnnouncementManagement })));
const BannerManagement = lazy(() => import('@/components/management').then(m => ({ default: m.BannerManagement })));

// Finance Components
const FinancePortal = lazy(() => import('@/components/finance/FinancePortal').then(m => ({ default: m.FinancePortal })));
const FeeSetup = lazy(() => import('@/components/finance/FeeSetup').then(m => ({ default: m.FeeSetup })));
const StudentAssessments = lazy(() => import('@/components/finance/StudentAssessments').then(m => ({ default: m.StudentAssessments })));
const PaymentCollection = lazy(() => import('@/components/finance/PaymentCollection').then(m => ({ default: m.PaymentCollection })));
const PaymentPlans = lazy(() => import('@/components/finance/PaymentPlans').then(m => ({ default: m.PaymentPlans })));
const StudentLedger = lazy(() => import('@/components/finance/StudentLedger').then(m => ({ default: m.StudentLedger })));
const DiscountScholarships = lazy(() => import('@/components/finance/DiscountScholarships').then(m => ({ default: m.DiscountScholarships })));
const FinanceClearance = lazy(() => import('@/components/finance/FinanceClearance').then(m => ({ default: m.FinanceClearance })));
const FinanceReports = lazy(() => import('@/components/finance/FinanceReports').then(m => ({ default: m.FinanceReports })));
const FinanceSettings = lazy(() => import('@/components/finance/FinanceSettings').then(m => ({ default: m.FinanceSettings })));
const FinanceAuditLogs = lazy(() => import('@/components/finance/FinanceAuditLogs').then(m => ({ default: m.FinanceAuditLogs })));
const YearEndClose = lazy(() => import('@/components/finance/YearEndClose').then(m => ({ default: m.YearEndClose })));
const FinanceLearnerPage = lazy(() => import('@/components/finance/FinanceLearnerPage').then(m => ({ default: m.FinanceLearnerPage })));
const FinanceBilling = lazy(() => import('@/components/finance/FinanceBilling').then(m => ({ default: m.FinanceBilling })));

// Other
const HelpdeskIndex = lazy(() => import('@/pages/Helpdesk'));
const AdmissionsPage = lazy(() => import('@/components/admissions/AdmissionsPage').then(m => ({ default: m.AdmissionsPage })));
const RegistrationManagement = lazy(() => import('@/components/registration/RegistrationManagement').then(m => ({ default: m.RegistrationManagement })));
const UserProfilePage = lazy(() => import('@/components/profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const TeacherApplicantDashboard = lazy(() => import('@/components/teacher-application/TeacherApplicantDashboard').then(m => ({ default: m.TeacherApplicantDashboard })));

// --- Suspense fallback ---
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookId } = useParams<{ bookId?: string }>();


  const { user, loading, role, session } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle Canva OAuth callback at page level
  const handleCanvaOAuthCallback = async (code: string, state: string) => {
    try {
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        toast.error('Session expired. Please log in and try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      toast.info('Completing Canva connection...');

      const { data: result, error } = await supabase.functions.invoke(`canva-auth?action=callback&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
        method: 'GET',
      });

      if (!error && result?.success) {
        toast.success('Successfully connected to Canva!');
        setActiveTab('canva'); // Navigate to Canva Studio
      } else {
        throw new Error(error?.message || result?.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('Canva OAuth callback error:', error);
      toast.error('Failed to complete Canva connection');
    } finally {
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Detect Canva OAuth callback parameters
  useEffect(() => {
    if (loading) return; // Wait for auth to complete
    if (!user) return; // Must be logged in

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      handleCanvaOAuthCallback(code, state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitialized = useRef(false);

  // Derive activeTab from URL query param — URL is the source of truth
  const defaultTab = role === 'finance' ? 'finance-reports' : 'portal';
  const activeTab = searchParams.get('tab') || defaultTab;

  // Set active tab by updating the URL (enables back/forward & deep links)
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: false });
  };

  // Handle initial navigation state and deep links
  useEffect(() => {
    if (!loading && user && role && !hasInitialized.current) {
      // If deep-linking to a book, go straight to library
      if (bookId) {
        setSearchParams({ tab: 'library' }, { replace: true });
        hasInitialized.current = true;
        return;
      }
      const state = location.state as { activeTab?: string } | null;
      if (state?.activeTab) {
        setSearchParams({ tab: state.activeTab }, { replace: true });
        navigate(location.pathname, { replace: true, state: {} });
      } else if (!searchParams.get('tab')) {
        // Only set default if no tab param exists in URL
        setSearchParams({ tab: defaultTab }, { replace: true });
      }
      hasInitialized.current = true;
    }
  }, [user, loading, role, location.state, navigate, location.pathname]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Admin state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false); // PIN re-enabled for security
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const { data: students = [], isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate stats (memoized to avoid re-filtering every render)
  const { totalStudents, maleCount, femaleCount, levels } = useMemo(() => ({
    totalStudents: students.length,
    maleCount: students.filter(s => s.gender?.toUpperCase() === 'MALE').length,
    femaleCount: students.filter(s => s.gender?.toUpperCase() === 'FEMALE').length,
    levels: [...new Set(students.map(s => s.level))].length,
  }), [students]);

  const handleTabChange = (tab: string) => {
    if (tab === 'admin' && !isAdminUnlocked) {
      setPendingTab(tab);
      setIsPinModalOpen(true);
    } else {
      setSearchParams({ tab }, { replace: false });
    }
  };

  const handleAdminUnlock = () => {
    setIsAdminUnlocked(true);
    setIsPinModalOpen(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleView = (student: Student) => {
    navigate(`/student/${student.id}`);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (data: StudentFormData & { id?: string }) => {
    if (data.id) {
      await updateStudent.mutateAsync(data as StudentFormData & { id: string });
    } else {
      await createStudent.mutateAsync(data);
    }
    setIsFormModalOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedStudent) {
      await deleteStudent.mutateAsync(selectedStudent.id);
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    }
  };

  // Render portal based on role
  const renderPortal = () => {
    switch (role) {
      case 'admin':
        return <AdminPortal onNavigate={handleTabChange} />;
      case 'registrar':
        return <RegistrarPortal onNavigate={handleTabChange} stats={{ totalStudents, pendingEnrollments: 0 }} />;
      case 'teacher':
        return <TeacherPortal onNavigate={handleTabChange} />;
      case 'student':
        return <StudentPortal activeSection="dashboard" onNavigate={handleTabChange} />;
      case 'parent':
        return <ParentPortal />;
      case 'finance':
        return <FinancePortal onNavigate={handleTabChange} />;
      case 'principal':
        return <PrincipalPortal onNavigate={handleTabChange} />;
      case 'it':
        return <ITPortal onNavigate={handleTabChange} />;
      default:
        return null;
    }
  };

  // Check if user has access to admin/registrar features
  const hasAdminAccess = role === 'admin' || role === 'registrar';
  const hasPrincipalAccess = role === 'principal';

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <Suspense fallback={<TabLoadingFallback />}>
        {/* Role-specific Portal Home */}
        {activeTab === 'portal' && renderPortal()}

        {/* Dashboard - Admin/Registrar only */}
        {activeTab === 'dashboard' && hasAdminAccess && (
          <SectionErrorBoundary>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
                  <p className="text-muted-foreground mt-1">Overview of learner records</p>
                </div>
                <GlobalStudentSearch />
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <StatsCard
                  title="Total Learners"
                  value={totalStudents}
                  subtitle="Enrolled learners"
                  icon={BookUser}
                  variant="purple"
                  delay={0}
                />
                <StatsCard
                  title="Male Learners"
                  value={maleCount}
                  subtitle={`${totalStudents ? ((maleCount / totalStudents) * 100).toFixed(1) : 0}% of total`}
                  icon={TrendingUp}
                  variant="purple"
                  delay={0.1}
                />
                <StatsCard
                  title="Female Learners"
                  value={femaleCount}
                  subtitle={`${totalStudents ? ((femaleCount / totalStudents) * 100).toFixed(1) : 0}% of total`}
                  icon={TrendingUp}
                  variant="purple"
                  delay={0.2}
                />
                <StatsCard
                  title="Grade Levels"
                  value={levels}
                  subtitle="Active levels"
                  icon={GraduationCap}
                  variant="green"
                  delay={0.3}
                />
              </div>

              <Charts students={students} />
            </div>
          </SectionErrorBoundary>
        )}

        {/* Enrollment - Admin/Registrar only */}
        {activeTab === 'enrollment' && hasAdminAccess && (
          <SectionErrorBoundary>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Enrollment</h1>
                <p className="text-muted-foreground mt-1">Enroll new learners</p>
              </motion.div>

              <EnrollmentWizard />
            </div>
          </SectionErrorBoundary>
        )}

        {/* Students - Admin/Registrar/Teacher */}
        {activeTab === 'students' && (hasAdminAccess || role === 'teacher' || role === 'principal') && (
          <SectionErrorBoundary>
            <TeacherStudentsView
              students={students}
              isLoading={isLoading}
              role={role}
              hasAdminAccess={hasAdminAccess}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddNew={handleAddNew}
            />
          </SectionErrorBoundary>
        )}

        {/* LIS - Admin/Registrar only */}
        {activeTab === 'lis' && hasAdminAccess && (
          <LISPage />
        )}

        {/* Import - Admin/Registrar only */}
        {activeTab === 'import' && hasAdminAccess && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Import Data</h1>
              <p className="text-muted-foreground mt-1">Bulk import learners from CSV files</p>
            </motion.div>

            <CSVImport />
          </div>
        )}

        {/* Teachers - Admin/Registrar only */}
        {activeTab === 'teachers' && (hasAdminAccess || role === 'principal') && (
          <TeacherManagement />
        )}

        {/* Teacher CSV Import - Admin/Registrar only */}
        {activeTab === 'teacher-import' && hasAdminAccess && (
          <TeacherCSVImport />
        )}

        {/* Teacher Portal Sections - Teacher only */}
        {activeTab === 'teacher-profile' && role === 'teacher' && (
          <TeacherPortal activeSection="profile" />
        )}
        {activeTab === 'teacher-grades' && role === 'teacher' && (
          <TeacherPortal activeSection="grades" />
        )}
        {activeTab === 'teacher-schedule' && role === 'teacher' && (
          <TeacherPortal activeSection="schedule" />
        )}

        {/* Subjects - Admin/Registrar only */}
        {activeTab === 'subjects' && hasAdminAccess && (
          <SubjectManagement />
        )}

        {/* Academic Years - Admin only */}
        {activeTab === 'academic-years' && role === 'admin' && (
          <AcademicYearManagement />
        )}

        {/* Subject Enrollment - Admin/Registrar only */}
        {activeTab === 'subject-enrollment' && hasAdminAccess && (
          <EnrollmentManagement />
        )}

        {/* Grades Management - Admin/Registrar/Teacher */}
        {activeTab === 'grades' && (role === 'admin' || role === 'registrar' || role === 'teacher' || role === 'principal') && (
          <SectionErrorBoundary>
            <GradesManagement />
          </SectionErrorBoundary>
        )}

        {/* Reports Hub - All authenticated users (RBAC inside) */}
        {activeTab === 'reports' && (
          <SectionErrorBoundary>
            <ReportsHub />
          </SectionErrorBoundary>
        )}

        {/* Events Management - Admin/Registrar only */}
        {activeTab === 'events' && (hasAdminAccess || role === 'principal') && (
          <EventsManagement />
        )}

        {/* Library - All authenticated users */}
        {activeTab === 'library' && (
          <LibraryPage deepLinkBookId={bookId} deepLinkPage={searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined} />
        )}

        {/* Canva Studio - Admin and Teacher only */}
        {activeTab === 'canva' && (role === 'admin' || role === 'teacher') && (
          <CanvaStudio />
        )}

        {/* Notebook LLM - Admin and Teacher only */}
        {activeTab === 'notebook' && (role === 'admin' || role === 'teacher') && (
          <NotebookPage />
        )}

        {/* Messages - Admin, Teacher, and Registrar */}
        {activeTab === 'messages' && (role === 'admin' || role === 'teacher' || role === 'registrar' || role === 'principal') && (
          <SectionErrorBoundary>
            <MessagingPage />
          </SectionErrorBoundary>
        )}

        {/* AI Chat - Admin, Teacher, Registrar, and IT */}
        {activeTab === 'ai-chat' && (role === 'admin' || role === 'teacher' || role === 'registrar' || role === 'it') && (
          <SectionErrorBoundary>
            <AIChatPage />
          </SectionErrorBoundary>
        )}


        {/* Admin Panel - Admin and IT */}
        {activeTab === 'admin' && (role === 'admin' || role === 'it') && isAdminUnlocked && (
          <SectionErrorBoundary>
            <AdminPanel />
          </SectionErrorBoundary>
        )}

        {/* Virtual Classes - Admin/Registrar/Teacher */}
        {activeTab === 'zoom' && (role === 'admin' || role === 'registrar' || role === 'teacher') && (
          <ZoomDashboard />
        )}

        {/* Student Portal Sections - Student only */}
        {activeTab === 'student-profile' && role === 'student' && (
          <StudentPortal activeSection="profile" />
        )}
        {activeTab === 'student-grades' && role === 'student' && (
          <StudentPortal activeSection="grades" />
        )}
        {activeTab === 'student-subjects' && role === 'student' && (
          <StudentPortal activeSection="subjects" />
        )}
        {activeTab === 'student-attendance' && role === 'student' && (
          <StudentPortal activeSection="attendance" />
        )}
        {activeTab === 'student-schedule' && role === 'student' && (
          <StudentPortal activeSection="schedule" />
        )}
        {activeTab === 'student-assignments' && role === 'student' && (
          <StudentPortal activeSection="assignments" />
        )}
        {activeTab === 'student-exams' && role === 'student' && (
          <StudentPortal activeSection="exams" />
        )}
        {activeTab === 'student-announcements' && role === 'student' && (
          <StudentPortal activeSection="announcements" onNavigate={handleTabChange} />
        )}
        {activeTab === 'student-calendar' && role === 'student' && (
          <StudentPortal activeSection="calendar" onNavigate={handleTabChange} />
        )}
        {activeTab === 'student-library' && role === 'student' && (
          <StudentPortal activeSection="library" />
        )}

        {/* Attendance Management - Admin/Registrar/Teacher */}
        {activeTab === 'attendance-mgmt' && (role === 'admin' || role === 'registrar' || role === 'teacher') && (
          <AttendanceManagement />
        )}

        {/* Schedule Management - Admin/Registrar */}
        {activeTab === 'schedule-mgmt' && hasAdminAccess && (
          <ScheduleManagement />
        )}

        {/* Assignment Management - Admin/Registrar/Teacher */}
        {activeTab === 'assignment-mgmt' && (role === 'admin' || role === 'registrar' || role === 'teacher') && (
          <AssignmentManagement />
        )}

        {/* Exam Schedule Management - Admin/Registrar/Teacher */}
        {activeTab === 'exam-mgmt' && (role === 'admin' || role === 'registrar' || role === 'teacher') && (
          <ExamScheduleManagement />
        )}

        {/* Docker App Integrations - Admin and IT */}
        {activeTab === 'nocodb' && (role === 'admin' || role === 'it') && <NocoDBDashboard />}
        {activeTab === 'onlyoffice' && (role === 'admin' || role === 'it') && <GoogleDocsDashboard />}
        {activeTab === 'excalidraw' && (role === 'admin' || role === 'it') && <ExcalidrawDashboard />}
        {activeTab === 'omada' && (role === 'admin' || role === 'it') && <OmadaDashboard />}
        {activeTab === 'tacticalrmm' && (role === 'admin' || role === 'it') && <TacticalRMMDashboard />}
        {activeTab === 'documize' && (role === 'admin' || role === 'it') && <DocumizeDashboard />}

        {/* Impersonate - Admin only */}
        {activeTab === 'impersonate' && role === 'admin' && <ImpersonatePage />}

        {/* Announcement Management - Admin/Registrar */}
        {activeTab === 'announcement-mgmt' && hasAdminAccess && (
          <AnnouncementManagement />
        )}

        {/* Finance Module Tabs */}
        {activeTab === 'fee-setup' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><FeeSetup /></SectionErrorBoundary>}
        {activeTab === 'assessments' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><StudentAssessments /></SectionErrorBoundary>}
        {activeTab === 'cashier' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><PaymentCollection /></SectionErrorBoundary>}
        {activeTab === 'payment-plans' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><PaymentPlans /></SectionErrorBoundary>}
        {activeTab === 'student-ledger' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><StudentLedger /></SectionErrorBoundary>}
        {activeTab === 'discount-scholarships' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><DiscountScholarships /></SectionErrorBoundary>}
        {activeTab === 'finance-clearance' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><FinanceClearance /></SectionErrorBoundary>}
        {activeTab === 'finance-reports' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><FinanceReports /></SectionErrorBoundary>}
        {activeTab === 'finance-settings' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><FinanceSettings /></SectionErrorBoundary>}
        {activeTab === 'year-end-close' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><YearEndClose /></SectionErrorBoundary>}
        {activeTab === 'finance-audit' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><FinanceAuditLogs /></SectionErrorBoundary>}
        {activeTab === 'finance-learners' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><FinanceLearnerPage /></SectionErrorBoundary>}
        {activeTab === 'billing' && (role === 'finance' || role === 'admin') && <SectionErrorBoundary><FinanceBilling /></SectionErrorBoundary>}

        {/* Helpdesk - All users */}
        {activeTab === 'helpdesk' && <HelpdeskIndex />}

        {/* Banner Management - Admin/Registrar only */}
        {activeTab === 'banner-management' && (role === 'admin' || role === 'registrar') && (
          <BannerManagement />
        )}

        {/* My Profile - All roles */}
        {activeTab === 'my-profile' && <UserProfilePage />}

        {/* Admissions - Admin/Registrar only */}
        {activeTab === 'admissions' && hasAdminAccess && <AdmissionsPage />}

        {/* Registrations - Admin/Registrar only */}
        {activeTab === 'registrations' && hasAdminAccess && <RegistrationManagement />}

        {/* Teacher Applicants - Admin/Registrar only */}
        {activeTab === 'applicants' && hasAdminAccess && <TeacherApplicantDashboard />}

        {/* Online Registration Form - Admin/Registrar only */}
        {activeTab === 'online-registration' && hasAdminAccess && (
          <div className="text-center py-12 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Online Registration Form</h2>
            <p className="text-muted-foreground">Share the link below with parents/guardians to register online.</p>
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
              <code className="text-sm text-primary">{window.location.origin}/register</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register`); toast.success('Link copied!'); }}>Copy</Button>
            </div>
            <div className="pt-2">
              <Button onClick={() => window.open('/register', '_blank')}>Open Registration Form</Button>
            </div>
          </div>
        )}

        {/* Modals */}
        <AdminPinModal
          isOpen={isPinModalOpen}
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingTab(null);
          }}
          onSuccess={handleAdminUnlock}
        />

        <StudentProfileModal
          student={selectedStudent}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedStudent(null);
          }}
        />

        <StudentFormModal
          student={editingStudent}
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingStudent(null);
          }}
          onSubmit={handleFormSubmit}
          isLoading={createStudent.isPending || updateStudent.isPending}
        />

        <DeleteConfirmModal
          student={selectedStudent}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedStudent(null);
          }}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteStudent.isPending}
        />
      </Suspense>
    </DashboardLayout>
  );
};

export default Index;
