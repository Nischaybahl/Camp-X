import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, AlertCircle, Bell, 
  MessageSquare, BarChart3, Bot,
  LogOut, Clock, XCircle, Sparkles, RefreshCw, CheckCircle, ShieldAlert
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './AdminDashboard.css';
import { fetchAnalytics, seedKnowledgeBase, updateTicketStatus, type AnalyticsData } from '../utils/chatbotApi';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://camp-x.onrender.com/api';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, notes: 0, complaints: 0, activeUsers: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dark mode is handled by external navbar

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersRes, notesRes, complaintsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/users`),
        fetch(`${BACKEND_URL}/items/note`),
        fetch(`${BACKEND_URL}/items/complaint`)
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
      case 'chatbot': return <ChatbotAnalyticsSection />;
      default: return <div className="section-placeholder">Feature coming soon</div>;
    }
  };

  return (
    <div className="admin-layout" style={{ pointerEvents: 'auto' }}>
      <aside className="admin-sidebar" style={{ pointerEvents: 'auto', zIndex: 50 }}>
        <div className="logo">CampX Admin</div>
        <nav className="sidebar-nav">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20} />} label="User Management" />
          <NavItem active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<BookOpen size={20} />} label="Notes Management" />
          <NavItem active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} icon={<MessageSquare size={20} />} label="Complaints" />
          <NavItem active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Bell size={20} />} label="Announcements" />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem active={activeTab === 'chatbot'} onClick={() => setActiveTab('chatbot')} icon={<Bot size={20} />} label="CampX Assist" />
        </nav>
        <button className="logout-btn"><LogOut size={20} /> <span>Logout</span></button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1 className="page-title">{activeTab === 'chatbot' ? 'CAMPX ASSIST AI' : activeTab.toUpperCase()}</h1>
          <div className="header-right">
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
    const [complaints, setComplaints] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        Promise.all([
          fetch(`${BACKEND_URL}/users`).then(r => r.json()),
          fetch(`${BACKEND_URL}/items/complaint`).then(r => r.json())
        ]).then(([userData, compData]) => {
          setUsers(Array.isArray(userData) ? userData : userData.data || []);
          setComplaints(Array.isArray(compData) ? compData : compData.data || []);
          setIsLoading(false);
        }).catch(e => {
          console.error(e);
          setIsLoading(false);
        });
    }, []);

    const deleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently remove the user: ${name}?`)) return;
        try {
            await fetch(`${BACKEND_URL}/users/${id}`, { method: 'DELETE' });
            setUsers(prev => prev.filter(u => (u._id || u.id) !== id));
        } catch(e) {
            console.error(e);
            alert('Failed to delete user.');
        }
    };

    return (
        <div className="card-container fade-in">
            <h2 className="section-title">Manage Registered Students (Total: {users.length})</h2>
            
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading Users...</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Complaints Filed</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {users.map(u => {
                                const uid = u._id || u.id;
                                // Try to match complaint author or student field to user Name/Email
                                const userComplaints = complaints.filter(c => 
                                    (c.authorName === u.name) || (c.student === u.name) || (c.email === u.email)
                                );
                                return (
                                    <tr key={uid}>
                                      <td>{u.name || 'Unknown User'}</td>
                                      <td>{u.email}</td>
                                      <td><span style={{ fontWeight: 600, color: userComplaints.length > 0 ? 'var(--accent)' : 'inherit'}}>{userComplaints.length}</span></td>
                                      <td><span className="badge badge-success">Active</span></td>
                                      <td>
                                          <button 
                                            onClick={() => deleteUser(uid, u.name)}
                                            style={{ background: 'rgba(255, 60, 60, 0.1)', color: '#ff4444', border: '1px solid rgba(255,60,60,0.3)', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s', fontSize: '0.8rem' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 60, 60, 0.2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 60, 60, 0.1)'}
                                          >
                                              Remove User
                                          </button>
                                      </td>
                                    </tr>
                                );
                            })}
                            {users.length === 0 && <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>No users found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
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
            const res = await fetch(`${BACKEND_URL}/items/note`);
            const data = await res.json();
            const rawList = Array.isArray(data) ? data : data.data || [];
            
            // Client-side filtering ensures it works even if the backend lacks specific query support
            const filtered = rawList.filter((n: any) => {
                if (selectedYear && n.year != selectedYear.replace('Year ', '')) return false;
                if (selectedSem && n.semester != selectedSem.replace('SEMESTER ', '')) return false;
                if (selectedSubject && n.subject !== selectedSubject) return false;
                if (selectedUnit && n.unit != selectedUnit.replace('Unit ', '')) return false;
                return true;
            });
            
            setNotes(filtered);
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
            await fetch(`${BACKEND_URL}/items/note/${id}`, { method: 'DELETE' });
            setNotes(notes.filter(n => (n._id || n.id) !== id));
        } catch(e) { console.error(e); }
    };

    const handleApprove = async (id: string) => {
        try {
            await fetch(`${BACKEND_URL}/items/note/${id}`, { 
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
            await fetch(`${BACKEND_URL}/items/note/${id}`, { 
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
        fetch(`${BACKEND_URL}/items/complaint`)
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

const CHATBOT_COLORS = ['#ccff00', '#00d4ff', '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#9d4edd', '#f72585'];

const ChatbotAnalyticsSection: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAnalytics();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load chatbot analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await seedKnowledgeBase();
      setSeedNotice(res.message || 'Knowledge base seeded successfully!');
      setTimeout(() => setSeedNotice(null), 5000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Seed failed';
      alert('Error seeding KB: ' + msg);
    } finally {
      setSeeding(false);
    }
  };

  const handleStatusChange = async (trackingId: string, newStatus: string) => {
    try {
      setUpdatingId(trackingId);
      await updateTicketStatus(trackingId, newStatus);
      if (data) {
        setData({
          ...data,
          recentTickets: data.recentTickets.map(t =>
            t.trackingId === trackingId ? { ...t, status: newStatus } : t
          ),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      alert('Failed to update ticket status: ' + msg);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading fade-in">
        <div className="spinner"></div>
        <p>Loading CampX Assist AI metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error fade-in">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button className="admin-btn-primary" onClick={loadData} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Retry</button>
      </div>
    );
  }

  const categoryChartData = (data?.categoryBreakdown || []).filter(c => c.value > 0);
  const statusChartData = data?.statusBreakdown || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner / Actions */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(204,255,0,0.1) 0%, rgba(0,212,255,0.05) 100%)',
        border: '1px solid rgba(204,255,0,0.2)',
        borderRadius: '20px',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>CampX Assist AI Governance & Redressal</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time analytics, SLA grievance tracking, and AI knowledge base controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadData}
            title="Refresh metrics"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              borderRadius: '12px',
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <button
            onClick={handleSeed}
            disabled={seeding}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: '#000',
              borderRadius: '12px',
              padding: '10px 18px',
              cursor: seeding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              opacity: seeding ? 0.7 : 1,
            }}
          >
            <Sparkles size={14} /> {seeding ? 'Seeding KB...' : 'Seed FAQ Knowledge Base'}
          </button>
        </div>
      </div>

      {seedNotice && (
        <div style={{
          background: 'rgba(40, 167, 69, 0.15)',
          border: '1px solid rgba(40, 167, 69, 0.4)',
          color: '#28a745',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
        }}>
          <CheckCircle size={18} /> {seedNotice}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Student Queries" value={data?.totalQueries || 0} icon={<Bot />} />
        <StatCard label="AI Deflection Rate" value={`${data?.deflectionRate || 0}%`} icon={<Sparkles />} />
        <StatCard label="Tickets Escalated" value={data?.totalTickets || 0} icon={<AlertCircle />} />
        <StatCard label="Urgent / Sensitive Cases" value={(data?.urgentCount || 0) + (data?.sensitiveCount || 0)} icon={<ShieldAlert />} />
        <StatCard label="Confidential Inquiries" value={data?.confidentialCount || 0} icon={<Users />} />
        <StatCard label="Avg Satisfaction Rating" value={data?.avgRating ? `${data.avgRating} / 5` : 'N/A'} icon={<BarChart3 />} />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Category Breakdown */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Tickets by Category</h3>
          <div style={{ width: '100%', height: 260 }}>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHATBOT_COLORS[index % CHATBOT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1b1e24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No ticket category data yet.
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Ticket Resolution Status</h3>
          <div style={{ width: '100%', height: 260 }}>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1b1e24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#ccff00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No status data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Chatbot Tickets Table */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent AI Redressal Tickets</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Manage and update status for tickets generated through CampX Assist.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Priority</th>
                <th>SLA Target</th>
                <th>Confidential</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentTickets || []).length > 0 ? (
                data!.recentTickets.map(t => {
                  const isOverdue = t.overdue;
                  const isUpdating = updatingId === t.trackingId;

                  return (
                    <tr key={t.id || t.trackingId}>
                      <td>
                        <strong style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>
                          {t.trackingId}
                        </strong>
                      </td>
                      <td>{t.category}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: t.urgency === 'Urgent' ? 'rgba(255,60,60,0.15)' : t.urgency === 'Sensitive' ? 'rgba(255,165,0,0.15)' : 'rgba(255,255,255,0.06)',
                          color: t.urgency === 'Urgent' ? '#ff4444' : t.urgency === 'Sensitive' ? '#ffa500' : 'var(--text-main)',
                        }}>
                          {t.urgency || 'Routine'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.priority === 'urgent' ? 'badge-danger' : t.priority === 'high' ? 'badge-warning' : 'badge-success'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.8rem', color: isOverdue ? '#ff4444' : 'var(--text-muted)' }}>
                            {t.slaDeadline ? new Date(t.slaDeadline).toLocaleDateString() : 'N/A'}
                          </span>
                          {isOverdue && (
                            <span style={{
                              background: 'rgba(255,60,60,0.2)',
                              color: '#ff4444',
                              borderRadius: '4px',
                              padding: '2px 5px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                            }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {t.isConfidential ? (
                          <span style={{ color: '#00d4ff', fontSize: '0.8rem', fontWeight: 600 }}>🔒 Yes</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No</span>
                        )}
                      </td>
                      <td>
                        <select
                          value={t.status}
                          disabled={isUpdating}
                          onChange={e => handleStatusChange(t.trackingId, e.target.value)}
                          style={{
                            background: 'var(--activity-bg)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No chatbot tickets logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

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
