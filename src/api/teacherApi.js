import apiClient from '../config/axios';

/**
 * API dành cho trang Giáo viên – khớp với OpenAPI backend.
 * Course: GET /api/v1/courses/my-courses
 * Assignment: GET course, POST grade
 * Feedback: GET /api/v1/feedbacks/my-feedbacks
 */

/** GET /courses/my-courses – Lấy danh sách khóa học của giáo viên đang đăng nhập */
export const getTeacherCourses = async () => {
  const response = await apiClient.get('/courses/my-courses');
  return response.data;
};

/**
 * Lấy bài nộp theo assignment.
 * OpenAPI chưa liệt kê endpoint này; nếu backend có GET submissions theo assignmentId thì dùng.
 * Ví dụ: GET /assignments/{assignmentId}/submissions
 */
export const getSubmissionsByAssignment = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
  return response.data;
};

/** POST /assignments/submissions/{submissionId}/grade – Chấm bài assignment */
export const gradeSubmission = async (submissionId, payload) => {
  const response = await apiClient.post(
    `/assignments/submissions/${submissionId}/grade`,
    payload
  );
  return response.data;
};

/** GET /feedbacks/my-feedbacks – Lấy danh sách feedback của teacher */
export const getMyFeedback = async (params = {}) => {
  const response = await apiClient.get('/feedbacks/my-feedbacks', { params });
  return response.data;
};
