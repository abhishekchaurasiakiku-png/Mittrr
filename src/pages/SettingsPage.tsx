import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiDroplet, FiShield, FiLogOut, FiTrash2, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import ProfileEditPage from '../components/settings/ProfileEditPage';
import PrivacyPage from '../components/settings/PrivacyPage';
import ThemePage from '../components/settings/ThemePage';
import '../styles/settings.css';

type SettingsView = 'main' | 'profile' | 'theme' | 'privacy';

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleBack = () => {
    if (currentView === 'main') {
      onBack();
    } else {
      setCurrentView('main');
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'profile': return 'Edit Profile';
      case 'theme': return 'Theme & Customization';
      case 'privacy': return 'Privacy';
      default: return 'Settings';
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={handleBack}>
          <FiArrowLeft size={20} />
        </button>
        <h1 className="settings-title">{getTitle()}</h1>
      </div>

      {/* Content */}
      <div className="settings-content">
        {currentView === 'main' && (
          <div className="settings-main">
            {/* User Card */}
            <div className="settings-user-card" onClick={() => setCurrentView('profile')}>
              <div className="settings-user-avatar">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} />
                ) : (
                  <div className="settings-avatar-placeholder">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="settings-user-info">
                <span className="settings-user-name">{profile?.full_name || profile?.username}</span>
                <span className="settings-user-handle">@{profile?.username}</span>
              </div>
              <FiChevronRight className="settings-chevron" />
            </div>

            {/* Menu Items */}
            <div className="settings-menu">
              <button className="settings-menu-item" onClick={() => setCurrentView('profile')}>
                <div className="settings-menu-icon profile-icon">
                  <FiUser size={18} />
                </div>
                <div className="settings-menu-text">
                  <span className="settings-menu-label">Profile</span>
                  <span className="settings-menu-desc">Name, Username, Picture</span>
                </div>
                <FiChevronRight className="settings-chevron" />
              </button>

              <button className="settings-menu-item" onClick={() => setCurrentView('theme')}>
                <div className="settings-menu-icon theme-icon">
                  <FiDroplet size={18} />
                </div>
                <div className="settings-menu-text">
                  <span className="settings-menu-label">Theme & Customization</span>
                  <span className="settings-menu-desc">Colors, Dark Mode, Fonts</span>
                </div>
                <FiChevronRight className="settings-chevron" />
              </button>

              <button className="settings-menu-item" onClick={() => setCurrentView('privacy')}>
                <div className="settings-menu-icon privacy-icon">
                  <FiShield size={18} />
                </div>
                <div className="settings-menu-text">
                  <span className="settings-menu-label">Privacy</span>
                  <span className="settings-menu-desc">Visibility, Blocked Users</span>
                </div>
                <FiChevronRight className="settings-chevron" />
              </button>
            </div>

            {/* Account Section */}
            <div className="settings-section-label">ACCOUNT</div>
            <div className="settings-account-actions">
              <button className="settings-logout-btn" onClick={signOut}>
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>

              <button className="settings-delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                <FiTrash2 size={16} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <ProfileEditPage />
        )}

        {currentView === 'theme' && (
          <ThemePage />
        )}

        {currentView === 'privacy' && (
          <PrivacyPage />
        )}
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">⚠️</div>
            <h3>Delete Account?</h3>
            <p>This action cannot be undone. All your data, messages, and conversations will be permanently deleted.</p>
            <div className="delete-confirm-actions">
              <button className="delete-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="delete-confirm" onClick={async () => {
                await signOut();
                setShowDeleteConfirm(false);
              }}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
