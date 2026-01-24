import React, { useState, useEffect } from 'react';

const LessonDetails = ({ 
  selectedLesson, 
  selectedChapterId,
  onSave, 
  onCancel,
  isLoading,
  isNewLesson = false,
}) => {
  const [title, setTitle] = useState('');
  const [lessonType, setLessonType] = useState('VIDEO');
  const [contentUrl, setContentUrl] = useState('');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (selectedLesson) {
      setTitle(selectedLesson.title || '');
      setLessonType(selectedLesson.lessonType || 'VIDEO');
      setContentUrl(selectedLesson.contentUrl || '');
      setTextContent(selectedLesson.textContent || '');
    } else {
      // Reset form khi tạo mới
      setTitle('Bài học mới');
      setLessonType('VIDEO');
      setContentUrl('');
      setTextContent('');
    }
  }, [selectedLesson]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedChapterId) {
      alert('Vui lòng chọn chương trước khi thêm bài học.');
      return;
    }
    onSave({
      title,
      lessonType,
      contentUrl,
      textContent,
      moduleId: selectedChapterId,
    });
  };

  return (
    <div className="lesson-details">
      <h2 className="lesson-details-title">Chi tiết Bài học</h2>
      <p className="lesson-details-subtitle">Cập nhật nội dung truyền tải và bài tập.</p>

      <form className="lesson-details-form" onSubmit={handleSubmit}>
        <div className="lesson-details-header">
          <select
            className="lesson-details-type-select"
            value={lessonType}
            onChange={(e) => setLessonType(e.target.value)}
            disabled={isLoading}
          >
            <option value="VIDEO">Video Bài giảng</option>
            <option value="TEXT">Văn bản</option>
            <option value="QUIZ">Bài tập</option>
          </select>
        </div>

        <div className="lesson-details-field">
          <label className="lesson-details-label">TIÊU ĐỀ BÀI HỌC</label>
          <input
            className="lesson-details-input"
            type="text"
            placeholder="Nhập tiêu đề bài học..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {lessonType === 'VIDEO' && (
          <div className="lesson-details-field">
            <label className="lesson-details-label">LINK EMBED VIDEO</label>
            <input
              className="lesson-details-input"
              type="url"
              placeholder="Nhập link embed video..."
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="lesson-details-field">
          <label className="lesson-details-label">NỘI DUNG VĂN BẢN</label>
          <textarea
            className="lesson-details-textarea"
            placeholder="Nhập nội dung văn bản..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={isLoading}
            rows={8}
          />
        </div>

        <div className="lesson-details-actions">
          <button
            type="button"
            className="lesson-details-btn lesson-details-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="lesson-details-btn lesson-details-btn-save"
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? (isNewLesson ? 'Đang tạo...' : 'Đang lưu...') : (isNewLesson ? 'Tạo bài học' : 'Lưu')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonDetails;
