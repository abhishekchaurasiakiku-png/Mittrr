import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';
import { FiSearch, FiMoreVertical, FiShieldOff, FiUserX } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as unknown as Profile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (userId: string, action: 'suspend' | 'ban' | 'activate') => {
    const status = action === 'activate' ? 'active' : action === 'ban' ? 'banned' : 'suspended';
    
    // For suspend, we could ask for duration. Hardcoding 7 days for demo.
    const suspended_until = action === 'suspend' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status, suspended_until })
        .eq('id', userId);

      if (error) throw error;

      // Optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, account_status: status, suspended_until } : u));
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} user.`);
    }
    setActionMenuId(null);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-users">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>User Management</h1>
          <p>Manage platform users, bans, and suspensions.</p>
        </div>
        
        <div className="admin-search">
          <FiSearch className="search-icon" style={{ position: 'absolute', margin: '0.75rem', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>Loading users...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>No users found.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 'bold' }}>
                        {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.full_name || user.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: user.account_status === 'banned' ? 'rgba(255,59,48,0.1)' : user.account_status === 'suspended' ? 'rgba(255,204,0,0.1)' : 'rgba(52,199,89,0.1)',
                      color: user.account_status === 'banned' ? 'var(--red)' : user.account_status === 'suspended' ? 'var(--yellow)' : 'var(--green)'
                    }}>
                      {user.account_status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(user.last_seen).toLocaleString()}</td>
                  <td>
                    <div style={{ position: 'relative' }}>
                      <button 
                        className="admin-action-btn"
                        onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
                      >
                        <FiMoreVertical size={18} />
                      </button>
                      
                      {actionMenuId === user.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', zIndex: 10, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          {user.account_status !== 'active' && (
                            <button className="admin-action-btn" onClick={() => handleAction(user.id, 'activate')} style={{ width: '100%', textAlign: 'left' }}>
                              Activate User
                            </button>
                          )}
                          {user.account_status !== 'suspended' && (
                            <button className="admin-action-btn warning" onClick={() => handleAction(user.id, 'suspend')} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FiShieldOff /> Suspend (7d)
                            </button>
                          )}
                          {user.account_status !== 'banned' && (
                            <button className="admin-action-btn danger" onClick={() => handleAction(user.id, 'ban')} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FiUserX /> Ban User
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
