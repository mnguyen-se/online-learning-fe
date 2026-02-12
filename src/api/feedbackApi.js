import apiClient from '../config/axios';

/**
 * Feedback API – khớp OpenAPI:
 * POST /feedbacks/course, GET /feedbacks/student/{studentId},
 * GET /feedbacks/my-feedbacks, GET /feedbacks/course/{courseId}
 */

/** GET /feedbacks/my-feedbacks – Lấy danh sách feedback của teacher */
export const getMyFeedbacks = async (params = {}) => {
  const response = await apiClient.get('/feedbacks/my-feedbacks', { params });
  return response.data;
};

/** GET /feedbacks/student/{studentId} – Lấy feedback của student */
export const getFeedbacksByStudent = async (studentId) => {
  const response = await apiClient.get(`/feedbacks/student/${studentId}`);
  return response.data;
};

/** GET /feedbacks/course/{courseId} – Lấy feedback theo khóa học */
export const getFeedbacksByCourse = async (courseId) => {
  const response = await apiClient.get(`/feedbacks/course/${courseId}`);
  return response.data;
};

/** POST /feedbacks/course – Tạo feedback cho khóa học đã hoàn thành */
export const createCourseFeedback = async (payload) => {
  const response = await apiClient.post('/feedbacks/course', payload);
  return response.data;
};
