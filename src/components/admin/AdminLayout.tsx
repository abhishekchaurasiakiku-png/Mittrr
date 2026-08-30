import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { FiHome, FiUsers, FiFlag, FiSettings, FiLogOut } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import '../../styles/admin.css'; // We will create this

export default function AdminLayout() {
  const { isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <div className="admin-loading">Loading Admin...</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/reports', icon: FiFlag, label: 'Reports' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>KIKU Admin</h2>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon className="admin-nav-icon" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
