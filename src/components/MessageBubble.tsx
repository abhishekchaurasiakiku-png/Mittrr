import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import type { MessageWithSender } from '../types/database';
import { FiTrash2, FiEdit2, FiDownload, FiUserMinus, FiSlash } from 'react-icons/fi';
import { useState } from 'react';

interface MessageBubbleProps {
  message: MessageWithSender;
  isGroup: boolean;
  canManageMembers?: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onRemoveUser?: (userId: string) => void;
  onBlockUser?: (userId: string) => void;
}

export default function MessageBubble({ message, isGroup, canManageMembers, onDelete, onEdit, onRemoveUser, onBlockUser }: MessageBubbleProps) {
  const { user } = useAuth();
  const isMine = user?.id === message.sender_id;
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');

  const handleEdit = () => {
    if (editContent.trim()) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div
      className={`message-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isMine && (
        <div className="message-avatar">
          {message.sender.avatar_url ? (
            <img src={message.sender.avatar_url} alt={message.sender.username} />
          ) : (
            <div className="avatar-placeholder">
              {message.sender.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className="message-content-wrapper">
        {!isMine && isGroup && (
          <span className="message-sender-name">@{message.sender.username}</span>
        )}

        <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
          {message.type === 'image' && message.file_url && (
            <div className="message-image">
              <img src={message.file_url} alt="Shared" loading="lazy" />
            </div>
          )}

          {message.type === 'file' && message.file_url && (
            <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="message-file">
              <FiDownload />
              <span>{message.file_name || 'Download File'}</span>
            </a>
          )}

          {isEditing ? (
            <div className="message-edit">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                autoFocus
              />
              <div className="message-edit-actions">
                <button onClick={handleEdit}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            message.content && <p className="message-text">{message.content}</p>
          )}

          <div className="message-meta">
            <span className="message-time">{timeAgo}</span>
            {message.is_edited && <span className="message-edited">(edited)</span>}
          </div>
        </div>

        {isMine && showActions && !isEditing && (
          <div className="message-actions">
            <button onClick={() => setIsEditing(true)} title="Edit">
              <FiEdit2 size={13} />
            </button>
            <button onClick={() => onDelete(message.id)} title="Delete" className="delete-action">
              <FiTrash2 size={13} />
            </button>
          </div>
        )}

        {!isMine && showActions && isGroup && (
          <div className="message-actions">
            {canManageMembers && onRemoveUser && (
              <button onClick={() => onRemoveUser(message.sender_id)} title="Remove User from Group" className="delete-action">
                <FiUserMinus size={13} />
              </button>
            )}
            {onBlockUser && (
              <button onClick={() => onBlockUser(message.sender_id)} title="Block User" className="delete-action">
                <FiSlash size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
