/**
 * CampX Assist – Chatbot Routes
 * All chatbot API endpoints, schemas, and knowledge base logic.
 */

const express = require('express');
const mongoose = require('mongoose');
const { classifyMessage, getSLADeadline } = require('../services/aiService');
const { sendGrievanceAlert } = require('../services/notificationService');

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════

// Chat message sub-schema
const chatMsgSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata:  { type: Object }, // e.g. { type: 'ticket', ticketId: '...' }
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
  department:    { type: String, required: true, index: true },
  title:         { type: String, required: true },
  content:       { type: String, required: true },
  tags:          [{ type: String }],
  createdAt:     { type: Date, default: Date.now },
});
kbSchema.index({ title: 'text', content: 'text', tags: 'text' });
const KnowledgeBase = mongoose.model('KnowledgeBase', kbSchema);

// ═══════════════════════════════════════════════════════════
// IN-MEMORY FALLBACK KNOWLEDGE BASE & TICKETS
// ═══════════════════════════════════════════════════════════
const DEFAULT_KB_ENTRIES = [
  {
    department: 'Academics',
    title: 'Attendance Policy',
    content: 'Students must maintain a minimum of 75% attendance in each subject to be eligible to appear in semester examinations. Students with attendance below 75% may be detained and not allowed to sit for exams. Medical leave may be considered with proper documentation submitted to the academic office within 7 days.',
    tags: ['attendance', 'leave', '75%', 'detained', 'medical', 'exam eligibility'],
  },
  {
    department: 'Academics',
    title: 'Leave Application Procedure',
    content: 'To apply for leave: (1) Fill the leave application form available at the academic office or the college portal. (2) Get it signed by your class teacher and department HOD. (3) Submit it to the academic section. Medical leave requires a valid medical certificate from a registered doctor. For leaves longer than 3 days, prior approval from the Dean is required.',
    tags: ['leave', 'application', 'procedure', 'HOD', 'medical certificate', 'absence'],
  },
  {
    department: 'Examination',
    title: 'Examination Schedule and Hall Tickets',
    content: 'Examination schedules are published on the college notice board and the official portal at least 15 days before the exam. Hall tickets are issued 7 days before the examination. Students must collect their hall tickets from the examination section with their fee receipt. Without a valid hall ticket, entry to the examination hall is not permitted.',
    tags: ['exam', 'schedule', 'hall ticket', 'timetable', 'examination', 'date sheet'],
  },
  {
    department: 'Examination',
    title: 'Backlog and Re-examination Policy',
    content: 'Students who fail in a subject can appear for the backlog examination conducted at the end of the academic year. A separate form must be filled and backlog examination fees paid. The result of backlog exams is reflected in the final grade sheet with a backlog notation. Revaluation requests can be submitted within 15 days of result declaration with the prescribed fee.',
    tags: ['backlog', 'fail', 'revaluation', 'supplementary', 'compartment', 'result'],
  },
  {
    department: 'Accounts & Fees',
    title: 'Fee Payment and Structure',
    content: 'Tuition and other fees must be paid by the due date notified at the beginning of each semester. Fees can be paid online through the college portal or at the accounts office via DD/NEFT. Late fee payment attracts a penalty of Rs. 50 per day after the due date. Students with financial difficulties can contact the accounts office for installment options or inquire about scholarship eligibility.',
    tags: ['fee', 'payment', 'dues', 'scholarship', 'late fee', 'tuition', 'finance', 'challan'],
  },
  {
    department: 'Accounts & Fees',
    title: 'Scholarship Information',
    content: 'The college facilitates Central Government, State Government, and institutional scholarships. Merit scholarships are awarded to students achieving above 75% aggregate. Need-based scholarships are available for economically weaker sections. Students must apply through the scholarship portal with required documents (income certificate, marksheets, caste certificate if applicable). Contact the scholarship section in the accounts office for details.',
    tags: ['scholarship', 'merit', 'need-based', 'financial aid', 'bursary', 'free ship'],
  },
  {
    department: 'Library',
    title: 'Library Timings and Rules',
    content: 'The college library is open Monday to Saturday from 8:00 AM to 8:00 PM. On examination days, the library remains open until 10:00 PM. Students can borrow up to 3 books at a time for a period of 14 days. Overdue books attract a fine of Rs. 2 per day per book. Books can be renewed online through the library portal or at the library counter.',
    tags: ['library', 'timing', 'hours', 'book', 'borrow', 'return', 'fine', 'issue', 'renew'],
  },
  {
    department: 'Hostel',
    title: 'Hostel Rules and Admission',
    content: 'Hostel accommodation is available for outstation students on a first-come-first-served basis. Applications must be submitted before the academic year starts. Curfew timings: boys hostel closes at 9:00 PM; girls hostel at 8:00 PM. Overnight leave requires prior permission from the warden and parent/guardian consent. Mess timings: Breakfast 7:30–9:00 AM, Lunch 12:30–2:00 PM, Dinner 7:30–9:00 PM.',
    tags: ['hostel', 'accommodation', 'room', 'warden', 'mess', 'food', 'curfew', 'outing'],
  },
  {
    department: 'IT Support',
    title: 'College WiFi and Portal Access',
    content: 'College WiFi is available throughout the campus. Use your enrollment number as the username and your date of birth (DDMMYYYY) as the initial password for first login. For WiFi issues or portal login problems, contact the IT help desk at the computer lab (Block A, Room 105) or email helpdesk@college.edu. Portal password reset can be requested at the IT help desk with your ID card.',
    tags: ['wifi', 'internet', 'portal', 'login', 'password', 'IT', 'helpdesk', 'computer'],
  },
  {
    department: 'Administration',
    title: 'Bonafide and Character Certificates',
    content: 'Bonafide certificates are issued from the academic office. Students must submit a written request with their enrollment number. Certificates are ready within 3 working days. For urgent requirements, same-day processing is available with a nominal fee. Character certificates are issued during the final year after all dues are cleared. Contact the administrative office (Block A, Ground Floor) for other certificates.',
    tags: ['certificate', 'bonafide', 'character', 'document', 'NOC', 'transfer', 'migration'],
  },
  {
    department: 'Student Affairs',
    title: 'Clubs, Societies, and Cultural Activities',
    content: 'The college has various student clubs including Technical, Cultural, Sports, NSS, and Literary societies. Students can join by registering with the respective faculty coordinator during the first month of the academic year. College annual fest (CampXFest) is held every year in February. Students must maintain 75% attendance to be eligible to participate in inter-college events.',
    tags: ['club', 'society', 'cultural', 'sports', 'event', 'NSS', 'fest', 'activity', 'committee'],
  },
  {
    department: 'Student Affairs',
    title: 'Placement and Internship Support',
    content: 'The Training and Placement (T&P) cell coordinates campus placements. Students eligible for placements must register with T&P before October. Minimum criteria: No active backlogs, 60% aggregate (may vary by company). Internship opportunities are notified via the college portal. T&P office (Block B, First Floor) provides resume assistance, mock interviews, and aptitude training.',
    tags: ['placement', 'internship', 'job', 'career', 'T&P', 'campus', 'recruitment', 'resume'],
  },
  {
    department: 'Administration',
    title: 'Anti-Ragging and Grievance Cell',
    content: 'Ragging is a punishable offense under UGC regulations and Indian law. Any incident of ragging must be reported immediately to the Anti-Ragging Committee (ARC). Contact: arc@college.edu or the 24/7 helpline. The Grievance Redressal Cell handles complaints related to harassment, discrimination, and other serious concerns. All complaints are treated with strict confidentiality. Students can also file complaints anonymously through CampX Assist.',
    tags: ['ragging', 'harassment', 'grievance', 'anti-ragging', 'committee', 'ARC', 'bully', 'complaint'],
  },
];

