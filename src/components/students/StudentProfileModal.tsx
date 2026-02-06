import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Printer, User, BookOpen, GraduationCap, FileDown, Loader2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student } from '@/types/student';
import { StudentProfileCard } from './StudentProfileCard';
import { DocumentsManager } from './DocumentsManager';
import { StudentSubjectsManager } from './StudentSubjectsManager';
import { TransmutationManager } from './TransmutationManager';
import { AnimatedStudentAvatar } from './AnimatedStudentAvatar';
import { generateSF1 } from '@/utils/sf1Generator';
import { generateAnnex1 } from '@/utils/annex1Generator';
import { generateSF9 } from '@/utils/sf9Generator';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal = ({ student, isOpen, onClose }: StudentProfileModalProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isExporting, setIsExporting] = useState(false);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<string>('');
  const { schoolTheme } = useSchool();

  // Fetch current academic year for TransmutationManager
  useEffect(() => {
    const fetchCurrentYear = async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();
      if (data) setCurrentAcademicYearId(data.id);
    };
    fetchCurrentYear();
  }, []);

  const handleExportSF1 = async () => {
    setIsExporting(true);
    try {
      generateSF1(student as any, {
        schoolName: schoolTheme.fullName,
        schoolId: schoolTheme.schoolId,
        region: schoolTheme.region,
        division: schoolTheme.division,
        district: schoolTheme.district
      });
      toast.success('SF1 generated successfully');
    } catch (error) {
      console.error('Error generating SF1:', error);
      toast.error('Failed to generate SF1');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAnnex1 = async () => {
    setIsExporting(true);
    try {
      generateAnnex1(student as any, {
        schoolName: schoolTheme.fullName,
        schoolId: schoolTheme.schoolId,
        region: schoolTheme.region,
        division: schoolTheme.division,
        district: schoolTheme.district
      });
      toast.success('Annex 1 generated successfully');
    } catch (error) {
      console.error('Error generating Annex 1:', error);
      toast.error('Failed to generate Annex 1');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSF9 = async () => {
    setIsExporting(true);
    try {
      // Fetch grades for the student
      const { data: gradesData, error: gradesError } = await supabase
        .from('student_grades')
        .select(`
          *,
          subjects:subject_id (code, name),
          academic_years:academic_year_id (name)
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (gradesError) throw gradesError;

      // Group by academic year and use the most recent one or the current one
      const academicYear = gradesData?.[0]?.academic_years?.name || '2025-2026';

      const formattedGrades = (gradesData || []).map((g: any) => ({
        subject_code: g.subjects?.code || 'N/A',
        subject_name: g.subjects?.name || 'N/A',
        q1: g.q1_grade,
        q2: g.q2_grade,
        q3: g.q3_grade,
        q4: g.q4_grade,
        final: g.final_grade,
        remarks: g.remarks
      }));

      generateSF9(student as any, formattedGrades, academicYear);
      toast.success('SF9 Report Card generated successfully');
    } catch (error) {
      console.error('Error generating SF9:', error);
      toast.error('Failed to generate SF9 Report Card');
    } finally {
      setIsExporting(false);
    }
  };

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 no-print"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-lg z-50 overflow-hidden flex flex-col"
          >
            {/* Header - Teal Gradient */}
            <div
              className="px-6 py-4 flex items-center justify-between shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 50%, #67e8f9 100%)'
              }}
            >
              <div className="flex items-center gap-4">
                {/* Animated Avatar */}
                <AnimatedStudentAvatar
                  photoUrl={student.photo_url}
                  name={student.student_name}
                  size="4xl"
                  borderColor="rgba(255,255,255,0.3)"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{student.student_name}</h2>
                    <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0 text-xs font-semibold">
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-white/80">
                    {student.lrn} • {student.level} • {student.school || 'MABDC'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 no-print">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAnnex1}
                  disabled={isExporting}
                  className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs h-8"
                >
                  {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                  Annex 1 PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSF9}
                  disabled={isExporting}
                  className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs h-8"
                >
                  {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <GraduationCap className="h-3 w-3" />}
                  SF9 Report Card
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSF1}
                  disabled={isExporting}
                  className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs h-8"
                >
                  {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                  SF1 PDF
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrint}
                  aria-label="Print"
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 bg-white dark:bg-slate-900 no-print border-b border-slate-200 dark:border-slate-700">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-transparent border-0 h-auto p-0 gap-6">
                  <TabsTrigger
                    value="profile"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-2 pb-3 font-medium transition-all"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="subjects"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-2 pb-3 font-medium transition-all"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Subjects
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-2 pb-3 font-medium transition-all"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger
                    value="grades"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-2 pb-3 font-medium transition-all"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Grades (Auto)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StudentProfileCard student={student} showPhotoUpload={true} showEditButton={false} />
                  </motion.div>
                )}

                {activeTab === 'subjects' && (
                  <motion.div
                    key="subjects"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StudentSubjectsManager studentId={student.id} gradeLevel={student.level} />
                  </motion.div>
                )}

                {activeTab === 'documents' && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DocumentsManager studentId={student.id} />
                  </motion.div>
                )}

                {activeTab === 'grades' && currentAcademicYearId && (
                  <motion.div
                    key="grades"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-[500px]"
                  >
                    <TransmutationManager student={student} academicYearId={currentAcademicYearId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};