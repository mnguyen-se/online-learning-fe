import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createCourse, deleteCourse, getCourses, updateCourse } from '../../../api/coursesApi';
import { createLesson, deleteLesson, getLessons } from '../../../api/lessionApi';
import './courseManagement.css';

function CourseManagement() {
  const [viewMode, setViewMode] = useState('list'); // list | create | content
  const [activeTab, setActiveTab] = useState('general');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseError, setCourseError] = useState('');
  const [courseSuccess, setCourseSuccess] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [lessonError, setLessonError] = useState('');
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonsError, setLessonsError] = useState('');
  const [videoEditorFor, setVideoEditorFor] = useState(null);
  const [assignmentEditorFor, setAssignmentEditorFor] = useState(null);

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

  const toggleLesson = (id) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === id ? { ...lesson, isOpen: !lesson.isOpen } : lesson
      )
    );
  };

  const handleAddLesson = () => {
    setLessons((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((l) => l.id)) + 1 : 1;
      return [
        ...prev,
        {
          id: nextId,
          title: '',
          lessonType: 'VIDEO',
          contentUrl: '',
          contentFile: null,
          duration: 0,
          orderIndex: 0,
          sectionId: 0,
          isOpen: true,
          isServer: false,
        },
      ];
    });
  };

  const toggleVideoEditor = (id) => {
    setVideoEditorFor((current) => (current === id ? null : id));
  };

  const toggleAssignmentEditor = (id) => {
    setAssignmentEditorFor((current) => (current === id ? null : id));
  };

  const loadCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCoursesError('');
      const data = await getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      setCoursesError('Không thể tải danh sách khóa học.');
      console.error('Fetch courses error:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadLessonsForCourse = async (courseId) => {
    if (!courseId) {
      setLessons([]);
      return;
    }

    try {
      setIsLoadingLessons(true);
      setLessonsError('');
      const data = await getLessons({ courseId });
      const rawList = Array.isArray(data) ? data : data?.data;
      const nextLessons = Array.isArray(rawList)
        ? rawList.map((lesson) => ({
            id: lesson.id ?? lesson.lessonId ?? lesson._id ?? lesson.code ?? Date.now(),
            title: lesson.title ?? lesson.name ?? 'Chương mới',
            lessonType: lesson.lessonType ?? lesson.type ?? 'VIDEO',
            contentUrl: lesson.contentUrl ?? lesson.url ?? '',
            contentFile: null,
            duration: Number(lesson.duration ?? 0),
            orderIndex: Number(lesson.orderIndex ?? lesson.order ?? 0),
            sectionId: Number(lesson.sectionId ?? lesson.section ?? 0),
            isOpen: false,
            isServer: true,
          }))
        : [];
      setLessons(nextLessons);
    } catch (error) {
      setLessonsError('Không thể tải danh sách chương.');
      console.error('Fetch lessons error:', error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async () => {
    const trimmedTitle = courseTitle.trim();
    const trimmedDescription = courseDescription.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setCourseError('Vui lòng nhập tên khóa học và mô tả tổng quan.');
      return;
    }

    try {
      setCourseError('');
      setCourseSuccess('');
      setIsSavingCourse(true);
      const created = await createCourse({
        title: trimmedTitle,
        description: trimmedDescription,
      });
      const nextCourseId = getCourseId(created);
      if (nextCourseId) {
        setCreatedCourseId(nextCourseId);
      }
      setCourseTitle('');
      setCourseDescription('');
      setCourseSuccess('Đã tạo khóa học thành công.');
      toast.success('Tạo khóa học thành công.');
      await loadCourses();
      setViewMode('list');
    } catch (error) {
      setCourseError('Tạo khóa học thất bại. Vui lòng thử lại.');
      toast.error('Tạo khóa học thất bại. Vui lòng thử lại.');
      console.error('Create course error:', error);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    const courseId = getCourseId(course);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học để xóa.');
      console.error('Missing course id for delete:', course);
      return;
    }

    try {
      await deleteCourse(courseId);
      toast.success('Đã xóa khóa học.');
      await loadCourses();
    } catch (error) {
      toast.error('Xóa khóa học thất bại. Vui lòng thử lại.');
      console.error('Delete course error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const handleUpdateCourseContent = async () => {
    const courseId = getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học để cập nhật.');
      return;
    }

    try {
      await updateCourse(courseId, {
        title: selectedCourse?.title,
        description: selectedCourse?.description,
      });
      toast.success('Đã cập nhật nội dung khóa học.');
      await loadCourses();
    } catch (error) {
      toast.error('Cập nhật khóa học thất bại. Vui lòng thử lại.');
      console.error('Update course error:', error);
    }
  };

  const handleCreateLesson = async () => {
    const draftLesson = lessons.find((lesson) => !lesson.isServer);
    const trimmedTitle = draftLesson?.title?.trim();
    const matchedCourse = selectedCourse?.title
      ? courses.find((course) => course.title === selectedCourse.title)
      : null;
    const courseId =
      createdCourseId ?? getCourseId(selectedCourse) ?? getCourseId(matchedCourse);

    if (!trimmedTitle) {
      setLessonError('Vui lòng nhập tên chương.');
      return;
    }

    if (!courseId) {
      setLessonError('Vui lòng tạo khóa học trước khi thêm chương.');
      return;
    }

    try {
      setLessonError('');
      setIsSavingLesson(true);
      const payloadContentUrl =
        draftLesson?.lessonType === 'VIDEO'
          ? draftLesson?.contentFile?.name || draftLesson?.contentUrl || ''
          : draftLesson?.contentUrl || '';
      const created = await createLesson({
        title: trimmedTitle,
        lessonType: draftLesson?.lessonType || 'VIDEO',
        contentUrl: payloadContentUrl,
        duration: Number(draftLesson?.duration || 0),
        orderIndex: Number(draftLesson?.orderIndex || 0),
        sectionId: Number(draftLesson?.sectionId || 0),
        courseId,
      });
      const nextId = created?.id || draftLesson?.id || Date.now();
      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.id === draftLesson?.id
            ? {
                ...lesson,
                id: nextId,
                title: created?.title || trimmedTitle,
                isServer: Boolean(created?.id),
              }
            : lesson
        )
      );
      toast.success('Tạo chương thành công.');
      await loadLessonsForCourse(courseId);
    } catch (error) {
      setLessonError('Tạo chương thất bại. Vui lòng thử lại.');
      toast.error('Tạo chương thất bại. Vui lòng thử lại.');
      console.error('Create lesson error:', error);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!lesson?.isServer) {
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
      setVideoEditorFor((current) => (current === lesson.id ? null : current));
      setAssignmentEditorFor((current) => (current === lesson.id ? null : current));
      return;
    }

    try {
      await deleteLesson(lesson.id);
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
      setVideoEditorFor((current) => (current === lesson.id ? null : current));
      setAssignmentEditorFor((current) => (current === lesson.id ? null : current));
      toast.success('Đã xóa chương.');
    } catch (error) {
      toast.error('Xóa chương thất bại. Vui lòng thử lại.');
      console.error('Delete lesson error:', error);
    }
  };

  return (
    <div className="manager-shell">
      <header className="manager-topbar">
        <span className="manager-topbar-title">Nihongo Academy LMS</span>
      </header>

      <div className="manager-body">
        <aside className="manager-sidebar">
          <div className="manager-brand">
            <div className="manager-brand-icon">N</div>
            <div>
              <div className="manager-brand-title">Nihongo LMS</div>
              <div className="manager-brand-subtitle">Manager Panel</div>
            </div>
          </div>

          <div className="manager-sidebar-footer">
            <div className="manager-profile">
              <div className="manager-avatar">M</div>
              <div>
                <div className="manager-name">Manager Tanaka</div>
                <div className="manager-role">MANAGER</div>
              </div>
            </div>
            <button className="manager-logout" type="button" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="manager-main">
          <section className="manager-dashboard-content">
            {viewMode === 'list' ? (
              <>
                <div className="manager-hero">
                  <div className="manager-hero-text">
                    <h1>Quản lý khóa học</h1>
                    <p>Tạo, chỉnh sửa và theo dõi các khóa học trong hệ thống.</p>
                  </div>
                  <button
                    className="manager-cta"
                    type="button"
                    onClick={() => {
                      setViewMode('create');
                      setActiveTab('general');
                      setCourseTitle('');
                      setCourseDescription('');
                      setCourseError('');
                      setCourseSuccess('');
                      setCreatedCourseId(null);
                      setSelectedCourse(null);
                      setLessonError('');
                      setLessonsError('');
                      setLessons([]);
                    }}
                  >
                    <span className="cta-icon">+</span>
                    Tạo khóa học mới
                  </button>
                </div>

                <div className="manager-section-header">
                  <div>
                    <h2>Danh sách khóa học</h2>
                    <p>Chọn khóa học để tạo nội dung và bài học.</p>
                  </div>
                </div>

                <div className="manager-cards">
                  {isLoadingCourses && (
                    <div className="course-status">Đang tải khóa học...</div>
                  )}
                  {!isLoadingCourses && coursesError && (
                    <div className="course-status course-status-error">{coursesError}</div>
                  )}
                  {!isLoadingCourses && !coursesError && courses.length === 0 && (
                    <div className="course-status">Chưa có khóa học nào.</div>
                  )}
                  {!isLoadingCourses && !coursesError && courses.length > 0 && (
                    courses.map((course) => (
                      <article
                        className="manager-card"
                        key={course.id || course.title}
                        onClick={() => {
                          const nextCourseId = getCourseId(course);
                          setSelectedCourse({
                            ...course,
                            id: nextCourseId ?? course.id,
                          });
                          setCreatedCourseId(nextCourseId);
                          setActiveTab('content');
                          setLessonError('');
                          setLessonsError('');
                          setLessons([]);
                          loadLessonsForCourse(nextCourseId);
                          setViewMode('content');
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            const nextCourseId = getCourseId(course);
                            setSelectedCourse({
                              ...course,
                              id: nextCourseId ?? course.id,
                            });
                            setCreatedCourseId(nextCourseId);
                            setActiveTab('content');
                            setLessonError('');
                            setLessonsError('');
                            setLessons([]);
                            loadLessonsForCourse(nextCourseId);
                            setViewMode('content');
                          }
                        }}
                      >
                        <div className="manager-card-image">
                          <span className="manager-card-badge">ĐANG MỞ</span>
                        </div>
                        <div className="manager-card-body">
                          <h3>{course.title}</h3>
                          <p>{course.description}</p>
                          <div className="manager-card-actions">
                            <button
                              className="manager-card-delete"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteCourse(course);
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className={`course-create${viewMode === 'content' ? ' is-content' : ''}`}>
                <div className="course-create-header">
                  <div>
                    <h1>
                      {viewMode === 'content' && selectedCourse
                        ? `Nội dung khóa học: ${selectedCourse.title}`
                        : 'Soạn thảo khóa học'}
                    </h1>
                    <p>
                      {viewMode === 'content'
                        ? 'Thiết lập chương, video và bài tập cho khóa học.'
                        : 'Thiết lập lộ trình học tập với vai trò Manager.'}
                    </p>
                  </div>
                  <div className="course-create-actions">
                    {viewMode === 'content' ? (
                      <>
                        <button
                          className="course-action-btn secondary"
                          type="button"
                          onClick={() => {
                            setViewMode('list');
                            setSelectedCourse(null);
                          }}
                        >
                          Quay lại
                        </button>
                        <button
                          className="course-action-btn primary"
                          type="button"
                          onClick={handleCreateLesson}
                          disabled={isSavingLesson}
                        >
                          {isSavingLesson ? 'Đang tạo...' : 'Tạo chương'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="course-action-btn secondary"
                          type="button"
                          onClick={() => {
                            setViewMode('list');
                            setCourseTitle('');
                            setCourseDescription('');
                            setCourseError('');
                            setCourseSuccess('');
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          className="course-action-btn primary"
                          type="button"
                          onClick={handleCreateCourse}
                          disabled={isSavingCourse}
                        >
                          {isSavingCourse ? 'Đang tạo...' : 'Tạo'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {viewMode === 'content' && (
                  <div className="course-content-hero">
                    {selectedCourse ? (
                      <>
                        <div className="course-content-info">
                          <span className="course-pill">ĐANG MỞ</span>
                          <h2>{selectedCourse.title}</h2>
                          <p>
                            {selectedCourse.description ||
                              'Khóa học này chưa có mô tả tổng quan.'}
                          </p>
                        </div>
                        <div className="course-content-actions">
                          <button
                            className="course-outline-btn"
                            type="button"
                            onClick={handleUpdateCourseContent}
                          >
                            Cập nhật thông tin
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="course-content-empty">
                        <h2>Chưa chọn khóa học</h2>
                        <p>Vui lòng quay lại danh sách và chọn một khóa học.</p>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === 'create' && (
                  <div className="course-tabs">
                    <button
                      className={`course-tab ${activeTab === 'general' ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => setActiveTab('general')}
                    >
                      <span className="tab-icon">▦</span>
                      Cấu hình chung
                    </button>
                  </div>
                )}

                {viewMode === 'create' && activeTab === 'general' ? (
                  <div className="course-form-card">
                    <div className="course-form-grid">
                      <div className="course-form-left">
                        <label className="course-label">TÊN KHÓA HỌC</label>
                        <input
                          className="course-input"
                          type="text"
                          placeholder="VD: Tiếng Nhật sơ cấp N5"
                          value={courseTitle}
                          onChange={(event) => setCourseTitle(event.target.value)}
                        />

                        <label className="course-label">MÔ TẢ TỔNG QUAN</label>
                        <textarea
                          className="course-textarea"
                          placeholder="Mô tả nội dung cho học viên..."
                          rows={5}
                          value={courseDescription}
                          onChange={(event) => setCourseDescription(event.target.value)}
                        />
                        {courseError && (
                          <p className="course-error">{courseError}</p>
                        )}
                        {courseSuccess && (
                          <p className="course-success">{courseSuccess}</p>
                        )}
                      </div>

                      <div className="course-form-right">
                        <label className="course-label">ẢNH ĐẠI DIỆN</label>
                        <div className="course-cover">
                          <img
                            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=60"
                            alt="Course cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'content' ? (
                  <div className="course-content-card">
                    {lessonError && (
                      <p className="lesson-error">{lessonError}</p>
                    )}
                    {lessonsError && (
                      <div className="course-status course-status-error">{lessonsError}</div>
                    )}
                    {isLoadingLessons && (
                      <div className="course-status">Đang tải chương...</div>
                    )}
                    {!isLoadingLessons && !lessonsError && lessons.length === 0 && (
                      <div className="course-status">Chưa có chương nào.</div>
                    )}
                    {!isLoadingLessons && !lessonsError && lessons.map((lesson) => (
                      <div className="lesson-block" key={`lesson-${lesson.id}`}>
                        <div className={`course-lesson${lesson.isOpen ? ' is-open' : ''}`}>
                          <button
                            className="lesson-toggle"
                            type="button"
                            aria-label="Toggle"
                            onClick={() => toggleLesson(lesson.id)}
                          >
                            {lesson.isOpen ? '▾' : '▸'}
                          </button>
                          <div className="lesson-main">
                            <div className="lesson-title-row">
                              <span className="lesson-title">Chương mới</span>
                            </div>
                            <div className="lesson-field">
                              <input
                                className="lesson-title-input"
                                type="text"
                                placeholder="Nhập tên chương..."
                                value={lesson.title ?? ''}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setLessons((prev) =>
                                    prev.map((item) =>
                                      item.id === lesson.id ? { ...item, title: value } : item
                                    )
                                  );
                                }}
                              />
                            </div>
                            <div className="lesson-field-grid">
                              <label className="lesson-label">Loại bài học</label>
                              <select
                                className="lesson-title-input"
                                value={lesson.lessonType ?? 'VIDEO'}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setLessons((prev) =>
                                    prev.map((item) =>
                                      item.id === lesson.id
                                        ? { ...item, lessonType: value }
                                        : item
                                    )
                                  );
                                }}
                              >
                                <option value="VIDEO">VIDEO</option>
                                <option value="ASSIGNMENT">ASSIGNMENT</option>
                              </select>
                            </div>
                            <div className="lesson-field-grid">
                              <label className="lesson-label">Nội dung</label>
                              {lesson.lessonType === 'VIDEO' ? (
                                <input
                                  className="lesson-title-input"
                                  type="file"
                                  accept="video/*"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] || null;
                                    setLessons((prev) =>
                                      prev.map((item) =>
                                        item.id === lesson.id
                                          ? {
                                              ...item,
                                              contentFile: file,
                                              contentUrl: file?.name || '',
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                />
                              ) : (
                                <input
                                  className="lesson-title-input"
                                  type="text"
                                  placeholder="Nhập đường dẫn nội dung..."
                                  value={lesson.contentUrl ?? ''}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setLessons((prev) =>
                                      prev.map((item) =>
                                        item.id === lesson.id
                                          ? { ...item, contentUrl: value }
                                          : item
                                      )
                                    );
                                  }}
                                />
                              )}
                            </div>
                            <div className="lesson-field-row">
                              <div className="lesson-field-grid">
                                <label className="lesson-label">Thời lượng (phút)</label>
                                <input
                                  className="lesson-title-input"
                                  type="number"
                                  min="0"
                                  value={lesson.duration ?? 0}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setLessons((prev) =>
                                      prev.map((item) =>
                                        item.id === lesson.id
                                          ? { ...item, duration: value }
                                          : item
                                      )
                                    );
                                  }}
                                />
                              </div>
                              <div className="lesson-field-grid">
                                <label className="lesson-label">Thứ tự</label>
                                <input
                                  className="lesson-title-input"
                                  type="number"
                                  min="0"
                                  value={lesson.orderIndex ?? 0}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setLessons((prev) =>
                                      prev.map((item) =>
                                        item.id === lesson.id
                                          ? { ...item, orderIndex: value }
                                          : item
                                      )
                                    );
                                  }}
                                />
                              </div>
                              <div className="lesson-field-grid">
                                <label className="lesson-label">Section ID</label>
                                <input
                                  className="lesson-title-input"
                                  type="number"
                                  min="0"
                                  value={lesson.sectionId ?? 0}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setLessons((prev) =>
                                      prev.map((item) =>
                                        item.id === lesson.id
                                          ? { ...item, sectionId: value }
                                          : item
                                      )
                                    );
                                  }}
                                />
                              </div>
                            </div>
                            {lesson.isOpen && (
                              <div className="lesson-actions">
                                <button
                                  className="lesson-action lesson-action-video"
                                  type="button"
                                  onClick={() => toggleVideoEditor(lesson.id)}
                                >
                                  + Video bài giảng
                                </button>
                                <button
                                  className="lesson-action lesson-action-quiz"
                                  type="button"
                                  onClick={() => toggleAssignmentEditor(lesson.id)}
                                >
                                  + Bài tập rời
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            className="lesson-delete"
                            type="button"
                            aria-label="Delete"
                            onClick={() => handleDeleteLesson(lesson)}
                          >
                            🗑
                          </button>
                        </div>
                        {lesson.isOpen && videoEditorFor === lesson.id && (
                          <div className="lesson-upload">
                            <div className="lesson-upload-header">
                              <div className="lesson-upload-title">
                                <span className="upload-icon">📹</span>
                                <input
                                  className="lesson-upload-name"
                                  type="text"
                                  placeholder="Bài giảng video mới"
                                />
                              </div>
                              <span className="lesson-upload-tag">VIDEO</span>
                              <button
                                className="lesson-upload-close"
                                type="button"
                                onClick={() => setVideoEditorFor(null)}
                              >
                                ×
                              </button>
                            </div>
                            <div className="lesson-upload-field">
                              <input
                                className="lesson-upload-input"
                                type="file"
                                accept="video/*"
                              />
                            </div>
                          </div>
                        )}
                        {lesson.isOpen && assignmentEditorFor === lesson.id && (
                          <div className="lesson-upload assignment-upload">
                            <div className="lesson-upload-header">
                              <div className="lesson-upload-title">
                                <span className="upload-icon">📝</span>
                                <input
                                  className="lesson-upload-name"
                                  type="text"
                                  placeholder="Nhiệm vụ bài tập mới"
                                />
                              </div>
                              <span className="lesson-upload-tag assignment-tag">ASSIGNMENT</span>
                              <button
                                className="lesson-upload-close"
                                type="button"
                                onClick={() => setAssignmentEditorFor(null)}
                              >
                                ×
                              </button>
                            </div>
                            <div className="lesson-upload-field">
                              <textarea
                                className="lesson-upload-textarea"
                                placeholder="Yêu cầu bài tập..."
                                rows={3}
                              />
                            </div>
                            <div className="assignment-meta">
                              <div>
                                <label>THỜI GIAN LÀM BÀI</label>
                                <input className="lesson-upload-input" type="text" placeholder="VD: 30 phút" />
                              </div>
                              <div>
                                <label>ĐIỂM</label>
                                <input className="lesson-upload-input" type="text" placeholder="100" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <button className="lesson-add" type="button" onClick={handleAddLesson}>
                      + Thêm chương mới
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default CourseManagement;