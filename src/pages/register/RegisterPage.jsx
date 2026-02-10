import React from 'react';
import '../LoginPage/loginpage.css';
import { AuthContainer } from '../../components/Authen-templete/AthenForm';

// Trang /register – layout như ban đầu (thẻ căn giữa)
const RegisterPage = () => {
  return (
    <div className="sakura-auth-page">
      <div className="double-auth-shell">
        <div className="double-auth-inner">
          <AuthContainer initialSignUp />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
