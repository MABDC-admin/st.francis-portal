import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  FileUp,
  GraduationCap,
  IdCard,
  Loader2,
  MapPin,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
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
  updated_at?: string | null;
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

interface ClassScheduleProfile {
  id: string;
  grade_level: string;
  section: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subjects?: { name: string | null; code: string | null } | null;
  academic_years?: { name: string | null; is_current: boolean | null } | null;
}

interface AdvisorySectionProfile {
  id: string;
  name: string;
  grade_level: string;
  capacity: number | null;
  is_active: boolean | null;
  notes: string | null;
  academic_years?: { name: string | null; is_current: boolean | null } | null;
}

interface CredentialProfile {
  id: string;
  role: string;
  email: string;
  user_id: string | null;
  password_changed: boolean | null;
  created_at: string | null;
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
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const bucket = supabase.storage.from('teacher-applications');

const safeDate = (value: string | null | undefined) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const safeDateTime = (value: string | null | undefined) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const safeValue = (value: ReactNode) => {
  if (value === null || value === undefined || value === '') return 'Not set';
  return value;
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return 'Not set';
  const [hourValue, minuteValue = '00'] = value.split(':');
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'T';

const joinValues = (values: Array<string | null | undefined>) =>
  values.filter(Boolean).join(', ') || 'Not set';

const InfoPanel = ({
  title,
  icon: Icon,
  children,
  accent = 'from-slate-50 to-white',
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  accent?: string;
}) => (
  <section className={`rounded-2xl border bg-gradient-to-br ${accent} p-4 shadow-sm`}>
    <div className="mb-4 flex items-center gap-2">
      <div className="rounded-xl bg-white/90 p-2 text-primary shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="font-semibold text-foreground">{title}</h4>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
  </section>
);

const DetailItem = ({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) => (
  <div className={wide ? 'md:col-span-2' : ''}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="mt-1 text-sm font-medium text-foreground">{safeValue(value)}</div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
    {message}
  </div>
);

export const TeacherProfileDialog = ({
  teacher,
  open,
  onOpenChange,
  selectedSchool,
}: TeacherProfileDialogProps) => {
  const [applicationProfile, setApplicationProfile] = useState<TeacherApplication | null>(null);
  const [singleDocuments, setSingleDocuments] = useState<Record<SingleDocumentKey, DocumentEntry | null>>(buildEmptySingleDocs());
  const [certificates, setCertificates] = useState<DocumentEntry[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassScheduleProfile[]>([]);
  const [advisorySections, setAdvisorySections] = useState<AdvisorySectionProfile[]>([]);
  const [credentialProfile, setCredentialProfile] = useState<CredentialProfile | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
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

  const initials = useMemo(() => getInitials(profileName), [profileName]);

  const subjectList = useMemo(() => {
    const subjects = applicationProfile?.subject_specialization?.length
      ? applicationProfile.subject_specialization
      : teacher?.subjects || [];
    return subjects.filter(Boolean);
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

  const loadRelatedRecords = useCallback(async (teacherValue: TeacherProfileSubject) => {
    const scheduleQuery = (supabase.from('class_schedules') as any)
      .select('*, subjects:subject_id(name, code), academic_years:academic_year_id(name, is_current)')
      .eq('teacher_id', teacherValue.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    const sectionQuery = (supabase.from('sections') as any)
      .select('*, academic_years:academic_year_id(name, is_current)')
      .eq('advisor_teacher_id', teacherValue.id)
      .order('grade_level', { ascending: true })
      .order('name', { ascending: true });

    const [scheduleResult, sectionResult] = await Promise.all([scheduleQuery, sectionQuery]);

    if (scheduleResult.error) {
      console.warn('Failed to load teacher schedules', scheduleResult.error);
      setClassSchedules([]);
    } else {
      setClassSchedules((scheduleResult.data || []) as ClassScheduleProfile[]);
    }

    if (sectionResult.error) {
      console.warn('Failed to load advisory sections', sectionResult.error);
      setAdvisorySections([]);
    } else {
      setAdvisorySections((sectionResult.data || []) as AdvisorySectionProfile[]);
    }

    let credentialRows: CredentialProfile[] = [];
    if (teacherValue.user_id) {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('id, role, email, user_id, password_changed, created_at')
        .eq('user_id', teacherValue.user_id)
        .limit(1);

      if (!error) credentialRows = (data || []) as CredentialProfile[];
    }

    if (credentialRows.length === 0) {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('id, role, email, user_id, password_changed, created_at')
        .eq('teacher_id', teacherValue.id)
        .limit(1);

      if (!error) credentialRows = (data || []) as CredentialProfile[];
    }

    if (credentialRows.length === 0) {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('id, role, email, user_id, password_changed, created_at')
        .ilike('email', teacherValue.email)
        .limit(1);

      if (!error) credentialRows = (data || []) as CredentialProfile[];
    }

    setCredentialProfile(credentialRows[0] || null);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!open || !teacher) return;
    setIsLoading(true);
    setLoadError(null);
    setApplicationProfile(null);
    setSingleDocuments(buildEmptySingleDocs());
    setCertificates([]);
    setClassSchedules([]);
    setAdvisorySections([]);
    setCredentialProfile(null);
    setProfilePhotoUrl(null);

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

      if (profile?.photo_url) {
        const signedPhoto = await getSignedUrl(profile.photo_url);
        setProfilePhotoUrl(signedPhoto);
      }

      await Promise.all([loadDocuments(teacher, profile), loadRelatedRecords(teacher)]);
    } catch (error: any) {
      console.error('Failed to load teacher profile', error);
      setLoadError(error?.message || 'Failed to load teacher profile');
      setApplicationProfile(null);
      setSingleDocuments(buildEmptySingleDocs());
      setCertificates([]);
      setClassSchedules([]);
      setAdvisorySections([]);
      setCredentialProfile(null);
      setProfilePhotoUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [getSignedUrl, loadDocuments, loadRelatedRecords, open, selectedSchool, teacher]);

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
      <DialogContent className="h-[92vh] max-w-6xl p-0">
        <DialogHeader className="border-b px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Teacher Profile
          </DialogTitle>
          <DialogDescription>
            Complete personnel profile for {teacher.full_name}, including service record, DepEd details,
            teaching load, advisory sections, and profiling documents.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex h-full flex-col overflow-hidden">
          <div className="px-6 pt-3">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deped">DepEd Profile</TabsTrigger>
              <TabsTrigger value="load">Teaching Load</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-3 flex-1 overflow-hidden px-6 pb-6">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-14 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading profile...
                </div>
              ) : (
                <div className="space-y-5">
                  {loadError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {loadError}
                    </div>
                  )}

                  <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
                    <div className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-sky-500 to-emerald-500 text-3xl font-black text-white shadow-lg">
                        {profilePhotoUrl ? (
                          <img src={profilePhotoUrl} alt={profileName} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{profileName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {teacher.employee_id} • {teacher.department || 'Department not set'} •{' '}
                            {teacher.school || selectedSchool}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                            {teacher.status || 'Unknown status'}
                          </Badge>
                          <Badge variant="outline">{teacher.grade_level || 'Grade level not set'}</Badge>
                          {applicationProfile?.status && (
                            <Badge variant="outline">Application: {applicationProfile.status}</Badge>
                          )}
                          {credentialProfile?.role && (
                            <Badge variant="outline">Portal Role: {credentialProfile.role}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center md:min-w-64">
                        <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                          <p className="text-2xl font-black text-sky-700">{classSchedules.length}</p>
                          <p className="text-xs text-muted-foreground">Schedules</p>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                          <p className="text-2xl font-black text-emerald-700">{advisorySections.length}</p>
                          <p className="text-xs text-muted-foreground">Advisory</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <InfoPanel title="Service Record" icon={IdCard} accent="from-blue-50 to-white">
                      <DetailItem label="Employee ID" value={teacher.employee_id} />
                      <DetailItem label="Employment Status" value={teacher.status || 'Unknown'} />
                      <DetailItem label="Department" value={teacher.department} />
                      <DetailItem label="School" value={teacher.school || selectedSchool} />
                      <DetailItem label="Created" value={safeDateTime(teacher.created_at)} />
                      <DetailItem label="Updated" value={safeDateTime(teacher.updated_at)} />
                    </InfoPanel>

                    <InfoPanel title="Contact and Account" icon={ShieldCheck} accent="from-emerald-50 to-white">
                      <DetailItem label="Email" value={teacher.email} />
                      <DetailItem label="Phone" value={teacher.phone || applicationProfile?.mobile_number} />
                      <DetailItem label="Linked User ID" value={teacher.user_id || credentialProfile?.user_id} />
                      <DetailItem label="Credential Email" value={credentialProfile?.email} />
                      <DetailItem label="Portal Role" value={credentialProfile?.role} />
                      <DetailItem
                        label="Password Changed"
                        value={credentialProfile ? (credentialProfile.password_changed ? 'Yes' : 'No') : 'Not linked'}
                      />
                    </InfoPanel>
                  </div>

                  <InfoPanel title="Teaching Assignment Snapshot" icon={BookOpen} accent="from-amber-50 to-white">
                    <DetailItem label="Assigned Grade Level" value={teacher.grade_level} />
                    <DetailItem label="Advisory Sections" value={`${advisorySections.length} section(s)`} />
                    <DetailItem
                      label="Subjects"
                      wide
                      value={
                        subjectList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {subjectList.map((subject) => (
                              <Badge key={subject} variant="secondary">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          'Not set'
                        )
                      }
                    />
                  </InfoPanel>

                  {!applicationProfile && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      No linked DepEd application profile was found for this teacher. The service record,
                      account details, schedules, advisory sections, and document uploads are still available.
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="deped" className="mt-3 flex-1 overflow-hidden px-6 pb-6">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-14 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading DepEd profile...
                </div>
              ) : !applicationProfile ? (
                <EmptyState message="No DepEd application profile is linked yet. Match the teacher email with a teacher application record to populate this tab." />
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <InfoPanel title="Personal Information" icon={UserCheck} accent="from-cyan-50 to-white">
                      <DetailItem label="First Name" value={applicationProfile.first_name} />
                      <DetailItem label="Middle Name" value={applicationProfile.middle_name} />
                      <DetailItem label="Last Name" value={applicationProfile.last_name} />
                      <DetailItem label="Suffix" value={applicationProfile.suffix} />
                      <DetailItem label="Gender" value={applicationProfile.gender} />
                      <DetailItem label="Birth Date" value={safeDate(applicationProfile.date_of_birth)} />
                      <DetailItem label="Civil Status" value={applicationProfile.civil_status} />
                      <DetailItem label="Nationality" value={applicationProfile.nationality} />
                      <DetailItem label="Birth Place" value={applicationProfile.place_of_birth} wide />
                    </InfoPanel>

                    <InfoPanel title="Contact and Address" icon={MapPin} accent="from-orange-50 to-white">
                      <DetailItem label="Email" value={applicationProfile.email} />
                      <DetailItem label="Mobile" value={applicationProfile.mobile_number} />
                      <DetailItem label="Alternate Mobile" value={applicationProfile.alternate_mobile} />
                      <DetailItem label="Zip Code" value={applicationProfile.zip_code} />
                      <DetailItem
                        label="Address"
                        value={joinValues([
                          applicationProfile.house_street,
                          applicationProfile.barangay,
                          applicationProfile.city_municipality,
                          applicationProfile.province,
                          applicationProfile.country,
                        ])}
                        wide
                      />
                    </InfoPanel>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <InfoPanel title="Professional Details" icon={BriefcaseBusiness} accent="from-violet-50 to-white">
                      <DetailItem
                        label="Position Applied"
                        value={applicationProfile.position_applied || teacher.department || 'Teacher'}
                      />
                      <DetailItem label="Preferred Level" value={applicationProfile.preferred_level || teacher.grade_level} />
                      <DetailItem label="Expected Salary" value={applicationProfile.expected_salary} />
                      <DetailItem label="Available Start" value={safeDate(applicationProfile.available_start_date)} />
                      <DetailItem
                        label="Specializations"
                        wide
                        value={
                          subjectList.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {subjectList.map((subject) => (
                                <Badge key={subject} variant="secondary">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            'Not set'
                          )
                        }
                      />
                    </InfoPanel>

                    <InfoPanel title="PRC and Experience" icon={FileCheck2} accent="from-rose-50 to-white">
                      <DetailItem label="PRC Licensed" value={applicationProfile.has_prc_license ? 'Yes' : 'No'} />
                      <DetailItem label="PRC Number" value={applicationProfile.prc_license_number} />
                      <DetailItem label="PRC Expiration" value={safeDate(applicationProfile.prc_expiration_date)} />
                      <DetailItem label="Has Experience" value={applicationProfile.has_experience ? 'Yes' : 'No'} />
                      <DetailItem label="Application Reference" value={applicationProfile.reference_number} />
                      <DetailItem label="Reviewed At" value={safeDateTime(applicationProfile.reviewed_at)} />
                    </InfoPanel>
                  </div>

                  <InfoPanel title="Narrative Notes" icon={FileText} accent="from-slate-50 to-white">
                    <DetailItem label="Teaching Philosophy" value={applicationProfile.teaching_philosophy} wide />
                    <DetailItem label="Why Join" value={applicationProfile.why_join} wide />
                    <DetailItem label="Reviewer Notes" value={applicationProfile.notes} wide />
                    {applicationProfile.rejection_reason && (
                      <DetailItem label="Rejection Reason" value={applicationProfile.rejection_reason} wide />
                    )}
                  </InfoPanel>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-semibold">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </h4>
                    {parseEducation.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {parseEducation.map((edu, index) => (
                          <div key={`edu-${index}`} className="rounded-xl border bg-white p-4 text-sm shadow-sm">
                            <p className="font-semibold">{edu.course || edu.level || 'Education Entry'}</p>
                            <p className="text-muted-foreground">
                              {joinValues([edu.school, edu.year_graduated || edu.year])}
                            </p>
                            {edu.honors && <p className="mt-2 text-muted-foreground">Honors: {edu.honors}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No education entries found." />
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 font-semibold">
                      <Building2 className="h-4 w-4" />
                      Teaching Experience
                    </h4>
                    {parseExperience.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {parseExperience.map((exp, index) => (
                          <div key={`exp-${index}`} className="rounded-xl border bg-white p-4 text-sm shadow-sm">
                            <p className="font-semibold">{exp.position || 'Position not set'}</p>
                            <p className="text-muted-foreground">
                              {joinValues([exp.school, exp.start_date, exp.end_date])}
                            </p>
                            {exp.description && <p className="mt-2 text-muted-foreground">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No teaching experience entries found." />
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="load" className="mt-3 flex-1 overflow-hidden px-6 pb-6">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-14 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading teaching load...
                </div>
              ) : (
                <div className="space-y-5">
                  <InfoPanel title="Advisory Sections" icon={Users} accent="from-emerald-50 to-white">
                    <DetailItem label="Total Advisory Sections" value={`${advisorySections.length} section(s)`} />
                    <DetailItem label="Assigned Grade" value={teacher.grade_level} />
                  </InfoPanel>

                  {advisorySections.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {advisorySections.map((section) => (
                        <div key={section.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-bold">
                                {section.grade_level} - {section.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {section.academic_years?.name || 'Academic year not set'}
                              </p>
                            </div>
                            <Badge variant={section.is_active ? 'default' : 'secondary'}>
                              {section.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <DetailItem label="Capacity" value={section.capacity} />
                            <DetailItem label="Current Year" value={section.academic_years?.is_current ? 'Yes' : 'No'} />
                          </div>
                          {section.notes && <p className="mt-3 text-sm text-muted-foreground">{section.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No advisory section is assigned to this teacher." />
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Class Schedule</h4>
                    </div>

                    {classSchedules.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {classSchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"
                          >
                            <div>
                              <p className="font-bold">
                                {schedule.subjects?.name || 'Subject not linked'}
                                {schedule.subjects?.code ? ` (${schedule.subjects.code})` : ''}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.grade_level}
                                {schedule.section ? ` - ${schedule.section}` : ''}
                              </p>
                            </div>
                            <div className="text-sm">
                              <p className="font-medium">{DAYS[schedule.day_of_week] || `Day ${schedule.day_of_week}`}</p>
                              <p className="text-muted-foreground">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </p>
                            </div>
                            <div className="text-sm">
                              <p className="font-medium">{schedule.room || 'Room not set'}</p>
                              <p className="text-muted-foreground">{schedule.academic_years?.name || 'Year not set'}</p>
                            </div>
                            <Badge variant={schedule.academic_years?.is_current ? 'default' : 'outline'}>
                              {schedule.academic_years?.is_current ? 'Current AY' : 'Archived/Other AY'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No class schedule is assigned to this teacher." />
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents" className="mt-3 flex-1 overflow-hidden px-6 pb-6">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload DepEd profiling documents. Maximum file size is 30MB each.
                </p>

                {SINGLE_DOCUMENTS.map((doc) => {
                  const entry = singleDocuments[doc.key];
                  return (
                    <div key={doc.key} className="space-y-2 rounded-lg border p-4">
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

                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline">
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

                <div className="space-y-3 rounded-lg border p-4">
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

                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline">
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

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => loadProfile()} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Refresh Profile
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
