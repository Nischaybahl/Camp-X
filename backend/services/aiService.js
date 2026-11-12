/**
 * CampX Assist – AI Service
 * Gemini (primary) → Groq (fallback) → keyword menu (final fallback)
 */

const https = require('https');

// ─── SLA helpers ─────────────────────────────────────────────────────────────
const SLA = {
  routine:   parseInt(process.env.SLA_ROUTINE_HOURS   || '72',  10),
  urgent:    parseInt(process.env.SLA_URGENT_HOURS    || '24',  10),
  sensitive: parseInt(process.env.SLA_SENSITIVE_HOURS || '4',   10),
};

function getSLADeadline(urgency) {
  const hours = urgency === 'Urgent' ? SLA.urgent
              : urgency === 'Sensitive' ? SLA.sensitive
              : SLA.routine;
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

// ─── Keyword fallback ─────────────────────────────────────────────────────────
const KEYWORD_CATEGORIES = [
  { value: 'Academics',       keywords: ['marks', 'grade', 'result', 'subject', 'assignment', 'project', 'timetable', 'class', 'lecture', 'study', 'attendance', 'leave', 'semester'] },
  { value: 'Examination',     keywords: ['exam', 'test', 'paper', 'hall ticket', 'schedule', 'backlog', 'revaluation', 'practical', 'viva'] },
  { value: 'Accounts & Fees', keywords: ['fee', 'payment', 'scholarship', 'dues', 'receipt', 'challan', 'finance', 'account'] },
  { value: 'Hostel',          keywords: ['hostel', 'room', 'warden', 'mess', 'food', 'accommodation', 'bed', 'curfew'] },
  { value: 'Library',         keywords: ['library', 'book', 'borrow', 'return', 'fine', 'issue', 'reading'] },
  { value: 'IT Support',      keywords: ['wifi', 'internet', 'computer', 'lab', 'login', 'password', 'portal', 'website', 'email', 'software'] },
  { value: 'Administration',  keywords: ['certificate', 'document', 'bonafide', 'noc', 'transfer', 'record', 'admission', 'office'] },
  { value: 'Student Affairs', keywords: ['event', 'club', 'sports', 'cultural', 'activity', 'committee', 'placement', 'internship', 'career'] },
  { value: 'Other',           keywords: [] },
];

const SENSITIVE_KEYWORDS = [
  'harass', 'rag', 'bully', 'threat', 'unsafe', 'assault', 'abuse', 'violence',
  'discriminat', 'mental health', 'suicide', 'depression', 'emergency', 'danger',
  'molest', 'stalk', 'extort', 'blackmail',
];

function keywordClassify(text) {
  const lower = text.toLowerCase();
  const isSensitive = SENSITIVE_KEYWORDS.some(k => lower.includes(k));
  let category = 'Other';
  let maxHits = 0;
  for (const cat of KEYWORD_CATEGORIES) {
    const hits = cat.keywords.filter(k => lower.includes(k)).length;
    if (hits > maxHits) { maxHits = hits; category = cat.value; }
  }
  const urgency = isSensitive ? 'Sensitive' : 'Routine';
  return { category, urgency, isSensitive, confidence: 0.4, answer: null, usedFallback: true };
}

// ─── Generic HTTPS POST helper ─────────────────────────────────────────────────
function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request({ hostname, path, method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(payload);
    req.end();
  });
}

// ─── Build AI prompt ──────────────────────────────────────────────────────────
function buildPrompt(text, faqContext) {
  const faqSection = faqContext
    ? `\n\nRelevant college information:\n${faqContext}\n\nUse the above to generate a helpful, accurate answer. Do not invent policies.`
    : '';

  return `You are CampX Assist, an AI student-support chatbot for a college.
Analyze the following student message and respond ONLY with a valid JSON object (no markdown, no explanation).

Required JSON fields:
- category: one of "Academics", "Examination", "Accounts & Fees", "Hostel", "Library", "IT Support", "Administration", "Student Affairs", "Other"
- urgency: one of "Routine", "Sensitive", "Urgent"  (use Sensitive/Urgent for harassment, ragging, bullying, threats, safety, medical emergencies)
- confidence: float 0-1 (how confident you are)
- isSensitive: boolean
- answer: string or null  (provide a helpful answer if you can; null if you cannot answer confidently)${faqSection}

Student message: "${text.replace(/"/g, '\\"')}"`;
}

