/**
 * 문항 선택 Store
 * Step2 문항 선택 컴포넌트에서 사용하는 상태 관리
 */

import { defineStore } from 'pinia'

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
      chapterIds: [],
      difficulty: [],
      questionForm: [],
      keyword: ''
    },
    
    // 로딩 상태
    isLoading: false,
    
    // 에러 상태
    error: null,
    
    // 단원 목록 (캐시)
    chapters: [],
    
    // 정렬 설정
    sortBy: 'chapterCode', // chapterCode, difficulty, questionForm
    sortOrder: 'asc', // asc, desc
    
    // 문항 상세 정보 캐시
    itemDetailsCache: new Map(),
    
    // 이미지 미리보기 설정
    previewItem: null,
    showPreview: false
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
      return state.filters.chapterIds.length > 0 ||
             state.filters.difficulty.length > 0 ||
             state.filters.questionForm.length > 0 ||
             state.filters.keyword !== ''
    },

    /**
     * 선택된 문항의 총 배점
     */
    totalPoints: (state) => {
      return state.selectedItems.reduce((sum, item) => {
        return sum + (item.points || 5) // 기본 배점 5점
      }, 0)
    },

    /**
     * 난이도별 선택 문항 수
     */
    selectedByDifficulty: (state) => {
      const counts = { H: 0, M: 0, L: 0 }
      state.selectedItems.forEach(item => {
        const difficulty = item.difficulty?.code
        if (difficulty && counts[difficulty] !== undefined) {
          counts[difficulty]++
        }
      })
      return counts
    },

    /**
     * 문제 유형별 선택 문항 수
     */
    selectedByType: (state) => {
      const counts = {}
      state.selectedItems.forEach(item => {
        const type = item.questionForm?.name || '기타'
        counts[type] = (counts[type] || 0) + 1
      })
      return counts
    }
  },

  actions: {
    /**
     * 문항 목록 설정
     */
    setItems(items) {
      this.items = items
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
        chapterIds: [],
        difficulty: [],
        questionForm: [],
        keyword: ''
      }
    },

    /**
     * 페이지 변경
     */
    setCurrentPage(page) {
      this.currentPage = page
    },

    /**
     * 페이지네이션 정보 설정
     */
    setPaginationInfo({ currentPage, totalPages, totalItems }) {
      this.currentPage = currentPage || this.currentPage
      this.totalPages = totalPages || this.totalPages
      this.totalItems = totalItems || this.totalItems
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
     * 단원 목록 설정
     */
    setChapters(chapters) {
      this.chapters = chapters
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
     * 문항 검색 (API 호출 예시)
     */
    async searchItems({ subjectId, gradeCode, page = 1 }) {
      this.setLoading(true)
      this.setError(null)
      
      try {
        // API 호출 예시 (백엔드 구현 후 활성화)
        // const params = {
        //   subjectId,
        //   gradeCode,
        //   chapterIds: this.filters.chapterIds,
        //   difficulty: this.filters.difficulty,
        //   questionForm: this.filters.questionForm,
        //   keyword: this.filters.keyword,
        //   page: page - 1,
        //   size: this.itemsPerPage,
        //   sort: `${this.sortBy},${this.sortOrder}`
        // }
        
        // const response = await axios.get('/api/items/search', { params })
        // this.setItems(response.data.content)
        // this.setPaginationInfo({
        //   currentPage: page,
        //   totalPages: response.data.totalPages,
        //   totalItems: response.data.totalElements
        // })
        
        // 임시 Mock 데이터
        const mockItems = this.generateMockItems(page)
        this.setItems(mockItems)
        this.setPaginationInfo({
          currentPage: page,
          totalPages: 5,
          totalItems: 100
        })
        
      } catch (error) {
        console.error('문항 검색 실패:', error)
        this.setError(error.message)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * Mock 데이터 생성 (개발용)
     */
    generateMockItems(page) {
      const items = []
      const startId = (page - 1) * this.itemsPerPage + 1
      
      for (let i = 0; i < this.itemsPerPage; i++) {
        items.push({
          itemId: startId + i,
          hasImageData: i % 3 === 0,
          hasHtmlData: i % 3 !== 0,
          questionImageUrl: i % 3 === 0 
            ? `https://via.placeholder.com/300x200?text=Item+${startId + i}` 
            : null,
          questionHtml: `<p>문항 ${startId + i}의 내용입니다.</p>`,
          difficulty: {
            code: ['H', 'M', 'L'][i % 3],
            name: ['상', '중', '하'][i % 3]
          },
          questionForm: {
            code: ['MC', 'SA', 'ES'][i % 3],
            name: ['객관식', '주관식', '서술형'][i % 3]
          },
          chapterName: `${Math.floor(i / 4) + 1}단원`,
          points: 5 // 기본 배점
        })
      }
      
      return items
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
      this.filters = {
        chapterIds: [],
        difficulty: [],
        questionForm: [],
        keyword: ''
      }
      this.isLoading = false
      this.error = null
      this.chapters = []
      this.itemDetailsCache.clear()
      this.previewItem = null
      this.showPreview = false
    }
  }
})