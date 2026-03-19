import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, UserPlus, User, Check, X, AlertCircle } from 'lucide-react';

export default function SignUp() {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Password validation rules
    const passwordChecks = useMemo(() => ({
        minLength: password.length >= 6,
        hasLetter: /[a-zA-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
    }), [password]);

    const isPasswordValid = passwordChecks.minLength && passwordChecks.hasLetter && passwordChecks.hasNumber;

    // College email validation
    const validateEmail = (value: string) => {
        if (!value) {
            setEmailError('');
            return true;
        }
        const localPart = value.split('@')[0];
        if (!localPart || !(localPart.toUpperCase().startsWith('EN'))) {
            setEmailError('Please use your college email ID (must start with "EN").');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (value.length > 2) {
            validateEmail(value);
        } else {
            setEmailError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        // Validate college email
        if (!validateEmail(email)) return;

        // Validate password
        if (!isPasswordValid) {
            setSubmitError('Password must be at least 6 characters long and include at least 1 letter and 1 number.');
            return;
        }

        // Check password match
        if (password !== confirmPassword) {
            setSubmitError('Passwords do not match!');
            return;
        }

        setIsSubmitting(true);

        try {
            // Save user to localStorage
            const users = JSON.parse(localStorage.getItem('campx_users') || '[]');
            const existingUser = users.find((u: { email: string }) => u.email === email.toLowerCase());
            if (existingUser) {
                setSubmitError('An account with this email already exists.');
                setIsSubmitting(false);
                return;
            }

            users.push({
                name,
                email: email.toLowerCase(),
                password,
                verified: true,
                createdAt: new Date().toISOString(),
            });
            localStorage.setItem('campx_users', JSON.stringify(users));

            // Navigate to login
            navigate('/login', { state: { registered: true, email: email.toLowerCase() } });
        } catch {
            setSubmitError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
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
                maxWidth: '480px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--accent), #a8e600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto', boxShadow: '0 8px 30px rgba(204, 255, 0, 0.3)'
                    }}>
                        <UserPlus size={28} color="#000" />
                    </div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.95rem' }}>Join CampX and unlock your campus</p>
                </div>

                {submitError && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
                        borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.2rem',
                        color: '#ff6b6b', fontSize: '0.85rem',
                        animation: 'shake 0.4s ease-in-out'
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {/* Name field */}
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="text" placeholder="Full name" value={name}
                            onChange={(e) => setName(e.target.value)} required
                            style={inputStyle}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        />
                    </div>

                    {/* Email field */}
                    <div>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                            <input
                                type="email" placeholder="College email (e.g. EN12345@college.edu)" value={email}
                                onChange={(e) => handleEmailChange(e.target.value)} required
                                style={{
                                    ...inputStyle,
                                    borderColor: emailError ? 'rgba(255,59,48,0.6)' : undefined,
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = emailError ? 'rgba(255,59,48,0.6)' : 'var(--accent)'}
                                onBlur={(e) => { e.currentTarget.style.borderColor = emailError ? 'rgba(255,59,48,0.6)' : 'var(--glass-border)'; validateEmail(email); }}
                            />
                        </div>
                        {emailError && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem',
                                paddingLeft: '0.2rem',
                                animation: 'slideDown 0.3s ease-out'
                            }}>
                                <AlertCircle size={13} />
                                {emailError}
                            </div>
                        )}
                    </div>

                    {/* Password field */}
                    <div>
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

                        {/* Password validation checklist */}
                        {password.length > 0 && (
                            <div style={{
                                marginTop: '0.7rem',
                                padding: '0.8rem 1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                animation: 'slideDown 0.3s ease-out',
                            }}>
                                <PasswordRule passed={passwordChecks.minLength} text="At least 6 characters" />
                                <PasswordRule passed={passwordChecks.hasLetter} text="Contains at least 1 letter (A–Z)" />
                                <PasswordRule passed={passwordChecks.hasNumber} text="Contains at least 1 number (0–9)" />

                                {!isPasswordValid && (
                                    <p style={{
                                        color: 'rgba(255,200,50,0.8)',
                                        fontSize: '0.75rem',
                                        marginTop: '0.6rem',
                                        paddingTop: '0.6rem',
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                        lineHeight: '1.4',
                                    }}>
                                        Password must be at least 6 characters long and include at least 1 letter and 1 number.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                        <input
                            type="password" placeholder="Confirm password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} required
                            style={{
                                ...inputStyle,
                                borderColor: confirmPassword && password !== confirmPassword ? 'rgba(255,59,48,0.6)' : undefined,
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = confirmPassword && password !== confirmPassword ? 'rgba(255,59,48,0.6)' : 'var(--accent)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = confirmPassword && password !== confirmPassword ? 'rgba(255,59,48,0.6)' : 'var(--glass-border)'}
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <div style={{
                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                color: '#ff6b6b',
                            }}>
                                <X size={16} />
                            </div>
                        )}
                        {confirmPassword && password === confirmPassword && (
                            <div style={{
                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                color: '#34c759',
                            }}>
                                <Check size={16} />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !isPasswordValid || !!emailError}
                        style={{
                            background: (isSubmitting || !isPasswordValid || !!emailError) ? 'rgba(204,255,0,0.4)' : 'var(--accent)',
                            color: '#000', padding: '0.9rem', borderRadius: '12px',
                            fontSize: '1rem', fontWeight: '600', border: 'none',
                            cursor: (isSubmitting || !isPasswordValid || !!emailError) ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s, background 0.3s', marginTop: '0.5rem',
                            opacity: (isSubmitting || !isPasswordValid || !!emailError) ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isSubmitting && isPasswordValid && !emailError) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(204, 255, 0, 0.4)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </main>
    );
}

// Reusable password rule indicator
function PasswordRule({ passed, text }: { passed: boolean; text: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '0.35rem', fontSize: '0.8rem',
            color: passed ? '#34c759' : 'rgba(255,255,255,0.4)',
            transition: 'color 0.3s',
        }}>
            {passed ? <Check size={14} style={{ flexShrink: 0 }} /> : <X size={14} style={{ flexShrink: 0, opacity: 0.5 }} />}
            <span>{text}</span>
        </div>
    );
}
