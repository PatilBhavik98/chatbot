import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../api/client';

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function Chat() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [peerEmail, setPeerEmail] = useState('');
  const [newChatError, setNewChatError] = useState('');
  const [typingPeer, setTypingPeer] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  const loadConversations = useCallback(async () => {
    const data = await api.conversations();
    setConversations(data.conversations);
  }, []);

  useEffect(() => {
    loadConversations().catch(console.error);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    api.messages(activeId).then((data) => setMessages(data.messages));
    socket?.emit('join_conversation', { conversationId: activeId });
  }, [activeId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      if (msg.conversationId === activeId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const onConvUpdate = ({ conversationId, lastMessageText, lastMessageAt }) => {
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === conversationId ? { ...c, lastMessageText, lastMessageAt } : c
          )
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    };

    const onPresence = ({ userId, isOnline }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser?.id === userId
            ? { ...c, otherUser: { ...c.otherUser, isOnline } }
            : c
        )
      );
    };

    const onTyping = ({ conversationId, userId, isTyping }) => {
      if (conversationId === activeId && userId !== user?.id) {
        setTypingPeer(isTyping);
      }
    };

    socket.on('new_message', onMessage);
    socket.on('conversation_updated', onConvUpdate);
    socket.on('presence', onPresence);
    socket.on('typing', onTyping);

    return () => {
      socket.off('new_message', onMessage);
      socket.off('conversation_updated', onConvUpdate);
      socket.off('presence', onPresence);
      socket.off('typing', onTyping);
    };
  }, [socket, activeId, user?.id]);

  async function startNewChat(e) {
    e.preventDefault();
    setNewChatError('');
    const email = peerEmail.trim().toLowerCase();
    if (!email) return;
    try {
      const { conversation } = await api.startConversation(email);
      await loadConversations();
      setActiveId(conversation.id);
      setPeerEmail('');
    } catch (err) {
      setNewChatError(err.message);
    }
  }

  function sendMessage(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || !socket) return;
    socket.emit('send_message', { conversationId: activeId, text });
    setDraft('');
    socket.emit('typing', { conversationId: activeId, isTyping: false });
  }

  function onDraftChange(value) {
    setDraft(value);
    if (!socket || !activeId) return;
    socket.emit('typing', { conversationId: activeId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { conversationId: activeId, isTyping: false });
    }, 1500);
  }

  return (
    <div className={`chat-layout${activeId ? ' sidebar-hidden' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <strong>Chats</strong>
            <div className="user-info">{user?.email}</div>
          </div>
          <button type="button" className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
        <form className="new-chat" onSubmit={startNewChat}>
          <input
            type="email"
            placeholder="Start chat — peer email"
            value={peerEmail}
            onChange={(e) => setPeerEmail(e.target.value)}
          />
          <button type="submit" className="btn-ghost">
            Add
          </button>
        </form>
        {newChatError && (
          <div className="error-banner" style={{ margin: '0 1rem 0.5rem' }}>
            {newChatError}
          </div>
        )}
        <div className="conv-list">
          {conversations.length === 0 && (
            <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No chats yet. Enter someone&apos;s email above.
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              className={`conv-item${c.id === activeId ? ' active' : ''}`}
              onClick={() => setActiveId(c.id)}
              onKeyDown={(e) => e.key === 'Enter' && setActiveId(c.id)}
            >
              <div className="meta">
                <span className="name">
                  <span className={`online-dot${c.otherUser?.isOnline ? ' on' : ''}`} />
                  {c.otherUser?.displayName || 'Unknown'}
                </span>
              </div>
              <span className="preview">{c.lastMessageText || 'No messages yet'}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className={`chat-main${activeConv ? '' : ' empty'}`}>
        {!activeConv ? (
          <p>Select a chat or start a new conversation by email.</p>
        ) : (
          <>
            <header className="chat-header">
              <h2>{activeConv.otherUser?.displayName}</h2>
              <div className="email">{activeConv.otherUser?.email}</div>
            </header>
            <p className="typing">{typingPeer ? 'Typing…' : '\u00A0'}</p>
            <div className="messages">
              {messages.map((m) => {
                const mine = m.sender.id === user?.id;
                return (
                  <div key={m.id} className={`msg-row${mine ? ' mine' : ''}`}>
                    <div className="bubble">
                      {m.text}
                      <span className="time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form className="composer" onSubmit={sendMessage}>
              <textarea
                rows={1}
                placeholder="Type a message"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
              <button type="submit" className="btn-send" disabled={!draft.trim()}>
                Send
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}