<template>
  <div class="item-processing-container">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">문제 등록</h1>
        <p class="page-subtitle">교과서를 선택하고 PDF를 업로드하여 문제를 가공하세요</p>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="main-content">
      <div class="content-wrapper">
        <!-- 단계별 컴포넌트 렌더링 -->

        <!-- 1단계: 교과서 선택 -->
        <TextbookSelection
          v-if="!selectedTextbook"
          :loading="loading"
          :subjects="subjects"
          :grouped-textbooks="groupedTextbooks"
          :selected-subject="selectedSubject"
          @select-subject="selectSubject"
          @select-textbook="selectTextbook"
        />

        <!-- 2단계: PDF 업로드 -->
        <PdfUpload
          v-else-if="!pdfFile"
          :selected-textbook="selectedTextbook"
          :pdf-file="pdfFile"
          @file-selected="handlePdfFile"
          @go-back="goBack"
          @go-to-pdf-edit="goToPdfEdit"
        />

        <!-- 3단계: PDF 편집 -->
        <PdfEditor
          v-else
          :pdf-pages="pdfPages"
          @page-removed="removePage"
          @page-moved="movePage"
          @pages-removed="removeMultiplePages"
          @go-back="goBack"
          @next-step="nextStep"
        />
      </div>
    </div>

    <!-- 에러 메시지 표시 -->
    <div v-if="errorHandler.hasError()" class="error-overlay">
      <div class="error-modal">
        <div class="error-header">
          <h3>오류 발생</h3>
          <button @click="errorHandler.clearError()" class="close-btn">&times;</button>
        </div>
        <div class="error-content">
          <p>{{ errorHandler.getErrorMessage() }}</p>
          <p class="error-context">{{ errorHandler.getErrorContext() }}</p>
        </div>
        <div class="error-actions">
          <button @click="errorHandler.clearError()" class="btn btn-primary">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useItemProcessingStore } from '@/store/itemProcessingStore.js'
import { PDFDocument } from 'pdf-lib'

// 새로 분리된 컴포넌트들 import
import TextbookSelection from '@/components/item-process/TextbookSelection.vue'
import PdfUpload from '@/components/item-process/PdfUpload.vue'
import PdfEditor from '@/components/item-process/PdfEditor.vue'

// 새로 생성한 composable들 import
import { useItemProcessingError } from '@/composables/item-process/useItemProcessingError'

