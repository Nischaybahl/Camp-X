import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, MapPin, Package, AlertTriangle } from 'lucide-react';

interface LostItem {
    id: string;
    title: string;
    location: string;
    description: string;
    status: 'Lost' | 'Found';
    contact: string;
    createdAt: string;
    authorEmail?: string;
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: '10px',
    border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--primary)', outline: 'none', fontSize: '1rem',
    transition: 'border-color 0.3s',
};

export default function LostAndFound() {
    const [items, setItems] = useState<LostItem[]>(() => {
        const saved = localStorage.getItem('campusLostFound');
        return saved ? JSON.parse(saved) : [];
    });
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'Lost' | 'Found'>('Lost');
    const [contact, setContact] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'Lost' | 'Found'>('all');

    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || '{}');

    useEffect(() => {
        localStorage.setItem('campusLostFound', JSON.stringify(items));
    }, [items]);

    const resetForm = () => {
        setTitle(''); setLocation(''); setDescription(''); setStatus('Lost'); setContact('');
        setShowForm(false);
    };

    const handleAdd = () => {
        if (!title.trim() || !location.trim()) return;
        const newItem: LostItem = {
            id: Date.now().toString(),
            title, location, description, status, contact,
            createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            authorEmail: currentUser.email,
        };
        setItems(prev => [newItem, ...prev]);
        resetForm();
    };

    const handleDelete = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const filtered = items.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = item.title.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q);
        const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem', paddingBottom: '4rem' }}>
            <h1 className="main-title fade-in-up">Trace IT<span> ◎</span></h1>
            <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 2rem auto' }}>
                Find what you lost. Return what you found.
            </p>

            {/* Search & Actions */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center',
                flexWrap: 'wrap', marginBottom: '1.5rem', maxWidth: '800px', margin: '0 auto 1.5rem auto',
            }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '450px' }}>
                    <input type="text" placeholder="Search items by name, location..."
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
                    <Plus size={18} /> Report Item
                </button>
            </div>

            {/* Filter tabs */}
            <div className="fade-in-up delay-2" style={{
                display: 'flex', justifyContent: 'center', marginBottom: '2rem',
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass)', borderRadius: '30px', padding: '0.3rem', border: '1px solid var(--glass-border)' }}>
                    {(['all', 'Lost', 'Found'] as const).map(f => (
                        <button key={f} onClick={() => setFilterStatus(f)} style={{
                            padding: '0.5rem 1.2rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            background: filterStatus === f ? (f === 'Lost' ? 'rgba(255,50,50,0.8)' : f === 'Found' ? 'rgba(50,255,50,0.7)' : 'var(--accent)') : 'transparent',
                            color: filterStatus === f ? (f === 'all' ? '#000' : '#fff') : 'var(--secondary)',
                            fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s',
                        }}>{f === 'all' ? 'All' : f}</button>
                    ))}
                </div>
            </div>

            {/* Add Item Modal */}
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
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Report an Item</h2>
                            <button onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                                <X size={22} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {/* Status Toggle */}
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.3rem' }}>
                                <button onClick={() => setStatus('Lost')} style={{
                                    flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: status === 'Lost' ? 'rgba(255,50,50,0.3)' : 'transparent',
                                    color: status === 'Lost' ? '#ff6b6b' : 'var(--secondary)',
                                    fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.3s',
                                }}>🔴 I Lost Something</button>
                                <button onClick={() => setStatus('Found')} style={{
                                    flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: status === 'Found' ? 'rgba(50,255,50,0.3)' : 'transparent',
                                    color: status === 'Found' ? '#51cf66' : 'var(--secondary)',
                                    fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.3s',
                                }}>🟢 I Found Something</button>
                            </div>
                            <input type="text" placeholder="Item Name (e.g. MacBook Air)" value={title}
                                onChange={e => setTitle(e.target.value)} style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <input type="text" placeholder="Location (e.g. Library - 3rd Floor)" value={location}
                                onChange={e => setLocation(e.target.value)} style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <textarea rows={3} placeholder="Description (optional)" value={description}
                                onChange={e => setDescription(e.target.value)}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <input type="text" placeholder="Contact (email or phone)" value={contact}
                                onChange={e => setContact(e.target.value)} style={inputStyle}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} />
                            <button className="btn-accent" onClick={handleAdd}
                                style={{ width: '100%', justifyContent: 'center', padding: '1rem', opacity: (!title.trim() || !location.trim()) ? 0.5 : 1 }}>
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="fade-in-up delay-3" style={{
                display: 'flex', flexDirection: 'column', gap: '1rem',
                maxWidth: '800px', margin: '0 auto', width: '100%',
            }}>
                {filtered.length === 0 && (
                    <div style={{
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        borderRadius: '16px', padding: '3rem', backdropFilter: 'blur(12px)',
                        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    }}>
                        <AlertTriangle size={40} color="var(--secondary)" style={{ opacity: 0.5 }} />
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>
                            {searchQuery ? 'No items match your search.' : 'No items reported yet. Click "Report Item" to add one.'}
                        </p>
                    </div>
                )}

                {filtered.map(item => (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '1.2rem',
                        padding: '1.5rem 2rem',
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        borderRadius: '14px', backdropFilter: 'blur(12px)',
                        transition: 'transform 0.3s, background 0.3s, box-shadow 0.3s',
                        borderLeft: `3px solid ${item.status === 'Lost' ? '#ff6b6b' : '#51cf66'}`,
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'var(--glass)';
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            background: item.status === 'Lost' ? 'rgba(255,50,50,0.15)' : 'rgba(50,255,50,0.15)',
                            padding: '12px', borderRadius: '12px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Package size={22} color={item.status === 'Lost' ? '#ff6b6b' : '#51cf66'} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{item.title}</h3>
                                <span style={{
                                    padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold',
                                    background: item.status === 'Lost' ? 'rgba(255, 50, 50, 0.2)' : 'rgba(50, 255, 50, 0.2)',
                                    color: item.status === 'Lost' ? '#ff6b6b' : '#51cf66',
                                }}>{item.status}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                <MapPin size={14} color="var(--secondary)" />
                                <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>{item.location}</p>
                            </div>
                            {item.description && (
                                <p style={{ color: 'var(--secondary)', fontSize: '0.88rem', opacity: 0.8, marginBottom: '0.3rem', lineHeight: 1.5 }}>
                                    {item.description}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.3rem' }}>
                                {item.contact && (
                                    <span style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 500 }}>
                                        📞 {item.contact}
                                    </span>
                                )}
                                <span style={{ color: 'var(--secondary)', fontSize: '0.78rem', opacity: 0.6 }}>
                                    {item.createdAt}
                                </span>
                            </div>
                        </div>

                        {/* Delete */}
                        {(currentUser.isAdmin || item.authorEmail === currentUser.email) && (
                            <button onClick={() => handleDelete(item.id)} style={{
                                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                                color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px',
                                transition: 'all 0.3s', display: 'flex', alignItems: 'center', flexShrink: 0,
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.2)'; e.currentTarget.style.borderColor = '#ff6b6b'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
