import { motion } from 'framer-motion';
import { Users, FileText, Bell, MessageSquare, CreditCard, Calendar, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const ParentPortal = () => {
  const { user, signOut } = useAuth();

  // Placeholder data - will be connected to linked children data
  const linkedChildren = [
    {
      id: '1',
      name: 'Juan Dela Cruz Jr.',
      grade: 'Grade 6',
      section: 'Section A',
      attendance: '95%',
      averageGrade: 89,
    },
    {
      id: '2',
      name: 'Maria Dela Cruz',
      grade: 'Grade 4',
      section: 'Section B',
      attendance: '98%',
      averageGrade: 92,
    },
  ];

  const notifications = [
    { id: 1, message: 'Juan has a pending assignment in Mathematics', type: 'warning', time: '2 hours ago' },
    { id: 2, message: 'Maria received an award for Perfect Attendance', type: 'success', time: '1 day ago' },
    { id: 3, message: 'Parent-Teacher meeting scheduled for Dec 20', type: 'info', time: '2 days ago' },
  ];

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Parent Portal</h1>
          <p className="text-muted-foreground mt-1">Monitor your children's academic progress</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: 'View Grades', color: 'bg-blue-500' },
          { icon: Calendar, label: 'Attendance', color: 'bg-green-500' },
          { icon: MessageSquare, label: 'Message Teacher', color: 'bg-purple-500' },
          { icon: CreditCard, label: 'Fees & Billing', color: 'bg-orange-500' },
        ].map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardContent className="pt-6 text-center">
                <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-medium text-sm">{action.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Linked Children */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Children
          </CardTitle>
          <CardDescription>Academic overview for your linked children</CardDescription>
        </CardHeader>
        <CardContent>
          {linkedChildren.length > 0 ? (
            <div className="space-y-4">
              {linkedChildren.map((child, index) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {child.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{child.name}</p>
                        <p className="text-sm text-muted-foreground">{child.grade} - {child.section}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Attendance</p>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                          {child.attendance}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Average</p>
                        <Badge 
                          variant="outline" 
                          className={child.averageGrade >= 90 
                            ? 'bg-green-500/10 text-green-600 border-green-200' 
                            : 'bg-blue-500/10 text-blue-600 border-blue-200'
                          }
                        >
                          {child.averageGrade}%
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No children linked to your account.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please contact the registrar to link your children's accounts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className={`w-2 h-2 ${getNotificationColor(notif.type)} rounded-full mt-2`} />
                <div className="flex-1">
                  <p className="text-sm">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
