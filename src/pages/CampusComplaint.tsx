import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, CheckCircle, Circle, X, AlertTriangle } from 'lucide-react';
import { fetchItems, createItem, updateItem } from '../utils/apiClient';

export interface Complaint {
    id: string;
    name: string;
    category: string;
    description: string;
    completed: boolean;
    createdAt: string;
    authorEmail?: string;
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: '10px',
    border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--primary)', outline: 'none', fontSize: '1rem',
    transition: 'border-color 0.3s',
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
};

const glassCard: React.CSSProperties = {
    background: 'var(--glass)', border: '1px solid var(--glass-border)',
    borderRadius: '16px', padding: '1.5rem 2rem', backdropFilter: 'blur(12px)',
    transition: 'transform 0.3s, box-shadow 0.3s, background 0.3s',
};

export default function CampusComplaint() {

    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('infra');
    const [description, setDescription] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || '{}');

    // Fetch from backend
    useEffect(() => {
        fetchItems<Complaint>('complaint', 'campusComplaints').then(data => {
            setComplaints(data);
        });
    }, []);

    const resetForm = () => {
        setName(''); setCategory('infra'); setDescription('');
        setEditingId(null); setShowForm(false);
    };

    const handleSubmit = () => {
        if (!name.trim() || !description.trim()) return;
        if (editingId) {
            const updated = complaints.find(c => c.id === editingId);
            if (updated) {
                const newC = { ...updated, name, category, description };
                setComplaints(prev => prev.map(c => c.id === editingId ? newC : c));
                updateItem('complaint', editingId, newC, 'campusComplaints', complaints);
            }
        } else {
            const newComplaint: Complaint = {
                id: Date.now().toString(),
                name, category, description,
                completed: false,
                createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                authorEmail: currentUser.email,
            };
            setComplaints(prev => [newComplaint, ...prev]);
            createItem('complaint', newComplaint, 'campusComplaints', complaints);
        }
        resetForm();
    };

    const handleEdit = (c: Complaint) => {
        setName(c.name); setCategory(c.category); setDescription(c.description);
        setEditingId(c.id); setShowForm(true);
    };

    const handleDelete = (id: string) => {
        setComplaints(prev => prev.filter(c => c.id !== id));
        fetch(`http://localhost:5000/api/items/complaint/${id}`, { method: 'DELETE' }).catch(() => {
            const updated = complaints.filter(c => c.id !== id);
            localStorage.setItem('campusComplaints', JSON.stringify(updated));
        });
    };

    const toggleComplete = (id: string) => {
        const c = complaints.find(comp => comp.id === id);
        if (!c) return;
        const newC = { ...c, completed: !c.completed };
        setComplaints(prev => prev.map(comp => comp.id === id ? newC : comp));
        updateItem('complaint', id, newC, 'campusComplaints', complaints);
    };

    const filtered = complaints.filter(c => {
        if (filter === 'active') return !c.completed;
        if (filter === 'completed') return c.completed;
        return true;
    });

    const categoryLabel = (cat: string) => {
        if (cat === 'infra') return 'Infrastructure';
        if (cat === 'academic') return 'Academic';
        if (cat === 'hostel') return 'Hostel';
        return cat;
    };

    const categoryColor = (cat: string) => {
        if (cat === 'infra') return '#4dabf7';
        if (cat === 'academic') return '#ffd43b';
        if (cat === 'hostel') return '#da77f2';
        return 'var(--accent)';
    };

    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem', paddingBottom: '4rem' }}>
            <h1 className="main-title fade-in-up">Campus <span>Complaints</span></h1>
            <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 2rem auto' }}>
                We take every issue seriously. File, track, and manage your complaints.
            </p>

            {/* Action Bar */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center',
                flexWrap: 'wrap', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem auto',
            }}>
                <button className="btn-accent" onClick={() => { resetForm(); setShowForm(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem' }}>
                    <Plus size={18} /> Add Complaint
                </button>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass)', borderRadius: '30px', padding: '0.3rem', border: '1px solid var(--glass-border)' }}>
                    {(['all', 'active', 'completed'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: '0.5rem 1.2rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            background: filter === f ? 'var(--accent)' : 'transparent',
                            color: filter === f ? '#000' : 'var(--secondary)',
                            fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s', textTransform: 'capitalize',
                        }}>{f}</button>
                    ))}
                </div>
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
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                                {editingId ? 'Edit Complaint' : 'New Complaint'}
                            </h2>
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                                <X size={22} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
                                <option style={{ color: '#000', background: '#222' }} value="infra">Infrastructure</option>
                                <option style={{ color: '#000', background: '#222' }} value="academic">Academic</option>
                                <option style={{ color: '#000', background: '#222' }} value="hostel">Hostel</option>
                            </select>
                            <textarea rows={4} placeholder="Describe your issue..." value={description}
                                onChange={e => setDescription(e.target.value)}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <button className="btn-accent" onClick={handleSubmit}
                                style={{ width: '100%', justifyContent: 'center', padding: '1rem', opacity: (!name.trim() || !description.trim()) ? 0.5 : 1 }}>
                                {editingId ? 'Update Complaint' : 'Submit Complaint'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complaints List */}
            <div className="fade-in-up delay-3" style={{
                display: 'flex', flexDirection: 'column', gap: '1rem',
                maxWidth: '800px', margin: '0 auto', width: '100%',
            }}>
                {filtered.length === 0 && (
                    <div style={{
                        ...glassCard, textAlign: 'center', padding: '3rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    }}>
                        <AlertTriangle size={40} color="var(--secondary)" style={{ opacity: 0.5 }} />
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>
                            {filter === 'all' ? 'No complaints yet. Click "Add Complaint" to get started.' : `No ${filter} complaints.`}
                        </p>
                    </div>
                )}

                {filtered.map(c => (
                    <div key={c.id} style={{
                        ...glassCard,
                        display: 'flex', alignItems: 'flex-start', gap: '1rem',
                        opacity: c.completed ? 0.6 : 1,
                        borderLeft: `3px solid ${categoryColor(c.category)}`,
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                        {/* Toggle Complete */}
                        {(currentUser.isAdmin || c.authorEmail === currentUser.email) && (
                            <button onClick={() => toggleComplete(c.id)} style={{
                                background: 'transparent', border: 'none', cursor: 'pointer', color: c.completed ? 'var(--accent)' : 'var(--secondary)',
                                marginTop: '2px', transition: 'color 0.3s', flexShrink: 0,
                            }}>
                                {c.completed ? <CheckCircle size={22} /> : <Circle size={22} />}
                            </button>
                        )}

                        {/* Content */}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <h3 style={{
                                    fontSize: '1.1rem', color: 'var(--primary)',
                                    textDecoration: c.completed ? 'line-through' : 'none',
                                }}>{c.name}</h3>
                                <span style={{
                                    padding: '0.2rem 0.7rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                    background: `${categoryColor(c.category)}22`, color: categoryColor(c.category),
                                }}>{categoryLabel(c.category)}</span>
                                {c.completed && (
                                    <span style={{
                                        padding: '0.2rem 0.7rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                        background: 'rgba(50,255,50,0.15)', color: '#51cf66',
                                    }}>Resolved</span>
                                )}
                            </div>
                            <p style={{
                                color: 'var(--secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '0.5rem',
                                textDecoration: c.completed ? 'line-through' : 'none',
                            }}>{c.description}</p>
                            <span style={{ color: 'var(--secondary)', fontSize: '0.8rem', opacity: 0.7 }}>{c.createdAt}</span>
                        </div>

                        {/* Actions */}
                        {(currentUser.isAdmin || c.authorEmail === currentUser.email) && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <button onClick={() => handleEdit(c)} style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                                    color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                    transition: 'all 0.3s', display: 'flex', alignItems: 'center',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(77,171,247,0.2)'; e.currentTarget.style.borderColor = '#4dabf7'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button onClick={() => handleDelete(c.id)} style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                                    color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                    transition: 'all 0.3s', display: 'flex', alignItems: 'center',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.2)'; e.currentTarget.style.borderColor = '#ff6b6b'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
