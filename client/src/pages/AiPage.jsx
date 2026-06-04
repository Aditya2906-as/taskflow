import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';

const SUGGESTIONS = [
  'Help me write a task description for setting up CI/CD pipeline',
  'How should I prioritize 5 tasks with the same deadline?',
  'Write a project kickoff message for my team',
  'What is the best way to break down a large feature into tasks?',
  'Give me a weekly planning template',
  'How do I run effective stand-up meetings?',
];

export default function AiPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef  = useRef();
  const inputRef   = useRef();
  const abortRef   = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;

    const userMsg   = { role: 'user', content };
    const newMsgs   = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setStreaming(true);

    // Placeholder for assistant
    const placeholder = { role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, placeholder]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ messages: newMsgs }),
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error('AI request failed');

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setMessages(prev => prev.map((m, i) =>
                  i === prev.length - 1
                    ? { ...m, content: fullText, streaming: true }
                    : m
                ));
              }
            } catch {}
          }
        }
      }

      // Finalize
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, streaming: false } : m
      ));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1
            ? { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', streaming: false }
            : m
        ));
      }
    } finally {
      setStreaming(false);
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages(prev => prev.map((m, i) =>
      i === prev.length - 1 ? { ...m, streaming: false } : m
    ));
  };

  const clearChat = () => {
    if (streaming) stopStreaming();
    setMessages([]);
  };

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-avatar-icon">
            <i className="ti ti-sparkles"></i>
          </div>
          <div>
            <h1 className="ai-title">TaskFlow AI</h1>
            <p className="ai-subtitle">Your personal productivity assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearChat}>
            <i className="ti ti-trash" style={{ fontSize:13 }}></i> Clear chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="ai-body">
        {messages.length === 0 ? (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">
              <i className="ti ti-sparkles"></i>
            </div>
            <h2 className="ai-welcome-title">How can I help you today?</h2>
            <p className="ai-welcome-sub">
              Ask me anything about tasks, planning, team communication, or productivity.
            </p>
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="ai-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="ai-msg-avatar">
                    <i className="ti ti-sparkles" style={{ fontSize:12 }}></i>
                  </div>
                )}
                <div className="ai-msg-bubble">
                  {msg.role === 'assistant' ? (
                    <div className="ai-msg-content">
                      <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                      {msg.streaming && <span className="ai-cursor">▋</span>}
                    </div>
                  ) : (
                    <div className="ai-msg-content">{msg.content}</div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="ai-msg-user-avatar">
                    <i className="ti ti-user" style={{ fontSize:12 }}></i>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="ai-footer">
        <div className="ai-input-wrap">
          <textarea
            ref={inputRef}
            className="ai-input"
            placeholder="Ask TaskFlow AI anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            disabled={streaming}
          />
          <div className="ai-input-actions">
            <span className="ai-input-hint">
              {streaming ? 'Generating…' : 'Enter to send · Shift+Enter for new line'}
            </span>
            {streaming ? (
              <button className="btn btn-danger btn-sm" onClick={stopStreaming}>
                <i className="ti ti-player-stop" style={{ fontSize:12 }}></i> Stop
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => sendMessage()}
                disabled={!input.trim()}
              >
                <i className="ti ti-send" style={{ fontSize:12 }}></i> Send
              </button>
            )}
          </div>
        </div>
        <p className="ai-disclaimer">
          AI responses may not always be accurate. Always verify important information.
        </p>
      </div>
    </div>
  );
}