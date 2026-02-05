import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { login as loginAction } from '../../store/slices/userSlice';
import { login, getUserInfo } from '../../api/userApi';
import Header from '../../components/Header/header';
import './loginpage.css';

const LoginPage = () => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login(username, password);
      
      // Lưu token vào localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', username);
        
        // Lấy thông tin role từ response hoặc gọi API getUserInfo
        let userRole = response.role;
        let userInfo = null;
        
        if (!userRole) {
          try {
            userInfo = await getUserInfo(username);
            userRole = userInfo.role;
          } catch (error) {
            console.error('Error fetching user info:', error);
          }
        } else {
          // Nếu có role từ response, lấy thêm userInfo nếu cần
          try {
            userInfo = await getUserInfo(username);
          } catch (error) {
            console.error('Error fetching user info:', error);
          }
        }

        if (userRole) {
          localStorage.setItem('role', userRole);
        }
        
        // Nếu có rememberMe, có thể lưu thêm thông tin user
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Dispatch action login vào Redux store
        dispatch(loginAction({
          ...userInfo,
          username,
          role: userRole,
          token: response.token,
        }));
        
        toast.success('Đăng nhập thành công!');
        
        // Điều hướng dựa trên role (dùng /admin, /manager, /teacher - App redirect tới dashboard tương ứng)
        if (userRole === 'ADMIN') {
          navigate('/admin');
        } else if (userRole === 'TEACHER') {
          navigate('/teacher');
        } else if (userRole === 'COURSE_MANAGER') {
          navigate('/manager');
        } else if (userRole === 'STUDENT') {
          navigate('/');
        }
      } else {
        toast.error('Token không được trả về từ server');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối hoặc đảm bảo backend đang chạy.';
      } else if (error.response) {
        // Server trả về response nhưng có lỗi
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        // Request đã được gửi nhưng không nhận được response
        errorMessage = 'Không nhận được phản hồi từ server. Vui lòng thử lại.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="login-page">
        {/* Left Section - Promotional Content */}
        <div className="login-left">
          <div className="promotional-cards">
            <div className="promo-card">
              <div className="promo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Học tập thông minh với AI</h3>
              <p>Trợ lý AI cá nhân hóa giúp bạn học hiệu quả hơn, giải đáp thắc mắc nhanh chóng và hỗ trợ 24/7</p>
            </div>

            <div className="promo-card">
              <div className="promo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 10V3H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Lộ trình học tập cá nhân</h3>
              <p>AI phân tích năng lực và đề xuất lộ trình học phù hợp, giúp bạn đạt mục tiêu nhanh nhất</p>
            </div>

            <div className="promo-card">
              <div className="promo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Kho tài liệu phong phú</h3>
              <p>Hàng ngàn khóa học, bài giảng và tài liệu chất lượng cao từ các chuyên gia hàng đầu</p>
            </div>

            <div className="promo-card">
              <div className="promo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Theo dõi tiến độ chi tiết</h3>
              <p>Thống kê học tập trực quan, nhận chứng chỉ và huy hiệu khi hoàn thành mục tiêu</p>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="login-right">
          <div className="login-container">
            {/* Header */}
            <div className="login-header">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Rounded container */}
                  <rect x="4" y="4" width="16" height="16" rx="4" ry="4" fill="#8B5CF6" opacity="0.1" stroke="#8B5CF6" strokeWidth="2"/>
                  {/* Academic cap icon inside */}
                  <path d="M12 3L2 7L12 11L22 7L12 3Z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M2 17L12 21L22 17" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M2 12L12 16L22 12" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <h1 className="brand-name">EduLearn AI</h1>
              <p className="tagline">Nền Tảng Học Tập Thông Minh</p>
            </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Tên người dùng</label>
              <input
                type="text"
                id="username"
                placeholder="Nhập tên người dùng"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group password-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="/forgot-password" className="forgot-password">Quên mật khẩu?</a>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Register Link */}
          <div className="register-link">
            <span>Chưa có tài khoản? </span>
            <a href="/register">Đăng ký</a>
          </div>
          <div className="home-link">
            <a href="/">Quay lại trang chủ</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default LoginPage;
