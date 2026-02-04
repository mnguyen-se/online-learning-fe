import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { deleteCourse, getCourses, updateCourse } from '../../../api/coursesApi';
import { createLesson, updateLesson, getLessons, deleteLesson } from '../../../api/lessionApi';
import { createModule, deleteModule, getModulesByCourse } from '../../../api/module';
import DashboardLayout from '../../../components/DashboardLayout';
import CourseCard from './components/CourseCard';
import CourseContentLayout from './components/CourseContentLayout';
import './courseManagement.css';

function CourseManagement() {
  const [viewMode, setViewMode] = useState('list');
  const [activeNavTab, setActiveNavTab] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [editCourseModal, setEditCourseModal] = useState({ isOpen: false, course: null });
  const [editCourseForm, setEditCourseForm] = useState({ title: '', description: '' });
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
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
  const [isEditingLesson, setIsEditingLesson] = useState(false); // Track chế độ edit/view
  const [moduleLessons, setModuleLessons] = useState([]); // Danh sách lessons của module đang chọn
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, chapterId: null });
  const [deleteLessonModal, setDeleteLessonModal] = useState({ isOpen: false, lessonId: null });
  const [isReloadingLessons, setIsReloadingLessons] = useState(false);

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

  const resolveCourseActiveState = (course) => {
    const courseId = getCourseId(course);
    if (courseId && typeof courseActiveStates[courseId] === 'boolean') {
      return courseActiveStates[courseId];
    }
    return getCourseIsActive(course);
  };

  const handleAddChapter = () => {
    const courseId = getCourseId(selectedCourse);
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
      contentUrl: '',
      textContent: '',
      orderIndex: nextOrderIndex,
      moduleId: selectedChapterId,
      isNew: true, // Đánh dấu là lesson mới chưa lưu
      isServer: false,
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
      
      // Lọc lessons thuộc module (CHỈ LẤY CÁC LESSON CHƯA BỊ XÓA)
      const serverLessons = rawLessons
        .filter(l => {
          const lessonModuleId = l.moduleId ?? l.module?.moduleId ?? l.sectionId ?? l.section?.id;
          const isPublic = l.isPublic ?? l.is_public ?? true; // Mặc định là true nếu không có field
          return lessonModuleId === moduleId && isPublic === true;
        })
        .map(l => {
          const lessonType = l.lessonType ?? 'VIDEO';
          const contentUrl = l.contentUrl ?? '';
          
          // Xử lý textContent: TEXT, QUIZ, ASSIGNMENT lưu nội dung trong contentUrl
          let textContent = '';
          if (lessonType === 'TEXT' || lessonType === 'QUIZ' || lessonType === 'ASSIGNMENT') {
            textContent = contentUrl;
          }
          
          // Lấy lessonId từ nhiều nguồn có thể
          const lessonId = l.lessonId ?? l.id ?? l._id;
          
          return {
            id: lessonId ?? Date.now() + Math.random(),
            lessonId: lessonId, // Lưu thêm lessonId để dùng cho update/delete
            title: l.title ?? 'Bài học mới',
            lessonType: lessonType,
            contentUrl: lessonType === 'VIDEO' ? contentUrl : '',
            textContent: textContent,
            orderIndex: l.orderIndex ?? 0,
            moduleId: moduleId,
            isServer: true,
          };
        })
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      
      // Giữ lại các lesson mới chưa lưu (có isNew: true) nhưng không trùng với server lessons
      // Kiểm tra trùng dựa vào orderIndex và moduleId
      const existingOrderIndexes = new Set(serverLessons.map(l => Number(l.orderIndex ?? 0)));
      const newLessons = moduleLessons.filter(l => 
        l.isNew 
        && l.moduleId === moduleId
        && !existingOrderIndexes.has(Number(l.orderIndex ?? 0)) // Không trùng orderIndex với server lessons
      );
      
      // Merge: server lessons + new lessons (chưa lưu, không trùng)
      setModuleLessons([...serverLessons, ...newLessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    } catch (error) {
      console.error('Load module lessons error:', error);
      // Giữ lại các lesson mới chưa lưu nếu có lỗi
      const newLessons = moduleLessons.filter(l => l.isNew && l.moduleId === moduleId);
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

      // Chuẩn bị payload theo LessonDtoReq
      const lessonPayload = {
        title: lessonData.title,
        lessonType: lessonData.lessonType || 'VIDEO',
        orderIndex: orderIndex,
        moduleId: selectedChapterId,
      };

      // Xử lý contentUrl và textContent theo lessonType
      if (lessonData.lessonType === 'VIDEO') {
        lessonPayload.contentUrl = lessonData.contentUrl || '';
      } else if (lessonData.lessonType === 'TEXT') {
        lessonPayload.contentUrl = lessonData.textContent || '';
      } else if (lessonData.lessonType === 'QUIZ') {
        lessonPayload.contentUrl = lessonData.textContent || ''; // JSON string từ LessonDetails
      } else if (lessonData.lessonType === 'ASSIGNMENT') {
        // ASSIGNMENT: lưu mô tả/yêu cầu bài tập vào contentUrl (hoặc JSON nếu có metadata)
        lessonPayload.contentUrl = lessonData.textContent || lessonData.contentUrl || '';
      } else {
        lessonPayload.contentUrl = lessonData.contentUrl || lessonData.textContent || '';
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


  const openEditCourseModal = (course) => {
    const courseId = getCourseId(course) ?? course?.id ?? null;
    setEditCourseForm({
      title: course?.title ?? '',
      description: course?.description ?? '',
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

    try {
      setIsUpdatingCourse(true);
      await updateCourse(courseId, {
        title: trimmedTitle,
        description: trimmedDescription,
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
    const courseId = getCourseId(selectedCourse);
    if (courseId && chapterId) {
      loadModuleLessons(chapterId, courseId);
    }
  };

  const handleSelectLesson = (lessonId) => {
    setSelectedLessonId(lessonId);
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
    setModuleLessons([]);
    setLessonError('');
    setLessons([]);
    loadLessonsForCourse(courseId);
    setViewMode('content');
    setActiveNavTab('management');
  };

  const handleEditCourse = (course) => {
    openEditCourseModal(course);
    setActiveNavTab('management');
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

  // Handler để cập nhật lesson trong moduleLessons (dùng cho lesson tạm khi người dùng nhập)
  const handleUpdateModuleLesson = (lessonId, updates) => {
    setModuleLessons((prev) => prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, ...updates } : lesson)));
  };

  const getCourseStudentCount = (course) => {
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

    const courseId = getCourseId(course);
    const fallback = courseStats?.[courseId]?.lessons ?? courseStats?.[courseId]?.modules ?? 0;
    return Number(fallback) || 0;
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

  const managementActiveCourses = courses.filter((course) => resolveCourseActiveState(course));
  const managementInactiveCourses = courses.filter((course) => !resolveCourseActiveState(course));

  return (
    <DashboardLayout
      pageTitle="Quản lý khóa học"
      pageSubtitle="Hệ thống quản lý Module & Lesson tập trung"
      showSidebar={false}
      showTopbar={false}
    >
      <section className="manager-dashboard-content">
        <div className="course-management-nav">
          <div className="course-management-tabs">
            <button
              type="button"
              className={`course-management-tab${activeNavTab === 'dashboard' ? ' is-active' : ''}`}
              onClick={() => setActiveNavTab('dashboard')}
            >
              Tổng quan
            </button>
            <button
              type="button"
              className={`course-management-tab${activeNavTab === 'management' ? ' is-active' : ''}`}
              onClick={() => setActiveNavTab('management')}
            >
              Quản lý KH
            </button>
          </div>
        </div>

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
                isLoadingLessons={isLoadingLessons}
                lessonsError={lessonsError}
                lessonError={lessonError}
                isSavingLesson={isSavingLesson}
                selectedChapterId={selectedChapterId}
                selectedLessonId={selectedLessonId}
                isCreatingLesson={isCreatingLesson}
                moduleLessons={moduleLessons}
                isReloadingLessons={isReloadingLessons}
                onTabChange={setContentTab}
                onCoverImageUrlChange={setCourseCoverImageUrl}
                onAddChapter={handleAddChapter}
                onAddLessonItem={handleAddLessonItem}
                onSelectChapter={handleSelectChapter}
                onSelectLesson={handleSelectLesson}
                onDeleteChapter={handleDeleteChapter}
                onDeleteLesson={handleDeleteLesson}
                onSaveChapter={handleSaveChapter}
                onCancelChapter={handleCancelChapter}
                onSaveLesson={handleSaveLesson}
                onCancelLesson={handleCancelLesson}
                onUpdateLesson={handleUpdateLesson}
                onUpdateModuleLesson={handleUpdateModuleLesson}
                onEditLesson={handleEditLesson}
                onCancelEditLesson={handleCancelEditLesson}
                isEditingLesson={isEditingLesson}
                onSaveAndFinish={async () => {
                  await handleUpdateCourseContent();
                  setViewMode('list');
                  setSelectedCourse(null);
                  setSelectedChapterId(null);
                  setActiveNavTab('management');
                  toast.success('Đã lưu và kết thúc chỉnh sửa khóa học.');
                }}
                getCourseId={getCourseId}
                formatCourseId={formatCourseId}
              />
            </div>
          ) : (
            <div className="course-management-view">
              <div className="course-management-header">
                <div>
                  <h2>Quản lý khóa học</h2>
                  <p>Danh sách khóa học theo trạng thái hoạt động.</p>
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
                      <h3>Đang mở</h3>
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
    </DashboardLayout>
  );
}

export default CourseManagement;
