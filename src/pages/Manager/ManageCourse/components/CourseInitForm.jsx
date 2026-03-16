import React, { useRef } from 'react';

const CourseInitForm = ({
  courseTitle,
  courseDescription,
  courseIsPublic,
  courseTeacherId,
  courseImageFile,
  courseImagePreview,
  isUploadingImage,
  teachers = [],
  courseError,
  courseSuccess,
  isSavingCourse,
  onTitleChange,
  onDescriptionChange,
  onPublicChange,
  onTeacherChange,
  onImageChange,
  onRemoveImage,
  onCancel,
  onContinue,
}) => {
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF).');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa 5MB.');
      return;
    }

    onImageChange?.(file);
  };

  const handleRemoveImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemoveImage?.();
  };

  return (
    <div className="course-init-card">
      <div className="course-init-header">
        <div className="course-step-indicator">1</div>
        <div className="course-init-header-text">
          <h2 className="course-init-title">Thông tin cơ bản</h2>
          <p className="course-init-subtitle">
            Bước 1: Nhập thông tin và trạng thái khóa học.
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

        <label className="course-label">GÁN GIÁO VIÊN PHỤ TRÁCH</label>
        <div className="course-init-teacher-wrap">
          <select
            className="course-init-teacher-select"
            value={courseTeacherId ?? ''}
            onChange={(e) => onTeacherChange?.(e.target.value)}
          >
            <option value="">Chọn giáo viên (tùy chọn)</option>
            {teachers.map((t) => (
              <option key={t.id ?? t.userId} value={String(t.id ?? t.userId ?? '')}>
                {t.name ?? t.username ?? `Giáo viên ${t.id ?? t.userId ?? ''}`}
              </option>
            ))}
          </select>
        </div>

        <label className="course-label">ẢNH KHÓA HỌC</label>
        <div className="course-image-upload-area">
          {courseImagePreview ? (
            <div className="course-image-preview-wrapper">
              <img
                src={courseImagePreview}
                alt="Ảnh khóa học"
                className="course-image-preview"
              />
              <div className="course-image-preview-overlay">
                <button
                  type="button"
                  className="course-image-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Đổi ảnh
                </button>
                <button
                  type="button"
                  className="course-image-remove-btn"
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="course-image-dropzone"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              <div className="course-image-dropzone-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <span className="course-image-dropzone-text">Nhấn để chọn ảnh từ thiết bị</span>
              <span className="course-image-dropzone-hint">JPG, PNG, WEBP, GIF – Tối đa 5MB</span>
            </button>
          )}
          {isUploadingImage && (
            <div className="course-image-uploading">
              <div className="course-image-uploading-spinner" />
              <span>Đang tải ảnh lên...</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        </div>

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
              {courseIsPublic ? 'Trạng thái: Mở' : 'Trạng thái: Đóng'}
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
          disabled={isSavingCourse || isUploadingImage}
        >
          {isSavingCourse ? 'Đang lưu...' : isUploadingImage ? 'Đang tải ảnh...' : 'Tiếp theo'}
          <span className="course-init-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default CourseInitForm;
