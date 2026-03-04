import React from 'react';
import CourseContentSidebar from './CourseContentSidebar';
import CourseGeneralConfig from './CourseGeneralConfig';
import ChapterInfo from './ChapterInfo';
import LessonDetails from './LessonDetails';
import CourseTestDetails from './CourseTestDetails';

const CourseContentLayout = ({
  selectedCourse,
  contentTab,
  courseCoverImageUrl: _courseCoverImageUrl,
  lessons,
  tests = [],
  isLoadingLessons,
  lessonsError,
  lessonError,
  isSavingLesson,
  selectedChapterId,
  selectedLessonId,
  selectedTestId,
  isCreatingLesson,
  moduleLessons = [],
  onTabChange,
  onCoverImageUrlChange: _onCoverImageUrlChange,
  onAddChapter,
  onAddLessonItem,
  onAddTest,
  onSelectChapter,
  onSelectLesson,
  onSelectTest,
  onDeleteChapter,
  onDeleteLesson,
  onSaveChapter,
  onCancelChapter,
  onSaveLesson,
  onCancelLesson,
  onUpdateLesson,
  onUpdateModuleLesson,
  onEditLesson,
  onCancelEditLesson,
  onSaveTest,
  onCancelTest,
  onUpdateTest,
  isSavingTest,
  testError,
  onSaveAndFinish,
  getCourseId,
  getCourseIsActive,
  onSaveGeneralConfig,
  isSavingGeneralConfig = false,
  teachers = [],
  isReloadingLessons = false,
  isEditingLesson = false,
  isLoadingTests = false,
  testsError = '',
}) => {
  const selectedChapter = selectedChapterId
    ? lessons.find((l) => l.id === selectedChapterId) ?? null
    : null;
  
  const selectedLesson = selectedLessonId
    ? moduleLessons.find((l) => l.id === selectedLessonId) ?? null
    : null;

  const selectedTest = selectedTestId
    ? tests.find((t) => t.id === selectedTestId) ?? null
    : null;

  return (
    <div className="course-content-layout">
      <CourseContentSidebar
        selectedCourse={selectedCourse}
        contentTab={contentTab}
        lessons={lessons}
        tests={tests}
        selectedChapterId={selectedChapterId}
        selectedTestId={selectedTestId}
        onTabChange={onTabChange}
        onAddChapter={onAddChapter}
        onAddLessonItem={onAddLessonItem}
        onAddTest={onAddTest}
        onSelectChapter={onSelectChapter}
        onSelectLesson={onSelectLesson}
        onSelectTest={onSelectTest}
        onDeleteChapter={onDeleteChapter}
        onDeleteLesson={onDeleteLesson}
        onSaveAndFinish={onSaveAndFinish}
        getCourseId={getCourseId}
        isLoadingLessons={isLoadingLessons}
        lessonsError={lessonsError}
        isLoadingTests={isLoadingTests}
        testsError={testsError}
        isSavingLesson={isSavingLesson}
        moduleLessons={moduleLessons}
        selectedLessonId={selectedLessonId}
        isReloadingLessons={isReloadingLessons}
        isSavingTest={isSavingTest}
      />

      <div className="course-content-main">
        {contentTab === 'general' ? (
          <CourseGeneralConfig
            selectedCourse={selectedCourse}
            onSaveGeneralConfig={onSaveGeneralConfig}
            isSaving={isSavingGeneralConfig}
            teachers={teachers}
            getCourseIsActive={getCourseIsActive}
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
            allowedLessonTypes={['VIDEO', 'TEXT']}
          />
        ) : contentTab === 'test' ? (
          <CourseTestDetails
            key={selectedTestId ?? 'new-test'}
            selectedTest={selectedTest}
            courseId={getCourseId?.(selectedCourse) ?? selectedCourse?.id ?? ''}
            onSave={onSaveTest}
            onCancel={onCancelTest}
            onUpdateTest={onUpdateTest}
            isLoading={isSavingTest}
            isNewTest={selectedTest?.isNew ?? false}
            testError={testError}
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
