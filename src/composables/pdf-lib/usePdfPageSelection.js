import { ref, watch, unref } from 'vue'

export function usePdfPageSelection(pdfPages, currentPageIndex, callbacks = {}) {
  // 선택된 페이지들 (일괄 작업용)
  const selectedPages = ref([])

  // 콜백 함수들 (기본값 설정)
  const {
    onPageRemoved = () => {},
    onPagesRemoved = () => {},
    onPageSelected = () => {}
  } = callbacks

  // PDF 페이지 길이가 변경될 때 현재 페이지 인덱스 조정
  watch(() => unref(pdfPages)?.length || 0, (newLength, oldLength) => {
    if (newLength < oldLength && currentPageIndex.value >= newLength) {
      currentPageIndex.value = Math.max(0, newLength - 1)
    }
  })

  // 페이지 선택 처리
  const selectPage = (index) => {
    currentPageIndex.value = index
    onPageSelected(index)
  }

  // 페이지 선택 토글 (체크박스용)
  const togglePageSelection = (index) => {
    const pageIndex = selectedPages.value.indexOf(index)
    if (pageIndex > -1) {
      selectedPages.value.splice(pageIndex, 1)
    } else {
      selectedPages.value.push(index)
    }
  }

  // 전체 페이지 선택
  const selectAllPages = () => {
    const pages = unref(pdfPages)
    if (pages && Array.isArray(pages)) {
      selectedPages.value = pages.map((_, index) => index)
    }
  }

  // 선택 해제
  const clearSelection = () => {
    selectedPages.value = []
  }

  // 페이지 삭제
  const removePage = (pageIndex) => {
    const pages = unref(pdfPages)
    if (pages && pageIndex >= 0 && pageIndex < pages.length) {
      onPageRemoved(pageIndex)

      // 현재 페이지가 삭제된 경우 이전 페이지로 이동
      if (currentPageIndex.value === pageIndex) {
        if (currentPageIndex.value > 0) {
          currentPageIndex.value--
        } else if (pages.length > 1) {
          currentPageIndex.value = 0
        }
      }
      // 삭제된 페이지보다 뒤에 있는 페이지들의 인덱스 조정
      else if (currentPageIndex.value > pageIndex) {
        currentPageIndex.value--
      }
    }
  }

  // 선택된 페이지들 일괄 삭제
  const removeSelectedPages = () => {
    if (selectedPages.value.length > 0) {
      console.log('선택된 페이지 일괄 삭제:', selectedPages.value)

      // Store에 삭제 알림만 하고, 실제 삭제는 Store에서 처리
      onPagesRemoved([...selectedPages.value])

      // 선택 상태 초기화
      selectedPages.value = []

      // 현재 페이지가 삭제된 경우 적절한 페이지로 이동
      const pages = unref(pdfPages)
      if (pages && pages.length > 0) {
        if (currentPageIndex.value >= pages.length) {
          currentPageIndex.value = Math.max(0, pages.length - 1)
        }
      }
    }
  }

  return {
    selectedPages,
    selectPage,
    togglePageSelection,
    selectAllPages,
    clearSelection,
    removePage,
    removeSelectedPages
  }
}
