import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { User, Lock, BookOpen } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Input } from './Input';
import { login as loginAction } from '../../store/slices/userSlice';
import { login as loginApi, getUserInfo } from '../../api/userApi';

// LoginForm – dùng username + password, gọi API login và dispatch vào Redux
export const LoginForm = ({ isActive }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, _setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await loginApi(username, password);

      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', username);

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
          try {
            userInfo = await getUserInfo(username);
          } catch (error) {
            console.error('Error fetching user info:', error);
          }
        }

        if (userRole) {
          localStorage.setItem('role', userRole);
        }

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        dispatch(
          loginAction({
            ...userInfo,
            username,
            role: userRole,
            token: response.token,
          }),
        );

        toast.success('Đăng nhập thành công!');

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
        errorMessage =
          'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối hoặc đảm bảo backend đang chạy.';
      } else if (error.response) {
        const status = error.response.status;
        const dataError = (error.response.data?.error || error.response.data?.message || '').toLowerCase();
        if (status === 401 || dataError.includes('invalid') || dataError.includes('password')) {
          errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.';
        } else if (status === 403 || dataError.includes('inactive')) {
          errorMessage = 'Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên.';
        } else if (status >= 500) {
          errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau.';
        } else {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            `Lỗi: ${status} - ${error.response.statusText}`;
        }
      } else if (error.request) {
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
    <Motion.div
      className="auth-form-container auth-form-container--login"
      initial={false}
      animate={{
        x: isActive ? 0 : -50,
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 10 : 0,
      }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div className="auth-form-container__content">
        <div className="auth-header-icon" aria-hidden>
          <BookOpen size={32} strokeWidth={1.5} />
        </div>
        <Motion.h2
          className="auth-title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isActive ? 0 : 20, opacity: isActive ? 1 : 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Chào mừng trở lại
        </Motion.h2>
        <p className="auth-subtitle" style={{ margin: '5px 0 10px 0'}}>
          Chào mừng bạn đến với website học tiếng Nhật
        </p>


        <form onSubmit={handleSubmit}>
          {/* Nhóm ô input, khoảng cách vừa phải để dễ nhìn */}
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder="Tên đăng nhập"
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between mb-6 text-sm">
            <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-rose-500"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-slate-500 hover:text-rose-600 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn--login"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </Motion.div>
  );
};