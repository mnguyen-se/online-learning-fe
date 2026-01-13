import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './header.css';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập chưa
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('rememberMe');
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate('/');
    window.location.reload(); // Reload để cập nhật header
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="16" height="16" rx="3" fill="#FF6B4A"/>
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">日</text>
            </svg>
          </div>
          <h2>Edu Learn AI</h2>
        </div>
        <div className="search-bar">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Tìm kiếm khóa học, bài viết, video, ..." />
        </div>
        <div className="header-actions">
          {isLoggedIn ? (
            <div className="profile-dropdown" ref={dropdownRef}>
              <button 
                className="profile-icon-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Menu người dùng"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Trang cá nhân</span>
                  </Link>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/register" className="btn-register">Đăng ký</a>
              <a href="/login" className="btn-login">Đăng nhập</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
