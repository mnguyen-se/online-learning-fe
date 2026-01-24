import React from 'react';
import LessonBlock from './LessonBlock';

const CourseProgram = ({
  lessons,
  isLoadingLessons,
  lessonsError,
  lessonError,
  videoEditorFor,
  assignmentEditorFor,
  onToggleLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddLesson,
  onToggleVideoEditor,
  onToggleAssignmentEditor,
  onCloseVideoEditor,
  onCloseAssignmentEditor,
}) => {
  return (
    <div className="course-content-card">
      {lessonError && (
        <p className="lesson-error">{lessonError}</p>
      )}
      {lessonsError && (
        <div className="course-status course-status-error">{lessonsError}</div>
      )}
      {isLoadingLessons && (
        <div className="course-status">Đang tải chương...</div>
      )}
      {!isLoadingLessons && !lessonsError && lessons.length === 0 && (
        <div className="course-status">Chưa có chương nào.</div>
      )}
      {!isLoadingLessons && !lessonsError && lessons.map((lesson) => (
        <LessonBlock
          key={lesson.id}
          lesson={lesson}
          onToggle={onToggleLesson}
          onUpdate={onUpdateLesson}
          onDelete={onDeleteLesson}
          onToggleVideoEditor={onToggleVideoEditor}
          onToggleAssignmentEditor={onToggleAssignmentEditor}
          videoEditorFor={videoEditorFor}
          assignmentEditorFor={assignmentEditorFor}
          onCloseVideoEditor={onCloseVideoEditor}
          onCloseAssignmentEditor={onCloseAssignmentEditor}
        />
      ))}

      <button className="lesson-add" type="button" onClick={onAddLesson}>
        + Thêm chương mới
      </button>
    </div>
  );
};

export default CourseProgram;
