import apiClient from '../config/axios';

export const createLesson = async (lessonData = {}) => {
  const response = await apiClient.post('/lessons/create', lessonData);
  return response.data;
};

export const updateLesson = async (lessonId, lessonData) => {
  const response = await apiClient.put(`/lessons/update/${lessonId}`, lessonData);
  return response.data;
};

export const deleteLesson = async (lessonId) => {
  const response = await apiClient.delete(`/lessons/delete/${lessonId}`);
  return response.data;
};

export const getLessons = async (params = {}) => {
  const response = await apiClient.get('/lessons/', {
    params,
  });
  return response.data;
};

export const getLessonView = async () => {
  const response = await apiClient.get('/lessons/view');
  return response.data;
};

/** GET /lessons/IdAndPublic?moduleId={moduleId} – Lấy danh sách bài học public của một module (cho giáo viên/học viên). */
export const getLessonsByModuleIdAndIsPublicTrue = async (moduleId) => {
  try {
    const response = await apiClient.get('/lessons/IdAndPublic', {
      params: { moduleId },
    });
    return response.data;
  } catch (err) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
};

export const completeLessonById = async (lessonId) => {
  const response = await apiClient.post(`/lessonsCompletion/${lessonId}/complete`);
  return response.data;
};

/**
 * Upload video cho bài học.
 * OpenAPI: POST /lessons/{lessonId}/upload-video.
 * FE hiện gọi POST /lessons/upload-video (không lessonId) để tương thích flow tạo lesson trước khi có id.
 * Nếu backend chỉ hỗ trợ có lessonId, gọi uploadLessonVideoForLesson(lessonId, file).
 */
export const uploadLessonVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/lessons/upload-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/** POST /lessons/{lessonId}/upload-video – Đúng OpenAPI (dùng khi đã có lessonId) */
export const uploadLessonVideoForLesson = async (lessonId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(
    `/lessons/${lessonId}/upload-video`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};
