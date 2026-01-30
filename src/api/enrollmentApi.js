import apiClient from '../config/axios';

export const getMyCourses = async () => {
  const response = await apiClient.get('/enrollments/my-courses');
  return response.data;
};