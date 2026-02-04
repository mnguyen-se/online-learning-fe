import apiClient from '../config/axios';

export const getMyCourses = async () => {
  const response = await apiClient.get('/enrollments/my-courses');
  return response.data;
};

export const getEnrolledStudentsByCourse = async (courseId) => {
  const response = await apiClient.get(`/enrollments/courses/${courseId}/students`);
  return response.data;
};