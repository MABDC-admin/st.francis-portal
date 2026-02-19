import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentDocument } from '@/types/student';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentSlotProps {
  slot: number;
  studentId: string;
  document: StudentDocument | null;
  onUpload: (slot: number, file: File) => Promise<void>;
  onDelete: (slot: number, documentId: string) => Promise<void>;
  index: number;
}

const DOCUMENT_LABELS = [
  'Birth Certificate',
  'Report Card',
  'Good Moral Certificate',
  'Transfer Credential',
  'Medical Certificate',
  'ID Photo',
];

export const DocumentSlot = ({ 
  slot, 
  studentId, 
  document, 
  onUpload, 
  onDelete,
  index 
}: DocumentSlotProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      await onUpload(slot, file);
      toast.success(`${DOCUMENT_LABELS[slot - 1]} uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDelete = async () => {
    if (!document) return;
    try {
      await onDelete(slot, document.id);
      toast.success('Document removed');
    } catch (error) {
      toast.error('Failed to remove document');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-6 transition-all duration-300",
        isDragging 
          ? "border-stat-purple bg-stat-purple-light" 
          : document 
            ? "border-stat-green bg-stat-green-light" 
            : "border-border bg-card hover:border-stat-purple hover:bg-stat-purple-light/50"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />

      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <motion.div
          animate={{ 
            rotateY: document ? [0, 360] : 0,
            scale: isDragging ? 1.1 : 1 
          }}
          transition={{ duration: 0.6 }}
          className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center mb-4",
            document ? "bg-stat-green" : "bg-stat-purple/20"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-7 w-7 text-stat-purple animate-spin" />
          ) : document ? (
            <Check className="h-7 w-7 text-white" />
          ) : (
            <FileText className={cn(
              "h-7 w-7",
              isDragging ? "text-stat-purple" : "text-stat-purple/60"
            )} />
          )}
        </motion.div>

        {/* Label */}
        <h4 className="font-semibold text-foreground mb-1">
          {DOCUMENT_LABELS[slot - 1]}
        </h4>

        {/* Status */}
        {document ? (
          <div className="space-y-2">
            <p className="text-xs text-stat-green font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Uploaded
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
              {document.document_name}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(document.file_url || '', '_blank')}
                className="text-xs"
              >
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-xs text-destructive hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border-stat-purple text-stat-purple hover:bg-stat-purple hover:text-white"
            >
              <Upload className="h-3 w-3 mr-1" />
              Select File
            </Button>
          </div>
        )}
      </div>

      {/* Animated border glow on drag */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl border-2 border-stat-purple"
          style={{
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
          }}
        />
      )}
    </motion.div>
  );
};
