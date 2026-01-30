import React from 'react';
import CourseCard from './CourseCard';

const CourseList = ({
  courses,
  isLoadingCourses,
  coursesError,
  courseStats,
  courseActiveStates,
  onSelectCourse,
  onToggleActive,
  onEditCourse,
  getCourseId,
  getCourseIsActive,
}) => {
  if (isLoadingCourses) {
    return <div className="course-status">Đang tải khóa học...</div>;
  }

  if (coursesError) {
    return <div className="course-status course-status-error">{coursesError}</div>;
  }

  if (courses.length === 0) {
    return <div className="course-status">Chưa có khóa học nào.</div>;
  }

  return (
    <>
      {courses.map((course) => {
        const courseId = getCourseId(course);
        if (!courseId) {
          console.warn('Course missing ID:', course);
        }
        return (
          <CourseCard
            key={courseId || course.title || Math.random()}
            course={course}
            courseStats={courseStats}
            courseActiveStates={courseActiveStates}
            onSelect={() => {
              const nextCourseId = getCourseId(course);
              onSelectCourse({
                ...course,
                id: nextCourseId ?? course.id,
              }, nextCourseId);
            }}
            onToggleActive={onToggleActive}
            onEdit={(course) => {
              const nextCourseId = getCourseId(course);
              onEditCourse({
                ...course,
                id: nextCourseId ?? course.id,
              }, nextCourseId);
            }}
            getCourseId={getCourseId}
            getCourseIsActive={getCourseIsActive}
          />
        );
      })}
    </>
  );
};

export default CourseList;
