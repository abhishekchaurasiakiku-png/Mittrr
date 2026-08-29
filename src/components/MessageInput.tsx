import { useState, useRef, useEffect } from 'react';
import { FiSend, FiSmile } from 'react-icons/fi';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';

interface MessageInputProps {
  onSend: (content: string, type?: 'text' | 'image' | 'file', fileUrl?: string, fileName?: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
      setShowEmojiPicker(false);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="message-input-container">
      {showEmojiPicker && (
        <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
          <EmojiPicker 
            onEmojiClick={onEmojiClick} 
            theme={Theme.DARK}
            lazyLoadEmojis={true}
          />
        </div>
      )}

      <div className="message-input-bar">
        <button
          className="input-action-btn emoji-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Add emoji"
        >
          <FiSmile />
        </button>

        <textarea
          ref={textareaRef}
          className="message-textarea"
          placeholder="Type a message..."
          value={message}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!message.trim()}
          title="Send message"
        >
          <FiSend />
        </button>
      </div>
    </div>
  );
}
