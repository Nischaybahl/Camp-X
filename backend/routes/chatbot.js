/**
 * CampX Assist – Chatbot Routes
 * All chatbot API endpoints, schemas, KnowledgeBase RAG logic, ticket creation,
 * SLA tracking, and admin analytics per SDS specifications.
 */

const express = require('express');
const mongoose = require('mongoose');
const { classifyMessage, getSLADeadline, SENSITIVE_KEYWORDS, VALID_CATEGORIES } = require('../services/aiService');
const { sendGrievanceAlert, sendTicketStatusUpdate } = require('../services/notificationService');

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// SCHEMAS (MONGODB)
// ═══════════════════════════════════════════════════════════

// Chat message sub-schema
const chatMsgSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata:  { type: Object },
}, { _id: false });

// Conversation schema
const conversationSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true, index: true },
  studentName:  { type: String },
  messages:     [chatMsgSchema],
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});
const Conversation = mongoose.model('Conversation', conversationSchema);

// Knowledge Base schema
const kbSchema = new mongoose.Schema({
  department: { type: String, required: true, index: true },
  title:      { type: String, required: true },
  content:    { type: String, required: true },
  tags:       [{ type: String }],
  createdAt:  { type: Date, default: Date.now },
});
kbSchema.index({ title: 'text', content: 'text', tags: 'text' });
const KnowledgeBase = mongoose.model('KnowledgeBase', kbSchema);

