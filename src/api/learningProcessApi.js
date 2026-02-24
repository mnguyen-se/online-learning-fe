import apiClient from '../config/axios';

/**
 * GET /api/v1/learning-process?courseId= – Lấy tiến trình học tập của user hiện tại theo khóa.
 * Response: { courseId, userId, totalTasks, completedTasks, progressPercent, ... }
 */
export const getLearningProcess = async (courseId) => {
  const response = await apiClient.get('/learning-process', {
    params: { courseId },
  });
  return response.data;
};

/**
 * POST /api/v1/learning-process/enroll – khởi tạo tiến trình học tập.
 * Query: ?courseId=...
 */
export const enrollLearningProcess = async (courseId) => {
  const response = await apiClient.post('/learning-process/enroll', null, {
    params: { courseId },
  });
  return response.data;
};
