import apiClient from '../config/axios';

export const getCourses = async () => {
  const response = await apiClient.get('/courses');
  return response.data;
};

export const getActiveCourses = async () => {
  const response = await apiClient.get('/courses/active');
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await apiClient.post('/courses', courseData);
  return response.data;
};

export const updateCourse = async (courseId, courseData) => {
  const response = await apiClient.put(`/courses/${courseId}`, courseData);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await apiClient.post(`/courses/delete/${courseId}`);
  return response.data;
};
