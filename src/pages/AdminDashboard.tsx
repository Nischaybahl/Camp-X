import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, AlertCircle, Bell, 
  MessageSquare, BarChart3, Sun, Moon,
  LogOut, Clock, XCircle
} from 'lucide-react';
import './AdminDashboard.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://camp-x.onrender.com/api';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(localStorage.getItem('campx-admin-theme') || 'dark');
  const [stats, setStats] = useState({ users: 0, notes: 0, complaints: 0, activeUsers: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme support
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
    localStorage.setItem('campx-admin-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersRes, notesRes, complaintsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/users`),
        fetch(`${BACKEND_URL}/notes`),
        fetch(`${BACKEND_URL}/complaints`)
      ]);
      
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const notesData = notesRes.ok ? await notesRes.json() : [];
      const complaintsData = complaintsRes.ok ? await complaintsRes.json() : [];
      
      // Some endpoints might return an object like { data: [...] }, normalize to array
      const arrUsers = Array.isArray(usersData) ? usersData : usersData.data || [];
      const arrNotes = Array.isArray(notesData) ? notesData : notesData.data || [];
      const arrComplaints = Array.isArray(complaintsData) ? complaintsData : complaintsData.data || [];

      setStats({
        users: arrUsers.length,
        notes: arrNotes.length,
        complaints: arrComplaints.length,
        activeUsers: Math.floor(arrUsers.length * 0.43)
      });

      const activities = [
        ...arrNotes.map((n: any) => ({ id: n.id || n._id, type: 'note', title: n.title || 'Untitled Note', user: n.uploadedBy || n.authorName || 'User', time: new Date(n.createdAt || Date.now()) })),
        ...arrComplaints.map((c: any) => ({ id: c.id || c._id, type: 'complaint', title: c.issue || c.title || 'Issue', user: c.student || c.authorName || 'Student', time: new Date(c.createdAt || Date.now()) })),
        ...arrUsers.map((u: any) => ({ id: u.id || u._id, type: 'user', title: 'Joined', user: u.name || 'New Student', time: new Date(u.createdAt || Date.now()) }))
      ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

      setRecentActivity(activities);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // Fallback state empty stats for resilience if backend is down
      setError("Failed to load dashboard data. Could not connect to the Backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (error && activeTab === 'overview') return <div className="admin-error"><AlertCircle /> {error} <button onClick={fetchData}>Retry</button></div>;

    switch(activeTab) {
      case 'overview': return (
        <div className="admin-overview fade-in">
          <div className="stats-grid">
            <StatCard label="Total Users" value={stats.users} icon={<Users />} />
            <StatCard label="Notes Uploaded" value={stats.notes} icon={<BookOpen />} />
            <StatCard label="Total Complaints" value={stats.complaints} icon={<AlertCircle />} />
            <StatCard label="Active Users" value={stats.activeUsers} icon={<BarChart3 />} />
          </div>
          <div className="activity-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.length > 0 ? recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className={`activity-icon ${item.type}`}>
                    {item.type === 'note' ? <BookOpen size={18} /> : item.type === 'complaint' ? <AlertCircle size={18} /> : <Users size={18} />}
                  </div>
                  <div className="activity-details">
                    <p className="activity-text"><strong>{item.user}</strong> {item.type === 'note' ? 'uploaded' : item.type === 'complaint' ? 'reported' : 'joined'} <span>{item.type !== 'user' ? item.title : ''}</span></p>
                    <span className="activity-time"><Clock size={12} /> {item.time.toLocaleTimeString()}</span>
                  </div>
                </div>
              )) : (
                <p style={{color: 'var(--text-muted)'}}>No recent activity found.</p>
              )}
            </div>
          </div>
        </div>
      );
      case 'users': return <UserManagementSection />;
      case 'notes': return <NotesManagementSection />;
      case 'complaints': return <ComplaintsSection />;
      case 'announcements': return <AnnouncementsSection />;
      case 'analytics': return <AnalyticsSection stats={stats} />;
      default: return <div className="section-placeholder">Feature coming soon</div>;
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="logo">CampX Admin</div>
        <nav className="sidebar-nav">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20} />} label="User Management" />
          <NavItem active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<BookOpen size={20} />} label="Notes Management" />
          <NavItem active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} icon={<MessageSquare size={20} />} label="Complaints" />
          <NavItem active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Bell size={20} />} label="Announcements" />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={20} />} label="Analytics" />
        </nav>
        <button className="logout-btn"><LogOut size={20} /> <span>Logout</span></button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1 className="page-title">{activeTab.toUpperCase()}</h1>
          <div className="header-right">
            <button className="icon-btn" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <div className="admin-profile"><div className="avatar">AD</div></div>
          </div>
        </header>
        <section className="admin-content">
          {loading ? <div className="admin-loading"><div className="spinner"></div><p>Loading dashboard data...</p></div> : renderContent()}
        </section>
      </main>
    </div>
  );
};

