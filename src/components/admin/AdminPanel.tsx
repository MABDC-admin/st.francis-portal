import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2, Database, RefreshCcw, Users, Settings, Building2, Activity, Shield, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserManagement } from './UserManagement';
import { SchoolSettings } from './SchoolSettings';
import { SchoolManagement } from './SchoolManagement';
import { ActivityLogs } from './ActivityLogs';
import { PermissionManagement } from './PermissionManagement';

export const AdminPanel = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const queryClient = useQueryClient();

  const handleResetStudents = async () => {
    if (confirmText !== 'DELETE ALL') {
      toast.error('Please type DELETE ALL to confirm');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('All student records have been deleted');
      setShowConfirm(false);
      setConfirmText('');
    } catch (error: any) {
      toast.error('Failed to reset: ' + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage system settings and data</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-[840px]">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="schools" className="gap-2">
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">Schools</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionManagement />
        </TabsContent>

        <TabsContent value="schools" className="mt-6">
          <SchoolManagement />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <ActivityLogs />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SchoolSettings />
        </TabsContent>
        
        <TabsContent value="system" className="mt-6 space-y-6">
          {/* Warning Banner */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Danger Zone</p>
              <p className="text-sm text-destructive/80">
                Actions in this section are irreversible. Please proceed with caution.
              </p>
            </div>
          </div>

          {/* Reset Students Card */}
          <div className="bg-card rounded-2xl shadow-card p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Database className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Reset Student Records</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Delete all student records from the database. This action cannot be undone.
                </p>

                {!showConfirm ? (
                  <Button 
                    variant="destructive" 
                    className="mt-4"
                    onClick={() => setShowConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Students
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-3"
                  >
                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Type <span className="font-bold text-destructive">DELETE ALL</span> to confirm:
                      </p>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE ALL"
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowConfirm(false);
                          setConfirmText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleResetStudents}
                        disabled={isResetting || confirmText !== 'DELETE ALL'}
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Confirm Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Refresh Data Card */}
          <div className="bg-card rounded-2xl shadow-card p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCcw className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">Refresh Data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Force refresh all cached data from the database.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    queryClient.invalidateQueries();
                    toast.success('Data refreshed successfully');
                  }}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh All Data
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};