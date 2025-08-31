import api from '@/services/api.js'

const classApi = {
  getMyClass: () => api.get('/classes/myclass'),
  getExamSchedule: (classId) => api.get(`/classes/${classId}/exams`),
  getExam: (examId, classId) => api.get(`/classes/${classId}/exams/${examId}`),
  createOrGetAttempt: (examId, classId) => api.post(`/classes/attempt`, { examId, classId }),
  getLiveExam: (examId) => api.get(`/classes/exam/${examId}`),
  getStatsLines: (classId) => api.get(`/classes/statsline/${classId}`),
  getStatsDetail: (classId) => api.get(`/classes/statsdetail/${classId}`)
}

export default classApi
