/**
 * CampX Assist – AI Service (LLMEngine)
 * Implements: Google Gemini (Primary) → Groq (Fallback) → Local Intent & Semantic Classifier (Resilient Fallback)
 * Adheres to CampX Assist Software Design Specification (SDS)
 */

const https = require('https');

// ─── SLA Configurations ──────────────────────────────────────────────────────
const SLA = {
  routine:   parseInt(process.env.SLA_ROUTINE_HOURS   || '72', 10),
  urgent:    parseInt(process.env.SLA_URGENT_HOURS    || '24', 10),
  sensitive: parseInt(process.env.SLA_SENSITIVE_HOURS || '4',  10),
};

function getSLADeadline(urgency) {
  const hours = urgency === 'Urgent' ? SLA.urgent
              : urgency === 'Sensitive' ? SLA.sensitive
              : SLA.routine;
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

// ─── Categories & Keywords ───────────────────────────────────────────────────
const VALID_CATEGORIES = [
  'Academics',
  'Examination',
  'Accounts & Fees',
  'Hostel',
  'Library',
  'IT Support',
  'Administration',
  'Student Affairs',
  'Other',
];

const VALID_URGENCIES = ['Routine', 'Sensitive', 'Urgent'];

const KEYWORD_CATEGORIES = [
  {
    value: 'Academics',
    keywords: ['attendance', 'leave', 'detained', 'medical leave', 'marks', 'grade', 'cgpa', 'sgpa', 'subject', 'syllabus', 'assignment', 'project', 'timetable', 'class', 'lecture', 'faculty', 'hod', 'dean', 'semester', 'course', 'credit'],
  },
  {
    value: 'Examination',
    keywords: ['exam', 'test', 'mid-sem', 'end-sem', 'hall ticket', 'admit card', 'schedule', 'date sheet', 'timetable', 'backlog', 'fail', 'kt', 'supplementary', 'revaluation', 're-checking', 're-eval', 'copy inspection', 'result', 'grade card', 'marksheet'],
  },
  {
    value: 'Accounts & Fees',
    keywords: ['fee', 'fees', 'tuition', 'payment', 'installment', 'dues', 'receipt', 'challan', 'fine', 'penalty', 'late fee', 'scholarship', 'financial aid', 'refund', 'caution money', 'dd', 'neft', 'accounts'],
  },
  {
    value: 'Hostel',
    keywords: ['hostel', 'room', 'allotment', 'warden', 'mess', 'food', 'curfew', 'outing', 'night pass', 'leave pass', 'accommodation', 'bed', 'hostel fee', 'dining'],
  },
  {
    value: 'Library',
    keywords: ['library', 'book', 'borrow', 'return', 'fine', 'issue', 'renew', 'reading room', 'journal', 'digital library', 'ieee', 'delnet', 'librarian'],
  },
  {
    value: 'IT Support',
    keywords: ['wifi', 'wi-fi', 'internet', 'network', 'login', 'portal', 'password', 'reset password', 'erp', 'lms', 'email', 'id card wifi', 'computer lab', 'system', 'software', 'helpdesk'],
  },
  {
    value: 'Administration',
    keywords: ['certificate', 'bonafide', 'character certificate', 'migration', 'noc', 'transfer certificate', 'tc', 'document', 'transcript', 'id card', 'duplicate id', 'bus pass', 'transport', 'admission', 'office'],
  },
  {
    value: 'Student Affairs',
    keywords: ['placement', 'internship', 't&p', 'job', 'package', 'campus drive', 'recruiter', 'resume', 'club', 'society', 'cultural', 'sports', 'gym', 'event', 'fest', 'campxfest', 'nss', 'committee'],
  },
  {
    value: 'Other',
    keywords: ['canteen', 'cafeteria', 'parking', 'security', 'medical room', 'doctor', 'first aid', 'lost and found'],
  },
];

// Sensitive keywords for immediate Grievance Cell escalation (Anti-ragging, safety, harassment, crisis)
const SENSITIVE_KEYWORDS = [
  'ragging', 'ragged', 'rag',
  'harass', 'harassment', 'harassed',
  'bully', 'bullying', 'bullied',
  'threat', 'threaten', 'threatening',
  'assault', 'violence', 'attack', 'beaten', 'fighting',
  'molest', 'molestation', 'stalk', 'stalking',
  'blackmail', 'extort', 'extortion',
  'bribe', 'corruption',
  'caste', 'discrimination', 'discriminat',
  'suicide', 'kill myself', 'self-harm', 'depression', 'depressed',
  'unsafe', 'danger', 'emergency', 'mental health crisis',
];

// ─── Intent Recognition ──────────────────────────────────────────────────────
const GREETING_REGEX = /^(hi|hello|hey|heyy|heya|hola|greetings|good\s*(morning|afternoon|evening|day)|namaste|sup|yo|howdy)\b/i;
const GRATITUDE_REGEX = /^(thank\s*you|thanks|thx|thank\s*u|appreciate\s*it|great\s*thanks|many\s*thanks|tq)\b/i;
const FAREWELL_REGEX = /^(bye|goodbye|see\s*you|cya|take\s*care|have\s*a\s*good\s*day|ttyl)\b/i;
const BOT_CAPABILITIES_REGEX = /(who\s+are\s+you|what\s+can\s+you\s+do|how\s+can\s+you\s+help|what\s+is\s+campx|tell\s+me\s+about\s+yourself|help\s*me)/i;

/** Check for general conversational intents */
function checkConversationalIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text
    .trim()
    .toLowerCase()
    .replace(/[!?,;.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Gratitude
  if (GRATITUDE_REGEX.test(clean) || clean === 'thanks' || clean === 'thank you') {
    return {
      category: 'Other',
      urgency: 'Routine',
      confidence: 0.98,
      isSensitive: false,
      answer: "You're very welcome! 😊 Feel free to ask if you need help with anything else regarding campus academics, examinations, fees, or facilities.",
      provider: 'intent-rule',
      usedFallback: false,
    };
  }

  // 2. Farewell
  if (FAREWELL_REGEX.test(clean)) {
    return {
      category: 'Other',
      urgency: 'Routine',
      confidence: 0.98,
      isSensitive: false,
      answer: "Goodbye! Have a productive and great day ahead at college! 🎓 Feel free to reach out anytime you need assistance.",
      provider: 'intent-rule',
      usedFallback: false,
    };
  }

  // 3. Capabilities / Identity
  if (BOT_CAPABILITIES_REGEX.test(clean)) {
    return {
      category: 'Other',
      urgency: 'Routine',
      confidence: 0.98,
      isSensitive: false,
      answer: `I am **CampX Assist** 🤖, your smart AI college companion.\n\nHere is what I can do for you:\n- 📚 **Academics & Attendance**: Verify the 75% attendance rule, leave application process, and medical certificates.\n- 📝 **Examinations**: Guide you through hall tickets, backlog exams, revaluation, and exam dates.\n- 💰 **Accounts & Fees**: Provide fee deadlines, installment options, and scholarship information.\n- 🏠 **Hostel & Campus**: Inform you about curfew timings, mess schedules, library rules, and campus WiFi.\n- 🚨 **Grievance Redressal**: Automatically flag urgent or confidential issues (such as anti-ragging and harassment) for direct grievance cell intervention.\n- 🎫 **Complaint Routing**: Convert unresolved queries into tracked support tickets with guaranteed SLA deadlines.\n\nHow can I help you today?`,
      provider: 'intent-rule',
      usedFallback: false,
    };
  }

  // 4. Greetings
  if (GREETING_REGEX.test(clean) || clean === 'hi' || clean === 'hello' || clean === 'hey') {
    return {
      category: 'Other',
      urgency: 'Routine',
      confidence: 0.98,
      isSensitive: false,
      answer: `Hello! 👋 I'm **CampX Assist**, your college support companion.\n\nI can help you answer questions about:\n• **Attendance & Leave Rules** (75% policy, medical certificates)\n• **Exams & Hall Tickets** (schedule, backlogs, revaluation)\n• **Fee Payments & Scholarships** (deadlines, installments)\n• **Hostel, Mess & Library** (timings, rules, book issues)\n• **Campus WiFi & IT Support**\n• **Filing Complaints & Grievance Redressal**\n\nWhat can I help you with today?`,
      provider: 'intent-rule',
      usedFallback: false,
    };
  }

  return null;
}

// ─── Generic HTTPS POST Helper ───────────────────────────────────────────────
function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch {
            reject(new Error(`Invalid JSON response: ${data.slice(0, 100)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(payload);
    req.end();
  });
}

// ─── Build AI Prompt ──────────────────────────────────────────────────────────
function buildPrompt(text, faqContext) {
  const faqSection = faqContext
    ? `\n\nOFFICIAL COLLEGE KNOWLEDGE BASE CONTEXT:\n${faqContext}\n\nSTRICT INSTRUCTIONS FOR FAQ CONTEXT:\n- If the student's question is answered by the context above, synthesize a clear, friendly, and complete answer grounded strictly in the provided facts.\n- Do NOT invent rules, deadlines, or dates not present in the context.\n- If the student's question is NOT answered by the knowledge base context, set "answer": null.`
    : '\n\nNo specific FAQ documentation found for this query.';

  return `You are CampX Assist, the official AI student-support chatbot for the CampX college platform.
Analyze the following student message and reply ONLY with a valid JSON object (no markdown code blocks, no text before or after).

REQUIRED JSON FIELDS:
- "category": Must be exactly one of: "Academics", "Examination", "Accounts & Fees", "Hostel", "Library", "IT Support", "Administration", "Student Affairs", "Other"
- "urgency": "Urgent" | "Sensitive" | "Routine" (Use "Urgent" or "Sensitive" for harassment, ragging, bullying, threats, physical danger, mental health distress, or abuse)
- "confidence": Float between 0.0 and 1.0 (How confident you are in the categorization and answer)
- "isSensitive": Boolean (true if query concerns safety, ragging, harassment, or confidential grievances)
- "answer": String or null.
  * If the student is greeting or asking what you do, provide a warm, concise college assistant welcome.
  * If the context contains the answer to their college query, provide a helpful, natural, and accurate answer grounded in the context.
  * If the question cannot be answered from the context or requires human staff intervention, set "answer": null.
  * If the question is completely irrelevant to college/campus (e.g. world trivia, entertainment, cooking), politely state that you are the CampX college companion and can only help with college-related matters.${faqSection}

STUDENT MESSAGE: "${text.replace(/"/g, '\\"')}"`;
}

// ─── Extract JSON from LLM Output ─────────────────────────────────────────────
function extractJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {}

  // Try extracting from markdown ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // Try finding outermost { and }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

// ─── Validation Helper ────────────────────────────────────────────────────────
function validateClassification(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!VALID_CATEGORIES.includes(obj.category)) obj.category = 'Other';
  if (!VALID_URGENCIES.includes(obj.urgency)) obj.urgency = 'Routine';
  if (typeof obj.confidence !== 'number') obj.confidence = 0.5;
  obj.confidence = Math.min(1, Math.max(0, obj.confidence));
  if (typeof obj.isSensitive !== 'boolean') obj.isSensitive = obj.urgency !== 'Routine';
  if (typeof obj.answer !== 'string' || !obj.answer.trim()) obj.answer = null;
  return true;
}

// ─── Gemini Call (Primary LLM) ────────────────────────────────────────────────
async function callGemini(text, faqContext) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');

  const modelsToTry = [
    process.env.GEMINI_MODEL,
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
  ].filter(Boolean);

  const prompt = buildPrompt(text, faqContext);
  let lastErr = null;

  for (const model of modelsToTry) {
    try {
      const res = await httpsPost(
        'generativelanguage.googleapis.com',
        `/v1beta/models/${model}:generateContent?key=${key}`,
        {},
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
          },
        }
      );

      if (res.statusCode !== 200) {
        throw new Error(`Gemini HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }

      const raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = extractJSON(raw);
      if (parsed && validateClassification(parsed)) {
        return parsed;
      }
    } catch (err) {
      lastErr = err;
      // Try next model if 404
      if (!err.message.includes('404')) {
        break;
      }
    }
  }

  throw lastErr || new Error('Gemini API classification failed');
}

// ─── Groq Call (Fallback LLM) ─────────────────────────────────────────────────
async function callGroq(text, faqContext) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const modelsToTry = [
    process.env.GROQ_MODEL,
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
  ].filter(Boolean);

  const prompt = buildPrompt(text, faqContext);
  let lastErr = null;

  for (const model of modelsToTry) {
    try {
      const res = await httpsPost(
        'api.groq.com',
        '/openai/v1/chat/completions',
        { Authorization: `Bearer ${key}` },
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 600,
        }
      );

      if (res.statusCode !== 200) {
        throw new Error(`Groq HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }

      const raw = res.data?.choices?.[0]?.message?.content || '';
      const parsed = extractJSON(raw);
      if (parsed && validateClassification(parsed)) {
        return parsed;
      }
    } catch (err) {
      lastErr = err;
      if (!err.message.includes('404') && !err.message.includes('decommissioned')) {
        break;
      }
    }
  }

  throw lastErr || new Error('Groq API classification failed');
}

