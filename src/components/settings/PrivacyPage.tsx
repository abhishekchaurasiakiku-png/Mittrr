import { useState } from 'react';
import { FiEye, FiSlash } from 'react-icons/fi';

export default function PrivacyPage() {
  const [profileVisible, setProfileVisible] = useState(true);

  return (
    <div className="privacy-page">
      {/* Profile Visibility */}
      <div className="privacy-card">
        <div className="privacy-card-header">
          <div className="privacy-card-icon">
            <FiEye size={18} />
          </div>
          <div className="privacy-card-text">
            <span className="privacy-card-title">Profile Visibility</span>
            <span className="privacy-card-desc">Control who can see your details</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={profileVisible}
              onChange={() => setProfileVisible(!profileVisible)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        <p className="privacy-card-info">
          {profileVisible
            ? 'Your full profile is visible in search results.'
            : 'Your profile is hidden from search results.'}
        </p>
      </div>

      {/* Blocked Users */}
      <div className="privacy-card">
        <div className="privacy-card-header">
          <div className="privacy-card-icon blocked-icon">
            <FiSlash size={18} />
          </div>
          <div className="privacy-card-text">
            <span className="privacy-card-title">Blocked Users</span>
          </div>
          <span className="privacy-count">0</span>
        </div>
        <div className="privacy-blocked-list">
          <p className="privacy-empty-text">No blocked users</p>
        </div>
      </div>
    </div>
  );
}
