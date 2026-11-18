/**
 * Comprehensive verification test suite for CampX Assist AI & Knowledge Base
 * Runs self-contained without needing node_modules or internet.
 */

// Mock express & mongoose if not installed
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (moduleName) {
  if (moduleName === 'express') {
    const fn = function () { return fn; };
    fn.Router = function () {
      return {
        post: () => {},
        get: () => {},
        put: () => {},
        delete: () => {},
        use: () => {},
      };
    };
    return fn;
  }
  if (moduleName === 'mongoose') {
    const Schema = function () {
      return { index: () => {} };
    };
    return {
      Schema,
      model: () => ({
        find: () => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) }),
        findOne: async () => null,
      }),
      connection: { readyState: 0 },
    };
  }
  if (moduleName === '../services/notificationService') {
    return {
      sendGrievanceAlert: async () => true,
      sendTicketStatusUpdate: async () => true,
    };
  }
  return originalRequire.apply(this, arguments);
};

const { classifyMessage, checkConversationalIntent, getSLADeadline, SENSITIVE_KEYWORDS } = require('./services/aiService');
const { searchMemoryKB, extractKeywords, DEFAULT_KB_ENTRIES } = require('./routes/chatbot');

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING CAMPX ASSIST VERIFICATION TESTS');
  console.log('======================================================\n');

  // ── TEST SUITE 1: Keyword Extraction & Stopwords ────────────────
  console.log('--- Test Suite 1: Keyword Extraction & Stopwords ---');
  const tokens1 = extractKeywords('What is the attendance policy for semester exams?');
  assert(tokens1.includes('attendance') && tokens1.includes('policy') && tokens1.includes('exams'),
    'Extracts significant keywords', JSON.stringify(tokens1));
  assert(!tokens1.includes('the') && !tokens1.includes('what') && !tokens1.includes('for'),
    'Filters out common stopwords', JSON.stringify(tokens1));

  const tokens2 = extractKeywords('Can you please tell me how to get my hall ticket?');
  assert(tokens2.includes('hall') && tokens2.includes('ticket'),
    'Extracts hall and ticket', JSON.stringify(tokens2));
  assert(!tokens2.includes('can') && !tokens2.includes('you') && !tokens2.includes('please') && !tokens2.includes('tell') && !tokens2.includes('get'),
    'Filters conversational filler words', JSON.stringify(tokens2));

  // ── TEST SUITE 2: Conversational Intents ────────────────────────
  console.log('\n--- Test Suite 2: Conversational Intents ---');
  const greet1 = checkConversationalIntent('hello');
  assert(greet1 !== null && greet1.answer.includes('CampX Assist'), 'Recognizes "hello" greeting', JSON.stringify(greet1));

  const greet2 = checkConversationalIntent('Good morning!');
  assert(greet2 !== null && greet2.answer.includes('CampX Assist'), 'Recognizes "Good morning" greeting');

  const cap1 = checkConversationalIntent('Who are you and what can you do?');
  assert(cap1 !== null && cap1.answer.includes('Academics') && cap1.answer.includes('Examinations'),
    'Recognizes bot identity & capability query');

  const thanks = checkConversationalIntent('Thank you so much!');
  assert(thanks !== null && thanks.answer.includes('welcome'), 'Recognizes gratitude');

  const bye = checkConversationalIntent('Goodbye, see you tomorrow');
  assert(bye !== null && bye.answer.includes('Goodbye'), 'Recognizes farewell');

  // ── TEST SUITE 3: Sensitive & Urgent Grievance Detection ────────
  console.log('\n--- Test Suite 3: Urgent & Sensitive Grievances ---');
  const raggingRes = await classifyMessage('I was ragged and bullied by seniors in the hostel');
  assert(raggingRes.isSensitive === true && raggingRes.urgency === 'Urgent',
    'Detects ragging query as Urgent/Sensitive', JSON.stringify(raggingRes));
  assert(raggingRes.answer.includes('Grievance') || raggingRes.answer.includes('Anti-Ragging'),
    'Provides immediate grievance escalation guidance');

  const harassRes = await classifyMessage('Someone is threatening and harassing me near the lab');
  assert(harassRes.isSensitive === true && harassRes.urgency === 'Urgent',
    'Detects harassment as Urgent', JSON.stringify(harassRes));

  // SLA calculations per SDS
  const slaRoutine = getSLADeadline('Routine');
  const slaUrgent = getSLADeadline('Urgent');
  const slaSensitive = getSLADeadline('Sensitive');
  const now = Date.now();
  const diffHours = (sla) => Math.round((sla.getTime() - now) / (1000 * 60 * 60));
  assert(diffHours(slaRoutine) === 72, 'Routine SLA is 72 hours', `${diffHours(slaRoutine)}h`);
  assert(diffHours(slaUrgent) === 24, 'Urgent SLA is 24 hours', `${diffHours(slaUrgent)}h`);
  assert(diffHours(slaSensitive) === 4, 'Sensitive SLA is 4 hours', `${diffHours(slaSensitive)}h`);

  // ── TEST SUITE 4: KnowledgeBase Grounding (College FAQs) ─────────
  console.log('\n--- Test Suite 4: KnowledgeBase Matching (Precision & Relevance) ---');

  // Test 4A: Attendance
  const attendMatches = searchMemoryKB('How much attendance is required to sit for exams?');
  assert(attendMatches.length > 0 && attendMatches[0].title.includes('Attendance Policy'),
    'Matches Attendance Policy correctly', attendMatches[0]?.title);

  // Test 4B: Leave
  const leaveMatches = searchMemoryKB('How do I apply for sick leave?');
  assert(leaveMatches.length > 0 && leaveMatches[0].title.includes('Leave Application'),
    'Matches Leave Application correctly', leaveMatches[0]?.title);

  // Test 4C: Hall ticket
  const hallTicketMatches = searchMemoryKB('When will the hall ticket be released?');
  assert(hallTicketMatches.length > 0 && hallTicketMatches[0].title.includes('Hall Tickets'),
    'Matches Hall Tickets correctly', hallTicketMatches[0]?.title);

  // Test 4D: Backlog
  const backlogMatches = searchMemoryKB('What is the procedure for backlog examinations?');
  assert(backlogMatches.length > 0 && backlogMatches[0].title.includes('Backlog'),
    'Matches Backlog policy correctly', backlogMatches[0]?.title);

  // Test 4E: Fees installment
  const feeMatches = searchMemoryKB('Can I pay my semester fees in installments?');
  assert(feeMatches.length > 0 && (feeMatches[0].title.includes('Installment') || feeMatches[0].title.includes('Fee')),
    'Matches Fee Installment correctly', feeMatches[0]?.title);

  // Test 4F: WiFi
  const wifiMatches = searchMemoryKB('How do I connect to college WiFi and what is the password?');
  assert(wifiMatches.length > 0 && wifiMatches[0].title.includes('WiFi'),
    'Matches WiFi credentials correctly', wifiMatches[0]?.title);

  // Test 4G: Library
  const libMatches = searchMemoryKB('What are the library timings and book borrowing rules?');
  assert(libMatches.length > 0 && libMatches[0].title.includes('Library'),
    'Matches Library timings correctly', libMatches[0]?.title);

  // Test 4H: Hostel curfew
  const hostelMatches = searchMemoryKB('What are the hostel curfew timings for boys and girls?');
  assert(hostelMatches.length > 0 && hostelMatches[0].title.includes('Hostel'),
    'Matches Hostel Curfew correctly', hostelMatches[0]?.title);

  // ── TEST SUITE 5: Preventing Irrelevant Answers (Critical Test) ──
  console.log('\n--- Test Suite 5: Preventing Irrelevant Answers (False Positives) ---');

  // Completely irrelevant queries MUST return 0 matches from KB
  const irrelevants = [
    'Where can I eat pizza or burgers?',
    'What is the weather in New York today?',
    'Who won the football world cup?',
    'Can you write a python script for fibonacci numbers?',
    'I want to watch a movie tonight',
    'What is 45 plus 55?',
  ];

  for (const q of irrelevants) {
    const matches = searchMemoryKB(q);
    assert(matches.length === 0, `Irrelevant query returned 0 KB matches: "${q}"`,
      matches.map(m => m.title).join(', '));
  }

  // ── TEST SUITE 6: Classification Cascade End-to-End ─────────────
  console.log('\n--- Test Suite 6: Full Classification Cascade ---');

  // Greeting
  const endToEndGreeting = await classifyMessage('Hey there!');
  assert(endToEndGreeting.answer !== null && endToEndGreeting.answer.includes('CampX Assist'),
    'End-to-end Greeting answers naturally');

  // College Question without LLM key
  const endToEndCollege = await classifyMessage('What is the minimum attendance?');
  assert(endToEndCollege.category === 'Academics',
    'End-to-end Academics category classification', endToEndCollege.category);

  console.log('\n======================================================');
  console.log(`TEST RUN COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
