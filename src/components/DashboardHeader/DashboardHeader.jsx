import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { logout } from '../../store/slices/userSlice';
import { useAuth } from '../../hooks';
import './DashboardHeader.css';

/**
 * Header dành cho role quản trị (Admin/Manager/Teacher).
 * Dùng trên trang Home: hiển thị nút "Go to Dashboard" điều hướng theo role.
 * Student dùng Header (header.jsx) riêng.
 */
function DashboardHeader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isStaff, isLoggedIn, getDashboardPath } = useAuth(); //role chưa dùng thì tui tạm thời xoá nhen,nó nằm trước isStaff
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoToDashboard = () => {
    const path = getDashboardPath();
    navigate(path === '/login' ? '/' : path);
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
    toast.success('Đã đăng xuất.');
    navigate('/login');
  };

  return (
    <header className="dashboard-header-bar">
      <div className="dashboard-header-container">
        <Link to="/" className="dashboard-header-logo">
          <div className="dashboard-header-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#FF6B4A" />
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">日</text>
            </svg>
          </div>
          <h2>EduLearn</h2>
        </Link>

        <div className="dashboard-header-actions">
          {isStaff && (
            <button type="button" className="dashboard-header-btn-primary" onClick={handleGoToDashboard}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Go to Dashboard</span>
            </button>
          )}

          {isLoggedIn ? (
            <div className="dashboard-header-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="dashboard-header-profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Menu người dùng"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
              {showDropdown && (
                <div className="dashboard-header-dropdown-menu">
                  <Link to="/profile" className="dashboard-header-dropdown-item" onClick={() => setShowDropdown(false)}>
                    <span>Trang cá nhân</span>
                  </Link>
                  <button type="button" className="dashboard-header-dropdown-item dashboard-header-logout" onClick={handleLogout}>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/register" className="dashboard-header-btn-register">Đăng ký</Link>
              <Link to="/login" className="dashboard-header-btn-login">Đăng nhập</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
