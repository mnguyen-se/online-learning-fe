import React, { useEffect, useState } from 'react';
import { Drawer, Table, Button, Empty, Spin, Space } from 'antd';
import { MessageSquare, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWritingSubmissions, getAssignmentsByCourse } from '../../../api/assignmentApi';

/**
 * Drawer "Xem chi tiết học sinh": danh sách bài nộp, nút Chấm điểm, nút Gửi feedback.
 */
function StudentDetailDrawer({ open, onClose, student, courseId, courseName: _courseName }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [_assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !courseId || !student) return;
    let cancelled = false;
    const studentId = String(student.studentId ?? student.userId ?? '');
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setSubmissions([]);
      }
    });
    getAssignmentsByCourse(courseId)
      .then((assignList) => {
        if (cancelled) return;
        const list = Array.isArray(assignList) ? assignList : [];
        setAssignments(list);
        const writingAssignments = list.filter(
          (a) => (a.assignmentType || '').toUpperCase() === 'WRITING'
        );
        // Dùng allSettled để một API 500 không làm hỏng cả drawer
        return Promise.allSettled(
          writingAssignments.map((a) =>
            getWritingSubmissions(a.assignmentId ?? a.id).then((subList) =>
              (subList || [])
                .filter((s) => String(s.studentId ?? s.student?.userId) === studentId)
                .map((s) => ({
                  ...s,
                  assignmentTitle: a.title,
                  assignmentId: a.assignmentId ?? a.id,
                }))
            )
          )
        );
      })
      .then((results) => {
        if (cancelled) return;
        const all = (results || [])
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
          .flat();
        setSubmissions(Array.isArray(all) ? all : []);
      })
      .catch(() => { if (!cancelled) setSubmissions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, courseId, student]);

  const subColumns = [
    { title: 'Bài tập', dataIndex: 'assignmentTitle', key: 'assignmentTitle' },
    {
      title: 'Ngày nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—'),
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      render: (s, r) => (r.status === 'GRADED' && s != null ? s : 'Chưa chấm'),
    },
    {
      title: 'Thao tác',
      key: 'action',
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
      width={520}
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
            <h4>Danh sách bài nộp</h4>
            {loading ? (
              <Spin />
            ) : (
              <Table
                size="small"
                columns={subColumns}
                dataSource={submissions.map((s, i) => ({ ...s, key: s.submissionId ?? i }))}
                pagination={false}
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
