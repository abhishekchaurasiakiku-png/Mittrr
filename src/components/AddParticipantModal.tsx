import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types/database';
import { FiSearch, FiX, FiUserPlus } from 'react-icons/fi';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentParticipantIds: string[];
  onAddParticipants: (participantIds: string[]) => void;
}

export default function AddParticipantModal({ isOpen, onClose, conversationId, currentParticipantIds, onAddParticipants }: AddParticipantModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

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
      // Filter out users already in the group
      const filteredData = (data as Profile[]).filter(p => !currentParticipantIds.includes(p.id));
      setSearchResults(filteredData);
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

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return;
    
    setAdding(true);
    const ids = selectedUsers.map(u => u.id);
    
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .insert(
          ids.map(id => ({
            conversation_id: conversationId,
            user_id: id
          }))
        );

      if (error) {
        console.error('Error adding participants:', error);
        alert('Failed to add participants.');
      } else {
        onAddParticipants(ids);
        onClose();
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUsers([]);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Participants</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

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
            <div className="modal-no-results">No new users found</div>
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

        {/* Add button */}
        <button
          className="modal-create-btn"
          onClick={handleAdd}
          disabled={selectedUsers.length === 0 || adding}
        >
          <FiUserPlus style={{ marginRight: '8px' }} />
          {adding ? 'Adding...' : `Add ${selectedUsers.length > 0 ? selectedUsers.length : ''} Users`}
        </button>
      </div>
    </div>
  );
}
