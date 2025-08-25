<template>
  <div class="pdf-ocr-editor">
    <div class="editor-header">
      <h3>문제 추출 & 편집 </h3>
      <div class="header-actions">
        <button @click="handleGoBack" class="btn btn-secondary">뒤로가기</button>
      </div>
    </div>

    <div class="editor-content">
      <!-- PDF 뷰어 -->
      <div class="pdf-viewer">
        <div class="pdf-container" ref="pdfContainer">
          <!-- PDF Canvas -->
          <canvas
            ref="pdfCanvas"
            class="pdf-canvas"
          ></canvas>

          <!-- 영역 선택을 위한 Canvas 오버레이 -->
          <canvas
            ref="selectionCanvas"
            class="selection-canvas"
            @click="handleCanvasClick"
          ></canvas>

          <!-- 선택 영역 표시 -->
          <div
            v-if="selection.active"
            class="selection-area"
            :style="selectionStyle"
          >
            <!-- 두 번 클릭 방식에서는 크기 조정 핸들 불필요 -->
          </div>
        </div>

        <!-- 페이지 네비게이션 -->
        <div class="page-navigation">
          <button @click="previousPage" :disabled="currentPage === 0" class="btn btn-secondary">
            이전
          </button>
          <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage >= totalPages - 1" class="btn btn-secondary">
            다음
          </button>
        </div>
      </div>

      <!-- OCR 컨트롤 패널 -->
      <div class="ocr-controls">
        <div class="control-section">
          <h4>영역 선택</h4>
          <p>PDF에서 텍스트를 추출할 영역을 드래그하여 선택하세요.</p>

          <div class="selection-info" v-if="selection.active">
            <p>선택된 영역: {{ Math.round(selection.width) }} × {{ Math.round(selection.height) }}px</p>
            <button @click="clearSelection" class="btn btn-small btn-secondary">선택 취소</button>
          </div>

          <button
            @click="performOcr"
            :disabled="!canExecuteOcr || ocrLoading"
            class="btn btn-primary"
          >
            {{ ocrLoading ? 'OCR 실행 중...' : 'OCR 실행' }}
          </button>

          <!-- 테스트용 데모 데이터 추가 버튼 -->
          <button
            @click="addDemoData"
            class="btn btn-small btn-secondary"
            style="margin-top: 0.5rem; width: 100%;"
          >
            테스트 데이터 추가
          </button>
        </div>

        <!-- OCR 결과 요약 -->
        <div class="results-summary" v-if="validOcrResults.length > 0">
          <h4>결과 요약</h4>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">총 결과</span>
              <span class="stat-value">{{ validOcrResults.length }}개</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">편집된 결과</span>
              <span class="stat-value">{{ validOcrResults.filter(r => r.edited).length }}개</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">총 텍스트 길이</span>
              <span class="stat-value">{{ validOcrResults.reduce((sum, r) => sum + r.text.length, 0) }}자</span>
            </div>
          </div>
        </div>

        <!-- OCR 결과 표시 -->
        <div class="ocr-results" v-if="validOcrResults.length > 0">
          <div class="results-header">
            <h4>OCR 결과 ({{ validOcrResults.length }}개)</h4>
            <div class="results-actions">
              <button @click="exportResults" class="btn btn-small btn-secondary">JSON 내보내기</button>
              <button @click="clearAllResults" class="btn btn-small btn-danger">전체 삭제</button>
            </div>
          </div>
          <div class="result-list">
            <div
              v-for="(result, index) in validOcrResults"
              :key="index"
              class="result-item"
            >
              <div class="result-header">
                <span class="result-page">페이지 {{ result.page + 1 }}</span>
                <div class="result-actions">
                  <button @click="editResult(index)" class="btn btn-small btn-primary">편집</button>
                  <button @click="removeResult(index)" class="btn btn-small btn-danger">삭제</button>
                </div>
              </div>
              <div class="result-image" v-if="result.image">
                <img :src="result.image" :alt="`페이지 ${result.page + 1} 선택 영역`" class="captured-image" />
              </div>
              <div class="result-text">
                <strong>OCR 추출 결과:</strong>
                <div class="text-content" :class="{ 'edited': result.edited }">
                  {{ result.text || '' }}
                  <div class="text-info">
                    <span class="text-length">{{ result.text ? result.text.length : 0 }}자</span>
                    <span v-if="result.edited" class="edited-badge">편집됨</span>
                  </div>
                </div>
              </div>
              <div class="result-coordinates">
                좌표: ({{ Math.round(result.x) }}, {{ Math.round(result.y) }})
                {{ Math.round(result.width) }} × {{ Math.round(result.height) }}
              </div>
            </div>
          </div>
        </div>

        <!-- OCR 결과가 없을 때 안내 메시지 -->
        <div v-else class="no-results">
          <div class="no-results-content">
            <div class="no-results-icon">📄</div>
            <h4>OCR 결과가 없습니다</h4>
            <p>PDF에서 텍스트를 추출할 영역을 선택하고 OCR을 실행해보세요.</p>
            <div class="no-results-steps">
              <div class="step">
                <span class="step-number">1</span>
                <span>PDF에서 텍스트 영역을 두 번 클릭하여 선택</span>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <span>"OCR 실행" 버튼 클릭</span>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <span>추출된 텍스트를 CKEditor로 편집</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CKEditor 모달 -->
    <div v-if="showEditor" class="editor-modal-overlay" @click="closeEditor">
      <div class="editor-modal" @click.stop>
        <div class="modal-header">
          <h3>OCR 결과 편집</h3>
          <button @click="closeEditor" class="btn btn-secondary">닫기</button>
        </div>
        <div class="modal-content">
          <div class="editor-container">
            <div v-if="ckEditorComponent" class="ckeditor-wrapper">
              <component
                :is="ckEditorComponent"
                :editor="editor"
                v-model="currentEditingText"
                :config="editorConfig"
                class="ckeditor-component"
                tag-name="div"
              />
            </div>
            <div v-else-if="isLoadingCKEditor" class="loading-editor">
              <div class="loading-spinner"></div>
              <p>CKEditor를 로딩 중입니다...</p>
            </div>
            <div v-else class="fallback-editor">
              <div class="editor-toolbar">
                <button @click="insertMathFormula" class="btn btn-small btn-primary">수식 삽입</button>
                <button @click="insertMathBlock" class="btn btn-small btn-primary">수식 블록</button>
              </div>
              <textarea
                v-model="currentEditingText"
                class="fallback-textarea"
                placeholder="OCR 결과를 여기에 편집하세요...&#10;&#10;수식 삽입 버튼을 사용하여 수학 수식을 추가할 수 있습니다."
                rows="15"
              ></textarea>
              <div class="math-preview" v-if="currentEditingText.includes('$$') || currentEditingText.includes('$')">
                <h4>수식 미리보기:</h4>
                <div class="math-content" v-html="renderedMath"></div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="saveEditedText" class="btn btn-primary">저장</button>
            <button @click="closeEditor" class="btn btn-secondary">취소</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { ocrApi } from '@/services/ocrApi'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import '@ckeditor/ckeditor5-build-classic/build/translations/ko'

