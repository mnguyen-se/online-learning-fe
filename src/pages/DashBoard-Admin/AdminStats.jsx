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
          <div className="stat-icon stat-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-trend stat-trend-up">Người dùng</div>
            <div className="stat-label">Tổng số người dùng</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-trend stat-trend-up">Hoạt động</div>
            <div className="stat-label">Người dùng đang hoạt động</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-red">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inactiveUsers}</div>
            <div className="stat-trend stat-trend-down">Không hoạt động</div>
            <div className="stat-label">Người dùng không hoạt động</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4h18v4H3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 8v12h10V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCourses}</div>
            <div className="stat-trend stat-trend-up">Khóa học</div>
            <div className="stat-label">Tổng số khóa học</div>
          </div>
        </div>
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

