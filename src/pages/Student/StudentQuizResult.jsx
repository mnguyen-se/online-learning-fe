import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { ArrowLeft, Calendar, Clock, FileText, CheckCircle2, MessageSquare, Clock3 } from 'lucide-react';
import { getQuizResult } from '../../api/assignmentApi';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import './StudentWritingResult.css';
import './StudentQuizResult.css';

const formatDateOnly = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(value);
  }
};

const formatTimeOnly = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return String(value);
  }
};

const getScoreTheme = (score, maxScore) => {
  if (score == null || maxScore == null || maxScore <= 0) return 'neutral';
  const ratio = Number(score) / Number(maxScore);
  if (ratio > 7 / 10) return 'high';
  if (ratio >= 5 / 10) return 'medium';
  return 'low';
};

const getScoreMessage = (score, maxScore, theme) => {
  if (score == null || maxScore == null || maxScore <= 0) return null;
  if (theme === 'high') {
    const ratio = Number(score) / Number(maxScore);
    if (ratio >= 1) return 'Chúc mừng! Bạn đã đạt điểm tuyệt đối trong bài tập này.';
    return 'Chúc mừng! Bạn đã hoàn thành tốt bài tập này.';
  }
  if (theme === 'medium') return 'Bạn đã hoàn thành bài tập. Hãy xem nhận xét để cải thiện.';
  if (theme === 'low') return 'Hãy xem chi tiết và nhận xét để ôn tập thêm.';
  return null;
};

const STORAGE_KEY_PREFIX = 'quizResult_back_';

/** Lấy mảng câu hỏi/đáp án từ response API quiz-result (hỗ trợ details, questions, answers, ...). */
const extractQuizQuestions = (raw) => {
  if (!raw) return [];
  const root = raw.data && typeof raw.data === 'object' ? raw.data : raw;

  const list =
    root.details ??
    root.questions ??
    root.quizQuestions ??
    root.questionResults ??
    root.questionDetails ??
    root.items ??
    root.answers ??
    root.quizAnswers ??
    root.resultDetails ??
    root.answerDetails ??
    null;

  if (!Array.isArray(list)) return [];
  return list;
};

/** Với API trả details[].optionA-D, lấy nội dung đáp án theo chữ cái (A/B/C/D). */
const getOptionTextByLetter = (item, letter) => {
  if (!item || !letter) return '';
  const L = String(letter).trim().toUpperCase();
  if (L === 'A') return item.optionA ?? item.option_a ?? '';
  if (L === 'B') return item.optionB ?? item.option_b ?? '';
  if (L === 'C') return item.optionC ?? item.option_c ?? '';
  if (L === 'D') return item.optionD ?? item.option_d ?? '';
  return '';
};

