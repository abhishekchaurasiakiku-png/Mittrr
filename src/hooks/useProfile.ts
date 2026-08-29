import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useProfile() {
  const { user, profile, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return null;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploading(false);
        return null;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = data.publicUrl;

      await updateProfile({ avatar_url: avatarUrl });
      setUploading(false);
      return avatarUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      setUploading(false);
      return null;
    }
  }, [user, updateProfile]);

  const uploadAttachment = useCallback(async (file: File) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      return {
        url: data.publicUrl,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
      };
    } catch (err) {
      console.error('Attachment upload error:', err);
      return null;
    }
  }, [user]);

  return { profile, updateProfile, uploadAvatar, uploadAttachment, uploading };
}
