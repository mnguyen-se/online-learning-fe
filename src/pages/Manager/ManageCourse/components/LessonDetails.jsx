import React, { useEffect, useMemo, useState } from 'react';
import { uploadVideoToCloudinary }
  from "../../../../api/cloudinaryApi";

function getInitialFromLesson(lesson) {
  if (!lesson) {
    return { title: '', lessonType: 'VIDEO', videoUrl: '', contentUrl: '', textContent: '', quizQuestions: [] };
  }
  const lt = lesson.lessonType || 'VIDEO';
  let contentUrl = '';
  let textContent = '';
  if (lt === 'VIDEO') {
    contentUrl = lesson.contentUrl || '';
  } else if (lt === 'TEXT' || lt === 'QUIZ' || lt === 'ASSIGNMENT') {
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
    videoUrl: lesson.videoUrl || '',
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
  allowedLessonTypes,
}) => {
  const initialLesson = useMemo(() => getInitialFromLesson(selectedLesson), [selectedLesson]);
  const availableLessonTypes = useMemo(
    () => (Array.isArray(allowedLessonTypes) && allowedLessonTypes.length > 0
      ? allowedLessonTypes
      : ['VIDEO', 'TEXT']),
    [allowedLessonTypes]
  );
  const normalizedLessonType = availableLessonTypes.includes(initialLesson.lessonType)
    ? initialLesson.lessonType
    : availableLessonTypes[0];
  const [title, setTitle] = useState(() => initialLesson.title);
  const [lessonType, setLessonType] = useState(() => normalizedLessonType);
  const [contentUrl, setContentUrl] = useState(() => initialLesson.contentUrl); const [textContent, setTextContent] = useState(() => initialLesson.textContent);
  const [quizQuestions, setQuizQuestions] = useState(() => initialLesson.quizQuestions);
  const [contentFile, setContentFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(() => initialLesson.videoUrl); // Chỉ dùng cho VIDEO, để preview khi đổi file mới nhưng chưa save
  useEffect(() => {
    setVideoUrl(initialLesson.videoUrl || '');
  }, [initialLesson.videoUrl]);
  const generateQuestionId = () => `${Date.now()}-${Math.random()}`;

  const handleLessonTypeChange = (e) => {
    const next = e.target.value;
    setLessonType(next);
    if (next === 'QUIZ') {
      setQuizQuestions((prev) => (prev.length === 0 ? [{ id: generateQuestionId(), question: '', answers: ['', '', '', ''], correctIndex: 0 }] : prev));
    } else {
      setQuizQuestions([]);
    }
    if (next !== 'VIDEO') {
      setContentFile(null);
    }
  };


  console.log("selectedLesson:", selectedLesson);
  console.log("selectedLesson.videoUrl:", selectedLesson?.videoUrl);
  console.log("videoUrl state:", videoUrl);

  const previewUrl = useMemo(() => {
    if (contentFile) {
      return URL.createObjectURL(contentFile);
    }
    return videoUrl || '';
  }, [contentFile, videoUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedChapterId) {
      alert("Vui lòng chọn chương trước khi thêm bài học.");
      return;
    }

    try {
      let finalVideoUrl = "";
      let finalContentUrl = "";

      // ✅ Upload nếu là VIDEO
      if (lessonType === "VIDEO" && contentFile) {
        finalVideoUrl = await uploadVideoToCloudinary(contentFile);
        console.log("Video URL sau upload:", finalVideoUrl);
      }

      // ✅ TEXT thì dùng contentUrl
      if (lessonType === "TEXT") {
        finalContentUrl = contentUrl;
      }

      const saveData = {
        title,
        lessonType,
        moduleId: selectedChapterId,
        videoUrl: finalVideoUrl,      // 👈 THÊM DÒNG NÀY
        contentUrl: finalContentUrl,
        textContent:
          lessonType === "QUIZ"
            ? JSON.stringify(quizQuestions)
            : textContent || "",
      };

      console.log("Payload gửi BE:", saveData);

      await onSave(saveData);

    } catch (err) {
      console.error(err);
      alert("Upload thất bại");
    }
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
        <p className="lesson-details-subtitle">Cập nhật nội dung bài học.</p>

        <div className="lesson-details-view">
          <div className="lesson-details-header">
            <div className="lesson-details-type-badge">
              {lessonType === 'VIDEO' && 'Video Bài giảng'}
              {lessonType === 'TEXT' && 'Tài liệu đọc'}
              {lessonType === 'QUIZ' && 'Trắc nghiệm (Quizlet Style)'}
              {lessonType === 'ASSIGNMENT' && 'Bài tập'}
            </div>
          </div>

          <div className="lesson-details-field">
            <label className="lesson-details-label">TIÊU ĐỀ BÀI HỌC</label>
            <div className="lesson-details-view-value">{title || 'Chưa có tiêu đề'}</div>
          </div>

          {lessonType === 'VIDEO' && (
            <div className="lesson-details-field">
              <label className="lesson-details-label">VIDEO BÀI GIẢNG</label>

              {videoUrl ? (
                <video
                  className="lesson-details-video"
                  controls
                  src={videoUrl}
                />
              ) : (
                <div className="lesson-details-view-value">
                  Chưa có video.
                </div>
              )}

            </div>
          )}

          {lessonType === 'TEXT' && textContent && (
            <div className="lesson-details-field">
              <label className="lesson-details-label">NỘI DUNG VĂN BẢN</label>
              <div className="lesson-details-view-value lesson-details-view-text">{textContent}</div>
            </div>
          )}

          {lessonType === 'ASSIGNMENT' && textContent && (
            <div className="lesson-details-field">
              <label className="lesson-details-label">YÊU CẦU BÀI TẬP</label>
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
                <path d="M11.3333 2.00001C11.5084 1.82489 11.7163 1.68601 11.9444 1.59123C12.1726 1.49645 12.4164 1.44763 12.6625 1.44763C12.9086 1.44763 13.1524 1.49645 13.3806 1.59123C13.6087 1.68601 13.8166 1.82489 13.9917 2.00001C14.1668 2.17513 14.3057 2.38303 14.4005 2.61115C14.4952 2.83927 14.5441 3.08308 14.5441 3.32918C14.5441 3.57528 14.4952 3.81909 14.4005 4.04721C14.3057 4.27533 14.1668 4.48323 13.9917 4.65835L5.32498 13.325L1.33331 14.6667L2.67498 10.675L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      <p className="lesson-details-subtitle">Cập nhật nội dung bài học.</p>

      <form className="lesson-details-form" onSubmit={handleSubmit}>
        <div className="lesson-details-header">
          <select
            className="lesson-details-type-select"
            value={lessonType}
            onChange={handleLessonTypeChange}
            disabled={isLoading || !isEditMode}
          >
            {availableLessonTypes.includes('VIDEO') && (
              <option value="VIDEO">Video Bài giảng</option>
            )}
            {availableLessonTypes.includes('TEXT') && (
              <option value="TEXT">Tài liệu đọc</option>
            )}
            {availableLessonTypes.includes('QUIZ') && (
              <option value="QUIZ">Trắc nghiệm (Quizlet Style)</option>
            )}
            {availableLessonTypes.includes('ASSIGNMENT') && (
              <option value="ASSIGNMENT">Bài tập</option>
            )}
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
            <label className="lesson-details-label">TẢI VIDEO (MP4)</label>
            <input
              className="lesson-details-input"
              type="file"
              accept="video/mp4,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setContentFile(file);
              }}
              disabled={isLoading}
            />
            {contentFile?.name && (
              <div className="lesson-details-file-name">Đã chọn: {contentFile.name}</div>
            )}
            {!contentFile && contentUrl && (
              <div className="lesson-details-file-name">Đang dùng video hiện tại.</div>
            )}
            {previewUrl && (
              <video className="lesson-details-video" controls src={previewUrl} />
            )}
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

        {lessonType === 'ASSIGNMENT' && (
          <div className="lesson-details-field">
            <label className="lesson-details-label">YÊU CẦU BÀI TẬP</label>
            <textarea
              className="lesson-details-textarea"
              placeholder="Nhập yêu cầu bài tập, thời gian làm bài, thang điểm..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              disabled={isLoading}
              rows={6}
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
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                              <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
            disabled={isLoading || !title.trim() || (lessonType === 'VIDEO' && !contentFile && !contentUrl)}
          >
            {isLoading ? (isNewLesson ? 'Đang tạo...' : 'Đang lưu...') : (isNewLesson ? 'Tạo bài học' : 'Lưu')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonDetails;
