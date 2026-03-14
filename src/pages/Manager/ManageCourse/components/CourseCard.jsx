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

/* Icon nút chỉnh sửa theo thiết kế nhánh learning-progress */
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconStudents = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CourseCard = ({
  course,
  courseStats,
  courseActiveStates,
  onSelect,
  onToggleActive,
  onEdit,
  onViewStudents,
  getCourseId,
  getCourseIsActive,
}) => {
  const courseId = getCourseId(course);

  const stats = courseStats?.[courseId] || {
    chapters: 0,
    modules: 0,
    lessons: 0,
    tests: 0,
    students: 0,
  };

  const toSafeNumber = (value) =>
    Number.isFinite(value) ? value : Number(value) || 0;

  const chaptersCount = toSafeNumber(stats.chapters ?? stats.modules ?? 0);
  const lessonsCount = toSafeNumber(stats.lessons ?? 0);
  const testsCount = toSafeNumber(stats.tests ?? 0);
  const studentsCount = toSafeNumber(stats.students ?? 0);

  const isActive =
    typeof courseActiveStates[courseId] === 'boolean'
      ? courseActiveStates[courseId]
      : getCourseIsActive(course);

  const handleViewStudentsClick = (e) => {
    e.stopPropagation();
    onViewStudents?.(course);
  };

  return (
    <article
      className="manager-course-card"
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
        <div className="manager-course-card__meta-row">
          <span className="manager-course-card__meta-icon">
            <IconStudents />
          </span>
          <span
            className={`manager-course-card__students ${studentsCount > 0 ? 'manager-course-card__students--clickable' : ''}`}
            onClick={handleViewStudentsClick}
            role={studentsCount > 0 ? 'button' : undefined}
            tabIndex={studentsCount > 0 ? 0 : undefined}
            onKeyDown={studentsCount > 0 ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewStudentsClick(e); } } : undefined}
            title={studentsCount > 0 ? 'Xem chi tiết danh sách học viên' : undefined}
          >
            {studentsCount} HỌC VIÊN
          </span>
        </div>
      </div>

      <div className="manager-course-card__footer">
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
          <IconEdit />
          Cập nhật
        </button>
      </div>
    </article>
  );
};

export default CourseCard;
