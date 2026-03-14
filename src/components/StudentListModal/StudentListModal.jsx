import React, { useEffect, useState } from 'react';
import { getEnrolledStudentsByCourse } from '../../api/enrollmentApi';
import './StudentListModal.css';

/**
 * Modal hiển thị danh sách học viên trong khóa học.
 * Dùng khi Admin/Manager click vào số lượng học viên.
 */
function StudentListModal({ isOpen, onClose, courseId, courseTitle }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !courseId) return;
    setLoading(true);
    setError('');
    getEnrolledStudentsByCourse(courseId)
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.data ?? [];
        setStudents(raw);
      })
      .catch(() => {
        setError('Không thể tải danh sách học viên.');
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  const getStatusLabel = (status) => {
    if (!status) return '—';
    const s = String(status).toUpperCase();
    if (s === 'ACTIVE') return 'Đang học';
    if (s === 'COMPLETED') return 'Hoàn thành';
    if (s === 'DROPPED') return 'Đã rút';
    return status;
  };

  return (
    <div className="student-list-modal-overlay" onClick={onClose}>
      <div className="student-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="student-list-modal-header">
          <h3>Danh sách học viên — {courseTitle || 'Khóa học'}</h3>
          <button type="button" className="student-list-modal-close" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="student-list-modal-body">
          {loading ? (
            <div className="student-list-modal-loading">
              <div className="student-list-modal-spinner" />
              <span>Đang tải...</span>
            </div>
          ) : error ? (
            <div className="student-list-modal-error">{error}</div>
          ) : students.length === 0 ? (
            <div className="student-list-modal-empty">Chưa có học viên nào trong khóa học này.</div>
          ) : (
            <div className="student-list-modal-table-wrap">
              <table className="student-list-modal-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s.enrollmentId ?? s.studentId ?? idx}>
                      <td>{idx + 1}</td>
                      <td>{s.name || s.username || '—'}</td>
                      <td>{s.email || '—'}</td>
                      <td>
                        <span className={`student-list-modal-status student-list-modal-status--${(s.status || '').toLowerCase()}`}>
                          {getStatusLabel(s.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="student-list-modal-footer">
          <button type="button" className="student-list-modal-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentListModal;
