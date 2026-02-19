-- Add insert policy for profiles (needed for the signup trigger)
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Add insert policy for user_roles (needed for the signup trigger)  
CREATE POLICY "Service role can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (true);