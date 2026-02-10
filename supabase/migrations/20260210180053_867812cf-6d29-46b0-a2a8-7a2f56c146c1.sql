-- Drop the problematic admin policy that causes circular RLS
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- The "Users can view own roles" policy already allows users to read their own role
-- That's sufficient. Let's add a proper admin manage policy that doesn't recurse:
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);