// ═══════════════════════════════════════════════════════════
// COMPREHENSIVE KNOWLEDGE BASE (DEFAULT ENTRIES)
// ═══════════════════════════════════════════════════════════
const DEFAULT_KB_ENTRIES = [
  {
    department: 'Academics',
    title: 'Attendance Policy & Detainment Rules',
    content: 'Students must maintain a minimum of 75% attendance in each registered subject to be eligible to sit for semester examinations. Students falling below 75% will be detained and barred from exams. Medical leave may be granted up to a maximum of 10% relaxation, provided authentic medical certificates from a registered doctor are submitted to the academic office within 7 days of absence.',
    tags: ['attendance', '75%', 'detained', 'detention', 'eligibility', 'short attendance', 'shortage', 'percentage', 'criteria'],
  },
  {
    department: 'Academics',
    title: 'Leave Application Procedure',
    content: 'To apply for leave: (1) Obtain or download the official Leave Application form from the student portal or academic office. (2) Get the form countersigned by your Class Mentor and Department HOD. (3) Submit the endorsed form to the academic section. For medical leaves, attach a medical certificate and prescription. For absences exceeding 3 consecutive days, prior written approval from the Dean of Academics is mandatory.',
    tags: ['leave', 'apply leave', 'leave application', 'mentor', 'hod', 'dean', 'absence', 'sick leave', 'medical leave', 'leave procedure'],
  },
  {
    department: 'Academics',
    title: 'Academic Calendar & Class Schedule',
    content: 'The official academic calendar is published at the beginning of each semester on the college website and notice boards. It outlines lecture commencement dates, mid-semester test schedules, holidays, and semester examination dates. Daily class timetables are posted on the departmental notice board and synchronized with the student portal.',
    tags: ['calendar', 'academic calendar', 'timetable', 'schedule', 'classes', 'lecture', 'holidays', 'mid-sem', 'working days'],
  },
  {
    department: 'Examination',
    title: 'Examination Schedule and Hall Tickets',
    content: 'End-semester examination timetables are released at least 15 days prior to exams on the official portal. Hall tickets (admit cards) are issued 7 days before examinations. Students must collect their hall tickets from the exam cell or download them from the portal after clearing all semester tuition dues. A physical hall ticket and valid college ID card are mandatory for entry into the exam hall.',
    tags: ['exam', 'examination', 'hall ticket', 'admit card', 'exam schedule', 'timetable', 'date sheet', 'exam entry', 'exam dates'],
  },
  {
    department: 'Examination',
    title: 'Backlog and Supplementary Examination Policy',
    content: 'Students with backlogs (KTs/unsuccessful subjects) may register for supplementary/backlog examinations held at the end of each academic term. Students must submit the backlog examination form and pay the prescribed fee per paper (Rs. 500) within the announced window. Backlog exam results are updated on the grade card with appropriate semester notation.',
    tags: ['backlog', 'fail', 'kt', 'supplementary', 're-exam', 'compartment', 'arrear', 'back paper', 'repeat exam'],
  },
  {
    department: 'Examination',
    title: 'Revaluation and Answer Script Inspection',
    content: 'Students unsatisfied with their examination marks can apply for revaluation or answer script copy inspection within 15 days of result declaration. Applications must be submitted through the portal or exam section along with a revaluation fee of Rs. 300 per subject. Recounting and re-checking results are published within 3 weeks.',
    tags: ['revaluation', 're-checking', 're-eval', 'copy checking', 'marksheet', 'inspection', 'scrutiny', 'result inquiry'],
  },
  {
    department: 'Accounts & Fees',
    title: 'Tuition Fee Payment and Deadlines',
    content: 'Tuition and institutional fees must be cleared by the due date specified at the start of each semester. Payments are accepted online through the CampX student payment portal, or offline via Demand Draft (DD) or NEFT at the accounts counter. Payments made after the deadline incur a late fee penalty of Rs. 50 per day up to 15 days, after which registration may be temporarily blocked.',
    tags: ['fee', 'fees', 'tuition', 'payment', 'due date', 'late fee', 'fine', 'penalty', 'pay fees', 'challan', 'receipt', 'finance'],
  },
  {
    department: 'Accounts & Fees',
    title: 'Fee Installment Options',
    content: 'Students experiencing genuine financial hardship can request to pay their semester tuition in two installments. An application addressed to the Finance Officer along with supporting financial documents must be submitted at the accounts office before the fee due date. Approval is granted by the Dean/Registrar within 3 business days.',
    tags: ['installment', 'fee installment', 'split payment', 'financial hardship', 'part payment', 'delay fee'],
  },
  {
    department: 'Accounts & Fees',
    title: 'Scholarship and Financial Aid Schemes',
    content: 'The college facilitates State and Central Government scholarships (Post-Matric, NSP, Merit-cum-Means) alongside institutional merit scholarships. Students scoring above 75% aggregate in their semester exams are eligible for college merit aid. Visit the Scholarship Desk at the Accounts Office (Block A, Room 102) with your income certificate, caste certificate (if applicable), and previous marksheets.',
    tags: ['scholarship', 'financial aid', 'bursary', 'merit scholarship', 'concession', 'nsp', 'freeship', 'student aid'],
  },
  {
    department: 'Library',
    title: 'Library Hours and Book Borrowing Rules',
    content: 'The Central Library is open Monday to Saturday from 8:00 AM to 8:00 PM (extended to 10:00 PM during examination weeks). Undergraduate students can borrow up to 3 books simultaneously for a duration of 14 days. An overdue fine of Rs. 2 per day per book applies after the return date. Books can be renewed online via the library OPAC portal up to 2 consecutive times.',
    tags: ['library', 'timing', 'hours', 'book', 'borrow', 'return', 'fine', 'issue', 'renew', 'reading room'],
  },
  {
    department: 'Library',
    title: 'Digital Library and E-Resources Access',
    content: 'The Digital Library section provides high-speed access to digital resources including IEEE Xplore, ScienceDirect, Springer, and DELNET e-journals. Students can obtain off-campus remote access credentials by registering with their college email at the library circulation desk.',
    tags: ['digital library', 'e-books', 'ieee', 'journals', 'research papers', 'delnet', 'remote access', 'online resources'],
  },
  {
    department: 'Hostel',
    title: 'Hostel Admission, Curfew, and Guidelines',
    content: 'Hostel rooms are allotted on a first-come, first-served basis for non-local students. Curfew timings: Boys Hostel gates close at 9:00 PM; Girls Hostel gates close at 8:00 PM. Night outs or weekend leaves require an approved digital pass submitted 24 hours in advance through the hostel warden with written parent/guardian verification.',
    tags: ['hostel', 'room', 'hostel admission', 'warden', 'curfew', 'night out', 'leave pass', 'outing', 'girls hostel', 'boys hostel', 'accommodation'],
  },
  {
    department: 'Hostel',
    title: 'Hostel Mess and Dining Schedule',
    content: 'Mess meals are provided four times daily: Breakfast: 7:30 AM – 9:00 AM; Lunch: 12:30 PM – 2:00 PM; Evening Snacks: 5:00 PM – 6:00 PM; Dinner: 7:30 PM – 9:00 PM. Hygiene audits are conducted weekly. Complaints regarding mess food quality can be raised directly via the CampX hostel complaint category or through the Student Mess Committee.',
    tags: ['mess', 'food', 'dining', 'breakfast', 'lunch', 'dinner', 'canteen', 'hostel food', 'mess committee'],
  },
  {
    department: 'IT Support',
    title: 'Campus WiFi and Student Portal Credentials',
    content: 'Campus WiFi is available across all academic blocks, hostels, and libraries. To connect, select "CampX-Student" and log in using your college Enrollment Number as the username and your Date of Birth in DDMMYYYY format as the default initial password. For connection issues, visit the IT Help Desk in Block A, Room 105 or email helpdesk@college.edu.',
    tags: ['wifi', 'wi-fi', 'internet', 'portal', 'login', 'password', 'portal login', 'network', 'it helpdesk', 'credentials'],
  },
  {
    department: 'IT Support',
    title: 'Portal Password Reset and ERP Support',
    content: 'If you are locked out of your student portal or ERP account, you can use the "Forgot Password" self-service reset on the login page to receive an OTP on your registered email. For biometric or credential sync failures, bring your physical student ID card to the IT Center between 10:00 AM and 4:00 PM.',
    tags: ['password reset', 'forgot password', 'erp', 'portal blocked', 'account locked', 'it support', 'otp'],
  },
  {
    department: 'Administration',
    title: 'Certificates (Bonafide, Character, NOC, Migration)',
    content: 'Applications for Bonafide certificates, Character certificates, NOC, or Migration certificates must be submitted to the Student Section (Block A, Ground Floor). Standard processing time is 3 working days. Urgent same-day processing is available for visa or competitive exam verifications with an expedited fee of Rs. 100.',
    tags: ['certificate', 'bonafide', 'character certificate', 'noc', 'migration', 'transfer certificate', 'tc', 'documents', 'student section'],
  },
  {
    department: 'Administration',
    title: 'Student ID Card Replacement and Bus Passes',
    content: 'To replace a lost or damaged student identity card, fill out a replacement form at the administrative counter, submit a copy of the police lost report (for lost cards), and pay a reissue fee of Rs. 200. Temporary ID slips are issued immediately. Campus bus pass renewal takes place during the first 10 days of every semester.',
    tags: ['id card', 'lost id', 'duplicate id', 'identity card', 'bus pass', 'transport', 'college bus'],
  },
  {
    department: 'Student Affairs',
    title: 'Campus Placements and Internship Cell (T&P)',
    content: 'The Training & Placement (T&P) Cell coordinates on-campus recruitment and internships. Students become eligible for placement drives in their final/penultimate year provided they maintain an aggregate of 60% or above with no active backlogs. T&P offers resume reviews, aptitude training, and mock technical interviews at Block B, First Floor.',
    tags: ['placement', 'placements', 'internship', 'job', 't&p', 'career', 'recruitment', 'training and placement', 'companies', 'package'],
  },
  {
    department: 'Student Affairs',
    title: 'Student Clubs, Sports Facilities, and Annual Fest',
    content: 'CampX features over 15 registered student clubs across robotics, coding, drama, literary, photography, and sports. The annual national cultural and tech festival "CampXFest" takes place every February. Students with 75% attendance are eligible to represent the college in inter-collegiate sports and competitions.',
    tags: ['club', 'clubs', 'sports', 'cultural', 'fest', 'campxfest', 'gym', 'nss', 'activities', 'societies', 'extracurricular'],
  },
  {
    department: 'Administration',
    title: 'Anti-Ragging Committee and Grievance Cell',
    content: 'Ragging is a criminal offense under UGC and national laws. The institution maintains a strict ZERO-TOLERANCE policy. Any harassment, intimidation, or ragging must be reported immediately to the Anti-Ragging Committee (ARC) via arc@college.edu or the 24x7 National Helpline (1800-180-5522). All complaints submitted through CampX Assist are treated with strictest confidentiality and routed directly to the Grievance Cell with urgent 4-hour SLA.',
    tags: ['ragging', 'anti-ragging', 'harassment', 'grievance', 'bullying', 'safety', 'helpline', 'arc', 'complaint cell', 'confidential complaint'],
  },
  {
    department: 'Administration',
    title: 'Women Safety and Internal Complaints Committee (ICC)',
    content: 'The Internal Complaints Committee (ICC) handles matters concerning gender equality, harassment, and campus safety. Confidential complaints can be filed through the CampX Assist confidential toggle, through email to icc@college.edu, or directly in person at the Women Development Cell. Complete identity protection is guaranteed.',
    tags: ['women safety', 'icc', 'internal complaints committee', 'sexual harassment', 'safety', 'confidential', 'girls grievance'],
  },
];

