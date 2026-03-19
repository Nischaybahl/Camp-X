import { Share2, BookOpen, PenTool, Code, MessageCircle } from 'lucide-react';

export default function AcademiaCentral() {
    const posts = [
        { type: "Notes", icon: <BookOpen />, title: "Complete Java Guide", author: "Raj K.", time: "2 hours ago", desc: "Detailed notes I prepared for the OOP course. Covers inheritance, polymorphism, and practical examples." },
        { type: "Stationary", icon: <PenTool />, title: "Drafting Set Setup", author: "Anita P.", time: "5 hours ago", desc: "I have a drafting compass and set squares I no longer need from ED class. Free to grab from Block B, Room 204." },
        { type: "Project", icon: <Code />, title: "Need Frontend Dev for Hackathon", author: "Vikram S.", time: "1 day ago", desc: "Building a health-tech app next weekend. Need someone experienced with React and Tailwind. Backend is ready." },
    ];

    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem' }}>
            <h1 className="main-title fade-in-up" style={{ fontSize: '3.5rem' }}>Academia <span>Central</span></h1>
            <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 3rem auto' }}>
                The student hub for sharing notes, stationary, and collaborating on projects.
            </p>

            <div className="share-bar fade-in-up delay-1" style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 3rem auto', width: '100%', display: 'flex', gap: '1rem' }}>
                <input type="text" placeholder="Share something with the college..." style={{
                    flex: 1, padding: '1.2rem 1.5rem', borderRadius: '30px', border: '1px solid var(--accent)', background: 'rgba(204,255,0,0.05)', color: 'white', outline: 'none', fontSize: '1rem'
                }} />
                <button className="btn-accent" style={{ padding: '0 1.5rem', borderRadius: '30px' }}>
                    <Share2 size={20} /> Post
                </button>
            </div>

            <div className="posts-feed fade-in-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                {posts.map((post, i) => (
                    <div key={i} style={{
                        background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(12px)', transition: 'transform 0.3s, border-color 0.3s', textAlign: 'left'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', color: 'var(--primary)' }}>
                                    {post.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>{post.title}</h3>
                                    <div style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>
                                        <strong>{post.author}</strong> • {post.type} • {post.time}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p style={{ color: 'var(--secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {post.desc}
                        </p>
                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                <MessageCircle size={18} /> Connect
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
