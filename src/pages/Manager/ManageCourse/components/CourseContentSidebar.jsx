import React from 'react';

const CourseContentSidebar = ({
  selectedCourse: _selectedCourse,
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
  onPublishChapter,
  onPublishLesson,
  onSaveAndFinish,
  getCourseId: _getCourseId,
  isLoadingLessons,
  lessonsError,
  isLoadingTests,
  testsError,
  isSavingLesson,
  moduleLessons = [],
  selectedLessonId,
  isReloadingLessons = false,
  isSavingTest = false,
  publishingModuleIds = [],
  publishingLessonIds = [],
}) => {
  return (
    <div className="course-content-sidebar">
      <button
        className={`course-sidebar-btn ${contentTab === 'general' ? 'is-active' : ''}`}
        type="button"
        onClick={() => onTabChange('general')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 3.333v1.667a.833.833 0 0 1-1.667 0V3.333a.833.833 0 0 1 1.667 0zM10 15v1.667a.833.833 0 0 1-1.667 0V15a.833.833 0 0 1 1.667 0zM3.333 10a.833.833 0 0 1 .834-.833h1.666a.833.833 0 0 1 0 1.667H4.167A.833.833 0 0 1 3.333 10zM15 10a.833.833 0 0 1 .833-.833h1.667a.833.833 0 0 1 0 1.667H15.833A.833.833 0 0 1 15 10zM5.05 5.05a.833.833 0 0 1 1.179 0l1.179 1.178a.833.833 0 0 1-1.179 1.179L5.05 6.23a.833.833 0 0 1 0-1.178zM13.772 13.772a.833.833 0 0 1 1.178 1.179l-1.178 1.178a.833.833 0 0 1-1.179-1.178l1.179-1.179zM5.05 14.95a.833.833 0 0 1 0-1.179l1.178-1.178a.833.833 0 0 1 1.179 1.178L6.23 14.95a.833.833 0 0 1-1.179 0zM13.772 6.228a.833.833 0 0 1 1.179 0l1.178 1.179a.833.833 0 0 1-1.178 1.178l-1.179-1.178a.833.833 0 0 1 0-1.179z" fill="currentColor"/>
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
        {!isLoadingLessons && !lessonsError && lessons.length === 0 && (
          <div className="course-program-status course-program-empty-hint">Chưa có chương. Bấm nút + phía trên để thêm.</div>
        )}
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
                const chapterKey = String(lesson.sectionId ?? lesson.id ?? '');
                const isPublishingChapter = publishingModuleIds.includes(chapterKey);
                
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
                      {!lesson.isNew && !lesson.isPublic && (
                        <button
                          type="button"
                          className="course-program-item-public"
                          aria-label="Public chương"
                          disabled={isPublishingChapter}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPublishChapter) {
                              onPublishChapter(lesson.id);
                            }
                          }}
                        >
                          {isPublishingChapter ? '...' : 'Public'}
                        </button>
                      )}
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
                              const lessonKey = String(lessonItem.lessonId ?? lessonItem.id ?? '');
                              const isPublishingLesson = publishingLessonIds.includes(lessonKey);
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
                                    {!lessonItem.isNew && !lessonItem.isPublic && (
                                      <button
                                        type="button"
                                        className="course-program-lesson-item-public"
                                        aria-label="Public bài học"
                                        disabled={isPublishingLesson}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onPublishLesson) {
                                            onPublishLesson(lessonItem.id);
                                          }
                                        }}
                                      >
                                        {isPublishingLesson ? '...' : 'Public'}
                                      </button>
                                    )}
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
              const title = (testItem.title ?? testItem.assignmentName ?? testItem.name ?? '').toString().trim();
              const label = title || `Bài kiểm tra ${orderIndex || 1} (Chưa đặt tên)`;
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
        className="course-sidebar-back-btn"
        type="button"
        onClick={onSaveAndFinish}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Quay lại
      </button>
    </div>
  );
};

export default CourseContentSidebar;
