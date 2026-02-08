import React from 'react';

const CourseCard = ({ 
  course, 
  courseStats, 
  courseActiveStates, 
  onSelect, 
  onToggleActive,
  onEdit,
  getCourseId,
  getCourseIsActive,
}) => {
  const courseId = getCourseId(course);

  const stats = courseStats?.[courseId] || {
    chapters: 0,
    modules: 0,
    lessons: 0,
    tests: 0,
  };

  const toSafeNumber = (value) =>
    Number.isFinite(value) ? value : Number(value) || 0;

  const chaptersCount = toSafeNumber(stats.chapters ?? stats.modules ?? 0);
  const lessonsCount = toSafeNumber(stats.lessons ?? 0);
  const testsCount = toSafeNumber(stats.tests ?? 0);

  const isActive =
    typeof courseActiveStates[courseId] === 'boolean'
      ? courseActiveStates[courseId]
      : getCourseIsActive(course);

  return (
    <article
      className="manager-card"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSelect();
        }
      }}
    >
      {/* phần JSX còn lại giữ nguyên */}
    </article>
  );
};

export default CourseCard;
