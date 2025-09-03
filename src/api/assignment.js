import api from '@/services/api.js'

const assignmentApi = {
  // 선생님용 API
  createAssignment(formData) {
    return api.post(`/assignments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  updateAssignment(id, data, teacherId) {
    return api.put(`/assignments/${id}`, data, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  publishAssignment(id, teacherId) {
    return api.post(`/assignments/${id}/publish`, null, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  deleteAssignment(id, teacherId) {
    return api.delete(`/assignments/${id}`, {
      headers: {
        'X-Teacher-Id': teacherId
      }
    })
  },

  getTeacherAssignments(teacherId, params = {}) {
    return api.get(`/assignments/teacher/${teacherId}`, {
      params
    })
  },

  // 학생용 API
  getStudentAssignments(studentId, classIds) {
    return api.get(`/assignments/student/${studentId}`, {
      params: {
        classIds: classIds.join(',')
      }
    })
  },

  // 공통 API
  getAssignmentDetail(id) {
    return api.get(`/assignments/${id}`)
  },

  getAssignmentFileDownloadUrl(assignmentId, fileId) {
    return api.get(`/assignments/${assignmentId}/files/${fileId}/download`)
  }
}

export default assignmentApi
