import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Curriculum Components
import { SubjectManagement } from '@/components/curriculum/SubjectManagement';
import { AcademicYearManagement } from '@/components/curriculum/AcademicYearManagement';
import { EnrollmentManagement } from '@/components/curriculum/EnrollmentManagement';

// Grades and Reports
import { GradesManagement } from '@/components/grades/GradesManagement';
import { ReportsManagement } from '@/components/reports/ReportsManagement';
import { EventsManagement } from '@/components/calendar/EventsManagement';

// Library
import { LibraryPage } from '@/components/library/LibraryPage';

// Canva
import { CanvaStudio } from '@/components/canva/CanvaStudio';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-auth?action=callback&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        {
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Successfully connected to Canva!');
        setActiveTab('canva'); // Navigate to Canva Studio
      } else {
        throw new Error(result.error || 'Failed to connect');
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
      const state = location.state as { activeTab?: string } | null;
      if (state?.activeTab) {
        setActiveTab(state.activeTab);
        // Clear state to avoid re-triggering on unrelated renders, 
        // but it won't affect our hasInitialized flag
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
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
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
        return <TeacherPortal />;
      case 'student':
        return <StudentPortal />;
      case 'parent':
        return <ParentPortal />;
      default:
        return <StudentPortal />;
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

      {/* Reports Management - Admin/Registrar only */}
      {activeTab === 'reports' && hasAdminAccess && (
        <ReportsManagement />
      )}

      {/* Events Management - Admin/Registrar only */}
      {activeTab === 'events' && hasAdminAccess && (
        <EventsManagement />
      )}

      {/* Library - All authenticated users */}
      {activeTab === 'library' && (
        <LibraryPage />
      )}

      {/* Canva Studio - Admin and Teacher only */}
      {activeTab === 'canva' && (role === 'admin' || role === 'teacher') && (
        <CanvaStudio />
      )}

      {/* Admin Panel - Admin only */}
      {activeTab === 'admin' && role === 'admin' && isAdminUnlocked && (
        <AdminPanel />
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
