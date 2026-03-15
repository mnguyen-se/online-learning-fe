import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { ArrowLeft, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { getWritingResult, getWritingQuestions } from '../../api/assignmentApi';
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

/** Trả về mảng chứa thông tin để hiển thị */
const getQuestionsWithAnswers = (data, questionsList = []) => {
  const answers = data?.answers ?? data?.writingAnswers ?? data?.writing_answers ?? [];
  if (!Array.isArray(answers) || answers.length === 0) return null;
  
  return answers.map((a, i) => {
    const type = a.questionType ?? a.question_type ?? 'FILL_BLANK';
    
    // Tìm câu hỏi tương ứng gốc để lấy items, columnA, columnB
    let qDetail = null;
    if (questionsList && questionsList.length > 0) {
      qDetail = questionsList.find(q => 
        q.questionId === a.questionId || 
        q.id === a.questionId
      ) || questionsList[i]; // fallback to index if no ID match
    }

    return {
      index: i + 1,
      questionText: a.questionText ?? a.question_text ?? a.questionContent ?? a.question ?? '',
      studentAnswer: a.studentAnswer ?? a.student_answer ?? a.content ?? a.text ?? '',
      explanation: a.explanation ?? a.feedback ?? a.giaiThich ?? '',
      questionType: type.toUpperCase(),
      items: qDetail?.items ?? a.items ?? [],
      columnA: qDetail?.columnA ?? a.columnA ?? a.column_a ?? [],
      columnB: qDetail?.columnB ?? a.columnB ?? a.column_b ?? [],
      sampleAnswer: a.sampleAnswer ?? a.sample_answer ?? null,
    };
  });
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
    
    Promise.all([
      getWritingResult(assignmentId).catch(err => {
        const msg = (err?.response?.data?.message ?? err?.response?.data?.error ?? '').toString();
        const isPendingGrade = /chưa được giáo viên chấm|chờ giáo viên chấm/i.test(msg);
        if (isPendingGrade) return { pending: true };
        throw err;
      }),
      getWritingQuestions(assignmentId).catch(() => []) // Fallback to empty if questions fail
    ])
      .then(([resResult, resQuestions]) => {
        if (cancelled) return;
        
        if (resResult?.pending) {
          setData({ score: null });
          setError(null);
        } else {
          const resultData = resResult?.data ?? resResult;
          const questionsList = resQuestions?.data ?? resQuestions ?? [];
          
          // Attach questions list to data object so getQuestionsWithAnswers can use it later
          if (resultData && typeof resultData === 'object') {
            resultData._questionsList = questionsList;
          }
          setData(resultData);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = (err?.response?.data?.message ?? err?.response?.data?.error ?? '').toString();
        setError(msg || 'Không thể tải kết quả.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
  const questionsWithAnswers = getQuestionsWithAnswers(data, data?._questionsList);
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
                              <div className="student-result-qa-answer-wrapper" style={{ marginTop: '8px' }}>
                                <AnswerDisplay 
                                  type={item.questionType}
                                  studentAnswer={item.studentAnswer}
                                  sampleAnswer={item.sampleAnswer}
                                  questionText={item.questionText}
                                  items={item.items}
                                  columnA={item.columnA}
                                  columnB={item.columnB}
                                />
                              </div>
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

/**
 * Component hiển thị câu trả lời theo từng loại (Dành cho Học sinh xem)
 */
function AnswerDisplay({ type, studentAnswer, sampleAnswer, questionText, items, columnA, columnB }) {
  if (!studentAnswer || studentAnswer === '—') {
    return <div className="student-result-qa-answer-text">Chưa có câu trả lời</div>;
  }

  switch (type) {
    case 'FILL_BLANK':
      return <FillBlankAnswer answer={studentAnswer} questionText={questionText} />;

    case 'REORDER':
      return <ReorderAnswer answer={studentAnswer} items={items} />;

    case 'MATCHING':
      return <MatchingAnswer answer={studentAnswer} columnA={columnA} columnB={columnB} />;

    case 'ESSAY_WRITING':
      return <div className="student-result-qa-answer-text">{studentAnswer}</div>;

    default:
      return <div className="student-result-qa-answer-text">{studentAnswer}</div>;
  }
}

function FillBlankAnswer({ answer, questionText }) {
  if (questionText && questionText.includes('（') && questionText.includes('）')) {
    const parts = questionText.split('（');
    if (parts.length > 1) {
      const [before, after] = parts;
      const afterParts = after.split('）');
      return (
        <div className="student-result-qa-answer-text" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
          {before}
          <span style={{ fontWeight: '600', color: '#16a34a', textDecoration: 'underline', padding: '0 4px' }}>
            {answer || '______'}
          </span>
          {afterParts[1] || ''}
        </div>
      );
    }
  }
  return <div className="student-result-qa-answer-text">{answer}</div>;
}

function ReorderAnswer({ answer, items = [] }) {
  let orderedIds = [];
  try {
    if (answer.startsWith('[') && answer.endsWith(']')) {
      orderedIds = JSON.parse(answer);
    } else {
      orderedIds = answer.split(',').map((item) => item.trim()).filter(Boolean);
    }
  } catch {
    return <div className="student-result-qa-answer-text">{answer}</div>;
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return <div className="student-result-qa-answer-text">Chưa có câu trả lời</div>;
  }

  const getItemText = (id) => {
    if (!Array.isArray(items) || items.length === 0) {
      return typeof id === 'string' && id.match(/^item\d+$/i) 
        ? id.replace(/^item/i, 'Item ') 
        : id;
    }
    const indexMatch = String(id).match(/^item(\d+)$/i);
    if (indexMatch) {
      const itemIndex = parseInt(indexMatch[1], 10);
      if (itemIndex >= 0 && itemIndex < items.length) {
        const item = items[itemIndex];
        return typeof item === 'string' ? item : (item?.text ?? item?.itemText ?? item);
      }
    }
    const foundItem = items.find((item) => {
      const itemId = item?.id ?? item?.itemId ?? String(item);
      return itemId === id || String(item) === id;
    });
    if (foundItem) {
      return typeof foundItem === 'string' ? foundItem : (foundItem?.text ?? foundItem?.itemText ?? foundItem);
    }
    return typeof id === 'string' && id.match(/^item\d+$/i) 
      ? id.replace(/^item/i, 'Item ') 
      : id;
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
      {orderedIds.map((id, index) => {
        const displayText = getItemText(id);
        return (
          <div key={index} style={{
            display: 'flex', alignItems: 'center', background: '#f8fafc', 
            border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '6px', fontWeight: '500' }}>{index + 1}.</span>
            <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: '500' }}>{displayText}</span>
          </div>
        );
      })}
    </div>
  );
}

function MatchingAnswer({ answer, columnA = [], columnB = [] }) {
  let pairs = [];
  try {
    if (answer.startsWith('[') && answer.endsWith(']')) {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed)) {
        pairs = parsed.map((item) => {
          const aId = item.aid || item.aId || item.ald || item['aId'] || '';
          const bId = item.bid || item.bId || item.bld || item['bld Id'] || item['bId'] || '';
          return { aId, bId };
        }).filter((p) => p.aId && p.bId);
      }
    }
  } catch {
    return <div className="student-result-qa-answer-text">{answer}</div>;
  }

  if (pairs.length === 0) {
    return <div className="student-result-qa-answer-text">Chưa có câu trả lời</div>;
  }

  const formatId = (id, column) => {
    if (!id) return id;
    const idStr = String(id).trim().toUpperCase();
    const patterns = [ /^([AB])(\d+)$/i, /^([AB])[-\s_]?(\d+)$/i, /^([AB])([A-Z])$/i ];
    for (const pattern of patterns) {
      const match = idStr.match(pattern);
      if (match) {
        const prefix = match[1].toUpperCase();
        const numberOrLetter = match[2];
        if (prefix === 'A') {
          const num = parseInt(numberOrLetter, 10);
          if (!isNaN(num) && num > 0) return String(num);
        } else if (prefix === 'B') {
          const num = parseInt(numberOrLetter, 10);
          if (!isNaN(num) && num > 0) {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            return letters[num - 1] || String(num);
          }
          return numberOrLetter.toUpperCase();
        }
      }
    }
    const numberMatch = idStr.match(/(\d+)/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      if (column === 'A' && !isNaN(num) && num > 0) {
        return String(num);
      } else if (column === 'B' && !isNaN(num) && num > 0) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        return letters[num - 1] || String(num);
      }
    }
    return idStr;
  };

  const getItemText = (id, column) => {
    const columnItems = column === 'A' ? columnA : columnB;
    if (!Array.isArray(columnItems) || columnItems.length === 0) return '';
    const found = columnItems.find((item) => {
      const itemId = item?.id ?? item?.itemId ?? '';
      return itemId === id;
    });
    return found?.text ?? found?.itemText ?? '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      {pairs.map((pair, index) => {
        const aFormattedId = formatId(pair.aId, 'A');
        const bFormattedId = formatId(pair.bId, 'B');
        const aText = getItemText(pair.aId, 'A');
        const bText = getItemText(pair.bId, 'B');
        
        return (
          <div key={index} style={{
            display: 'flex', alignItems: 'center', background: '#f0f9ff', 
            border: '1px solid #bae6fd', borderRadius: '6px', padding: '8px 12px'
          }}>
            <span style={{ flex: 1, fontSize: '0.95rem', color: '#0c4a6e', fontWeight: '500' }}>
              <strong style={{ opacity: 0.7, marginRight: '4px' }}>{aFormattedId}</strong> {aText}
            </span>
            <span style={{ margin: '0 12px', color: '#38bdf8', fontWeight: 'bold' }}>→</span>
            <span style={{ flex: 1, fontSize: '0.95rem', color: '#0c4a6e', fontWeight: '500' }}>
              <strong style={{ opacity: 0.7, marginRight: '4px' }}>{bFormattedId}</strong> {bText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
