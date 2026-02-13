import React from 'react';
import PageLayout from './PageLayout';

const DEMO_TEACHERS = [
  {
    id: 1,
    name: 'Nguyễn Minh Anh',
    role: 'Giảng viên N5, N4',
    bio: 'Cử nhân Đại học Ngoại ngữ Tokyo. 5 năm kinh nghiệm dạy tiếng Nhật cho người Việt.',
  },
  {
    id: 2,
    name: 'Trần Thu Hà',
    role: 'Giảng viên N3, N2',
    bio: 'Thạc sĩ Giáo dục tiếng Nhật. Chuyên luyện thi JLPT và kỹ năng đọc hiểu.',
  },
  {
    id: 3,
    name: 'Lê Hoàng Nam',
    role: 'Giảng viên Kaiwa, Kanji',
    bio: 'Từng sống và làm việc tại Osaka 8 năm. Tập trung giao tiếp thực tế và chữ Hán.',
  },
];

export default function TeachersPage() {
  return (
    <PageLayout title="Đội ngũ giáo viên">
      <div className="about-section">
        <p style={{ marginBottom: '1.5rem' }}>
          Đội ngũ giáo viên Ryugo có chuyên môn cao, nhiều năm kinh nghiệm giảng dạy và gắn bó với văn hóa Nhật Bản. Các thầy cô không chỉ truyền đạt kiến thức mà còn đồng hành, động viên học viên trong suốt quá trình học.
        </p>
        <div className="about-card-grid">
          {DEMO_TEACHERS.map((t) => (
            <div key={t.id} className="about-card">
              <h3>{t.name}</h3>
              <p style={{ color: 'var(--ryugo-gold)', fontWeight: 600, marginBottom: '0.5rem' }}>{t.role}</p>
              <p>{t.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
