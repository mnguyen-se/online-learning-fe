import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/userSlice";
import { useAuth } from "../../hooks";
import logoImg from "../../assets/logo.png";
import "./header.css";

const Header = ({ headerTitle = '' }) => {
  const { username, role, isLoggedIn, isStaff, getDashboardPath } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
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

  const displayName = username || "bạn";
  const isStudent = role === "STUDENT";

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <Link to="/" className="header-logo" aria-label="Ryugo - Trang chủ">
            <img src={logoImg} alt="Ryugo" className="header-logo-img" />
            <div className="header-logo-text">
              <span className="header-logo-name">RYUGO</span>
              <span className="header-logo-ja" aria-hidden="true">竜五</span>
            </div>
          </Link>
          {headerTitle && (
            <h1 className="header-page-title">{headerTitle}</h1>
          )}
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
                      <span>Thông tin cá nhân</span>
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
                        <span>Bảng điều khiển</span>
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
