import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Avatar, Button, Spin, Empty } from 'antd';
import { ArrowLeft, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import {
  getQuizSubmission,
  getAssignmentById,
  getAssignmentQuestions,
  gradeQuizSubmission,
} from '../../api/assignmentApi';
import GradingPanel from './components/GradingPanel';
import './TeacherPages.css';
import './TeacherGrading.css';
import './TeacherGradingDetail.css';
import './components/SubmissionDetail.css';
import './TeacherQuizGradingDetail.css';

/**
 * Trang chấm điểm bài nộp Quiz.
 * Layout: Header (Back, avatar, tên học sinh, badge) + 2 cột (trái: câu hỏi & đáp án học sinh, phải: panel chấm điểm).
 */
function TeacherQuizGradingDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingScoreLoading, setPublishingScoreLoading] = useState(false);
  const [sendingFeedbackLoading, setSendingFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const maxScore =
    submission?.maxScore ??
    assignment?.maxScore ??
    assignment?.totalPoints ??
    assignment?.point ??
    10;

  useEffect(() => {
    if (!submissionId) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    const tStart = setTimeout(() => setLoading(true), 0);
    getQuizSubmission(submissionId)
      .then((data) => {
        const raw = data?.data ?? data?.quizSubmission ?? data?.submission ?? data;
        const answersFromApi =
          raw?.answers ??
          raw?.quizAnswers ??
          raw?.studentAnswers ??
          raw?.submissionAnswers ??
          raw?.details ??
          data?.answers ??
          data?.data?.answers ??
          data?.quizSubmission?.answers ??
          data?.submission?.answers ??
          [];
        const submissionNormalized = {
          ...raw,
          answers: Array.isArray(answersFromApi) ? answersFromApi : [],
        };
        setSubmission(submissionNormalized);
        setFeedback(raw?.feedback ?? '');
        const aid =
          raw?.assignmentId ?? raw?.assignment_id ?? raw?.assignment?.assignmentId ?? raw?.assignment?.id;
        if (!aid) return;
        return Promise.all([
          getAssignmentById(aid).then((res) => {
            const a = res?.data ?? res;
            setAssignment(a);
          }),
          getAssignmentQuestions(aid).then((res) => {
            const list = res?.data ?? res;
            const arr = Array.isArray(list) ? list : [];
            setQuestions(arr.map((q) => ({
              ...q,
              correctAnswer: q?.correctAnswer ?? q?.correct_answer ?? '',
              options: q.answers ?? q.options ?? [],
            })));
          }),
        ]);
      })
      .catch(() => {
        toast.error('Không tải được bài nộp quiz.');
        setSubmission(null);
        setQuestions([]);
      })
      .finally(() => setLoading(false));
    return () => clearTimeout(tStart);
  }, [submissionId]);

  /** Quiz: chỉ gửi nhận xét (giữ nguyên điểm nếu đã có) */
  const handleSendFeedback = () => {
    setSendingFeedbackLoading(true);
    const currentScore = submission?.score ?? displayScore;
    gradeQuizSubmission(submissionId, {
      score: currentScore != null ? currentScore : 0,
      feedback: feedback.trim() || null,
      answerGrades: [],
    })
      .then(() => {
        toast.success('Đã gửi nhận xét.');
        setSubmission((prev) => (prev ? { ...prev, feedback: feedback.trim() || null } : null));
      })
      .catch(() => toast.error('Không thể gửi nhận xét. Vui lòng thử lại.'))
      .finally(() => setSendingFeedbackLoading(false));
  };

  /** Quiz: công bố điểm cho học sinh xem — BE tự chấm (score = null → BE tính từ đáp án) */
  const handlePublishScore = () => {
    setPublishingScoreLoading(true);
    gradeQuizSubmission(submissionId, {
      score: null,
      feedback: feedback.trim() || null,
      answerGrades: [],
    })
      .then((data) => {
        const newScore = data?.data?.score ?? data?.score ?? data?.quizResult?.score;
        toast.success('Đã mở điểm cho học sinh xem.');
        setSubmission((prev) =>
          prev
            ? {
                ...prev,
                score: newScore != null ? newScore : prev.score,
                feedback: feedback.trim() || null,
                status: 'GRADED',
              }
            : null
        );
      })
      .catch(() => toast.error('Không thể công bố điểm. Vui lòng thử lại.'))
      .finally(() => setPublishingScoreLoading(false));
  };

  const backToList = () => {
    const courseId =
      location.state?.courseId ?? submission?.courseId ?? submission?.course_id;
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

  if (loading) {
    return (
      <div className="grading-detail-page">
        <div className="grading-detail-loading">
          <Spin size="large" tip="Đang tải bài nộp quiz..." />
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

  const studentName =
    submission.studentName ??
    submission.student_name ??
    submission.userName ??
    submission.user_name ??
    'Học viên';
  const isGraded = submission.score != null;
  const initial = studentName && studentName[0] ? studentName[0].toUpperCase() : '?';
  const hasFeedback = submission.feedback != null && String(submission.feedback).trim() !== '';
  /** Đáp án học sinh từ API GET /assignments/quiz-submissions/{submissionId} */
  const answersArray = Array.isArray(submission?.answers)
    ? submission.answers
    : submission?.quizAnswers ??
      submission?.studentAnswers ??
      submission?.submissionAnswers ??
      submission?.quizSubmission?.answers ??
      submission?.submission?.answers ??
      [];
  const studentAnswersRaw = Array.isArray(answersArray) ? answersArray : [];
  const getStudentAnswerValue = (a) => {
    if (a == null) return '';
    if (typeof a === 'string') return a.trim();
    const v =
      a?.studentAnswer ??
      a?.answer ??
      a?.selectedAnswer ??
      a?.answerLetter ??
      a?.choice ??
      a?.option ??
      a?.value ??
      a?.content ??
      a?.text ??
      '';
    return typeof v === 'string' ? v.trim() : String(v ?? '');
  };
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  /** Chuẩn hóa đáp án trắc nghiệm về một chữ cái A-D để so sánh. Hỗ trợ: "B", "B. ăn", 1 (index), "ăn" (nội dung option). */
  const normalizeAnswerLetter = (val, options = []) => {
    if (val == null && val !== 0) return '';
    const s = String(val).trim();
    const sUpper = s.toUpperCase();
    if (/^[A-F]$/.test(sUpper)) return sUpper;
    const matchFirst = sUpper.match(/^([A-F])[.\s]/);
    if (matchFirst) return matchFirst[1];
    if (/^[A-F]/.test(sUpper)) return sUpper[0];
    const num = Number(val);
    if (Number.isInteger(num) && num >= 0 && num < letters.length) return letters[num];
    if (Number.isInteger(num) && num >= 1 && num <= letters.length) return letters[num - 1];
    if (/^[0-9]+$/.test(s.trim())) {
      const idx = parseInt(s, 10);
      if (idx >= 0 && idx < letters.length) return letters[idx];
      if (idx >= 1 && idx <= letters.length) return letters[idx - 1];
    }
    if (Array.isArray(options) && options.length > 0 && s !== '') {
      const optText = (o) => (typeof o === 'string' ? o : o?.text ?? o?.answer ?? '').trim().toLowerCase();
      const valLower = s.toLowerCase();
      const idx = options.findIndex((o) => optText(o) === valLower || optText(o).includes(valLower) || valLower.includes(optText(o)));
      if (idx >= 0 && idx < letters.length) return letters[idx];
    }
    return '';
  };
  /** Tạo mảng options từ API trả optionA, optionB, optionC, optionD */
  const getOptionsFromItem = (a) => {
    if (!a) return [];
    if (Array.isArray(a.options)) return a.options;
    if (Array.isArray(a.answers)) return a.answers;
    const opts = [
      a.optionA ?? a.option_a,
      a.optionB ?? a.option_b,
      a.optionC ?? a.option_c,
      a.optionD ?? a.option_d,
    ].filter((x) => x != null && x !== '');
    return opts.length > 0 ? opts : [];
  };
  const studentAnswerByQuestionId = studentAnswersRaw.reduce((acc, a, idx) => {
    const qid = a?.questionId ?? a?.question_id ?? a?.id ?? idx;
    const val = getStudentAnswerValue(a);
    acc[String(qid)] = val;
    acc[Number(qid)] = val;
    acc[idx] = val;
    return acc;
  }, {});
  const answersObject =
    submission?.answers && !Array.isArray(submission.answers) && typeof submission.answers === 'object'
      ? submission.answers
      : null;
  /** API trả answers[] có questionText, optionA-D, studentAnswer, correctAnswer → dùng trực tiếp làm nguồn hiển thị */
  const useSubmissionAnswersDirectly =
    studentAnswersRaw.length > 0 &&
    (studentAnswersRaw[0].questionText != null || studentAnswersRaw[0].question_text != null) &&
    (studentAnswersRaw[0].studentAnswer != null || studentAnswersRaw[0].optionA != null);
  const answersToShow = useSubmissionAnswersDirectly
    ? studentAnswersRaw.map((a, index) => {
        const opts = getOptionsFromItem(a);
        const studentAnswer = getStudentAnswerValue(a);
        const correctAnswer = a.correctAnswer ?? a.correct_answer ?? '';
        const studentLetter = normalizeAnswerLetter(studentAnswer, opts);
        const correctLetter = normalizeAnswerLetter(correctAnswer, opts);
        const isCorrect =
          a.isCorrect != null ? a.isCorrect : (correctLetter && studentLetter ? studentLetter === correctLetter : null);
        return {
          ...a,
          questionId: a.questionId ?? a.question_id ?? a.id ?? index,
          questionText: a.questionText ?? a.question_text ?? a.question ?? `Câu hỏi ${index + 1}`,
          options: opts,
          studentAnswer: studentLetter || studentAnswer,
          correctAnswer: correctLetter || correctAnswer,
          isCorrect,
          answerId: a.answerId ?? a.id ?? index,
        };
      })
    : questions.length > 0
      ? questions.map((q, index) => {
          const qid = q.questionId ?? q.id ?? index;
          const byIndex = getStudentAnswerValue(studentAnswersRaw[index]);
          const byId =
            studentAnswerByQuestionId[String(qid)] ??
            studentAnswerByQuestionId[Number(qid)] ??
            studentAnswerByQuestionId[index] ??
            '';
          const byObj = answersObject ? (answersObject[String(qid)] ?? answersObject[Number(qid)] ?? answersObject[index]) : '';
          const studentAnswer = byIndex || byId || byObj;
          const opts = q.answers ?? q.options ?? getOptionsFromItem(studentAnswersRaw[index]) ?? [];
          const correctAnswer = q.correctAnswer ?? q.correct_answer ?? (studentAnswersRaw[index]?.correctAnswer ?? studentAnswersRaw[index]?.correct_answer ?? '');
          const studentLetter = normalizeAnswerLetter(studentAnswer, opts);
          const correctLetter = normalizeAnswerLetter(correctAnswer, opts);
          return {
            ...q,
            questionId: qid,
            questionText: q.question ?? q.questionText ?? q.question_text ?? `Câu hỏi ${index + 1}`,
            options: opts,
            studentAnswer: studentLetter || studentAnswer,
            correctAnswer: correctLetter || correctAnswer,
            isCorrect: (correctLetter && studentLetter) ? studentLetter === correctLetter : null,
            answerId: q.id ?? qid,
          };
        })
      : studentAnswersRaw.length > 0
        ? studentAnswersRaw.map((a, index) => {
            const opts = getOptionsFromItem(a);
            const rawStudent = getStudentAnswerValue(a);
            const rawCorrect = a.correctAnswer ?? a.correct_answer ?? '';
            const studentLetter = normalizeAnswerLetter(rawStudent, opts);
            const correctLetter = normalizeAnswerLetter(rawCorrect, opts);
            return {
              ...a,
              questionText: a.questionText ?? a.question_text ?? a.question ?? `Câu hỏi ${index + 1}`,
              options: opts,
              studentAnswer: studentLetter || rawStudent,
              correctAnswer: correctLetter || rawCorrect,
              isCorrect: a.isCorrect ?? ((correctLetter && studentLetter) ? studentLetter === correctLetter : null),
              answerId: a.answerId ?? a.id ?? index,
            };
          })
        : [];

  const correctCount = answersToShow.filter((a) => a.isCorrect === true).length;
  const wrongCount = answersToShow.filter((a) => a.isCorrect === false).length;
  const totalCount = answersToShow.length;

  const withIndex = answersToShow.map((item, i) => ({ ...item, originalIndex: i }));
  const sortedAnswers = withIndex;

  const filteredByTab =
    activeTab === 'correct'
      ? sortedAnswers.filter((a) => a.isCorrect === true)
      : activeTab === 'wrong'
        ? sortedAnswers.filter((a) => a.isCorrect === false)
        : sortedAnswers;

  /** Điểm quiz: từ BE sau khi chấm, hoặc tính từ đáp án (trùng logic BE) */
  const displayScore =
    submission?.score ??
    answersToShow.reduce((sum, it, idx) => {
      const p = it.points ?? submission?.answers?.[idx]?.points ?? 5;
      return sum + (it.isCorrect ? p : 0);
    }, 0);

  return (
    <div className="grading-detail-page grading-detail-page--quiz">
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
            <span className="submission-detail-header-meta">Bài làm trắc nghiệm</span>
          </div>
        </div>
        <div className="submission-detail-header-right">
          <span
            className={`submission-detail-status-badge ${
              isGraded ? 'submission-detail-status-graded' : 'submission-detail-status-pending'
            }`}
          >
            {isGraded ? 'ĐÃ CHẤM' : 'CHỜ CHẤM'}
          </span>
          <Button
            type="text"
            icon={<MoreVertical size={20} />}
            className="submission-detail-menu-btn"
            title="Tùy chọn"
          />
        </div>
      </header>

      <div className="submission-detail-layout">
        <div className="submission-detail-left">
          {totalCount > 0 && (
            <div className="quiz-grading-tabs-wrap">
              <div className="quiz-grading-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'all'}
                  className={`quiz-grading-tab quiz-grading-tab--all ${activeTab === 'all' ? 'quiz-grading-tab--active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  Tất cả: <strong>{totalCount}</strong> câu
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'correct'}
                  className={`quiz-grading-tab quiz-grading-tab--correct ${activeTab === 'correct' ? 'quiz-grading-tab--active' : ''}`}
                  onClick={() => setActiveTab('correct')}
                >
                  <CheckCircle2 size={18} />
                  Đúng: <strong>{correctCount}</strong>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'wrong'}
                  className={`quiz-grading-tab quiz-grading-tab--wrong ${activeTab === 'wrong' ? 'quiz-grading-tab--active' : ''}`}
                  onClick={() => setActiveTab('wrong')}
                >
                  <XCircle size={18} />
                  Sai: <strong>{wrongCount}</strong>
                </button>
              </div>
            </div>
          )}
          <div className="quiz-grading-content">
            <h2 className="quiz-grading-section-title">Chi tiết bài làm trắc nghiệm</h2>
            {filteredByTab.length === 0 ? (
              <div className="quiz-grading-empty">
                {activeTab === 'correct'
                  ? 'Không có câu nào đúng.'
                  : activeTab === 'wrong'
                    ? 'Không có câu nào sai.'
                    : 'Chưa có dữ liệu câu hỏi/đáp án. Đang tải đáp án học sinh từ API.'}
              </div>
            ) : (
              <div className="quiz-grading-list">
                {filteredByTab.map((item, index) => {
                  const questionNum = (item.originalIndex ?? index) + 1;
                  const questionText = item.questionText ?? `Câu hỏi ${questionNum}`;
                  const options = item.options ?? [];
                  const studentAnswer = item.studentAnswer ?? '';
                  const correctAnswer = item.correctAnswer ?? '';
                  const isCorrect = item.isCorrect;
                  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                  return (
                    <div key={item.answerId ?? index} className="quiz-grading-item">
                      <div className="quiz-grading-item-header">
                        <span className="quiz-grading-item-num">Câu {questionNum}</span>
                        <span
                          className={`quiz-grading-item-badge ${
                            isCorrect === true
                              ? 'quiz-grading-item-badge--correct'
                              : isCorrect === false
                                ? 'quiz-grading-item-badge--wrong'
                                : 'quiz-grading-item-badge--pending'
                          }`}
                        >
                          {isCorrect === true && <><CheckCircle2 size={16} /> Đúng</>}
                          {isCorrect === false && <><XCircle size={16} /> Sai</>}
                          {(isCorrect !== true && isCorrect !== false) && 'Chưa chấm'}
                        </span>
                      </div>
                      <div className="quiz-grading-item-question">{questionText}</div>
                      <div className="quiz-grading-item-options">
                        {Array.isArray(options) && options.length > 0 ? (
                          <>
                            {options.map((opt, i) => {
                              const letter = letters[i] ?? String(i + 1);
                              const optText = typeof opt === 'string' ? opt : opt?.text ?? opt?.answer ?? '—';
                              const isStudent = String(studentAnswer).toUpperCase() === letter;
                              const isCorrectOpt = correctAnswer && String(correctAnswer).toUpperCase() === letter;
                              const studentCorrect = isStudent && isCorrect;
                              const studentWrong = isStudent && !isCorrect;
                              return (
                                <div
                                  key={letter}
                                  className={`quiz-grading-option ${
                                    studentCorrect ? 'quiz-grading-option--student-correct' : ''
                                  } ${studentWrong ? 'quiz-grading-option--student' : ''} ${
                                    isCorrectOpt && !isStudent ? 'quiz-grading-option--correct' : ''
                                  }`}
                                >
                                  <span className="quiz-grading-option-letter">{letter}.</span>
                                  <span className="quiz-grading-option-text">{optText}</span>
                                  {isStudent && (
                                    <span className="quiz-grading-option-tag">Đáp án của HS</span>
                                  )}
                                  {isCorrectOpt && !isStudent && (
                                    <span className="quiz-grading-option-tag quiz-grading-option-tag--correct">
                                      Đáp án đúng
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="submission-detail-right">
          <GradingPanel
            maxScore={maxScore}
            score={isGraded ? String(submission?.score ?? '') : ''}
            onScoreChange={() => {}}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onSaveScore={() => {}}
            onSendFeedback={handleSendFeedback}
            onBack={backToList}
            scoreLoading={publishingScoreLoading}
            feedbackLoading={sendingFeedbackLoading}
            scoreDisabled={isGraded}
            feedbackDisabled={hasFeedback}
            isQuiz
            displayScore={displayScore}
            onPublishScore={isGraded ? undefined : handlePublishScore}
          />
        </div>
      </div>
    </div>
  );
}

export default TeacherQuizGradingDetail;
