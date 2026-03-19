import { Bell, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';

export default function CollegeUpdates() {
    const updates = [
        { title: "Mid-Sem Exams Rescheduled", date: "March 15, 2026", type: "Urgent", icon: <AlertTriangle /> },
        { title: "Annual Cultural Fest Dates Announced", date: "March 12, 2026", type: "Event", icon: <CalendarIcon /> },
        { title: "New Lab Equipment Arrived", date: "March 10, 2026", type: "General", icon: <Bell /> },
    ];

    const timetables = [
        { title: "CS Semester 4 Routine", size: "1.2 MB" },
        { title: "Electrical Engineering Sem 2 Routine", size: "940 KB" },
        { title: "Mid-Term Examination Seating Plan", size: "2.4 MB" },
    ];

    return (
        <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: '2rem' }}>
            <h1 className="main-title fade-in-up" style={{ fontSize: '3.5rem' }}>College <span>Updates</span></h1>
            <p className="main-desc fade-in-up delay-1" style={{ margin: '0 auto 3rem auto' }}>
                Stay informed about schedules, exams, and important announcements.
            </p>

            <div className="updates-grid fade-in-up delay-2" style={{
                display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '3rem', width: '100%', maxWidth: '1100px', margin: '0 auto', textAlign: 'left'
            }}>
                <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '2.5rem', backdropFilter: 'blur(12px)' }}>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Bell size={28} color="var(--accent)" /> Announcements
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {updates.map((update, i) => (
                            <div key={i} style={{ borderBottom: i < updates.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: i < updates.length - 1 ? '1.5rem' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: update.type === 'Urgent' ? '#ff6b6b' : 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {update.type}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{update.date}</span>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '600' }}>{update.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '2.5rem', backdropFilter: 'blur(12px)' }}>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Clock size={28} color="var(--accent)" /> Timetables
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {timetables.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1.2rem', borderRadius: '12px', transition: 'background 0.3s' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <CalendarIcon color="var(--primary)" size={24} />
                                    <div>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>{item.title}</h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>PDF • {item.size}</span>
                                    </div>
                                </div>
                                <button style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', transition: 'all 0.3s', fontSize: '0.85rem' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#000'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; }}>
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
