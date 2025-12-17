import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock } from 'lucide-react';
import { z } from 'zod';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { supabase } from '@/integrations/supabase/client';

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

  // Check if input looks like an email
  const isEmail = (input: string) => {
    return input.includes('@');
  };

  // Look up email by LRN from user_credentials
  const getEmailByLRN = async (lrn: string): Promise<string | null> => {
    // For students, the email format is typically lrn@student.local or similar
    // First try direct lookup in user_credentials by matching the email pattern
    const { data, error } = await supabase
      .from('user_credentials')
      .select('email')
      .or(`email.ilike.${lrn}@%,email.eq.${lrn}`)
      .maybeSingle();

    if (error) {
      console.error('Error looking up LRN:', error);
      return null;
    }

    if (data?.email) {
      return data.email;
    }

    // Also try checking if there's a student with this LRN and find their credentials
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('lrn', lrn)
      .maybeSingle();

    if (studentData?.id) {
      const { data: credData } = await supabase
        .from('user_credentials')
        .select('email')
        .eq('student_id', studentData.id)
        .maybeSingle();

      if (credData?.email) {
        return credData.email;
      }
    }

    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    let emailToUse = loginData.email.trim();

    // If input doesn't look like an email, try to look up by LRN
    if (!isEmail(emailToUse)) {
      const foundEmail = await getEmailByLRN(emailToUse);
      if (foundEmail) {
        emailToUse = foundEmail;
      } else {
        // If no email found, still try with the input (might be a username-style email)
        // Some systems use LRN directly as email without @
        setIsSubmitting(false);
        toast.error('LRN not found. Please check your LRN or contact administrator.');
        return;
      }
    }

    const { error } = await signIn(emailToUse, loginData.password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid credentials. Please check your LRN/email and password.');
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
              <Label htmlFor="login-email">Email / Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
