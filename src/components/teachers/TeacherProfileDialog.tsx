import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileUp, ExternalLink, FileText, Mail, Phone, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { SchoolType } from '@/contexts/SchoolContext';

type TeacherApplication = Database['public']['Tables']['teacher_applications']['Row'];

interface TeacherProfileSubject {
  id: string;
  user_id: string | null;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  grade_level: string | null;
  subjects: string[] | null;
  status: string;
  school: string | null;
  created_at: string;
}

interface TeacherProfileDialogProps {
  teacher: TeacherProfileSubject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSchool: SchoolType;
}

type SingleDocumentKey = 'resume' | 'transcript' | 'diploma' | 'validId' | 'prcLicense';

interface DocumentEntry {
  path: string;
  url: string;
  source: 'profile' | 'storage';
}

const SINGLE_DOCUMENTS: {
  key: SingleDocumentKey;
  label: string;
  folder: string;
  appField: keyof Pick<
    TeacherApplication,
    'resume_url' | 'transcript_url' | 'diploma_url' | 'valid_id_url' | 'prc_license_url'
  >;
}[] = [
  { key: 'resume', label: 'Resume / CV', folder: 'resume', appField: 'resume_url' },
  { key: 'transcript', label: 'Transcript of Records', folder: 'transcript', appField: 'transcript_url' },
  { key: 'diploma', label: 'Diploma', folder: 'diploma', appField: 'diploma_url' },
  { key: 'validId', label: 'Valid ID', folder: 'valid-id', appField: 'valid_id_url' },
  { key: 'prcLicense', label: 'PRC License', folder: 'prc-license', appField: 'prc_license_url' },
];

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const FILE_ACCEPT = 'image/*,.pdf,.doc,.docx';
const bucket = supabase.storage.from('teacher-applications');

