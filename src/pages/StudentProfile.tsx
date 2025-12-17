import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { 
  ArrowLeft,
  Printer,
  FileText,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentSlot } from '@/components/students/DocumentSlot';
import { StudentProfileCard } from '@/components/students/StudentProfileCard';
import { 
  useStudentDocuments, 
  useUploadDocument, 
  useDeleteDocument
} from '@/hooks/useStudentDocuments';
import { useStudents } from '@/hooks/useStudents';
import { toast } from 'sonner';

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  const { data: students = [], isLoading } = useStudents();
  const student = students.find(s => s.id === id);
  
  const { data: documents = [] } = useStudentDocuments(student?.id || '');
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDocumentUpload = async (slotNumber: number, file: File) => {
    if (!student) return;
    
    try {
      await uploadDocument.mutateAsync({
        studentId: student.id,
        slotNumber,
        file,
      });
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleDocumentDelete = async (slotNumber: number, documentId: string) => {
    if (!student) return;
    const doc = documents.find(d => d.id === documentId);
    try {
      await deleteDocument.mutateAsync({
        documentId,
        studentId: student.id,
        fileUrl: doc?.file_url || null,
      });
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.close()}
              className="no-print"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Student Profile</h1>
              <p className="text-xs text-muted-foreground">LRN: {student.lrn}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="no-print gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 no-print">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <StudentProfileCard student={student} showPhotoUpload={true} />
          </TabsContent>

          <TabsContent value="documents">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Upload and manage student documents. Click on an empty slot to upload.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((slotNumber, index) => {
                  const doc = documents.find(d => d.slot_number === slotNumber) || null;
                  return (
                    <DocumentSlot
                      key={slotNumber}
                      slot={slotNumber}
                      studentId={student.id}
                      document={doc}
                      onUpload={handleDocumentUpload}
                      onDelete={handleDocumentDelete}
                      index={index}
                    />
                  );
                })}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentProfile;