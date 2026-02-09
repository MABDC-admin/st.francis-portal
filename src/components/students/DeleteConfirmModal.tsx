import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Student } from '@/types/student';

interface DeleteConfirmModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmModal = ({ 
  student, 
  isOpen, 
  onClose, 
  onConfirm,
  isLoading 
}: DeleteConfirmModalProps) => {
  if (!student) return null;

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
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl shadow-lg z-50 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Delete Learner</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Are you sure you want to delete <span className="font-medium text-foreground">{student.student_name}</span>? 
                    This action cannot be undone.
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="px-6 py-4 bg-secondary/30 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Learner'
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