export default {
  name: 'PdfOcrEditor',
  components: {
    // CKEditor 컴포넌트는 동적으로 import
  },
  props: {
    pdfPages: {
      type: Array,
      required: true
    },
    presignedUrl: {
      type: String,
      required: true
    },
    fileId: {
      type: [String, Number],
      required: false,
      default: null
    },
    subjectCode: {
      type: String,
      required: true
    }
  },
  emits: ['go-back'],
  setup(props, { emit }) {
    const { success, error: showError } = useToast()

    // CKEditor 관련
    const editor = ClassicEditor
    const editorConfig = {
      language: 'ko',
      toolbar: {
        items: [
          'heading', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
          'fontSize', 'fontColor', 'fontBackgroundColor', '|',
          'alignment', '|', 'numberedList', 'bulletedList', '|',
          'link', 'blockQuote', 'insertTable', '|',
          'undo', 'redo'
        ]
      },
      fontSize: {
        options: [10, 12, 14, 'default', 18, 20, 22, 24, 26, 28, 30, 32, 34, 36]
      }
    }

    // props로 받은 pdfPages 상태 확인 및 디버깅
    console.log('=== PdfOcrEditor 컴포넌트 마운트 ===')
    console.log('받은 pdfPages:', props.pdfPages)
    console.log('받은 pdfPages 길이:', props.pdfPages.length)
    console.log('받은 pdfPages 상세:', props.pdfPages.map(p => ({
      index: p.index,
      pageNumber: p.pageNumber,
      hasPreview: !!p.preview
    })))

    // PDF 렌더링 관련
    const pdfContainer = ref(null)
    const pdfCanvas = ref(null)
    const selectionCanvas = ref(null)
    const currentPage = ref(0)
    const totalPages = ref(props.pdfPages.length)

    // 영역 선택 관련
    const selection = ref({
      active: false,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      waitingForSecondClick: false
    })

    // OCR 관련
    const ocrLoading = ref(false)
    const ocrResults = ref([])

    // CKEditor 편집 관련
    const showEditor = ref(false)
    const currentEditingText = ref('')
    const currentEditingIndex = ref(-1)
    const ckEditorComponent = ref(null)
    const isLoadingCKEditor = ref(false) // CKEditor 로딩 상태 추가
    const renderedMath = ref('') // MathJax 렌더링된 수식

    // MathJax 초기화
    const initMathJax = () => {
      if (window.MathJax) {
        window.MathJax.typesetPromise()
      }
    }

    // MathJax 로드 확인
    const checkMathJaxLoaded = () => {
      if (window.MathJax) {
        console.log('MathJax가 로드되었습니다.')
        return true
      } else {
        console.log('MathJax가 아직 로드되지 않았습니다.')
        return false
      }
    }

    // MathJax 스크립트 동적 로드
    const loadMathJax = () => {
      return new Promise((resolve) => {
        if (checkMathJaxLoaded()) {
          resolve()
          return
        }

        // Polyfill 로드
        const polyfillScript = document.createElement('script')
        polyfillScript.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6'
        polyfillScript.onload = () => {
          // MathJax 로드
          const mathJaxScript = document.createElement('script')
          mathJaxScript.id = 'MathJax-script'
          mathJaxScript.async = true
          mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/es5/tex-mml-chtml.js'
          mathJaxScript.onload = () => {
            console.log('MathJax 스크립트 로드 완료')
            resolve()
          }
          mathJaxScript.onerror = () => {
            console.error('MathJax 스크립트 로드 실패')
            resolve()
          }
          document.head.appendChild(mathJaxScript)
        }
        polyfillScript.onerror = () => {
          console.error('Polyfill 스크립트 로드 실패')
          resolve()
        }
        document.head.appendChild(polyfillScript)
      })
    }

    // 수식 삽입 (인라인)
    const insertMathFormula = () => {
      const formula = prompt('수식을 입력하세요 (예: x^2 + y^2 = r^2):')
      if (formula) {
        const mathText = `$${formula}$`
        insertTextAtCursor(mathText)
      }
    }

    // 수식 블록 삽입
    const insertMathBlock = () => {
      const formula = prompt('수식 블록을 입력하세요 (예: \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}):')
      if (formula) {
        const mathText = `$$${formula}$$`
        insertTextAtCursor(mathText)
      }
    }

    // 커서 위치에 텍스트 삽입
    const insertTextAtCursor = (text) => {
      const textarea = document.querySelector('.fallback-textarea')
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const before = currentEditingText.value.substring(0, start)
        const after = currentEditingText.value.substring(end)

        currentEditingText.value = before + text + after

        // 커서 위치 조정
        nextTick(() => {
          textarea.focus()
          textarea.setSelectionRange(start + text.length, start + text.length)
        })
      }
    }

    // MathJax로 수식 렌더링
    const renderMathContent = async () => {
      if (currentEditingText.value.includes('$$') || currentEditingText.value.includes('$')) {
        // MathJax 로드 대기
        await loadMathJax()

        // MathJax가 로드되어 있는지 확인
        if (window.MathJax) {
          // 임시 div에 수식 렌더링
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = currentEditingText.value

          // MathJax 렌더링
          window.MathJax.typesetPromise([tempDiv]).then(() => {
            renderedMath.value = tempDiv.innerHTML
            // MathJax 초기화
            initMathJax()
          }).catch(error => {
            console.error('MathJax 렌더링 오류:', error)
            renderedMath.value = currentEditingText.value
          })
        } else {
          // MathJax가 없으면 원본 텍스트 표시
          renderedMath.value = currentEditingText.value
        }
      } else {
        renderedMath.value = ''
      }
    }

    // currentEditingText 변경 감지하여 수식 렌더링
    watch(currentEditingText, () => {
      renderMathContent()
    })

    // CKEditor 컴포넌트 동적 import
    const loadCKEditor = async () => {
      try {
        isLoadingCKEditor.value = true
        console.log('CKEditor 컴포넌트 로딩 시작...')

        const ckEditorModule = await import('@ckeditor/ckeditor5-vue')
        console.log('CKEditor 모듈 로드 성공:', ckEditorModule)

        if (ckEditorModule.Ckeditor) {
          ckEditorComponent.value = ckEditorModule.Ckeditor
          console.log('CKEditor 컴포넌트 설정 완료')
        } else {
          throw new Error('CKEditor Ckeditor 컴포넌트를 찾을 수 없습니다')
        }

      } catch (error) {
        console.error('CKEditor 컴포넌트 로드 실패:', error)
        showError('에디터를 로드할 수 없습니다: ' + error.message)
      } finally {
        isLoadingCKEditor.value = false
      }
    }


    // OCR 실행 버튼 활성화 여부
    const canExecuteOcr = computed(() => {
      return selection.value.active && selection.value.width > 10 && selection.value.height > 10
    })

    // props.pdfPages 변경 감지하여 totalPages 업데이트
    watch(() => props.pdfPages, (newPdfPages) => {
      console.log('=== PdfOcrEditor에서 pdfPages 변경 감지 ===')
      console.log('새로운 pdfPages:', newPdfPages)
      console.log('새로운 길이:', newPdfPages.length)

      totalPages.value = newPdfPages.length
      console.log('totalPages 업데이트됨:', totalPages.value)

      // 현재 페이지가 새로운 페이지 수를 초과하는 경우 조정
      if (currentPage.value >= newPdfPages.length) {
        currentPage.value = Math.max(0, newPdfPages.length - 1)
        console.log('현재 페이지 조정됨:', currentPage.value)
      }
    }, { immediate: true, deep: true })

    // PDF 페이지 렌더링
    const renderPdfPage = async (pageIndex) => {
      if (!pdfCanvas.value || !props.pdfPages[pageIndex]) {
        console.log('PDF Canvas 또는 페이지 데이터가 준비되지 않음')
        return
      }

      try {
        console.log('=== PDF 페이지 렌더링 시작 ===')
        console.log('페이지 인덱스:', pageIndex)

        const pageData = props.pdfPages[pageIndex]
        if (!pageData.preview) {
          console.error('페이지에 preview 이미지가 없음:', pageData)
          return
        }

        // preview 이미지를 Canvas에 직접 렌더링
        const img = new Image()
        img.onload = () => {
          const canvas = pdfCanvas.value
          const context = canvas.getContext('2d')

          // 원본 이미지 크기 사용 (픽셀 정확도 보장)
          const originalWidth = img.naturalWidth || img.width
          const originalHeight = img.naturalHeight || img.height

          // Canvas 크기를 원본 이미지 크기로 설정
          canvas.width = originalWidth
          canvas.height = originalHeight

          console.log('Canvas 크기 설정:', canvas.width, 'x', canvas.height)
          console.log('원본 이미지 크기:', originalWidth, 'x', originalHeight)

          // 이미지 그리기 (원본 크기 그대로)
          context.drawImage(img, 0, 0, originalWidth, originalHeight)
          console.log('이미지 렌더링 완료')

          // Canvas 오버레이 설정 - 렌더링 완료 후
          nextTick(() => {
            if (pdfCanvas.value && selectionCanvas.value) {
              setupCanvasOverlay()
            } else {
              console.log('Canvas 요소들이 아직 준비되지 않음, 오버레이 설정 건너뜀')
            }
          })
        }

        img.onerror = (error) => {
          console.error('이미지 로드 실패:', error)
        }

        img.src = pageData.preview

      } catch (error) {
        console.error('PDF 페이지 렌더링 오류:', error)
      }
    }

    // PDF 페이지 변경 시 렌더링
    watch(currentPage, (newPage) => {
      renderPdfPage(newPage)
    })

    // 컴포넌트 마운트 시 첫 번째 페이지 렌더링
    onMounted(() => {
      nextTick(() => {
        if (props.pdfPages && props.pdfPages.length > 0) {
          console.log('컴포넌트 마운트 완료, 첫 번째 페이지 렌더링 시작')
          // Canvas 요소들이 준비될 때까지 잠시 대기
          setTimeout(() => {
            if (pdfCanvas.value && selectionCanvas.value) {
              renderPdfPage(0)
            } else {
              console.log('Canvas 요소들이 아직 준비되지 않음, 100ms 후 재시도')
              setTimeout(() => renderPdfPage(0), 100)
            }
          }, 50)
        }
      })
    })

    // Canvas 오버레이 설정
    const setupCanvasOverlay = () => {
      if (!pdfCanvas.value || !selectionCanvas.value) {
        console.log('Canvas 요소들이 준비되지 않음')
        return
      }

      try {
        const pdfCanvasEl = pdfCanvas.value
        const selectionCanvasEl = selectionCanvas.value

        // PDF Canvas의 화면 표시 크기 사용
        const rect = pdfCanvasEl.getBoundingClientRect()
        const displayWidth = rect.width
        const displayHeight = rect.height

        // 선택 Canvas를 PDF Canvas와 정확히 같은 화면 크기로 설정
        selectionCanvasEl.width = displayWidth
        selectionCanvasEl.height = displayHeight

        // CSS 스타일도 화면 크기로 정확하게 설정
        selectionCanvasEl.style.width = displayWidth + 'px'
        selectionCanvasEl.style.height = displayHeight + 'px'
        selectionCanvasEl.style.position = 'absolute'
        selectionCanvasEl.style.top = '0px'
        selectionCanvasEl.style.left = '0px'

        console.log('Canvas 오버레이 설정 완료:', {
          pdfCanvas: {
            픽셀크기: { width: pdfCanvasEl.width, height: pdfCanvasEl.height },
            화면크기: { width: displayWidth, height: displayHeight }
          },
          selectionCanvas: {
            width: selectionCanvasEl.width,
            height: selectionCanvasEl.height
          }
        })

      } catch (error) {
        console.error('Canvas 오버레이 설정 오류:', error)
      }
    }


    // 첫 번째 클릭 - 시작 지점
    const firstClick = (event) => {
      event.preventDefault()
      event.stopPropagation()

      const canvas = selectionCanvas.value
      if (!canvas) {
        console.log('선택 Canvas가 준비되지 않음')
        return
      }

      // Canvas의 실제 픽셀 좌표 계산
      const rect = canvas.getBoundingClientRect()

      // 클릭 좌표를 Canvas 내부 좌표로 변환
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // 좌표 범위 검증 (화면 좌표 기준)
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        console.log('Canvas 범위를 벗어난 클릭:', { x, y, canvasWidth: rect.width, canvasHeight: rect.height })
        return
      }

      // 선택 시작 (화면 좌표 사용)
      selection.value = {
        active: false,
        startX: x,
        startY: y,
        x: x,
        y: y,
        width: 0,
        height: 0,
        waitingForSecondClick: true // 두 번째 클릭 대기 중
      }

      console.log('첫 번째 클릭 - 시작 지점 (화면 좌표):', { x, y, rectWidth: rect.width, rectHeight: rect.height })
    }

    // 두 번째 클릭 - 종료 지점 및 영역 완성
    const secondClick = (event) => {
      event.preventDefault()
      event.stopPropagation()

      // 첫 번째 클릭이 없으면 무시
      if (!selection.value.waitingForSecondClick) {
        console.log('첫 번째 클릭이 없음, 무시됨')
        return
      }

      const canvas = selectionCanvas.value
      if (!canvas) {
        console.log('선택 Canvas가 준비되지 않음')
        return
      }

      // Canvas의 실제 픽셀 좌표 계산
      const rect = canvas.getBoundingClientRect()

      // 클릭 좌표를 Canvas 내부 좌표로 변환
      const endX = event.clientX - rect.left
      const endY = event.clientY - rect.top

      // 좌표 범위 검증 (화면 좌표 기준)
      if (endX < 0 || endX > rect.width || endY < 0 || endY > rect.height) {
        console.log('Canvas 범위를 벗어난 클릭:', { endX, endY, canvasWidth: rect.width, canvasHeight: rect.height })
        return
      }

      // 시작점과 종료점으로 사각형 영역 생성
      const startX = selection.value.startX
      const startY = selection.value.startY

      // 좌표 정규화 (시작점이 항상 왼쪽 위, 종료점이 오른쪽 아래)
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)

      // 최소 크기 체크 (화면 좌표 기준)
      if (width < 10 || height < 10) {
        console.log('선택 영역이 너무 작음, 선택 취소:', { width, height })
        clearSelection()
        return
      }

      // 영역 선택 완료 (화면 좌표 사용)
      selection.value = {
        active: true,
        startX: startX,
        startY: startY,
        x: x,
        y: y,
        width: width,
        height: height,
        waitingForSecondClick: false
      }

      console.log('두 번째 클릭 - 영역 완성 (화면 좌표):', {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        final: { x, y, width, height },
        rect: { width: rect.width, height: rect.height }
      })
    }



    // Canvas 클릭 처리 (두 번 클릭 방식)
    const handleCanvasClick = (event) => {
      event.preventDefault()
      event.stopPropagation()

      // 첫 번째 클릭인지 두 번째 클릭인지 판단
      if (!selection.value.waitingForSecondClick && !selection.value.active) {
        // 첫 번째 클릭
        firstClick(event)
      } else if (selection.value.waitingForSecondClick) {
        // 두 번째 클릭
        secondClick(event)
      } else if (selection.value.active) {
        // 이미 영역이 선택된 상태에서 클릭하면 선택 유지
        console.log('영역 선택 유지됨')
      }
    }

    // 두 번 클릭 방식에서는 크기 조정 기능 불필요

    // 선택 영역 취소
    const clearSelection = () => {
      selection.value = {
        active: false,
        startX: 0,
        startY: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        waitingForSecondClick: false
      }
      console.log('선택 영역 초기화됨')
    }

    // OCR 실행
    const performOcr = async () => {
      if (!selection.value.active) return

      try {
        ocrLoading.value = true

        // PDF Canvas를 이미지로 캡처
        const canvas = pdfCanvas.value

        // PDF Canvas에서 선택된 영역을 캡처
        const tempImage = await capturePdfCanvas(canvas, selection.value)

        // Base64로 변환
        const imageBase64 = tempImage

        // 캡처된 이미지 정보 로깅
        console.log('캡처된 이미지 크기:', selection.value.width, 'x', selection.value.height, 'px')
        console.log('이미지 데이터 길이:', tempImage.length, 'characters')

        // OCR API 호출
        const result = await callOcrApi(imageBase64, props.subjectCode)

        // 결과 저장
        ocrResults.value.push({
          page: currentPage.value,
          text: result.message || '텍스트를 추출할 수 없습니다.', // message가 없을 경우 기본값
          image: tempImage, // 캡처된 이미지 저장
          x: selection.value.x,
          y: selection.value.y,
          width: selection.value.width,
          height: selection.value.height,
          edited: false // 초기에는 편집되지 않음
        })

        success('OCR 처리가 완료되었습니다.')
        clearSelection()

      } catch (error) {
        console.error('OCR 처리 오류:', error)
        showError('OCR 처리에 실패했습니다.')
      } finally {
        ocrLoading.value = false
      }
    }

                        // PDF Canvas에서 영역을 이미지로 캡처 (화면 좌표를 픽셀 좌표로 변환)
        const capturePdfCanvas = async (pdfCanvas, selection) => {
          try {
            console.log('=== PDF Canvas 영역 캡처 시작 ===')
            console.log('선택된 영역 (화면 좌표):', selection)
            console.log('PDF Canvas 크기:', pdfCanvas.width, 'x', pdfCanvas.height)

            // PDF Canvas의 화면 표시 크기와 실제 픽셀 크기의 비율 계산
            const rect = pdfCanvas.getBoundingClientRect()
            const scaleX = pdfCanvas.width / rect.width
            const scaleY = pdfCanvas.height / rect.height

            // 화면 좌표를 픽셀 좌표로 변환
            const pixelX = Math.round(selection.x * scaleX)
            const pixelY = Math.round(selection.y * scaleY)
            const pixelWidth = Math.round(selection.width * scaleX)
            const pixelHeight = Math.round(selection.height * scaleY)

            console.log('변환된 픽셀 좌표:', {
              화면: selection,
              픽셀: { x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight },
              스케일: { scaleX, scaleY }
            })

            // 선택 영역이 Canvas 범위를 벗어나지 않는지 확인
            const maxX = Math.min(pixelX + pixelWidth, pdfCanvas.width)
            const maxY = Math.min(pixelY + pixelHeight, pdfCanvas.height)
            const captureX = Math.max(0, pixelX)
            const captureY = Math.max(0, pixelY)
            const captureWidth = maxX - captureX
            const captureHeight = maxY - captureY

            if (captureWidth <= 0 || captureHeight <= 0) {
              console.error('유효하지 않은 캡처 영역:', { captureX, captureY, captureWidth, captureHeight })
              return createDummyImage(selection)
            }

            // PDF Canvas에서 직접 선택된 영역 캡처
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = captureWidth
            tempCanvas.height = captureHeight

            const ctx = tempCanvas.getContext('2d')

            // PDF Canvas에서 선택된 영역을 새 Canvas로 복사
            ctx.drawImage(
              pdfCanvas,
              captureX, captureY, captureWidth, captureHeight,
              0, 0, captureWidth, captureHeight
            )

            console.log('PDF Canvas 영역 캡처 성공:', {
              원본선택: selection,
              픽셀변환: { x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight },
              실제캡처: { x: captureX, y: captureY, width: captureWidth, height: captureHeight }
            })

            const imageDataUrl = tempCanvas.toDataURL('image/png')
            console.log('생성된 이미지 데이터 길이:', imageDataUrl.length)
            console.log('이미지 데이터 시작:', imageDataUrl.substring(0, 50))

            return imageDataUrl

          } catch (error) {
            console.error('PDF Canvas 영역 캡처 오류:', error)
            console.log('더미 이미지로 대체')
            return createDummyImage(selection)
          }
        }

    // 더미 이미지 생성 (캡처 실패 시 사용)
    const createDummyImage = (selection) => {
      const canvas = document.createElement('canvas')
      canvas.width = selection.width
      canvas.height = selection.height
      const ctx = canvas.getContext('2d')

      // 더미 텍스트 그리기
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, selection.width, selection.height)
      ctx.fillStyle = '#333'
      ctx.font = '14px Arial'
      ctx.fillText('선택된 영역', 10, 20)
      ctx.fillText(`크기: ${selection.width} x ${selection.height}`, 10, 40)

      return canvas.toDataURL('image/png')
    }

    // OCR API 호출
    const callOcrApi = async (imageBase64, subjectCode) => {
      try {
        const result = await ocrApi.processImage(imageBase64, subjectCode)
        return result
      } catch (error) {
        console.error('OCR API 호출 오류:', error)
        throw error
      }
    }

    // 결과 삭제
    const removeResult = (index) => {
      ocrResults.value.splice(index, 1)
    }

    // 전체 결과 삭제
    const clearAllResults = () => {
      ocrResults.value = []
      success('모든 OCR 결과가 삭제되었습니다.')
    }

    // 결과 내보내기 (JSON)
    const exportResults = () => {
      const resultsToExport = ocrResults.value.map(result => ({
        page: result.page,
        text: result.text,
        image: result.image,
        coordinates: {
          x: result.x,
          y: result.y,
          width: result.width,
          height: result.height
        }
      }))
      const jsonString = JSON.stringify(resultsToExport, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ocr_results_${props.fileId || 'unknown'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      success('OCR 결과가 JSON 파일로 내보내졌습니다.')
    }

    // 페이지 네비게이션
    const previousPage = () => {
      console.log('이전 페이지 요청 - 현재:', currentPage.value, '총:', totalPages.value)
      if (currentPage.value > 0 && currentPage.value < totalPages.value) {
        currentPage.value--
        console.log('이전 페이지로 이동:', currentPage.value)
        clearSelection()
        nextTick(() => {
          setupCanvasOverlay()
        })
      } else {
        console.warn('이전 페이지로 이동할 수 없음:', {
          currentPage: currentPage.value,
          totalPages: totalPages.value
        })
      }
    }

    const nextPage = () => {
      console.log('다음 페이지 요청 - 현재:', currentPage.value, '총:', totalPages.value)
      if (currentPage.value >= 0 && currentPage.value < totalPages.value - 1) {
        currentPage.value++
        console.log('다음 페이지로 이동:', currentPage.value)
        clearSelection()
        nextTick(() => {
          setupCanvasOverlay()
        })
      } else {
        console.warn('다음 페이지로 이동할 수 없음:', {
          currentPage: currentPage.value,
          totalPages: totalPages.value
        })
      }
    }

    // 계산된 속성
    const selectionStyle = computed(() => {
      if (!selection.value.active || !pdfCanvas.value) {
        return {}
      }

      try {
        // 화면 좌표를 그대로 사용 (이미 화면 좌표로 저장됨)
        const x = selection.value.x
        const y = selection.value.y
        const width = selection.value.width
        const height = selection.value.height

        return {
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`
        }
      } catch (error) {
        console.error('selectionStyle 계산 오류:', error)
        return {}
      }
    })

    // 페이지 변경 감지
    watch(currentPage, () => {
      nextTick(() => {
        setupCanvasOverlay()
      })
    })

    // 컴포넌트 마운트 시 초기 설정
    onMounted(() => {
      nextTick(() => {
        setupCanvasOverlay()
      })
    })

        // 컴포넌트 언마운트 시 정리
    onUnmounted(() => {
      clearSelection()
    })

    const handleGoBack = () => {
      emit('go-back')
    }

    // CKEditor 편집 관련 함수
    const editResult = async (index) => {
      currentEditingIndex.value = index
      currentEditingText.value = ocrResults.value[index].text

      // CKEditor가 로드되지 않았다면 로드
      if (!ckEditorComponent.value) {
        await loadCKEditor()
      }

      showEditor.value = true
    }

    const closeEditor = () => {
      showEditor.value = false
      currentEditingText.value = ''
      currentEditingIndex.value = -1
    }

    const saveEditedText = () => {
      if (currentEditingIndex.value !== -1) {
        ocrResults.value[currentEditingIndex.value].text = currentEditingText.value
        ocrResults.value[currentEditingIndex.value].edited = true // 편집된 결과 표시
        showEditor.value = false
        success('OCR 결과가 저장되었습니다.')
      }
    }

    // 테스트용 데모 데이터 추가 함수
    const addDemoData = () => {
      const dummyText = '이 텍스트는 테스트용 데모 데이터입니다. 영역을 선택하고 OCR을 실행해보세요.';
      const dummyImage = createDummyImage({ width: 100, height: 50 }); // 임의의 크기

      ocrResults.value.push({
        page: 0, // 예시로 페이지 0
        text: dummyText,
        image: dummyImage,
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        edited: false
      });
      success('테스트 데이터가 추가되었습니다.');
    };

    // 유효한 OCR 결과만 필터링
    const validOcrResults = computed(() => {
      return ocrResults.value.filter(result => result && result.text && result.text.length > 0)
    })

    return {
      // refs
      pdfContainer,
      pdfCanvas,
      selectionCanvas,

      // 상태
      currentPage,
      totalPages,
      selection,
      ocrLoading,
      ocrResults,

      // CKEditor 관련
      editor,
      editorConfig,
      showEditor,
      currentEditingText,
      ckEditorComponent,
      isLoadingCKEditor, // 추가된 상태
      renderedMath, // 추가된 상태

      // 계산된 속성
      selectionStyle,
      canExecuteOcr,
      validOcrResults, // 추가된 계산된 속성

      // 메서드
      renderPdfPage,
      setupCanvasOverlay,
      firstClick,
      secondClick,
      clearSelection,
      performOcr,
      removeResult,
      previousPage,
      nextPage,
      capturePdfCanvas,
      createDummyImage,
      handleCanvasClick,
      handleGoBack,
      editResult,
      closeEditor,
      saveEditedText,
      exportResults,
      clearAllResults,
      addDemoData,
      insertMathFormula, // 추가된 메서드
      insertMathBlock, // 추가된 메서드
      renderMathContent, // 추가된 메서드
      loadMathJax // 추가된 메서드
    }
  }
}
</script>

<style scoped>
.pdf-ocr-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.editor-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.editor-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.pdf-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  border-right: 1px solid #e2e8f0;
}

.pdf-container {
  position: relative;
  flex: 1;
  overflow: auto;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  min-height: 600px; /* 최소 높이 설정 */
}

.pdf-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  background: #f8fafc;
  min-height: 500px;
  position: relative;
  z-index: 1;
  /* 픽셀 정확도를 위한 이미지 렌더링 설정 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
}

.selection-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto; /* 마우스 이벤트 활성화 */
  z-index: 10; /* PDF Canvas 위에 표시 */
  cursor: crosshair;
  background: transparent; /* 투명 배경 */
  border: 1px solid rgba(59, 130, 246, 0.3); /* 디버깅용 테두리 */
  /* 픽셀 정확도를 위한 설정 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: -moz-crisp-edges;
  image-rendering: pixelated;
}

.selection-area {
  position: absolute;
  border: 2px dashed #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  pointer-events: none;
  z-index: 20; /* Canvas 위에 표시 */
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border: 1px solid white;
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
}

.resize-handle-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.page-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.page-info {
  font-weight: 600;
  color: #374151;
  min-width: 80px;
  text-align: center;
}

.ocr-controls {
  width: 350px;
  padding: 2rem;
  background: #f8fafc;
  overflow-y: auto;
}

.control-section {
  margin-bottom: 2rem;
}

.control-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.control-section p {
  margin: 0 0 1rem 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
}

.selection-info {
  background: #e0f2fe;
  border: 1px solid #0288d1;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.selection-info p {
  margin: 0 0 0.5rem 0;
  color: #01579b;
  font-size: 0.875rem;
}

.ocr-results {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
}

.ocr-results h4 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.results-actions {
  display: flex;
  gap: 0.5rem;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-page {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

.result-text {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
}

.result-text strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #1e293b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text-content {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.5rem;
  white-space: pre-wrap;
  min-height: 40px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
}

.text-content.edited {
  border-color: #3b82f6;
  border-width: 2px;
  border-style: dashed;
}

.text-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.text-length {
  font-weight: 600;
  color: #3b82f6;
}

.edited-badge {
  background-color: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.result-coordinates {
  font-size: 0.75rem;
  color: #6b7280;
}

.result-image {
  margin-bottom: 0.75rem;
  text-align: center;
}

.captured-image {
  max-width: 100%;
  max-height: 200px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .editor-content {
    flex-direction: column;
  }

  .ocr-controls {
    width: 100%;
    border-top: 1px solid #e2e8f0;
    border-right: none;
  }
}

/* CKEditor 모달 스타일 */
.editor-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.editor-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  min-height: 400px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.ckeditor-component {
  height: 100%;
}

.ckeditor-component :deep(.ck-editor__main) {
  height: calc(100% - 50px);
}

.ckeditor-component :deep(.ck-content) {
  height: 100%;
  overflow-y: auto;
}

.loading-editor {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #6b7280;
  font-size: 1rem;
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ckeditor-wrapper {
  height: 100%;
}

.fallback-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fallback-textarea {
  flex: 1;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.6;
  font-family: 'Noto Sans KR', sans-serif;
  resize: none;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.math-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.math-preview h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.math-content {
  background: white;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  min-height: 100px;
  overflow-x: auto;
}

.math-content :deep(.MathJax) {
  font-size: 1.1em;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

/* CKEditor 커스텀 스타일 */
:deep(.ck-editor__editable) {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}

:deep(.ck-toolbar) {
  border-radius: 8px 8px 0 0;
}

:deep(.ck-content) {
  font-family: 'Noto Sans KR', sans-serif;
  line-height: 1.6;
}

/* OCR 결과가 없을 때 스타일 */
.no-results {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 1.125rem;
}

.no-results-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-results-icon {
  font-size: 4rem;
}

.no-results-steps {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 1rem;
  padding-left: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.no-results-steps .step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.no-results-steps .step-number {
  font-weight: 600;
  color: #3b82f6;
  font-size: 1rem;
}

/* 결과 요약 스타일 */
.results-summary {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.results-summary h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.stat-label {
  font-weight: 500;
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #3b82f6;
  font-size: 1.125rem;
}
</style>
