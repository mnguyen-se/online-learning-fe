import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createCourse, deleteCourse, getActiveCourses, getCourses, updateCourse } from '../../../api/coursesApi';
import { createLesson, updateLesson, getLessons } from '../../../api/lessionApi';
import { createModule, deleteModule, getModulesByCourse } from '../../../api/module';
import { logout } from '../../../store/slices/userSlice';
import CourseList from './components/CourseList';
import CourseInitForm from './components/CourseInitForm';
import CourseContentLayout from './components/CourseContentLayout';
import './courseManagement.css';

function CourseManagement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list');
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
  const [courseFilter, setCourseFilter] = useState('all');
  const [courseStats, setCourseStats] = useState({});
  const [courseActiveStates, setCourseActiveStates] = useState({});
  const [lessonError, setLessonError] = useState('');
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonsError, setLessonsError] = useState('');
  const [contentTab, setContentTab] = useState('general');
  const [courseCoverImageUrl, setCourseCoverImageUrl] = useState('https://picsum.photos/seed/0.6705225405054475/800/600');
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [moduleLessons, setModuleLessons] = useState([]); // Danh sách lessons của module đang chọn
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, chapterId: null });

  // Utility functions
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
    const randomStr = courseId.toString().padStart(5, '0').slice(-5).toUpperCase();
    return `CRS_${randomStr}`;
  };

  const getCourseIsActive = (course) => {
    const candidate =
      course?.isPublic ??
      course?.is_public ??
      course?.public ??
      course?.isActive ??
      course?.is_active;
    return typeof candidate === 'boolean' ? candidate : true;
  };

  const handleAddChapter = () => {
    const courseId = createdCourseId ?? getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học. Vui lòng chọn khóa học trước.');
      return;
    }

    // Tính orderIndex cho chương mới
    const maxOrderIndex = lessons.length > 0
      ? Math.max(...lessons.filter(l => !l.isNew).map(l => Number(l.orderIndex ?? 0)))
      : 0;
    const nextOrderIndex = Math.max(1, maxOrderIndex + 1);

    // Thêm chương mới vào danh sách local (chưa gọi API)
    const newChapter = {
      id: `temp-${Date.now()}`, // ID tạm để phân biệt
      title: '', // Để trống, hiển thị placeholder
      lessonType: 'VIDEO',
      contentUrl: '',
      contentFile: null,
      duration: 0,
      orderIndex: nextOrderIndex,
      sectionId: null,
      isServer: false,
      isModule: true,
      isNew: true, // Đánh dấu là chương mới chưa lưu
    };

    setLessons([...lessons, newChapter]);
    setSelectedChapterId(newChapter.id);
    setContentTab('program');
  };

  const handleSaveChapter = async () => {
    const courseId = createdCourseId ?? getCourseId(selectedCourse);
    if (!courseId || !selectedChapterId) {
      toast.error('Không tìm thấy mã khóa học hoặc chương.');
      return;
    }

    // Tìm chương hiện tại
    const currentChapter = lessons.find(l => l.id === selectedChapterId);
    if (!currentChapter) {
      toast.error('Không tìm thấy chương.');
      return;
    }

    // Kiểm tra tên chương
    if (!currentChapter.title || !currentChapter.title.trim()) {
      toast.error('Vui lòng nhập tên chương.');
      return;
    }

    try {
      setIsSavingLesson(true);
      setLessonError('');

      // Lấy danh sách modules đã lưu từ server để tính orderIndex chính xác
      const existingModulesResponse = await getModulesByCourse(courseId);
      let rawModules = [];
      if (Array.isArray(existingModulesResponse)) {
        rawModules = existingModulesResponse;
      } else if (existingModulesResponse?.data && Array.isArray(existingModulesResponse.data)) {
        rawModules = existingModulesResponse.data;
      } else if (existingModulesResponse?.data && Array.isArray(existingModulesResponse.data.data)) {
        rawModules = existingModulesResponse.data.data;
      }
      
      // Tìm orderIndex lớn nhất từ các modules đã lưu (không tính chương mới chưa lưu)
      const validOrderIndexes = rawModules
        .map(m => {
          const idx = Number(m.orderIndex ?? m.order_index ?? 0);
          return idx > 0 ? idx : 0;
        })
        .filter(idx => idx > 0);
      
      const maxOrderIndex = validOrderIndexes.length > 0
        ? Math.max(...validOrderIndexes)
        : 0;
      
      // orderIndex tiếp theo = max + 1, đảm bảo >= 1
      const nextOrderIndex = Math.max(1, maxOrderIndex + 1);

      // Gọi API POST /api/v1/modules để tạo module mới
      const moduleData = {
        courseId: Number(courseId),
        title: currentChapter.title.trim(),
        orderIndex: nextOrderIndex, // Dùng orderIndex tính từ server
        isPublic: false,
      };

      const createdModule = await createModule(moduleData);
      
      // Xử lý nhiều format response có thể có từ backend
      let moduleResponse = createdModule;
      if (createdModule?.data && typeof createdModule.data === 'object') {
        moduleResponse = createdModule.data;
      }
      
      // Lấy moduleId từ response
      const moduleId = moduleResponse?.moduleId ?? moduleResponse?.id ?? moduleResponse?._id ?? null;
      
      if (!moduleId) {
        throw new Error('Không thể lấy ID module sau khi tạo.');
      }

      // Load lại danh sách modules từ server để đảm bảo orderIndex chính xác
      const modulesList = await getModulesByCourse(courseId);
      const updatedRawModules = Array.isArray(modulesList) ? modulesList : modulesList?.data ?? [];
      
      // Chuyển đổi modules thành format lessons để hiển thị
      const serverModules = updatedRawModules.map((module, index) => ({
        id: module.id ?? module.moduleId ?? module._id ?? Date.now() + index,
        title: module.title ?? 'Chương mới',
        lessonType: 'VIDEO',
        contentUrl: '',
        contentFile: null,
        duration: 0,
        orderIndex: module.orderIndex ?? index + 1,
        sectionId: module.id ?? module.moduleId ?? module._id ?? null,
        isOpen: false,
        isServer: true,
        isModule: true,
      }))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      
      // Giữ lại các chương mới chưa lưu (trừ chương vừa lưu)
      const newChapters = lessons.filter(l => l.isNew && l.isModule && l.id !== selectedChapterId);
      
      // Merge: server modules + new chapters (chưa lưu)
      setLessons([...serverModules, ...newChapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
      
      setSelectedChapterId(moduleId);
      
      // Load lessons của module mới tạo
      await loadModuleLessons(moduleId, courseId);
      
      toast.success('Đã tạo chương thành công.');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Tạo chương thất bại. Vui lòng thử lại.';
      setLessonError(msg);
      toast.error(msg);
      console.error('Create chapter error:', e);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleCancelChapter = () => {
    // Nếu là chương mới chưa lưu, xóa khỏi danh sách
    if (selectedChapterId) {
      const currentChapter = lessons.find(l => l.id === selectedChapterId);
      if (currentChapter?.isNew) {
        setLessons(prev => prev.filter(l => l.id !== selectedChapterId));
      }
    }
    setSelectedChapterId(null);
    setContentTab('program');
  };

  const handleAddLessonItem = () => {
    if (!selectedChapterId) {
      toast.error('Vui lòng chọn chương trước khi thêm bài học.');
      return;
    }

    // Tính orderIndex cho lesson mới
    const maxOrderIndex = moduleLessons.length > 0
      ? Math.max(...moduleLessons.map(l => Number(l.orderIndex ?? 0)))
      : 0;
    const nextOrderIndex = Math.max(1, maxOrderIndex + 1);

    // Thêm lesson mới vào danh sách local (chưa gọi API)
    const newLesson = {
      id: `temp-${Date.now()}`, // ID tạm để phân biệt
      title: 'Bài học mới',
      lessonType: 'VIDEO',
      contentUrl: '',
      orderIndex: nextOrderIndex,
      moduleId: selectedChapterId,
      isNew: true, // Đánh dấu là lesson mới chưa lưu
      isServer: false,
    };

    setModuleLessons([...moduleLessons, newLesson]);
  };

  // Load danh sách lessons của một module
  const loadModuleLessons = async (moduleId, courseId) => {
    if (!moduleId || !courseId) {
      setModuleLessons([]);
      return;
    }

    try {
      const existingLessons = await getLessons({ courseId });
      const rawLessons = Array.isArray(existingLessons) ? existingLessons : existingLessons?.data ?? [];
      
      // Lọc lessons thuộc module
      const serverLessons = rawLessons
        .filter(l => {
          const lessonModuleId = l.moduleId ?? l.module?.moduleId ?? l.sectionId ?? l.section?.id;
          return lessonModuleId === moduleId;
        })
        .map(l => ({
          id: l.id ?? l.lessonId ?? l._id ?? Date.now(),
          title: l.title ?? 'Bài học mới',
          lessonType: l.lessonType ?? 'VIDEO',
          contentUrl: l.contentUrl ?? '',
          orderIndex: l.orderIndex ?? 0,
          moduleId: moduleId,
          isServer: true,
        }))
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      
      // Giữ lại các lesson mới chưa lưu (có isNew: true)
      const newLessons = moduleLessons.filter(l => l.isNew && l.moduleId === moduleId);
      
      // Merge: server lessons + new lessons (chưa lưu)
      setModuleLessons([...serverLessons, ...newLessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    } catch (error) {
      console.error('Load module lessons error:', error);
      // Giữ lại các lesson mới chưa lưu nếu có lỗi
      const newLessons = moduleLessons.filter(l => l.isNew && l.moduleId === moduleId);
      setModuleLessons(newLessons);
    }
  };

  const handleSaveLesson = async (lessonData) => {
    const courseId = createdCourseId ?? getCourseId(selectedCourse);
    if (!courseId || !selectedChapterId) {
      toast.error('Không tìm thấy mã khóa học hoặc chương.');
      return;
    }

    if (!selectedLessonId) {
      toast.error('Không tìm thấy bài học để lưu.');
      return;
    }

    try {
      setIsSavingLesson(true);
      setLessonError('');

      // Tìm lesson hiện tại
      const currentLesson = moduleLessons.find(l => l.id === selectedLessonId);
      if (!currentLesson) {
        toast.error('Không tìm thấy bài học.');
        return;
      }

      const lessonPayload = {
        title: lessonData.title,
        lessonType: lessonData.lessonType || 'VIDEO',
        contentUrl: lessonData.contentUrl || '',
        orderIndex: currentLesson.orderIndex ?? 1,
        moduleId: selectedChapterId,
      };

      if (currentLesson.isNew) {
        // Lesson mới → gọi API tạo
        const createdLesson = await createLesson(lessonPayload);
        const newLessonId = createdLesson?.id ?? createdLesson?.lessonId ?? createdLesson?._id ?? null;
        
        if (!newLessonId) {
          throw new Error('Không thể lấy ID bài học sau khi tạo.');
        }

        // Cập nhật danh sách local: xóa lesson tạm, thêm lesson mới từ server
        setModuleLessons(prev => 
          prev.filter(l => l.id !== selectedLessonId)
            .concat([{
              id: newLessonId,
              title: lessonData.title,
              lessonType: lessonData.lessonType || 'VIDEO',
              contentUrl: lessonData.contentUrl || '',
              orderIndex: currentLesson.orderIndex ?? 1,
              moduleId: selectedChapterId,
              isServer: true,
            }])
        );
        
        toast.success('Đã tạo bài học thành công.');
      } else {
        // Lesson đã có → gọi API cập nhật
        await updateLesson(selectedLessonId, lessonPayload);
        
        // Cập nhật lesson trong danh sách local
        setModuleLessons(prev =>
          prev.map(l =>
            l.id === selectedLessonId
              ? { ...l, ...lessonPayload }
              : l
          )
        );
        
        toast.success('Đã cập nhật bài học thành công.');
      }
      
      setSelectedLessonId(null);
      setContentTab('program');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Lưu bài học thất bại. Vui lòng thử lại.';
      setLessonError(msg);
      toast.error(msg);
      console.error('Save lesson error:', e);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleCancelLesson = () => {
    // Nếu là lesson mới chưa lưu, xóa khỏi danh sách
    if (selectedLessonId) {
      const currentLesson = moduleLessons.find(l => l.id === selectedLessonId);
      if (currentLesson?.isNew) {
        setModuleLessons(prev => prev.filter(l => l.id !== selectedLessonId));
      }
    }
    setSelectedLessonId(null);
    setIsCreatingLesson(false);
    setContentTab('program');
  };

  const handleDeleteChapter = (chapterId) => {
    if (!chapterId) {
      toast.error('Không tìm thấy ID chương để xóa.');
      return;
    }
    
    // Nếu là chương mới chưa lưu, xóa trực tiếp khỏi danh sách local
    const chapter = lessons.find(l => l.id === chapterId);
    if (chapter?.isNew) {
      setLessons(prev => prev.filter(l => l.id !== chapterId));
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(null);
        setModuleLessons([]);
      }
      return;
    }
    
    // Chương đã lưu → mở modal xác nhận
    setDeleteConfirmModal({ isOpen: true, chapterId });
  };

  const confirmDeleteChapter = async () => {
    const { chapterId } = deleteConfirmModal;
    if (!chapterId) {
      setDeleteConfirmModal({ isOpen: false, chapterId: null });
      return;
    }

    const courseId = createdCourseId ?? getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học.');
      return;
    }

    try {
      setIsSavingLesson(true);
      setLessonError('');
      
      // Gọi API DELETE /api/v1/modules/{moduleId}
      await deleteModule(chapterId);
      
      // Load lại danh sách modules sau khi xóa
      const modulesList = await getModulesByCourse(courseId);
      const rawModules = Array.isArray(modulesList) ? modulesList : modulesList?.data ?? [];
      
      // Chuyển đổi modules thành format lessons để hiển thị
      const serverModules = rawModules.map((module, index) => ({
        id: module.id ?? module.moduleId ?? module._id ?? Date.now() + index,
        title: module.title ?? 'Chương mới',
        lessonType: 'VIDEO',
        contentUrl: '',
        contentFile: null,
        duration: 0,
        orderIndex: module.orderIndex ?? index + 1,
        sectionId: module.id ?? module.moduleId ?? module._id ?? null,
        isOpen: false,
        isServer: true,
        isModule: true,
      }))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      
      // Giữ lại các chương mới chưa lưu (có isNew: true)
      const newChapters = lessons.filter(l => l.isNew && l.isModule);
      
      // Merge: server modules + new chapters (chưa lưu)
      setLessons([...serverModules, ...newChapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
      
      // Nếu chương đang được chọn bị xóa, clear selection
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(null);
      }
      
      toast.success('Đã xóa chương thành công.');
      setDeleteConfirmModal({ isOpen: false, chapterId: null });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Xóa chương thất bại. Vui lòng thử lại.';
      setLessonError(msg);
      toast.error(msg);
      console.error('Delete module error:', e);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const cancelDeleteChapter = () => {
    setDeleteConfirmModal({ isOpen: false, chapterId: null });
  };

  const loadCourseStats = async (courseId) => {
    if (!courseId) return { modules: 0, lessons: 0 };
    try {
      const data = await getLessons({ courseId });
      const rawList = Array.isArray(data) ? data : data?.data ?? [];
      const uniqueSections = new Set(
        rawList.map((l) => l.sectionId ?? l.section_id ?? l.section ?? 0).filter((s) => s > 0)
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
        if (courseId) newStats[courseId] = stats;
      });
      coursesList.forEach((course) => {
        const courseId = getCourseId(course);
        if (courseId) newActiveStates[courseId] = getCourseIsActive(course);
      });
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
      const rawCoursesList = Array.isArray(data) ? data : data?.data ?? [];
      const coursesList = rawCoursesList.map((course) => {
        const courseId = getCourseId(course);
        return { ...course, id: courseId || course.id };
      });
      setCourses(coursesList);

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
        if (courseId) newStats[courseId] = stats;
      });
      coursesList.forEach((course) => {
        const courseId = getCourseId(course);
        if (courseId) newActiveStates[courseId] = getCourseIsActive(course);
      });
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
      
      // Load modules từ API
      const modulesList = await getModulesByCourse(courseId);
      const rawModules = Array.isArray(modulesList) ? modulesList : modulesList?.data ?? [];
      
      // Chuyển đổi modules thành format lessons để hiển thị
      const serverModules = rawModules.map((module, index) => ({
        id: module.id ?? module.moduleId ?? module._id ?? Date.now() + index,
        title: module.title ?? 'Chương mới',
        lessonType: 'VIDEO',
        contentUrl: '',
        contentFile: null,
        duration: 0,
        orderIndex: module.orderIndex ?? index + 1,
        sectionId: module.id ?? module.moduleId ?? module._id ?? null,
        isOpen: false,
        isServer: true,
        isModule: true,
      }))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      
      // Giữ lại các chương mới chưa lưu (có isNew: true)
      const newChapters = lessons.filter(l => l.isNew && l.isModule);
      
      // Merge: server modules + new chapters (chưa lưu)
      setLessons([...serverModules, ...newChapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    } catch (error) {
      setLessonsError('Không thể tải danh sách chương.');
      console.error('Fetch modules error:', error);
      // Giữ lại các chương mới chưa lưu nếu có lỗi
      const newChapters = lessons.filter(l => l.isNew && l.isModule);
      setLessons(newChapters);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const created = await createCourse({
        title: trimmedTitle,
        description: trimmedDescription,
        isPublic: true,
      });
      const nextCourseId = getCourseId(created);
      if (nextCourseId) {
        setCreatedCourseId(nextCourseId);
        setSelectedCourse({
          id: nextCourseId,
          courseId: nextCourseId,
          title: trimmedTitle,
          description: trimmedDescription,
          isPublic: true,
        });
        setContentTab('general');
        setLessons([]);
        setViewMode('content');
        await loadLessonsForCourse(nextCourseId);
        toast.success('Đã tạo khóa học. Bạn có thể bắt đầu soạn nội dung.');
      } else {
        throw new Error('Không thể lấy ID khóa học sau khi tạo.');
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Tạo khóa học thất bại. Vui lòng thử lại.';
      setCourseError(msg);
      toast.error(msg);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleToggleActive = async (course, event) => {
    event.stopPropagation();
    event.preventDefault();
    const courseId = course?.id || getCourseId(course);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học. Vui lòng thử lại.');
      return;
    }
    const currentState =
      typeof courseActiveStates[courseId] === 'boolean'
        ? courseActiveStates[courseId]
        : getCourseIsActive(course);
    const newActiveState = !currentState;
    setCourseActiveStates((prev) => ({ ...prev, [courseId]: newActiveState }));
    if (!newActiveState) {
      try {
        await deleteCourse(courseId);
        toast.success('Đã đánh dấu khóa học là INACTIVE.');
      } catch {
        setCourseActiveStates((prev) => ({ ...prev, [courseId]: true }));
        toast.error('Đánh dấu khóa học thất bại. Vui lòng thử lại.');
      }
    }
  };

  const handleSelectChapter = (chapterId) => {
    setSelectedChapterId(chapterId);
    setSelectedLessonId(null);
    setIsCreatingLesson(false);
    setContentTab('program');
    
    // Kiểm tra xem có phải chương mới chưa lưu không
    const chapter = lessons.find(l => l.id === chapterId);
    if (chapter?.isNew) {
      // Chương mới chưa lưu → không load lessons
      setModuleLessons([]);
      return;
    }
    
    // Chương đã lưu → load lessons
    const courseId = createdCourseId ?? getCourseId(selectedCourse);
    if (courseId && chapterId) {
      loadModuleLessons(chapterId, courseId);
    }
  };

  const handleSelectLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setIsCreatingLesson(false);
    setContentTab('lesson');
  };

  const handleSelectCourse = (course, courseId) => {
    setSelectedCourse(course);
    setCreatedCourseId(courseId);
    setContentTab('general');
    setSelectedChapterId(null);
    setSelectedLessonId(null);
    setModuleLessons([]);
    setLessonError('');
    setLessons([]);
    loadLessonsForCourse(courseId);
    setViewMode('content');
  };

  const handleEditCourse = (course, courseId) => {
    setSelectedCourse(course);
    setCreatedCourseId(courseId);
    setContentTab('general');
    setSelectedChapterId(null);
    setSelectedLessonId(null);
    setModuleLessons([]);
    setLessonError('');
    setLessons([]);
    loadLessonsForCourse(courseId);
    setViewMode('content');
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
    } catch {
      toast.error('Cập nhật khóa học thất bại. Vui lòng thử lại.');
    }
  };

  const handleUpdateLesson = (lessonId, updates) => {
    setLessons((prev) => prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...updates } : lesson)));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
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
                        setLessons([]);
                        setSelectedChapterId(null);
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
                  <CourseList
                    courses={courses}
                    isLoadingCourses={isLoadingCourses}
                    coursesError={coursesError}
                    courseStats={courseStats}
                    courseActiveStates={courseActiveStates}
                    onSelectCourse={handleSelectCourse}
                    onToggleActive={handleToggleActive}
                    onEditCourse={handleEditCourse}
                    getCourseId={getCourseId}
                    getCourseIsActive={getCourseIsActive}
                  />
                </div>
              </>
            ) : (
              <div className={`course-create${viewMode === 'content' ? ' is-content' : ''}`}>
                {viewMode === 'content' && selectedCourse ? (
                  <CourseContentLayout
                    selectedCourse={selectedCourse}
                    contentTab={contentTab}
                    courseCoverImageUrl={courseCoverImageUrl}
                    lessons={lessons}
                    isLoadingLessons={isLoadingLessons}
                    lessonsError={lessonsError}
                    lessonError={lessonError}
                    isSavingLesson={isSavingLesson}
                    selectedChapterId={selectedChapterId}
                    selectedLessonId={selectedLessonId}
                    isCreatingLesson={isCreatingLesson}
                    moduleLessons={moduleLessons}
                    onTabChange={setContentTab}
                    onCoverImageUrlChange={setCourseCoverImageUrl}
                    onAddChapter={handleAddChapter}
                    onAddLessonItem={handleAddLessonItem}
                    onSelectChapter={handleSelectChapter}
                    onSelectLesson={handleSelectLesson}
                    onDeleteChapter={handleDeleteChapter}
                    onSaveChapter={handleSaveChapter}
                    onCancelChapter={handleCancelChapter}
                    onSaveLesson={handleSaveLesson}
                    onCancelLesson={handleCancelLesson}
                    onUpdateLesson={handleUpdateLesson}
                    onSaveAndFinish={async () => {
                      await handleUpdateCourseContent();
                      setViewMode('list');
                      setSelectedCourse(null);
                      setSelectedChapterId(null);
                      toast.success('Đã lưu và kết thúc chỉnh sửa khóa học.');
                    }}
                    getCourseId={getCourseId}
                    formatCourseId={formatCourseId}
                  />
                ) : viewMode === 'content' ? (
                  <div className="course-content-empty">
                    <h2>Chưa chọn khóa học</h2>
                    <p>Vui lòng quay lại danh sách và chọn một khóa học.</p>
                  </div>
                ) : null}

                {viewMode === 'create' && activeTab === 'general' ? (
                  <CourseInitForm
                    courseTitle={courseTitle}
                    courseDescription={courseDescription}
                    courseError={courseError}
                    courseSuccess={courseSuccess}
                    isSavingCourse={isSavingCourse}
                    onTitleChange={setCourseTitle}
                    onDescriptionChange={setCourseDescription}
                    onCancel={() => {
                      setViewMode('list');
                      setCourseTitle('');
                      setCourseDescription('');
                      setCourseError('');
                      setCourseSuccess('');
                    }}
                    onContinue={handleContinueToContent}
                  />
                ) : null}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Modal xác nhận xóa chương */}
      {deleteConfirmModal.isOpen && (
        <div className="delete-confirm-modal-overlay" onClick={cancelDeleteChapter}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-modal-header">
              <h3 className="delete-confirm-modal-title">Xác nhận xóa chương</h3>
            </div>
            <div className="delete-confirm-modal-body">
              <p className="delete-confirm-modal-message">
                Bạn có chắc chắn muốn xóa chương này? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="delete-confirm-modal-footer">
              <button
                type="button"
                className="delete-confirm-modal-btn delete-confirm-modal-btn-cancel"
                onClick={cancelDeleteChapter}
              >
                Hủy
              </button>
              <button
                type="button"
                className="delete-confirm-modal-btn delete-confirm-modal-btn-confirm"
                onClick={confirmDeleteChapter}
                disabled={isSavingLesson}
              >
                {isSavingLesson ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseManagement;
