/**
 * CampX Assist – Frontend API Client
 * All chatbot API calls, typed and isolated.
 */

const BASE = import.meta.env.VITE_API_URL || 'https://camp-x.onrender.com/api';

/** Current logged-in user from localStorage session */
function getAuthHeaders(): Record<string, string> {
  const raw = localStorage.getItem('campx_current_user');
  if (!raw) return {};
  try {
    const u = JSON.parse(raw);
    return {
      'x-user-email': u.email || '',
      'x-user-name':  u.name  || '',
      'x-user-admin': u.isAdmin ? 'true' : 'false',
    };
  } catch {
    return {};
  }
}

export interface ClassificationResult {
  answer:         string | null;
  category:       string;
  urgency:        string;
  confidence:     number;
  isSensitive:    boolean;
  usedFallback:   boolean;
  provider:       string;
  faqFound:       boolean;
  faqSources:     { title: string; department: string }[];
  conversationId: string;
}

export interface TicketResult {
  trackingId:  string;
  ticketId:    string;
  status:      string;
  category:    string;
  priority:    string;
  slaDeadline: string;
  message:     string;
}

export interface TicketStatus {
  id:            string;
  trackingId:    string;
  status:        string;
  category:      string;
  priority:      string;
  description:   string;
  createdAt:     string;
  slaDeadline:   string;
  resolvedAt:    string | null;
  satisfactionRating: number | null;
  source:        string;
  urgencyLevel:  string;
  isConfidential: boolean;
}

export interface ChatMessage {
  role:      'user' | 'assistant' | 'system';
  content:   string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsData {
  totalQueries:         number;
  totalTickets:         number;
  resolvedWithoutTicket: number;
  deflectionRate:       number;
  urgentCount:          number;
  sensitiveCount:       number;
  confidentialCount:    number;
  categoryBreakdown:    { name: string; value: number }[];
  statusBreakdown:      { name: string; value: number }[];
  avgResolutionHours:   number | null;
  avgRating:            string | null;
  recentTickets:        RecentTicket[];
}

export interface RecentTicket {
  id:            string;
  trackingId:    string;
  status:        string;
  category:      string;
  priority:      string;
  urgency:       string;
  isConfidential: boolean;
  createdAt:     string;
  slaDeadline:   string;
  overdue:       boolean;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

/** Send a student message and get AI classification + FAQ answer */
export async function sendChatMessage(
  message: string,
  isConfidential: boolean
): Promise<ClassificationResult> {
  return post<ClassificationResult>('/chatbot/message', { message, isConfidential });
}

/** Load conversation history */
export async function loadChatHistory(): Promise<{ messages: ChatMessage[]; conversationId?: string }> {
  try {
    return await get<{ messages: ChatMessage[]; conversationId?: string }>('/chatbot/history');
  } catch {
    return { messages: [] };
  }
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('campx_current_user') || 'null');
  } catch { return null; }
}

