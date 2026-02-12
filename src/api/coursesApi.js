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

export const updateCourse = async (courseId, courseData) => {
  const response = await apiClient.put(`/courses/${courseId}`, courseData);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await apiClient.post(`/courses/delete/${courseId}`);
  return response.data;
};
