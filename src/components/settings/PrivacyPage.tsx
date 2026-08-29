import { useState, useEffect } from 'react';
import { FiEye, FiSlash } from 'react-icons/fi';
import { useUserActions } from '../../hooks/useUserActions';
import { supabase } from '../../lib/supabase';

export default function PrivacyPage() {
  const [profileVisible, setProfileVisible] = useState(true);

  const { blockedUsers, unblockUser } = useUserActions();
  const [blockedProfiles, setBlockedProfiles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBlockedProfiles() {
      if (blockedUsers.size === 0) {
        setBlockedProfiles([]);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(blockedUsers));
        
      if (data) {
        setBlockedProfiles(data);
      }
    }
    
    fetchBlockedProfiles();
  }, [blockedUsers]);

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
          <span className="privacy-count">{blockedUsers.size}</span>
        </div>
        <div className="privacy-blocked-list" style={{ marginTop: '1rem' }}>
          {blockedProfiles.length === 0 ? (
            <p className="privacy-empty-text">No blocked users</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {blockedProfiles.map(profile => (
                <div key={profile.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div className="avatar-placeholder" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                        {profile.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.username}</span>
                  </div>
                  <button 
                    onClick={() => unblockUser(profile.id)}
                    style={{ background: 'var(--bg-hover)', border: 'none', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
