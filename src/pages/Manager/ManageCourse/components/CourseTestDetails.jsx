import React, { useEffect, useMemo, useState } from 'react';

const QUESTIONS_PER_PAGE = 5;

const QUESTION_TYPES = [
  { value: 'FILL_BLANK', label: 'Điền vào chỗ trống' },
  { value: 'REORDER', label: 'Sắp xếp câu' },
  { value: 'MATCHING', label: 'Nối đáp án' },
  { value: 'ESSAY_WRITING', label: 'Viết đoạn văn ngắn' },
];

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const raw = String(value);
  return raw.length >= 16 ? raw.slice(0, 16) : raw;
};

const toReadableDate = (value) => {
  if (!value) return 'Chưa đặt hạn nộp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN');
};

const normalizeQuestionType = (value) => {
  const raw = (value ?? '').toString().trim().toUpperCase();
  if (raw === 'REORDER') return 'REORDER';
  if (raw === 'MATCHING') return 'MATCHING';
  if (raw === 'ESSAY_WRITING') return 'ESSAY_WRITING';
  return 'FILL_BLANK';
};

const createMatchingItem = (prefix, index) => ({
  id: `${prefix}${index}`,
  text: '',
});

const createEmptyWritingQuestion = () => ({
  id: `${Date.now()}-${Math.random()}`,
  questionType: 'FILL_BLANK',
  questionText: '',
  sampleAnswer: '',
  points: 1,
  items: ['', ''],
  columnA: [createMatchingItem('A', 1)],
  columnB: [createMatchingItem('B', 1)],
  topic: '',
  instructions: '',
  minWords: '',
  maxWords: '',
});

const mapQuestionForBuilder = (question) => {
  const questionType = normalizeQuestionType(question?.questionType);
  const columnA = Array.isArray(question?.columnA) && question.columnA.length > 0
    ? question.columnA.map((item, index) => ({
      id: item?.id ?? `A${index + 1}`,
      text: item?.text ?? '',
    }))
    : [createMatchingItem('A', 1)];
  const columnB = Array.isArray(question?.columnB) && question.columnB.length > 0
    ? question.columnB.map((item, index) => ({
      id: item?.id ?? `B${index + 1}`,
      text: item?.text ?? '',
    }))
    : [createMatchingItem('B', 1)];

  return {
    id: question?.id ?? question?.questionId ?? `${Date.now()}-${Math.random()}`,
    questionType,
    questionText: question?.questionText ?? question?.question ?? '',
    sampleAnswer: question?.sampleAnswer ?? question?.correctAnswer ?? '',
    points: Number(question?.points ?? 1),
    items: Array.isArray(question?.items) && question.items.length > 0 ? question.items : ['', ''],
    columnA,
    columnB,
    topic: question?.topic ?? '',
    instructions: question?.instructions ?? '',
    minWords: question?.minWords ?? '',
    maxWords: question?.maxWords ?? '',
  };
};

