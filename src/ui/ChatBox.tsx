import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { MULTIPLAYER } from '@/constants/multiplayer';
import { useChatStore } from '@/store/chatStore';
import { setChatFocused } from '@/systems/inputSystem';
import { sendChat } from '@/systems/networkSystem';
import { useEditorStore } from '@/store/editorStore';

export default function ChatBox() {
  const messages = useChatStore((s) => s.messages);
  const isOpen = useChatStore((s) => s.isOpen);
  const activeChannel = useChatStore((s) => s.activeChannel);
  const unreadCount = useChatStore((s) => s.unreadCount);
  const toggleChat = useChatStore((s) => s.toggleChat);
  const setChannel = useChatStore((s) => s.setChannel);
  const openChat = useChatStore((s) => s.openChat);

  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global key listener: Enter or T to toggle chat
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Enter' && !isOpen) {
        e.preventDefault();
        openChat();
      } else if (e.key === 't' && !isOpen) {
        if (useEditorStore.getState().enabled) return;
        e.preventDefault();
        openChat();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        toggleChat();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, openChat, toggleChat]);

  // Focus input and set chat focus guard when opening
  useEffect(() => {
    setChatFocused(isOpen);
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (text.length === 0) return;
    sendChat(text, activeChannel);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggleChat();
    }
  };

  if (!isOpen) {
    return unreadCount > 0 ? (
      <div className="chat-unread-badge" onClick={openChat}>
        {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message{unreadCount > 1 ? 's' : ''}
      </div>
    ) : null;
  }

  return (
    <div className="chat-box">
      {/* Channel tabs */}
      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeChannel === 'global' ? 'active' : ''}`}
          onClick={() => setChannel('global')}
        >
          Global
        </button>
        <button
          className={`chat-tab ${activeChannel === 'proximity' ? 'active' : ''}`}
          onClick={() => setChannel('proximity')}
        >
          Proximité
        </button>
        <button className="chat-close" onClick={toggleChat}>✕</button>
      </div>

      {/* Message list */}
      <div className="chat-messages" ref={listRef}>
        {messages
          .filter((m) => m.channel === activeChannel || m.playerId === 'system')
          .map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.playerId === 'system' ? 'system' : ''}`}
            >
              {msg.playerId !== 'system' && (
                <span className="chat-sender">{msg.name}: </span>
              )}
              <span className="chat-text">{msg.text}</span>
            </div>
          ))}
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MULTIPLAYER.chatMaxLength))}
          onKeyDown={handleKeyDown}
          placeholder={`Message (${activeChannel})...`}
          maxLength={MULTIPLAYER.chatMaxLength}
        />
        <button className="chat-send" onClick={handleSend}>↵</button>
      </div>
    </div>
  );
}