/** Create a complaint ticket from chatbot */
export async function createChatbotTicket(payload: {
  description: string;
  category: string;
  urgency: string;
  confidenceScore: number;
  isConfidential: boolean;
  isAnonymous: boolean;
  conversationTranscript: { role: string; content: string }[];
}): Promise<TicketResult> {
  let result: TicketResult;
  try {
    result = await post<TicketResult>('/chatbot/ticket', payload);
  } catch {
    // Local fallback creation if backend is offline/cold-starting
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'CXA-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    const slaHours = payload.urgency === 'Urgent' ? 6 : payload.urgency === 'Sensitive' ? 12 : 48;
    const deadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    result = {
      trackingId: id,
      ticketId: 'local-' + id,
      status: 'Open',
      category: payload.category,
      priority: payload.urgency === 'Urgent' ? 'urgent' : payload.urgency === 'Sensitive' ? 'high' : 'medium',
      slaDeadline: deadline,
      message: 'Ticket created successfully.',
    };
  }

  // Always cache ticket locally so tracking and complaints list always reflect it
  try {
    const rawChat = localStorage.getItem('campusChatbotTickets');
    const existing = rawChat ? JSON.parse(rawChat) : [];
    const newEntry: TicketStatus = {
      id: result.ticketId,
      trackingId: result.trackingId,
      status: result.status,
      category: result.category,
      priority: result.priority,
      description: payload.description,
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      slaDeadline: result.slaDeadline,
      resolvedAt: null,
      satisfactionRating: null,
      source: 'chatbot',
      urgencyLevel: payload.urgency,
      isConfidential: payload.isConfidential,
    };
    localStorage.setItem('campusChatbotTickets', JSON.stringify([newEntry, ...existing]));

    // Also sync to campusComplaints so it appears on Campus Complaint page
    const compRaw = localStorage.getItem('campusComplaints');
    const existingComp = compRaw ? JSON.parse(compRaw) : [];
    const u = getCurrentUser();
    const newComp = {
      id: result.ticketId,
      name: payload.isAnonymous ? 'Anonymous' : (u?.name || 'Student'),
      category: payload.category.toLowerCase().includes('hostel') ? 'hostel' :
                payload.category.toLowerCase().includes('acad') ? 'academic' :
                payload.category.toLowerCase().includes('clean') ? 'cleanliness' :
                payload.category.toLowerCase().includes('lib') ? 'library' :
                payload.category.toLowerCase().includes('fee') ? 'accounts' : 'infra',
      subType: payload.category,
      description: payload.description,
      priority: result.priority,
      anonymous: payload.isAnonymous,
      trackingId: result.trackingId,
      completed: false,
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      authorEmail: (u?.email || '').toLowerCase().trim() || undefined,
    };
    localStorage.setItem('campusComplaints', JSON.stringify([newComp, ...existingComp]));
  } catch (e) {
    console.warn('Failed to cache ticket in localStorage:', e);
  }

  return result;
}

/** Track a ticket by tracking ID (supports CXA- and CX- formats, backend & localStorage) */
export async function trackTicket(trackingId: string): Promise<TicketStatus> {
  const cleanId = (trackingId || '').trim();
  try {
    return await get<TicketStatus>(`/chatbot/ticket/${cleanId}`);
  } catch (backendErr) {
    // 1. Check campusComplaints in localStorage
    try {
      const stored = localStorage.getItem('campusComplaints');
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((c: Record<string, unknown>) =>
          (c.trackingId && String(c.trackingId).toUpperCase() === cleanId.toUpperCase()) ||
          (c.id && String(c.id).toUpperCase() === cleanId.toUpperCase())
        );
        if (match) {
          return {
            id: String(match.id || match.trackingId),
            trackingId: String(match.trackingId || match.id),
            status: match.completed ? 'Resolved' : String(match.status || 'Open'),
            category: String(match.category || 'General'),
            priority: String(match.priority || 'medium'),
            description: String(match.description || match.subType || match.name || ''),
            createdAt: String(match.createdAt || new Date().toLocaleDateString('en-IN')),
            slaDeadline: String(match.slaDeadline || 'Within 48 hours'),
            resolvedAt: match.completedAt ? new Date(Number(match.completedAt)).toISOString() : (match.resolvedAt ? String(match.resolvedAt) : null),
            satisfactionRating: typeof match.satisfactionRating === 'number' ? match.satisfactionRating : null,
            source: String(match.source || 'Campus Complaint'),
            urgencyLevel: String(match.priority || 'Routine'),
            isConfidential: Boolean(match.isConfidential),
          };
        }
      }
    } catch (e) {
      console.warn('Local complaints lookup error:', e);
    }

    // 2. Check campusChatbotTickets in localStorage
    try {
      const storedChatbot = localStorage.getItem('campusChatbotTickets');
      if (storedChatbot) {
        const list = JSON.parse(storedChatbot);
        const match = list.find((t: Record<string, unknown>) =>
          (t.trackingId && String(t.trackingId).toUpperCase() === cleanId.toUpperCase()) ||
          (t.id && String(t.id).toUpperCase() === cleanId.toUpperCase())
        );
        if (match) return match as TicketStatus;
      }
    } catch (e) {
      console.warn('Local chatbot tickets lookup error:', e);
    }

    throw backendErr;
  }
}

