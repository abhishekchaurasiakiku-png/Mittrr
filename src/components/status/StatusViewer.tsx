import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiChevronLeft, FiChevronRight, FiTrash2, FiPlus, FiFlag } from 'react-icons/fi';
import type { Status, Profile } from '../../types/database';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useConversations } from '../../hooks/useConversations';
import { supabase } from '../../lib/supabase';

interface StatusViewerProps {
  statuses: Status[];
  userProfile: Profile;
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
  onDeleteStatus?: (statusId: string) => void;
  onAddStatus?: () => void;
  onReportStatus?: (statusId: string) => void;
}

export default function StatusViewer({ statuses, userProfile, onClose, onNextUser, onPrevUser, onDeleteStatus, onAddStatus, onReportStatus }: StatusViewerProps) {
  const { user } = useAuth();
  const { createConversation } = useConversations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStatus = statuses[currentIndex];
  const [reacting, setReacting] = useState(false);

  const duration = currentStatus?.type === 'video' ? 45000 : 30000;

  const handleNext = useCallback(() => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onNextUser) {
      onNextUser();
    } else {
      onClose();
    }
  }, [currentIndex, statuses.length, onNextUser, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (onPrevUser) {
      onPrevUser();
    }
  }, [currentIndex, onPrevUser]);

  useEffect(() => {
    // Auto advance based on type
    const timer = setTimeout(() => {
      if (!reacting) handleNext();
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, statuses, reacting, duration, handleNext]);

  const handleReact = async (emoji: string) => {
    if (!user || user.id === userProfile.id) return;
    setReacting(true);
    try {
      const convId = await createConversation([userProfile.id], undefined, 'direct');
      if (convId) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          sender_id: user.id,
          content: `Reacted to your status: ${emoji}`,
          type: 'text'
        });
        alert('Reaction sent!');
        handleNext();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to send reaction.');
    } finally {
      setReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentStatus || !onDeleteStatus) return;
    if (window.confirm("Are you sure you want to delete this status?")) {
      await supabase.from('statuses').delete().eq('id', currentStatus.id);
      onDeleteStatus(currentStatus.id);
      handleNext();
    }
  };

  if (!currentStatus) return null;

  return createPortal(
    <div className="status-viewer-modal">
      <div className="status-viewer-progress">
        {statuses.map((_, idx) => (
          <div key={idx} className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%',
                transition: idx === currentIndex ? `width ${statuses[idx].type === 'video' ? 45 : 30}s linear` : 'none'
              }} 
            />
          </div>
        ))}
      </div>

      <div className="status-viewer-header">
        <div className="status-viewer-user">
          {userProfile.avatar_url ? (
            <img src={userProfile.avatar_url} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">{userProfile.username.charAt(0).toUpperCase()}</div>
          )}
          <div className="status-viewer-info">
            <span className="name">{userProfile.full_name || userProfile.username}</span>
            <span className="time">{formatDistanceToNow(new Date(currentStatus.created_at))} ago</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user && currentStatus.user_id === user.id && (
            <>
              {onAddStatus && (
                <button className="status-close-btn" onClick={onAddStatus} title="Add New Status">
                  <FiPlus size={24} />
                </button>
              )}
              <button className="status-close-btn" onClick={handleDelete} title="Delete Status">
                <FiTrash2 size={22} color="var(--red)" />
              </button>
            </>
          )}
          {user && currentStatus.user_id !== user.id && onReportStatus && (
            <button className="status-close-btn" onClick={() => onReportStatus(currentStatus.id)} title="Report Status">
              <FiFlag size={20} color="var(--text-secondary)" />
            </button>
          )}
          <button className="status-close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
      </div>

      <div className="status-viewer-content" onClick={(e) => {
        // Simple tap detection: left side = prev, right side = next
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) {
          handlePrev();
        } else {
          handleNext();
        }
      }}>
        {currentStatus.type === 'text' ? (
          <div 
            className="status-text-view" 
            style={{ background: currentStatus.bg_color || '#111128' }}
          >
            <p>{currentStatus.content}</p>
          </div>
        ) : currentStatus.type === 'video' ? (
          <div className="status-image-view">
            <video src={currentStatus.content} autoPlay muted playsInline style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div className="status-image-view">
            <img src={currentStatus.content} alt="Status Update" />
          </div>
        )}
      </div>

      {/* Desktop navigation buttons */}
      <button className="status-nav-btn prev" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
        <FiChevronLeft size={32} />
      </button>
      <button className="status-nav-btn next" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
        <FiChevronRight size={32} />
      </button>

      {/* Reaction Bar */}
      {user && user.id !== userProfile.id && (
        <div className="status-viewer-reactions" style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.75rem 1.5rem',
          borderRadius: '30px', backdropFilter: 'blur(10px)', zIndex: 10
        }}>
          {['❤️', '😂', '😮', '😢', '🙏', '🔥'].map((emoji) => (
            <button 
              key={emoji}
              onClick={(e) => { e.stopPropagation(); handleReact(emoji); }}
              disabled={reacting}
              style={{
                background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
                transition: 'transform 0.2s', opacity: reacting ? 0.5 : 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
