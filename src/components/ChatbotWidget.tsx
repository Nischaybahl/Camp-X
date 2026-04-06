import { useState, useRef, useEffect, useCallback } from 'react';

/* ─── Constants ───────────────────────────────────────────────────────── */
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY || '';
const WEATHER_KEY = import.meta.env.VITE_WEATHER_KEY || '';

const PLATFORM_MAP: Record<string, string> = {
  youtube: 'https://youtube.com',
  linkedin: 'https://linkedin.com',
  chatgpt: 'https://chat.openai.com',
  claude: 'https://claude.ai',
  github: 'https://github.com',
  gmail: 'https://mail.google.com',
  instagram: 'https://instagram.com',
  twitter: 'https://twitter.com',
};

const SYSTEM_PROMPT = `You are CampX AI, the official assistant for CampX — a college platform created by Nischay Bahl. CampX has these features:
- Campus Complaint: submit and track campus complaints
- Notes: upload and access study notes
- Attendance: track your class attendance
- PYQ: access previous year exam questions
- Academia Central: hub for academic resources
- College Updates: latest college news
- Admin Panel: for administrators only

You can help with:
1. General greetings and conversation
2. Explaining CampX features to users
3. BTech career guidance — when asked, explain different job roles (Software Developer, Data Scientist, DevOps, ML Engineer, Cybersecurity Analyst, Product Manager, UI/UX Designer, Cloud Engineer, Full Stack Developer), what programming languages and skills each requires, average time to learn, expected salary in India and abroad, and job demand from 2025 to 2030.
4. Resume/CV rating — ask the user to paste their resume text, then give a score out of 10 with specific feedback on: formatting, content quality, skills section, ATS compatibility, and what to improve.
5. Weather info if city is provided.
Be friendly, concise, and helpful. Keep responses short (under 200 words) unless the user asks for detailed guidance.`;