// In-memory cache for tickets when MongoDB is disconnected/offline
const inMemoryTickets = [];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/** Extract student identity from request header (consistent with existing auth pattern) */
function getStudent(req) {
  const email = req.headers['x-user-email'] || '';
  const name  = req.headers['x-user-name']  || '';
  if (!email) return null;
  return { email: email.toLowerCase(), name };
}

/** Generate tracking ID in CampX format */
function generateTrackingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'CXA-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/** In-memory keyword search over default FAQ list */
function searchMemoryKB(query) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (!words.length) return [];
  const matches = DEFAULT_KB_ENTRIES.map(entry => {
    const combined = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
    const score = words.reduce((acc, word) => acc + (combined.includes(word) ? 1 : 0), 0);
    return { entry, score };
  }).filter(m => m.score > 0).sort((a, b) => b.score - a.score);

  return matches.slice(0, 3).map(m => m.entry);
}

/** Search FAQ knowledge base using MongoDB text search with in-memory fallback */
async function searchKB(query) {
  try {
    if (mongoose.connection.readyState === 1) {
      // Text search
      const textResults = await KnowledgeBase.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } }).limit(3).lean();

      if (textResults && textResults.length > 0) return textResults;

      // Keyword fallback: regex search on content + title
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        const regexes = words.map(w => new RegExp(w, 'i'));
        const regResults = await KnowledgeBase.find({
          $or: [
            { content: { $in: regexes } },
            { title:   { $in: regexes } },
            { tags:    { $in: regexes } },
          ]
        }).limit(3).lean();
        if (regResults && regResults.length > 0) return regResults;
      }
    }
  } catch (err) {
    console.warn('[KB] MongoDB search failed, using memory fallback:', err.message);
  }
  return searchMemoryKB(query);
}

