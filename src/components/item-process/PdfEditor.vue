<template>
  <div class="pdf-edit-section">
    <h2 class="section-title">3. PDF 페이지 편집</h2>
    <p class="section-description">
      PDF 페이지의 순서를 조정하거나 불필요한 페이지를 삭제하세요
    </p>

    <!-- PDF 편집 레이아웃 -->
    <div class="pdf-editor-layout">
      <!-- 왼쪽: 현재 선택된 페이지 큰 미리보기 -->
      <PdfMainPreview
        :current-page="currentPage"
        :current-page-index="currentPageIndex"
      />

      <!-- 오른쪽: 모든 페이지 썸네일 그리드 -->
      <PdfThumbnailGrid
        :pdf-pages="pdfPages"
        :current-page-index="currentPageIndex"
        :selected-pages="selectedPages"
        :drag-index="dragIndex"
        :drop-index="dropIndex"
        @select-all="selectAllPages"
        @clear-selection="clearSelection"
        @remove-selected="removeSelectedPages"
        @page-click="selectPage"
        @page-dblclick="selectPage"
        @selection-change="togglePageSelection"
        @drag-start="handleDragStartWrapper"
        @drag-end="handleDragEndWrapper"
        @drag-over="handleDragOverWrapper"
        @drag-leave="handleDragLeaveWrapper"
        @drop="handleDropWrapper"
      />
    </div>

    <!-- 네비게이션 버튼들 -->
    <PdfNavigation
      @go-back="goBack"
      @next-step="nextStep"
    />
  </div>
</template>

<script>
import { ref, computed, toRef, watch, onUnmounted } from 'vue'
import PdfMainPreview from './PdfMainPreview.vue'
import PdfThumbnailGrid from './PdfThumbnailGrid.vue'
import PdfNavigation from './PdfNavigation.vue'
import { usePdfDragAndDrop } from '../../composables/pdf-lib/usePdfDragAndDrop.js'
import { usePdfPageSelection } from '../../composables/pdf-lib/usePdfPageSelection.js'

export default {
  name: 'PdfEditor',
  components: {
    PdfMainPreview,
    PdfThumbnailGrid,
    PdfNavigation
  },
  props: {
    // PDF 페이지 목록
    pdfPages: {
      type: Array,
      required: true
    }
  },
  emits: ['page-removed', 'page-moved', 'pages-removed', 'page-selected', 'go-back', 'next-step'],
  setup(props, { emit }) {
    // props를 ref로 변환하여 반응성 유지
    const pdfPagesRef = toRef(props, 'pdfPages')

    // 현재 선택된 페이지 인덱스
    const currentPageIndex = ref(0)

    // 현재 선택된 페이지 정보
    const currentPage = computed(() => {
      return props.pdfPages[currentPageIndex.value] || null
    })

    // 콜백 함수들 정의
    const callbacks = {
      onPageRemoved: (pageIndex) => emit('page-removed', pageIndex),
      onPagesRemoved: (pageIndexes) => emit('pages-removed', pageIndexes),
      onPageSelected: (index) => emit('page-selected', index),
      onPageMoved: (moveInfo) => emit('page-moved', moveInfo)
    }

    // 페이지 선택 관련 로직
    const {
      selectedPages,
      selectPage,
      togglePageSelection,
      selectAllPages,
      clearSelection,
      removePage,
      removeSelectedPages
    } = usePdfPageSelection(pdfPagesRef, currentPageIndex, callbacks)

    // 드래그 앤 드롭 관련 로직
    const {
      dragIndex,
      dropIndex,
      isDragging,
      isProcessingDrop,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      getDragState,
      resetDragState
    } = usePdfDragAndDrop(pdfPagesRef, currentPageIndex, selectedPages, callbacks)

    // 드래그 이벤트 핸들러 래퍼 (디버깅용)
    const handleDragStartWrapper = (event, index) => {
      console.log('🎯 drag-start 수신:', index)

      if (index === null || index === undefined || index < 0) {
        console.error('유효하지 않은 드래그 인덱스:', index)
        return
      }

      handleDragStart(event, index)
    }

    const handleDragEndWrapper = (event) => {
      handleDragEnd(event)
    }

    const handleDragOverWrapper = (event, index) => {
      if (index === null || index === undefined || index < 0) {
        console.error('유효하지 않은 drag-over 인덱스:', index)
        return
      }
      handleDragOver(event, index)
    }

    const handleDragLeaveWrapper = (event) => {
      handleDragLeave(event)
    }

    const handleDropWrapper = (event, index) => {
      if (index === null || index === undefined || index < 0) {
        console.error('유효하지 않은 drop 인덱스:', index)
        return
      }
      handleDrop(event, index)
    }

    // 드래그 상태 디버깅
    watch([dragIndex, dropIndex, isDragging, isProcessingDrop], () => {
      const dragState = getDragState()

      // dragIndex가 null이 되는 경우만 경고
      if (dragIndex.value === null && isDragging.value) {
        console.warn('⚠️ 드래그 중인데 dragIndex가 null입니다!', dragState)
      }
    }, { deep: true })

    // 드래그 상태 주기적 체크 (디버깅용)
    let dragStateCheckInterval = null
    const startDragStateCheck = () => {
      dragStateCheckInterval = setInterval(() => {
        if (isDragging.value || isProcessingDrop.value) {
          // 비정상 상태 감지 시 복구 시도
          if (isDragging.value && dragIndex.value === null) {
            console.warn('🔄 비정상 드래그 상태 감지, 복구 시도')
            resetDragState()
          }
        }
      }, 2000) // 2초마다 체크 (빈도 줄임)
    }

    const stopDragStateCheck = () => {
      if (dragStateCheckInterval) {
        clearInterval(dragStateCheckInterval)
        dragStateCheckInterval = null
      }
    }

    // 드래그 시작/종료 시 체크 시작/중지
    watch(isDragging, (newValue) => {
      if (newValue) {
        startDragStateCheck()
      } else {
        stopDragStateCheck()
      }
    })

    // 컴포넌트 언마운트 시 정리
    onUnmounted(() => {
      stopDragStateCheck()
    })

    // 뒤로가기
    const goBack = () => {
      emit('go-back')
    }

    // 다음 단계
    const nextStep = () => {
      emit('next-step')
    }

    return {
      currentPageIndex,
      currentPage,
      selectedPages,
      dragIndex,
      dropIndex,
      isDragging,
      selectPage,
      togglePageSelection,
      selectAllPages,
      clearSelection,
      removePage,
      removeSelectedPages,
      handleDragStartWrapper,
      handleDragEndWrapper,
      handleDragOverWrapper,
      handleDragLeaveWrapper,
      handleDropWrapper,
      goBack,
      nextStep
    }
  }
}
</script>

<style scoped>
/* 섹션 제목 스타일 */
.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.section-description {
  color: #64748b;
  margin: 0 0 3rem 0;
}

/* PDF 편집 레이아웃 */
.pdf-editor-layout {
  display: flex;
  gap: 2rem;
  margin: 3rem 0;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .pdf-editor-layout {
    flex-direction: column;
  }
}
</style>