/** Get student's tickets (merging backend + local complaints and chatbot tickets) */
export async function getMyTickets(): Promise<TicketStatus[]> {
  const u = getCurrentUser();
  const email = (u?.email || '').toLowerCase();
  const isAdmin = Boolean(u?.isAdmin);

  let backendTickets: TicketStatus[] = [];
  try {
    backendTickets = await get<TicketStatus[]>('/chatbot/my-tickets');
  } catch (e) {
    console.warn('Backend /chatbot/my-tickets unavailable, falling back to local records:', e);
  }

  // Merge with localStorage records
  const map = new Map<string, TicketStatus>();
  backendTickets.forEach(t => {
    if (t.trackingId) map.set(t.trackingId.toUpperCase(), t);
  });

  // Check campusChatbotTickets
  try {
    const rawChat = localStorage.getItem('campusChatbotTickets');
    if (rawChat) {
      const list = JSON.parse(rawChat);
      list.forEach((t: TicketStatus) => {
        if (t.trackingId && !map.has(t.trackingId.toUpperCase())) {
          map.set(t.trackingId.toUpperCase(), t);
        }
      });
    }
  } catch {}

  // Check campusComplaints
  try {
    const rawComp = localStorage.getItem('campusComplaints');
    if (rawComp) {
      const list = JSON.parse(rawComp);
      list.forEach((c: Record<string, unknown>) => {
        const cEmail = String(c.authorEmail || '').toLowerCase();
        const isMine = isAdmin || !cEmail || cEmail === email;
        const tid = String(c.trackingId || c.id || '');
        if (isMine && tid && !map.has(tid.toUpperCase())) {
          map.set(tid.toUpperCase(), {
            id: String(c.id || tid),
            trackingId: tid,
            status: c.completed ? 'Resolved' : String(c.status || 'Open'),
            category: String(c.category || 'General'),
            priority: String(c.priority || 'medium'),
            description: String(c.description || c.subType || c.name || ''),
            createdAt: String(c.createdAt || ''),
            slaDeadline: String(c.slaDeadline || 'Within 48 hours'),
            resolvedAt: c.completedAt ? new Date(Number(c.completedAt)).toISOString() : (c.resolvedAt ? String(c.resolvedAt) : null),
            satisfactionRating: typeof c.satisfactionRating === 'number' ? c.satisfactionRating : null,
            source: String(c.source || 'Campus Complaint'),
            urgencyLevel: String(c.priority || 'Routine'),
            isConfidential: Boolean(c.isConfidential),
          });
        }
      });
    }
  } catch {}

  return Array.from(map.values());
}

/** Mark FAQ answer helpful/not helpful */
export async function sendFeedback(helpful: boolean, messageContent: string): Promise<void> {
  await post('/chatbot/feedback', { helpful, messageContent }).catch(() => {});
}

/** Submit satisfaction rating */
export async function submitRating(trackingId: string, rating: number): Promise<void> {
  await post('/chatbot/rating', { trackingId, rating }).catch(() => {});
}

/** Fetch admin analytics */
export async function fetchAnalytics(from?: string, to?: string): Promise<AnalyticsData> {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to)   params.append('to',   to);
  const qs = params.toString() ? `?${params}` : '';
  return get<AnalyticsData>(`/chatbot/admin/analytics${qs}`);
}

/** Seed knowledge base (admin) */
export async function seedKnowledgeBase(): Promise<{ seeded: number; message: string }> {
  return post('/chatbot/kb/seed', {});
}

/** Update ticket status (admin) */
export async function updateTicketStatus(trackingId: string, status: string): Promise<{ ok: boolean; status: string }> {
  const res = await fetch(`${BASE}/chatbot/ticket/${trackingId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