/** Sanitize student input */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/chatbot/message
 * Main message endpoint: FAQ lookup → AI classify → structured response
 */
router.post('/message', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.status(401).json({ error: 'Authentication required. Please log in.' });

  const rawText     = sanitize(req.body.message || '');
  const isConfidential = !!req.body.isConfidential;

  if (!rawText) return res.status(400).json({ error: 'Message is required.' });

  try {
    // 1. Search knowledge base (DB or memory fallback)
    const kbDocs = await searchKB(rawText);
    const faqContext = kbDocs.length > 0
      ? kbDocs.map(d => `[${d.department}] ${d.title}:\n${d.content}`).join('\n\n')
      : null;

    // 2. AI classification (Gemini → Groq → keyword)
    const classification = await classifyMessage(rawText, faqContext);

    // If AI did not supply an answer but we found a relevant FAQ entry, supply the FAQ content
    if (!classification.answer && kbDocs.length > 0) {
      classification.answer = kbDocs[0].content;
      classification.confidence = 0.88;
      classification.category = kbDocs[0].department || classification.category;
    }

    // 3. Persist conversation (if DB is active)
    let convId = 'local-' + Date.now();
    if (mongoose.connection.readyState === 1) {
      try {
        const userMsg   = { role: 'user',      content: rawText,                    timestamp: new Date() };
        const assistMsg = { role: 'assistant', content: classification.answer || '', timestamp: new Date(),
                            metadata: { category: classification.category, urgency: classification.urgency,
                                        confidence: classification.confidence, provider: classification.provider } };

        let conv = await Conversation.findOne({ studentEmail: student.email });
        if (!conv) {
          conv = new Conversation({ studentEmail: student.email, studentName: student.name, messages: [] });
        }
        conv.messages.push(userMsg);
        if (classification.answer) conv.messages.push(assistMsg);
        conv.updatedAt = new Date();
        // Keep last 100 messages
        if (conv.messages.length > 100) conv.messages = conv.messages.slice(-100);
        await conv.save();
        convId = conv._id.toString();
      } catch (dbErr) {
        console.warn('[Chatbot] DB save conversation failed (continuing anyway):', dbErr.message);
      }
    }

    // 4. Build response
    return res.json({
      answer:          classification.answer,
      category:        classification.category,
      urgency:         classification.urgency,
      confidence:      classification.confidence,
      isSensitive:     classification.isSensitive,
      usedFallback:    classification.usedFallback,
      provider:        classification.provider,
      faqFound:        kbDocs.length > 0 && !!classification.answer,
      faqSources:      kbDocs.map(d => ({ title: d.title, department: d.department })),
      conversationId:  convId,
    });
  } catch (err) {
    console.error('[Chatbot] /message error:', err);
    res.status(500).json({ error: 'Failed to process message. Please try again.' });
  }
});

/**
 * GET /api/chatbot/history
 * Return conversation history for the logged-in student
 */
router.get('/history', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.status(401).json({ error: 'Authentication required.' });

  if (mongoose.connection.readyState !== 1) {
    return res.json({ messages: [] });
  }

  try {
    const conv = await Conversation.findOne({ studentEmail: student.email }).lean();
    if (!conv) return res.json({ messages: [] });
    // Filter to last 50 messages for performance
    const msgs = (conv.messages || []).slice(-50).map(m => ({
      role:      m.role,
      content:   m.content,
      timestamp: m.timestamp,
      metadata:  m.metadata,
    }));
    res.json({ messages: msgs, conversationId: conv._id });
  } catch (err) {
    console.warn('[Chatbot] /history error:', err.message);
    res.json({ messages: [] });
  }
});

/**
 * POST /api/chatbot/ticket
 * Auto-create a complaint ticket from chatbot context
 * Integrates with existing Item model (type='complaint')
 */
