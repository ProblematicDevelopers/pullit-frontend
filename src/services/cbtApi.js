import api from '@/services/api.js'

const cbtApi = {
  // 기존 CBT 생성 (랜덤 문제 선택)
  createCbt: (data) => api.post('/cbt/create', data),
  
  // UserExam에서 CBT/과제 생성
  createFromUserExam: (data) => api.post('/cbt/create-from-exam', data),
  
  // CBT 시험 정보 조회
  getCbtExam: (examId) => api.get(`/cbt/exam/${examId}`),
  
  // CBT 시도 생성 또는 조회
  createOrGetAttempt: (data) => api.post('/cbt/attempt', data),
  
  // CBT 시도 답안 조회
  getAttemptAnswers: (attemptId) => api.get(`/cbt/attempt/${attemptId}/answers`),
  
  // Redis 데이터 업데이트
  updateRedisData: (attemptId, data) => api.post(`/cbt/redis/${attemptId}`, data),
  
  // Redis 데이터 조회
  getRedisData: (attemptId) => api.get(`/cbt/redis/${attemptId}`),
  
  // Redis 데이터를 DB로 마이그레이션
  migrateRedisToDb: (attemptId, data) => api.post(`/cbt/redis/${attemptId}/migrate`, data),
  
  // CBT 시험 시작 (알림 발송)
  startExam: (examId, classId) => api.post(`/cbt/lifecycle/start/${examId}?classId=${classId}`),
  
  // CBT 시험 종료 (알림 발송)
  endExam: (examId, classId) => api.post(`/cbt/lifecycle/end/${examId}?classId=${classId}`)
}

export default cbtApi