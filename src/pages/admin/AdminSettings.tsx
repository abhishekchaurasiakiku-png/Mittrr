import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FiSave } from 'react-icons/fi';

export default function AdminSettings() {
  const [flags, setFlags] = useState<{ [key: string]: boolean }>({
    enable_status: true,
    enable_groups: true,
    maintenance_mode: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app we would upsert to feature_flags table
      for (const [key, value] of Object.entries(flags)) {
        await supabase.from('feature_flags').upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        });
      }
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-settings">
      <div className="admin-page-header">
        <h1>Platform Settings</h1>
        <p>Configure app features and policies.</p>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <div className="admin-stat-card" style={{ marginBottom: '2rem' }}>
          <h3>Feature Flags</h3>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(flags).map(([key, value]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <div 
                  style={{
                    width: '40px', height: '24px', borderRadius: '12px',
                    background: value ? 'var(--green)' : 'var(--border-color)',
                    position: 'relative', transition: 'all 0.2s'
                  }}
                  onClick={() => setFlags({ ...flags, [key]: !value })}
                >
                  <div style={{
                    position: 'absolute', top: '2px', left: value ? '18px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {key.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button 
          className="auth-btn" 
          onClick={handleSave} 
          disabled={loading}
          style={{ width: 'auto', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? 'Saving...' : <><FiSave /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
