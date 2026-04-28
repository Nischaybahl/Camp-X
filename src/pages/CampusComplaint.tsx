import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit3, CheckCircle, Circle, X, AlertTriangle, Shield, Upload, Image, Clock, Tag, Filter, Hash } from 'lucide-react';
import { fetchItems, createItem, updateItem, deleteItem } from '../utils/apiClient';

export interface Complaint {
    id: string;
    name: string;
    category: string;
    subType: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in-progress' | 'resolved';
    anonymous: boolean;
    imageUrl?: string;
    trackingId: string;
    completed: boolean;
    createdAt: string;
    authorEmail?: string;
    [key: string]: unknown;
}

// ─── Sub-types per category ──────────────────────────────────────────────────
const CATEGORY_SUBTYPES: Record<string, string[]> = {
    infra: [
        'Broken classroom chairs/desks', 'Projector not working', 'Smart board issues',
        'Fan/AC not working', 'Poor lighting in classrooms', 'Water leakage / ceiling damage',
        'Damaged windows/doors',
    ],
    tech: [
        'WiFi not working', 'Computer lab systems dead', 'Printer issues',
        'Attendance portal not working', 'College website bugs', 'CCTV malfunction',
    ],
    clean: [
        'Dirty classrooms', 'Washroom hygiene issues', 'Garbage not collected',
        'Bad smell in corridors', 'Water cooler cleanliness issue',
    ],
    academic: [
        'Class timetable clashes', 'Exam room allotment issue', 'Shortage of teaching materials',
        'Delay in result processing', 'Missing student records',
    ],
    disc: [
        'Student misbehavior', 'Noise during lectures', 'Unauthorized outsiders on campus',
        'Ragging concerns', 'Damage to college property',
    ],
    sec: [
        'Parking mismanagement', 'Security guard negligence', 'Unsafe campus areas',
        'Broken gates/locks', 'Missing equipment/items',
    ],
    hr: [
        'Salary delay', 'Leave approval delay', 'Staff misconduct',
        'Workload imbalance', 'Communication issues with departments',
    ],
    lib: [
        'Missing books', 'Library system down', 'Noise in library', 'Insufficient seating',
    ],
    lab: [
        'Equipment not working', 'Chemicals shortage', 'Unsafe lab conditions', 'Power issues in lab',
    ],
    other: [
        'Suggestion for improvement', 'Event management issues', 'Transport concerns',
        'Cafeteria hygiene/pricing issues',
    ],
};

const CATEGORIES = [
    { value: 'infra',    label: 'Infrastructure',  color: '#4dabf7', icon: '🏗️' },
    { value: 'tech',     label: 'Technical',        color: '#ff922b', icon: '💻' },
    { value: 'clean',    label: 'Cleanliness',      color: '#20c997', icon: '🧹' },
    { value: 'academic', label: 'Academic',         color: '#ffd43b', icon: '📚' },
    { value: 'disc',     label: 'Discipline',       color: '#ff6b6b', icon: '⚖️' },
    { value: 'sec',      label: 'Security',         color: '#ced4da', icon: '🔒' },
    { value: 'hr',       label: 'Staff/HR',         color: '#f06595', icon: '👥' },
    { value: 'lib',      label: 'Library',          color: '#845ef7', icon: '📖' },
    { value: 'lab',      label: 'Laboratory',       color: '#339af0', icon: '🔬' },
    { value: 'other',    label: 'Other',            color: '#adb5bd', icon: '📝' },
];

