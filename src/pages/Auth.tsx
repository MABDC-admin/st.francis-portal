import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool, SCHOOL_THEMES, SchoolType } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap, Lock, User, Building2 } from 'lucide-react';
import { z } from 'zod';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or LRN is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const { selectedSchool, setSelectedSchool } = useSchool();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: mabdcSettings } = useSchoolSettings('MABDC');
  const { data: stfxsaSettings } = useSchoolSettings('STFXSA');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const getLoginEmailBySchool = async (input: string, school: SchoolType): Promise<string | null> => {
    const trimmed = input.trim();
    // Staff accounts use real emails (contains "@")
    if (trimmed.includes('@')) return trimmed;

    const cleanLrn = trimmed.replace(/[^a-zA-Z0-9]/g, '');
    
    // For students, check if they belong to selected school
    const { data: student } = await supabase
      .from('students')
      .select('school')
      .eq('lrn', trimmed)
      .single();
    
    if (student) {
      const studentSchool = student.school?.toUpperCase() || 'MABDC';
      const isSTFXSA = studentSchool.includes('STFXSA') || studentSchool.includes('ST. FRANCIS');
      const belongsToMabdc = !isSTFXSA;
      
      // Check if student is trying to login to correct portal
      if (school === 'STFXSA' && !isSTFXSA) {
        toast.error('This student account belongs to MABDC. Please use MABDC portal.');
        return null;
      }
      if (school === 'MABDC' && isSTFXSA) {
        toast.error('This student account belongs to STFXSA. Please use STFXSA portal.');
        return null;
      }
    }
    
    // Return email based on selected school portal
    return school === 'STFXSA' ? `${cleanLrn}@stfxsa.org` : `${cleanLrn}@mabdc.org`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    const emailToUse = await getLoginEmailBySchool(loginData.email, selectedSchool);
    if (!emailToUse) {
      setIsSubmitting(false);
      return;
    }
    
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

  const currentTheme = SCHOOL_THEMES[selectedSchool];
  const currentSettings = selectedSchool === 'MABDC' ? mabdcSettings : stfxsaSettings;

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center bg-gradient-to-br",
        selectedSchool === 'MABDC' ? "from-emerald-600 to-lime-400" : "from-blue-600 to-indigo-500"
      )}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 transition-all duration-500 bg-gradient-to-br",
      selectedSchool === 'MABDC' ? "from-emerald-600 to-lime-400" : "from-blue-600 to-indigo-500"
    )}>
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          {/* School Tabs */}
          <Tabs 
            value={selectedSchool} 
            onValueChange={(v) => setSelectedSchool(v as SchoolType)}
            className="w-full mb-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="MABDC" 
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <Building2 className="h-4 w-4 mr-2" />
                MABDC
              </TabsTrigger>
              <TabsTrigger 
                value="STFXSA"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <Building2 className="h-4 w-4 mr-2" />
                STFXSA
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className={cn(
            "mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300",
            selectedSchool === 'MABDC' ? "bg-emerald-100" : "bg-blue-100"
          )}>
            {currentSettings?.logo_url ? (
              <img 
                src={currentSettings.logo_url} 
                alt={currentSettings.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className={cn(
                "w-full h-full flex items-center justify-center bg-gradient-to-br",
                selectedSchool === 'MABDC' ? "from-emerald-600 to-lime-400" : "from-blue-600 to-indigo-500"
              )}>
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {currentSettings?.name || currentTheme.fullName}
          </CardTitle>
          <CardDescription>Sign in to access your {selectedSchool} portal</CardDescription>
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
              className={cn(
                "w-full bg-gradient-to-r transition-all duration-300",
                selectedSchool === 'MABDC' 
                  ? "from-emerald-600 to-lime-500 hover:from-emerald-700 hover:to-lime-600" 
                  : "from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : `Sign In to ${selectedSchool}`}
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