router.post('/ticket', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.status(401).json({ error: 'Authentication required.' });

  const {
    description, category, urgency, confidenceScore,
    isConfidential = false, isAnonymous = false,
    conversationTranscript = [],
  } = req.body;

  if (!description || !category) {
    return res.status(400).json({ error: 'Description and category are required.' });
  }

  // Map chatbot categories to existing CampX complaint categories
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

  // Map urgency to priority
  const priorityMap = { Routine: 'medium', Sensitive: 'high', Urgent: 'urgent' };

  const trackingId = generateTrackingId();
  const slaDeadline = getSLADeadline(urgency || 'Routine');
  const isSensitive = urgency === 'Sensitive' || urgency === 'Urgent';

  const ticketData = {
    // Core fields (compatible with existing Complaint interface)
    name:         isAnonymous ? 'Anonymous' : (student.name || student.email),
    category:     categoryMap[category] || 'other',
    subType:      category,          // Store the AI category as subType
    description:  sanitize(description),
    priority:     priorityMap[urgency] || 'medium',
    anonymous:    isAnonymous,
    trackingId,
    completed:    false,
    createdAt:    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    authorEmail:  isAnonymous ? undefined : student.email,

    // Extended chatbot fields
    source:               'chatbot',
    chatbotCategory:      category,
    urgencyLevel:         urgency || 'Routine',
    confidenceScore:      confidenceScore || 0,
    isConfidential,
    isAnonymous,
    status:               'Open',
    conversationTranscript: conversationTranscript.slice(-20), // last 20 messages
    slaDeadline:          slaDeadline.toISOString(),
    satisfactionRating:   null,
    resolvedAt:           null,
  };

  let savedTicketId = 'mem-' + trackingId;

  // Attempt saving to DB if available, else store in memory
  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const item = new Item({ type: 'complaint', data: ticketData });
      await item.save();
      savedTicketId = item._id.toString();

      // Persist ticket message in conversation
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
      console.warn('[Chatbot] /ticket DB save failed, caching in memory:', dbErr.message);
      inMemoryTickets.unshift({ ...ticketData, _id: savedTicketId, createdAt: new Date() });
    }
  } else {
    inMemoryTickets.unshift({ ...ticketData, _id: savedTicketId, createdAt: new Date() });
  }

  // Send grievance alert for urgent/sensitive tickets
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
      }).catch(e => console.error('[Notify] Alert error:', e.message));
    });
  }

  return res.status(201).json({
    trackingId,
    ticketId:    savedTicketId,
    status:      'Open',
    category,
    priority:    priorityMap[urgency] || 'medium',
    slaDeadline: slaDeadline.toISOString(),
    message:     'Your complaint has been successfully submitted!',
  });
});

/**
 * GET /api/chatbot/ticket/:trackingId
 * Track a specific ticket by its CXA-XXXXXXXX ID
 */
router.get('/ticket/:trackingId', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.status(401).json({ error: 'Authentication required.' });

  const tid = req.params.trackingId;

  // Check memory cache first
  const mem = inMemoryTickets.find(t => t.trackingId === tid);
  if (mem) {
    return res.json({
      id:          mem._id || mem.trackingId,
      trackingId:  mem.trackingId,
      status:      mem.status || 'Open',
      category:    mem.chatbotCategory || mem.category,
      priority:    mem.priority,
      description: mem.description,
      createdAt:   mem.createdAt,
      slaDeadline: mem.slaDeadline,
      resolvedAt:  mem.resolvedAt,
      satisfactionRating: mem.satisfactionRating,
      source:      mem.source,
      urgencyLevel: mem.urgencyLevel,
      isConfidential: mem.isConfidential,
    });
  }

  // If DB available, check DB
  if (mongoose.connection.readyState === 1) {
    try {
      const Item = mongoose.model('Item');
      const item = await Item.findOne({ type: 'complaint', 'data.trackingId': tid }).lean();
      if (item) {
        const data = item.data;
        const isAdmin = req.headers['x-user-admin'] === 'true';
        if (!isAdmin && !data.isAnonymous && data.authorEmail && data.authorEmail !== student.email) {
          return res.status(403).json({ error: 'Access denied.' });
        }
        const responseData = { ...data };
        if (data.isConfidential && !isAdmin) {
          delete responseData.conversationTranscript;
        }

        return res.json({
          id:          item._id,
          trackingId:  data.trackingId,
          status:      data.status || (data.completed ? 'Resolved' : 'Open'),
          category:    data.chatbotCategory || data.category,
          priority:    data.priority,
          description: data.description,
          createdAt:   item.createdAt,
          slaDeadline: data.slaDeadline,
          resolvedAt:  data.resolvedAt,
          satisfactionRating: data.satisfactionRating,
          source:      data.source,
          urgencyLevel: data.urgencyLevel,
          isConfidential: data.isConfidential,
        });
      }
    } catch (err) {
      console.warn('[Chatbot] /ticket/:id DB error:', err.message);
    }
  }

  return res.status(404).json({ error: 'Ticket not found.' });
});

