import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Empty, message, Input, Popover, Tag } from 'antd';
import { User, Mail, Eye, FileText, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEnrolledStudentsByCourse } from '../../../api/enrollmentApi';
import {
  getAssignmentsByCourse,
  getQuizSubmissions,
  getWritingSubmissions,
} from '../../../api/assignmentApi';
import MinimalPagination from '../../../components/MinimalPagination/MinimalPagination';
import StudentDetailDrawer from './StudentDetailDrawer';
import './CourseStudentList.css';

const PAGE_SIZE = 10;
const ASSIGNMENT_TYPE_QUIZ = 'QUIZ';
const ASSIGNMENT_TYPE_WRITING = 'WRITING';

/**
 * Gộp bài nộp chưa chấm theo studentId từ assignments + quiz/writing submissions.
 * @param {Array} students - Danh sách học viên (có studentId)
 * @param {string} courseId - ID khóa học
 * @returns Promise<Array> students với ungradedAssignments
 */
async function fetchStudentsWithUngraded(students, courseId) {
  if (!courseId || !Array.isArray(students) || students.length === 0) {
    return students.map((s) => ({ ...s, ungradedAssignments: [] }));
  }
  let assignments = [];
  try {
    const data = await getAssignmentsByCourse(courseId);
    assignments = Array.isArray(data) ? data : [];
  } catch {
    return students.map((s) => ({ ...s, ungradedAssignments: [] }));
  }

  const ungradedByStudent = new Map(); // studentId -> [{ assignmentId, title, type, submittedAt, submissionId }]

  const addUngraded = (studentId, item) => {
    const key = String(studentId ?? '');
    if (!ungradedByStudent.has(key)) ungradedByStudent.set(key, []);
    ungradedByStudent.get(key).push(item);
  };

  await Promise.all(
    assignments.map(async (a) => {
      const assignmentId = a.assignmentId ?? a.id;
      const title = a.title || a.name || `Bài tập #${assignmentId}`;
      const type = (a.assignmentType || a.assignment_type || '').toUpperCase();
      const isWriting = type === ASSIGNMENT_TYPE_WRITING;
      try {
        const list = isWriting
          ? await getWritingSubmissions(assignmentId)
          : await getQuizSubmissions(assignmentId);
        const subs = Array.isArray(list) ? list : [];
        subs
          .filter((s) => (s.status || '').toUpperCase() !== 'GRADED')
          .forEach((s) => {
            const sid = s.studentId ?? s.student?.userId;
            if (sid != null) {
              addUngraded(sid, {
                assignmentId,
                title,
                type,
                submittedAt: s.submittedAt,
                submissionId: s.submissionId ?? s.id,
              });
            }
          });
      } catch {
        // bỏ qua assignment lỗi
      }
    })
  );

  return students.map((s) => {
    const studentId = s.studentId ?? s.userId;
    const key = String(studentId ?? '');
    const ungradedAssignments = ungradedByStudent.get(key) || [];
    return { ...s, ungradedAssignments };
  });
}

/**
 * Trang quản lý khóa học – danh sách học viên đã enroll.
 * Bảng: Học viên, Email, Bài chưa chấm (badge + popover), Thao tác (Xem chi tiết).
 */
function CourseStudentList({ courseId, courseName }) {
  const navigate = useNavigate();
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
      const name = (s.name ?? s.username ?? '').toLowerCase();
      const email = (s.email ?? '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [students, studentSearch]);

  useEffect(() => {
    queueMicrotask(() => setCurrentPage(1));
  }, [studentSearch]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    setLoading(true);
    getEnrolledStudentsByCourse(courseId)
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        if (cancelled) return;
        return fetchStudentsWithUngraded(raw, courseId);
      })
      .then((withUngraded) => {
        if (!cancelled) setStudents(withUngraded || []);
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

  const goToGrade = (courseId, assignmentId, onClosePopover) => {
    onClosePopover?.();
    navigate(`/teacher-page/grade?courseId=${courseId}&assignmentId=${assignmentId}`);
  };

  const renderUngradedCell = (_, record) => {
    const list = record.ungradedAssignments ?? [];
    const count = list.length;

    const badge =
      count === 0 ? (
        <Tag className="course-student-ungraded-badge course-student-ungraded-badge--zero">
          <CheckCircle2 size={14} className="course-student-ungraded-badge__icon" />
          <span>Đã chấm hết</span>
        </Tag>
      ) : (
        <Tag className="course-student-ungraded-badge course-student-ungraded-badge--pending">
          <AlertTriangle size={14} className="course-student-ungraded-badge__icon" />
          <span>{count} bài chưa chấm</span>
        </Tag>
      );

    if (count === 0) {
      return <div className="course-student-ungraded-cell">{badge}</div>;
    }

    const popoverContent = (
      <div className="course-student-ungraded-popover">
        <div className="course-student-ungraded-popover__title">Bài chưa chấm</div>
        <ul className="course-student-ungraded-popover__list">
          {list.map((item, idx) => (
            <li key={`${item.assignmentId}-${item.submissionId}-${idx}`} className="course-student-ungraded-popover__item">
              <div className="course-student-ungraded-popover__item-head">
                <span className="course-student-ungraded-popover__item-title">{item.title}</span>
                <Tag className="course-student-ungraded-popover__item-type" color={item.type === ASSIGNMENT_TYPE_WRITING ? 'blue' : 'green'}>
                  {item.type === ASSIGNMENT_TYPE_WRITING ? 'Writing' : 'Quiz'}
                </Tag>
              </div>
              <div className="course-student-ungraded-popover__item-meta">
                {item.submittedAt
                  ? new Date(item.submittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : '—'}
              </div>
              <Button
                type="primary"
                size="small"
                className="course-student-ungraded-popover__btn"
                onClick={() => goToGrade(courseId, item.assignmentId)}
              >
                Chấm bài
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );

    return (
      <div className="course-student-ungraded-cell">
        <Popover
          content={popoverContent}
          trigger="click"
          placement="bottomLeft"
          overlayClassName="course-student-ungraded-popover-overlay"
        >
          <span className="course-student-ungraded-trigger">{badge}</span>
        </Popover>
      </div>
    );
  };

  const columns = [
    {
      title: 'Học viên',
      dataIndex: 'name',
      key: 'name',
      width: '28%',
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
      width: '28%',
      render: (email) => (
        <span className="teacher-student-cell-email">
          <Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: '#94a3b8' }} />
          {email || '—'}
        </span>
      ),
    },
    {
      title: 'Bài chưa chấm',
      key: 'ungraded',
      width: '24%',
      align: 'center',
      render: renderUngradedCell,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '20%',
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
      }));
  }, [filteredStudents, currentPage]);

  return (
    <div className="teacher-course-student-list course-student-list-lms">
      <h3 className="teacher-course-student-list__title">Danh sách học viên</h3>
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
