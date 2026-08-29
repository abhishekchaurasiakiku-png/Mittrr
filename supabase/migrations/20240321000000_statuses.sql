-- Create statuses table
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('text', 'image')) NOT NULL,
    content TEXT NOT NULL,
    bg_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '24 hours') NOT NULL
);

-- Enable RLS
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

-- Policies for statuses
-- Anyone can view statuses (for simplicity in this app, or we can restrict to people who have chats, but public is fine for an isolated status system)
CREATE POLICY "statuses_select"
    ON public.statuses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "statuses_insert"
    ON public.statuses FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "statuses_delete"
    ON public.statuses FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Storage for status media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('status-media', 'status-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public status media access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'status-media');

CREATE POLICY "Auth status media upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'status-media' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
