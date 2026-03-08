import apiClient from "../config/axios";

export const createLesson = async (lessonData = {}) => {
  const response = await apiClient.post("/lessons/create", lessonData);
  return response.data;
};

export const updateLesson = async (lessonId, lessonData) => {
  const response = await apiClient.put(
    `/lessons/update/${lessonId}`,
    lessonData
  );
  return response.data;
};

export const deleteLesson = async (lessonId) => {
  const response = await apiClient.delete(`/lessons/delete/${lessonId}`);
  return response.data;
};

export const getLessons = async (params = {}) => {
  try {
    const response = await apiClient.get("/lessons/", {
      params,
      // 404 "Không có lesson nào" không phải lỗi nghiệp vụ cho màn quản lý
      // → tránh toast lỗi chung, FE sẽ xử lý danh sách rỗng.
      skipErrorToast: true,
    });
    return response.data;
  } catch (err) {
    const status = err?.response?.status;
    const message = (err?.response?.data?.message || "").toLowerCase();
    const isNoLessons =
      status === 404 &&
      (message.includes("không có lesson") || message.includes("khong co lesson") || message.includes("no lesson"));
    if (isNoLessons) {
      return [];
    }
    throw err;
  }
};

export const getLessonView = async () => {
  const response = await apiClient.get("/lessons/view");
  return response.data;
};

export const completeLessonById = async (lessonId) => {
  const response = await apiClient.post(
    `/lessonsCompletion/${lessonId}/complete`
  );
  return response.data;
};

/** GET /ai/lessons/{lessonId}/hint - AI gợi ý cho bài học */
export const getAiLessonHint = async (lessonId) => {
  const response = await apiClient.get(`/ai/lessons/${lessonId}/hint`);
  return response.data;
};

/** GET /ai/lessons/{lessonId}/quiz - AI tạo quiz practice (trả về HTML) */
export const getAiLessonQuiz = async (lessonId) => {
  const response = await apiClient.get(`/ai/lessons/${lessonId}/quiz`, {
    responseType: "text",
  });
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
  formData.append("file", file);
  const response = await apiClient.post("/lessons/upload-video", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/** POST /lessons/{lessonId}/upload-video – Đúng OpenAPI (dùng khi đã có lessonId) */
export const uploadLessonVideoForLesson = async (lessonId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post(
    `/lessons/${lessonId}/upload-video`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
