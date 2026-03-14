import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getEnrolledStudentsByCourse, unenrollStudent } from '../../api/enrollmentApi';
import './StudentListModal.css';

/**
 * Modal hiển thị danh sách học viên trong khóa học.
 * Dùng khi Admin/Manager click vào số lượng học viên.
 * Có nút Hủy gán cho từng học viên (Admin/Manager).
 */
function StudentListModal({ isOpen, onClose, courseId, courseTitle, onUnassignSuccess }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmUnassign, setConfirmUnassign] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);

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

  const handleUnassignClick = (student) => {
    setConfirmUnassign(student);
  };

  const handleConfirmUnassign = async () => {
    if (!confirmUnassign || !courseId) return;
    const username = confirmUnassign.username ?? confirmUnassign.userName ?? '';
    if (!username) {
      toast.error('Không tìm thấy username học viên.');
      setConfirmUnassign(null);
      return;
    }
    setIsUnassigning(true);
    try {
      await unenrollStudent(courseId, username);
      toast.success('Đã hủy gán học viên khỏi khóa học.');
      setStudents((prev) => prev.filter((s) => (s.username ?? s.userName ?? '').toLowerCase() !== username.toLowerCase()));
      setConfirmUnassign(null);
      onUnassignSuccess?.(courseId);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Hủy gán thất bại.';
      toast.error(msg);
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleCancelUnassign = () => {
    setConfirmUnassign(null);
  };

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
                    <th>Thao tác</th>
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
                      <td>
                        <button
                          type="button"
                          className="student-list-modal-unassign-btn"
                          onClick={() => handleUnassignClick(s)}
                          title="Hủy gán học viên khỏi khóa học"
                          aria-label="Hủy gán"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          Hủy gán
                        </button>
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

      {/* Modal xác nhận hủy gán */}
      {confirmUnassign && (
        <div className="student-list-modal-overlay student-list-confirm-overlay" onClick={handleCancelUnassign}>
          <div className="student-list-confirm-box" onClick={(e) => e.stopPropagation()}>
            <h4>Xác nhận hủy gán</h4>
            <p>
              Bạn có chắc chắn muốn xóa học viên <strong>{confirmUnassign.name || confirmUnassign.username || '—'}</strong> khỏi khóa học?
              Học viên sẽ không còn quyền truy cập vào khóa học này.
            </p>
            <div className="student-list-confirm-actions">
              <button type="button" className="student-list-modal-btn" onClick={handleCancelUnassign} disabled={isUnassigning}>
                Hủy
              </button>
              <button type="button" className="student-list-modal-btn student-list-confirm-danger" onClick={handleConfirmUnassign} disabled={isUnassigning}>
                {isUnassigning ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentListModal;
