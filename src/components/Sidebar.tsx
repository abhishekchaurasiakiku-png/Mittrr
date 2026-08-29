import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import type { ConversationWithDetails } from '../types/database';
import { FiSearch, FiPlus, FiMessageCircle, FiStar } from 'react-icons/fi';
import type { MainTab } from './MainSidebar';
import { useUserActions } from '../hooks/useUserActions';

interface SidebarProps {
  conversations: ConversationWithDetails[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  loading: boolean;
  activeTab: MainTab;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  loading,
  activeTab
}: SidebarProps) {
  const { user } = useAuth();
  const { blockedUsers, favoriteUsers } = useUserActions();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on tab and search
  const filteredConversations = conversations.filter((conv) => {
    // 1. Filter by Tab (Chats = direct, Groups = group)
    if (activeTab === 'chats' && conv.type !== 'direct') return false;
    if (activeTab === 'groups' && conv.type !== 'group') return false;

    // 2. Filter out blocked users for direct chats
    if (conv.type === 'direct') {
      const otherUser = conv.participants.find((p) => p.user_id !== user?.id);
      if (otherUser && blockedUsers.has(otherUser.user_id)) {
        return false;
      }
    }

    // 2. Filter by Search Query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    if (conv.type === 'direct') {
      const other = conv.participants.find((p) => p.user_id !== user?.id)?.profile;
      return (
        other?.username.toLowerCase().includes(query) ||
        other?.full_name.toLowerCase().includes(query)
      );
    }
    return conv.name?.toLowerCase().includes(query);
  });

  const getConversationName = (conv: ConversationWithDetails) => {
    if (conv.type === 'direct') {
      const other = conv.participants.find((p) => p.user_id !== user?.id)?.profile;
      return other?.full_name || other?.username || 'Deleted User';
    }
    return conv.name || 'Group Chat';
  };

  const getConversationAvatar = (conv: ConversationWithDetails) => {
    if (conv.type === 'direct') {
      const other = conv.participants.find((p) => p.user_id !== user?.id)?.profile;
      return other?.avatar_url || null;
    }
    return conv.avatar_url || null;
  };

  const getOnlineStatus = (conv: ConversationWithDetails) => {
    if (conv.type === 'direct') {
      const other = conv.participants.find((p) => p.user_id !== user?.id)?.profile;
      return other?.status || 'offline';
    }
    return null;
  };

  const getTitle = () => {
    if (activeTab === 'chats') return 'Messages';
    if (activeTab === 'groups') return 'Groups';
    return '';
  };

  return (
    <div className="sidebar">
      {/* Panel Header */}
      <div className="sidebar-panel-header">
        <h2>{getTitle()}</h2>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <FiSearch className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* New chat button */}
      <button className="new-chat-btn" onClick={onNewChat}>
        <FiPlus /> New {activeTab === 'chats' ? 'Chat' : 'Group'}
      </button>

      {/* Conversations list */}
      <div className="sidebar-conversations">
        {loading ? (
          <div className="sidebar-loading">
            <div className="chat-loading-dots"><span /><span /><span /></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="sidebar-empty">
            <FiMessageCircle size={40} />
            <p>No {activeTab === 'chats' ? 'chats' : 'groups'} yet</p>
            <span>Start a new conversation!</span>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const name = getConversationName(conv);
            const avatar = getConversationAvatar(conv);
            const status = getOnlineStatus(conv);
            const lastMsg = conv.last_message;
            const isActive = conv.id === activeConversationId;

            return (
              <div
                key={conv.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="conversation-avatar">
                  {avatar ? (
                    <img src={avatar} alt={name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {status === 'online' && <div className="online-dot" />}
                </div>

                <div className="conversation-info">
                  <div className="conversation-top">
                    <span className="conversation-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {name}
                      {conv.type === 'direct' && (() => {
                        const otherUserId = conv.participants.find((p) => p.user_id !== user?.id)?.user_id;
                        if (otherUserId && favoriteUsers.has(otherUserId)) {
                          return <FiStar fill="var(--accent-primary)" color="var(--accent-primary)" size={14} />;
                        }
                        return null;
                      })()}
                    </span>
                    {lastMsg && (
                      <span className="conversation-time">
                        {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="conversation-bottom">
                    <span className="conversation-last-msg">
                      {lastMsg
                        ? lastMsg.type === 'image'
                          ? '📷 Photo'
                          : lastMsg.type === 'file'
                            ? '📎 File'
                            : lastMsg.content || ''
                        : 'Start chatting...'}
                    </span>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
