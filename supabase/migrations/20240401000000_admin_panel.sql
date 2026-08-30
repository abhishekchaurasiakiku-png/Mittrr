-- Admin panel tables and schema updates

-- 1. admin_users table (optional, but requested by PRD)
-- We will rely on auth.users for identity, but use this for roles.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('super_admin', 'moderator')),
  created_at timestamptz DEFAULT now()
);

-- Protect admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can view admin_users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
  );

-- 2. admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can insert audit logs" ON public.admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
  );
CREATE POLICY "Admin users can view audit logs" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
  );

-- 3. reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id),
  target_type text NOT NULL CHECK (target_type IN ('message', 'status', 'group', 'user')),
  target_id uuid NOT NULL,
  reason text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
);
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
);

-- 4. platform_policies
CREATE TABLE IF NOT EXISTS public.platform_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL CHECK (policy_type IN ('terms', 'privacy')),
  content_markdown text NOT NULL,
  version int NOT NULL,
  published_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.platform_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view platform policies" ON public.platform_policies FOR SELECT USING (true);
CREATE POLICY "Admins can insert policies" ON public.platform_policies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
);

-- 5. feature_flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feature flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins can update feature flags" ON public.feature_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
);

-- 6. announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  is_active boolean DEFAULT false,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can update announcements" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
);

-- 7. Alter profiles (we use profiles since users is managed by Supabase Auth and is often hidden)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Update RLS for profiles so admins can view and update all profiles
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) OR auth.jwt() ->> 'email' = 'abhishekchaurasiakiku@gmail.com'
);

-- Note: You should apply this manually via Supabase Dashboard SQL Editor, or use the Supabase CLI if configured.
