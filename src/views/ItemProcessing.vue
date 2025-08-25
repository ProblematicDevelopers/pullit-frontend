<template>
  <div class="item-processing-container bg-light min-vh-100">
    <!-- 페이지 헤더 -->
    <div class="page-header bg-white border-bottom py-5 mb-0">
      <div class="container">
        <h1 class="page-title fw-bold text-dark mb-2">문제 등록</h1>
        <p class="page-subtitle text-muted mb-0">교과서를 선택하고 PDF를 업로드하여 문제를 가공하세요</p>
      </div>
    </div>

    <!-- 단계별 진행 표시기 -->
    <div class="progress-stepper-container bg-white border-bottom py-4 mb-4">
      <div class="container">
        <div class="progress-stepper d-flex justify-content-center align-items-center">
          <div class="step-item d-flex align-items-center" :class="{ active: true, completed: selectedTextbook }">
            <div class="step-number rounded-circle d-flex align-items-center justify-content-center fw-bold">1</div>
            <span class="step-label ms-2 fw-medium">교과서 선택</span>
            <div class="step-connector ms-3" v-if="selectedTextbook"></div>
          </div>

          <div class="step-item d-flex align-items-center" :class="{ active: selectedTextbook, completed: pdfFile }">
            <div class="step-number rounded-circle d-flex align-items-center justify-content-center fw-bold">2</div>
            <span class="step-label ms-2 fw-medium">PDF 업로드</span>
            <div class="step-connector ms-3" v-if="pdfFile"></div>
          </div>

          <div class="step-item d-flex align-items-center" :class="{ active: pdfFile && !isConvertingPdf, completed: showOcrEditor }">
            <div class="step-number rounded-circle d-flex align-items-center justify-content-center fw-bold">3</div>
            <span class="step-label ms-2 fw-medium">PDF 편집</span>
            <div class="step-connector ms-3" v-if="showOcrEditor"></div>
          </div>

          <div class="step-item d-flex align-items-center" :class="{ active: showOcrEditor }">
            <div class="step-number rounded-circle d-flex align-items-center justify-content-center fw-bold">4</div>
            <span class="step-label ms-2 fw-medium">OCR 편집</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="main-content container py-5">
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
          v-else-if="selectedTextbook && !pdfFile"
          :selected-textbook="selectedTextbook"
          @file-selected="handlePdfFile"
        />

        <!-- PDF 변환 로딩 상태 -->
        <div v-else-if="isConvertingPdf" class="conversion-loading d-flex justify-content-center align-items-center bg-white rounded-4 border p-5" style="min-height: 400px;">
          <div class="loading-content text-center">
            <div class="loading-icon fs-1 mb-3">🔄</div>
            <h3 class="fw-semibold text-dark mb-4">PDF 변환 중...</h3>
            <div class="progress-info bg-light rounded-3 p-4 border">
              <div class="progress mb-3" style="height: 12px;">
                <div
                  class="progress-bar bg-primary"
                  :style="{ width: `${(convertedPdfPages / totalPdfPages) * 100}%` }"
                  role="progressbar"
                  :aria-valuenow="convertedPdfPages"
                  :aria-valuemin="0"
                  :aria-valuemax="totalPdfPages"
                ></div>
              </div>
              <div class="progress-text d-flex justify-content-between text-muted small mb-3">
                <span>{{ convertedPdfPages }}/{{ totalPdfPages }} 페이지</span>
              </div>
              <div class="progress-details d-flex justify-content-between text-muted small">
                <span>현재 페이지: {{ currentPdfPage }}</span>
                <span v-if="estimatedPdfTime">{{ estimatedPdfTime }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3단계: PDF 편집 -->
        <PdfEditor
          v-else-if="!showOcrEditor && !isGeneratingPdf"
          :pdf-pages="pdfPages"
          @page-removed="removePage"
          @page-moved="movePage"
          @pages-removed="removeMultiplePages"
          @go-back="goBack"
          @next-step="goToOcrEditor"
        />

        <!-- PDF 생성 로딩 상태 -->
        <div v-else-if="isGeneratingPdf" class="pdf-generation-loading d-flex justify-content-center align-items-center bg-white rounded-4 border p-5" style="min-height: 400px;">
          <div class="loading-content text-center">
            <div class="loading-icon fs-1 mb-3">📄</div>
            <h3 class="fw-semibold text-dark mb-4">PDF 생성 중...</h3>
            <div class="progress-info bg-light rounded-3 p-4 border">
              <div class="progress-stage fw-semibold text-primary mb-3">{{ currentPdfStage }}</div>
              <div class="progress mb-3" style="height: 12px;">
                <div
                  class="progress-bar bg-primary"
                  :style="{ width: `${Math.min(pdfGenerationProgress, 100)}%` }"
                  role="progressbar"
                  :aria-valuenow="Math.min(pdfGenerationProgress, 100)"
                  :aria-valuemin="0"
                  :aria-valuemax="100"
                ></div>
              </div>
              <div class="progress-text d-flex justify-content-between text-muted small mb-3">
                <span>진행률: {{ Math.min(pdfGenerationProgress, 100) }}%</span>
              </div>
              <div class="progress-details d-flex justify-content-center text-muted small">
                <span>{{ currentPdfStage }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4단계: OCR 편집 -->
        <PdfOcrEditor
          v-else
          :pdf-pages="pdfPages"
          :presigned-url="presignedUrl"
          :file-id="fileId"
          :subject-code="selectedSubject"
          @go-back="goBackFromOcr"
        />
      </div>
    </div>

    <!-- 에러 메시지 표시 -->
    <div v-if="errorHandler.hasError()" class="error-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0, 0, 0, 0.5); z-index: 1050;">
      <div class="error-modal bg-white rounded-4 p-4 shadow-custom-lg" style="max-width: 500px; width: 90%;">
        <div class="error-header d-flex justify-content-between align-items-center mb-3">
          <h3 class="text-danger fw-semibold mb-0">오류 발생</h3>
          <button @click="errorHandler.clearError()" class="btn-close" aria-label="Close"></button>
        </div>
        <div class="error-content mb-4">
          <p class="text-dark mb-2">{{ errorHandler.getErrorMessage() }}</p>
          <p class="error-context text-muted small fst-italic mb-0">{{ errorHandler.getErrorContext() }}</p>
        </div>
        <div class="error-actions d-flex justify-content-end">
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

// 새로 분리된 컴포넌트들 import
import TextbookSelection from '@/components/item-process/TextbookSelection.vue'
import PdfUpload from '@/components/item-process/PdfUpload.vue'
import PdfEditor from '@/components/item-process/PdfEditor.vue'
import PdfOcrEditor from '@/components/item-process/PdfOcrEditor.vue'

// 새로 생성한 composable들 import
import { useItemProcessingError } from '@/composables/item-process/useItemProcessingError'

export default {
  name: 'ItemProcessing',
  components: {
    TextbookSelection,
    PdfUpload,
    PdfEditor,
    PdfOcrEditor
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
    const showOcrEditor = ref(false)
    const presignedUrl = ref('')
    const fileId = ref(null)

    // PDF 변환 로딩 상태
    const isConvertingPdf = ref(false)
    const convertedPdfPages = ref(0)
    const totalPdfPages = ref(0)
    const currentPdfPage = ref(0)
    const pdfConversionStartTime = ref(null)

    // PDF 생성 로딩 상태
    const isGeneratingPdf = ref(false)
    const pdfGenerationProgress = ref(0)
    const currentPdfStage = ref('PDF 변환')

    // Store에서 데이터 가져오기 (computed로 반응성 보장)
    const loading = computed(() => itemProcessingStore.loading)
    const error = computed(() => itemProcessingStore.error)
    const textbooks = computed(() => itemProcessingStore.textbooks)
    const groupedTextbooks = computed(() => itemProcessingStore.groupedTextbooks)
    const subjects = computed(() => itemProcessingStore.subjects)

    // PDF 변환 예상 시간 계산
    const estimatedPdfTime = computed(() => {
      if (!pdfConversionStartTime.value || convertedPdfPages.value === 0) return null

      const elapsed = Date.now() - pdfConversionStartTime.value
      const avgTimePerPage = elapsed / convertedPdfPages.value
      const remainingPages = totalPdfPages.value - convertedPdfPages.value
      const estimatedRemaining = avgTimePerPage * remainingPages

      if (estimatedRemaining < 60000) { // 1분 미만
        return `${Math.ceil(estimatedRemaining / 1000)}초 남음`
      } else {
        return `${Math.ceil(estimatedRemaining / 60000)}분 남음`
      }
    })

    // Composable 초기화
    const errorHandler = useItemProcessingError()

    // 컴포넌트 마운트 시 실행
    onMounted(async () => {
      try {
        await itemProcessingStore.fetchTextbooks()
      } catch (error) {
        errorHandler.handleGeneralError(error, '교과서 목록 로드')
      }
    })

    // 컴포넌트 언마운트 시 실행
    onUnmounted(() => {
      // Blob URL들 정리
      if (itemProcessingStore.cleanupBlobUrls) {
        itemProcessingStore.cleanupBlobUrls()
      }
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
     * @param {Object} textbook - 선택된 교과서 객체
     */
    const selectTextbook = (textbook) => {
      selectedTextbook.value = textbook
      // 교과서 선택 시 과목 코드도 함께 설정
      if (textbook.areaCode) {
        selectedSubject.value = textbook.areaCode
      }
      itemProcessingStore.selectTextbook(textbook)
    }

    // ===== PDF 업로드 관련 메서드 =====

    /**
     * PDF 파일 처리 및 페이지 분리
     * @param {Object} fileData - 업로드된 PDF 파일 데이터 { file: File, images: Array }
     */
    const handlePdfFile = async (fileData) => {
      // pages 배열을 try 블록 밖에서 선언
      const pages = []

      try {
        // fileData에서 file과 images 추출
        const { file, images } = fileData

        if (!file) {
          throw new Error('파일 데이터가 누락되었습니다.')
        }

        pdfFile.value = file
        itemProcessingStore.setPdfFile(file)

        // presigned URL 설정 (실제 구현에서는 서버에서 받아와야 함)
        presignedUrl.value = 'https://example.com/temp-pdf-url'

        // fileId 설정 (실제 구현에서는 서버 응답에서 받아와야 함)
        fileId.value = Date.now() // 임시 ID

        // images가 비어있으면 PDF를 이미지로 변환
        if (!images || images.length === 0) {
          // 로딩 상태 시작
          isConvertingPdf.value = true
          convertedPdfPages.value = 0
          currentPdfPage.value = 0
          pdfConversionStartTime.value = Date.now()

          // PDF.js 라이브러리 동적 로드
          const pdfjsLib = await import('pdfjs-dist')

          // PDF.js 워커 설정
          const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry')
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

                  // PDF 파일을 ArrayBuffer로 읽기
        const arrayBuffer = await file.arrayBuffer()

        // PDF 문서 로드
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        totalPdfPages.value = pdfDoc.numPages

          // 각 페이지를 이미지로 변환
          for (let pageNum = 1; pageNum <= totalPdfPages.value; pageNum++) {
            currentPdfPage.value = pageNum

            const page = await pdfDoc.getPage(pageNum)

            // 고해상도로 뷰포트 설정 (300 DPI로 조정)
            const scale = 4.17 // 300 DPI = 72 DPI * 4.17
            const viewport = page.getViewport({ scale: scale })

            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')

            canvas.width = viewport.width
            canvas.height = viewport.height



            // Canvas 렌더링 품질을 극한으로 설정
            context.imageSmoothingEnabled = true
            context.imageSmoothingQuality = 'high'

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            }
            await page.render(renderContext).promise

            // 고품질 PNG로 변환 (품질 조정)
            // PNG: 무손실이지만 파일 크기가 큼, JPEG: 손실 압축이지만 파일 크기가 작음
            const imageDataUrl = canvas.toDataURL('image/png', 0.9)
            // JPEG 테스트용 (파일 크기 절약): const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)



            pages.push({
              index: pageNum - 1,
              pageNumber: pageNum,
              preview: imageDataUrl,
              originalPage: pageNum - 1,
              width: viewport.width,
              height: viewport.height
            })

            convertedPdfPages.value = pageNum
          }

          // 변환 완료 후 총 크기 정보만 간단히 로깅
          const totalImageSizeKB = pages.reduce((total, page) => {
            if (page.preview) {
              return total + ((page.preview.length * 0.75) / 1024)
            }
            return total
          }, 0)

          console.log(`📊 PDF 변환 완료: ${pages.length}페이지, 총 ${(totalImageSizeKB / 1024).toFixed(2)}MB`)

          // 로딩 상태 종료
          isConvertingPdf.value = false
        } else {
          // 이미 변환된 이미지들을 사용하여 페이지 데이터 생성
          pages.push(...images.map((img, index) => ({
            index: index,
            pageNumber: index + 1,
            preview: img.preview,
            originalPage: index,
            width: img.width,
            height: img.height
          })))
        }

        pdfPages.value = pages
        itemProcessingStore.setPdfPages(pages)

      } catch (error) {
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
     * @param {Object} moveInfo - 이동 정보 { fromIndex: number, toIndex: number }
     */
    const movePage = (moveInfo) => {
      const { fromIndex, toIndex } = moveInfo

      // Store에 페이지 이동 알림
      if (itemProcessingStore.movePage) {
        itemProcessingStore.movePage(fromIndex, toIndex)
      }
    }

    /**
     * 단일 페이지 삭제
     * @param {number} pageIndex - 삭제할 페이지 인덱스
     */
    const removePage = (pageIndex) => {
      itemProcessingStore.removePage(pageIndex)
    }

    /**
     * 여러 페이지 일괄 삭제
     * @param {Array<number>} pageIndexes - 삭제할 페이지 인덱스 배열
     */
    const removeMultiplePages = (pageIndexes) => {
      // Store의 일괄 삭제 메서드만 사용 (로컬 상태는 Store 변경 감지로 자동 업데이트)
      if (itemProcessingStore.removeMultiplePages) {
        itemProcessingStore.removeMultiplePages(pageIndexes)
      } else {
        // Store에 메서드가 없는 경우에만 로컬 상태 직접 업데이트
        const sortedIndexes = [...pageIndexes].sort((a, b) => b - a)
        sortedIndexes.forEach(index => {
          pdfPages.value.splice(index, 1)
        })
      }
    }

    // Store의 pdfPages 변경을 감지하여 로컬 상태 동기화
    watch(() => itemProcessingStore.pdfPages, (newPages) => {
      if (newPages && Array.isArray(newPages)) {
        // 페이지 인덱스 재정렬 (삭제 후 인덱스 꼬임 방지)
        const updatedPages = newPages.map((page, newIndex) => ({
          ...page,
          index: newIndex,
          pageNumber: newIndex + 1
        }))

        pdfPages.value = updatedPages
      }
    }, { deep: true, immediate: true })

    // 로컬 pdfPages 변경을 감지하여 자동으로 다음 단계로 진행
    watch(pdfPages, (newPages) => {
      if (newPages && Array.isArray(newPages) && newPages.length > 0) {
        // PDF 편집 화면으로 자동 진행 (v-else 조건으로 처리됨)
      }
    }, { deep: true })

    // 로컬 pdfPages 변경을 Store에 반영 (양방향 동기화)
    watch(pdfPages, (newPages) => {
      if (newPages && Array.isArray(newPages)) {
        // Store와 길이가 다른 경우에만 업데이트 (무한 루프 방지)
        if (newPages.length !== itemProcessingStore.pdfPages.length) {
          itemProcessingStore.setPdfPages(newPages)
        }
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
        await itemProcessingStore.uploadProcessedPdf()

        // 성공 메시지 표시 (Toast 등)
        // showSuccessMessage('PDF가 성공적으로 저장되었습니다.')

        // 다음 단계로 이동
        router.push('/item-processing/area-selection')

      } catch (error) {
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
      }
    }

    /**
     * OCR 편집 화면으로 이동
     */
    const goToOcrEditor = async () => {
      if (!selectedSubject.value) {
        if (selectedTextbook.value && selectedTextbook.value.areaCode) {
          selectedSubject.value = selectedTextbook.value.areaCode
        } else {
          errorHandler.handleError('과목을 먼저 선택해주세요.', '과목 정보 누락')
          return
        }
      }

      try {
        // 로딩 상태 즉시 시작
        isGeneratingPdf.value = true
        pdfGenerationProgress.value = 0
        currentPdfStage.value = 'PDF 변환 시작'

        // 단계별 진행률 시뮬레이션 (실제 진행률이 없는 경우)
        const simulateProgress = () => {
          const stages = [
            { stage: 'PDF 변환 시작', progress: 10 },
            { stage: '페이지 처리 중', progress: 30 },
            { stage: '이미지 최적화', progress: 50 },
            { stage: 'PDF 생성 중', progress: 80 },
            { stage: '최종 검증', progress: 95 }
          ]

          let currentStageIndex = 0

          const progressInterval = setInterval(() => {
            if (currentStageIndex < stages.length) {
              const stage = stages[currentStageIndex]
              currentPdfStage.value = stage.stage
              pdfGenerationProgress.value = stage.progress
              currentStageIndex++
            } else {
              clearInterval(progressInterval)
            }
          }, 1000) // 1초마다 단계 변경

          return progressInterval
        }

        // 진행률 시뮬레이션 시작
        const progressInterval = simulateProgress()

        // PDF 생성 진행률 콜백 (실제 구현에서 사용)
        const progressCallback = (progress) => {
          if (progress && typeof progress.percentage === 'number') {
            pdfGenerationProgress.value = Math.min(progress.percentage, 100)
            currentPdfStage.value = progress.stage || currentPdfStage.value
          }
        }

        // 실제 PDF 업로드 (진행률 콜백이 작동하지 않는 경우를 대비)
        await itemProcessingStore.uploadProcessedPdf(progressCallback)

        // 진행률을 100%로 설정
        pdfGenerationProgress.value = 100
        currentPdfStage.value = '완료'

        // 진행률 시뮬레이션 정리
        clearInterval(progressInterval)

        // 잠시 완료 상태를 보여준 후 다음 단계로
        setTimeout(() => {
          alert('편집된 PDF가 성공적으로 업로드되었습니다.')
          // 로딩 상태 종료 후 OCR 편집 화면으로 이동
          isGeneratingPdf.value = false
          showOcrEditor.value = true
        }, 1000)

      } catch (error) {
        errorHandler.handleGeneralError(error, '편집된 PDF 업로드')
        // 에러 발생 시 로딩 상태 종료
        isGeneratingPdf.value = false
        return
      }
    }

    /**
     * OCR 편집에서 뒤로가기
     */
    const goBackFromOcr = () => {
      showOcrEditor.value = false
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
      showOcrEditor,
      presignedUrl,
      fileId,
      errorHandler,
      estimatedPdfTime,
      isConvertingPdf,
      convertedPdfPages,
      totalPdfPages,
      currentPdfPage,
      isGeneratingPdf,
      pdfGenerationProgress,
      currentPdfStage,

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
      goToOcrEditor,
      goBackFromOcr,
    }
  },
}
</script>

<style scoped>
/* 단계별 진행 표시기 스타일 */
.progress-stepper-container {
  border-bottom: 1px solid #e2e8f0;
}

.progress-stepper {
  gap: 2rem;
}

.step-item {
  position: relative;
  transition: all 0.3s ease;
}

.step-number {
  width: 40px;
  height: 40px;
  background-color: #e2e8f0;
  color: #64748b;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.step-label {
  color: #64748b;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.step-connector {
  width: 60px;
  height: 2px;
  background-color: #e2e8f0;
  transition: all 0.3s ease;
}

/* 활성 상태 */
.step-item.active .step-number {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.step-item.active .step-label {
  color: #1e293b;
  font-weight: 600;
}

/* 완료 상태 */
.step-item.completed .step-number {
  background-color: #10b981;
  color: white;
  border-color: #10b981;
}

.step-item.completed .step-label {
  color: #10b981;
  font-weight: 600;
}

.step-item.completed .step-connector {
  background-color: #10b981;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .progress-stepper {
    flex-direction: column;
    gap: 1rem;
  }

  .step-connector {
    display: none;
  }

  .step-item {
    flex-direction: column;
    text-align: center;
  }

  .step-label {
    margin-top: 0.5rem;
  }
}

/* 부트스트랩으로 대체할 수 없는 일부 커스텀 스타일 */
.page-title {
  font-size: 1.875rem;
  color: #1e293b;
}

.page-subtitle {
  color: #64748b;
}

/* 로딩 상태 스타일 - TextbookSelection과 일관성 */
.conversion-loading,
.pdf-generation-loading {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-content {
  max-width: 500px;
}

.loading-icon {
  color: #3b82f6;
}

.progress-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.progress-stage {
  color: #3b82f6;
}

.progress {
  background-color: #e2e8f0;
  border-radius: 6px;
}

.progress-bar {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 6px;
}

/* 에러 모달 스타일 - TextbookSelection과 일관성 */
.error-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.error-modal {
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.error-header h3 {
  color: #dc2626;
}

/* 커스텀 그림자 효과 */
.shadow-custom-lg {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
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
