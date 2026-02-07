import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
  FolderOpen,
  Sparkles,
  Search,
  Tag,
  Globe,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  useDeleteDocument,
  useUploadPdfParent
} from '@/hooks/useStudentDocuments';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { extractPdfPagesAsImages, isPdfFile, PdfConversionProgress } from '@/utils/pdfToImages';

interface DocumentsManagerProps {
  studentId: string;
}

interface PendingFile {
  file: File;
  name: string;
  id: string;
}

interface ExtendedDocument extends StudentDocument {
  extracted_text?: string;
  detected_type?: string;
  summary?: string;
  keywords?: string[];
  detected_language?: string;
  confidence_score?: number;
  analysis_status?: string;
  page_count?: number;
  page_images?: { page: number; url: string; thumbnail_url: string }[];
  thumbnail_url?: string;
  is_pdf_page?: boolean;
  parent_document_id?: string;
  page_number?: number;
}

// Utility functions (must be defined before component to avoid hoisting issues)
const isImage = (type: string) => type.startsWith('image/');
const isPDF = (type: string) => type === 'application/pdf';

export const DocumentsManager = ({ studentId }: DocumentsManagerProps) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ExtendedDocument | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingDocs, setAnalyzingDocs] = useState<Set<string>>(new Set());
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [pdfConversionProgress, setPdfConversionProgress] = useState<PdfConversionProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], refetch } = useStudentDocuments(studentId);
  const uploadDocument = useUploadDocument();
  const uploadPdfParent = useUploadPdfParent();
  const deleteDocument = useDeleteDocument();

  // Cast documents to extended type
  const extendedDocuments = documents as ExtendedDocument[];
  
  // Separate parent PDFs and their pages
  const parentPdfs = extendedDocuments.filter(doc => isPDF(doc.document_type) && !doc.is_pdf_page && doc.page_count && doc.page_count > 0);
  const pdfPages = extendedDocuments.filter(doc => doc.is_pdf_page);
  const nonPdfDocs = extendedDocuments.filter(doc => !isPDF(doc.document_type) || doc.is_pdf_page);
  
  // For PDFs with pages, show pages instead of parent; for others show as-is
  const parentIdsWithPages = new Set(pdfPages.map(p => p.parent_document_id).filter(Boolean));
  const displayDocuments = extendedDocuments.filter(doc => {
    // Show PDF pages
    if (doc.is_pdf_page) return true;
    // Hide parent PDFs that have been split into pages
    if (isPDF(doc.document_type) && parentIdsWithPages.has(doc.id)) return false;
    // Show everything else (images, unprocessed PDFs, etc.)
    return true;
  });

  // Group PDF pages by parent document for reference
  const pagesByParent = pdfPages.reduce((acc, page) => {
    const parentId = page.parent_document_id;
    if (parentId) {
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push(page);
      acc[parentId].sort((a, b) => (a.page_number || 0) - (b.page_number || 0));
    }
    return acc;
  }, {} as Record<string, ExtendedDocument[]>);

  // Filter documents by search query
  const filteredDocuments = displayDocuments.filter(doc => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.document_name.toLowerCase().includes(query) ||
      doc.extracted_text?.toLowerCase().includes(query) ||
      doc.summary?.toLowerCase().includes(query) ||
      doc.keywords?.some(k => k.toLowerCase().includes(query)) ||
      doc.detected_type?.toLowerCase().includes(query)
    );
  });

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

  const analyzeDocument = async (documentId: string, fileUrl: string, originalFilename: string, isPdf: boolean = false) => {
    setAnalyzingDocs(prev => new Set(prev).add(documentId));
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { documentId, fileUrl, originalFilename, studentId }
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error('Document analysis failed');
      } else if (data?.success) {
        if (data.isPDF) {
          toast.success('PDF processing started', {
            description: `Splitting ${data.pageCount} pages for AI analysis...`
          });
        } else {
          const renamedMsg = data.analysis?.renamed_to 
            ? ` → Renamed to: ${data.analysis.renamed_to}` 
            : '';
          toast.success('Document analyzed & renamed', {
            description: `${data.analysis?.detected_type}${renamedMsg}`
          });
        }
        refetch();
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzingDocs(prev => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
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
    const uploadedImageDocs: { id: string; url: string; name: string }[] = [];

    for (const pf of validFiles) {
      try {
        const isPdf = isPdfFile(pf.file);

        if (isPdf) {
          // Handle PDF: Convert to images and upload each page
          toast.info('Converting PDF pages to images...', { id: 'pdf-conversion' });
          
          try {
            // Convert PDF pages to JPEG images (2x scale, 92% quality)
            const pageImages = await extractPdfPagesAsImages(pf.file, 50, (progress) => {
              setPdfConversionProgress(progress);
            });
            
            setPdfConversionProgress(null);
            toast.dismiss('pdf-conversion');
            
            // Upload parent PDF first
            const parentResult = await uploadPdfParent.mutateAsync({
              studentId,
              file: pf.file,
              documentName: pf.name.trim(),
              pageCount: pageImages.length,
            });
            
            if (parentResult) {
              toast.info(`Uploading ${pageImages.length} page images...`, { id: 'page-upload' });
              
              // Upload each page as an image
              for (let i = 0; i < pageImages.length; i++) {
                const pageImage = pageImages[i];
                const pageFileName = `${pf.name.trim()}_page_${pageImage.pageNumber}.webp`;
                const pageFile = new window.File([pageImage.blob], pageFileName, { type: 'image/webp' });
                
                const pageResult = await uploadDocument.mutateAsync({
                  studentId,
                  file: pageFile,
                  documentName: `${pf.name.trim()} - Page ${pageImage.pageNumber}`,
                  isPdfPage: true,
                  parentDocumentId: parentResult.id,
                  pageNumber: pageImage.pageNumber,
                  thumbnailUrl: null, // Will use file_url as thumbnail
                });
                
                // Trigger AI analysis for each page image
                if (pageResult?.file_url) {
                  analyzeDocument(pageResult.id, pageResult.file_url, pageFileName, false);
                }
              }
              
              toast.dismiss('page-upload');
              
              // Update parent PDF status to completed
              await supabase
                .from('student_documents')
                .update({ analysis_status: 'completed' })
                .eq('id', parentResult.id);
              
              successCount++;
              refetch();
            }
          } catch (pdfError) {
            console.error('PDF conversion error:', pdfError);
            toast.error('Failed to convert PDF pages');
            failCount++;
          }
        } else {
          // Handle non-PDF files normally
          const result = await uploadDocument.mutateAsync({
            studentId,
            file: pf.file,
            documentName: pf.name.trim(),
          });
          successCount++;
          
          if (result) {
            uploadedImageDocs.push({
              id: result.id,
              url: result.file_url || '',
              name: pf.file.name
            });
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully`);
      
      // Trigger AI analysis for non-PDF uploaded documents
      for (const doc of uploadedImageDocs) {
        if (doc.url) {
          analyzeDocument(doc.id, doc.url, doc.name, false);
        }
      }
    }
    if (failCount > 0) {
      toast.error(`${failCount} document${failCount > 1 ? 's' : ''} failed to upload`);
    }

    setIsUploadModalOpen(false);
    setPendingFiles([]);
    setIsUploading(false);
    setPdfConversionProgress(null);
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

  const getFileIcon = (type: string) => {
    if (isImage(type)) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (isPDF(type)) return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const getAnalysisStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getDocumentTypeBadge = (type: string | undefined) => {
    if (!type) return null;
    const typeLabels: Record<string, { label: string; color: string }> = {
      birth_certificate: { label: 'Birth Certificate', color: 'bg-blue-100 text-blue-700' },
      report_card: { label: 'Report Card', color: 'bg-green-100 text-green-700' },
      id_photo: { label: 'ID Photo', color: 'bg-purple-100 text-purple-700' },
      transcript: { label: 'Transcript', color: 'bg-amber-100 text-amber-700' },
      medical_record: { label: 'Medical', color: 'bg-red-100 text-red-700' },
      diploma: { label: 'Diploma', color: 'bg-indigo-100 text-indigo-700' },
      recommendation_letter: { label: 'Recommendation', color: 'bg-pink-100 text-pink-700' },
      passport: { label: 'Passport', color: 'bg-cyan-100 text-cyan-700' },
      visa: { label: 'Visa', color: 'bg-teal-100 text-teal-700' },
      certificate: { label: 'Certificate', color: 'bg-orange-100 text-orange-700' },
      enrollment_form: { label: 'Enrollment', color: 'bg-lime-100 text-lime-700' },
      clearance: { label: 'Clearance', color: 'bg-emerald-100 text-emerald-700' },
      good_moral: { label: 'Good Moral', color: 'bg-violet-100 text-violet-700' },
      other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
    };
    const typeInfo = typeLabels[type] || typeLabels.other;
    return (
      <Badge className={cn("text-[10px] font-medium", typeInfo.color)}>
        {typeInfo.label}
      </Badge>
    );
  };

  const getThumbnail = (doc: ExtendedDocument) => {
    // PDF page images - show actual image with page indicator
    if (doc.is_pdf_page && doc.file_url) {
      return (
        <div className="w-full h-full relative">
          <img 
            src={doc.file_url} 
            alt={doc.document_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Page {doc.page_number}
          </div>
          {doc.analysis_status === 'completed' && (
            <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-green-500 drop-shadow-md" />
          )}
          {doc.analysis_status === 'processing' && (
            <Loader2 className="absolute top-2 right-2 h-4 w-4 text-blue-500 animate-spin drop-shadow-md" />
          )}
        </div>
      );
    }
    
    // Regular images
    if (isImage(doc.document_type) && doc.file_url) {
      return (
        <img 
          src={doc.file_url} 
          alt={doc.document_name}
          className="w-full h-full object-cover"
        />
      );
    }
    
    // Parent PDF document
    if (isPDF(doc.document_type)) {
      const pages = pagesByParent[doc.id] || [];
      const pageCount = doc.page_count || pages.length;
      
      return (
        <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex flex-col items-center justify-center relative">
          <FileText className="h-10 w-10 text-red-500" />
          {pageCount > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              <Layers className="h-3 w-3" />
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </div>
          )}
          {doc.analysis_status === 'processing' && (
            <div className="absolute top-2 right-2">
              <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
            </div>
          )}
        </div>
      );
    }
    
    // Other files
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <File className="h-12 w-12 text-gray-400" />
      </div>
    );
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Documents</h3>
          <span className="text-sm text-muted-foreground">({documents.length})</span>
          <Badge variant="outline" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </Badge>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[200px]"
            />
          </div>
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
            Add
          </Button>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => {
                setSelectedDocument(doc);
                setCurrentPdfPage(0);
                setIsViewerOpen(true);
              }}
            >
              {/* Analysis Status Indicator */}
              {analyzingDocs.has(doc.id) && (
                <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </div>
              )}

              {/* Thumbnail */}
              <div className="aspect-square overflow-hidden relative">
                {getThumbnail(doc)}
                {doc.detected_type && (
                  <div className="absolute bottom-2 left-2">
                    {getDocumentTypeBadge(doc.detected_type)}
                  </div>
                )}
              </div>

              {/* Document Info */}
              <div className="p-3 border-t space-y-1">
                <div className="flex items-center gap-1">
                  {getAnalysisStatusIcon(doc.analysis_status)}
                  <p className="text-sm font-medium truncate flex-1" title={doc.document_name}>
                    {doc.document_name}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
                {doc.detected_language && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {doc.detected_language}
                  </div>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDocument(doc);
                      setCurrentPdfPage(0);
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
                {/* View Original PDF button for PDF pages */}
                {doc.is_pdf_page && doc.parent_document_id && (() => {
                  const parentDoc = extendedDocuments.find(d => d.id === doc.parent_document_id);
                  return parentDoc?.file_url ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 bg-background/90 hover:bg-background text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(parentDoc.file_url!, '_blank');
                      }}
                    >
                      <FileText className="h-3 w-3 text-red-500" />
                      View Original PDF
                    </Button>
                  ) : null;
                })()}
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
          <p className="text-muted-foreground">
            {searchQuery ? 'No documents match your search' : 'No documents uploaded'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try a different search term' : 'Drag & drop or click to upload'}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
        if (!open) setPendingFiles([]);
        setIsUploadModalOpen(open);
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Upload {pendingFiles.length > 1 ? `${pendingFiles.length} Documents` : 'Document'}
              <Badge variant="outline" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                AI Analysis
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Documents will be automatically analyzed by DeepSeek AI for OCR and classification
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {pendingFiles.map((pf) => (
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

          {/* PDF Conversion Progress */}
          {pdfConversionProgress && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Converting PDF page {pdfConversionProgress.currentPage} of {pdfConversionProgress.totalPages}...
                </span>
                <span className="font-medium">
                  {Math.round((pdfConversionProgress.currentPage / pdfConversionProgress.totalPages) * 100)}%
                </span>
              </div>
              <Progress 
                value={(pdfConversionProgress.currentPage / pdfConversionProgress.totalPages) * 100} 
                className="h-2"
              />
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || pendingFiles.length === 0}
              className="gap-2"
            >
              {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Sparkles className="h-4 w-4" />
              {pdfConversionProgress ? 'Converting...' : 'Upload & Analyze'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{selectedDocument?.document_name}</h3>
                  {selectedDocument?.detected_type && getDocumentTypeBadge(selectedDocument.detected_type)}
                </div>
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
            <div className="flex-1 overflow-auto flex">
              {/* Document Preview */}
              <div className="flex-1 p-4 bg-muted/30 min-h-[400px]">
                {selectedDocument && (
                  <>
                    {isImage(selectedDocument.document_type) && selectedDocument.file_url && (
                      <div className="flex items-center justify-center h-full">
                        <img
                          src={selectedDocument.file_url}
                          alt={selectedDocument.document_name}
                          className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    )}
                    {isPDF(selectedDocument.document_type) && selectedDocument.file_url && (
                      <div className="flex flex-col h-full">
                        {/* PDF Pages Gallery for multi-page PDFs */}
                        {(() => {
                          const docPages = pagesByParent[selectedDocument.id] || [];
                          if (docPages.length > 0) {
                            const currentPage = docPages[currentPdfPage];
                            return (
                              <div className="flex flex-col h-full">
                                {/* Page Navigation */}
                                <div className="flex items-center justify-center gap-4 mb-4 p-2 bg-muted rounded-lg">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPdfPage === 0}
                                    onClick={() => setCurrentPdfPage(p => Math.max(0, p - 1))}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <span className="text-sm font-medium">
                                    Page {currentPdfPage + 1} of {docPages.length}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPdfPage >= docPages.length - 1}
                                    onClick={() => setCurrentPdfPage(p => Math.min(docPages.length - 1, p + 1))}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {/* Current Page View */}
                                {currentPage?.file_url && (
                                  <iframe
                                    src={currentPage.file_url}
                                    className="flex-1 w-full rounded-lg border min-h-[50vh]"
                                    title={`${selectedDocument.document_name} - Page ${currentPdfPage + 1}`}
                                  />
                                )}
                                
                                {/* Page Thumbnails */}
                                <div className="flex gap-2 mt-4 overflow-x-auto p-2 bg-muted rounded-lg">
                                  {docPages.map((page, idx) => (
                                    <button
                                      key={page.id}
                                      onClick={() => setCurrentPdfPage(idx)}
                                      className={cn(
                                        "flex-shrink-0 w-16 h-20 rounded border-2 flex items-center justify-center transition-all",
                                        currentPdfPage === idx 
                                          ? "border-primary bg-primary/10" 
                                          : "border-transparent bg-card hover:border-muted-foreground/50"
                                      )}
                                    >
                                      <div className="text-center">
                                        <FileText className="h-6 w-6 text-red-500 mx-auto" />
                                        <span className="text-xs text-muted-foreground">{idx + 1}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          
                          // Fallback for PDFs without pages (not yet processed)
                          return (
                            <iframe
                              src={selectedDocument.file_url}
                              className="w-full h-[60vh] rounded-lg border"
                              title={selectedDocument.document_name}
                            />
                          );
                        })()}
                      </div>
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

              {/* AI Analysis Panel */}
              {selectedDocument?.analysis_status === 'completed' && (
                <div className="w-80 border-l p-4 space-y-4 overflow-y-auto bg-card">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">AI Analysis</h4>
                    {selectedDocument.confidence_score && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {Math.round(selectedDocument.confidence_score * 100)}% confident
                      </Badge>
                    )}
                  </div>

                  {/* Summary */}
                  {selectedDocument.summary && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Summary</p>
                      <p className="text-sm">{selectedDocument.summary}</p>
                    </div>
                  )}

                  {/* Language */}
                  {selectedDocument.detected_language && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedDocument.detected_language}</span>
                    </div>
                  )}

                  {/* Keywords */}
                  {selectedDocument.keywords && selectedDocument.keywords.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">Keywords</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedDocument.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Text */}
                  {selectedDocument.extracted_text && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Extracted Text</p>
                      <div className="max-h-40 overflow-y-auto p-2 bg-muted rounded-lg">
                        <p className="text-xs whitespace-pre-wrap">{selectedDocument.extracted_text}</p>
                      </div>
                    </div>
                  )}
                </div>
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
