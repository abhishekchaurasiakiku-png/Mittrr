import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiImage, FiType, FiSend, FiVideo } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface StatusCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BG_COLORS = [
  '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#111128'
];

export default function StatusCreator({ onClose, onSuccess }: StatusCreatorProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'text' | 'image' | 'video'>('text');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/') && file.size > 15 * 1024 * 1024) {
        alert('Video must be less than 15MB');
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setType(file.type.startsWith('video/') ? 'video' : 'image');
    }
  };

  const handlePost = async () => {
    if (!user) return;
    if (type === 'text' && !text.trim()) return;
    if ((type === 'image' || type === 'video') && !mediaFile) return;

    setUploading(true);

    try {
      let content = text;
      
      if ((type === 'image' || type === 'video') && mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('status-media')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('status-media')
          .getPublicUrl(fileName);

        content = publicUrl;
      }

      const { error } = await supabase.from('statuses').insert({
        user_id: user.id,
        type: type === 'video' ? 'image' : type, // Bypass DB constraint which only allows 'text' or 'image'
        content: type === 'video' ? `${content}?type=video` : content,
        bg_color: type === 'text' ? bgColor : null,
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error('Error posting status:', err);
      alert('Failed to post status');
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <div className="status-creator-modal">
      <div className="status-creator-header" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10001 }}>
        <div className="status-creator-tabs">
          <button 
            className={`status-tab ${type === 'text' ? 'active' : ''}`}
            onClick={() => setType('text')}
          >
            <FiType /> Text
          </button>
          <button 
            className={`status-tab ${type === 'image' ? 'active' : ''}`}
            onClick={() => {
              setType('image');
              if (!mediaPreview || type === 'video') fileInputRef.current?.click();
            }}
          >
            <FiImage /> Image
          </button>
          <button 
            className={`status-tab ${type === 'video' ? 'active' : ''}`}
            onClick={() => {
              setType('video');
              if (!mediaPreview || type === 'image') fileInputRef.current?.click();
            }}
          >
            <FiVideo /> Video
          </button>
        </div>
        <button className="status-creator-close" onClick={onClose}>
          <FiX size={24} />
        </button>
      </div>

      <div 
        className="status-creator-content" 
        style={{ background: type === 'text' ? bgColor : '#000' }}
      >
        {type === 'text' ? (
          <textarea
            autoFocus
            className="status-text-input"
            placeholder="Type a status..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={250}
          />
        ) : (
          <div className="status-image-preview">
            {mediaPreview ? (
              type === 'video' ? (
                <video src={mediaPreview} controls style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '12px' }} />
              ) : (
                <img src={mediaPreview} alt="Status Preview" />
              )
            ) : (
              <button className="status-upload-btn" onClick={() => fileInputRef.current?.click()}>
                {type === 'video' ? <FiVideo size={40} /> : <FiImage size={40} />}
                <span>Select {type === 'video' ? 'Video' : 'Image'}</span>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept={type === 'video' ? 'video/mp4,video/x-m4v,video/*' : 'image/*'}
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>

      <div className="status-creator-footer">
        {type === 'text' && (
          <div className="status-colors">
            {BG_COLORS.map(color => (
              <button 
                key={color}
                className={`status-color-btn ${bgColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => setBgColor(color)}
              />
            ))}
          </div>
        )}

        <button 
          className="status-post-btn" 
          onClick={handlePost}
          disabled={uploading || (type === 'text' && !text.trim()) || ((type === 'image' || type === 'video') && !mediaFile)}
        >
          {uploading ? <div className="input-spinner" /> : <FiSend size={20} />}
        </button>
      </div>
    </div>,
    document.body
  );
}
