import React, { useEffect, useState } from 'react';
import { getMyFeedbacks } from '../../api/feedbackApi';
import './TeacherPages.css';

function TeacherFeedback() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyFeedbacks()
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="teacher-page-wrap">
      <h1 className="teacher-page-title">Feedback</h1>
      <p className="teacher-page-desc">Danh sách nhận xét đã gửi cho học viên.</p>

      <div className="teacher-table-wrap">
        {loading ? (
          <p className="teacher-muted">Đang tải...</p>
        ) : (
          <table className="teacher-table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Bài tập</th>
                <th>Điểm</th>
                <th>Nhận xét</th>
                <th>Ngày gửi</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="teacher-table-empty">Chưa có feedback nào.</td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id || `${item.submissionId}-${item.studentId}`}>
                    <td>{item.studentName || item.userName || '—'}</td>
                    <td>{item.assignmentTitle || item.assignmentName || '—'}</td>
                    <td>{item.score != null ? item.score : '—'}</td>
                    <td className="teacher-feedback-cell">{item.feedback || '—'}</td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TeacherFeedback;
