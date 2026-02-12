import React, { useEffect, useState } from 'react';
import { getMyCourses } from '../../api/coursesApi';
import CourseCard from './components/CourseCard';
import './TeacherPages.css';

function TeacherMyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyCourses();
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) setCourses(list);
      } catch (err) {
        if (!cancelled) {
          const message = err?.response?.data?.message ?? err?.message ?? 'Không thể tải danh sách khóa học.';
          setError(message);
          setCourses([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourses();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="teacher-page-wrap">
      <div className="tmc-view">
        <div className="tmc-header">
          <h2 className="tmc-header-title">Khóa học của tôi</h2>
          <p className="tmc-header-desc">Danh sách khóa học được gán cho bạn.</p>
        </div>

        {loading && (
          <div className="tmc-state tmc-state--loading">
            <p>Đang tải khóa học...</p>
          </div>
        )}

        {!loading && error && (
          <div className="tmc-state tmc-state--error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="tmc-state tmc-state--empty">
            <p>Chưa có khóa học nào được gán cho bạn.</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="tmc-grid">
            {courses.map((course) => (
              <CourseCard key={course?.courseId ?? course?.id ?? course?.courseName ?? Math.random()} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherMyCourses;
