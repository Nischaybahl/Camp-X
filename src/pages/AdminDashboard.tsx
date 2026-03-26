import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, AlertCircle, Bell, 
  MessageSquare, BarChart3, Sun, Moon,
  LogOut, Clock, XCircle
} from 'lucide-react';
import { 
  collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, addDoc
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
      
      // 5-second manual timeout array
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Firebase query timed out. Check Vercel ENV variables.")), 5000)
      );
      
      const countsSnap = await Promise.race([
        Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "notes")),
          getDocs(collection(db, "complaints"))
        ]),
        timeout
      ]);
      
      const [usersSnap, notesSnap, complaintsSnap] = countsSnap as any;
      
      setStats({
        users: usersSnap.size,
        notes: notesSnap.size,
        complaints: complaintsSnap.size,
        activeUsers: Math.floor(usersSnap.size * 0.43)
      });

      const recentNotesQuery = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(5));
      const recentComplaintsQuery = query(collection(db, "complaints"), orderBy("createdAt", "desc"), limit(5));
      const recentUsersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
      
      const activitiesSnap = await Promise.race([
        Promise.all([
          getDocs(recentNotesQuery),
          getDocs(recentComplaintsQuery),
          getDocs(recentUsersQuery)
        ]),
        timeout
      ]);

      const [notesRes, complaintsRes, usersRes] = activitiesSnap as any;

      const activities = [
        ...notesRes.docs.map((doc: any) => ({ id: doc.id, type: 'note', title: doc.data().title || 'Untitled Note', user: doc.data().uploader || 'User', time: doc.data().createdAt?.toDate?.() || new Date() })),
        ...complaintsRes.docs.map((doc: any) => ({ id: doc.id, type: 'complaint', title: doc.data().issue || 'Issue', user: doc.data().student || 'Student', time: doc.data().createdAt?.toDate?.() || new Date() })),
        ...usersRes.docs.map((doc: any) => ({ id: doc.id, type: 'user', title: 'Joined', user: doc.data().name || 'New Student', time: doc.data().createdAt?.toDate?.() || new Date() }))
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

const academicData: Record<string, Record<string, string[]>> = {
  "Year 1": {
    "SEMESTER I": [
      "Engineering Mathematics-I",
      "Engineering Physics",
      "Basic Electrical Engineering",
      "Environmental Science",
      "Engineering Graphics",
      "Programming-I",
      "Basic Civil Engineering"
    ],
    "SEMESTER II": [
      "Engineering Mathematics-II",
      "Engineering Chemistry",
      "Basic Mechanical Engineering",
      "Programming-II",
      "Communication Skills",
      "Basic Electronics Engineering",
      "Engineering Workshop-I",
      "History of Science and Technology"
    ]
  },
  "Year 2": {
    "SEMESTER III": [
      "Discrete Mathematics",
      "Object Oriented Programming",
      "Data Structures",
      "Java Programming",
      "Digital Electronics",
      "Data Communication",
      "Computer System Architecture",
      "Soft Skills-I"
    ],
    "SEMESTER IV": [
      "Microprocessor and Interfacing",
      "Operating Systems",
      "Advanced Java Programming",
      "Theory of Computation",
      "Database Management Systems",
      "Elective-1",
      "Soft Skills-II"
    ]
  },
  "Year 3": {
    "SEMESTER V": [
      "Software Engineering",
      "Computer Networks",
      "Elective-2",
      "Elective-3",
      "Fundamentals of Management Economics & Accountancy",
      "Soft Skills-III",
      "Open Elective-1"
    ],
    "SEMESTER VI": [
      "Compiler Design",
      "Design and Analysis of Algorithms",
      "Research Methodology",
      "Universal Human Values & Professional Ethics",
      "Mini Project",
      "Soft Skills-IV",
      "Elective-4",
      "Open Elective-2"
    ]
  },
  "Year 4": {
    "SEMESTER VII": [
      "Elective-5",
      "Elective-6",
      "Industrial Training",
      "Project-I",
      "Open Learning Courses",
      "Open Elective-3"
    ],
    "SEMESTER VIII": [
      "Project-II"
    ]
  }
};

const NotesManagementSection = () => {
    const [notes, setNotes] = useState<any[]>([]);
    
    // Filters & Selections
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');

    const [uploadMode, setUploadMode] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newFileURL, setNewFileURL] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    const semesters = selectedYear ? Object.keys(academicData[selectedYear] || {}) : [];
    const subjects = selectedSem && selectedYear ? academicData[selectedYear][selectedSem] || [] : [];
    const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

    const fetchNotes = async () => {
        try {
            const snap = await getDocs(collection(db, "notes"));
            setNotes(snap.docs.map(d => ({id: d.id, ...d.data()})));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleUpload = async () => {
        if (!selectedYear || !selectedSem || !selectedSubject || !selectedUnit || !newTitle || !newFileURL) {
            alert("Please fill all fields to upload.");
            return;
        }
        setLoadingAction(true);
        try {
            const noteData = {
                year: selectedYear,
                semester: selectedSem,
                subject: selectedSubject,
                unit: selectedUnit,
                title: newTitle,
                fileURL: newFileURL,
                uploadedBy: 'Admin',
                status: 'Approved',
                createdAt: new Date()
            };
            await addDoc(collection(db, "notes"), noteData);
            alert("Note uploaded successfully!");
            setNewTitle('');
            setNewFileURL('');
            setUploadMode(false);
            fetchNotes();
        } catch(e) {
            console.error(e);
            alert("Failed to upload note.");
        }
        setLoadingAction(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this note?")) return;
        setLoadingAction(true);
        try {
            await deleteDoc(doc(db, "notes", id));
            setNotes(notes.filter(n => n.id !== id));
        } catch(e) {
            console.error(e);
        }
        setLoadingAction(false);
    };

    const handleApprove = async (id: string) => {
        setLoadingAction(true);
        try {
            await updateDoc(doc(db, "notes", id), { status: 'Approved' });
            setNotes(notes.map(n => n.id === id ? { ...n, status: 'Approved' } : n));
        } catch (e) {
            console.error(e);
        }
        setLoadingAction(false);
    };

    const handleUpdateNoteDetails = async (id: string, currentSubject: string, currentUnit: string) => {
        const newSub = window.prompt("Edit Subject:", currentSubject);
        if (newSub === null) return;
        const newUn = window.prompt("Edit Unit:", currentUnit);
        if (newUn === null) return;
        
        setLoadingAction(true);
        try {
            await updateDoc(doc(db, "notes", id), { subject: newSub, unit: newUn });
            setNotes(notes.map(n => n.id === id ? { ...n, subject: newSub, unit: newUn } : n));
        } catch (e) {
            console.error(e);
        }
        setLoadingAction(false);
    };

    // Filtering logic for display
    const filteredNotes = notes.filter(n => {
        if (selectedYear && n.year !== selectedYear) return false;
        if (selectedSem && n.semester !== selectedSem) return false;
        if (selectedSubject && n.subject !== selectedSubject) return false;
        if (selectedUnit && n.unit !== selectedUnit) return false;
        return true;
    });

    return (
        <div className="card-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Content Moderation</h2>
                <button 
                  className="admin-btn admin-btn-primary" 
                  onClick={() => setUploadMode(!uploadMode)}
                  disabled={loadingAction}
                >
                    {uploadMode ? 'View Notes' : 'Upload New Note'}
                </button>
            </div>

            {/* Step-by-step Selection */}
            <div className="admin-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <select className="admin-input" style={{ marginBottom: 0 }} value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedSem(''); setSelectedSubject(''); }}>
                    <option value="">Select Year</option>
                    {Object.keys(academicData).map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select className="admin-input" style={{ marginBottom: 0 }} value={selectedSem} onChange={(e) => { setSelectedSem(e.target.value); setSelectedSubject(''); }} disabled={!selectedYear}>
                    <option value="">Select Semester</option>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select className="admin-input" style={{ marginBottom: 0 }} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedSem}>
                    <option value="">Select Subject</option>
                    {subjects.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                </select>

                <select className="admin-input" style={{ marginBottom: 0 }} value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} disabled={!selectedSubject}>
                    <option value="">Select Unit</option>
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>

            {uploadMode ? (
                <div style={{ background: 'var(--activity-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Upload Note Details</h3>
                    <input type="text" className="admin-input" placeholder="Note Title (e.g. Trees and Graphs)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <input type="text" className="admin-input" placeholder="File URL (Google Drive, PDF link, etc.)" value={newFileURL} onChange={e => setNewFileURL(e.target.value)} />
                    <button className="admin-btn admin-btn-primary" onClick={handleUpload} disabled={loadingAction} style={{ width: '100%', padding: '1rem' }}>
                        {loadingAction ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                </div>
            ) : (
                <div className="notes-list-grid">
                    {filteredNotes.length > 0 ? filteredNotes.map(n => (
                        <div key={n.id} className="note-admin-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '1.1rem' }}>{n.title}</strong>
                                    {n.status !== 'Approved' && <span className="badge badge-warning" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>Pending</span>}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {n.year} &bull; {n.semester} &bull; {n.unit}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Subject: <span style={{ color: 'var(--accent)' }}>{n.subject}</span>
                                </div>
                                {n.fileURL && <a href={n.fileURL} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#00d4ff', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>View Attachment</a>}
                            </div>
                            
                            <div className="note-actions" style={{ width: '100%', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                {n.status !== 'Approved' && (
                                    <button className="admin-btn admin-btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} onClick={() => handleApprove(n.id)}>Approve</button>
                                )}
                                <button className="admin-btn admin-btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '8px' }} onClick={() => handleUpdateNoteDetails(n.id, n.subject, n.unit)}>Edit</button>
                                <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px' }} onClick={() => handleDelete(n.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto' }} />
                            <p>No notes found for the selected filters.</p>
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
