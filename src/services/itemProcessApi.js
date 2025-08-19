import api from './api.js'

/**
 * Item Processing(문제가공/등록) 관련 API 함수들
 */
export const itemProcessingAPI = {
  // 교과서 목록 조회
  getTextbooks: () => {
    return api.get('/file-history/textbook')
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
  }
}
