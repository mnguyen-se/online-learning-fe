import React from 'react';
import PageLayout from './PageLayout';

export default function ContactPage() {
  return (
    <PageLayout title="Liên hệ">
      <div className="about-section">
        <p style={{ marginBottom: '1.5rem' }}>
          Bạn cần tư vấn khóa học, báo lỗi kỹ thuật hay có câu hỏi? Hãy liên hệ với Ryugo qua các kênh dưới đây.
        </p>
        <div className="about-contact-list">
          <div className="about-contact-item">
            <strong>Địa chỉ:</strong>
            <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh, Việt Nam</span>
          </div>
          <div className="about-contact-item">
            <strong>Điện thoại:</strong>
            <span>(+84) 123 456 789</span>
          </div>
          <div className="about-contact-item">
            <strong>Email:</strong>
            <span>support@ryugo.vn — Tư vấn khóa học & hỗ trợ học viên</span>
          </div>
          <div className="about-contact-item">
            <strong>Giờ làm việc:</strong>
            <span>Thứ 2 – Thứ 6: 8:00 – 21:00 | Thứ 7: 8:00 – 17:00</span>
          </div>
        </div>
      </div>
      <div className="about-section">
        <h2>Gửi tin nhắn</h2>
        <p>Bạn có thể để lại thông tin (họ tên, email, nội dung), đội ngũ Ryugo sẽ phản hồi trong vòng 24–48 giờ (demo trang – form chưa kết nối backend).</p>
        <div className="about-card" style={{ maxWidth: 480 }}>
          <p style={{ marginBottom: '0.5rem' }}><strong>Họ tên:</strong> [Ô nhập demo]</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> [Ô nhập demo]</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Nội dung:</strong> [Ô nhập demo]</p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ryugo-gold)' }}>Nút "Gửi" sẽ được tích hợp khi có API.</p>
        </div>
      </div>
    </PageLayout>
  );
}
