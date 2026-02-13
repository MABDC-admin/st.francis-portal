import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Camera, Save, Loader2, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const NAME_MAX_LENGTH = 100;
const PHONE_PATTERN = /^[+\d\s\-()]*$/;
const EMPLOYEE_ID_MAX = 20;

const sanitize = (val: string) => val.replace(/<[^>]*>/g, '').trim();

const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));

      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 300, 300);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

interface FormErrors {
  full_name?: string;
  phone?: string;
  employee_id?: string;
  years_of_service?: string;
  department?: string;
  position?: string;
}

export const UserProfilePage = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<Blob | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    department: '',
    position: '',
    years_of_service: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: (profile as any).phone || '',
        employee_id: (profile as any).employee_id || '',
        department: (profile as any).department || '',
        position: (profile as any).position || '',
        years_of_service: (profile as any).years_of_service?.toString() || '',
      });
    }
  }, [profile]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (form.full_name.length > NAME_MAX_LENGTH) {
      newErrors.full_name = `Name must be under ${NAME_MAX_LENGTH} characters`;
    }

    if (form.phone && !PHONE_PATTERN.test(form.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    if (form.employee_id && form.employee_id.length > EMPLOYEE_ID_MAX) {
      newErrors.employee_id = `Employee ID must be under ${EMPLOYEE_ID_MAX} characters`;
    }

    if (form.years_of_service) {
      const yos = parseInt(form.years_of_service);
      if (isNaN(yos) || yos < 0 || yos > 60) {
        newErrors.years_of_service = 'Must be between 0 and 60';
      }
    }

    if (form.department && form.department.length > 100) {
      newErrors.department = 'Must be under 100 characters';
    }

    if (form.position && form.position.length > 100) {
      newErrors.position = 'Must be under 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!validate()) throw new Error('Please fix validation errors');

      // Upload photo if pending
      let avatarUrl = (profile as any)?.avatar_url;
      if (pendingFile) {
        const filePath = `${user.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, pendingFile, { upsert: true, contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl + '?t=' + Date.now();
      }

      const updateData = {
        full_name: sanitize(form.full_name) || null,
        phone: sanitize(form.phone) || null,
        employee_id: sanitize(form.employee_id) || null,
        department: sanitize(form.department) || null,
        position: sanitize(form.position) || null,
        years_of_service: form.years_of_service ? parseInt(form.years_of_service) : null,
        avatar_url: avatarUrl || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', user.id);

      if (error) throw error;

      // Audit log - track what changed
      const changedFields: Record<string, { old: any; new: any }> = {};
      const oldProfile = profile as any;
      if (oldProfile) {
        for (const [key, val] of Object.entries(updateData)) {
          const oldVal = oldProfile[key] ?? null;
          if (oldVal !== val) {
            changedFields[key] = { old: oldVal, new: val };
          }
        }
      }

      if (Object.keys(changedFields).length > 0) {
        await supabase
          .from('profile_audit_logs' as any)
          .insert({
            user_id: user.id,
            changed_by: user.id,
            action: 'profile_update',
            changed_fields: changedFields,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setPendingFile(null);
      setPreviewUrl(null);
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => {
      if (err.message !== 'Please fix validation errors') {
        toast.error('Failed to update profile: ' + err.message);
      }
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPG and PNG files are accepted');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be under 5MB');
      return;
    }

    try {
      const resized = await resizeImage(file);
      setPendingFile(resized);
      setPreviewUrl(URL.createObjectURL(resized));
    } catch {
      toast.error('Failed to process image');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    it: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    teacher: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    registrar: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    finance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    principal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    student: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    parent: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };

  const currentAvatarUrl = previewUrl || (profile as any)?.avatar_url;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderField = (
    id: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    opts?: { disabled?: boolean; placeholder?: string; type?: string; min?: string; error?: string }
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={opts?.type || 'text'}
        min={opts?.min}
        value={value}
        disabled={opts?.disabled}
        className={`${opts?.disabled ? 'bg-muted' : ''} ${opts?.error ? 'border-destructive' : ''}`}
        onChange={e => onChange(e.target.value)}
        placeholder={opts?.placeholder}
      />
      {opts?.error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {opts.error}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal and professional information</p>
          </div>
          {role && (
            <Badge className={`${roleColors[role] || 'bg-muted text-muted-foreground'} gap-1`}>
              <Shield className="h-3 w-3" />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Avatar Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={currentAvatarUrl || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {form.full_name ? getInitials(form.full_name) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{form.full_name || 'No name set'}</h2>
              <p className="text-muted-foreground">{form.email}</p>
              {pendingFile && (
                <p className="text-xs text-primary mt-1">New photo selected — save to apply</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Your basic profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('full_name', 'Full Name', form.full_name, v => setForm(f => ({ ...f, full_name: v })), {
              placeholder: 'e.g. Juan Dela Cruz',
              error: errors.full_name,
            })}
            {renderField('email', 'Email', form.email, () => {}, {
              disabled: true,
              placeholder: 'Email address',
            })}
            {renderField('phone', 'Phone', form.phone, v => setForm(f => ({ ...f, phone: v })), {
              placeholder: 'e.g. +971 50 123 4567',
              error: errors.phone,
            })}
            {renderField('employee_id', 'Employee ID', form.employee_id, v => setForm(f => ({ ...f, employee_id: v })), {
              placeholder: 'e.g. EMP-001',
              error: errors.employee_id,
            })}
          </div>
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Professional Information</CardTitle>
          <CardDescription>Your role and department details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('department', 'Department', form.department, v => setForm(f => ({ ...f, department: v })), {
              placeholder: 'e.g. Administration',
              error: errors.department,
            })}
            {renderField('position', 'Position', form.position, v => setForm(f => ({ ...f, position: v })), {
              placeholder: 'e.g. School Principal',
              error: errors.position,
            })}
            {renderField('years_of_service', 'Years of Service', form.years_of_service, v => setForm(f => ({ ...f, years_of_service: v })), {
              type: 'number',
              min: '0',
              placeholder: 'e.g. 10',
              error: errors.years_of_service,
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
};
