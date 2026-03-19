import { useState, useEffect } from 'react';
import { Mail, User, ShieldCheck } from 'lucide-react';

interface CampXUser {
    name: string;
    email: string;
    verified?: boolean;
    isAdmin?: boolean;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<CampXUser[]>([]);
    const currentUser = JSON.parse(localStorage.getItem('campx_current_user') || 'null');

    useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('campx_users') || '[]');
        setUsers(storedUsers);
    }, []);

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
                    Registered Users
                </h1>
                <p style={{ color: 'var(--secondary)', marginBottom: '3rem' }}>
                    View a comprehensive list of all verified students actively using the platform.
                </p>

                {users.length === 0 ? (
                    <div style={{ background: 'var(--glass)', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>No users found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {users.map((u, idx) => (
                            <div key={idx} style={{ 
                                background: 'var(--glass)', 
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                transition: 'transform 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ 
                                        width: '50px', 
                                        height: '50px', 
                                        borderRadius: '25px', 
                                        background: 'rgba(204,255,0,0.1)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        <User size={24} color="var(--accent)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', color: 'var(--primary)' }}>
                                            {u.name}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                            <Mail size={14} /> {u.email}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {u.verified ? (
                                        <span style={{ 
                                            background: 'rgba(81, 207, 102, 0.1)', 
                                            color: '#51cf66', 
                                            padding: '0.4rem 1rem', 
                                            borderRadius: '20px', 
                                            fontSize: '0.85rem',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.4rem'
                                        }}>
                                            <ShieldCheck size={14} /> Verified Auth
                                        </span>
                                    ) : (
                                        <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem' }}>Pending</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