export default {
  name: 'ItemProcessing',
  components: {
    TextbookSelection,
    PdfUpload,
    PdfEditor
  },
  setup() {
    // Store 및 Router 초기화
    const itemProcessingStore = useItemProcessingStore()
    const router = useRouter()

    // 기존 방식으로 복원 (문제 해결 후 다시 개선)
    const selectedTextbook = ref(null)
    const pdfFile = ref(null)
    const pdfPages = ref([])
    const selectedSubject = ref(null)

    // Store에서 데이터 가져오기 (computed로 반응성 보장)
    const loading = computed(() => itemProcessingStore.loading)
    const error = computed(() => itemProcessingStore.error)
    const textbooks = computed(() => itemProcessingStore.textbooks)
    const groupedTextbooks = computed(() => itemProcessingStore.groupedTextbooks)
    const subjects = computed(() => itemProcessingStore.subjects)

    // Composable 초기화
    const errorHandler = useItemProcessingError()

    // 컴포넌트 마운트 시 교과서 목록 로드
    onMounted(() => {
      console.log('ItemProcessing 컴포넌트 마운트됨')
      try {
        itemProcessingStore.fetchTextbooks()
        console.log('교과서 목록 로드 요청 완료')
      } catch (error) {
        console.error('교과서 목록 로드 중 오류:', error)
        errorHandler.handleGeneralError(error, '교과서 목록 로드')
      }
    })

    // 컴포넌트 언마운트 시 Blob URL 정리
    onUnmounted(() => {
      console.log('ItemProcessing 컴포넌트 언마운트됨')
      // Store에 등록된 모든 Blob URL을 정리
      itemProcessingStore.cleanupBlobUrls()
      console.log('Blob URL 정리 완료')
    })

    // ===== 교과서 선택 관련 메서드 =====

    /**
     * 과목 선택 처리
     * @param {string} areaCode - 선택된 과목의 영역 코드
     */
    const selectSubject = (areaCode) => {
      selectedSubject.value = areaCode
    }

    /**
     * 교과서 선택 처리
     * @param {Object} textbook - 선택된 교과서 정보
     */
    const selectTextbook = (textbook) => {
      selectedTextbook.value = textbook
      itemProcessingStore.selectTextbook(textbook)
    }

    // ===== PDF 업로드 관련 메서드 =====

    /**
     * PDF 파일 처리 및 페이지 분리
     * @param {File} file - 업로드된 PDF 파일
     */
    const handlePdfFile = async (file) => {
      // pages 배열을 try 블록 밖에서 선언
      const pages = []

      try {
        pdfFile.value = file
        itemProcessingStore.setPdfFile(file)

        console.log('PDF 파일 처리 시작:', file.name)

        // PDF 파일을 ArrayBuffer로 읽기
        const arrayBuffer = await file.arrayBuffer()

        // pdf-lib로 PDF 로딩
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pageCount = pdfDoc.getPageCount()
        console.log(`PDF 페이지 수: ${pageCount}`)

        // 각 페이지를 개별 PDF로 만들어서 썸네일 생성
        for (let i = 0; i < pageCount; i++) {
          // 페이지별 PDF 생성
          const singlePagePdf = await PDFDocument.create()
          const [page] = await singlePagePdf.copyPages(pdfDoc, [i])
          singlePagePdf.addPage(page)

          // PDF를 Blob으로 변환
          const pdfBytes = await singlePagePdf.save()
          const blob = new Blob([pdfBytes], { type: 'application/pdf' })

          // Blob URL 생성 (썸네일 표시용)
          const blobUrl = URL.createObjectURL(blob)

          // Store에 Blob URL 등록 (메모리 관리용)
          itemProcessingStore.addBlobUrl(blobUrl)

          pages.push({
            index: i,
            pageNumber: i + 1,
            preview: blobUrl,
            originalPage: i,
            blob: blob,
            width: page.getWidth(),
            height: page.getHeight()
          })
        }

        pdfPages.value = pages
        itemProcessingStore.setPdfPages(pages)
        console.log('PDF 페이지 처리 완료:', pages.length)

      } catch (error) {
        console.error('PDF 파싱 중 오류 발생:', error)

        // 에러 발생 시 생성된 Blob URL들 정리
        if (pages.length > 0) {
          pages.forEach(page => {
            if (page.preview) {
              URL.revokeObjectURL(page.preview)
            }
          })
        }

        errorHandler.handlePdfError(error, () => {
          pdfFile.value = null
          pdfPages.value = []
          itemProcessingStore.setPdfFile(null)
        })
      }
    }

    // ===== PDF 편집 관련 메서드 =====

    /**
     * 페이지 이동 처리
     * @param {Object} moveInfo - 이동 정보 { fromIndex: number, toIndex: number, newPages: Array }
     */
    const movePage = (moveInfo) => {
      const { fromIndex, toIndex, newPages } = moveInfo

      // Store에 페이지 이동 알림
      if (itemProcessingStore.movePage) {
        itemProcessingStore.movePage(fromIndex, toIndex)
      }

      // 로컬 상태 업데이트
      pdfPages.value = [...newPages]

      console.log(`페이지 ${fromIndex + 1}을 ${toIndex + 1} 위치로 이동했습니다.`)
    }

    /**
     * 단일 페이지 삭제
     * @param {number} pageIndex - 삭제할 페이지 인덱스
     */
    const removePage = (pageIndex) => {
      console.log('단일 페이지 삭제:', pageIndex)
      itemProcessingStore.removePage(pageIndex)
      // 로컬 상태는 Store 변경 감지로 자동 업데이트
    }

    /**
     * 여러 페이지 일괄 삭제
     * @param {Array<number>} pageIndexes - 삭제할 페이지 인덱스 배열
     */
    const removeMultiplePages = (pageIndexes) => {
      console.log('일괄 삭제 시작:', pageIndexes)

      // Store의 일괄 삭제 메서드만 사용 (로컬 상태는 Store 변경 감지로 자동 업데이트)
      if (itemProcessingStore.removeMultiplePages) {
        itemProcessingStore.removeMultiplePages(pageIndexes)
      } else {
        // Store에 메서드가 없는 경우에만 로컬 상태 직접 업데이트
        console.warn('Store에 removeMultiplePages 메서드가 없음, 로컬 상태 직접 업데이트')
        const sortedIndexes = [...pageIndexes].sort((a, b) => b - a)
        sortedIndexes.forEach(index => {
          pdfPages.value.splice(index, 1)
        })
      }
    }

    // Store의 pdfPages 변경을 감지하여 로컬 상태 동기화
    watch(() => itemProcessingStore.pdfPages, (newPages) => {
      if (newPages && Array.isArray(newPages)) {
        console.log('Store pdfPages 변경 감지, 로컬 상태 동기화:', newPages.length)

        // 페이지 인덱스 재정렬 (삭제 후 인덱스 꼬임 방지)
        const updatedPages = newPages.map((page, newIndex) => ({
          ...page,
          index: newIndex,
          pageNumber: newIndex + 1
        }))

        pdfPages.value = updatedPages

        console.log('페이지 인덱스 재정렬 완료:', updatedPages.map(p => ({
          index: p.index,
          pageNumber: p.pageNumber
        })))
      }
    }, { deep: true })

    // ===== 네비게이션 관련 메서드 =====

    /**
     * 뒤로가기 처리
     */
    const goBack = () => {
      if (pdfFile.value) {
        // PDF 편집에서 뒤로가기: PDF 업로드 단계로
        pdfFile.value = null
        pdfPages.value = []
        itemProcessingStore.setPdfFile(null)
      } else if (selectedTextbook.value) {
        // 교과서 선택에서 뒤로가기: 교과서 선택 단계로
        selectedTextbook.value = null
        itemProcessingStore.selectTextbook(null)
      }
    }

    /**
     * 다음 단계로 이동
     */
    const nextStep = async () => {
      try {
        // 로딩 상태 시작
        itemProcessingStore.loading = true


        // 편집된 PDF를 서버에 업로드
        const uploadResult = await itemProcessingStore.uploadProcessedPdf()

        console.log('PDF 업로드 완료:', uploadResult)

        // 성공 메시지 표시 (Toast 등)
        // showSuccessMessage('PDF가 성공적으로 저장되었습니다.')

        // 다음 단계로 이동
        router.push('/item-processing/area-selection')

      } catch (error) {
        console.error('PDF 저장 실패:', error)
        errorHandler.handleGeneralError(error, 'PDF 서버 저장')
      } finally {
        itemProcessingStore.loading = false
      }
    }

    /**
     * PDF 편집 화면으로 이동
     */
    const goToPdfEdit = () => {
      if (pdfFile.value) {
        // PDF 편집 모드로 전환 (v-else 조건으로 자동 처리)
        console.log('PDF 편집 화면으로 이동')
      }
    }

    return {
      // 상태
      loading,
      error,
      textbooks,
      groupedTextbooks,
      subjects,
      selectedSubject,
      selectedTextbook,
      pdfFile,
      pdfPages,
      errorHandler,

      // 메서드
      selectSubject,
      selectTextbook,
      handlePdfFile,
      movePage,
      removePage,
      removeMultiplePages,
      goBack,
      nextStep,
      goToPdfEdit,
    }
  },
}
</script>

<style scoped>
/* 메인 컨테이너 스타일 */
.item-processing-container {
  min-height: 100vh;
  background: #f8fafc;
}

/* 페이지 헤더 스타일 */
.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.container {
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* 메인 컨텐츠 영역 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.content-wrapper {
  /* 컨텐츠 래퍼에 대한 추가 스타일이 필요한 경우 여기에 추가 */
}

/* 에러 오버레이 */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.error-header h3 {
  margin: 0;
  color: #dc2626;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.error-content {
  margin-bottom: 1.5rem;
}

.error-content p {
  margin: 0 0 0.5rem 0;
  color: #374151;
  line-height: 1.5;
}

.error-context {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

.error-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 2rem 1rem;
  }

  .error-modal {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
