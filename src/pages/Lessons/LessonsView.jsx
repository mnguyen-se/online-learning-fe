import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/Header/header";
import { useAuth } from "../../hooks/useAuth";
import { getLearningProcess } from "../../api/learningProcessApi";
import { getModulesByCourse } from "../../api/module";
import {
  getCachedCourseDetail,
  getCachedCourseStructure,
  getCachedLearningProcess,
  getCachedLessonView,
  invalidateCachedMyCourses,
  invalidateCachedLearningProcess,
  setCachedCourseStructure,
  setCachedLearningProcess,
  setCachedLessonView,
} from "../../api/learningCache";
import { runWithRetry } from "../../api/requestRetry";
import {
  completeLessonById,
  getAiLessonHint,
  getAiLessonQuiz,
  getLessonView,
} from "../../api/lessionApi";
import "./LessonsView.css";

const LessonVideoContent = lazy(() => import("./LessonVideoContent"));
const LessonQuizContent = lazy(() => import("./LessonQuizContent"));

const idToKey = (value) => String(value ?? "");

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

const getLessonOrder = (lesson) =>
  Number(lesson?.orderIndex ?? lesson?.order_index ?? 0);

const getModuleOrder = (module) =>
  Number(module?.orderIndex ?? module?.order_index ?? 0);

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
  return new Set(list.map((id) => idToKey(id)).filter((id) => id !== ""));
};

