import apiClient from '../config/axios';

export const getAssignmentsByCourse = async (courseId) => {
  const response = await apiClient.get(`/assignments/course/${courseId}`);
  return response.data;
};

export const createAssignment = async (courseId, payload) => {
  const response = await apiClient.post(`/assignments/courses/${courseId}/assignments`, payload);
  return response.data;
};

export const getAssignmentQuestions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/questions`);
  return response.data;
};

export const uploadAssignmentQuestions = async (assignmentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(
    `/assignments/${assignmentId}/questions/upload-excel`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/** GET /assignments/{assignmentId}/writing-submissions – Danh sách bài nộp writing (TEACHER/COURSE_MANAGER/ADMIN) */
export const getWritingSubmissions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/writing-submissions`);
  return response.data;
};
