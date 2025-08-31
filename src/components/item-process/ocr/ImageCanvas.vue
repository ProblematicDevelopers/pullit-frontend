<template>
  <div class="image-canvas-container">
    <div class="canvas-wrapper">
      <!-- 이미지 캔버스 -->
      <canvas
        ref="imageCanvas"
        class="image-canvas"
        @click="handleCanvasClick"
      ></canvas>

      <!-- 선택 영역 캔버스 (오버레이) -->
      <canvas
        ref="selectionCanvas"
        class="selection-canvas"
        @click="handleCanvasClick"
      ></canvas>
    </div>

    <!-- 줌 컨트롤 -->
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
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  imageData: {
    type: String,
    required: true
  },
  captureMode: {
    type: Boolean,
    default: false
  },
  activeSelectionType: {
    type: String,
    default: null
  },
  currentSelection: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['areaSelected', 'selectionUpdate'])

const imageCanvas = ref(null)
const selectionCanvas = ref(null)
const zoomLevel = ref(1)

// 캔버스 설정
const setupCanvas = () => {
  if (!imageCanvas.value || !selectionCanvas.value) return

  const img = new Image()
  img.onload = () => {
    const canvas = imageCanvas.value
    const ctx = canvas.getContext('2d')

    canvas.width = img.width
    canvas.height = img.height

    ctx.drawImage(img, 0, 0)

    // 선택 캔버스도 같은 크기로 설정
    const selectionCtx = selectionCanvas.value.getContext('2d')
    selectionCanvas.value.width = img.width
    selectionCanvas.value.height = img.height

    updateSelectionCanvasPosition()
  }

  img.src = props.imageData
}

// 선택 캔버스 위치 업데이트
const updateSelectionCanvasPosition = () => {
  if (!imageCanvas.value || !selectionCanvas.value) return

  const imageRect = imageCanvas.value.getBoundingClientRect()
  const selectionCanvasEl = selectionCanvas.value

  selectionCanvasEl.style.position = 'absolute'
  selectionCanvasEl.style.top = imageRect.top + 'px'
  selectionCanvasEl.style.left = imageRect.left + 'px'
  selectionCanvasEl.style.width = imageRect.width + 'px'
  selectionCanvasEl.style.height = imageRect.height + 'px'
}

// 줌 인
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
    updateZoom()
  }
}

// 줌 아웃
const zoomOut = () => {
  if (zoomLevel.value > 0.25) {
    zoomLevel.value = Math.max(0.25, zoomLevel.value - 0.25)
    updateZoom()
  }
}

// 줌 업데이트
const updateZoom = () => {
  if (!imageCanvas.value) return

  const canvas = imageCanvas.value
  canvas.style.transform = `scale(${zoomLevel.value})`
  canvas.style.transformOrigin = 'top left'

  updateSelectionCanvasPosition()
}

// 캔버스 클릭 처리
const handleCanvasClick = (event) => {
  if (!props.captureMode || !props.activeSelectionType) return

  emit('canvasClick', event)
}

// 윈도우 리사이즈 감지
const handleResize = () => {
  updateSelectionCanvasPosition()
}

// 감시자 설정
watch(() => props.imageData, () => {
  nextTick(() => {
    setupCanvas()
  })
})

// 라이프사이클
onMounted(() => {
  setupCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.image-canvas-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.image-canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.selection-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
}

.zoom-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-radius: 6px;
}

.zoom-level {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  min-width: 50px;
  text-align: center;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