const getCompletedLessonSetWithFallback = (process, orderedLessons) => {
  const explicitSet = getCompletedLessonIdSet(process);
  if (explicitSet.size > 0) return explicitSet;

  const lessons = Array.isArray(orderedLessons) ? orderedLessons : [];
  if (lessons.length === 0) return explicitSet;

  const isFullyCompleted =
    process?.completed === true ||
    process?.status === "COMPLETED" ||
    process?.status === "FINISHED" ||
    process?.status === "DONE";
  if (isFullyCompleted) {
    return new Set(lessons.map((lesson) => idToKey(resolveLessonId(lesson))));
  }

  const completedTasks = Number(
    process?.completedTasks ?? process?.completedCount ?? 0
  );
  if (!Number.isFinite(completedTasks) || completedTasks <= 0)
    return explicitSet;

  const limit = Math.min(
    Math.max(0, Math.floor(completedTasks)),
    lessons.length
  );
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
      .filter(
        (lesson) => idToKey(resolveLessonModuleId(lesson)) === idToKey(moduleId)
      )
      .sort((a, b) => {
        const orderDiff = getLessonOrder(a) - getLessonOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return String(resolveLessonId(a)).localeCompare(
          String(resolveLessonId(b))
        );
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
      (lesson) => idToKey(resolveLessonId(lesson)) === currentKey
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
    (lesson) => !completedSet.has(idToKey(resolveLessonId(lesson)))
  );
  return resolveLessonId(nextIncomplete) ?? null;
};

const clampPercent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const getLessonViewWithCache = async () => {
  const cached = getCachedLessonView();
  if (Array.isArray(cached) && cached.length > 0) return cached;
  const response = await runWithRetry(() => getLessonView(), {
    retries: 1,
    baseDelayMs: 500,
  });
  const lessons = normalizeArrayResponse(response);
  setCachedLessonView(lessons);
  return lessons;
};

const getCourseStructureWithCache = async (courseId) => {
  const cached = getCachedCourseStructure(courseId);
  if (cached?.modules && cached?.lessons) return cached;

  const [modulesRes, allLessons] = await Promise.all([
    runWithRetry(() => getModulesByCourse(courseId), {
      retries: 1,
      baseDelayMs: 500,
    }).catch(() => []),
    getLessonViewWithCache().catch(() => []),
  ]);
  const modules = normalizeArrayResponse(modulesRes);
  const orderedLessons = getOrderedLessonsByCourse(modules, allLessons);
  const structure = { modules, lessons: orderedLessons };
  setCachedCourseStructure(courseId, structure);
  return structure;
};

const getLearningProcessWithCache = async (courseId, options = {}) => {
  const { force = false } = options;
  if (!force) {
    const cached = getCachedLearningProcess(courseId);
    if (cached) return cached;
  }
  try {
    const process = await runWithRetry(() => getLearningProcess(courseId), {
      retries: 1,
      baseDelayMs: 500,
    });
    if (process && typeof process === "object") {
      setCachedLearningProcess(courseId, process);
    }
    return process ?? getCachedLearningProcess(courseId) ?? null;
  } catch {
    return getCachedLearningProcess(courseId) ?? null;
  }
};

function LessonsView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const { role } = useAuth();
  const isCourseLearningMode = Boolean(courseId);
  const canUseAiHint =
    isCourseLearningMode && (role === "STUDENT" || role === "ADMIN");

  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [learningProcess, setLearningProcess] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [aiHintByLesson, setAiHintByLesson] = useState({});
  const [hintErrorByLesson, setHintErrorByLesson] = useState({});
  const [hintLoadingLessonKey, setHintLoadingLessonKey] = useState("");
  const [quizHtml, setQuizHtml] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");

  const selectedLessonKey = idToKey(resolveLessonId(selectedLesson));
  const selectedLessonHint = aiHintByLesson[selectedLessonKey] || "";
  const selectedLessonHintError = hintErrorByLesson[selectedLessonKey] || "";
  const isHintLoading = hintLoadingLessonKey === selectedLessonKey;
  const completedLessonSet = useMemo(
    () => getCompletedLessonSetWithFallback(learningProcess, lessons),
    [learningProcess, lessons]
  );
  const selectedLessonCompleted = useMemo(() => {
    if (!selectedLesson) return false;
    return completedLessonSet.has(idToKey(resolveLessonId(selectedLesson)));
  }, [completedLessonSet, selectedLesson]);
  const progressSnapshot = useMemo(() => {
    const totalFromProcess = Number(
      learningProcess?.totalTasks ?? lessons.length ?? 0
    );
    const safeTotal =
      Number.isFinite(totalFromProcess) && totalFromProcess > 0
        ? Math.floor(totalFromProcess)
        : lessons.length;
    const completedFromProcess = Number(
      learningProcess?.completedTasks ?? learningProcess?.completedCount ?? 0
    );
    let safeCompleted =
      completedLessonSet.size > 0
        ? completedLessonSet.size
        : Number.isFinite(completedFromProcess)
        ? Math.max(0, Math.floor(completedFromProcess))
        : 0;
    if (safeTotal > 0) {
      safeCompleted = Math.min(safeCompleted, safeTotal);
    }
    const safePercent =
      safeTotal > 0
        ? clampPercent((safeCompleted / safeTotal) * 100)
        : clampPercent(learningProcess?.progressPercent ?? 0);

    const rawPercent = clampPercent(
      learningProcess?.progressPercent ?? safePercent
    );
    const rebuilt =
      safeTotal > 0 &&
      (rawPercent !== safePercent ||
        (Number.isFinite(completedFromProcess) &&
          Math.floor(completedFromProcess) !== safeCompleted));

    return {
      total: safeTotal,
      completed: safeCompleted,
      percent: safePercent,
      rebuilt,
    };
  }, [completedLessonSet, learningProcess, lessons.length]);

  const nextLesson = useMemo(() => {
    if (!selectedLesson) return null;
    const selectedId = idToKey(resolveLessonId(selectedLesson));
    const currentIndex = lessons.findIndex(
      (lesson) => idToKey(resolveLessonId(lesson)) === selectedId
    );
    if (currentIndex < 0 || currentIndex + 1 >= lessons.length) return null;
    return lessons[currentIndex + 1];
  }, [lessons, selectedLesson]);

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (isCourseLearningMode) {
        const [structure, process] = await Promise.all([
          getCourseStructureWithCache(courseId),
          getLearningProcessWithCache(courseId),
        ]);
        const orderedLessons = Array.isArray(structure?.lessons)
          ? structure.lessons
          : [];
        setLearningProcess(process);
        setLessons(orderedLessons);
        setCourseDetail(getCachedCourseDetail(courseId));

        const routeLesson = orderedLessons.find(
          (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(lessonId)
        );
        if (routeLesson) {
          setSelectedLesson(routeLesson);
          return;
        }

        const resumeLessonId = resolveResumeLessonId(orderedLessons, process);
        const fallbackLessonId =
          resumeLessonId ?? resolveLessonId(orderedLessons[0]) ?? null;
        const fallbackLesson = orderedLessons.find(
          (lesson) =>
            idToKey(resolveLessonId(lesson)) === idToKey(fallbackLessonId)
        );
        setSelectedLesson(fallbackLesson ?? null);
        if (fallbackLessonId) {
          navigate(`/course/${courseId}/learn/${fallbackLessonId}`, {
            replace: true,
          });
        }
        return;
      }

      const lessonsData = [...(await getLessonViewWithCache())].sort(
        (a, b) => getLessonOrder(a) - getLessonOrder(b)
      );
      setLessons(lessonsData);
      setCourseDetail(null);

      const routeLesson = lessonsData.find(
        (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(lessonId)
      );
      setSelectedLesson(routeLesson ?? null);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh sách bài học.";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Load lessons error:", err);
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
      (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(lessonId)
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
      toast.info("Bài học này đã được hoàn thành.");
      return;
    }
    try {
      setIsCompleting(true);
      await runWithRetry(() => completeLessonById(selectedId), {
        retries: 1,
        baseDelayMs: 500,
      });
      invalidateCachedMyCourses();
      toast.success("Đã đánh dấu hoàn thành bài học.");
      invalidateCachedLearningProcess(courseId);
      const latestProcess = await getLearningProcessWithCache(courseId, {
        force: true,
      });
      if (latestProcess) {
        setLearningProcess(latestProcess);
      }
      if (nextLesson) {
        handleSelectLesson(nextLesson);
      } else {
        toast.info("Bạn đã hoàn thành toàn bộ bài học trong khóa này.");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Không thể cập nhật trạng thái hoàn thành.";
      toast.error(message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGenerateAiHint = async (options = {}) => {
    const { force = false } = options;
    if (!canUseAiHint || !selectedLesson) return;
    const selectedId = resolveLessonId(selectedLesson);
    const lessonKey = idToKey(selectedId);
    if (!selectedId || !lessonKey) return;
    if (!force && aiHintByLesson[lessonKey]) return;

    try {
      setHintLoadingLessonKey(lessonKey);
      setHintErrorByLesson((prev) => ({ ...prev, [lessonKey]: "" }));
      const hintText = await runWithRetry(() => getAiLessonHint(selectedId), {
        retries: 0,
        baseDelayMs: 500,
      });
      const normalizedHint =
        typeof hintText === "string" ? hintText.trim() : "";
      setAiHintByLesson((prev) => ({
        ...prev,
        [lessonKey]:
          normalizedHint || "AI chưa tạo được gợi ý cho bài học này.",
      }));
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Không thể tạo AI hint cho bài học này.";
      setHintErrorByLesson((prev) => ({ ...prev, [lessonKey]: message }));
      toast.error(message);
    } finally {
      setHintLoadingLessonKey((current) =>
        current === lessonKey ? "" : current
      );
    }
  };

  const handleOpenAiQuiz = async () => {
    if (!canUseAiHint || !selectedLesson) return;
    const selectedId = resolveLessonId(selectedLesson);
    if (!selectedId) return;
    try {
      setQuizLoading(true);
      setQuizError("");
      setQuizHtml("");
      const html = await runWithRetry(() => getAiLessonQuiz(selectedId), {
        retries: 0,
        baseDelayMs: 500,
      });
      setQuizHtml(typeof html === "string" ? html : "");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Không thể tải Quiz Practice. Vui lòng thử lại.";
      setQuizError(message);
      toast.error(message);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleCloseQuizModal = () => {
    setQuizHtml("");
    setQuizError("");
  };

  const renderLessonContent = (lesson) => {
    const lessonType = lesson.lessonType || "VIDEO";
    const videoSource = lesson.videoUrl || lesson.contentUrl || "";
    const textSource = lesson.textContent || lesson.contentUrl || "";
    const quizSource =
      lesson.contentUrl || lesson.textContent || lesson.videoUrl || "";

    if (lessonType === "VIDEO") {
      return (
        <Suspense fallback={<div className="lesson-content-skeleton" />}>
          <LessonVideoContent title={lesson.title} videoSource={videoSource} />
        </Suspense>
      );
    }

    if (lessonType === "TEXT") {
      return (
        <div className="lesson-content-text">
          <div className="lesson-text-content">
            {textSource ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: textSource.replace(/\n/g, "<br />"),
                }}
              />
            ) : (
              <p className="lesson-content-placeholder">
                Chưa có nội dung văn bản
              </p>
            )}
          </div>
        </div>
      );
    }

    if (lessonType === "QUIZ") {
      const quizQuestions = parseQuizContent(quizSource);
      return (
        <Suspense fallback={<div className="lesson-content-skeleton" />}>
          <LessonQuizContent quizQuestions={quizQuestions} />
        </Suspense>
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
          <div className="lessons-header">
            <div className="loading-skeleton skeleton-title" />
            <div className="loading-skeleton skeleton-subtitle" />
          </div>
          <div className="lessons-layout">
            <div className="lessons-sidebar">
              <div className="loading-skeleton skeleton-sidebar-title" />
              <div className="loading-skeleton skeleton-lesson-row" />
              <div className="loading-skeleton skeleton-lesson-row" />
              <div className="loading-skeleton skeleton-lesson-row" />
              <div className="loading-skeleton skeleton-lesson-row" />
            </div>
            <div className="lessons-main">
              <div className="loading-skeleton skeleton-main-title" />
              <div className="loading-skeleton skeleton-main-meta" />
              <div className="loading-skeleton skeleton-main-content" />
            </div>
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
            <button
              onClick={loadLessons}
              className="retry-button"
              type="button"
            >
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
              onClick={() => navigate("/my-courses")}
            >
              ← Quay lại Khóa học của tôi
            </button>
          ) : null}
          <h1 className="lessons-title">
            {isCourseLearningMode
              ? courseDetail?.title || "Học khóa học"
              : "Danh sách Bài học"}
          </h1>
          <p className="lessons-subtitle">
            {isCourseLearningMode
              ? courseDetail?.description ||
                "Tiếp tục từ vị trí đang học của bạn"
              : "Xem và học các bài học đã được công bố"}
          </p>
          {isCourseLearningMode ? (
            <div className="learning-process-summary">
              <span>Tiến độ: {progressSnapshot.percent}%</span>
              <span>
                {progressSnapshot.completed}/{progressSnapshot.total} bài học
              </span>
              <span>
                Trạng thái: {learningProcess?.status || "IN_PROGRESS"}
              </span>
              {progressSnapshot.rebuilt ? (
                <span>Tiến độ đã được hiệu chỉnh</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="lessons-layout">
          <div className="lessons-sidebar">
            <h2 className="lessons-sidebar-title">
              Bài học ({lessons.length})
            </h2>
            {lessons.length === 0 ? (
              <div className="lessons-empty">
                <p>Chưa có bài học nào được công bố</p>
              </div>
            ) : (
              <div className="lessons-list">
                {lessons.map((lesson, index) => {
                  const lessonKey =
                    idToKey(resolveLessonId(lesson)) || String(index);
                  const isCompleted = completedLessonSet.has(lessonKey);
                  return (
                    <div
                      key={lessonKey}
                      className={`lesson-item ${
                        selectedLessonKey === lessonKey ? "active" : ""
                      } ${isCompleted ? "completed" : ""}`}
                      onClick={() => handleSelectLesson(lesson)}
                    >
                      <div className="lesson-item-number">{index + 1}</div>
                      <div className="lesson-item-content">
                        <div className="lesson-item-title">
                          {lesson.title || "Chưa có tiêu đề"}
                        </div>
                        <div className="lesson-item-type">
                          {lesson.lessonType === "VIDEO" && "📹 Video"}
                          {lesson.lessonType === "TEXT" && "📄 Văn bản"}
                          {lesson.lessonType === "QUIZ" && "❓ Trắc nghiệm"}
                          {isCompleted ? " • ✅ Đã hoàn thành" : ""}
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
                  <h2 className="lesson-detail-title">
                    {selectedLesson.title || "Chưa có tiêu đề"}
                  </h2>
                  <div className="lesson-detail-meta">
                    <span className="lesson-type-badge">
                      {selectedLesson.lessonType === "VIDEO" &&
                        "Video Bài giảng"}
                      {selectedLesson.lessonType === "TEXT" && "Tài liệu đọc"}
                      {selectedLesson.lessonType === "QUIZ" && "Trắc nghiệm"}
                    </span>
                    {selectedLesson.sectionTitle ? (
                      <span className="lesson-section-badge">
                        {selectedLesson.sectionTitle}
                      </span>
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
                          ? "Đã hoàn thành"
                          : isCompleting
                          ? "Đang cập nhật..."
                          : "Đánh dấu hoàn thành"}
                      </button>
                      <button
                        className="lesson-next-btn"
                        type="button"
                        disabled={!nextLesson}
                        onClick={() =>
                          nextLesson && handleSelectLesson(nextLesson)
                        }
                      >
                        Bài tiếp theo
                      </button>
                      {canUseAiHint ? (
                        <>
                          <button
                            className="lesson-hint-btn"
                            type="button"
                            disabled={isHintLoading}
                            onClick={() =>
                              handleGenerateAiHint({
                                force:
                                  Boolean(selectedLessonHint) ||
                                  Boolean(selectedLessonHintError),
                              })
                            }
                          >
                            {isHintLoading
                              ? "AI đang tạo gợi ý..."
                              : selectedLessonHintError
                              ? "Thử lại AI Hint"
                              : selectedLessonHint
                              ? "Tạo lại AI Hint"
                              : "Lấy AI Hint"}
                          </button>
                          <button
                            className="lesson-quiz-practice-btn"
                            type="button"
                            disabled={quizLoading}
                            onClick={handleOpenAiQuiz}
                          >
                            {quizLoading
                              ? "Đang tải Quiz..."
                              : "Làm Quiz Practice"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="lesson-detail-content">
                  {renderLessonContent(selectedLesson)}
                  {canUseAiHint ? (
                    <div className="lesson-ai-hint-panel">
                      <h3 className="lesson-ai-hint-title">
                        AI Hint cho bài học
                      </h3>
                      {isHintLoading ? (
                        <p className="lesson-ai-hint-loading">
                          AI đang phân tích nội dung bài học...
                        </p>
                      ) : null}
                      {selectedLessonHintError ? (
                        <p className="lesson-ai-hint-error">
                          {selectedLessonHintError}
                        </p>
                      ) : null}
                      {!isHintLoading && selectedLessonHint ? (
                        <div className="lesson-ai-hint-content">
                          {selectedLessonHint}
                        </div>
                      ) : null}
                      {!isHintLoading &&
                      !selectedLessonHint &&
                      !selectedLessonHintError ? (
                        <p className="lesson-ai-hint-placeholder">
                          Nhấn "Lấy AI Hint" để nhận gợi ý giải thích bài học
                          bằng tiếng Việt.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
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

        {/* Modal Quiz Practice (AI) */}
        {(quizHtml || quizLoading || quizError) && (
          <div
            className="lesson-quiz-modal-overlay"
            role="dialog"
            aria-modal="true"
          >
            <div className="lesson-quiz-modal">
              <div className="lesson-quiz-modal-header">
                <h3 className="lesson-quiz-modal-title">Quiz Practice</h3>
                <button
                  type="button"
                  className="lesson-quiz-modal-close"
                  onClick={handleCloseQuizModal}
                  disabled={quizLoading}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>
              <div className="lesson-quiz-modal-body">
                {quizLoading && (
                  <div className="lesson-quiz-loading">
                    AI đang tạo quiz cho bài học này...
                  </div>
                )}
                {quizError && !quizLoading && (
                  <div className="lesson-quiz-error">{quizError}</div>
                )}
                {quizHtml && !quizLoading && (
                  <iframe
                    title="Quiz Practice"
                    className="lesson-quiz-iframe"
                    srcDoc={quizHtml}
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonsView;
