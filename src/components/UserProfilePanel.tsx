import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { FiCamera, FiX, FiSave } from 'react-icons/fi';

interface UserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfilePanel({ isOpen, onClose }: UserProfilePanelProps) {
  const { profile, signOut } = useAuth();
  const { uploadAvatar, uploading, updateProfile } = useProfile();
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !profile) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleSave = async () => {
    await updateProfile({ full_name: fullName, username });
    setEditMode(false);
  };

  return (
    <div className="profile-panel-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="profile-panel-header">
          <h2>Profile</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="profile-panel-body">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                className="profile-avatar-edit"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <div className="input-spinner" /> : <FiCamera size={16} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Info */}
          {editMode ? (
            <div className="profile-edit-fields">
              <div className="profile-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="profile-field">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <button className="profile-save-btn" onClick={handleSave}>
                <FiSave /> Save Changes
              </button>
            </div>
          ) : (
            <div className="profile-info">
              <h3>{profile.full_name || profile.username}</h3>
              <p className="profile-username">@{profile.username}</p>
              <div className={`profile-status-badge ${profile.status}`}>
                <span className="status-dot-inline" />
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </div>
              <button className="profile-edit-btn" onClick={() => {
                setFullName(profile.full_name || '');
                setUsername(profile.username || '');
                setEditMode(true);
              }}>
                Edit Profile
              </button>
            </div>
          )}

          <button className="profile-logout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
