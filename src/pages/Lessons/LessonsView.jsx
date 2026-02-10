import React, { useEffect, useState } from 'react';
import { getLessonView } from '../../api/lessionApi';
import { toast } from 'react-toastify';
import Header from '../../components/Header/header';
import './LessonsView.css';

function LessonsView() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getLessonView();
      
      // Xử lý nhiều format response có thể có
      let lessonsData = [];
      if (Array.isArray(response)) {
        lessonsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        lessonsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        lessonsData = response.data.data;
      }
      
      // Sắp xếp theo orderIndex
      lessonsData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setLessons(lessonsData);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách bài học.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Load lessons error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const parseQuizContent = (content) => {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const renderLessonContent = (lesson) => {
    const lessonType = lesson.lessonType || 'VIDEO';
    const contentUrl = lesson.contentUrl || '';

    if (lessonType === 'VIDEO') {
      // Xử lý embed video từ URL
      let embedUrl = contentUrl;
      if (contentUrl.includes('youtube.com/watch') || contentUrl.includes('youtu.be/')) {
        const videoId = contentUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (contentUrl.includes('youtube.com/embed')) {
        embedUrl = contentUrl;
      }

      return (
        <div className="lesson-content-video">
          {embedUrl ? (
            <iframe
              width="100%"
              height="500"
              src={embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          ) : (
            <div className="lesson-content-placeholder">
              <p>Chưa có video được cung cấp</p>
            </div>
          )}
        </div>
      );
    } else if (lessonType === 'TEXT') {
      return (
        <div className="lesson-content-text">
          <div className="lesson-text-content">
            {contentUrl ? (
              <div dangerouslySetInnerHTML={{ __html: contentUrl.replace(/\n/g, '<br />') }} />
            ) : (
              <p className="lesson-content-placeholder">Chưa có nội dung văn bản</p>
            )}
          </div>
        </div>
      );
    } else if (lessonType === 'QUIZ') {
      const quizQuestions = parseQuizContent(contentUrl);
      return (
        <div className="lesson-content-quiz">
          <h3 className="quiz-title">Câu hỏi trắc nghiệm</h3>
          {quizQuestions.length > 0 ? (
            <div className="quiz-questions">
              {quizQuestions.map((question, index) => (
                <div key={question.id || index} className="quiz-question-item">
                  <div className="quiz-question-number">Câu {index + 1}</div>
                  <div className="quiz-question-text">{question.question || 'Chưa có câu hỏi'}</div>
                  <div className="quiz-answers">
                    {question.answers && Array.isArray(question.answers) ? (
                      question.answers.map((answer, aIndex) => (
                        <div
                          key={aIndex}
                          className={`quiz-answer ${question.correctIndex === aIndex ? 'correct' : ''}`}
                        >
                          <span className="quiz-answer-label">{String.fromCharCode(65 + aIndex)}.</span>
                          <span className="quiz-answer-text">{answer || 'Chưa có đáp án'}</span>
                          {question.correctIndex === aIndex && (
                            <span className="quiz-answer-badge">Đáp án đúng</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>Chưa có đáp án</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="lesson-content-placeholder">Chưa có câu hỏi trắc nghiệm</p>
          )}
        </div>
      );
    }

    return (
      <div className="lesson-content-placeholder">
        <p>Loại bài học không được hỗ trợ</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="lessons-page">
        <Header />
        <div className="lessons-view-container">
          <div className="lessons-loading">
            <p>Đang tải danh sách bài học...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lessons-page">
        <Header />
        <div className="lessons-view-container">
          <div className="lessons-error">
            <p>{error}</p>
            <button onClick={loadLessons} className="retry-button">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lessons-page">
      <Header />
      <div className="lessons-view-container">
        <div className="lessons-header">
          <h1 className="lessons-title">Danh sách Bài học</h1>
          <p className="lessons-subtitle">Xem và học các bài học đã được công bố</p>
        </div>

        <div className="lessons-layout">
          <div className="lessons-sidebar">
            <h2 className="lessons-sidebar-title">Bài học ({lessons.length})</h2>
            {lessons.length === 0 ? (
              <div className="lessons-empty">
                <p>Chưa có bài học nào được công bố</p>
              </div>
            ) : (
              <div className="lessons-list">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.lessonId || lesson.id || index}
                    className={`lesson-item ${selectedLesson?.lessonId === lesson.lessonId ? 'active' : ''}`}
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <div className="lesson-item-number">{index + 1}</div>
                    <div className="lesson-item-content">
                      <div className="lesson-item-title">{lesson.title || 'Chưa có tiêu đề'}</div>
                      <div className="lesson-item-type">
                        {lesson.lessonType === 'VIDEO' && '📹 Video'}
                        {lesson.lessonType === 'TEXT' && '📄 Văn bản'}
                        {lesson.lessonType === 'QUIZ' && '❓ Trắc nghiệm'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lessons-main">
            {selectedLesson ? (
              <div className="lesson-detail">
                <div className="lesson-detail-header">
                  <h2 className="lesson-detail-title">{selectedLesson.title || 'Chưa có tiêu đề'}</h2>
                  <div className="lesson-detail-meta">
                    <span className="lesson-type-badge">
                      {selectedLesson.lessonType === 'VIDEO' && 'Video Bài giảng'}
                      {selectedLesson.lessonType === 'TEXT' && 'Tài liệu đọc'}
                      {selectedLesson.lessonType === 'QUIZ' && 'Trắc nghiệm'}
                    </span>
                    {selectedLesson.sectionTitle && (
                      <span className="lesson-section-badge">{selectedLesson.sectionTitle}</span>
                    )}
                  </div>
                </div>
                <div className="lesson-detail-content">
                  {renderLessonContent(selectedLesson)}
                </div>
              </div>
            ) : (
              <div className="lesson-placeholder">
                <div className="lesson-placeholder-icon">📚</div>
                <h3>Chọn một bài học để xem</h3>
                <p>Nhấp vào một bài học ở bên trái để bắt đầu học</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LessonsView;
