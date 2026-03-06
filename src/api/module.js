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

/** GET /api/v1/modules/course/{courseId} – lấy danh sách module theo khóa học.
 *  Nếu backend trả 404 (course chưa có module) thì coi là danh sách rỗng, không ném lỗi. */
export const getModulesByCourse = async (courseId) => {
  try {
    const response = await apiClient.get(`${base}/course/${courseId}`);
    return response.data;
  } catch (err) {
    const status = err?.response?.status;
    const detail = (err?.response?.data?.message || err?.response?.data?.chiTiet || '').toLowerCase();
    const isNoModules = status === 404 || detail.includes('không có module') || detail.includes('no module');
    if (isNoModules) {
      return [];
    }
    throw err;
  }
};

/** Lấy danh sách module public của khóa học (filter từ getModulesByCourse). */
export const getPublicModulesByCourse = async (courseId) => {
  const list = await getModulesByCourse(courseId);
  const arr = Array.isArray(list) ? list : [];
  return arr.filter((m) => m?.public === true || m?.isPublic === true);
};
