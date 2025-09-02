import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const submissionApi = {
  // 학생용 API
  submitAssignment(formData) {
    return axios.post(`${API_BASE_URL}/submissions/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  getStudentSubmission(assignmentId, studentId) {
    return axios.get(`${API_BASE_URL}/submissions/assignment/${assignmentId}/student/${studentId}`)
  },

  // 선생님용 API
  getAssignmentSubmissions(assignmentId, teacherId, params = {}) {
    return axios.get(`${API_BASE_URL}/submissions/assignment/${assignmentId}`, {
      headers: {
        'X-Teacher-Id': teacherId
      },
      params
    })
  },

  getSubmissionStats(assignmentId, teacherId) {
    return axios.get(`${API_BASE_URL}/submissions/assignment/${assignmentId}/stats`, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  gradeSubmission(submissionId, data, teacherId) {
    return axios.put(`${API_BASE_URL}/submissions/${submissionId}/grade`, data, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  getNotSubmittedStudents(assignmentId, teacherId) {
    return axios.get(`${API_BASE_URL}/submissions/assignment/${assignmentId}/not-submitted`, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  getPendingGradingSubmissions(teacherId) {
    return axios.get(`${API_BASE_URL}/submissions/teacher/${teacherId}/pending`)
  },

  // 공통 API
  getSubmissionFileDownloadUrl(submissionId, fileId, userId) {
    return axios.get(`${API_BASE_URL}/submissions/${submissionId}/files/${fileId}/download`, {
      headers: {
        'X-User-Id': userId
      }
    })
  }
}

export default submissionApi