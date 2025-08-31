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
        :pdf-pages="pdfPages"
        :current-page-index="currentPageIndex"
        @image-error="handleImageError"
        @image-load="handleImageLoad"
      />

      <!-- 오른쪽: 모든 페이지 썸네일 그리드 -->
      <PdfThumbnailGrid
        :pdf-pages="pdfPages"
        :current-page-index="currentPageIndex"
        :selected-pages="selectedPages"
        :selected-for-move="selectedForMove"
        @select-all="selectAllPages"
        @clear-selection="clearSelection"
        @remove-selected="removeSelectedPages"
        @page-click="handlePageClick"
        @page-dblclick="selectPage"
        @selection-change="togglePageSelection"
        @page-moved="handlePageMoved"
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
import { ref, computed, toRef } from 'vue'
import PdfMainPreview from './PdfMainPreview.vue'
import PdfThumbnailGrid from './PdfThumbnailGrid.vue'
import PdfNavigation from './PdfNavigation.vue'
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
  emits: ['page-removed', 'page-moved', 'pages-removed', 'page-selected', 'go-back', 'next-step', 'image-fallback'],
  setup(props, { emit }) {
    // props를 ref로 변환하여 반응성 유지
    const pdfPagesRef = toRef(props, 'pdfPages')

    // 현재 선택된 페이지 인덱스
    const currentPageIndex = ref(0)

    // 현재 선택된 페이지 정보
    const currentPage = computed(() => {
      return props.pdfPages[currentPageIndex.value] || null
    })

    // 이동을 위해 선택된 페이지 인덱스
    const selectedForMove = ref(null)

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





    // 클릭 기반 순서 변경 로직
    const handlePageClick = (index) => {
      if (selectedForMove.value === null) {
        // 첫 번째 클릭: 이동할 페이지 선택
        selectedForMove.value = index
      } else if (selectedForMove.value === index) {
        // 같은 페이지 클릭: 선택 해제
        selectedForMove.value = null
      } else {
        // 두 번째 클릭: 순서 변경
        emit('page-moved', {
          fromIndex: selectedForMove.value,
          toIndex: index
        })
        selectedForMove.value = null // 선태 상태 초기화
      }
    }

    // 뒤로가기
    const goBack = () => {
      emit('go-back')
    }

    // 다음 단계
    const nextStep = () => {
      emit('next-step')
    }

    // 페이지 이동 콜백 핸들러
    const handlePageMoved = (moveInfo) => {
      emit('page-moved', moveInfo)
    }

    // 이미지 에러 처리
    const handleImageError = (errorInfo) => {
      console.warn('이미지 로드 에러:', errorInfo)
      
      // 프록시 실패 시 S3 URL로 fallback
      if (errorInfo.originalUrl && errorInfo.proxyUrl) {
        const pageIndex = errorInfo.pageIndex
        if (pageIndex >= 0 && pageIndex < props.pdfPages.length) {
          // 부모 컴포넌트에 fallback 요청
          emit('image-fallback', {
            pageIndex,
            originalUrl: errorInfo.originalUrl
          })
          
          console.log(`페이지 ${pageIndex + 1} 프록시에서 S3 URL로 fallback 요청:`, errorInfo.originalUrl)
        }
      }
    }

    // 이미지 로드 성공 처리
    const handleImageLoad = (loadInfo) => {
      console.log('이미지 로드 성공:', loadInfo)
    }

    return {
      currentPageIndex,
      currentPage,
      selectedPages,
      selectedForMove,
      selectPage,
      togglePageSelection,
      selectAllPages,
      clearSelection,
      removePage,
      removeSelectedPages,
      handlePageClick,
      goBack,
      nextStep,
      handlePageMoved,
      handleImageError,
      handleImageLoad
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