const PRIORITIES = [
    { value: 'low',    label: 'Low',    color: '#51cf66', bg: 'rgba(81,207,102,0.15)' },
    { value: 'medium', label: 'Medium', color: '#ffd43b', bg: 'rgba(255,212,59,0.15)' },
    { value: 'high',   label: 'High',   color: '#ff922b', bg: 'rgba(255,146,43,0.15)' },
    { value: 'urgent', label: 'Urgent', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
];

const STATUSES = [
    { value: 'pending',     label: 'Pending',     color: '#ffd43b', bg: 'rgba(255,212,59,0.12)' },
    { value: 'in-progress', label: 'In Progress', color: '#4dabf7', bg: 'rgba(77,171,247,0.12)' },
    { value: 'resolved',    label: 'Resolved',    color: '#51cf66', bg: 'rgba(81,207,102,0.12)' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getCategoryMeta = (cat: string) => CATEGORIES.find(c => c.value === cat) ?? { label: cat, color: 'var(--accent)', icon: '📝' };
const getPriorityMeta = (p: string) => PRIORITIES.find(x => x.value === p) ?? PRIORITIES[0];
const getStatusMeta   = (s: string) => STATUSES.find(x => x.value === s)   ?? STATUSES[0];

function generateTrackingId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'CX-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
    border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--primary)', outline: 'none', fontSize: '0.95rem',
    transition: 'border-color 0.3s', boxSizing: 'border-box',
};

const glassCard: React.CSSProperties = {
    background: 'var(--glass)', border: '1px solid var(--glass-border)',
    borderRadius: '16px', padding: '1.5rem 2rem', backdropFilter: 'blur(12px)',
    transition: 'transform 0.3s, box-shadow 0.3s, background 0.3s',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em',
    color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '0.4rem',
    display: 'block',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampusComplaint() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [category, setCategory] = useState('infra');
    const [subType, setSubType] = useState(CATEGORY_SUBTYPES['infra'][0]);
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low'|'medium'|'high'|'urgent'>('medium');
    const [status, setStatus] = useState<'pending'|'in-progress'|'resolved'>('pending');
    const [anonymous, setAnonymous] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState<'all'|'pending'|'in-progress'|'resolved'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [showCopied, setShowCopied] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);
    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || '{}');

    useEffect(() => {
        fetchItems<Complaint>('complaint', 'campusComplaints').then(data => {
            setComplaints(data);
            setLoading(false);
        });
    }, []);

    // When category changes, reset subType to first option
    const handleCategoryChange = (cat: string) => {
        setCategory(cat);
        setSubType(CATEGORY_SUBTYPES[cat]?.[0] ?? '');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const resetForm = () => {
        setName(''); setCategory('infra'); setSubType(CATEGORY_SUBTYPES['infra'][0]);
        setDescription(''); setPriority('medium'); setStatus('pending');
        setAnonymous(false); setImagePreview(null); setEditingId(null); setShowForm(false);
    };

    const handleSubmit = () => {
        if (!description.trim()) return;
        if (!anonymous && !name.trim()) return;

        if (editingId) {
            const existing = complaints.find(c => c.id === editingId);
            if (existing) {
                const updated = { ...existing, name: anonymous ? 'Anonymous' : name, category, subType, description, priority, status, anonymous, imageUrl: imagePreview ?? existing.imageUrl };
                setComplaints(prev => prev.map(c => c.id === editingId ? updated : c));
                updateItem('complaint', editingId, updated, 'campusComplaints', complaints);
            }
        } else {
            const newComplaint: Complaint = {
                id: Date.now().toString(),
                name: anonymous ? 'Anonymous' : name,
                category, subType, description, priority, status, anonymous,
                imageUrl: imagePreview ?? undefined,
                trackingId: generateTrackingId(),
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
        setName(c.anonymous ? '' : c.name);
        setCategory(c.category);
        setSubType(c.subType ?? CATEGORY_SUBTYPES[c.category]?.[0] ?? '');
        setDescription(c.description);
        setPriority(c.priority ?? 'medium');
        setStatus(c.status ?? 'pending');
        setAnonymous(c.anonymous ?? false);
        setImagePreview(c.imageUrl ?? null);
        setEditingId(c.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        const updated = complaints.filter(c => c.id !== id);
        setComplaints(updated);
        deleteItem('complaint', id, 'campusComplaints', complaints);
    };

    const handleStatusChange = (id: string, newStatus: 'pending'|'in-progress'|'resolved') => {
        const c = complaints.find(comp => comp.id === id);
        if (!c) return;
        const updated = { ...c, status: newStatus, completed: newStatus === 'resolved' };
        setComplaints(prev => prev.map(comp => comp.id === id ? updated : comp));
        updateItem('complaint', id, updated, 'campusComplaints', complaints);
    };

    const copyTrackingId = (tid: string) => {
        navigator.clipboard.writeText(tid).catch(() => {});
        setShowCopied(tid);
        setTimeout(() => setShowCopied(null), 2000);
    };

    // Filtering
    const filtered = complaints.filter(c => {
        if (filterStatus !== 'all' && (c.status ?? (c.completed ? 'resolved' : 'pending')) !== filterStatus) return false;
        if (filterCategory !== 'all' && c.category !== filterCategory) return false;
        if (filterPriority !== 'all' && (c.priority ?? 'medium') !== filterPriority) return false;
        return true;
    });

    const subTypes = CATEGORY_SUBTYPES[category] ?? [];

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem', paddingBottom: '4rem' }}>
            <h1 className="main-title fade-in-up">Campus <span>Complaints</span></h1>
            <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 2rem auto' }}>
                We take every issue seriously. File, track, and manage your complaints.
            </p>

            {/* ── Action Bar ── */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center',
                flexWrap: 'wrap', marginBottom: '1.5rem', maxWidth: '900px', margin: '0 auto 1.5rem auto',
            }}>
                <button className="btn-accent" onClick={() => { resetForm(); setShowForm(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem' }}>
                    <Plus size={18} /> Add Complaint
                </button>

                {/* Status filter pills */}
                <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--glass)', borderRadius: '30px', padding: '0.3rem', border: '1px solid var(--glass-border)' }}>
                    {(['all', 'pending', 'in-progress', 'resolved'] as const).map(f => (
                        <button key={f} onClick={() => setFilterStatus(f)} style={{
                            padding: '0.45rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            background: filterStatus === f ? 'var(--accent)' : 'transparent',
                            color: filterStatus === f ? '#000' : 'var(--secondary)',
                            fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.3s', textTransform: 'capitalize',
                            whiteSpace: 'nowrap',
                        }}>{f === 'all' ? 'All' : f.replace('-', ' ')}</button>
                    ))}
                </div>
            </div>

            {/* ── Advanced Filters ── */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap',
                maxWidth: '900px', margin: '0 auto 2rem auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={14} color="var(--secondary)" />
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{
                        ...inputStyle, padding: '0.5rem 0.8rem', width: 'auto', fontSize: '0.85rem',
                    }}>
                        <option value="all" style={{ background: '#1a1a2e' }}>All Categories</option>
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value} style={{ background: '#1a1a2e' }}>{c.icon} {c.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={14} color="var(--secondary)" />
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{
                        ...inputStyle, padding: '0.5rem 0.8rem', width: 'auto', fontSize: '0.85rem',
                    }}>
                        <option value="all" style={{ background: '#1a1a2e' }}>All Priorities</option>
                        {PRIORITIES.map(p => (
                            <option key={p.value} value={p.value} style={{ background: '#1a1a2e' }}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Modal Form ── */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
                }} onClick={() => resetForm()}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'linear-gradient(135deg, rgba(18,18,30,0.99), rgba(10,10,22,0.99))',
                        border: '1px solid var(--glass-border)', borderRadius: '22px',
                        padding: '2rem 2.2rem', maxWidth: '580px', width: '100%',
                        boxShadow: '0 24px 72px rgba(0,0,0,0.7)',
                        animation: 'fadeInUp 0.3s ease forwards',
                        maxHeight: '90vh', overflowY: 'auto',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', margin: 0 }}>
                                    {editingId ? '✏️ Edit Complaint' : '📋 New Complaint'}
                                </h2>
                                <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', margin: '0.3rem 0 0' }}>
                                    Fill in the details below to file your complaint
                                </p>
                            </div>
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                            {/* Anonymous Toggle */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: anonymous ? 'rgba(204,255,0,0.06)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${anonymous ? 'rgba(204,255,0,0.3)' : 'var(--glass-border)'}`,
                                borderRadius: '12px', padding: '0.9rem 1rem', cursor: 'pointer', transition: 'all 0.3s',
                            }} onClick={() => setAnonymous(!anonymous)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Shield size={16} color={anonymous ? 'var(--accent)' : 'var(--secondary)'} />
                                    <div>
                                        <p style={{ color: anonymous ? 'var(--accent)' : 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                                            Post Anonymously
                                        </p>
                                        <p style={{ color: 'var(--secondary)', fontSize: '0.75rem', margin: 0 }}>
                                            Your name will be hidden from the complaint
                                        </p>
                                    </div>
                                </div>
                                <div style={{
                                    width: '42px', height: '24px', borderRadius: '12px',
                                    background: anonymous ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                                    transition: 'background 0.3s', position: 'relative',
                                }}>
                                    <div style={{
                                        position: 'absolute', top: '3px',
                                        left: anonymous ? '21px' : '3px',
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        background: anonymous ? '#000' : '#fff',
                                        transition: 'left 0.3s, background 0.3s',
                                    }} />
                                </div>
                            </div>

                            {/* Name (only if not anonymous) */}
                            {!anonymous && (
                                <div>
                                    <label style={labelStyle}>Your Name *</label>
                                    <input type="text" placeholder="e.g. Dr. Sharma" value={name}
                                        onChange={e => setName(e.target.value)} style={inputStyle}
                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                                </div>
                            )}

                            {/* Category */}
                            <div>
                                <label style={labelStyle}>Category *</label>
                                <select value={category} onChange={e => handleCategoryChange(e.target.value)} style={inputStyle}>
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value} style={{ background: '#1a1a2e', color: '#fff' }}>
                                            {c.icon} {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub-Type */}
                            <div>
                                <label style={labelStyle}>Issue Type *</label>
                                <select value={subType} onChange={e => setSubType(e.target.value)} style={inputStyle}>
                                    {subTypes.map(st => (
                                        <option key={st} value={st} style={{ background: '#1a1a2e', color: '#fff' }}>{st}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority + Status in 2 cols */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Priority</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value as 'low'|'medium'|'high'|'urgent')} style={{
                                        ...inputStyle,
                                        color: getPriorityMeta(priority).color,
                                        borderColor: getPriorityMeta(priority).color + '55',
                                    }}>
                                        {PRIORITIES.map(p => (
                                            <option key={p.value} value={p.value} style={{ background: '#1a1a2e', color: '#fff' }}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value as 'pending'|'in-progress'|'resolved')} style={inputStyle}>
                                        {STATUSES.map(s => (
                                            <option key={s.value} value={s.value} style={{ background: '#1a1a2e', color: '#fff' }}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={labelStyle}>Description *</label>
                                <textarea rows={4} placeholder="Describe your issue in detail..." value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label style={labelStyle}>Upload Proof (optional)</label>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                                {imagePreview ? (
                                    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                        <img src={imagePreview} alt="proof" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                                        <button onClick={() => setImagePreview(null)} style={{
                                            position: 'absolute', top: '8px', right: '8px',
                                            background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                                            color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex',
                                        }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => fileRef.current?.click()} style={{
                                        width: '100%', padding: '1rem', borderRadius: '10px',
                                        border: '1px dashed var(--glass-border)', background: 'rgba(255,255,255,0.03)',
                                        color: 'var(--secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'all 0.3s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--secondary)'; }}>
                                        <Upload size={16} /> Click to upload image proof
                                    </button>
                                )}
                            </div>

                            {/* Submit */}
                            <button className="btn-accent" onClick={handleSubmit} style={{
                                width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '0.4rem',
                                opacity: (!description.trim() || (!anonymous && !name.trim())) ? 0.5 : 1,
                                cursor: (!description.trim() || (!anonymous && !name.trim())) ? 'not-allowed' : 'pointer',
                            }}>
                                {editingId ? 'Update Complaint' : 'Submit Complaint'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stats Row ── */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
                maxWidth: '900px', margin: '0 auto 2rem auto',
            }}>
                {[
                    { label: 'Total', val: complaints.length, color: 'var(--accent)' },
                    { label: 'Pending', val: complaints.filter(c => (c.status ?? 'pending') === 'pending').length, color: '#ffd43b' },
                    { label: 'In Progress', val: complaints.filter(c => (c.status ?? '') === 'in-progress').length, color: '#4dabf7' },
                    { label: 'Resolved', val: complaints.filter(c => (c.status ?? (c.completed ? 'resolved' : 'pending')) === 'resolved').length, color: '#51cf66' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        ...glassCard, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', minWidth: '100px', gap: '0.2rem',
                    }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.val}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Complaints List ── */}
            <div className="fade-in-up delay-3" style={{
                display: 'flex', flexDirection: 'column', gap: '1rem',
                maxWidth: '900px', margin: '0 auto', width: '100%',
            }}>
                {loading ? (
                    <div style={{ ...glassCard, textAlign: 'center', padding: '3rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Clock size={36} color="var(--secondary)" style={{ opacity: 0.5, animation: 'spin 2s linear infinite' }} />
                            <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>Loading complaints...</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ ...glassCard, textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <AlertTriangle size={40} color="var(--secondary)" style={{ opacity: 0.5 }} />
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>
                            {complaints.length === 0 ? 'No complaints yet. Click "Add Complaint" to get started.' : 'No complaints match the current filters.'}
                        </p>
                    </div>
                ) : (
                    filtered.map(c => {
                        const catMeta   = getCategoryMeta(c.category);
                        const priMeta   = getPriorityMeta(c.priority ?? 'medium');
                        const statMeta  = getStatusMeta(c.status ?? (c.completed ? 'resolved' : 'pending'));
                        const isOwner   = currentUser.email && c.authorEmail === currentUser.email;

                        return (
                            <div key={c.id} style={{
                                ...glassCard,
                                opacity: statMeta.value === 'resolved' ? 0.7 : 1,
                                borderLeft: `3px solid ${catMeta.color}`,
                                display: 'flex', flexDirection: 'column', gap: '0.8rem',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                            >
                                {/* Row 1: meta badges + actions */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {/* Name + category */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                            {c.anonymous && (
                                                <Shield size={14} color="var(--accent)" title="Anonymous" />
                                            )}
                                            <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', margin: 0 }}>{c.name}</h3>
                                            <span style={{
                                                padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700,
                                                background: catMeta.color + '22', color: catMeta.color,
                                            }}>{catMeta.icon} {catMeta.label}</span>

                                            {/* Priority badge */}
                                            <span style={{
                                                padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700,
                                                background: priMeta.bg, color: priMeta.color,
                                            }}>⚡ {priMeta.label}</span>

                                            {/* Status badge */}
                                            <span style={{
                                                padding: '0.2rem 0.65rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700,
                                                background: statMeta.bg, color: statMeta.color,
                                            }}>● {statMeta.label}</span>
                                        </div>

                                        {/* Sub-type */}
                                        {c.subType && (
                                            <p style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                                                🔹 {c.subType}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {(currentUser.isAdmin || isOwner) && (
                                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                            {currentUser.isAdmin && (
                                                <select
                                                    value={c.status ?? (c.completed ? 'resolved' : 'pending')}
                                                    onChange={e => handleStatusChange(c.id, e.target.value as 'pending'|'in-progress'|'resolved')}
                                                    style={{
                                                        ...inputStyle, padding: '0.4rem 0.6rem', width: 'auto', fontSize: '0.78rem',
                                                        color: statMeta.color, borderColor: statMeta.color + '55',
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {STATUSES.map(s => (
                                                        <option key={s.value} value={s.value} style={{ background: '#1a1a2e', color: '#fff' }}>{s.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                            <button onClick={() => handleEdit(c)} style={{
                                                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                                                color: 'var(--primary)', cursor: 'pointer', padding: '0.45rem', borderRadius: '8px',
                                                transition: 'all 0.3s', display: 'flex', alignItems: 'center',
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(77,171,247,0.2)'; e.currentTarget.style.borderColor = '#4dabf7'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                                                <Edit3 size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} style={{
                                                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                                                color: '#ff6b6b', cursor: 'pointer', padding: '0.45rem', borderRadius: '8px',
                                                transition: 'all 0.3s', display: 'flex', alignItems: 'center',
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.2)'; e.currentTarget.style.borderColor = '#ff6b6b'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <p style={{ color: 'var(--secondary)', fontSize: '0.92rem', lineHeight: 1.65, margin: 0 }}>
                                    {c.description}
                                </p>

                                {/* Image proof */}
                                {c.imageUrl && (
                                    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)', maxHeight: '220px' }}>
                                        <img src={c.imageUrl} alt="proof" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                )}

                                {/* Footer: date + tracking ID */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.2rem' }}>
                                    <span style={{ color: 'var(--secondary)', fontSize: '0.78rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Clock size={12} /> {c.createdAt}
                                    </span>
                                    {c.trackingId && (
                                        <button onClick={() => copyTrackingId(c.trackingId)} title="Click to copy tracking ID" style={{
                                            background: 'rgba(204,255,0,0.06)', border: '1px solid rgba(204,255,0,0.2)',
                                            borderRadius: '8px', padding: '0.25rem 0.7rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.2s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(204,255,0,0.12)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(204,255,0,0.06)'; }}>
                                            <Hash size={11} color="var(--accent)" />
                                            <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                                {showCopied === c.trackingId ? '✓ Copied!' : c.trackingId}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Spin keyframe (for loading icon) ── */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </main>
    );
}
