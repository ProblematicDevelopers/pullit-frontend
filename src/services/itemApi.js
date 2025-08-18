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
      // 백엔드 ItemSearchRequest에 맞게 매핑
      const requestData = {
        subjectId: searchParams.subjects && searchParams.subjects.length > 0 ? searchParams.subjects[0] : null,
        largeChapterIds: searchParams.chapterIds || [],
        mediumChapterIds: [],
        smallChapterIds: [],
        topicChapterIds: [],
        questionFormCode: searchParams.categories || [],
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
        itemId: similarityParams.itemId,
        content: similarityParams.content || '',
        subjects: similarityParams.subjects || [],
        grades: similarityParams.grades || [],
        limit: similarityParams.limit || 10,
        minScore: similarityParams.minScore || 0.1
      }

      // Elasticsearch endpoint 호출
      const esResponse = await api.post('/es/items/similar', requestData)
      
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
}

// Create and export singleton instance
const itemApiService = new ItemApiService()

export default itemApiService

// Named exports for individual methods (for convenience)
export const {
  searchItems,
  getItemDetail,
  getChapterCounts,
  getSimilarItems,
  getSubjects,
  getTextbooks,
  getItemStats,
  bulkItemOperation
} = itemApiService