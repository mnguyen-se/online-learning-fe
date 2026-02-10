import React from 'react';
import './loginpage.css';
import { AuthContainer } from '../../components/Authen-templete/AthenForm';

// Trang /login – layout như ban đầu (thẻ căn giữa), video nằm trong thẻ, fill 100% thẻ
const LoginPage = () => {
  return (
    <div className="sakura-auth-page">
      <div className="double-auth-shell">
        <div className="double-auth-inner">
          <AuthContainer initialSignUp={false} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
