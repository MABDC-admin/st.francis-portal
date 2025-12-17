import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useMemo } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  School, 
  Calendar,
  Users,
  Mail,
  Printer,
  Camera,
  FileText,
  Loader2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Student, StudentDocument } from '@/types/student';
import { DocumentSlot } from './DocumentSlot';
import { 
  useStudentDocuments, 
  useUploadDocument, 
  useDeleteDocument,
  useUploadStudentPhoto 
} from '@/hooks/useStudentDocuments';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchableField {
  label: string;
  value: string | null;
  tab: string;
  tabLabel: string;
  icon?: any;
}

const tabs = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'parents', label: 'Parents/Guardian', icon: Users },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'academic', label: 'Academic', icon: School },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export const StudentProfileModal = ({ student, isOpen, onClose }: StudentProfileModalProps) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const { data: documents = [] } = useStudentDocuments(student?.id || '');
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const uploadPhoto = useUploadStudentPhoto();

  // Build searchable fields
  const searchableFields: SearchableField[] = useMemo(() => {
    if (!student) return [];
    return [
      { label: 'Full Name', value: student.student_name, tab: 'personal', tabLabel: 'Personal Info', icon: User },
      { label: 'LRN', value: student.lrn, tab: 'personal', tabLabel: 'Personal Info', icon: Mail },
      { label: 'Date of Birth', value: student.birth_date, tab: 'personal', tabLabel: 'Personal Info', icon: Calendar },
      { label: 'Age', value: student.age?.toString() || null, tab: 'personal', tabLabel: 'Personal Info' },
      { label: 'Gender', value: student.gender, tab: 'personal', tabLabel: 'Personal Info' },
      { label: 'Level', value: student.level, tab: 'personal', tabLabel: 'Personal Info', icon: School },
      { label: "Mother's Maiden Name", value: student.mother_maiden_name, tab: 'parents', tabLabel: 'Parents/Guardian' },
      { label: "Mother's Contact", value: student.mother_contact, tab: 'parents', tabLabel: 'Parents/Guardian', icon: Phone },
      { label: "Father's Name", value: student.father_name, tab: 'parents', tabLabel: 'Parents/Guardian' },
      { label: "Father's Contact", value: student.father_contact, tab: 'parents', tabLabel: 'Parents/Guardian', icon: Phone },
      { label: 'Philippines Address', value: student.phil_address, tab: 'address', tabLabel: 'Address', icon: MapPin },
      { label: 'UAE Address', value: student.uae_address, tab: 'address', tabLabel: 'Address', icon: MapPin },
      { label: 'Current Level', value: student.level, tab: 'academic', tabLabel: 'Academic', icon: School },
      { label: 'Previous School', value: student.previous_school, tab: 'academic', tabLabel: 'Academic', icon: School },
    ];
  }, [student]);

  // Filter search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return searchableFields.filter(field => 
      field.value?.toLowerCase().includes(query) || 
      field.label.toLowerCase().includes(query)
    );
  }, [searchQuery, searchableFields]);

  const isSearching = searchQuery.trim().length > 0;

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    setIsUploadingPhoto(true);
    try {
      await uploadPhoto.mutateAsync({ studentId: student.id, file });
      toast.success('Photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDocumentUpload = async (slot: number, file: File) => {
    await uploadDocument.mutateAsync({ 
      studentId: student.id, 
      slotNumber: slot, 
      file 
    });
  };

  const handleDocumentDelete = async (slot: number, documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    await deleteDocument.mutateAsync({ 
      documentId, 
      studentId: student.id,
      fileUrl: doc?.file_url || null
    });
  };

  const getDocumentForSlot = (slot: number): StudentDocument | null => {
    return documents.find(d => d.slot_number === slot) || null;
  };

  const highlightMatch = (text: string | null, query: string) => {
    if (!text || !query.trim()) return text || 'Not provided';
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-stat-yellow text-foreground px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const InfoItem = ({ label, value, icon: Icon, highlight = false }: { 
    label: string; 
    value: string | null; 
    icon?: any;
    highlight?: boolean;
  }) => (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {highlight ? highlightMatch(label, searchQuery) : label}
      </p>
      <p className="text-foreground font-medium">
        {highlight ? highlightMatch(value, searchQuery) : (value || 'Not provided')}
      </p>
    </div>
  );

  const handleSearchResultClick = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] bg-card rounded-2xl shadow-lg z-50 overflow-hidden flex flex-col"
          >
            {/* Header with Photo */}
            <div className="px-6 py-6 border-b border-border bg-gradient-to-r from-stat-purple/10 via-stat-pink/5 to-transparent">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                  {/* Photo Upload Area */}
                  <div className="relative group">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    {student.photo_url ? (
                      <img 
                        src={student.photo_url} 
                        alt={student.student_name}
                        className="h-20 w-20 rounded-2xl object-cover border-4 border-stat-purple-light shadow-lg"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-stat-purple to-stat-pink flex items-center justify-center border-4 border-stat-purple-light shadow-lg">
                        <span className="text-3xl font-bold text-white">
                          {student.student_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* Upload Overlay */}
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-stat-green border-2 border-card flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{student.student_name}</h2>
                    <p className="text-stat-purple font-medium">{student.level}</p>
                    <p className="text-sm text-muted-foreground font-mono">LRN: {student.lrn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 no-print">
                  <Button variant="ghost" size="icon" onClick={handlePrint} aria-label="Print">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student information..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search Results */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border overflow-hidden"
                >
                  <div className="p-4 bg-stat-purple-light/30 max-h-48 overflow-y-auto">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    {searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((result, index) => (
                          <motion.button
                            key={`${result.tab}-${result.label}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSearchResultClick(result.tab)}
                            className="w-full text-left p-3 rounded-lg bg-card hover:bg-secondary transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {highlightMatch(result.value || 'Not provided', searchQuery)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {result.label} • {result.tabLabel}
                                </p>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-full bg-stat-purple/10 text-stat-purple">
                                {result.tabLabel}
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No matching information found
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            {!isSearching && (
              <div className="px-6 py-3 border-b border-border no-print overflow-x-auto">
                <div className="flex gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === tab.id
                          ? "bg-stat-purple text-white"
                          : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                      )}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'personal' && !isSearching && (
                  <motion.div
                    key="personal"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    <InfoItem label="Full Name" value={student.student_name} icon={User} />
                    <InfoItem label="LRN" value={student.lrn} icon={Mail} />
                    <InfoItem label="Date of Birth" value={student.birth_date} icon={Calendar} />
                    <InfoItem label="Age" value={student.age?.toString() || null} />
                    <InfoItem label="Gender" value={student.gender} />
                    <InfoItem label="Level" value={student.level} icon={School} />
                  </motion.div>
                )}

                {activeTab === 'parents' && !isSearching && (
                  <motion.div
                    key="parents"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="p-4 rounded-xl bg-stat-pink-light">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-stat-pink" />
                        Mother's Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem label="Maiden Name" value={student.mother_maiden_name} />
                        <InfoItem label="Contact Number" value={student.mother_contact} icon={Phone} />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-stat-purple-light">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-stat-purple" />
                        Father's Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem label="Full Name" value={student.father_name} />
                        <InfoItem label="Contact Number" value={student.father_contact} icon={Phone} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'address' && !isSearching && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="p-4 rounded-xl bg-stat-green-light">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-stat-green" />
                        Philippines Address
                      </h3>
                      <p className="text-foreground">{student.phil_address || 'Not provided'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-stat-yellow-light">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-stat-yellow" />
                        UAE Address
                      </h3>
                      <p className="text-foreground">{student.uae_address || 'Not provided'}</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'academic' && !isSearching && (
                  <motion.div
                    key="academic"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InfoItem label="Current Level" value={student.level} icon={School} />
                      <InfoItem label="LRN" value={student.lrn} />
                    </div>
                    <div className="p-4 rounded-xl bg-stat-purple-light">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <School className="h-4 w-4 text-stat-purple" />
                        Previous School
                      </h3>
                      <p className="text-foreground">{student.previous_school || 'Not provided'}</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'documents' && !isSearching && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Student Documents</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload and manage student documents. Drag and drop or click to upload files.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((slot, index) => (
                        <DocumentSlot
                          key={slot}
                          slot={slot}
                          studentId={student.id}
                          document={getDocumentForSlot(slot)}
                          onUpload={handleDocumentUpload}
                          onDelete={handleDocumentDelete}
                          index={index}
                        />
                      ))}
                    </div>
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
