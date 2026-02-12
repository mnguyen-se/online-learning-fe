import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Card khóa học: tiêu đề, mô tả, nút Xem chi tiết. Giữ nguyên thiết kế card hiện tại.
 */
function CourseCard({ course }) {
  const navigate = useNavigate();

  const courseId = course?.courseId ?? course?.id ?? course?.course_id ?? null;
  const title = course?.title ?? course?.name ?? course?.courseName ?? 'Khóa học';
  const description = course?.description ?? course?.courseDescription ?? '';

  const handleViewDetail = () => {
    if (courseId) {
      navigate(`/teacher-page/courses/${courseId}`);
    }
  };

  return (
    <article className="tmc-card">
      <div className="tmc-card-body">
        <h3 className="tmc-card-title">{title}</h3>
        {description && (
          <p className="tmc-card-description">{description}</p>
        )}
        <button type="button" className="tmc-card-btn" onClick={handleViewDetail}>
          <span>Xem chi tiết</span>
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}

export default CourseCard;
