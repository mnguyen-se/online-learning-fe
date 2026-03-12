import React, { Suspense, lazy, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/Header/header";
import { useAuth } from "../../hooks/useAuth";
import { getLearningProcess } from "../../api/learningProcessApi";
import {
  getAssignmentQuestions,
  getWritingQuestions,
  getAssignmentsByCourse,
  getMyAssignments,
  submitQuizAssignment,
  submitWritingAssignment,
  getMyQuizStatus,
  getMyWritingStatus,
} from "../../api/assignmentApi";
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
  getLessonView,
} from "../../api/lessionApi";
import "./LessonsView.css";

const LessonVideoContent = lazy(() => import("./LessonVideoContent"));
const LessonQuizContent = lazy(() => import("./LessonQuizContent"));
const MatchingQuestion = lazy(() => import("./MatchingQuestion"));
const ReorderQuestion = lazy(() => import("./ReorderQuestion"));

const idToKey = (value) => String(value ?? "");
const QUESTIONS_PER_PAGE = 5;

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const resolveLessonId = (lesson) =>
  lesson?.lessonId ?? lesson?.id ?? lesson?._id ?? lesson?.lesson_id;

const resolveAssignmentId = (assignment) =>
  assignment?.assignmentId ??
  assignment?.id ??
  assignment?.assignmentID ??
  assignment?.assignment_id ??
  null;

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

const normalizeAssignmentType = (value) => {
  const raw = (value ?? '').toString().trim().toUpperCase();
  if (raw === 'QUIZ') return 'QUIZ';
  return 'WRITING';
};

const normalizeQuestionType = (value) => {
  const raw = (value ?? '').toString().trim().toUpperCase();
  if (raw === 'REORDER') return 'REORDER';
  if (raw === 'MATCHING') return 'MATCHING';
  if (raw === 'ESSAY_WRITING') return 'ESSAY_WRITING';
  return 'FILL_BLANK';
};

