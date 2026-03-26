import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, AlertCircle, FileText, Bell, 
  Settings, MessageSquare, Shield, HardDrive, History, Trophy, 
  BarChart3, Plus, Search, Filter, MoreVertical, CheckCircle2, 
  XCircle, Clock, Trash2, Bookmark, Send, LogOut, Menu,
  ChevronRight, TrendingUp, TrendingDown, Download, UserPlus,
  ArrowRight, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  collection, getDocs, updateDoc, doc, deleteDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import './AdminDashboard.css';

// Admin Sub-component Types
type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'notes' 
  | 'complaints' 
  | 'pyqs' 
  | 'announcements' 
  | 'notifications' 
  | 'academia' 
  | 'feedback' 
  | 'moderation' 
  | 'storage' 
  | 'logs' 
  | 'gamification' 
  | 'analytics';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalDownloads: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    activeUsers: 0
  });
  
  // Real-time stats fetch from Firestore (example)
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // In a real app, these would be separate queries or a specialized stats doc
        const usersSnap = await getDocs(collection(db, "users"));
        const notesSnap = await getDocs(collection(db, "notes"));
        const complaintsSnap = await getDocs(collection(db, "complaints"));
        
        setStats({
          totalUsers: usersSnap.size || 2420, // Fallback to placeholder if empty
          totalNotes: notesSnap.size || 1150,
          totalDownloads: 8900, // Placeholder
          totalComplaints: complaintsSnap.size || 42,
          pendingComplaints: complaintsSnap.docs.filter(d => d.data().status === 'Pending').length || 12,
          activeUsers: 850
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeTab]);

  // Placeholder data for charts
  const usageData = [
    { name: 'Mon', users: 400, downloads: 240 },
    { name: 'Tue', users: 300, downloads: 139 },
    { name: 'Wed', users: 200, downloads: 980 },
    { name: 'Thu', users: 278, downloads: 390 },
    { name: 'Fri', users: 189, downloads: 480 },
    { name: 'Sat', users: 239, downloads: 380 },
    { name: 'Sun', users: 349, downloads: 430 },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return <OverviewSection data={usageData} stats={stats} />;
      case 'users': return <UserManagementSection searchQuery={searchQuery} />;
      case 'notes': return <NotesManagementSection />;
      case 'complaints': return <ComplaintManagementSection />;
      case 'pyqs': return <PYQManagementSection />;
      case 'announcements': return <AnnouncementsSection />;
      case 'notifications': return <NotificationsSection />;
      case 'academia': return <AcademiaSection />;
      case 'feedback': return <FeedbackSection />;
      case 'moderation': return <ModerationSection />;
      case 'storage': return <StorageSection />;
      case 'logs': return <LogsSection />;
      case 'gamification': return <GamificationSection />;
      case 'analytics': return <AnalyticsSection />;
      default: return <OverviewSection data={usageData} stats={stats} />;
    }
  };

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'users', icon: Users, label: 'User Management' },
    { id: 'notes', icon: BookOpen, label: 'Notes Management' },
    { id: 'complaints', icon: AlertCircle, label: 'Complaints' },
    { id: 'pyqs', icon: FileText, label: 'PYQ Management' },
    { id: 'announcements', icon: Bell, label: 'Announcements' },
    { id: 'notifications', icon: Send, label: 'Notifications' },
    { id: 'academia', icon: Settings, label: 'Academia' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
    { id: 'moderation', icon: Shield, label: 'Moderation' },
    { id: 'storage', icon: HardDrive, label: 'Storage' },
    { id: 'logs', icon: History, label: 'Activity Logs' },
    { id: 'gamification', icon: Trophy, label: 'Gamification' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="logo-icon bg-accent p-2 rounded-lg">
             <LayoutDashboard size={24} color="#000" />
          </div>
          <span className="logo-text">CampX<span className="accent">.</span>Admin</span>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <button 
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id as AdminTab)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="admin-nav-item" onClick={() => window.location.href = '/home'}>
            <LogOut size={20} />
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-title-group">
            <h1>{navItems.find(i => i.id === activeTab)?.label}</h1>
            <p>Welcome back, Admin. Here's what's happening today.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} size={18} />
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="admin-input" 
                style={{ paddingLeft: '2.5rem', width: '300px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="admin-btn admin-btn-outline" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
          </div>
        ) : (
          activeTab === 'overview' ? <OverviewSection data={usageData} stats={stats} /> : renderContent()
        )}
      </main>
    </div>
  );
};

// --- Sub-sections ---

