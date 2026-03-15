import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Select, Table, Input, Avatar, Tag, Button, Modal, Form, InputNumber, Spin, Empty } from 'antd';
import { Search, ClipboardCheck } from 'lucide-react';
import { getTeacherCourses } from '../../api/teacherApi';
import {
  getAssignmentsByCourse,
  getQuizSubmissions,
  getWritingSubmissions,
  getQuizSubmission,
  getWritingSubmission,
  gradeQuizSubmission,
  gradeWritingSubmission,
} from '../../api/assignmentApi';
import { notify } from '../../utils/notification';
import './TeacherPages.css';
import './TeacherGrading.css';

const ASSIGNMENT_TYPE_QUIZ = 'QUIZ';
const ASSIGNMENT_TYPE_WRITING = 'WRITING';

const formatSubmissionDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

const getStatusType = (submission, assignment) => {
  if (submission.score != null) return 'graded';
  const submittedAt = submission.submittedAt ? new Date(submission.submittedAt) : null;
  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;
  if (dueDate && submittedAt && submittedAt > dueDate) return 'late';
  return 'pending';
};

function TeacherGrading() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseIdParam = searchParams.get('courseId');
  const assignmentIdParam = searchParams.get('assignmentId');

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdParam || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignmentIdParam || '');

  /** Đồng bộ filter lên URL để reload trang vẫn giữ khóa học + bài tập. */
  useEffect(() => {
    const nextCourse = selectedCourseId || '';
    const nextAssignment = selectedAssignmentId || '';
    if (courseIdParam !== nextCourse || assignmentIdParam !== nextAssignment) {
      const next = {};
      if (nextCourse) next.courseId = nextCourse;
      if (nextAssignment) next.assignmentId = nextAssignment;
      setSearchParams(next, { replace: true });
    }
  }, [selectedCourseId, selectedAssignmentId, courseIdParam, assignmentIdParam, setSearchParams]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [modalSubmission, setModalSubmission] = useState(null);
  const [submissionDetail, setSubmissionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [gradeForm] = Form.useForm();

  useEffect(() => {
    getTeacherCourses()
      .then((data) => {
        // BE GET /courses/my-courses trả về { totalCourses, courses: CourseDtoRes[] }
        const raw = Array.isArray(data)
          ? data
          : Array.isArray(data?.courses)
            ? data.courses
            : Array.isArray(data?.data)
              ? data.data
              : [];
        // Chỗ chọn khóa học: chỉ lấy khóa public
        setCourses(raw.filter((c) => c.public === true || c.isPublic === true));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    if (courseIdParam) {
      queueMicrotask(() => setSelectedCourseId(courseIdParam));
    }
  }, [courseIdParam]);

  useEffect(() => {
    if (assignmentIdParam) {
      queueMicrotask(() => setSelectedAssignmentId(assignmentIdParam));
    }
  }, [assignmentIdParam]);

  useEffect(() => {
    if (!selectedCourseId) {
      const tid = setTimeout(() => setAssignments([]), 0);
      return () => clearTimeout(tid);
    }
    const tid = setTimeout(() => {
      setAssignments([]);
      setLoadingAssignments(true);
    }, 0);
    let cancelled = false;
    getAssignmentsByCourse(selectedCourseId)
      .then((data) => {
        if (!cancelled) setAssignments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAssignments(false);
      });
    return () => {
      clearTimeout(tid);
      cancelled = true;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedAssignmentId || assignments.length === 0) {
      const tid = setTimeout(() => setSubmissions([]), 0);
      return () => clearTimeout(tid);
    }
    const assignment = assignments.find((a) => String(a.assignmentId ?? a.id) === String(selectedAssignmentId));
    if (!assignment) {
      const tid = setTimeout(() => setSubmissions([]), 0);
      return () => clearTimeout(tid);
    }
    const type = (assignment.assignmentType || assignment.assignment_type || '').toUpperCase();
    const tid = setTimeout(() => setLoadingSubmissions(true), 0);
    let cancelled = false;
    const fetchSubmissions = type === ASSIGNMENT_TYPE_WRITING ? getWritingSubmissions : getQuizSubmissions;
    fetchSubmissions(selectedAssignmentId)
      .then((data) => {
        if (!cancelled) setSubmissions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubmissions(false);
      });
    return () => {
      clearTimeout(tid);
      cancelled = true;
    };
  }, [selectedAssignmentId, assignments]);

  const selectedAssignment = assignments.find((a) => String(a.assignmentId ?? a.id) === String(selectedAssignmentId));

  const filteredAndSortedSubmissions = useMemo(() => {
    let list = [...(submissions || [])];
    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const name = (s.studentName || s.student_name || s.userName || '').toLowerCase();
        const email = (s.studentEmail || s.email || '').toLowerCase();
        const code = (s.studentId ?? s.student_id ?? s.code ?? s.userCode ?? '').toString().toLowerCase();
        return name.includes(q) || email.includes(q) || code.includes(q);
      });
    }
    list.sort((a, b) => {
      const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [submissions, searchText]);

  const openGradeModal = (sub) => {
    setModalSubmission(sub);
    const score = sub.score != null ? sub.score : undefined;
    gradeForm.setFieldsValue({ score, feedback: sub.feedback || '' });
    setSubmissionDetail(null);
    const sid = sub.submissionId ?? sub.id;
    if (!sid || !selectedAssignment) return;
    const type = (selectedAssignment.assignmentType || selectedAssignment.assignment_type || '').toUpperCase();
    setLoadingDetail(true);
    const fetchDetail = type === ASSIGNMENT_TYPE_WRITING ? getWritingSubmission(sid) : getQuizSubmission(sid);
    fetchDetail
      .then((res) => {
        const data = res?.data ?? res;
        setSubmissionDetail(data);
      })
      .catch(() => notify.error('Không tải được chi tiết bài nộp', 'Vui lòng kiểm tra kết nối và thử lại.'))
      .finally(() => setLoadingDetail(false));
  };

  const closeGradeModal = () => {
    setModalSubmission(null);
    setSubmissionDetail(null);
    gradeForm.resetFields();
  };

  const handleSubmitGrade = (values) => {
    const sid = modalSubmission?.submissionId ?? modalSubmission?.id;
    if (!sid || !selectedAssignment) return;
    const scoreVal = values.score;
    if (scoreVal != null && (Number.isNaN(scoreVal) || scoreVal < 0 || scoreVal > 10)) {
      notify.warning('Điểm số không hợp lệ', 'Điểm số hợp lệ từ 0 đến 10.');
      return;
    }
    const type = (selectedAssignment.assignmentType || selectedAssignment.assignment_type || '').toUpperCase();
    const answers = submissionDetail?.answers ?? [];
    const answerGrades = answers.map((a) => ({
      answerId: a.answerId,
      pointsEarned: a.pointsEarned ?? 0,
      isCorrect: a.isCorrect ?? false,
    }));
    const payload = {
      score: scoreVal ?? 0,
      feedback: (values.feedback || '').trim() || null,
      answerGrades,
    };
    setSubmitting(true);
    const gradeFn = type === ASSIGNMENT_TYPE_WRITING ? gradeWritingSubmission : gradeQuizSubmission;
    gradeFn(sid, payload)
      .then(() => {
        notify.success('Đã lưu điểm và nhận xét', 'Thông tin đã được cập nhật vào hệ thống.');
        closeGradeModal();
        const fetchSubmissions = type === ASSIGNMENT_TYPE_WRITING ? getWritingSubmissions : getQuizSubmissions;
        fetchSubmissions(selectedAssignmentId).then((data) => setSubmissions(Array.isArray(data) ? data : []));
      })
      .catch(() => notify.error('Không thể lưu', 'Vui lòng thử lại sau.'))
      .finally(() => setSubmitting(false));
  };

  const columns = [
    {
      title: 'Học sinh',
      key: 'student',
      width: 300,
      render: (_, record) => {
        const name = record.studentName || record.student_name || record.userName || record.email || 'Học viên';
        const email = record.studentEmail || record.student_email || record.email || '';
        const initial = (name && name[0]) ? name[0].toUpperCase() : '?';
        return (
          <div className="grading-table-student">
            <Avatar size={48} className="grading-table-avatar grading-table-avatar-purple">
              {initial}
            </Avatar>
            <div className="grading-table-student-info">
              <span className="grading-table-student-name">{name}</span>
              {email && <span className="grading-table-student-email">{email}</span>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'NGÀY NỘP',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      sorter: (a, b) => {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return ta - tb;
      },
      defaultSortOrder: 'descend',
      render: (v) => (
        <span className="grading-table-date">{formatSubmissionDate(v)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: (_, record) => {
        const statusType = getStatusType(record, selectedAssignment);
        if (statusType === 'graded') {
          return <Tag color="success" className="grading-table-status-tag">Đã chấm</Tag>;
        }
        if (statusType === 'late') {
          return <Tag color="error" className="grading-table-status-tag">Nộp trễ</Tag>;
        }
        return <Tag color="warning" className="grading-table-status-tag">Chưa chấm</Tag>;
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      align: 'center',
      render: (score) =>
        score != null ? (
          <span className="grading-table-score-value">{score}</span>
        ) : (
          <span className="grading-table-score-empty">—</span>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_, record) => {
        const type = (selectedAssignment?.assignmentType ?? selectedAssignment?.assignment_type ?? '').toUpperCase();
        const isWriting = type === ASSIGNMENT_TYPE_WRITING;
        const sid = record.submissionId ?? record.id;
        return (
          <Button
            type="primary"
            size="middle"
            icon={<ClipboardCheck size={16} strokeWidth={2.25} />}
            onClick={() => {
              if (sid) {
                if (isWriting) {
                  navigate(`/teacher-page/grade/writing/${sid}`, {
                    state: {
                      courseId: selectedCourseId,
                      assignmentId: selectedAssignmentId,
                    },
                  });
                } else {
                  navigate(`/teacher-page/grade/quiz/${sid}`, {
                    state: {
                      courseId: selectedCourseId,
                      assignmentId: selectedAssignmentId,
                    },
                  });
                }
              }
            }}
            className="grading-table-btn-grade"
          >
            Chấm điểm
          </Button>
        );
      },
    },
  ];

  return (
    <div className="teacher-page-wrap grading-page">
      <h1 className="teacher-page-title">Chấm điểm</h1>
      <p className="teacher-page-desc">Quản lý và đánh giá kết quả học tập của học sinh.</p>

      <Card className="grading-filter-card" bordered={false}>
        <div className="grading-filter-row">
          <div className="grading-filter-group">
            <label className="grading-filter-label">Khóa học</label>
            <Select
              size="large"
              placeholder="Chọn khóa học"
              value={selectedCourseId || undefined}
              onChange={(courseId) => {
                setSelectedCourseId(courseId);
                setSelectedAssignmentId('');
                setSubmissions([]);
                setSearchText('');
                setAssignments([]);
              }}
              loading={loadingCourses}
              allowClear
              className="grading-select grading-select-course"
              options={[
                { value: '', label: 'Chọn khóa học' },
                ...courses.map((c) => ({
                  value: String(c.courseId ?? c.id),
                  label: c.title || c.name || c.courseName || c.code || '—',
                })),
              ]}
            />
          </div>
          <div className="grading-filter-group">
            <label className="grading-filter-label">Bài tập</label>
            <Select
              size="large"
              placeholder="Chọn bài tập"
              value={selectedAssignmentId || undefined}
              onChange={setSelectedAssignmentId}
              loading={loadingAssignments}
              disabled={!selectedCourseId}
              allowClear
              className="grading-select grading-select-assignment"
              options={[
                { value: '', label: 'Chọn bài tập' },
                ...assignments.map((a) => ({
                  value: String(a.assignmentId ?? a.id),
                  label: a.title || a.name || `Bài tập #${a.assignmentId ?? a.id}`,
                })),
              ]}
            />
          </div>
          <div className="grading-filter-group grading-filter-group-search">
            <label className="grading-filter-label">Tìm kiếm học sinh</label>
            <Input
              size="large"
              placeholder="Tên hoặc mã học sinh..."
              prefix={<Search size={18} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="grading-filter-search"
            />
          </div>
        </div>
      </Card>

      <Card className="grading-table-card" bordered={false}>
        <h2 className="grading-table-card-title">Danh sách bài nộp</h2>

        {!selectedAssignmentId ? (
          <Empty description="Vui lòng chọn khóa học và bài tập để xem bài nộp." className="grading-empty" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredAndSortedSubmissions.map((s, i) => ({ ...s, key: s.submissionId ?? s.id ?? i }))}
            loading={loadingSubmissions}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} bài nộp`,
              className: 'grading-pagination',
            }}
            locale={{
              emptyText: <Empty description="Chưa có bài nộp nào." />,
            }}
            className="grading-table"
          />
        )}
      </Card>

      <Modal
        title={`Chấm bài — ${modalSubmission?.studentName || modalSubmission?.userName || 'Học viên'}`}
        open={!!modalSubmission}
        onCancel={closeGradeModal}
        footer={null}
        destroyOnClose
        width={480}
        className="grading-modal"
      >
        {(loadingDetail || modalSubmission) && (
          <Form
            form={gradeForm}
            layout="vertical"
            onFinish={handleSubmitGrade}
          >
            <Form.Item
              name="score"
              label="Điểm số (0–10)"
              rules={[
                { required: true, message: 'Vui lòng nhập điểm.' },
                { type: 'number', min: 0, max: 10, message: 'Điểm từ 0 đến 10.' },
              ]}
            >
              <InputNumber min={0} max={10} step={0.25} placeholder="Nhập điểm" className="grading-modal-input" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="feedback" label="Nhận xét (feedback)">
              <Input.TextArea rows={4} placeholder="Nhập nhận xét cho học viên..." />
            </Form.Item>
            <div className="grading-modal-actions">
              <Button onClick={closeGradeModal}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                disabled={loadingDetail}
              >
                {loadingDetail ? 'Đang tải...' : 'Lưu điểm và nhận xét'}
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}

export default TeacherGrading;
