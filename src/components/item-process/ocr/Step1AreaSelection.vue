<template>
  <div class="step-content">
    <div class="area-selection-layout">
      <!-- 이미지 표시 및 영역 선택 -->
      <div class="image-section">
        <div class="image-header">
          <h4 class="section-title">
            <i class="bi bi-image me-2"></i>이미지
          </h4>
          <div class="zoom-controls">
            <button @click="zoomOut" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-zoom-out"></i>
            </button>
            <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomIn" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-zoom-in"></i>
            </button>
          </div>
        </div>

        <div class="image-container">
          <img
            :src="capturedImage"
            :alt="'업로드된 이미지'"
            class="uploaded-image"
            :style="{ transform: `scale(${zoomLevel})` }"
          />

          <!-- 영역 선택 오버레이 -->
          <canvas
            ref="selectionCanvas"
            class="selection-canvas"
            @click="handleCanvasClick"
          ></canvas>
        </div>
      </div>

      <!-- 영역 선택 컨트롤 -->
      <div class="selection-controls">
        <div class="control-header">
          <h4 class="section-title">
            <i class="bi bi-cursor me-2"></i>영역 선택
          </h4>
          <button
            @click="startCapture"
            :class="['btn', captureMode ? 'btn-warning' : 'btn-primary']"
            class="capture-btn"
          >
            <i :class="captureMode ? 'bi bi-stop-circle' : 'bi bi-play-circle'" class="me-2"></i>
            {{ captureMode ? '선택 중지' : '영역 선택 시작' }}
          </button>
        </div>

        <!-- 선택 상태 표시 -->
        <SelectionStatus
          :capture-mode="captureMode"
          :active-selection-type="activeSelectionType"
        />

        <!-- 영역 타입 탭 -->
        <AreaTypeTabs
          :active-selection-type="activeSelectionType"
          @area-type-selected="selectAreaType"
        />

        <!-- 영역 선택 컨테이너 -->
        <AreaSelectionContainer
          :active-selection-type="activeSelectionType"
          :selected-areas="selectedAreas"
        />
      </div>
    </div>

    <!-- 처리 버튼 -->
    <div class="processing-section">
      <div class="processing-status mb-3">
        <div class="row g-2">
          <div class="col-3">
            <div class="status-item" :class="{ completed: selectedAreas.question }">
              <i class="bi" :class="selectedAreas.question ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
              <span class="ms-2">지문</span>
              <small class="text-muted ms-1">(선택)</small>
            </div>
          </div>
          <div class="col-3">
            <div class="status-item" :class="{ completed: selectedAreas.problem }">
              <i class="bi" :class="selectedAreas.problem ? 'bi-check-circle-fill text-success' : 'bi-circle text-danger'"></i>
              <span class="ms-2">문제</span>
              <small class="text-danger ms-1">(필수)</small>
            </div>
          </div>
          <div class="col-3">
            <div class="status-item" :class="{ completed: selectedAreas.image }">
              <i class="bi" :class="selectedAreas.image ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
              <span class="ms-2">이미지</span>
              <small class="text-muted ms-1">(선택)</small>
            </div>
          </div>
          <div class="col-3">
            <div class="status-item" :class="{ completed: selectedAreas.options }">
              <i class="bi" :class="selectedAreas.options ? 'bi-check-circle-fill text-success' : 'bi-circle text-danger'"></i>
              <span class="ms-2">보기</span>
              <small class="text-danger ms-1">(필수)</small>
            </div>
          </div>
        </div>
      </div>

      <button
        @click="nextStep"
        :disabled="!canConvert || isProcessing"
        class="btn btn-success w-100"
        :class="{ 'btn-lg': canConvert }"
      >
        <i class="bi bi-arrow-right-circle me-2"></i>
        {{ isProcessing ? '처리 중...' : (canConvert ? 'OCR 처리 시작' : '문제와 보기를 선택해주세요') }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, watch } from 'vue'
import SelectionStatus from './SelectionStatus.vue'
import AreaTypeTabs from './AreaTypeTabs.vue'
import AreaSelectionContainer from './AreaSelectionContainer.vue'

