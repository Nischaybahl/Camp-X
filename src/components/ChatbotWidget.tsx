import { useState, useRef, useEffect, useCallback } from 'react';
import {
  sendChatMessage, loadChatHistory, createChatbotTicket,
  trackTicket, getMyTickets, sendFeedback, submitRating,
  type ClassificationResult, type TicketResult, type TicketStatus,
} from '../utils/chatbotApi';

/* ─── Types ──────────────────────────────────────────────────────────── */
type Role = 'user' | 'assistant' | 'system';
type MsgType = 'text' | 'faq' | 'ticket' | 'ticket-confirm' | 'track' | 'rating' | 'keyword-select';

interface Message {
  id:        string;
  role:      Role;
  content:   string;
  type:      MsgType;
  meta?:     Record<string, unknown>;
  timestamp: Date;
}

/* ─── Design tokens (matches CampX dark theme) ───────────────────────── */
const ACCENT  = '#ccff00';
const BG      = '#111111';
const BG2     = '#1a1a1a';
const BG3     = '#222222';
const BORDER  = 'rgba(204,255,0,0.12)';
const MUTED   = 'rgba(255,255,255,0.4)';
const URGENT  = '#ff6b6b';
const SUCCESS = '#51cf66';

/* ─── Quick suggestions ──────────────────────────────────────────────── */
const QUICK_SUGGESTIONS = [
  { label: '📋 Apply for leave',           msg: 'How do I apply for leave?' },
  { label: '📋 Examination notices',       msg: 'Where can I find examination notices?' },
  { label: '🎫 Submit a complaint',        msg: 'How do I submit a complaint?' },
  { label: '💰 Fee-related issues',        msg: 'Who should I contact for fee-related issues?' },
  { label: '📚 Academic resources',        msg: 'How can I access academic resources?' },
  { label: '🔍 Track my complaint',        msg: 'Track my complaint' },
];

/* ─── Keyword categories for AI fallback ────────────────────────────── */
const KEYWORD_CATEGORIES = [
  'Academics', 'Examination', 'Accounts & Fees',
  'Hostel', 'Library', 'IT Support', 'Administration', 'Student Affairs', 'Other',
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
function uid() { return Math.random().toString(36).slice(2, 10); }

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('campx_current_user') || 'null');
  } catch { return null; }
}

