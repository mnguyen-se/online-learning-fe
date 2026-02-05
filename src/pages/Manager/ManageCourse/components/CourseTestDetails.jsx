import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const createEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random()}`,
  question: '',
  answers: ['', '', '', ''],
  correctIndex: 0,
});

const normalizeHeader = (value) => (value || '').toString().trim().toLowerCase();

const resolveCorrectIndex = (value) => {
  const raw = (value ?? '').toString().trim().toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(raw)) {
    return ['A', 'B', 'C', 'D'].indexOf(raw);
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 4) {
    return numeric - 1;
  }
  return 0;
};

const detectHeaderRow = (row) => {
  const normalized = row.map(normalizeHeader);
  const expected = ['question', 'cauhoi', 'cau hoi', 'answer1', 'option a', 'a', 'correct', 'correctindex', 'dap an'];
  return normalized.some((cell) => expected.some((key) => cell.includes(key)));
};

const buildHeaderMap = (headerRow) => {
  const map = {};
  headerRow.forEach((cell, index) => {
    const value = normalizeHeader(cell);
    if (value.includes('question') || value.includes('cau')) {
      map.question = index;
    }
    if (value.includes('option a') || value === 'a' || value.includes('answer1') || value.includes('dapana')) {
      map.optionA = index;
    }
    if (value.includes('option b') || value === 'b' || value.includes('answer2') || value.includes('dapanb')) {
      map.optionB = index;
    }
    if (value.includes('option c') || value === 'c' || value.includes('answer3') || value.includes('dapanc')) {
      map.optionC = index;
    }
    if (value.includes('option d') || value === 'd' || value.includes('answer4') || value.includes('dapand')) {
      map.optionD = index;
    }
    if (value.includes('correct') || value.includes('dap an')) {
      map.correct = index;
    }
  });
  return map;
};

const mapRowToQuestion = (row, headerMap) => {
  const getValue = (key, fallbackIndex) => {
    const idx = typeof headerMap[key] === 'number' ? headerMap[key] : fallbackIndex;
    return (row[idx] ?? '').toString().trim();
  };

  const questionText = getValue('question', 0);
  const answers = [
    getValue('optionA', 1),
    getValue('optionB', 2),
    getValue('optionC', 3),
    getValue('optionD', 4),
  ];
  const correctRaw = getValue('correct', 5);
  const correctIndex = resolveCorrectIndex(correctRaw);

  return {
    id: `${Date.now()}-${Math.random()}`,
    question: questionText,
    answers,
    correctIndex,
  };
};

const parseExcelQuestions = async (file) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return [];
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows.length) {
    return [];
  }

  const [firstRow, ...restRows] = rows;
  const hasHeader = detectHeaderRow(firstRow);
  const headerRow = hasHeader ? firstRow : null;
  const dataRows = hasHeader ? restRows : rows;
  const headerMap = headerRow ? buildHeaderMap(headerRow) : {};

  return dataRows
    .filter((row) => row.some((cell) => `${cell}`.trim() !== ''))
    .map((row) => mapRowToQuestion(row, headerMap))
    .filter((q) => q.question.trim());
};

const CourseTestDetails = ({
  selectedTest,
  onSave,
  onCancel,
  onUpdateTest,
  isLoading,
  isNewTest,
  testError,
}) => {
  const initialTest = useMemo(() => {
    const hasQuestions = Array.isArray(selectedTest?.questions) && selectedTest.questions.length > 0;
    return {
      title: selectedTest?.title ?? '',
      description: selectedTest?.description ?? '',
      testType: selectedTest?.testType ?? (hasQuestions ? 'QUIZ' : 'ASSIGNMENT'),
      quizQuestions: hasQuestions ? selectedTest.questions : [createEmptyQuestion()],
    };
  }, [selectedTest]);

  const [title, setTitle] = useState(() => initialTest.title);
  const [description, setDescription] = useState(() => initialTest.description);
  const [testType, setTestType] = useState(() => initialTest.testType);
  const [quizQuestions, setQuizQuestions] = useState(() => initialTest.quizQuestions);
  const [importMethod, setImportMethod] = useState('manual');
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importInfo, setImportInfo] = useState('');

  const handleTitleChange = (value) => {
    setTitle(value);
    if (isNewTest && onUpdateTest && selectedTest?.id) {
      onUpdateTest(selectedTest.id, { title: value });
    }
  };

  const handleAddQuestion = () => {
    setQuizQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const handleRemoveQuestion = (questionId) => {
    setQuizQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleUpdateQuestion = (questionId, field, value) => {
    setQuizQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)));
  };

  const handleUpdateAnswer = (questionId, index, value) => {
    setQuizQuestions((prev) => prev.map((q) => {
      if (q.id !== questionId) return q;
      const nextAnswers = [...q.answers];
      nextAnswers[index] = value;
      return { ...q, answers: nextAnswers };
    }));
  };

  const handleSetCorrectAnswer = (questionId, index) => {
    setQuizQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, correctIndex: index } : q)));
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportInfo('');
    setImportFile(file);

    try {
      const questions = await parseExcelQuestions(file);
      if (!questions.length) {
        setImportError('File Excel không có câu hỏi hợp lệ.');
        return;
      }
      if (questions.length > 100) {
        setImportError('Tối đa 100 câu hỏi trong một bài kiểm tra.');
        return;
      }
      setQuizQuestions(questions);
      setImportInfo(`Đã nhận ${questions.length} câu hỏi từ file.`);
      setImportMethod('import');
    } catch (error) {
      console.error('Import excel error:', error);
      setImportError('Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setImportError('');
    if (!title.trim()) {
      setImportError('Vui lòng nhập tiêu đề bài kiểm tra.');
      return;
    }
    if (testType === 'QUIZ') {
      if (quizQuestions.length < 25) {
        setImportError('Cần tối thiểu 25 câu hỏi để tạo bài trắc nghiệm.');
        return;
      }
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      testType,
      quizQuestions,
      importFile,
      importMethod,
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
              {selectedTest.testType === 'QUIZ' ? 'Trắc nghiệm' : 'Bài tập'}
            </div>
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

          {selectedTest.testType === 'QUIZ' && (
            <div className="lesson-quiz-section">
              <div className="lesson-quiz-header">
                <h3 className="lesson-quiz-title">Danh sách câu hỏi</h3>
                <span className="lesson-quiz-badge">{selectedTest.questions?.length ?? 0} CÂU HỎI</span>
              </div>

              {(selectedTest.questions || []).map((question, qIndex) => (
                <div key={question.id || qIndex} className="lesson-quiz-question lesson-quiz-question-view">
                  <div className="lesson-quiz-question-number">
                    <span>{qIndex + 1}</span>
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
              ))}
            </div>
          )}
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
            <option value="ASSIGNMENT">Bài tập</option>
          </select>
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

        {testType === 'QUIZ' && (
          <>
            <div className="lesson-details-field">
              <label className="lesson-details-label">HÌNH THỨC NHẬP CÂU HỎI</label>
              <div className="course-wizard-type-toggle">
                <button
                  type="button"
                  className={`course-wizard-pill ${importMethod === 'manual' ? 'is-active' : ''}`}
                  onClick={() => setImportMethod('manual')}
                  disabled={isLoading}
                >
                  Nhập thủ công
                </button>
                <button
                  type="button"
                  className={`course-wizard-pill ${importMethod === 'import' ? 'is-active' : ''}`}
                  onClick={() => setImportMethod('import')}
                  disabled={isLoading}
                >
                  Import Excel
                </button>
              </div>
            </div>

            {importMethod === 'import' && (
              <div className="course-wizard-import">
                <div>
                  <p className="course-wizard-import-title">Chọn file Excel (.xlsx, .xls)</p>
                  <p className="course-wizard-import-subtitle">
                    File gồm 6 cột: Câu hỏi, Đáp án A-D, Đáp án đúng (A/B/C/D hoặc 1-4).
                  </p>
                </div>
                <label className="course-wizard-import-btn">
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} />
                  Chọn file Excel
                </label>
              </div>
            )}

            {importInfo && <p className="course-success">{importInfo}</p>}
            {importError && <p className="course-error">{importError}</p>}

            <div className="lesson-quiz-section">
              <div className="lesson-quiz-header">
                <h3 className="lesson-quiz-title">Danh sách câu hỏi</h3>
                <span className="lesson-quiz-badge">{quizQuestions.length} CÂU HỎI</span>
              </div>

              {quizQuestions.map((question, qIndex) => (
                <div key={question.id} className="lesson-quiz-question">
                  <div className="lesson-quiz-question-header">
                    <div className="lesson-quiz-question-number">
                      <span className="lesson-quiz-drag-icon">☰</span>
                      <span>{qIndex + 1}</span>
                    </div>
                    <button
                      type="button"
                      className="lesson-quiz-delete-btn"
                      onClick={() => handleRemoveQuestion(question.id)}
                      disabled={isLoading}
                      aria-label="Xóa câu hỏi"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className="lesson-quiz-question-content">
                    <label className="lesson-details-label">NỘI DUNG CÂU HỎI</label>
                    <textarea
                      className="lesson-details-textarea"
                      placeholder="Nhập câu hỏi tại đây..."
                      value={question.question}
                      onChange={(event) => handleUpdateQuestion(question.id, 'question', event.target.value)}
                      disabled={isLoading}
                      rows={4}
                    />
                  </div>

                  <div className="lesson-quiz-answers">
                    <label className="lesson-details-label">CÁC LỰA CHỌN TRẢ LỜI</label>
                    {question.answers.map((answer, aIndex) => {
                      const isCorrect = question.correctIndex === aIndex;
                      return (
                        <div key={aIndex} className={`lesson-quiz-answer ${isCorrect ? 'is-correct' : ''}`}>
                          <button
                            type="button"
                            className="lesson-quiz-answer-radio"
                            onClick={() => handleSetCorrectAnswer(question.id, aIndex)}
                            disabled={isLoading}
                            aria-label={isCorrect ? 'Đáp án đúng' : 'Chọn làm đáp án đúng'}
                          >
                            {isCorrect && (
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          <input
                            className="lesson-quiz-answer-input"
                            type="text"
                            placeholder={`Lựa chọn ${aIndex + 1}...`}
                            value={answer}
                            onChange={(event) => handleUpdateAnswer(question.id, aIndex, event.target.value)}
                            disabled={isLoading}
                          />
                          {isCorrect && (
                            <span className="lesson-quiz-answer-label">ĐÚNG</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="lesson-quiz-add-question"
                onClick={handleAddQuestion}
                disabled={isLoading}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>THÊM CÂU HỎI</span>
              </button>
            </div>
          </>
        )}

        {testType !== 'QUIZ' && (importError || testError) && (
          <p className="course-error">{importError || testError}</p>
        )}
        {testError && !importError && <p className="course-error">{testError}</p>}

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
            {isLoading ? 'Đang lưu...' : 'Tạo bài kiểm tra'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseTestDetails;
