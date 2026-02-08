import { motion } from 'framer-motion';
import { User, Mail, Phone, Building2, BookOpen, GraduationCap, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TeacherRecord } from '@/hooks/useTeacherData';

interface TeacherProfileCardProps {
  teacher: TeacherRecord;
}

export const TeacherProfileCard = ({ teacher }: TeacherProfileCardProps) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Card - Green/Teal Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
        }}
      >
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {teacher.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Teacher Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl lg:text-2xl font-bold text-white">{teacher.full_name}</h2>
                <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0 font-semibold">
                  {teacher.status || 'Active'}
                </Badge>
              </div>
              <p className="text-white/80 text-sm">
                {teacher.employee_id} • {teacher.department || 'General'} • {teacher.school || 'School'}
              </p>
              <div className="flex items-center gap-4 text-sm text-white/70 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {teacher.email}
                </span>
                {teacher.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {teacher.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="text-4xl font-bold text-white">
                {teacher.subjects?.length || 0}
              </p>
              <p className="text-sm text-white/70">Subjects</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
          style={{ borderTopColor: '#059669' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
          >
            <User className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">Basic Information</h3>
          </div>
          <div className="p-5 space-y-4 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Full Name</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{teacher.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Employee ID</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{teacher.employee_id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Email</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{teacher.email}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Phone</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{teacher.phone || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Date Joined</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(teacher.created_at)}</p>
            </div>
          </div>
        </motion.div>

        {/* Department & Subjects Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4"
          style={{ borderTopColor: '#8b5cf6' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}
          >
            <BookOpen className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">Department & Subjects</h3>
          </div>
          <div className="p-5 space-y-4 bg-gradient-to-br from-violet-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
            <div>
              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Department</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{teacher.department || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Grade Level</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{teacher.grade_level || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Assigned Subjects</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {teacher.subjects && teacher.subjects.length > 0 ? (
                  teacher.subjects.map((subject, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                      {subject}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No subjects assigned</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* School Information Card - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg border-t-4 lg:col-span-2"
          style={{ borderTopColor: '#f59e0b' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde047 100%)' }}
          >
            <Building2 className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-white">School Information</h3>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-800/50 dark:to-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">School</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{teacher.school || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Status</p>
                <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                  {teacher.status || 'Active'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Last Updated</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(teacher.updated_at)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
