import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../api/userApi';
import { getCourses } from '../../api/coursesApi';
import DashboardLayout from '../../components/DashboardLayout';
import './dashboard.css';

const AdminStats = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, coursesRes] = await Promise.all([
          getAllUsers().catch(() => []),
          getCourses().catch(() => []),
        ]);
        setUsers(Array.isArray(usersRes) ? usersRes : usersRes?.data ?? []);
        const rawCourses = Array.isArray(coursesRes) ? coursesRes : coursesRes?.data ?? [];
        setCourses(rawCourses);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.active).length,
    inactiveUsers: users.filter((u) => !u.active).length,
    totalCourses: courses.length,
  };

  const recentUsers = users
    .slice()
    .reverse()
    .slice(0, 6)
    .map((u) => ({
      id: u.id ?? u.username ?? u.email,
      name: u.name || u.username || u.email || 'Người dùng',
      role: u.role || '',
      active: Boolean(u.active),
    }));

  return (
    <DashboardLayout
      pageTitle="Thống kê hệ thống"
      pageSubtitle="Tổng quan số lượng người dùng và khóa học"
    >
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Thống kê</h1>
          <p>Tổng quan nhanh về hệ thống</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-subtitle">Tổng người dùng</div>
            <div className="stat-icon stat-icon-blue" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{stats.totalUsers}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-subtitle">Đang hoạt động</div>
            <div className="stat-icon stat-icon-green" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{stats.activeUsers}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-subtitle">Không hoạt động</div>
            <div className="stat-icon stat-icon-red" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{stats.inactiveUsers}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-subtitle">Tổng khóa học</div>
            <div className="stat-icon stat-icon-orange" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4h18v4H3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 8v12h10V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="stat-card-value">{stats.totalCourses}</div>
        </div>
      </div>

      <div className="admin-stats-grid">
        <section className="admin-stats-panel">
          <div className="admin-stats-panel-header">
            <h3>Đăng ký mới (mô phỏng)</h3>
            <span className="admin-stats-panel-hint">Chưa có dữ liệu theo ngày từ backend</span>
          </div>
          <div className="admin-stats-chart" role="img" aria-label="Biểu đồ đường mô phỏng đăng ký mới">
            <svg viewBox="0 0 600 220" preserveAspectRatio="none">
              <path
                d="M20 170 L110 140 L200 155 L290 110 L380 120 L470 80 L580 95"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path d="M20 170 L110 140 L200 155 L290 110 L380 120 L470 80 L580 95 L580 205 L20 205 Z" fill="currentColor" opacity="0.08" />
            </svg>
            <div className="admin-stats-chart-legend">
              <div className="admin-stats-chart-dot" aria-hidden="true" />
              <span>Tổng người dùng hiện tại: <strong>{stats.totalUsers}</strong></span>
            </div>
          </div>
        </section>

        <section className="admin-stats-panel">
          <div className="admin-stats-panel-header">
            <h3>Hoạt động gần đây</h3>
            <span className="admin-stats-panel-hint">Danh sách người dùng (mới nhất)</span>
          </div>
          <ul className="admin-recent-list">
            {recentUsers.length === 0 ? (
              <li className="admin-recent-empty">Chưa có dữ liệu để hiển thị.</li>
            ) : (
              recentUsers.map((u) => (
                <li key={u.id} className="admin-recent-item">
                  <div className="admin-recent-main">
                    <div className="admin-recent-name">{u.name}</div>
                    {u.role && <div className="admin-recent-meta">{u.role}</div>}
                  </div>
                  <span className={`admin-recent-status ${u.active ? 'is-active' : 'is-inactive'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {loading && (
        <div className="course-status" style={{ marginTop: '1rem' }}>
          Đang tải dữ liệu thống kê...
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminStats;

