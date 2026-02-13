import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Spin, Empty, message, Input } from 'antd';
import { User, Mail, Eye, FileText, Search } from 'lucide-react';
import { getEnrolledStudentsByCourse } from '../../../api/enrollmentApi';
import MinimalPagination from '../../../components/MinimalPagination/MinimalPagination';
import StudentDetailDrawer from './StudentDetailDrawer';

const PAGE_SIZE = 10;

/**
 * Tab "Danh sách học sinh": bảng Tên, Email, Số bài chưa chấm, Nút "Xem chi tiết".
 * Backend: GET /enrollments/courses/:courseId/students (hiện chỉ ADMIN/COURSE_MANAGER – có thể mở thêm TEACHER).
 */
function CourseStudentList({ courseId, courseName }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.name ?? '').toLowerCase();
      const username = (s.username ?? '').toLowerCase();
      const email = (s.email ?? '').toLowerCase();
      return name.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [students, studentSearch]);

  useEffect(() => {
    queueMicrotask(() => setCurrentPage(1));
  }, [studentSearch]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setCurrentPage(1);
      }
    });
    getEnrolledStudentsByCourse(courseId)
      .then((data) => {
        if (!cancelled) setStudents(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setStudents([]);
          message.warning('Không thể tải danh sách học viên. Có thể bạn chưa có quyền.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [courseId]);

  const openDetail = (record) => {
    setSelectedStudent(record);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: 'Học viên',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (name, record) => (
        <span className="teacher-student-cell-name">
          <User size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: '#64748b' }} />
          {name || record.username || '—'}
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '30%',
      render: (email) => (
        <span className="teacher-student-cell-email">
          <Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: '#94a3b8' }} />
          {email || '—'}
        </span>
      ),
    },
    {
      title: 'Bài chưa chấm',
      key: 'ungradedCount',
      width: '22%',
      align: 'center',
      render: (_, record) => {
        const count = record.ungradedCount ?? 0;
        const isActive = count > 0;
        return (
          <span className={`teacher-ungraded-pill ${isActive ? 'teacher-ungraded-pill--active' : 'teacher-ungraded-pill--zero'}`}>
            <FileText size={16} className="teacher-ungraded-pill__icon" />
            <span className="teacher-ungraded-pill__num">{count}</span>
            <span className="teacher-ungraded-pill__label">Bài tập</span>
          </span>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '23%',
      align: 'right',
      render: (_, record) => (
        <div className="teacher-student-cell-action">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<Eye size={16} />}
            onClick={() => openDetail(record)}
          >
            Xem chi tiết
          </Button>
        </div>
      ),
    },
  ];

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE)),
    [filteredStudents.length]
  );
  const dataSource = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents
      .slice(start, start + PAGE_SIZE)
      .map((s, index) => ({
        ...s,
        key: s.enrollmentId ?? s.studentId ?? start + index,
        ungradedCount: s.ungradedCount ?? 0,
      }));
  }, [filteredStudents, currentPage]);

  return (
    <div className="teacher-course-student-list">
      <h3 className="teacher-course-student-list__title">Danh sách học sinh</h3>
      {!loading && (
        <div className="teacher-course-student-list__header">
          <div className="teacher-course-student-list__search">
            <Search size={18} className="teacher-course-student-list__search-icon" />
            <Input
              placeholder="Tìm theo tên, email học viên..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              allowClear
              className="teacher-course-student-list__search-input"
              aria-label="Tìm học viên"
            />
          </div>
          <span className="teacher-course-student-list__total">
            Tổng: {filteredStudents.length} học viên
            {studentSearch.trim() ? ` (đang tìm)` : ''}
          </span>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        locale={{
          emptyText: (
            <Empty
              description={
                studentSearch.trim()
                  ? `Không có học viên nào khớp với "${studentSearch.trim()}".`
                  : 'Chưa có học viên nào.'
              }
            />
          ),
        }}
        pagination={false}
        tableLayout="fixed"
      />
      {!loading && filteredStudents.length > 0 && (
        <div className="teacher-course-student-list__footer">
          <MinimalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}
      <StudentDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        student={selectedStudent}
        courseId={courseId}
        courseName={courseName}
      />
    </div>
  );
}

export default CourseStudentList;
