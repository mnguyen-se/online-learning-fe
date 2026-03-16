import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { getMyCourses } from "../../api/enrollmentApi";
import { getCourseById } from "../../api/coursesApi";
import {
  enrollLearningProcess,
  getLearningProcess,
} from "../../api/learningProcessApi";
import {
  getCachedCourseDetail,
  getCachedCourseStructure,
  getCachedLearningProcess,
  getCachedLessonView,
  getCachedMyCourses,
  invalidateCachedLearningProcess,
  setCachedCourseDetail,
  setCachedCourseStructure,
  setCachedLearningProcess,
  setCachedLessonView,
  setCachedMyCourses,
} from "../../api/learningCache";
import { runWithRetry } from "../../api/requestRetry";
import { getModulesByCourse } from "../../api/module";
import { getLessonView } from "../../api/lessionApi";
import "./mycourses.css";

const readCache = () => {
  return getCachedMyCourses();
};

const writeCache = (courses) => {
  setCachedMyCourses(courses);
};

const clampProgress = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const resolveCourseId = (course) =>
  course.courseId ??
  course.id ??
  course.course?.id ??
  course.course?.courseId ??
  course.course_id;

const normalizeProgress = (process) => {
  if (!process) return null;
  const direct = process.progressPercent ?? process.progress ?? null;
  if (typeof direct === "number") return direct;
  if (process.totalTasks && typeof process.completedTasks === "number") {
    return (process.completedTasks / process.totalTasks) * 100;
  }
  return null;
};

const getStatusFromProgress = (progress, hasProcess) => {
  if (!hasProcess || progress <= 0) return "Chưa học";
  if (progress >= 100) return "Hoàn thành";
  return "Đang học";
};

const getCtaLabel = (status) => {
  if (status === "Hoàn thành") return "Xem lại";
  if (status === "Đang học") return "Tiếp tục học";
  return "Bắt đầu học";
};

const getCourseTitle = (course) =>
  course.courseTitle ?? course.title ?? course.name ?? course.courseName ?? "Khóa học";

const getCourseDescription = (course) =>
  course.courseDescription ?? course.description ?? course.summary ?? "Chưa có mô tả";

const resolveModuleId = (module) =>
  module?.moduleId ?? module?.id ?? module?._id ?? module?.module_id;

const resolveLessonId = (lesson) =>
  lesson?.lessonId ?? lesson?.id ?? lesson?._id ?? lesson?.lesson_id;

const resolveLessonModuleId = (lesson) =>
  lesson?.moduleId ??
  lesson?.module?.moduleId ??
  lesson?.sectionId ??
  lesson?.section?.id;

const idToKey = (value) => String(value ?? "");

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getModuleOrder = (module) =>
  Number(module?.orderIndex ?? module?.order_index ?? 0);

const getLessonOrder = (lesson) =>
  Number(lesson?.orderIndex ?? lesson?.order_index ?? 0);

const isPublicLesson = (lesson) =>
  lesson?.isPublic ?? lesson?.is_public ?? true;

const isEnrollConflict = (error) => {
  const status = error?.response?.status;
  const message = (
    error?.response?.data?.message ||
    error?.response?.data?.chiTiet ||
    error?.message ||
    ""
  ).toLowerCase();
  return status === 409 || message.includes("tồn tại") || message.includes("exists");
};

const getFirstLessonId = (modules, lessons) => {
  const modulesList = Array.isArray(modules) ? modules : [];
  const lessonsList = Array.isArray(lessons) ? lessons : [];

  const sortedModules = [...modulesList].sort((a, b) => {
    const orderDiff = getModuleOrder(a) - getModuleOrder(b);
    if (orderDiff !== 0) return orderDiff;
    return String(resolveModuleId(a)).localeCompare(String(resolveModuleId(b)));
  });

  for (const module of sortedModules) {
    const moduleId = resolveModuleId(module);
    if (!moduleId) continue;
    const moduleLessons = lessonsList
      .filter(
        (lesson) =>
          idToKey(resolveLessonModuleId(lesson)) === idToKey(moduleId) &&
          isPublicLesson(lesson),
      )
      .sort((a, b) => {
        const orderDiff = getLessonOrder(a) - getLessonOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return String(resolveLessonId(a)).localeCompare(
          String(resolveLessonId(b)),
        );
      });

    const firstLessonId = resolveLessonId(moduleLessons[0]);
    if (firstLessonId) return firstLessonId;
  }

  const fallbackLessons = lessonsList
    .filter((lesson) => isPublicLesson(lesson))
    .sort((a, b) => {
      const orderDiff = getLessonOrder(a) - getLessonOrder(b);
      if (orderDiff !== 0) return orderDiff;
      return String(resolveLessonId(a)).localeCompare(String(resolveLessonId(b)));
    });

  return resolveLessonId(fallbackLessons[0]) ?? null;
};

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

