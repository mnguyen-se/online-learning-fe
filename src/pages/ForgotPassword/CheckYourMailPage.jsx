import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import './CheckYourMailPage.css';

const CheckYourMailPage = () => {
  return (
    <div className="sakura-auth-page check-your-mail-page">
      <div className="check-your-mail-shell">
        <div className="check-your-mail-card">
          <div className="check-your-mail-icon">
            <Mail size={48} strokeWidth={1.5} />
          </div>
          <h1 className="check-your-mail-title">Check your mail</h1>
          <p className="check-your-mail-message">
            Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link khôi phục mật khẩu. Vui lòng kiểm tra hộp thư (và thư mục spam).
          </p>
          <Link to="/login" className="check-your-mail-back-btn">
            <ArrowLeft size={18} />
            <span>Quay lại đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckYourMailPage;
