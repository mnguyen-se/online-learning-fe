import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTeacherCourses } from '../../api/teacherApi';
import { getAssignmentsByCourse } from '../../api/assignmentApi';
import { getSubmissionsByAssignment, gradeSubmission } from '../../api/teacherApi';
import './TeacherPages.css';

function TeacherGrading() {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get('courseId');
  const assignmentIdParam = searchParams.get('assignmentId');

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdParam || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignmentIdParam || '');
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [modalSubmission, setModalSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTeacherCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    if (courseIdParam) setSelectedCourseId(courseIdParam);
  }, [courseIdParam]);

  useEffect(() => {
    if (assignmentIdParam) setSelectedAssignmentId(assignmentIdParam);
  }, [assignmentIdParam]);

  useEffect(() => {
    if (!selectedCourseId) {
      setAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    getAssignmentsByCourse(selectedCourseId)
      .then((data) => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => setAssignments([]))
      .finally(() => setLoadingAssignments(false));
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setSubmissions([]);
      return;
    }
    setLoadingSubmissions(true);
    getSubmissionsByAssignment(selectedAssignmentId)
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubmissions(false));
  }, [selectedAssignmentId]);

  const openGradeModal = (sub) => {
    setModalSubmission(sub);
    setGradeValue(sub.score != null ? String(sub.score) : '');
    setFeedbackText(sub.feedback || '');
  };

  const closeGradeModal = () => {
    setModalSubmission(null);
    setGradeValue('');
    setFeedbackText('');
  };

  const handleSubmitGrade = (e) => {
    e.preventDefault();
    if (!modalSubmission?.id) return;
    const score = gradeValue.trim() === '' ? null : Number(gradeValue);
    if (score != null && (Number.isNaN(score) || score < 0 || score > 10)) {
      toast.warning('Điểm số hợp lệ từ 0 đến 10.');
      return;
    }
    setSubmitting(true);
    gradeSubmission(modalSubmission.id, { score, feedback: feedbackText.trim() || null })
      .then(() => {
        toast.success('Đã lưu điểm và nhận xét.');
        closeGradeModal();
        getSubmissionsByAssignment(selectedAssignmentId).then((data) => setSubmissions(Array.isArray(data) ? data : []));
      })
      .catch(() => toast.error('Không thể lưu. Vui lòng thử lại.'))
      .finally(() => setSubmitting(false));
  };

  const selectedAssignment = assignments.find((a) => String(a.id) === String(selectedAssignmentId));

  return (
    <div className="teacher-page-wrap">
      <h1 className="teacher-page-title">Chấm bài</h1>
      <p className="teacher-page-desc">Chọn khóa học và bài tập để xem bài nộp và chấm điểm.</p>

      <div className="teacher-grading-filters">
        <div className="teacher-form-group">
          <label>Khóa học</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            disabled={loadingCourses}
            className="teacher-select"
          >
            <option value="">-- Chọn khóa học --</option>
            {courses.map((c) => (
              <option key={c.id || c.courseId} value={c.id || c.courseId}>{c.name || c.courseName || c.code || '—'}</option>
            ))}
          </select>
        </div>
        <div className="teacher-form-group">
          <label>Bài tập</label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            disabled={loadingAssignments || !selectedCourseId}
            className="teacher-select"
          >
            <option value="">-- Chọn bài tập --</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>{a.title || a.name || `Bài tập #${a.id}`}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="teacher-section">
        <h2 className="teacher-section__title">
          Bài nộp {selectedAssignment ? `: ${selectedAssignment.title || selectedAssignment.name || ''}` : ''}
        </h2>
        {loadingSubmissions ? (
          <p className="teacher-muted">Đang tải bài nộp...</p>
        ) : !selectedAssignmentId ? (
          <p className="teacher-muted">Vui lòng chọn khóa học và bài tập.</p>
        ) : (
          <div className="teacher-table-wrap">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Ngày nộp</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="teacher-table-empty">Chưa có bài nộp.</td>
                  </tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.studentName || s.userName || s.email || `#${s.id}`}</td>
                      <td>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('vi-VN') : '—'}</td>
                      <td>{s.score != null ? s.score : '—'}</td>
                      <td>
                        <span className={`teacher-badge ${s.score != null ? 'teacher-badge--done' : 'teacher-badge--pending'}`}>
                          {s.score != null ? 'Đã chấm' : 'Chưa chấm'}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="teacher-btn teacher-btn--small teacher-btn--primary" onClick={() => openGradeModal(s)}>
                          Chấm / Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalSubmission && (
        <div className="teacher-modal-overlay" onClick={closeGradeModal} role="presentation">
          <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal__header">
              <h3>Chấm bài — {modalSubmission.studentName || modalSubmission.userName || 'Học viên'}</h3>
              <button type="button" className="teacher-modal__close" onClick={closeGradeModal} aria-label="Đóng">×</button>
            </div>
            <form onSubmit={handleSubmitGrade} className="teacher-grade-form">
              <div className="teacher-form-group">
                <label>Điểm số (0–10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.25"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  className="teacher-input"
                  placeholder="Nhập điểm"
                />
              </div>
              <div className="teacher-form-group">
                <label>Nhận xét (feedback)</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="teacher-textarea"
                  rows={4}
                  placeholder="Nhập nhận xét cho học viên..."
                />
              </div>
              <div className="teacher-modal__actions">
                <button type="button" className="teacher-btn teacher-btn--secondary" onClick={closeGradeModal}>Hủy</button>
                <button type="submit" className="teacher-btn teacher-btn--primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu điểm và nhận xét'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherGrading;
