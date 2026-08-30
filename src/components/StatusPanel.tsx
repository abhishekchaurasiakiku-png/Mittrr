import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, Status } from '../types/database';
import { FiPlus } from 'react-icons/fi';
import StatusCreator from './status/StatusCreator';
import StatusViewer from './status/StatusViewer';

type UserStatusGroup = {
  profile: Profile;
  statuses: Status[];
};

export default function StatusPanel() {
  const { user, profile } = useAuth();
  const [statusGroups, setStatusGroups] = useState<UserStatusGroup[]>([]);
  const [myStatuses, setMyStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreator, setShowCreator] = useState(false);
  const [viewingGroupIndex, setViewingGroupIndex] = useState<number | null>(null);
  const [viewingMyStatus, setViewingMyStatus] = useState(false);

  const fetchStatuses = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Auto-cleanup expired statuses from the database (24 hours logic)
    supabase
      .from('statuses')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .then(({ error }) => {
        if (error) console.error('Failed to cleanup expired statuses:', error);
      });

    // Get active statuses (not expired)
    const { data, error } = await supabase
      .from('statuses')
      .select('*, profile:profiles(*)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (!error && data) {
      const myActive = data.filter(s => s.user_id === user.id) as any;
      setMyStatuses(myActive.map((s: any) => {
        const isVideoHack = s.type === 'image' && s.content.includes('?type=video');
        return {
          id: s.id, user_id: s.user_id, type: isVideoHack ? 'video' : s.type, content: s.content, bg_color: s.bg_color, created_at: s.created_at, expires_at: s.expires_at
        };
      }));

      const others = data.filter(s => s.user_id !== user.id) as any[];
      
      // Filter out statuses from people who are not in our conversations
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);
        
      if (participantData && participantData.length > 0) {
        const myConvIds = participantData.map(p => p.conversation_id);
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .in('conversation_id', myConvIds)
          .neq('user_id', user.id);
          
        if (allParticipants) {
          const allowedUserIds = new Set(allParticipants.map(p => p.user_id));
          
          // Group by user
          const grouped = new Map<string, UserStatusGroup>();
          others.forEach(s => {
            const prof = s.profile as Profile;
            // Only add if they are in our allowed list
            if (allowedUserIds.has(prof.id)) {
              if (!grouped.has(prof.id)) {
                grouped.set(prof.id, { profile: prof, statuses: [] });
              }
              const isVideoHack = s.type === 'image' && s.content.includes('?type=video');
              grouped.get(prof.id)!.statuses.push({
                id: s.id, user_id: s.user_id, type: isVideoHack ? 'video' : s.type, content: s.content, bg_color: s.bg_color, created_at: s.created_at, expires_at: s.expires_at
              });
            }
          });
          
          setStatusGroups(Array.from(grouped.values()));
        } else {
          setStatusGroups([]);
        }
      } else {
        setStatusGroups([]);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleNextUser = () => {
    if (viewingGroupIndex !== null && viewingGroupIndex < statusGroups.length - 1) {
      setViewingGroupIndex(viewingGroupIndex + 1);
    } else {
      setViewingGroupIndex(null);
      setViewingMyStatus(false);
    }
  };

  const handlePrevUser = () => {
    if (viewingGroupIndex !== null && viewingGroupIndex > 0) {
      setViewingGroupIndex(viewingGroupIndex - 1);
    }
  };

  const handleReportStatus = async (statusId: string) => {
    const reason = window.prompt("Reason for reporting this status?");
    if (!reason || !user) return;

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: 'status',
        target_id: statusId,
        reason
      });
      if (error) throw error;
      alert("Status reported successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to report status.");
    }
  };

  return (
    <div className="status-panel">
      <div className="sidebar-panel-header">
        <h2>Status</h2>
      </div>

      <div className="status-list">
        {/* My Status */}
        <div className="status-section-title">My Status</div>
        <div className="status-item" onClick={() => myStatuses.length > 0 ? setViewingMyStatus(true) : setShowCreator(true)}>
          <div className="status-avatar-wrapper mine">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="My Status" className={`status-avatar ${myStatuses.length > 0 ? 'has-status' : ''}`} />
            ) : (
              <div className={`avatar-placeholder status-avatar ${myStatuses.length > 0 ? 'has-status' : ''}`}>
                {profile?.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="status-add-badge" onClick={(e) => { e.stopPropagation(); setShowCreator(true); }}>
              <FiPlus />
            </div>
          </div>
          <div className="status-info">
            <span className="status-name">My Status</span>
            <span className="status-text">
              {myStatuses.length > 0 ? 'Tap to view' : 'Tap to add status update'}
            </span>
          </div>
        </div>

        {/* Other Status */}
        <div className="status-section-title" style={{ marginTop: '1rem' }}>Other Status</div>
        
        {loading ? (
          <div className="sidebar-loading">
            <div className="chat-loading-dots"><span /><span /><span /></div>
          </div>
        ) : statusGroups.length === 0 ? (
          <div className="sidebar-empty">
            <p>No recent updates</p>
          </div>
        ) : (
          statusGroups.map((group, idx) => (
            <div key={group.profile.id} className="status-item" onClick={() => setViewingGroupIndex(idx)}>
              <div className="status-avatar-wrapper">
                {group.profile.avatar_url ? (
                  <img src={group.profile.avatar_url} alt={group.profile.username} className="status-avatar has-status" />
                ) : (
                  <div className="avatar-placeholder status-avatar has-status">
                    {group.profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="status-info">
                <span className="status-name">{group.profile.full_name || group.profile.username}</span>
                <span className="status-text">Today, {new Date(group.statuses[group.statuses.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreator && (
        <StatusCreator 
          onClose={() => setShowCreator(false)} 
          onSuccess={() => {
            setShowCreator(false);
            fetchStatuses();
          }} 
        />
      )}

      {viewingGroupIndex !== null && statusGroups[viewingGroupIndex] && (
        <StatusViewer
          statuses={statusGroups[viewingGroupIndex].statuses}
          userProfile={statusGroups[viewingGroupIndex].profile}
          onClose={() => setViewingGroupIndex(null)}
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
          onDeleteStatus={() => fetchStatuses()}
          onReportStatus={handleReportStatus}
        />
      )}

      {viewingMyStatus && profile && myStatuses.length > 0 && (
        <StatusViewer
          statuses={myStatuses}
          userProfile={profile}
          onClose={() => setViewingMyStatus(false)}
          onDeleteStatus={() => fetchStatuses()}
          onAddStatus={() => {
            setViewingMyStatus(false);
            setShowCreator(true);
          }}
        />
      )}
    </div>
  );
}