// ─── Keyword & Semantic Rule Fallback ─────────────────────────────────────────
function keywordClassify(text) {
  const lower = text.toLowerCase();

  // 1. Sensitive grievance check
  const isSensitive = SENSITIVE_KEYWORDS.some((k) => lower.includes(k));
  if (isSensitive) {
    return {
      category: 'Administration',
      urgency: 'Urgent',
      isSensitive: true,
      confidence: 0.95,
      answer: `⚠️ **Grievance Cell Priority Escalation**:\nYour message mentions a sensitive matter (anti-ragging/safety/harassment). Ragging and harassment are strictly prohibited under UGC and Institute regulations.\n\nThis concern is being routed to the **Grievance Redressal Cell** with highest priority (**4-hour SLA**). If this is an immediate emergency, please contact the 24x7 Campus Helpline or the Dean of Student Welfare immediately.`,
      usedFallback: false,
    };
  }

  // 2. Department scoring
  let category = 'Other';
  let maxHits = 0;
  for (const cat of KEYWORD_CATEGORIES) {
    const hits = cat.keywords.filter((k) => lower.includes(k)).length;
    if (hits > maxHits) {
      maxHits = hits;
      category = cat.value;
    }
  }

  const confidence = maxHits >= 2 ? 0.75 : maxHits === 1 ? 0.55 : 0.3;

  return {
    category,
    urgency: 'Routine',
    isSensitive: false,
    confidence,
    answer: null, // Left null so router can supply genuinely grounded FAQ or offer ticket
    usedFallback: true,
  };
}

