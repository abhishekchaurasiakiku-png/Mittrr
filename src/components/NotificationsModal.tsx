import { FiX, FiCheck } from 'react-icons/fi';
import type { NotificationWithSender } from '../types/database';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsModalProps {
  notifications: NotificationWithSender[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRequestPermission?: () => Promise<boolean>;
}

import { useState, useEffect } from 'react';

export default function NotificationsModal({ notifications, onClose, onMarkAsRead, onMarkAllAsRead, onRequestPermission }: NotificationsModalProps) {
  const [permission, setPermission] = useState(Notification.permission);
  const [loadingPermission, setLoadingPermission] = useState(false);

  const handleRequestPermission = async () => {
    if (onRequestPermission) {
      setLoadingPermission(true);
      await onRequestPermission();
      setPermission(Notification.permission);
      setLoadingPermission(false);
    }
  };
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: 0, overflow: 'hidden' }}>
        <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Notifications</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {notifications.some(n => !n.is_read) && (
              <button onClick={onMarkAllAsRead} className="menu-btn" style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                Mark all read
              </button>
            )}
            <button className="modal-close" onClick={onClose} style={{ top: 'auto', right: 'auto', position: 'relative' }}>
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        {permission !== 'granted' && onRequestPermission && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Enable push notifications on this device</span>
            <button 
              onClick={handleRequestPermission}
              disabled={loadingPermission}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              {loadingPermission ? 'Enabling...' : 'Enable'}
            </button>
          </div>
        )}

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1rem', 
                  borderBottom: '1px solid var(--border-color)',
                  background: notif.is_read ? 'transparent' : 'rgba(var(--accent-primary-rgb), 0.05)',
                  opacity: notif.is_read ? 0.7 : 1,
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                  {notif.sender?.avatar_url ? (
                    <img src={notif.sender.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    notif.sender?.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: notif.is_read ? 'normal' : 'bold', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {notif.sender?.full_name || notif.sender?.username || 'Someone'} sent a message
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {notif.content}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.4rem' }}>
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </div>
                </div>
                {!notif.is_read && (
                  <button 
                    onClick={() => onMarkAsRead(notif.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0.5rem', flexShrink: 0 }}
                    title="Mark as read"
                  >
                    <FiCheck size={18} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