const getOrderedCourseLessons = (modules, lessons) => {
  const modulesList = Array.isArray(modules) ? modules : [];
  const lessonsList = Array.isArray(lessons) ? lessons : [];
  const sortedModules = [...modulesList].sort((a, b) => {
    const orderDiff = getModuleOrder(a) - getModuleOrder(b);
    if (orderDiff !== 0) return orderDiff;
    return String(resolveModuleId(a)).localeCompare(String(resolveModuleId(b)));
  });
  const ordered = [];
  for (const module of sortedModules) {
    const moduleId = resolveModuleId(module);
    if (!moduleId) continue;
    const moduleLessons = lessonsList
      .filter(
        (lesson) =>
          idToKey(resolveLessonModuleId(lesson)) === idToKey(moduleId) &&
          isPublicLesson(lesson),
      )
      .sort((a, b) => {
        const orderDiff = getLessonOrder(a) - getLessonOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return String(resolveLessonId(a)).localeCompare(
          String(resolveLessonId(b)),
        );
      });
    ordered.push(...moduleLessons);
  }
  return ordered;
};

const resolveContinueLessonId = (process, modules, lessons) => {
  const orderedLessons = getOrderedCourseLessons(modules, lessons);
  if (orderedLessons.length === 0) return null;

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

const fetchLearningProcessWithCache = async (courseId, options = {}) => {
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
    return process ?? null;
  } catch {
    return null;
  }
};

const fetchCourseStructureWithCache = async (courseId) => {
  const cachedStructure = getCachedCourseStructure(courseId);
  if (cachedStructure?.modules && cachedStructure?.lessons) {
    return cachedStructure;
  }

  const modulesRes = await runWithRetry(() => getModulesByCourse(courseId), {
    retries: 1,
    baseDelayMs: 500,
  }).catch(() => []);
  const modules = normalizeArrayResponse(modulesRes);

  let lessonView = getCachedLessonView();
  if (!Array.isArray(lessonView) || lessonView.length === 0) {
    const lessonViewRes = await runWithRetry(() => getLessonView(), {
      retries: 1,
      baseDelayMs: 500,
    }).catch(() => []);
    lessonView = normalizeArrayResponse(lessonViewRes);
    setCachedLessonView(lessonView);
  }

  const moduleIdSet = new Set(
    modules
      .map((module) => idToKey(resolveModuleId(module)))
      .filter((moduleId) => moduleId !== ""),
  );
  const lessons = (Array.isArray(lessonView) ? lessonView : []).filter((lesson) =>
    moduleIdSet.has(idToKey(resolveLessonModuleId(lesson))),
  );
  const structure = { modules, lessons };
  setCachedCourseStructure(courseId, structure);
  return structure;
};

const MyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all | active | completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingCourseId, setStartingCourseId] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const formatDateOnly = (value) => {
    if (!value) return "Chưa có";
    if (typeof value === "string") {
      const [datePart] = value.split("T");
      return datePart || value;
    }
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return String(value);
    }
  };

  useEffect(() => {
    let mounted = true;
    const cachedCourses = readCache();
    if (cachedCourses) {
      setCourses(cachedCourses);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await runWithRetry(() => getMyCourses(), {
          retries: 1,
          baseDelayMs: 600,
        });
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
              ? data.items
              : [];
        const coursesWithProgress = await Promise.all(
          list.map(async (course) => {
            const courseId = resolveCourseId(course);
            let process = getCachedLearningProcess(courseId);
            if (!process && courseId) {
              process = await fetchLearningProcessWithCache(courseId);
            }
            const progress = clampProgress(normalizeProgress(process) ?? 0);
            const hasProcess = Boolean(process);
            const status = getStatusFromProgress(progress, hasProcess);
            const currentLessonId = getCurrentLessonIdFromProcess(process);
            let hasLessons = true;
            if (courseId) {
              const totalTasks = Number(process?.totalTasks ?? NaN);
              if (Number.isFinite(totalTasks)) {
                hasLessons = totalTasks > 0;
              } else {
                const structure = await fetchCourseStructureWithCache(courseId);
                hasLessons = Array.isArray(structure?.lessons) && structure.lessons.length > 0;
              }
            }
            if (courseId) {
              const cachedDetail = getCachedCourseDetail(courseId) ?? {};
              setCachedCourseDetail(courseId, {
                ...cachedDetail,
                courseId,
                title: getCourseTitle(course),
                description: getCourseDescription(course),
                level: course.level ?? cachedDetail.level ?? "",
              });
            }
            // Fetch imageUrl từ API chi tiết khóa học
            let imageUrl = course.imageUrl ?? course.image_url ?? course.coverImage ?? '';
            if (!imageUrl && courseId) {
              try {
                const courseDetail = await getCourseById(courseId);
                imageUrl = courseDetail?.imageUrl ?? courseDetail?.image_url ?? courseDetail?.coverImage ?? '';
              } catch {
                // Không block nếu lỗi, chỉ bỏ qua ảnh
              }
            }
            return {
              ...course,
              courseId,
              imageUrl,
              learningProgress: progress,
              learningStatus: status,
              hasLearningProcess: hasProcess,
              currentLessonId,
              hasLessons,
            };
          }),
        );
        if (mounted) {
          setCourses(coursesWithProgress);
          writeCache(coursesWithProgress);
        }
      } catch {
        if (mounted) setError("Không thể tải danh sách khóa học.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [reloadTick]);

  const stats = useMemo(() => {
    const all = courses.length;
    const active = courses.filter(
      (c) => c.learningStatus === "Đang học",
    ).length;
    const completed = courses.filter(
      (c) => c.learningStatus === "Hoàn thành",
    ).length;
    return { all, active, completed };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (activeTab === "active")
      return courses.filter((c) => c.learningStatus === "Đang học");
    if (activeTab === "completed")
      return courses.filter((c) => c.learningStatus === "Hoàn thành");
    return courses;
  }, [courses, activeTab]);

  const handleCtaClick = async (course, status) => {
    const courseId = resolveCourseId(course);
    if (!courseId) {
      window.alert("Không thể xác định khóa học.");
      return;
    }
    if (course.hasLessons === false) {
      window.alert("Khóa học này chưa có bài học.");
      return;
    }

    if (status === "Chưa học") {
      setStartingCourseId(courseId);
      try {
        if (!course.hasLearningProcess) {
          try {
            await enrollLearningProcess(courseId);
            invalidateCachedLearningProcess(courseId);
          } catch (err) {
            if (!isEnrollConflict(err)) {
              throw err;
            }
          }
        }

        const { modules, lessons } = await fetchCourseStructureWithCache(courseId);

        const firstLessonId = getFirstLessonId(modules, lessons);
        if (!firstLessonId) {
          window.alert("Khóa học chưa có bài học để bắt đầu.");
          return;
        }

        navigate(`/course/${courseId}/learn/${firstLessonId}`);
        return;
      } catch {
        window.alert("Không thể khởi tạo tiến trình học tập.");
      } finally {
        setStartingCourseId(null);
      }
      return;
    }

    setStartingCourseId(courseId);
    try {
      const [processRes, structure] = await Promise.all([
        fetchLearningProcessWithCache(courseId),
        fetchCourseStructureWithCache(courseId),
      ]);
      const { modules, lessons } = structure;

      let resolvedLessonId = resolveContinueLessonId(processRes, modules, lessons);
      if (!resolvedLessonId && status === "Hoàn thành") {
        resolvedLessonId = getFirstLessonId(modules, lessons);
      }
      if (!resolvedLessonId) {
        window.alert("Bạn đã hoàn thành toàn bộ bài học trong khóa này.");
        return;
      }
      navigate(`/course/${courseId}/learn/${resolvedLessonId}`);
    } catch {
      window.alert("Không thể mở bài học đang học dở.");
    } finally {
      setStartingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="my-courses-page">
        <Header />
        <main className="my-courses-main">
          <div className="state-card">Đang tải dữ liệu...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-courses-page">
        <Header />
        <main className="my-courses-main">
          <div className="state-card state-error">
            <p>{error}</p>
            <button
              type="button"
              className="course-action"
              onClick={() => setReloadTick((value) => value + 1)}
            >
              Thử lại
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <Header />
      <main className="my-courses-main">
        <div className="my-courses-header">
          <div>
            <h1>Khóa học của tôi</h1>
            <p>Khóa học bạn đã đăng ký</p>
          </div>
        </div>

        <div className="course-tabs">
          <button
            className={activeTab === "all" ? "tab active" : "tab"}
            onClick={() => setActiveTab("all")}
          >
            Tất cả khóa học <span>{stats.all}</span>
          </button>
          <button
            className={activeTab === "active" ? "tab active" : "tab"}
            onClick={() => setActiveTab("active")}
          >
            Đang học <span>{stats.active}</span>
          </button>
          <button
            className={activeTab === "completed" ? "tab active" : "tab"}
            onClick={() => setActiveTab("completed")}
          >
            Hoàn thành <span>{stats.completed}</span>
          </button>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="state-card">
            {activeTab === "completed"
              ? "Bạn chưa hoàn thành khóa học nào"
              : activeTab === "active"
                ? "Bạn chưa có khóa học đang học."
                : "Bạn chưa đăng ký khóa học nào."}
          </div>
        ) : (
          <div className="course-grid">
            {filteredCourses.map((course) => {
              const status = course.learningStatus || "Chưa học";
              const progressValue =
                typeof course.learningProgress === "number"
                  ? course.learningProgress
                  : 0;
              const courseTitle = getCourseTitle(course);
              const courseDesc = getCourseDescription(course);
              const courseId = resolveCourseId(course);
              const courseKey =
                course.enrollmentId ??
                courseId ??
                course.id ??
                course.course?.id ??
                courseTitle;
              const isStarting = startingCourseId === courseId;
              const isNoLessonCourse = course.hasLessons === false;
              const ctaDisabled = isStarting || isNoLessonCourse;

              return (
                <div className="course-card" key={courseKey}>
                  {(course.imageUrl || course.image_url || course.coverImage) ? (
                    <div className="course-image">
                      <img src={course.imageUrl || course.image_url || course.coverImage} alt={courseTitle} />
                    </div>
                  ) : (
                    <div className="course-image course-image--placeholder">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="course-body">
                    <div className="course-progress">
                      <span>Tiến độ</span>
                      <span>{progressValue}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>

                    <div className="course-level">
                      {course.level || "Bắt đầu học"}
                    </div>
                    <h3 className="course-title">{courseTitle}</h3>
                    <p className="course-desc">{courseDesc}</p>

                    <div className="course-meta">
                      <div>Trạng thái: {status}</div>
                      <div>Ngày đăng ký: {formatDateOnly(course.enrolledAt)}</div>
                      {course.currentLessonId ? (
                        <div>Bài học gần nhất: #{course.currentLessonId}</div>
                      ) : null}
                      {isNoLessonCourse ? (
                        <div>Khóa học này hiện chưa có bài học.</div>
                      ) : null}
                      <div>Lần truy cập gần nhất: Chưa có</div>
                    </div>

                    <button
                      className="course-action"
                      type="button"
                      disabled={ctaDisabled}
                      onClick={() => handleCtaClick(course, status)}
                    >
                      {isNoLessonCourse
                        ? "Chưa có bài học"
                        : isStarting
                          ? "Đang chuẩn bị..."
                          : getCtaLabel(status)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyCourses;
