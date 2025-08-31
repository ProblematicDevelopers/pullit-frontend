import api from './api';

/**
 * Exam API Service
 * 시험지 관련 API 호출 서비스
 * 기존 코드와의 호환성을 위해 api의 메서드를 직접 노출
 */
const examApi = {
  // 기존 코드 호환성을 위한 메서드
  get: (url, config) => api.get(`/exams${url}`, config),
  post: (url, data, config) => api.post(`/exams${url}`, data, config),
  put: (url, data, config) => api.put(`/exams${url}`, data, config),
  delete: (url, config) => api.delete(`/exams${url}`, config),
  patch: (url, data, config) => api.patch(`/exams${url}`, data, config),
  
  // 명시적 API 메서드들
  getExams: (params) => api.get('/exams', { params }),
  getExam: (examId) => api.get(`/exams/${examId}`),
  createExam: (data) => api.post('/exams', data),
  updateExam: (examId, data) => api.put(`/exams/${examId}`, data),
  deleteExam: (examId) => api.delete(`/exams/${examId}`),
  getExamCounts: (params) => api.get('/exams/count', { params }),
  searchExams: (params) => api.get('/exams/search', { params }),
  copyExam: (examId) => api.post(`/exams/${examId}/copy`),
  shareExam: (examId, shareData) => api.post(`/exams/${examId}/share`, shareData),
  getExamStats: (examId) => api.get(`/exams/${examId}/stats`),
  getStudentResults: (examId) => api.get(`/exams/${examId}/results`),
  downloadExamPDF: (examId) => api.get(`/exams/${examId}/download/pdf`, { responseType: 'blob' }),
  downloadAnswerSheet: (examId) => api.get(`/exams/${examId}/download/answer`, { responseType: 'blob' }),
  
  // 시험지의 문항 목록 가져오기
  getExamItems: (examId) => api.get(`/exams/${examId}/items`)
}

export default examApi;
