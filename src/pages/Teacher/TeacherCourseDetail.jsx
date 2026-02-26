import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { ChevronLeft, BookOpen, Users, ArrowRight } from 'lucide-react';
import { getModulesByCourse } from '../../api/module';
import CourseVideoPlayer from './components/CourseVideoPlayer';
import CourseLearningSidebar from './components/CourseLearningSidebar';
import CourseStudentList from './components/CourseStudentList';
import './TeacherPages.css';

function getAllLessons(modules) {
  const list = [];
  (modules || []).forEach((mod) => {
    (mod.lessons || []).forEach((l) => list.push(l));
  });
  return list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

/**
 * Trang chi tiết khóa học: màn hình 2 card (Danh sách học viên | Nội dung khóa học),
 * bấm link vào từng khu vực tương ứng.
 */
function TeacherCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [view, setView] = useState('cards'); // 'cards' | 'content' | 'students'

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    getModulesByCourse(courseId)
      .then((modulesData) => {
        if (cancelled) return;
        const list = Array.isArray(modulesData) ? modulesData : [];
        setModules(list);
        const lessons = getAllLessons(list);
        if (lessons.length > 0) setCurrentLesson((prev) => prev || lessons[0]);
        if (list[0]?.course?.title) setCourseName(list[0].course.title);
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
  }, []);

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
          <button type="button" className="teacher-cd-back-btn" onClick={() => navigate(-1)} aria-label="Quay lại">
            <ChevronLeft size={20} strokeWidth={2} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  const contentArea = (
    <div className="teacher-cd-content-tab">
      <div className="tcd-main">
        <section className="tcd-video-col">
          <div className="tcd-video-card">
            <CourseVideoPlayer lesson={currentLesson} />
            {currentLesson && (
              <h2 className="tcd-video-title">{currentLesson.title}</h2>
            )}
          </div>
        </section>
        <aside className="tcd-sidebar-col">
          <div className="tcd-sidebar-card">
            <CourseLearningSidebar
              modules={modules}
              currentLessonId={currentLesson?.lessonId}
              onSelectLesson={handleSelectLesson}
            />
          </div>
        </aside>
      </div>
    </div>
  );

  const studentsArea = (
    <div className="teacher-cd-students-tab">
      <CourseStudentList courseId={courseId} courseName={courseName} />
    </div>
  );

  if (view === 'cards') {
    return (
      <div className="teacher-page-wrap teacher-cd-wrap">
        <button
          type="button"
          onClick={() => navigate('/teacher-page/courses')}
          className="teacher-cd-back-btn"
          aria-label="Quay lại"
        >
          <ChevronLeft size={20} strokeWidth={2} />
          <span>Quay lại</span>
        </button>
        <div className="teacher-cd-cards">
          <article className="teacher-cd-card teacher-cd-card--students">
            <div className="teacher-cd-card__icon-wrap teacher-cd-card__icon-wrap--purple">
              <Users size={28} strokeWidth={1.8} />
            </div>
            <div className="teacher-cd-card__bg-icon" aria-hidden>
              <Users size={120} strokeWidth={0.8} />
            </div>
            <h2 className="teacher-cd-card__title">Danh sách học viên</h2>
            <p className="teacher-cd-card__desc">
              Theo dõi tiến độ học tập, quản lý chuyên cần và chấm điểm bài tập.
            </p>
            <button
              type="button"
              className="teacher-cd-card__link teacher-cd-card__link--blue"
              onClick={() => setView('students')}
            >
              Truy cập danh sách <ArrowRight size={16} />
            </button>
          </article>
          <article className="teacher-cd-card teacher-cd-card--content">
            <div className="teacher-cd-card__icon-wrap teacher-cd-card__icon-wrap--green">
              <BookOpen size={28} strokeWidth={1.8} />
            </div>
            <div className="teacher-cd-card__bg-icon teacher-cd-card__bg-icon--green" aria-hidden>
              <BookOpen size={120} strokeWidth={0.8} />
            </div>
            <h2 className="teacher-cd-card__title">Nội dung khóa học</h2>
            <p className="teacher-cd-card__desc">
              Quản lý giáo trình, bài giảng video, tài liệu và cấu trúc bài kiểm tra.
            </p>
            <button
              type="button"
              className="teacher-cd-card__link teacher-cd-card__link--green"
              onClick={() => setView('content')}
            >
              Truy cập giáo trình <ArrowRight size={16} />
            </button>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className={`teacher-page-wrap teacher-cd-wrap ${view === 'students' ? 'teacher-cd-wrap--students' : ''}`}>
      <button
        type="button"
        onClick={() => setView('cards')}
        className="teacher-cd-back-btn"
        aria-label="Quay lại"
      >
        <ChevronLeft size={20} strokeWidth={2} />
        <span>Quay lại</span>
      </button>
      {view === 'content' && contentArea}
      {view === 'students' && studentsArea}
    </div>
  );
}

export default TeacherCourseDetail;
