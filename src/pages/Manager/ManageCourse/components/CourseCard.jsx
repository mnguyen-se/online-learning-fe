import React from 'react';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=60';

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

  const coverUrl = course?.coverImageUrl || course?.coverImage || DEFAULT_COVER;

  return (
    <article
      className="manager-card"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div
        className="manager-card-image"
        style={{ backgroundImage: `url(${coverUrl})` }}
        aria-hidden
      >
        <span className={`manager-card-badge ${isActive ? 'manager-card-badge--public' : 'manager-card-badge--private'}`}>
          {isActive ? 'Công khai' : 'Riêng tư'}
        </span>
      </div>

      <div className="manager-card-body">
        <h3 className="manager-card-title">{course.title}</h3>

        <div className="manager-card-meta">
          <span className="manager-card-meta-item">
            {chaptersCount} Chương
          </span>
          <span className="manager-card-meta-item">
            {lessonsCount} Bài học
          </span>
          <span className="manager-card-meta-item">
            {testsCount} Bài kiểm tra
          </span>
        </div>

        <div className="manager-card-footer">
          <label className="manager-card-toggle" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => onToggleActive(course, e)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="manager-card-toggle-slider" aria-hidden />
            <span className="manager-card-status-text">
              {isActive ? 'Công khai' : 'Riêng tư'}
            </span>
          </label>

          <button
            type="button"
            className="manager-card-edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(course);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Cập nhật
          </button>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
