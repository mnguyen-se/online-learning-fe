import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ClipboardList } from 'lucide-react';
import { getTeacherCourses } from '../../api/teacherApi';
import { getModulesByCourse } from '../../api/module';
import { getLessons } from '../../api/lessionApi';
import './TeacherPages.css';

function getCourseId(course) {
  return course?.courseId ?? course?.id ?? course?.course_id ?? null;
}

function TeacherMyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState({});

  useEffect(() => {
    let cancelled = false;

    getTeacherCourses()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setCourses(list);

        const ids = list.map((c) => getCourseId(c)).filter(Boolean);
        if (ids.length === 0) return;

        Promise.all(
          ids.map(async (courseId) => {
            try {
              const [modulesRes, lessonsRes] = await Promise.all([
                getModulesByCourse(courseId).catch(() => []),
                getLessons({ courseId }).catch(() => []),
              ]);
              const modules = Array.isArray(modulesRes) ? modulesRes : [];
              const lessonsRaw = Array.isArray(lessonsRes) ? lessonsRes : lessonsRes?.data ?? [];
              const lessons = Array.isArray(lessonsRaw) ? lessonsRaw : [];
              return {
                courseId,
                chapters: modules.length,
                lessons: lessons.length,
              };
            } catch {
              return { courseId, chapters: 0, lessons: 0 };
            }
          })
        ).then((results) => {
          if (cancelled) return;
          const stats = {};
          results.forEach((r) => {
            stats[r.courseId] = { chapters: r.chapters, lessons: r.lessons };
          });
          setCourseStats(stats);
        });
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="teacher-page-wrap">
      <div className="teacher-courses-view">
        <div className="teacher-courses-header">
          <div>
            <h2>Khóa học của tôi</h2>
            <p>Danh sách khóa học bạn đang giảng dạy.</p>
          </div>
        </div>

        {loading ? (
          <p className="teacher-course-status">Đang tải khóa học...</p>
        ) : courses.length === 0 ? (
          <p className="teacher-course-status">Chưa có khóa học nào.</p>
        ) : (
          <div className="teacher-course-cards">
            {courses.map((course) => {
              const courseId = getCourseId(course);
              const stats = courseStats[courseId] || { chapters: 0, lessons: 0 };
              const title = course.title || course.name || course.courseName || 'Khóa học';

              return (
                <article key={courseId ?? title} className="teacher-course-card">
                  <div className="teacher-course-card-image" />
                  <div className="teacher-course-card-body">
                    <h3 className="teacher-course-card-title">{title}</h3>
                    <div className="teacher-course-card-meta">
                      <span>
                        <BookOpen size={16} strokeWidth={2} />
                        {stats.chapters} Chương
                      </span>
                      <span>
                        <FileText size={16} strokeWidth={2} />
                        {stats.lessons} Bài học
                      </span>
                    </div>
                    <div className="teacher-course-card-footer">
                      <Link
                        to={`/teacher-page/grade?courseId=${courseId}`}
                        className="teacher-course-card-btn"
                      >
                        <ClipboardList size={18} strokeWidth={2} />
                        Chấm bài
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherMyCourses;