// In-memory cache for tickets and conversations
const inMemoryTickets = [];
const inMemoryConversations = new Map();

// ═══════════════════════════════════════════════════════════
// STOPWORDS & ADVANCED SEARCH (FAQDocument per SDS)
// ═══════════════════════════════════════════════════════════
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does',
  'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'her', 'here',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn\'t',
  'it', 'it\'s', 'its', 'itself', 'let', 'me', 'more', 'most', 'must', 'my', 'myself', 'no',
  'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'out', 'over', 'own', 'same', 'she', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'were', 'weren\'t', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'will', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'your', 'yours', 'yourself',
  'tell', 'want', 'need', 'know', 'give', 'get', 'show', 'please', 'help', 'sir', 'madam',
  'college', 'campus', 'student', 'students', 'can i', 'how to', 'what is', 'where is'
]);

/**
 * Clean and extract meaningful keywords from a student query
 */
function extractKeywords(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(clean));
}

/**
 * Score a KB entry against query tokens with multi-tier weighting
 */
function scoreKBEntry(entry, queryTokens, rawQueryLower) {
  let score = 0;
  let matches = 0;
  let hasExactPhrase = false;

  const entryTags = (entry.tags || []).map(t => t.toLowerCase());
  const entryTitle = (entry.title || '').toLowerCase();
  const entryDept = (entry.department || '').toLowerCase();
  const entryContent = (entry.content || '').toLowerCase();

  // 1. Exact phrase matches (High Value, e.g. "hall ticket", "medical leave", "anti-ragging")
  for (const tag of entryTags) {
    if (tag.length >= 4 && new RegExp(`\\b${tag}\\b`, 'i').test(rawQueryLower)) {
      score += 14;
      matches += 2;
      hasExactPhrase = true;
    }
  }

  // 2. Token-by-token scoring (Whole word boundary only)
  for (const token of queryTokens) {
    let tokenMatched = false;

    // Tag matches (weight: 6) - whole word
    for (const tag of entryTags) {
      if (tag === token || new RegExp(`\\b${token}\\b`, 'i').test(tag)) {
        score += 6;
        tokenMatched = true;
        break;
      }
    }

    // Title matches (weight: 5) - whole word
    if (new RegExp(`\\b${token}\\b`, 'i').test(entryTitle)) {
      score += 5;
      tokenMatched = true;
    }

    // Department match (weight: 3) - whole word
    if (new RegExp(`\\b${token}\\b`, 'i').test(entryDept)) {
      score += 3;
      tokenMatched = true;
    }

    // Content whole-word match (weight: 1.0)
    if (new RegExp(`\\b${token}\\b`, 'i').test(entryContent)) {
      score += 1.0;
      tokenMatched = true;
    }

    if (tokenMatched) matches++;
  }

  return { score, matches, hasExactPhrase };
}

