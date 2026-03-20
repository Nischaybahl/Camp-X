import { useState, useEffect } from 'react';
import { Mail, User, Clock, Trash2 } from 'lucide-react';

interface SupportMessage {
    _id?: string;
    name: string;
    email: string;
    message: string;
    timestamp: string;
}

export default function SupportQueries() {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || 'null');

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://camp-x.onrender.com/api';
                console.log('Fetching support messages from:', `${BACKEND_URL}/support`);
                const response = await fetch(`${BACKEND_URL}/support`);
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                } else {
                    const stored = JSON.parse(localStorage.getItem('campx_support_messages') || '[]');
                    setMessages(stored.sort((a: SupportMessage, b: SupportMessage) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                }
            } catch {
                const stored = JSON.parse(localStorage.getItem('campx_support_messages') || '[]');
                setMessages(stored.sort((a: SupportMessage, b: SupportMessage) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, []);

    const handleDelete = async (id: string | undefined, timestamp: string) => {
        try {
            const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://camp-x.onrender.com/api';
            if (id && id.length === 24) {
                await fetch(`${BACKEND_URL}/support/${id}`, { method: 'DELETE' });
            }
        } catch (e) {
            console.error('Delete failed', e);
        }
        
        const updated = messages.filter(m => m.timestamp !== timestamp);
        setMessages(updated);
        localStorage.setItem('campx_support_messages', JSON.stringify(updated));
    };

    if (!currentUser || !currentUser.isAdmin) {
        return (
            <div className="module-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#ff6b6b' }}>
                <h2>Access Denied. Administrator privileges required.</h2>
            </div>
        );
    }

    return (
        <div className="module-container" style={{ minHeight: '100vh', padding: '6rem 2rem 2rem 2rem', color: 'var(--primary)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: "'Instrument Serif', serif" }}>
                    Support Queries
                </h1>
                <p style={{ color: 'var(--secondary)', marginBottom: '3rem' }}>
                    View and manage all user messages sent through the Home page contact form.
                </p>

                {loading ? (
                    <div style={{ background: 'var(--glass)', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ background: 'var(--glass)', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>No new messages.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ 
                                background: 'var(--glass)', 
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                transition: 'transform 0.2s',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                            <User size={18} color="var(--accent)" /> {msg.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                            <Mail size={16} /> <a href={`mailto:${msg.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{msg.email}</a>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                                            <Clock size={14} /> {new Date(msg.timestamp).toLocaleString()}
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(msg._id, msg.timestamp)}
                                            style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,50,50,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            title="Delete Message"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ 
                                    background: 'var(--glass)', 
                                    padding: '1rem', 
                                    borderRadius: '8px',
                                    color: 'var(--primary)',
                                    lineHeight: '1.6',
                                    fontSize: '0.95rem',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
