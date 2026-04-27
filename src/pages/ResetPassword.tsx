import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password.length < 6) {
            return setError('Password must be at least 6 characters long.');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await fetch(`${apiUrl}/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Password has been successfully updated! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.error || 'Failed to reset password. The link might be expired.');
            }
        } catch (err) {
            setError('Failed to connect to the server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '0.9rem 3rem 0.9rem 2.8rem',
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
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--accent), #a8e600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 8px 30px rgba(204, 255, 0, 0.3)',
                    }}>
                        <Lock size={28} color="#000" />
                    </div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                        Set New Password
                    </h1>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.95rem' }}>
                        Please enter a new secure password underneath.
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
                        <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
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
                        <AlertCircle size={24} style={{ flexShrink: 0 }} />
                        {error}
                    </div>
                )}

                {!successMessage && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'} placeholder="New Password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required
                                style={inputStyle}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: 0
                            }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} required
                                style={inputStyle}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            />
                        </div>

                        <button type="submit" disabled={isLoading} style={{
                            background: 'var(--accent)', color: '#000', padding: '0.9rem', borderRadius: '12px',
                            fontSize: '1rem', fontWeight: '600', border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s', marginTop: '0.5rem',
                            opacity: isLoading ? 0.7 : 1,
                        }}
                            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(204, 255, 0, 0.4)'; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            {isLoading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