const safeDate = (value: string | null | undefined) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fileNameFromPath = (path: string) => {
  const raw = path.split('/').pop() || path;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const sanitizeName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const isAbsoluteHttp = (value: string) => /^https?:\/\//i.test(value);

const buildEmptySingleDocs = (): Record<SingleDocumentKey, DocumentEntry | null> => ({
  resume: null,
  transcript: null,
  diploma: null,
  validId: null,
  prcLicense: null,
});

export const TeacherProfileDialog = ({
  teacher,
  open,
  onOpenChange,
  selectedSchool,
}: TeacherProfileDialogProps) => {
  const [applicationProfile, setApplicationProfile] = useState<TeacherApplication | null>(null);
  const [singleDocuments, setSingleDocuments] = useState<Record<SingleDocumentKey, DocumentEntry | null>>(buildEmptySingleDocs());
  const [certificates, setCertificates] = useState<DocumentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const profileName = useMemo(() => {
    if (!teacher) return '';
    if (!applicationProfile) return teacher.full_name;
    return [
      applicationProfile.first_name,
      applicationProfile.middle_name,
      applicationProfile.last_name,
      applicationProfile.suffix,
    ]
      .filter(Boolean)
      .join(' ');
  }, [applicationProfile, teacher]);

  const parseEducation = useMemo(() => {
    if (!applicationProfile) return [];
    return Array.isArray(applicationProfile.education) ? (applicationProfile.education as any[]) : [];
  }, [applicationProfile]);

  const parseExperience = useMemo(() => {
    if (!applicationProfile) return [];
    return Array.isArray(applicationProfile.experience) ? (applicationProfile.experience as any[]) : [];
  }, [applicationProfile]);

  const getSignedUrl = useCallback(async (path: string) => {
    if (!path) return null;
    if (isAbsoluteHttp(path)) return path;
    const { data, error } = await bucket.createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, []);

  const loadDocuments = useCallback(
    async (teacherValue: TeacherProfileSubject, profile: TeacherApplication | null) => {
      const basePath = `teacher-profiles/${teacherValue.id}`;
      const nextSingleDocs = buildEmptySingleDocs();

      const profileDocs: Record<SingleDocumentKey, string | null> = {
        resume: profile?.resume_url || null,
        transcript: profile?.transcript_url || null,
        diploma: profile?.diploma_url || null,
        validId: profile?.valid_id_url || null,
        prcLicense: profile?.prc_license_url || null,
      };

      for (const doc of SINGLE_DOCUMENTS) {
        let finalPath: string | null = profileDocs[doc.key];
        let source: 'profile' | 'storage' = finalPath ? 'profile' : 'storage';
        const folder = `${basePath}/${doc.folder}`;

        const { data: listed } = await bucket.list(folder, {
          limit: 20,
          sortBy: { column: 'name', order: 'desc' },
        });

        if (listed && listed.length > 0) {
          finalPath = `${folder}/${listed[0].name}`;
          source = 'storage';
        }

        if (!finalPath) continue;
        const signed = await getSignedUrl(finalPath);
        if (!signed) continue;

        nextSingleDocs[doc.key] = {
          path: finalPath,
          url: signed,
          source,
        };
      }

      const certSet = new Set<string>();
      const nextCertificates: DocumentEntry[] = [];
      const profileCerts = Array.isArray(profile?.certificates_url) ? profile?.certificates_url : [];

      for (const path of profileCerts) {
        if (!path || certSet.has(path)) continue;
        const signed = await getSignedUrl(path);
        if (!signed) continue;
        certSet.add(path);
        nextCertificates.push({ path, url: signed, source: 'profile' });
      }

      const certFolder = `${basePath}/certificates`;
      const { data: listedCerts } = await bucket.list(certFolder, {
        limit: 100,
        sortBy: { column: 'name', order: 'desc' },
      });

      for (const item of listedCerts || []) {
        const path = `${certFolder}/${item.name}`;
        if (certSet.has(path)) continue;
        const signed = await getSignedUrl(path);
        if (!signed) continue;
        certSet.add(path);
        nextCertificates.push({ path, url: signed, source: 'storage' });
      }

      setSingleDocuments(nextSingleDocs);
      setCertificates(nextCertificates);
    },
    [getSignedUrl],
  );

  const loadProfile = useCallback(async () => {
    if (!open || !teacher) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data: schoolRow } = await supabase
        .from('schools')
        .select('id')
        .eq('code', selectedSchool)
        .maybeSingle();

      const schoolId = schoolRow?.id || null;

      let rows: TeacherApplication[] = [];
      if (schoolId) {
        const { data, error } = await supabase
          .from('teacher_applications')
          .select('*')
          .eq('email', teacher.email)
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) throw error;
        rows = (data || []) as TeacherApplication[];
      }

      if (rows.length === 0) {
        const { data, error } = await supabase
          .from('teacher_applications')
          .select('*')
          .eq('email', teacher.email)
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) throw error;
        rows = (data || []) as TeacherApplication[];
      }

      const profile = rows[0] || null;
      setApplicationProfile(profile);
      await loadDocuments(teacher, profile);
    } catch (error: any) {
      console.error('Failed to load teacher profile', error);
      setLoadError(error?.message || 'Failed to load teacher profile');
      setApplicationProfile(null);
      setSingleDocuments(buildEmptySingleDocs());
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadDocuments, open, selectedSchool, teacher]);

  useEffect(() => {
    if (!open) return;
    loadProfile();
  }, [loadProfile, open]);

  const handleSingleUpload = async (key: SingleDocumentKey, file: File | null) => {
    if (!teacher || !file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File must be under 30MB');
      return;
    }

    const docMeta = SINGLE_DOCUMENTS.find((doc) => doc.key === key);
    if (!docMeta) return;

    const basePath = `teacher-profiles/${teacher.id}/${docMeta.folder}`;
    const filePath = `${basePath}/${Date.now()}-${sanitizeName(file.name)}`;
    setUploadingKey(key);

    try {
      const { data: existing } = await bucket.list(basePath, { limit: 100 });
      const removeTargets = (existing || []).map((item) => `${basePath}/${item.name}`);
      if (removeTargets.length > 0) {
        await bucket.remove(removeTargets);
      }

      const { error: uploadError } = await bucket.upload(filePath, file);
      if (uploadError) throw uploadError;

      if (applicationProfile?.id) {
        const payload: Partial<TeacherApplication> = {
          [docMeta.appField]: filePath,
        };
        const { error: updateError } = await supabase
          .from('teacher_applications')
          .update(payload as any)
          .eq('id', applicationProfile.id);
        if (updateError) {
          toast.warning('Uploaded to storage but profile record did not update.');
        }
      } else {
        toast.info('Uploaded to profile storage. DepEd profile record not yet linked for this teacher.');
      }

      toast.success(`${docMeta.label} uploaded`);
      await loadProfile();
    } catch (error: any) {
      toast.error(error?.message || 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleCertificateUpload = async (file: File | null) => {
    if (!teacher || !file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File must be under 30MB');
      return;
    }

    const folder = `teacher-profiles/${teacher.id}/certificates`;
    const filePath = `${folder}/${Date.now()}-${sanitizeName(file.name)}`;
    setUploadingKey('certificates');

    try {
      const { error: uploadError } = await bucket.upload(filePath, file);
      if (uploadError) throw uploadError;

      if (applicationProfile?.id) {
        const nextCertificates = Array.from(
          new Set([...(applicationProfile.certificates_url || []), filePath]),
        );

        const { error: updateError } = await supabase
          .from('teacher_applications')
          .update({ certificates_url: nextCertificates })
          .eq('id', applicationProfile.id);

        if (updateError) {
          toast.warning('Certificate uploaded to storage but profile record did not update.');
        }
      } else {
        toast.info('Certificate uploaded to profile storage. DepEd profile record not yet linked for this teacher.');
      }

      toast.success('Certificate uploaded');
      await loadProfile();
    } catch (error: any) {
      toast.error(error?.message || 'Certificate upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Teacher Profile
          </DialogTitle>
          <DialogDescription>
            DepEd-style profiling view for {teacher.full_name}. Upload and maintain profiling documents.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="h-full flex flex-col">
          <div className="px-6 pt-3">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="flex-1 px-6 pb-6 mt-3 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-14 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading profile...
                </div>
              ) : (
                <div className="space-y-5">
                  {loadError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {loadError}
                    </div>
                  )}

                  <div className="rounded-lg border p-4 bg-muted/20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{profileName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {teacher.employee_id} • {teacher.department || 'Department not set'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                          {teacher.status || 'Unknown'}
                        </Badge>
                        {applicationProfile?.status && (
                          <Badge variant="outline">DepEd Form: {applicationProfile.status}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {teacher.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {teacher.phone || 'No phone'}
                      </div>
                    </div>
                  </div>

                  {!applicationProfile && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      No linked DepEd application profile found for this teacher yet. You can still upload
                      profiling documents in the Documents tab.
                    </div>
                  )}

                  {applicationProfile && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4 space-y-2">
                          <h4 className="font-semibold">Personal Information</h4>
                          <p className="text-sm text-muted-foreground">Gender: {applicationProfile.gender || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">Birth Date: {safeDate(applicationProfile.date_of_birth)}</p>
                          <p className="text-sm text-muted-foreground">Civil Status: {applicationProfile.civil_status || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">Nationality: {applicationProfile.nationality || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">Birth Place: {applicationProfile.place_of_birth || 'Not set'}</p>
                        </div>
                        <div className="rounded-lg border p-4 space-y-2">
                          <h4 className="font-semibold">Contact and Address</h4>
                          <p className="text-sm text-muted-foreground">Mobile: {applicationProfile.mobile_number || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">Alternate: {applicationProfile.alternate_mobile || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">
                            Address: {[applicationProfile.house_street, applicationProfile.barangay, applicationProfile.city_municipality, applicationProfile.province]
                              .filter(Boolean)
                              .join(', ') || 'Not set'}
                          </p>
                          <p className="text-sm text-muted-foreground">Zip Code: {applicationProfile.zip_code || 'Not set'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4 space-y-2">
                          <h4 className="font-semibold">Professional Details</h4>
                          <p className="text-sm text-muted-foreground">Position Applied: {applicationProfile.position_applied || teacher.department || 'Teacher'}</p>
                          <p className="text-sm text-muted-foreground">Preferred Level: {applicationProfile.preferred_level || teacher.grade_level || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">
                            Specialization: {(applicationProfile.subject_specialization || teacher.subjects || []).join(', ') || 'Not set'}
                          </p>
                          <p className="text-sm text-muted-foreground">Expected Salary: {applicationProfile.expected_salary || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">Available Start: {safeDate(applicationProfile.available_start_date)}</p>
                        </div>
                        <div className="rounded-lg border p-4 space-y-2">
                          <h4 className="font-semibold">PRC and Experience</h4>
                          <p className="text-sm text-muted-foreground">
                            PRC Licensed: {applicationProfile.has_prc_license ? 'Yes' : 'No'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PRC License Number: {applicationProfile.prc_license_number || 'Not set'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PRC Expiration: {safeDate(applicationProfile.prc_expiration_date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Has Experience: {applicationProfile.has_experience ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-semibold">Education</h4>
                        {parseEducation.length > 0 ? (
                          <div className="space-y-2">
                            {parseEducation.map((edu, index) => (
                              <div key={`edu-${index}`} className="rounded-md border p-3 text-sm">
                                <p className="font-medium">{edu.course || edu.level || 'Education Entry'}</p>
                                <p className="text-muted-foreground">
                                  {[edu.school, edu.year_graduated].filter(Boolean).join(' • ') || 'No details'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No education entries found.</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Teaching Experience</h4>
                        {parseExperience.length > 0 ? (
                          <div className="space-y-2">
                            {parseExperience.map((exp, index) => (
                              <div key={`exp-${index}`} className="rounded-md border p-3 text-sm">
                                <p className="font-medium">{exp.position || 'Position not set'}</p>
                                <p className="text-muted-foreground">
                                  {[exp.school, exp.start_date, exp.end_date].filter(Boolean).join(' • ') || 'No details'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No teaching experience entries found.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 px-6 pb-6 mt-3 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload DepEd profiling documents. Maximum file size is 30MB each.
                </p>

                {SINGLE_DOCUMENTS.map((doc) => {
                  const entry = singleDocuments[doc.key];
                  return (
                    <div key={doc.key} className="rounded-lg border p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{doc.label}</p>
                        {entry ? (
                          <Badge variant="outline">
                            {entry.source === 'profile' ? 'From profile record' : 'From storage folder'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not uploaded</Badge>
                        )}
                      </div>

                      {entry ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {fileNameFromPath(entry.path)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">No file uploaded yet.</p>
                      )}

                      <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                        <FileUp className="h-4 w-4" />
                        {uploadingKey === doc.key ? 'Uploading...' : `Upload ${doc.label}`}
                        <input
                          type="file"
                          className="hidden"
                          accept={FILE_ACCEPT}
                          disabled={uploadingKey === doc.key}
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            handleSingleUpload(doc.key, file);
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                    </div>
                  );
                })}

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Certificates and Trainings</p>
                    <Badge variant={certificates.length > 0 ? 'outline' : 'secondary'}>
                      {certificates.length} file{certificates.length === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  {certificates.length > 0 ? (
                    <div className="space-y-2">
                      {certificates.map((entry, index) => (
                        <a
                          key={`${entry.path}-${index}`}
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {fileNameFromPath(entry.path)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No certificates uploaded yet.</p>
                  )}

                  <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                    <FileUp className="h-4 w-4" />
                    {uploadingKey === 'certificates' ? 'Uploading...' : 'Add Certificate'}
                    <input
                      type="file"
                      className="hidden"
                      accept={FILE_ACCEPT}
                      disabled={uploadingKey === 'certificates'}
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        handleCertificateUpload(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
