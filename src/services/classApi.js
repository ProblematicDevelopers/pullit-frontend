import api from '@/services/api.js'

const classApi = {
  getMyClass: () => api.get('/classes/myclass'),
}

export default classApi
