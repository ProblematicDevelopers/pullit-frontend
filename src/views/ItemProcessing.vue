<template>
  <div class="item-processing-container bg-light min-vh-100">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">문제 등록</h1>
        <p class="page-subtitle">교과서를 선택하고 PDF를 업로드하여 문제를 가공하세요</p>
      </div>
    </div>

    <!-- 파일 히스토리 에러 알림 -->
    <div v-if="showFileHistoryError" class="alert alert-warning alert-dismissible fade show mx-3 mt-3" role="alert">
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <div>
          <strong>파일 히스토리 생성 실패</strong>
          <p class="mb-0 mt-1 small">{{ fileHistoryErrorMessage }}</p>
          <p class="mb-0 mt-1 small text-muted">PDF 업로드는 성공했지만, 파일 히스토리 생성에 실패했습니다. 이는 서버 측 문제일 수 있습니다.</p>
        </div>
      </div>
      <button
        type="button"
        class="btn-close"
        @click="hideFileHistoryError"
        aria-label="Close"
      ></button>
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

          <div class="step-item d-flex align-items-center" :class="{ active: pdfFile, completed: showOcrEditor }">
            <div class="step-number rounded-circle d-flex align-items-center justify-content-center fw-bold">3</div>
            <span class="step-label ms-2 fw-medium">PDF 편집</span>
            <div class="step-connector ms-3" v-if="showOcrEditor"></div>
          </div>

          <div class="step-item d-flex align-items-center" :class="{ active: showOcrEditor }">
            <div class="step-number rounded-circle d-flex align-items-center justify-content-center fw-bold">4</div>
            <span class="step-label ms-2 fw-medium">문제 추출</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="main-content container py-5">
      <div class="content-wrapper">
        <!-- 단계별 컴포넌트 렌더링 -->

        <!-- 0단계: 방식 선택 -->
        <ProcessingMethodSelection
          v-if="!processingMethod"
          @method-selected="selectProcessingMethod"
        />

        <!-- 1-1단계: 교과서 선택 (새 파일 업로드) -->
        <TextbookSelection
          v-else-if="processingMethod === 'new' && !selectedTextbook"
          :loading="loading"
          :subjects="subjectCategories"
          :grouped-textbooks="groupedTextbooks"
          :selected-subject="selectedSubject"
          @select-subject="selectSubject"
          @select-textbook="selectTextbook"
          @go-back="goBackToMethodSelection"
        />

        <!-- 1-2단계: 기존 파일 선택 -->
        <ExistingFileSelection
          v-else-if="processingMethod === 'existing' && !selectedFile"
          :loading="loadingFileHistory"
          :file-histories="fileHistories"
          :subjects="subjectOptions"
          @go-back="goBackToMethodSelection"
          @method-selected="selectProcessingMethod"
          @file-selected="selectExistingFile"
        />

        <!-- 서버 에러 발생 시 대안 제시 -->
        <div v-else-if="processingMethod === 'existing' && errorHandler.hasError() && errorHandler.isServerError()" class="server-error-fallback bg-light border rounded p-4 text-center">
          <div class="mb-3">
            <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 2rem;"></i>
          </div>
          <h4 class="text-warning mb-3">서버 연결 문제</h4>
          <p class="text-muted mb-4">
            기존 파일 목록을 불러올 수 없습니다. 서버에 일시적인 문제가 있을 수 있습니다.
            <br><small class="text-muted">에러 코드: {{ getErrorStatusCode() }}</small>
          </p>

          <!-- 에러 상세 정보 (개발 모드에서만 표시) -->
          <div v-if="isDevelopment" class="alert alert-info text-start mb-3">
            <small>
              <strong>에러 상세:</strong><br>
              {{ errorHandler.getErrorMessage() }}<br>
              <strong>상태 코드:</strong> {{ getErrorStatusCode() }}<br>
              <strong>시간:</strong> {{ new Date().toLocaleString('ko-KR') }}
              <span v-if="retryCount > 0">
                <br><strong>재시도 횟수:</strong> {{ retryCount }}회
                <br><strong>마지막 재시도:</strong> {{ lastRetryTime ? lastRetryTime.toLocaleString('ko-KR') : 'N/A' }}
              </span>
            </small>
          </div>

          <div class="d-flex gap-2 justify-content-center">
            <button @click="retryFileHistoryLoad" class="btn btn-warning" :disabled="loadingFileHistory">
              <i class="bi bi-arrow-clockwise me-2"></i>
              {{ loadingFileHistory ? '재시도 중...' : '다시 시도' }}
            </button>
            <button @click="switchToNewFileUpload" class="btn btn-primary">
              <i class="bi bi-upload me-2"></i>
              새 파일 업로드
            </button>
          </div>
        </div>

        <!-- 2단계: PDF 업로드 (새 파일 업로드 방식만) -->
        <PdfUpload
          v-else-if="processingMethod === 'new' && selectedTextbook && !pdfFile"
          :selected-textbook="selectedTextbook"
          @file-selected="handlePdfFile"
        />

        <!-- PDF 업로드 로딩 상태 -->
        <div v-else-if="loading" class="conversion-loading d-flex justify-content-center align-items-center bg-white rounded-4 border p-5" style="min-height: 400px;">
          <div class="loading-content text-center">
            <div class="loading-icon fs-1 mb-3">📤</div>
            <h3 class="fw-semibold text-dark mb-4">PDF 업로드 중...</h3>
            <div class="progress-info bg-light rounded-3 p-4 border">
              <div class="progress mb-3" style="height: 12px;">
                <div class="progress-bar bg-primary progress-bar-striped progress-bar-animated" style="width: 100%"></div>
              </div>
              <div class="progress-text text-muted small mb-3">
                <span>서버에 PDF 파일을 업로드하고 있습니다...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PDF 변환 로딩 상태는 제거 (서버에서 이미지 변환) -->

        <!-- 3단계: PDF 편집 -->
        <PdfEditor
          v-else-if="!showOcrEditor && !isGeneratingPdf && !loading && (pdfFile || selectedFile)"
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

            </div>
          </div>
        </div>

        <!-- 4단계: OCR 편집 -->
        <PdfOcrEditor
          v-else-if="showOcrEditor && pdfPages && pdfPages.length > 0"
          :pdf-pages="pdfPages"
          :presigned-url="presignedUrl"
          :file-id="fileId"
          :subject-code="selectedSubject"
          :selected-textbook="selectedTextbook"
          :is-new-file="processingMethod === 'new' && !selectedFile"
          :selected-file="selectedFile"
          @go-back="goBackFromOcr"
        />
        <!-- 디버깅용 로그 -->
        <div v-if="showOcrEditor" class="debug-info" style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-size: 12px;">
          <strong>Debug Info:</strong><br>
          processingMethod: {{ processingMethod }}<br>
          selectedFile: {{ selectedFile ? '있음' : '없음' }}<br>
          selectedTextbook: {{ selectedTextbook ? '있음' : '없음' }}<br>
          showOcrEditor: {{ showOcrEditor }}
        </div>
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
        <div class="error-actions d-flex justify-content-end gap-2">
          <!-- 서버 에러인 경우 재시도 버튼 표시 -->
          <button
            v-if="errorHandler.isServerError()"
            @click="retryFileHistoryLoad"
            class="btn btn-warning"
            :disabled="loadingFileHistory"
          >
            <i class="bi bi-arrow-clockwise me-2"></i>
            {{ loadingFileHistory ? '재시도 중...' : '재시도' }}
          </button>
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
import { useSubjectStore } from '@/store/subjectStore.js'
import { fileHistoryAPI } from '@/services/fileHistoryApi.js'