export default {
  name: 'Step1AreaSelection',
  components: {
    SelectionStatus,
    AreaTypeTabs,
    AreaSelectionContainer
  },
  props: {
    capturedImage: {
      type: String,
      required: true
    },
    selectedAreas: {
      type: Object,
      required: true
    },
    activeSelectionType: {
      type: String,
      required: true
    },
    captureMode: {
      type: Boolean,
      required: true
    },
    zoomLevel: {
      type: Number,
      required: true
    },
    isProcessing: {
      type: Boolean,
      required: true
    }
  },
  emits: [
    'update:selectedAreas',
    'update:activeSelectionType',
    'update:captureMode',
    'update:zoomLevel',
    'next-step'
  ],
  setup(props, { emit }) {
    const selectionCanvas = ref(null)
    const currentSelection = ref({
      active: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      waitingForSecondClick: false
    })

    // 다음 단계로 진행 가능 여부
    const canConvert = computed(() => {
      return props.selectedAreas.problem && props.selectedAreas.options
    })

    // 줌 컨트롤
    const zoomIn = () => {
      const newZoom = Math.min(props.zoomLevel + 0.1, 4)
      emit('update:zoomLevel', newZoom)
    }

    const zoomOut = () => {
      const newZoom = Math.max(props.zoomLevel - 0.1, 0.1)
      emit('update:zoomLevel', newZoom)
    }

    // 영역 선택 시작
    const startCapture = () => {
      const newCaptureMode = !props.captureMode
      emit('update:captureMode', newCaptureMode)

      if (!newCaptureMode) {
        // 선택 모드 중지 시 현재 선택 초기화
        clearCurrentSelection()
      }

      console.log('영역 선택 모드:', newCaptureMode ? '시작' : '중지')
    }

    // 영역 타입 선택
    const selectAreaType = (areaType) => {
      emit('update:activeSelectionType', areaType)
      console.log('선택된 영역 타입:', areaType)
    }

    // Canvas 클릭 처리
    const handleCanvasClick = (event) => {
      if (!props.captureMode || !props.activeSelectionType) {
        return
      }

      if (currentSelection.value.waitingForSecondClick) {
        secondClick(event)
      } else {
        firstClick(event)
      }
    }

    // 첫 번째 클릭
    const firstClick = (event) => {
      const rect = event.target.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      currentSelection.value = {
        active: true,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        waitingForSecondClick: true
      }

      drawSelectionBox()
    }

    // 두 번째 클릭
    const secondClick = (event) => {
      const rect = event.target.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      currentSelection.value.endX = x
      currentSelection.value.endY = y
      currentSelection.value.waitingForSecondClick = false

      // 선택된 영역 처리
      processSelectedArea()
    }

    // 선택 박스 그리기
    const drawSelectionBox = () => {
      if (!selectionCanvas.value) return

      const ctx = selectionCanvas.value.getContext('2d')
      const { startX, startY, endX, endY } = currentSelection.value

      // Canvas 초기화
      ctx.clearRect(0, 0, selectionCanvas.value.width, selectionCanvas.value.height)

      // 선택 박스 그리기
      ctx.strokeStyle = '#007bff'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)

      ctx.strokeRect(x, y, width, height)
    }

    // 선택된 영역 처리
    const processSelectedArea = async () => {
      if (!currentSelection.value.active) return

      const { startX, startY, endX, endY } = currentSelection.value
      const areaType = props.activeSelectionType

      // 영역 좌표 계산
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)

      console.log('계산된 영역 좌표:', { x, y, width, height })

      // 영역 정보 생성
      const areaInfo = {
        x,
        y,
        width,
        height,
        imageData: await captureSelectedArea({ x, y, width, height })
      }

      // 선택된 영역 업데이트
      const newSelectedAreas = { ...props.selectedAreas }
      newSelectedAreas[areaType] = areaInfo
      emit('update:selectedAreas', newSelectedAreas)

      // 선택 초기화
      clearCurrentSelection()

      console.log(`${areaType} 영역 선택 완료:`, areaInfo)
    }

        // 선택된 영역을 이미지로 캡처
    const captureSelectedArea = async ({ x, y, width, height }) => {
      if (!currentSelection.value.active) {
        console.log('captureSelectedArea: 선택된 영역이 없음')
        return null
      }

      console.log('=== 영역 캡처 시작 ===')
      console.log('전달받은 좌표:', { x, y, width, height })
      console.log('capturedImage prop:', props.capturedImage ? props.capturedImage.substring(0, 100) + '...' : 'null')

      return new Promise((resolve) => {
        try {
          // 원본 이미지 로드
          const img = new Image()
          img.crossOrigin = 'anonymous' // CORS 오류 방지

          console.log('이미지 로딩 시작...')

          img.onload = () => {
            console.log('이미지 로딩 완료:', {
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              src: img.src.substring(0, 100) + '...'
            })

            try {
              // 이미지의 실제 표시 크기와 원본 크기의 비율 계산
              const imageElement = document.querySelector('.uploaded-image')
              if (!imageElement) {
                console.error('이미지 요소를 찾을 수 없음')
                resolve(null)
                return
              }

              const displayRect = imageElement.getBoundingClientRect()
              const scaleX = img.naturalWidth / displayRect.width
              const scaleY = img.naturalHeight / displayRect.height

              console.log('좌표 변환 정보:', {
                displaySize: { width: displayRect.width, height: displayRect.height },
                naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
                scale: { scaleX, scaleY },
                originalCoords: { x, y, width, height }
              })

              // 화면 좌표를 원본 이미지 좌표로 변환
              const originalX = Math.round(x * scaleX)
              const originalY = Math.round(y * scaleY)
              const originalWidth = Math.round(width * scaleX)
              const originalHeight = Math.round(height * scaleY)

              console.log('변환된 원본 좌표:', {
                original: { x: originalX, y: originalY, width: originalWidth, height: originalHeight }
              })

              // 임시 Canvas 생성
              const tempCanvas = document.createElement('canvas')
              tempCanvas.width = originalWidth
              tempCanvas.height = originalHeight

              const tempCtx = tempCanvas.getContext('2d')

              // 원본 이미지에서 선택된 영역 복사
              tempCtx.drawImage(img, originalX, originalY, originalWidth, originalHeight, 0, 0, originalWidth, originalHeight)

              const imageData = tempCanvas.toDataURL('image/png')
              console.log('영역 캡처 성공:', {
                area: { x: originalX, y: originalY, width: originalWidth, height: originalHeight },
                imageDataLength: imageData.length,
                imageDataPrefix: imageData.substring(0, 50) + '...'
              })
              resolve(imageData)
            } catch (error) {
              console.error('Canvas에서 이미지 복사 오류:', error)
              resolve(null)
            }
          }

          img.onerror = (error) => {
            console.error('이미지 로드 오류:', error)
            console.error('이미지 src:', img.src)
            resolve(null)
          }

          img.src = props.capturedImage
          console.log('이미지 src 설정됨:', img.src.substring(0, 100) + '...')

        } catch (error) {
          console.error('영역 캡처 오류:', error)
          resolve(null)
        }
      })
    }

    // 선택 초기화
    const clearCurrentSelection = () => {
      currentSelection.value = {
        active: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        waitingForSecondClick: false
      }

      if (selectionCanvas.value) {
        const ctx = selectionCanvas.value.getContext('2d')
        ctx.clearRect(0, 0, selectionCanvas.value.width, selectionCanvas.value.height)
      }
    }

    // 다음 단계로 진행
    const nextStep = () => {
      if (canConvert.value) {
        emit('next-step')
      }
    }

    // Canvas 설정
    const setupCanvas = () => {
      if (!selectionCanvas.value) return

      const img = new Image()
      img.onload = () => {
        // 이미지의 실제 표시 크기 가져오기
        const imageElement = document.querySelector('.uploaded-image')
        if (!imageElement) {
          console.error('이미지 요소를 찾을 수 없음')
          return
        }

        const displayRect = imageElement.getBoundingClientRect()

        // Canvas 크기를 이미지 표시 크기에 맞게 설정
        selectionCanvas.value.width = displayRect.width
        selectionCanvas.value.height = displayRect.height

        console.log('Canvas 설정 완료:', {
          canvasSize: { width: selectionCanvas.value.width, height: selectionCanvas.value.height },
          imageDisplaySize: { width: displayRect.width, height: displayRect.height },
          imageNaturalSize: { width: img.naturalWidth, height: img.naturalHeight },
          scale: {
            scaleX: img.naturalWidth / displayRect.width,
            scaleY: img.naturalHeight / displayRect.height
          }
        })
      }
      img.src = props.capturedImage
    }

    // 이미지 변경 시 Canvas 재설정
    watch(() => props.capturedImage, () => {
      nextTick(() => {
        setupCanvas()
      })
    }, { immediate: true })

    return {
      selectionCanvas,
      currentSelection,
      canConvert,
      zoomIn,
      zoomOut,
      startCapture,
      selectAreaType,
      handleCanvasClick,
      nextStep
    }
  }
}
</script>

<style scoped>
.step-content {
  padding: 1rem;
}

.area-selection-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.image-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-level {
  font-size: 0.9rem;
  color: #6c757d;
  min-width: 50px;
  text-align: center;
}

.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  background: white;
}

.uploaded-image {
  width: 100%;
  height: auto;
  display: block;
  transform-origin: top left;
}

.selection-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.selection-controls {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.capture-btn {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.processing-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
}

.processing-status {
  margin-bottom: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 0.9rem;
}

.status-item.completed {
  background: #d4edda;
  color: #155724;
}

.status-item i {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .area-selection-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
