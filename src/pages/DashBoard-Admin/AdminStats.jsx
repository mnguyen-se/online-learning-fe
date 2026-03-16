import React, { useEffect, useMemo, useState } from 'react';
import { getAllUsers, getNewStudentsStats } from '../../api/userApi';
import { getCourses } from '../../api/coursesApi';
import DashboardLayout from '../../components/DashboardLayout';
import './dashboard.css';

const ROLE_LABEL_MAP = {
  ADMIN: 'Quản trị viên',
  COURSE_MANAGER: 'Quản lý',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học viên',
};

const ROLE_COLOR_MAP = {
  ADMIN: '#f97316',
  MANAGER: '#0ea5e9',
  COURSE_MANAGER: '#0ea5e9',
  TEACHER: '#9333ea',
  STUDENT: '#14b8a6',
  UNKNOWN: '#94a3b8',
};

const AdminStats = () => {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newStudents, setNewStudents] = useState([]);
  const [newStudentsLoading, setNewStudentsLoading] = useState(true);
  const [newStudentsError, setNewStudentsError] = useState(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [daysRange, setDaysRange] = useState(7);
  const dayRangeOptions = [7, 14, 30];

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

  useEffect(() => {
    let cancelled = false;
    const loadNewStudents = async () => {
      setNewStudentsLoading(true);
      setNewStudentsError(null);
      try {
        const data = await getNewStudentsStats(daysRange);
        const list = Array.isArray(data) ? data : data?.data ?? [];
        const normalized = list
          .map((item) => ({
            date: item.date || item.createdAt || item.day || '',
            count: Number(item.count ?? item.value ?? 0),
          }))
          .filter((item) => item.date);
        if (!cancelled) {
          setNewStudents(normalized);
        }
      } catch {
        if (!cancelled) {
          setNewStudents([]);
          setNewStudentsError('Không tải được dữ liệu học viên đăng ký mới');
        }
      } finally {
        if (!cancelled) setNewStudentsLoading(false);
      }
    };
    loadNewStudents();

    return () => {
      cancelled = true;
    };
  }, [daysRange]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.active).length,
    inactiveUsers: users.filter((u) => !u.active).length,
    totalCourses: courses.length,
  };

  const getRoleLabel = (role) => {
    if (!role) return 'Không xác định';
    const key = String(role).toUpperCase();
    return ROLE_LABEL_MAP[key] || role;
  };

  const recentUsers = users
    .slice()
    .reverse()
    .slice(0, 6)
    .map((u) => ({
      id: u.id ?? u.username ?? u.email,
      name: u.name || u.username || u.email || 'Người dùng',
      role: getRoleLabel(u.role),
      active: Boolean(u.active),
    }));

  const cleanStudentsData = newStudents.map((item) => ({
    date: String(item.date),
    count: Number(item.count || 0),
  }));

  const chartOptions = useMemo(() => {
    const width = 600;
    const height = 220;
    const padding = { left: 40, right: 20, top: 20, bottom: 30 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxCount = cleanStudentsData.length
      ? Math.max(0, ...cleanStudentsData.map((row) => row.count))
      : 0;
    const yMaxBaseline = Math.max(5, Math.ceil(maxCount / 5) * 5);
    const yMax = Math.max(yMaxBaseline, 5);
    const yTickCount = 5;
    const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => (yMax / yTickCount) * i);

    const points = cleanStudentsData.map((item, index) => {
      const x =
        cleanStudentsData.length > 1
          ? padding.left + (innerWidth * index) / (cleanStudentsData.length - 1)
          : padding.left + innerWidth / 2;
      const y = padding.top + innerHeight - (yMax > 0 ? (innerHeight * item.count) / yMax : 0);
      return { ...item, x, y };
    });

    const linePath = points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');

    const xLabels = points.map((p) => {
      const parsed = new Date(p.date);
      if (!Number.isNaN(parsed.getTime())) {
        const day = `${String(parsed.getDate()).padStart(2, '0')}`;
        const month = `${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        return `${day}/${month}`;
      }
      return p.date;
    });

    return { width, height, padding, innerWidth, innerHeight, yMax, yTicks, points, linePath, xLabels };
  }, [cleanStudentsData]);

  const getTooltipText = (idx) => {
    const point = chartOptions.points[idx];
    if (!point) return '';
    return `Ngày ${chartOptions.xLabels[idx] || point.date}: ${point.count} học viên`;
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
            <h3>Học viên đăng ký mới</h3>
            <div className="admin-stats-panel-actions">
              <label htmlFor="new-students-days" className="admin-stats-panel-label">
                Số ngày:
              </label>
              <select
                id="new-students-days"
                className="admin-stats-panel-select"
                value={daysRange}
                onChange={(event) => setDaysRange(Number(event.target.value))}
                aria-label="Chọn số ngày dữ liệu học viên mới"
              >
                {dayRangeOptions.map((value) => (
                  <option key={value} value={value}>
                    {value} ngày qua
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-stats-chart" role="img" aria-label="Biểu đồ đường học viên đăng ký mới">
            {newStudentsLoading ? (
              <div className="admin-stats-loading">
                <div className="admin-stats-spinner" aria-hidden="true" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : newStudentsError ? (
              <div>{newStudentsError}</div>
            ) : chartOptions.points.length === 0 ? (
              <div>Chưa có dữ liệu để hiển thị.</div>
            ) : (
              <>
                <svg viewBox="0 0 600 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="admin-stats-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.20" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Y grid */}
                  {chartOptions.yTicks.map((tick) => {
                    const y =
                      chartOptions.padding.top +
                      chartOptions.innerHeight -
                      (tick / chartOptions.yMax) * chartOptions.innerHeight;
                    return (
                      <g key={`ytick-${tick}`}>
                        <line
                          x1={chartOptions.padding.left}
                          x2={600 - chartOptions.padding.right}
                          y1={y}
                          y2={y}
                          stroke="#CBD5E1"
                          strokeWidth="1"
                          opacity="0.4"
                        />
                        <text
                          x={10}
                          y={y + 4}
                          fill="#475569"
                          fontSize="11"
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  {/* X labels */}
                  {chartOptions.points.map((point, index) => (
                    <text
                      key={`xlabel-${index}`}
                      x={point.x}
                      y={chartOptions.padding.top + chartOptions.innerHeight + 18}
                      fill="#475569"
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {chartOptions.xLabels[index]}
                    </text>
                  ))}

                  <path
                    d={`${chartOptions.linePath} L ${chartOptions.points[chartOptions.points.length - 1].x} ${chartOptions.padding.top + chartOptions.innerHeight} L ${chartOptions.points[0].x} ${chartOptions.padding.top + chartOptions.innerHeight} Z`}
                    fill="url(#admin-stats-area-gradient)"
                    stroke="none"
                  />
                  <path
                    d={chartOptions.linePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {chartOptions.points.map((point, index) => {
                    const isHovered = hoveredPointIndex === index;
                    return (
                      <g key={`point-${index}`}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isHovered ? 5 : 4}
                          fill="#2563EB"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          onMouseEnter={() => setHoveredPointIndex(index)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        />

                        {isHovered && (
                          <g>
                            <rect
                              x={point.x + 8}
                              y={point.y - 25}
                              width={150}
                              height={24}
                              fill="#1E40AF"
                              rx={4}
                            />
                            <text
                              x={point.x + 10}
                              y={point.y - 10}
                              fill="#FFFFFF"
                              fontSize="11"
                              fontWeight="600"
                            >
                              {getTooltipText(index)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
                <div className="admin-stats-chart-legend">
                  <div className="admin-stats-chart-dot" aria-hidden="true" />
                  <span>Tổng trong {daysRange} ngày: <strong>{cleanStudentsData.reduce((sum, item) => sum + item.count, 0)}</strong></span>
                </div>
              </>
            )}
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
                    {u.active ? 'Hoạt động' : 'Không hoạt động'}
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

