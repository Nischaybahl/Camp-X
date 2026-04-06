import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Target, Briefcase, Zap, Type, Award, Star } from 'lucide-react';

/* ─── CONSTANTS & DICTIONARIES ─────────────────────────────────────── */
const ACTION_VERBS = ['achieved', 'improved', 'trained', 'resolved', 'managed', 'created', 'developed', 'reduced', 'increased', 'designed', 'led', 'implemented', 'orchestrated', 'spearheaded', 'maximized', 'optimized', 'generated', 'streamlined', 'coordinated', 'launched', 'delivered', 'built', 'directed', 'executed', 'established'];
const BUZZWORDS = ['hard worker', 'team player', 'synergy', 'go-getter', 'thought leader', 'results-driven', 'detail-oriented', 'self-motivated', 'dynamic', 'proactive'];

/* ─── TYPES ────────────────────────────────────────────────────────── */
interface ScoreResults {
  overall: number;
  impact: number;
  brevity: number;
  style: number;
  skills: number;
}

interface FeedbackItem {
  id: string;
  type: 'success' | 'warning' | 'error';
  category: 'content' | 'format' | 'skills' | 'style' | 'ats';
  title: string;
  desc: string;
}

export default function ResumeAnalyzer() {
  // Form State matching the template structure - Pre-filled with realistic data
  const [formData, setFormData] = useState({
    name: 'AARAV SHARMA',
    role: 'COMPUTER SCIENCE STUDENT',
    address: 'A.B. Road, Pigdamber, Rau, Indore, MP 453331',
    phone: '+91 98765 43210',
    email: 'aarav.sharma@example.in',
    skills: 'React, Node.js, Python, MongoDB\nJava, Data Structures & Algorithms, C++',
    languages: 'English (Fluent)\nHindi (Native)',
    profile: 'Dedicated Computer Science engineering student at Medi-Caps University with a strong foundation in full-stack development and cloud computing. Proven ability to apply academic concepts to real-world applications, demonstrated through internships and hackathon victories.',
    education: 'B.Tech in Computer Science and Engineering\nMedi-Caps University, Indore\nExpected graduation: May 2025\nCGPA: 8.5/10.0',
    employment: 'Software Development Intern, Tech Solutions Pvt Ltd (Jun 2023 - Aug 2023)\n- Assisted in the development of robust REST APIs using Node.js and Express.\n- Optimized database queries in MongoDB, resulting in a 15% improvement in application load times.\n\nTechnical Lead, Medi-Caps Coding Club (Sep 2022 - Present)\n- Organized multiple competitive programming workshops for over 100 students.\n- Led a dedicated team to develop the official club web portal using React.',
    projects: 'Smart Campus Attendance System (Jan 2024 - Present)\n- Developed a comprehensive web application for seamless attendance tracking using MERN stack.\n- Integrated secure student authentication and delivered real-time analytics dashboards for professors.'
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [scores, setScores] = useState<ScoreResults | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* ─── SCORING LOGIC ────────────────────────────────────────────────── */
  const runAnalysis = () => {
    setAnalyzing(true);
    
    // Combine all fields into a single text block for overall analysis
    const fullText = `
      ${formData.name} ${formData.role} 
      ${formData.address} ${formData.phone} ${formData.email}
      ${formData.skills} ${formData.languages}
      ${formData.profile}
      ${formData.education}
      ${formData.employment}
      ${formData.projects}
    `;

    const lowerText = fullText.toLowerCase();
    const words = lowerText.split(/\s+/).filter(w => w.length > 2);
    const textLength = words.length;

    if (textLength < 10) {
      setTimeout(() => {
        setScores({ overall: 0, impact: 0, brevity: 0, style: 0, skills: 0 });
        setFeedback([{ id: 'e1', type: 'error', category: 'content', title: 'Empty Template', desc: 'Please fill out your professional details in the fields above to receive a score.' }]);
        setAnalyzing(false);
      }, 400);
      return;
    }

    const sentences = fullText.match(/[^.!?]+[.!?]+/g) || fullText.split('\n').filter(s => s.trim().length > 10);
    
    let fb: FeedbackItem[] = [];

    // 1. IMPACT
    let impactScore = 50;
    const verbsFound = ACTION_VERBS.filter(v => lowerText.includes(v));
    const numbersFound = fullText.match(/\b\d+(\.\d+)?(k|m|b|%|x)?\b/ig) || [];
    
    impactScore += Math.min(verbsFound.length * 4, 30);
    impactScore += Math.min(numbersFound.length * 3, 20);
    
    if (verbsFound.length >= 4) {
      fb.push({ id: 'i1', type: 'success', category: 'content', title: 'Strong Action Verbs', desc: `Found ${verbsFound.length} powerful action verbs.` });
    } else {
      fb.push({ id: 'i1', type: 'warning', category: 'content', title: 'More Action Verbs Needed', desc: 'Use verbs like "Developed", "Led", "Optimized" in experience/projects.' });
    }

    if (numbersFound.length >= 3) {
      fb.push({ id: 'i2', type: 'success', category: 'content', title: 'Quantified Achievements', desc: `Found ${numbersFound.length} metrics to back up claims.` });
    } else {
      fb.push({ id: 'i2', type: 'warning', category: 'content', title: 'Lack of Metrics', desc: 'Add numbers (e.g., "Increased by 15%", "Team of 5") to your employment/projects.' });
    }

    // 2. BREVITY
    let brevityScore = 100;
    const longSentences = sentences.filter(s => s.split(' ').length > 25);
    
    brevityScore -= longSentences.length * 5;
    if (textLength < 80) brevityScore -= 40; // Too short, barely filled out
    if (textLength > 600) brevityScore -= 20; // Too long
    brevityScore = Math.max(0, brevityScore);

    if (longSentences.length > 2) {
      fb.push({ id: 'b1', type: 'warning', category: 'format', title: 'Wordy Sentences', desc: `Found ${longSentences.length} long sentences. Use bullet points instead of paragraphs for experience.` });
    } else {
      fb.push({ id: 'b1', type: 'success', category: 'format', title: 'Concise Formatting', desc: 'Sentence lengths look good for quick scanning.' });
    }
    
    // 3. STYLE
    let styleScore = 100;
    const buzzwordsFound = BUZZWORDS.filter(w => lowerText.includes(w));
    styleScore -= buzzwordsFound.length * 10;
    
    if (buzzwordsFound.length > 0) {
      fb.push({ id: 's1', type: 'warning', category: 'style', title: 'Overused Buzzwords', desc: `Remove empty buzzwords like "${buzzwordsFound.join('", "')}". Show your skills through actions instead.` });
    } else {
      fb.push({ id: 's1', type: 'success', category: 'style', title: 'Professional Vocabulary', desc: 'No cliché buzzwords detected.' });
    }

    // Check basic contact info
    if (formData.email && formData.phone) {
      fb.push({ id: 's2', type: 'success', category: 'format', title: 'Contact Info Present', desc: 'Email and phone number are properly filled out.' });
    } else {
      styleScore -= 20;
      fb.push({ id: 's2', type: 'error', category: 'format', title: 'Missing Contact Details', desc: 'Make sure to provide your email and phone number details.' });
    }

    // 4. SKILLS & SECTIONS
    let skillsScore = 50;
    
    // Check if sections are filled
    const filledSections = [formData.education, formData.employment, formData.projects].filter(v => v.length > 20);
    skillsScore += filledSections.length * 10;
    
    if (filledSections.length === 3) {
      fb.push({ id: 'k1', type: 'success', category: 'ats', title: 'Core Sections Completed', desc: 'Education, Employment, and Projects sections are populated.' });
    } else {
      fb.push({ id: 'k1', type: 'warning', category: 'ats', title: 'Empty Sections', desc: 'Fill out Education, Employment, and Projects thoroughly.' });
    }

    const techSkills = ['javascript', 'python', 'react', 'node', 'java', 'sql', 'aws', 'docker', 'c++', 'html', 'css', 'git', 'api'].filter(s => formData.skills.toLowerCase().includes(s) || lowerText.includes(s));
    skillsScore += Math.min(techSkills.length * 4, 20);

    if (techSkills.length >= 3) {
      fb.push({ id: 'k2', type: 'success', category: 'skills', title: 'Identifiable Hard Skills', desc: `Detected skills like ${techSkills.slice(0, 3).join(', ')}.` });
    } else {
      fb.push({ id: 'k2', type: 'warning', category: 'skills', title: 'Low Hard Skill Density', desc: 'Ensure your technical skills are explicitly listed in the Skills field.' });
    }

    const calculatedScores = {
      impact: Math.min(100, Math.max(0, impactScore)),
      brevity: Math.min(100, Math.max(0, brevityScore)),
      style: Math.min(100, Math.max(0, styleScore)),
      skills: Math.min(100, Math.max(0, skillsScore))
    };
    
    const overall = Math.round((calculatedScores.impact * 0.35) + (calculatedScores.brevity * 0.2) + (calculatedScores.style * 0.2) + (calculatedScores.skills * 0.25));
    
    // Fake loading delay for UX
    setTimeout(() => {
      setScores({ ...calculatedScores, overall });
      setFeedback(fb);
      setAnalyzing(false);
      
      // Auto scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }, 1500);
  };

  /* ─── UI COMPONENTS ────────────────────────────────────────────────── */
  const getScoreColor = (sc: number) => {
    if (sc >= 80) return '#34c759'; // Green
    if (sc >= 60) return '#ffcc00'; // Yellow
    return '#ff3b30'; // Red
  };

  const getScoreLabel = (sc: number) => {
    if (sc >= 80) return 'Excellent';
    if (sc >= 60) return 'Good';
    return 'Needs Work';
  };

  return (
    <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', background: '#0a0a0c', color: '#fff', paddingTop: '80px', paddingBottom: '100px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 20 }}>
        
        {/* HERO TITLE */}
        <div style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '3rem', animation: 'fadeInUp 0.6s ease' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a0a0a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fill details to score your resume
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto' }}>
            Enter your details into our ATS-friendly template below. Hit analyze to magically check impact, formatting, and skill density.
          </p>
        </div>

        {/* RESUME TEMPLATE BUIlDER */}
        <div style={{ 
          background: '#fff', color: '#000', borderRadius: '8px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden',
          display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2.5fr',
          minHeight: '800px', animation: 'fadeInUp 0.8s ease',
          marginBottom: '3rem', position: 'relative', zIndex: 50, pointerEvents: 'auto'
        }}>
          
          {/* LEFT SIDEBAR (Darker or Light Gray) */}
          <div style={{ background: '#f8f9fa', padding: '2.5rem 2rem', borderRight: '1px solid #eaeaea' }}>
            
            <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#333' }}>Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} style={inputStyle} rows={2} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Phone</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Email</label>
                <input name="email" value={formData.email} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#333' }}>Skills</h3>
            <div style={{ marginBottom: '3rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>List your tools & frameworks</label>
              <textarea name="skills" value={formData.skills} onChange={handleInputChange} style={inputStyle} rows={5} />
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#333' }}>Languages</h3>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.3rem' }}>Known languages</label>
              <textarea name="languages" value={formData.languages} onChange={handleInputChange} style={inputStyle} rows={4} />
            </div>

          </div>

          {/* MAIN BODY AREA */}
          <div style={{ padding: '3.5rem' }}>
            
            {/* Header info */}
            <div style={{ borderBottom: '2px solid #222', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
              <input 
                name="name" value={formData.name} onChange={handleInputChange} 
                style={{ ...inputStyle, fontSize: '2.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', padding: 0, background: 'transparent', height: 'auto', border: 'none' }} 
              />
              <input 
                name="role" value={formData.role} onChange={handleInputChange} 
                style={{ ...inputStyle, fontSize: '1.2rem', fontWeight: 500, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', padding: 0, background: 'transparent', border: 'none', marginTop: '0.5rem' }} 
              />
            </div>

            {/* Profile */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#222', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Profile</h3>
              <textarea 
                name="profile" value={formData.profile} onChange={handleInputChange} 
                style={{ ...inputStyle, minHeight: '80px' }} 
              />
            </div>

            {/* Education */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#222', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Education</h3>
              <textarea 
                name="education" value={formData.education} onChange={handleInputChange} 
                style={{ ...inputStyle, minHeight: '120px' }} 
              />
            </div>

            {/* Employment History */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#222', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Employment History</h3>
              <textarea 
                name="employment" value={formData.employment} onChange={handleInputChange} 
                style={{ ...inputStyle, minHeight: '180px' }} 
              />
            </div>

            {/* Projects */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#222', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Projects</h3>
              <textarea 
                name="projects" value={formData.projects} onChange={handleInputChange} 
                style={{ ...inputStyle, minHeight: '150px' }} 
              />
            </div>

          </div>
        </div>

        {/* ANALYZE BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: scores ? '4rem' : '0', position: 'relative', zIndex: 50 }}>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); runAnalysis(); }}
            disabled={analyzing}
            style={{
              background: '#ccff00', color: '#000', border: 'none', padding: '1rem 3rem',
              borderRadius: '30px', fontSize: '1.2rem', fontWeight: 700, cursor: analyzing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.8rem',
              transition: 'all 0.2s', opacity: analyzing ? 0.8 : 1,
              boxShadow: '0 10px 25px rgba(204,255,0,0.2)',
              position: 'relative', zIndex: 60, pointerEvents: 'auto'
            }}
            onMouseEnter={e => !analyzing && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => !analyzing && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {analyzing ? (
              <>Analyzing Setup...</>
            ) : (
              <><Zap fill="#000" /> Score My Resume</>
            )}
          </button>
        </div>


        {/* RESULTS SECTION */}
        {scores && (
          <div style={{ animation: 'fadeInUp 0.8s ease', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
              <Star size={32} color="#ccff00" fill="#ccff00" />
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Analysis Results</h2>
              <Star size={32} color="#ccff00" fill="#ccff00" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '2.5rem', alignItems: 'start' }}>
              
              {/* Left Column: Scores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Overall Score */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.5rem', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Overall Score</p>
                  <div style={{ 
                    width: '160px', height: '160px', borderRadius: '50%', margin: '0 auto',
                    border: `10px solid ${getScoreColor(scores.overall)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 40px ${getScoreColor(scores.overall)}40`
                  }}>
                    <span style={{ fontSize: '3.5rem', fontWeight: 800 }}>{scores.overall}</span>
                  </div>
                  <h3 style={{ marginTop: '1.5rem', fontSize: '1.5rem', color: getScoreColor(scores.overall) }}>{getScoreLabel(scores.overall)}</h3>
                </div>

                {/* Sub Scores */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff' }}>Category Breakdown</h4>
                  
                  {[
                    { label: 'Impact (Verbs & Metrics)', score: scores.impact, icon: Zap },
                    { label: 'Brevity & Formatting', score: scores.brevity, icon: Type },
                    { label: 'Writing Style', score: scores.style, icon: Award },
                    { label: 'Skills Density', score: scores.skills, icon: Briefcase },
                  ].map((s, i) => (
                    <div key={i} style={{ marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.8)' }}>
                          <s.icon size={16} color="rgba(255,255,255,0.6)" /> {s.label}
                        </span>
                        <span style={{ fontWeight: 700, color: getScoreColor(s.score) }}>{s.score}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                        <div style={{ width: `${s.score}%`, height: '100%', background: getScoreColor(s.score), borderRadius: '4px', transition: 'width 1s ease-out' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Feedback List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Target size={24} color="#00d4ff" /> Improvement Recommendations
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {feedback.map(fb => (
                      <div key={fb.id} style={{ 
                        display: 'flex', gap: '1.2rem', padding: '1.2rem', borderRadius: '16px',
                        background: fb.type === 'success' ? 'rgba(52,199,89,0.05)' : fb.type === 'warning' ? 'rgba(255,204,0,0.05)' : 'rgba(255,59,48,0.05)',
                        border: `1px solid ${fb.type === 'success' ? 'rgba(52,199,89,0.2)' : fb.type === 'warning' ? 'rgba(255,204,0,0.2)' : 'rgba(255,59,48,0.2)'}`
                      }}>
                        {fb.type === 'success' ? <CheckCircle size={24} color="#34c759" style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={24} color={fb.type === 'warning' ? '#ffcc00' : '#ff3b30'} style={{ flexShrink: 0, marginTop: '2px' }} />}
                        <div>
                          <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 600 }}>{fb.title}</h4>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{fb.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(0,0,0,0.15)',
  background: 'rgba(0,0,0,0.03)',
  padding: '1rem',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  color: '#222',
  resize: 'vertical',
  transition: 'all 0.2s',
  outline: 'none',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
  position: 'relative',
  zIndex: 100,
  pointerEvents: 'auto'
};

// Override on focus via global CSS logic implicitly if needed, but styling on focus is mostly handled by browser defaults or we can add a specific class.
