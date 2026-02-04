import { motion } from 'framer-motion';
import { UserCheck, UserCog, Calendar, FileText, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  icon: 'user-check' | 'user-cog' | 'calendar' | 'file';
  content: React.ReactNode;
  color: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    icon: 'user-check',
    content: <><span className="font-semibold">Nily Parker</span> admitted to <span className="font-semibold">Grade 5</span></>,
    color: 'text-success',
  },
  {
    id: '2',
    icon: 'user-cog',
    content: <><span className="font-semibold">John Smith</span> assigned as <span className="font-semibold">Math Teacher</span></>,
    color: 'text-info',
  },
  {
    id: '3',
    icon: 'calendar',
    content: <><span className="font-semibold">Science Fair</span> scheduled for <span className="font-semibold">April 30</span></>,
    color: 'text-warning',
  },
  {
    id: '4',
    icon: 'file',
    content: <><span className="font-semibold">Emma Brown</span> submitted attendance report</>,
    color: 'text-stat-purple',
  },
];

const iconMap = {
  'user-check': UserCheck,
  'user-cog': UserCog,
  'calendar': Calendar,
  'file': FileText,
};

export const RecentActivities = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockActivities.map((activity) => {
            const Icon = iconMap[activity.icon];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Icon className={`h-5 w-5 mt-0.5 ${activity.color}`} />
                <p className="text-sm text-foreground leading-relaxed">
                  {activity.content}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};
