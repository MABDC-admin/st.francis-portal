import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, UserPlus, BookUser } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Charts } from '@/components/dashboard/Charts';
import { GlobalStudentSearch } from '@/components/dashboard/GlobalStudentSearch';
import { StudentTable } from '@/components/students/StudentTable';
import { StudentProfileModal } from '@/components/students/StudentProfileModal';
import { StudentFormModal } from '@/components/students/StudentFormModal';
import { DeleteConfirmModal } from '@/components/students/DeleteConfirmModal';
import { CSVImport } from '@/components/import/CSVImport';
import { EnrollmentWizard } from '@/components/enrollment/EnrollmentWizard';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminPinModal } from '@/components/admin/AdminPinModal';
import { Button } from '@/components/ui/button';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { Student, StudentFormData } from '@/types/student';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Portal Components
import { AdminPortal } from '@/components/portals/AdminPortal';
import { RegistrarPortal } from '@/components/portals/RegistrarPortal';
import { TeacherPortal } from '@/components/portals/TeacherPortal';
import { StudentPortal } from '@/components/portals/StudentPortal';
import { ParentPortal } from '@/components/portals/ParentPortal';
import { TeacherManagement } from '@/components/teachers/TeacherManagement';
import { TeacherCSVImport } from '@/components/teachers/TeacherCSVImport';

// Curriculum Components
import { SubjectManagement } from '@/components/curriculum/SubjectManagement';
import { AcademicYearManagement } from '@/components/curriculum/AcademicYearManagement';
import { EnrollmentManagement } from '@/components/curriculum/EnrollmentManagement';

// Grades and Reports
import { GradesManagement } from '@/components/grades/GradesManagement';
import { ReportsHub } from '@/components/reports/ReportsHub';
import { EventsManagement } from '@/components/calendar/EventsManagement';

// Library
import { LibraryPage } from '@/components/library/LibraryPage';

// Canva
import { CanvaStudio } from '@/components/canva/CanvaStudio';

// Notebook LLM
import { NotebookPage } from '@/components/notebook/NotebookPage';

// AI Chat
import { AIChatPage } from '@/components/aichat/AIChatPage';

// LIS
import { LISPage } from '@/components/lis/LISPage';

// Messaging
import { MessagingPage } from '@/components/messaging/MessagingPage';

// Zoom
import { ZoomDashboard } from '@/components/zoom/ZoomDashboard';

// Docker App Integrations
import { NocoDBDashboard } from '@/components/nocodb/NocoDBDashboard';
import { GoogleDocsDashboard } from '@/components/googledocs/GoogleDocsDashboard';
import { ExcalidrawDashboard } from '@/components/excalidraw/ExcalidrawDashboard';
import { OmadaDashboard } from '@/components/omada/OmadaDashboard';
import { TacticalRMMDashboard } from '@/components/tacticalrmm/TacticalRMMDashboard';
import { DocumizeDashboard } from '@/components/documize/DocumizeDashboard';
import { ImpersonatePage } from '@/components/admin/ImpersonatePage';

