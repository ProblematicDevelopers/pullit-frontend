import api from './api';

// examApi를 기존 api 인스턴스의 wrapper로 만들어서 호환성 유지
const examApi = {
  get: (url, config) => api.get(`/exams${url}`, config),
  post: (url, data, config) => api.post(`/exams${url}`, data, config),
  put: (url, data, config) => api.put(`/exams${url}`, data, config),
  delete: (url, config) => api.delete(`/exams${url}`, config),
  patch: (url, data, config) => api.patch(`/exams${url}`, data, config),
  
  // 시험지 개수 조회 API
  getExamCounts: (params) => api.get('/exams/count', { params })
}

export default examApi;
