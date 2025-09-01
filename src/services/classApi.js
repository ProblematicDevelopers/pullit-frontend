import api from '@/services/api.js'

const classApi = {
  getMyClass: () => api.get('/classes/myclass'),
  getStudentClass: () => api.get('/classes/myclass'), // 학생의 반 정보 조회 (getMyClass와 동일)
  getExamSchedule: (classId) => api.get(`/classes/${classId}/exams`),
  getExam: (examId, classId) => api.get(`/classes/${classId}/exams/${examId}`),
  createOrGetAttempt: (examId, classId) => api.post(`/classes/attempt`, { examId, classId }),
  getLiveExam: (examId) => api.get(`/classes/exam/${examId}`),
  getStatsLines: (classId) => api.get(`/classes/statsline/${classId}`),
  getStatsDetail: (classId) => api.get(`/classes/statsdetail/${classId}`),

  // 내 학급 목록 조회 (선생님용)
  getMyClasses: () => api.get('/classes/my-classes')
}

export default classApi
