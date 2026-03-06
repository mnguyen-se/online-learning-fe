import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ChevronLeft, Play, Circle } from 'lucide-react';
import { getPublicModulesByCourse } from '../../api/module';
import { getLessonsByModuleIdAndIsPublicTrue } from '../../api/lessionApi';
import { getCourseById } from '../../api/coursesApi';
import CourseVideoPlayer from './components/CourseVideoPlayer';
import './TeacherPages.css';

/**
 * Trang chi tiết một chương (module): danh sách bài học public bên trái, video/nội dung bên phải.
 * Chỉ hiển thị bài học đã public (API GET /lessons/IdAndPublic?moduleId=).
 */
function TeacherModuleDetail() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId || !moduleId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    Promise.all([
      getPublicModulesByCourse(courseId),
      getLessonsByModuleIdAndIsPublicTrue(Number(moduleId)),
      getCourseById(courseId).catch(() => null),
    ])
      .then(([modulesData, lessonsData, course]) => {
        if (cancelled) return;
        const rawModules = Array.isArray(modulesData) ? modulesData : modulesData?.data ?? [];
        const mod = rawModules.find((m) => String(m.moduleId ?? m.id) === String(moduleId));
        if (mod) setModuleTitle(mod.title || 'Chương');
        if (course?.title) setCourseName(course.title);
        const list = Array.isArray(lessonsData) ? lessonsData : lessonsData?.data ?? [];
        const sorted = [...list].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setLessons(sorted);
        if (sorted.length > 0) setCurrentLesson(sorted[0]);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Không tải được bài học.');
          setLessons([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [courseId, moduleId]);

  const handleSelectLesson = useCallback((lesson) => {
    setCurrentLesson(lesson);
  }, []);

  if (loading) {
    return (
      <div className="teacher-page-wrap teacher-md-wrap">
        <div className="teacher-cd-loading">
          <Spin size="large" />
          <p>Đang tải bài học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-page-wrap teacher-md-wrap">
        <div className="teacher-cd-error">
          <p>{error}</p>
          <button type="button" className="teacher-cd-back-btn" onClick={() => navigate(`/teacher-page/courses/${courseId}`)} aria-label="Quay lại">
            <ChevronLeft size={20} strokeWidth={2} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-page-wrap teacher-md-wrap">
      <nav className="teacher-breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="teacher-breadcrumb__link" onClick={() => navigate('/teacher-page/courses')}>
          Khóa học của tôi
        </button>
        <span className="teacher-breadcrumb__sep">/</span>
        <button type="button" className="teacher-breadcrumb__link" onClick={() => navigate(`/teacher-page/courses/${courseId}`)}>
          {courseName || 'Khóa học'}
        </button>
        <span className="teacher-breadcrumb__sep">/</span>
        <span className="teacher-breadcrumb__current">{moduleTitle}</span>
      </nav>

      <button
        type="button"
        className="teacher-cd-back-btn teacher-md-back"
        onClick={() => navigate(`/teacher-page/courses/${courseId}`)}
        aria-label="Quay lại khóa học"
      >
        <ChevronLeft size={20} strokeWidth={2} />
        <span>Quay lại</span>
      </button>

      <div className="teacher-md-main">
        <section className="tcd-video-col">
          <div className="tcd-video-card">
            <CourseVideoPlayer lesson={currentLesson} />
            {currentLesson && <h2 className="tcd-video-title">{currentLesson.title}</h2>}
          </div>
        </section>
        <aside className="tcd-sidebar-col">
          <div className="tcd-sidebar-card">
            <h3 className="tcd-sidebar-heading">Bài học ({lessons.length})</h3>
            {lessons.length === 0 ? (
              <div className="tcd-sidebar-empty">
                <p>Chưa có bài học public trong chương này.</p>
              </div>
            ) : (
              <div className="teacher-md-lesson-list">
                {lessons.map((lesson) => {
                  const isActive = currentLesson?.lessonId === lesson.lessonId || currentLesson?.id === lesson.id;
                  return (
                    <button
                      key={lesson.lessonId ?? lesson.id}
                      type="button"
                      className={`tcd-lesson-row ${isActive ? 'tcd-lesson-row--active' : ''}`}
                      onClick={() => handleSelectLesson(lesson)}
                    >
                      <span className="tcd-lesson-icon">
                        {isActive ? <Play size={18} /> : <Circle size={18} />}
                      </span>
                      <span className="tcd-lesson-title">{lesson.title || 'Bài học'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default TeacherModuleDetail;
