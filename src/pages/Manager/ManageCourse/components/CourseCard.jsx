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
  const toSafeNumber = (value) => (Number.isFinite(value) ? value : Number(value) || 0);
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
      key={courseId || course.title || Math.random()}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSelect();
        }
      }}
    >
      <div className="manager-card-image">
        <span className="manager-card-badge">ĐÃ DUYỆT</span>
      </div>
      <div className="manager-card-body">
        <h3 className="manager-card-title">{course.title}</h3>
        <div className="manager-card-meta">
          <span className="manager-card-meta-item">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3C2 2.44772 2.44772 2 3 2H5C5.55228 2 6 2.44772 6 3V5C6 5.55228 5.55228 6 5 6H3C2.44772 6 2 5.55228 2 5V3Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5C14 5.55228 13.5523 6 13 6H11C10.4477 6 10 5.55228 10 5V3Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 11C2 10.4477 2.44772 10 3 10H5C5.55228 10 6 10.4477 6 11V13C6 13.5523 5.55228 14 5 14H3C2.44772 14 2 13.5523 2 13V11Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 11C10 10.4477 10.4477 10 11 10H13C13.5523 10 14 10.4477 14 11V13C14 13.5523 13.5523 14 13 14H11C10.4477 14 10 13.5523 10 13V11Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {chaptersCount} Chương
          </span>
          <span className="manager-card-meta-item">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 5L11 8L6 11V5Z" fill="currentColor"/>
            </svg>
            {lessonsCount} Bài học
          </span>
          <span className="manager-card-meta-item">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 2.5H11L12.5 4V13.5C12.5 14.0523 12.0523 14.5 11.5 14.5H4.5C3.94772 14.5 3.5 14.0523 3.5 13.5V3.5C3.5 2.94772 3.94772 2.5 4.5 2.5H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 1.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {testsCount} Bài kiểm tra
          </span>
        </div>
        <div className="manager-card-footer">
          <div className="manager-card-status">
            <label 
              className="manager-card-toggle"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => onToggleActive(course, event)}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="manager-card-toggle-slider"></span>
              <span className="manager-card-status-text">
                {isActive ? 'Công khai' : 'Riêng tư'}
              </span>
            </label>
          </div>
          <button 
            className="manager-card-edit" 
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(course);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.68601 11.9447 1.5913C12.1731 1.49659 12.4173 1.44824 12.6633 1.44824C12.9094 1.44824 13.1536 1.49659 13.382 1.5913C13.6104 1.68601 13.8183 1.8249 13.9933 2.00001C14.1684 2.17512 14.3073 2.38301 14.402 2.61141C14.4967 2.83981 14.5451 3.08401 14.5451 3.33001C14.5451 3.57601 14.4967 3.82021 14.402 4.04861C14.3073 4.27701 14.1684 4.4849 13.9933 4.66001L5.15998 13.4933L1.33331 14.6667L2.50665 10.84L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cập nhật
          </button>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
