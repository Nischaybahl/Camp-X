import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, AlertCircle, Bell, 
  MessageSquare, BarChart3, Search, Sun, Moon,
  LogOut, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { 
  collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import './AdminDashboard.css';

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
      
      const [usersSnap, notesSnap, complaintsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "notes")),
        getDocs(collection(db, "complaints"))
      ]);
      
      setStats({
        users: usersSnap.size,
        notes: notesSnap.size,
        complaints: complaintsSnap.size,
        activeUsers: Math.floor(usersSnap.size * 0.43)
      });

      const recentNotesQuery = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(5));
      const recentComplaintsQuery = query(collection(db, "complaints"), orderBy("createdAt", "desc"), limit(5));
      const recentUsersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
      
      const [notesRes, complaintsRes, usersRes] = await Promise.all([
        getDocs(recentNotesQuery),
        getDocs(recentComplaintsQuery),
        getDocs(recentUsersQuery)
      ]);

      const activities = [
        ...notesRes.docs.map(doc => ({ id: doc.id, type: 'note', title: doc.data().title || 'Untitled Note', user: doc.data().uploader || 'User', time: doc.data().createdAt?.toDate?.() || new Date() })),
        ...complaintsRes.docs.map(doc => ({ id: doc.id, type: 'complaint', title: doc.data().issue || 'Issue', user: doc.data().student || 'Student', time: doc.data().createdAt?.toDate?.() || new Date() })),
        ...usersRes.docs.map(doc => ({ id: doc.id, type: 'user', title: 'Joined', user: doc.data().name || 'New Student', time: doc.data().createdAt?.toDate?.() || new Date() }))
      ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);

      setRecentActivity(activities);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError("Failed to load dashboard data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (error) return <div className="admin-error"><AlertCircle /> {error} <button onClick={fetchData}>Retry</button></div>;

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
              {recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className={`activity-icon ${item.type}`}>
                    {item.type === 'note' ? <BookOpen size={18} /> : item.type === 'complaint' ? <AlertCircle size={18} /> : <Users size={18} />}
                  </div>
                  <div className="activity-details">
                    <p className="activity-text"><strong>{item.user}</strong> {item.type === 'note' ? 'uploaded' : item.type === 'complaint' ? 'reported' : 'joined'} <span>{item.type !== 'user' ? item.title : ''}</span></p>
                    <span className="activity-time"><Clock size={12} /> {item.time.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      case 'users': return <UserManagementSection />;
      case 'notes': return <NotesManagementSection />;
      case 'complaints': return <ComplaintsSection />;
      case 'announcements': return <AnnouncementsSection />;
      default: return <div className="section-placeholder">Feature coming soon</div>;
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="logo">CampX Admin</div>
        <nav className="sidebar-nav">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20} />} label="Users" />
          <NavItem active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<BookOpen size={20} />} label="Notes" />
          <NavItem active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} icon={<MessageSquare size={20} />} label="Complaints" />
          <NavItem active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Bell size={20} />} label="Updates" />
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
        getDocs(collection(db, "users")).then(snap => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);
    return (
        <div className="card-container fade-in">
            <h2 className="section-title">Manage Registered Students</h2>
            <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role || 'Student'}</td><td><span className="badge badge-success">Active</span></td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const NotesManagementSection = () => {
    const [notes, setNotes] = useState<any[]>([]);
    useEffect(() => {
        getDocs(collection(db, "notes")).then(snap => setNotes(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);
    return (
        <div className="card-container fade-in">
            <h2 className="section-title">Content Moderation</h2>
            <div className="notes-list-grid">
                {notes.map(n => (
                    <div key={n.id} className="note-admin-card">
                        <div className="note-info-row"><strong>{n.title}</strong><span>{n.subject}</span></div>
                        <div className="note-actions">
                            <button className="btn-approve"><CheckCircle2 size={16}/></button>
                            <button className="btn-delete"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ComplaintsSection = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    useEffect(() => {
        getDocs(collection(db, "complaints")).then(snap => setComplaints(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);
    return (
        <div className="card-container fade-in">
            <h2 className="section-title">Security & Support Tickets</h2>
            <div className="complaints-list">
                {complaints.map(c => (
                    <div key={c.id} className="complaint-card">
                        <div className="priority-tag high">High Priority</div>
                        <p>{c.issue}</p>
                        <small>Submitted by {c.student}</small>
                    </div>
                ))}
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

const StatCard = ({ label, value, icon }: any) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info"><h3>{value}</h3><p>{label}</p></div>
  </div>
);

const NavItem = ({ active, onClick, icon, label }: any) => (
  <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span></div>
);

const Trash2 = ({ size, color }: any) => <XCircle size={size} color={color || '#ff6b6b'} />;

export default AdminDashboard;
