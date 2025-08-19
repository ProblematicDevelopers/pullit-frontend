import { ref, computed, watch } from 'vue'

/**
 * Item Processing 상태 관리를 통합하는 Composable
 * Store와 로컬 상태의 동기화를 담당
 */
export function useItemProcessingState(store) {
  // 로컬 상태 (Store와 동기화)
  const selectedTextbook = ref(null)
  const pdfFile = ref(null)
  const pdfPages = ref([])
  const selectedSubject = ref(null)

  // Store 상태를 computed로 접근
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const textbooks = computed(() => store.textbooks)
  const groupedTextbooks = computed(() => store.groupedTextbooks)
  // subjects는 getter 함수이므로 직접 접근
  const subjects = store.subjects

  /**
   * Store와 로컬 상태 동기화
   */
  const syncWithStore = () => {
    // 교과서 선택 상태 동기화
    if (store.selectedTextbook !== selectedTextbook.value) {
      selectedTextbook.value = store.selectedTextbook
    }

    // PDF 파일 상태 동기화
    if (store.pdfFile !== pdfFile.value) {
      pdfFile.value = store.pdfFile
    }

    // PDF 페이지 상태 동기화
    if (store.pdfPages !== pdfPages.value) {
      pdfPages.value = [...store.pdfPages]
    }
  }

  /**
   * 교과서 선택 처리
   * @param {Object} textbook - 선택된 교과서
   */
  const selectTextbook = (textbook) => {
    selectedTextbook.value = textbook
    store.selectTextbook(textbook)
  }

  /**
   * 과목 선택 처리
   * @param {string} areaCode - 과목 코드
   */
  const selectSubject = (areaCode) => {
    selectedSubject.value = areaCode
  }

  /**
   * PDF 파일 설정
   * @param {File} file - PDF 파일
   */
  const setPdfFile = (file) => {
    pdfFile.value = file
    store.setPdfFile(file)
  }

  /**
   * PDF 페이지 설정
   * @param {Array} pages - PDF 페이지 배열
   */
  const setPdfPages = (pages) => {
    pdfPages.value = [...pages]
    store.setPdfPages(pages)
  }

  /**
   * 페이지 이동 처리
   * @param {Object} moveInfo - 이동 정보
   */
  const movePage = (moveInfo) => {
    const { fromIndex, toIndex, newPages } = moveInfo

    // Store에 페이지 이동 알림
    if (store.movePage) {
      store.movePage(fromIndex, toIndex)
    }

    // 로컬 상태 업데이트
    pdfPages.value = [...newPages]

    console.log(`페이지 ${fromIndex + 1}을 ${toIndex + 1} 위치로 이동했습니다.`)
  }

  /**
   * 페이지 삭제 처리
   * @param {number} pageIndex - 삭제할 페이지 인덱스
   */
  const removePage = (pageIndex) => {
    store.removePage(pageIndex)
    pdfPages.value.splice(pageIndex, 1)
  }

  /**
   * 여러 페이지 일괄 삭제
   * @param {Array<number>} pageIndexes - 삭제할 페이지 인덱스 배열
   */
  const removeMultiplePages = (pageIndexes) => {
    store.removeMultiplePages(pageIndexes)

    // 로컬 상태도 업데이트
    const sortedIndexes = [...pageIndexes].sort((a, b) => b - a)
    sortedIndexes.forEach(index => {
      pdfPages.value.splice(index, 1)
    })
  }

  /**
   * 뒤로가기 처리
   */
  const goBack = () => {
    if (pdfFile.value) {
      // PDF 편집에서 뒤로가기: PDF 업로드 단계로
      pdfFile.value = null
      pdfPages.value = []
      store.setPdfFile(null)
    } else if (selectedTextbook.value) {
      // 교과서 선택에서 뒤로가기: 교과서 선택 단계로
      selectedTextbook.value = null
      store.selectTextbook(null)
    }
  }

  /**
   * 상태 초기화
   */
  const resetState = () => {
    selectedTextbook.value = null
    pdfFile.value = null
    pdfPages.value = []
    selectedSubject.value = null
    store.reset()
  }

  /**
   * 현재 단계 확인
   */
  const getCurrentStep = () => {
    if (!selectedTextbook.value) return 1
    if (!pdfFile.value) return 2
    return 3
  }

  /**
   * 다음 단계로 이동 가능한지 확인
   */
  const canProceedToNext = () => {
    const currentStep = getCurrentStep()

    switch (currentStep) {
      case 1:
        return selectedTextbook.value !== null
      case 2:
        return pdfFile.value !== null && pdfPages.value.length > 0
      case 3:
        return pdfPages.value.length > 0
      default:
        return false
    }
  }

  // Store 상태 변경 감지하여 로컬 상태 동기화
  watch(() => store.selectedTextbook, (newValue) => {
    selectedTextbook.value = newValue
  })

  watch(() => store.pdfFile, (newValue) => {
    pdfFile.value = newValue
  })

  watch(() => store.pdfPages, (newValue) => {
    pdfPages.value = [...newValue]
  }, { deep: true })

  return {
    // 상태
    selectedTextbook,
    pdfFile,
    pdfPages,
    selectedSubject,
    loading,
    error,
    textbooks,
    groupedTextbooks,
    subjects,

    // 메서드
    syncWithStore,
    selectTextbook,
    selectSubject,
    setPdfFile,
    setPdfPages,
    movePage,
    removePage,
    removeMultiplePages,
    goBack,
    resetState,
    getCurrentStep,
    canProceedToNext
  }
}
