import apiClient from '../config/axios';

/** GET /assignments/get/{assignmentId} – lấy thông tin assignment và thang điểm */
export const getAssignmentById = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/get/${assignmentId}`);
  return response.data;
};

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

/** GET /assignments/{assignmentId}/quiz-submissions – Danh sách bài nộp quiz (TEACHER/COURSE_MANAGER/ADMIN) */
export const getQuizSubmissions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/quiz-submissions`);
  return response.data;
};

/** GET /assignments/quiz-submissions/{submissionId} – Chi tiết bài nộp quiz (TEACHER chấm điểm) */
export const getQuizSubmission = async (submissionId) => {
  const response = await apiClient.get(`/assignments/quiz-submissions/${submissionId}`);
  return response.data;
};

/** POST /assignments/quiz-submissions/{submissionId}/grade – Chấm điểm quiz (TEACHER) */
export const gradeQuizSubmission = async (submissionId, payload) => {
  const response = await apiClient.post(`/assignments/quiz-submissions/${submissionId}/grade`, payload);
  return response.data;
};

/** GET /assignments/{assignmentId}/writing-submissions – Danh sách bài nộp writing (TEACHER/COURSE_MANAGER/ADMIN) */
export const getWritingSubmissions = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/writing-submissions`);
  return response.data;
};

/** GET /assignments/writing-submissions/{submissionId} – Chi tiết bài nộp writing (TEACHER chấm điểm) */
export const getWritingSubmission = async (submissionId) => {
  const response = await apiClient.get(`/assignments/writing-submissions/${submissionId}`);
  return response.data;
};

/** POST /assignments/writing-submissions/{submissionId}/grade – Chấm điểm writing (TEACHER) */
export const gradeWritingSubmission = async (submissionId, payload) => {
  const response = await apiClient.post(`/assignments/writing-submissions/${submissionId}/grade`, payload);
  return response.data;
};
