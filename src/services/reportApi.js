import api from './api.js'

// 리포트 관련 API
const reportApi = {
  // areaCode 조건 기반 exam_attempt 리스트 조회
  getAttemptList: (areaCode) => api.get(`/report/attempt/${areaCode}`),
  getAttemptIdBasic: (attemptId) => api.get(`/report/attempt/${attemptId}/basic`),
  // 문제 HTML 데이터 조회
  getQuestionHtml: (questionId) => api.get(`/report/questions/${questionId}`),
}

export default reportApi
