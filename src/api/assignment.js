import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const assignmentApi = {
  // 선생님용 API
  createAssignment(formData) {
    return axios.post(`${API_BASE_URL}/assignments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  updateAssignment(id, data, teacherId) {
    return axios.put(`${API_BASE_URL}/assignments/${id}`, data, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  publishAssignment(id, teacherId) {
    return axios.post(`${API_BASE_URL}/assignments/${id}/publish`, null, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  deleteAssignment(id, teacherId) {
    return axios.delete(`${API_BASE_URL}/assignments/${id}`, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  getTeacherAssignments(teacherId, params = {}) {
    return axios.get(`${API_BASE_URL}/assignments/teacher/${teacherId}`, {
      params
    })
  },

  // 학생용 API
  getStudentAssignments(studentId, classIds) {
    return axios.get(`${API_BASE_URL}/assignments/student/${studentId}`, {
      params: {
        classIds: classIds.join(',')
      }
    })
  },

  // 공통 API
  getAssignmentDetail(id) {
    return axios.get(`${API_BASE_URL}/assignments/${id}`)
  },

  getAssignmentFileDownloadUrl(assignmentId, fileId) {
    return axios.get(`${API_BASE_URL}/assignments/${assignmentId}/files/${fileId}/download`)
  }
}

export default assignmentApi