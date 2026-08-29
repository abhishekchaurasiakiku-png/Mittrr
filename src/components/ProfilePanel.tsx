import ProfileEditPage from './settings/ProfileEditPage';
import ThemePage from './settings/ThemePage';
import PrivacyPage from './settings/PrivacyPage';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';

export default function ProfilePanel() {
  const { signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="profile-panel">
      <div className="sidebar-panel-header">
        <h2>Profile & Settings</h2>
      </div>
      
      <div className="profile-panel-content">
        {/* Profile Edit Section directly visible */}
        <section className="profile-panel-section">
          <ProfileEditPage />
        </section>

        <hr className="profile-panel-divider" />

        <section className="profile-panel-section">
          <ThemePage />
        </section>

        <hr className="profile-panel-divider" />

        <section className="profile-panel-section">
          <PrivacyPage />
        </section>

        <hr className="profile-panel-divider" />

        <section className="profile-panel-section account-actions">
          <h3 className="theme-section-title" style={{ paddingLeft: '1.25rem' }}>Account</h3>
          <div style={{ padding: '0 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="settings-logout-btn" onClick={signOut}>
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>

            <button className="settings-delete-btn" onClick={() => setShowDeleteConfirm(true)}>
              <FiTrash2 size={16} />
              <span>Delete Account</span>
            </button>
          </div>
        </section>
      </div>

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
