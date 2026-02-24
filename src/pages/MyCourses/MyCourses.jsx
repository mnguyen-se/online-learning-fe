import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { getMyCourses } from "../../api/enrollmentApi";
import {
  enrollLearningProcess,
  getLearningProcess,
} from "../../api/learningProcessApi";
import { getModulesByCourse } from "../../api/module";
import { getLessonView } from "../../api/lessionApi";
import "./mycourses.css";

const CACHE_KEY = "myCoursesCache_v1";

const readCache = () => {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.courses)) return null;
    return parsed.courses;
  } catch {
    return null;
  }
};

const writeCache = (courses) => {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ courses, cachedAt: Date.now() }),
    );
  } catch {
    // ignore cache write errors
  }
};

const clearCache = () => {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore cache remove errors
  }
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

const getActionParam = (status) => {
  if (status === "Hoàn thành") return "review";
  if (status === "Đang học") return "continue";
  return "start";
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

const MyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all | active | completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingCourseId, setStartingCourseId] = useState(null);

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
        const data = await getMyCourses();
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
            let process = null;
            if (courseId) {
              try {
                process = await getLearningProcess(courseId);
              } catch {
                process = null;
              }
            }
            const progress = clampProgress(normalizeProgress(process) ?? 0);
            const hasProcess = Boolean(process);
            const status = getStatusFromProgress(progress, hasProcess);
            return {
              ...course,
              courseId,
              learningProgress: progress,
              learningStatus: status,
              hasLearningProcess: hasProcess,
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
  }, []);

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

    if (status === "Chưa học") {
      setStartingCourseId(courseId);
      try {
        if (!course.hasLearningProcess) {
          try {
            await enrollLearningProcess(courseId);
          } catch (err) {
            if (!isEnrollConflict(err)) {
              throw err;
            }
          }
        }

        const [modulesRes, lessonViewRes] = await Promise.all([
          getModulesByCourse(courseId).catch(() => []),
          getLessonView().catch(() => []),
        ]);
        const modules = Array.isArray(modulesRes)
          ? modulesRes
          : Array.isArray(modulesRes?.data)
            ? modulesRes.data
            : Array.isArray(modulesRes?.data?.data)
              ? modulesRes.data.data
              : [];
        const lessonsRaw = Array.isArray(lessonViewRes)
          ? lessonViewRes
          : Array.isArray(lessonViewRes?.data)
            ? lessonViewRes.data
            : Array.isArray(lessonViewRes?.data?.data)
              ? lessonViewRes.data.data
              : [];
        const moduleIdSet = new Set(
          modules
            .map((module) => idToKey(resolveModuleId(module)))
            .filter((moduleId) => moduleId !== ""),
        );
        const lessons = (Array.isArray(lessonsRaw) ? lessonsRaw : []).filter(
          (lesson) => moduleIdSet.has(idToKey(resolveLessonModuleId(lesson))),
        );

        const firstLessonId = getFirstLessonId(modules, lessons);
        if (!firstLessonId) {
          window.alert("Khóa học chưa có bài học để bắt đầu.");
          return;
        }

        clearCache();
        navigate(`/course/${courseId}/learn/${firstLessonId}`);
        return;
      } catch {
        window.alert("Không thể khởi tạo tiến trình học tập.");
      } finally {
        setStartingCourseId(null);
      }
      return;
    }

    const action = getActionParam(status);
    const params = new URLSearchParams();
    params.set("courseId", courseId);
    params.set("action", action);
    navigate(`/lessons?${params.toString()}`);
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
          <div className="state-card state-error">{error}</div>
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

              return (
                <div className="course-card" key={courseKey}>
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
                      <div>Lần truy cập gần nhất: Chưa có</div>
                    </div>

                    <button
                      className="course-action"
                      type="button"
                      disabled={isStarting}
                      onClick={() => handleCtaClick(course, status)}
                    >
                      {isStarting ? "Đang chuẩn bị..." : getCtaLabel(status)}
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
