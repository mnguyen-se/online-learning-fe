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
  // Học sinh xem câu hỏi bài Writing trong assignment
  // Backend endpoint: GET /api/v1/assignments/{assignmentId}/writing-questions/student
  const response = await apiClient.get(
    `/assignments/${assignmentId}/writing-questions/student`,
  );
  return response.data;
};

export const uploadAssignmentQuestions = async (assignmentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Không set Content-Type - để axios/browser tự set multipart/form-data với boundary đúng
  const response = await apiClient.post(
    `/assignments/${assignmentId}/questions/upload-excel`,
    formData,
    {
      headers: {
        'Content-Type': false,
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

/** GET /assignments/quiz-submissions/{submissionId} – Giáo viên xem chi tiết quiz submission để chấm điểm (lấy đáp án học sinh) */
export const getQuizSubmission = async (submissionId) => {
  const response = await apiClient.get(`/assignments/quiz-submissions/${submissionId}`);
  return response.data;
};

/** GET /assignments/{assignmentId}/quiz-result – Xem kết quả quiz, lấy câu hỏi + đáp án đúng (TEACHER/Học sinh) */
export const getQuizResult = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/quiz-result`);
  return response.data;
};

/**
 * Trạng thái bài nộp Quiz của học sinh: not_submitted | pending | graded
 * Dựa trên API quiz-result:
 * - graded: đã có điểm
 * - pending: đã có bài nộp nhưng chưa có điểm / đang chờ giáo viên chấm
 * - not_submitted: chưa nộp bài
 */
export const getMyQuizStatus = async (assignmentId) => {
  try {
    const data = await getQuizResult(assignmentId);
    const raw = data?.data ?? data;
    const score = raw?.score;
    const hasSubmission =
      raw != null &&
      (raw.submittedAt != null ||
        raw.submitted_at != null ||
        raw.submissionId != null);
    if (score != null && Number(score) === Number(score)) {
      return { state: 'graded', data: raw };
    }
    if (hasSubmission) return { state: 'pending', data: raw };
    return { state: 'not_submitted', data: raw };
  } catch (err) {
    const status = err?.response?.status;
    const msg = (
      err?.response?.data?.message ??
      err?.response?.data?.error ??
      ''
    )
      .toString()
      .toLowerCase();
    const isPendingGrade =
      msg.includes('chưa được giáo viên chấm') ||
      msg.includes('chờ giáo viên chấm');
    if (isPendingGrade) return { state: 'pending' };
    if (status === 404 || status === 403) return { state: 'not_submitted' };
    throw err;
  }
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

/** GET /assignments/{assignmentId}/writing-result – Học sinh xem điểm và nhận xét bài Writing */
export const getWritingResult = async (assignmentId) => {
  const response = await apiClient.get(`/assignments/${assignmentId}/writing-result`);
  return response.data;
};

/**
 * Trạng thái bài nộp Writing của học sinh: not_submitted | pending | graded
 */
export const getMyWritingStatus = async (assignmentId) => {
  try {
    const data = await getWritingResult(assignmentId);
    const raw = data?.data ?? data;
    const score = raw?.score;
    const hasSubmission =
      raw != null &&
      (raw.submittedAt != null || raw.submitted_at != null || raw.submissionId != null);
    if (score != null && Number(score) === Number(score)) {
      return { state: 'graded', data: raw };
    }
    if (hasSubmission) return { state: 'pending', data: raw };
    return { state: 'not_submitted', data: raw };
  } catch (err) {
    const status = err?.response?.status;
    const msg = (err?.response?.data?.message ?? err?.response?.data?.error ?? '').toString().toLowerCase();
    const isPendingGrade =
      msg.includes('chưa được giáo viên chấm') || msg.includes('chờ giáo viên chấm');
    if (isPendingGrade) return { state: 'pending' };
    if (status === 404 || status === 403) return { state: 'not_submitted' };
    throw err;
  }
};