const isAssignmentItem = (item) => item?.isAssignmentItem === true;
const toQuestionKey = (questionId) => String(questionId ?? '');

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

  const lessons = Array.isArray(orderedLessons)
    ? orderedLessons.filter((lesson) => !isAssignmentItem(lesson))
    : [];
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
  const lessonItems = Array.isArray(orderedLessons)
    ? orderedLessons.filter((lesson) => !isAssignmentItem(lesson))
    : [];
  if (!lessonItems.length) return null;
  const completedSet = getCompletedLessonIdSet(process);
  const currentLessonId = getCurrentLessonIdFromProcess(process);

  if (currentLessonId) {
    const currentKey = idToKey(currentLessonId);
    const currentIndex = lessonItems.findIndex(
      (lesson) => idToKey(resolveLessonId(lesson)) === currentKey,
    );
    if (currentIndex >= 0) {
      if (!completedSet.has(currentKey)) {
        return resolveLessonId(lessonItems[currentIndex]);
      }
      if (currentIndex + 1 < lessonItems.length) {
        return resolveLessonId(lessonItems[currentIndex + 1]);
      }
    }
  }

  const nextIncomplete = lessonItems.find(
    (lesson) => !completedSet.has(idToKey(resolveLessonId(lesson))),
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

const mapAssignmentQuestion = (question, index, assignmentId) => {
  const questionId = question?.questionId ?? question?.id ?? null;
  return {
    id: questionId ?? `${assignmentId ?? 'assignment'}-question-${index}`,
    questionId,
    question: question?.questionText ?? question?.question ?? '',
    answers: [
      question?.optionA ?? '',
      question?.optionB ?? '',
      question?.optionC ?? '',
      question?.optionD ?? '',
    ],
    questionType: normalizeQuestionType(question?.questionType),
    items: Array.isArray(question?.items) ? question.items : [],
    columnA: Array.isArray(question?.columnA) ? question.columnA : [],
    columnB: Array.isArray(question?.columnB) ? question.columnB : [],
  };
};

const getAssignmentItemsByCourse = async (courseId) => {
  let assignments = [];
  try {
    const myAssignmentsRes = await runWithRetry(() => getMyAssignments(), {
      retries: 1,
      baseDelayMs: 500,
    });
    const myAssignments = normalizeArrayResponse(myAssignmentsRes);
    assignments = myAssignments.filter(
      (assignment) => idToKey(assignment?.courseId) === idToKey(courseId),
    );
  } catch {
    const courseAssignmentsRes = await runWithRetry(() => getAssignmentsByCourse(courseId), {
      retries: 1,
      baseDelayMs: 500,
    }).catch(() => []);
    assignments = normalizeArrayResponse(courseAssignmentsRes);
  }

  return assignments
    .map((assignment, index) => {
      const assignmentId = resolveAssignmentId(assignment);
      const assignmentType = normalizeAssignmentType(
        assignment?.assignmentType ?? assignment?.testType,
      );
      const assignmentKey = assignmentId ?? `idx-${index + 1}`;
      const rawOrderIndex = Number(assignment?.orderIndex ?? assignment?.order_index ?? index + 1);
      return {
        id: `assignment-${assignmentKey}`,
        lessonId: `assignment-${assignmentKey}`,
        assignmentId,
        isAssignmentItem: true,
        assignmentType,
        lessonType: assignmentType === 'QUIZ' ? 'QUIZ' : 'TEXT',
        title: assignment?.title ?? `Bài tập ${index + 1}`,
        textContent: assignment?.description ?? '',
        contentUrl: '',
        orderIndex: Number.isFinite(rawOrderIndex) ? rawOrderIndex : index + 1,
        questions: [],
        questionsLoaded: false,
        questionsLoading: false,
        questionsError: '',
      };
    })
    .sort((a, b) => getLessonOrder(a) - getLessonOrder(b));
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

const buildInitialAssignmentStatuses = async (items) => {
  const result = {};
  for (const item of items) {
    if (!item?.assignmentId) continue;
    try {
      if (item.assignmentType === 'QUIZ') {
        const status = await getMyQuizStatus(item.assignmentId);
        if (status.state === 'graded' || status.state === 'pending') {
          result[idToKey(item.assignmentId)] = 'SUBMITTED';
        }
      } else if (item.assignmentType === 'WRITING') {
        const status = await getMyWritingStatus(item.assignmentId);
        if (status.state === 'graded' || status.state === 'pending') {
          result[idToKey(item.assignmentId)] = 'SUBMITTED';
        }
      }
    } catch {
      // Bỏ qua lỗi, coi như chưa nộp
    }
  }
  return result;
};

function LessonsView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const { role } = useAuth();
  const isCourseLearningMode = Boolean(courseId);
  const canUseAiHint =
    isCourseLearningMode && (role === "STUDENT" || role === "ADMIN");

  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [learningProcess, setLearningProcess] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [aiHintByLesson, setAiHintByLesson] = useState({});
  const [hintErrorByLesson, setHintErrorByLesson] = useState({});
  const [hintLoadingLessonKey, setHintLoadingLessonKey] = useState("");
  const [assignmentQuestionPage, setAssignmentQuestionPage] = useState(1);
  const [contentTab, setContentTab] = useState('content');
  const [aiHintExpanded, setAiHintExpanded] = useState(false);
  const [quizCurrentQuestion, setQuizCurrentQuestion] = useState(1);

  const selectedLessonKey = idToKey(resolveLessonId(selectedLesson));
  const selectedLessonHint = aiHintByLesson[selectedLessonKey] || "";
  const selectedLessonHintError = hintErrorByLesson[selectedLessonKey] || "";
  const isHintLoading = hintLoadingLessonKey === selectedLessonKey;
  const allLessonsForProgress = useMemo(
    () => [...lessons, ...assignments],
    [lessons, assignments]
  );
  const completedLessonSet = useMemo(
    () =>
      getCompletedLessonSetWithFallback(
        learningProcess,
        allLessonsForProgress
      ),
    [learningProcess, allLessonsForProgress]
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
    const completedFromProgress = Number.isFinite(completedFromProcess)
      ? Math.max(0, Math.floor(completedFromProcess))
      : 0;
    let safeCompleted = Math.max(completedLessonSet.size, completedFromProgress);
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

  const { nextLesson, prevLesson, currentLessonIndex, totalLessons } = useMemo(() => {
    const allItems = [...lessons, ...assignments];
    if (!selectedLesson || allItems.length === 0) {
      return { nextLesson: null, prevLesson: null, currentLessonIndex: 0, totalLessons: allItems.length };
    }
    const selectedId = idToKey(resolveLessonId(selectedLesson));
    const currentIndex = allItems.findIndex(
      (lesson) => idToKey(resolveLessonId(lesson)) === selectedId,
    );
    const next = currentIndex >= 0 && currentIndex + 1 < allItems.length ? allItems[currentIndex + 1] : null;
    const prev = currentIndex > 0 ? allItems[currentIndex - 1] : null;
    return {
      nextLesson: next,
      prevLesson: prev,
      currentLessonIndex: currentIndex >= 0 ? currentIndex + 1 : 0,
      totalLessons: allItems.length,
    };
  }, [lessons, assignments, selectedLesson]);

  const ensureAssignmentQuestionsLoaded = useCallback(
    async (assignmentItem) => {
      if (!assignmentItem || !isAssignmentItem(assignmentItem) || !assignmentItem.assignmentId) {
        return;
      }
      if (assignmentItem.questionsLoaded || assignmentItem.questionsLoading) return;

      const key = idToKey(assignmentItem.assignmentId);

      setLessons((prev) =>
        prev.map((item) => {
          if (!isAssignmentItem(item) || idToKey(item.assignmentId) !== key) {
            return item;
          }
          return {
            ...item,
            questionsLoading: true,
            questionsError: '',
          };
        }),
      );
      setSelectedLesson((prev) => {
        if (!isAssignmentItem(prev) || idToKey(prev.assignmentId) !== key) {
          return prev;
        }
        return {
          ...prev,
          questionsLoading: true,
          questionsError: '',
        };
      });

      try {
        const isQuiz =
          normalizeAssignmentType(
            assignmentItem.assignmentType ?? assignmentItem.testType,
          ) === "QUIZ";
        const questionsRes = await runWithRetry(() => (
          isQuiz
            ? getAssignmentQuestions(assignmentItem.assignmentId)
            : getWritingQuestions(assignmentItem.assignmentId)
        ), {
          retries: 1,
          baseDelayMs: 500,
        });
        const rawQuestions = normalizeArrayResponse(questionsRes);
        const mappedQuestions = rawQuestions.map((question, index) =>
          mapAssignmentQuestion(question, index, assignmentItem.assignmentId),
        );
        setLessons((prev) =>
          prev.map((item) => {
            if (!isAssignmentItem(item) || idToKey(item.assignmentId) !== key) {
              return item;
            }
            return {
              ...item,
              questions: mappedQuestions,
              questionsLoaded: true,
              questionsLoading: false,
              questionsError: '',
            };
          }),
        );
        setSelectedLesson((prev) => {
          if (!isAssignmentItem(prev) || idToKey(prev.assignmentId) !== key) {
            return prev;
          }
          return {
            ...prev,
            questions: mappedQuestions,
            questionsLoaded: true,
            questionsLoading: false,
            questionsError: '',
          };
        });
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || 'Không thể tải câu hỏi bài tập.';
        setLessons((prev) =>
          prev.map((item) => {
            if (!isAssignmentItem(item) || idToKey(item.assignmentId) !== key) {
              return item;
            }
            return {
              ...item,
              questionsLoading: false,
              questionsError: message,
            };
          }),
        );
        setSelectedLesson((prev) => {
          if (!isAssignmentItem(prev) || idToKey(prev.assignmentId) !== key) {
            return prev;
          }
          return {
            ...prev,
            questionsLoading: false,
            questionsError: message,
          };
        });
      }
    },
    [setLessons, setSelectedLesson],
  );

  const getAssignmentStatus = useCallback(
    (assignmentId) => assignmentStatuses[idToKey(assignmentId)] ?? null,
    [assignmentStatuses],
  );

  const getQuizAnswerValue = (assignmentId, questionId) =>
    assignmentDrafts[idToKey(assignmentId)]?.quiz?.[toQuestionKey(questionId)] ?? '';

  const getWritingAnswerValue = (assignmentId, questionId) =>
    assignmentDrafts[idToKey(assignmentId)]?.writing?.[toQuestionKey(questionId)] ?? '';

  const handleQuizAnswerChange = (assignmentId, questionId, answer) => {
    const assignmentKey = idToKey(assignmentId);
    const questionKey = toQuestionKey(questionId);
    setAssignmentDrafts((prev) => ({
      ...prev,
      [assignmentKey]: {
        ...prev[assignmentKey],
        quiz: {
          ...(prev[assignmentKey]?.quiz ?? {}),
          [questionKey]: answer,
        },
      },
    }));
  };

  const handleWritingAnswerChange = (assignmentId, questionId, value) => {
    const assignmentKey = idToKey(assignmentId);
    const questionKey = toQuestionKey(questionId);
    setAssignmentDrafts((prev) => ({
      ...prev,
      [assignmentKey]: {
        ...prev[assignmentKey],
        writing: {
          ...(prev[assignmentKey]?.writing ?? {}),
          [questionKey]: value,
        },
      },
    }));
  };

  const loadLessons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      if (isCourseLearningMode) {
        const [structure, process, assignmentItems] = await Promise.all([
          getCourseStructureWithCache(courseId),
          getLearningProcessWithCache(courseId),
          getAssignmentItemsByCourse(courseId),
        ]);
        const orderedLessons = Array.isArray(structure?.lessons) ? structure.lessons : [];
        const courseModules = Array.isArray(structure?.modules) ? structure.modules : [];
        setLearningProcess(process);
        setModules(courseModules);
        setLessons(orderedLessons);
        setAssignments(assignmentItems);
        if (assignmentItems.length > 0) {
          buildInitialAssignmentStatuses(assignmentItems).then((map) => {
            if (map && Object.keys(map).length > 0) {
              setAssignmentStatuses((prev) => ({ ...prev, ...map }));
            }
          });
        }
        setCourseDetail(getCachedCourseDetail(courseId));

        const allItems = [...orderedLessons, ...assignmentItems];
        const routeLesson = allItems.find(
          (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(lessonId),
        );
        if (routeLesson) {
          setSelectedLesson(routeLesson);
          // Tự động mở module chứa lesson này
          if (!isAssignmentItem(routeLesson)) {
            const lessonModuleId = resolveLessonModuleId(routeLesson);
            if (lessonModuleId) {
              setExpandedModules((prev) => new Set([...prev, idToKey(lessonModuleId)]));
            }
          }
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
        // Tự động mở module chứa lesson đầu tiên
        if (fallbackLesson) {
          const lessonModuleId = resolveLessonModuleId(fallbackLesson);
          if (lessonModuleId) {
            setExpandedModules((prev) => new Set([...prev, idToKey(lessonModuleId)]));
          }
        }
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
  }, [courseId, isCourseLearningMode, lessonId, navigate]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

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
    if (isAssignmentItem(lesson)) {
      ensureAssignmentQuestionsLoaded(lesson);
    }
    if (!isCourseLearningMode || !courseId) return;
    const selectedId = resolveLessonId(lesson);
    if (selectedId) {
      navigate(`/course/${courseId}/learn/${selectedId}`);
    }
    // Tự động mở module chứa lesson được chọn
    if (!isAssignmentItem(lesson)) {
      const lessonModuleId = resolveLessonModuleId(lesson);
      if (lessonModuleId) {
        setExpandedModules((prev) => new Set([...prev, idToKey(lessonModuleId)]));
      }
    }
  };

  const toggleModule = (moduleId) => {
    const moduleKey = idToKey(moduleId);
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey);
      } else {
        newSet.add(moduleKey);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (!isAssignmentItem(selectedLesson)) return;
    ensureAssignmentQuestionsLoaded(selectedLesson);
  }, [selectedLesson, ensureAssignmentQuestionsLoaded]);

  useEffect(() => {
    setAssignmentQuestionPage(1);
    setContentTab('content');
    setAiHintExpanded(false);
    setQuizCurrentQuestion(1);
  }, [selectedLesson]);

  /* Keyboard support cho quiz: 1=A, 2=B, 3=C, 4=D, ←=prev, →=next */
  useEffect(() => {
    const isQuiz =
      selectedLesson &&
      isAssignmentItem(selectedLesson) &&
      selectedLesson.assignmentType === 'QUIZ' &&
      getAssignmentStatus(selectedLesson.assignmentId) !== 'SUBMITTED';
    if (!isQuiz || !Array.isArray(selectedLesson?.questions) || selectedLesson.questions.length === 0) return;

    const questions = selectedLesson.questions;
    const totalCount = questions.length;
    const currentQ = questions[Math.min(Math.max(0, quizCurrentQuestion - 1), totalCount - 1)];

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setQuizCurrentQuestion((p) => Math.min(totalCount, p + 1));
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setQuizCurrentQuestion((p) => Math.max(1, p - 1));
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key) && currentQ?.answers?.length >= Number(e.key)) {
        e.preventDefault();
        const letter = String.fromCharCode(64 + Number(e.key));
        handleQuizAnswerChange(selectedLesson.assignmentId, currentQ.questionId, letter);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLesson, quizCurrentQuestion, getAssignmentStatus]);

  const handleCompleteLesson = async () => {
    if (!isCourseLearningMode || !selectedLesson || !courseId) return;
    if (isAssignmentItem(selectedLesson)) {
      toast.info('Bài tập này không dùng chức năng đánh dấu hoàn thành bài học.');
      return;
    }
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

  const handleSubmitQuizAssignment = async (assignmentItem) => {
    if (!assignmentItem?.assignmentId) return;
    const questions = Array.isArray(assignmentItem.questions) ? assignmentItem.questions : [];
    if (questions.length === 0) {
      toast.info('Bài tập này chưa có câu hỏi.');
      return;
    }

    const answers = [];
    for (const question of questions) {
      const selectedAnswer = getQuizAnswerValue(assignmentItem.assignmentId, question.questionId);
      if (!selectedAnswer) {
        toast.error('Vui lòng chọn đáp án cho tất cả câu hỏi trước khi nộp.');
        return;
      }
      const questionId = Number(question.questionId);
      if (!Number.isFinite(questionId)) {
        toast.error('Không xác định được mã câu hỏi để nộp bài.');
        return;
      }
      answers.push({
        questionId,
        answer: selectedAnswer,
      });
    }

    try {
      setIsSubmittingAssignment(true);
      await runWithRetry(
        () =>
          submitQuizAssignment(assignmentItem.assignmentId, {
            answers,
          }),
        {
          retries: 1,
          baseDelayMs: 500,
        },
      );
      setAssignmentStatuses((prev) => ({
        ...prev,
        [idToKey(assignmentItem.assignmentId)]: 'SUBMITTED',
      }));
      toast.success('Đã nộp bài trắc nghiệm. Bài làm ở trạng thái SUBMITTED.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể nộp bài trắc nghiệm.';
      toast.error(message);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleOpenQuizResult = (assignmentItem) => {
    if (!assignmentItem?.assignmentId) return;
    const lessonKey = resolveLessonId(assignmentItem);
    if (!courseId) {
      navigate(`/quiz-result/${assignmentItem.assignmentId}`);
      return;
    }
    const queryCourse = `courseId=${courseId}`;
    const queryLesson = lessonKey ? `&lessonId=${lessonKey}` : '';
    navigate(
      `/quiz-result/${assignmentItem.assignmentId}?${queryCourse}${queryLesson}`,
      {
        state: {
          courseId,
          lessonId: lessonKey,
        },
      },
    );
  };

  const handleSubmitWritingAssignment = async (assignmentItem) => {
    if (!assignmentItem?.assignmentId) return;
    const questions = Array.isArray(assignmentItem.questions) ? assignmentItem.questions : [];
    if (questions.length === 0) {
      toast.info('Bài tập này chưa có câu hỏi.');
      return;
    }

    const answers = [];
    for (const question of questions) {
      const questionId = Number(question.questionId);
      if (!Number.isFinite(questionId)) {
        toast.error('Không xác định được mã câu hỏi để nộp bài.');
        return;
      }
      const rawValue = getWritingAnswerValue(assignmentItem.assignmentId, question.questionId);
      const questionType = normalizeQuestionType(question.questionType);

      if (questionType === 'REORDER') {
        const orderedItems = rawValue
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '');
        if (orderedItems.length === 0) {
          toast.error('Vui lòng nhập thứ tự sắp xếp cho tất cả câu REORDER.');
          return;
        }
        answers.push({ questionId, orderedItems });
        continue;
      }

      if (questionType === 'MATCHING') {
        const pairs = rawValue
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== '')
          .map((line) => {
            const [aId, bId] = line.split(':').map((value) => value?.trim() ?? '');
            return { aId, bId };
          });
        const hasInvalidPair = pairs.some((pair) => !pair.aId || !pair.bId);
        if (pairs.length === 0 || hasInvalidPair) {
          toast.error('Câu MATCHING cần nhập mỗi dòng theo định dạng aId:bId.');
          return;
        }
        answers.push({ questionId, matchingPairs: pairs });
        continue;
      }

      if (!rawValue || rawValue.trim() === '') {
        toast.error('Vui lòng nhập đáp án cho tất cả câu hỏi tự luận.');
        return;
      }
      answers.push({ questionId, answer: rawValue.trim() });
    }

    try {
      setIsSubmittingAssignment(true);
      await runWithRetry(
        () =>
          submitWritingAssignment(assignmentItem.assignmentId, {
            answers,
          }),
        {
          retries: 1,
          baseDelayMs: 500,
        },
      );
      setAssignmentStatuses((prev) => ({
        ...prev,
        [idToKey(assignmentItem.assignmentId)]: 'SUBMITTED',
      }));
      toast.success('Đã nộp bài writing. Bài làm ở trạng thái SUBMITTED.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể nộp bài writing.';
      toast.error(message);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleOpenWritingResult = (assignmentItem) => {
    if (!assignmentItem?.assignmentId) return;
    const lessonKey = resolveLessonId(assignmentItem);
    if (!courseId) {
      navigate(`/writing-result/${assignmentItem.assignmentId}?submitted=1`);
      return;
    }
    const queryCourse = `courseId=${courseId}`;
    const queryLesson = lessonKey ? `&lessonId=${lessonKey}` : '';
    navigate(
      `/writing-result/${assignmentItem.assignmentId}?submitted=1&${queryCourse}${queryLesson}`,
      {
        state: {
          courseId,
          lessonId: lessonKey,
        },
      },
    );
  };

  const renderAssignmentQuizContent = (assignmentItem) => {
    if (assignmentItem.questionsLoading) {
      return <div className="lesson-content-skeleton" />;
    }
    if (assignmentItem.questionsError) {
      return (
        <div className="assignment-state-box">
          <p>{assignmentItem.questionsError}</p>
          <button
            type="button"
            className="retry-button"
            onClick={() => ensureAssignmentQuestionsLoaded(assignmentItem)}
          >
            Tải lại câu hỏi
          </button>
        </div>
      );
    }

    const questions = Array.isArray(assignmentItem.questions) ? assignmentItem.questions : [];
    if (questions.length === 0) {
      return <p className="lesson-content-placeholder">Bài tập này chưa có câu hỏi.</p>;
    }

    const submissionStatus = getAssignmentStatus(assignmentItem.assignmentId);
    const totalCount = questions.length;
    const answeredCount = questions.filter((q) => {
      const val = getQuizAnswerValue(assignmentItem.assignmentId, q.questionId);
      return val && String(val).trim() !== '';
    }).length;
    const unansweredCount = totalCount - answeredCount;
    const safeCurrent = Math.min(Math.max(1, quizCurrentQuestion), totalCount);
    const currentQuestion = questions[safeCurrent - 1];

    if (submissionStatus === 'SUBMITTED') {
      return (
        <div className="quiz-submitted-state">
          <div className="quiz-submitted-icon">✓</div>
          <h4 className="quiz-submitted-title">Đã nộp bài</h4>
          <p className="quiz-submitted-desc">
            Bài làm của bạn đã được gửi thành công và đang chờ giáo viên chấm điểm.
          </p>
          <div className="quiz-submitted-actions">
            <button
              type="button"
              className="quiz-submitted-view-result-btn"
              onClick={() => handleOpenQuizResult(assignmentItem)}
            >
              Xem kết quả bài làm
            </button>
            {nextLesson && (
              <button
                type="button"
                className="quiz-submitted-next-btn"
                onClick={() => handleSelectLesson(nextLesson)}
              >
                <span>Bài tiếp theo</span>
                <span className="quiz-submitted-next-icon">→</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="quiz-compact">
        {/* Progress: Đã trả lời X/Y câu */}
        <div className="quiz-progress-block">
          <span className="quiz-progress-label">Tiến độ bài kiểm tra</span>
          <span className="quiz-progress-count">Đã trả lời: {answeredCount} / {totalCount} câu</span>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Question + Answers - Navigator đã chuyển sang sidebar phải */}
        <div className="quiz-question-block">
          <div className="quiz-current-label">Câu {safeCurrent} / {totalCount}</div>
          <div className="quiz-question-text">
            {currentQuestion?.question || 'Chưa có câu hỏi'}
          </div>
          <div className="quiz-answers quiz-answers-card">
            {(currentQuestion?.answers || []).map((answer, answerIndex) => {
              const answerLetter = String.fromCharCode(65 + answerIndex);
              const selectedValue = getQuizAnswerValue(
                assignmentItem.assignmentId,
                currentQuestion.questionId,
              );
              const isSelected = selectedValue === answerLetter;
              return (
                <label
                  key={answerLetter}
                  className={`quiz-answer-card ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    className="quiz-answer-radio"
                    name={`quiz-${assignmentItem.assignmentId}-${currentQuestion.questionId}`}
                    value={answerLetter}
                    checked={isSelected}
                    onChange={() =>
                      handleQuizAnswerChange(
                        assignmentItem.assignmentId,
                        currentQuestion.questionId,
                        answerLetter,
                      )}
                  />
                  <span className="quiz-answer-letter">{answerLetter}</span>
                  <span className="quiz-answer-text">{answer || 'Chưa có đáp án'}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom bar: Prev | Next | Submit */}
        <div className="quiz-action-row quiz-action-row-sticky">
          <div className="quiz-nav-buttons">
            <button
              type="button"
              className="quiz-prev-btn"
              disabled={safeCurrent <= 1}
              onClick={() => setQuizCurrentQuestion((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="quiz-next-btn"
              disabled={safeCurrent >= totalCount}
              onClick={() => setQuizCurrentQuestion((p) => Math.min(totalCount, p + 1))}
            >
              Next →
            </button>
          </div>
          {unansweredCount > 0 && (
            <div className="quiz-unanswered-warning">
              ⚠ Bạn còn {unansweredCount} câu chưa trả lời
            </div>
          )}
          <button
            type="button"
            className="quiz-submit-btn"
            disabled={isSubmittingAssignment}
            onClick={() => handleSubmitQuizAssignment(assignmentItem)}
          >
            {isSubmittingAssignment ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </div>
    );
  };

  const renderAssignmentWritingContent = (assignmentItem) => {
    if (assignmentItem.questionsLoading) {
      return <div className="lesson-content-skeleton" />;
    }
    if (assignmentItem.questionsError) {
      return (
        <div className="assignment-state-box">
          <p>{assignmentItem.questionsError}</p>
          <button
            type="button"
            className="retry-button"
            onClick={() => ensureAssignmentQuestionsLoaded(assignmentItem)}
          >
            Tải lại câu hỏi
          </button>
        </div>
      );
    }

    const questions = Array.isArray(assignmentItem.questions) ? assignmentItem.questions : [];
    if (questions.length === 0) {
      return <p className="lesson-content-placeholder">Bài tập này chưa có câu hỏi.</p>;
    }

    const submissionStatus = getAssignmentStatus(assignmentItem.assignmentId);

    if (submissionStatus === 'SUBMITTED') {
      return (
        <div className="quiz-submitted-state">
          <div className="quiz-submitted-icon">✓</div>
          <h4 className="quiz-submitted-title">Đã nộp bài tự luận</h4>
          <p className="quiz-submitted-desc">
            Bài viết của bạn đã được gửi thành công và đang chờ giáo viên chấm điểm.
          </p>
          <div className="quiz-submitted-actions">
            <button
              type="button"
              className="quiz-submitted-view-result-btn"
              onClick={() => handleOpenWritingResult(assignmentItem)}
            >
              Xem kết quả bài làm
            </button>
            {nextLesson && (
              <button
                type="button"
                className="quiz-submitted-next-btn"
                onClick={() => handleSelectLesson(nextLesson)}
              >
                <span>Bài tiếp theo</span>
                <span className="quiz-submitted-next-icon">→</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    const totalCount = questions.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / QUESTIONS_PER_PAGE));
    const safePage = Math.min(Math.max(1, assignmentQuestionPage), totalPages);
    const startIdx = (safePage - 1) * QUESTIONS_PER_PAGE;
    const pageQuestions = questions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);

    return (
      <div className="lesson-content-text">
        <h3 className="quiz-title">Danh sách câu hỏi ({totalCount} câu)</h3>
        {assignmentItem.textContent ? (
          <p className="assignment-question-hint">{assignmentItem.textContent}</p>
        ) : null}
        <div className="quiz-pagination-pages">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`quiz-pagination-page-btn ${p === safePage ? 'active' : ''}`}
              onClick={() => setAssignmentQuestionPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="quiz-questions">
          {pageQuestions.map((question, index) => {
            const globalIndex = startIdx + index;
            const questionType = normalizeQuestionType(question.questionType);
            const answerValue = getWritingAnswerValue(assignmentItem.assignmentId, question.questionId);
            return (
              <div key={question.id || globalIndex} className="quiz-question-item">
                <div className="quiz-question-number">Câu {globalIndex + 1}</div>
                <div className="quiz-question-text">{question.question || 'Chưa có câu hỏi'}</div>
                <div className="assignment-question-type">{questionType}</div>
                {questionType === 'REORDER' ? (
                  <Suspense fallback={<div className="lesson-content-skeleton" />}>
                    <ReorderQuestion
                      question={question}
                      answerValue={answerValue}
                      onChange={(newValue) =>
                        handleWritingAnswerChange(
                          assignmentItem.assignmentId,
                          question.questionId,
                          newValue,
                        )
                      }
                    />
                  </Suspense>
                ) : questionType === 'MATCHING' ? (
                  <Suspense fallback={<div className="lesson-content-skeleton" />}>
                    <MatchingQuestion
                      question={question}
                      answerValue={answerValue}
                      onChange={(newValue) =>
                        handleWritingAnswerChange(
                          assignmentItem.assignmentId,
                          question.questionId,
                          newValue,
                        )
                      }
                    />
                  </Suspense>
                ) : (
                  <textarea
                    className="assignment-writing-input"
                    value={answerValue}
                    placeholder="Nhập câu trả lời của bạn"
                    rows={3}
                    onChange={(event) =>
                      handleWritingAnswerChange(
                        assignmentItem.assignmentId,
                        question.questionId,
                        event.target.value,
                      )
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="quiz-pagination-nav">
          <button
            type="button"
            className="quiz-pagination-prev"
            disabled={safePage <= 1}
            onClick={() => setAssignmentQuestionPage((p) => Math.max(1, p - 1))}
          >
            &lt; Prev
          </button>
          <button
            type="button"
            className="quiz-pagination-next"
            disabled={safePage >= totalPages}
            onClick={() => setAssignmentQuestionPage((p) => Math.min(totalPages, p + 1))}
          >
            Next &gt;
          </button>
        </div>
        <div className="assignment-submit-row">
          <button
            type="button"
            className="assignment-submit-btn"
            disabled={isSubmittingAssignment}
            onClick={() => handleSubmitWritingAssignment(assignmentItem)}
          >
            {isSubmittingAssignment ? 'Đang nộp...' : 'Nộp bài tự luận'}
          </button>
        </div>
      </div>
    );
  };

  const handleGenerateAiHint = async (options = {}) => {
    const { force = false } = options;
    if (!canUseAiHint || !selectedLesson) return;
    const selectedId = resolveLessonId(selectedLesson);
    const lessonKey = idToKey(selectedId);
    if (!selectedId || !lessonKey) return;
    setAiHintExpanded(true);
    if (!force && aiHintByLesson[lessonKey]) return;

    try {
      setHintLoadingLessonKey(lessonKey);
      setHintErrorByLesson((prev) => ({ ...prev, [lessonKey]: "" }));
      const hintText = await runWithRetry(() => getAiLessonHint(selectedId), {
        retries: 0,
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

  const handleOpenAiQuizPage = () => {
    if (!canUseAiHint || !selectedLesson || !courseId) return;
    const selectedId = resolveLessonId(selectedLesson);
    if (!selectedId) return;
    navigate(`/course/${courseId}/learn/${selectedId}/ai-quiz`);
  };

  const renderLessonContent = (lesson) => {
    if (isAssignmentItem(lesson)) {
      if (lesson.assignmentType === "QUIZ") {
        return renderAssignmentQuizContent(lesson);
      }
      return renderAssignmentWritingContent(lesson);
    }

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
              <div className="lesson-empty-state">
                <div className="lesson-empty-icon">📄</div>
                <h4 className="lesson-empty-title">Bài học chưa có nội dung</h4>
                <p className="lesson-empty-desc">Tài liệu sẽ được cập nhật sau.</p>
                <p className="lesson-empty-hint">Bạn có thể xem tài liệu đọc trong tab bên cạnh.</p>
                {lesson.contentUrl ? (
                  <a
                    href={lesson.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lesson-empty-download-btn"
                  >
                    Tải tài liệu đọc
                  </a>
                ) : null}
              </div>
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
        {/* Breadcrumb cho course mode */}
        {isCourseLearningMode ? (
          <nav className="lessons-breadcrumb" aria-label="Breadcrumb">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => navigate("/my-courses")}
            >
              Khóa học của tôi
            </button>
            <span className="breadcrumb-sep"> &gt; </span>
            <span className="breadcrumb-current">
              {courseDetail?.title || "Khóa học"}
            </span>
            {selectedLesson && (
              <>
                <span className="breadcrumb-sep"> &gt; </span>
                <span className="breadcrumb-current">
                  {selectedLesson.title || "Bài học"}
                </span>
              </>
            )}
          </nav>
        ) : (
          <div className="lessons-header">
            <h1 className="lessons-title">Danh sách Bài học</h1>
            <p className="lessons-subtitle">
              Xem và học các bài học đã được công bố
            </p>
          </div>
        )}

        <div className={`lessons-layout ${selectedLesson && isAssignmentItem(selectedLesson) && selectedLesson.assignmentType === 'QUIZ' && Array.isArray(selectedLesson.questions) && selectedLesson.questions.length > 0 ? 'lessons-layout-with-quiz-map' : ''}`}>
          <div className="lessons-sidebar">
            <h2 className="lessons-sidebar-title">
              Bài học ({lessons.length})
            </h2>
            {(isCourseLearningMode
              ? modules.length === 0 &&
                lessons.length === 0 &&
                assignments.length === 0
              : lessons.length === 0) ? (
              <div className="lessons-empty">
                <p>Chưa có bài học nào được công bố</p>
              </div>
            ) : (
              <div className="lessons-list">
                {/* Hiển thị modules và lessons bên trong */}
                {isCourseLearningMode && modules.length > 0 ? (
                  <>
                    {modules
                      .sort((a, b) => getModuleOrder(a) - getModuleOrder(b))
                      .map((module) => {
                        const moduleId = resolveModuleId(module);
                        const moduleKey = idToKey(moduleId);
                        const moduleLessons = lessons.filter(
                          (lesson) => idToKey(resolveLessonModuleId(lesson)) === moduleKey
                        );
                        const isExpanded = expandedModules.has(moduleKey);
                        const moduleTitle = module?.title || module?.moduleTitle || 'Chương chưa có tên';

                        return (
                          <div key={moduleKey} className="module-container">
                            <div
                              className="module-header"
                              onClick={() => toggleModule(moduleId)}
                            >
                              <span className="module-toggle-icon">
                                {isExpanded ? '▾' : '▸'}
                              </span>
                              <span className="module-title">{moduleTitle}</span>
                              <span className="module-lesson-count">({moduleLessons.length})</span>
                            </div>
                            {isExpanded && (
                              <div className="module-lessons">
                                {moduleLessons.length === 0 ? (
                                  <div className="module-empty">Chưa có bài học trong chương này</div>
                                ) : (
                                    moduleLessons.map((lesson, lessonIndex) => {
                                    const lessonKey = idToKey(resolveLessonId(lesson)) || String(lessonIndex);
                                    const isCompleted = completedLessonSet.has(lessonKey);
                                    const isActive = selectedLessonKey === lessonKey;
                                    const statusIcon = isCompleted ? '✓' : isActive ? '●' : '○';
                                    const statusLabel = isCompleted ? 'Hoàn thành' : isActive ? 'Đang học' : 'Chưa học';
                                    return (
                                      <div
                                        key={lessonKey}
                                        className={`lesson-item lesson-item-nested ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectLesson(lesson);
                                        }}
                                      >
                                        <span className={`lesson-item-status lesson-status-${isCompleted ? 'done' : isActive ? 'current' : 'pending'}`} title={statusLabel}>
                                          {statusIcon}
                                        </span>
                                        <div className="lesson-item-content">
                                          <div className="lesson-item-title">{lesson.title || 'Chưa có tiêu đề'}</div>
                                          <div className="lesson-item-type">
                                            {lesson.lessonType === 'VIDEO' && '📹 Video'}
                                            {lesson.lessonType === 'TEXT' && '📄 Văn bản'}
                                            {lesson.lessonType === 'QUIZ' && '❓ Trắc nghiệm'}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </>
                ) : (
                  // Nếu không có modules, hiển thị lessons như cũ (cho trường hợp không phải course learning mode)
                  lessons.map((lesson, index) => {
                    const lessonKey = idToKey(resolveLessonId(lesson)) || String(index);
                    const isCompleted = completedLessonSet.has(lessonKey);
                    const isActive = selectedLessonKey === lessonKey;
                    const statusIcon = isCompleted ? '✓' : isActive ? '●' : '○';
                    const statusLabel = isCompleted ? 'Hoàn thành' : isActive ? 'Đang học' : 'Chưa học';
                    return (
                      <div
                        key={lessonKey}
                        className={`lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                        onClick={() => handleSelectLesson(lesson)}
                      >
                        <span className={`lesson-item-status lesson-status-${isCompleted ? 'done' : isActive ? 'current' : 'pending'}`} title={statusLabel}>
                          {statusIcon}
                        </span>
                        <div className="lesson-item-content">
                          <div className="lesson-item-title">{lesson.title || 'Chưa có tiêu đề'}</div>
                          <div className="lesson-item-type">
                            {lesson.lessonType === 'VIDEO' && '📹 Video'}
                            {lesson.lessonType === 'TEXT' && '📄 Văn bản'}
                            {lesson.lessonType === 'QUIZ' && '❓ Trắc nghiệm'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Hiển thị assignments ở dưới cùng */}
                {isCourseLearningMode && assignments.length > 0 && (
                  <>
                    <div className="assignments-separator">
                      <h3 className="assignments-title">Bài tập ({assignments.length})</h3>
                    </div>
                    {assignments.map((assignment, index) => {
                      const assignmentKey = idToKey(resolveLessonId(assignment)) || `assignment-${index}`;
                      const assignmentStatus = getAssignmentStatus(assignment.assignmentId);
                      const isActive = selectedLessonKey === assignmentKey;
                      const isSubmitted = assignmentStatus === 'SUBMITTED';
                      const statusIcon = isSubmitted ? '✓' : isActive ? '●' : '○';
                      const statusLabel = isSubmitted ? 'Đã nộp' : isActive ? 'Đang làm' : 'Chưa làm';
                      return (
                        <div
                          key={assignmentKey}
                          className={`lesson-item assignment-item ${isActive ? 'active' : ''} ${isSubmitted ? 'completed' : ''}`}
                          onClick={() => handleSelectLesson(assignment)}
                        >
                          <span className={`lesson-item-status lesson-status-${isSubmitted ? 'done' : isActive ? 'current' : 'pending'}`} title={statusLabel}>
                            {statusIcon}
                          </span>
                          <div className="lesson-item-content">
                            <div className="lesson-item-title">{assignment.title || 'Chưa có tiêu đề'}</div>
                            <div className="lesson-item-type">
                              {assignment.assignmentType === 'QUIZ' ? '❓ Trắc nghiệm' : '📝 Tự luận'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="lessons-main">
            {selectedLesson ? (
              <div className="lesson-detail lesson-detail-flow">
                <h2 className="lesson-detail-title">
                  {selectedLesson.title || "Chưa có tiêu đề"}
                </h2>

                {/* Progress - nổi bật (ẩn khi đang làm quiz) */}
                {isCourseLearningMode && !isAssignmentItem(selectedLesson) && (
                  <div className="lesson-progress-block">
                    <div className="lesson-progress-header">
                      <span className="lesson-progress-title">Tiến độ khóa học</span>
                      <span className="lesson-progress-percent">{progressSnapshot.percent}%</span>
                    </div>
                    <div className="lesson-progress-bar lesson-progress-bar-large">
                      <div
                        className="lesson-progress-fill"
                        style={{ width: `${progressSnapshot.percent}%` }}
                      />
                    </div>
                    <span className="lesson-progress-position">
                      Bài {currentLessonIndex} / {totalLessons}
                    </span>
                  </div>
                )}

                {/* Tabs */}
                {!isAssignmentItem(selectedLesson) && (
                  <div className="lesson-content-tabs">
                    <button
                      type="button"
                      className={`lesson-tab-btn ${contentTab === 'content' ? 'active' : ''}`}
                      onClick={() => setContentTab('content')}
                    >
                      📘 Nội dung bài học
                    </button>
                    <button
                      type="button"
                      className={`lesson-tab-btn ${contentTab === 'reading' ? 'active' : ''}`}
                      onClick={() => setContentTab('reading')}
                    >
                      📄 Tài liệu đọc
                    </button>
                  </div>
                )}

                {/* Content - gom vào 1 khối (compact khi quiz) */}
                <div className={`lesson-content-block ${isAssignmentItem(selectedLesson) ? 'lesson-content-block-quiz' : ''}`}>
                  {!isAssignmentItem(selectedLesson) && contentTab === 'reading' ? (
                    <div className="lesson-reading-tab">
                      {selectedLesson.contentUrl ? (
                        <a
                          href={selectedLesson.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lesson-download-reading-btn"
                        >
                          📎 Tải tài liệu đọc
                        </a>
                      ) : (
                        <div className="lesson-empty-state lesson-reading-empty">
                          <p>📄 Chưa có tài liệu đọc cho bài học này.</p>
                          <p className="lesson-empty-desc">Tài liệu sẽ được cập nhật sau.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    renderLessonContent(selectedLesson)
                  )}
                </div>

                {/* Complete + Navigation - ẩn khi đang làm quiz (quiz có nút riêng sau khi nộp) */}
                {isCourseLearningMode && !isAssignmentItem(selectedLesson) && (
                  <div className="lesson-action-row">
                    <button
                        className="lesson-complete-btn"
                        type="button"
                        disabled={isCompleting || selectedLessonCompleted}
                        onClick={handleCompleteLesson}
                      >
                        ✓ {selectedLessonCompleted
                          ? 'Đã hoàn thành'
                          : isCompleting
                            ? 'Đang cập nhật...'
                            : 'Đánh dấu hoàn thành'}
                      </button>
                    <div className="lesson-nav-buttons">
                      <button
                        type="button"
                        className="lesson-nav-prev"
                        disabled={!prevLesson}
                        onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                      >
                        ← Bài trước
                      </button>
                      <button
                        type="button"
                        className="lesson-nav-next"
                        disabled={!nextLesson}
                        onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                      >
                        Bài tiếp theo →
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Support - ẩn khi làm quiz/assignment */}
                {canUseAiHint && !isAssignmentItem(selectedLesson) && (
                  <div className="lesson-ai-section lesson-ai-section-prominent">
                    <h4 className="lesson-ai-section-title">💡 AI hỗ trợ học</h4>
                    <p className="lesson-ai-section-desc">Nhận gợi ý hoặc luyện tập thêm.</p>
                    <div className="lesson-ai-buttons">
                      <button
                        className="lesson-ai-hint-btn"
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
                          ? "Thử lại AI Hints"
                          : selectedLessonHint
                          ? "Tạo lại AI Hints"
                          : "AI Hints"}
                      </button>
                      <button
                        className="lesson-ai-quiz-btn"
                        type="button"
                        onClick={handleOpenAiQuizPage}
                      >
                        AI Quiz Practice
                      </button>
                    </div>
                    {aiHintExpanded && (
                      <div className="lesson-ai-hint-panel">
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
                            Nhấn "AI Hints" để nhận gợi ý giải thích bài học bằng tiếng Việt.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="lesson-placeholder">
                <div className="lesson-placeholder-icon">📚</div>
                <h3>Chọn một bài học để xem</h3>
                <p>Nhấp vào một bài học ở bên trái để bắt đầu học</p>
              </div>
            )}
          </div>

          {/* Question Map sidebar - khi đang làm quiz */}
          {selectedLesson &&
            isAssignmentItem(selectedLesson) &&
            selectedLesson.assignmentType === 'QUIZ' &&
            Array.isArray(selectedLesson.questions) &&
            selectedLesson.questions.length > 0 &&
            getAssignmentStatus(selectedLesson.assignmentId) !== 'SUBMITTED' && (
              <aside className="quiz-map-sidebar">
                <h4 className="quiz-map-title">Câu hỏi</h4>
                <div className="quiz-map-grid">
                  {selectedLesson.questions.map((q, idx) => {
                    const num = idx + 1;
                    const isAnswered = Boolean(
                      getQuizAnswerValue(selectedLesson.assignmentId, q.questionId)?.toString().trim()
                    );
                    const isCurrent = num === quizCurrentQuestion;
                    return (
                      <button
                        key={q.questionId || idx}
                        type="button"
                        className={`quiz-map-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                        onClick={() => setQuizCurrentQuestion(num)}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <div className="quiz-map-legend">
                  <span><span className="legend-dot answered" /> Đã trả lời</span>
                  <span><span className="legend-dot unanswered" /> Chưa trả lời</span>
                  <span><span className="legend-dot current" /> Câu hiện tại</span>
                </div>
              </aside>
            )}
        </div>

      </div>
    </div>
  );
}

export default LessonsView;
