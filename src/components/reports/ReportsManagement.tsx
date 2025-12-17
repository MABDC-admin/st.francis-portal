import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Award, 
  Trash2, 
  Download,
  Loader2,
  Plus,
  Eye,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ReportTemplate {
  id: string;
  name: string;
  type: 'report_card' | 'certificate';
  file_url: string;
  school: string;
  is_active: boolean;
  created_at: string;
}

interface Student {
  id: string;
  student_name: string;
  lrn: string;
  level: string;
}

export const ReportsManagement = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('report_card');
  
  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'report_card' as 'report_card' | 'certificate',
    school: 'MABDC',
    file: null as File | null
  });
  
  const [generateForm, setGenerateForm] = useState({
    template_id: '',
    student_ids: [] as string[],
    all_students: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates((templatesData || []) as ReportTemplate[]);

      const { data: studentsData } = await supabase
        .from('students')
        .select('id, student_name, lrn, level')
        .order('student_name');
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = () => {
    setUploadForm({
      name: '',
      type: activeTab as 'report_card' | 'certificate',
      school: 'MABDC',
      file: null
    });
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Accept images and PDFs
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Please select an image or PDF file');
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleSaveTemplate = async () => {
    if (!uploadForm.name || !uploadForm.file) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Upload file to storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}-${uploadForm.name.replace(/\s+/g, '-')}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-templates')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('report-templates')
        .getPublicUrl(fileName);

      // Save template record
      const { error: insertError } = await supabase
        .from('report_templates')
        .insert({
          name: uploadForm.name,
          type: uploadForm.type,
          file_url: urlData.publicUrl,
          school: uploadForm.school
        });

      if (insertError) throw insertError;

      toast.success('Template uploaded successfully');
      setIsUploadModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Failed to upload template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;
    
    setIsSaving(true);
    try {
      // Delete from storage
      const fileName = selectedTemplate.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('report-templates')
          .remove([fileName]);
      }

      // Delete record
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', selectedTemplate.id);

      if (error) throw error;
      
      toast.success('Template deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setGenerateForm({
      template_id: template.id,
      student_ids: [],
      all_students: false
    });
    setIsGenerateModalOpen(true);
  };

  const handleGenerateReports = async () => {
    if (!selectedTemplate) return;
    
    toast.info('Report generation feature coming soon. For now, download the template and generate manually.');
    setIsGenerateModalOpen(false);
  };

  const filteredTemplates = templates.filter(t => t.type === activeTab);

  const TemplateCard = ({ template }: { template: ReportTemplate }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-[3/4] bg-muted relative overflow-hidden">
          {template.file_url.endsWith('.pdf') ? (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <FileText className="h-16 w-16 text-red-500" />
            </div>
          ) : (
            <img 
              src={template.file_url} 
              alt={template.name}
              className="w-full h-full object-cover"
            />
          )}
          <Badge className="absolute top-2 right-2" variant={template.is_active ? 'default' : 'secondary'}>
            {template.school}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{template.name}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {new Date(template.created_at).toLocaleDateString()}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleGenerate(template)}>
              <Printer className="h-3 w-3 mr-1" />
              Generate
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={template.file_url} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4" />
              </a>
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(template)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1">Generate report cards and certificates from templates</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="report_card" className="gap-2">
              <FileText className="h-4 w-4" />
              Report Cards
            </TabsTrigger>
            <TabsTrigger value="certificate" className="gap-2">
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
          </TabsList>
          <Button onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Template
          </Button>
        </div>

        <TabsContent value="report_card" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No Report Card Templates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a template to start generating report cards
                </p>
                <Button onClick={handleUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificate" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No Certificate Templates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a template to start generating certificates
                </p>
                <Button onClick={handleUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Template</DialogTitle>
            <DialogDescription>
              Upload an image or PDF template for generating reports
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input 
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="e.g., Report Card 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={uploadForm.type} 
                onValueChange={(v: 'report_card' | 'certificate') => setUploadForm({ ...uploadForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="report_card">Report Card</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>School</Label>
              <Select 
                value={uploadForm.school} 
                onValueChange={(v) => setUploadForm({ ...uploadForm, school: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MABDC">M.A Brain Development Center</SelectItem>
                  <SelectItem value="STFXSA">St. Francis Xavier Smart Academy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {uploadForm.file ? (
                  <div>
                    <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="font-medium">{uploadForm.file.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload image or PDF</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Reports</DialogTitle>
            <DialogDescription>
              Select students to generate {selectedTemplate?.type === 'report_card' ? 'report cards' : 'certificates'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Using template: <strong>{selectedTemplate?.name}</strong>
            </p>
            
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Automated report generation with data merging will be available in a future update.
                For now, you can download the template and fill it manually.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
            <Button asChild>
              <a href={selectedTemplate?.file_url} download>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};