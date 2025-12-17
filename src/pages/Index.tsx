import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, UserPlus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Charts } from '@/components/dashboard/Charts';
import { StudentTable } from '@/components/students/StudentTable';
import { StudentProfileModal } from '@/components/students/StudentProfileModal';
import { StudentFormModal } from '@/components/students/StudentFormModal';
import { DeleteConfirmModal } from '@/components/students/DeleteConfirmModal';
import { CSVImport } from '@/components/import/CSVImport';
import { EnrollmentForm } from '@/components/enrollment/EnrollmentForm';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { AdminPinModal } from '@/components/admin/AdminPinModal';
import { Button } from '@/components/ui/button';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { Student, StudentFormData } from '@/types/student';
import { useAuth } from '@/contexts/AuthContext';

// Portal Components
import { AdminPortal } from '@/components/portals/AdminPortal';
import { RegistrarPortal } from '@/components/portals/RegistrarPortal';
import { TeacherPortal } from '@/components/portals/TeacherPortal';
import { StudentPortal } from '@/components/portals/StudentPortal';
import { ParentPortal } from '@/components/portals/ParentPortal';
import { TeacherManagement } from '@/components/teachers/TeacherManagement';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Set default tab based on role
  const getDefaultTab = (userRole: string | null) => {
    return 'portal'; // All roles start at their portal home
  };

  const [activeTab, setActiveTab] = useState(() => getDefaultTab(role));
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

  // Update activeTab when role changes
  useEffect(() => {
    if (role) {
      setActiveTab('portal');
    }
  }, [role]);

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
    window.open(`/student/${student.id}`, '_blank');
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
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Overview of student records</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatsCard
              title="Total Students"
              value={totalStudents}
              subtitle="Enrolled students"
              icon={Users}
              variant="purple"
              delay={0}
            />
            <StatsCard
              title="Male Students"
              value={maleCount}
              subtitle={`${totalStudents ? ((maleCount / totalStudents) * 100).toFixed(1) : 0}% of total`}
              icon={TrendingUp}
              variant="pink"
              delay={0.1}
            />
            <StatsCard
              title="Female Students"
              value={femaleCount}
              subtitle={`${totalStudents ? ((femaleCount / totalStudents) * 100).toFixed(1) : 0}% of total`}
              icon={TrendingUp}
              variant="yellow"
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

          <EnrollmentForm />
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
