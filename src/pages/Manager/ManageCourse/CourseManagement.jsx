import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createCourse, getCourses, getTeachers, updateCourse, getActiveCourses } from '../../../api/coursesApi';
import { getEnrolledStudentsByCourse } from '../../../api/enrollmentApi';
import { createLesson, updateLesson, getLessons, deleteLesson } from '../../../api/lessionApi';
import {
  createAssignment,
  createWritingQuestion,
  getAssignmentQuestions,
  getAssignmentsByCourse,
  getWritingQuestions,
  uploadAssignmentQuestions,
} from '../../../api/assignmentApi';
import { createModule, deleteModule, getModulesByCourse, getPublicModulesByCourse, updateModule } from '../../../api/module';
import DashboardLayout from '../../../components/DashboardLayout';
import CourseCard from './components/CourseCard';
import CourseContentLayout from './components/CourseContentLayout';
import CourseInitForm from './components/CourseInitForm';
import './courseManagement.css';

function CourseManagement() {
  const [viewMode, setViewMode] = useState('list');
  const [activeNavTab, setActiveNavTab] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseIsPublic, setCourseIsPublic] = useState(false);
  const [courseTeacherId, setCourseTeacherId] = useState('');
  const [courseError, setCourseError] = useState('');
  const [courseSuccess, setCourseSuccess] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [editCourseModal, setEditCourseModal] = useState({ isOpen: false, course: null });
  const [editCourseForm, setEditCourseForm] = useState({ title: '', description: '', teacherId: '' });
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [isSavingGeneralConfig, setIsSavingGeneralConfig] = useState(false);
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
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [testsError, setTestsError] = useState('');
  const [testError, setTestError] = useState('');
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false); // Track chế độ edit/view
  const [moduleLessons, setModuleLessons] = useState([]); // Danh sách lessons của module đang chọn
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, chapterId: null });
  const [deleteLessonModal, setDeleteLessonModal] = useState({ isOpen: false, lessonId: null });
  const [isReloadingLessons, setIsReloadingLessons] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [publishingModuleIds, setPublishingModuleIds] = useState([]);
  const [publishingLessonIds, setPublishingLessonIds] = useState([]);

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

  const PUBLIC_REQUIRES_TEACHER_MESSAGE = 'Vui lòng gán giáo viên cho khóa học trước khi chuyển sang trạng thái công khai.';

  const getCourseTeacherId = (course) =>
    course?.teacherId ??
    course?.teacher_id ??
    course?.teacher?.id ??
    course?.teacher?.userId ??
    null;

  const resolveCourseActiveState = (course) => {
    const courseId = getCourseId(course);
    if (courseId && typeof courseActiveStates[courseId] === 'boolean') {
      return courseActiveStates[courseId];
    }
    return getCourseIsActive(course);
  };

  const getAssignmentId = (assignment) =>
    assignment?.assignmentId ??
    assignment?.id ??
    assignment?.assignmentID ??
    assignment?.assignment_id ??
    null;

  const normalizeAssignmentType = (value) => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (raw === 'QUIZ') return 'QUIZ';
    if (raw === 'WRITING' || raw === 'ASSIGNMENT') return 'WRITING';
    return 'WRITING';
  };

  const resolvePublicModuleIdSet = async (courseId) => {
    if (!courseId) return new Set();
    try {
      const publicModules = await getPublicModulesByCourse(courseId);
      const rawPublicModules = Array.isArray(publicModules) ? publicModules : publicModules?.data ?? [];
      const ids = rawPublicModules
        .map((module) => module?.id ?? module?.moduleId ?? module?._id ?? null)
        .filter((id) => id !== null && id !== undefined && String(id).trim() !== '');
      return new Set(ids.map((id) => String(id)));
    } catch (error) {
      console.error('Fetch public modules error:', error);
      return new Set();
    }
  };

  const mapModulesToLessonItems = (rawModules = [], publicModuleIds = new Set()) =>
    rawModules
      .map((module, index) => {
        const moduleIdentifier = module?.id ?? module?.moduleId ?? module?._id ?? null;
        const normalizedModuleId = moduleIdentifier ?? Date.now() + index;
        return {
          id: normalizedModuleId,
          title: module?.title ?? 'Chương mới',
          lessonType: 'VIDEO',
          contentUrl: '',
          contentFile: null,
          duration: 0,
          orderIndex: module?.orderIndex ?? index + 1,
          sectionId: moduleIdentifier,
          isOpen: false,
          isServer: true,
          isModule: true,
          isPublic: moduleIdentifier !== null && moduleIdentifier !== undefined
            ? publicModuleIds.has(String(moduleIdentifier))
            : false,
        };
      })
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  const resetCourseForm = () => {
    setCourseTitle('');
    setCourseDescription('');
    setCourseIsPublic(false);
    setCourseTeacherId('');
    setCourseError('');
    setCourseSuccess('');
  };

  const openCreateCourse = () => {
    resetCourseForm();
    setViewMode('create');
    setSelectedCourse(null);
    setSelectedChapterId(null);
    setSelectedLessonId(null);
    setSelectedTestId(null);
    setLessons([]);
    setModuleLessons([]);
    setTests([]);
    setContentTab('general');
  };

  const handleCancelCreateCourse = () => {
    resetCourseForm();
    setViewMode('list');
  };

  const handleCreatePublicChange = (nextIsPublic) => {
    // Theo backend, isPublic không bắt buộc phải có teacherId
    setCourseIsPublic(Boolean(nextIsPublic));
    if (!nextIsPublic) {
      setCourseError('');
    }
  };

  const handleCreateTeacherChange = (teacherId) => {
    setCourseTeacherId(teacherId);
    if (teacherId && String(teacherId).trim() !== '') {
      setCourseError('');
    }
  };

  const handleCreateCourse = async () => {
    const trimmedTitle = courseTitle.trim();
    const trimmedDescription = courseDescription.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setCourseError('Vui lòng nhập tên khóa học và mô tả.');
      return;
    }

    try {
      setIsSavingCourse(true);
      setCourseError('');
      setCourseSuccess('');

      const payload = {
        title: trimmedTitle,
        description: trimmedDescription,
      };
      if (courseTeacherId && courseTeacherId.trim()) {
        const tid = Number(courseTeacherId);
        if (!Number.isNaN(tid)) payload.teacherId = tid;
      }

      const createdCourse = await createCourse(payload);
      const createdCourseId = getCourseId(createdCourse) ?? createdCourse?.id ?? null;

      if (!createdCourseId) {
        throw new Error('Không thể lấy mã khóa học sau khi tạo.');
      }

      let normalizedCourse = {
        ...createdCourse,
        id: createdCourseId,
        title: createdCourse?.title ?? trimmedTitle,
        description: createdCourse?.description ?? trimmedDescription,
      };

      if (courseIsPublic) {
        try {
          await updateCourse(createdCourseId, { isPublic: true });
          normalizedCourse = { ...normalizedCourse, isPublic: true };
        } catch (error) {
          console.error('Update course status error:', error);
          toast.error('Đã tạo khóa học nhưng chưa cập nhật trạng thái mở.');
        }
      }

      await loadCourses();
      handleSelectCourse(normalizedCourse, createdCourseId);
      setCourseSuccess('Đã tạo khóa học thành công.');
      toast.success('Đã tạo khóa học thành công.');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Tạo khóa học thất bại. Vui lòng thử lại.';
      setCourseError(msg);
      toast.error(msg);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleAddChapter = () => {
    const courseId = getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học. Vui lòng chọn khóa học trước.');
      return;
    }
    setSelectedTestId(null);

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
      isPublic: false,
      isNew: true, // Đánh dấu là chương mới chưa lưu
    };

    setLessons([...lessons, newChapter]);
    setSelectedChapterId(newChapter.id);
    setContentTab('program');
  };

  const handleSaveChapter = async () => {
    const courseId = getCourseId(selectedCourse);
    if (!courseId || !selectedChapterId) {
      toast.error('Không tìm thấy mã khóa học hoặc chương.');
      return false;
    }

    // Tìm chương hiện tại
    const currentChapter = lessons.find(l => l.id === selectedChapterId);
    if (!currentChapter) {
      toast.error('Không tìm thấy chương.');
      return false;
    }

    // Kiểm tra tên chương
    if (!currentChapter.title || !currentChapter.title.trim()) {
      toast.error('Vui lòng nhập tên chương.');
      return false;
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
      const [modulesList, publicModuleIds] = await Promise.all([
        getModulesByCourse(courseId),
        resolvePublicModuleIdSet(courseId),
      ]);
      const updatedRawModules = Array.isArray(modulesList) ? modulesList : modulesList?.data ?? [];
      const serverModules = mapModulesToLessonItems(updatedRawModules, publicModuleIds);
      // Giữ lại các chương mới chưa lưu (trừ chương vừa lưu)
      const newChapters = lessons.filter(l => l.isNew && l.isModule && l.id !== selectedChapterId);

      // Merge: server modules + new chapters (chưa lưu)
      setLessons([...serverModules, ...newChapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));

      setSelectedChapterId(moduleId);

      // Load lessons của module mới tạo
      await loadModuleLessons(moduleId, courseId);

      toast.success('Đã tạo chương thành công.');
      return true;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Tạo chương thất bại. Vui lòng thử lại.';
      setLessonError(msg);
      toast.error(msg);
      console.error('Create chapter error:', e);
      return false;
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
    setSelectedTestId(null);

    // Tính orderIndex cho lesson mới (chỉ tính từ server-side lessons)
    const serverLessons = moduleLessons.filter(l => l.isServer && l.moduleId === selectedChapterId);
    const maxOrderIndex = serverLessons.length > 0
      ? Math.max(...serverLessons.map(l => Number(l.orderIndex ?? 0)))
      : 0;
    const nextOrderIndex = Math.max(1, maxOrderIndex + 1);

    // Thêm lesson mới vào danh sách local (chưa gọi API)
    const tempId = `temp-${Date.now()}`;
    const newLesson = {
      id: tempId, // ID tạm để phân biệt
      title: '', // Title rỗng, người dùng sẽ nhập
      lessonType: 'VIDEO',
      videoUrl: '',
      contentUrl: '',
      textContent: '',
      orderIndex: nextOrderIndex,
      moduleId: selectedChapterId,
      isNew: true, // Đánh dấu là lesson mới chưa lưu
      isServer: false,
      isPublic: false,
    };

    setModuleLessons([...moduleLessons, newLesson]);

    // Tự động select lesson mới và mở form để điền nội dung
    setSelectedLessonId(tempId);
    setContentTab('lesson');
    setIsCreatingLesson(true);
    setIsEditingLesson(true); // Lesson mới luôn ở edit mode
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
          return String(lessonModuleId) === String(moduleId);
        })
        .map(l => {
          const rawLessonType = l.lessonType ?? 'VIDEO';
          const lessonType = rawLessonType === 'VIDEO' || rawLessonType === 'TEXT'
            ? rawLessonType
            : 'TEXT';
          const contentUrl = l.contentUrl ?? '';
          const videoUrl = l.videoUrl ?? contentUrl ?? '';
          const textContent = lessonType === 'TEXT'
            ? (l.textContent ?? contentUrl ?? '')
            : (l.textContent ?? '');

          // Lấy lessonId từ nhiều nguồn có thể
          const lessonId = l.lessonId ?? l.id ?? l._id;

          return {
            id: lessonId ?? Date.now() + Math.random(),
            lessonId: lessonId, // Lưu thêm lessonId để dùng cho update/delete
            title: l.title ?? 'Bài học mới',
            lessonType: lessonType,
            videoUrl: lessonType === 'VIDEO' ? videoUrl : '',
            contentUrl: lessonType === 'VIDEO' ? (contentUrl || videoUrl) : '',
            textContent: textContent,
            orderIndex: l.orderIndex ?? 0,
            moduleId: moduleId,
            isServer: true,
            isPublic: Boolean(l.isPublic ?? l.is_public ?? false),
          };
        })
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

      // Giữ lại các lesson mới chưa lưu (có isNew: true) nhưng không trùng với server lessons
      // Kiểm tra trùng dựa vào orderIndex và moduleId
      const existingOrderIndexes = new Set(serverLessons.map(l => Number(l.orderIndex ?? 0)));
      const newLessons = moduleLessons.filter(l => 
        l.isNew 
        && String(l.moduleId) === String(moduleId)
        && !existingOrderIndexes.has(Number(l.orderIndex ?? 0)) // Không trùng orderIndex với server lessons
      );

      // Merge: server lessons + new lessons (chưa lưu, không trùng)
      setModuleLessons([...serverLessons, ...newLessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    } catch (error) {
      console.error('Load module lessons error:', error);
      // Giữ lại các lesson mới chưa lưu nếu có lỗi
      const newLessons = moduleLessons.filter(l => l.isNew && String(l.moduleId) === String(moduleId));
      setModuleLessons(newLessons);
    }
  };

  const handleSaveLesson = async (lessonData) => {
    const courseId = getCourseId(selectedCourse);
    if (!courseId || !selectedChapterId) {
      toast.error('Không tìm thấy mã khóa học hoặc chương.');
      return false;
    }

    if (!selectedLessonId) {
      toast.error('Không tìm thấy bài học để lưu.');
      return false;
    }

    try {
      setIsSavingLesson(true);
      setLessonError('');

      // Tìm lesson hiện tại
      const currentLesson = moduleLessons.find(l => l.id === selectedLessonId);
      if (!currentLesson) {
        toast.error('Không tìm thấy bài học.');
        return false;
      }

      // Tính orderIndex từ server-side lessons (tránh conflict)
      // QUAN TRỌNG: Fetch ngay trước khi tạo để đảm bảo data mới nhất
      let orderIndex = currentLesson.orderIndex ?? 1;
      if (currentLesson.isNew) {
        // Fetch tất cả lessons từ server NGAY TRƯỚC KHI TẠO để tính orderIndex chính xác
        try {
          // Fetch fresh data từ server (không dùng cache)
          const existingLessons = await getLessons({ courseId });
          const rawLessons = Array.isArray(existingLessons) ? existingLessons : existingLessons?.data ?? [];

          // Lọc lessons thuộc module hiện tại (chỉ lấy server-side lessons)
          // QUAN TRỌNG: KHÔNG filter isPublic. Unique constraint (module_id, order_index) áp dụng cho
          // MỌI row trong DB (kể cả lesson đã xóa). Phải tính orderIndex từ TẤT CẢ lessons trong module.
          const serverLessons = rawLessons.filter(l => {
            const lessonModuleId = l.moduleId ?? l.module?.moduleId ?? l.sectionId ?? l.section?.id;
            return String(lessonModuleId) === String(selectedChapterId) || Number(lessonModuleId) === Number(selectedChapterId);
          });

          // Tính maxOrderIndex từ TẤT CẢ lessons trong module (kể cả đã xóa)
          const orderIndexes = serverLessons
            .map(l => Number(l.orderIndex ?? 0))
            .filter(idx => idx > 0 && !isNaN(idx));

          const maxOrderIndex = orderIndexes.length > 0 ? Math.max(...orderIndexes) : 0;

          // Tính orderIndex mới: maxOrderIndex + 1
          orderIndex = maxOrderIndex + 1;

          // Double check: đảm bảo orderIndex không trùng với bất kỳ orderIndex nào đã có
          const existingIndexes = new Set(orderIndexes);
          let attempts = 0;
          while (existingIndexes.has(orderIndex) && attempts < 100) {
            orderIndex++;
            attempts++;
          }

          // Log để debug
          console.log('Calculated orderIndex:', orderIndex, 'for module:', selectedChapterId, 'existing indexes:', Array.from(existingIndexes));
        } catch (err) {
          console.error('Error fetching existing lessons for orderIndex calculation:', err);
          // Fallback: dùng orderIndex từ local state, nhưng tăng thêm để tránh conflict
          const localMax = moduleLessons
            .filter(l => !l.isNew && l.moduleId === selectedChapterId)
            .reduce((max, l) => Math.max(max, Number(l.orderIndex ?? 0)), 0);
          orderIndex = Math.max(1, localMax + 1);
          console.warn('Using fallback orderIndex:', orderIndex);
        }
      }

      // Chuẩn bị payload theo LessonDtoReq backend (title, lessonType, textContent, videoUrl, moduleId, isPublic)
      const normalizedLessonType = lessonData.lessonType || 'VIDEO';
      const lessonPayload = {
        title: lessonData.title,
        lessonType: normalizedLessonType,
        moduleId: selectedChapterId,
        videoUrl: '',
        textContent: '',
        // isPublic sẽ để mặc định false khi tạo; publish dùng handlePublishLesson
      };

      if (normalizedLessonType === 'VIDEO') {
        lessonPayload.videoUrl = lessonData.videoUrl || lessonData.contentUrl || '';
      } else {
        // TEXT / ASSIGNMENT / QUIZ → lưu vào textContent
        lessonPayload.textContent = lessonData.textContent || lessonData.contentUrl || '';
      }

      if (currentLesson.isNew) {
        // Lesson mới → gọi API tạo với retry logic nếu bị duplicate
        // Thêm flag để prevent multiple simultaneous requests
        let createSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;
        const requestId = `create-${selectedLessonId}-${Date.now()}`;

        while (!createSuccess && retryCount < maxRetries) {
          try {
            console.log(`[${requestId}] Attempting to create lesson with orderIndex:`, orderIndex);
            await createLesson(lessonPayload);
            createSuccess = true;
            console.log(`[${requestId}] Lesson created successfully`);
          } catch (createError) {
            // Kiểm tra nếu là duplicate error
            const errorMessage = createError?.response?.data?.error || createError?.message || '';
            const isDuplicateError = errorMessage.includes('Duplicate entry') ||
              errorMessage.includes('UK5b8va6i6s2lts98iubi6kl9v6') ||
              createError?.response?.status === 500;

            if (isDuplicateError && retryCount < maxRetries - 1) {
              // Nếu là duplicate, fetch lại và tính orderIndex mới
              retryCount++;
              console.warn(`Duplicate orderIndex detected, retrying (attempt ${retryCount}/${maxRetries})...`);

              try {
                const existingLessons = await getLessons({ courseId });
                const rawLessons = Array.isArray(existingLessons) ? existingLessons : existingLessons?.data ?? [];
                // Retry: dùng TẤT CẢ lessons trong module (kể cả đã xóa) vì unique constraint áp dụng cho mọi row
                const serverLessons = rawLessons.filter(l => {
                  const lessonModuleId = l.moduleId ?? l.module?.moduleId ?? l.sectionId ?? l.section?.id;
                  return String(lessonModuleId) === String(selectedChapterId) || Number(lessonModuleId) === Number(selectedChapterId);
                });

                const orderIndexes = serverLessons
                  .map(l => Number(l.orderIndex ?? 0))
                  .filter(idx => idx > 0 && !isNaN(idx));

                const maxOrderIndex = orderIndexes.length > 0 ? Math.max(...orderIndexes) : 0;
                orderIndex = maxOrderIndex + 1;

                // Đảm bảo không trùng
                const existingIndexes = new Set(orderIndexes);
                while (existingIndexes.has(orderIndex)) {
                  orderIndex++;
                }

                // Cập nhật payload với orderIndex mới
                lessonPayload.orderIndex = orderIndex;
                console.log('Retrying with new orderIndex:', orderIndex);
              } catch (fetchError) {
                console.error('Error fetching lessons for retry:', fetchError);
                // Tăng orderIndex thêm 1 và thử lại
                orderIndex++;
                lessonPayload.orderIndex = orderIndex;
              }
            } else {
              // Nếu không phải duplicate hoặc đã retry hết, throw error
              throw createError;
            }
          }
        }

        if (!createSuccess) {
          throw new Error('Không thể tạo bài học sau nhiều lần thử. Vui lòng thử lại.');
        }

        // Set loading state
        setIsReloadingLessons(true);

        try {
          // Xóa lesson tạm (isNew) khỏi danh sách trước khi reload
          setModuleLessons(prev => prev.filter(l =>
            !(l.isNew && l.moduleId === selectedChapterId && l.id === selectedLessonId)
          ));

          // Reload danh sách lessons từ server để lấy lessonId và cập nhật UI
          await loadModuleLessons(selectedChapterId, courseId);

          // Đợi một chút để đảm bảo state đã được cập nhật
          await new Promise(resolve => setTimeout(resolve, 300));

          // Tìm lesson vừa tạo trong moduleLessons (đã được reload)
          // Tìm dựa vào title, orderIndex, và moduleId
          const createdLesson = moduleLessons.find(l =>
            l.moduleId === selectedChapterId
            && l.title === lessonData.title
            && Number(l.orderIndex) === orderIndex
            && l.lessonType === (lessonData.lessonType || 'VIDEO')
            && l.isServer === true // Chỉ lấy lesson từ server
          );

          if (createdLesson && createdLesson.id) {
            // Select lesson vừa tạo để hiển thị ở view mode
            setSelectedLessonId(createdLesson.id);
            setContentTab('lesson');
            setIsCreatingLesson(false); // Đánh dấu đã tạo xong, không còn là lesson mới
            setIsEditingLesson(false); // Hiển thị ở view mode sau khi tạo xong
          } else {
            // Nếu không tìm thấy trong moduleLessons, thử fetch lại từ server
            const reloadedLessons = await getLessons({ courseId });
            const rawReloaded = Array.isArray(reloadedLessons) ? reloadedLessons : reloadedLessons?.data ?? [];
            const serverLesson = rawReloaded.find(l => {
              const lessonModuleId = l.moduleId ?? l.module?.moduleId ?? l.sectionId ?? l.section?.id;
              return String(lessonModuleId) === String(selectedChapterId)
                && l.title === lessonData.title
                && Number(l.orderIndex) === orderIndex
                && l.lessonType === (lessonData.lessonType || 'VIDEO');
            });

            if (serverLesson) {
              const lessonId = serverLesson.lessonId ?? serverLesson.id ?? serverLesson._id;
              if (lessonId) {
                // Reload lại để đảm bảo lesson có trong moduleLessons
                await loadModuleLessons(selectedChapterId, courseId);
                await new Promise(resolve => setTimeout(resolve, 200));

                // Tìm lại trong moduleLessons sau khi reload
                const foundLesson = moduleLessons.find(l =>
                  (l.lessonId ?? l.id) === lessonId ||
                  (l.title === lessonData.title && Number(l.orderIndex) === orderIndex && l.moduleId === selectedChapterId)
                );

                if (foundLesson && foundLesson.id) {
                  setSelectedLessonId(foundLesson.id);
                  setContentTab('lesson');
                  setIsCreatingLesson(false); // Đánh dấu đã tạo xong
                  setIsEditingLesson(false); // Hiển thị ở view mode sau khi tạo xong
                }
                // Không reset nếu không tìm thấy - giữ nguyên trạng thái hiện tại
              }
              // Không reset nếu không tìm thấy lessonId - giữ nguyên trạng thái hiện tại
            }
            // Không reset nếu không tìm thấy lesson - giữ nguyên trạng thái hiện tại
          }
        } finally {
          setIsReloadingLessons(false);
        }

        toast.success('Đã tạo bài học thành công.');
        return true;
      } else {
        // Lesson đã có → gọi API cập nhật
        await updateLesson(selectedLessonId, lessonPayload);

        // Reload danh sách lessons để đảm bảo sync với server
        await loadModuleLessons(selectedChapterId, courseId);

        // Giữ nguyên selectedLessonId và quay về view mode sau khi cập nhật
        setContentTab('lesson');
        setIsEditingLesson(false); // Quay về view mode sau khi lưu

        toast.success('Đã cập nhật bài học thành công.');
        return true;
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Lưu bài học thất bại. Vui lòng thử lại.';
      setLessonError(msg);
      toast.error(msg);
      console.error('Save lesson error:', e);
      return false;
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
        setSelectedLessonId(null);
        setIsCreatingLesson(false);
        setIsEditingLesson(false);
        setContentTab('program');
      } else {
        // Nếu là lesson đã lưu, chỉ quay lại view mode
        setIsEditingLesson(false);
      }
    }
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

    const courseId = getCourseId(selectedCourse);
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
      const [modulesList, publicModuleIds] = await Promise.all([
        getModulesByCourse(courseId),
        resolvePublicModuleIdSet(courseId),
      ]);
      const rawModules = Array.isArray(modulesList) ? modulesList : modulesList?.data ?? [];
      const serverModules = mapModulesToLessonItems(rawModules, publicModuleIds);
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

  const handleDeleteLesson = (lessonId) => {
    if (!lessonId) {
      toast.error('Không tìm thấy ID bài học để xóa.');
      return;
    }

    // Nếu là lesson mới chưa lưu, xóa trực tiếp khỏi danh sách local
    const lesson = moduleLessons.find(l => l.id === lessonId);
    if (lesson?.isNew) {
      setModuleLessons(prev => prev.filter(l => l.id !== lessonId));
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setIsCreatingLesson(false);
        setIsEditingLesson(false);
        setContentTab('program');
      }
      return;
    }

    // Lesson đã lưu → mở modal xác nhận
    setDeleteLessonModal({ isOpen: true, lessonId });
  };

  const confirmDeleteLesson = async () => {
    const { lessonId } = deleteLessonModal;
    if (!lessonId) {
      setDeleteLessonModal({ isOpen: false, lessonId: null });
      return;
    }

    const courseId = getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học.');
      return;
    }

    try {
      setIsSavingLesson(true);
      setLessonError('');

      // Lấy lessonId thực từ lesson object (có thể là id tạm hoặc lessonId)
      const lesson = moduleLessons.find(l => l.id === lessonId);
      const realLessonId = lesson?.lessonId ?? lessonId;

      // Gọi API DELETE /api/v1/lessons/delete/{lessonId}
      await deleteLesson(realLessonId);

      // Reload danh sách lessons của module sau khi xóa
      if (selectedChapterId) {
        await loadModuleLessons(selectedChapterId, courseId);
      }

      // Nếu lesson đang được chọn bị xóa, clear selection
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setIsCreatingLesson(false);
        setIsEditingLesson(false);
        setContentTab('program');
      }

      toast.success('Đã xóa bài học thành công.');
      setDeleteLessonModal({ isOpen: false, lessonId: null });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Xóa bài học thất bại. Vui lòng thử lại.';
      setLessonError(msg);
      toast.error(msg);
      console.error('Delete lesson error:', e);
    } finally {
      setIsSavingLesson(false);
    }
  };

  const cancelDeleteLesson = () => {
    setDeleteLessonModal({ isOpen: false, lessonId: null });
  };

  const handlePublishChapter = async (chapterId) => {
    const chapter = lessons.find((item) => item.id === chapterId);
    if (!chapter) {
      toast.error('Không tìm thấy chương để public.');
      return;
    }
    if (chapter.isNew) {
      toast.warning('Vui lòng lưu chương trước khi public.');
      return;
    }
    if (chapter.isPublic) {
      toast.info('Chương này đã ở trạng thái public.');
      return;
    }

    const courseId = getCourseId(selectedCourse);
    const moduleId = chapter.sectionId ?? chapter.id;
    if (!courseId || !moduleId) {
      toast.error('Không tìm thấy mã khóa học hoặc chương.');
      return;
    }

    const normalizedCourseId = Number.isNaN(Number(courseId)) ? courseId : Number(courseId);
    const moduleKey = String(moduleId);
    setPublishingModuleIds((prev) => (prev.includes(moduleKey) ? prev : [...prev, moduleKey]));

    try {
      await updateModule(moduleId, {
        courseId: normalizedCourseId,
        title: chapter.title ?? '',
        isPublic: true,
      });

      setLessons((prev) =>
        prev.map((item) =>
          String(item.sectionId ?? item.id) === moduleKey
            ? { ...item, isPublic: true }
            : item
        )
      );
      toast.success('Đã public chương thành công.');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Public chương thất bại. Vui lòng thử lại.';
      toast.error(msg);
      console.error('Publish module error:', error);
    } finally {
      setPublishingModuleIds((prev) => prev.filter((id) => id !== moduleKey));
    }
  };

  const handlePublishLesson = async (lessonId) => {
    const lesson = moduleLessons.find((item) => item.id === lessonId);
    if (!lesson) {
      toast.error('Không tìm thấy bài học để public.');
      return;
    }
    if (lesson.isNew) {
      toast.warning('Vui lòng lưu bài học trước khi public.');
      return;
    }
    if (lesson.isPublic) {
      toast.info('Bài học này đã ở trạng thái public.');
      return;
    }

    const realLessonId = lesson.lessonId ?? lesson.id;
    if (!realLessonId) {
      toast.error('Không tìm thấy mã bài học.');
      return;
    }

    const lessonKey = String(realLessonId);
    setPublishingLessonIds((prev) => (prev.includes(lessonKey) ? prev : [...prev, lessonKey]));

    try {
      await updateLesson(realLessonId, { isPublic: true });
      setModuleLessons((prev) =>
        prev.map((item) =>
          String(item.lessonId ?? item.id) === lessonKey
            ? { ...item, isPublic: true }
            : item
        )
      );
      toast.success('Đã public bài học thành công.');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Public bài học thất bại. Vui lòng thử lại.';
      toast.error(msg);
      console.error('Publish lesson error:', error);
    } finally {
      setPublishingLessonIds((prev) => prev.filter((id) => id !== lessonKey));
    }
  };

  const loadCourseStats = async (courseId) => {
    if (!courseId) return {
      chapters: 0,
      modules: 0,
      lessons: 0,
      tests: 0,
      students: 0,
    };

    const normalizeList = (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.data?.data)) return data.data.data;
      return [];
    };

    try {
      const [lessonsResult, modulesResult, testsResult, studentsResult] = await Promise.allSettled([
        getLessons({ courseId }),
        getModulesByCourse(courseId),
        getAssignmentsByCourse(courseId),
        getEnrolledStudentsByCourse(courseId),
      ]);

      const lessonsList = lessonsResult.status === 'fulfilled' ? normalizeList(lessonsResult.value) : [];
      const modulesList = modulesResult.status === 'fulfilled' ? normalizeList(modulesResult.value) : [];
      const testsList = testsResult.status === 'fulfilled' ? normalizeList(testsResult.value) : [];
      const studentsList = studentsResult.status === 'fulfilled' ? normalizeList(studentsResult.value) : [];

      const moduleIds = new Set(
        modulesList
          .map((module) => module?.moduleId ?? module?.id ?? module?._id)
          .filter((id) => id !== null && id !== undefined)
          .map((id) => String(id))
      );
      const lessonsCount = moduleIds.size
        ? lessonsList.filter((lesson) => {
          const lessonModuleId =
            lesson?.moduleId ??
            lesson?.module?.moduleId ??
            lesson?.sectionId ??
            lesson?.section?.id;
          if (lessonModuleId === null || lessonModuleId === undefined) return false;
          return moduleIds.has(String(lessonModuleId));
        }).length
        : 0;
      const chaptersCount = modulesList.length;
      return {
        chapters: chaptersCount,
        modules: chaptersCount,
        lessons: lessonsCount,
        tests: testsList.length,
        students: studentsList.length,
      };
    } catch {
      return {
        chapters: 0,
        modules: 0,
        lessons: 0,
        tests: 0,
        students: 0,
      };
    }
  };

  const loadCourses = async () => {
    try {
      setIsLoadingCourses(true);
      setCoursesError('');

      // Lấy toàn bộ khóa học + danh sách khóa public trực tiếp từ backend
      const [allCoursesRes, activeCoursesRes] = await Promise.all([
        getCourses(),
        getActiveCourses().catch(() => []),
      ]);

      const rawCoursesList = Array.isArray(allCoursesRes) ? allCoursesRes : allCoursesRes?.data ?? [];
      const rawActiveList = Array.isArray(activeCoursesRes) ? activeCoursesRes : activeCoursesRes?.data ?? [];

      const activeCourseIdSet = new Set(
        rawActiveList
          .map((course) => {
            const cid =
              course?.courseId ??
              course?.id ??
              course?.course_id ??
              course?.CourseId ??
              null;
            return cid != null ? String(cid) : null;
          })
          .filter((id) => id !== null),
      );

      // Chuẩn hóa danh sách course, ép trạng thái public theo nguồn dữ liệu /courses/active (không cache sai)
      const coursesList = rawCoursesList.map((course) => {
        const courseId = getCourseId(course);
        const key = courseId != null ? String(courseId) : null;
        const isPublicFromActiveList = key ? activeCourseIdSet.has(key) : false;
        return {
          ...course,
          id: courseId || course.id,
          isPublic: isPublicFromActiveList,
          is_public: isPublicFromActiveList,
          public: isPublicFromActiveList,
        };
      });

      setCourses(coursesList);

      const statsPromises = coursesList.map(async (course) => {
        const courseId = getCourseId(course);
        if (courseId) {
          const stats = await loadCourseStats(courseId);
          return { courseId, stats };
        }
        return {
          courseId: null,
          stats: {
            chapters: 0,
            modules: 0,
            lessons: 0,
            tests: 0,
            students: 0,
          },
        };
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

  const loadLessonsForCourse = async (courseId) => {
    if (!courseId) {
      setLessons([]);
      return;
    }
    try {
      setIsLoadingLessons(true);
      setLessonsError('');

      // Load modules từ API
      const [modulesList, publicModuleIds] = await Promise.all([
        getModulesByCourse(courseId),
        resolvePublicModuleIdSet(courseId),
      ]);
      const rawModules = Array.isArray(modulesList) ? modulesList : modulesList?.data ?? [];
      const serverModules = mapModulesToLessonItems(rawModules, publicModuleIds);
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

  const mapCorrectAnswerToIndex = (value) => {
    const letters = ['A', 'B', 'C', 'D'];
    const raw = (value ?? '').toString().trim().toUpperCase();
    const found = letters.indexOf(raw);
    return found >= 0 ? found : 0;
  };

  const normalizeQuestionType = (value) => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (raw === 'REORDER') return 'REORDER';
    if (raw === 'MATCHING') return 'MATCHING';
    if (raw === 'ESSAY_WRITING') return 'ESSAY_WRITING';
    return 'FILL_BLANK';
  };

  const mapWritingQuestionFromApi = (question) => ({
    id: question?.questionId ?? `${question?.questionText}-${question?.orderIndex}`,
    questionId: question?.questionId ?? null,
    questionType: normalizeQuestionType(question?.questionType),
    questionText: question?.questionText ?? '',
    sampleAnswer: question?.correctAnswer ?? '',
    points: Number(question?.points ?? 1),
    items: Array.isArray(question?.items) ? question.items : [],
    columnA: Array.isArray(question?.columnA) ? question.columnA : [],
    columnB: Array.isArray(question?.columnB) ? question.columnB : [],
    topic: question?.topic ?? '',
    instructions: question?.instructions ?? '',
    minWords: question?.minWords ?? '',
    maxWords: question?.maxWords ?? '',
  });

  const loadTestsForCourse = async (courseId) => {
    if (!courseId) {
      setTests([]);
      return;
    }
    try {
      setIsLoadingTests(true);
      setTestsError('');
      const data = await getAssignmentsByCourse(courseId);
      const rawTests = Array.isArray(data) ? data : data?.data ?? [];
      const normalizedTests = rawTests.map((assignment, index) => {
        const assignmentId = getAssignmentId(assignment);
        const assignmentTitle = assignment?.title ?? assignment?.assignmentName ?? assignment?.name ?? '';
        return {
          ...assignment,
          id: assignmentId ?? assignment?.id ?? `assignment-${index}`,
          title: assignmentTitle,
          description: assignment?.description ?? '',
          maxScore: assignment?.maxScore ?? 100,
          dueDate: assignment?.dueDate ?? '',
          orderIndex: assignment?.orderIndex ?? index + 1,
          isNew: false,
          testType: normalizeAssignmentType(assignment?.assignmentType ?? assignment?.testType),
          questions: null,
          questionsLoaded: false,
        };
      });
      setTests((prev) => {
        const newTests = prev.filter((t) => t.isNew);
        return [...normalizedTests, ...newTests].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      });
    } catch (error) {
      setTestsError('Không thể tải danh sách bài kiểm tra.');
      console.error('Fetch tests error:', error);
    } finally {
      setIsLoadingTests(false);
    }
  };

  const handleAddTest = () => {
    const courseId = getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học. Vui lòng chọn khóa học trước.');
      return;
    }
    setTestError('');

    const maxOrderIndex = tests.length > 0
      ? Math.max(...tests.filter((t) => !t.isNew).map((t) => Number(t.orderIndex ?? 0)))
      : 0;
    const nextOrderIndex = Math.max(1, maxOrderIndex + 1);

    const tempId = `temp-test-${Date.now()}`;
    const newTest = {
      id: tempId,
      title: '',
      description: '',
      maxScore: 100,
      dueDate: '',
      orderIndex: nextOrderIndex,
      isNew: true,
      testType: 'QUIZ',
      questions: [],
      questionsLoaded: true,
    };

    setTests((prev) => [...prev, newTest]);
    setSelectedTestId(tempId);
    setSelectedChapterId(null);
    setSelectedLessonId(null);
    setIsCreatingLesson(false);
    setIsEditingLesson(false);
    setContentTab('test');
  };

  const handleSelectTest = async (testId) => {
    setSelectedTestId(testId);
    setSelectedChapterId(null);
    setSelectedLessonId(null);
    setIsCreatingLesson(false);
    setIsEditingLesson(false);
    setContentTab('test');
    setTestError('');

    const currentTest = tests.find((t) => t.id === testId);
    if (!currentTest || currentTest.isNew || currentTest.questionsLoaded) return;

    try {
      const currentType = normalizeAssignmentType(currentTest?.testType ?? currentTest?.assignmentType);
      if (currentType === 'QUIZ') {
        const questionsResponse = await getAssignmentQuestions(testId);
        const rawQuestions = Array.isArray(questionsResponse)
          ? questionsResponse
          : questionsResponse?.data ?? [];
        const mappedQuestions = rawQuestions.map((question) => ({
          id: question.questionId ?? `${question.questionText}-${question.orderIndex}`,
          questionId: question.questionId ?? null,
          question: question.questionText ?? '',
          answers: [
            question.optionA ?? '',
            question.optionB ?? '',
            question.optionC ?? '',
            question.optionD ?? '',
          ],
          correctIndex: mapCorrectAnswerToIndex(question.correctAnswer),
        }));
        setTests((prev) => prev.map((t) => (
          t.id === testId
            ? { ...t, questions: mappedQuestions, questionsLoaded: true, testType: 'QUIZ' }
            : t
        )));
        return;
      }

      const writingResponse = await getWritingQuestions(testId);
      const rawWritingQuestions = Array.isArray(writingResponse)
        ? writingResponse
        : writingResponse?.data ?? [];
      const mappedWritingQuestions = rawWritingQuestions.map(mapWritingQuestionFromApi);
      setTests((prev) => prev.map((t) => (
        t.id === testId
          ? { ...t, questions: mappedWritingQuestions, questionsLoaded: true, testType: 'WRITING' }
          : t
      )));
    } catch (error) {
      console.error('Load test questions error:', error);
    }
  };

  const handleCancelTest = () => {
    if (selectedTestId) {
      const currentTest = tests.find((t) => t.id === selectedTestId);
      if (currentTest?.isNew) {
        setTests((prev) => prev.filter((t) => t.id !== selectedTestId));
      }
    }
    setSelectedTestId(null);
    setContentTab('general');
    setTestError('');
  };

  const handleUpdateTest = (testId, updates) => {
    setTests((prev) => prev.map((test) => (test.id === testId ? { ...test, ...updates } : test)));
  };

  const handleSaveTest = async (testData) => {
    const courseId = getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học.');
      return false;
    }

    if (!testData?.title?.trim()) {
      setTestError('Vui lòng nhập tiêu đề bài kiểm tra.');
      return false;
    }
    if (!testData?.dueDate) {
      setTestError('Vui lòng chọn hạn nộp.');
      return false;
    }
    const parsedMaxScore = Number(testData?.maxScore);
    if (!Number.isFinite(parsedMaxScore) || parsedMaxScore <= 0) {
      setTestError('Điểm tối đa phải lớn hơn 0.');
      return false;
    }

    try {
      setIsSavingTest(true);
      setTestError('');

      const numericCourseId = Number(courseId);
      if (Number.isNaN(numericCourseId)) {
        throw new Error('Mã khóa học không hợp lệ.');
      }

      const validOrderIndexes = tests
        .filter((t) => !t.isNew)
        .map((t) => Number(t.orderIndex ?? 0))
        .filter((idx) => idx > 0);
      const nextOrderIndex = validOrderIndexes.length > 0
        ? Math.max(...validOrderIndexes) + 1
        : 1;

      const assignmentPayload = {
        courseId: numericCourseId,
        title: testData.title.trim(),
        description: testData.description?.trim() || null,
        maxScore: parsedMaxScore,
        dueDate: testData.dueDate,
        assignmentType: normalizeAssignmentType(testData.testType),
      };

      const createdAssignment = await createAssignment(assignmentPayload);
      const assignmentId = getAssignmentId(createdAssignment);
      if (!assignmentId) {
        throw new Error('Không thể lấy mã bài kiểm tra sau khi tạo.');
      }

      const resolvedTestType = normalizeAssignmentType(
        createdAssignment?.assignmentType ?? assignmentPayload.assignmentType
      );

      let updatedTest = {
        ...createdAssignment,
        id: assignmentId,
        title: createdAssignment?.title ?? assignmentPayload.title,
        description: createdAssignment?.description ?? assignmentPayload.description,
        maxScore: createdAssignment?.maxScore ?? assignmentPayload.maxScore,
        dueDate: createdAssignment?.dueDate ?? assignmentPayload.dueDate,
        orderIndex: createdAssignment?.orderIndex ?? nextOrderIndex,
        assignmentType: resolvedTestType,
        testType: resolvedTestType,
        isNew: false,
        questions: null,
        questionsLoaded: false,
      };

      if (resolvedTestType === 'QUIZ') {
        // Tạo bài kiểm tra trước, sau đó nếu có file Excel thì mới upload câu hỏi
        if (testData.quizFile instanceof File) {
          await uploadAssignmentQuestions(assignmentId, testData.quizFile);
          const uploadedQuestionsResponse = await getAssignmentQuestions(assignmentId);
          const uploadedRawQuestions = Array.isArray(uploadedQuestionsResponse)
            ? uploadedQuestionsResponse
            : uploadedQuestionsResponse?.data ?? [];
          const uploadedQuestions = uploadedRawQuestions.map((question) => ({
            id: question.questionId ?? `${question.questionText}-${question.orderIndex}`,
            questionId: question.questionId ?? null,
            question: question.questionText ?? '',
            answers: [
              question.optionA ?? '',
              question.optionB ?? '',
              question.optionC ?? '',
              question.optionD ?? '',
            ],
            correctIndex: mapCorrectAnswerToIndex(question.correctAnswer),
          }));
          updatedTest = {
            ...updatedTest,
            testType: 'QUIZ',
            questions: uploadedQuestions,
            questionsLoaded: true,
          };
        } else {
          // Không có file Excel: chỉ tạo assignment, để trống danh sách câu hỏi (có thể upload sau)
          updatedTest = {
            ...updatedTest,
            testType: 'QUIZ',
            questions: null,
            questionsLoaded: false,
          };
        }
      } else {
        const writingQuestions = Array.isArray(testData?.writingQuestions)
          ? testData.writingQuestions
          : [];
        if (writingQuestions.length === 0) {
          throw new Error('Vui lòng thêm ít nhất một câu hỏi WRITING.');
        }
        const createdWritingQuestions = [];
        for (let index = 0; index < writingQuestions.length; index += 1) {
          const questionPayload = {
            ...writingQuestions[index],
            orderIndex: index + 1,
          };
          const createdQuestion = await createWritingQuestion(assignmentId, questionPayload);
          createdWritingQuestions.push(mapWritingQuestionFromApi(createdQuestion));
        }
        updatedTest = {
          ...updatedTest,
          testType: 'WRITING',
          questions: createdWritingQuestions,
          questionsLoaded: true,
        };
      }

      setTests((prev) => {
        const filtered = prev.filter((t) => t.id !== selectedTestId);
        return [...filtered, updatedTest].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      });
      setSelectedTestId(updatedTest.id);
      setContentTab('test');
      setTestError('');
      toast.success('Đã tạo bài kiểm tra thành công.');
      return true;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Tạo bài kiểm tra thất bại. Vui lòng thử lại.';
      setTestError(msg);
      toast.error(msg);
      console.error('Create test error:', error);
      return false;
    } finally {
      setIsSavingTest(false);
    }
  };

  useEffect(() => {
    loadCourses();
    getTeachers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setTeachers(list);
      })
      .catch(() => setTeachers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewMode === 'content' && selectedCourse) {
      getTeachers()
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data ?? [];
          setTeachers(list);
        })
        .catch(() => setTeachers([]));
    }
  }, [viewMode, selectedCourse]);

  useEffect(() => {
    if (viewMode === 'create') {
      getTeachers()
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data ?? [];
          setTeachers(list);
        })
        .catch(() => setTeachers([]));
    }
  }, [viewMode]);


  const openEditCourseModal = (course) => {
    const courseId = getCourseId(course) ?? course?.id ?? null;
    const tid = course?.teacherId ?? course?.teacher_id ?? '';
    setEditCourseForm({
      title: course?.title ?? '',
      description: course?.description ?? '',
      teacherId: tid ? String(tid) : '',
    });
    setEditCourseModal({ isOpen: true, course: { ...course, id: courseId } });
  };

  const closeEditCourseModal = () => {
    setEditCourseModal({ isOpen: false, course: null });
  };

  const handleQuickUpdateCourse = async () => {
    const courseId = getCourseId(editCourseModal.course) ?? editCourseModal.course?.id;
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học để cập nhật.');
      return;
    }

    const trimmedTitle = editCourseForm.title.trim();
    const trimmedDescription = editCourseForm.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      toast.error('Vui lòng nhập tên khóa học và mô tả tổng quan.');
      return;
    }

    const teacherId = editCourseForm.teacherId ? Number(editCourseForm.teacherId) : null;
    try {
      setIsUpdatingCourse(true);
      await updateCourse(courseId, {
        title: trimmedTitle,
        description: trimmedDescription,
        teacherId,
      });
      toast.success('Đã cập nhật thông tin khóa học.');
      await loadCourses();
      closeEditCourseModal();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Cập nhật khóa học thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  /** Bấm "Lưu thay đổi" trong Cấu hình khóa học → gọi PUT /api/v1/courses/:id */
  const handleSaveGeneralConfig = async (payload) => {
    const courseId = getCourseId(selectedCourse);
    if (!courseId) {
      toast.error('Không tìm thấy mã khóa học.');
      return;
    }
    const trimmedTitle = (payload?.title ?? '').trim();
    if (!trimmedTitle) {
      toast.error('Vui lòng nhập tên khóa học hiển thị.');
      return;
    }
    const teacherId = payload?.teacherId ?? null;
    const updatePayload = {
      title: trimmedTitle,
      description: (payload?.description ?? '').trim(),
      isPublic: payload?.isPublic ?? true,
      is_public: payload?.isPublic ?? true,
    };
    if (teacherId != null) updatePayload.teacherId = teacherId;

    try {
      setIsSavingGeneralConfig(true);
      await updateCourse(courseId, updatePayload);
      setCourseActiveStates((prev) => ({ ...prev, [courseId]: payload?.isPublic ?? true }));
      setCourses((prev) =>
        prev.map((item) =>
          getCourseId(item) === courseId
            ? {
              ...item,
              title: trimmedTitle,
              description: (payload?.description ?? '').trim(),
              isPublic: payload?.isPublic ?? true,
              is_public: payload?.isPublic ?? true,
              teacherId: teacherId ?? item.teacherId,
              teacher_id: teacherId ?? item.teacher_id,
            }
            : item
        )
      );
      setSelectedCourse((prev) =>
        prev && getCourseId(prev) === courseId
          ? {
            ...prev,
            title: trimmedTitle,
            description: (payload?.description ?? '').trim(),
            isPublic: payload?.isPublic ?? true,
            is_public: payload?.isPublic ?? true,
            teacherId: teacherId ?? prev.teacherId,
            teacher_id: teacherId ?? prev.teacher_id,
          }
          : prev
      );
      await loadCourses();
      toast.success('Đã lưu thay đổi cấu hình khóa học.');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Lưu cấu hình thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsSavingGeneralConfig(false);
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
    const nextFromEvent =
      typeof event?.target?.checked === 'boolean' ? event.target.checked : null;
    const newActiveState = nextFromEvent !== null ? nextFromEvent : !currentState;
    setCourseActiveStates((prev) => ({ ...prev, [courseId]: newActiveState }));
    setCourses((prev) =>
      prev.map((item) =>
        getCourseId(item) === courseId
          ? {
            ...item,
            isPublic: newActiveState,
            is_public: newActiveState,
            isActive: newActiveState,
            is_active: newActiveState,
          }
          : item
      )
    );
    try {
      const payload = {
        isPublic: newActiveState,
        is_public: newActiveState,
        public: newActiveState,
        isActive: newActiveState,
        is_active: newActiveState,
        courseId: Number(courseId),
        id: Number(courseId),
      };
      if (course?.title) payload.title = course.title;
      if (course?.description) payload.description = course.description;
      const normalizedCourseId = Number.isNaN(Number(courseId)) ? courseId : Number(courseId);
      await updateCourse(normalizedCourseId, payload);
      toast.success(newActiveState ? 'Đã mở khóa học (PUBLIC).' : 'Đã đóng khóa học.');
    } catch {
      setCourseActiveStates((prev) => ({ ...prev, [courseId]: currentState }));
      setCourses((prev) =>
        prev.map((item) =>
          getCourseId(item) === courseId ? { ...item, isPublic: currentState } : item
        )
      );
      toast.error('Cập nhật trạng thái khóa học thất bại. Vui lòng thử lại.');
    }
  };

  const handleSelectChapter = (chapterId) => {
    setSelectedChapterId(chapterId);
    setSelectedLessonId(null);
    setSelectedTestId(null);
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
    const courseId = getCourseId(selectedCourse);
    if (courseId && chapterId) {
      loadModuleLessons(chapterId, courseId);
    }
  };

  const handleSelectLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
    setSelectedTestId(null);
    setIsCreatingLesson(false);
    setIsEditingLesson(false); // Mặc định là view mode khi click vào card
    setContentTab('lesson');
  };

  const handleEditLesson = () => {
    setIsEditingLesson(true); // Chuyển sang edit mode khi click nút chỉnh sửa
  };

  const handleCancelEditLesson = () => {
    setIsEditingLesson(false); // Quay lại view mode khi hủy
  };

  const handleSelectCourse = (course, courseId) => {
    setSelectedCourse(course);
    setContentTab('general');
    setSelectedChapterId(null);
    setSelectedLessonId(null);
    setSelectedTestId(null);
    setModuleLessons([]);
    setLessonError('');
    setLessons([]);
    setTests([]);
    setTestError('');
    setTestsError('');
    setPublishingModuleIds([]);
    setPublishingLessonIds([]);
    loadLessonsForCourse(courseId);
    loadTestsForCourse(courseId);
    setViewMode('content');
    setActiveNavTab('management');
  };

  const handleEditCourse = (course) => {
    openEditCourseModal(course);
    setActiveNavTab('management');
  };

  const handleUpdateLesson = (lessonId, updates) => {
    setLessons((prev) => prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...updates } : lesson)));
  };

  // Handler để cập nhật lesson trong moduleLessons (dùng cho lesson tạm khi người dùng nhập)
  const handleUpdateModuleLesson = (lessonId, updates) => {
    setModuleLessons((prev) => prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...updates } : lesson)));
  };

  const getCourseStudentCount = (course) => {
    const courseId = getCourseId(course);
    const statsValue =
      courseStats?.[courseId]?.students ??
      courseStats?.[courseId]?.studentCount ??
      courseStats?.[courseId]?.studentsCount;
    if (Number.isFinite(statsValue)) return statsValue;
    const parsed = Number(statsValue);
    if (Number.isFinite(parsed)) return parsed;

    const candidate =
      course?.studentCount ??
      course?.studentsCount ??
      course?.enrollmentCount ??
      course?.enrolledCount ??
      course?.totalStudents ??
      course?.learnerCount ??
      course?.participants;

    if (typeof candidate === 'number' && !Number.isNaN(candidate)) return candidate;
    if (Array.isArray(candidate)) return candidate.length;
    if (Array.isArray(course?.students)) return course.students.length;
    return 0;
  };

  const normalizedSearch = courseSearch.trim().toLowerCase();
  const dashboardCourses = courses.filter((course) => {
    if (!normalizedSearch) return true;
    const courseId = getCourseId(course);
    const fallbackId = formatCourseId(courseId);
    const haystack = [
      course?.title ?? '',
      course?.description ?? '',
      fallbackId,
    ].join(' ').toLowerCase();
    return haystack.includes(normalizedSearch);
  });
  const dashboardActiveCourses = dashboardCourses.filter((course) => resolveCourseActiveState(course));
  const dashboardInactiveCourses = dashboardCourses.filter((course) => !resolveCourseActiveState(course));
  const totalCourses = dashboardCourses.length;
  const activePercent = totalCourses ? Math.round((dashboardActiveCourses.length / totalCourses) * 100) : 0;

  const courseBars = dashboardCourses.slice(0, 6).map((course, index) => {
    const courseId = getCourseId(course);
    const label = course?.title || formatCourseId(courseId) || `KH${index + 1}`;
    return {
      id: courseId ?? `${label}-${index}`,
      label,
      value: getCourseStudentCount(course),
    };
  });
  const maxBarValue = Math.max(1, ...courseBars.map((item) => item.value));

  const courseSearchLower = (courseSearch || '').trim().toLowerCase();
  const matchesSearch = (course) => {
    if (!courseSearchLower) return true;
    const title = (course?.title || '').toLowerCase();
    return title.includes(courseSearchLower);
  };
  const managementActiveCourses = courses
    .filter((course) => resolveCourseActiveState(course))
    .filter(matchesSearch);
  const managementInactiveCourses = courses
    .filter((course) => !resolveCourseActiveState(course))
    .filter(matchesSearch);

  return (
    <DashboardLayout
      layoutVariant="teacher"
      pageTitle="Quản lý khóa học"
      pageSubtitle="Hệ thống quản lý Module & Lesson tập trung"
      showSidebar={true}
      managerSidebarTab={activeNavTab}
      onManagerSidebarTabChange={setActiveNavTab}
    >
      <div className="teacher-area">
        <section className="manager-dashboard-content">
          {activeNavTab === 'dashboard' && (
            <div className="manager-overview">
              <div className="manager-overview-header">
                <div>
                  <h2>Tổng quan</h2>
                  <p>Báo cáo thống kê nhanh về tình hình hoạt động khóa học.</p>
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
                  <div className="manager-profile-chip">
                    <div className="manager-profile-avatar">QL</div>
                    <div>
                      <div className="manager-profile-name">Course Manager</div>
                      <div className="manager-profile-role">Quản lý hệ thống</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="manager-overview-grid">
                <div className="manager-chart-card">
                  <div className="manager-chart-header">
                    <h3>Trạng thái khóa học</h3>
                    <span className="manager-chart-subtitle">{totalCourses} khóa học</span>
                  </div>
                  <div className="pie-chart">
                    <div
                      className="pie-chart-visual"
                      style={{
                        background: `conic-gradient(#22c55e 0 ${activePercent}%, #e5e7eb ${activePercent}% 100%)`,
                      }}
                    >
                      <div className="pie-chart-center">
                        <strong>{activePercent}%</strong>
                        <span>Đang mở</span>
                      </div>
                    </div>
                    <div className="pie-chart-legend">
                      <div className="pie-chart-legend-item">
                        <span className="legend-dot legend-dot-active" />
                        <span>Đang mở</span>
                        <strong>{dashboardActiveCourses.length}</strong>
                      </div>
                      <div className="pie-chart-legend-item">
                        <span className="legend-dot legend-dot-inactive" />
                        <span>Đang đóng</span>
                        <strong>{dashboardInactiveCourses.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="manager-chart-card">
                  <div className="manager-chart-header">
                    <h3>Thống kê học viên</h3>
                    <span className="manager-chart-subtitle">Theo từng khóa học</span>
                  </div>
                  {courseBars.length ? (
                    <div className="bar-chart">
                      {courseBars.map((item) => (
                        <div key={item.id} className="bar-chart-item">
                          <div
                            className="bar-chart-bar"
                            style={{ height: `${Math.max(8, (item.value / maxBarValue) * 100)}%` }}
                          >
                            <span className="bar-chart-value">{item.value}</span>
                          </div>
                          <span className="bar-chart-label">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="course-status">Chưa có dữ liệu khóa học.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeNavTab === 'management' && (
            viewMode === 'content' && selectedCourse ? (
              <div className="course-create is-content">
                <CourseContentLayout
                  selectedCourse={selectedCourse}
                  contentTab={contentTab}
                  courseCoverImageUrl={courseCoverImageUrl}
                  lessons={lessons}
                  tests={tests}
                  isLoadingLessons={isLoadingLessons}
                  lessonsError={lessonsError}
                  lessonError={lessonError}
                  isSavingLesson={isSavingLesson}
                  selectedChapterId={selectedChapterId}
                  selectedLessonId={selectedLessonId}
                  selectedTestId={selectedTestId}
                  isCreatingLesson={isCreatingLesson}
                  moduleLessons={moduleLessons}
                  isReloadingLessons={isReloadingLessons}
                  onTabChange={setContentTab}
                  onCoverImageUrlChange={setCourseCoverImageUrl}
                  onAddChapter={handleAddChapter}
                  onAddLessonItem={handleAddLessonItem}
                  onAddTest={handleAddTest}
                  onSelectChapter={handleSelectChapter}
                  onSelectLesson={handleSelectLesson}
                  onSelectTest={handleSelectTest}
                  onDeleteChapter={handleDeleteChapter}
                  onDeleteLesson={handleDeleteLesson}
                  onPublishChapter={handlePublishChapter}
                  onPublishLesson={handlePublishLesson}
                  onSaveChapter={handleSaveChapter}
                  onCancelChapter={handleCancelChapter}
                  onSaveLesson={handleSaveLesson}
                  onCancelLesson={handleCancelLesson}
                  onUpdateLesson={handleUpdateLesson}
                  onUpdateModuleLesson={handleUpdateModuleLesson}
                  onEditLesson={handleEditLesson}
                  onCancelEditLesson={handleCancelEditLesson}
                  isEditingLesson={isEditingLesson}
                  onSaveTest={handleSaveTest}
                  onCancelTest={handleCancelTest}
                  onUpdateTest={handleUpdateTest}
                  isSavingTest={isSavingTest}
                  testError={testError}
                  isLoadingTests={isLoadingTests}
                  testsError={testsError}
                  onSaveAndFinish={() => {
                    setViewMode('list');
                    setSelectedCourse(null);
                    setSelectedChapterId(null);
                    setSelectedTestId(null);
                    setSelectedLessonId(null);
                    setLessons([]);
                    setModuleLessons([]);
                    setTests([]);
                    setPublishingModuleIds([]);
                    setPublishingLessonIds([]);
                    setContentTab('general');
                    setActiveNavTab('management');
                  }}
                  getCourseId={getCourseId}
                  getCourseIsActive={getCourseIsActive}
                  onSaveGeneralConfig={handleSaveGeneralConfig}
                  isSavingGeneralConfig={isSavingGeneralConfig}
                  teachers={teachers}
                  publishingModuleIds={publishingModuleIds}
                  publishingLessonIds={publishingLessonIds}
                />
              </div>
            ) : viewMode === 'create' ? (
              <div className="course-create">
                <div className="course-create-header">
                  <div>
                    <h1>Tạo khóa học mới</h1>
                    <p>Nhập thông tin cơ bản trước khi xây dựng nội dung.</p>
                  </div>
                  <div className="course-create-actions">
                    <button
                      type="button"
                      className="course-action-link"
                      onClick={handleCancelCreateCourse}
                    >
                      Quay lại danh sách
                    </button>
                  </div>
                </div>
                <CourseInitForm
                  courseTitle={courseTitle}
                  courseDescription={courseDescription}
                  courseIsPublic={courseIsPublic}
                  courseTeacherId={courseTeacherId}
                  teachers={teachers}
                  courseError={courseError}
                  courseSuccess={courseSuccess}
                  isSavingCourse={isSavingCourse}
                  onTitleChange={setCourseTitle}
                  onDescriptionChange={setCourseDescription}
                  onPublicChange={handleCreatePublicChange}
                  onTeacherChange={handleCreateTeacherChange}
                  onCancel={handleCancelCreateCourse}
                  onContinue={handleCreateCourse}
                />
              </div>
            ) : (
              <div className="course-management-view">
                <div className="course-management-header">
                  <div className="course-management-header-text">
                    <h2>Quản lý khóa học</h2>
                    <p>Danh sách khóa học theo trạng thái hoạt động.</p>
                  </div>
                  <div className="course-management-header-actions">
                    <div className="manager-search course-management-search">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Tìm kiếm khóa học, học viên..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        aria-label="Tìm kiếm khóa học"
                      />
                    </div>
                    <button
                      type="button"
                      className="course-action-btn primary course-management-cta"
                      onClick={openCreateCourse}
                    >
                      Tạo khóa học
                    </button>
                  </div>
                </div>

                {isLoadingCourses ? (
                  <div className="course-status">Đang tải khóa học...</div>
                ) : coursesError ? (
                  <div className="course-status course-status-error">{coursesError}</div>
                ) : (
                  <div className="course-management-sections">
                    <div className="course-section">
                      <div className="course-section-header">
                        <h3>Công khai</h3>
                        <span className="course-section-count">{managementActiveCourses.length} khóa học</span>
                      </div>
                      <div className="course-section-grid">
                        {managementActiveCourses.length ? (
                          managementActiveCourses.map((course, index) => {
                            const courseId = getCourseId(course);
                            return (
                              <CourseCard
                                key={courseId || course.title || index}
                                course={course}
                                courseStats={courseStats}
                                courseActiveStates={courseActiveStates}
                                onSelect={() => {
                                  const nextCourseId = getCourseId(course);
                                  handleSelectCourse({ ...course, id: nextCourseId ?? course.id }, nextCourseId);
                                }}
                                onToggleActive={handleToggleActive}
                                onEdit={(courseItem) => {
                                  const nextCourseId = getCourseId(courseItem);
                                  handleEditCourse({ ...courseItem, id: nextCourseId ?? courseItem.id }, nextCourseId);
                                }}
                                getCourseId={getCourseId}
                                getCourseIsActive={getCourseIsActive}
                              />
                            );
                          })
                        ) : (
                          <div className="course-status">Chưa có khóa học đang mở.</div>
                        )}
                      </div>
                    </div>

                    <div className="course-section is-closed">
                      <div className="course-section-header">
                        <h3>Đang đóng</h3>
                        <span className="course-section-count">{managementInactiveCourses.length} khóa học</span>
                      </div>
                      <div className="course-section-grid">
                        {managementInactiveCourses.length ? (
                          managementInactiveCourses.map((course, index) => {
                            const courseId = getCourseId(course);
                            return (
                              <CourseCard
                                key={courseId || course.title || index}
                                course={course}
                                courseStats={courseStats}
                                courseActiveStates={courseActiveStates}
                                onSelect={() => {
                                  const nextCourseId = getCourseId(course);
                                  handleSelectCourse({ ...course, id: nextCourseId ?? course.id }, nextCourseId);
                                }}
                                onToggleActive={handleToggleActive}
                                onEdit={(courseItem) => {
                                  const nextCourseId = getCourseId(courseItem);
                                  handleEditCourse({ ...courseItem, id: nextCourseId ?? courseItem.id }, nextCourseId);
                                }}
                                getCourseId={getCourseId}
                                getCourseIsActive={getCourseIsActive}
                              />
                            );
                          })
                        ) : (
                          <div className="course-status">Chưa có khóa học đang đóng.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

        </section>

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

        {/* Modal xác nhận xóa bài học */}
        {deleteLessonModal.isOpen && (
          <div className="delete-confirm-modal-overlay" onClick={cancelDeleteLesson}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-modal-header">
                <h3 className="delete-confirm-modal-title">Xác nhận xóa bài học</h3>
              </div>
              <div className="delete-confirm-modal-body">
                <p className="delete-confirm-modal-message">
                  Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="delete-confirm-modal-footer">
                <button
                  type="button"
                  className="delete-confirm-modal-btn delete-confirm-modal-btn-cancel"
                  onClick={cancelDeleteLesson}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="delete-confirm-modal-btn delete-confirm-modal-btn-confirm"
                  onClick={confirmDeleteLesson}
                  disabled={isSavingLesson}
                >
                  {isSavingLesson ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editCourseModal.isOpen && (
          <div className="course-edit-modal-overlay" onClick={closeEditCourseModal}>
            <div className="course-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="course-edit-modal-header">
                <h3>Cập nhật khóa học</h3>
                <button
                  type="button"
                  className="course-edit-modal-close"
                  onClick={closeEditCourseModal}
                  aria-label="Đóng"
                >
                  x
                </button>
              </div>
              <div className="course-edit-modal-body">
                <label className="course-edit-modal-label">Tên khóa học</label>
                <input
                  className="course-edit-modal-input"
                  type="text"
                  value={editCourseForm.title}
                  onChange={(event) => setEditCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                />
                <label className="course-edit-modal-label">Giáo viên phụ trách</label>
                <select
                  className="course-edit-modal-input course-edit-modal-select"
                  value={editCourseForm.teacherId}
                  onChange={(e) => setEditCourseForm((prev) => ({ ...prev, teacherId: e.target.value }))}
                >
                  <option value="">Chọn giáo viên (tùy chọn)</option>
                  {teachers.map((t) => (
                    <option key={t.id ?? t.userId} value={String(t.id ?? t.userId ?? '')}>
                      {t.name ?? t.username ?? `Giáo viên ${t.id ?? t.userId ?? ''}`}
                    </option>
                  ))}
                </select>
                <label className="course-edit-modal-label">Mô tả tổng quan</label>
                <textarea
                  className="course-edit-modal-textarea"
                  rows={4}
                  value={editCourseForm.description}
                  onChange={(event) => setEditCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                />
                <p className="course-edit-modal-note">
                  Trạng thái mở/đóng được cập nhật trực tiếp trên thẻ khóa học.
                </p>
              </div>
              <div className="course-edit-modal-footer">
                <button
                  type="button"
                  className="course-edit-modal-btn"
                  onClick={closeEditCourseModal}
                  disabled={isUpdatingCourse}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="course-edit-modal-btn primary"
                  onClick={handleQuickUpdateCourse}
                  disabled={isUpdatingCourse}
                >
                  {isUpdatingCourse ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CourseManagement;
