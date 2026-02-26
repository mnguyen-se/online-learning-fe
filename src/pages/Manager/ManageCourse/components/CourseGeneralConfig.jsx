import React, { useState, useEffect } from 'react';

const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const IconSave = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const CourseGeneralConfig = ({
  selectedCourse,
  onSaveGeneralConfig,
  isSaving,
  teachers = [],
  getCourseIsActive,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [assignedTeacherId, setAssignedTeacherId] = useState('');

  useEffect(() => {
    const tid = selectedCourse?.teacherId ?? selectedCourse?.teacher_id ?? '';
    const nextTeacherId = tid ? String(tid) : '';
    const pub =
      typeof getCourseIsActive === 'function'
        ? getCourseIsActive(selectedCourse)
        : selectedCourse?.isPublic ?? selectedCourse?.is_public ?? true;
    const nextTitle = selectedCourse?.title ?? '';
    const nextDesc = selectedCourse?.description ?? '';
    const t = setTimeout(() => {
      setTitle(nextTitle);
      setDescription(nextDesc);
      setIsPublic(pub);
      setAssignedTeacherId(nextTeacherId);
    }, 0);
    return () => clearTimeout(t);
  }, [selectedCourse, getCourseIsActive]);

  const handleSave = () => {
    const trimmedTitle = (title ?? '').trim();
    const trimmedDesc = (description ?? '').trim();
    if (!trimmedTitle) return;
    onSaveGeneralConfig?.({
      title: trimmedTitle,
      description: trimmedDesc,
      isPublic,
      teacherId: assignedTeacherId ? Number(assignedTeacherId) : null,
    });
  };

  return (
    <div className="course-general-config">
      <div className="course-config-header-row">
        <div className="course-config-header">
          <span className="course-config-header-icon">
            <IconShield />
          </span>
          <div>
            <h2 className="course-config-title">Cấu hình khóa học</h2>
            <p className="course-config-subtitle">Thiết lập các thông số vận hành cơ bản.</p>
          </div>
        </div>
        <button
          type="button"
          className="course-config-save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          <IconSave />
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="course-config-form">
        <div className="course-config-field">
          <label className="course-config-label">TÊN KHÓA HỌC HIỂN THỊ</label>
          <input
            type="text"
            className="course-config-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tên khóa học..."
          />
        </div>

        <div className="course-config-field">
          <label className="course-config-label">GÁN GIÁO VIÊN PHỤ TRÁCH</label>
          <div className="course-config-teacher-select-wrap">
            <select
              className="course-config-teacher-select"
              value={assignedTeacherId}
              onChange={(e) => setAssignedTeacherId(e.target.value)}
            >
              <option value="">Chọn giáo viên</option>
              {teachers.map((t) => (
                <option key={t.id ?? t.userId} value={String(t.id ?? t.userId ?? '')}>
                  {t.name ?? t.username ?? `Giáo viên ${t.id ?? t.userId ?? ''}`}
                </option>
              ))}
            </select>
            <span className="course-config-teacher-chevron" aria-hidden>▼</span>
          </div>
        </div>

        <div className="course-config-field">
          <label className="course-config-label">TRẠNG THÁI PHÁT HÀNH</label>
          <div className="course-config-status-toggles">
            <button
              type="button"
              className={`course-config-status-btn ${isPublic ? 'is-active' : ''}`}
              onClick={() => setIsPublic(true)}
            >
              Công khai (Public)
            </button>
            <button
              type="button"
              className={`course-config-status-btn ${!isPublic ? 'is-active' : ''}`}
              onClick={() => setIsPublic(false)}
            >
              Riêng tư (Draft)
            </button>
          </div>
        </div>

        <div className="course-config-field">
          <label className="course-config-label">MÔ TẢ CHI TIẾT KHÓA HỌC</label>
          <textarea
            className="course-config-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả chi tiết về lộ trình và mục tiêu khóa học..."
            rows={5}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseGeneralConfig;
