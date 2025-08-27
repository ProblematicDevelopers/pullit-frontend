import api from './api.js'

/**
 * Item API Service for Wizard Step2 functionality
 * Handles all item-related operations including search, details, and recommendations
 */
class ItemApiService {
  /**
   * Search items with filters
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.keyword - Search keyword
   * @param {Array<string>} searchParams.subjects - Selected subjects
   * @param {Array<string>} searchParams.grades - Selected grades
   * @param {Array<string>} searchParams.difficulties - Selected difficulty levels
   * @param {Array<string>} searchParams.categories - Selected categories
   * @param {number} searchParams.page - Page number (0-based)
   * @param {number} searchParams.size - Page size
   * @param {string} searchParams.sortBy - Sort field (createdAt, difficulty, etc.)
   * @param {string} searchParams.sortDirection - Sort direction (asc, desc)
   * @returns {Promise<Object>} Search results with pagination info
   */
  async searchItems(searchParams) {
    try {
      console.log('searchItems 원본 파라미터:', searchParams)
      
      // 백엔드 ItemSearchRequest에 맞게 매핑
      const requestData = {
        subjectId: searchParams.textbook ? parseInt(searchParams.textbook) : null,
        largeChapterIds: [],
        mediumChapterIds: searchParams.chapters ? searchParams.chapters.map(id => parseInt(id)) : [],
        smallChapterIds: [],
        topicChapterIds: [],
        questionFormCode: searchParams.categories ? searchParams.categories.map(c => {
          // 문제 유형 코드를 Long으로 변환 (백엔드에서 Long 타입 기대)
          // 일단 빈 배열로 처리
          return []
        }).flat() : [],
        difficultyCode: searchParams.difficulties ? searchParams.difficulties.map(d => parseInt(d)) : [],
        keyword: searchParams.keyword || '',
        page: searchParams.page || 0,
        size: searchParams.size || 20,
        sortBy: searchParams.sortBy || 'itemId',
        sortOrder: searchParams.sortDirection === 'desc' ? 'DESC' : 'ASC',
        hasImage: null,
        hasHtml: null,
        passageId: null
      }
      
      console.log('searchItems 변환된 요청:', requestData)

      const response = await api.post('/items/search', requestData)

      if (response.data.success) {
        // Spring Page 객체 구조에 맞게 처리
        const pageData = response.data.data
        return {
          success: true,
          data: pageData.content || [],
          totalElements: pageData.totalElements || 0,
          totalPages: pageData.totalPages || 0,
          currentPage: pageData.number || 0,
          size: pageData.size || 20
        }
      }

      throw new Error(response.data.message || 'Search failed')
    } catch (error) {
      console.error('Item search error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Search request failed',
        data: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        size: 20
      }
    }
  }

