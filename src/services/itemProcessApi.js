import api from './api.js'

/**
 * Item Processing(문제가공/등록) 관련 API 함수들
 */
export const itemProcessingAPI = {
  // 교과서 목록 조회
  getTextbooks: () => {
    return api.get('/subject')
  },

  // 과목별 교과서 필터링
  getFilteredSubjects: (gradeCode, areaCode) => {
    return api.get('/subject/filter', {
      params: { gradeCode, areaCode }
    })
  },

  // 과목 및 교과서 정보 조회
  getSubjects: (options = {}) => {
    const params = {}

    if (options.includeTextbooks !== undefined) {
      params.includeTextbooks = options.includeTextbooks
    }

    if (options.grades && options.grades.length > 0) {
      params.grades = options.grades.join(',')
    }

    return api.get('/subject', { params })
  },

  // 편집된 PDF 업로드 및 정보 저장 (통합 API)
  uploadProcessedPdf: (file, fileName, category, entityType, entityId, description) => {
    const formData = new FormData()

    // 파일은 @RequestParam("file")과 이름 일치
    formData.append('file', file, fileName)

    // FileUploadRequest 객체의 실제 필드명과 일치해야 함
    formData.append('category', category)
    formData.append('entityType', entityType)
    formData.append('entityId', entityId)
    formData.append('description', description)

    return api.post('/files/upload', formData)
  }
}
