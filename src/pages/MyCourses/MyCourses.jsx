import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { getMyCourses } from "../../api/enrollmentApi";
import "./mycourses.css";

const fallbackThumbnail =
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all | active | completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMyCourses();
        if (mounted) setCourses(data || []);
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
      (c) => c.enrollmentStatus === "ACTIVE",
    ).length;
    const completed = courses.filter(
      (c) => c.enrollmentStatus === "COMPLETED",
    ).length;
    return { all, active, completed };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (activeTab === "active")
      return courses.filter((c) => c.enrollmentStatus === "ACTIVE");
    if (activeTab === "completed")
      return courses.filter((c) => c.enrollmentStatus === "COMPLETED");
    return courses;
  }, [courses, activeTab]);

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
              : "Bạn chưa đăng ký khóa học nào."}
          </div>
        ) : (
          <div className="course-grid">
            {filteredCourses.map((course) => (
              <div className="course-card" key={course.enrollmentId}>
                <div className="course-image">
                  <img
                    src={course.thumbnailUrl || fallbackThumbnail}
                    alt={course.courseTitle}
                  />
                  <span
                    className={`course-badge ${course.enrollmentStatus === "COMPLETED" ? "completed" : "active"}`}
                  >
                    {course.enrollmentStatus === "COMPLETED"
                      ? "Completed"
                      : "Active"}
                  </span>
                </div>

                <div className="course-body">
                  <div className="course-progress">
                    <span>Tiến độ</span>
                    <span>{course.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>

                  <div className="course-level">
                    {course.level || "Bắt đầu học"}
                  </div>
                  <h3 className="course-title">{course.courseTitle}</h3>
                  <p className="course-desc">{course.courseDescription}</p>

                  <div className="course-meta">
                    <div>Ngày đăng ký: {formatDateOnly(course.enrolledAt)}</div>
                    <div>Lần truy cập gần nhất: Chưa có</div>
                  </div>

                  <button className="course-action">
                    {course.enrollmentStatus === "COMPLETED"
                      ? "Xem lại khóa học"
                      : "Tiếp tục học"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyCourses;