  /**
   * Get detailed information for a specific item
   * @param {string|number} itemId - Item ID
   * @returns {Promise<Object>} Item details
   */
  async getItemDetail(itemId) {
    try {
      if (!itemId) {
        throw new Error('Item ID is required')
      }

      const response = await api.get(`/items/${itemId}`)

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }

      throw new Error(response.data.message || 'Failed to fetch item details')
    } catch (error) {
      console.error('Get item detail error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load item details',
        data: null
      }
    }
  }

  /**
   * Get item counts by subject IDs
   * @param {Array<number>} subjectIds - List of subject IDs
   * @returns {Promise<Object>} Item counts mapped by subject ID
   */
  async getItemCountsBySubjects(subjectIds) {
    try {
      const response = await api.post('/items/count/subjects', subjectIds)

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }

      throw new Error(response.data.message || 'Failed to fetch subject item counts')
    } catch (error) {
      console.error('Get subject item counts error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load subject item counts',
        data: {}
      }
    }
  }

  /**
   * Get item counts by chapters
   * @param {number} subjectId - Subject ID
   * @param {Array<number>} chapterIds - List of chapter IDs
   * @returns {Promise<Object>} Item counts mapped by chapter ID
   */
  async getItemCountsByChapters(subjectId, chapterIds) {
    try {
      const response = await api.get('/items/count/chapters', {
        params: {
          subjectId,
          chapterIds: chapterIds
        },
        paramsSerializer: {
          indexes: null // 배열 파라미터를 chapterIds=1&chapterIds=2 형식으로 직렬화
        }
      })

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }

      throw new Error(response.data.message || 'Failed to fetch chapter item counts')
    } catch (error) {
      console.error('Get chapter item counts error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load chapter item counts',
        data: {}
      }
    }
  }

  /**
   * Get chapter counts for items based on filters
   * @param {Object} filters - Filter parameters
   * @param {Array<string>} filters.subjects - Selected subjects
   * @param {Array<string>} filters.grades - Selected grades
   * @param {Array<string>} filters.categories - Selected categories
   * @returns {Promise<Object>} Chapter counts by subject/grade
   */
  async getChapterCounts(filters = {}) {
    try {
      const params = {
        subjects: filters.subjects?.join(',') || '',
        grades: filters.grades?.join(',') || '',
        categories: filters.categories?.join(',') || ''
      }

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key]) {
          delete params[key]
        }
      })

      const response = await api.get('/items/count/chapters', { params })

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }

      throw new Error(response.data.message || 'Failed to fetch chapter counts')
    } catch (error) {
      console.error('Get chapter counts error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load chapter counts',
        data: {}
      }
    }
  }

  /**
   * Get similar items using Elasticsearch
   * @param {Object} similarityParams - Similarity search parameters
   * @param {string} similarityParams.itemId - Base item ID for similarity
   * @param {string} similarityParams.content - Content for text similarity
   * @param {Array<string>} similarityParams.subjects - Subject constraints
   * @param {Array<string>} similarityParams.grades - Grade constraints
   * @param {number} similarityParams.limit - Maximum number of results
   * @param {number} similarityParams.minScore - Minimum similarity score threshold
   * @returns {Promise<Object>} Similar items with similarity scores
   */
  async getSimilarItems(similarityParams) {
    try {
      const requestData = {
        topicChapterId: similarityParams.topicChapterId || 0,
        difficultyCode: similarityParams.difficultyCode || 2,
        excludeItemIds: similarityParams.excludeItemIds || [],
        size: similarityParams.size || 20
      }

      // Elasticsearch endpoint 호출
      const esResponse = await api.post('/items/similar', requestData)

      if (esResponse.data.success) {
        return {
          success: true,
          data: esResponse.data.data,
          totalHits: esResponse.data.totalHits || 0
        }
      }

      throw new Error(esResponse.data.message || 'Failed to fetch similar items')
    } catch (error) {
      console.error('Get similar items error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load similar items',
        data: [],
        totalHits: 0
      }
    }
  }

  /**
   * Get available subjects and textbooks
   * @param {Object} options - Request options
   * @param {boolean} options.includeTextbooks - Include textbook information
   * @param {Array<string>} options.grades - Filter by specific grades
   * @param {string} options.gradeCode - Filter by specific grade code
   * @param {string} options.areaCode - Filter by specific area code
   * @returns {Promise<Object>} Subjects and textbooks data
   */
  async getSubjects(options = {}) {
    try {
      console.log('getSubjects 호출 - options:', options)

      // gradeCode와 areaCode가 있으면 filter 엔드포인트 사용
      if (options.gradeCode && options.areaCode) {
        const params = {
          gradeCode: options.gradeCode,
          areaCode: options.areaCode
        }

        console.log('필터링된 교과서 요청 - params:', params)
        const response = await api.get('/subject/filter', { params })
        console.log('필터링된 교과서 응답:', response.data)

        if (response.data.success) {
          return {
            success: true,
            data: response.data.data
          }
        }

        throw new Error(response.data.message || 'Failed to fetch filtered subjects')
      }

      // 기존 로직 (전체 조회)
      console.warn('gradeCode 또는 areaCode가 없어서 전체 교과서를 조회합니다!')
      const params = {}

      if (options.includeTextbooks !== undefined) {
        params.includeTextbooks = options.includeTextbooks
      }

      if (options.grades && options.grades.length > 0) {
        params.grades = options.grades.join(',')
      }

      console.log('전체 교과서 요청 - params:', params)
      const response = await api.get('/subject', { params })
      console.log('전체 교과서 응답 개수:', response.data?.data?.length || 0)

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }

      throw new Error(response.data.message || 'Failed to fetch subjects')
    } catch (error) {
      console.error('Get subjects error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load subjects',
        data: []
      }
    }
  }

  /**
   * Get textbook information for specific subjects
   * @param {Array<string>} subjects - Subject codes
   * @param {Array<string>} grades - Grade levels (optional)
   * @returns {Promise<Object>} Textbook data organized by subject
   */
  async getTextbooks(subjects, grades = []) {
    try {
      const params = {
        includeTextbooks: true
      }

      if (subjects && subjects.length > 0) {
        params.subjects = subjects.join(',')
      }

      if (grades && grades.length > 0) {
        params.grades = grades.join(',')
      }

      const response = await api.get('/subject', { params })

      if (response.data.success) {
        // Filter to return only textbook information
        const textbooks = response.data.data.reduce((acc, subject) => {
          if (subject.textbooks && subject.textbooks.length > 0) {
            acc[subject.code] = subject.textbooks
          }
          return acc
        }, {})

        return {
          success: true,
          data: textbooks
        }
      }

      throw new Error(response.data.message || 'Failed to fetch textbooks')
    } catch (error) {
      console.error('Get textbooks error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load textbooks',
        data: {}
      }
    }
  }

  /**
   * Get item statistics for dashboard or analytics
   * @param {Object} filters - Filter parameters
   * @param {string} filters.dateRange - Date range (week, month, year)
   * @param {Array<string>} filters.subjects - Subject filters
   * @returns {Promise<Object>} Item statistics
   */
  async getItemStats(filters = {}) {
    try {
      const params = {}

      if (filters.dateRange) {
        params.dateRange = filters.dateRange
      }

      if (filters.subjects && filters.subjects.length > 0) {
        params.subjects = filters.subjects.join(',')
      }

      const response = await api.get('/items/stats', { params })

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }

      throw new Error(response.data.message || 'Failed to fetch item statistics')
    } catch (error) {
      console.error('Get item stats error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to load item statistics',
        data: {}
      }
    }
  }

  /**
   * Bulk operations for multiple items
   * @param {string} operation - Operation type ('delete', 'update', 'export')
   * @param {Array<string|number>} itemIds - Array of item IDs
   * @param {Object} operationData - Additional data for the operation
   * @returns {Promise<Object>} Operation results
   */
  async bulkItemOperation(operation, itemIds, operationData = {}) {
    try {
      if (!operation || !itemIds || itemIds.length === 0) {
        throw new Error('Operation and item IDs are required')
      }

      const requestData = {
        operation,
        itemIds,
        ...operationData
      }

      const response = await api.post('/items/bulk', requestData)

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          processedCount: response.data.processedCount || itemIds.length,
          failedCount: response.data.failedCount || 0,
          errors: response.data.errors || []
        }
      }

      throw new Error(response.data.message || 'Bulk operation failed')
    } catch (error) {
      console.error('Bulk item operation error:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Bulk operation failed',
        data: null,
        processedCount: 0,
        failedCount: itemIds.length,
        errors: [error.message]
      }
    }
  }

  /**
   * Smart Random Selection API - 난이도 비율에 따른 지능형 문항 선택
   * @param {Object} searchParams - 검색 파라미터
   * @param {number} searchParams.subjectId - 교과서 ID (필수)
   * @param {Array<number>} searchParams.chapters - 챕터 ID 배열 (필수)
   * @param {number} searchParams.itemCount - 생성할 문항 수 (1-100)
   * @param {string} searchParams.difficulty - 난이도 (easy, normal, hard, mixed)
   * @param {Array<number>} searchParams.questionTypes - 문제 유형 ID 배열
   * @param {boolean} searchParams.includePassage - 지문 포함 여부 (기본값: true)
   * @param {boolean} searchParams.avoidDuplicate - 중복 제외 여부 (기본값: true)
   * @param {boolean} searchParams.prioritizeLatest - 최신 문항 우선 여부 (기본값: false)
   * @returns {Promise<Object>} 스마트 선택 결과
   */
  async smartRandomSelection(searchParams) {
    try {
      console.log('=== Smart Random Selection API 호출 시작 ===')
      console.log('입력 파라미터:', searchParams)

      // 필수 파라미터 검증
      if (!searchParams.subjectId) {
        throw new Error('교과서 ID(subjectId)는 필수입니다')
      }
      if (!searchParams.chapters || searchParams.chapters.length === 0) {
        throw new Error('챕터(chapters)는 최소 1개 이상 선택해야 합니다')
      }

      const requestData = {
        subjectId: searchParams.subjectId,
        chapters: searchParams.chapters || [],
        itemCount: searchParams.itemCount || 20,
        difficulty: searchParams.difficulty || 'mixed',
        questionTypes: searchParams.questionTypes || [],
        includePassage: searchParams.includePassage !== false,
        avoidDuplicate: searchParams.avoidDuplicate !== false,
        prioritizeLatest: searchParams.prioritizeLatest || false
      }

      console.log('백엔드로 전송할 요청 데이터:', JSON.stringify(requestData, null, 2))

      const response = await api.post('/items/smart-random', requestData)
      console.log('백엔드 응답 상태:', response.status)
      console.log('백엔드 응답 데이터:', response.data)

      if (response.data.success) {
        // SmartSelectionResponse의 items 배열 반환
        const responseData = response.data.data
        
        console.log('=== Smart Random Selection 성공 ===')
        console.log(`선택된 문항 수: ${responseData.items?.length || 0}개`)
        
        if (responseData.metadata) {
          console.log('메타데이터:', {
            요청문항수: responseData.metadata.requestedCount,
            실제문항수: responseData.metadata.actualItemCount,
            선택단위수: responseData.metadata.selectionUnitCount,
            지문그룹수: responseData.metadata.passageGroupCount
          })
        }
        
        return {
          success: true,
          data: responseData.items || [],
          metadata: responseData.metadata,
          report: responseData.report,
          message: response.data.message
        }
      }

      throw new Error(response.data.message || 'Smart random selection failed')
    } catch (error) {
      console.error('=== Smart Random Selection API 오류 ===')
      console.error('오류 타입:', error.name)
      console.error('오류 메시지:', error.message)
      
      if (error.response) {
        console.error('응답 상태 코드:', error.response.status)
        console.error('응답 에러 데이터:', error.response.data)
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Smart random selection request failed',
        data: []
      }
    }
  }
}

// Create and export singleton instance
const itemApiService = new ItemApiService()

export default itemApiService

// Named exports for individual methods (for convenience)
export const {
  searchItems,
  getItemDetail,
  getChapterCounts,
  getItemCountsBySubjects,
  getItemCountsByChapters,
  getSimilarItems,
  getSubjects,
  getTextbooks,
  getItemStats,
  bulkItemOperation,
  smartRandomSelection
} = itemApiService
