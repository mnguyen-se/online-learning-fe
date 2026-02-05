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
