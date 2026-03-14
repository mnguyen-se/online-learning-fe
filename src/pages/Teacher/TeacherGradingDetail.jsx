import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Avatar, Button, Spin, Empty } from 'antd';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { getWritingSubmission, getAssignmentById, gradeWritingSubmission, getWritingQuestionsForTeacher } from '../../api/assignmentApi';
import StudentAnswer from './components/StudentAnswer';
import AttachmentList from './components/AttachmentList';
import GradingPanel from './components/GradingPanel';
import './TeacherPages.css';
import './TeacherGrading.css';
import './TeacherGradingDetail.css';
import './components/SubmissionDetail.css';

// buildAnswerGrades sẽ được định nghĩa bên trong component để dùng answerGrades state

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
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingScoreLoading, setSavingScoreLoading] = useState(false);
  const [sendingFeedbackLoading, setSendingFeedbackLoading] = useState(false);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [answerGrades, setAnswerGrades] = useState({}); // State để lưu isCorrect và pointsEarned đã sửa

  const maxScore = submission?.maxScore ?? assignment?.maxScore ?? assignment?.totalPoints ?? assignment?.point ?? 10;

  // Handler để update isCorrect/pointsEarned cho một answer
  const handleUpdateAnswerGrade = useCallback((answerId, updates) => {
    setAnswerGrades((prev) => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        ...updates,
      },
    }));
  }, []);

  // Trả về mảng answerGrades cho API grade (dùng giá trị đã sửa nếu có)
  const buildAnswerGrades = useCallback(() => {
    const answers = submission?.answers ?? submission?.writingAnswers ?? [];
    if (!Array.isArray(answers) || answers.length === 0) return [];
    return answers.map((a) => {
      const answerId = a.answerId ?? a.id;
      const edited = answerGrades[answerId];
      return {
        answerId,
        pointsEarned: edited?.pointsEarned !== undefined ? edited.pointsEarned : (a.pointsEarned ?? a.points ?? 0),
        isCorrect: edited?.isCorrect !== undefined ? edited.isCorrect : (a.isCorrect ?? false),
      };
    });
  }, [submission, answerGrades]);

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setAnswerGrades({}); // Reset answerGrades khi load submission mới
    getWritingSubmission(submissionId)
      .then((res) => {
        const data = res?.data ?? res;
        setSubmission(data);
        setScore(data?.score != null ? String(data.score) : '');
        setFeedback(data?.feedback ?? '');
        const aid = data?.assignmentId ?? data?.assignment_id ?? data?.assignment?.assignmentId ?? data?.assignment?.id;
        if (aid) {
          return Promise.all([
            getAssignmentById(aid).then((a) => {
              const assignmentData = a?.data ?? a;
              setAssignment(assignmentData);
            }),
            getWritingQuestionsForTeacher(aid)
              .then((qRes) => {
                const questionsData = Array.isArray(qRes) ? qRes : (qRes?.data ?? []);
                setQuestions(questionsData);
              })
              .catch((err) => {
                console.warn('Không tải được chi tiết câu hỏi:', err);
                setQuestions([]);
              }),
          ]);
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
    const grades = buildAnswerGrades();
    gradeWritingSubmission(submissionId, {
      score: numScore,
      feedback: feedback.trim() || null,
      answerGrades: grades,
    })
      .then(() => {
        toast.success('Đã lưu điểm.');
        // Reload submission để đồng bộ dữ liệu từ backend
        return getWritingSubmission(submissionId).then((res) => {
          const data = res?.data ?? res;
          setSubmission(data);
          setScore(data?.score != null ? String(data.score) : '');
          setFeedback(data?.feedback ?? '');
          setAnswerGrades({}); // Reset sau khi lưu thành công
        });
      })
      .catch(() => toast.error('Không thể lưu điểm. Vui lòng thử lại.'))
      .finally(() => setSavingScoreLoading(false));
  };

  const handleSendFeedback = () => {
    const numScore = score === '' ? null : Number(score);
    if (numScore != null && (Number.isNaN(numScore) || numScore < 0 || numScore > maxScore)) {
      toast.warning(`Điểm số hợp lệ từ 0 đến ${maxScore}.`);
      return;
    }
    setSendingFeedbackLoading(true);
    const grades = buildAnswerGrades();
    gradeWritingSubmission(submissionId, {
      score: numScore != null ? numScore : (submission?.score ?? 0),
      feedback: feedback.trim() || null,
      answerGrades: grades,
    })
      .then(() => {
        toast.success('Đã lưu điểm và gửi nhận xét.');
        // Reload submission để đồng bộ dữ liệu từ backend
        return getWritingSubmission(submissionId).then((res) => {
          const data = res?.data ?? res;
          setSubmission(data);
          setScore(data?.score != null ? String(data.score) : '');
          setFeedback(data?.feedback ?? '');
          setAnswerGrades({}); // Reset sau khi gửi thành công
        });
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
    const submissionQuestions = submission.writingQuestions ?? submission.questions ?? submission.writing_questions ?? [];
    const answers = submission.answers ?? submission.writingAnswers ?? submission.writing_answers ?? [];
    
    // Nếu có answers từ API với đầy đủ thông tin (từ /api/v1/assignments/writing-submissions/{id})
    if (Array.isArray(answers) && answers.length > 0 && answers[0]?.questionType) {
      return answers.map((ans, i) => {
        const questionId = ans.questionId ?? ans.question_id ?? i + 1;
        const answerId = ans.answerId ?? ans.id;
        // Tìm question detail từ questions array (từ API writing-questions)
        const questionDetail = questions.find(
          (q) => (q.questionId ?? q.id ?? q.question_id) === questionId
        );
        
        // Lấy giá trị đã sửa từ answerGrades hoặc giá trị gốc
        const editedGrade = answerId ? answerGrades[answerId] : null;
        
        const questionText = ans.questionText ?? ans.question_text ?? questionDetail?.questionText ?? questionDetail?.question_text ?? `Câu hỏi ${i + 1}`;
        const studentAnswer = ans.studentAnswer ?? ans.answer ?? ans.answerText ?? ans.answer_text ?? ans.content ?? '';
        const questionType = ans.questionType ?? ans.question_type ?? questionDetail?.questionType ?? questionDetail?.question_type ?? 'FILL_BLANK';
        const sampleAnswer = ans.sampleAnswer ?? ans.sample_answer ?? ans.correctAnswer ?? ans.correct_answer ?? questionDetail?.sampleAnswer ?? questionDetail?.sample_answer ?? null;
        const points = ans.points ?? ans.point ?? questionDetail?.points ?? questionDetail?.point ?? 1;
        const pointsEarned = editedGrade?.pointsEarned !== undefined ? editedGrade.pointsEarned : (ans.pointsEarned ?? ans.points_earned ?? null);
        const isCorrect = editedGrade?.isCorrect !== undefined ? editedGrade.isCorrect : (ans.isCorrect ?? ans.is_correct ?? null);
        
        return {
          order: i + 1,
          questionId,
          questionText,
          questionType: questionType.toUpperCase(),
          studentAnswer: studentAnswer === '' ? '—' : studentAnswer,
          sampleAnswer,
          points,
          pointsEarned,
          isCorrect,
          answerId,
          // Thêm question details để hiển thị text
          items: questionDetail?.items ?? [],
          columnA: questionDetail?.columnA ?? [],
          columnB: questionDetail?.columnB ?? [],
        };
      });
    }
    
    // Fallback: Nếu có questions array riêng
    if (Array.isArray(submissionQuestions) && submissionQuestions.length > 0) {
      return submissionQuestions.map((q, i) => {
        const ans = answers[i] ?? answers.find((a) => (a.questionId ?? a.question_id) === (q.questionId ?? q.id ?? q.question_id));
        const questionId = q.questionId ?? q.id ?? i + 1;
        const answerId = ans?.answerId ?? ans?.id;
        const questionDetail = questions.find(
          (qDetail) => (qDetail.questionId ?? qDetail.id ?? qDetail.question_id) === questionId
        );
        
        // Lấy giá trị đã sửa từ answerGrades hoặc giá trị gốc
        const editedGrade = answerId ? answerGrades[answerId] : null;
        
        const answerText = ans?.studentAnswer ?? ans?.answer ?? ans?.answerText ?? ans?.answer_text ?? ans?.content ?? '—';
        const questionType = q.questionType ?? q.question_type ?? ans?.questionType ?? ans?.question_type ?? 'FILL_BLANK';
        const sampleAnswer = q.sampleAnswer ?? q.sample_answer ?? ans?.sampleAnswer ?? ans?.sample_answer ?? questionDetail?.sampleAnswer ?? questionDetail?.sample_answer ?? null;
        const points = q.points ?? q.point ?? ans?.points ?? ans?.point ?? questionDetail?.points ?? questionDetail?.point ?? 1;
        const pointsEarned = editedGrade?.pointsEarned !== undefined ? editedGrade.pointsEarned : (ans?.pointsEarned ?? ans?.points_earned ?? null);
        const isCorrect = editedGrade?.isCorrect !== undefined ? editedGrade.isCorrect : (ans?.isCorrect ?? ans?.is_correct ?? null);
        
        return {
          order: i + 1,
          questionId,
          questionText: q.questionText ?? q.question_text ?? q.content ?? q.title ?? `Câu hỏi ${i + 1}`,
          questionType: questionType.toUpperCase(),
          studentAnswer: answerText === '' ? '—' : answerText,
          sampleAnswer,
          points,
          pointsEarned,
          isCorrect,
          answerId,
          items: questionDetail?.items ?? q.items ?? [],
          columnA: questionDetail?.columnA ?? q.columnA ?? [],
          columnB: questionDetail?.columnB ?? q.columnB ?? [],
        };
      });
    }
    
    // Fallback: Chỉ có answers
    if (Array.isArray(answers) && answers.length > 0) {
      return answers.map((a, i) => {
        const questionId = a.questionId ?? a.question_id ?? i + 1;
        const answerId = a.answerId ?? a.id;
        const questionDetail = questions.find(
          (q) => (q.questionId ?? q.id ?? q.question_id) === questionId
        );
        
        // Lấy giá trị đã sửa từ answerGrades hoặc giá trị gốc
        const editedGrade = answerId ? answerGrades[answerId] : null;
        
        const answerText = a.studentAnswer ?? a.answer ?? a.answerText ?? a.answer_text ?? a.content ?? '—';
        const questionType = a.questionType ?? a.question_type ?? 'FILL_BLANK';
        const sampleAnswer = a.sampleAnswer ?? a.sample_answer ?? questionDetail?.sampleAnswer ?? questionDetail?.sample_answer ?? null;
        const points = a.points ?? a.point ?? questionDetail?.points ?? questionDetail?.point ?? 1;
        const pointsEarned = editedGrade?.pointsEarned !== undefined ? editedGrade.pointsEarned : (a.pointsEarned ?? a.points_earned ?? null);
        const isCorrect = editedGrade?.isCorrect !== undefined ? editedGrade.isCorrect : (a.isCorrect ?? a.is_correct ?? null);
        
        return {
          order: i + 1,
          questionId,
          questionText: a.questionText ?? a.question_text ?? questionDetail?.questionText ?? questionDetail?.question_text ?? `Câu hỏi ${i + 1}`,
          questionType: questionType.toUpperCase(),
          studentAnswer: answerText === '' ? '—' : answerText,
          sampleAnswer,
          points,
          pointsEarned,
          isCorrect,
          answerId,
          items: questionDetail?.items ?? [],
          columnA: questionDetail?.columnA ?? [],
          columnB: questionDetail?.columnB ?? [],
        };
      });
    }
    return [];
  }, [submission, assignment, questions, answerGrades]);

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
            onUpdateAnswerGrade={handleUpdateAnswerGrade}
            answerGrades={answerGrades}
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
