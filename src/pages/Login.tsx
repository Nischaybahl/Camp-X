import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { generateOTP, storeOTP, verifyOTP, sendOTPEmail } from '../utils/emailService';

type LoginStep = 'credentials' | 'otp';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<LoginStep>('credentials');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // OTP state
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(300); // 5 minutes in seconds
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const location = useLocation();
    const locationState = location.state as { registered?: boolean; email?: string } | null;

    useEffect(() => {
        if (locationState?.registered) {
            setSuccessMessage('Account created successfully! Please sign in.');
            if (locationState.email) setEmail(locationState.email);
        }
    }, [locationState]);

    // OTP countdown timer
    useEffect(() => {
        if (step !== 'otp' || otpTimer <= 0) {
            if (otpTimer <= 0) setCanResend(true);
            return;
        }
        const interval = setInterval(() => {
            setOtpTimer(prev => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step, otpTimer]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleCredentialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            if (email.toLowerCase() === 'en23cs301682@medicaps.ac.in' && password === 'Admin07') {
                localStorage.setItem('campx_current_user', JSON.stringify({
                    email: 'en23cs301682@medicaps.ac.in',
                    name: 'Admin User',
                    verified: true,
                    isAdmin: true
                }));
                setSuccessMessage('Admin Login successful!');
                setTimeout(() => window.location.href = '/', 1000);
                return;
            }

            const users = JSON.parse(localStorage.getItem('campx_users') || '[]');
            const user = users.find((u: { email: string; password: string }) =>
                u.email === email.toLowerCase() && u.password === password
            );

            if (!user) {
                setError('Invalid email or password.');
                setIsLoading(false);
                return;
            }

            // Check if first-time login (not yet verified)
            if (!user.verified) {
                const otp = generateOTP();
                storeOTP(email, otp);
                const sent = await sendOTPEmail(email, otp);

                if (sent) {
                    setSuccessMessage(`OTP sent to ${email}. Check your inbox!`);
                } else {
                    setSuccessMessage(`OTP generated! Check your browser console for the code (dev mode).`);
                }

                setStep('otp');
                setOtpTimer(300);
                setCanResend(false);
                setOtpValues(['', '', '', '', '', '']);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            } else {
                // Already verified — direct login
                localStorage.setItem('campx_current_user', JSON.stringify(user));
                setSuccessMessage('Login successful! Welcome back.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = useCallback((index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newValues = [...otpValues];
            digits.forEach((d, i) => {
                if (index + i < 6) newValues[index + i] = d;
            });
            setOtpValues(newValues);
            const nextIndex = Math.min(index + digits.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        if (!/^\d*$/.test(value)) return;

        const newValues = [...otpValues];
        newValues[index] = value;
        setOtpValues(newValues);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [otpValues]);

    const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [otpValues]);

    const handleVerifyOTP = async () => {
        setError('');
        setIsLoading(true);

        const otpCode = otpValues.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit OTP.');
            setIsLoading(false);
            return;
        }

        const result = verifyOTP(email, otpCode);

        if (result.valid) {
            // Mark user as verified
            const users = JSON.parse(localStorage.getItem('campx_users') || '[]');
            const updatedUsers = users.map((u: { email: string; verified: boolean }) => {
                if (u.email === email.toLowerCase()) {
                    return { ...u, verified: true };
                }
                return u;
            });
            localStorage.setItem('campx_users', JSON.stringify(updatedUsers));

            const user = updatedUsers.find((u: { email: string }) => u.email === email.toLowerCase());
            localStorage.setItem('campx_current_user', JSON.stringify(user));

            setSuccessMessage('Email verified! Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    const handleResendOTP = async () => {
        if (!canResend) return;
        setError('');
        setIsLoading(true);

        const otp = generateOTP();
        storeOTP(email, otp);
        const sent = await sendOTPEmail(email, otp);

        if (sent) {
            setSuccessMessage('New OTP sent! Check your inbox.');
        } else {
            setSuccessMessage('New OTP generated! Check browser console (dev mode).');
        }

        setOtpTimer(300);
        setCanResend(false);
        setOtpValues(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setIsLoading(false);
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
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: step === 'otp'
                            ? 'linear-gradient(135deg, #00d4ff, #7b61ff)'
                            : 'linear-gradient(135deg, var(--accent), #a8e600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: step === 'otp'
                            ? '0 8px 30px rgba(0,212,255,0.3)'
                            : '0 8px 30px rgba(204, 255, 0, 0.3)',
                        transition: 'all 0.5s ease',
                    }}>
                        {step === 'otp' ? <ShieldCheck size={28} color="#fff" /> : <LogIn size={28} color="#000" />}
                    </div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                        {step === 'otp' ? 'Verify Your Email' : 'Welcome Back'}
                    </h1>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.95rem' }}>
                        {step === 'otp'
                            ? `Enter the 6-digit code sent to ${email}`
                            : 'Sign in to your CampX account'}
                    </p>
                </div>

                {/* Success message */}
                {successMessage && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)',
                        borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.2rem',
                        color: '#34c759', fontSize: '0.85rem',
                        animation: 'slideDown 0.3s ease-out',
                    }}>
                        <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                        {successMessage}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
                        borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.2rem',
                        color: '#ff6b6b', fontSize: '0.85rem',
                        animation: 'shake 0.4s ease-in-out',
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        {error}
                    </div>
                )}

                {/* STEP 1: Credentials */}
                {step === 'credentials' && (
                    <form onSubmit={handleCredentialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                            <input
                                type="email" placeholder="Email address" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                                style={inputStyle}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required
                                style={{ ...inputStyle, padding: '0.9rem 3rem 0.9rem 2.8rem' }}
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

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <a href="#" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>Forgot password?</a>
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
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP Verification */}
                {step === 'otp' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* OTP input boxes */}
                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                            {otpValues.map((val, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={val}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                        handleOtpChange(0, pasted);
                                    }}
                                    style={{
                                        width: '52px', height: '60px',
                                        textAlign: 'center', fontSize: '1.5rem', fontWeight: '700',
                                        background: val ? 'rgba(204,255,0,0.08)' : 'rgba(255,255,255,0.05)',
                                        border: val
                                            ? '2px solid rgba(204,255,0,0.5)'
                                            : '1px solid var(--glass-border)',
                                        borderRadius: '14px', color: 'var(--primary)',
                                        outline: 'none', transition: 'all 0.3s',
                                        caretColor: 'var(--accent)',
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(204,255,0,0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = val ? 'rgba(204,255,0,0.5)' : 'var(--glass-border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            color: otpTimer <= 60 ? '#ff6b6b' : 'var(--secondary)',
                            fontSize: '0.9rem', fontWeight: '500',
                            transition: 'color 0.3s',
                        }}>
                            <Clock size={16} />
                            <span>
                                {otpTimer > 0
                                    ? `Code expires in ${formatTime(otpTimer)}`
                                    : 'Code has expired'}
                            </span>
                        </div>

                        {/* Verify button */}
                        <button
                            onClick={handleVerifyOTP}
                            disabled={isLoading || otpValues.join('').length !== 6}
                            style={{
                                background: otpValues.join('').length === 6
                                    ? 'linear-gradient(135deg, #00d4ff, #7b61ff)'
                                    : 'rgba(255,255,255,0.1)',
                                color: '#fff', padding: '0.9rem', borderRadius: '12px',
                                fontSize: '1rem', fontWeight: '600', border: 'none',
                                cursor: otpValues.join('').length === 6 && !isLoading ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s',
                                opacity: otpValues.join('').length === 6 ? 1 : 0.5,
                                boxShadow: otpValues.join('').length === 6
                                    ? '0 8px 25px rgba(0,212,255,0.3)'
                                    : 'none',
                            }}
                            onMouseEnter={(e) => { if (otpValues.join('').length === 6 && !isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {isLoading ? 'Verifying...' : 'Verify & Continue'}
                        </button>

                        {/* Resend */}
                        <div style={{ textAlign: 'center' }}>
                            {canResend ? (
                                <button
                                    onClick={handleResendOTP}
                                    disabled={isLoading}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--accent)', cursor: 'pointer',
                                        fontSize: '0.9rem', fontWeight: '600',
                                        textDecoration: 'underline',
                                        transition: 'opacity 0.3s',
                                    }}
                                >
                                    Resend OTP
                                </button>
                            ) : (
                                <p style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                                    Didn't receive it? You can resend when the timer expires.
                                </p>
                            )}
                        </div>

                        {/* Back to login */}
                        <button
                            onClick={() => { setStep('credentials'); setError(''); setSuccessMessage(''); }}
                            style={{
                                background: 'none', border: '1px solid var(--glass-border)',
                                color: 'var(--secondary)', padding: '0.7rem',
                                borderRadius: '12px', fontSize: '0.9rem',
                                cursor: 'pointer', transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--secondary)'; }}
                        >
                            ← Back to Sign In
                        </button>
                    </div>
                )}

                {step === 'credentials' && (
                    <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Sign Up</Link>
                    </p>
                )}
            </div>
        </main>
    );
}
