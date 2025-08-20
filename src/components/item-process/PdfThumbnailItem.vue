<template>
  <div
    class="thumbnail-item"
    :class="{
      active: isActive,
      selected: isSelected,
      'dragging': isDragging,
      'drag-over': isDragOver,
      'drag-placeholder': isDragPlaceholder
    }"
    :draggable="true"
    @click="$emit('click', index)"
    @dblclick="$emit('dblclick', index)"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    :title="`페이지 ${index + 1} 클릭하여 미리보기, 드래그하여 순서 변경`"
  >
    <!-- 페이지 번호 -->
    <div class="thumbnail-number">{{ index + 1 }}</div>

    <!-- 페이지 미리보기 -->
    <iframe
      :src="page.preview"
      :title="`페이지 ${index + 1} 썸네일`"
      class="pdf-thumbnail-frame"
      frameborder="0"
    ></iframe>

    <!-- 선택 체크박스 -->
    <div class="thumbnail-checkbox">
      <input
        type="checkbox"
        :checked="isSelected"
        @change="$emit('selection-change', index)"
        @click.stop
      />
    </div>

    <!-- 드래그 핸들 아이콘 -->
    <div class="drag-handle">⋮⋮</div>
  </div>
</template>

<script>
export default {
  name: 'PdfThumbnailItem',
  props: {
    page: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    isDragging: {
      type: Boolean,
      default: false
    },
    isDragOver: {
      type: Boolean,
      default: false
    },
    isDragPlaceholder: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click', 'dblclick', 'selection-change', 'drag-start', 'drag-end', 'drag-over', 'drag-leave', 'drop'],
  setup(props, { emit }) {
    const handleDragStart = (event) => {
      console.log('📱 드래그 시작:', props.index)

      // 인덱스 유효성 검사
      if (props.index === null || props.index === undefined || props.index < 0) {
        console.error('유효하지 않은 드래그 인덱스:', props.index)
        event.preventDefault()
        return
      }

      // 페이지 객체 유효성 검사
      if (!props.page || typeof props.page !== 'object') {
        console.error('유효하지 않은 페이지 객체:', props.page)
        event.preventDefault()
        return
      }

      // 이벤트 데이터 설정 (디버깅용)
      if (event.dataTransfer) {
        event.dataTransfer.setData('debug/index', props.index.toString())
        event.dataTransfer.setData('debug/timestamp', Date.now().toString())
        event.dataTransfer.setData('debug/pageInfo', JSON.stringify({
          index: props.index,
          pageNumber: props.page.pageNumber,
          hasPreview: !!props.page.preview
        }))
      }

      emit('drag-start', event, props.index)
    }

    const handleDragEnd = (event) => {
      console.log('📱 드래그 종료:', props.index)

      // 드래그 종료 시 스타일 강제 초기화
      const element = event.target
      if (element) {
        element.style.opacity = '1'
        element.style.transform = 'none'
        element.style.zIndex = 'auto'
        // CSS 클래스도 제거
        element.classList.remove('dragging', 'drag-over', 'drag-placeholder')
      }

      emit('drag-end', event)
    }

    const handleDragOver = (event) => {
      // 인덱스 유효성 검사
      if (props.index === null || props.index === undefined || props.index < 0) {
        console.error('유효하지 않은 드래그 오버 인덱스:', props.index)
        return
      }

      emit('drag-over', event, props.index)
    }

    const handleDragLeave = (event) => {
      emit('drag-leave', event)
    }

    const handleDrop = (event) => {
      // 인덱스 유효성 검사
      if (props.index === null || props.index === undefined || props.index < 0) {
        console.error('유효하지 않은 드롭 인덱스:', props.index)
        return
      }

      emit('drop', event, props.index)
    }

    return {
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop
    }
  }
}
</script>

<style scoped>
.thumbnail-item {
  position: relative;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  background: white;
  transition: all 0.15s ease;
  user-select: none;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.thumbnail-item:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.thumbnail-item.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.thumbnail-item.selected {
  border-color: #ff5d5d;
  background-color: #ffefef;
}

.thumbnail-item.selected.active {
  border-color: #ff5d5d;
  background-color: #ffefef;
}

/* 드래그 앤 드롭 관련 스타일 */
.thumbnail-item.dragging {
  opacity: 0.6 !important;
  transform: scale(0.95) rotate(2deg) !important;
  z-index: 1000 !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  transition: none !important; /* 드래그 중에는 애니메이션 비활성화 */
}

.thumbnail-item.dragging * {
  pointer-events: none; /* 드래그 중 내부 요소 클릭 방지 */
}

.thumbnail-item.drag-over {
  border-color: #10b981 !important;
  background-color: #ecfdf5 !important;
  transform: scale(1.02) !important;
}

.thumbnail-item.drag-over::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #10b981;
  border-radius: 10px;
  pointer-events: none;
  animation: pulse-border 1.5s ease-in-out infinite;
}

/* 드래그 플레이스홀더 - 빈 공간 표시 */
.thumbnail-item.drag-placeholder {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px dashed #0ea5e9;
  border-radius: 8px;
  opacity: 0.8;
  transform: scale(0.98);
}

.thumbnail-item.drag-placeholder::before {
  content: '📄';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  opacity: 0.6;
  pointer-events: none;
}

.thumbnail-item.drag-placeholder .thumbnail-number,
.thumbnail-item.drag-placeholder .pdf-thumbnail-frame,
.thumbnail-item.drag-placeholder .thumbnail-checkbox,
.thumbnail-item.drag-placeholder .drag-handle {
  opacity: 0.3;
}

@keyframes pulse-border {
  0%, 100% {
    border-color: #10b981;
    opacity: 1;
  }
  50% {
    border-color: #059669;
    opacity: 0.7;
  }
}

.thumbnail-number {
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  background: #3b82f6;
  border: 1px solid #ffffff;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 800;
  padding: 0.125rem 0.375rem;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

.pdf-thumbnail-frame {
  width: 100%;
  height: 120px;
  border: none;
  border-radius: 4px;
  background: #f8fafc;
  pointer-events: none;
  flex-shrink: 0;
}

.thumbnail-checkbox {
  position: absolute;
  top: 0.15rem;
  right: 0.15rem;
  z-index: 1;
}

.thumbnail-checkbox input[type="checkbox"] {
  width: 25px;
  height: 25px;
  cursor: pointer;
}

/* 드래그 핸들 */
.drag-handle {
  position: absolute;
  bottom: 0.15rem;
  right: 0.15rem;
  color: #94a3b8;
  font-size: 0.875rem;
  cursor: grab;
  z-index: 1;
  user-select: none;
  transition: color 0.15s ease;
}

.drag-handle:hover {
  color: #64748b;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
