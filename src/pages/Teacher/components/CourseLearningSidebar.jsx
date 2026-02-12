
import React, { useState } from 'react';
import { CheckCircle, Circle, Lock, Play } from 'lucide-react';

const ICON_SIZE = 18;

function LessonRow({ lesson, isActive, isCompleted, onSelect }) {
  const title = lesson?.title || 'Bài học';
  const locked = false;

  return (
    <button
      type="button"
      className={`tcd-lesson-row ${isActive ? 'tcd-lesson-row--active' : ''} ${isCompleted ? 'tcd-lesson-row--done' : ''} ${locked ? 'tcd-lesson-row--locked' : ''}`}
      onClick={() => !locked && onSelect(lesson)}
      disabled={locked}
    >
      <span className="tcd-lesson-icon">
        {locked ? (
          <Lock size={ICON_SIZE} strokeWidth={2} />
        ) : isCompleted ? (
          <CheckCircle size={ICON_SIZE} strokeWidth={2} />
        ) : isActive ? (
          <Play size={ICON_SIZE} strokeWidth={2} />
        ) : (
          <Circle size={ICON_SIZE} strokeWidth={2} />
        )}
      </span>
      <span className="tcd-lesson-title">{title}</span>
    </button>
  );
}

function CourseLearningSidebar({ modules, currentLessonId, completedLessonIds, onSelectLesson }) {
  const [openModuleIds, setOpenModuleIds] = useState(() =>
    (modules || []).map((m) => m.moduleId)
  );

  const toggleModule = (moduleId) => {
    setOpenModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const sorted = Array.isArray(modules)
    ? [...modules].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    : [];

  if (sorted.length === 0) {
    return (
      <div className="tcd-sidebar-empty">
        <p>Chưa có nội dung bài học.</p>
      </div>
    );
  }

  return (
    <div className="tcd-sidebar-inner">
      <h3 className="tcd-sidebar-heading">Nội dung khóa học</h3>
      <div className="tcd-accordion">
        {sorted.map((mod) => {
          const isOpen = openModuleIds.includes(mod.moduleId);
          const lessons = Array.isArray(mod.lessons)
            ? [...mod.lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            : [];
          return (
            <div key={mod.moduleId} className="tcd-accordion-item">
              <button
                type="button"
                className="tcd-accordion-head"
                onClick={() => toggleModule(mod.moduleId)}
                aria-expanded={isOpen}
              >
                <span className="tcd-accordion-chevron">{isOpen ? '▼' : '▶'}</span>
                <span className="tcd-accordion-title">{mod.title || 'Chương'}</span>
                <span className="tcd-accordion-count">{lessons.length} bài</span>
              </button>
              {isOpen && (
                <div className="tcd-accordion-body">
                  {lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.lessonId}
                      lesson={lesson}
                      isActive={currentLessonId === lesson.lessonId}
                      isCompleted={completedLessonIds?.has(lesson.lessonId)}
                      onSelect={onSelectLesson}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourseLearningSidebar;
