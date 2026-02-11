import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/userSlice";
import { useAuth } from "../../hooks";
import "./header.css";

const Header = ({ headerTitle = '' }) => {
  const { username, role, isLoggedIn, isStaff, getDashboardPath } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
    navigate("/");
  };

  const handleGoToDashboard = () => {
    const path = getDashboardPath();
    setShowDropdown(false);
    navigate(path === "/login" ? "/" : path);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery?.trim();
    if (q) {
      navigate(`/?search=${encodeURIComponent(q)}`);
    }
  };

  const displayName = username || "bạn";
  const isStudent = role === "STUDENT";

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <Link to="/" className="header-brand-text" aria-label="Quay lại trang chủ" />
          {headerTitle && (
            <h1 className="header-page-title">{headerTitle}</h1>
          )}
        </div>

        <div className="header-search-section">
          <form className="search-bar" onSubmit={handleSearchSubmit} role="search">
            <span className="search-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm khóa học, học viên..."
              aria-label="Tìm kiếm khóa học, học viên"
              autoComplete="off"
            />
          </form>
        </div>

        <div className="header-actions">
          {isLoggedIn ? (
            <>
              <span className="header-greeting">Xin chào, {displayName}</span>
              <div className="header-menu" ref={dropdownRef}>
                <button
                  type="button"
                  className="header-menu-btn"
                  onClick={() => setShowDropdown((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={showDropdown}
                  aria-label="Mở menu"
                >
                  <span className="menu-line"></span>
                  <span className="menu-line"></span>
                  <span className="menu-line"></span>
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <span>Thông tin người dùng</span>
                    </Link>
                    {isStudent && (
                      <Link
                        to="/my-courses"
                        className="dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        <span>Khóa học của tôi</span>
                      </Link>
                    )}
                    {isStaff && (
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={handleGoToDashboard}
                      >
                        <span>Dashboard</span>
                        <span className="dropdown-note">
                          Sẽ điều hướng về trang role
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-register">
                Đăng ký
              </Link>
              <Link to="/login" className="btn-login">
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
