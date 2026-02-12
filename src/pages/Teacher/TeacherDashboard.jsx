import React, { useEffect, useState } from 'react';
import { Users, Clock, BookOpen, CheckCircle } from 'lucide-react';
import { getTeacherCourses } from '../../api/teacherApi';
import { getEnrolledStudentsByCourse } from '../../api/enrollmentApi';
import { getLearningProcess } from '../../api/learningProcessApi';
import './TeacherPages.css';

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [completionRate, setCompletionRate] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getTeacherCourses()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setCourses(list);

        const courseIds = list.map((c) => c.courseId).filter(Boolean);
        if (courseIds.length === 0) {
          setStudentsCount(0);
          setCompletionRate(0);
          return;
        }

        Promise.all(
          courseIds.map((id) =>
            getEnrolledStudentsByCourse(id).catch(() => [])
          )
        ).then((results) => {
          if (cancelled) return;
          const total = results.reduce(
            (sum, students) => sum + (Array.isArray(students) ? students.length : 0),
            0
          );
          setStudentsCount(total);
        });

        Promise.all(
          courseIds.map((id) =>
            getLearningProcess(id)
              .then((p) => (p && typeof p.progressPercent === 'number' ? p.progressPercent : 0))
              .catch(() => 0)
          )
        ).then((percents) => {
          if (cancelled) return;
          const valid = percents.filter((p) => typeof p === 'number');
          const avg =
            valid.length > 0
              ? Math.round(
                  valid.reduce((a, b) => a + b, 0) / valid.length
                )
              : 0;
          setCompletionRate(avg);
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

  const activeCourses = loading ? 0 : courses.length;

  const weeklySubmissions = [4, 7, 5, 12, 8, 15, 6];
  const dataMax = Math.max(...weeklySubmissions, 1);
  const totalSubmissions = weeklySubmissions.reduce((a, b) => a + b, 0);
  const yMax = Math.max(16, Math.ceil(dataMax / 4) * 4);
  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );
  const chartData = WEEK_DAYS.map((day, i) => ({
    day,
    count: weeklySubmissions[i],
  }));

  const chartAreaHeightPx = 180;
  const getBarHeightPx = (value) =>
    value > 0 && yMax > 0
      ? Math.max(4, Math.round((value / yMax) * chartAreaHeightPx))
      : 0;

  return (
    <div className="teacher-page-wrap teacher-dashboard-wrap">
      <h1 className="teacher-page-title">Dashboard</h1>
      <p className="teacher-page-desc">Tổng quan hoạt động giảng dạy của bạn.</p>

      <div className="teacher-dash-cards">
        <div className="teacher-dash-card">
          <div className="teacher-dash-card__icon teacher-dash-card__icon--blue">
            <Users size={20} strokeWidth={2} />
          </div>
          <div className="teacher-dash-card__body">
            <span className="teacher-dash-card__label">Học viên đang học</span>
            <span className="teacher-dash-card__value">
              {loading ? '...' : studentsCount}
            </span>
            <span className="teacher-dash-card__trend teacher-dash-card__trend--up">
              ↑ 12% so với tháng trước
            </span>
          </div>
        </div>

        <div className="teacher-dash-card">
          <div className="teacher-dash-card__icon teacher-dash-card__icon--blue">
            <Clock size={20} strokeWidth={2} />
          </div>
          <div className="teacher-dash-card__body">
            <span className="teacher-dash-card__label">Bài tập chưa chấm</span>
            <span className="teacher-dash-card__value">24</span>
            <span className="teacher-dash-card__trend teacher-dash-card__trend--down">
              ↓ 5% so với tháng trước
            </span>
          </div>
        </div>

        <div className="teacher-dash-card">
          <div className="teacher-dash-card__icon teacher-dash-card__icon--blue">
            <BookOpen size={20} strokeWidth={2} />
          </div>
          <div className="teacher-dash-card__body">
            <span className="teacher-dash-card__label">Khóa học active</span>
            <span className="teacher-dash-card__value">
              {loading ? '...' : activeCourses}
            </span>
          </div>
        </div>

        <div className="teacher-dash-card">
          <div className="teacher-dash-card__icon teacher-dash-card__icon--blue">
            <CheckCircle size={20} strokeWidth={2} />
          </div>
          <div className="teacher-dash-card__body">
            <span className="teacher-dash-card__label">Tỉ lệ hoàn thành</span>
            <span className="teacher-dash-card__value">
              {loading && completionRate === null ? '...' : `${completionRate ?? 0}%`}
            </span>
            <span className="teacher-dash-card__trend teacher-dash-card__trend--up">
              ↑ 2% so với tháng trước
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section – UI demo với mock data (backend chưa có API thống kê submission theo assignment) */}
      <section className="teacher-chart-section">
        <div className="teacher-chart-card teacher-chart-card--new">
          <div className="teacher-chart-header">
            <h2 className="teacher-chart-title">Thống kê nộp bài tuần này</h2>
            <div className="teacher-chart-total">
              Tổng: <span className="teacher-chart-total-value">{totalSubmissions}</span> bài nộp
              <span className="teacher-chart-demo-badge">Dữ liệu mẫu</span>
            </div>
          </div>

          {/* Chart: Y domain 0..yMax, category X (day), bars + labels aligned */}
          <div className="teacher-chart-container">
            <div className="teacher-chart-y-col">
              {yTicks.map((value) => (
                <span key={value} className="teacher-chart-y-tick-label">
                  {value}
                </span>
              ))}
            </div>
            <div className="teacher-chart-main">
              <div className="teacher-chart-bars-row">
                <div className="teacher-chart-grid-layer" />
                {chartData.map((item, i) => {
                  const value = item.count;
                  const barHeightPx = getBarHeightPx(value);
                  const isHighest = value === dataMax;
                  const isHovered = hoveredBar === i;
                  return (
                    <div
                      key={item.day}
                      className="teacher-chart-bar-col"
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="teacher-chart-bar-inner">
                        <div
                          className={`teacher-chart-tooltip ${isHovered ? 'teacher-chart-tooltip--visible' : ''}`}
                        >
                          {value} bài
                          <span className="teacher-chart-tooltip-arrow" />
                        </div>
                        <div
                          className={`teacher-chart-bar-new ${
                            isHighest ? 'teacher-chart-bar-new--highest' : ''
                          } ${isHovered ? 'teacher-chart-bar-new--hover' : ''}`}
                          style={{
                            height: barHeightPx ? `${barHeightPx}px` : '0',
                          }}
                        >
                          <span className="teacher-chart-bar-shine" />
                        </div>
                      </div>
                      <span className="teacher-chart-day-label">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="teacher-chart-legend">
            <div className="teacher-chart-legend-item">
              <span className="teacher-chart-legend-dot teacher-chart-legend-dot--blue" />
              <span className="teacher-chart-legend-text">Ngày thường</span>
            </div>
            <div className="teacher-chart-legend-item">
              <span className="teacher-chart-legend-dot teacher-chart-legend-dot--emerald" />
              <span className="teacher-chart-legend-text">Cao nhất</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TeacherDashboard;
