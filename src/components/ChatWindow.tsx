import { useEffect, useRef, useState } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { useUserActions } from '../hooks/useUserActions';
import { supabase } from '../lib/supabase';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { ConversationWithDetails } from '../types/database';
import { FiArrowLeft, FiMoreVertical, FiStar, FiSlash, FiUserMinus, FiLink, FiCheck } from 'react-icons/fi';

interface ChatWindowProps {
  conversation: ConversationWithDetails | null;
  onBack?: () => void;
}

export default function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, deleteMessage, editMessage } = useMessages(
    conversation?.id || null
  );
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { blockedUsers, favoriteUsers, blockUser, unblockUser, favoriteUser, unfavoriteUser } = useUserActions();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="chat-window-empty">
        <div className="empty-chat-content">
          <div className="empty-chat-icon">💬</div>
          <h2>Welcome to KIKU</h2>
          <p>Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  // Get the other participant for direct chats
  const otherParticipant = conversation.type === 'direct'
    ? conversation.participants?.find((p) => p.user_id !== user?.id)?.profile
    : null;

  const chatName = conversation.type === 'direct'
    ? otherParticipant?.full_name || otherParticipant?.username || 'Deleted User'
    : conversation.name || 'Group Chat';

  const chatAvatar = conversation.type === 'direct'
    ? otherParticipant?.avatar_url
    : conversation.avatar_url;

  const onlineStatus = conversation.type === 'direct'
    ? otherParticipant?.status
    : null;

  const isGroupCreator = conversation.type === 'group' && conversation.created_by === user?.id;
  const isDirect = conversation.type === 'direct';
  const otherUserId = isDirect ? otherParticipant?.id : null;
  const isBlocked = otherUserId ? blockedUsers.has(otherUserId) : false;
  const isFavorite = otherUserId ? favoriteUsers.has(otherUserId) : false;

  const handleCopyLink = () => {
    if (conversation.invite_token) {
      const link = `${window.location.origin}/join/${conversation.invite_token}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      alert("No invite link generated yet.");
    }
  };

  const handleRemoveUser = async (participantId: string) => {
    if (!window.confirm("Are you sure you want to remove this user from the group?")) return;
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversation.id)
      .eq('user_id', participantId);
    
    if (error) {
      console.error(error);
      alert("Failed to remove user.");
    } else {
      alert("User removed. Please refresh to see changes.");
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        {onBack && (
          <button className="chat-back-btn" onClick={onBack}>
            <FiArrowLeft size={20} />
          </button>
        )}
        <div className="chat-header-avatar">
          {chatAvatar ? (
            <img src={chatAvatar} alt={chatName} />
          ) : (
            <div className="avatar-placeholder large">
              {chatName.charAt(0).toUpperCase()}
            </div>
          )}
          {onlineStatus === 'online' && <div className="online-dot header-dot" />}
        </div>
        <div 
          className="chat-header-info" 
          onClick={() => { if (conversation.type === 'group') setShowGroupInfo(true); }}
          style={{ cursor: conversation.type === 'group' ? 'pointer' : 'default' }}
        >
          <h3>{chatName}</h3>
          <span className="chat-header-status">
            {conversation.type === 'direct'
              ? onlineStatus === 'online'
                ? 'Online'
                : onlineStatus === 'away'
                  ? 'Away'
                  : 'Offline'
              : `${conversation.participants?.length || 0} members (Tap to view)`}
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="chat-header-action" onClick={() => setShowMenu(!showMenu)}>
            <FiMoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="chat-action-menu" style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', padding: '0.5rem', zIndex: 50,
              minWidth: '200px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {isDirect && otherUserId && (
                <>
                  <button onClick={() => { isFavorite ? unfavoriteUser(otherUserId) : favoriteUser(otherUserId); setShowMenu(false); }} className="menu-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>
                    <FiStar fill={isFavorite ? "var(--accent-primary)" : "none"} color={isFavorite ? "var(--accent-primary)" : "currentColor"} /> {isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                  </button>
                  <button onClick={() => { isBlocked ? unblockUser(otherUserId) : blockUser(otherUserId); setShowMenu(false); }} className="menu-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', textAlign: 'left' }}>
                    <FiSlash /> {isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                </>
              )}
              {conversation.type === 'group' && (
                <>
                  {isGroupCreator && (
                    <>
                      <button onClick={() => { handleCopyLink(); setShowMenu(false); }} className="menu-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>
                        {copiedLink ? <FiCheck /> : <FiLink />} Copy Invite Link
                      </button>
                    </>
                  )}
                  {!isGroupCreator && (
                    <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Group created by Admin.</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && (
        <div className="modal-overlay" onClick={() => setShowGroupInfo(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Group Members</h2>
              <button className="modal-close" onClick={() => setShowGroupInfo(false)}>
                &times;
              </button>
            </div>
            
            {isGroupCreator && (
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleCopyLink} 
                  className="new-chat-btn" 
                  style={{ width: '100%', margin: 0 }}
                >
                  {copiedLink ? <FiCheck /> : <FiLink />} 
                  {copiedLink ? 'Link Copied!' : 'Copy Group Invite Link'}
                </button>
              </div>
            )}

            <div className="modal-results">
              {conversation.participants?.map((p) => (
                <div key={p.user_id} className="modal-user-item">
                  <div className="modal-user-avatar">
                    {p.profile?.avatar_url ? (
                      <img src={p.profile.avatar_url} alt={p.profile.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {p.profile?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="modal-user-info">
                    <span className="modal-user-name">{p.profile?.username || 'Unknown'}</span>
                    {p.user_id === conversation.created_by && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Admin</span>
                    )}
                  </div>
                  {isGroupCreator && p.user_id !== user?.id && (
                     <button onClick={() => { handleRemoveUser(p.user_id); setShowGroupInfo(false); }} title="Remove User" style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '0.5rem' }}>
                       <FiUserMinus size={16} />
                     </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">
            <div className="chat-loading-dots">
              <span /><span /><span />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-no-messages">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isGroup={conversation.type === 'group'}
              canManageMembers={isGroupCreator}
              onDelete={deleteMessage}
              onEdit={editMessage}
              onRemoveUser={handleRemoveUser}
              onBlockUser={blockUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
