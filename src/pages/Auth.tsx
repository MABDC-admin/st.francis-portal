import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Lock, User } from 'lucide-react';
import { z } from 'zod';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or LRN is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: schoolSettings } = useSchoolSettings('MABDC');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const getLoginEmail = (input: string) => {
    const trimmed = input.trim();
    // Staff accounts use real emails (contains "@")
    if (trimmed.includes('@')) return trimmed;

    // Student accounts are created as: `${cleanLrn}@student.edutrack.local`
    const cleanLrn = trimmed.replace(/[^a-zA-Z0-9]/g, '');
    return `${cleanLrn}@student.edutrack.local`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    const emailToUse = getLoginEmail(loginData.email);
    const { error } = await signIn(emailToUse, loginData.password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid LRN/email or password. Please check your credentials.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Logged in successfully');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 to-lime-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 to-lime-400 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            {schoolSettings?.logo_url ? (
              <img 
                src={schoolSettings.logo_url} 
                alt={schoolSettings.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="bg-gradient-to-br from-emerald-600 to-lime-400 w-full h-full flex items-center justify-center">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {schoolSettings?.name || 'School Management System'}
          </CardTitle>
          <CardDescription>Sign in to access your portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">LRN / Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="text"
                  placeholder="Enter your email or LRN"
                  className="pl-10"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-700 hover:to-lime-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Contact your administrator for account access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