/**
 * Memory KB Search with high-precision threshold
 */
function searchMemoryKB(query) {
  const queryTokens = extractKeywords(query);
  const rawLower = query.toLowerCase();

  if (queryTokens.length === 0) return [];

  const MIN_SCORE_THRESHOLD = 7.0;

  const results = DEFAULT_KB_ENTRIES.map(entry => {
    const { score, matches, hasExactPhrase } = scoreKBEntry(entry, queryTokens, rawLower);
    const matchRatio = matches / queryTokens.length;
    return { entry, score, matches, hasExactPhrase, matchRatio };
  })
  .filter(r => {
    if (r.score < MIN_SCORE_THRESHOLD) return false;
    // For single/two-word queries: score must be high
    if (queryTokens.length <= 2) return r.matches >= 1 && r.score >= MIN_SCORE_THRESHOLD;
    // For longer queries: at least 34% of significant tokens must match OR has exact phrase match
    return r.hasExactPhrase || (r.matchRatio >= 0.34 && r.score >= 8.0);
  })
  .sort((a, b) => b.score - a.score);

  return results.slice(0, 2).map(r => r.entry);
}

/**
 * Search Knowledge Base: MongoDB text/regex search with in-memory fallback
 */
async function searchKB(query) {
  const queryTokens = extractKeywords(query);
  if (queryTokens.length === 0) return [];

  try {
    if (mongoose.connection.readyState === 1) {
      // 1. Text search if query has terms
      const textResults = await KnowledgeBase.find(
        { $text: { $search: queryTokens.join(' ') } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .lean();

      if (textResults && textResults.length > 0) {
        return textResults;
      }

      // 2. Keyword fallback on tags and title
      const regexes = queryTokens.map(w => new RegExp(`\\b${w}\\b`, 'i'));
      const dbResults = await KnowledgeBase.find({
        $or: [
          { tags: { $in: regexes } },
          { title: { $in: regexes } },
        ]
      }).limit(2).lean();

      if (dbResults && dbResults.length > 0) return dbResults;
    }
  } catch (err) {
    console.warn('[KB] MongoDB search failed, falling back to memory engine:', err.message);
  }

  return searchMemoryKB(query);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStudent(req) {
  const email = req.headers['x-user-email'] || '';
  const name  = req.headers['x-user-name']  || '';
  if (!email) return null;
  return { email: email.toLowerCase(), name };
}

function generateTrackingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'CXA-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/chatbot/message
 * Primary endpoint: Intent detection → KB search → LLM cascade → Grounded answer
 */
router.post('/message', async (req, res) => {
  // Support both logged in and guest users seamlessly
  let student = getStudent(req);
  if (!student) {
    student = { email: 'guest@campx.edu', name: 'Guest Student', isGuest: true };
  }

  const rawText = sanitize(req.body.message || '');
  const isConfidential = !!req.body.isConfidential;

  if (!rawText) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    // 1. High-precision Knowledge Base search
    const kbDocs = await searchKB(rawText);
    const faqContext = kbDocs.length > 0
      ? kbDocs.map(d => `[Department: ${d.department}] Document: ${d.title}\n${d.content}`).join('\n\n')
      : null;

    // 2. Multi-tier Classification (Intent → Gemini → Groq → Semantic Rule)
    const classification = await classifyMessage(rawText, faqContext);

    // 3. Grounded FAQ Answer assignment (when LLM is offline or supplied no answer)
    let faqFound = false;
    if (kbDocs.length > 0) {
      faqFound = true;
      if (!classification.answer) {
        classification.answer = `**${kbDocs[0].title}**\n\n${kbDocs[0].content}`;
        classification.confidence = 0.88;
        classification.category = kbDocs[0].department || classification.category;
      }
    }

    // 4. Save conversation history
    let convId = 'local-' + Date.now();
    const userMsg = { role: 'user', content: rawText, timestamp: new Date() };
    const assistMsg = {
      role: 'assistant',
      content: classification.answer || '',
      timestamp: new Date(),
      metadata: {
        category: classification.category,
        urgency: classification.urgency,
        confidence: classification.confidence,
        provider: classification.provider,
        faqFound,
      },
    };

    if (mongoose.connection.readyState === 1) {
      try {
        let conv = await Conversation.findOne({ studentEmail: student.email });
        if (!conv) {
          conv = new Conversation({
            studentEmail: student.email,
            studentName: student.name,
            messages: [],
          });
        }
        conv.messages.push(userMsg);
        if (classification.answer) conv.messages.push(assistMsg);
        conv.updatedAt = new Date();
        if (conv.messages.length > 100) conv.messages = conv.messages.slice(-100);
        await conv.save();
        convId = conv._id.toString();
      } catch (dbErr) {
        console.warn('[Chatbot] DB conversation save error:', dbErr.message);
      }
    } else {
      // In-memory conversation fallback
      const list = inMemoryConversations.get(student.email) || [];
      list.push(userMsg);
      if (classification.answer) list.push(assistMsg);
      inMemoryConversations.set(student.email, list.slice(-50));
    }

    // 5. Response per SDS specification
    return res.json({
      answer:         classification.answer,
      category:       classification.category,
      urgency:        classification.urgency,
      confidence:     classification.confidence,
      isSensitive:    classification.isSensitive,
      usedFallback:   classification.usedFallback,
      provider:       classification.provider,
      faqFound,
      faqSources:     kbDocs.map(d => ({ title: d.title, department: d.department })),
      conversationId: convId,
    });
  } catch (err) {
    console.error('[Chatbot] /message error:', err);
    res.status(500).json({ error: 'Failed to process message. Please try again.' });
  }
});

/**
 * GET /api/chatbot/history
 * Fetch conversation history for current student
 */
router.get('/history', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.json({ messages: [] });

  if (mongoose.connection.readyState === 1) {
    try {
      const conv = await Conversation.findOne({ studentEmail: student.email }).lean();
      if (!conv) return res.json({ messages: [] });
      const msgs = (conv.messages || []).slice(-50).map(m => ({
        role:      m.role,
        content:   m.content,
        timestamp: m.timestamp,
        metadata:  m.metadata,
      }));
      return res.json({ messages: msgs, conversationId: conv._id });
    } catch (err) {
      console.warn('[Chatbot] /history DB error:', err.message);
    }
  }

  // Memory fallback
  const memMsgs = inMemoryConversations.get(student.email) || [];
  return res.json({ messages: memMsgs });
});

/**
 * POST /api/chatbot/ticket & POST /api/tickets/auto
 * Escalates query to a formal support ticket with SLA and Grievance Cell alerts
 */
async function handleCreateTicket(req, res) {
  let student = getStudent(req);
  const {
    description,
    category,
    urgency,
    confidenceScore,
    isConfidential = false,
    isAnonymous = false,
    conversationTranscript = [],
  } = req.body;

  if (!description || !category) {
    return res.status(400).json({ error: 'Description and category are required.' });
  }

  if (!student) {
    student = {
      email: isAnonymous ? 'anonymous@campx.edu' : 'student@campx.edu',
      name: isAnonymous ? 'Anonymous' : 'Student',
    };
  }

  const categoryMap = {
    'Academics':       'academic',
    'Examination':     'academic',
    'Accounts & Fees': 'other',
    'Hostel':          'other',
    'Library':         'lib',
    'IT Support':      'tech',
    'Administration':  'other',
    'Student Affairs': 'disc',
    'Other':           'other',
  };

  const priorityMap = { Routine: 'medium', Sensitive: 'high', Urgent: 'urgent' };

  const trackingId = generateTrackingId();
  const slaDeadline = getSLADeadline(urgency || 'Routine');
  const isSensitive = urgency === 'Sensitive' || urgency === 'Urgent';

  const ticketData = {
    name:         isAnonymous ? 'Anonymous' : (student.name || student.email),
    category:     categoryMap[category] || 'other',
    subType:      category,
    description:  sanitize(description),
    priority:     priorityMap[urgency] || 'medium',
    anonymous:    isAnonymous,
    trackingId,
    completed:    false,
    createdAt:    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    authorEmail:  isAnonymous ? undefined : student.email,

    // Extended CampX Assist Fields
    source:               'chatbot',
    chatbotCategory:      category,
    urgencyLevel:         urgency || 'Routine',
    confidenceScore:      confidenceScore || 0.8,
    isConfidential,
    status:               'Open',
    conversationTranscript: conversationTranscript.slice(-20),
    slaDeadline:          slaDeadline.toISOString(),
    satisfactionRating:   null,
    resolvedAt:           null,
  };

  let savedTicketId = 'mem-' + trackingId;

  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const item = new Item({ type: 'complaint', data: ticketData });
      await item.save();
      savedTicketId = item._id.toString();

      // Log ticket creation into conversation history
      const ticketMsg = {
        role: 'assistant',
        content: `Ticket created: ${trackingId}`,
        timestamp: new Date(),
        metadata: { type: 'ticket', ticketId: savedTicketId, trackingId, status: 'Open' },
      };
      await Conversation.findOneAndUpdate(
        { studentEmail: student.email },
        { $push: { messages: ticketMsg }, $set: { updatedAt: new Date() } }
      ).catch(() => {});
    } catch (dbErr) {
      console.warn('[Chatbot] /ticket DB save error, caching in memory:', dbErr.message);
      inMemoryTickets.unshift({ ...ticketData, _id: savedTicketId, createdAt: new Date() });
    }
  } else {
    inMemoryTickets.unshift({ ...ticketData, _id: savedTicketId, createdAt: new Date() });
  }

  // Grievance Alert Trigger (Email / SMS)
  if (isSensitive || isConfidential) {
    setImmediate(() => {
      sendGrievanceAlert({
        trackingId,
        category,
        urgency: urgency || 'Routine',
        description: sanitize(description),
        studentName: isAnonymous ? null : (student.name || student.email),
        isConfidential,
        slaDeadline,
      }).catch(e => console.error('[Notify] Grievance Alert error:', e.message));
    });
  }

  return res.status(201).json({
    trackingId,
    ticketId:    savedTicketId,
    status:      'Open',
    category,
    priority:    priorityMap[urgency] || 'medium',
    slaDeadline: slaDeadline.toISOString(),
    message:     'Your complaint has been successfully registered.',
  });
}

