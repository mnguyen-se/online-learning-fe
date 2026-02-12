import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, ChevronLeft } from 'lucide-react';
import { getModulesByCourse } from '../../api/module';
import CourseVideoPlayer from './components/CourseVideoPlayer';
import CourseLearningSidebar from './components/CourseLearningSidebar';
import './TeacherPages.css';

function getAllLessons(modules) {
  const list = [];
  (modules || []).forEach((mod) => {
    (mod.lessons || []).forEach((l) => list.push(l));
  });
  return list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

/**
 * Trang học video khi giáo viên bấm "Xem chi tiết".
 * Hiển thị bên dưới Header và bên phải Sidebar hệ thống.
 * Bố cục 2 cột: 70% Video + 30% Nội dung khóa học (accordion).
 */
function TeacherCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getModulesByCourse(courseId)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setModules(list);
        const lessons = getAllLessons(list);
        if (lessons.length > 0) setCurrentLesson((prev) => prev || lessons[0]);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Không tải được nội dung.');
          setModules([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [courseId]);

  const handleSelectLesson = useCallback((lesson) => {
    setCurrentLesson(lesson);
    setSidebarOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="tcd-wrap">
        <div className="tcd-loading">
          <p>Đang tải nội dung khóa học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tcd-wrap">
        <div className="tcd-error">
          <p>{error}</p>
          <button type="button" className="tcd-back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} strokeWidth={2} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tcd-wrap">
      <div className="tcd-top-bar">
        <button type="button" className="tcd-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} strokeWidth={2} />
          <span>Quay lại</span>
        </button>
        <button
          type="button"
          className="tcd-drawer-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Mở/đóng nội dung khóa học"
        >
          <Menu size={22} strokeWidth={2} />
          <span>Nội dung khóa học</span>
        </button>
      </div>

      <div className="tcd-main">
        <section className="tcd-video-col">
          <div className="tcd-video-card">
            <CourseVideoPlayer lesson={currentLesson} />
            {currentLesson && (
              <h2 className="tcd-video-title">{currentLesson.title}</h2>
            )}
          </div>
        </section>

        <aside className={`tcd-sidebar-col ${sidebarOpen ? 'tcd-sidebar-col--open' : ''}`}>
          <div className="tcd-sidebar-card">
            <CourseLearningSidebar
              modules={modules}
              currentLessonId={currentLesson?.lessonId}
              completedLessonIds={completedLessonIds}
              onSelectLesson={handleSelectLesson}
            />
          </div>
          {sidebarOpen && (
            <div
              className="tcd-sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </aside>
      </div>
    </div>
  );
}

export default TeacherCourseDetail;
