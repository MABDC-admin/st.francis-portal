import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { LISStudentSearch } from './LISStudentSearch';
import { LISStudentDetail } from './LISStudentDetail';
import { Student } from '@/types/student';

export const LISPage = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Learner Information System
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Cross-school, cross-year comprehensive student records
            </p>
          </div>
        </div>
      </motion.div>

      <LISStudentSearch
        onSelectStudent={setSelectedStudent}
        selectedStudentId={selectedStudent?.id || null}
      />

      {selectedStudent && (
        <motion.div
          key={selectedStudent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LISStudentDetail student={selectedStudent} />
        </motion.div>
      )}
    </div>
  );
};
