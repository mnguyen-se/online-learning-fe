import React from 'react';

const ChapterInfo = ({ 
  selectedChapter, 
  onUpdateLesson, 
  onSaveChapter,
  onCancelChapter,
  lessonError,
  isLoading = false,
  isNewChapter = false,
}) => {
  return (
    <div className="chapter-info">
      <h2 className="chapter-info-title">Thông tin Chương</h2>
      {lessonError && <p className="chapter-info-error">{lessonError}</p>}
      {!selectedChapter ? (
        <div className="chapter-info-empty">Chọn một chương trong danh sách bên trái.</div>
      ) : (
        <div className="chapter-info-form">
          <label className="chapter-info-label">TÊN CHƯƠNG</label>
          <input
            className="chapter-info-input"
            type="text"
            placeholder={isNewChapter ? "Vui lòng nhập tên chương" : "Nhập tên chương..."}
            value={selectedChapter.title ?? ''}
            onChange={(e) => onUpdateLesson(selectedChapter.id, { title: e.target.value })}
            disabled={isLoading}
          />
          {isNewChapter && (
            <div className="chapter-info-actions">
              <button
                type="button"
                className="chapter-info-btn chapter-info-btn-cancel"
                onClick={onCancelChapter}
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="chapter-info-btn chapter-info-btn-save"
                onClick={onSaveChapter}
                disabled={isLoading || !selectedChapter.title?.trim()}
              >
                {isLoading ? 'Đang tạo...' : 'Lưu'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChapterInfo;
