import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { FiCamera } from 'react-icons/fi';

export default function ProfileEditPage() {
  const { profile, user } = useAuth();
  const { uploadAvatar, uploading } = useProfile();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateProfile } = useAuth();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const result = await updateProfile({ full_name: fullName, username });
    setSaving(false);
    if (!result.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="profile-edit-page">
      {/* Avatar Section */}
      <div className="profile-edit-avatar-section">
        <div className="profile-edit-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="profile-edit-avatar-img" />
          ) : (
            <div className="profile-edit-avatar-placeholder">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="profile-edit-avatar-overlay">
            {uploading ? <div className="avatar-spinner" /> : <FiCamera size={24} />}
          </div>
        </div>
        <span className="profile-edit-avatar-text">Change Profile Photo</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Form Fields */}
      <div className="profile-edit-form">
        <div className="profile-edit-field">
          <label className="profile-edit-label">Full Name</label>
          <input
            type="text"
            className="profile-edit-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div className="profile-edit-field">
          <label className="profile-edit-label">Username</label>
          <input
            type="text"
            className="profile-edit-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <span className="profile-edit-hint">Username can be changed once every 5 days.</span>
        </div>

        <div className="profile-edit-field">
          <label className="profile-edit-label">Email</label>
          <input
            type="email"
            className="profile-edit-input disabled"
            value={user?.email || ''}
            disabled
          />
        </div>

        <button
          className="profile-edit-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
