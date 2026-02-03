import React from 'react';

const CourseInitForm = ({
  courseTitle,
  courseDescription,
  courseIsPublic,
  courseError,
  courseSuccess,
  isSavingCourse,
  onTitleChange,
  onDescriptionChange,
  onPublicChange,
  onCancel,
  onContinue,
}) => {
  return (
    <div className="course-init-card">
      <div className="course-init-header">
        <div className="course-step-indicator">1</div>
        <div className="course-init-header-text">
          <h2 className="course-init-title">Khởi tạo khóa học</h2>
          <p className="course-init-subtitle">
            Bước 1: Cung cấp các thông tin cơ bản để tạo ID khóa học.
          </p>
        </div>
      </div>

      <div className="course-init-form">
        <label className="course-label">TÊN KHÓA HỌC</label>
        <input
          className="course-input"
          type="text"
          placeholder="VD: Tiếng Nhật N3 siêu tốc"
          value={courseTitle}
          onChange={(e) => onTitleChange(e.target.value)}
        />

        <label className="course-label">MÔ TẢ</label>
        <textarea
          className="course-textarea"
          placeholder="Mô tả nội dung cho học viên..."
          rows={5}
          value={courseDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        <div className="course-public-toggle">
          <div className="course-public-text">
            <span className="course-label">TRẠNG THÁI KHÓA HỌC</span>
            <span className="course-public-hint">
              {courseIsPublic ? 'Công khai cho học viên' : 'Riêng tư, chỉ nội bộ quản trị'}
            </span>
          </div>
          <label className="course-public-switch">
            <input
              type="checkbox"
              checked={courseIsPublic}
              onChange={(e) => onPublicChange(e.target.checked)}
            />
            <span className="course-public-slider" aria-hidden />
          </label>
        </div>
        {courseError && (
          <p className="course-error">{courseError}</p>
        )}
        {courseSuccess && (
          <p className="course-success">{courseSuccess}</p>
        )}
      </div>

      <div className="course-init-actions">
        <button
          className="course-init-cancel"
          type="button"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          className="course-init-continue"
          type="button"
          onClick={onContinue}
          disabled={isSavingCourse}
        >
          {isSavingCourse ? 'Đang tạo...' : 'Tạo khóa học'}
          <span className="course-init-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default CourseInitForm;
