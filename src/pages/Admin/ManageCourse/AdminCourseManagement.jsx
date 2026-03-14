import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/DashboardLayout';
import StudentListModal from '../../../components/StudentListModal/StudentListModal';
import { getAllUsers } from '../../../api/userApi';
import { getCourses } from '../../../api/coursesApi';
import { getLessons } from '../../../api/lessionApi';
import { getModulesByCourse } from '../../../api/module';
import { getAssignmentsByCourse } from '../../../api/assignmentApi';
import { assignEnrollment, getEnrolledStudentsByCourse } from '../../../api/enrollmentApi';
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
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [assignAvailableStudents, setAssignAvailableStudents] = useState([]);
  const [assignLoadingStudents, setAssignLoadingStudents] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [studentListModal, setStudentListModal] = useState({ isOpen: false, courseId: null, courseTitle: '' });
  const assignDropdownRef = useRef(null);

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

  /** Lấy số liệu thực tế theo courseId: số chương, bài học, bài kiểm tra, số học sinh từ API */
  const loadCourseStats = async (courseId) => {
    if (!courseId) return { modules: 0, lessons: 0, assignments: 0, students: 0 };
    try {
      const [modulesRes, lessonsRes, assignmentsRes, studentsRes] = await Promise.all([
        getModulesByCourse(courseId),
        getLessons({ courseId }),
        getAssignmentsByCourse(courseId).catch(() => []),
        getEnrolledStudentsByCourse(courseId).catch(() => []),
      ]);
      const modulesList = Array.isArray(modulesRes) ? modulesRes : modulesRes?.data ?? [];
      const lessonsList = Array.isArray(lessonsRes) ? lessonsRes : lessonsRes?.data ?? [];
      const assignmentsList = Array.isArray(assignmentsRes) ? assignmentsRes : assignmentsRes?.data ?? [];
      const studentsList = Array.isArray(studentsRes) ? studentsRes : studentsRes?.data ?? [];
      return {
        modules: modulesList.length,
        lessons: lessonsList.length,
        assignments: assignmentsList.length,
        students: studentsList.length,
      };
    } catch {
      return { modules: 0, lessons: 0, assignments: 0, students: 0 };
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
        return { courseId: null, stats: { modules: 0, lessons: 0, assignments: 0, students: 0 } };
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
    setAssignSearchQuery('');
    setAssignDropdownOpen(false);
    setAssignAvailableStudents([]);
  };

  const closeAssignModal = () => {
    setAssignModal({ isOpen: false, course: null });
    setAssignUsername('');
    setAssignSearchQuery('');
    setAssignDropdownOpen(false);
    setAssignAvailableStudents([]);
  };

  /** Khi modal gán học viên mở, tải danh sách học viên chưa gán vào khóa */
  useEffect(() => {
    if (!assignModal.isOpen || !assignModal.course) return;
    const courseId = getCourseId(assignModal.course);
    if (!courseId) return;

    let cancelled = false;
    setAssignLoadingStudents(true);
    Promise.all([
      getAllUsers(),
      getEnrolledStudentsByCourse(courseId).catch(() => []),
    ])
      .then(([usersRes, enrolledRes]) => {
        if (cancelled) return;
        const users = Array.isArray(usersRes) ? usersRes : usersRes?.data ?? [];
        const enrolled = Array.isArray(enrolledRes) ? enrolledRes : enrolledRes?.data ?? [];
        const enrolledUsernames = new Set(
          enrolled.map((e) => (e.username ?? e.userName ?? '').toLowerCase()).filter(Boolean)
        );
        const students = users
          .filter((u) => (u.role ?? '').toUpperCase() === 'STUDENT' && u.active !== false)
          .filter((u) => !enrolledUsernames.has((u.username ?? '').toLowerCase()));
        setAssignAvailableStudents(students);
      })
      .catch(() => {
        if (!cancelled) setAssignAvailableStudents([]);
      })
      .finally(() => {
        if (!cancelled) setAssignLoadingStudents(false);
      });
    return () => { cancelled = true; };
  }, [assignModal.isOpen, assignModal.course]);

  /** Học viên đã chọn (để hiển thị tên) */
  const selectedStudent = useMemo(() => {
    if (!assignUsername) return null;
    return assignAvailableStudents.find(
      (u) => (u.username ?? '').toLowerCase() === assignUsername.toLowerCase()
    );
  }, [assignUsername, assignAvailableStudents]);

  /** Danh sách gợi ý sau khi lọc theo search */
  const assignFilteredStudents = useMemo(() => {
    const q = (assignSearchQuery ?? '').trim().toLowerCase();
    if (!q) return assignAvailableStudents.slice(0, 10);
    const haystack = (u) =>
      [u.username, u.name, u.email].filter(Boolean).join(' ').toLowerCase();
    return assignAvailableStudents
      .filter((u) => haystack(u).includes(q))
      .slice(0, 10);
  }, [assignAvailableStudents, assignSearchQuery]);

  /** Click outside để đóng dropdown */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target)) {
        setAssignDropdownOpen(false);
      }
    };
    if (assignModal.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [assignModal.isOpen]);

  const handleAssign = async (event) => {
    event.preventDefault();
    const username = assignUsername.trim();
    const courseId = getCourseId(assignModal.course);
    if (!username) {
      toast.error('Vui lòng chọn học viên từ danh sách.');
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
      // Cập nhật lại số học sinh trên card khóa học vừa gán
      const stats = await loadCourseStats(courseId);
      setCourseStats((prev) => ({ ...prev, [courseId]: { ...prev[courseId], ...stats } }));
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
                const stats = courseStats[courseId] || { modules: 0, lessons: 0, assignments: 0, students: 0 };
                const isActive = resolveCourseActiveState(course);
                const chaptersCount = Number(stats.modules) || 0;
                const lessonsCount = Number(stats.lessons) || 0;
                const testsCount = Number(stats.assignments) || 0;
                const studentsCount = Number(stats.students) || 0;
                return (
                  <article
                    className="manager-course-card"
                    key={courseId || course.title || index}
                  >
                    <h3 className="manager-course-card__title">{course.title}</h3>
                    <div className="manager-course-card__meta">
                      <div className="manager-course-card__meta-row">
                        <span className="manager-course-card__meta-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M8 7h8" />
                            <path d="M8 11h6" />
                          </svg>
                        </span>
                        <span>{chaptersCount} CHƯƠNG</span>
                      </div>
                      <div className="manager-course-card__meta-row">
                        <span className="manager-course-card__meta-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                        </span>
                        <span>{lessonsCount} BÀI HỌC</span>
                      </div>
                      <div className="manager-course-card__meta-row">
                        <span className="manager-course-card__meta-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                        </span>
                        <span>{testsCount} BÀI KIỂM TRA</span>
                      </div>
                      <div className="manager-course-card__meta-row">
                        <span className="manager-course-card__meta-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </span>
                        <span
                          className={`manager-course-card__students ${studentsCount > 0 ? 'manager-course-card__students--clickable' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (studentsCount > 0 && courseId) {
                              setStudentListModal({ isOpen: true, courseId, courseTitle: course.title || '' });
                            }
                          }}
                          role={studentsCount > 0 ? 'button' : undefined}
                          tabIndex={studentsCount > 0 ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (studentsCount > 0 && courseId && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              setStudentListModal({ isOpen: true, courseId, courseTitle: course.title || '' });
                            }
                          }}
                          title={studentsCount > 0 ? 'Xem chi tiết danh sách học viên' : undefined}
                        >
                          {studentsCount} HỌC VIÊN
                        </span>
                      </div>
                    </div>
                    <div className="manager-course-card__footer">
                      <span className="manager-card-status-text">
                        {isActive ? 'Công khai' : 'Riêng tư'}
                      </span>
                      <button
                        type="button"
                        className="manager-card-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssignModal(course);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Gán học viên
                      </button>
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
              <label className="course-edit-modal-label">Chọn học viên (tìm theo tên, email, username)</label>
              <div className="assign-student-select" ref={assignDropdownRef}>
                {selectedStudent ? (
                  <div className="assign-student-selected">
                    <span className="assign-student-selected-text">
                      {selectedStudent.name || selectedStudent.username} <em>(@{selectedStudent.username})</em>
                    </span>
                    <button
                      type="button"
                      className="assign-student-clear"
                      onClick={() => { setAssignUsername(''); setAssignSearchQuery(''); setAssignDropdownOpen(true); }}
                      aria-label="Chọn lại"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <input
                    className="course-edit-modal-input assign-student-input"
                    type="text"
                    value={assignSearchQuery}
                    onChange={(e) => {
                      setAssignSearchQuery(e.target.value);
                      setAssignDropdownOpen(true);
                    }}
                    onFocus={() => setAssignDropdownOpen(true)}
                    placeholder={assignLoadingStudents ? 'Đang tải danh sách...' : 'Gõ tên, email hoặc username để tìm...'}
                    disabled={assignLoadingStudents}
                    autoComplete="off"
                  />
                )}
                {assignDropdownOpen && (
                  <div className="assign-student-dropdown">
                    {assignFilteredStudents.length === 0 ? (
                      <div className="assign-student-dropdown-empty">
                        {assignAvailableStudents.length === 0
                          ? 'Không còn học viên nào chưa gán.'
                          : 'Không tìm thấy kết quả phù hợp.'}
                      </div>
                    ) : (
                      assignFilteredStudents.map((u) => (
                        <button
                          key={u.id ?? u.userId ?? u.username}
                          type="button"
                          className="assign-student-option"
                          onClick={() => {
                            setAssignUsername(u.username ?? '');
                            setAssignSearchQuery('');
                            setAssignDropdownOpen(false);
                          }}
                        >
                          <span className="assign-student-option-name">{u.name || u.username || '—'}</span>
                          <span className="assign-student-option-meta">{u.email || ''} · @{u.username}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
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

      <StudentListModal
        isOpen={studentListModal.isOpen}
        onClose={() => setStudentListModal({ isOpen: false, courseId: null, courseTitle: '' })}
        courseId={studentListModal.courseId}
        courseTitle={studentListModal.courseTitle}
        onUnassignSuccess={(cid) => {
          if (cid) loadCourseStats(cid).then((stats) => setCourseStats((prev) => ({ ...prev, [cid]: { ...prev[cid], ...stats } })));
        }}
      />
    </DashboardLayout>
  );
}

export default AdminCourseManagement;
