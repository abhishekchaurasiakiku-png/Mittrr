import { FiMessageSquare, FiUsers, FiActivity, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export type MainTab = 'chats' | 'groups' | 'status' | 'profile';

interface MainSidebarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export default function MainSidebar({ activeTab, onSelectTab }: MainSidebarProps) {
  const { profile } = useAuth();

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
      </div>

      <div className="main-sidebar-bottom">
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
    </div>
  );
}
