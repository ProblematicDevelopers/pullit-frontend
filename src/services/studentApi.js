import api from './api.js'

// 학생 정보 조회 (userId로 학생 기본 정보)
const studentApi = {
  getByUserId: (userId) => api.get(`/students/${userId}`),
}

export default studentApi
