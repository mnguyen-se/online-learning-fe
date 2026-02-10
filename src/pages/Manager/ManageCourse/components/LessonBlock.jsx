import React from 'react';

const LessonBlock = ({
  lesson,
  onToggle,
  onUpdate,
  onDelete,
  onToggleVideoEditor,
  onToggleAssignmentEditor,
  videoEditorFor,
  assignmentEditorFor,
  onCloseVideoEditor,
  onCloseAssignmentEditor,
}) => {
  return (
    <div className="lesson-block" key={`lesson-${lesson.id}`}>
      <div className={`course-lesson${lesson.isOpen ? ' is-open' : ''}`}>
        <button
          className="lesson-toggle"
          type="button"
          aria-label="Toggle"
          onClick={() => onToggle(lesson.id)}
        >
          {lesson.isOpen ? '▾' : '▸'}
        </button>
        <div className="lesson-main">
          <div className="lesson-title-row">
            <span className="lesson-title">Chương mới</span>
          </div>
          <div className="lesson-field">
            <input
              className="lesson-title-input"
              type="text"
              placeholder="Nhập tên chương..."
              value={lesson.title ?? ''}
              onChange={(e) => onUpdate(lesson.id, { title: e.target.value })}
            />
          </div>
          <div className="lesson-field-grid">
            <label className="lesson-label">Loại bài học</label>
            <select
              className="lesson-title-input"
              value={lesson.lessonType ?? 'VIDEO'}
              onChange={(e) => onUpdate(lesson.id, { lessonType: e.target.value })}
            >
              <option value="VIDEO">VIDEO</option>
              <option value="ASSIGNMENT">ASSIGNMENT</option>
            </select>
          </div>
          <div className="lesson-field-grid">
            <label className="lesson-label">Nội dung</label>
            {lesson.lessonType === 'VIDEO' ? (
              <input
                className="lesson-title-input"
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onUpdate(lesson.id, {
                    contentFile: file,
                    contentUrl: file?.name || '',
                  });
                }}
              />
            ) : (
              <input
                className="lesson-title-input"
                type="text"
                placeholder="Nhập đường dẫn nội dung..."
                value={lesson.contentUrl ?? ''}
                onChange={(e) => onUpdate(lesson.id, { contentUrl: e.target.value })}
              />
            )}
          </div>
          <div className="lesson-field-row">
            <div className="lesson-field-grid">
              <label className="lesson-label">Thời lượng (phút)</label>
              <input
                className="lesson-title-input"
                type="number"
                min="0"
                value={lesson.duration ?? 0}
                onChange={(e) => onUpdate(lesson.id, { duration: e.target.value })}
              />
            </div>
            <div className="lesson-field-grid">
              <label className="lesson-label">Thứ tự</label>
              <input
                className="lesson-title-input"
                type="number"
                min="0"
                value={lesson.orderIndex ?? 0}
                onChange={(e) => onUpdate(lesson.id, { orderIndex: e.target.value })}
              />
            </div>
            <div className="lesson-field-grid">
              <label className="lesson-label">Section ID</label>
              <input
                className="lesson-title-input"
                type="number"
                min="0"
                value={lesson.sectionId ?? 0}
                onChange={(e) => onUpdate(lesson.id, { sectionId: e.target.value })}
              />
            </div>
          </div>
          {lesson.isOpen && (
            <div className="lesson-actions">
              <button
                className="lesson-action lesson-action-video"
                type="button"
                onClick={() => onToggleVideoEditor(lesson.id)}
              >
                + Video bài giảng
              </button>
              <button
                className="lesson-action lesson-action-quiz"
                type="button"
                onClick={() => onToggleAssignmentEditor(lesson.id)}
              >
                + Bài tập rời
              </button>
            </div>
          )}
        </div>
        <button
          className="lesson-delete"
          type="button"
          aria-label="Delete"
          onClick={() => onDelete(lesson)}
        >
          🗑
        </button>
      </div>
      {lesson.isOpen && videoEditorFor === lesson.id && (
        <div className="lesson-upload">
          <div className="lesson-upload-header">
            <div className="lesson-upload-title">
              <span className="upload-icon">📹</span>
              <input
                className="lesson-upload-name"
                type="text"
                placeholder="Bài giảng video mới"
              />
            </div>
            <span className="lesson-upload-tag">VIDEO</span>
            <button
              className="lesson-upload-close"
              type="button"
              onClick={onCloseVideoEditor}
            >
              ×
            </button>
          </div>
          <div className="lesson-upload-field">
            <input
              className="lesson-upload-input"
              type="file"
              accept="video/*"
            />
          </div>
        </div>
      )}
      {lesson.isOpen && assignmentEditorFor === lesson.id && (
        <div className="lesson-upload assignment-upload">
          <div className="lesson-upload-header">
            <div className="lesson-upload-title">
              <span className="upload-icon">📝</span>
              <input
                className="lesson-upload-name"
                type="text"
                placeholder="Nhiệm vụ bài tập mới"
              />
            </div>
            <span className="lesson-upload-tag assignment-tag">ASSIGNMENT</span>
            <button
              className="lesson-upload-close"
              type="button"
              onClick={onCloseAssignmentEditor}
            >
              ×
            </button>
          </div>
          <div className="lesson-upload-field">
            <textarea
              className="lesson-upload-textarea"
              placeholder="Yêu cầu bài tập..."
              rows={3}
            />
          </div>
          <div className="assignment-meta">
            <div>
              <label>THỜI GIAN LÀM BÀI</label>
              <input className="lesson-upload-input" type="text" placeholder="VD: 30 phút" />
            </div>
            <div>
              <label>ĐIỂM</label>
              <input className="lesson-upload-input" type="text" placeholder="100" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonBlock;
