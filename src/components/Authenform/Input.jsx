import React from 'react';

// Input dành riêng cho form Auth (login/register) – thiết kế sakura, đẹp & dễ nhìn
// icon: một React component (ví dụ: Mail, Lock từ lucide-react)
export const Input = ({ icon: Icon, className = '', ...props }) => {
  return (
    <div className="auth-input-wrap">
      <div className="auth-input-icon">
        {Icon && <Icon className="auth-input-icon__svg" aria-hidden />}
      </div>
      <input
        className={`auth-input ${className}`.trim()}
        {...props}
      />
    </div>
  );
};
