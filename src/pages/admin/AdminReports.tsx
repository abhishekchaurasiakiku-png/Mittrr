import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FiCheck, FiX } from 'react-icons/fi';

interface Report {
  id: string;
  reporter_id: string;
  target_type: 'message' | 'status' | 'group' | 'user';
  target_id: string;
  reason: string;
  status: 'open' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
  reporter?: { username: string; full_name?: string };
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reporter_id(username, full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data as Report[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, status: Report['status']) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
      setReports(reports.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report status.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--yellow)';
      case 'actioned': return 'var(--green)';
      case 'dismissed': return 'var(--text-tertiary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="admin-reports">
      <div className="admin-page-header">
        <h1>Moderation Queue</h1>
        <p>Review and action user reports.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reporter</th>
              <th>Target Type</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>Loading reports...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No reports found.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(report.created_at).toLocaleString()}</td>
                  <td>{report.reporter?.full_name || report.reporter?.username || 'Unknown User'}</td>
                  <td>
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                      {report.target_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {report.reason || 'No reason provided'}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: getStatusColor(report.status), fontWeight: 600, fontSize: '0.875rem' }}>
                      {report.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {report.status === 'open' && (
                      <div className="admin-table-actions">
                        <button className="admin-action-btn" onClick={() => handleUpdateStatus(report.id, 'actioned')} style={{ color: 'var(--green)' }}>
                          <FiCheck /> Actioned
                        </button>
                        <button className="admin-action-btn" onClick={() => handleUpdateStatus(report.id, 'dismissed')} style={{ color: 'var(--text-secondary)' }}>
                          <FiX /> Dismiss
                        </button>
                      </div>
                    )}
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