const CourseTestDetails = ({
  selectedTest,
  courseId,
  onSave,
  onCancel,
  onUpdateTest,
  isLoading,
  isNewTest,
  testError,
}) => {
  const initialTest = useMemo(() => {
    const currentType = (selectedTest?.testType ?? selectedTest?.assignmentType ?? 'QUIZ').toString().toUpperCase();
    const normalizedType = currentType === 'WRITING' ? 'WRITING' : 'QUIZ';
    const hasQuestions = Array.isArray(selectedTest?.questions) && selectedTest.questions.length > 0;
    const writingQuestions = normalizedType === 'WRITING' && hasQuestions
      ? selectedTest.questions.map(mapQuestionForBuilder)
      : [createEmptyWritingQuestion()];
    return {
      title: selectedTest?.title ?? '',
      description: selectedTest?.description ?? '',
      maxScore: selectedTest?.maxScore ?? 100,
      dueDate: toDateTimeLocalValue(selectedTest?.dueDate),
      testType: normalizedType,
      writingQuestions,
    };
  }, [selectedTest]);

  const [title, setTitle] = useState(() => initialTest.title);
  const [description, setDescription] = useState(() => initialTest.description);
  const [maxScore, setMaxScore] = useState(() => initialTest.maxScore);
  const [dueDate, setDueDate] = useState(() => initialTest.dueDate);
  const [testType, setTestType] = useState(() => initialTest.testType);
  const [quizFile, setQuizFile] = useState(null);
  const [writingQuestions, setWritingQuestions] = useState(() => initialTest.writingQuestions);
  const [formError, setFormError] = useState('');
  const [questionPage, setQuestionPage] = useState(1);
  const [formQuestionPage, setFormQuestionPage] = useState(1);

  useEffect(() => {
    setQuestionPage(1);
    setFormQuestionPage(1);
  }, [selectedTest?.id]);

  const handleTitleChange = (value) => {
    setTitle(value);
    if (isNewTest && onUpdateTest && selectedTest?.id) {
      onUpdateTest(selectedTest.id, { title: value });
    }
  };

  const handleUpdateWritingQuestion = (questionId, updates) => {
    setWritingQuestions((prev) => prev.map((item) => (
      item.id === questionId ? { ...item, ...updates } : item
    )));
  };

  const handleUpdateReorderItem = (questionId, itemIndex, value) => {
    setWritingQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question;
      const nextItems = [...question.items];
      nextItems[itemIndex] = value;
      return { ...question, items: nextItems };
    }));
  };

  const handleAddReorderItem = (questionId) => {
    setWritingQuestions((prev) => prev.map((question) => (
      question.id === questionId
        ? { ...question, items: [...question.items, ''] }
        : question
    )));
  };

  const handleRemoveReorderItem = (questionId, itemIndex) => {
    setWritingQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question;
      const nextItems = question.items.filter((_, idx) => idx !== itemIndex);
      return { ...question, items: nextItems.length > 0 ? nextItems : [''] };
    }));
  };

  const handleUpdateMatchingItem = (questionId, columnKey, itemIndex, value) => {
    setWritingQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question;
      const nextColumn = [...question[columnKey]];
      nextColumn[itemIndex] = { ...nextColumn[itemIndex], text: value };
      return { ...question, [columnKey]: nextColumn };
    }));
  };

  const handleAddMatchingItem = (questionId, columnKey) => {
    setWritingQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question;
      const nextIndex = question[columnKey].length + 1;
      const prefix = columnKey === 'columnA' ? 'A' : 'B';
      return {
        ...question,
        [columnKey]: [...question[columnKey], createMatchingItem(prefix, nextIndex)],
      };
    }));
  };

  const handleRemoveMatchingItem = (questionId, columnKey, itemIndex) => {
    setWritingQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question;
      const nextColumn = question[columnKey].filter((_, idx) => idx !== itemIndex);
      if (nextColumn.length === 0) {
        const prefix = columnKey === 'columnA' ? 'A' : 'B';
        return { ...question, [columnKey]: [createMatchingItem(prefix, 1)] };
      }
      return { ...question, [columnKey]: nextColumn };
    }));
  };

  const handleAddWritingQuestion = () => {
    setWritingQuestions((prev) => [...prev, createEmptyWritingQuestion()]);
  };

  const handleRemoveWritingQuestion = (questionId) => {
    setWritingQuestions((prev) => {
      const next = prev.filter((question) => question.id !== questionId);
      return next.length > 0 ? next : [createEmptyWritingQuestion()];
    });
  };

  const buildWritingPayload = () => {
    const payload = [];
    for (let index = 0; index < writingQuestions.length; index += 1) {
      const question = writingQuestions[index];
      const questionType = normalizeQuestionType(question.questionType);
      const points = Number(question.points ?? 1);
      if (!Number.isFinite(points) || points <= 0) {
        return { ok: false, message: `Câu WRITING ${index + 1}: points phải lớn hơn 0.` };
      }

      if (questionType === 'FILL_BLANK') {
        if (!question.questionText.trim() || !question.sampleAnswer.trim()) {
          return { ok: false, message: `Câu FILL_BLANK ${index + 1}: cần nhập câu hỏi và sampleAnswer.` };
        }
        payload.push({
          questionType,
          questionText: question.questionText.trim(),
          sampleAnswer: question.sampleAnswer.trim(),
          points,
        });
        continue;
      }

      if (questionType === 'REORDER') {
        const items = question.items.map((item) => item.trim()).filter((item) => item !== '');
        if (!question.questionText.trim() || items.length < 2) {
          return { ok: false, message: `Câu REORDER ${index + 1}: cần câu hỏi và ít nhất 2 items.` };
        }
        payload.push({
          questionType,
          questionText: question.questionText.trim(),
          items,
          points,
        });
        continue;
      }

      if (questionType === 'MATCHING') {
        const columnA = question.columnA
          .map((item, idx) => ({ id: item.id || `A${idx + 1}`, text: (item.text ?? '').trim() }))
          .filter((item) => item.text !== '');
        const columnB = question.columnB
          .map((item, idx) => ({ id: item.id || `B${idx + 1}`, text: (item.text ?? '').trim() }))
          .filter((item) => item.text !== '');
        const sampleAnswer = (question.sampleAnswer ?? '').trim();
        if (!question.questionText.trim() || columnA.length === 0 || columnB.length === 0) {
          return { ok: false, message: `Câu MATCHING ${index + 1}: cần nhập câu hỏi và dữ liệu cho cả 2 cột.` };
        }
        if (!sampleAnswer) {
          return { ok: false, message: `Câu MATCHING ${index + 1}: cần nhập đáp án đúng (ví dụ: 1-B, 2-C, 3-A, 4-D).` };
        }
        payload.push({
          questionType,
          questionText: question.questionText.trim(),
          columnA,
          columnB,
          sampleAnswer,
          points,
        });
        continue;
      }

      const topic = question.topic.trim();
      const instructions = question.instructions.trim();
      const questionText = question.questionText.trim();
      const minWords = Number(question.minWords);
      const maxWords = Number(question.maxWords);
      if (!questionText) {
        return { ok: false, message: `Câu ESSAY_WRITING ${index + 1}: cần nhập nội dung câu hỏi (ví dụ: Viết đoạn văn ngắn giới thiệu bản thân bằng tiếng Nhật).` };
      }
      if (!topic || !instructions) {
        return { ok: false, message: `Câu ESSAY_WRITING ${index + 1}: cần topic và instructions.` };
      }
      if (!Number.isFinite(minWords) || !Number.isFinite(maxWords) || minWords <= 0 || maxWords <= 0) {
        return { ok: false, message: `Câu ESSAY_WRITING ${index + 1}: minWords/maxWords phải là số > 0.` };
      }
      if (minWords > maxWords) {
        return { ok: false, message: `Câu ESSAY_WRITING ${index + 1}: minWords không được lớn hơn maxWords.` };
      }
      const essayPayload = {
        questionType: 'ESSAY_WRITING',
        questionText,
        topic,
        instructions,
        minWords: Math.round(minWords),
        maxWords: Math.round(maxWords),
        points,
      };
      const sampleAnswer = (question.sampleAnswer ?? '').trim();
      if (sampleAnswer) {
        essayPayload.sampleAnswer = sampleAnswer;
      }
      payload.push(essayPayload);
    }

    return { ok: true, payload };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài kiểm tra.');
      return;
    }
    const score = Number(maxScore);
    if (!Number.isFinite(score) || score <= 0) {
      setFormError('Điểm tối đa phải lớn hơn 0.');
      return;
    }
    if (!dueDate) {
      setFormError('Vui lòng chọn hạn nộp.');
      return;
    }

    let writingPayload = [];
    if (testType === 'WRITING') {
      const result = buildWritingPayload();
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      writingPayload = result.payload;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      testType,
      maxScore: score,
      dueDate,
      quizFile,
      writingQuestions: writingPayload,
    });
  };

  if (!selectedTest) {
    return (
      <div className="lesson-details">
        <h2 className="lesson-details-title">Bài kiểm tra</h2>
        <div className="lesson-details-view-value">Chọn một bài kiểm tra trong danh sách bên trái.</div>
      </div>
    );
  }

  if (!isNewTest) {
    return (
      <div className="lesson-details">
        <h2 className="lesson-details-title">Chi tiết Bài kiểm tra</h2>
        <p className="lesson-details-subtitle">Bài kiểm tra đã tạo sẽ hiển thị ở chế độ xem.</p>

        <div className="lesson-details-view">
          <div className="lesson-details-header">
            <div className="lesson-details-type-badge">
              {selectedTest.testType === 'QUIZ' ? 'Trắc nghiệm' : 'Tự luận'}
            </div>
          </div>

          <div className="lesson-details-field">
            <label className="lesson-details-label">COURSE ID</label>
            <div className="lesson-details-view-value">{selectedTest.courseId ?? courseId ?? 'N/A'}</div>
          </div>

          <div className="lesson-details-field">
            <label className="lesson-details-label">TIÊU ĐỀ</label>
            <div className="lesson-details-view-value">{selectedTest.title || 'Chưa có tiêu đề'}</div>
          </div>

          <div className="lesson-details-field">
            <label className="lesson-details-label">MÔ TẢ</label>
            <div className="lesson-details-view-value lesson-details-view-text">
              {selectedTest.description || 'Chưa có mô tả.'}
            </div>
          </div>

          <div className="lesson-details-field">
            <label className="lesson-details-label">ĐIỂM TỐI ĐA</label>
            <div className="lesson-details-view-value">{selectedTest.maxScore ?? 0}</div>
          </div>

          <div className="lesson-details-field">
            <label className="lesson-details-label">HẠN NỘP</label>
            <div className="lesson-details-view-value">{toReadableDate(selectedTest.dueDate)}</div>
          </div>

          {selectedTest.testType === 'QUIZ' && (() => {
            const allQuestions = selectedTest.questions || [];
            const totalCount = allQuestions.length;
            const totalPages = Math.max(1, Math.ceil(totalCount / QUESTIONS_PER_PAGE));
            const safePage = Math.min(Math.max(1, questionPage), totalPages);
            const startIdx = (safePage - 1) * QUESTIONS_PER_PAGE;
            const pageQuestions = allQuestions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);
            return (
              <div className="lesson-quiz-section">
                <div className="lesson-quiz-header">
                  <h3 className="lesson-quiz-title">Danh sách câu hỏi ({totalCount} câu)</h3>
                </div>
                <div className="quiz-pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`quiz-pagination-page-btn ${p === safePage ? 'active' : ''}`}
                      onClick={() => setQuestionPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="lesson-quiz-questions-list">
                  {pageQuestions.map((question, qIndex) => {
                    const globalIndex = startIdx + qIndex;
                    return (
                      <div key={question.id || globalIndex} className="lesson-quiz-question lesson-quiz-question-view">
                        <div className="lesson-quiz-question-number">
                          <span>Câu {globalIndex + 1}</span>
                        </div>
                        <div className="lesson-quiz-question-content">
                          <label className="lesson-details-label">NỘI DUNG CÂU HỎI</label>
                          <div className="lesson-details-view-value">{question.question || 'Chưa có nội dung'}</div>
                        </div>
                        <div className="lesson-quiz-answers">
                          <label className="lesson-details-label">CÁC LỰA CHỌN TRẢ LỜI</label>
                          {question.answers.map((answer, aIndex) => {
                            const isCorrect = question.correctIndex === aIndex;
                            return (
                              <div key={aIndex} className={`lesson-quiz-answer-view ${isCorrect ? 'is-correct' : ''}`}>
                                <span className="lesson-quiz-answer-number">{aIndex + 1}.</span>
                                <span className="lesson-quiz-answer-text">{answer || 'Chưa có nội dung'}</span>
                                {isCorrect && <span className="lesson-quiz-answer-label">ĐÚNG</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="quiz-pagination-nav">
                  <button
                    type="button"
                    className="quiz-pagination-prev"
                    disabled={safePage <= 1}
                    onClick={() => setQuestionPage((p) => Math.max(1, p - 1))}
                  >
                    &lt; Prev
                  </button>
                  <button
                    type="button"
                    className="quiz-pagination-next"
                    disabled={safePage >= totalPages}
                    onClick={() => setQuestionPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next &gt;
                  </button>
                </div>
              </div>
            );
          })()}

          {selectedTest.testType === 'WRITING' && Array.isArray(selectedTest.questions) && selectedTest.questions.length > 0 && (() => {
            const allQuestions = selectedTest.questions;
            const totalCount = allQuestions.length;
            const totalPages = Math.max(1, Math.ceil(totalCount / QUESTIONS_PER_PAGE));
            const safePage = Math.min(Math.max(1, questionPage), totalPages);
            const startIdx = (safePage - 1) * QUESTIONS_PER_PAGE;
            const pageQuestions = allQuestions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);
            return (
              <div className="lesson-quiz-section">
                <div className="lesson-quiz-header">
                  <h3 className="lesson-quiz-title">Danh sách câu hỏi ({totalCount} câu)</h3>
                </div>
                <div className="quiz-pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`quiz-pagination-page-btn ${p === safePage ? 'active' : ''}`}
                      onClick={() => setQuestionPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="lesson-quiz-questions-list">
                  {pageQuestions.map((question, qIndex) => {
                    const globalIndex = startIdx + qIndex;
                    return (
                      <div key={question.id || globalIndex} className="lesson-quiz-question lesson-quiz-question-view">
                        <div className="lesson-quiz-question-number">
                          <span>Câu {globalIndex + 1}</span>
                        </div>
                        <div className="lesson-quiz-question-content">
                          <label className="lesson-details-label">LOẠI CÂU HỎI</label>
                          <div className="lesson-details-view-value">{question.questionType}</div>
                          <label className="lesson-details-label">NỘI DUNG</label>
                          <div className="lesson-details-view-value">{question.questionText || 'Chưa có nội dung'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="quiz-pagination-nav">
                  <button
                    type="button"
                    className="quiz-pagination-prev"
                    disabled={safePage <= 1}
                    onClick={() => setQuestionPage((p) => Math.max(1, p - 1))}
                  >
                    &lt; Prev
                  </button>
                  <button
                    type="button"
                    className="quiz-pagination-next"
                    disabled={safePage >= totalPages}
                    onClick={() => setQuestionPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next &gt;
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-details">
      <h2 className="lesson-details-title">Tạo Bài kiểm tra</h2>
      <p className="lesson-details-subtitle">Trắc nghiệm hoặc bài tập rời (cùng cấp với chương).</p>

      <form className="lesson-details-form" onSubmit={handleSubmit}>
        <div className="lesson-details-header">
          <select
            className="lesson-details-type-select"
            value={testType}
            onChange={(event) => setTestType(event.target.value)}
            disabled={isLoading}
          >
            <option value="QUIZ">Trắc nghiệm</option>
            <option value="WRITING">Tự luận</option>
          </select>
        </div>

        <div className="lesson-details-field">
          <label className="lesson-details-label">COURSE ID</label>
          <input
            className="lesson-details-input"
            type="text"
            value={courseId ?? ''}
            disabled
            readOnly
          />
        </div>

        <div className="lesson-details-field">
          <label className="lesson-details-label">TIÊU ĐỀ BÀI KIỂM TRA</label>
          <input
            className="lesson-details-input"
            type="text"
            placeholder="VD: Kiểm tra giữa kỳ"
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="lesson-details-field">
          <label className="lesson-details-label">MÔ TẢ / YÊU CẦU</label>
          <textarea
            className="lesson-details-textarea"
            rows={4}
            placeholder="Nhập mô tả hoặc yêu cầu bài kiểm tra..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="lesson-details-field">
          <label className="lesson-details-label">ĐIỂM TỐI ĐA</label>
          <input
            className="lesson-details-input"
            type="number"
            min={1}
            value={maxScore}
            onChange={(event) => setMaxScore(event.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="lesson-details-field">
          <label className="lesson-details-label">HẠN NỘP</label>
          <input
            className="lesson-details-input"
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {testType === 'QUIZ' && (
          <div className="course-wizard-import">
            <div>
              <p className="course-wizard-import-title">Upload file Excel cho QUIZ</p>
              <p className="course-wizard-import-subtitle">
                Hệ thống sẽ tự random 20 câu, mặc định 5 điểm/câu.
              </p>
            </div>
            <label className="course-wizard-import-btn">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => setQuizFile(event.target.files?.[0] ?? null)}
                disabled={isLoading}
              />
              Chọn file Excel
            </label>
          </div>
        )}

        {testType === 'WRITING' && (() => {
          const totalCount = writingQuestions.length;
          const totalPages = Math.max(1, Math.ceil(totalCount / QUESTIONS_PER_PAGE));
          const safePage = Math.min(Math.max(1, formQuestionPage), totalPages);
          const startIdx = (safePage - 1) * QUESTIONS_PER_PAGE;
          const pageQuestions = writingQuestions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);
          return (
          <div className="lesson-quiz-section">
            <div className="lesson-quiz-header">
              <h3 className="lesson-quiz-title">Danh sách câu hỏi ({totalCount} câu)</h3>
            </div>
            <div className="quiz-pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`quiz-pagination-page-btn ${p === safePage ? 'active' : ''}`}
                  onClick={() => setFormQuestionPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            {pageQuestions.map((question, index) => {
              const globalIndex = startIdx + index;
              return (
              <div key={question.id} className="lesson-quiz-question">
                <div className="lesson-quiz-question-header">
                  <div className="lesson-quiz-question-number">
                    <span>Câu {globalIndex + 1}</span>
                  </div>
                  <button
                    type="button"
                    className="lesson-quiz-delete-btn"
                    onClick={() => handleRemoveWritingQuestion(question.id)}
                    disabled={isLoading}
                  >
                    Xóa
                  </button>
                </div>

                <div className="lesson-details-field">
                  <label className="lesson-details-label">LOẠI CÂU HỎI</label>
                  <select
                    className="lesson-details-type-select"
                    value={question.questionType}
                    onChange={(event) => handleUpdateWritingQuestion(question.id, { questionType: event.target.value })}
                    disabled={isLoading}
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="lesson-details-field">
                  <label className="lesson-details-label">ĐIỂM CÂU HỎI</label>
                  <input
                    className="lesson-details-input"
                    type="number"
                    min={1}
                    value={question.points}
                    onChange={(event) => handleUpdateWritingQuestion(question.id, { points: event.target.value })}
                    disabled={isLoading}
                  />
                </div>

                {question.questionType !== 'ESSAY_WRITING' && (
                  <div className="lesson-details-field">
                    <label className="lesson-details-label">NỘI DUNG CÂU HỎI</label>
                    <textarea
                      className="lesson-details-textarea"
                      rows={3}
                      value={question.questionText}
                      onChange={(event) => handleUpdateWritingQuestion(question.id, { questionText: event.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                )}

                {question.questionType === 'FILL_BLANK' && (
                  <div className="lesson-details-field">
                    <label className="lesson-details-label">ĐÁP ÁN ĐÚNG CHO CHỖ TRỐNG</label>
                    <input
                      className="lesson-details-input"
                      type="text"
                      placeholder="Ví dụ: は"
                      value={question.sampleAnswer}
                      onChange={(event) =>
                        handleUpdateWritingQuestion(question.id, { sampleAnswer: event.target.value })
                      }
                      disabled={isLoading}
                    />
                    <p className="lesson-details-hint">
                      Ví dụ câu hỏi: Hoàn thành câu sau: わたし（　）学生です。
                    </p>
                  </div>
                )}

                {question.questionType === 'REORDER' && (
                  <div className="lesson-details-field">
                    <label className="lesson-details-label">ITEMS (sắp xếp)</label>
                    {question.items.map((item, itemIndex) => (
                      <div key={`${question.id}-item-${itemIndex}`} className="lesson-quiz-answer">
                        <input
                          className="lesson-quiz-answer-input"
                          type="text"
                          value={item}
                          placeholder={`Item ${itemIndex + 1}`}
                          onChange={(event) => handleUpdateReorderItem(question.id, itemIndex, event.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="lesson-quiz-delete-btn"
                          onClick={() => handleRemoveReorderItem(question.id, itemIndex)}
                          disabled={isLoading}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="course-outline-btn"
                      onClick={() => handleAddReorderItem(question.id)}
                      disabled={isLoading}
                    >
                      + Thêm item
                    </button>
                  </div>
                )}

                {question.questionType === 'MATCHING' && (
                  <div className="lesson-details-field">
                    <label className="lesson-details-label">MATCHING - COLUMN A</label>
                    {question.columnA.map((item, itemIndex) => (
                      <div key={`${question.id}-columnA-${itemIndex}`} className="lesson-quiz-answer">
                        <input
                          className="lesson-quiz-answer-input"
                          type="text"
                          value={item.text}
                          placeholder={`A${itemIndex + 1}`}
                          onChange={(event) => handleUpdateMatchingItem(question.id, 'columnA', itemIndex, event.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="lesson-quiz-delete-btn"
                          onClick={() => handleRemoveMatchingItem(question.id, 'columnA', itemIndex)}
                          disabled={isLoading}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="course-outline-btn"
                      onClick={() => handleAddMatchingItem(question.id, 'columnA')}
                      disabled={isLoading}
                    >
                      + Thêm A
                    </button>

                    <label className="lesson-details-label" style={{ marginTop: 12 }}>MATCHING - COLUMN B</label>
                    {question.columnB.map((item, itemIndex) => (
                      <div key={`${question.id}-columnB-${itemIndex}`} className="lesson-quiz-answer">
                        <input
                          className="lesson-quiz-answer-input"
                          type="text"
                          value={item.text}
                          placeholder={`B${itemIndex + 1}`}
                          onChange={(event) => handleUpdateMatchingItem(question.id, 'columnB', itemIndex, event.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="lesson-quiz-delete-btn"
                          onClick={() => handleRemoveMatchingItem(question.id, 'columnB', itemIndex)}
                          disabled={isLoading}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="course-outline-btn"
                      onClick={() => handleAddMatchingItem(question.id, 'columnB')}
                      disabled={isLoading}
                    >
                      + Thêm B
                    </button>
                    <div className="lesson-details-field" style={{ marginTop: 12 }}>
                      <label className="lesson-details-label">
                        ĐÁP ÁN ĐÚNG (A-B) – ví dụ: 1-B, 2-C, 3-A, 4-D
                      </label>
                      <input
                        className="lesson-details-input"
                        type="text"
                        placeholder="Ví dụ: 1-B, 2-C, 3-A, 4-D"
                        value={question.sampleAnswer || ''}
                        onChange={(event) =>
                          handleUpdateWritingQuestion(question.id, { sampleAnswer: event.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {question.questionType === 'ESSAY_WRITING' && (
                  <>
                    <div className="lesson-details-field">
                      <label className="lesson-details-label">NỘI DUNG CÂU HỎI</label>
                      <textarea
                        className="lesson-details-textarea"
                        rows={3}
                        placeholder="Ví dụ: Viết đoạn văn ngắn giới thiệu bản thân bằng tiếng Nhật."
                        value={question.questionText}
                        onChange={(event) =>
                          handleUpdateWritingQuestion(question.id, { questionText: event.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="lesson-details-field">
                      <label className="lesson-details-label">TOPIC</label>
                      <input
                        className="lesson-details-input"
                        type="text"
                        placeholder="Ví dụ: Jikoshoukai"
                        value={question.topic}
                        onChange={(event) =>
                          handleUpdateWritingQuestion(question.id, { topic: event.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="lesson-details-field">
                      <label className="lesson-details-label">INSTRUCTIONS</label>
                      <textarea
                        className="lesson-details-textarea"
                        rows={3}
                        placeholder="Ví dụ: Giới thiệu tên, tuổi, nghề nghiệp, sở thích. Dùng mẫu câu N4 cơ bản."
                        value={question.instructions}
                        onChange={(event) =>
                          handleUpdateWritingQuestion(question.id, { instructions: event.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="lesson-details-field">
                      <label className="lesson-details-label">ĐÁP ÁN MẪU (sampleAnswer – không bắt buộc)</label>
                      <textarea
                        className="lesson-details-textarea"
                        rows={3}
                        placeholder="Ví dụ: わたしはロンです。ベトナムじんです。..."
                        value={question.sampleAnswer || ''}
                        onChange={(event) =>
                          handleUpdateWritingQuestion(question.id, { sampleAnswer: event.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="lesson-quiz-answer">
                      <input
                        className="lesson-quiz-answer-input"
                        type="number"
                        min={1}
                        value={question.minWords}
                        placeholder="minWords (ví dụ: 100)"
                        onChange={(event) =>
                          handleUpdateWritingQuestion(question.id, { minWords: event.target.value })
                        }
                        disabled={isLoading}
                      />
                      <input
                        className="lesson-quiz-answer-input"
                        type="number"
                        min={1}
                        value={question.maxWords}
                        placeholder="maxWords (ví dụ: 150)"
                        onChange={(event) =>
                          handleUpdateWritingQuestion(question.id, { maxWords: event.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
              </div>
            );
            })}

            <div className="quiz-pagination-nav">
              <button
                type="button"
                className="quiz-pagination-prev"
                disabled={safePage <= 1}
                onClick={() => setFormQuestionPage((p) => Math.max(1, p - 1))}
              >
                &lt; Prev
              </button>
              <button
                type="button"
                className="quiz-pagination-next"
                disabled={safePage >= totalPages}
                onClick={() => setFormQuestionPage((p) => Math.min(totalPages, p + 1))}
              >
                Next &gt;
              </button>
            </div>

            <button
              type="button"
              className="lesson-quiz-add-question"
              onClick={handleAddWritingQuestion}
              disabled={isLoading}
            >
              <span>+ THÊM CÂU WRITING</span>
            </button>
          </div>
          );
        })()}

        {(formError || testError) && <p className="course-error">{formError || testError}</p>}

        <div className="lesson-details-actions">
          <button
            type="button"
            className="lesson-details-btn lesson-details-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="lesson-details-btn lesson-details-btn-save"
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? 'Đang lưu...' : 'Tạo assignment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseTestDetails;
