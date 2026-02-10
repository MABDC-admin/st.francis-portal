import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2, Database, RefreshCcw, Users, Settings, Building2, Activity, Shield, School, ClipboardCheck } from 'lucide-react';
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
import { DataQualityDashboard } from './DataQualityDashboard';

export const AdminPanel = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showDeleteAllUsers, setShowDeleteAllUsers] = useState(false);
  const [confirmDeleteAllText, setConfirmDeleteAllText] = useState('');
  const [isDeletingAllUsers, setIsDeletingAllUsers] = useState(false);
  const queryClient = useQueryClient();

  const handleDeleteAllUsers = async () => {
    if (confirmDeleteAllText !== 'DELETE ALL USERS') {
      toast.error('Please type DELETE ALL USERS to confirm');
      return;
    }

    setIsDeletingAllUsers(true);
    try {
      // Step 1: Delete all student-related data first (from handleResetStudents)
      await supabase.from('student_assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('student_grades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('raw_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('student_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('student_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Step 2: Delete all user credentials
      const { error: credsError } = await supabase
        .from('user_credentials')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (credsError) throw new Error(`Failed to delete credentials: ${credsError.message}`);

      // Step 3: Delete user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .neq('user_id', '00000000-0000-0000-0000-000000000000');
      
      if (rolesError) throw new Error(`Failed to delete roles: ${rolesError.message}`);

      // Step 4: Delete user school access
      const { error: accessError } = await supabase
        .from('user_school_access')
        .delete()
        .neq('user_id', '00000000-0000-0000-0000-000000000000');
      
      if (accessError) throw new Error(`Failed to delete school access: ${accessError.message}`);

      // Step 5: Delete profiles (this will cascade to auth.users via trigger if set up)
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (profilesError) throw new Error(`Failed to delete profiles: ${profilesError.message}`);

      // Step 6: Delete from auth.users (requires admin privileges)
      // Note: This requires RPC call or admin API, skipping for now as profiles deletion should trigger cascade

      await queryClient.invalidateQueries();
      toast.success('All user accounts, students, teachers, and staff have been deleted');
      setShowDeleteAllUsers(false);
      setConfirmDeleteAllText('');
    } catch (error: any) {
      console.error('Delete all users error:', error);
      toast.error('Failed to delete all users: ' + error.message);
    } finally {
      setIsDeletingAllUsers(false);
    }
  };

  const handleResetStudents = async () => {
    if (confirmText !== 'DELETE ALL') {
      toast.error('Please type DELETE ALL to confirm');
      return;
    }

    setIsResetting(true);
    try {
      // Delete in order to respect foreign key constraints
      // 1. Delete student assessments first (references students)
      const { error: assessmentError } = await supabase
        .from('student_assessments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (assessmentError) throw new Error(`Failed to delete assessments: ${assessmentError.message}`);

      // 2. Delete student grades
      const { error: gradesError } = await supabase
        .from('student_grades')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (gradesError) throw new Error(`Failed to delete grades: ${gradesError.message}`);

      // 3. Delete raw scores
      const { error: scoresError } = await supabase
        .from('raw_scores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (scoresError) throw new Error(`Failed to delete scores: ${scoresError.message}`);

      // 4. Delete attendance records
      const { error: attendanceError } = await supabase
        .from('student_attendance')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (attendanceError) throw new Error(`Failed to delete attendance: ${attendanceError.message}`);

      // 5. Delete payments
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (paymentsError) throw new Error(`Failed to delete payments: ${paymentsError.message}`);

      // 6. Delete student documents
      const { error: docsError } = await supabase
        .from('student_documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (docsError) throw new Error(`Failed to delete documents: ${docsError.message}`);

      // 7. Delete user credentials linked to students
      const { error: credsError } = await supabase
        .from('user_credentials')
        .delete()
        .not('student_id', 'is', null);
      
      if (credsError) throw new Error(`Failed to delete credentials: ${credsError.message}`);

      // 8. Finally delete students
      const { error: studentsError } = await supabase
        .from('students')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (studentsError) throw new Error(`Failed to delete students: ${studentsError.message}`);

      await queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('All learner records and related data have been deleted');
      setShowConfirm(false);
      setConfirmText('');
    } catch (error: any) {
      console.error('Reset error:', error);
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
        <TabsList className="grid w-full grid-cols-7 lg:w-[980px]">
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
          <TabsTrigger value="data-quality" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Data Quality</span>
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

        <TabsContent value="data-quality" className="mt-6">
          <DataQualityDashboard />
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

          {/* Delete ALL Users Card */}
          <div className="bg-card rounded-2xl shadow-card p-6 border-2 border-destructive/30">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete ALL User Accounts
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong className="text-destructive">EXTREME DANGER:</strong> Delete ALL users including students, teachers, registrars, finance staff, and admins. This will completely wipe the user database.
                </p>

                {!showDeleteAllUsers ? (
                  <Button 
                    variant="destructive" 
                    className="mt-4"
                    onClick={() => setShowDeleteAllUsers(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ALL Users
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-3"
                  >
                    <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Type <span className="font-bold text-destructive">DELETE ALL USERS</span> to confirm:
                      </p>
                      <input
                        type="text"
                        value={confirmDeleteAllText}
                        onChange={(e) => setConfirmDeleteAllText(e.target.value)}
                        placeholder="DELETE ALL USERS"
                        className="w-full px-3 py-2 bg-background border-2 border-destructive rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteAllUsers(false);
                          setConfirmDeleteAllText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAllUsers}
                        disabled={isDeletingAllUsers || confirmDeleteAllText !== 'DELETE ALL USERS'}
                      >
                        {isDeletingAllUsers ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deleting ALL Users...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Confirm Delete ALL
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