import { motion } from 'framer-motion';
import { Users, Settings, Shield, Database, FileText, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminPortalProps {
  onNavigate: (tab: string) => void;
}

export const AdminPortal = ({ onNavigate }: AdminPortalProps) => {
  const adminModules = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      color: 'bg-blue-500',
      action: () => onNavigate('admin'),
    },
    {
      id: 'students',
      title: 'Student Records',
      description: 'View and manage all student data',
      icon: Database,
      color: 'bg-purple-500',
      action: () => onNavigate('students'),
    },
    {
      id: 'enrollment',
      title: 'Enrollment',
      description: 'Process new enrollments and registrations',
      icon: FileText,
      color: 'bg-green-500',
      action: () => onNavigate('enrollment'),
    },
    {
      id: 'import',
      title: 'Data Import',
      description: 'Bulk import students from CSV files',
      icon: Database,
      color: 'bg-orange-500',
      action: () => onNavigate('import'),
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure school year, levels, and sections',
      icon: Settings,
      color: 'bg-slate-500',
      action: () => {},
    },
    {
      id: 'security',
      title: 'Security & Roles',
      description: 'Manage access control and permissions',
      icon: Shield,
      color: 'bg-red-500',
      action: () => onNavigate('admin'),
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Portal</h1>
        <p className="text-muted-foreground mt-1">Full system access and management</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" onClick={module.action}>
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mb-3`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={module.action}>
                  Access Module
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
