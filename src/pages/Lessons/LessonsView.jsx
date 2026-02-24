import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../../components/Header/header';
import { getLearningProcess } from '../../api/learningProcessApi';
import { getModulesByCourse } from '../../api/module';
import { completeLessonById, getLessonView } from '../../api/lessionApi';
import './LessonsView.css';

const idToKey = (value) => String(value ?? '');

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const resolveLessonId = (lesson) =>
  lesson?.lessonId ?? lesson?.id ?? lesson?._id ?? lesson?.lesson_id;

const resolveModuleId = (module) =>
  module?.moduleId ?? module?.id ?? module?._id ?? module?.module_id;

const resolveLessonModuleId = (lesson) =>
  lesson?.moduleId ??
  lesson?.module?.moduleId ??
  lesson?.sectionId ??
  lesson?.section?.id;

const getLessonOrder = (lesson) => Number(lesson?.orderIndex ?? lesson?.order_index ?? 0);

const getModuleOrder = (module) => Number(module?.orderIndex ?? module?.order_index ?? 0);

const getCurrentLessonIdFromProcess = (process) =>
  process?.currentLessonId ??
  process?.currentLesson?.lessonId ??
  process?.currentLesson?.id ??
  process?.lastLessonId ??
  process?.lastLesson?.lessonId ??
  process?.lastLesson?.id ??
  null;

const getCompletedLessonIdSet = (process) => {
  const list =
    process?.completedLessonIds ??
    process?.completedLessons ??
    process?.lessonCompletedIds ??
    process?.completedLessonIdList ??
    [];
  if (!Array.isArray(list)) return new Set();
  return new Set(list.map((id) => idToKey(id)).filter((id) => id !== ''));
};

const getCompletedLessonSetWithFallback = (process, orderedLessons) => {
  const explicitSet = getCompletedLessonIdSet(process);
  if (explicitSet.size > 0) return explicitSet;

  const lessons = Array.isArray(orderedLessons) ? orderedLessons : [];
  if (lessons.length === 0) return explicitSet;

  const isFullyCompleted =
    process?.completed === true ||
    process?.status === 'COMPLETED' ||
    process?.status === 'FINISHED' ||
    process?.status === 'DONE';
  if (isFullyCompleted) {
    return new Set(lessons.map((lesson) => idToKey(resolveLessonId(lesson))));
  }

  const completedTasks = Number(process?.completedTasks ?? process?.completedCount ?? 0);
  if (!Number.isFinite(completedTasks) || completedTasks <= 0) return explicitSet;

  const limit = Math.min(Math.max(0, Math.floor(completedTasks)), lessons.length);
  const inferredSet = new Set();
  for (let index = 0; index < limit; index += 1) {
    inferredSet.add(idToKey(resolveLessonId(lessons[index])));
  }
  return inferredSet;
};

const getOrderedLessonsByCourse = (modules, allLessons) => {
  const sortedModules = [...modules].sort((a, b) => {
    const orderDiff = getModuleOrder(a) - getModuleOrder(b);
    if (orderDiff !== 0) return orderDiff;
    return String(resolveModuleId(a)).localeCompare(String(resolveModuleId(b)));
  });
  const result = [];
  for (const module of sortedModules) {
    const moduleId = resolveModuleId(module);
    if (!moduleId) continue;
    const moduleLessons = allLessons
      .filter((lesson) => idToKey(resolveLessonModuleId(lesson)) === idToKey(moduleId))
      .sort((a, b) => {
        const orderDiff = getLessonOrder(a) - getLessonOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return String(resolveLessonId(a)).localeCompare(String(resolveLessonId(b)));
      });
    result.push(...moduleLessons);
  }
  return result;
};

const resolveResumeLessonId = (orderedLessons, process) => {
  if (!orderedLessons.length) return null;
  const completedSet = getCompletedLessonIdSet(process);
  const currentLessonId = getCurrentLessonIdFromProcess(process);

  if (currentLessonId) {
    const currentKey = idToKey(currentLessonId);
    const currentIndex = orderedLessons.findIndex(
      (lesson) => idToKey(resolveLessonId(lesson)) === currentKey,
    );
    if (currentIndex >= 0) {
      if (!completedSet.has(currentKey)) {
        return resolveLessonId(orderedLessons[currentIndex]);
      }
      if (currentIndex + 1 < orderedLessons.length) {
        return resolveLessonId(orderedLessons[currentIndex + 1]);
      }
    }
  }

  const nextIncomplete = orderedLessons.find(
    (lesson) => !completedSet.has(idToKey(resolveLessonId(lesson))),
  );
  return resolveLessonId(nextIncomplete) ?? null;
};

const clampPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

function LessonsView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const isCourseLearningMode = Boolean(courseId);

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [learningProcess, setLearningProcess] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const selectedLessonKey = idToKey(resolveLessonId(selectedLesson));
  const completedLessonSet = useMemo(
    () => getCompletedLessonSetWithFallback(learningProcess, lessons),
    [learningProcess, lessons],
  );
  const selectedLessonCompleted = useMemo(() => {
    if (!selectedLesson) return false;
    return completedLessonSet.has(idToKey(resolveLessonId(selectedLesson)));
  }, [completedLessonSet, selectedLesson]);
  const progressPercent = useMemo(() => {
    if (!learningProcess) return 0;
    if (typeof learningProcess.progressPercent === 'number') {
      return clampPercent(learningProcess.progressPercent);
    }
    if (
      typeof learningProcess.completedTasks === 'number' &&
      typeof learningProcess.totalTasks === 'number' &&
      learningProcess.totalTasks > 0
    ) {
      return clampPercent((learningProcess.completedTasks / learningProcess.totalTasks) * 100);
    }
    return 0;
  }, [learningProcess]);

  const nextLesson = useMemo(() => {
    if (!selectedLesson) return null;
    const selectedId = idToKey(resolveLessonId(selectedLesson));
    const currentIndex = lessons.findIndex(
      (lesson) => idToKey(resolveLessonId(lesson)) === selectedId,
    );
    if (currentIndex < 0 || currentIndex + 1 >= lessons.length) return null;
    return lessons[currentIndex + 1];
  }, [lessons, selectedLesson]);

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (isCourseLearningMode) {
        const [modulesRes, lessonViewRes, processRes] = await Promise.all([
          getModulesByCourse(courseId).catch(() => []),
          getLessonView().catch(() => []),
          getLearningProcess(courseId).catch(() => null),
        ]);
        const modules = normalizeArrayResponse(modulesRes);
        const allLessons = normalizeArrayResponse(lessonViewRes);
        const orderedLessons = getOrderedLessonsByCourse(modules, allLessons);
        const process = processRes && typeof processRes === 'object' ? processRes : null;
        setLearningProcess(process);
        setLessons(orderedLessons);

        const routeLesson = orderedLessons.find(
          (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(lessonId),
        );
        if (routeLesson) {
          setSelectedLesson(routeLesson);
          return;
        }

        const resumeLessonId = resolveResumeLessonId(orderedLessons, process);
        const fallbackLessonId = resumeLessonId ?? resolveLessonId(orderedLessons[0]) ?? null;
        const fallbackLesson = orderedLessons.find(
          (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(fallbackLessonId),
        );
        setSelectedLesson(fallbackLesson ?? null);
        if (fallbackLessonId) {
          navigate(`/course/${courseId}/learn/${fallbackLessonId}`, { replace: true });
        }
        return;
      }

      const response = await getLessonView();
      const lessonsData = normalizeArrayResponse(response).sort(
        (a, b) => getLessonOrder(a) - getLessonOrder(b),
      );
      setLessons(lessonsData);

      const routeLesson = lessonsData.find(
        (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(lessonId),
      );
      setSelectedLesson(routeLesson ?? null);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách bài học.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Load lessons error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  useEffect(() => {
    if (!lessonId || lessons.length === 0) return;
    const lessonFromRoute = lessons.find(
      (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(lessonId),
    );
    if (lessonFromRoute) {
      setSelectedLesson(lessonFromRoute);
    }
  }, [lessonId, lessons]);

  const parseQuizContent = (content) => {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    if (!isCourseLearningMode || !courseId) return;
    const selectedId = resolveLessonId(lesson);
    if (selectedId) {
      navigate(`/course/${courseId}/learn/${selectedId}`);
    }
  };

  const handleCompleteLesson = async () => {
    if (!isCourseLearningMode || !selectedLesson || !courseId) return;
    const selectedId = resolveLessonId(selectedLesson);
    if (!selectedId) return;
    if (selectedLessonCompleted) {
      toast.info('Bài học này đã được hoàn thành.');
      return;
    }
    try {
      setIsCompleting(true);
      await completeLessonById(selectedId);
      toast.success('Đã đánh dấu hoàn thành bài học.');
      const latestProcess = await getLearningProcess(courseId).catch(() => null);
      if (latestProcess) {
        setLearningProcess(latestProcess);
      }
      if (nextLesson) {
        handleSelectLesson(nextLesson);
      } else {
        toast.info('Bạn đã hoàn thành toàn bộ bài học trong khóa này.');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể cập nhật trạng thái hoàn thành.';
      toast.error(message);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderLessonContent = (lesson) => {
    const lessonType = lesson.lessonType || 'VIDEO';
    const videoSource = lesson.videoUrl || lesson.contentUrl || '';
    const textSource = lesson.textContent || lesson.contentUrl || '';
    const quizSource = lesson.contentUrl || lesson.textContent || lesson.videoUrl || '';

    if (lessonType === 'VIDEO') {
      let embedUrl = videoSource;
      if (videoSource.includes('youtube.com/watch') || videoSource.includes('youtu.be/')) {
        const videoId = videoSource.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoSource.includes('youtube.com/embed')) {
        embedUrl = videoSource;
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
    }

    if (lessonType === 'TEXT') {
      return (
        <div className="lesson-content-text">
          <div className="lesson-text-content">
            {textSource ? (
              <div dangerouslySetInnerHTML={{ __html: textSource.replace(/\n/g, '<br />') }} />
            ) : (
              <p className="lesson-content-placeholder">Chưa có nội dung văn bản</p>
            )}
          </div>
        </div>
      );
    }

    if (lessonType === 'QUIZ') {
      const quizQuestions = parseQuizContent(quizSource);
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
                      question.answers.map((answer, answerIndex) => (
                        <div
                          key={answerIndex}
                          className={`quiz-answer ${question.correctIndex === answerIndex ? 'correct' : ''}`}
                        >
                          <span className="quiz-answer-label">{String.fromCharCode(65 + answerIndex)}.</span>
                          <span className="quiz-answer-text">{answer || 'Chưa có đáp án'}</span>
                          {question.correctIndex === answerIndex && (
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
            <button onClick={loadLessons} className="retry-button" type="button">
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
          {isCourseLearningMode ? (
            <button
              className="back-to-courses-btn"
              type="button"
              onClick={() => navigate('/my-courses')}
            >
              ← Quay lại Khóa học của tôi
            </button>
          ) : null}
          <h1 className="lessons-title">
            {isCourseLearningMode ? 'Học khóa học' : 'Danh sách Bài học'}
          </h1>
          <p className="lessons-subtitle">
            {isCourseLearningMode
              ? 'Tiếp tục từ vị trí đang học của bạn'
              : 'Xem và học các bài học đã được công bố'}
          </p>
          {isCourseLearningMode ? (
            <div className="learning-process-summary">
              <span>Tiến độ: {progressPercent}%</span>
              <span>
                {learningProcess?.completedTasks ?? 0}/{learningProcess?.totalTasks ?? lessons.length} bài
                học
              </span>
              <span>Trạng thái: {learningProcess?.status || 'IN_PROGRESS'}</span>
            </div>
          ) : null}
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
                {lessons.map((lesson, index) => {
                  const lessonKey = idToKey(resolveLessonId(lesson)) || String(index);
                  const isCompleted = completedLessonSet.has(lessonKey);
                  return (
                    <div
                      key={lessonKey}
                      className={`lesson-item ${selectedLessonKey === lessonKey ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => handleSelectLesson(lesson)}
                    >
                      <div className="lesson-item-number">{index + 1}</div>
                      <div className="lesson-item-content">
                        <div className="lesson-item-title">{lesson.title || 'Chưa có tiêu đề'}</div>
                        <div className="lesson-item-type">
                          {lesson.lessonType === 'VIDEO' && '📹 Video'}
                          {lesson.lessonType === 'TEXT' && '📄 Văn bản'}
                          {lesson.lessonType === 'QUIZ' && '❓ Trắc nghiệm'}
                          {isCompleted ? ' • ✅ Đã hoàn thành' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    {selectedLesson.sectionTitle ? (
                      <span className="lesson-section-badge">{selectedLesson.sectionTitle}</span>
                    ) : null}
                  </div>
                  {isCourseLearningMode ? (
                    <div className="lesson-actions">
                      <button
                        className="lesson-complete-btn"
                        type="button"
                        disabled={isCompleting || selectedLessonCompleted}
                        onClick={handleCompleteLesson}
                      >
                        {selectedLessonCompleted
                          ? 'Đã hoàn thành'
                          : isCompleting
                            ? 'Đang cập nhật...'
                            : 'Đánh dấu hoàn thành'}
                      </button>
                      <button
                        className="lesson-next-btn"
                        type="button"
                        disabled={!nextLesson}
                        onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                      >
                        Bài tiếp theo
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="lesson-detail-content">{renderLessonContent(selectedLesson)}</div>
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
