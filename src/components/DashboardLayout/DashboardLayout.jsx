import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { LayoutDashboard, BookOpen, Feather, MessageSquare, Home } from 'lucide-react';
import { logout } from '../../store/slices/userSlice';
import { useAuth } from '../../hooks';
import Header from '../Header/header';
import logoImg from '../../assets/logo.png';
import './DashboardLayout.css';

const ICON_SIZE = 22;

const getSidebarItems = (role) => {
  const base = [
    { key: '/', label: 'Trang chủ', path: '/' },
  ];
  if (role === 'ADMIN') {
    return [
      ...base,
      { key: '/dashboard-admin', label: 'Dashboard', path: '/dashboard-admin' },
      { key: 'users', label: 'Quản lý người dùng', path: '/dashboard-admin' },
      { key: '/admin-courses', label: 'Quản lý khóa học', path: '/admin-courses' },
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
      { key: '/teacher-page', label: 'Dashboard', path: '/teacher-page', icon: 'dashboard' },
      { key: '/teacher-page/courses', label: 'Khóa học của tôi', path: '/teacher-page/courses', icon: 'book' },
      { key: '/teacher-page/grade', label: 'Chấm bài', path: '/teacher-page/grade', icon: 'clipboard' },
      { key: '/teacher-page/feedback', label: 'Feedback', path: '/teacher-page/feedback', icon: 'message' },
    ];
  }
  return base;
};

function DashboardLayout({
  children,
  pageTitle: _pageTitle,
  pageSubtitle: _pageSubtitle,
  showSidebar = true,
  showTopbar: _showTopbar = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { role } = useAuth();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Đã đăng xuất.');
    navigate('/login');
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
            <Link to="/" className="shared-sidebar-logo-link" aria-label="Trang chủ">
              <img src={logoImg} alt="Logo" className="shared-sidebar-logo-img" />
            </Link>
          </div>
          <nav className="shared-sidebar-nav">
            {sidebarItems.map((item) => {
              const isTeacherSub = role === 'TEACHER' && item.path !== '/';
              const isActive = isTeacherSub
                ? (item.path === '/teacher-page' ? location.pathname === '/teacher-page' : location.pathname.startsWith(item.path))
                : location.pathname === item.path;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`shared-nav-item ${isActive ? 'active' : ''}`}
                >
                  {item.key === '/' ? (
                    <Home size={ICON_SIZE} strokeWidth={2} />
                  ) : item.icon === 'dashboard' ? (
                    <LayoutDashboard size={ICON_SIZE} strokeWidth={2} />
                  ) : item.icon === 'book' ? (
                    <BookOpen size={ICON_SIZE} strokeWidth={2} />
                  ) : item.icon === 'clipboard' ? (
                    <Feather size={ICON_SIZE} strokeWidth={2} />
                  ) : item.icon === 'message' ? (
                    <MessageSquare size={ICON_SIZE} strokeWidth={2} />
                  ) : (
                    <LayoutDashboard size={ICON_SIZE} strokeWidth={2} />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
        <main className="shared-dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
