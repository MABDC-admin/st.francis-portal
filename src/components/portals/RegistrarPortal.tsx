import { motion } from 'framer-motion';
import { Users, FileText, Upload, ClipboardList, FolderOpen, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RegistrarPortalProps {
  onNavigate: (tab: string) => void;
  stats: {
    totalStudents: number;
    pendingEnrollments: number;
  };
}

export const RegistrarPortal = ({ onNavigate, stats }: RegistrarPortalProps) => {
  const registrarModules = [
    {
      id: 'enrollment',
      title: 'New Enrollment',
      description: 'Process new student enrollments',
      icon: UserPlus,
      color: 'bg-green-500',
      action: () => onNavigate('enrollment'),
    },
    {
      id: 'students',
      title: 'Student Records',
      description: 'View and manage student profiles',
      icon: Users,
      color: 'bg-blue-500',
      action: () => onNavigate('students'),
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Manage student documents and requirements',
      icon: FolderOpen,
      color: 'bg-purple-500',
      action: () => onNavigate('students'),
    },
    {
      id: 'import',
      title: 'Bulk Import',
      description: 'Import students from CSV files',
      icon: Upload,
      color: 'bg-orange-500',
      action: () => onNavigate('import'),
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Registrar Portal</h1>
        <p className="text-muted-foreground mt-1">Enrollment and student record management</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl">{stats.totalStudents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Requirements</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingEnrollments}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {registrarModules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={module.action}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${module.color} rounded-lg flex items-center justify-center`}>
                    <module.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.title}</CardTitle>
                    <CardDescription className="text-sm">{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
