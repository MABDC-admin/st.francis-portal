import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PIN = '192168';

export const AdminPinModal = ({ isOpen, onClose, onSuccess }: AdminPinModalProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin === ADMIN_PIN) {
      setPin('');
      setError(false);
      setAttempts(0);
      onSuccess();
      toast.success('Admin access granted');
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      setPin('');
      
      if (attempts >= 2) {
        toast.error('Too many failed attempts');
        onClose();
        setAttempts(0);
      }
    }
  };

  const handleClose = () => {
    setPin('');
    setError(false);
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card rounded-2xl shadow-lg z-50 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Admin Access</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Enter the admin PIN to access restricted features.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError(false);
                    }}
                    className={`pl-10 text-center text-lg tracking-widest ${error ? 'border-destructive' : ''}`}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                
                {error && (
                  <p className="text-sm text-destructive text-center">
                    Invalid PIN. {3 - attempts} attempts remaining.
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={pin.length < 6}>
                  Verify PIN
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
