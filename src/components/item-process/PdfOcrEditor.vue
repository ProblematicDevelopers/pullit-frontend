<template>
  <div class="pdf-ocr-editor">
    <!-- PDF 페이지가 없을 때 표시할 메시지 -->
    <div v-if="!pdfPages || pdfPages.length === 0" class="no-pages-message">
      <div class="no-pages-content text-center">
        <div class="no-pages-icon">📄</div>
        <h3>편집할 PDF 페이지가 없습니다</h3>
        <p class="no-pages-description">
          PDF 파일을 업로드하고 이미지 변환이 완료된 후<br>
          이 페이지에 접근할 수 있습니다.
        </p>
        <button @click="handleGoBack" class="btn btn-primary">
          뒤로가기
        </button>
      </div>
    </div>

    <!-- PDF 페이지가 있을 때만 편집기 표시 -->
    <div v-else>
      <div class="editor-header">
        <h3>문제 추출 & 편집 </h3>
        <div class="header-actions">
          <button @click="handleGoBack" class="btn btn-secondary">뒤로가기</button>
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

          <div class="button-group">
            <button
              @click="performOcr"
              :disabled="!canExecuteOcr || ocrLoading"
              class="btn btn-primary"
            >
              {{ ocrLoading ? '추출 실행 중...' : '문제 추출' }}
            </button>
          </div>
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
            <h4>결과가 없습니다</h4>
            <p class="no-results-description">
              문제 추출할 영역을<br> 선택하고
              실행해보세요.
            </p>
            <div class="no-results-steps">
              <div class="step">
                <span class="step-number">1</span>
                <span class="step-text">영역을 두 번 클릭하여 선택</span>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <span class="step-text">문제 추출 버튼 클릭</span>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <span class="step-text">추출된 텍스트를 편집</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 텍스트 편집 모달 -->
    <div v-if="showEditor" class="editor-modal-overlay" @click="closeEditor">
      <div class="editor-modal" @click.stop>
        <div class="modal-header">
          <h3>OCR 결과 편집</h3>
          <button @click="closeEditor" class="btn btn-secondary">닫기</button>
        </div>
        <div class="modal-content">
          <div class="editor-container">
            <div class="text-editor-wrapper">
              <textarea
                v-model="currentEditingText"
                class="form-control text-editor"
                rows="15"
                placeholder="OCR 결과를 편집하세요..."
              ></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="saveEditedText" class="btn btn-primary">저장</button>
            <button @click="closeEditor" class="btn btn-secondary">취소</button>
          </div>
        </div>
      </div>
    </div>

    <!-- OCR 결과 모달 -->
    <OcrResultModal
      v-if="showOcrModal && capturedImageBase64 && capturedImageInfo"
      :is-visible="showOcrModal"
      :captured-image="capturedImageBase64"
      :captured-image-info="capturedImageInfo"
      :ocr-results="ocrResults"
      :subject-code="subjectCode"
      @close="closeOcrModal"
      @save="saveOcrResults"
    />
      </div> <!-- v-else 블록 닫기 -->
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useToast } from '@/composables/useToast'

import { ocrApi } from '@/services/ocrApi'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import OcrResultModal from './OcrResultModal.vue'

