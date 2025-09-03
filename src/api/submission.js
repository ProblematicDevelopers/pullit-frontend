import api from '@/services/api.js'

const submissionApi = {
  // 학생용 API
  submitAssignment(formData) {
    return api.post(`/submissions/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  getStudentSubmission(assignmentId, studentId) {
    return api.get(`/submissions/assignment/${assignmentId}/student/${studentId}`)
  },

  // 선생님용 API
  getAssignmentSubmissions(assignmentId, teacherId, params = {}) {
    return api.get(`/submissions/assignment/${assignmentId}`, {
      headers: {
        'X-Teacher-Id': teacherId
      },
      params
    })
  },

  getSubmissionStats(assignmentId, teacherId) {
    return api.get(`/submissions/assignment/${assignmentId}/stats`, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  gradeSubmission(submissionId, data, teacherId) {
    return api.put(`/submissions/${submissionId}/grade`, data, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  getNotSubmittedStudents(assignmentId, teacherId) {
    return api.get(`/submissions/assignment/${assignmentId}/not-submitted`, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  getPendingGradingSubmissions(teacherId) {
    return api.get(`/submissions/teacher/${teacherId}/pending`)
  },

  // 공통 API
  getSubmissionFileDownloadUrl(submissionId, fileId, userId) {
    return api.get(`/submissions/${submissionId}/files/${fileId}/download`, {
      headers: {
        'X-User-Id': userId
      }
    })
  }
}

export default submissionApi
