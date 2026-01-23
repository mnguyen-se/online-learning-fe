import apiClient from '../config/axios';

// Lấy một module cụ thể theo moduleId
export const getModule = async (moduleId) => {
  const response = await apiClient.get(`/modules/${moduleId}`);
  return response.data;
};

// Cập nhật một module
export const updateModule = async (moduleId, moduleData) => {
  const response = await apiClient.put(`/modules/${moduleId}`, moduleData);
  return response.data;
};

// Xóa một module
export const deleteModule = async (moduleId) => {
  const response = await apiClient.delete(`/modules/${moduleId}`);
  return response.data;
};

// Tạo module mới
export const createModule = async (moduleData) => {
  const response = await apiClient.post('/modules', moduleData);
  return response.data;
};

// Lấy danh sách modules của một course
export const getModulesByCourse = async (courseId) => {
  const response = await apiClient.get(`/modules/course/${courseId}`);
  return response.data;
};
