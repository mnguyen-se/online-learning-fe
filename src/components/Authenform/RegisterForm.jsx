import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Input } from './Input';
import { register as registerApi } from '../../api/userApi';

// RegisterForm – chỉ cần Tên, Email, Mật khẩu, Xác nhận mật khẩu, gọi API register
export const RegisterForm = ({ isActive }) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, _setShowPassword] = useState(false);
  const [showConfirmPassword, _setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);

    try {
      // Backend cần username, nên dùng email làm username
      const payload = {
        username: email,
        password,
        email,
        name,
      };

      await registerApi(payload);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage =
          'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối hoặc đảm bảo backend đang chạy.';
      } else if (error.response) {
        const status = error.response.status;
        const dataError = (error.response.data?.error || error.response.data?.message || '').toLowerCase();
        if (status === 400 || dataError.includes('invalid') || dataError.includes('validation')) {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            'Dữ liệu không hợp lệ. Kiểm tra lại thông tin (email có thể đã được sử dụng).';
        } else if (status === 409 || dataError.includes('exist') || dataError.includes('already') || dataError.includes('duplicate')) {
          errorMessage = 'Email hoặc tên đăng nhập đã tồn tại. Vui lòng dùng email khác.';
        } else if (status >= 500) {
          errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau.';
        } else {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            'Đăng ký thất bại. Vui lòng thử lại.';
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
    <motion.div
      className="auth-form-container auth-form-container--register"
      initial={false}
      animate={{
        x: isActive ? 0 : 50,
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 10 : 0,
      }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div className="auth-form-container__content">
        <div className="auth-header-icon" aria-hidden>
          <BookOpen size={32} strokeWidth={1.5} />
        </div>
        <motion.h2
          className="auth-title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isActive ? 0 : 20, opacity: isActive ? 1 : 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Tạo tài khoản
        </motion.h2>
        <p className="auth-subtitle" style={{ margin: '5px 0 10px 0'}}>
          Hãy đăng ký để đến với website học tiếng Nhật
        </p>

        <form onSubmit={handleSubmit}>
          {/* Nhóm ô input, khoảng cách vừa phải để dễ nhìn */}
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder="Tên của bạn"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="you@gmail.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn--register"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};