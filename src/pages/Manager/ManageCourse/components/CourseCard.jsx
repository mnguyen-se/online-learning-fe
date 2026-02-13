import React from 'react';

const IconChapters = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h6" />
  </svg>
);

const IconLessons = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconTests = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const IconPencil = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

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
      className="manager-course-card"
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <h3 className="manager-course-card__title">{course.title}</h3>

      <div className="manager-course-card__meta">
        <div className="manager-course-card__meta-row">
          <span className="manager-course-card__meta-icon">
            <IconChapters />
          </span>
          <span>{chaptersCount} CHƯƠNG</span>
        </div>
        <div className="manager-course-card__meta-row">
          <span className="manager-course-card__meta-icon">
            <IconLessons />
          </span>
          <span>{lessonsCount} BÀI HỌC</span>
        </div>
        <div className="manager-course-card__meta-row">
          <span className="manager-course-card__meta-icon">
            <IconTests />
          </span>
          <span>{testsCount} BÀI KIỂM TRA</span>
        </div>
      </div>

      <div className="manager-course-card__footer">
        <label className="manager-course-card__status">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onToggleActive(course, e)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className={isActive ? 'manager-course-card__status-label is-public' : 'manager-course-card__status-label'}>
            {isActive ? 'Công khai' : 'Riêng tư'}
          </span>
        </label>

        <button
          type="button"
          className="manager-course-card__edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(course);
          }}
        >
          Cập nhật
          <IconPencil />
        </button>
      </div>
    </article>
  );
};

export default CourseCard;