// 새로 분리된 컴포넌트들 import
import ProcessingMethodSelection from '@/components/item-process/ProcessingMethodSelection.vue'
import ExistingFileSelection from '@/components/item-process/ExistingFileSelection.vue'
import TextbookSelection from '@/components/item-process/TextbookSelection.vue'
import PdfUpload from '@/components/item-process/PdfUpload.vue'
import PdfEditor from '@/components/item-process/PdfEditor.vue'
import PdfOcrEditor from '@/components/item-process/PdfOcrEditor.vue'

// 새로 생성한 composable들 import
import { useItemProcessingError } from '@/composables/item-process/useItemProcessingError'

export default {
  name: 'ItemProcessing',
  components: {
    ProcessingMethodSelection,
    ExistingFileSelection,
    TextbookSelection,
    PdfUpload,
    PdfEditor,
    PdfOcrEditor
  },
  setup() {
    // Store 및 Router 초기화
    const itemProcessingStore = useItemProcessingStore()
    const subjectStore = useSubjectStore()
    const router = useRouter()

    // 처리 방식 관련 상태
    const processingMethod = ref(null) // 'new' | 'existing'
    const selectedFile = ref(null) // 기존 파일 선택 시
    const fileHistories = ref([])
    const loadingFileHistory = ref(false)

    // 기존 방식으로 복원 (문제 해결 후 다시 개선)
    const selectedTextbook = ref(null)
    const pdfFile = ref(null)
    const pdfPages = ref([])
    const selectedSubject = ref(null)
    const showOcrEditor = ref(false)
    const presignedUrl = ref('')
    const fileId = ref(null)

    // PDF 변환 관련 변수들은 제거 (서버에서 이미지 변환)
    // const isConvertingPdf = ref(false)
    // const convertedPdfPages = ref(0)
    // const totalPdfPages = ref(0)
    // const currentPdfPage = ref(0)
    // const pdfConversionStartTime = ref(null)

    // PDF 생성 로딩 상태
    const isGeneratingPdf = ref(false)
    const pdfGenerationProgress = ref(0)
    const currentPdfStage = ref('PDF 변환')

    // Store에서 데이터 가져오기 (computed로 반응성 보장)
    const loading = computed(() => itemProcessingStore.loading)
    const error = computed(() => itemProcessingStore.error)
    const textbooks = computed(() => itemProcessingStore.textbooks)
    const groupedTextbooks = computed(() => itemProcessingStore.groupedTextbooks)
    const subjects = computed(() => subjectStore.list)

    // 과목 옵션 (기존 파일 선택에서 사용)
    const subjectOptions = computed(() => {
      return subjects.value?.map(subject => ({
        code: subject.areaCode,
        name: subject.areaName
      })) || []
    })

    // itemProcessingStore의 SUBJECTS 객체 사용
    const subjectCategories = computed(() => {
      if (!groupedTextbooks.value) return {}

      const categories = {}
      Object.keys(groupedTextbooks.value).forEach(areaCode => {
        if (groupedTextbooks.value[areaCode]?.length > 0) {
          // 과목별 이름과 색상 설정
          let name = '기타'
          let color = '#6b7280'

          if (areaCode === 'MA') { name = '수학'; color = '#3b82f6' }
          else if (areaCode === 'KO') { name = '국어'; color = '#ef4444' }
          else if (areaCode === 'EN') { name = '영어'; color = '#10b981' }
          else if (areaCode === 'SO') { name = '사회'; color = '#f59e0b' }
          else if (areaCode === 'SC') { name = '과학'; color = '#84cc16' }
          else if (areaCode === 'HS') { name = '역사'; color = '#8b5cf6' }
          else if (areaCode === 'MO') { name = '도덕'; color = '#06b6d4' }

          categories[areaCode] = { name, color }
        }
      })

      return categories
    })

    // 파일 히스토리 에러 관련 computed 속성
    const showFileHistoryError = computed(() => itemProcessingStore.showFileHistoryError)
    const fileHistoryErrorMessage = computed(() => itemProcessingStore.fileHistoryErrorMessage)

    // 재시도 관련 상태
    const retryCount = ref(0)
    const lastRetryTime = ref(null)


    // Composable 초기화
    const errorHandler = useItemProcessingError()

    // 개발 모드 확인
    const isDevelopment = computed(() => import.meta.env.DEV)

    // 컴포넌트 마운트 시 실행
    onMounted(async () => {
      try {
        await Promise.all([
          itemProcessingStore.fetchTextbooks(),
          subjectStore.fetchSubjects()
        ])

        // 🔧 OCR API 테스트 - 저장된 문항들 조회 테스트
        await testOcrApiFunctions()
      } catch (error) {
        errorHandler.handleGeneralError(error, '교과서 목록 로드')
      }
    })

    /**
     * OCR API 기능 테스트 함수
     * 저장된 문항, OCR 히스토리, 완료된 영역 조회 기능 테스트
     */
    const testOcrApiFunctions = async () => {
      try {
        console.log('🧪 [ItemProcessing] OCR API 테스트 시작')

        // 1. 저장된 처리된 문항들 조회 테스트
        const { ocrApi } = await import('@/services/ocrApi')
        const processedItems = await ocrApi.getProcessedItems({
          page: 0,
          size: 10,
          subjectCode: 'MA' // 수학 과목 테스트
        })
        console.log('✅ [ItemProcessing] 저장된 문항 조회 성공:', processedItems)

        // 2. 첫 번째 문항이 있으면 상세 조회 테스트
        if (processedItems.data && processedItems.data.length > 0) {
          const firstItemId = processedItems.data[0].id
          const itemDetail = await ocrApi.getProcessedItem(firstItemId)
          console.log('✅ [ItemProcessing] 문항 상세 조회 성공:', itemDetail)
        }

        // 3. OCR 히스토리 조회 테스트 (임시 파일 ID 사용)
        try {
          const ocrHistory = await ocrApi.getOcrHistory(1) // 임시 파일 ID
          console.log('✅ [ItemProcessing] OCR 히스토리 조회 성공:', ocrHistory)
        } catch (error) {
          console.log('ℹ️ [ItemProcessing] OCR 히스토리 조회 (파일 ID 1 없음):', error.message)
        }

        // 4. 완료된 OCR 영역 조회 테스트
        try {
          const completedRegions = await ocrApi.getCompletedOcrRegions(1) // 임시 파일 ID
          console.log('✅ [ItemProcessing] 완료된 OCR 영역 조회 성공:', completedRegions)
        } catch (error) {
          console.log('ℹ️ [ItemProcessing] 완료된 OCR 영역 조회 (파일 ID 1 없음):', error.message)
        }

        console.log('🎉 [ItemProcessing] OCR API 테스트 완료')

      } catch (error) {
        console.error('❌ [ItemProcessing] OCR API 테스트 실패:', error)
        // 에러가 있어도 앱 로딩은 계속 진행
      }
    }

    // 컴포넌트 언마운트 시 실행
    onUnmounted(() => {
      // Blob URL들 정리
      if (itemProcessingStore.cleanupBlobUrls) {
        itemProcessingStore.cleanupBlobUrls()
      }
    })

    // ===== 처리 방식 선택 관련 메서드 =====

    /**
     * 처리 방식 선택
     * @param {string} method - 'new' 또는 'existing'
     */
    const selectProcessingMethod = async (method) => {
      processingMethod.value = method

      if (method === 'existing') {
        await loadFileHistories()
      }
    }

    /**
     * 방식 선택으로 돌아가기
     */
    const goBackToMethodSelection = () => {
      processingMethod.value = null
      selectedTextbook.value = null
      selectedFile.value = null
      pdfFile.value = null
      pdfPages.value = []
      selectedSubject.value = null
      itemProcessingStore.selectTextbook(null)
    }

        /**
     * 파일 히스토리 목록 로드
     */
    const loadFileHistories = async () => {
      try {
        loadingFileHistory.value = true
        const response = await itemProcessingStore.fetchFileHistories()
        fileHistories.value = response || []
      } catch (error) {
        console.error('파일 히스토리 로드 실패:', error)

        // 서버 에러인 경우 더 구체적인 메시지 표시
        if (error.response && error.response.status === 500) {
          errorHandler.setError(
            '서버 내부 오류가 발생했습니다.',
            '파일 목록을 불러오는 중 서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
            error
          )
        } else if (error.response && error.response.status === 401) {
          errorHandler.setError(
            '인증이 필요합니다.',
            '로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인해주세요.',
            error
          )
        } else if (error.response && error.response.status === 403) {
          errorHandler.setError(
            '접근 권한이 없습니다.',
            '이 기능에 접근할 권한이 없습니다.',
            error
          )
        } else if (error.response && error.response.status >= 500) {
          errorHandler.setError(
            '서버 오류가 발생했습니다.',
            '일시적인 서버 문제로 파일 목록을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
            error
          )
        } else {
          errorHandler.handleGeneralError(error, '파일 목록 로드')
        }

        fileHistories.value = []
      } finally {
        loadingFileHistory.value = false
      }
    }

    /**
     * 파일 히스토리 재시도
     */
    const retryFileHistoryLoad = async () => {
      try {
        retryCount.value++
        lastRetryTime.value = new Date()

        await loadFileHistories()
        errorHandler.clearError()

        // 성공 시 재시도 카운트 초기화
        retryCount.value = 0
        lastRetryTime.value = null
      } catch (error) {
        console.error('파일 히스토리 재시도 실패:', error)
      }
    }

    /**
     * 새 파일 업로드 방식으로 전환
     */
    const switchToNewFileUpload = () => {
      errorHandler.clearError()
      processingMethod.value = 'new'
      selectedFile.value = null
      fileHistories.value = []
    }

    /**
     * 에러 상태 코드 가져오기
     */
    const getErrorStatusCode = () => {
      if (errorHandler.currentError.value && errorHandler.currentError.value.response) {
        return errorHandler.currentError.value.response.status
      }
      return 'N/A'
    }

    /**
     * 기존 파일 선택
     * @param {Object} fileHistory - 선택된 파일 히스토리
     */
    const selectExistingFile = async (fileHistory) => {
      try {
        selectedFile.value = fileHistory
        selectedSubject.value = fileHistory.areaCode

        // 기존 파일 선택시에도 selectedTextbook을 채워주기
        // fileHistoryId로 subjectId 조회하여 정확한 정보 설정
        try {
          const { subjectId, areaCode } = await fileHistoryAPI.getSubjectIdByFileHistoryId(fileHistory.id)
          console.log('🔍 [ItemProcessing] subjects.value 구조 확인:', subjects.value)
          console.log('🔍 [ItemProcessing] 찾으려는 subjectId:', subjectId, '타입:', typeof subjectId)

                    if (subjectId) {
            // API에서 받은 subjectId를 우선 사용 (가장 정확한 정보)
            console.log('✅ [ItemProcessing] API에서 받은 subjectId 사용:', subjectId)

            // subjectStore에서 추가 정보(areaName 등)가 있다면 보완
            const subject = subjects.value?.find(s =>
              s.subjectId === subjectId ||
              s.subjectId === Number(subjectId) ||
              String(s.subjectId) === String(subjectId)
            )

            if (subject) {
              // subjectStore에서 찾은 경우: API subjectId + 추가 정보
              selectedTextbook.value = {
                ...subject,
                subjectId: subjectId // API에서 받은 subjectId로 덮어쓰기
              }
              console.log('✅ [ItemProcessing] subjectStore 정보로 보완됨')
            } else {
              // subjectStore에서 찾지 못한 경우: API 정보만으로 구성
              selectedTextbook.value = {
                subjectId: subjectId, // API에서 받은 실제 subjectId
                areaCode: areaCode || fileHistory.areaCode,
                name: areaCode || fileHistory.areaCode
              }
              console.log('⚠️ [ItemProcessing] subjectStore 정보 없음, API 정보만 사용')
            }

            itemProcessingStore.selectTextbook(selectedTextbook.value)
            console.log('✅ [ItemProcessing] 최종 selectedTextbook:', selectedTextbook.value)
          } else {
            // subjectId가 없는 경우 areaCode로 매핑
            const subject = subjects.value?.find(s => s.areaCode === (areaCode || fileHistory.areaCode))
            selectedTextbook.value = subject
              ? { ...subject }
              : {
                  areaCode: areaCode || fileHistory.areaCode,
                  subjectId: null,
                  name: areaCode || fileHistory.areaCode
                }
            itemProcessingStore.selectTextbook(selectedTextbook.value)
            console.log('⚠️ [ItemProcessing] subjectId 없음, areaCode로 매핑')
          }
        } catch (e) {
          console.warn('⚠️ [ItemProcessing] 기존 파일 subjectId 조회 실패:', e)
          // fallback: areaCode로 매핑
          const subject = subjects.value?.find(s => s.areaCode === fileHistory.areaCode)
          selectedTextbook.value = subject
            ? { ...subject }
            : {
                areaCode: fileHistory.areaCode,
                subjectId: null,
                name: fileHistory.areaCode
              }
          itemProcessingStore.selectTextbook(selectedTextbook.value)
        }

        // 선택된 파일의 이미지들을 pdfPages로 설정
        if (fileHistory.pdfImages && fileHistory.pdfImages.length > 0) {
          pdfPages.value = fileHistory.pdfImages.map((image, index) => {
            // S3 URL인 경우 프록시 URL로 변경
            let previewUrl = image.imageUrl
            if (previewUrl && previewUrl.includes('s3.ap-northeast-2.amazonaws.com')) {
              const encodedUrl = encodeURIComponent(previewUrl)
              previewUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/image/proxy?url=${encodedUrl}`
              console.log('S3 URL을 프록시 URL로 변경:', previewUrl)
            }

            return {
              index: index,
              pageNumber: image.pageNumber || (index + 1),
              preview: previewUrl,
              originalPage: (image.pageNumber || (index + 1)) - 1, // 실제 페이지 번호에서 1을 뺀 0-based 인덱스
              width: image.imageWidth,
              height: image.imageHeight,
              fileHistoryId: fileHistory.id,
              pdfImageId: image.id
            }
          })
        }

        // Store에 파일 히스토리 정보 설정 (이미지 순서 업데이트를 위해 필요)
        await itemProcessingStore.setUploadedPdfInfo({
          fileHistoryId: fileHistory.id
        })

        // 바로 편집 모드로 진행
        console.log('기존 파일 선택 완료:', fileHistory)
        console.log('설정된 selectedTextbook:', selectedTextbook.value)
      } catch (error) {
        console.error('기존 파일 선택 처리 실패:', error)
        errorHandler.handleGeneralError(error, '파일 선택 처리')
      }
    }

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
        // fileData에서 file 추출
        const { file } = fileData

        if (!file) {
          throw new Error('파일 데이터가 누락되었습니다.')
        }

        pdfFile.value = file
        itemProcessingStore.setPdfFile(file)

        // PDF 파일을 서버에 즉시 업로드 (원본 PDF)
        try {
          // 로딩 상태 시작
          itemProcessingStore.loading = true

          await itemProcessingStore.uploadOriginalPdf()

          // 업로드 성공 후 PDF 편집 단계로 진행

        } catch (uploadError) {
          console.error('❌ 원본 PDF 서버 업로드 실패:', uploadError)
          itemProcessingStore.loading = false
          throw new Error(`PDF 업로드 실패: ${uploadError.message}`)
        } finally {
          // 로딩 상태 종료
          itemProcessingStore.loading = false
        }

        // 클라이언트에서 PDF를 이미지로 변환하는 기능은 주석 처리
        // 서버에서 이미지 변환 후 전송받을 예정
        /*
        // PDF를 이미지로 변환
        if (!pages || pages.length === 0) {
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
        */

        // 서버에서 이미지 변환 후 전송받을 예정이므로 임시로 빈 배열 설정


        // PDF 업로드 후 서버에서 이미지 변환을 기다림
        try {
          // Store의 processPdfToImages 메서드 호출하여 서버에서 이미지 변환
          await itemProcessingStore.processPdfToImages()

          // 변환된 이미지들을 pdfPages에 설정
          pdfPages.value = itemProcessingStore.pdfPages


          // 이미지 변환이 완료되면 자동으로 PDF 편집 단계로 진행
          // (v-else-if 조건으로 자동 처리됨)
        } catch (error) {
          console.error('❌ 서버 이미지 변환 실패:', error)
          errorHandler.handleError('PDF 이미지 변환에 실패했습니다.', '서버 이미지 변환 오류')
          return
        }

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
    const movePage = async (moveInfo) => {
      console.log('🚀 ItemProcessing.movePage 호출됨:', moveInfo)
      const { fromIndex, toIndex } = moveInfo

      // Store에 페이지 이동 알림 (async 처리)
      if (itemProcessingStore.movePage) {
        try {
          await itemProcessingStore.movePage(fromIndex, toIndex)
        } catch (error) {
          console.error('❌ 페이지 이동 실패:', error)
        }
      } else {
        console.error('❌ itemProcessingStore.movePage 메서드가 없습니다')
      }
    }

    /**
     * 단일 페이지 삭제
     * @param {number} pageIndex - 삭제할 페이지 인덱스
     */
    const removePage = async (pageIndex) => {
      try {
        await itemProcessingStore.removePage(pageIndex)
      } catch (error) {
        console.error('❌ 페이지 삭제 실패:', error)
      }
    }

    /**
     * 여러 페이지 일괄 삭제
     * @param {Array<number>} pageIndexes - 삭제할 페이지 인덱스 배열
     */
    const removeMultiplePages = async (pageIndexes) => {
      // Store의 일괄 삭제 메서드 사용 (async 처리)
      if (itemProcessingStore.removeMultiplePages) {
        try {
          await itemProcessingStore.removeMultiplePages(pageIndexes)
        } catch (error) {
          console.error('❌ 다중 페이지 삭제 실패:', error)
        }
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

      // PDF 페이지가 있는지 확인
      if (!pdfPages.value || pdfPages.value.length === 0) {
        errorHandler.handleError('편집할 PDF 페이지가 없습니다. PDF를 먼저 업로드하고 편집해주세요.', 'PDF 페이지 누락')
        return
      }

      try {
        // 로딩 상태 즉시 시작
        isGeneratingPdf.value = true
        pdfGenerationProgress.value = 0
        currentPdfStage.value = 'OCR 편집 준비 중'

        // 간단한 진행률 시뮬레이션
        const progressInterval = setInterval(() => {
          if (pdfGenerationProgress.value < 100) {
            pdfGenerationProgress.value += 20
          } else {
            clearInterval(progressInterval)
          }
        }, 500)

        // 진행률을 100%로 설정
        pdfGenerationProgress.value = 100
        currentPdfStage.value = '완료'

        // 진행률 시뮬레이션 정리
        clearInterval(progressInterval)

        // 잠시 완료 상태를 보여준 후 다음 단계로
        setTimeout(() => {
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

    /**
     * 파일 히스토리 에러 숨기기
     */
    const hideFileHistoryError = () => {
      itemProcessingStore.showFileHistoryError = false
    }

    /**
     * 이미지 프록시 실패 시 S3 URL로 fallback 처리
     * @param {Object} fallbackInfo - fallback 정보
     * @param {number} fallbackInfo.pageIndex - 페이지 인덱스
     * @param {string} fallbackInfo.originalUrl - 원본 S3 URL
     */
    const handleImageFallback = (fallbackInfo) => {
      const { pageIndex, originalUrl } = fallbackInfo

      if (pageIndex >= 0 && pageIndex < pdfPages.value.length) {
        // 해당 페이지의 preview URL을 S3 URL로 변경
        pdfPages.value[pageIndex].preview = originalUrl
        pdfPages.value[pageIndex].useProxy = false

        console.log(`페이지 ${pageIndex + 1} 프록시에서 S3 URL로 fallback 완료:`, originalUrl)

        // 사용자에게 알림 (선택사항)
        // toast.success(`페이지 ${pageIndex + 1} 이미지 로딩 방식을 변경했습니다.`)
      }
    }


    return {
      // 상태
      loading,
      error,
      textbooks,
      groupedTextbooks,
      subjects,
      subjectCategories,
      subjectOptions,
      selectedSubject,
      selectedTextbook,
      pdfFile,
      pdfPages,
      showOcrEditor,
      presignedUrl,
      fileId,
      errorHandler,
      isGeneratingPdf,
      pdfGenerationProgress,
      currentPdfStage,
      showFileHistoryError,
      fileHistoryErrorMessage,

      // 새로운 상태
      processingMethod,
      selectedFile,
      fileHistories,
      loadingFileHistory,
      retryCount,
      lastRetryTime,

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
      hideFileHistoryError,

      // 새로운 메서드
      selectProcessingMethod,
      goBackToMethodSelection,
      loadFileHistories,
      selectExistingFile,
      retryFileHistoryLoad,
      switchToNewFileUpload,
      getErrorStatusCode,

      // 개발 모드
      isDevelopment,
    }
  },
}
</script>

<style scoped>
/* 공통 페이지 헤더 스타일 */
.page-header {
  background: white !important;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 3rem 0 !important;
}

.page-header .page-title {
  font-size: 1.875rem !important;
  font-weight: 700 !important;
  color: #1e293b !important;
  margin: 0 !important;
}

.page-header .page-subtitle {
  font-size: 1rem !important;
  color: #64748b !important;
  margin: 0 !important;
}

/* 공통 메인 컨테이너 스타일 */
.main-content {
  padding: 3rem 0;
}

.content-wrapper {
  max-width: 100%;
}

/* 공통 컨테이너 스타일 */
.page-header .container,
.page-header > .container {
  width: 100% !important;
  max-width: 1300px !important;
  margin: 0 auto !important;
  padding: 0 2px !important;
  box-sizing: border-box !important;
}

/* 반응형 컨테이너 */
@media (max-width: 1200px) {
  .page-header .container,
  .page-header > .container {
    width: 100% !important;
    max-width: 960px !important;
  }
}

@media (max-width: 768px) {
  .page-header .container,
  .page-header > .container {
    width: 100% !important;
    max-width: 720px !important;
    padding: 0 2px !important;
  }
}

@media (max-width: 480px) {
  .page-header .container,
  .page-header > .container {
    width: 100% !important;
    max-width: 540px !important;
    padding: 0 3px !important;
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .page-header {
    padding: 2rem 0;
  }

  .main-content {
    padding: 2rem 0;
  }
}

/* 기존 ItemProcessing 스타일들 */
.item-processing-container {
  background-color: #f8fafc;
}

.progress-stepper-container {
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.progress-stepper {
  gap: 2rem;
}

.step-item {
  position: relative;
  display: flex;
  align-items: center;
}

.step-item.active .step-number {
  background-color: #3b82f6;
  color: white;
}

.step-item:not(.active) .step-number {
  background-color: #e2e8f0;
  color: #64748b;
}

.step-item.completed .step-number {
  background-color: #10b981;
  color: white;
}

.step-number {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1rem;
  border: 2px solid transparent;
}

.step-label {
  color: #1e293b;
  font-size: 0.875rem;
}

.step-item.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}

.step-item.completed .step-label {
  color: #10b981;
  font-weight: 600;
}

.step-connector {
  width: 3rem;
  height: 2px;
  background-color: #e2e8f0;
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
/* 페이지 헤더 스타일은 이제 이 컴포넌트 내부에서 관리 */

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

/* 서버 에러 대안 UI 스타일 */
.server-error-fallback {
  max-width: 600px;
  margin: 2rem auto;
}

.server-error-fallback .bi-exclamation-triangle-fill {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
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
