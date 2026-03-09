import apiClient from '../config/axios';

export const getCourses = async () => {
  const response = await apiClient.get('/courses');
  return response.data;
};

/** GET /api/v1/courses/my-courses – Danh sách khóa học của giáo viên đang đăng nhập */
export const getMyCourses = async () => {
  const response = await apiClient.get('/courses/my-courses');
  return response.data;
};

export const getActiveCourses = async () => {
  const response = await apiClient.get('/courses/active');
  return response.data;
};

/** GET /api/v1/courses/getById?id={id} – Lấy thông tin khóa học (public). */
export const getCourseById = async (courseId) => {
  const response = await apiClient.get('/courses/getById', { params: { id: courseId } });
  return response.data;
};

/** GET /api/v1/courses/teachers – Danh sách giáo viên (COURSE_MANAGER / ADMIN) */
export const getTeachers = async () => {
  const response = await apiClient.get('/courses/teachers');
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await apiClient.post('/courses', courseData);
  // Nếu response.data rỗng hoặc undefined, trả về courseData với status
  if (!response.data || Object.keys(response.data).length === 0) {
    console.warn('API returned empty response, using request data');
    return {
      ...courseData,
      id: response.headers?.location?.split('/').pop() || null,
    };
  }
  return response.data;
};

/** PUT /api/v1/courses/:id – Cập nhật khóa học (gọi khi bấm "Lưu thay đổi" trong Cấu hình khóa học) */
export const updateCourse = async (courseId, courseData) => {
  const response = await apiClient.put(`/courses/${courseId}`, courseData);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await apiClient.post(`/courses/delete/${courseId}`);
  return response.data;
};

/** GET /api/v1/courses/{courseId}/statistics – Teacher xem thống kê khóa học mình quản lý */
export const getCourseStatistics = async (courseId) => {
  const response = await apiClient.get(`/courses/${courseId}/statistics`);
  return response.data;
};