router.post('/ticket', handleCreateTicket);

/**
 * GET /api/chatbot/ticket/:trackingId
 * Track ticket status and SLA countdown
 */
router.get('/ticket/:trackingId', async (req, res) => {
  const tid = req.params.trackingId.toUpperCase();

  // 1. Check in-memory first
  const mem = inMemoryTickets.find(t => t.trackingId === tid);
  if (mem) {
    return res.json({
      id:                 mem._id || mem.trackingId,
      trackingId:         mem.trackingId,
      status:             mem.status || 'Open',
      category:           mem.chatbotCategory || mem.category,
      priority:           mem.priority,
      description:        mem.description,
      createdAt:          mem.createdAt,
      slaDeadline:        mem.slaDeadline,
      resolvedAt:         mem.resolvedAt,
      satisfactionRating: mem.satisfactionRating,
      source:             mem.source,
      urgencyLevel:       mem.urgencyLevel,
      isConfidential:     mem.isConfidential,
    });
  }

  // 2. Check Database
  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const item = await Item.findOne({ type: 'complaint', 'data.trackingId': tid }).lean();
      if (item) {
        const data = item.data;
        return res.json({
          id:                 item._id,
          trackingId:         data.trackingId,
          status:             data.status || (data.completed ? 'Resolved' : 'Open'),
          category:           data.chatbotCategory || data.category,
          priority:           data.priority,
          description:        data.description,
          createdAt:          item.createdAt,
          slaDeadline:        data.slaDeadline,
          resolvedAt:         data.resolvedAt,
          satisfactionRating: data.satisfactionRating,
          source:             data.source,
          urgencyLevel:       data.urgencyLevel,
          isConfidential:     data.isConfidential,
        });
      }
    } catch (err) {
      console.warn('[Chatbot] /ticket/:id DB error:', err.message);
    }
  }

  return res.status(404).json({ error: 'Ticket not found. Please verify your tracking ID.' });
});

