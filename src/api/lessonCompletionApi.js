import apiClient from '../config/axios';

/**
 * POST /api/v1/lessonsCompletion/{lessonId}/complete – Đánh dấu hoàn thành bài học.
 */
export const completeLesson = async (lessonId) => {
  const response = await apiClient.post(
    `/lessonsCompletion/${lessonId}/complete`,
    null,
    { skipSuccessToast: true }
  );
  return response.data;
};
