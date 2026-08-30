import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalGroups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch users count (Note: using profiles table since auth.users isn't readable via client normally)
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch messages count
        const { count: messagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true });

        // Fetch groups count
        const { count: groupsCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'group');

        setStats({
          totalUsers: usersCount || 0,
          totalMessages: messagesCount || 0,
          totalGroups: groupsCount || 0,
        });
      } catch (error) {
        console.error('Failed to fetch admin stats', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
        <p>Platform metrics and quick actions.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem' }}>Loading metrics...</div>
      ) : (
        <div className="admin-dashboard-grid">
          <div className="admin-stat-card">
            <h3>Total Users</h3>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          <div className="admin-stat-card">
            <h3>Total Messages</h3>
            <div className="stat-value">{stats.totalMessages}</div>
          </div>
          <div className="admin-stat-card">
            <h3>Active Groups</h3>
            <div className="stat-value">{stats.totalGroups}</div>
          </div>
        </div>
      )}
    </div>
  );
}