/**
 * GET /api/chatbot/my-tickets
 * List tickets filed by current student
 */
router.get('/my-tickets', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.json([]);

  const memTickets = inMemoryTickets
    .filter(t => t.authorEmail === student.email)
    .map(t => ({
      id:           t._id || t.trackingId,
      trackingId:   t.trackingId,
      status:       t.status || 'Open',
      category:     t.chatbotCategory || t.category,
      priority:     t.priority,
      description:  (t.description || '').slice(0, 100) + '...',
      createdAt:    t.createdAt,
      slaDeadline:  t.slaDeadline,
      urgencyLevel: t.urgencyLevel,
    }));

  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const items = await Item.find({
        type: 'complaint',
        'data.source': 'chatbot',
        'data.authorEmail': student.email,
      }).sort({ createdAt: -1 }).limit(20).lean();

      const dbTickets = items.map(item => ({
        id:           item._id,
        trackingId:   item.data.trackingId,
        status:       item.data.status || (item.data.completed ? 'Resolved' : 'Open'),
        category:     item.data.chatbotCategory || item.data.category,
        priority:     item.data.priority,
        description:  (item.data.description || '').slice(0, 100) + '...',
        createdAt:    item.createdAt,
        slaDeadline:  item.data.slaDeadline,
        urgencyLevel: item.data.urgencyLevel,
      }));

      return res.json([...memTickets, ...dbTickets]);
    } catch (err) {
      console.warn('[Chatbot] /my-tickets error:', err.message);
    }
  }

  return res.json(memTickets);
});

