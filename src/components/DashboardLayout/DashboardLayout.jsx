import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { LayoutDashboard, BookOpen, Feather, MessageSquare, Home, BarChart3, BookMarked } from 'lucide-react';
import { logout } from '../../store/slices/userSlice';
import { useAuth } from '../../hooks';
import Header from '../Header/header';
import './DashboardLayout.css';

const ICON_SIZE = 22;

const getSidebarItems = (role) => {
  const base = [
    { key: '/', label: 'Trang chủ', path: '/', icon: 'home' },
  ];
  if (role === 'ADMIN') {
    return [
      ...base,
      { key: '/dashboard-admin', label: 'Dashboard', path: '/dashboard-admin', icon: 'dashboard' },
      { key: 'users', label: 'Quản lý người dùng', path: '/dashboard-admin', icon: 'dashboard' },
      { key: '/admin-courses', label: 'Quản lý khóa học', path: '/admin-courses', icon: 'book' },
    ];
  }
  if (role === 'COURSE_MANAGER') {
    return [
      ...base,
      { key: 'manager-overview', label: 'Tổng quan', path: '/dashboard-manager', icon: 'overview' },
      { key: 'manager-courses', label: 'Quản lý khóa học', path: '/dashboard-manager', icon: 'courses' },
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
  managerSidebarTab,
  onManagerSidebarTabChange,
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

  const renderNavIcon = (item) => {
    if (item.key === '/' || item.icon === 'home') return <Home size={ICON_SIZE} strokeWidth={2} />;
    if (item.icon === 'dashboard') return <LayoutDashboard size={ICON_SIZE} strokeWidth={2} />;
    if (item.icon === 'book') return <BookOpen size={ICON_SIZE} strokeWidth={2} />;
    if (item.icon === 'overview') return <BarChart3 size={ICON_SIZE} strokeWidth={2} />;
    if (item.icon === 'courses') return <BookMarked size={ICON_SIZE} strokeWidth={2} />;
    if (item.icon === 'clipboard') return <Feather size={ICON_SIZE} strokeWidth={2} />;
    if (item.icon === 'message') return <MessageSquare size={ICON_SIZE} strokeWidth={2} />;
    return <LayoutDashboard size={ICON_SIZE} strokeWidth={2} />;
  };

  const isManagerTabActive = (item) => {
    if (role !== 'COURSE_MANAGER' || typeof managerSidebarTab !== 'string') return false;
    if (item.key === 'manager-overview') return managerSidebarTab === 'dashboard';
    if (item.key === 'manager-courses') return managerSidebarTab === 'management';
    return false;
  };

  return (
    <div className="shared-dashboard-layout">
      <Header headerTitle={headerTitle} />

      <div className="shared-dashboard-body">
        {showSidebar && (
          <aside className="shared-dashboard-sidebar">
            <nav className="shared-sidebar-nav">
              {sidebarItems.map((item) => {
                const isTeacherSub = role === 'TEACHER' && item.path !== '/';
                const isManagerItem = role === 'COURSE_MANAGER' && (item.key === 'manager-overview' || item.key === 'manager-courses');
                const isActive = isManagerItem
                  ? isManagerTabActive(item)
                  : isTeacherSub
                    ? (item.path === '/teacher-page' ? location.pathname === '/teacher-page' : location.pathname.startsWith(item.path))
                    : location.pathname === item.path;

                if (isManagerItem && typeof onManagerSidebarTabChange === 'function') {
                  const tab = item.key === 'manager-overview' ? 'dashboard' : 'management';
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`shared-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => onManagerSidebarTabChange(tab)}
                    >
                      {renderNavIcon(item)}
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`shared-nav-item ${isActive ? 'active' : ''}`}
                  >
                    {renderNavIcon(item)}
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

        <main className="shared-dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
