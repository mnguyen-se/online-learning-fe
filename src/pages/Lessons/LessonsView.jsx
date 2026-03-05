import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../../components/Header/header';
import { getLearningProcess } from '../../api/learningProcessApi';
import {
  getAssignmentQuestions,
  getAssignmentsByCourse,
  getMyAssignments,
  submitQuizAssignment,
  submitWritingAssignment,
} from '../../api/assignmentApi';
import { getModulesByCourse } from '../../api/module';
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
} from '../../api/learningCache';
import { runWithRetry } from '../../api/requestRetry';
import { completeLessonById, getLessonView } from '../../api/lessionApi';
import './LessonsView.css';

const LessonVideoContent = lazy(() => import('./LessonVideoContent'));
const LessonQuizContent = lazy(() => import('./LessonQuizContent'));
const MatchingQuestion = lazy(() => import('./MatchingQuestion'));
const ReorderQuestion = lazy(() => import('./ReorderQuestion'));

const idToKey = (value) => String(value ?? '');

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

const getLessonOrder = (lesson) => Number(lesson?.orderIndex ?? lesson?.order_index ?? 0);

const getModuleOrder = (module) => Number(module?.orderIndex ?? module?.order_index ?? 0);

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
  return new Set(list.map((id) => idToKey(id)).filter((id) => id !== ''));
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
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
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
    if (process && typeof process === 'object') {
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
  const isCourseLearningMode = Boolean(courseId);

  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [learningProcess, setLearningProcess] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [assignmentStatuses, setAssignmentStatuses] = useState({});

  const selectedLessonKey = idToKey(resolveLessonId(selectedLesson));
  const allLessonsForProgress = useMemo(() => [...lessons, ...assignments], [lessons, assignments]);
  const completedLessonSet = useMemo(
    () => getCompletedLessonSetWithFallback(learningProcess, allLessonsForProgress),
    [learningProcess, allLessonsForProgress],
  );
  const selectedLessonCompleted = useMemo(() => {
    if (!selectedLesson) return false;
    return completedLessonSet.has(idToKey(resolveLessonId(selectedLesson)));
  }, [completedLessonSet, selectedLesson]);
  const progressSnapshot = useMemo(() => {
    const totalFromProcess = Number(learningProcess?.totalTasks ?? lessons.length ?? 0);
    const safeTotal =
      Number.isFinite(totalFromProcess) && totalFromProcess > 0
        ? Math.floor(totalFromProcess)
        : lessons.length;
    const completedFromProcess = Number(
      learningProcess?.completedTasks ?? learningProcess?.completedCount ?? 0,
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

    const rawPercent = clampPercent(learningProcess?.progressPercent ?? safePercent);
    const rebuilt =
      safeTotal > 0 &&
      (rawPercent !== safePercent ||
        (Number.isFinite(completedFromProcess) && Math.floor(completedFromProcess) !== safeCompleted));

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
    const allItems = [...lessons, ...assignments];
    const currentIndex = allItems.findIndex(
      (lesson) => idToKey(resolveLessonId(lesson)) === selectedId,
    );
    if (currentIndex < 0 || currentIndex + 1 >= allItems.length) return null;
    return allItems[currentIndex + 1];
  }, [lessons, assignments, selectedLesson]);

  const patchAssignmentItem = (assignmentId, updater) => {
    if (!assignmentId) return;
    setLessons((prev) =>
      prev.map((item) => {
        if (!isAssignmentItem(item) || idToKey(item.assignmentId) !== idToKey(assignmentId)) {
          return item;
        }
        return updater(item);
      }),
    );
    setSelectedLesson((prev) => {
      if (!isAssignmentItem(prev) || idToKey(prev.assignmentId) !== idToKey(assignmentId)) {
        return prev;
      }
      return updater(prev);
    });
  };

  const ensureAssignmentQuestionsLoaded = async (assignmentItem) => {
    if (!assignmentItem || !isAssignmentItem(assignmentItem) || !assignmentItem.assignmentId) {
      return;
    }
    if (assignmentItem.questionsLoaded || assignmentItem.questionsLoading) return;

    patchAssignmentItem(assignmentItem.assignmentId, (current) => ({
      ...current,
      questionsLoading: true,
      questionsError: '',
    }));

    try {
      const questionsRes = await runWithRetry(
        () => getAssignmentQuestions(assignmentItem.assignmentId),
        {
          retries: 1,
          baseDelayMs: 500,
        },
      );
      const rawQuestions = normalizeArrayResponse(questionsRes);
      const mappedQuestions = rawQuestions.map((question, index) =>
        mapAssignmentQuestion(question, index, assignmentItem.assignmentId),
      );
      patchAssignmentItem(assignmentItem.assignmentId, (current) => ({
        ...current,
        questions: mappedQuestions,
        questionsLoaded: true,
        questionsLoading: false,
        questionsError: '',
      }));
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Không thể tải câu hỏi bài tập.';
      patchAssignmentItem(assignmentItem.assignmentId, (current) => ({
        ...current,
        questionsLoading: false,
        questionsError: message,
      }));
    }
  };

  const getAssignmentStatus = (assignmentId) => assignmentStatuses[idToKey(assignmentId)] ?? null;

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

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (isCourseLearningMode) {
        const [structure, process, assignmentItems] = await Promise.all([
          getCourseStructureWithCache(courseId),
          getLearningProcessWithCache(courseId),
          getAssignmentItemsByCourse(courseId),
        ]);
        const orderedLessons = Array.isArray(structure?.lessons) ? structure.lessons : [];
        const courseModules = Array.isArray(structure?.modules) ? structure.modules : [];
        
        // Tách lessons và assignments
        setLearningProcess(process);
        setModules(courseModules);
        setLessons(orderedLessons);
        setAssignments(assignmentItems);
        setCourseDetail(getCachedCourseDetail(courseId));

        // Mở module chứa lesson được chọn
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
        const fallbackLessonId = resumeLessonId ?? resolveLessonId(orderedLessons[0]) ?? null;
        const fallbackLesson = orderedLessons.find(
          (lesson) => idToKey(resolveLessonId(lesson)) === idToKey(fallbackLessonId),
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
          navigate(`/course/${courseId}/learn/${fallbackLessonId}`, { replace: true });
        }
        return;
      }

      const lessonsData = [...(await getLessonViewWithCache())].sort(
        (a, b) => getLessonOrder(a) - getLessonOrder(b),
      );
      setLessons(lessonsData);
      setCourseDetail(null);

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
  }, [selectedLesson]);

  const handleCompleteLesson = async () => {
    if (!isCourseLearningMode || !selectedLesson || !courseId) return;
    if (isAssignmentItem(selectedLesson)) {
      toast.info('Bài tập này không dùng chức năng đánh dấu hoàn thành bài học.');
      return;
    }
    const selectedId = resolveLessonId(selectedLesson);
    if (!selectedId) return;
    if (selectedLessonCompleted) {
      toast.info('Bài học này đã được hoàn thành.');
      return;
    }
    try {
      setIsCompleting(true);
      await runWithRetry(() => completeLessonById(selectedId), {
        retries: 1,
        baseDelayMs: 500,
      });
      invalidateCachedMyCourses();
      toast.success('Đã đánh dấu hoàn thành bài học.');
      invalidateCachedLearningProcess(courseId);
      const latestProcess = await getLearningProcessWithCache(courseId, { force: true });
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

    return (
      <div className="lesson-content-quiz">
        <h3 className="quiz-title">Câu hỏi trắc nghiệm</h3>
        {assignmentItem.textContent ? (
          <p className="assignment-question-hint">{assignmentItem.textContent}</p>
        ) : null}
        {submissionStatus === 'SUBMITTED' ? (
          <div className="assignment-status-badge">Trạng thái: SUBMITTED</div>
        ) : null}
        <div className="quiz-questions">
          {questions.map((question, index) => (
            <div key={question.id || index} className="quiz-question-item">
              <div className="quiz-question-number">Câu {index + 1}</div>
              <div className="quiz-question-text">{question.question || 'Chưa có câu hỏi'}</div>
              <div className="quiz-answers">
                {(question.answers || []).map((answer, answerIndex) => {
                  const answerLetter = String.fromCharCode(65 + answerIndex);
                  const selectedValue = getQuizAnswerValue(
                    assignmentItem.assignmentId,
                    question.questionId,
                  );
                  const isSelected = selectedValue === answerLetter;
                  return (
                    <button
                      type="button"
                      key={answerLetter}
                      className={`quiz-answer quiz-answer-option ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        handleQuizAnswerChange(
                          assignmentItem.assignmentId,
                          question.questionId,
                          answerLetter,
                        )}
                    >
                      <span className="quiz-answer-label">{answerLetter}.</span>
                      <span className="quiz-answer-text">{answer || 'Chưa có đáp án'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="assignment-submit-row">
          <button
            type="button"
            className="assignment-submit-btn"
            disabled={isSubmittingAssignment}
            onClick={() => handleSubmitQuizAssignment(assignmentItem)}
          >
            {isSubmittingAssignment ? 'Đang nộp...' : 'Nộp bài trắc nghiệm'}
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

    return (
      <div className="lesson-content-text">
        <h3 className="quiz-title">Bài tập tự luận</h3>
        {assignmentItem.textContent ? (
          <p className="assignment-question-hint">{assignmentItem.textContent}</p>
        ) : null}
        {submissionStatus === 'SUBMITTED' ? (
          <div className="assignment-status-badge">Trạng thái: SUBMITTED</div>
        ) : null}
        <div className="quiz-questions">
          {questions.map((question, index) => {
            const questionType = normalizeQuestionType(question.questionType);
            const answerValue = getWritingAnswerValue(assignmentItem.assignmentId, question.questionId);
            return (
              <div key={question.id || index} className="quiz-question-item">
                <div className="quiz-question-number">Câu {index + 1}</div>
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

  const renderLessonContent = (lesson) => {
    if (isAssignmentItem(lesson)) {
      if (lesson.assignmentType === 'QUIZ') {
        return renderAssignmentQuizContent(lesson);
      }
      return renderAssignmentWritingContent(lesson);
    }

    const lessonType = lesson.lessonType || 'VIDEO';
    const videoSource = lesson.videoUrl || lesson.contentUrl || '';
    const textSource = lesson.textContent || lesson.contentUrl || '';
    const quizSource = lesson.contentUrl || lesson.textContent || lesson.videoUrl || '';

    if (lessonType === 'VIDEO') {
      return (
        <Suspense fallback={<div className="lesson-content-skeleton" />}>
          <LessonVideoContent title={lesson.title} videoSource={videoSource} />
        </Suspense>
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
            {isCourseLearningMode
              ? courseDetail?.title || 'Học khóa học'
              : 'Danh sách Bài học'}
          </h1>
          <p className="lessons-subtitle">
            {isCourseLearningMode
              ? courseDetail?.description || 'Tiếp tục từ vị trí đang học của bạn'
              : 'Xem và học các bài học đã được công bố'}
          </p>
          {isCourseLearningMode ? (
            <div className="learning-process-summary">
              <span>Tiến độ: {progressSnapshot.percent}%</span>
              <span>
                {progressSnapshot.completed}/{progressSnapshot.total} bài học
              </span>
              <span>Trạng thái: {learningProcess?.status || 'IN_PROGRESS'}</span>
              {progressSnapshot.rebuilt ? <span>Tiến độ đã được hiệu chỉnh</span> : null}
            </div>
          ) : null}
        </div>

        <div className="lessons-layout">
          <div className="lessons-sidebar">
            <h2 className="lessons-sidebar-title">
              {isCourseLearningMode ? `Bài học (${lessons.length})` : `Bài học (${lessons.length})`}
            </h2>
            {isCourseLearningMode && modules.length === 0 && lessons.length === 0 && assignments.length === 0 ? (
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
                                    return (
                                      <div
                                        key={lessonKey}
                                        className={`lesson-item lesson-item-nested ${selectedLessonKey === lessonKey ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectLesson(lesson);
                                        }}
                                      >
                                        <div className="lesson-item-number">{lessonIndex + 1}</div>
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
                      return (
                        <div
                          key={assignmentKey}
                          className={`lesson-item assignment-item ${selectedLessonKey === assignmentKey ? 'active' : ''}`}
                          onClick={() => handleSelectLesson(assignment)}
                        >
                          <div className="lesson-item-number">{index + 1}</div>
                          <div className="lesson-item-content">
                            <div className="lesson-item-title">{assignment.title || 'Chưa có tiêu đề'}</div>
                            <div className="lesson-item-type">
                              {assignment.assignmentType === 'QUIZ' ? '❓ Trắc nghiệm' : '📝 Tự luận'}
                              {assignmentStatus === 'SUBMITTED' ? ' • ✅ Đã nộp' : ''}
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
              <div className="lesson-detail">
                <div className="lesson-detail-header">
                  <h2 className="lesson-detail-title">{selectedLesson.title || 'Chưa có tiêu đề'}</h2>
                  <div className="lesson-detail-meta">
                    <span className="lesson-type-badge">
                      {isAssignmentItem(selectedLesson)
                        ? selectedLesson.assignmentType === 'QUIZ'
                          ? 'Bài tập trắc nghiệm'
                          : 'Bài tập tự luận'
                        : null}
                      {!isAssignmentItem(selectedLesson) &&
                        selectedLesson.lessonType === 'VIDEO' &&
                        'Video Bài giảng'}
                      {!isAssignmentItem(selectedLesson) &&
                        selectedLesson.lessonType === 'TEXT' &&
                        'Tài liệu đọc'}
                      {!isAssignmentItem(selectedLesson) &&
                        selectedLesson.lessonType === 'QUIZ' &&
                        'Trắc nghiệm'}
                    </span>
                    {selectedLesson.sectionTitle ? (
                      <span className="lesson-section-badge">{selectedLesson.sectionTitle}</span>
                    ) : null}
                  </div>
                  {isCourseLearningMode ? (
                    <div className="lesson-actions">
                      {!isAssignmentItem(selectedLesson) ? (
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
                      ) : null}
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
