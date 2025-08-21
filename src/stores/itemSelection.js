/**
 * 문항 선택 Store
 * Step2 문항 선택 컴포넌트에서 사용하는 상태 관리
 * Backend API 및 Elasticsearch 연동
 */

import { defineStore } from 'pinia'
import itemApiService from '../services/itemApi.js'

export const useItemSelectionStore = defineStore('itemSelection', {
  state: () => ({
    // 검색된 문항 목록
    items: [],

    // 선택된 문항 목록
    selectedItems: [],

    // 페이지네이션
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,

    // 필터 설정
    filters: {
      subjects: [], // 과목 필터
      grades: [], // 학년 필터
      difficulties: [], // 난이도 필터
      categories: [], // 카테고리 필터
      keyword: '', // 검색 키워드
      chapterIds: [] // 단원 ID 필터 (기존 호환성)
    },

    // 로딩 상태
    isLoading: false,
    isSimilarItemsLoading: false,
    isSubjectsLoading: false,

    // 에러 상태
    error: null,
    similarItemsError: null,
    subjectsError: null,

    // 교과서/과목 정보
    subjects: [],
    textbooks: {},
    chapters: [], // 기존 호환성 유지

    // 정렬 설정
    sortBy: 'createdAt', // createdAt, difficulty, chapterCode
    sortOrder: 'desc', // asc, desc

    // 문항 상세 정보 캐시
    itemDetailsCache: new Map(),

    // 유사 문항 캐시 (Elasticsearch)
    similarItemsCache: new Map(),

    // 검색 기록 (UX 개선용)
    searchHistory: [],
    maxSearchHistory: 10,

    // 이미지 미리보기 설정
    previewItem: null,
    showPreview: false,

    // 통계 정보
    chapterCounts: {},
    itemStats: null,

    // 마지막 검색 파라미터 (캐싱용)
    lastSearchParams: null
  }),

  getters: {
    /**
     * 선택된 문항 ID 목록
     */
    selectedItemIds: (state) => {
      return state.selectedItems.map(item => item.itemId)
    },

    /**
     * 특정 문항이 선택되었는지 확인
     */
    isItemSelected: (state) => {
      return (itemId) => {
        return state.selectedItems.some(item => item.itemId === itemId)
      }
    },

    /**
     * 전체 선택 상태
     */
    isAllSelected: (state) => {
      return state.items.length > 0 &&
             state.items.every(item =>
               state.selectedItems.some(selected => selected.itemId === item.itemId)
             )
    },

    /**
     * 일부 선택 상태 (전체 선택 체크박스용)
     */
    isSomeSelected: (state) => {
      return state.items.some(item =>
        state.selectedItems.some(selected => selected.itemId === item.itemId)
      ) && !state.isAllSelected
    },

    /**
     * 필터가 적용되었는지 확인
     */
    hasActiveFilters: (state) => {
      return state.filters.subjects.length > 0 ||
             state.filters.grades.length > 0 ||
             state.filters.difficulties.length > 0 ||
             state.filters.categories.length > 0 ||
             state.filters.chapterIds.length > 0 ||
             state.filters.keyword !== ''
    },

    /**
     * 선택된 문항의 총 배점
     */
    totalPoints: (state) => {
      return state.selectedItems.reduce((sum, item) => {
        return sum + (item.points || item.score || 5) // 기본 배점 5점
      }, 0)
    },

    /**
     * 난이도별 선택 문항 수
     */
    selectedByDifficulty: (state) => {
      const counts = { H: 0, M: 0, L: 0, high: 0, medium: 0, low: 0 }
      state.selectedItems.forEach(item => {
        const difficulty = item.difficulty?.code || item.difficulty
        if (difficulty) {
          // Handle both legacy (H/M/L) and new (high/medium/low) formats
          if (counts[difficulty] !== undefined) {
            counts[difficulty]++
          }
        }
      })
      return counts
    },

    /**
     * 과목별 선택 문항 수
     */
    selectedBySubject: (state) => {
      const counts = {}
      state.selectedItems.forEach(item => {
        const subject = item.subject?.name || item.subjectName || '기타'
        counts[subject] = (counts[subject] || 0) + 1
      })
      return counts
    },

    /**
     * 문제 유형별 선택 문항 수
     */
    selectedByType: (state) => {
      const counts = {}
      state.selectedItems.forEach(item => {
        const type = item.questionForm?.name || item.questionType || '기타'
        counts[type] = (counts[type] || 0) + 1
      })
      return counts
    },

    /**
     * 로딩 상태 확인 (전체)
     */
    isAnyLoading: (state) => {
      return state.isLoading || state.isSimilarItemsLoading || state.isSubjectsLoading
    },

    /**
     * 에러 상태 확인 (전체)
     */
    hasAnyError: (state) => {
      return state.error || state.similarItemsError || state.subjectsError
    },

    /**
     * 검색 기록에서 최근 검색어 목록
     */
    recentSearchKeywords: (state) => {
      return state.searchHistory
        .filter(history => history.keyword && history.keyword.trim())
        .map(history => history.keyword)
        .slice(0, 5) // 최근 5개만
    },

    /**
     * 유사 문항 캐시에서 특정 문항의 유사 항목
     */
    getSimilarItems: (state) => {
      return (itemId) => {
        return state.similarItemsCache.get(itemId) || []
      }
    },

    /**
     * 텍스트북 정보를 과목별로 정리
     */
    textbooksBySubject: (state) => {
      return state.textbooks
    }
  },

  actions: {
    // ===============================
    // 문항 목록 관리 Actions
    // ===============================

    /**
     * 문항 목록 설정
     */
    setItems(items) {
      this.items = items || []
    },

    /**
     * 문항 선택/해제 토글
     */
    toggleItemSelection(item) {
      const index = this.selectedItems.findIndex(i => i.itemId === item.itemId)
      if (index > -1) {
        this.selectedItems.splice(index, 1)
      } else {
        this.selectedItems.push(item)
      }
    },

    /**
     * 문항 선택
     */
    selectItem(item) {
      if (!this.isItemSelected(item.itemId)) {
        this.selectedItems.push(item)
      }
    },

    /**
     * 문항 선택 해제
     */
    deselectItem(itemId) {
      const index = this.selectedItems.findIndex(item => item.itemId === itemId)
      if (index > -1) {
        this.selectedItems.splice(index, 1)
      }
    },

    /**
     * 전체 선택
     */
    selectAll() {
      this.items.forEach(item => {
        if (!this.isItemSelected(item.itemId)) {
          this.selectedItems.push(item)
        }
      })
    },

    /**
     * 전체 선택 해제
     */
    deselectAll() {
      const currentItemIds = this.items.map(item => item.itemId)
      this.selectedItems = this.selectedItems.filter(
        item => !currentItemIds.includes(item.itemId)
      )
    },

    /**
     * 전체 선택 토글
     */
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.deselectAll()
      } else {
        this.selectAll()
      }
    },

    /**
     * 선택 항목 전체 초기화
     */
    clearSelection() {
      this.selectedItems = []
    },

    /**
     * 선택된 문항 순서 변경
     */
    reorderSelectedItems(fromIndex, toIndex) {
      const item = this.selectedItems.splice(fromIndex, 1)[0]
      this.selectedItems.splice(toIndex, 0, item)
    },

    /**
     * 선택된 문항 순서 섞기
     */
    shuffleSelectedItems() {
      const shuffled = [...this.selectedItems]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      this.selectedItems = shuffled
    },

    // ===============================
    // API 연동 Actions
    // ===============================

    /**
     * 문항 검색 (실제 API 호출)
     */
    async searchItems(searchParams = {}) {
      this.isLoading = true
      this.error = null

      try {
        // 검색 파라미터 준비
        const params = {
          keyword: searchParams.keyword || this.filters.keyword || '',
          subjects: searchParams.subjects || this.filters.subjects || [],
          grades: searchParams.grades || this.filters.grades || [],
          difficulties: searchParams.difficulties || this.filters.difficulties || [],
          categories: searchParams.categories || this.filters.categories || [],
          chapterIds: searchParams.chapterIds || this.filters.chapterIds || [],
          page: searchParams.page !== undefined ? searchParams.page : (this.currentPage - 1), // 0-based indexing
          size: searchParams.size || this.itemsPerPage,
          sortBy: this.sortBy,
          sortDirection: this.sortOrder
        }

        // 검색 기록에 추가
        if (params.keyword && params.keyword.trim()) {
          this.addToSearchHistory({
            keyword: params.keyword,
            timestamp: new Date().toISOString(),
            resultCount: 0 // 결과 받은 후 업데이트
          })
        }

        // API 호출
        const result = await itemApiService.searchItems(params)

        if (result.success) {
          // 첫 번째 아이템의 구조 확인 (디버깅용)
          if (result.data && result.data.length > 0) {
            console.log('First item structure:', result.data[0])
            console.log('Has choice fields?', {
              choice1Html: result.data[0].choice1Html,
              choice2Html: result.data[0].choice2Html,
              choice3Html: result.data[0].choice3Html,
              choice4Html: result.data[0].choice4Html,
              choice5Html: result.data[0].choice5Html
            })
          }

          this.setItems(result.data)
          this.setPaginationInfo({
            currentPage: result.currentPage + 1, // 1-based for UI
            totalPages: result.totalPages,
            totalItems: result.totalElements
          })

          // 검색 기록 업데이트 (결과 수)
          if (params.keyword && params.keyword.trim()) {
            this.updateSearchHistoryResultCount(params.keyword, result.totalElements)
          }

          // 마지막 검색 파라미터 저장
          this.lastSearchParams = params

        } else {
          throw new Error(result.error || 'Search failed')
        }

      } catch (error) {
        console.error('문항 검색 실패:', error)
        this.error = error.message || 'Failed to search items'
        this.setItems([])
        this.setPaginationInfo({ currentPage: 1, totalPages: 0, totalItems: 0 })
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 문항 상세 정보 가져오기
     */
    async getItemDetail(itemId, useCache = true) {
      if (!itemId) {
        throw new Error('Item ID is required')
      }

      // 캐시 확인
      if (useCache && this.itemDetailsCache.has(itemId)) {
        return this.itemDetailsCache.get(itemId)
      }

      try {
        const result = await itemApiService.getItemDetail(itemId)

        if (result.success) {
          // 캐시에 저장
          this.itemDetailsCache.set(itemId, result.data)
          return result.data
        } else {
          throw new Error(result.error || 'Failed to load item details')
        }
      } catch (error) {
        console.error('문항 상세 정보 가져오기 실패:', error)
        throw error
      }
    },

    /**
     * Elasticsearch를 사용한 유사 문항 검색
     */
    async searchSimilarItems(itemId, options = {}) {
      if (!itemId) {
        throw new Error('Item ID is required for similarity search')
      }

      // 캐시 확인
      const cacheKey = `${itemId}_${JSON.stringify(options)}`
      if (this.similarItemsCache.has(cacheKey)) {
        return this.similarItemsCache.get(cacheKey)
      }

      this.isSimilarItemsLoading = true
      this.similarItemsError = null

      try {
        const params = {
          topicChapterId: options.topicChapterId || 0,
          difficultyCode: options.difficultyCode || 2,
          excludeItemIds: options.excludeItemIds || [],
          size: options.size || 20
        }

        const result = await itemApiService.getSimilarItems(params)

        if (result.success) {
          // 캐시에 저장
          this.similarItemsCache.set(cacheKey, result.data)
          return result.data
        } else {
          throw new Error(result.error || 'Failed to find similar items')
        }

      } catch (error) {
        console.error('유사 문항 검색 실패:', error)
        this.similarItemsError = error.message || 'Failed to search similar items'
        throw error
      } finally {
        this.isSimilarItemsLoading = false
      }
    },

    /**
     * 과목/교과서 정보 가져오기
     */
    async loadSubjects(options = {}) {
      this.isSubjectsLoading = true
      this.subjectsError = null

      try {
        // gradeCode와 areaCode가 있으면 해당 파라미터 사용
        const params = {
          ...options,
          includeTextbooks: options.includeTextbooks !== false, // 기본적으로 포함
          grades: options.grades || []
        }

        const result = await itemApiService.getSubjects(params)

        if (result.success) {
          this.subjects = result.data

          // 텍스트북 정보 별도 저장
          if (params.includeTextbooks) {
            const textbooks = {}
            result.data.forEach(subject => {
              if (subject.textbooks && subject.textbooks.length > 0) {
                textbooks[subject.code] = subject.textbooks
              }
            })
            this.textbooks = textbooks
          }

          return result.data
        } else {
          throw new Error(result.error || 'Failed to load subjects')
        }

      } catch (error) {
        console.error('과목 정보 가져오기 실패:', error)
        this.subjectsError = error.message || 'Failed to load subjects'
        throw error
      } finally {
        this.isSubjectsLoading = false
      }
    },

    /**
     * 단원별 문항 수 통계 가져오기
     */
    async loadChapterCounts(filters = {}) {
      try {
        const params = {
          subjects: filters.subjects || this.filters.subjects,
          grades: filters.grades || this.filters.grades,
          categories: filters.categories || this.filters.categories
        }

        const result = await itemApiService.getChapterCounts(params)

        if (result.success) {
          this.chapterCounts = result.data
          return result.data
        } else {
          throw new Error(result.error || 'Failed to load chapter counts')
        }

      } catch (error) {
        console.error('단원별 통계 가져오기 실패:', error)
        throw error
      }
    },

    /**
     * 문항 통계 정보 가져오기
     */
    async loadItemStats(filters = {}) {
      try {
        const result = await itemApiService.getItemStats(filters)

        if (result.success) {
          this.itemStats = result.data
          return result.data
        } else {
          throw new Error(result.error || 'Failed to load item statistics')
        }

      } catch (error) {
        console.error('문항 통계 가져오기 실패:', error)
        throw error
      }
    },

    // ===============================
    // 필터 및 검색 관리 Actions
    // ===============================

    /**
     * 필터 설정
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    /**
     * 필터 초기화
     */
    resetFilters() {
      this.filters = {
        subjects: [],
        grades: [],
        difficulties: [],
        categories: [],
        keyword: '',
        chapterIds: []
      }
    },

    /**
     * 검색 기록 추가
     */
    addToSearchHistory(searchData) {
      // 중복 제거 (동일한 키워드가 있으면 제거)
      this.searchHistory = this.searchHistory.filter(
        item => item.keyword !== searchData.keyword
      )

      // 새 항목을 맨 앞에 추가
      this.searchHistory.unshift(searchData)

      // 최대 개수 제한
      if (this.searchHistory.length > this.maxSearchHistory) {
        this.searchHistory = this.searchHistory.slice(0, this.maxSearchHistory)
      }
    },

    /**
     * 검색 기록에서 결과 수 업데이트
     */
    updateSearchHistoryResultCount(keyword, resultCount) {
      const historyItem = this.searchHistory.find(item => item.keyword === keyword)
      if (historyItem) {
        historyItem.resultCount = resultCount
      }
    },

    /**
     * 검색 기록 삭제
     */
    removeFromSearchHistory(keyword) {
      this.searchHistory = this.searchHistory.filter(
        item => item.keyword !== keyword
      )
    },

    /**
     * 검색 기록 전체 삭제
     */
    clearSearchHistory() {
      this.searchHistory = []
    },

    // ===============================
    // 상태 관리 Actions
    // ===============================

    /**
     * 페이지 변경
     */
    setCurrentPage(page) {
      this.currentPage = page
    },

    /**
     * 페이지네이션 정보 설정
     */
    setPaginationInfo({ currentPage, totalPages, totalItems, size }) {
      if (currentPage !== undefined) this.currentPage = currentPage
      if (totalPages !== undefined) this.totalPages = totalPages
      if (totalItems !== undefined) this.totalItems = totalItems
      if (size !== undefined) this.itemsPerPage = size
    },

    /**
     * 로딩 상태 설정
     */
    setLoading(isLoading) {
      this.isLoading = isLoading
    },

    /**
     * 에러 설정
     */
    setError(error) {
      this.error = error
    },

    /**
     * 단원 목록 설정 (기존 호환성)
     */
    setChapters(chapters) {
      this.chapters = chapters || []
    },

    /**
     * 정렬 설정
     */
    setSorting(sortBy, sortOrder) {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },

    /**
     * 문항 상세 정보 캐싱
     */
    cacheItemDetail(itemId, detail) {
      this.itemDetailsCache.set(itemId, detail)
    },

    /**
     * 캐시된 문항 상세 정보 가져오기
     */
    getCachedItemDetail(itemId) {
      return this.itemDetailsCache.get(itemId)
    },

    /**
     * 미리보기 설정
     */
    setPreviewItem(item) {
      this.previewItem = item
      this.showPreview = !!item
    },

    /**
     * 미리보기 닫기
     */
    closePreview() {
      this.previewItem = null
      this.showPreview = false
    },

    /**
     * 캐시 정리
     */
    clearCaches() {
      this.itemDetailsCache.clear()
      this.similarItemsCache.clear()
    },

    /**
     * Store 초기화
     */
    resetStore() {
      this.items = []
      this.selectedItems = []
      this.currentPage = 1
      this.totalPages = 1
      this.totalItems = 0
      this.itemsPerPage = 20

      this.filters = {
        subjects: [],
        grades: [],
        difficulties: [],
        categories: [],
        keyword: '',
        chapterIds: []
      }

      this.isLoading = false
      this.isSimilarItemsLoading = false
      this.isSubjectsLoading = false

      this.error = null
      this.similarItemsError = null
      this.subjectsError = null

      this.subjects = []
      this.textbooks = {}
      this.chapters = []
      this.chapterCounts = {}
      this.itemStats = null

      this.searchHistory = []
      this.lastSearchParams = null

      this.clearCaches()

      this.previewItem = null
      this.showPreview = false
    },

    // ===============================
    // 유틸리티 Actions
    // ===============================

    /**
     * 현재 검색 조건으로 재검색
     */
    async refreshSearch() {
      if (this.lastSearchParams) {
        await this.searchItems(this.lastSearchParams)
      }
    },

    /**
     * 선택된 문항들의 유사 문항 일괄 검색
     */
    async loadSimilarItemsForSelected(options = {}) {
      const promises = this.selectedItems.map(item =>
        this.searchSimilarItems(item.itemId, options).catch(error => {
          console.warn(`유사 문항 검색 실패 (itemId: ${item.itemId}):`, error)
          return []
        })
      )

      return await Promise.all(promises)
    },

    /**
     * 문항 벌크 작업
     */
    async bulkItemOperation(operation, itemIds, operationData = {}) {
      try {
        const result = await itemApiService.bulkItemOperation(operation, itemIds, operationData)

        if (result.success) {
          return result
        } else {
          throw new Error(result.error || 'Bulk operation failed')
        }
      } catch (error) {
        console.error('벌크 작업 실패:', error)
        throw error
      }
    }
  }
})
