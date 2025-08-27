import api from '@/services/api.js'

const classApi = {
  getMyClass: () => api.get('/classes/myclass'),
  getExamSchedule: (classId) => api.get(`/classes/${classId}/exams`),
  getExam: (examId, classId) => api.get(`/classes/${classId}/exams/${examId}`),
  getStatsLines: (classId) => api.get(`/classes/statsline/${classId}`),
  getStatsDetail: (classId) => api.get(`/classes/statsdetail/${classId}`)
}

export default classApi
