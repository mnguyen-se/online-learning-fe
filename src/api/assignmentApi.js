import apiClient from '../config/axios';

export const getAssignmentsByCourse = async (courseId) => {
  const response = await apiClient.get(`/assignments/course/${courseId}`);
  return response.data;
};

export const getMyAssignments = async () => {
  const response = await apiClient.get('/assignments/my-assignments');
  return response.data;
};

export const createAssignment = async (payload) => {
  const response = await apiClient.post('/assignments/courses/assignments', payload);
  return response.data;
};

export const getAssignmentQuestions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/questions`);
  return response.data;
};

export const getWritingQuestions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/writing-questions`);
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

export const createWritingQuestion = async (assignmentId, payload) => {
  const response = await apiClient.post(`/assignments/${assignmentId}/writing-questions`, payload);
  return response.data;
};

export const submitQuizAssignment = async (assignmentId, payload) => {
  const response = await apiClient.post(`/assignments/${assignmentId}/submit-quiz`, payload);
  return response.data;
};

export const submitWritingAssignment = async (assignmentId, payload) => {
  const response = await apiClient.post(`/assignments/${assignmentId}/submit-writing`, payload);
  return response.data;
};

/** GET /assignments/{assignmentId}/writing-submissions – Danh sách bài nộp writing (TEACHER/COURSE_MANAGER/ADMIN) */
export const getWritingSubmissions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/writing-submissions`);
  return response.data;
};
