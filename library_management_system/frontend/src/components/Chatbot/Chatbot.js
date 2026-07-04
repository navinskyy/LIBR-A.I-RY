import React, { useState, useRef, useEffect, useCallback } from 'react';
import './chatbot.css';
import api from '../../services/api';

const MAX_HISTORY = 50;
const MAX_SESSIONS = 20;

const Chatbot = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // typing effect state
  const [isTyping, setIsTyping] = useState(false);
  const [typedReply, setTypedReply] = useState('');

  const messagesEndRef = useRef(null);

  // Per-user storage key so each account has its own chat history
  const storedUser = localStorage.getItem('user');
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const storageKey = parsedUser
    ? `libraryChatSessions_${parsedUser.username || parsedUser.id}`
    : 'libraryChatSessions_guest';

  const createNewSession = useCallback(() => {
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: 'New Chat',
      created: new Date().toISOString(),
      messages: [
        {
          id: 1,
          text: "Welcome to LIBR-A.I-RY by GENG! I can help you find books, research topics, or answer questions about our collection.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          bookSuggested: null,
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev.slice(0, MAX_SESSIONS - 1)]);
    setActiveSessionId(newId);
    setShowHistory(false);
    setInputValue('');
  }, []);

  // Load sessions from localStorage (per user)
  useEffect(() => {
    const savedSessions = localStorage.getItem(storageKey);
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      const limitedSessions = parsedSessions.slice(-MAX_SESSIONS);
      setSessions(limitedSessions);
      if (limitedSessions.length > 0) {
        setActiveSessionId(limitedSessions[0].id);
      }
    } else {
      createNewSession();
    }
  }, [storageKey, createNewSession]);

  // Persist sessions (per user)
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(sessions));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [sessions, storageKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, typedReply]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = activeSession?.messages || [];

  const selectSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
    setShowHistory(false);
    setInputValue('');
  }, []);

  const updateSessionTitle = useCallback((sessionId, firstMessage) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title:
                firstMessage.slice(0, 50) +
                (firstMessage.length > 50 ? '...' : ''),
            }
          : session
      )
    );
  }, []);

  // Clear messages in current chat (but keep session)
  const clearCurrentChat = useCallback(() => {
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [
                  {
                    id: 1,
                    text: 'Chat cleared. How can I help you today?',
                    sender: 'ai',
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    bookSuggested: null,
                  },
                ],
              }
            : session
        )
      );
    }
  }, [activeSessionId]);

  // DELETE entire chat session
  const deleteCurrentChat = useCallback(() => {
    if (!activeSessionId) return;
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== activeSessionId);
      const newActiveId = remaining.length > 0 ? remaining[0].id : null;
      setActiveSessionId(newActiveId);
      setShowHistory(false);
      setInputValue('');
      return remaining;
    });
  }, [activeSessionId]);

  const handleBorrowBook = async (bookInfo) => {
    if (!bookInfo || !activeSessionId) return;

    setIsLoading(true);
    try {
      const searchRes = await api.get(
        `/books/search/?q=${encodeURIComponent(bookInfo.title)}`
      );
      if (searchRes.data && searchRes.data.length > 0) {
        const book = searchRes.data[0];
        await api.post('/reservations/reserve/', { book_id: book.id });

        const successMsg = {
          id: Date.now(),
          text: `✅ "${bookInfo.title}" by ${bookInfo.author} reserved successfully! Check your borrowed books page.`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          bookSuggested: null,
        };

        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? { ...session, messages: [...session.messages, successMsg] }
              : session
          )
        );
      } else {
        const notFoundMsg = {
          id: Date.now(),
          text: `❌ "${bookInfo.title}" not found in library catalog. Please search manually.`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          bookSuggested: null,
        };
        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? { ...session, messages: [...session.messages, notFoundMsg] }
              : session
          )
        );
      }
    } catch (err) {
      console.error('Borrow failed:', err);
      const errorMsg = {
        id: Date.now(),
        text: `❌ Failed to reserve "${bookInfo.title}". It might be unavailable or there was an account issue.`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        bookSuggested: null,
      };
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, errorMsg] }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Suggest 5 more related books from DB based on the suggested book (no AI)
  const handleSuggestMore = async (context, bookInfo) => {
    if (!activeSessionId || !bookInfo || !bookInfo.id) return;

    setIsLoading(true);
    try {
      const res = await api.get('/chatbot/related-books/', {
        params: { book_id: bookInfo.id },
      });

      const related = res.data.related || [];

      let text;
      if (related.length === 0) {
        text =
          "I couldn't find other closely related books in the catalog, but you might enjoy browsing similar genres.";
      } else {
        const lines = related.map(
          (b, idx) => `${idx + 1}. "${b.title}" by ${b.author}`
        );
        text =
          'Here are some related books from the library:\n' +
          lines.join('\n');
      }

      const moreBooksMsg = {
        id: Date.now(),
        text,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        bookSuggested: null,
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, moreBooksMsg] }
            : session
        )
      );
    } catch (err) {
      console.error('More suggestions failed:', err);
      const errorMsg = {
        id: Date.now(),
        text: 'Failed to find more related books. Try again later!',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        bookSuggested: null,
      };
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, errorMsg] }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading || !activeSessionId) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const userMessageId = Date.now();

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              messages: [
                ...session.messages,
                {
                  id: userMessageId,
                  text,
                  sender: 'user',
                  timestamp,
                  bookSuggested: null,
                },
              ],
            }
          : session
      )
    );

    const session = sessions.find((s) => s.id === activeSessionId);
    if (
      session &&
      session.messages.length === 1 &&
      session.messages[0].sender === 'ai'
    ) {
      updateSessionTitle(activeSessionId, text);
    }

    setInputValue('');
    setIsLoading(true);

    try {
      const conversation_history = activeMessages
        .map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }))
        .concat({ role: 'user', content: text });

      const res = await api.post('/chatbot/chat/', {
        message: text,
        history: conversation_history,
      });

      const fullReply =
        res.data.reply || 'Sorry, I could not generate a response.';
      const replyTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const aiMessageId = userMessageId + 1;

      // add empty AI message that will be filled as we "type"
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    id: aiMessageId,
                    text: '',
                    sender: 'ai',
                    timestamp: replyTimestamp,
                    bookSuggested: res.data.book_suggested || null,
                  },
                ],
              }
            : session
        )
      );

      // typing effect
      setIsTyping(true);
      setTypedReply('');
      let index = 0;

      const interval = setInterval(() => {
        index += 1;
        const currentText = fullReply.slice(0, index);
        setTypedReply(currentText);

        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId
              ? {
                  ...session,
                  messages: session.messages.map((m) =>
                    m.id === aiMessageId ? { ...m, text: currentText } : m
                  ),
                }
              : session
          )
        );

        if (index >= fullReply.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 5); // typing speed (ms per character)
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: userMessageId + 1,
        text: 'Error contacting AI service. Please try again.',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        bookSuggested: null,
      };
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, errorMsg] }
            : session
        )
      );
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => setInputValue(e.target.value);
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="library-chat-container">
      <div className="chat-header">
        {/* LEFT: chat history toggle */}
        <button
          className="history-toggle-btn"
          onClick={() => setShowHistory(!showHistory)}
          title="Chat History"
        >
          {showHistory ? '✕' : '☰'}
        </button>

        {/* CENTER: title */}
        <div className="header-title">
          <h2>LIBR-A.I-RY</h2>
          <p>
            {activeSession?.messages?.length <= 1
              ? 'New Chat'
              : activeSession?.title || 'New Chat'}
          </p>
        </div>

        {/* RIGHT: delete, clear, NEW chat */}
        <div className="header-actions">
          <button
            className="delete-chat-btn"
            onClick={deleteCurrentChat}
            title="Delete this chat"
          >
            🗑️
          </button>
          <button
            className="clear-chat-btn"
            onClick={clearCurrentChat}
            title="Clear messages"
          >
            🧹
          </button>
          <button
            className="new-chat-btn"
            onClick={createNewSession}
            title="Start a new chat"
            aria-label="Start a new chat"
          >
            <span className="new-chat-icon">➕</span>
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="chat-history-dropdown">
          <div className="history-list">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className={`history-item ${
                  session.id === activeSessionId ? 'active' : ''
                }`}
                onClick={() => selectSession(session.id)}
              >
                <div className="history-title">{session.title}</div>
                <div className="history-preview">
                  {session.messages[
                    session.messages.length - 1
                  ]?.text.slice(0, 30)}
                  ...
                </div>
                <div className="history-time">
                  {new Date(session.created).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="messages-container">
        {activeMessages.map((message) => {
          const isBookSuggestion =
            message.sender === 'ai' && message.bookSuggested;

          return (
            <div
              key={message.id}
              className={`message ${
                message.sender === 'user' ? 'user-message' : 'ai-message'
              }`}
            >
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">{message.timestamp}</div>

                {isBookSuggestion && message.bookSuggested.cover_url && (
                  <div className="chat-book-cover-wrapper">
                    <img
                      src={message.bookSuggested.cover_url}
                      alt={message.bookSuggested.title}
                      className="chat-book-cover"
                    />
                  </div>
                )}

                {isBookSuggestion && (
                  <div className="book-actions">
                    <button
                      className="borrow-btn"
                      onClick={() => handleBorrowBook(message.bookSuggested)}
                      disabled={isLoading}
                    >
                      📖 Borrow
                    </button>
                    <button
                      className="more-books-btn"
                      onClick={() =>
                        handleSuggestMore(
                          message.text,
                          message.bookSuggested
                        )
                      }
                      disabled={isLoading}
                    >
                      Suggest More
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Optional: keep the 3-dot loader only while waiting for API, not while typing */}
        {isLoading && !isTyping && (
          <div className="message ai-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask for book recommendations, summaries, or author info..."
          rows={1}
          className="message-input"
          disabled={!activeSessionId}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || inputValue.trim() === '' || !activeSessionId}
          className="send-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
