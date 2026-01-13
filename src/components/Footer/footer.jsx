import React from 'react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="3" fill="#FF6B4A" stroke="white" strokeWidth="1"/>
                <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">日</text>
              </svg>
            </div>
            <h3 className="footer-title">Học Tiếng Nhật</h3>
          </div>
          <p className="footer-description">
            Nền tảng học tiếng Nhật trực tuyến hàng đầu Việt Nam. Giúp bạn chinh phục JLPT và đi làm tại Nhật Bản.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-section">
          <h4 className="footer-heading">Khóa Học</h4>
          <ul className="footer-links">
            <li><a href="/courses/n5">Tiếng Nhật N5</a></li>
            <li><a href="/courses/n4">Tiếng Nhật N4</a></li>
            <li><a href="/courses/n3">Tiếng Nhật N3</a></li>
            <li><a href="/courses/n2">Tiếng Nhật N2</a></li>
            <li><a href="/courses/jlpt">Luyện thi JLPT</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 className="footer-heading">Hỗ Trợ</h4>
          <ul className="footer-links">
            <li><a href="/guide">Hướng dẫn sử dụng</a></li>
            <li><a href="/faq">Câu hỏi thường gặp</a></li>
            <li><a href="/privacy">Chính sách bảo mật</a></li>
            <li><a href="/terms">Điều khoản sử dụng</a></li>
            <li><a href="/contact">Liên hệ hỗ trợ</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 className="footer-heading">Liên Hệ</h4>
          <div className="contact-info">
            <div className="contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>123 Đường ABC, Quận 1, TP.HCM, Việt Nam</span>
            </div>
            <div className="contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>(+84) 123 456 789</span>
            </div>
            <div className="contact-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>support@hoctiengnhat.vn</span>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; 2026 Học Tiếng Nhật Để Đi Làm. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="/terms">Điều khoản</a>
            <a href="/privacy">Bảo mật</a>
            <a href="/cookies">Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