// ─── Gemini call ──────────────────────────────────────────────────────────────
async function callGemini(text, faqContext) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const prompt = buildPrompt(text, faqContext);
  const result = await httpsPost(
    'generativelanguage.googleapis.com',
    `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {},
    { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 512 } }
  );

  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonStr = raw.replace(/```json?/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);
  validateClassification(parsed);
  return parsed;
}

// ─── Groq call ────────────────────────────────────────────────────────────────
async function callGroq(text, faqContext) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');

  const prompt = buildPrompt(text, faqContext);
  const result = await httpsPost(
    'api.groq.com',
    '/openai/v1/chat/completions',
    { 'Authorization': `Bearer ${key}` },
    {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 512,
    }
  );

  const raw = result?.choices?.[0]?.message?.content || '';
  const jsonStr = raw.replace(/```json?/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);
  validateClassification(parsed);
  return parsed;
}

// ─── Validation ───────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ['Academics', 'Examination', 'Accounts & Fees', 'Hostel', 'Library', 'IT Support', 'Administration', 'Student Affairs', 'Other'];
const VALID_URGENCIES  = ['Routine', 'Sensitive', 'Urgent'];

function validateClassification(obj) {
  if (!VALID_CATEGORIES.includes(obj.category)) obj.category = 'Other';
  if (!VALID_URGENCIES.includes(obj.urgency))   obj.urgency  = 'Routine';
  if (typeof obj.confidence !== 'number')        obj.confidence = 0.5;
  obj.confidence = Math.min(1, Math.max(0, obj.confidence));
  if (typeof obj.isSensitive !== 'boolean')      obj.isSensitive = obj.urgency !== 'Routine';
  if (typeof obj.answer !== 'string')            obj.answer = null;
}

// ─── Main classify function ───────────────────────────────────────────────────
/**
 * @param {string} text - student message
 * @param {string|null} faqContext - retrieved FAQ snippets (may be null)
 * @returns {{ category, urgency, confidence, isSensitive, answer, usedFallback, provider }}
 */
async function classifyMessage(text, faqContext = null) {
  // Always flag sensitive keywords regardless of AI
  const forceSensitive = SENSITIVE_KEYWORDS.some(k => text.toLowerCase().includes(k));

  // 1. Try Gemini
  try {
    const result = await callGemini(text, faqContext);
    if (forceSensitive) { result.isSensitive = true; result.urgency = 'Urgent'; }
    result.provider = 'gemini';
    result.usedFallback = false;
    result.slaDeadline = getSLADeadline(result.urgency);
    return result;
  } catch (e1) {
    console.warn('[AI] Gemini failed:', e1.message);
  }

  // 2. Try Groq
  try {
    const result = await callGroq(text, faqContext);
    if (forceSensitive) { result.isSensitive = true; result.urgency = 'Urgent'; }
    result.provider = 'groq';
    result.usedFallback = false;
    result.slaDeadline = getSLADeadline(result.urgency);
    return result;
  } catch (e2) {
    console.warn('[AI] Groq failed:', e2.message);
  }

  // 3. Keyword fallback
  const result = keywordClassify(text);
  if (forceSensitive) { result.isSensitive = true; result.urgency = 'Urgent'; }
  result.provider = 'keyword';
  result.slaDeadline = getSLADeadline(result.urgency);
  return result;
}

module.exports = { classifyMessage, getSLADeadline, SENSITIVE_KEYWORDS };
