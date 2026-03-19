import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Book, FileText, X, FolderOpen } from 'lucide-react';

interface Note {
    id: string;
    title: string;
    subject: string;
    content: string;
    createdAt: string;
    authorEmail?: string;
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: '10px',
    border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--primary)', outline: 'none', fontSize: '1rem',
    transition: 'border-color 0.3s',
};

export default function Notes() {
    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = localStorage.getItem('campusNotes');
        return saved ? JSON.parse(saved) : [];
    });
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || '{}');

    useEffect(() => {
        localStorage.setItem('campusNotes', JSON.stringify(notes));
    }, [notes]);

    const resetForm = () => {
        setTitle(''); setSubject(''); setContent(''); setShowForm(false);
    };

    const handleAdd = () => {
        if (!title.trim() || !content.trim()) return;
        const newNote: Note = {
            id: Date.now().toString(),
            title, subject: subject || 'General', content,
            createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            authorEmail: currentUser.email,
        };
        setNotes(prev => [newNote, ...prev]);
        resetForm();
    };

    const handleDelete = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const filtered = notes.filter(n => {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    });

    // Group notes by subject
    const grouped = filtered.reduce<Record<string, Note[]>>((acc, note) => {
        const key = note.subject;
        if (!acc[key]) acc[key] = [];
        acc[key].push(note);
        return acc;
    }, {});

    const subjectColors: Record<string, string> = {};
    const palette = ['#4dabf7', '#ffd43b', '#da77f2', '#51cf66', '#ff6b6b', '#ffa94d', '#74c0fc', '#e599f7'];
    const allSubjects = Object.keys(grouped);
    allSubjects.forEach((s, i) => { subjectColors[s] = palette[i % palette.length]; });

    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem', paddingBottom: '4rem' }}>
            <h1 className="main-title fade-in-up">Digital <span>Notes</span></h1>
            <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 2rem auto' }}>
                Store, search, and organize your class notes in one place.
            </p>

            {/* Top Actions */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center',
                flexWrap: 'wrap', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem auto',
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '450px' }}>
                    <input type="text" placeholder="Search notes by title, subject, or content..."
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            ...inputStyle, paddingLeft: '3rem',
                            borderColor: searchQuery ? 'var(--accent)' : 'var(--glass-border)',
                            borderRadius: '30px',
                        }} />
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} size={20} />
                </div>
                <button className="btn-accent" onClick={() => { resetForm(); setShowForm(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem', whiteSpace: 'nowrap' }}>
                    <Plus size={18} /> Add Note
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                }} onClick={() => resetForm()}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'linear-gradient(135deg, rgba(20,20,30,0.98), rgba(10,10,20,0.98))',
                        border: '1px solid var(--glass-border)', borderRadius: '20px',
                        padding: '2.5rem', maxWidth: '550px', width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                        animation: 'fadeInUp 0.3s ease forwards',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>New Note</h2>
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                                <X size={22} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <input type="text" placeholder="Note Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <input type="text" placeholder="Subject (e.g. Data Structures)" value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <textarea rows={6} placeholder="Write your note content here..." value={content}
                                onChange={e => setContent(e.target.value)}
                                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <button className="btn-accent" onClick={handleAdd}
                                style={{ width: '100%', justifyContent: 'center', padding: '1rem', opacity: (!title.trim() || !content.trim()) ? 0.5 : 1 }}>
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Display */}
            <div className="fade-in-up delay-3" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                {filtered.length === 0 && (
                    <div style={{
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        borderRadius: '16px', padding: '3rem', backdropFilter: 'blur(12px)',
                        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    }}>
                        <FolderOpen size={40} color="var(--secondary)" style={{ opacity: 0.5 }} />
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>
                            {searchQuery ? 'No notes match your search.' : 'No notes yet. Click "Add Note" to create one.'}
                        </p>
                    </div>
                )}

                {Object.entries(grouped).map(([subjectName, subjectNotes]) => (
                    <div key={subjectName} style={{ marginBottom: '2.5rem' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem',
                            paddingLeft: '0.5rem',
                        }}>
                            <Book size={18} color={subjectColors[subjectName]} />
                            <h3 style={{ color: subjectColors[subjectName], fontSize: '1.1rem', fontWeight: 600 }}>
                                {subjectName}
                            </h3>
                            <span style={{
                                background: `${subjectColors[subjectName]}22`,
                                color: subjectColors[subjectName],
                                padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                            }}>{subjectNotes.length} note{subjectNotes.length > 1 ? 's' : ''}</span>
                        </div>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem',
                        }}>
                            {subjectNotes.map(note => (
                                <div key={note.id} style={{
                                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                                    borderRadius: '14px', padding: '1.5rem', backdropFilter: 'blur(12px)',
                                    transition: 'transform 0.3s, box-shadow 0.3s, background 0.3s',
                                    display: 'flex', flexDirection: 'column', textAlign: 'left',
                                    borderTop: `3px solid ${subjectColors[subjectName]}`,
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.4)`;
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.background = 'var(--glass)';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <FileText size={18} color={subjectColors[subjectName]} />
                                            <h4 style={{ fontSize: '1.05rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                {note.title}
                                            </h4>
                                        </div>
                                        {(currentUser.isAdmin || note.authorEmail === currentUser.email) && (
                                            <button onClick={() => handleDelete(note.id)} style={{
                                                background: 'transparent', border: 'none', color: '#ff6b6b',
                                                cursor: 'pointer', padding: '4px', borderRadius: '6px',
                                                transition: 'background 0.3s', flexShrink: 0,
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,50,50,0.2)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                    <p style={{
                                        color: 'var(--secondary)', fontSize: '0.9rem', lineHeight: 1.6,
                                        flex: 1, whiteSpace: 'pre-wrap',
                                        maxHeight: '120px', overflow: 'hidden',
                                        WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                                        maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                                    }}>{note.content}</p>
                                    <span style={{ color: 'var(--secondary)', fontSize: '0.78rem', opacity: 0.6, marginTop: '0.8rem' }}>
                                        {note.createdAt}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