// --- SUB-SECTIONS ---

const UserManagementSection = () => {
    const [users, setUsers] = useState<any[]>([]);
    
    useEffect(() => {
        fetch(`${BACKEND_URL}/users`)
            .then(r => r.json())
            .then(data => setUsers(Array.isArray(data) ? data : data.data || []))
            .catch(e => console.error(e));
    }, []);

    return (
        <div className="card-container fade-in">
            <h2 className="section-title">Manage Registered Students</h2>
            <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u._id || u.id}>
                          <td>{u.name || 'Unknown User'}</td>
                          <td>{u.email}</td>
                          <td>{u.role || 'Student'}</td>
                          <td><span className="badge badge-success">Active</span></td>
                        </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>No users found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const academicData: Record<string, Record<string, string[]>> = {
  "Year 1": {
    "SEMESTER I": ["Engineering Mathematics-I", "Engineering Physics", "Basic Electrical Engineering", "Environmental Science", "Engineering Graphics", "Programming-I", "Basic Civil Engineering"],
    "SEMESTER II": ["Engineering Mathematics-II", "Engineering Chemistry", "Basic Mechanical Engineering", "Programming-II", "Communication Skills", "Basic Electronics Engineering", "Engineering Workshop-I", "History of Science and Technology"]
  },
  "Year 2": {
    "SEMESTER III": ["Discrete Mathematics", "Object Oriented Programming", "Data Structures", "Java Programming", "Digital Electronics", "Data Communication", "Computer System Architecture", "Soft Skills-I"],
    "SEMESTER IV": ["Microprocessor and Interfacing", "Operating Systems", "Advanced Java Programming", "Theory of Computation", "Database Management Systems", "Elective-1", "Soft Skills-II"]
  },
  "Year 3": {
    "SEMESTER V": ["Software Engineering", "Computer Networks", "Elective-2", "Elective-3", "Fundamentals of Management Economics & Accountancy", "Soft Skills-III", "Open Elective-1"],
    "SEMESTER VI": ["Compiler Design", "Design and Analysis of Algorithms", "Research Methodology", "Universal Human Values & Professional Ethics", "Mini Project", "Soft Skills-IV", "Elective-4", "Open Elective-2"]
  },
  "Year 4": {
    "SEMESTER VII": ["Elective-5", "Elective-6", "Industrial Training", "Project-I", "Open Learning Courses", "Open Elective-3"],
    "SEMESTER VIII": ["Project-II"]
  }
};

const NotesManagementSection = () => {
    const [notes, setNotes] = useState<any[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');

    const semesters = selectedYear ? Object.keys(academicData[selectedYear] || {}) : [];
    const subjects = selectedSem && selectedYear ? academicData[selectedYear][selectedSem] || [] : [];
    const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

    const fetchNotes = async () => {
        setLoadingNotes(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (selectedYear) params.append('year', selectedYear);
            if (selectedSem) params.append('semester', selectedSem);
            if (selectedSubject) params.append('subject', selectedSubject);
            if (selectedUnit) params.append('unit', selectedUnit);

            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`${BACKEND_URL}/notes${queryStr}`);
            const data = await res.json();
            setNotes(Array.isArray(data) ? data : data.data || []);
        } catch (e) {
            console.error(e);
        }
        setLoadingNotes(false);
    };

    // Refetch when filters change completely or initially
    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedSem, selectedSubject, selectedUnit]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this note?")) return;
        try {
            await fetch(`${BACKEND_URL}/notes/${id}`, { method: 'DELETE' });
            setNotes(notes.filter(n => (n._id || n.id) !== id));
        } catch(e) { console.error(e); }
    };

    const handleApprove = async (id: string) => {
        try {
            await fetch(`${BACKEND_URL}/notes/${id}`, { 
                method: 'PUT', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: 'Approved' })
            });
            setNotes(notes.map(n => (n._id || n.id) === id ? { ...n, status: 'Approved' } : n));
        } catch (e) { console.error(e); }
    };

    const handleUpdateNoteDetails = async (id: string, currentSubject: string, currentUnit: string) => {
        const newSub = window.prompt("Edit Subject:", currentSubject);
        if (newSub === null) return;
        const newUn = window.prompt("Edit Unit:", currentUnit);
        if (newUn === null) return;
        try {
            await fetch(`${BACKEND_URL}/notes/${id}`, { 
                method: 'PUT', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ subject: newSub, unit: newUn })
            });
            setNotes(notes.map(n => (n._id || n.id) === id ? { ...n, subject: newSub, unit: newUn } : n));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="card-container fade-in">
            <h2 className="section-title">Academic Notes Moderation</h2>

            <div className="admin-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <select className="admin-input" value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedSem(''); setSelectedSubject(''); }}>
                    <option value="">All Years</option>
                    {Object.keys(academicData).map(y => <option key={y} value={y.replace('Year ', '')}>{y}</option>)}
                </select>

                <select className="admin-input" value={selectedSem} onChange={(e) => { setSelectedSem(e.target.value); setSelectedSubject(''); }} disabled={!selectedYear}>
                    <option value="">All Semesters</option>
                    {semesters.map(s => <option key={s} value={s.replace('SEMESTER ', '')}>{s}</option>)}
                </select>

                <select className="admin-input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedSem}>
                    <option value="">All Subjects</option>
                    {subjects.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                </select>

                <select className="admin-input" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} disabled={!selectedSubject}>
                    <option value="">All Units</option>
                    {units.map(u => <option key={u} value={u.replace('Unit ', '')}>{u}</option>)}
                </select>
            </div>

            {loadingNotes ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading notes from MongoDB...</div>
            ) : (
                <div className="notes-list-grid">
                    {notes.length > 0 ? notes.map(n => {
                        const nid = n._id || n.id;
                        return (
                        <div key={nid} className="note-admin-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '1.1rem' }}>{n.title}</strong>
                                    {n.status !== 'Approved' && <span className="badge badge-warning" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>Pending</span>}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Year {n.year} &bull; Sem {n.semester} &bull; Unit {n.unit}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Subject: <span style={{ color: 'var(--accent)' }}>{n.subject}</span>
                                </div>
                                {n.fileUrl && <a href={n.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#00d4ff', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>View Attachment</a>}
                            </div>
                            
                            <div className="note-actions" style={{ width: '100%', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                {n.status !== 'Approved' && (
                                    <button className="admin-btn admin-btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} onClick={() => handleApprove(nid)}>Approve</button>
                                )}
                                <button className="admin-btn admin-btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px' }} onClick={() => handleUpdateNoteDetails(nid, n.subject, n.unit)}>Edit</button>
                                <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px' }} onClick={() => handleDelete(nid)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    )}) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto' }} />
                            <p>No notes found in MongoDB for the selected filters.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ComplaintsSection = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    useEffect(() => {
        fetch(`${BACKEND_URL}/complaints`)
            .then(r => r.json())
            .then(data => setComplaints(Array.isArray(data) ? data : data.data || []))
            .catch(e => console.error(e));
    }, []);
    return (
        <div className="card-container fade-in">
            <h2 className="section-title">Security & Support Tickets</h2>
            <div className="complaints-list">
                {complaints.length > 0 ? complaints.map(c => (
                    <div key={c._id || c.id} className="complaint-card">
                        <div className="priority-tag high">High Priority</div>
                        <p>{c.issue || c.title}</p>
                        <small>Submitted by {c.student || c.authorName}</small>
                    </div>
                )) : <p style={{color: 'var(--text-muted)'}}>No complaints found.</p>}
            </div>
        </div>
    );
};

const AnnouncementsSection = () => (
    <div className="card-container fade-in">
        <h2 className="section-title">Broadcast Message</h2>
        <textarea className="admin-input" placeholder="Enter campus update..."></textarea>
        <button className="admin-btn admin-btn-primary">Post Announcement</button>
    </div>
);

const AnalyticsSection = ({ stats }: { stats: any }) => (
    <div className="card-container fade-in">
        <h2 className="section-title">Platform Analytics</h2>
        <div style={{ padding: '2rem', background: 'var(--activity-bg)', borderRadius: '16px' }}>
            <p><strong>Total Reach:</strong> {stats.users}</p>
            <p><strong>Content Index:</strong> {stats.notes}</p>
        </div>
    </div>
);

const StatCard = ({ label, value, icon }: any) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info"><h3>{value}</h3><p>{label}</p></div>
  </div>
);

const NavItem = ({ active, onClick, icon, label }: any) => (
  <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span></div>
);

const Trash2 = ({ size }: any) => <XCircle size={size} color={'#ff6b6b'} />;

export default AdminDashboard;