export default {
  name: 'PdfOcrEditor',
  components: {
    OcrResultModal
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
    const showOcrModal = ref(false)
    const capturedImageData = ref('')
    const capturedImageBase64 = ref('')
    const capturedImageInfo = ref({})

    // 텍스트 편집 관련
    const showEditor = ref(false)
    const currentEditingText = ref('')
    const currentEditingIndex = ref(-1)

    // KaTeX를 사용한 수식 렌더링 (computed)
    const renderedMath = ref('')



    // 텍스트 변경 시 수식 렌더링 업데이트
    const updateMathRendering = () => {
      if (currentEditingText.value) {
        renderedMath.value = renderMathWithKaTeX(currentEditingText.value)
      } else {
        renderedMath.value = ''
      }
    }

    // 수식 삽입 함수
    const insertMath = (mathExpression) => {
      const mathBlock = `$$${mathExpression}$$`
      if (currentEditingText.value) {
        currentEditingText.value += `\n${mathBlock}`
      } else {
        currentEditingText.value = mathBlock
      }
    }



    // KaTeX를 사용한 수식 렌더링 함수
    const renderMathWithKaTeX = (text) => {
      const mathRegex = /\$\$(.*?)\$\$/g
      let result = text
      let match

      while ((match = mathRegex.exec(text)) !== null) {
        try {
          const rendered = katex.renderToString(match[1], {
            throwOnError: false,
            displayMode: true,
            strict: false,
            trust: true
          })
          result = result.replace(match[0], rendered)
        } catch (error) {
          console.error('수식 렌더링 오류:', error)
          result = result.replace(match[0], `<div class="math-error"><code>${match[1]}</code><br><small>수식 렌더링 오류</small></div>`)
        }
      }

      return result
    }

    // MathJax 초기화
    const initMathJax = () => {
      if (window.MathJax) {
        try {
          // MathJax 설정 개선
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']],
              processEscapes: true,
              processEnvironments: true
            },
            options: {
              skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            }
          }

          // MathJax 재로드
          if (window.MathJax.typesetPromise) {
            return window.MathJax.typesetPromise()
          }
        } catch (error) {
          console.error('MathJax 초기화 오류:', error)
        }
      }
    }

    // MathJax 로드 확인
    const checkMathJaxLoaded = () => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        console.log('MathJax가 로드되었습니다.')
        return true
      } else {
        console.log('MathJax가 아직 로드되지 않았습니다.')
        return false
      }
    }

    // KaTeX 스크립트 로드
    const loadKaTeX = () => {
      if (window.katex) return Promise.resolve()

      return new Promise((resolve) => {
        const katexScript = document.createElement('script')
        katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js'
        katexScript.onload = () => {
          // KaTeX CSS도 로드
          const katexCSS = document.createElement('link')
          katexCSS.rel = 'stylesheet'
          katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css'
          document.head.appendChild(katexCSS)
          console.log('KaTeX 스크립트 로드 완료')
          resolve()
        }
        katexScript.onerror = () => {
          console.error('KaTeX 스크립트 로드 실패')
          resolve()
        }
        document.head.appendChild(katexScript)
      })
    }

    // MathJax 스크립트 동적 로드
    const loadMathJax = () => {
      return new Promise((resolve) => {
        if (checkMathJaxLoaded()) {
          resolve()
          return
        }

        // MathJax 설정 먼저 로드
        const mathJaxConfig = document.createElement('script')
        mathJaxConfig.type = 'text/javascript'
        mathJaxConfig.innerHTML = `
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              processEscapes: true,
              processEnvironments: true
            },
            options: {
              skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            }
          };
        `
        document.head.appendChild(mathJaxConfig)

        // MathJax 메인 스크립트 로드 (v3 사용 - 더 안정적)
        const mathJaxScript = document.createElement('script')
        mathJaxScript.id = 'MathJax-script'
        mathJaxScript.async = true
        mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
        mathJaxScript.onload = () => {
          console.log('MathJax 스크립트 로드 완료')
          // MathJax 초기화 대기
          setTimeout(() => {
            if (window.MathJax && window.MathJax.typesetPromise) {
              console.log('MathJax 초기화 완료')
              resolve()
            } else {
              console.warn('MathJax 초기화 대기 중...')
              resolve()
            }
          }, 1000)
        }
        mathJaxScript.onerror = () => {
          console.error('MathJax 스크립트 로드 실패')
          resolve()
        }
        document.head.appendChild(mathJaxScript)
      })
    }

    // KaTeX로 수식 렌더링 (MathJax 대안)
    const renderWithKaTeX = (text) => {
      try {
        if (window.katex) {
          // 인라인 수식 ($...$)
          text = text.replace(/\$([^$\n]+)\$/g, (match, formula) => {
            try {
              return window.katex.renderToString(formula, { displayMode: false })
            } catch (e) {
              console.warn('KaTeX 인라인 수식 렌더링 실패:', e)
              return match
            }
          })

          // 블록 수식 ($$...$$)
          text = text.replace(/\$\$([^$\n]+)\$\$/g, (match, formula) => {
            try {
              return window.katex.renderToString(formula, { displayMode: true })
            } catch (e) {
              console.warn('KaTeX 블록 수식 렌더링 실패:', e)
              return match
            }
          })

          return text
        }
      } catch (error) {
        console.error('KaTeX 렌더링 오류:', error)
      }
      return text
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
        try {
          // MathJax 먼저 시도
          await loadMathJax()

          if (window.MathJax && window.MathJax.typesetPromise) {
            console.log('MathJax로 수식 렌더링 시작:', currentEditingText.value)

            // 임시 div에 수식 렌더링
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = currentEditingText.value
            tempDiv.style.position = 'absolute'
            tempDiv.style.left = '-9999px'
            tempDiv.style.visibility = 'hidden'
            document.body.appendChild(tempDiv)

            // MathJax 렌더링
            try {
              await window.MathJax.typesetPromise([tempDiv])
              console.log('MathJax 렌더링 완료')

              // 렌더링된 HTML 가져오기
              renderedMath.value = tempDiv.innerHTML

              // 임시 div 제거
              document.body.removeChild(tempDiv)

              // MathJax 초기화
              initMathJax()
            } catch (renderError) {
              console.warn('MathJax 렌더링 실패, KaTeX로 대체:', renderError)
              document.body.removeChild(tempDiv)

              // KaTeX로 fallback
              await loadKaTeX()
              renderedMath.value = renderWithKaTeX(currentEditingText.value)
            }
          } else {
            console.warn('MathJax가 로드되지 않음, KaTeX로 대체')
            // KaTeX로 fallback
            await loadKaTeX()
            renderedMath.value = renderWithKaTeX(currentEditingText.value)
          }
        } catch (error) {
          console.error('수식 렌더링 중 오류:', error)
          // 최종 fallback으로 KaTeX 시도
          try {
            await loadKaTeX()
            renderedMath.value = renderWithKaTeX(currentEditingText.value)
          } catch (katexError) {
            console.error('KaTeX 렌더링도 실패:', katexError)
            renderedMath.value = currentEditingText.value
          }
        }
      } else {
        renderedMath.value = ''
      }
    }

    // currentEditingText 변경 감지
    watch(currentEditingText, () => {
      updateMathRendering()
    })

    // CKEditor는 정적으로 import되어 사용됨


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

        // Canvas 대신 img 태그를 사용하여 이미지 표시
        const imageContainer = pdfCanvas.value.parentElement
        if (!imageContainer) {
          console.error('이미지 컨테이너를 찾을 수 없음')
          return
        }

        // 기존 이미지 제거
        const existingImg = imageContainer.querySelector('.pdf-page-image')
        if (existingImg) {
          existingImg.remove()
        }

        // 새 이미지 생성
        const img = document.createElement('img')
        img.className = 'pdf-page-image'
        img.crossOrigin = 'anonymous' // CORS 오류 방지
        img.style.cssText = `
          width: 100%;
          height: auto;
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        `
        img.alt = `PDF 페이지 ${pageIndex + 1}`

        // 이미지 로드 완료 후 Canvas 크기 설정
        img.onload = () => {
          console.log('이미지 로드 완료:', {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.offsetWidth,
            displayHeight: img.offsetHeight
          })

          // Canvas 크기를 이미지 표시 크기에 맞게 설정
          const rect = img.getBoundingClientRect()
          pdfCanvas.value.width = rect.width
          pdfCanvas.value.height = rect.height

          console.log('Canvas 크기 설정:', pdfCanvas.value.width, 'x', pdfCanvas.value.height)

          // Canvas 오버레이 설정
          nextTick(() => {
            if (pdfCanvas.value && selectionCanvas.value) {
              setupCanvasOverlay()
            }
          })
        }

        // 이미지 로드 실패 처리
        img.onerror = (error) => {
          console.error('이미지 로드 실패:', error)
          console.error('이미지 URL:', pageData.preview)
          
          const errorDiv = document.createElement('div')
          errorDiv.className = 'pdf-load-error'
          errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f8d7da;
            color: #721c24;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            z-index: 10;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          `
          
          errorDiv.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 8px;">⚠️ 이미지 로드 실패</div>
            <small>페이지를 새로고침하거나 다시 시도해주세요</small>
          `
          
          imageContainer.appendChild(errorDiv)
        }

        // 이미지 로드 시작
        console.log('이미지 로드 시작:', pageData.preview)
        img.src = pageData.preview

        // 이미지를 컨테이너에 추가
        imageContainer.appendChild(img)

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
      nextTick(async () => {
        // MathJax와 KaTeX 미리 로드
        try {
          console.log('수학 라이브러리 로딩 시작...')
          await Promise.all([
            loadMathJax(),
            loadKaTeX()
          ])
          console.log('수학 라이브러리 로딩 완료')
        } catch (error) {
          console.warn('수학 라이브러리 로딩 중 일부 실패:', error)
        }

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

      // DOM 요소가 실제로 존재하는지 확인
      if (!canvas.getBoundingClientRect) {
        console.warn('Canvas DOM 요소가 유효하지 않음')
        return
      }

      // Canvas의 실제 픽셀 좌표 계산
      const rect = canvas.getBoundingClientRect()

      // 유효한 크기인지 확인
      if (rect.width <= 0 || rect.height <= 0) {
        console.warn('Canvas 크기가 유효하지 않음:', { width: rect.width, height: rect.height })
        return
      }

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

      // DOM 요소가 실제로 존재하는지 확인
      if (!canvas.getBoundingClientRect) {
        console.warn('Canvas DOM 요소가 유효하지 않음')
        return
      }

      // Canvas의 실제 픽셀 좌표 계산
      const rect = canvas.getBoundingClientRect()

      // 유효한 크기인지 확인
      if (rect.width <= 0 || rect.height <= 0) {
        console.warn('Canvas 크기가 유효하지 않음:', { width: rect.width, height: rect.height })
        return
      }

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

        // PDF Canvas에서 선택된 영역을 이미지로 캡처
        const canvas = pdfCanvas.value
        if (!canvas) {
          throw new Error('PDF Canvas가 준비되지 않았습니다.')
        }

        // 선택된 영역 정보 가져오기
        const selectionInfo = await captureSelectedArea(canvas, selection.value)

        // 캡처된 영역 정보와 이미지 소스 정보를 저장
        const selectedAreaInfo = {
          x: selection.value.x,
          y: selection.value.y,
          width: selection.value.width,
          height: selection.value.height,
          pageIndex: currentPage.value,
          timestamp: new Date().toISOString(),
          // 선택된 영역의 실제 픽셀 좌표와 스케일 정보 추가
          pixelX: selectionInfo.x,
          pixelY: selectionInfo.y,
          pixelWidth: selectionInfo.width,
          pixelHeight: selectionInfo.height,
          scaleX: selectionInfo.scaleX,
          scaleY: selectionInfo.scaleY,
          imageSrc: selectionInfo.imageSrc,
          naturalWidth: selectionInfo.naturalWidth,
          naturalHeight: selectionInfo.naturalHeight
        }

                // 캡처된 이미지 데이터와 영역 정보를 모두 저장
        // capturedImageData가 null인 경우 fallback으로 원본 이미지 URL 사용
        if (selectionInfo.capturedImageData) {
          capturedImageBase64.value = selectionInfo.capturedImageData
          console.log('✅ capturedImageData 사용:', selectionInfo.capturedImageData.substring(0, 100) + '...')
        } else if (selectionInfo.imageSrc) {
          console.warn('⚠️ 이미지 캡처 실패, 원본 이미지 URL 사용')
          capturedImageBase64.value = selectionInfo.imageSrc
          console.log('🔗 원본 이미지 URL 사용:', selectionInfo.imageSrc)
        } else {
          throw new Error('이미지 데이터를 가져올 수 없습니다.')
        }

        // null 체크 후 props 설정
        if (!capturedImageBase64.value) {
          throw new Error('캡처된 이미지가 없습니다.')
        }

        capturedImageInfo.value = selectedAreaInfo
        capturedImageData.value = JSON.stringify(selectedAreaInfo)

        // 디버깅: capturedImageBase64 설정 확인
        console.log('=== capturedImageBase64 설정 확인 ===')
        console.log('capturedImageBase64.value 설정됨:', !!capturedImageBase64.value)
        console.log('capturedImageBase64.value 길이:', capturedImageBase64.value ? capturedImageBase64.value.length : 0)
        console.log('capturedImageBase64.value 형식:', capturedImageBase64.value ? capturedImageBase64.value.substring(0, 100) + '...' : '없음')
        console.log('capturedImageBase64.value 타입:', typeof capturedImageBase64.value)
        console.log('capturedImageBase64.value가 URL인가?', capturedImageBase64.value && capturedImageBase64.value.startsWith('http'))
        console.log('capturedImageBase64.value가 base64인가?', capturedImageBase64.value && capturedImageBase64.value.startsWith('data:image'))

        // 영역 정보 유효성 검증
        if (!selectionInfo || !selectionInfo.imageSrc) {
          throw new Error('선택된 영역 정보가 올바르지 않습니다.')
        }

        // 디버깅 로그
        console.log('=== 영역 선택 및 캡처 완료 ===')
        console.log('선택된 영역 정보:', selectedAreaInfo)
        console.log('이미지 소스:', selectionInfo.imageSrc)
        console.log('자연 크기:', selectionInfo.naturalWidth, 'x', selectionInfo.naturalHeight)
        console.log('픽셀 좌표:', selectionInfo.x, selectionInfo.y, selectionInfo.width, selectionInfo.height)
        console.log('스케일:', selectionInfo.scaleX, selectionInfo.scaleY)
        console.log('capturedImageData.value 설정됨:', !!capturedImageData.value)
        console.log('capturedImageInfo.value 설정됨:', !!capturedImageInfo.value)

        // OCR 모달 전달될 데이터 검증
        console.log('=== OCR 모달 전달 데이터 검증 ===')
        console.log('capturedImageInfo prop으로 전달될 값:', capturedImageInfo.value)

        // OCR 모달 표시
        showOcrModal.value = true

        console.log('OCR 모달 표시됨:', showOcrModal.value)

        success('영역이 선택되고 이미지가 캡처되었습니다. OCR 모달에서 결과를 확인하세요.')
        clearSelection()

      } catch (error) {
        console.error('OCR 처리 오류:', error)
        showError('OCR 처리에 실패했습니다: ' + error.message)
      } finally {
        ocrLoading.value = false
      }
    }

    // 선택된 영역을 이미지로 캡처 (CORS 오류 방지)
    const captureSelectedArea = async (canvas, selection) => {
      try {
        console.log('=== 영역 캡처 시작 ===')
        console.log('선택된 영역:', selection)

        // img 태그에서 이미지 가져오기
        const imageContainer = pdfCanvas.value.parentElement
        const imgElement = imageContainer.querySelector('.pdf-page-image')

        if (!imgElement) {
          throw new Error('PDF 페이지 이미지를 찾을 수 없습니다.')
        }

        console.log('이미지 요소 정보:', {
          naturalWidth: imgElement.naturalWidth,
          naturalHeight: imgElement.naturalHeight,
          offsetWidth: imgElement.offsetWidth,
          offsetHeight: imgElement.offsetHeight
        })

        // Canvas의 화면 표시 크기와 실제 픽셀 크기의 비율 계산
        const rect = imgElement.getBoundingClientRect()
        const scaleX = imgElement.naturalWidth / rect.width
        const scaleY = imgElement.naturalHeight / rect.height

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

        // 선택 영역이 이미지 범위를 벗어나지 않는지 확인
        const maxX = Math.min(pixelX + pixelWidth, imgElement.naturalWidth)
        const maxY = Math.min(pixelY + pixelHeight, imgElement.naturalHeight)
        const captureX = Math.max(0, pixelX)
        const captureY = Math.max(0, pixelY)
        const captureWidth = maxX - captureX
        const captureHeight = maxY - captureY

        if (captureWidth <= 0 || captureHeight <= 0) {
          throw new Error('유효하지 않은 캡처 영역입니다.')
        }

        // 선택된 영역을 실제로 캡처하여 base64 이미지 데이터 생성
        try {
          // 임시 Canvas 생성
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = captureWidth
          tempCanvas.height = captureHeight

          const ctx = tempCanvas.getContext('2d')

          // 원본 이미지에서 선택된 영역을 Canvas에 그리기
          ctx.drawImage(
            imgElement,
            captureX, captureY, captureWidth, captureHeight,
            0, 0, captureWidth, captureHeight
          )

          // Canvas를 base64로 변환
          const capturedImageData = tempCanvas.toDataURL('image/png')

          console.log('영역 캡처 성공:', {
            원본선택: selection,
            픽셀변환: { x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight },
            실제캡처: { x: captureX, y: captureY, width: captureWidth, height: captureHeight },
            이미지데이터길이: capturedImageData.length
          })

          // 캡처된 이미지 데이터와 영역 정보를 함께 반환
          return {
            x: captureX,
            y: captureY,
            width: captureWidth,
            height: captureHeight,
            scaleX,
            scaleY,
            imageSrc: imgElement.src,
            naturalWidth: imgElement.naturalWidth,
            naturalHeight: imgElement.naturalHeight,
            capturedImageData: capturedImageData
          }

        } catch (captureError) {
          console.error('이미지 캡처 실패:', captureError)
          // 캡처 실패 시 영역 정보만 반환
          return {
            x: captureX,
            y: captureY,
            width: captureWidth,
            height: captureHeight,
            scaleX,
            scaleY,
            imageSrc: imgElement.src,
            naturalWidth: imgElement.naturalWidth,
            naturalHeight: imgElement.naturalHeight,
            capturedImageData: null
          }
        }

      } catch (error) {
        console.error('영역 캡처 오류:', error)
        throw error
      }
    }

    // OCR 모달 관련 함수들
    const closeOcrModal = () => {
      showOcrModal.value = false
    }

    const saveOcrResults = async (itemData) => {
      try {
        console.log('문항 저장 시작:', itemData)

        // 백엔드 ProcessedItem 엔티티 구조에 맞춘 데이터 준비
        const processedItemData = {
          // 기본 문항 정보 (백엔드 enum에 맞춤)
          type: itemData.itemType === 'multiple_choice' ? 'multiple' : 
                itemData.itemType === 'subjective' ? 'subjective' :
                itemData.itemType === 'short_answer' ? 'shortAnswer' :
                itemData.itemType === 'essay' ? 'essay' : 'multiple',
          
          difficulty: itemData.difficulty === 'easy' ? 'easy' :
                     itemData.difficulty === 'medium' ? 'medium' :
                     itemData.difficulty === 'hard' ? 'hard' : 'medium',
          
          score: itemData.score || 1,
          
          // 백엔드 필드명에 맞춤 (questionText -> answer, optionsText -> solution)
          answer: itemData.editedTexts?.problem || itemData.ocrResults?.problemText || '',
          solution: itemData.editedTexts?.options || itemData.ocrResults?.optionsText || '',
          explanation: itemData.editedTexts?.explanation || itemData.explanation || '',
          
          // 단원 정보 (현재는 null, 추후 Step3에서 설정)
          majorChapterId: null,
          middleChapterId: null,
          minorChapterId: null,
          
          // 지문 그룹 (해당하는 경우)
          passageId: itemData.passageGroup ? parseInt(itemData.passageGroup) : null,
          
          // OCR 히스토리 데이터 (백엔드 AreaType enum에 맞춤)
          ocrHistories: Object.entries(itemData.selectedAreas || {}).map(([areaType, areaInfo]) => ({
            pdfImageId: capturedImageInfo.value?.pdfImageId || null,
            areaType: areaType === 'problem' ? 'PROBLEM' :
                     areaType === 'options' ? 'OPTIONS' :
                     areaType === 'question' ? 'QUESTION' :
                     areaType === 'image' ? 'IMAGE' : 'PROBLEM',
            ocrText: ocrResults.value?.[areaType]?.rawText || '',
            editedText: itemData.editedTexts?.[areaType] || '',
            originalImageUrl: capturedImageInfo.value?.imageUrl || null,
            positionX: areaInfo.x?.toString() || '0',
            positionY: areaInfo.y?.toString() || '0',
            sizeX: areaInfo.width?.toString() || '0',
            sizeY: areaInfo.height?.toString() || '0'
          }))
        }

        console.log('API 호출 데이터:', processedItemData)

        // API를 통해 processed_items 테이블에 저장 (OCR 히스토리 포함)
        const result = await ocrApi.saveProcessedItem(processedItemData)
        
        console.log('문항 저장 성공:', result)

        success('문항이 성공적으로 저장되었습니다.')
        closeOcrModal()

      } catch (error) {
        console.error('문항 저장 실패:', error)
        showError('문항 저장에 실패했습니다: ' + error.message)
      }
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

    // 텍스트 편집 관련 함수
    const editResult = async (index) => {
      currentEditingIndex.value = index
      currentEditingText.value = ocrResults.value[index].text
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
      showOcrModal,
      capturedImageData,
      capturedImageBase64,
      capturedImageInfo,

      // 텍스트 편집 관련
      showEditor,
      currentEditingText,

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

      handleCanvasClick,
      handleGoBack,
      editResult,
      closeEditor,
      saveEditedText,
      clearAllResults,

      insertMath,

      renderMathWithKaTeX,
      closeOcrModal,
      saveOcrResults
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
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.05);
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
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
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

.button-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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

.text-editor {
  height: 100%;
  resize: vertical;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 1rem;
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

.text-editor-wrapper {
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
  margin-bottom: 1rem;
}

.math-content :deep(.MathJax) {
  font-size: 1.1em;
}

.math-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

.math-loading .loading-spinner {
  border: 3px solid rgba(59, 130, 246, 0.3);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.math-loading p {
  margin: 0;
  font-size: 0.875rem;
}

.math-help {
  background-color: #e9ecef;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

.math-help h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.math-help ul {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.math-help li {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.math-help code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
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

.no-results-description {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.6;
  text-align: center;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
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

.no-results-steps .step-text {
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.4;
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

/* 수식 도구 스타일 */
.math-tools {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
}

.math-tools h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.math-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.math-btn {
  padding: 0.5rem 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.math-btn:hover {
  background-color: #2563eb;
}

.custom-math {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.math-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

.insert-btn {
  padding: 0.5rem 1rem;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.insert-btn:hover {
  background-color: #059669;
}

.math-help {
  background-color: #e9ecef;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

.math-help h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.math-help ul {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.math-help li {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.math-help code {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}

/* PDF 페이지가 없을 때 메시지 스타일 */
.no-pages-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  padding: 2rem;
}

.no-pages-content {
  max-width: 500px;
}

.no-pages-icon {
  font-size: 4rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.no-pages-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.no-pages-description {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
}

/* KaTeX 스타일 오버라이드 */
:deep(.katex) {
  font-size: 1.1em;
}

:deep(.katex-display) {
  margin: 1em 0;
  text-align: center;
}

/* 수식 오류 표시 */
.math-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.75rem;
  margin: 0.5rem 0;
  color: #dc2626;
}

.math-error code {
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}
</style>
