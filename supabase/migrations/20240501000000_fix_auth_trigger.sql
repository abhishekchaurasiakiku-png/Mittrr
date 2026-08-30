-- This migration fixes the "Database error saving new user" issue.
-- It ensures that if the trigger fails for any reason (e.g. missing metadata),
-- it gracefully catches the error and DOES NOT abort the user signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', 'User'),
    new.raw_user_meta_data->>'avatar_url',
    'online'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Extremely important: catch all errors so auth.users insertion doesn't fail.
  -- Our client-side fallback in AuthContext.tsx will handle creating the profile if this fails.
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
