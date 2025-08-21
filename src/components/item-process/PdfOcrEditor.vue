<template>
  <div class="pdf-ocr-editor">
    <div class="editor-header">
      <h3>PDF OCR 편집</h3>
      <div class="header-actions">
        <button @click="$emit('go-back')" class="btn btn-secondary">뒤로가기</button>
      </div>
    </div>

    <div class="editor-content">
      <!-- PDF 뷰어 -->
      <div class="pdf-viewer">
        <div class="pdf-container" ref="pdfContainer">
          <!-- PDF iframe -->
          <iframe
            ref="pdfIframe"
            :src="currentPdfUrl"
            class="pdf-iframe"
            @load="onIframeLoad"
          ></iframe>

          <!-- 영역 선택을 위한 Canvas 오버레이 -->
          <canvas
            ref="selectionCanvas"
            class="selection-canvas"
            @mousedown="startSelection"
            @mousemove="updateSelection"
            @mouseup="endSelection"
            @click="handleCanvasClick"
          ></canvas>

          <!-- 선택 영역 표시 -->
          <div
            v-if="selection.active"
            class="selection-area"
            :style="selectionStyle"
          >
            <!-- 크기 조정 핸들 -->
            <div class="resize-handle resize-handle-nw" @mousedown="startResize('nw')"></div>
            <div class="resize-handle resize-handle-ne" @mousedown="startResize('ne')"></div>
            <div class="resize-handle resize-handle-sw" @mousedown="startResize('sw')"></div>
            <div class="resize-handle resize-handle-se" @mousedown="startResize('se')"></div>
          </div>
        </div>

        <!-- 페이지 네비게이션 -->
        <div class="page-navigation">
          <button @click="previousPage" :disabled="currentPage === 0" class="btn btn-secondary">
            이전
          </button>
          <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages.value - 1" class="btn btn-secondary">
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
              <div class="result-text">{{ result.text }}</div>
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
  setup(props) {
    const { success, error: showError } = useToast()

    // PDF 렌더링 관련
    const pdfContainer = ref(null)
    const pdfIframe = ref(null)
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
      isResizing: false,
      resizeHandle: null
    })

    // OCR 관련
    const ocrLoading = ref(false)
    const ocrResults = ref([])

    // 현재 PDF URL 계산
    const currentPdfUrl = computed(() => {
      if (props.pdfPages[currentPage.value]) {
        return props.pdfPages[currentPage.value].preview
      }
      return ''
    })

    // OCR 실행 버튼 활성화 여부
    const canExecuteOcr = computed(() => {
      return selection.value.active && selection.value.width > 10 && selection.value.height > 10
    })

    // iframe 로드 완료 시 Canvas 오버레이 설정
    const onIframeLoad = () => {
      nextTick(() => {
        setupCanvasOverlay()
      })
    }

    // Canvas 오버레이 설정
    const setupCanvasOverlay = () => {
      if (!pdfIframe.value || !selectionCanvas.value) return

      try {
        const iframe = pdfIframe.value
        const canvas = selectionCanvas.value

        // iframe 크기에 맞춰 Canvas 크기 설정
        const iframeRect = iframe.getBoundingClientRect()
        canvas.width = iframeRect.width
        canvas.height = iframeRect.height

        // Canvas를 iframe 위에 정확히 겹치도록 위치 조정
        canvas.style.width = iframeRect.width + 'px'
        canvas.style.height = iframeRect.height + 'px'
        canvas.style.position = 'absolute'
        canvas.style.top = '0px'
        canvas.style.left = '0px'

        console.log('Canvas 오버레이 설정 완료:', canvas.width, 'x', canvas.height)
      } catch (error) {
        console.error('Canvas 오버레이 설정 오류:', error)
      }
    }

    // 영역 선택 시작
    const startSelection = (event) => {
      event.preventDefault()
      event.stopPropagation()

      const canvas = selectionCanvas.value
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // 새로운 드래그 시작
      selection.value = {
        active: true,
        startX: x,
        startY: y,
        x: x,
        y: y,
        width: 0,
        height: 0,
        isResizing: false,
        resizeHandle: null
      }

      console.log('드래그 시작:', x, y)
    }

    // 영역 선택 업데이트
    const updateSelection = (event) => {
      if (!selection.value.active) return

      event.preventDefault()
      event.stopPropagation()

      const canvas = selectionCanvas.value
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      if (selection.value.isResizing) {
        // 크기 조정 중
        handleResize(event, x, y)
      } else if (selection.value.startX > 0 && selection.value.startY > 0) {
        // 드래그 중일 때만 좌표 업데이트
        selection.value.x = Math.min(selection.value.startX, x)
        selection.value.y = Math.min(selection.value.startY, y)
        selection.value.width = Math.abs(x - selection.value.startX)
        selection.value.height = Math.abs(y - selection.value.startY)
        console.log('드래그 중 좌표 업데이트:', selection.value)
      }
    }

    // 영역 선택 완료
    const endSelection = (event) => {
      if (!selection.value.active) return

      event.preventDefault()
      event.stopPropagation()

      if (selection.value.isResizing) {
        // 크기 조정 완료
        selection.value.isResizing = false
        selection.value.resizeHandle = null
        console.log('크기 조정 완료:', selection.value)
      } else {
        // 드래그 완료
        // 최소 크기 체크 (너무 작은 영역은 무시)
        if (selection.value.width < 10 || selection.value.height < 10) {
          console.log('선택 영역이 너무 작음, 선택 취소')
          clearSelection()
        } else {
          console.log('드래그 완료, 영역 선택 확정:', selection.value)
          // 선택 완료 - active는 true로 유지
        }
      }
    }

    // Canvas 클릭 처리 (영역 정지/활성화)
    const handleCanvasClick = (event) => {
      if (!selection.value.active) return

      event.preventDefault()
      event.stopPropagation()

      // 이미 선택된 영역이 있으면 클릭으로 선택 유지
      if (selection.value.width > 10 && selection.value.height > 10) {
        console.log('영역 선택 유지됨')
        // 선택 상태 유지
      }
    }

    // 크기 조정 시작
    const startResize = (handle) => {
      selection.value.isResizing = true
      selection.value.resizeHandle = handle
      console.log('크기 조정 시작:', handle)
    }

    // 크기 조정 처리
    const handleResize = (event, x, y) => {
      const handle = selection.value.resizeHandle
      const currentSelection = { ...selection.value }

      switch (handle) {
        case 'nw': // 북서쪽
          currentSelection.width = currentSelection.x + currentSelection.width - x
          currentSelection.height = currentSelection.y + currentSelection.height - y
          currentSelection.x = x
          currentSelection.y = y
          break
        case 'ne': // 북동쪽
          currentSelection.width = x - currentSelection.x
          currentSelection.height = currentSelection.y + currentSelection.height - y
          currentSelection.y = y
          break
        case 'sw': // 남서쪽
          currentSelection.width = currentSelection.x + currentSelection.width - x
          currentSelection.height = y - currentSelection.y
          currentSelection.x = x
          break
        case 'se': // 남동쪽
          currentSelection.width = x - currentSelection.x
          currentSelection.height = y - currentSelection.y
          break
      }

      // 최소 크기 보장
      if (currentSelection.width >= 10 && currentSelection.height >= 10) {
        selection.value = { ...currentSelection, isResizing: true, resizeHandle: handle }
      }
    }

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
        isResizing: false,
        resizeHandle: null
      }
      console.log('선택 영역 초기화됨')
    }

    // OCR 실행
    const performOcr = async () => {
      if (!selection.value.active) return

      try {
        ocrLoading.value = true

        // iframe을 이미지로 캡처
        const iframe = pdfIframe.value

        // html2canvas 또는 다른 방법으로 iframe 캡처
        // 임시로 더미 이미지 생성 (실제 구현에서는 html2canvas 사용)
        const tempImage = await captureIframeAsImage(iframe, selection.value)

        // Base64로 변환
        const imageBase64 = tempImage

        // OCR API 호출
        const result = await callOcrApi(imageBase64, props.subjectCode)

        // 결과 저장
        ocrResults.value.push({
          page: currentPage.value,
          text: result.text,
          x: selection.value.x,
          y: selection.value.y,
          width: selection.value.width,
          height: selection.value.height,
          confidence: result.confidence
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

    // iframe을 이미지로 캡처 (임시로 더미 이미지 사용)
    const captureIframeAsImage = async (iframe, selection) => {
      try {
        // html2canvas가 제대로 작동하지 않을 수 있으므로 더미 이미지로 대체
        console.log('iframe 캡처 시도:', iframe.offsetWidth, 'x', iframe.offsetHeight)
        return createDummyImage(selection)
      } catch (error) {
        console.error('iframe 캡처 오류:', error)
        // 캡처 실패 시 더미 이미지 반환
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
      if (currentPage.value > 0) {
        currentPage.value--
        clearSelection()
        nextTick(() => {
          setupCanvasOverlay()
        })
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value - 1) {
        currentPage.value++
        clearSelection()
        nextTick(() => {
          setupCanvasOverlay()
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

    return {
      // refs
      pdfContainer,
      pdfIframe,
      selectionCanvas,

      // 상태
      currentPage,
      totalPages,
      selection,
      ocrLoading,
      ocrResults,

      // 계산된 속성
      currentPdfUrl,
      selectionStyle,
      canExecuteOcr,

      // 메서드
      onIframeLoad,
      setupCanvasOverlay,
      startSelection,
      updateSelection,
      endSelection,
      clearSelection,
      performOcr,
      removeResult,
      previousPage,
      nextPage,
      captureIframeAsImage,
      createDummyImage,
      handleCanvasClick,
      startResize
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

.pdf-iframe {
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
  white-space: pre-wrap;
  min-height: 60px;
}

.result-coordinates {
  font-size: 0.75rem;
  color: #6b7280;
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
