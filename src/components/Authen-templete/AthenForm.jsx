import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { LoginForm } from '../Authenform/LoginForm';
import { RegisterForm } from '../Authenform/RegisterForm';
import { Overlay } from './Overlay';

// Auth container (Double Slide) – video phát 1 lần, ấn nút Đăng nhập/Đăng ký mới phát lại
export const AuthContainer = ({ initialSignUp = false }) => {
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const toggleAuth = () => {
    setIsSignUp((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleRegisterSuccess = () => {
    setIsSignUp(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-card relative w-full max-w-[1000px] min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex">
      {/* Nút back – trái khi đăng nhập, phải khi đăng ký */}
      <Link
        to="/"
        className={`auth-back-home${isSignUp ? ' auth-back-home--right' : ''}`}
        aria-label="Quay lại trang chủ"
      >
        <Home size={18} strokeWidth={2} />
        <span>Trang chủ</span>
      </Link>
      {/* Video nền: phát 1 lần, không loop; ấn nút overlay mới phát lại */}
      <video
        ref={videoRef}
        autoPlay
        loop={false}
        muted
        playsInline
        className="auth-card-video"
        src="/cat.mp4"
      />
      {/* Container form đăng nhập */}
      <div className="auth-form-wrapper auth-form-wrapper--login">
        <LoginForm isActive={!isSignUp} />
      </div>
      {/* Container form đăng ký */}
      <div className="auth-form-wrapper auth-form-wrapper--register">
        <RegisterForm isActive={isSignUp} onRegisterSuccess={handleRegisterSuccess} />
      </div>

      {/* Overlay Layer - trượt qua lại phủ lên form, che 50% video */}
      <Overlay isSignUp={isSignUp} toggleAuth={toggleAuth} />
    </div>
  );
};