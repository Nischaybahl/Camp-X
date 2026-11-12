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
  return post<TicketResult>('/chatbot/ticket', payload);
}

/** Track a ticket by tracking ID */
export async function trackTicket(trackingId: string): Promise<TicketStatus> {
  return get<TicketStatus>(`/chatbot/ticket/${trackingId}`);
}

/** Get student's own chatbot tickets */
export async function getMyTickets(): Promise<TicketStatus[]> {
  return get<TicketStatus[]>('/chatbot/my-tickets');
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
