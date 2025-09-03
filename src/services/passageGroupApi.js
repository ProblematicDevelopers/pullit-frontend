import api from './api.js'

/**
 * Passage Group API Service
 * 지문 그룹 관련 API 호출 서비스
 */
const passageGroupApi = {
  /**
   * 특정 과목의 지문 그룹 목록 조회
   * @param {number} subjectId - 과목 ID
   * @returns {Promise<Object>} 지문 그룹 목록
   */
  getPassageGroups: async (subjectId) => {
    try {
      console.log('📤 [passageGroupApi] getPassageGroups 호출:', { subjectId })

      const response = await api.get(`/process-items/passage-groups/subject/${subjectId}`)

      console.log('✅ [passageGroupApi] getPassageGroups 성공:', response.data)
      return {
        success: true,
        data: response.data.data || response.data || []
      }
    } catch (error) {
      console.error('❌ [passageGroupApi] getPassageGroups 실패:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '지문 그룹 목록 조회 실패',
        data: []
      }
    }
  },

  /**
   * 독립 문항 목록 조회 (지문 그룹에 속하지 않은 문항들)
   * @param {number} subjectId - 과목 ID
   * @returns {Promise<Object>} 독립 문항 목록
   */
  getIndependentItems: async (subjectId) => {
    try {
      console.log('📤 [passageGroupApi] getIndependentItems 호출:', { subjectId })

      const response = await api.get(`/process-items/passage-groups/subject/${subjectId}/independent`)

      console.log('✅ [passageGroupApi] getIndependentItems 성공:', response.data)
      return {
        success: true,
        data: response.data.data || response.data || []
      }
    } catch (error) {
      console.error('❌ [passageGroupApi] getIndependentItems 실패:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '독립 문항 목록 조회 실패',
        data: []
      }
    }
  },

  /**
   * 새로운 지문 그룹 생성
   * @param {Object} requestData - 지문 그룹 생성 요청 데이터
   * @param {number} requestData.subjectId - 과목 ID
   * @param {Array<number>} requestData.itemIds - 포함할 문항 ID 목록
   * @param {string} requestData.passageContent - 지문 내용 (선택사항)
   * @param {string} requestData.passageHtml - 지문 HTML (선택사항)
   * @returns {Promise<Object>} 생성된 지문 그룹 ID
   */
  createPassageGroup: async (requestData) => {
    try {
      console.log('📤 [passageGroupApi] createPassageGroup 호출:', requestData)

      const response = await api.post('/process-items/passage-groups', requestData)

      console.log('✅ [passageGroupApi] createPassageGroup 성공:', response.data)
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || '지문 그룹이 성공적으로 생성되었습니다.'
      }
    } catch (error) {
      console.error('❌ [passageGroupApi] createPassageGroup 실패:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '지문 그룹 생성 실패'
      }
    }
  },

  /**
   * 기존 지문 그룹에 문항 추가
   * @param {number} passageId - 지문 그룹 ID
   * @param {Array<number>} itemIds - 추가할 문항 ID 목록
   * @returns {Promise<Object>} 추가 결과
   */
  addItemsToPassage: async (passageId, itemIds) => {
    try {
      console.log('📤 [passageGroupApi] addItemsToPassage 호출:', { passageId, itemIds })

      const response = await api.post(`/process-items/passage-groups/${passageId}/items`, itemIds)

      console.log('✅ [passageGroupApi] addItemsToPassage 성공:', response.data)
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || '문항이 성공적으로 추가되었습니다.'
      }
    } catch (error) {
      console.error('❌ [passageGroupApi] addItemsToPassage 실패:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '문항 추가 실패'
      }
    }
  },

  /**
   * 지문 그룹에서 문항 제거
   * @param {number} passageId - 지문 그룹 ID
   * @param {Array<number>} itemIds - 제거할 문항 ID 목록
   * @returns {Promise<Object>} 제거 결과
   */
  removeItemsFromPassage: async (passageId, itemIds) => {
    try {
      console.log('📤 [passageGroupApi] removeItemsFromPassage 호출:', { passageId, itemIds })

      const response = await api.delete(`/process-items/passage-groups/${passageId}/items`, {
        data: itemIds
      })

      console.log('✅ [passageGroupApi] removeItemsFromPassage 성공:', response.data)
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || '문항이 성공적으로 제거되었습니다.'
      }
    } catch (error) {
      console.error('❌ [passageGroupApi] removeItemsFromPassage 실패:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '문항 제거 실패'
      }
    }
  },

  /**
   * 지문 그룹 상세 정보 조회
   * @param {number} passageId - 지문 그룹 ID
   * @returns {Promise<Object>} 지문 그룹 상세 정보
   */
  getPassageGroupDetail: async (passageId) => {
    try {
      console.log('📤 [passageGroupApi] getPassageGroupDetail 호출:', { passageId })

      const response = await api.get(`/process-items/passage-groups/${passageId}`)

      console.log('✅ [passageGroupApi] getPassageGroupDetail 성공:', response.data)
      return {
        success: true,
        data: response.data.data || response.data
      }
    } catch (error) {
      console.error('❌ [passageGroupApi] getPassageGroupDetail 실패:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '지문 그룹 상세 정보 조회 실패'
      }
    }
  },

  /**
   * 지문 그룹 삭제
   * @param {number} passageId - 지문 그룹 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  deletePassageGroup: async (passageId) => {
    try {
      console.log('📤 [passageGroupApi] deletePassageGroup 호출:', { passageId })

      const response = await api.delete(`/process-items/passage-groups/${passageId}`)

      console.log('✅ [passageGroupApi] deletePassageGroup 성공:', response.data)
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || '지문 그룹이 성공적으로 삭제되었습니다.'
      }
    } catch (error) {
      console.error('❌ [passageGroupApi] deletePassageGroup 실패:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '지문 그룹 삭제 실패'
      }
    }
  }
}

export default passageGroupApi
