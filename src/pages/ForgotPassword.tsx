import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || 'If the email exists, a reset link will be sent.');
                setEmail('');
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            // Fallback for local testing or network issues
            setError('Failed to connect to the server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '0.9rem 1rem 0.9rem 2.8rem',
        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
        borderRadius: '12px', color: 'var(--primary)', fontSize: '0.95rem',
        outline: 'none', transition: 'border-color 0.3s'
    };

    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh' }}>
            <div style={{
                background: 'var(--glass)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '3rem',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                animation: 'fade-in-up 0.6s ease'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                        Forgot Password
                    </h1>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.95rem' }}>
                        Enter your email address to receive a password reset link.
                    </p>
                </div>

                {successMessage && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)',
                        borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem',
                        color: '#34c759', fontSize: '0.9rem', lineHeight: '1.4',
                        animation: 'slideDown 0.3s ease-out',
                    }}>
                        <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
                        borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem',
                        color: '#ff6b6b', fontSize: '0.9rem', lineHeight: '1.4',
                        animation: 'shake 0.4s ease-in-out',
                    }}>
                        <AlertCircle size={20} style={{ flexShrink: 0 }} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="email" placeholder="Enter your registered email" value={email}
                            onChange={(e) => setEmail(e.target.value)} required
                            style={inputStyle}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        />
                    </div>

                    <button type="submit" disabled={isLoading || !email} style={{
                        background: 'var(--accent)', color: '#000', padding: '0.9rem', borderRadius: '12px',
                        fontSize: '1rem', fontWeight: '600', border: 'none',
                        cursor: isLoading || !email ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        opacity: isLoading || !email ? 0.7 : 1,
                    }}
                        onMouseEnter={(e) => { if (!isLoading && email) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(204, 255, 0, 0.4)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/login" style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            color: 'var(--secondary)', textDecoration: 'none', fontSize: '0.9rem',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--secondary)'}
                        >
                            <ArrowLeft size={16} /> Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}
