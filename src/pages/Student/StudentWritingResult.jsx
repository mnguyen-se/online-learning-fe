import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { ArrowLeft, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { getWritingResult } from '../../api/assignmentApi';
import Header from '../../components/Header/header';
import Footer from '../../components/Footer/footer';
import './StudentWritingResult.css';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
};

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

/** Trả về mảng { index, questionText, studentAnswer, explanation } từ answers. */
const getQuestionsWithAnswers = (data) => {
  const answers = data?.answers ?? data?.writingAnswers ?? data?.writing_answers ?? [];
  if (!Array.isArray(answers) || answers.length === 0) return null;
  return answers.map((a, i) => ({
    index: i + 1,
    questionText: a.questionText ?? a.question_text ?? a.questionContent ?? a.question ?? '',
    studentAnswer: a.studentAnswer ?? a.student_answer ?? a.content ?? a.text ?? '',
    explanation: a.explanation ?? a.feedback ?? a.giaiThich ?? '',
  }));
};

const STORAGE_KEY_PREFIX = 'writingResult_back_';

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

export default function StudentWritingResult() {
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
    getWritingResult(assignmentId)
      .then((res) => {
        if (!cancelled) setData(res?.data ?? res);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = (err?.response?.data?.message ?? err?.response?.data?.error ?? '').toString();
        const isPendingGrade =
          /chưa được giáo viên chấm|chờ giáo viên chấm/i.test(msg);
        if (isPendingGrade) {
          setData({ score: null });
          setError(null);
        } else {
          setError(msg || 'Không thể tải kết quả.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [assignmentId]);

  const title =
    data?.assignmentTitle ??
    data?.assignment?.title ??
    data?.title ??
    data?.assignment?.name ??
    'Bài tập Writing';
  const submittedAt = data?.submittedAt ?? data?.submitted_at ?? data?.submissionDate;
  const isGraded = data?.score != null;
  const score = data?.score != null ? Number(data.score) : null;
  const maxScore =
    data?.maxScore ?? data?.max_score ?? data?.totalPoints ?? data?.assignment?.maxScore ?? 10;
  const feedback = data?.feedback ?? data?.teacherFeedback ?? data?.teacher_feedback ?? '';
  const questionsWithAnswers = getQuestionsWithAnswers(data);
  const scoreTheme = getScoreTheme(score, maxScore);
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
  const justSubmitted = searchParams.get('submitted') === '1';

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
    return (
      <div className="student-result-page">
        <Header />
        <main className="student-result-main">
          <div className="student-result-card student-result-card--error">
            <AlertCircle className="student-result-error-icon" size={40} />
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
                <div className="student-result-meta-card">
                  <span className="student-result-meta-card-label">NGÀY NỘP</span>
                  <span className="student-result-meta-card-value">{formatDateOnly(submittedAt)}</span>
                </div>
                <div className="student-result-meta-card">
                  <span className="student-result-meta-card-label">THỜI GIAN NỘP BÀI</span>
                  <span className="student-result-meta-card-value">{formatTimeOnly(submittedAt)}</span>
                </div>
              </div>
            )}
          </header>

          {!isGraded ? (
            <div className="student-result-card student-result-card--submitted">
              <p className="student-result-submitted-title">
                {justSubmitted ? 'Nộp bài thành công!' : 'Bạn đã nộp bài thành công.'}
              </p>
              <p className="student-result-submitted-desc">
                {justSubmitted
                  ? 'Bài của bạn đã được gửi và đang chờ giáo viên chấm điểm.'
                  : 'Bài của bạn đang chờ giáo viên chấm điểm.'}
              </p>
            </div>
          ) : (
            <div className="student-result-layout">
              <div className="student-result-left">
                <section className="student-result-card student-result-card--content">
                  <h2 className="student-result-section-title">Chi tiết bài làm</h2>
                  <div className="student-result-qa-list">
                    {questionsWithAnswers && questionsWithAnswers.length > 0 ? (
                      questionsWithAnswers.map((item) => (
                        <div key={item.index} className="student-result-qa-card">
                          <div className="student-result-qa-card-number">{item.index}</div>
                          <div className="student-result-qa-card-body">
                            <div className="student-result-qa-question">
                              <div className="student-result-qa-question-text">{item.questionText || '—'}</div>
                            </div>
                            <div className="student-result-qa-answer">
                              <span className="student-result-qa-label">ĐÁP ÁN CỦA BẠN</span>
                              <div className="student-result-qa-answer-text">{item.studentAnswer || '—'}</div>
                            </div>
                            {item.explanation ? (
                              <div className="student-result-qa-explanation">
                                <span className="student-result-qa-label">GIẢI THÍCH</span>
                                <div className="student-result-qa-explanation-text">{item.explanation}</div>
                              </div>
                            ) : null}
                          </div>
                          <div className="student-result-qa-correct">
                            <CheckCircle2 size={20} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="student-result-body">
                        {data?.content ?? data?.submissionContent ?? data?.submission_content ?? data?.text ?? '—'}
                      </div>
                    )}
                  </div>
                </section>
              </div>
              <div className="student-result-right">
                <section className={`student-result-card student-result-card--score student-result-score--${scoreTheme}`}>
                  <h2 className="student-result-score-title">KẾT QUẢ CUỐI CÙNG</h2>
                  <div className="student-result-score-inner">
                    <CheckCircle2 size={56} className="student-result-score-icon" />
                    <div className="student-result-score-value">
                      <span className="student-result-score-num">{score}</span>
                      <span className="student-result-score-sep">/</span>
                      <span className="student-result-score-max">{maxScore}</span>
                    </div>
                  </div>
                </section>
                <section className="student-result-card student-result-card--feedback">
                  <div className="student-result-feedback-header">
                    <MessageSquare size={22} className="student-result-feedback-icon" />
                    <h2 className="student-result-feedback-title">Nhận xét giáo viên</h2>
                  </div>
                  <div className="student-result-feedback-body">{feedback || 'Giáo viên chưa để lại nhận xét.'}</div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