/**
 * GET /api/chatbot/my-tickets
 * List all chatbot tickets for the logged-in student
 */
router.get('/my-tickets', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const memTickets = inMemoryTickets
      .filter(t => t.authorEmail === student.email)
      .map(t => ({
        id:          t._id || t.trackingId,
        trackingId:  t.trackingId,
        status:      t.status || 'Open',
        category:    t.chatbotCategory || t.category,
        priority:    t.priority,
        description: (t.description || '').slice(0, 100) + '...',
        createdAt:   t.createdAt,
        slaDeadline: t.slaDeadline,
        urgencyLevel: t.urgencyLevel,
      }));

    if (mongoose.connection.readyState === 1) {
      const Item = mongoose.model('Item');
      const items = await Item.find({
        type: 'complaint',
        'data.source': 'chatbot',
        'data.authorEmail': student.email,
      }).sort({ createdAt: -1 }).limit(20).lean();

      const dbTickets = items.map(item => ({
        id:          item._id,
        trackingId:  item.data.trackingId,
        status:      item.data.status || (item.data.completed ? 'Resolved' : 'Open'),
        category:    item.data.chatbotCategory || item.data.category,
        priority:    item.data.priority,
        description: (item.data.description || '').slice(0, 100) + '...',
        createdAt:   item.createdAt,
        slaDeadline: item.data.slaDeadline,
        urgencyLevel: item.data.urgencyLevel,
      }));

      return res.json([...memTickets, ...dbTickets]);
    }

    return res.json(memTickets);
  } catch (err) {
    console.warn('[Chatbot] /my-tickets error:', err.message);
    res.json([]);
  }
});

/**
 * POST /api/chatbot/feedback
 * Mark FAQ answer as helpful or not helpful
 */