function getStoredCourseLearn(assignmentId) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + assignmentId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.courseId || parsed.course_id)) {
      return {
        courseId: parsed.courseId ?? parsed.course_id,
        lessonId: parsed.lessonId ?? parsed.lesson_id,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function StudentQuizResult() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const courseIdFromState = location.state?.courseId;
  const lessonIdFromState = location.state?.lessonId;
  const courseIdFromQuery = searchParams.get('courseId');
  const lessonIdFromQuery = searchParams.get('lessonId');

  useEffect(() => {
    const cid = courseIdFromState ?? courseIdFromQuery;
    if (assignmentId && cid) {
      sessionStorage.setItem(
        STORAGE_KEY_PREFIX + assignmentId,
        JSON.stringify({
          courseId: cid,
          lessonId: lessonIdFromState ?? lessonIdFromQuery,
        }),
      );
    }
  }, [assignmentId, courseIdFromState, lessonIdFromState, courseIdFromQuery, lessonIdFromQuery]);

  useEffect(() => {
    if (!assignmentId) {
      setError('Thiếu mã bài tập.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    getQuizResult(assignmentId)
      .then((res) => {
        if (!cancelled) setData(res?.data ?? res);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = (err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? '').toString();
        setError(msg || 'Không thể tải kết quả bài Quiz.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [assignmentId]);

  const title =
    data?.assignmentTitle ?? data?.assignment?.title ?? data?.title ?? data?.assignment?.name ?? 'Bài tập Quiz';
  const submittedAt = data?.submittedAt ?? data?.submitted_at ?? data?.submissionDate ?? data?.gradedAt;
  const score = data?.score != null ? Number(data.score) : null;
  const maxScore =
    data?.maxScore ?? data?.max_score ?? data?.totalPoints ?? data?.assignment?.maxScore ?? 100;
  const feedback =
    data?.feedback ??
    data?.teacherFeedback ??
    data?.teacher_feedback ??
    (Array.isArray(data?.feedbacks) && data.feedbacks.length > 0 ? data.feedbacks[0] : '');
  const isGraded = score != null;
  const scoreTheme = getScoreTheme(score, maxScore);
  const scoreMessage = getScoreMessage(score, maxScore, scoreTheme);

  const questions = extractQuizQuestions(data);
  const fromState = courseIdFromState ?? courseIdFromQuery;
  const lessonIdBack = lessonIdFromState ?? lessonIdFromQuery;
  const fromStorage = !fromState && assignmentId ? getStoredCourseLearn(assignmentId) : null;
  const fromData = data?.courseId ?? data?.course_id;
  const backUrl = fromState
    ? `/course/${fromState}/learn${lessonIdBack ? `/${lessonIdBack}` : ''}`
    : fromStorage
      ? `/course/${fromStorage.courseId}/learn${fromStorage.lessonId ? `/${fromStorage.lessonId}` : ''}`
      : fromData
        ? `/course/${fromData}/learn`
        : '/my-courses';

  if (loading) {
    return (
      <div className="student-result-page">
        <Header />
        <main className="student-result-main">
          <div className="student-result-loading">
            <Spin size="large" />
            <span>Đang tải kết quả...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    const lower = error.toString().toLowerCase();
    const isPendingGradeError =
      lower.includes('chưa được giáo viên chấm') ||
      lower.includes('chờ giáo viên chấm') ||
      lower.includes('chua duoc giao vien cham') ||
      lower.includes('cho giao vien cham');

    if (isPendingGradeError) {
      return (
        <div className="student-result-page student-result-page--pending">
          <Header />
          <main className="student-result-main student-result-main--center">
            <div className="student-result-pending-card">
              <div className="student-result-pending-icon-wrap">
                <Clock3 size={56} className="student-result-pending-icon" />
              </div>
              <h2 className="student-result-pending-title">Chưa có kết quả bài làm</h2>
              <p className="student-result-pending-desc">
                Bài làm của bạn chưa được giáo viên chấm điểm. Vui lòng quay lại sau khi giáo viên hoàn thành việc chấm bài.
              </p>
              <button
                type="button"
                className="student-result-pending-back-btn"
                onClick={() => navigate(backUrl)}
              >
                <ArrowLeft size={18} />
                <span>Quay lại</span>
              </button>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    return (
      <div className="student-result-page">
        <Header />
        <main className="student-result-main">
          <div className="student-result-card student-result-card--error">
            <h2>Không tải được kết quả</h2>
            <p>{error}</p>
            <Button type="primary" icon={<ArrowLeft size={18} />} onClick={() => navigate(backUrl)}>
              Quay lại
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="student-result-page">
      <Header />
      <main className="student-result-main">
        <div className="student-result-container">
          <header className="student-result-header">
            <button
              type="button"
              className="student-result-back"
              onClick={() => navigate(backUrl)}
            >
              <ArrowLeft size={20} />
              <span>Quay lại danh sách bài tập</span>
            </button>
            <h1 className="student-result-title">{title}</h1>
            {submittedAt && (
              <div className="student-result-meta-cards">
                <div className="student-result-meta-card student-result-meta-card--icon">
                  <Calendar size={18} className="student-result-meta-card-icon" />
                  <span className="student-result-meta-card-label">NGÀY NỘP</span>
                  <span className="student-result-meta-card-value">{formatDateOnly(submittedAt)}</span>
                </div>
                <div className="student-result-meta-card student-result-meta-card--icon">
                  <Clock size={18} className="student-result-meta-card-icon" />
                  <span className="student-result-meta-card-label">THỜI GIAN NỘP BÀI</span>
                  <span className="student-result-meta-card-value">{formatTimeOnly(submittedAt)}</span>
                </div>
              </div>
            )}
          </header>

          <div className="student-result-layout">
            <div className="student-result-left">
              <section className="student-result-card student-result-card--content student-quiz-result-content">
                <h2 className="student-result-section-title student-result-section-title--with-icon">
                  <FileText size={20} className="student-result-section-title-icon" />
                  Chi tiết bài làm
                </h2>
                <div className="student-result-qa-list">
                  {questions.length > 0 ? (
                    questions.map((q, index) => {
                      const questionText = q.question ?? q.questionText ?? q.question_text ?? q.content ?? '—';
                      const studentLetter = String(q.studentAnswer ?? q.student_answer ?? q.selectedAnswer ?? '').trim().toUpperCase();
                      const correctLetter = String(q.correctAnswer ?? q.correct_answer ?? q.answer ?? '').trim().toUpperCase();
                      const studentAnswerText = getOptionTextByLetter(q, studentLetter) || studentLetter;
                      const correctAnswerText = getOptionTextByLetter(q, correctLetter) || correctLetter;
                      const explanation = q.explanation ?? q.feedback ?? q.giaiThich ?? '';
                      const isCorrect = q.isCorrect === true || q.isCorrect === false
                        ? q.isCorrect
                        : (correctLetter && studentLetter ? studentLetter === correctLetter : false);
                      const showExplanation = explanation || correctLetter;
                      return (
                        <div
                          key={q.answerId ?? q.questionId ?? q.id ?? index}
                          className={`student-result-qa-card ${isCorrect ? '' : 'student-result-qa-card--wrong'}`}
                        >
                          <div className="student-result-qa-card-number">{index + 1}</div>
                          <div className="student-result-qa-card-body">
                            <div className="student-result-qa-question">
                              <div className="student-result-qa-question-text">{questionText}</div>
                            </div>
                            <div className="student-result-qa-answer">
                              <span className="student-result-qa-label">ĐÁP ÁN CỦA BẠN</span>
                              <div className="student-result-qa-answer-text">
                                {studentLetter ? `${studentLetter}. ${studentAnswerText}`.trim() : '—'}
                              </div>
                            </div>
                            {showExplanation ? (
                              <div className="student-result-qa-explanation">
                                <span className="student-result-qa-label">
                                  {explanation ? 'GIẢI THÍCH' : 'ĐÁP ÁN ĐÚNG'}
                                </span>
                                <div className="student-result-qa-explanation-text">
                                  {explanation || (correctLetter ? `${correctLetter}. ${correctAnswerText}`.trim() : '')}
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div className="student-result-qa-correct">
                            {isCorrect ? <CheckCircle2 size={20} /> : <span className="student-result-qa-x">✕</span>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="student-result-body">
                      Không có chi tiết câu hỏi. Kết quả điểm và nhận xét hiển thị bên cạnh.
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div className="student-result-right">
              {isGraded && (
                <>
                  <section className={`student-result-card student-result-card--score student-result-score--${scoreTheme}`}>
                    <h2 className="student-result-score-title">KẾT QUẢ CUỐI CÙNG</h2>
                    <div className="student-result-score-inner">
                      <CheckCircle2 size={56} className="student-result-score-icon" />
                      <div className="student-result-score-value">
                        <span className="student-result-score-num">{score}</span>
                        <span className="student-result-score-sep">/</span>
                        <span className="student-result-score-max">{maxScore}</span>
                      </div>
                      {scoreMessage && (
                        <p className="student-result-score-message">{scoreMessage}</p>
                      )}
                    </div>
                  </section>
                  <section className="student-result-card student-result-card--feedback">
                    <div className="student-result-feedback-header">
                      <MessageSquare size={22} className="student-result-feedback-icon" />
                      <h2 className="student-result-feedback-title">Nhận xét giáo viên</h2>
                    </div>
                    <div className="student-result-feedback-body">{feedback || 'Giáo viên chưa để lại nhận xét.'}</div>
                  </section>
                </>
              )}
              {!isGraded && (
                <section className="student-result-card student-result-card--submitted">
                  <p className="student-result-submitted-title">Bài đã nộp</p>
                  <p className="student-result-submitted-desc">Đang chờ giáo viên chấm điểm.</p>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
