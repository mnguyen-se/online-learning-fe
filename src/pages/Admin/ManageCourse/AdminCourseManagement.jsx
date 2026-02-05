import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/DashboardLayout';
import { getCourses } from '../../../api/coursesApi';
import { getLessons } from '../../../api/lessionApi';
import { assignEnrollment } from '../../../api/enrollmentApi';
import '../../Manager/ManageCourse/courseManagement.css';

function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [statusFilter] = useState('active');
  const [courseStats, setCourseStats] = useState({});
  const [courseActiveStates, setCourseActiveStates] = useState({});
  const [assignModal, setAssignModal] = useState({ isOpen: false, course: null });
  const [assignUsername, setAssignUsername] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const getCourseId = (course) =>
    course?.id ??
    course?.courseId ??
    course?.course_id ??
    course?.courseID ??
    course?.courseid ??
    course?.CourseId ??
    course?.courseCode ??
    course?.code ??
    null;

  const getCourseIsActive = (course) => {
    const candidate =
      course?.isPublic ??
      course?.is_public ??
      course?.public ??
      course?.isActive ??
      course?.is_active;
    return typeof candidate === 'boolean' ? candidate : true;
  };

  const resolveCourseActiveState = (course) => {
    const courseId = getCourseId(course);
    if (courseId && typeof courseActiveStates[courseId] === 'boolean') {
      return courseActiveStates[courseId];
    }
    return getCourseIsActive(course);
  };

  const loadCourseStats = async (courseId) => {
    if (!courseId) return { modules: 0, lessons: 0 };
    try {
      const data = await getLessons({ courseId });
      const rawList = Array.isArray(data) ? data : data?.data ?? [];
      const uniqueSections = new Set(
        rawList.map((lesson) => lesson.sectionId ?? lesson.section_id ?? lesson.section ?? 0).filter((s) => s > 0)
      );
      return { modules: uniqueSections.size, lessons: rawList.length };
    } catch {
      return { modules: 0, lessons: 0 };
    }
  };

  const loadCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCoursesError('');
      const data = await getCourses();
      const rawCoursesList = Array.isArray(data) ? data : data?.data ?? [];
      const coursesList = rawCoursesList.map((course) => {
        const courseId = getCourseId(course);
        return { ...course, id: courseId || course.id };
      });
      setCourses(coursesList);

      const newActiveStates = {};
      coursesList.forEach((course) => {
        const courseId = getCourseId(course);
        if (courseId) newActiveStates[courseId] = getCourseIsActive(course);
      });
      setCourseActiveStates(newActiveStates);
      setCourseStats({});

      const statsPromises = coursesList.map(async (course) => {
        const courseId = getCourseId(course);
        if (courseId) {
          const stats = await loadCourseStats(courseId);
          return { courseId, stats };
        }
        return { courseId: null, stats: { modules: 0, lessons: 0 } };
      });
      const statsResults = await Promise.all(statsPromises);
      const newStats = {};
      statsResults.forEach(({ courseId, stats }) => {
        if (courseId) newStats[courseId] = stats;
      });
      setCourseStats(newStats);
    } catch (error) {
      setCoursesError('Không thể tải danh sách khóa học.');
      console.error('Fetch courses error:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const normalizedSearch = courseSearch.trim().toLowerCase();
  const filteredCourses = useMemo(() => {
    let list = courses;
    if (normalizedSearch) {
      list = list.filter((course) => {
        const haystack = [
          course?.title ?? '',
          course?.description ?? '',
          String(getCourseId(course) ?? ''),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }
    if (statusFilter === 'active') {
      list = list.filter((course) => resolveCourseActiveState(course));
    }
    if (statusFilter === 'inactive') {
      list = list.filter((course) => !resolveCourseActiveState(course));
    }
    return list;
  }, [courses, normalizedSearch, statusFilter, courseActiveStates]);

  const openAssignModal = (course) => {
    setAssignModal({ isOpen: true, course });
    setAssignUsername('');
  };

  const closeAssignModal = () => {
    setAssignModal({ isOpen: false, course: null });
    setAssignUsername('');
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    const username = assignUsername.trim();
    const courseId = getCourseId(assignModal.course);
    if (!username) {
      toast.error('Vui lòng nhập username học viên.');
      return;
    }
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học.');
      return;
    }
    try {
      setIsAssigning(true);
      await assignEnrollment({ username, courseId: Number(courseId) });
      toast.success('Đã gán học viên vào khóa học.');
      closeAssignModal();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Gán học viên thất bại.';
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <DashboardLayout
      pageTitle="Quản lý khóa học"
      pageSubtitle="Xem danh sách khóa học và gán học viên."
    >
      <section className="course-management-view">
        <div className="course-management-header">
          <div>
            <h2>Tất cả khóa học</h2>
            <p>Danh sách khóa học công khai</p>
          </div>
          <div className="manager-overview-actions">
            <div className="manager-search">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoadingCourses ? (
          <div className="course-status">Đang tải khóa học...</div>
        ) : coursesError ? (
          <div className="course-status course-status-error">{coursesError}</div>
        ) : (
          <div className="course-section-grid">
            {filteredCourses.length ? (
              filteredCourses.map((course, index) => {
                const courseId = getCourseId(course);
                const stats = courseStats[courseId] || { modules: 0, lessons: 0 };
                const isActive = resolveCourseActiveState(course);
                return (
                  <article
                    className="manager-card"
                    key={courseId || course.title || index}
                  >
                    <div className="manager-card-image">
                      <span className="manager-card-badge">ĐÃ DUYỆT</span>
                    </div>
                    <div className="manager-card-body">
                      <h3 className="manager-card-title">{course.title}</h3>
                      <div className="manager-card-meta">
                        <span className="manager-card-meta-item">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 3C2 2.44772 2.44772 2 3 2H5C5.55228 2 6 2.44772 6 3V5C6 5.55228 5.55228 6 5 6H3C2.44772 6 2 5.55228 2 5V3Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5C14 5.55228 13.5523 6 13 6H11C10.4477 6 10 5.55228 10 5V3Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M2 11C2 10.4477 2.44772 10 3 10H5C5.55228 10 6 10.4477 6 11V13C6 13.5523 5.55228 14 5 14H3C2.44772 14 2 13.5523 2 13V11Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M10 11C10 10.4477 10.4477 10 11 10H13C13.5523 10 14 10.4477 14 11V13C14 13.5523 13.5523 14 13 14H11C10.4477 14 10 13.5523 10 13V11Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          {stats.modules} Chương học
                        </span>
                        <span className="manager-card-meta-item">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M6 5L11 8L6 11V5Z" fill="currentColor"/>
                          </svg>
                          {stats.lessons} Bài học
                        </span>
                      </div>
                      <div className="manager-card-footer">
                        <div className="manager-card-status">
                          <span className="manager-card-status-text">
                            {isActive ? 'Công khai' : 'Riêng tư'}
                          </span>
                        </div>
                        <button
                          className="manager-card-edit"
                          type="button"
                          onClick={() => openAssignModal(course)}
                        >
                          Gán học viên
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="course-status">Chưa có khóa học nào.</div>
            )}
          </div>
        )}
      </section>

      {assignModal.isOpen && (
        <div className="course-edit-modal-overlay" onClick={closeAssignModal}>
          <div className="course-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="course-edit-modal-header">
              <h3>Gán học viên vào khóa học</h3>
              <button
                type="button"
                className="course-edit-modal-close"
                onClick={closeAssignModal}
                aria-label="Đóng"
              >
                x
              </button>
            </div>
            <form className="course-edit-modal-body" onSubmit={handleAssign}>
              <label className="course-edit-modal-label">Khóa học</label>
              <div className="course-edit-modal-input">{assignModal.course?.title || '—'}</div>
              <label className="course-edit-modal-label">Username học viên</label>
              <input
                className="course-edit-modal-input"
                type="text"
                value={assignUsername}
                onChange={(event) => setAssignUsername(event.target.value)}
                placeholder="Nhập username"
              />
              <div className="course-edit-modal-footer">
                <button
                  type="button"
                  className="course-edit-modal-btn"
                  onClick={closeAssignModal}
                  disabled={isAssigning}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="course-edit-modal-btn primary"
                  disabled={isAssigning}
                >
                  {isAssigning ? 'Đang gán...' : 'Gán học viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminCourseManagement;