// ─── Main Classify Method (LLMEngine per SDS) ────────────────────────────────
/**
 * Classify a student message with LLM fallback cascade:
 * 1. Immediate Conversational/Intent filter (greetings, capabilities, gratitude)
 * 2. Primary LLM: Google Gemini
 * 3. Fallback LLM: Groq
 * 4. Rule-based / Keyword semantic fallback
 */
async function classifyMessage(text, faqContext = null) {
  // Check for immediate conversational intents first (fast & reliable)
  const conversational = checkConversationalIntent(text);
  if (conversational) {
    conversational.slaDeadline = getSLADeadline(conversational.urgency);
    return conversational;
  }

  const forceSensitive = SENSITIVE_KEYWORDS.some((k) => text.toLowerCase().includes(k));

  // 1. Primary: Google Gemini
  try {
    const result = await callGemini(text, faqContext);
    if (forceSensitive) {
      result.isSensitive = true;
      result.urgency = 'Urgent';
    }
    result.provider = 'gemini';
    result.usedFallback = false;
    result.slaDeadline = getSLADeadline(result.urgency);
    return result;
  } catch (e1) {
    console.warn('[AI] Primary LLM (Gemini) failed/unavailable:', e1.message);
  }

  // 2. Secondary: Groq Fallback
  try {
    const result = await callGroq(text, faqContext);
    if (forceSensitive) {
      result.isSensitive = true;
      result.urgency = 'Urgent';
    }
    result.provider = 'groq';
    result.usedFallback = false;
    result.slaDeadline = getSLADeadline(result.urgency);
    return result;
  } catch (e2) {
    console.warn('[AI] Fallback LLM (Groq) failed/unavailable:', e2.message);
  }

  // 3. Final Fallback: Keyword & Rule-based Classifier
  const result = keywordClassify(text);
  if (forceSensitive) {
    result.isSensitive = true;
    result.urgency = 'Urgent';
  }
  result.provider = 'keyword';
  result.slaDeadline = getSLADeadline(result.urgency);
  return result;
}

module.exports = {
  classifyMessage,
  getSLADeadline,
  checkConversationalIntent,
  SENSITIVE_KEYWORDS,
  VALID_CATEGORIES,
};
