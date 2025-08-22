import api from './api.js'

// 리포트 관련 API
const reportApi = {
  // areaCode 조건 기반 exam_attempt 리스트 조회
  getAttemptList: (areaCode) => api.get(`/report/attempt/${areaCode}`),
  getAttemptIdBasic: (attemptId) => api.get(`/report/attempt/${attemptId}/basic`),
  // 문제 HTML 데이터 조회
  getQuestionHtml: (questionId) => api.get(`/report/questions/${questionId}`),
  // 상세 정오표 조회
  getDetailErrata: (examId) => api.get(`/report/detailerrata/${examId}`),
  // 난이도별 통계 조회
  getDetailDifficulty: (examId) => api.get(`/report/detaildifficulty/${examId}`),
  // 평가영역별 통계 조회
  getDetailEvaluation: (examId) => api.get(`/report/detailevaluation/${examId}`)
}

export default reportApi
