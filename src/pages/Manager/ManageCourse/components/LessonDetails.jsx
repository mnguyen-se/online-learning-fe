import React, { useState, useMemo } from 'react';

function getInitialFromLesson(lesson) {
  if (!lesson) {
    return { title: '', lessonType: 'VIDEO', contentUrl: '', textContent: '', quizQuestions: [] };
  }
  const lt = lesson.lessonType || 'VIDEO';
  let contentUrl = '';
  let textContent = '';
  if (lt === 'VIDEO') {
    contentUrl = lesson.contentUrl || '';
  } else if (lt === 'TEXT' || lt === 'QUIZ') {
    textContent = lesson.textContent || lesson.contentUrl || '';
  } else {
    contentUrl = lesson.contentUrl || '';
    textContent = lesson.textContent || '';
  }
  let quizQuestions = [];
  if (lt === 'QUIZ') {
    try {
      const raw = lesson.textContent || lesson.contentUrl || '';
      const qs = raw ? JSON.parse(raw || '[]') : [];
      if (Array.isArray(qs) && qs.length > 0) {
        quizQuestions = qs.map((q, i) => ({
          id: q.id || `q-${i}`,
          question: q.question || '',
          answers: Array.isArray(q.answers) && q.answers.length === 4 ? q.answers : ['', '', '', ''],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        }));
      } else {
        quizQuestions = [{ id: 'q-0', question: '', answers: ['', '', '', ''], correctIndex: 0 }];
      }
    } catch {
      quizQuestions = [{ id: 'q-0', question: '', answers: ['', '', '', ''], correctIndex: 0 }];
    }
  }
  return {
    title: lesson.title || '',
    lessonType: lt,
    contentUrl,
    textContent,
    quizQuestions,
  };
}

