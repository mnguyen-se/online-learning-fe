import React, { useEffect, useState } from 'react';
import { Drawer, Table, Button, Empty, Spin, Space, Tag } from 'antd';
import { MessageSquare, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getWritingSubmissions,
  getQuizSubmissions,
  getAssignmentsByCourse,
} from '../../../api/assignmentApi';

const ASSIGNMENT_TYPE_WRITING = 'WRITING';
const ASSIGNMENT_TYPE_QUIZ = 'QUIZ';

/**
 * Drawer "Xem chi tiết học sinh": danh sách bài nộp (Quiz + Writing), trạng thái Submitted/Graded, nút Chấm điểm, Gửi feedback.
 */
function StudentDetailDrawer({ open, onClose, student, courseId, courseName: _courseName }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !courseId || !student) return;
    let cancelled = false;
    const studentId = String(student.studentId ?? student.userId ?? '');
    setLoading(true);
    setSubmissions([]);

    getAssignmentsByCourse(courseId)
      .then((assignList) => {
        if (cancelled) return;
        const list = Array.isArray(assignList) ? assignList : [];
        const promises = list.map((a) => {
          const assignmentId = a.assignmentId ?? a.id;
          const title = a.title || a.name || `Bài tập #${assignmentId}`;
          const type = (a.assignmentType || a.assignment_type || '').toUpperCase();
          const isWriting = type === ASSIGNMENT_TYPE_WRITING;
          const fetchSubs = isWriting ? getWritingSubmissions(assignmentId) : getQuizSubmissions(assignmentId);
          return fetchSubs
            .then((subList) =>
              (subList || [])
                .filter((s) => String(s.studentId ?? s.student?.userId) === studentId)
                .map((s) => ({
                  ...s,
                  assignmentTitle: title,
                  assignmentId,
                  assignmentType: type,
                }))
            )
            .catch(() => []);
        });
        return Promise.all(promises);
      })
      .then((arrays) => {
        if (cancelled) return;
        const all = (arrays || []).flat();
        setSubmissions(all);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, courseId, student]);

  const subColumns = [
    { title: 'Bài tập', dataIndex: 'assignmentTitle', key: 'assignmentTitle', ellipsis: true },
    {
      title: 'Loại',
      dataIndex: 'assignmentType',
      key: 'assignmentType',
      width: 90,
      render: (t) => (
        <Tag color={(t || '').toUpperCase() === ASSIGNMENT_TYPE_WRITING ? 'blue' : 'green'}>
          {(t || '').toUpperCase() === ASSIGNMENT_TYPE_WRITING ? 'Writing' : 'Quiz'}
        </Tag>
      ),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 100,
      render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const isGraded = (status || '').toUpperCase() === 'GRADED';
        return (
          <Tag color={isGraded ? 'success' : 'default'}>
            {isGraded ? 'Graded' : 'Submitted'}
          </Tag>
        );
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (s, r) => (r.status === 'GRADED' && s != null ? s : '—'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            onClose();
            navigate(`/teacher-page/grade?courseId=${courseId}&assignmentId=${r.assignmentId}`);
          }}
        >
          Chấm điểm
        </Button>
      ),
    },
  ];

  return (
    <Drawer
      title={student ? `Chi tiết: ${student.name || student.username || 'Học viên'}` : 'Chi tiết học viên'}
      placement="right"
      width={560}
      onClose={onClose}
      open={open}
      footer={
        <Space>
          <Button
            type="primary"
            icon={<Award size={16} />}
            onClick={() => {
              onClose();
              navigate(`/teacher-page/grade?courseId=${courseId}`);
            }}
          >
            Chấm bài
          </Button>
          <Button
            icon={<MessageSquare size={16} />}
            onClick={() => {
              onClose();
              navigate('/teacher-page/feedback');
            }}
          >
            Gửi feedback
          </Button>
        </Space>
      }
    >
      {student && (
        <>
          <div className="teacher-drawer-section">
            <h4>Bài nộp trong khóa học</h4>
            <p className="teacher-drawer-section-desc">Danh sách assignment và trạng thái (Submitted / Graded).</p>
            {loading ? (
              <Spin />
            ) : (
              <Table
                size="small"
                columns={subColumns}
                dataSource={submissions.map((s, i) => ({ ...s, key: s.submissionId ?? i }))}
                pagination={false}
                scroll={{ x: 480 }}
                locale={{ emptyText: <Empty description="Chưa có bài nộp nào." /> }}
              />
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}

export default StudentDetailDrawer;
