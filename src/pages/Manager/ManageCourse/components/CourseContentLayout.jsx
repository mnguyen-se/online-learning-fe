import React from 'react';
import CourseContentSidebar from './CourseContentSidebar';
import CourseGeneralConfig from './CourseGeneralConfig';
import ChapterInfo from './ChapterInfo';
import LessonDetails from './LessonDetails';

const CourseContentLayout = ({
  selectedCourse,
  contentTab,
  courseCoverImageUrl,
  lessons,
  isLoadingLessons,
  lessonsError,
  lessonError,
  isSavingLesson,
  selectedChapterId,
  selectedLessonId,
  isCreatingLesson,
  moduleLessons = [],
  onTabChange,
  onCoverImageUrlChange,
  onAddChapter,
  onAddLessonItem,
  onSelectChapter,
  onSelectLesson,
  onDeleteChapter,
  onSaveChapter,
  onCancelChapter,
  onSaveLesson,
  onCancelLesson,
  onUpdateLesson,
  onUpdateModuleLesson,
  onEditLesson,
  onCancelEditLesson,
  onSaveAndFinish,
  getCourseId,
  formatCourseId,
  isReloadingLessons = false,
  isEditingLesson = false,
}) => {
  const selectedChapter = selectedChapterId
    ? lessons.find((l) => l.id === selectedChapterId) ?? null
    : null;
  
  const selectedLesson = selectedLessonId
    ? moduleLessons.find((l) => l.id === selectedLessonId) ?? null
    : null;

  return (
    <div className="course-content-layout">
      <CourseContentSidebar
        selectedCourse={selectedCourse}
        contentTab={contentTab}
        lessons={lessons}
        selectedChapterId={selectedChapterId}
        onTabChange={onTabChange}
        onAddChapter={onAddChapter}
        onAddLessonItem={onAddLessonItem}
        onSelectChapter={onSelectChapter}
        onSelectLesson={onSelectLesson}
        onDeleteChapter={onDeleteChapter}
        onSaveAndFinish={onSaveAndFinish}
        getCourseId={getCourseId}
        formatCourseId={formatCourseId}
        isLoadingLessons={isLoadingLessons}
        lessonsError={lessonsError}
        isSavingLesson={isSavingLesson}
        moduleLessons={moduleLessons}
        selectedLessonId={selectedLessonId}
        isReloadingLessons={isReloadingLessons}
      />

      <div className="course-content-main">
        {contentTab === 'general' ? (
          <CourseGeneralConfig
            courseCoverImageUrl={courseCoverImageUrl}
            onCoverImageUrlChange={onCoverImageUrlChange}
          />
        ) : contentTab === 'lesson' ? (
          <LessonDetails
            key={selectedLessonId ?? 'new'}
            selectedLesson={isCreatingLesson ? null : selectedLesson}
            selectedChapterId={selectedChapterId}
            onSave={onSaveLesson}
            onCancel={onCancelLesson}
            onEdit={onEditLesson}
            onCancelEdit={onCancelEditLesson}
            isLoading={isSavingLesson}
            isNewLesson={selectedLesson?.isNew ?? false}
            isEditing={isEditingLesson || (selectedLesson?.isNew ?? false)}
            onUpdateModuleLesson={onUpdateModuleLesson}
            selectedLessonId={selectedLessonId}
          />
        ) : (
          <ChapterInfo
            selectedChapter={selectedChapter}
            onUpdateLesson={onUpdateLesson}
            onSaveChapter={onSaveChapter}
            onCancelChapter={onCancelChapter}
            lessonError={lessonError}
            isLoading={isSavingLesson}
            isNewChapter={selectedChapter?.isNew ?? false}
          />
        )}
      </div>
    </div>
  );
};

export default CourseContentLayout;
