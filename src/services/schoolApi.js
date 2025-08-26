import api from './api'

export const schoolApi = {
  /**
   * 학교 검색
   * @param {string} keyword 검색 키워드
   * @returns {Promise} 검색 결과
   */
  searchSchools(keyword) {
    // 한글 키워드를 URL 인코딩
    const encodedKeyword = encodeURIComponent(keyword)
    return api.get(`/schools/search?keyword=${encodedKeyword}`)
  },

  /**
   * 전체 학교 조회 (테스트용)
   * @returns {Promise} 전체 학교 목록
   */
  getAllSchools() {
    return api.get('/schools')
  }
}
