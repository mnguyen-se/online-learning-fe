import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import ChapterInfo from './ChapterInfo';
import LessonDetails from './LessonDetails';

const createEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random()}`,
  question: '',
  answers: ['', '', '', ''],
  correctIndex: 0,
});

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const normalizeHeader = (value) => (value || '').toString().trim().toLowerCase();

const detectHeaderRow = (row) => {
  const normalized = row.map(normalizeHeader);
  const expected = ['question', 'cauhoi', 'cau hoi', 'answer1', 'answer2', 'answer3', 'answer4', 'correct', 'correctindex', 'dap an'];
  return normalized.some((cell) => expected.some((key) => cell.includes(key)));
};

const mapRowToQuestion = (row, headerMap) => {
  const getValue = (key, fallbackIndex) => {
    const idx = typeof headerMap[key] === 'number' ? headerMap[key] : fallbackIndex;
    return (row[idx] ?? '').toString().trim();
  };

  const questionText = getValue('question', 0);
  const answers = [
    getValue('answer1', 1),
    getValue('answer2', 2),
    getValue('answer3', 3),
    getValue('answer4', 4),
  ];
  const correctRaw = getValue('correctindex', 5);
  const correctIndex = Math.max(0, Math.min(3, Number(correctRaw || 1) - 1));

  return {
    id: `${Date.now()}-${Math.random()}`,
    question: questionText,
    answers,
    correctIndex,
  };
};

const CourseContentWizard = ({
  selectedCourse,
  wizardStep,
  wizardPath,
  lessons,
  moduleLessons,
  selectedChapterId,
  selectedLessonId,
  isSavingLesson,
  lessonError,
  onSelectWizardPath,
  onSetWizardStep,
  onSaveChapter,
  onCancelChapter,
  onSaveLesson,
  onCancelLesson,
  onAddLessonItem,
  onUpdateLesson,
  onUpdateModuleLesson,
  onCreateStandaloneTest,
  onGoToContent,
  onGoToList,
}) => {
  const [standaloneTitle, setStandaloneTitle] = useState('');
  const [standaloneType, setStandaloneType] = useState('QUIZ');
  const [standaloneEssayPrompt, setStandaloneEssayPrompt] = useState('');
  const [standaloneQuizTitle, setStandaloneQuizTitle] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([createEmptyQuestion()]);
  const [importError, setImportError] = useState('');
  const [importInfo, setImportInfo] = useState('');

  const selectedChapter = selectedChapterId
    ? lessons.find((l) => l.id === selectedChapterId) ?? null
    : null;

  const selectedLesson = selectedLessonId
    ? moduleLessons.find((l) => l.id === selectedLessonId) ?? null
    : null;

  useEffect(() => {
    if (wizardStep === 'lesson' && !selectedLessonId) {
      onAddLessonItem();
    }
  }, [wizardStep, selectedLessonId, onAddLessonItem]);

  const stepTitle = useMemo(() => {
    if (wizardStep === 'course') return 'Bước 1: Tạo khóa học';
    if (wizardStep === 'content-type') return 'Bước 2: Chọn loại nội dung';
    if (wizardStep === 'chapter') return 'A1: Tạo chương';
    if (wizardStep === 'lesson') return 'A2: Tạo bài học trong chương';
    if (wizardStep === 'module-finish') return 'Hoàn tất tạo chương & bài học';
    if (wizardStep === 'standalone-title') return 'B1: Tạo tiêu đề bài kiểm tra';
    if (wizardStep === 'standalone-content') return 'B2: Tạo nội dung bài kiểm tra';
    if (wizardStep === 'standalone-finish') return 'Hoàn tất tạo bài kiểm tra';
    return 'Tạo nội dung khóa học';
  }, [wizardStep]);

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

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rows.length) {
        setImportError('File Excel không có dữ liệu.');
        return;
      }

      const [firstRow, ...restRows] = rows;
      const hasHeader = detectHeaderRow(firstRow);
      const headerRow = hasHeader ? firstRow : null;
      const dataRows = hasHeader ? restRows : rows;

      const headerMap = {};
      if (headerRow) {
        headerRow.forEach((cell, index) => {
          const normalized = normalizeHeader(cell);
          if (normalized.includes('question') || normalized.includes('cau')) headerMap.question = index;
          if (normalized.includes('answer1') || normalized.includes('ans1')) headerMap.answer1 = index;
          if (normalized.includes('answer2') || normalized.includes('ans2')) headerMap.answer2 = index;
          if (normalized.includes('answer3') || normalized.includes('ans3')) headerMap.answer3 = index;
          if (normalized.includes('answer4') || normalized.includes('ans4')) headerMap.answer4 = index;
          if (normalized.includes('correct')) headerMap.correctindex = index;
        });
      }

      const rawQuestions = dataRows
        .filter((row) => row.some((cell) => `${cell}`.trim() !== ''))
        .map((row) => mapRowToQuestion(row, headerMap))
        .filter((q) => q.question.trim());

      if (rawQuestions.length < 25) {
        setImportError('Cần tối thiểu 25 câu hỏi để hệ thống chọn ra 20 câu.');
        return;
      }

      const selected = shuffle(rawQuestions).slice(0, 20);
      setQuizQuestions(selected);
      setImportInfo(`Đã nhập ${rawQuestions.length} câu, tự chọn 20 câu để tạo đề.`);
    } catch (error) {
      console.error('Import Excel error:', error);
      setImportError('Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmitStandalone = () => {
    if (!standaloneTitle.trim()) {
      setImportError('Vui lòng nhập tiêu đề bài kiểm tra.');
      return;
    }
    if (standaloneType === 'QUIZ') {
      const validQuestions = quizQuestions.filter((q) => q.question.trim());
      if (validQuestions.length === 0) {
        setImportError('Vui lòng nhập ít nhất một câu hỏi.');
        return;
      }
      onCreateStandaloneTest({
        title: standaloneTitle.trim(),
        type: 'QUIZ',
        quizTitle: standaloneQuizTitle.trim() || standaloneTitle.trim(),
        questions: validQuestions,
      });
    } else {
      if (!standaloneEssayPrompt.trim()) {
        setImportError('Vui lòng nhập nội dung đề bài.');
        return;
      }
      onCreateStandaloneTest({
        title: standaloneTitle.trim(),
        type: 'ESSAY',
        prompt: standaloneEssayPrompt.trim(),
      });
    }
  };

  return (
    <div className="course-wizard">
      <div className="course-wizard-header">
        <div>
          <p className="course-wizard-label">Wizard tạo nội dung</p>
          <h2 className="course-wizard-title">{stepTitle}</h2>
          <p className="course-wizard-subtitle">
            Khóa học: <strong>{selectedCourse?.title || 'Chưa đặt tên'}</strong>
          </p>
        </div>
        <div className="course-wizard-actions">
          <button type="button" className="course-outline-btn" onClick={onGoToContent}>
            Bỏ qua wizard
          </button>
          <button type="button" className="course-action-link" onClick={onGoToList}>
            Quay lại danh sách
          </button>
        </div>
      </div>

      {wizardStep === 'content-type' && (
        <div className="course-wizard-step">
          <div className="course-wizard-card-grid">
            <button
              type="button"
              className="course-wizard-card"
              onClick={() => onSelectWizardPath('module')}
            >
              <h3>Tạo chương (Module/Chapter)</h3>
              <p>Tạo chương học và bài học (Video/Bài đọc).</p>
              <span className="course-wizard-card-action">Chọn</span>
            </button>
            <button
              type="button"
              className="course-wizard-card"
              onClick={() => onSelectWizardPath('standalone')}
            >
              <h3>Tạo bài kiểm tra rời</h3>
              <p>Quiz trắc nghiệm hoặc bài viết, không thuộc chương (cần backend hỗ trợ lưu).</p>
              <span className="course-wizard-card-action">Chọn</span>
            </button>
          </div>
        </div>
      )}

      {wizardStep === 'chapter' && wizardPath === 'module' && (
        <div className="course-wizard-step">
          <ChapterInfo
            selectedChapter={selectedChapter}
            onUpdateLesson={onUpdateLesson}
            onSaveChapter={onSaveChapter}
            onCancelChapter={onCancelChapter}
            lessonError={lessonError}
            isLoading={isSavingLesson}
            isNewChapter={selectedChapter?.isNew ?? false}
          />
        </div>
      )}

      {wizardStep === 'lesson' && wizardPath === 'module' && (
        <div className="course-wizard-step">
          <LessonDetails
            key={selectedLessonId ?? 'new'}
            selectedLesson={selectedLesson}
            selectedChapterId={selectedChapterId}
            onSave={onSaveLesson}
            onCancel={() => {
              onCancelLesson();
              onSetWizardStep('chapter');
            }}
            onEdit={() => {}}
            onCancelEdit={() => {}}
            isLoading={isSavingLesson}
            isNewLesson
            isEditing
            onUpdateModuleLesson={onUpdateModuleLesson}
            selectedLessonId={selectedLessonId}
            allowedLessonTypes={['VIDEO', 'TEXT']}
          />
        </div>
      )}

      {wizardStep === 'module-finish' && wizardPath === 'module' && (
        <div className="course-wizard-step course-wizard-finish">
          <h3>Đã tạo chương và bài học đầu tiên!</h3>
          <p>Bạn có thể tiếp tục tạo thêm nội dung hoặc chuyển sang quản lý chi tiết.</p>
          <div className="course-wizard-finish-actions">
            <button
              type="button"
              className="course-action-btn"
              onClick={() => {
                onSelectWizardPath('module');
              }}
            >
              Tạo chương mới
            </button>
            <button
              type="button"
              className="course-action-btn"
              onClick={() => {
                onSetWizardStep('lesson');
                onAddLessonItem();
              }}
            >
              Tạo bài học khác
            </button>
            <button type="button" className="course-action-btn primary" onClick={onGoToContent}>
              Sang trang quản lý
            </button>
          </div>
        </div>
      )}

      {wizardStep === 'standalone-title' && wizardPath === 'standalone' && (
        <div className="course-wizard-step">
          <div className="course-wizard-form">
            <label className="course-label">TIÊU ĐỀ BÀI KIỂM TRA</label>
            <input
              className="course-input"
              type="text"
              placeholder="VD: Kiểm tra giữa kỳ - Phần nghe"
              value={standaloneTitle}
              onChange={(e) => setStandaloneTitle(e.target.value)}
            />
            <div className="course-wizard-actions-inline">
              <button type="button" className="course-action-btn" onClick={onGoToContent}>
                Bỏ qua
              </button>
              <button
                type="button"
                className="course-action-btn primary"
                onClick={() => {
                  if (!standaloneTitle.trim()) {
                    setImportError('Vui lòng nhập tiêu đề bài kiểm tra.');
                    return;
                  }
                  setImportError('');
                    onSetWizardStep('standalone-content');
                }}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {wizardStep === 'standalone-content' && wizardPath === 'standalone' && (
        <div className="course-wizard-step">
          <div className="course-wizard-form">
            <label className="course-label">LOẠI BÀI KIỂM TRA</label>
            <div className="course-wizard-type-toggle">
              <button
                type="button"
                className={`course-wizard-pill ${standaloneType === 'QUIZ' ? 'is-active' : ''}`}
                onClick={() => setStandaloneType('QUIZ')}
              >
                Trắc nghiệm (MC/Quiz)
              </button>
              <button
                type="button"
                className={`course-wizard-pill ${standaloneType === 'ESSAY' ? 'is-active' : ''}`}
                onClick={() => setStandaloneType('ESSAY')}
              >
                Bài viết (Essay)
              </button>
            </div>

            {standaloneType === 'QUIZ' ? (
              <div className="course-wizard-quiz">
                <label className="course-label">TIÊU ĐỀ ĐỀ TRẮC NGHIỆM</label>
                <input
                  className="course-input"
                  type="text"
                  placeholder="VD: Bài kiểm tra số 1"
                  value={standaloneQuizTitle}
                  onChange={(e) => setStandaloneQuizTitle(e.target.value)}
                />
                <div className="course-wizard-import">
                  <div>
                    <p className="course-wizard-import-title">Import Excel (tùy chọn)</p>
                    <p className="course-wizard-import-subtitle">
                      File gồm 25 câu hỏi, các cột: Question, Answer1-4, CorrectIndex (1-4).
                    </p>
                  </div>
                  <label className="course-wizard-import-btn">
                    <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} />
                    Chọn file Excel
                  </label>
                </div>
                {importInfo && <p className="course-success">{importInfo}</p>}
                {importError && <p className="course-error">{importError}</p>}

                <div className="course-wizard-question-list">
                  {quizQuestions.map((question, qIndex) => (
                    <div key={question.id} className="course-wizard-question">
                      <div className="course-wizard-question-header">
                        <span>Câu {qIndex + 1}</span>
                        <button
                          type="button"
                          className="course-wizard-question-delete"
                          onClick={() => handleRemoveQuestion(question.id)}
                        >
                          Xóa
                        </button>
                      </div>
                      <textarea
                        className="course-textarea"
                        rows={3}
                        placeholder="Nhập nội dung câu hỏi..."
                        value={question.question}
                        onChange={(e) => handleUpdateQuestion(question.id, 'question', e.target.value)}
                      />
                      <div className="course-wizard-answers">
                        {question.answers.map((answer, index) => (
                          <div key={`${question.id}-${index}`} className="course-wizard-answer">
                            <button
                              type="button"
                              className={`course-wizard-answer-radio ${question.correctIndex === index ? 'is-active' : ''}`}
                              onClick={() => handleSetCorrectAnswer(question.id, index)}
                            >
                              {question.correctIndex === index ? 'Đúng' : ''}
                            </button>
                            <input
                              className="course-input"
                              type="text"
                              placeholder={`Đáp án ${index + 1}`}
                              value={answer}
                              onChange={(e) => handleUpdateAnswer(question.id, index, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="course-outline-btn" onClick={handleAddQuestion}>
                  + Thêm câu hỏi
                </button>
              </div>
            ) : (
              <div className="course-wizard-essay">
                <label className="course-label">NỘI DUNG ĐỀ BÀI</label>
                <textarea
                  className="course-textarea"
                  rows={6}
                  placeholder="Nhập nội dung câu hỏi/đề bài viết..."
                  value={standaloneEssayPrompt}
                  onChange={(e) => setStandaloneEssayPrompt(e.target.value)}
                />
                {importError && <p className="course-error">{importError}</p>}
              </div>
            )}

            <div className="course-wizard-actions-inline">
              <button type="button" className="course-action-btn" onClick={() => onSetWizardStep('standalone-title')}>
                Quay lại
              </button>
              <button type="button" className="course-action-btn primary" onClick={handleSubmitStandalone}>
                Tạo bài kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}

      {wizardStep === 'standalone-finish' && wizardPath === 'standalone' && (
        <div className="course-wizard-step course-wizard-finish">
          <h3>Đã tạo bài kiểm tra rời!</h3>
          <p>Bạn có thể tiếp tục tạo thêm bài kiểm tra hoặc chuyển sang trang quản lý.</p>
          <div className="course-wizard-finish-actions">
            <button
              type="button"
              className="course-action-btn"
              onClick={() => {
                setStandaloneTitle('');
                setStandaloneQuizTitle('');
                setStandaloneEssayPrompt('');
                setQuizQuestions([createEmptyQuestion()]);
                onSetWizardStep('standalone-title');
              }}
            >
              Tạo bài kiểm tra khác
            </button>
            <button type="button" className="course-action-btn primary" onClick={onGoToContent}>
              Sang trang quản lý
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentWizard;
