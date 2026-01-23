import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createCourse, deleteCourse, getActiveCourses, getCourses, updateCourse } from '../../../api/coursesApi';
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
  const [courseFilter, setCourseFilter] = useState('all'); // all | active
  const [courseStats, setCourseStats] = useState({}); // { courseId: { modules: number, lessons: number } }
  const [courseActiveStates, setCourseActiveStates] = useState({}); // { courseId: boolean }
  const [lessonError, setLessonError] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonsError, setLessonsError] = useState('');
  const [videoEditorFor, setVideoEditorFor] = useState(null);
  const [assignmentEditorFor, setAssignmentEditorFor] = useState(null);
  const [contentTab, setContentTab] = useState('general'); // general | program
  const [courseCoverImageUrl, setCourseCoverImageUrl] = useState('https://picsum.photos/seed/0.6705225405054475/800/600');

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

  const formatCourseId = (courseId) => {
    if (!courseId) return '';
    // Format: CRS_xxxxx (5 ký tự ngẫu nhiên)
    const randomStr = courseId.toString().padStart(5, '0').slice(-5).toUpperCase();
    return `CRS_${randomStr}`;
  };

  // Backend đang dùng `isPublic` để xác định khóa học "active" (soft delete = isPublic false).
  // FE trước đó đọc `isActive` (không tồn tại) nên sau F5 sẽ luôn bị hiểu lại là ACTIVE.
  const getCourseIsActive = (course) => {
    const candidate =
      course?.isPublic ??
      course?.is_public ??
      course?.public ??
      course?.isActive ??
      course?.is_active;

    return typeof candidate === 'boolean' ? candidate : true;
  };

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

  const loadCourseStats = async (courseId) => {
    if (!courseId) return { modules: 0, lessons: 0 };

    try {
      const data = await getLessons({ courseId });
      const rawList = Array.isArray(data) ? data : data?.data;
      const lessonsList = Array.isArray(rawList) ? rawList : [];

      // Đếm số modules (unique sectionId)
      const uniqueSections = new Set(
        lessonsList
          .map((lesson) => lesson.sectionId ?? lesson.section_id ?? lesson.section ?? 0)
          .filter((id) => id > 0)
      );
      const modulesCount = uniqueSections.size || 0;

      // Đếm số lessons
      const lessonsCount = lessonsList.length;

      return { modules: modulesCount, lessons: lessonsCount };
    } catch (error) {
      console.error('Load course stats error:', error);
      return { modules: 0, lessons: 0 };
    }
  };

  const loadCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCoursesError('');
      const data = await getCourses();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:109',message:'API response from getCourses',data:{isArray:Array.isArray(data),hasData:!!data?.data,firstCourse:Array.isArray(data)?data[0]:data?.data?.[0],firstCourseKeys:Array.isArray(data)?Object.keys(data[0]||{}):Object.keys(data?.data?.[0]||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const rawCoursesList = Array.isArray(data) ? data : (data?.data || []);
      // Normalize courses để đảm bảo có ID
      const coursesList = rawCoursesList.map((course) => {
        const courseId = getCourseId(course);
        return {
          ...course,
          id: courseId || course.id,
        };
      });
      setCourses(coursesList);

      // Load stats cho mỗi course
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
      const newActiveStates = {};
      statsResults.forEach(({ courseId, stats }) => {
        if (courseId) {
          newStats[courseId] = stats;
        }
      });
      coursesList.forEach((course) => {
        const courseId = getCourseId(course);
        if (courseId) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:139',message:'Setting active state for course',data:{courseId,courseFields:Object.keys(course),isPublic:course.isPublic,isPublicType:typeof course.isPublic,computedValue:getCourseIsActive(course)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          newActiveStates[courseId] = getCourseIsActive(course);
        }
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:146',message:'Final active states object',data:{newActiveStates,allCourseIds:coursesList.map(c=>getCourseId(c))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setCourseStats(newStats);
      setCourseActiveStates(newActiveStates);
    } catch (error) {
      setCoursesError('Không thể tải danh sách khóa học.');
      console.error('Fetch courses error:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadActiveCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCoursesError('');
      const data = await getActiveCourses();
      const rawCoursesList = Array.isArray(data) ? data : (data?.data || []);
      // Normalize courses để đảm bảo có ID
      const coursesList = rawCoursesList.map((course) => {
        const courseId = getCourseId(course);
        return {
          ...course,
          id: courseId || course.id,
        };
      });
      setCourses(coursesList);

      // Load stats cho mỗi course
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
      const newActiveStates = {};
      statsResults.forEach(({ courseId, stats }) => {
        if (courseId) {
          newStats[courseId] = stats;
        }
      });
      coursesList.forEach((course) => {
        const courseId = getCourseId(course);
        if (courseId) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:192',message:'Setting active state for course (active filter)',data:{courseId,courseFields:Object.keys(course),isPublic:course.isPublic,isPublicType:typeof course.isPublic,computedValue:getCourseIsActive(course)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          newActiveStates[courseId] = getCourseIsActive(course);
        }
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:196',message:'Final active states object (active filter)',data:{newActiveStates,allCourseIds:coursesList.map(c=>getCourseId(c))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setCourseStats(newStats);
      setCourseActiveStates(newActiveStates);
    } catch (error) {
      setCoursesError('Không thể tải danh sách khóa học đang mở.');
      console.error('Fetch active courses error:', error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line no-unused-vars
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
      
      const courseData = {
        title: trimmedTitle,
        description: trimmedDescription,
        isPublic: true,
      };
      
      console.log('Creating course with data:', courseData);
      const created = await createCourse(courseData);
      console.log('Course created response:', created);
      
      const nextCourseId = getCourseId(created);
      console.log('Extracted course ID:', nextCourseId);
      
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
      console.error('Create course error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Tạo khóa học thất bại. Vui lòng thử lại.';
      setCourseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleContinueToContent = async () => {
    const trimmedTitle = courseTitle.trim();
    const trimmedDescription = courseDescription.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setCourseError('Vui lòng nhập tên khóa học và mô tả tổng quan.');
      return;
    }

    try {
      setCourseError('');
      setIsSavingCourse(true);
      
      const courseData = {
        title: trimmedTitle,
        description: trimmedDescription,
        isPublic: true,
      };
      
      const created = await createCourse(courseData);
      console.log('Course created response:', created);
      const nextCourseId = getCourseId(created);
      console.log('Extracted course ID:', nextCourseId);
      
      if (nextCourseId) {
        setCreatedCourseId(nextCourseId);
        // Tìm course vừa tạo để set làm selectedCourse
        const newCourse = {
          id: nextCourseId,
          courseId: nextCourseId,
          title: trimmedTitle,
          description: trimmedDescription,
          isPublic: true,
        };
        setSelectedCourse(newCourse);
        setContentTab('general');
        setLessons([]);
        setViewMode('content');
        await loadLessonsForCourse(nextCourseId);
        toast.success('Đã tạo khóa học. Bạn có thể bắt đầu soạn nội dung.');
      } else {
        throw new Error('Không thể lấy ID khóa học sau khi tạo.');
      }
    } catch (error) {
      console.error('Create course error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Tạo khóa học thất bại. Vui lòng thử lại.';
      setCourseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleToggleActive = async (course, event) => {
    event.stopPropagation();
    event.preventDefault();
    
    // Ưu tiên dùng course.id vì đã được normalize
    const courseId = course?.id || getCourseId(course);
    if (!courseId) {
      console.error('Course object:', course);
      console.error('Available fields:', Object.keys(course || {}));
      toast.error('Không tìm thấy mã khóa học. Vui lòng thử lại.');
      return;
    }

    const currentState =
      typeof courseActiveStates[courseId] === 'boolean'
        ? courseActiveStates[courseId]
        : getCourseIsActive(course);
    const newActiveState = !currentState;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:305',message:'Toggle active state',data:{courseId,currentState,currentStateValue:courseActiveStates[courseId],newActiveState,allStates:courseActiveStates},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Cập nhật state local ngay lập tức
    setCourseActiveStates((prev) => ({
      ...prev,
      [courseId]: newActiveState,
    }));

    // Nếu toggle OFF, gọi API delete
    if (!newActiveState) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:316',message:'Calling deleteCourse (mark inactive)',data:{courseId,courseSnapshot:{id:course?.id,title:course?.title,isActive:course?.isActive,keys:Object.keys(course||{})}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        await deleteCourse(courseId);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:318',message:'deleteCourse success',data:{courseId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        toast.success('Đã đánh dấu khóa học là INACTIVE.');
        // Reload danh sách để cập nhật từ server
        // await loadCourses();
      } catch (error) {
        // Nếu API thất bại, revert lại state
        setCourseActiveStates((prev) => ({
          ...prev,
          [courseId]: true,
        }));
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:328',message:'deleteCourse failed (reverted to active)',data:{courseId,errorMessage:error?.message,httpStatus:error?.response?.status,serverMessage:error?.response?.data?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        toast.error('Đánh dấu khóa học thất bại. Vui lòng thử lại.');
        console.error('Delete course error:', error);
      }
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

  const _handleCreateLesson = async () => {
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
      // Cập nhật stats
      const updatedStats = await loadCourseStats(courseId);
      setCourseStats((prev) => ({
        ...prev,
        [courseId]: updatedStats,
      }));
    } catch (error) {
      setLessonError('Tạo chương thất bại. Vui lòng thử lại.');
      toast.error('Tạo chương thất bại. Vui lòng thử lại.');
      console.error('Create lesson error:', error);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    const courseId = createdCourseId ?? getCourseId(selectedCourse);
    
    if (!lesson?.isServer) {
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
      setVideoEditorFor((current) => (current === lesson.id ? null : current));
      setAssignmentEditorFor((current) => (current === lesson.id ? null : current));
      // Cập nhật stats cho local lesson
      if (courseId) {
        const updatedStats = await loadCourseStats(courseId);
        setCourseStats((prev) => ({
          ...prev,
          [courseId]: updatedStats,
        }));
      }
      return;
    }

    try {
      await deleteLesson(lesson.id);
      setLessons((prev) => prev.filter((item) => item.id !== lesson.id));
      setVideoEditorFor((current) => (current === lesson.id ? null : current));
      setAssignmentEditorFor((current) => (current === lesson.id ? null : current));
      toast.success('Đã xóa chương.');
      // Cập nhật stats
      if (courseId) {
        const updatedStats = await loadCourseStats(courseId);
        setCourseStats((prev) => ({
          ...prev,
          [courseId]: updatedStats,
        }));
      }
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
                    <h1>Manager Dashboard</h1>
                    <p>Hệ thống quản lý Module &amp; Lesson tập trung.</p>
                  </div>
                  <div className="manager-hero-actions">
                    <div className="manager-filter">
                      <button
                        className={`manager-filter-btn${courseFilter === 'all' ? ' is-active is-all-active' : ''}`}
                        type="button"
                        onClick={() => {
                          setCourseFilter('all');
                          loadCourses();
                        }}
                      >
                        Tất cả
                      </button>
                      <button
                        className={`manager-filter-btn${courseFilter === 'active' ? ' is-active is-open-active' : ''}`}
                        type="button"
                        onClick={() => {
                          setCourseFilter('active');
                          loadActiveCourses();
                        }}
                      >
                        Đang mở
                      </button>
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
                      Tạo khóa học
                    </button>
                  </div>
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
                    courses.map((course) => {
                      const courseId = getCourseId(course);
                      if (!courseId) {
                        console.warn('Course missing ID:', course);
                      }
                      return (
                      <article
                        className="manager-card"
                        key={courseId || course.title || Math.random()}
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
                              {(() => {
                                const courseId = getCourseId(course);
                                const stats = courseStats[courseId] || { modules: 0, lessons: 0 };
                                return `${stats.modules} Modules`;
                              })()}
                            </span>
                            <span className="manager-card-meta-item">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M6 5L11 8L6 11V5Z" fill="currentColor"/>
                              </svg>
                              {(() => {
                                const courseId = getCourseId(course);
                                const stats = courseStats[courseId] || { modules: 0, lessons: 0 };
                                return `${stats.lessons} Bài học`;
                              })()}
                            </span>
                          </div>
                          <div className="manager-card-footer">
                            <div className="manager-card-status">
                              {(() => {
                                const courseId = getCourseId(course);
                                const isActive =
                                  typeof courseActiveStates[courseId] === 'boolean'
                                    ? courseActiveStates[courseId]
                                    : getCourseIsActive(course);
                                // #region agent log
                                fetch('http://127.0.0.1:7242/ingest/9ab295f0-69d4-492f-98b8-c8176b295abd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CourseManagement.jsx:643',message:'Rendering toggle display',data:{courseId,stateValue:courseActiveStates[courseId],stateType:typeof courseActiveStates[courseId],computedIsActive:isActive,courseTitle:course.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                                // #endregion
                                return (
                                  <label 
                                    className="manager-card-toggle"
                                    onClick={(event) => handleToggleActive(course, event)}
                                    onMouseDown={(event) => event.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isActive}
                                      onChange={(event) => handleToggleActive(course, event)}
                                      onClick={(event) => event.stopPropagation()}
                                    />
                                    <span className="manager-card-toggle-slider"></span>
                                    <span className="manager-card-status-text">
                                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </label>
                                );
                              })()}
                            </div>
                            <button 
                              className="manager-card-edit" 
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
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
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.68601 11.9447 1.5913C12.1731 1.49659 12.4173 1.44824 12.6633 1.44824C12.9094 1.44824 13.1536 1.49659 13.382 1.5913C13.6104 1.68601 13.8183 1.8249 13.9933 2.00001C14.1684 2.17512 14.3073 2.38301 14.402 2.61141C14.4967 2.83981 14.5451 3.08401 14.5451 3.33001C14.5451 3.57601 14.4967 3.82021 14.402 4.04861C14.3073 4.27701 14.1684 4.4849 13.9933 4.66001L5.15998 13.4933L1.33331 14.6667L2.50665 10.84L11.3333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Chỉnh sửa
                            </button>
                          </div>
                        </div>
                      </article>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className={`course-create${viewMode === 'content' ? ' is-content' : ''}`}>
                {viewMode === 'content' && selectedCourse ? (
                  <div className="course-content-layout">
                    {/* Left Sidebar */}
                    <div className="course-content-sidebar">
                      <div className="course-id-display">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="course-id-text">
                          ĐÃ CẤP ID: {formatCourseId(getCourseId(selectedCourse))}
                        </span>
                      </div>

                      <button
                        className={`course-sidebar-btn ${contentTab === 'general' ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => setContentTab('general')}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 2.5C10.6904 2.5 11.25 3.05964 11.25 3.75V5H13.75C14.4404 5 15 5.55964 15 6.25V16.25C15 16.9404 14.4404 17.5 13.75 17.5H6.25C5.55964 17.5 5 16.9404 5 16.25V6.25C5 5.55964 5.55964 5 6.25 5H8.75V3.75C8.75 3.05964 9.30964 2.5 10 2.5ZM10 4.375H8.75V6.25H10V4.375Z" fill="currentColor"/>
                        </svg>
                        Cấu hình chung
                      </button>

                      <div className="course-program-section">
                        <div className="course-program-header">
                          <span className="course-program-title">CHƯƠNG TRÌNH HỌC</span>
                          <button
                            className="course-program-add"
                            type="button"
                            onClick={() => {
                              setContentTab('program');
                              handleAddLesson();
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 3V13M3 8H13" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <button
                        className="course-save-finish-btn"
                        type="button"
                        onClick={async () => {
                          await handleUpdateCourseContent();
                          setViewMode('list');
                          setSelectedCourse(null);
                          toast.success('Đã lưu và kết thúc chỉnh sửa khóa học.');
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.5 5.83333L9.16667 14.1667L4.16667 9.16667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Lưu & Kết thúc
                      </button>
                    </div>

                    {/* Right Main Content */}
                    <div className="course-content-main">
                      {contentTab === 'general' ? (
                        <div className="course-general-config">
                          <div className="course-cover-section">
                            <label className="course-label">ẢNH BÌA KHÓA HỌC</label>
                            <input
                              className="course-cover-url-input"
                              type="text"
                              placeholder="Nhập URL ảnh bìa..."
                              value={courseCoverImageUrl}
                              onChange={(event) => setCourseCoverImageUrl(event.target.value)}
                            />
                            <div className="course-cover-preview">
                              <img
                                src={courseCoverImageUrl || 'https://via.placeholder.com/800x600'}
                                alt="Course cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/800x600';
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  </div>
                ) : viewMode === 'content' ? (
                  <div className="course-content-empty">
                    <h2>Chưa chọn khóa học</h2>
                    <p>Vui lòng quay lại danh sách và chọn một khóa học.</p>
                  </div>
                ) : null}

                {viewMode === 'create' && activeTab === 'general' ? (
                  <div className="course-init-card">
                    <div className="course-init-header">
                      <div className="course-step-indicator">1</div>
                      <div className="course-init-header-text">
                        <h2 className="course-init-title">Khởi tạo khóa học</h2>
                        <p className="course-init-subtitle">
                          Bước 1: Cung cấp các thông tin cơ bản để tạo ID khóa học.
                        </p>
                      </div>
                    </div>

                    <div className="course-init-form">
                      <label className="course-label">TÊN KHÓA HỌC</label>
                      <input
                        className="course-input"
                        type="text"
                        placeholder="VD: Tiếng Nhật N3 siêu tốc"
                        value={courseTitle}
                        onChange={(event) => setCourseTitle(event.target.value)}
                      />

                      <label className="course-label">MÔ TẢ</label>
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

                    <div className="course-init-actions">
                      <button
                        className="course-init-cancel"
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
                        className="course-init-continue"
                        type="button"
                        onClick={handleContinueToContent}
                        disabled={isSavingCourse}
                      >
                        {isSavingCourse ? 'Đang tạo...' : 'Tiếp tục soạn nội dung'}
                        <span className="course-init-arrow">→</span>
                      </button>
                    </div>
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