import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ChevronLeft, BookOpen, Users, ArrowRight, Layers } from 'lucide-react';
import { getPublicModulesByCourse } from '../../api/module';
import { getLessonView } from '../../api/lessionApi';
import { getCourseById } from '../../api/coursesApi';
import CourseStudentList from './components/CourseStudentList';
import './TeacherPages.css';

const idToKey = (v) => String(v ?? '');
const resolveModuleId = (m) => m?.moduleId ?? m?.id ?? m?.module_id;
const resolveLessonModuleId = (l) => l?.moduleId ?? l?.module?.moduleId ?? l?.sectionId ?? l?.section?.id;

/**
 * Trang chi tiết khóa học giáo viên: hiển thị các chương (module) public + card Danh sách học viên.
 * Click chương → trang Module (bài học public). Chỉ hiển thị bài đã public.
 */
function TeacherCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [lessonCountByModule, setLessonCountByModule] = useState({});
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('overview'); // 'overview' | 'students'

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    Promise.all([
      getPublicModulesByCourse(courseId),
      getLessonView().catch(() => []),
      getCourseById(courseId).catch(() => null),
    ])
      .then(([modulesData, lessonsData, course]) => {
        if (cancelled) return;
        const rawModules = Array.isArray(modulesData) ? modulesData : modulesData?.data ?? [];
        const rawLessons = Array.isArray(lessonsData) ? lessonsData : lessonsData?.data ?? [];
        setModules(rawModules.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
        const countByModule = {};
        rawLessons.forEach((l) => {
          const mid = idToKey(resolveLessonModuleId(l));
          countByModule[mid] = (countByModule[mid] || 0) + 1;
        });
        setLessonCountByModule(countByModule);
        if (course?.title) setCourseName(course.title);
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

  if (loading) {
    return (
      <div className="teacher-page-wrap teacher-cd-wrap">
        <div className="teacher-cd-loading">
          <Spin size="large" />
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-page-wrap teacher-cd-wrap">
        <div className="teacher-cd-error">
          <p>{error}</p>
          <button type="button" className="teacher-cd-back-btn" onClick={() => navigate('/teacher-page/courses')} aria-label="Quay lại">
            <ChevronLeft size={20} strokeWidth={2} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'students') {
    return (
      <div className="teacher-page-wrap teacher-cd-wrap">
        <button type="button" onClick={() => setView('overview')} className="teacher-cd-back-btn" aria-label="Quay lại">
          <ChevronLeft size={20} strokeWidth={2} />
          <span>Quay lại</span>
        </button>
        <CourseStudentList courseId={courseId} courseName={courseName} />
      </div>
    );
  }

  return (
    <div className="teacher-page-wrap teacher-cd-wrap teacher-cd-wrap--modules">
      <nav className="teacher-breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="teacher-breadcrumb__link" onClick={() => navigate('/teacher-page/courses')}>
          Khóa học của tôi
        </button>
        <span className="teacher-breadcrumb__sep">/</span>
        <span className="teacher-breadcrumb__current">{courseName || 'Chi tiết khóa học'}</span>
      </nav>
      <h1 className="teacher-cd-heading">{courseName || 'Chi tiết khóa học'}</h1>
      <p className="teacher-cd-subtitle">Chọn chương để xem bài học đã xuất bản. Chỉ hiển thị nội dung public.</p>

      <div className="teacher-cd-modules-grid">
        {modules.map((mod, index) => {
          const mid = resolveModuleId(mod);
          const count = lessonCountByModule[idToKey(mid)] ?? 0;
          const cardTitle = index === 0 ? 'Bài học' : (mod.title || 'Chương');
          return (
            <article
              key={mid}
              className="teacher-module-card"
              onClick={() => navigate(`/teacher-page/courses/${courseId}/modules/${mid}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher-page/courses/${courseId}/modules/${mid}`)}
              role="button"
              tabIndex={0}
            >
              <div className="teacher-module-card__icon">
                <Layers size={24} strokeWidth={1.8} />
              </div>
              <div className="teacher-module-card__body">
                <h2 className="teacher-module-card__title">{cardTitle}</h2>
                <p className="teacher-module-card__meta">{count} bài học</p>
              </div>
              <ArrowRight size={18} className="teacher-module-card__arrow" />
            </article>
          );
        })}
        <article
          className="teacher-module-card teacher-module-card--students"
          onClick={() => setView('students')}
          onKeyDown={(e) => e.key === 'Enter' && setView('students')}
          role="button"
          tabIndex={0}
        >
          <div className="teacher-module-card__icon teacher-module-card__icon--purple">
            <Users size={24} strokeWidth={1.8} />
          </div>
          <div className="teacher-module-card__body">
            <h2 className="teacher-module-card__title">Danh sách học viên</h2>
            <p className="teacher-module-card__meta">Xem và chấm điểm bài nộp</p>
          </div>
          <ArrowRight size={18} className="teacher-module-card__arrow" />
        </article>
      </div>

      {modules.length === 0 && (
        <div className="teacher-cd-empty">
          <BookOpen size={48} strokeWidth={1} className="teacher-cd-empty-icon" />
          <p>Chưa có chương học nào được xuất bản cho khóa này.</p>
        </div>
      )}
    </div>
  );
}

export default TeacherCourseDetail;