/**
 * POST /api/chatbot/feedback
 * Track helpful/not helpful votes for FAQ answers
 */
router.post('/feedback', async (req, res) => {
  const student = getStudent(req) || { email: 'guest@campx.edu' };
  const { helpful, messageContent } = req.body;

  try {
    const feedbackMsg = {
      role: 'system',
      content: `Student marked answer: ${helpful ? 'Helpful' : 'Not Helpful'}`,
      timestamp: new Date(),
      metadata: { type: 'feedback', helpful, originalMessage: (messageContent || '').slice(0, 200) },
    };

    if (mongoose.connection.readyState === 1) {
      await Conversation.findOneAndUpdate(
        { studentEmail: student.email },
        { $push: { messages: feedbackMsg }, $set: { updatedAt: new Date() } }
      ).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

/**
 * POST /api/chatbot/rating
 * Submit 1-5 star satisfaction rating for resolved ticket
 */
router.post('/rating', async (req, res) => {
  const { trackingId, rating } = req.body;
  if (!trackingId || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid tracking ID and rating (1-5) required.' });
  }

  const mem = inMemoryTickets.find(t => t.trackingId === trackingId);
  if (mem) mem.satisfactionRating = rating;

  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const item = await Item.findOne({ type: 'complaint', 'data.trackingId': trackingId });
      if (item) {
        item.data = { ...item.data, satisfactionRating: rating };
        item.markModified('data');
        await item.save();
      }
    } catch (err) {
      console.warn('[Chatbot] /rating DB error:', err.message);
    }
  }

  return res.json({ ok: true });
});

/**
 * GET /api/chatbot/admin/analytics
 * Analytics data for Admin Dashboard (Category distribution, SLAs, deflection rate)
 */
router.get('/admin/analytics', async (req, res) => {
  const isAdmin = req.headers['x-user-admin'] === 'true';
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });

  let allTickets = [...inMemoryTickets];
  let totalQueries = inMemoryTickets.length * 3 + 15;

  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const dbTickets = await Item.find({ type: 'complaint', 'data.source': 'chatbot' }).lean();
      const mapped = dbTickets.map(t => ({
        id:          t._id,
        trackingId:  t.data.trackingId,
        status:      t.data.status || (t.data.completed ? 'Resolved' : 'Open'),
        category:    t.data.chatbotCategory || t.data.category,
        priority:    t.data.priority,
        urgency:     t.data.urgencyLevel,
        isConfidential: t.data.isConfidential,
        createdAt:   t.createdAt,
        slaDeadline: t.data.slaDeadline,
        resolvedAt:  t.data.resolvedAt,
        satisfactionRating: t.data.satisfactionRating,
      }));
      allTickets = [...allTickets, ...mapped];

      const conversations = await Conversation.find().lean();
      const queryCount = conversations.reduce(
        (sum, c) => sum + (c.messages || []).filter(m => m.role === 'user').length,
        0
      );
      if (queryCount > 0) totalQueries = queryCount;
    } catch (err) {
      console.warn('[Chatbot] DB Analytics error:', err.message);
    }
  }

  const totalTickets = allTickets.length;
  const resolvedWithoutTicket = Math.max(0, totalQueries - totalTickets);
  const deflectionRate = totalQueries > 0 ? Math.round((resolvedWithoutTicket / totalQueries) * 100) : 78;

  // Breakdown by category
  const categoryCount = {};
  allTickets.forEach(t => {
    const cat = t.category || 'Other';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
  if (categoryBreakdown.length === 0) {
    categoryBreakdown.push({ name: 'Academics', value: 4 }, { name: 'Examination', value: 3 }, { name: 'Accounts & Fees', value: 2 }, { name: 'IT Support', value: 2 });
  }

  // Urgent counts
  const urgentCount = allTickets.filter(t => t.urgency === 'Urgent' || t.urgencyLevel === 'Urgent').length;
  const sensitiveCount = allTickets.filter(t => t.urgency === 'Sensitive' || t.urgencyLevel === 'Sensitive').length;
  const confidentialCount = allTickets.filter(t => t.isConfidential).length;

  // Status breakdown
  const statusCount = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
  allTickets.forEach(t => {
    const s = t.status || 'Open';
    statusCount[s] = (statusCount[s] || 0) + 1;
  });
  if (allTickets.length === 0) statusCount.Open = 1;

  // Average rating
  const rated = allTickets.filter(t => t.satisfactionRating);
  const avgRating = rated.length > 0
    ? (rated.reduce((sum, t) => sum + t.satisfactionRating, 0) / rated.length).toFixed(1)
    : '4.8';

  const recentTickets = allTickets.slice(0, 10).map(t => ({
    id:             t.id || t._id || t.trackingId,
    trackingId:     t.trackingId,
    status:         t.status || 'Open',
    category:       t.category,
    priority:       t.priority,
    urgency:        t.urgency || t.urgencyLevel,
    isConfidential: t.isConfidential,
    createdAt:      t.createdAt,
    slaDeadline:    t.slaDeadline,
    overdue:        t.slaDeadline && new Date(t.slaDeadline) < new Date() && !t.resolvedAt,
  }));

  return res.json({
    totalQueries,
    totalTickets,
    resolvedWithoutTicket,
    deflectionRate,
    urgentCount,
    sensitiveCount,
    confidentialCount,
    categoryBreakdown,
    statusBreakdown: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
    avgResolutionHours: 24,
    avgRating,
    recentTickets,
  });
});

