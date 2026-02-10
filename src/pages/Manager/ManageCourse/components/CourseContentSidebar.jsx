import React from 'react';

const CourseContentSidebar = ({
  selectedCourse,
  contentTab,
  lessons,
  tests = [],
  selectedChapterId,
  selectedTestId,
  onTabChange,
  onAddChapter,
  onAddLessonItem,
  onAddTest,
  onSelectChapter,
  onSelectLesson,
  onSelectTest,
  onDeleteChapter,
  onDeleteLesson,
  onSaveAndFinish,
  getCourseId,
  formatCourseId,
  isLoadingLessons,
  lessonsError,
  isLoadingTests,
  testsError,
  isSavingLesson,
  moduleLessons = [],
  selectedLessonId,
  isReloadingLessons = false,
  isSavingTest = false,
}) => {
  return (
    <div className="course-content-sidebar">
      <div className="course-id-display">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="course-id-text">
          ĐÃ CẤP ID: {formatCourseId(getCourseId(selectedCourse))}
        </span>
      </div>

      <button
        className={`course-sidebar-btn ${contentTab === 'general' ? 'is-active' : ''}`}
        type="button"
        onClick={() => onTabChange('general')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2.5C10.6904 2.5 11.25 3.05964 11.25 3.75V5H13.75C14.4404 5 15 5.55964 15 6.25V16.25C15 16.9404 14.4404 17.5 13.75 17.5H6.25C5.55964 17.5 5 16.9404 5 16.25V6.25C5 5.55964 5.55964 5 6.25 5H8.75V3.75C8.75 3.05964 9.30964 2.5 10 2.5ZM10 4.375H8.75V6.25H10V4.375Z" fill="currentColor"/>
        </svg>
        Cấu hình chung
      </button>

      <div className="course-program-section">
        <div className="course-program-header">
          <span className="course-program-title">CHƯƠNG TRÌNH HỌC</span>
          <button
            className="course-program-add"
            type="button"
            aria-label="Thêm chương mới"
            disabled={isSavingLesson}
            onClick={() => {
              onTabChange('program');
              onAddChapter();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {isLoadingLessons && <div className="course-program-status">Đang tải...</div>}
        {lessonsError && <div className="course-program-status course-program-status-error">{lessonsError}</div>}
        {!isLoadingLessons && !lessonsError && lessons.length > 0 && (
          <>
            <ul className="course-program-list">
              {lessons.map((lesson) => {
                const orderIndex = lesson.orderIndex ?? 0;
                const title = lesson.title?.trim() || '';
                // Hiển thị placeholder nếu chương mới chưa có tên
                const displayTitle = title || (lesson.isNew ? 'Vui lòng nhập tên chương' : 'Chương mới');
                const label = `Chương ${orderIndex || 1}: ${displayTitle}`;
                const isSelected = selectedChapterId === lesson.id;
                const chapterLessons = isSelected ? moduleLessons : [];
                
                return (
                  <li key={lesson.id}>
                    <div className="course-program-item-wrapper">
                      <button
                        type="button"
                        className={`course-program-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          onTabChange('program');
                          onSelectChapter(lesson.id);
                        }}
                      >
                        <span className="course-program-item-icon" aria-hidden>≡</span>
                        <span className="course-program-item-label">{label}</span>
                      </button>
                      <button
                        type="button"
                        className="course-program-item-delete"
                        aria-label="Xóa chương"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChapter(lesson.id);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                    {/* Hiển thị lessons và nút thêm bài học của chương đang chọn */}
                    {isSelected && (
                      <>
                        {isReloadingLessons && (
                          <div className="course-program-reload-indicator">
                            <svg className="course-program-reload-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4" opacity="0.3"/>
                              <path d="M8 1C11.866 1 15 4.134 15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>Đang tải lại danh sách bài học...</span>
                          </div>
                        )}
                        {chapterLessons.length > 0 && (
                          <ul className={`course-program-lessons ${isReloadingLessons ? 'is-reloading' : ''}`}>
                            {chapterLessons.map((lessonItem) => {
                              const isLessonSelected = selectedLessonId === lessonItem.id;
                              return (
                                <li key={lessonItem.id}>
                                  <div className="course-program-lesson-item-wrapper">
                                    <button
                                      type="button"
                                      className={`course-program-lesson-item ${isLessonSelected ? 'is-selected' : ''}`}
                                      onClick={() => {
                                        onTabChange('lesson');
                                        onSelectLesson(lessonItem.id);
                                      }}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="course-program-lesson-icon">
                                        <path d="M3 2.5L13 8L3 13.5V2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span className="course-program-lesson-label">
                                        {lessonItem.title || (lessonItem.isNew ? 'Bài học mới' : 'Bài học')}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      className="course-program-lesson-item-delete"
                                      aria-label="Xóa bài học"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDeleteLesson) {
                                          onDeleteLesson(lessonItem.id);
                                        }
                                      }}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <button
                          type="button"
                          className="course-program-add-lesson"
                          onClick={() => {
                            onTabChange('program');
                            onAddLessonItem();
                          }}
                          disabled={isReloadingLessons}
                        >
                          + Thêm bài học
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="course-program-section">
        <div className="course-program-header">
          <span className="course-program-title">BÀI KIỂM TRA</span>
          <button
            className="course-program-add"
            type="button"
            aria-label="Thêm bài kiểm tra"
            disabled={isSavingTest}
            onClick={() => {
              onTabChange('test');
              if (onAddTest) {
                onAddTest();
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {isLoadingTests && <div className="course-program-status">Đang tải bài kiểm tra...</div>}
        {testsError && <div className="course-program-status course-program-status-error">{testsError}</div>}
        {!isLoadingTests && !testsError && tests.length > 0 && (
          <ul className="course-program-list">
            {tests.map((testItem, index) => {
              const orderIndex = testItem.orderIndex ?? index + 1;
              const title = testItem.title?.trim() || '';
              const label = `Bài kiểm tra ${orderIndex || 1}: ${title || 'Chưa đặt tên'}`;
              const isSelected = selectedTestId === testItem.id;
              return (
                <li key={testItem.id}>
                  <div className="course-program-item-wrapper">
                    <button
                      type="button"
                      className={`course-program-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        onTabChange('test');
                        if (onSelectTest) {
                          onSelectTest(testItem.id);
                        }
                      }}
                    >
                      <span className="course-program-item-icon" aria-hidden>≡</span>
                      <span className="course-program-item-label">{label}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!isLoadingTests && !testsError && tests.length === 0 && (
          <div className="course-program-status">Chưa có bài kiểm tra.</div>
        )}
      </div>

      <button
        className="course-save-finish-btn"
        type="button"
        onClick={onSaveAndFinish}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 5.83333L9.16667 14.1667L4.16667 9.16667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Hoàn thành
      </button>
    </div>
  );
};

export default CourseContentSidebar;
