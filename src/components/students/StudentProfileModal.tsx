import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Printer, User, Calendar, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student } from '@/types/student';
import { StudentProfileCard } from './StudentProfileCard';
import { DocumentsManager } from './DocumentsManager';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal = ({ student, isOpen, onClose }: StudentProfileModalProps) => {
  const [activeTab, setActiveTab] = useState('profile');

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
                {/* Avatar */}
                {student.photo_url ? (
                  <img 
                    src={student.photo_url} 
                    alt={student.student_name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <span className="text-lg font-bold text-white">
                      {student.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                )}
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
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePrint} 
                  aria-label="Print"
                  className="text-white hover:bg-white/20"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  aria-label="Close"
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 bg-white dark:bg-slate-900 no-print border-b border-slate-200 dark:border-slate-700">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-transparent border-0 p-0 gap-4">
                  <TabsTrigger 
                    value="profile" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-2 pb-3"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent px-2 pb-3"
                  >
                    Documents
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
                  >
                    <StudentProfileCard student={student} showPhotoUpload={true} showEditButton={false} />
                  </motion.div>
                )}

                {activeTab === 'documents' && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <DocumentsManager studentId={student.id} />
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