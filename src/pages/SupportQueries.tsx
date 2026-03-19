import { useState, useEffect } from 'react';
import { Mail, User, Clock, Trash2 } from 'lucide-react';

interface SupportMessage {
    name: string;
    email: string;
    message: string;
    timestamp: string;
}

export default function SupportQueries() {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || 'null');

    useEffect(() => {
        const storedMessages = JSON.parse(localStorage.getItem('campx_support_messages') || '[]');
        // Sort newest first
        storedMessages.sort((a: SupportMessage, b: SupportMessage) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setMessages(storedMessages);
    }, []);

    const handleDelete = (timestamp: string) => {
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
        <div className="module-container" style={{ minHeight: '100vh', padding: '6rem 2rem 2rem 2rem', color: '#fff' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: "'Instrument Serif', serif" }}>
                    Support Queries
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '3rem' }}>
                    View and manage all user messages sent through the Home page contact form.
                </p>

                {messages.length === 0 ? (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>No new messages.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                transition: 'transform 0.2s',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                            <User size={18} color="var(--accent)" /> {msg.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                            <Mail size={16} /> <a href={`mailto:${msg.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{msg.email}</a>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                            <Clock size={14} /> {new Date(msg.timestamp).toLocaleString()}
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(msg.timestamp)}
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
                                    background: 'rgba(0,0,0,0.5)', 
                                    padding: '1rem', 
                                    borderRadius: '8px',
                                    color: 'rgba(255,255,255,0.9)',
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
