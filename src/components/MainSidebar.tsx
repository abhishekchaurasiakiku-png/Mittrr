import { FiMessageSquare, FiUsers, FiActivity, FiUser, FiShield, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useState } from 'react';
import NotificationsModal from './NotificationsModal';

export type MainTab = 'chats' | 'groups' | 'status' | 'profile';

interface MainSidebarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export default function MainSidebar({ activeTab, onSelectTab }: MainSidebarProps) {
  const { user, profile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestPushPermission } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="main-sidebar">
      <div className="main-sidebar-top">
        <button 
          className={`main-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => onSelectTab('chats')}
          title="Chats"
        >
          <FiMessageSquare size={22} />
        </button>
        <button 
          className={`main-nav-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => onSelectTab('groups')}
          title="Groups"
        >
          <FiUsers size={22} />
        </button>
        <button 
          className={`main-nav-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => onSelectTab('status')}
          title="Status"
        >
          <FiActivity size={22} />
        </button>
        
        <button 
          className={`main-nav-btn`}
          onClick={() => setShowNotifications(true)}
          title="Notifications"
          style={{ position: 'relative' }}
        >
          <FiBell size={22} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'var(--red)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--bg-secondary)'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {user?.email === 'abhishekchaurasiakiku@gmail.com' && (
          <button 
            className="main-nav-btn"
            onClick={() => window.open('/admin', '_blank')}
            title="Admin Portal"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiShield size={22} />
          </button>
        )}

        {/* Profile button for mobile (hidden on desktop via CSS if needed, but it's simpler to just let CSS handle it. Wait, I'll add a specific mobile-only profile button here and hide it on desktop) */}
        <button 
          className={`main-nav-btn profile-btn mobile-profile-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
          title="Profile & Settings"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="main-sidebar-avatar" />
          ) : (
            <FiUser size={22} />
          )}
        </button>
      </div>

      <div className="main-sidebar-bottom">
        {user?.email === 'abhishekchaurasiakiku@gmail.com' && (
          <button 
            className="main-nav-btn desktop-admin-btn"
            onClick={() => window.open('/admin', '_blank')}
            title="Admin Portal"
            style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}
          >
            <FiShield size={22} />
          </button>
        )}
        <button 
          className={`main-nav-btn profile-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
          title="Profile & Settings"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="main-sidebar-avatar" />
          ) : (
            <FiUser size={22} />
          )}
        </button>
      </div>

      {showNotifications && (
        <NotificationsModal 
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onRequestPermission={requestPushPermission}
        />
      )}
    </div>
  );
}