/* ─── Markdown renderer (bold, links, code, bullets) ────────────────── */
function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    let html = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g,     '<code style="background:rgba(204,255,0,0.1);padding:1px 5px;border-radius:4px;font-size:0.82em">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:${ACCENT};font-weight:600;text-decoration:none;" target="_blank">$1</a>`);

    // bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      html = `<span style="display:inline-block;margin-right:6px;color:${ACCENT}">•</span>${html.slice(2)}`;
    }
    return (
      <p key={i} style={{ margin: line ? '0.2em 0' : '0.5em 0' }}
        dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
    );
  });
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function ChatbotWidget() {
  const user = getCurrentUser();
  const isLoggedIn = !!user;

  const [isOpen,        setIsOpen]        = useState(false);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [isConfidential,setIsConfidential]= useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [trackInput,    setTrackInput]    = useState('');
  const [showTrackForm, setShowTrackForm] = useState(false);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  /* ── Auto-scroll ─────────────────────────────────────────────── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  /* ── Focus input on open ─────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  /* ── Load history when first opened ─────────────────────────── */
  useEffect(() => {
    if (!isOpen || historyLoaded) return;
    setHistoryLoaded(true);

    const welcome: Message = {
      id: uid(), role: 'assistant', type: 'text',
      content: `Hey! 👋 I'm **CampX Assist**, your intelligent college guide. How can I help you today?`,
      timestamp: new Date(),
    };

    if (!isLoggedIn) {
      setMessages([welcome]);
      return;
    }

    loadChatHistory().then(({ messages: hist }) => {
      if (hist.length === 0) {
        setMessages([welcome]);
        return;
      }
      const restored: Message[] = hist
        .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content))
        .map(m => ({
          id:        uid(),
          role:      m.role as Role,
          type:      (m.metadata?.type as MsgType) || 'text',
          content:   m.content,
          meta:      m.metadata as Record<string, unknown>,
          timestamp: new Date(m.timestamp),
        }));
      setMessages([welcome, ...restored]);
    });
  }, [isOpen, historyLoaded, isLoggedIn]);

  /* ── Add message helper ──────────────────────────────────────── */
  const addMsg = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => {
      const next = [...prev, { ...msg, id: uid(), timestamp: new Date() }];
      return next.length > 60 ? next.slice(-60) : next;
    });
  }, []);

  /* ── Handle AI classification result ────────────────────────── */
  async function handleClassificationResult(
    result: ClassificationResult,
    originalMessage: string,
    confidential: boolean,
  ) {
    const transcript = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    // ── Urgent / sensitive: skip FAQ, go straight to ticket ──
    if (result.isSensitive || result.urgency === 'Urgent') {
      addMsg({
        role: 'assistant', type: 'text',
        content: `⚠️ I've detected this may be an **urgent or sensitive concern** (${result.category}).\n\nThis will be immediately escalated to the **Grievance Cell** as a high-priority ticket with a **4-hour SLA**. Your privacy is protected.`,
      });

      await autoCreateTicket({
        description: originalMessage,
        category: result.category,
        urgency: result.urgency,
        confidence: result.confidence,
        confidential,
        anonymous: !isLoggedIn,
        transcript,
      });
      return;
    }

    // ── FAQ answer available ──
    if (result.faqFound && result.answer && result.confidence >= 0.65) {
      addMsg({
        role: 'assistant', type: 'faq',
        content: result.answer,
        meta: {
          category: result.category,
          confidence: result.confidence,
          sources: result.faqSources,
          originalMessage,
          category_val: result.category,
          urgency: result.urgency,
          confidence_val: result.confidence,
          transcript,
          confidential,
        },
      });
      return;
    }

    // ── Conversational / Direct Answer (Greeting, general explanation, etc.) ──
    if (result.answer) {
      addMsg({
        role: 'assistant', type: 'text',
        content: result.answer,
      });
      return;
    }

    // ── No FAQ & No direct answer: Offer specific department ticket or category selection ──
    if (result.category && result.category !== 'Other') {
      addMsg({
        role: 'assistant', type: 'text',
        content: `I couldn't find a definitive FAQ entry for your question regarding **${result.category}**.\n\nWould you like me to create a support ticket so the **${result.category}** department can assist you directly?`,
      });
      addMsg({
        role: 'assistant', type: 'ticket',
        content: '',
        meta: {
          description: originalMessage,
          category: result.category,
          urgency: result.urgency,
          confidence: result.confidence,
          transcript,
          confidential,
        },
      });
      return;
    }

    // ── Low confidence or unknown category: show category selection menu ──
    addMsg({
      role: 'assistant', type: 'keyword-select',
      content: `I couldn't find an answer in our knowledge base for that query. Please select the relevant department below so I can route your ticket properly:`,
      meta: { originalMessage, confidential, transcript },
    });
  }

  /* ── Auto-create ticket ──────────────────────────────────────── */
  async function autoCreateTicket(opts: {
    description: string; category: string; urgency: string;
    confidence: number; confidential: boolean; anonymous: boolean;
    transcript: { role: string; content: string }[];
  }) {
    try {
      const result = await createChatbotTicket({
        description: opts.description,
        category: opts.category,
        urgency: opts.urgency,
        confidenceScore: opts.confidence,
        isConfidential: opts.confidential,
        isAnonymous: opts.anonymous,
        conversationTranscript: opts.transcript,
      });
      addMsg({ role: 'assistant', type: 'ticket-confirm', content: '', meta: { ticket: result } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addMsg({ role: 'assistant', type: 'text', content: `❌ Failed to create ticket: ${msg}. Please try again or visit the [Campus Complaints](/campus-complaint) page directly.` });
    }
  }

  /* ── Send message ────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowTrackForm(false);

    addMsg({ role: 'user', type: 'text', content: msg });
    setLoading(true);

    // "Track complaint" shortcut
    const lower = msg.toLowerCase();
    if (lower.includes('track') && (lower.includes('complaint') || lower.includes('ticket'))) {
      setLoading(false);
      setShowTrackForm(true);
      addMsg({ role: 'assistant', type: 'text', content: 'Please enter your **Ticket ID** (format: CXA-XXXXXXXX) to track your complaint:' });
      return;
    }

    try {
      const result = await sendChatMessage(msg, isConfidential);
      await handleClassificationResult(result, msg, isConfidential);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '';
      // Backend may be cold-starting on Render (free tier sleeps)
      const isNetworkError = errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('ECONNREFUSED');
      addMsg({
        role: 'assistant', type: 'text',
        content: isNetworkError
          ? '⏳ The server is waking up (Render free tier cold start). Please wait **10–15 seconds** and try again.'
          : `❌ Failed to process message. Please try again.\n\n_If this keeps happening, the AI backend may still be deploying._`,
      });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, isLoggedIn, isConfidential, messages]);

  /* ── Track a ticket ──────────────────────────────────────────── */
  async function handleTrack() {
    const tid = trackInput.trim().toUpperCase();
    if (!tid) return;
    setTrackInput('');
    setShowTrackForm(false);
    addMsg({ role: 'user', type: 'text', content: `Track ticket: ${tid}` });
    setLoading(true);
    try {
      const ticket = await trackTicket(tid);
      addMsg({ role: 'assistant', type: 'track', content: '', meta: { ticket } });
    } catch {
      addMsg({ role: 'assistant', type: 'text', content: `❌ Ticket **${tid}** not found. Please check the ID and try again.` });
    } finally {
      setLoading(false);
    }
  }

  /* ── My tickets ──────────────────────────────────────────────── */
  async function handleMyTickets() {
    addMsg({ role: 'user', type: 'text', content: 'Show my complaints' });
    setLoading(true);
    try {
      const tickets = await getMyTickets();
      if (tickets.length === 0) {
        addMsg({ role: 'assistant', type: 'text', content: "You don't have any chatbot-submitted complaints yet." });
      } else {
        addMsg({ role: 'assistant', type: 'text', content: `You have **${tickets.length}** complaint(s) on record:` });
        tickets.slice(0, 5).forEach(t => {
          const statusColor = t.status === 'Resolved' ? SUCCESS : t.status === 'Open' ? '#4dabf7' : '#ffd43b';
          addMsg({
            role: 'assistant', type: 'text',
            content: `**${t.trackingId}** — ${t.category}\nStatus: <span style="color:${statusColor}">${t.status}</span>`,
          });
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '';
      const isNetworkError = errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError');
      addMsg({
        role: 'assistant', type: 'text',
        content: isNetworkError
          ? '⏳ The server is still waking up. Please wait a moment and try again.'
          : '❌ Failed to load your tickets. Please try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  }

  /* ── Rating submit ───────────────────────────────────────────── */
  async function handleRating(trackingId: string, rating: number, msgId: string) {
    await submitRating(trackingId, rating);
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, meta: { ...m.meta, ratingSubmitted: true, givenRating: rating } } : m
    ));
  }

  /* ── Key handler ─────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER HELPERS
     ══════════════════════════════════════════════════════════════ */

  function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
      'Open':        '#4dabf7',
      'In Progress': '#ffd43b',
      'Resolved':    SUCCESS,
      'Closed':      '#888',
    };
    return (
      <span style={{ color: colors[status] || '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
        {status}
      </span>
    );
  }

  function PriorityBadge({ priority }: { priority: string }) {
    const colors: Record<string, string> = {
      low: SUCCESS, medium: '#ffd43b', high: '#ff922b', urgent: URGENT,
    };
    return (
      <span style={{
        background: colors[priority] ? colors[priority] + '22' : '#ffffff11',
        color: colors[priority] || '#fff',
        padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
      }}>
        {priority}
      </span>
    );
  }

  function renderMessage(m: Message) {
    const isUser = m.role === 'user';

    // ── User bubble ──
    if (isUser) {
      return (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end', animation: 'cbFadeIn 0.3s ease' }}>
          <div style={{
            maxWidth: '78%', padding: '10px 14px', borderRadius: '14px 14px 4px 14px',
            background: `linear-gradient(135deg, ${ACCENT}, #aad900)`, color: '#000',
            fontSize: '0.84rem', lineHeight: 1.55, wordBreak: 'break-word', fontWeight: 500,
          }}>
            {m.content}
          </div>
        </div>
      );
    }

    const bubbleBase: React.CSSProperties = {
      maxWidth: '90%', padding: '12px 14px', borderRadius: '4px 14px 14px 14px',
      background: BG2, color: '#e0e0e0', border: `1px solid rgba(255,255,255,0.06)`,
      fontSize: '0.84rem', lineHeight: 1.6, wordBreak: 'break-word',
    };

    // ── FAQ answer with Helpful/Not Helpful ──
    if (m.type === 'faq' && m.meta) {
      const { sources, originalMessage, category_val, urgency, confidence_val, transcript, confidential } = m.meta as Record<string, unknown>;
      const feedbackDone = !!m.meta.feedbackDone;
      return (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start', animation: 'cbFadeIn 0.3s ease' }}>
          <div style={{ ...bubbleBase, maxWidth: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ background: `${ACCENT}22`, color: ACCENT, borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                📚 {String(category_val || 'FAQ')}
              </span>
              {(sources as { title: string }[])?.length > 0 && (
                <span style={{ color: MUTED, fontSize: '0.68rem' }}>
                  from college knowledge base
                </span>
              )}
            </div>
            {renderMarkdown(m.content)}

            {!feedbackDone && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: MUTED, fontSize: '0.72rem' }}>Was this helpful?</span>
                <button
                  onClick={async () => {
                    await sendFeedback(true, m.content);
                    setMessages(prev => prev.map(x => x.id === m.id ? { ...x, meta: { ...x.meta, feedbackDone: true, feedbackValue: true } } : x));
                    addMsg({ role: 'assistant', type: 'text', content: '✅ Glad that helped! Is there anything else I can assist you with?' });
                  }}
                  style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${SUCCESS}44`, background: `${SUCCESS}11`, color: SUCCESS, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  👍 Helpful
                </button>
                <button
                  onClick={async () => {
                    await sendFeedback(false, m.content);
                    setMessages(prev => prev.map(x => x.id === m.id ? { ...x, meta: { ...x.meta, feedbackDone: true, feedbackValue: false } } : x));
                    // Auto-create ticket
                    addMsg({ role: 'assistant', type: 'text', content: "I'm sorry the answer wasn't helpful. Let me create a support ticket for you so the department can assist you directly." });
                    setLoading(true);
                    await autoCreateTicket({
                      description: String(originalMessage || m.content),
                      category: String(category_val || 'Other'),
                      urgency: String(urgency || 'Routine'),
                      confidence: Number(confidence_val || 0.5),
                      confidential: !!confidential,
                      anonymous: false,
                      transcript: (transcript as { role: string; content: string }[]) || [],
                    });
                    setLoading(false);
                  }}
                  style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${URGENT}44`, background: `${URGENT}11`, color: URGENT, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  👎 Not Helpful
                </button>
              </div>
            )}
            {feedbackDone && m.meta.feedbackValue === true && (
              <div style={{ marginTop: 10, color: SUCCESS, fontSize: '0.75rem' }}>✅ Marked as helpful</div>
            )}
            {feedbackDone && m.meta.feedbackValue === false && (
              <div style={{ marginTop: 10, color: MUTED, fontSize: '0.75rem' }}>Creating ticket…</div>
            )}
          </div>
        </div>
      );
    }

    // ── Ticket creation prompt (yes/no) ──
    if (m.type === 'ticket' && m.meta) {
      const { description, category, urgency, confidence, transcript, confidential } = m.meta as Record<string, unknown>;
      const done = !!m.meta.done;
      if (done) return null;
      return (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start', animation: 'cbFadeIn 0.3s ease' }}>
          <div style={{ ...bubbleBase, maxWidth: '92%' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button
                onClick={async () => {
                  setMessages(prev => prev.map(x => x.id === m.id ? { ...x, meta: { ...x.meta, done: true } } : x));
                  setLoading(true);
                  await autoCreateTicket({
                    description: String(description || ''),
                    category: String(category || 'Other'),
                    urgency: String(urgency || 'Routine'),
                    confidence: Number(confidence || 0.5),
                    confidential: !!confidential,
                    anonymous: false,
                    transcript: (transcript as { role: string; content: string }[]) || [],
                  });
                  setLoading(false);
                }}
                style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${ACCENT}44`, background: `${ACCENT}22`, color: ACCENT, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
              >
                ✅ Yes, create ticket
              </button>
              <button
                onClick={async () => {
                  setMessages(prev => prev.map(x => x.id === m.id ? { ...x, meta: { ...x.meta, done: true } } : x));
                  await autoCreateTicket({
                    description: String(description || ''),
                    category: String(category || 'Other'),
                    urgency: String(urgency || 'Routine'),
                    confidence: Number(confidence || 0.5),
                    confidential: !!confidential,
                    anonymous: true,
                    transcript: (transcript as { role: string; content: string }[]) || [],
                  });
                }}
                style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.15)`, background: 'rgba(255,255,255,0.05)', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                👤 Submit anonymously
              </button>
              <button
                onClick={() => {
                  setMessages(prev => prev.map(x => x.id === m.id ? { ...x, meta: { ...x.meta, done: true } } : x));
                  addMsg({ role: 'assistant', type: 'text', content: "No problem! Is there anything else I can help you with?" });
                }}
                style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.1)`, background: 'transparent', color: MUTED, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ✕ No thanks
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── Ticket confirmation ──
    if (m.type === 'ticket-confirm' && m.meta?.ticket) {
      const ticket = m.meta.ticket as TicketResult;
      const ratingDone = !!m.meta.ratingDone;
      const isOverdue = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date();

      return (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start', animation: 'cbFadeIn 0.3s ease' }}>
          <div style={{ ...bubbleBase, maxWidth: '95%', padding: 0, overflow: 'hidden' }}>
            {/* Green header */}
            <div style={{ background: `linear-gradient(135deg, ${SUCCESS}22, ${SUCCESS}11)`, borderBottom: `1px solid ${SUCCESS}33`, padding: '12px 14px' }}>
              <div style={{ color: SUCCESS, fontWeight: 700, fontSize: '0.9rem' }}>✅ Complaint Submitted!</div>
              <div style={{ color: MUTED, fontSize: '0.72rem', marginTop: 2 }}>Your complaint has been successfully submitted.</div>
            </div>
            {/* Details */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED }}>Ticket ID</span>
                  <span style={{ color: ACCENT, fontWeight: 700, fontFamily: 'monospace' }}>{ticket.trackingId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED }}>Department</span>
                  <span style={{ color: '#fff' }}>{ticket.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED }}>Priority</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED }}>Status</span>
                  <StatusBadge status={ticket.status} />
                </div>
                {ticket.slaDeadline && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: MUTED }}>SLA Deadline</span>
                    <span style={{ color: isOverdue ? URGENT : '#ffd43b', fontSize: '0.75rem' }}>
                      {new Date(ticket.slaDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setTrackInput(ticket.trackingId);
                    setShowTrackForm(false);
                    handleTrackById(ticket.trackingId);
                  }}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 20, border: `1px solid ${ACCENT}44`, background: `${ACCENT}11`, color: ACCENT, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  🔍 Track My Complaint
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ticket.trackingId).catch(() => {});
                    addMsg({ role: 'assistant', type: 'text', content: `📋 Ticket ID **${ticket.trackingId}** copied!` });
                  }}
                  style={{ padding: '7px 10px', borderRadius: 20, border: `1px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: '#ccc', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  📋 Copy ID
                </button>
              </div>

              {/* Rating */}
              {!ratingDone && (
                <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                  <div style={{ color: MUTED, fontSize: '0.72rem', marginBottom: 6 }}>Rate your experience:</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r}
                        onClick={() => {
                          handleRating(ticket.trackingId, r, m.id);
                          setMessages(prev => prev.map(x => x.id === m.id ? { ...x, meta: { ...x.meta, ratingDone: true } } : x));
                        }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#ffd43b', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {r <= 3 ? '⭐' : r === 4 ? '🌟' : '💫'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {ratingDone && (
                <div style={{ marginTop: 10, color: SUCCESS, fontSize: '0.75rem' }}>⭐ Thank you for your feedback!</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── Ticket track result ──
    if (m.type === 'track' && m.meta?.ticket) {
      const ticket = m.meta.ticket as TicketStatus;
      const isOverdue = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date() && !ticket.resolvedAt;
      return (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start', animation: 'cbFadeIn 0.3s ease' }}>
          <div style={{ ...bubbleBase, maxWidth: '95%', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(77,171,247,0.1)', borderBottom: '1px solid rgba(77,171,247,0.2)', padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, color: '#4dabf7', fontSize: '0.9rem' }}>🔍 Ticket Status</div>
              <div style={{ color: MUTED, fontSize: '0.72rem', marginTop: 2 }}>Tracking ID: <span style={{ color: ACCENT, fontFamily: 'monospace' }}>{ticket.trackingId}</span></div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: MUTED }}>Category</span><span>{ticket.category}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: MUTED }}>Priority</span><PriorityBadge priority={ticket.priority} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: MUTED }}>Status</span><StatusBadge status={ticket.status} /></div>
              {ticket.slaDeadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: MUTED }}>SLA Deadline</span>
                  <span style={{ color: isOverdue ? URGENT : '#ffd43b', fontSize: '0.75rem' }}>
                    {new Date(ticket.slaDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {isOverdue && ' ⚠️ Overdue'}
                  </span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: MUTED }}>Resolved</span><span style={{ color: SUCCESS }}>{new Date(ticket.resolvedAt).toLocaleDateString('en-IN')}</span></div>
              )}
              <div style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.78rem', color: '#ccc' }}>
                {ticket.description}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Keyword category selector (AI fallback) ──
    if (m.type === 'keyword-select' && m.meta) {
      const done = !!m.meta.done;
      const { originalMessage, confidential, transcript } = m.meta as Record<string, unknown>;
      return (
        <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start', animation: 'cbFadeIn 0.3s ease' }}>
          <div style={{ ...bubbleBase, maxWidth: '95%' }}>
            <p style={{ marginBottom: 10 }}>{m.content}</p>
            {!done && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {KEYWORD_CATEGORIES.map(cat => (
                  <button key={cat}
                    onClick={() => {
                      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, meta: { ...x.meta, done: true } } : x));
                      addMsg({ role: 'assistant', type: 'text', content: `Got it — categorized as **${cat}**.\n\nShall I create a support ticket for the **${cat}** department?` });
                      addMsg({
                        role: 'assistant', type: 'ticket', content: '',
                        meta: { description: originalMessage, category: cat, urgency: 'Routine', confidence: 0.4, transcript, confidential },
                      });
                    }}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${BORDER}`, background: `${ACCENT}0D`, color: ACCENT, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {done && <div style={{ color: MUTED, fontSize: '0.75rem', marginTop: 4 }}>Category selected ✓</div>}
          </div>
        </div>
      );
    }

    // ── Default text bubble ──
    return (
      <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start', animation: 'cbFadeIn 0.3s ease' }}>
        <div style={bubbleBase}>
          {renderMarkdown(m.content)}
        </div>
      </div>
    );
  }

  async function handleTrackById(id: string) {
    addMsg({ role: 'user', type: 'text', content: `Track ticket: ${id}` });
    setLoading(true);
    try {
      const ticket = await trackTicket(id);
      addMsg({ role: 'assistant', type: 'track', content: '', meta: { ticket } });
    } catch {
      addMsg({ role: 'assistant', type: 'text', content: `❌ Ticket **${id}** not found.` });
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  const showQuickSuggestions = messages.length <= 1 && !loading;
  const hasUnread = !isOpen && messages.some(m => m.role === 'assistant' && m.type === 'ticket-confirm');

  return (
    <>
      {/* ── Chat panel ── */}
      <div
        id="campx-assist-panel"
        style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 99999,
          width: 440, maxHeight: 660,
          background: BG, border: `1px solid ${BORDER}`,
          borderRadius: 20, boxShadow: `0 16px 60px rgba(0,0,0,0.7), 0 0 40px rgba(204,255,0,0.06)`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
          background: `linear-gradient(135deg, ${BG2}, ${BG3})`,
          borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `linear-gradient(135deg, ${ACCENT}, #aad900)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: `0 2px 12px rgba(204,255,0,0.3)`, flexShrink: 0,
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', letterSpacing: '-0.3px' }}>
              CampX Assist
            </div>
            <div style={{ fontSize: '0.68rem', color: MUTED }}>
              {isLoggedIn ? `Hi, ${user?.name?.split(' ')[0] || 'Student'}! Always here to help.` : 'Sign in to get started'}
            </div>
          </div>

          {/* Confidential toggle */}
          <div
            onClick={() => setIsConfidential(v => !v)}
            title={isConfidential ? 'Confidential mode ON' : 'Enable confidential mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 20,
              background: isConfidential ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isConfidential ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 13 }}>{isConfidential ? '🔒' : '🔓'}</span>
            <span style={{ fontSize: '0.65rem', color: isConfidential ? URGENT : MUTED, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {isConfidential ? 'Confidential' : 'Private'}
            </span>
          </div>

          <button onClick={() => setIsOpen(false)} style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.06)', color: MUTED,
            cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s', flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >✕</button>
        </div>

        {/* Confidential banner */}
        {isConfidential && (
          <div style={{
            padding: '6px 16px', background: 'rgba(255,107,107,0.08)',
            borderBottom: '1px solid rgba(255,107,107,0.2)',
            fontSize: '0.72rem', color: URGENT, flexShrink: 0,
          }}>
            🔒 <strong>Confidential mode active.</strong> Your identity is restricted to authorized grievance staff only.
          </div>
        )}

        {/* ── Messages ── */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
          display: 'flex', flexDirection: 'column', gap: 10,
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}>
          {messages.map(renderMessage)}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: BG2, border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '4px 14px 14px 14px', padding: '12px 18px',
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(d => (
                  <div key={d} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: ACCENT, opacity: 0.7,
                    animation: `cbBounce 1.2s ease-in-out ${d * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Track form inline */}
          {showTrackForm && (
            <div style={{ display: 'flex', gap: 6, padding: '4px 0', animation: 'cbFadeIn 0.3s ease' }}>
              <input
                value={trackInput}
                onChange={e => setTrackInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleTrack(); }}
                placeholder="CXA-XXXXXXXX"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 10,
                  border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)',
                  color: '#fff', fontSize: '0.82rem', outline: 'none', fontFamily: 'monospace',
                }}
                onFocus={e => e.currentTarget.style.borderColor = `${ACCENT}66`}
                onBlur={e => e.currentTarget.style.borderColor = BORDER}
                autoFocus
              />
              <button onClick={handleTrack} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, #aad900)`, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                Track
              </button>
            </div>
          )}
        </div>

        {/* ── Quick suggestions ── */}
        {showQuickSuggestions && (
          <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 5, flexShrink: 0 }}>
            {QUICK_SUGGESTIONS.map(s => (
              <button key={s.label} onClick={() => sendMessage(s.msg)} style={{
                padding: '5px 10px', borderRadius: 8, border: `1px solid ${BORDER}`,
                background: `${ACCENT}0D`, color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}22`; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}0D`; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Action bar (My Tickets, Track) ── */}
        {messages.length > 1 && !showTrackForm && (
          <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={handleMyTickets} style={{
              flex: 1, padding: '5px 8px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.08)`,
              background: 'rgba(255,255,255,0.03)', color: MUTED, cursor: 'pointer', fontSize: '0.7rem',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}44`; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = MUTED; }}
            >
              📋 My Tickets
            </button>
            <button onClick={() => setShowTrackForm(v => !v)} style={{
              flex: 1, padding: '5px 8px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.08)`,
              background: 'rgba(255,255,255,0.03)', color: MUTED, cursor: 'pointer', fontSize: '0.7rem',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}44`; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = MUTED; }}
            >
              🔍 Track Ticket
            </button>
          </div>
        )}

        {/* ── Input area ── */}
        <div style={{
          padding: '10px 14px 14px', display: 'flex', gap: 8, alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)', background: BG2, flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about college…"
            disabled={loading}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.04)',
              color: '#fff', fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = `${ACCENT}44`}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
              background: input.trim() ? `linear-gradient(135deg, ${ACCENT}, #aad900)` : 'rgba(255,255,255,0.06)',
              color: input.trim() ? '#000' : 'rgba(255,255,255,0.3)',
              cursor: input.trim() ? 'pointer' : 'default',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', fontWeight: 700,
            }}
          >➤</button>
        </div>

        {/* Footer */}
        <div style={{ padding: '4px 14px 8px', textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
            CampX Assist · {formatTime(new Date())} · Powered by Gemini AI
          </span>
        </div>
      </div>

      {/* ── Floating button ── */}
      <button
        id="campx-assist-btn"
        onClick={() => setIsOpen(v => !v)}
        title="CampX Assist"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: `linear-gradient(135deg, ${ACCENT}, #aad900)`,
          color: '#000', cursor: 'pointer', fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 20px rgba(204,255,0,0.4), 0 0 40px rgba(204,255,0,0.1)`,
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 6px 30px rgba(204,255,0,0.5)`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 20px rgba(204,255,0,0.4), 0 0 40px rgba(204,255,0,0.1)`; }}
      >
        {isOpen ? '✕' : hasUnread ? '🔔' : '💬'}
      </button>

      {/* ── Animations ── */}
      <style>{`
        @keyframes cbFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cbBounce { 0%, 80%, 100% { transform: scale(0.6); } 40% { transform: scale(1.2); } }
        #campx-assist-panel *::-webkit-scrollbar { width: 4px; }
        #campx-assist-panel *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @media (max-width: 520px) {
          #campx-assist-panel { width: calc(100vw - 16px) !important; right: 8px !important; bottom: 82px !important; max-height: 80vh !important; border-radius: 16px !important; }
          #campx-assist-btn { bottom: 16px !important; right: 16px !important; }
        }
      `}</style>
    </>
  );
}
