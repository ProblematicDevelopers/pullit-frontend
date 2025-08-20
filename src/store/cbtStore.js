import api from '@/services/api.js'

// CBT 관련 API 함수들
export const cbtAPI = {
  // CBT 생성
  createCBT: (data) => {
    return api.post('/cbt/create', data)
  },

  // CBT 목록 조회
  getCBTList: () => {
    return api.get('/cbt/list')
  },

  // CBT 상세 조회
  getCbtExam: (cbtId) => {
    return api.get(`/cbt/exam/${cbtId}`)
  },

  // Attempt 생성 또는 기존 Attempt 확인
  createOrGetAttempt: (examId) => {
    return api.post('/cbt/attempt', { examId })
  },

  // Attempt 답안 조회
  getAttemptAnswers: (attemptId) => {
    return api.get(`/cbt/attempt/${attemptId}/answers`)
  },

  // 답안 저장
  saveAnswer: (attemptId, questionNumber, selectedAnswer) => {
    return api.post(`/cbt/attempt/${attemptId}/answer`, {
      questionNumber,
      selectedAnswer,
    })
  },

  // 시험 제출
  submitExam: (attemptId) => {
    return api.post(`/cbt/attempt/${attemptId}/submit`)
  },

  // 시험 결과 조회
  getExamResult: (attemptId) => {
    return api.get(`/cbt/attempt/${attemptId}/result`)
  },

  // Redis 데이터 조회
  getRedisData: (attemptId) => {
    return api.get(`/cbt/redis/${attemptId}`)
  },

  // Redis 데이터 업데이트
  updateRedisData: (attemptId, data) => {
    return api.post(`/cbt/redis/${attemptId}`, data)
  },

  // Redis 데이터를 DB로 마이그레이션
  migrateRedisToDatabase: (attemptId, data) => {
    return api.post(`/cbt/attempt/${attemptId}/migrate`, data)
  },
}
