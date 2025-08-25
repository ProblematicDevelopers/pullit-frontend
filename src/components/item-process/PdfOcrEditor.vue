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
        </div>

        <!-- OCR 결과 표시 -->
        <div class="ocr-results" v-if="ocrResults.length > 0">
          <h4>OCR 결과</h4>
          <div class="result-list">
            <div
              v-for="(result, index) in ocrResults"
              :key="index"
              class="result-item"
            >
              <div class="result-header">
                <span class="result-page">페이지 {{ result.page + 1 }}</span>
                <button @click="removeResult(index)" class="btn btn-small btn-danger">삭제</button>
              </div>
              <div class="result-image" v-if="result.image">
                <img :src="result.image" :alt="`페이지 ${result.page + 1} 선택 영역`" class="captured-image" />
              </div>
              <div class="result-text">
                <strong>OCR 추출 결과:</strong>
                <div class="text-content">{{ result.text }}</div>
              </div>
              <div class="result-coordinates">
                좌표: ({{ Math.round(result.x) }}, {{ Math.round(result.y) }})
                {{ Math.round(result.width) }} × {{ Math.round(result.height) }}
              </div>
            </div>
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

export default {
  name: 'PdfOcrEditor',
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

              // Canvas 크기 설정
              canvas.width = pageData.width || img.width
              canvas.height = pageData.height || img.height

              console.log('Canvas 크기 설정:', canvas.width, 'x', canvas.height)

              // 이미지 그리기
              context.drawImage(img, 0, 0, canvas.width, canvas.height)
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

        // PDF Canvas 크기에 맞춰 Canvas 크기 설정
        const pdfCanvasRect = pdfCanvasEl.getBoundingClientRect()
        selectionCanvasEl.width = pdfCanvasRect.width
        selectionCanvasEl.height = pdfCanvasRect.height

        // Canvas를 PDF Canvas 위에 정확히 겹치도록 위치 조정
        selectionCanvasEl.style.width = pdfCanvasRect.width + 'px'
        selectionCanvasEl.style.height = pdfCanvasRect.height + 'px'
        selectionCanvasEl.style.position = 'absolute'
        selectionCanvasEl.style.top = '0px'
        selectionCanvasEl.style.left = '0px'

        console.log('Canvas 오버레이 설정 완료:', selectionCanvasEl.width, 'x', selectionCanvasEl.height)
      } catch (error) {
        console.error('Canvas 오버레이 설정 오류:', error)
      }
    }

    // 첫 번째 클릭 - 시작 지점
    const firstClick = (event) => {
      event.preventDefault()
      event.stopPropagation()

      const canvas = selectionCanvas.value
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // 첫 번째 클릭으로 시작 지점 설정
      selection.value = {
        active: false, // 아직 영역이 완성되지 않음
        startX: x,
        startY: y,
        x: x,
        y: y,
        width: 0,
        height: 0,
        waitingForSecondClick: true // 두 번째 클릭 대기 중
      }

      console.log('첫 번째 클릭 - 시작 지점:', x, y)
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
      const rect = canvas.getBoundingClientRect()
      const endX = event.clientX - rect.left
      const endY = event.clientY - rect.top

      // 시작점과 종료점으로 사각형 영역 생성
      const startX = selection.value.startX
      const startY = selection.value.startY

      // 좌표 정규화 (시작점이 항상 왼쪽 위, 종료점이 오른쪽 아래)
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)

      // 최소 크기 체크
      if (width < 10 || height < 10) {
        console.log('선택 영역이 너무 작음, 선택 취소')
        clearSelection()
        return
      }

      // 영역 선택 완료
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

      console.log('두 번째 클릭 - 영역 완성:', {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        final: { x, y, width, height }
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
          text: result.message, // message에 실제 추출된 텍스트가 들어있음
          image: tempImage, // 캡처된 이미지 저장
          x: selection.value.x,
          y: selection.value.y,
          width: selection.value.width,
          height: selection.value.height
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

                        // PDF Canvas에서 영역을 이미지로 캡처 (PDF.js 직접 방식)
        const capturePdfCanvas = async (pdfCanvas, selection) => {
          try {
            console.log('=== PDF Canvas 영역 캡처 시작 ===')
            console.log('선택된 영역:', selection)
            console.log('PDF Canvas 크기:', pdfCanvas.width, 'x', pdfCanvas.height)

            // PDF Canvas에서 직접 선택된 영역 캡처
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = selection.width
            tempCanvas.height = selection.height

            const ctx = tempCanvas.getContext('2d')

            // PDF Canvas에서 선택된 영역을 새 Canvas로 복사
            // 이 방식이 훨씬 더 정확하고 간단함!
            ctx.drawImage(
              pdfCanvas,
              selection.x, selection.y, selection.width, selection.height,
              0, 0, selection.width, selection.height
            )

            console.log('PDF Canvas 영역 캡처 성공')
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
    const selectionStyle = computed(() => ({
      left: `${selection.value.x}px`,
      top: `${selection.value.y}px`,
      width: `${selection.value.width}px`,
      height: `${selection.value.height}px`
    }))

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

      // 계산된 속성
      selectionStyle,
      canExecuteOcr,

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
      handleGoBack
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
}

.selection-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto; /* 마우스 이벤트 활성화 */
  z-index: 10; /* iframe 위에 표시 */
  cursor: crosshair;
  background: transparent; /* 투명 배경 */
  border: 1px solid rgba(59, 130, 246, 0.3); /* 디버깅용 테두리 */
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
</style>
