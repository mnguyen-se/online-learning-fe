import apiClient from '../config/axios';

// Các endpoint module theo /api/v1/modules
const base = '/modules';

/** GET /api/v1/modules/{moduleId} – lấy chi tiết một module */
export const getModule = async (moduleId) => {
  const response = await apiClient.get(`${base}/${moduleId}`);
  return response.data;
};

/** PUT /api/v1/modules/{moduleId} – cập nhật module */
export const updateModule = async (moduleId, moduleData) => {
  const response = await apiClient.put(`${base}/${moduleId}`, moduleData);
  return response.data;
};

/** DELETE /api/v1/modules/{moduleId} – xóa module */
export const deleteModule = async (moduleId) => {
  const response = await apiClient.delete(`${base}/${moduleId}`);
  return response.data;
};

/** POST /api/v1/modules – tạo module mới */
export const createModule = async (moduleData) => {
  const response = await apiClient.post(base, moduleData);
  return response.data;
};

/** GET /api/v1/modules/course/{courseId} – lấy danh sách module theo khóa học */
export const getModulesByCourse = async (courseId) => {
  const response = await apiClient.get(`${base}/course/${courseId}`);
  return response.data;
};
