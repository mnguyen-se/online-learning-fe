import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { logout } from '../../store/slices/userSlice';
import { useAuth } from '../../hooks';
import Header from '../Header/header';
import './DashboardLayout.css';

const getSidebarItems = (role) => {
  const base = [
    { key: '/', label: 'Trang chủ', path: '/' },
  ];
  if (role === 'ADMIN') {
    return [
      ...base,
      { key: '/dashboard-admin', label: 'Dashboard', path: '/dashboard-admin' },
      { key: 'users', label: 'Quản lý người dùng', path: '/dashboard-admin' },
      { key: 'courses', label: 'Khóa học', path: '/dashboard-admin' },
    ];
  }
  if (role === 'COURSE_MANAGER') {
    return [
      ...base,
      { key: '/dashboard-manager', label: 'Quản lý khóa học', path: '/dashboard-manager' },
    ];
  }
  if (role === 'TEACHER') {
    return [
      ...base,
      { key: '/teacher-page', label: 'Trang giáo viên', path: '/teacher-page' },
    ];
  }
  return base;
};

function DashboardLayout({
  children,
  pageTitle,
  pageSubtitle,
  showSidebar = true,
  showTopbar = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { role, username } = useAuth();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Đã đăng xuất.');
    navigate('/login');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const sidebarItems = showSidebar ? getSidebarItems(role) : [];
  const headerTitleByRole = {
    ADMIN: 'Trang Quản trị viên',
    COURSE_MANAGER: 'Trang Quản lí khóa học',
    TEACHER: 'Trang Giáo viên',
  };
  const headerTitle = headerTitleByRole[role] || '';

  return (
    <div className="shared-dashboard-layout">
      {showSidebar && (
        <aside className="shared-dashboard-sidebar">
          <div className="shared-sidebar-header">
            <button type="button" className="shared-sidebar-logo-btn" onClick={handleBackToHome} title="Back to Home">
              <div className="shared-sidebar-logo">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="16" height="16" rx="3" fill="#FF6B4A" />
                  <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">日</text>
                </svg>
                <span>EduLearn</span>
              </div>
            </button>
            <div className="shared-sidebar-user-below-logo">
              <span className="shared-sidebar-username">{username || 'User'}</span>
              <span className="shared-sidebar-role">{role || '—'}</span>
            </div>
          </div>

          <nav className="shared-sidebar-nav">
            {sidebarItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`shared-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.key === '/' ? (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                )}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="shared-sidebar-footer">
            <button type="button" className="shared-sidebar-logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>
      )}

      <div className="shared-dashboard-main">
        <Header headerTitle={headerTitle} />
        {showTopbar && (
          <header className="shared-dashboard-topbar">
            <div className="shared-topbar-left">
              {(pageTitle || pageSubtitle) && (
                <div className="shared-topbar-title">
                  {pageTitle && <h1 className="shared-topbar-title-text">{pageTitle}</h1>}
                  {pageSubtitle && <p className="shared-topbar-subtitle">{pageSubtitle}</p>}
                </div>
              )}
            </div>
          </header>
        )}

        <main className="shared-dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