// Management CRUD Components
import { AttendanceManagement, ScheduleManagement, AssignmentManagement, ExamScheduleManagement, AnnouncementManagement } from '@/components/management';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookId } = useParams<{ bookId?: string }>();
  const [searchParams] = useSearchParams();
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
  }, [loading, user]);

  const [activeTab, setActiveTab] = useState('portal');
  const hasInitialized = useRef(false);

  // Handle navigation state and initial role-based tab setting
  useEffect(() => {
    if (!loading && user && role && !hasInitialized.current) {
      // If deep-linking to a book, go straight to library
      if (bookId) {
        setActiveTab('library');
        hasInitialized.current = true;
        return;
      }
      const state = location.state as { activeTab?: string } | null;
      if (state?.activeTab) {
        setActiveTab(state.activeTab);
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        setActiveTab('portal');
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
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true); // PIN disabled temporarily
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

  // Calculate stats
  const totalStudents = students.length;
  const maleCount = students.filter(s => s.gender?.toUpperCase() === 'MALE').length;
  const femaleCount = students.filter(s => s.gender?.toUpperCase() === 'FEMALE').length;
  const levels = [...new Set(students.map(s => s.level))].length;

  const handleTabChange = (tab: string) => {
    if (tab === 'admin' && !isAdminUnlocked) {
      setPendingTab(tab);
      setIsPinModalOpen(true);
    } else {
      setActiveTab(tab);
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
        // Student portal dashboard is now rendered here directly
        return <StudentPortal activeSection="dashboard" />;
      case 'parent':
        return <ParentPortal />;
      default:
        return null;
    }
  };

  // Check if user has access to admin/registrar features
  const hasAdminAccess = role === 'admin' || role === 'registrar';

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {/* Role-specific Portal Home */}
      {activeTab === 'portal' && renderPortal()}

      {/* Dashboard - Admin/Registrar only */}
      {activeTab === 'dashboard' && hasAdminAccess && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of student records</p>
            </div>
            <GlobalStudentSearch />
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatsCard
              title="Total Students"
              value={totalStudents}
              subtitle="Enrolled students"
              icon={BookUser}
              variant="purple"
              delay={0}
            />
            <StatsCard
              title="Male Students"
              value={maleCount}
              subtitle={`${totalStudents ? ((maleCount / totalStudents) * 100).toFixed(1) : 0}% of total`}
              icon={TrendingUp}
              variant="purple"
              delay={0.1}
            />
            <StatsCard
              title="Female Students"
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
      )}

      {/* Enrollment - Admin/Registrar only */}
      {activeTab === 'enrollment' && hasAdminAccess && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Enrollment</h1>
            <p className="text-muted-foreground mt-1">Enroll new students</p>
          </motion.div>

          <EnrollmentWizard />
        </div>
      )}

      {/* Students - Admin/Registrar only */}
      {activeTab === 'students' && hasAdminAccess && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Students</h1>
              <p className="text-muted-foreground mt-1">Manage student records</p>
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </motion.div>

          <StudentTable
            students={students}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>
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
            <p className="text-muted-foreground mt-1">Bulk import students from CSV files</p>
          </motion.div>

          <CSVImport />
        </div>
      )}

      {/* Teachers - Admin/Registrar only */}
      {activeTab === 'teachers' && hasAdminAccess && (
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
      {activeTab === 'grades' && (role === 'admin' || role === 'registrar' || role === 'teacher') && (
        <GradesManagement />
      )}

      {/* Reports Hub - All authenticated users (RBAC inside) */}
      {activeTab === 'reports' && (
        <ReportsHub />
      )}

      {/* Events Management - Admin/Registrar only */}
      {activeTab === 'events' && hasAdminAccess && (
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
      {activeTab === 'messages' && (role === 'admin' || role === 'teacher' || role === 'registrar') && (
        <MessagingPage />
      )}

      {/* AI Chat - Admin, Teacher, and Registrar */}
      {activeTab === 'ai-chat' && (role === 'admin' || role === 'teacher' || role === 'registrar') && (
        <AIChatPage />
      )}


      {/* Admin Panel - Admin only */}
      {activeTab === 'admin' && role === 'admin' && isAdminUnlocked && (
        <AdminPanel />
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
        <StudentPortal activeSection="announcements" />
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

      {/* Docker App Integrations - Admin only */}
      {activeTab === 'nocodb' && role === 'admin' && <NocoDBDashboard />}
      {activeTab === 'onlyoffice' && role === 'admin' && <GoogleDocsDashboard />}
      {activeTab === 'excalidraw' && role === 'admin' && <ExcalidrawDashboard />}
      {activeTab === 'omada' && role === 'admin' && <OmadaDashboard />}
      {activeTab === 'tacticalrmm' && role === 'admin' && <TacticalRMMDashboard />}
      {activeTab === 'documize' && role === 'admin' && <DocumizeDashboard />}

      {/* Impersonate - All roles */}
      {activeTab === 'impersonate' && <ImpersonatePage />}

      {/* Announcement Management - Admin/Registrar */}
      {activeTab === 'announcement-mgmt' && hasAdminAccess && (
        <AnnouncementManagement />
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
    </DashboardLayout>
  );
};

export default Index;
