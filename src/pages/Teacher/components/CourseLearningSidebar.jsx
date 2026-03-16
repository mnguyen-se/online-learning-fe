import React, { useState } from 'react';
import { Collapse } from 'antd';
import { Play, CheckCircle, Circle } from 'lucide-react';

function LessonRow({ lesson, isActive, isCompleted, onSelect }) {
  const title = lesson?.title || 'Bài học';

  let icon = <Circle size={18} />;
  if (isCompleted) icon = <CheckCircle size={18} />;
  else if (isActive) icon = <Play size={18} />;

  return (
    <button
      type="button"
      className={`tcd-lesson-row ${isActive ? 'tcd-lesson-row--active' : ''} ${isCompleted ? 'tcd-lesson-row--done' : ''}`}
      onClick={() => onSelect(lesson)}
    >
      <span className="tcd-lesson-icon">{icon}</span>
      <span className="tcd-lesson-title">{title}</span>
    </button>
  );
}

/**
 * Sidebar nội dung khóa học: accordion modules → lessons.
 * Dùng trong tab "Nội dung khóa học".
 */
function CourseLearningSidebar({ modules, currentLessonId, completedLessonIds = new Set(), onSelectLesson }) {
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

  const items = sorted.map((mod) => {
    const lessons = Array.isArray(mod.lessons)
      ? [...mod.lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      : [];
    return {
      key: mod.moduleId,
      label: (
        <span className="tcd-accordion-label">
          {mod.title || 'Chương'} <span className="tcd-accordion-count">({lessons.length} bài)</span>
        </span>
      ),
      children: (
        <div className="tcd-accordion-body">
          {lessons.map((lesson) => {
            const lessonKey = lesson.lessonId;
            const isCompleted =
              lessonKey &&
              (completedLessonIds instanceof Set
                ? completedLessonIds.has(lessonKey)
                : Array.isArray(completedLessonIds)
                  ? completedLessonIds.includes(lessonKey)
                  : false);
            return (
              <LessonRow
                key={lesson.lessonId}
                lesson={lesson}
                isActive={currentLessonId === lesson.lessonId}
                isCompleted={isCompleted}
                onSelect={onSelectLesson}
              />
            );
          })}
        </div>
      ),
    };
  });

  return (
    <div className="tcd-sidebar-inner">
      <h3 className="tcd-sidebar-heading">Nội dung khóa học</h3>
      <Collapse
        defaultActiveKey={sorted.map((m) => m.moduleId)}
        ghost
        className="tcd-accordion-ant"
        items={items}
      />
    </div>
  );
}

export default CourseLearningSidebar;
