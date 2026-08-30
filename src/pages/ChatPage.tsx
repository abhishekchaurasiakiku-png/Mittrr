import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import MainSidebar, { type MainTab } from '../components/MainSidebar';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import NewChatModal from '../components/NewChatModal';
import ProfilePanel from '../components/ProfilePanel';
import StatusPanel from '../components/StatusPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import type { ConversationWithDetails } from '../types/database';
import '../styles/chat.css';
import '../styles/components.css';
import '../styles/settings.css';

export default function ChatPage() {
  const { conversations, loading, createConversation, markAsRead } = useConversations();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<MainTab>('chats');
  const [showMiddlePane, setShowMiddlePane] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  // Track online status
  useOnlineStatus();

  // Auto-select conversation if provided in URL
  useEffect(() => {
    const convId = searchParams.get('conv');
    if (convId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === convId);
      if (conv) {
        setActiveConversationId(convId);
        markAsRead(convId);
        if (conv.type === 'group') {
          setActiveTab('groups');
        } else {
          setActiveTab('chats');
        }
        if (isMobileView) setShowMiddlePane(false);
        
        // Clean up the URL
        searchParams.delete('conv');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, conversations, isMobileView, markAsRead, setSearchParams]);

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) setShowMiddlePane(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeConversation: ConversationWithDetails | null =
    conversations.find((c) => c.id === activeConversationId) || null;

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    markAsRead(id);
    if (isMobileView) setShowMiddlePane(false);
  };

  const handleNewChat = async (participantIds: string[], name?: string, type?: 'direct' | 'group') => {
    const convId = await createConversation(participantIds, name, type);
    if (convId) {
      if (type === 'group') {
        setActiveTab('groups');
      } else {
        setActiveTab('chats');
      }
      setActiveConversationId(convId);
      if (isMobileView) setShowMiddlePane(false);
    }
  };

  const handleBackToList = () => {
    setShowMiddlePane(true);
    setActiveConversationId(null);
  };

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    setShowMiddlePane(true); // Always show list when changing tabs
  };

  // Determine what to show in the middle pane
  const renderMiddlePane = () => {
    switch (activeTab) {
      case 'chats':
      case 'groups':
        return (
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={() => setShowNewChat(true)}
            loading={loading}
            activeTab={activeTab}
          />
        );
      case 'status':
        return <StatusPanel />;
      case 'profile':
        return <ProfilePanel />;
      default:
        return null;
    }
  };

  // On mobile, if a chat is active and middle pane is hidden, don't show the main nav
  const showMainNav = !isMobileView || showMiddlePane;
  const showChatWindow = !isMobileView || !showMiddlePane;

  return (
    <div className="chat-page">
      <div className={`app-layout ${isMobileView ? 'mobile-layout' : ''}`}>
        
        {/* Far Left: Main Navigation */}
        {showMainNav && (
          <MainSidebar activeTab={activeTab} onSelectTab={handleTabChange} />
        )}

        {/* Middle: List/Panel */}
        {(!isMobileView || showMiddlePane) && (
          <div className="middle-pane">
            {renderMiddlePane()}
          </div>
        )}

        {/* Right: Chat Window */}
        {showChatWindow && (
          <div className="right-pane">
            {activeConversationId && !activeConversation ? (
              <div className="chat-window-empty">
                <div className="chat-loading-dots"><span /><span /><span /></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-tertiary)' }}>Loading conversation...</p>
              </div>
            ) : (
              <ErrorBoundary>
                <ChatWindow
                  conversation={activeConversation}
                  onBack={isMobileView ? handleBackToList : undefined}
                />
              </ErrorBoundary>
            )}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreateChat={handleNewChat}
        defaultType={activeTab === 'groups' ? 'group' : 'direct'}
      />
    </div>
  );
}