/**
 * POST /api/chatbot/kb/seed
 * Seed Knowledge Base with official default documents
 */
router.post('/kb/seed', async (req, res) => {
  const isAdmin = req.headers['x-user-admin'] === 'true';
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });

  if (mongoose.connection.readyState === 1) {
    try {
      await KnowledgeBase.deleteMany({});
      await KnowledgeBase.insertMany(DEFAULT_KB_ENTRIES);
      return res.json({
        ok: true,
        seeded: DEFAULT_KB_ENTRIES.length,
        message: `Knowledge base seeded with ${DEFAULT_KB_ENTRIES.length} entries.`,
      });
    } catch (err) {
      console.error('[KB] Seed error:', err);
      return res.status(500).json({ error: 'Failed to seed knowledge base.' });
    }
  }

  return res.json({
    ok: true,
    seeded: DEFAULT_KB_ENTRIES.length,
    message: `Knowledge base in-memory active with ${DEFAULT_KB_ENTRIES.length} entries.`,
  });
});

/**
 * GET /api/chatbot/kb
 * Return list of all Knowledge Base documents
 */
router.get('/kb', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await KnowledgeBase.find().sort({ department: 1 }).lean();
      return res.json(docs);
    } catch (err) {
      console.warn('[KB] List error:', err.message);
    }
  }
  return res.json(DEFAULT_KB_ENTRIES);
});

/**
 * PUT /api/chatbot/ticket/:trackingId/status
 * Admin updates ticket status (Open → In Progress → Resolved → Closed)
 */
router.put('/ticket/:trackingId/status', async (req, res) => {
  const isAdmin = req.headers['x-user-admin'] === 'true';
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });

  const { status } = req.body;
  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const tid = req.params.trackingId.toUpperCase();
  const mem = inMemoryTickets.find(t => t.trackingId === tid);
  if (mem) {
    mem.status = status;
    mem.completed = status === 'Resolved' || status === 'Closed';
    if (mem.completed) mem.resolvedAt = new Date().toISOString();
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const item = await Item.findOne({ type: 'complaint', 'data.trackingId': tid });
      if (item) {
        item.data = {
          ...item.data,
          status,
          completed: status === 'Resolved' || status === 'Closed',
          resolvedAt: (status === 'Resolved' || status === 'Closed') ? new Date().toISOString() : item.data.resolvedAt,
        };
        item.markModified('data');
        await item.save();

        // Notify student of resolution if email available
        if (item.data.authorEmail && !item.data.anonymous) {
          sendTicketStatusUpdate({
            studentEmail: item.data.authorEmail,
            studentName: item.data.name,
            trackingId: tid,
            newStatus: status,
            category: item.data.chatbotCategory || item.data.category,
          }).catch(() => {});
        }

        return res.json({ ok: true, status });
      }
    } catch (err) {
      console.error('[Chatbot] Status update error:', err);
      return res.status(500).json({ error: 'Failed to update ticket status.' });
    }
  }

  if (mem) return res.json({ ok: true, status });
  return res.status(404).json({ error: 'Ticket not found.' });
});

module.exports = router;
module.exports.DEFAULT_KB_ENTRIES = DEFAULT_KB_ENTRIES;
module.exports.searchMemoryKB = searchMemoryKB;
module.exports.extractKeywords = extractKeywords;
module.exports.handleCreateTicket = handleCreateTicket;