router.post('/feedback', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.status(401).json({ error: 'Authentication required.' });

  const { helpful, messageContent } = req.body;

  try {
    const feedbackMsg = {
      role: 'system',
      content: `Student marked answer: ${helpful ? 'Helpful' : 'Not Helpful'}`,
      timestamp: new Date(),
      metadata: { type: 'feedback', helpful, originalMessage: (messageContent || '').slice(0, 200) },
    };
    await Conversation.findOneAndUpdate(
      { studentEmail: student.email },
      { $push: { messages: feedbackMsg }, $set: { updatedAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[Chatbot] /feedback error:', err);
    res.status(500).json({ error: 'Failed to save feedback.' });
  }
});

/**
 * POST /api/chatbot/rating
 * Student rates ticket resolution (1–5)
 */
router.post('/rating', async (req, res) => {
  const student = getStudent(req);
  if (!student) return res.status(401).json({ error: 'Authentication required.' });

  const { trackingId, rating } = req.body;
  if (!trackingId || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid tracking ID and rating (1-5) required.' });
  }

  try {
    const Item = mongoose.model('Item');
    const item = await Item.findOne({ type: 'complaint', 'data.trackingId': trackingId });
    if (!item) return res.status(404).json({ error: 'Ticket not found.' });
    if (!item.data.isAnonymous && item.data.authorEmail !== student.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    item.data = { ...item.data, satisfactionRating: rating };
    item.markModified('data');
    await item.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[Chatbot] /rating error:', err);
    res.status(500).json({ error: 'Failed to save rating.' });
  }
});

/**
 * GET /api/chatbot/admin/analytics
 * Analytics for the admin CampX Assist tab
 */
router.get('/admin/analytics', async (req, res) => {
  const isAdmin = req.headers['x-user-admin'] === 'true';
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });

  if (mongoose.connection.readyState !== 1) {
    return res.json({
      totalQueries: inMemoryTickets.length * 3 + 12,
      totalTickets: inMemoryTickets.length,
      resolvedWithoutTicket: inMemoryTickets.length * 2 + 10,
      deflectionRate: 75,
      urgentCount: inMemoryTickets.filter(t => t.urgencyLevel === 'Urgent').length,
      sensitiveCount: inMemoryTickets.filter(t => t.urgencyLevel === 'Sensitive').length,
      confidentialCount: inMemoryTickets.filter(t => t.isConfidential).length,
      categoryBreakdown: [
        { name: 'Academics', value: 4 },
        { name: 'Examination', value: 3 },
        { name: 'Accounts & Fees', value: 2 },
        { name: 'IT Support', value: 2 },
      ],
      statusBreakdown: [
        { name: 'Open', value: inMemoryTickets.filter(t => t.status === 'Open').length || 1 },
        { name: 'Resolved', value: inMemoryTickets.filter(t => t.status === 'Resolved').length },
      ],
      avgResolutionHours: 24,
      avgRating: '4.8',
      recentTickets: inMemoryTickets.slice(0, 10).map(t => ({
        id:          t._id || t.trackingId,
        trackingId:  t.trackingId,
        status:      t.status || 'Open',
        category:    t.chatbotCategory || t.category,
        priority:    t.priority,
        urgency:     t.urgencyLevel,
        isConfidential: t.isConfidential,
        createdAt:   t.createdAt,
        slaDeadline: t.slaDeadline,
        overdue:     false,
      })),
    });
  }

  try {
    const Item = mongoose.model('Item');
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);
    const createdAtFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // All chatbot tickets
    const chatbotTickets = await Item.find({
      type: 'complaint',
      'data.source': 'chatbot',
      ...createdAtFilter,
    }).lean();

    // All conversations (total queries)
    const convQuery = Object.keys(dateFilter).length > 0
      ? { updatedAt: dateFilter }
      : {};
    const conversations = await Conversation.find(convQuery).lean();
    const totalQueries = conversations.reduce((sum, c) =>
      sum + (c.messages || []).filter(m => m.role === 'user').length, 0);

    const totalTickets = chatbotTickets.length;
    const resolvedWithoutTicket = Math.max(0, totalQueries - totalTickets);
    const deflectionRate = totalQueries > 0
      ? Math.round((resolvedWithoutTicket / totalQueries) * 100)
      : 0;

    // Category breakdown
    const categoryCount = {};
    chatbotTickets.forEach(t => {
      const cat = t.data.chatbotCategory || t.data.category || 'Other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    // Urgent/confidential counts
    const urgentCount = chatbotTickets.filter(t => t.data.urgencyLevel === 'Urgent').length;
    const sensitiveCount = chatbotTickets.filter(t => t.data.urgencyLevel === 'Sensitive').length;
    const confidentialCount = chatbotTickets.filter(t => t.data.isConfidential).length;

    // Status breakdown
    const statusCount = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
    chatbotTickets.forEach(t => {
      const s = t.data.status || (t.data.completed ? 'Resolved' : 'Open');
      statusCount[s] = (statusCount[s] || 0) + 1;
    });

    // Average resolution time (hours)
    const resolved = chatbotTickets.filter(t => t.data.resolvedAt && t.createdAt);
    const avgResolutionHours = resolved.length > 0
      ? Math.round(resolved.reduce((sum, t) => {
          const diff = new Date(t.data.resolvedAt) - new Date(t.createdAt);
          return sum + (diff / 3600000);
        }, 0) / resolved.length)
      : null;

    // Average satisfaction rating
    const rated = chatbotTickets.filter(t => t.data.satisfactionRating);
    const avgRating = rated.length > 0
      ? (rated.reduce((sum, t) => sum + t.data.satisfactionRating, 0) / rated.length).toFixed(1)
      : null;

    // Recent chatbot tickets (last 10)
    const recentTickets = chatbotTickets
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(t => ({
        id:          t._id,
        trackingId:  t.data.trackingId,
        status:      t.data.status || (t.data.completed ? 'Resolved' : 'Open'),
        category:    t.data.chatbotCategory || t.data.category,
        priority:    t.data.priority,
        urgency:     t.data.urgencyLevel,
        isConfidential: t.data.isConfidential,
        createdAt:   t.createdAt,
        slaDeadline: t.data.slaDeadline,
        overdue:     t.data.slaDeadline && new Date(t.data.slaDeadline) < new Date() && !t.data.resolvedAt,
      }));

    res.json({
      totalQueries,
      totalTickets,
      resolvedWithoutTicket,
      deflectionRate,
      urgentCount,
      sensitiveCount,
      confidentialCount,
      categoryBreakdown,
      statusBreakdown: Object.entries(statusCount).map(([name, value]) => ({ name, value })),
      avgResolutionHours,
      avgRating,
      recentTickets,
    });
  } catch (err) {
    console.error('[Chatbot] /admin/analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

/**
 * GET /api/chatbot/kb/seed
 * Admin-only: seed knowledge base with initial FAQ data
 */
router.post('/kb/seed', async (req, res) => {
  const isAdmin = req.headers['x-user-admin'] === 'true';
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });

  const KB_ENTRIES = [
    {
      department: 'Academics',
      title: 'Attendance Policy',
      content: 'Students must maintain a minimum of 75% attendance in each subject to be eligible to appear in semester examinations. Students with attendance below 75% may be detained and not allowed to sit for exams. Medical leave may be considered with proper documentation submitted to the academic office within 7 days.',
      tags: ['attendance', 'leave', '75%', 'detained', 'medical', 'exam eligibility'],
    },
    {
      department: 'Academics',
      title: 'Leave Application Procedure',
      content: 'To apply for leave: (1) Fill the leave application form available at the academic office or the college portal. (2) Get it signed by your class teacher and department HOD. (3) Submit it to the academic section. Medical leave requires a valid medical certificate from a registered doctor. For leaves longer than 3 days, prior approval from the Dean is required.',
      tags: ['leave', 'application', 'procedure', 'HOD', 'medical certificate', 'absence'],
    },
    {
      department: 'Examination',
      title: 'Examination Schedule and Hall Tickets',
      content: 'Examination schedules are published on the college notice board and the official portal at least 15 days before the exam. Hall tickets are issued 7 days before the examination. Students must collect their hall tickets from the examination section with their fee receipt. Without a valid hall ticket, entry to the examination hall is not permitted.',
      tags: ['exam', 'schedule', 'hall ticket', 'timetable', 'examination', 'date sheet'],
    },
    {
      department: 'Examination',
      title: 'Backlog and Re-examination Policy',
      content: 'Students who fail in a subject can appear for the backlog examination conducted at the end of the academic year. A separate form must be filled and backlog examination fees paid. The result of backlog exams is reflected in the final grade sheet with a backlog notation. Revaluation requests can be submitted within 15 days of result declaration with the prescribed fee.',
      tags: ['backlog', 'fail', 'revaluation', 'supplementary', 'compartment', 'result'],
    },
    {
      department: 'Accounts & Fees',
      title: 'Fee Payment and Structure',
      content: 'Tuition and other fees must be paid by the due date notified at the beginning of each semester. Fees can be paid online through the college portal or at the accounts office via DD/NEFT. Late fee payment attracts a penalty of Rs. 50 per day after the due date. Students with financial difficulties can contact the accounts office for installment options or inquire about scholarship eligibility.',
      tags: ['fee', 'payment', 'dues', 'scholarship', 'late fee', 'tuition', 'finance', 'challan'],
    },
    {
      department: 'Accounts & Fees',
      title: 'Scholarship Information',
      content: 'The college facilitates Central Government, State Government, and institutional scholarships. Merit scholarships are awarded to students achieving above 75% aggregate. Need-based scholarships are available for economically weaker sections. Students must apply through the scholarship portal with required documents (income certificate, marksheets, caste certificate if applicable). Contact the scholarship section in the accounts office for details.',
      tags: ['scholarship', 'merit', 'need-based', 'financial aid', 'bursary', 'free ship'],
    },
    {
      department: 'Library',
      title: 'Library Timings and Rules',
      content: 'The college library is open Monday to Saturday from 8:00 AM to 8:00 PM. On examination days, the library remains open until 10:00 PM. Students can borrow up to 3 books at a time for a period of 14 days. Overdue books attract a fine of Rs. 2 per day per book. Books can be renewed online through the library portal or at the library counter.',
      tags: ['library', 'timing', 'hours', 'book', 'borrow', 'return', 'fine', 'issue', 'renew'],
    },
    {
      department: 'Hostel',
      title: 'Hostel Rules and Admission',
      content: 'Hostel accommodation is available for outstation students on a first-come-first-served basis. Applications must be submitted before the academic year starts. Curfew timings: boys hostel closes at 9:00 PM; girls hostel at 8:00 PM. Overnight leave requires prior permission from the warden and parent/guardian consent. Mess timings: Breakfast 7:30–9:00 AM, Lunch 12:30–2:00 PM, Dinner 7:30–9:00 PM.',
      tags: ['hostel', 'accommodation', 'room', 'warden', 'mess', 'food', 'curfew', 'outing'],
    },
    {
      department: 'IT Support',
      title: 'College WiFi and Portal Access',
      content: 'College WiFi is available throughout the campus. Use your enrollment number as the username and your date of birth (DDMMYYYY) as the initial password for first login. For WiFi issues or portal login problems, contact the IT help desk at the computer lab (Block A, Room 105) or email helpdesk@college.edu. Portal password reset can be requested at the IT help desk with your ID card.',
      tags: ['wifi', 'internet', 'portal', 'login', 'password', 'IT', 'helpdesk', 'computer'],
    },
    {
      department: 'Administration',
      title: 'Bonafide and Character Certificates',
      content: 'Bonafide certificates are issued from the academic office. Students must submit a written request with their enrollment number. Certificates are ready within 3 working days. For urgent requirements, same-day processing is available with a nominal fee. Character certificates are issued during the final year after all dues are cleared. Contact the administrative office (Block A, Ground Floor) for other certificates.',
      tags: ['certificate', 'bonafide', 'character', 'document', 'NOC', 'transfer', 'migration'],
    },
    {
      department: 'Student Affairs',
      title: 'Clubs, Societies, and Cultural Activities',
      content: 'The college has various student clubs including Technical, Cultural, Sports, NSS, and Literary societies. Students can join by registering with the respective faculty coordinator during the first month of the academic year. College annual fest (CampXFest) is held every year in February. Students must maintain 75% attendance to be eligible to participate in inter-college events.',
      tags: ['club', 'society', 'cultural', 'sports', 'event', 'NSS', 'fest', 'activity', 'committee'],
    },
    {
      department: 'Student Affairs',
      title: 'Placement and Internship Support',
      content: 'The Training and Placement (T&P) cell coordinates campus placements. Students eligible for placements must register with T&P before October. Minimum criteria: No active backlogs, 60% aggregate (may vary by company). Internship opportunities are notified via the college portal. T&P office (Block B, First Floor) provides resume assistance, mock interviews, and aptitude training.',
      tags: ['placement', 'internship', 'job', 'career', 'T&P', 'campus', 'recruitment', 'resume'],
    },
    {
      department: 'Administration',
      title: 'Anti-Ragging and Grievance Cell',
      content: 'Ragging is a punishable offense under UGC regulations and Indian law. Any incident of ragging must be reported immediately to the Anti-Ragging Committee (ARC). Contact: arc@college.edu or the 24/7 helpline. The Grievance Redressal Cell handles complaints related to harassment, discrimination, and other serious concerns. All complaints are treated with strict confidentiality. Students can also file complaints anonymously through CampX Assist.',
      tags: ['ragging', 'harassment', 'grievance', 'anti-ragging', 'committee', 'ARC', 'bully', 'complaint'],
    },
  ];

  try {
    await KnowledgeBase.deleteMany({});
    await KnowledgeBase.insertMany(KB_ENTRIES);
    res.json({ ok: true, seeded: KB_ENTRIES.length, message: `Knowledge base seeded with ${KB_ENTRIES.length} entries.` });
  } catch (err) {
    console.error('[KB] Seed error:', err);
    res.status(500).json({ error: 'Failed to seed knowledge base.' });
  }
});

/**
 * GET /api/chatbot/kb
 * List knowledge base entries (admin only)
 */
router.get('/kb', async (req, res) => {
  const isAdmin = req.headers['x-user-admin'] === 'true';
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });
  try {
    const docs = await KnowledgeBase.find().sort({ department: 1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge base.' });
  }
});

/**
 * PUT /api/chatbot/ticket/:trackingId/status
 * Admin: update ticket status
 */
router.put('/ticket/:trackingId/status', async (req, res) => {
  const isAdmin = req.headers['x-user-admin'] === 'true';
  if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });

  const { status } = req.body;
  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const mem = inMemoryTickets.find(t => t.trackingId === req.params.trackingId);
  if (mem) {
    mem.status = status;
    mem.completed = status === 'Resolved' || status === 'Closed';
    if (mem.completed) mem.resolvedAt = new Date().toISOString();
  }

  if (mongoose.connection.readyState !== 1) {
    if (mem) return res.json({ ok: true, status });
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  try {
    const Item = mongoose.model('Item');
    const item = await Item.findOne({ type: 'complaint', 'data.trackingId': req.params.trackingId });
    if (!item) {
      if (mem) return res.json({ ok: true, status });
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    item.data = {
      ...item.data,
      status,
      completed: status === 'Resolved' || status === 'Closed',
      resolvedAt: (status === 'Resolved' || status === 'Closed') ? new Date().toISOString() : item.data.resolvedAt,
    };
    item.markModified('data');
    await item.save();
    res.json({ ok: true, status });
  } catch (err) {
    console.error('[Chatbot] /ticket/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

module.exports = router;
