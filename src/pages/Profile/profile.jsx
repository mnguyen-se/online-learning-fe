import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserInfo } from '../../api/userApi';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import './profile.css';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');

      if (!token || !username) {
        toast.error('Vui lòng đăng nhập để xem thông tin cá nhân');
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        const data = await getUserInfo(username);
        setUserInfo(data);
      } catch (error) {
        console.error('Error fetching user info:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          toast.error('Không thể tải thông tin người dùng. Vui lòng thử lại.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      STUDENT: 'Học viên',
      TEACHER: 'Giáo viên',
      ADMIN: 'Quản trị viên',
    };
    return roleMap[role] || role;
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-error">
          <p>Không thể tải thông tin người dùng</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div className="profile-title">
            <h1>{userInfo.name || userInfo.username}</h1>
            <p className="profile-role">
              <span className={`role-badge ${userInfo.role?.toLowerCase()}`}>
                {getRoleLabel(userInfo.role)}
              </span>
              {userInfo.active && <span className="active-badge">Đang hoạt động</span>}
            </p>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="card-header">
              <h2>Thông tin cá nhân</h2>
            </div>
            <div className="card-body">
              <div className="info-row">
                <div className="info-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Tên người dùng</span>
                </div>
                <div className="info-value">{userInfo.username || 'Chưa cập nhật'}</div>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Email</span>
                </div>
                <div className="info-value">{userInfo.email || 'Chưa cập nhật'}</div>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Họ và tên</span>
                </div>
                <div className="info-value">{userInfo.name || 'Chưa cập nhật'}</div>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Địa chỉ</span>
                </div>
                <div className="info-value">{userInfo.address || 'Chưa cập nhật'}</div>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Ngày sinh</span>
                </div>
                <div className="info-value">{formatDate(userInfo.dateOfBirth)}</div>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Vai trò</span>
                </div>
                <div className="info-value">
                  <span className={`role-badge-inline ${userInfo.role?.toLowerCase()}`}>
                    {getRoleLabel(userInfo.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
