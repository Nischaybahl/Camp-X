import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, AlertCircle, Bell, 
  MessageSquare, BarChart3, Search, 
  LogOut, Clock
} from 'lucide-react';
import { 
  collection, getDocs, query, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    users: 0,
    notes: 0,
    complaints: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Stats
        const usersSnap = await getDocs(collection(db, "users"));
        const notesSnap = await getDocs(collection(db, "notes"));
        const complaintsSnap = await getDocs(collection(db, "complaints"));
        
        setStats({
          users: usersSnap.size,
          notes: notesSnap.size,
          complaints: complaintsSnap.size,
          activeUsers: Math.floor(usersSnap.size * 0.4) // Simple estimate or real logic if available
        });

        // 2. Fetch Recent Activity (Latest 5 from each or mixed)
        const recentNotesQuery = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(5));
        const recentComplaintsQuery = query(collection(db, "complaints"), orderBy("createdAt", "desc"), limit(5));
        const recentUsersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
        
        const [notesRes, complaintsRes, usersRes] = await Promise.all([
          getDocs(recentNotesQuery),
          getDocs(recentComplaintsQuery),
          getDocs(recentUsersQuery)
        ]);

        const activities = [
          ...notesRes.docs.map(doc => ({ 
            id: doc.id, 
            type: 'note', 
            title: doc.data().title || 'Untitled Note', 
            user: doc.data().uploader || 'Unknown',
            time: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
          })),
          ...complaintsRes.docs.map(doc => ({ 
            id: doc.id, 
            type: 'complaint', 
            title: doc.data().issue || doc.data().description || 'Untitled Complaint', 
            user: doc.data().student || 'Admin',
            time: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
          })),
          ...usersRes.docs.map(doc => ({
            id: doc.id,
            type: 'user',
            title: 'Joined the platform',
            user: doc.data().name || 'New User',
            time: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
          }))
        ].sort((a, b) => b.time - a.time).slice(0, 5);

        setRecentActivity(activities);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderContent = () => {
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
                    {item.type === 'note' ? <BookOpen size={18} /> : 
                     item.type === 'complaint' ? <AlertCircle size={18} /> : 
                     <Users size={18} />}
                  </div>
                  <div className="activity-details">
                    <p className="activity-text">
                      <strong>{item.user}</strong> {
                        item.type === 'note' ? 'uploaded a new note:' : 
                        item.type === 'complaint' ? 'submitted a complaint:' : 
                        'joined the platform'
                      } 
                      <span> {item.type !== 'user' ? item.title : ''}</span>
                    </p>
                    <span className="activity-time">
                      <Clock size={12} /> {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="empty-state">No recent activity found.</p>
              )}
            </div>
          </div>
        </div>
      );
      case 'users': return <UserManagement />;
      case 'notes': return <NotesManagement />;
      case 'complaints': return <ComplaintsManagement />;
      case 'announcements': return <AnnouncementsManagement />;
      case 'analytics': return <AnalyticsManagement stats={stats} />;
      default: return null;
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">CampX Admin</div>
        </div>
        <nav className="sidebar-nav">
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={20} />} label="User Management" />
          <NavItem active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<BookOpen size={20} />} label="Notes Management" />
          <NavItem active={activeTab === 'complaints'} onClick={() => setActiveTab('complaints')} icon={<MessageSquare size={20} />} label="Complaints" />
          <NavItem active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Bell size={20} />} label="Announcements" />
          <NavItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={20} />} label="Analytics" />
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1 className="page-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
          <div className="header-right">
            <button className="icon-btn"><Search size={20} /></button>
            <button className="icon-btn"><Bell size={20} /></button>
            <div className="admin-profile">
              <div className="avatar">A</div>
            </div>
          </div>
        </header>

        <section className="admin-content">
          {loading ? (
            <div className="admin-loading">
              <div className="spinner"></div>
              <p>Fetching real-time data...</p>
            </div>
          ) : renderContent()}
        </section>
      </main>
    </div>
  );
};

// Sub-components for better organization

const StatCard: React.FC<{ label: string, value: number, icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <h3>{value.toLocaleString()}</h3>
      <p>{label}</p>
    </div>
  </div>
);

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    {icon}
    <span>{label}</span>
  </div>
);

// Simplified Placeholders for sections (logic to be added per tab)
const UserManagement = () => <div className="section-placeholder">User Management System</div>;
const NotesManagement = () => <div className="section-placeholder">Notes Approval & Management</div>;
const ComplaintsManagement = () => <div className="section-placeholder">Student Complaints Resolution</div>;
const AnnouncementsManagement = () => <div className="section-placeholder">Broadcast Announcements</div>;
const AnalyticsManagement = ({ stats }: any) => (
  <div className="section-placeholder">
    <h3>Platform Insights</h3>
    <div className="analytics-summary">
        <p>Total Reach: {stats.users}</p>
        <p>Content Index: {stats.notes}</p>
    </div>
  </div>
);

export default AdminDashboard;