const QUICK_ACTIONS = [
  { label: '🕐 Time & Date', msg: 'What time is it?' },
  { label: '🌤️ Weather', msg: 'What is the weather?' },
  { label: '▶️ Open YouTube', msg: 'Open YouTube' },
  { label: '🎓 CampX Features', msg: 'What are CampX features?' },
  { label: '💼 BTech Career Guide', msg: 'Give me a BTech career guide' },
  { label: '📄 Rate My Resume', msg: 'Rate my resume' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey! 👋 I'm **CampX AI**. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [waitingForCity, setWaitingForCity] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  /* ─── Helpers ─────────────────────────────────────────────────────── */
  const addMsg = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages(prev => {
      const next = [...prev, { role, content }];
      return next.length > 40 ? next.slice(-40) : next;
    });
  }, []);

  const getTimeDate = () => {
    const now = new Date();
    return `🕐 **Time:** ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}\n📅 **Date:** ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  };

  const tryOpenPlatform = (text: string): string | null => {
    const lower = text.toLowerCase();
    for (const [name, url] of Object.entries(PLATFORM_MAP)) {
      if (lower.includes('open') && lower.includes(name)) {
        window.open(url, '_blank');
        return `✅ Opened **${name.charAt(0).toUpperCase() + name.slice(1)}** in a new tab!`;
      }
    }
    return null;
  };

  const fetchWeather = async (city: string): Promise<string> => {
    if (!WEATHER_KEY) return '⚠️ Weather API key not configured. Add `VITE_WEATHER_KEY` to your .env file.';
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_KEY}`
      );
      if (!res.ok) return `❌ Could not find weather for "${city}". Please check the city name.`;
      const d = await res.json();
      return `🌤️ **Weather in ${d.name}:**\n🌡️ Temperature: ${d.main.temp}°C (feels like ${d.main.feels_like}°C)\n☁️ Condition: ${d.weather[0].description}\n💧 Humidity: ${d.main.humidity}%\n💨 Wind: ${d.wind.speed} m/s`;
    } catch {
      return '❌ Failed to fetch weather data. Please try again.';
    }
  };

  const callClaude = async (history: Message[]): Promise<string> => {
    if (!ANTHROPIC_KEY) return '⚠️ Anthropic API key not configured. Add `VITE_ANTHROPIC_KEY` to your .env file.';
    try {
      const apiMessages = history
        .filter(m => m.content)
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Claude API error:', err);
        return '❌ Sorry, I couldn\'t process that right now. Please try again.';
      }

      const data = await res.json();
      return data.content?.[0]?.text || 'I didn\'t get a response. Please try again.';
    } catch (e) {
      console.error('Claude API error:', e);
      return '❌ Network error. Please check your connection.';
    }
  };

  /* ─── Send message ──────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    addMsg('user', msg);
    setLoading(true);

    const lower = msg.toLowerCase();

    try {
      // Time & Date
      if (/\b(time|date|day)\b/i.test(lower) && /\b(what|current|tell|show)\b/i.test(lower)) {
        addMsg('assistant', getTimeDate());
        return;
      }

      // Open platform
      const platformReply = tryOpenPlatform(msg);
      if (platformReply) { addMsg('assistant', platformReply); return; }

      // Weather flow
      if (waitingForCity) {
        setWaitingForCity(false);
        const weatherReply = await fetchWeather(msg);
        addMsg('assistant', weatherReply);
        return;
      }

      if (/\bweather\b/i.test(lower)) {
        // Check if city is in the message
        const cityMatch = lower.match(/weather\s+(?:in|for|of|at)\s+(.+)/i);
        if (cityMatch) {
          const weatherReply = await fetchWeather(cityMatch[1].trim());
          addMsg('assistant', weatherReply);
        } else {
          setWaitingForCity(true);
          addMsg('assistant', '🌍 Sure! Which city would you like to check the weather for?');
        }
        return;
      }

      // Claude API for everything else
      const updatedHistory: Message[] = [...messages, { role: 'user', content: msg }];
      const reply = await callClaude(updatedHistory);
      addMsg('assistant', reply);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, waitingForCity, addMsg]);

  /* ─── Voice input ───────────────────────────────────────────────── */
  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { addMsg('assistant', '⚠️ Voice input is not supported in this browser.'); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  /* ─── Simple markdown renderer ──────────────────────────────────── */
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      rendered = rendered.replace(/`(.+?)`/g, '<code style="background:rgba(245,200,66,0.15);padding:1px 5px;border-radius:4px;font-size:0.82em">$1</code>');
      return <p key={i} style={{ margin: line ? '0.25em 0' : '0.6em 0' }} dangerouslySetInnerHTML={{ __html: rendered || '&nbsp;' }} />;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ─── Styles ────────────────────────────────────────────────────── */
  const Y = '#f5c842'; // accent yellow
  const BG = '#111';
  const BG2 = '#1a1a1a';
  const BORDER = 'rgba(245,200,66,0.15)';

  /* ─── Render ────────────────────────────────────────────────────── */
  return (
    <>
      {/* Chat panel */}
      <div
        id="campx-chatbot-panel"
        style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 99999,
          width: 370, height: 530,
          background: BG, border: `1px solid ${BORDER}`,
          borderRadius: 20, boxShadow: '0 12px 50px rgba(0,0,0,0.6), 0 0 30px rgba(245,200,66,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          background: `linear-gradient(135deg, ${BG2}, #222)`,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: `linear-gradient(135deg, ${Y}, #e0ad00)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: `0 2px 12px rgba(245,200,66,0.3)`,
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.3px' }}>
              CampX AI
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              Always here to help
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >✕</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
          display: 'flex', flexDirection: 'column', gap: 10,
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'cbFadeIn 0.3s ease',
            }}>
              <div style={{
                maxWidth: '82%', padding: '10px 14px', borderRadius: 14,
                fontSize: '0.84rem', lineHeight: 1.55, wordBreak: 'break-word',
                ...(m.role === 'user'
                  ? { background: `linear-gradient(135deg, ${Y}, #e0b800)`, color: '#000', borderBottomRightRadius: 4 }
                  : { background: BG2, color: '#e0e0e0', border: `1px solid rgba(255,255,255,0.06)`, borderBottomLeftRadius: 4 }),
              }}>
                {renderMarkdown(m.content)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: BG2, border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: 14, padding: '12px 18px', display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(d => (
                  <div key={d} style={{
                    width: 7, height: 7, borderRadius: '50%', background: Y, opacity: 0.7,
                    animation: `cbBounce 1.2s ease-in-out ${d * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick actions (only show at start) */}
        {messages.length <= 2 && !loading && (
          <div style={{
            padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {QUICK_ACTIONS.map(qa => (
              <button key={qa.label} onClick={() => sendMessage(qa.msg)} style={{
                padding: '5px 10px', borderRadius: 8, border: `1px solid ${BORDER}`,
                background: 'rgba(245,200,66,0.06)', color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,200,66,0.15)'; e.currentTarget.style.color = Y; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,200,66,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >{qa.label}</button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding: '10px 14px 14px', display: 'flex', gap: 8, alignItems: 'center',
          borderTop: `1px solid rgba(255,255,255,0.06)`,
          background: BG2,
        }}>
          <button onClick={toggleVoice} title="Voice input" style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
            background: isListening ? 'rgba(255,60,60,0.2)' : 'rgba(255,255,255,0.06)',
            color: isListening ? '#ff4444' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            animation: isListening ? 'cbPulse 1.5s ease infinite' : 'none',
          }}>🎤</button>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={waitingForCity ? 'Enter city name...' : 'Ask me anything...'}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.04)',
              color: '#fff', fontSize: '0.85rem', outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: "'Inter', sans-serif",
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,200,66,0.3)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />

          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
            background: input.trim() ? `linear-gradient(135deg, ${Y}, #e0b800)` : 'rgba(255,255,255,0.06)',
            color: input.trim() ? '#000' : 'rgba(255,255,255,0.3)',
            cursor: input.trim() ? 'pointer' : 'default', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', fontWeight: 700,
          }}>➤</button>
        </div>
      </div>

      {/* Floating button */}
      <button
        id="campx-chatbot-btn"
        onClick={() => setIsOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: `linear-gradient(135deg, ${Y}, #e0ad00)`,
          color: '#000', cursor: 'pointer', fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px rgba(245,200,66,0.4), 0 0 40px rgba(245,200,66,0.1)`,
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 6px 30px rgba(245,200,66,0.5)`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 20px rgba(245,200,66,0.4)`; }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Animations & responsive */}
      <style>{`
        @keyframes cbFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cbBounce { 0%, 80%, 100% { transform: scale(0.6); } 40% { transform: scale(1.2); } }
        @keyframes cbPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,60,60,0.4); } 50% { box-shadow: 0 0 0 8px rgba(255,60,60,0); } }
        #campx-chatbot-panel::-webkit-scrollbar { width: 4px; }
        #campx-chatbot-panel *::-webkit-scrollbar { width: 4px; }
        #campx-chatbot-panel *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @media (max-width: 480px) {
          #campx-chatbot-panel { width: calc(100vw - 16px) !important; right: 8px !important; bottom: 80px !important; height: 70vh !important; border-radius: 16px !important; }
          #campx-chatbot-btn { bottom: 16px !important; right: 16px !important; }
        }
      `}</style>
    </>
  );
}
