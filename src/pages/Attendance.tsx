import { useState, useEffect } from 'react';
import { Plus, Trash2, X, CheckCircle, XCircle, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

interface AttendanceRecord {
    date: string;
    attended: boolean;
}

interface Subject {
    id: string;
    name: string;
    records: AttendanceRecord[];
    authorEmail?: string;
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: '10px',
    border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--primary)', outline: 'none', fontSize: '1rem',
    transition: 'border-color 0.3s',
};

export default function Attendance() {
    const [subjects, setSubjects] = useState<Subject[]>(() => {
        const saved = localStorage.getItem('campusAttendance');
        return saved ? JSON.parse(saved) : [];
    });
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || '{}');

    useEffect(() => {
        localStorage.setItem('campusAttendance', JSON.stringify(subjects));
    }, [subjects]);

    const addSubject = () => {
        if (!newSubjectName.trim()) return;
        const newSub: Subject = {
            id: Date.now().toString(),
            name: newSubjectName.trim(),
            records: [],
            authorEmail: currentUser.email,
        };
        setSubjects(prev => [...prev, newSub]);
        setNewSubjectName('');
        setShowAddSubject(false);
    };

    const deleteSubject = (id: string) => {
        setSubjects(prev => prev.filter(s => s.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const markAttendance = (subjectId: string, attended: boolean) => {
        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        setSubjects(prev => prev.map(s => {
            if (s.id !== subjectId) return s;
            // Check if today's record already exists
            const existing = s.records.findIndex(r => r.date === today);
            if (existing >= 0) {
                const updated = [...s.records];
                updated[existing] = { date: today, attended };
                return { ...s, records: updated };
            }
            return { ...s, records: [...s.records, { date: today, attended }] };
        }));
    };

    const getPercentage = (s: Subject) => {
        if (s.records.length === 0) return 0;
        const attended = s.records.filter(r => r.attended).length;
        return Math.round((attended / s.records.length) * 100);
    };

    const getTodayStatus = (s: Subject): 'present' | 'absent' | 'unmarked' => {
        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const record = s.records.find(r => r.date === today);
        if (!record) return 'unmarked';
        return record.attended ? 'present' : 'absent';
    };

    const getBarColor = (pct: number) => {
        if (pct >= 75) return '#51cf66';
        if (pct >= 50) return '#ffd43b';
        return '#ff6b6b';
    };

    const displayedSubjects = currentUser.isAdmin 
        ? subjects 
        : subjects.filter(s => s.authorEmail === currentUser.email);

    const totalClasses = displayedSubjects.reduce((acc, s) => acc + s.records.length, 0);
    const totalAttended = displayedSubjects.reduce((acc, s) => acc + s.records.filter(r => r.attended).length, 0);
    const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    const palette = ['#4dabf7', '#ffd43b', '#da77f2', '#51cf66', '#ff6b6b', '#ffa94d', '#74c0fc', '#e599f7'];

    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem', paddingBottom: '4rem' }}>
            <h1 className="main-title fade-in-up">Your <span>Attendance</span></h1>
            <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 2rem auto' }}>
                Track your presence. Stay above the 75% threshold.
            </p>

            {/* Summary Cards */}
            {subjects.length > 0 && (
                <div className="fade-in-up delay-2" style={{
                    display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap',
                    marginBottom: '2.5rem', maxWidth: '800px', margin: '0 auto 2.5rem auto',
                }}>
                    {[
                        { label: 'Overall', value: `${overallPct}%`, color: getBarColor(overallPct), icon: <TrendingUp size={20} /> },
                        { label: 'Total Classes', value: `${totalAttended}/${totalClasses}`, color: '#4dabf7', icon: <BookOpen size={20} /> },
                        { label: 'Subjects', value: `${displayedSubjects.length}`, color: '#da77f2', icon: <BookOpen size={20} /> },
                    ].map((card, i) => (
                        <div key={i} style={{
                            background: 'var(--glass)', border: '1px solid var(--glass-border)',
                            borderRadius: '16px', padding: '1.5rem 2rem', backdropFilter: 'blur(12px)',
                            textAlign: 'center', minWidth: '160px', flex: 1, maxWidth: '220px',
                            borderTop: `3px solid ${card.color}`,
                            transition: 'transform 0.3s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ color: card.color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{card.icon}</div>
                            <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>{card.value}</h2>
                            <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>{card.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Subject */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', justifyContent: 'center', marginBottom: '2rem',
            }}>
                <button className="btn-accent" onClick={() => setShowAddSubject(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem' }}>
                    <Plus size={18} /> Add Subject
                </button>
            </div>

            {/* Add Subject Modal */}
            {showAddSubject && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                }} onClick={() => setShowAddSubject(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'linear-gradient(135deg, rgba(20,20,30,0.98), rgba(10,10,20,0.98))',
                        border: '1px solid var(--glass-border)', borderRadius: '20px',
                        padding: '2.5rem', maxWidth: '450px', width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        animation: 'fadeInUp 0.3s ease forwards',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Add Subject</h2>
                            <button onClick={() => setShowAddSubject(false)} style={{ background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                                <X size={22} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <input type="text" placeholder="Subject Name (e.g. Data Structures)"
                                value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
                                style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                onKeyDown={e => e.key === 'Enter' && addSubject()} />
                            <button className="btn-accent" onClick={addSubject}
                                style={{ width: '100%', justifyContent: 'center', padding: '1rem', opacity: !newSubjectName.trim() ? 0.5 : 1 }}>
                                Add Subject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subjects List */}
            <div className="fade-in-up delay-3" style={{
                maxWidth: '800px', margin: '0 auto', width: '100%',
                display: 'flex', flexDirection: 'column', gap: '1rem',
            }}>
                {displayedSubjects.length === 0 && (
                    <div style={{
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        borderRadius: '16px', padding: '3rem', backdropFilter: 'blur(12px)',
                        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    }}>
                        <AlertTriangle size={40} color="var(--secondary)" style={{ opacity: 0.5 }} />
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>
                            No subjects added yet. Click "Add Subject" to start tracking.
                        </p>
                    </div>
                )}

                {displayedSubjects.map((s, idx) => {
                    const pct = getPercentage(s);
                    const todayStatus = getTodayStatus(s);
                    const accentColor = palette[idx % palette.length];
                    const attended = s.records.filter(r => r.attended).length;
                    const isExpanded = expandedId === s.id;

                    return (
                        <div key={s.id} style={{
                            background: 'var(--glass)', border: '1px solid var(--glass-border)',
                            borderRadius: '16px', backdropFilter: 'blur(12px)',
                            overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s',
                            borderLeft: `3px solid ${accentColor}`,
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            {/* Subject Header */}
                            <div style={{
                                padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem',
                                cursor: 'pointer',
                            }} onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                                <div style={{
                                    background: `${accentColor}22`, padding: '10px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <BookOpen size={20} color={accentColor} />
                                </div>
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                    <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                                        {s.name} 
                                        {currentUser.isAdmin && <span style={{fontSize: '0.8rem', opacity: 0.7, color: 'var(--accent)', marginLeft: '0.5rem'}}>({s.authorEmail})</span>}
                                    </h3>
                                    <span style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                                        {attended}/{s.records.length} classes attended
                                    </span>
                                </div>

                                {/* Percentage + bar */}
                                <div style={{ minWidth: '150px', textAlign: 'right' }}>
                                    <span style={{ color: getBarColor(pct), fontWeight: 700, fontSize: '1.3rem' }}>{pct}%</span>
                                    <div style={{
                                        width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)',
                                        borderRadius: '10px', marginTop: '6px', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${pct}%`, height: '100%', borderRadius: '10px',
                                            background: `linear-gradient(90deg, ${getBarColor(pct)}, ${getBarColor(pct)}aa)`,
                                            transition: 'width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                            boxShadow: `0 0 8px ${getBarColor(pct)}66`,
                                        }} />
                                    </div>
                                </div>

                                {/* Today's quick action */}
                                {(currentUser.isAdmin || s.authorEmail === currentUser.email) && (
                                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                        <button onClick={e => { e.stopPropagation(); markAttendance(s.id, true); }} style={{
                                            background: todayStatus === 'present' ? 'rgba(50,255,50,0.2)' : 'rgba(255,255,255,0.06)',
                                            border: todayStatus === 'present' ? '1px solid #51cf66' : '1px solid var(--glass-border)',
                                            color: todayStatus === 'present' ? '#51cf66' : 'var(--secondary)',
                                            cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                            transition: 'all 0.3s', display: 'flex', alignItems: 'center',
                                        }}
                                            onMouseEnter={e => { if (todayStatus !== 'present') { e.currentTarget.style.background = 'rgba(50,255,50,0.15)'; e.currentTarget.style.color = '#51cf66'; } }}
                                            onMouseLeave={e => { if (todayStatus !== 'present') { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--secondary)'; } }}
                                            title="Mark Present"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); markAttendance(s.id, false); }} style={{
                                            background: todayStatus === 'absent' ? 'rgba(255,50,50,0.2)' : 'rgba(255,255,255,0.06)',
                                            border: todayStatus === 'absent' ? '1px solid #ff6b6b' : '1px solid var(--glass-border)',
                                            color: todayStatus === 'absent' ? '#ff6b6b' : 'var(--secondary)',
                                            cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                            transition: 'all 0.3s', display: 'flex', alignItems: 'center',
                                        }}
                                            onMouseEnter={e => { if (todayStatus !== 'absent') { e.currentTarget.style.background = 'rgba(255,50,50,0.15)'; e.currentTarget.style.color = '#ff6b6b'; } }}
                                            onMouseLeave={e => { if (todayStatus !== 'absent') { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--secondary)'; } }}
                                            title="Mark Absent"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); deleteSubject(s.id); }} style={{
                                            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                                            color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                            transition: 'all 0.3s', display: 'flex', alignItems: 'center',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.2)'; e.currentTarget.style.borderColor = '#ff6b6b'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                            title="Delete Subject"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Expanded Detail: History log */}
                            {isExpanded && (
                                <div style={{
                                    borderTop: '1px solid var(--glass-border)', padding: '1.5rem 2rem',
                                    background: 'rgba(0,0,0,0.2)',
                                }}>
                                    <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.95rem' }}>Attendance History</h4>
                                    {s.records.length === 0 ? (
                                        <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>No records yet. Mark today's attendance above.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {[...s.records].reverse().map((r, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                    background: r.attended ? 'rgba(50,255,50,0.1)' : 'rgba(255,50,50,0.1)',
                                                    border: `1px solid ${r.attended ? '#51cf6644' : '#ff6b6b44'}`,
                                                    fontSize: '0.8rem', color: r.attended ? '#51cf66' : '#ff6b6b',
                                                }}>
                                                    {r.attended ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {r.date}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {pct < 75 && s.records.length > 0 && (
                                        <div style={{
                                            marginTop: '1rem', padding: '0.8rem 1rem', borderRadius: '10px',
                                            background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,107,107,0.3)',
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        }}>
                                            <AlertTriangle size={16} color="#ff6b6b" />
                                            <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>
                                                ⚠️ Below 75% threshold! You need {Math.ceil((0.75 * s.records.length - attended) / (1 - 0.75))} more consecutive classes to reach 75%.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