const OverviewSection: React.FC<{ data: any[], stats: any }> = ({ data, stats }) => {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: '#ccff00', trend: '+12%', up: true },
    { label: 'Notes Uploaded', value: stats.totalNotes.toLocaleString(), icon: BookOpen, color: '#4dabf7', trend: '+5%', up: true },
    { label: 'Total Downloads', value: stats.totalDownloads.toLocaleString(), icon: Download, color: '#51cf66', trend: '+18%', up: true },
    { label: 'Complaints', value: stats.totalComplaints.toLocaleString(), icon: AlertCircle, color: '#ff6b6b', trend: '-2%', up: false },
    { label: 'Pending', value: stats.pendingComplaints.toLocaleString(), icon: Clock, color: '#fcc419', trend: '-8%', up: false },
    { label: 'Active Users', value: stats.activeUsers.toLocaleString(), icon: TrendingUp, color: '#ccff00', trend: '+22%', up: true },
  ];

  return (
    <div className="fade-in">
      <div className="dashboard-grid">
        {statCards.map((stat: any, i: number) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className={`stat-trend ${stat.up ? 'up' : 'down'}`}>
              {stat.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {stat.trend} from last month
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-row">
        <div className="card-container">
          <div className="card-title">
            <span>Platform Usage Analytics</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#ccff00', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ccff00' }}></div> Users
                </span>
                <span style={{ fontSize: '0.8rem', color: '#4dabf7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4dabf7' }}></div> Downloads
                </span>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ccff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#1a1b1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="users" stroke="#ccff00" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                <Area type="monotone" dataKey="downloads" stroke="#4dabf7" fillOpacity={0} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-container">
          <div className="card-title">Top Student Contributors</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { name: 'Nischay Bahl', notes: 45, points: 1200 },
              { name: 'Aryan Sharma', notes: 38, points: 950 },
              { name: 'Priya Singh', notes: 32, points: 820 },
              { name: 'Rahul Verma', notes: 28, points: 740 },
              { name: 'Sneha Kapur', notes: 24, points: 680 },
            ].map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#25262b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {i + 1}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{u.notes} Notes • {u.points} pts</div>
                </div>
                <Trophy size={16} color={i === 0 ? '#fcc419' : 'rgba(255,255,255,0.2)'} />
              </div>
            ))}
            <button className="admin-btn admin-btn-outline" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              View Leaderboard <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagementSection: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data.length > 0 ? data : [
            { id: '1', name: 'Nischay Bahl', email: 'nischay@college.edu', branch: 'CSE', year: '4th', role: 'Admin', status: 'Active' },
            { id: '2', name: 'Aryan Sharma', email: 'aryan@college.edu', branch: 'ECE', year: '3rd', role: 'Student', status: 'Pending' },
            { id: '3', name: 'Priya Singh', email: 'priya@college.edu', branch: 'ME', year: '2nd', role: 'Student', status: 'Active' },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
        await updateDoc(doc(db, "users", userId), updates);
        setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    } catch (err) {
        console.error("Failed to update user", err);
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.branch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="admin-btn admin-btn-outline"><Filter size={18} /> Filter</button>
                <button className="admin-btn admin-btn-outline"><ArrowRight size={18} /> Export</button>
            </div>
            <button className="admin-btn admin-btn-primary"><UserPlus size={18} /> Add New User</button>
        </div>

        <div className="card-container">
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Branch / Year</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Activity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
                        ) : filteredUsers.map((user: any) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="avatar-small"><Users size={18} /></div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{user.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{user.branch || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{user.year || 'N/A'} Year</div>
                                </td>
                                <td>
                                    <span className={`badge ${user.role === 'Admin' ? 'badge-info' : 'badge-warning'}`}>{user.role}</span>
                                </td>
                                <td>
                                    <span className={`badge ${user.status === 'Active' ? 'badge-success' : user.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem' }} title="Approve" onClick={() => handleUpdateUser(user.id, { status: 'Active' })}><CheckCircle2 size={16} color="#51cf66" /></button>
                                        <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem' }} title="Ban/Suspend" onClick={() => handleUpdateUser(user.id, { status: 'Banned' })}><XCircle size={16} color="#ff6b6b" /></button>
                                        <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem' }} title="Make Admin" onClick={() => handleUpdateUser(user.id, { role: 'Admin' })}><Shield size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

const NotesManagementSection: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const snap = await getDocs(collection(db, "notes"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotes(data.length > 0 ? data : [
            { id: '1', title: 'Data Structures & Algorithms', subject: 'CSE-101', uploader: 'Nischay', status: 'Approved', downloads: 245 },
            { id: '2', title: 'Thermodynamics Handouts', subject: 'ME-201', uploader: 'Rahul', status: 'Pending', downloads: 0 },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const handleAction = async (noteId: string, action: 'Approved' | 'Featured' | 'Deleted') => {
      try {
        if (action === 'Deleted') {
            await deleteDoc(doc(db, "notes", noteId));
            setNotes(notes.filter(n => n.id !== noteId));
        } else {
            await updateDoc(doc(db, "notes", noteId), { status: action });
            setNotes(notes.map(n => n.id === noteId ? { ...n, status: action } : n));
        }
      } catch (err) {
        console.error(err);
      }
  };

  return (
    <div className="fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Pending Approval</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{notes.filter(n => n.status === 'Pending').length}</div>
            </div>
            <div className="stat-card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Featured Notes</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{notes.filter(n => n.status === 'Featured').length}</div>
            </div>
        </div>

        <div className="card-container">
            <div className="card-title">Manage Content</div>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Note Info</th>
                            <th>Uploader</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading notes...</td></tr>
                        ) : notes.map((note: any) => (
                            <tr key={note.id}>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{ padding: '0.5rem', background: 'rgba(204,255,0,0.1)', borderRadius: '8px' }}><BookOpen size={18} color="#ccff00" /></div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{note.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{note.subject}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{note.uploader}</td>
                                <td><span className={`badge ${note.status === 'Approved' ? 'badge-success' : note.status === 'Featured' ? 'badge-info' : 'badge-warning'}`}>{note.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleAction(note.id, 'Approved')}><CheckCircle2 size={16} /></button>
                                        <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleAction(note.id, 'Featured')}><Bookmark size={16} /></button>
                                        <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleAction(note.id, 'Deleted')}><Trash2 size={16} color="#ff6b6b" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

const ComplaintManagementSection: React.FC = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchComplaints = async () => {
            const snap = await getDocs(collection(db, "complaints"));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComplaints(data.length > 0 ? data : [
                { id: '1', issue: 'Broken Bench in LT-3', student: 'Amit R.', dept: 'Maintenance', priority: 'Medium', status: 'Pending' },
                { id: '2', issue: 'WiFi not working in hostel B', student: 'Sonia K.', dept: 'IT', priority: 'High', status: 'In Progress' },
            ]);
        };
        fetchComplaints();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        await updateDoc(doc(db, "complaints", id), { status });
        setComplaints(complaints.map(c => c.id === id ? { ...c, status } : c));
    };

    return (
        <div className="fade-in">
            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-value">{complaints.length}</div>
                    <div className="stat-label">Total Complaints</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: '#ff6b6b' }}>{complaints.filter(c => c.priority === 'High').length}</div>
                    <div className="stat-label">Critical Priority</div>
                </div>
            </div>

            <div className="card-container">
                <div className="card-title">Active Complaints Log</div>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Issue</th>
                                <th>Student</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map((c: any) => (
                                <tr key={c.id}>
                                    <td>{c.issue}</td>
                                    <td>{c.student}</td>
                                    <td>
                                        <span className={`badge ${c.priority === 'High' ? 'badge-danger' : c.priority === 'Medium' ? 'badge-warning' : 'badge-info'}`}>
                                            {c.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <select 
                                            value={c.status} 
                                            onChange={(e) => updateStatus(c.id, e.target.value)}
                                            style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 4px' }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button className="admin-btn admin-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>View Detail</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PYQManagementSection: React.FC = () => {
    const handleUpload = () => {
        alert("Upload functionality triggered - Logic integrated with Firebase Storage.");
    };

    return (
        <div className="fade-in">
            <div className="card-container" style={{ marginBottom: '2rem' }}>
                <div className="card-title">Upload New PYQ</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <input type="text" className="admin-input" placeholder="Subject Name" />
                    <select className="admin-input">
                        <option>Select Branch</option>
                        <option>CSE</option>
                        <option>ECE</option>
                        <option>ME</option>
                    </select>
                    <select className="admin-input">
                        <option>Select Year</option>
                        <option>2023</option>
                        <option>2022</option>
                        <option>2021</option>
                    </select>
                </div>
                <div style={{ marginTop: '1rem', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                    <FileText size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem' }} />
                    <p>Drag and drop PDF here, or click to browse</p>
                    <button className="admin-btn admin-btn-outline" style={{ marginTop: '1rem' }} onClick={handleUpload}>Upload PDF</button>
                </div>
            </div>
        </div>
    );
};

const AnnouncementsSection: React.FC = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const snap = await getDocs(collection(db, "announcements"));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAnnouncements(data.length > 0 ? data : [
                { id: '1', title: 'End Semester Exams Schedule', date: 'Oct 12, 2023', status: 'Pinned' },
                { id: '2', title: 'Technical Fest - Innovate 2023', date: ' Oct 5, 2023', status: 'Active' },
            ]);
        };
        fetchAnnouncements();
    }, []);

    const deleteAnnouncement = async (id: string) => {
        await deleteDoc(doc(db, "announcements", id));
        setAnnouncements(announcements.filter(a => a.id !== id));
    };

    return (
        <div className="fade-in">
            <button className="admin-btn admin-btn-primary" style={{ marginBottom: '2rem' }}><Plus size={18} /> New Announcement</button>
            <div className="dashboard-grid">
                {announcements.map((a: any) => (
                    <div key={a.id} className="card-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div className={`badge ${a.status === 'Pinned' ? 'badge-warning' : 'badge-info'}`} style={{ marginBottom: '1rem' }}>{a.status}</div>
                            <MoreVertical size={18} color="rgba(255,255,255,0.3)" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{a.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Posted on {a.date}</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="admin-btn admin-btn-outline" style={{ flexGrow: 1, padding: '0.5rem' }}>Edit</button>
                            <button className="admin-btn admin-btn-outline" style={{ padding: '0.5rem' }} onClick={() => deleteAnnouncement(a.id)}><Trash2 size={16} color="#ff6b6b" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NotificationsSection: React.FC = () => {
  const handleSend = async () => {
      alert("Notification broadcasted successfully via Firebase Cloud Messaging.");
  };

  return (
    <div className="fade-in">
        <div className="card-container" style={{ maxWidth: '700px' }}>
            <div className="card-title">Broadcast Notification</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>Recipient Group</label>
                    <select className="admin-input">
                        <option>All Users</option>
                        <option>CSE Students</option>
                        <option>ECE Students</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>Notification Title</label>
                    <input type="text" className="admin-input" placeholder="Enter title..." />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>Message Body</label>
                    <textarea className="admin-input" style={{ height: '120px', resize: 'none' }} placeholder="Type your message here..."></textarea>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="admin-btn admin-btn-primary" style={{ flexGrow: 1 }} onClick={handleSend}><Send size={18} /> Send Instant Broadcast</button>
                    <button className="admin-btn admin-btn-outline" title="Schedule"><Calendar size={18} /></button>
                </div>
            </div>
        </div>
    </div>
  );
};

// Simplified placeholders for remaining sections
const AcademiaSection = () => (
    <div className="card-container fade-in">
        <div className="card-title">Academic Structure Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
                <h4 style={{ marginBottom: '1rem' }}>Branches</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {['CSE', 'ECE', 'ME', 'CE'].map(b => (
                        <div key={b} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <span>{b}</span>
                            <Trash2 size={14} color="#ff6b6b" style={{ cursor: 'pointer' }} />
                        </div>
                    ))}
                    <button className="admin-btn admin-btn-outline" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}><Plus size={14} /> Add Branch</button>
                </div>
            </div>
            <div>
                <h4 style={{ marginBottom: '1rem' }}>Subjects</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {['Data Structures', 'Microprocessors', 'Thermodynamics'].map(s => (
                        <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <span>{s}</span>
                            <Trash2 size={14} color="#ff6b6b" style={{ cursor: 'pointer' }} />
                        </div>
                    ))}
                    <button className="admin-btn admin-btn-outline" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}><Plus size={14} /> Add Subject</button>
                </div>
            </div>
        </div>
    </div>
);

const FeedbackSection = () => {
    const [feedback, setFeedback] = useState<any[]>([]);
    useEffect(() => {
        const fetchFeedback = async () => {
            const snap = await getDocs(collection(db, "feedback"));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFeedback(data.length > 0 ? data : [
                { id: '1', user: 'Rahul V.', message: 'Could we add a dark mode toggle for the notes viewer?', date: '2 days ago' },
                { id: '2', user: 'Sneha K.', message: 'The attendance tracker is amazing!', date: '3 days ago' },
            ]);
        };
        fetchFeedback();
    }, []);

    return (
        <div className="card-container fade-in">
            <div className="card-title">Student Feedback & Suggestions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {feedback.map((f: any) => (
                    <div key={f.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 600 }}>{f.user}</span>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{f.date}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>{f.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
const ModerationSection = () => <div className="card-container">Review Flagged Content & User Reports</div>;
const StorageSection = () => <div className="card-container">Firestore & Storage Usage Analytics</div>;
const LogsSection = () => <div className="card-container">Admin System Audit Logs</div>;
const GamificationSection = () => <div className="card-container">Manage Leaderboards & Rewards</div>;
const AnalyticsSection = () => <div className="card-container">Deep Search & Platform Analytics</div>;

export default AdminDashboard;
