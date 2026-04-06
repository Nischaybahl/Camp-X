import { FileText, Download, Calendar } from 'lucide-react';

export default function PYQ() {
  const papers = [
    { title: "Data Structures - Midterm", year: "2024", professor: "Dr. Sharma", downloads: 145 },
    { title: "Operating Systems - Final", year: "2023", professor: "Prof. Verma", downloads: 320 },
    { title: "Computer Networks - Quiz 1", year: "2025", professor: "Dr. Reddy", downloads: 89 },
    { title: "Database Systems - Final", year: "2022", professor: "Prof. Gupta", downloads: 412 },
  ];

  return (
    <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem' }}>
      <h1 className="main-title fade-in-up" style={{ fontSize: '3.5rem' }}>Previous Year <span>Questions</span></h1>
      <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 3rem auto' }}>
        Ace your exams by practicing with past papers from previous semesters.
      </p>

      <div className="search-filters fade-in-up delay-1" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <select style={{ padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--primary)', outline: 'none' }}>
          <option style={{color:'black'}} value="cs">Computer Science</option>
          <option style={{color:'black'}} value="ec">Electronics</option>
          <option style={{color:'black'}} value="me">Mechanical</option>
        </select>
        <select style={{ padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--primary)', outline: 'none' }}>
          <option style={{color:'black'}} value="sem1">Semester 1</option>
          <option style={{color:'black'}} value="sem2">Semester 2</option>
          <option style={{color:'black'}} value="sem3">Semester 3</option>
          <option style={{color:'black'}} value="sem4">Semester 4</option>
        </select>
        <button className="btn-accent" style={{ padding: '0.8rem 2rem' }}>Filter</button>
      </div>

      <div className="papers-grid fade-in-up delay-2" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', margin: '0 auto'
      }}>
        {papers.map((p, i) => (
          <div key={i} className="pyq-card" style={{
            background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(12px)', transition: 'background 0.3s', textAlign: 'left', display: 'flex', flexDirection: 'column'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass)'}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <div style={{ background: 'rgba(204, 255, 0, 0.1)', padding: '10px', borderRadius: '10px' }}>
                  <FileText color="var(--accent)" size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>{p.title}</h3>
                  <span style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>{p.professor}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                <Calendar size={14} /> {p.year}
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <Download size={16} /> Get PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