const LessonDetails = ({ 
  selectedLesson, 
  selectedChapterId,
  onSave, 
  onCancel,
  onEdit,
  onCancelEdit,
  isLoading,
  isNewLesson = false,
  isEditing = false,
  onUpdateModuleLesson,
  selectedLessonId,
}) => {
  const [title, setTitle] = useState(() => getInitialFromLesson(selectedLesson).title);
  const [lessonType, setLessonType] = useState(() => getInitialFromLesson(selectedLesson).lessonType);
  const [contentUrl, setContentUrl] = useState(() => getInitialFromLesson(selectedLesson).contentUrl);
  const [textContent, setTextContent] = useState(() => getInitialFromLesson(selectedLesson).textContent);
  const [quizQuestions, setQuizQuestions] = useState(() => getInitialFromLesson(selectedLesson).quizQuestions);

  const generateQuestionId = () => `${Date.now()}-${Math.random()}`;

  const handleLessonTypeChange = (e) => {
    const next = e.target.value;
    setLessonType(next);
    if (next === 'QUIZ') {
      setQuizQuestions((prev) => (prev.length === 0 ? [{ id: generateQuestionId(), question: '', answers: ['', '', '', ''], correctIndex: 0 }] : prev));
    } else {
      setQuizQuestions([]);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: generateQuestionId(),
      question: '',
      answers: ['', '', '', ''],
      correctIndex: 0,
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const handleDeleteQuestion = (questionId) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
  };

  const handleUpdateQuestion = (questionId, field, value) => {
    setQuizQuestions(quizQuestions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const handleUpdateAnswer = (questionId, answerIndex, value) => {
    setQuizQuestions(quizQuestions.map(q => {
      if (q.id === questionId) {
        const newAnswers = [...q.answers];
        newAnswers[answerIndex] = value;
        return { ...q, answers: newAnswers };
      }
      return q;
    }));
  };

  const handleSetCorrectAnswer = (questionId, answerIndex) => {
    setQuizQuestions(quizQuestions.map(q => 
      q.id === questionId ? { ...q, correctIndex: answerIndex } : q
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedChapterId) {
      alert('Vui lòng chọn chương trước khi thêm bài học.');
      return;
    }
    
    const saveData = {
      title,
      lessonType,
      contentUrl,
      textContent,
      moduleId: selectedChapterId,
    };

    // Nếu là QUIZ, lưu questions vào textContent dưới dạng JSON
    if (lessonType === 'QUIZ') {
      saveData.textContent = JSON.stringify(quizQuestions);
    }

    onSave(saveData);
  };

  // Xác định có đang ở edit mode không
  const isEditMode = isEditing || isNewLesson;

  // Parse quiz questions cho view mode (dùng useMemo để tránh impure function trong render)
  const viewQuizQuestions = useMemo(() => {
    if (!selectedLesson || lessonType !== 'QUIZ') {
      return [];
    }
    try {
      const contentToParse = selectedLesson.textContent || selectedLesson.contentUrl || '';
      const questions = contentToParse 
        ? JSON.parse(contentToParse || '[]')
        : [];
      if (Array.isArray(questions) && questions.length > 0) {
        return questions.map(q => ({
          id: q.id || `${q.question || ''}-${q.correctIndex || 0}`,
          question: q.question || '',
          answers: Array.isArray(q.answers) && q.answers.length === 4 ? q.answers : ['', '', '', ''],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        }));
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  }, [selectedLesson, lessonType]);

  // View mode: hiển thị nội dung read-only
  if (!isEditMode && selectedLesson) {

    return (
      <div className="lesson-details">
        <h2 className="lesson-details-title">Chi tiết Bài học</h2>
        <p className="lesson-details-subtitle">Cập nhật nội dung truyền tải và bài tập.</p>

        <div className="lesson-details-view">
          <div className="lesson-details-header">
            <div className="lesson-details-type-badge">
              {lessonType === 'VIDEO' && 'Video Bài giảng'}
              {lessonType === 'TEXT' && 'Tài liệu đọc'}
              {lessonType === 'QUIZ' && 'Trắc nghiệm (Quizlet Style)'}
            </div>
          </div>

          <div className="lesson-details-field">
            <label className="lesson-details-label">TIÊU ĐỀ BÀI HỌC</label>
            <div className="lesson-details-view-value">{title || 'Chưa có tiêu đề'}</div>
          </div>

          {lessonType === 'VIDEO' && contentUrl && (
            <div className="lesson-details-field">
              <label className="lesson-details-label">LINK EMBED VIDEO</label>
              <div className="lesson-details-view-value">
                <a href={contentUrl} target="_blank" rel="noopener noreferrer" className="lesson-details-link">
                  {contentUrl}
                </a>
              </div>
            </div>
          )}

          {lessonType === 'TEXT' && textContent && (
            <div className="lesson-details-field">
              <label className="lesson-details-label">NỘI DUNG VĂN BẢN</label>
              <div className="lesson-details-view-value lesson-details-view-text">{textContent}</div>
            </div>
          )}

          {lessonType === 'QUIZ' && viewQuizQuestions.length > 0 && (
            <div className="lesson-quiz-section">
              <div className="lesson-quiz-header">
                <h3 className="lesson-quiz-title">Bộ câu hỏi kiểm tra</h3>
                <span className="lesson-quiz-badge">{viewQuizQuestions.length} CÂU HỎI</span>
              </div>

              {viewQuizQuestions.map((question, qIndex) => (
                <div key={question.id} className="lesson-quiz-question lesson-quiz-question-view">
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

          <div className="lesson-details-actions">
            <button
              type="button"
              className="lesson-details-btn lesson-details-btn-edit"
              onClick={onEdit}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.3333 2.00001C11.5084 1.82489 11.7163 1.68601 11.9444 1.59123C12.1726 1.49645 12.4164 1.44763 12.6625 1.44763C12.9086 1.44763 13.1524 1.49645 13.3806 1.59123C13.6087 1.68601 13.8166 1.82489 13.9917 2.00001C14.1668 2.17513 14.3057 2.38303 14.4005 2.61115C14.4952 2.83927 14.5441 3.08308 14.5441 3.32918C14.5441 3.57528 14.4952 3.81909 14.4005 4.04721C14.3057 4.27533 14.1668 4.48323 13.9917 4.65835L5.32498 13.325L1.33331 14.6667L2.67498 10.675L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode: hiển thị form có thể chỉnh sửa
  return (
    <div className="lesson-details">
      <h2 className="lesson-details-title">Chi tiết Bài học</h2>
      <p className="lesson-details-subtitle">Cập nhật nội dung truyền tải và bài tập.</p>

      <form className="lesson-details-form" onSubmit={handleSubmit}>
        <div className="lesson-details-header">
          <select
            className="lesson-details-type-select"
            value={lessonType}
            onChange={handleLessonTypeChange}
            disabled={isLoading || !isEditMode}
          >
            <option value="VIDEO">Video Bài giảng</option>
            <option value="TEXT">Tài liệu đọc</option>
            <option value="QUIZ">Trắc nghiệm (Quizlet Style)</option>
          </select>
        </div>

        <div className="lesson-details-field">
          <label className="lesson-details-label">TIÊU ĐỀ BÀI HỌC</label>
          <input
            className="lesson-details-input"
            type="text"
            placeholder="Vui lòng nhập tên bài học"
            value={title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setTitle(newTitle);
              // Cập nhật title của lesson tạm trong sidebar nếu là lesson mới
              if (isNewLesson && onUpdateModuleLesson && selectedLessonId) {
                onUpdateModuleLesson(selectedLessonId, { title: newTitle });
              }
            }}
            disabled={isLoading || !isEditMode}
            required
          />
        </div>

        {lessonType === 'VIDEO' && (
          <div className="lesson-details-field">
            <label className="lesson-details-label">LINK EMBED VIDEO</label>
            <input
              className="lesson-details-input"
              type="url"
              placeholder="Nhập link embed video..."
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        {lessonType === 'TEXT' && (
          <div className="lesson-details-field">
            <label className="lesson-details-label">NỘI DUNG VĂN BẢN</label>
            <textarea
              className="lesson-details-textarea"
              placeholder="Nhập nội dung văn bản..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              disabled={isLoading}
              rows={8}
            />
          </div>
        )}

        {lessonType === 'QUIZ' && (
          <div className="lesson-quiz-section">
            <div className="lesson-quiz-header">
              <h3 className="lesson-quiz-title">Bộ câu hỏi kiểm tra</h3>
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
                    onClick={() => handleDeleteQuestion(question.id)}
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
                    onChange={(e) => handleUpdateQuestion(question.id, 'question', e.target.value)}
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
                          onChange={(e) => handleUpdateAnswer(question.id, aIndex, e.target.value)}
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
              <span>THÊM CÂU HỎI MỚI (QUIZLET STYLE)</span>
            </button>
          </div>
        )}

        <div className="lesson-details-actions">
          <button
            type="button"
            className="lesson-details-btn lesson-details-btn-cancel"
            onClick={isNewLesson ? onCancel : onCancelEdit}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="lesson-details-btn lesson-details-btn-save"
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? (isNewLesson ? 'Đang tạo...' : 'Đang lưu...') : (isNewLesson ? 'Tạo bài học' : 'Lưu')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonDetails;
