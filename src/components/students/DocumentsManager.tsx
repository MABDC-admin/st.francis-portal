import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Trash2, 
  X,
  Loader2,
  Eye,
  Download,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StudentDocument } from '@/types/student';
import { 
  useStudentDocuments, 
  useUploadDocument, 
  useDeleteDocument 
} from '@/hooks/useStudentDocuments';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentsManagerProps {
  studentId: string;
}

interface PendingFile {
  file: File;
  name: string;
  id: string;
}

export const DocumentsManager = ({ studentId }: DocumentsManagerProps) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<StudentDocument | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [] } = useStudentDocuments(studentId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const handleFilesSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newPendingFiles: PendingFile[] = fileArray.map((file) => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setPendingFiles(newPendingFiles);
    setIsUploadModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFilesSelect(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFilesSelect(e.dataTransfer.files);
  };

  const updateFileName = (id: string, newName: string) => {
    setPendingFiles((prev) =>
      prev.map((pf) => (pf.id === id ? { ...pf, name: newName } : pf))
    );
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.id !== id));
    if (pendingFiles.length <= 1) {
      setIsUploadModalOpen(false);
    }
  };

  const handleUpload = async () => {
    const validFiles = pendingFiles.filter((pf) => pf.name.trim());
    if (validFiles.length === 0) {
      toast.error('Please enter names for all documents');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const pf of validFiles) {
      try {
        await uploadDocument.mutateAsync({
          studentId,
          file: pf.file,
          documentName: pf.name.trim(),
        });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} document${failCount > 1 ? 's' : ''} failed to upload`);
    }

    setIsUploadModalOpen(false);
    setPendingFiles([]);
    setIsUploading(false);
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      await deleteDocument.mutateAsync({
        documentId: selectedDocument.id,
        studentId,
        fileUrl: selectedDocument.file_url,
      });
      toast.success('Document deleted');
      setIsDeleteOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const isImage = (type: string) => type.startsWith('image/');
  const isPDF = (type: string) => type === 'application/pdf';

  const getFileIcon = (type: string) => {
    if (isImage(type)) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (isPDF(type)) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const getThumbnail = (doc: StudentDocument) => {
    if (isImage(doc.document_type) && doc.file_url) {
      return (
        <img 
          src={doc.file_url} 
          alt={doc.document_name}
          className="w-full h-full object-cover"
        />
      );
    }
    if (isPDF(doc.document_type)) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center">
          <FileText className="h-12 w-12 text-red-500" />
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <File className="h-12 w-12 text-gray-400" />
      </div>
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {/* Drag Overlay */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl z-10 flex items-center justify-center"
        >
          <div className="text-center">
            <Plus className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-medium text-primary">Drop file to upload</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Documents</h3>
          <span className="text-sm text-muted-foreground">({documents.length})</span>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Documents Grid */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => {
                setSelectedDocument(doc);
                setIsViewerOpen(true);
              }}
            >
              {/* Thumbnail */}
              <div className="aspect-square overflow-hidden">
                {getThumbnail(doc)}
              </div>

              {/* Document Name */}
              <div className="p-3 border-t">
                <p className="text-sm font-medium truncate" title={doc.document_name}>
                  {doc.document_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDocument(doc);
                    setIsViewerOpen(true);
                  }}
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDocument(doc);
                    setIsDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div 
          className={cn(
            "text-center py-12 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No documents uploaded</p>
          <p className="text-sm text-muted-foreground mt-1">Drag & drop or click to upload</p>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
        if (!open) setPendingFiles([]);
        setIsUploadModalOpen(open);
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Upload {pendingFiles.length > 1 ? `${pendingFiles.length} Documents` : 'Document'}
            </DialogTitle>
            <DialogDescription>
              {pendingFiles.length > 1 
                ? 'Edit names for each document before uploading' 
                : 'Enter a name for this document'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {pendingFiles.map((pf, index) => (
              <div key={pf.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="shrink-0">
                  {getFileIcon(pf.file.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate">{pf.file.name}</p>
                    <span className="text-xs text-muted-foreground">
                      ({(pf.file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Input
                    value={pf.name}
                    onChange={(e) => updateFileName(pf.id, e.target.value)}
                    placeholder="Document name"
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(pf.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || pendingFiles.length === 0}
            >
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload {pendingFiles.length > 1 ? `${pendingFiles.length} Files` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">{selectedDocument?.document_name}</h3>
                <p className="text-xs text-muted-foreground">
                  Uploaded {selectedDocument && new Date(selectedDocument.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedDocument?.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedDocument.file_url!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsViewerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-muted/30 min-h-[400px]">
              {selectedDocument && (
                <>
                  {isImage(selectedDocument.document_type) && selectedDocument.file_url && (
                    <div className="flex items-center justify-center h-full">
                      <img
                        src={selectedDocument.file_url}
                        alt={selectedDocument.document_name}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                  {isPDF(selectedDocument.document_type) && selectedDocument.file_url && (
                    <iframe
                      src={selectedDocument.file_url}
                      className="w-full h-[70vh] rounded-lg border"
                      title={selectedDocument.document_name}
                    />
                  )}
                  {!isImage(selectedDocument.document_type) && !isPDF(selectedDocument.document_type) && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <File className="h-20 w-20 text-muted-foreground" />
                      <p className="text-muted-foreground">Preview not available</p>
                      <Button onClick={() => window.open(selectedDocument.file_url!, '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDocument?.document_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
