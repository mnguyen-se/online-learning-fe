import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Avatar, Button, Spin, Empty } from 'antd';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { getWritingSubmission } from '../../api/assignmentApi';
import { getAssignmentById } from '../../api/assignmentApi';
import { gradeWritingSubmission } from '../../api/assignmentApi';
import StudentAnswer from './components/StudentAnswer';
import AttachmentList from './components/AttachmentList';
import GradingPanel from './components/GradingPanel';
import './TeacherPages.css';
import './TeacherGrading.css';
import './TeacherGradingDetail.css';
import './components/SubmissionDetail.css';

/** Trả về mảng answerGrades cho API grade (backend yêu cầu không null). */
function buildAnswerGrades(submission) {
  const answers = submission?.answers ?? submission?.writingAnswers ?? [];
  if (!Array.isArray(answers) || answers.length === 0) return [];
  return answers.map((a) => ({
    answerId: a.answerId ?? a.id,
    pointsEarned: a.pointsEarned ?? a.points ?? 0,
    isCorrect: a.isCorrect ?? false,
  }));
}

/**
 * SubmissionDetail – Trang chấm điểm chi tiết khi giáo viên nhấn "Chấm điểm".
 * Layout: Header (Back, avatar, tên, mã, badge) + 2 cột (70% bài làm, 30% panel chấm).
 * API: GET writing-submissions/{id}, POST .../grade { score, feedback, answerGrades }.
 */
function TeacherGradingDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingScoreLoading, setSavingScoreLoading] = useState(false);
  const [sendingFeedbackLoading, setSendingFeedbackLoading] = useState(false);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const maxScore = submission?.maxScore ?? assignment?.maxScore ?? assignment?.totalPoints ?? assignment?.point ?? 10;

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getWritingSubmission(submissionId)
      .then((res) => {
        const data = res?.data ?? res;
        setSubmission(data);
        setScore(data?.score != null ? String(data.score) : '');
        setFeedback(data?.feedback ?? '');
        const aid = data?.assignmentId ?? data?.assignment_id ?? data?.assignment?.assignmentId ?? data?.assignment?.id;
        if (aid) {
          return getAssignmentById(aid).then((a) => {
            const assignmentData = a?.data ?? a;
            setAssignment(assignmentData);
          });
        }
      })
      .catch(() => {
        toast.error('Không tải được bài nộp.');
        setSubmission(null);
      })
      .finally(() => setLoading(false));
  }, [submissionId]);

  const handleSaveScore = () => {
    const numScore = score === '' ? null : Number(score);
    if (numScore != null && (Number.isNaN(numScore) || numScore < 0 || numScore > maxScore)) {
      toast.warning(`Điểm số hợp lệ từ 0 đến ${maxScore}.`);
      return;
    }
    if (numScore == null) {
      toast.warning('Vui lòng nhập điểm.');
      return;
    }
    setSavingScoreLoading(true);
    const answerGrades = buildAnswerGrades(submission);
    gradeWritingSubmission(submissionId, {
      score: numScore,
      feedback: feedback.trim() || null,
      answerGrades,
    })
      .then(() => {
        toast.success('Đã lưu điểm.');
        setSubmission((prev) => (prev ? { ...prev, score: numScore, feedback: feedback.trim() || null } : null));
      })
      .catch(() => toast.error('Không thể lưu điểm. Vui lòng thử lại.'))
      .finally(() => setSavingScoreLoading(false));
  };

  const handleSendFeedback = () => {
    setSendingFeedbackLoading(true);
    const answerGrades = buildAnswerGrades(submission);
    gradeWritingSubmission(submissionId, {
      score: submission?.score ?? 0,
      feedback: feedback.trim() || null,
      answerGrades,
    })
      .then(() => {
        toast.success('Đã gửi nhận xét.');
        setSubmission((prev) => (prev ? { ...prev, feedback: feedback.trim() || null } : null));
      })
      .catch(() => toast.error('Không thể gửi nhận xét. Vui lòng thử lại.'))
      .finally(() => setSendingFeedbackLoading(false));
  };

  const backToList = () => {
    const courseId =
      location.state?.courseId ??
      submission?.courseId ??
      submission?.course_id;
    const assignmentId =
      location.state?.assignmentId ??
      submission?.assignmentId ??
      submission?.assignment_id ??
      assignment?.assignmentId ??
      assignment?.id;
    if (courseId != null && assignmentId != null) {
      navigate(`/teacher-page/grade?courseId=${courseId}&assignmentId=${assignmentId}`, {
        state: { courseId: String(courseId), assignmentId: String(assignmentId) },
      });
    } else {
      navigate('/teacher-page/grade');
    }
  };

  const questionsWithAnswers = useMemo(() => {
    if (!submission) return [];
    const questions = submission.writingQuestions ?? submission.questions ?? submission.writing_questions ?? [];
    const answers = submission.answers ?? submission.writingAnswers ?? submission.writing_answers ?? [];
    const assignmentTitle = assignment?.title ?? assignment?.name ?? 'Bài tập';
    if (Array.isArray(questions) && questions.length > 0) {
      return questions.map((q, i) => {
        const ans = answers[i] ?? answers.find((a) => (a.questionId ?? a.question_id) === (q.questionId ?? q.id ?? q.question_id));
        const answerText = ans?.studentAnswer ?? ans?.answer ?? ans?.answerText ?? ans?.answer_text ?? ans?.content ?? '—';
        return {
          order: i + 1,
          questionText: q.questionText ?? q.question_text ?? q.content ?? q.title ?? `Câu hỏi ${i + 1}`,
          answerText: answerText === '' ? '—' : answerText,
        };
      });
    }
    if (Array.isArray(answers) && answers.length > 0) {
      return answers.map((a, i) => {
        const answerText = a.studentAnswer ?? a.answer ?? a.answerText ?? a.answer_text ?? a.content ?? '—';
        return {
          order: i + 1,
          questionText: a.questionText ?? a.question_text ?? `Câu hỏi ${i + 1}`,
          answerText: answerText === '' ? '—' : answerText,
        };
      });
    }
    return [];
  }, [submission, assignment]);

  const singleContent = submission?.answer ?? submission?.content ?? submission?.answerText ?? submission?.comment ?? '';
  const attachments = submission?.attachments ?? submission?.files ?? submission?.attachedFiles ?? [];

  if (loading) {
    return (
      <div className="grading-detail-page">
        <div className="grading-detail-loading">
          <Spin size="large" tip="Đang tải bài nộp..." />
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="grading-detail-page">
        <Empty description="Không tìm thấy bài nộp." className="grading-detail-empty">
          <Button type="primary" onClick={() => navigate('/teacher-page/grade')}>
            Quay lại danh sách
          </Button>
        </Empty>
      </div>
    );
  }

  const studentName = submission.studentName ?? submission.student_name ?? submission.userName ?? submission.user_name ?? 'Học viên';
  const isGraded = submission.score != null;
  const initial = (studentName && studentName[0]) ? studentName[0].toUpperCase() : '?';
  const hasFeedback = submission.feedback != null && String(submission.feedback).trim() !== '';

  return (
    <div className="grading-detail-page">
      {/* Page header: Back, Avatar, Tên, Badge (không hiển thị id/email) */}
      <header className="submission-detail-header">
        <div className="submission-detail-header-left">
          <Button
            type="text"
            icon={<ArrowLeft size={22} />}
            onClick={backToList}
            className="submission-detail-back-btn"
            title="Quay lại danh sách"
          />
          <Avatar size={48} className="submission-detail-header-avatar">
            {initial}
          </Avatar>
          <div className="submission-detail-header-info">
            <span className="submission-detail-header-name">{studentName}</span>
          </div>
        </div>
        <div className="submission-detail-header-right">
          <span className={`submission-detail-status-badge ${isGraded ? 'submission-detail-status-graded' : 'submission-detail-status-pending'}`}>
            {isGraded ? 'ĐÃ CHẤM' : 'CHỜ CHẤM'}
          </span>
          <Button type="text" icon={<MoreVertical size={20} />} className="submission-detail-menu-btn" title="Tùy chọn" />
        </div>
      </header>

      {/* 2 cột: 70% bài làm | 30% panel chấm */}
      <div className="submission-detail-layout">
        <div className="submission-detail-left">
          <StudentAnswer
            content={questionsWithAnswers.length === 0 ? singleContent : null}
            questionsWithAnswers={questionsWithAnswers.length > 0 ? questionsWithAnswers : []}
          />
          <AttachmentList attachments={attachments} />
        </div>
        <div className="submission-detail-right">
          <GradingPanel
            maxScore={maxScore}
            score={score}
            onScoreChange={setScore}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onSaveScore={handleSaveScore}
            onSendFeedback={handleSendFeedback}
            onBack={backToList}
            scoreLoading={savingScoreLoading}
            feedbackLoading={sendingFeedbackLoading}
            scoreDisabled={isGraded}
            feedbackDisabled={hasFeedback}
          />
        </div>
      </div>
    </div>
  );
}

export default TeacherGradingDetail;
