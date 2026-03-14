import apiClient from '../config/axios';

export const getMyCourses = async () => {
  const response = await apiClient.get('/enrollments/my-courses');
  return response.data;
};

export const getEnrolledStudentsByCourse = async (courseId) => {
  const response = await apiClient.get(`/enrollments/courses/${courseId}/students`);
  return response.data;
};

export const assignEnrollment = async (payload) => {
  const response = await apiClient.post('/enrollments', payload);
  return response.data;
};

/** Hủy gán học viên khỏi khóa học (chỉ ADMIN, COURSE_MANAGER) */
export const unenrollStudent = async (courseId, username) => {
  const response = await apiClient.delete(`/enrollments/courses/${courseId}/students/${encodeURIComponent(username)}`);
  return response.data;
};

/** Lấy danh sách khóa học mà học viên đã ghi danh (theo username) */
export const getEnrolledCoursesByUsername = async (username) => {
  const response = await apiClient.get(`/enrollments/students/${encodeURIComponent(username)}/courses`);
  return response.data;
};