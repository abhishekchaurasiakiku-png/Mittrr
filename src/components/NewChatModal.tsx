import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types/database';
import { FiSearch, FiX, FiUsers } from 'react-icons/fi';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (participantIds: string[], name?: string, type?: 'direct' | 'group') => void;
  defaultType?: 'direct' | 'group';
}

export default function NewChatModal({ isOpen, onClose, onCreateChat, defaultType = 'direct' }: NewChatModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isGroup, setIsGroup] = useState(defaultType === 'group');
  const [searching, setSearching] = useState(false);

  // Update isGroup when defaultType changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setIsGroup(defaultType === 'group');
      setSelectedUsers([]);
      setSearchQuery('');
      setGroupName('');
    }
  }, [isOpen, defaultType]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id || '')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data as Profile[]);
    }
    setSearching(false);
  };

  const toggleUserSelection = (profile: Profile) => {
    if (selectedUsers.find((u) => u.id === profile.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== profile.id));
    } else {
      setSelectedUsers([...selectedUsers, profile]);
    }
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0) return;

    const ids = selectedUsers.map((u) => u.id);

    if (isGroup) {
      onCreateChat(ids, groupName || 'Group Chat', 'group');
    } else {
      onCreateChat(ids, undefined, 'direct');
    }

    // Reset
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName('');
    setIsGroup(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Conversation</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Group toggle */}
        <div className="modal-group-toggle">
          <button
            className={`toggle-btn ${!isGroup ? 'active' : ''}`}
            onClick={() => setIsGroup(false)}
          >
            Direct Message
          </button>
          <button
            className={`toggle-btn ${isGroup ? 'active' : ''}`}
            onClick={() => setIsGroup(true)}
          >
            <FiUsers /> Group Chat
          </button>
        </div>

        {isGroup && (
          <div className="modal-group-name">
            <input
              type="text"
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="modal-selected">
            {selectedUsers.map((u) => (
              <div key={u.id} className="selected-chip">
                <span>{u.username}</span>
                <button onClick={() => toggleUserSelection(u)}>
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="modal-search">
          <FiSearch className="modal-search-icon" />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="modal-results">
          {searching ? (
            <div className="modal-searching">Searching...</div>
          ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
            <div className="modal-no-results">No users found</div>
          ) : (
            searchResults.map((profile) => (
              <div
                key={profile.id}
                className={`modal-user-item ${selectedUsers.find((u) => u.id === profile.id) ? 'selected' : ''}`}
                onClick={() => toggleUserSelection(profile)}
              >
                <div className="modal-user-avatar">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`status-dot ${profile.status}`} />
                </div>
                <div className="modal-user-info">
                  <span className="modal-user-name">{profile.full_name || profile.username}</span>
                  <span className="modal-user-username">@{profile.username}</span>
                </div>
                {selectedUsers.find((u) => u.id === profile.id) && (
                  <div className="modal-check">✓</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create button */}
        <button
          className="modal-create-btn"
          onClick={handleCreate}
          disabled={selectedUsers.length === 0}
        >
          {isGroup ? 'Create Group' : 'Start Conversation'}
        </button>
      </div>
    </div>
  );
}
