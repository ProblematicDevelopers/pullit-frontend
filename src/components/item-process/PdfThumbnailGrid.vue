<template>
  <div class="thumbnail-grid">
    <div class="thumbnail-header">
      <div class="thumbnail-title-section">
        <h3>페이지 목록</h3>
        <p class="current-page-indicator">
          현재 {{ currentPageIndex + 1 }}/{{ pdfPages.length }}
        </p>
        <p class="drag-instruction">🔄 썸네일을 드래그하여 순서를 변경할 수 있습니다</p>
      </div>
      <div class="thumbnail-actions">
        <button
          @click="$emit('select-all')"
          class="btn btn-small btn-outline"
        >
          전체 선택
        </button>
        <button
          @click="$emit('clear-selection')"
          class="btn btn-small btn-outline"
        >
          선택 해제
        </button>
        <button
          @click="$emit('remove-selected')"
          class="btn btn-small btn-danger"
          :disabled="selectedPages.length === 0"
        >
          삭제 ({{ selectedPages.length }})
        </button>
      </div>
    </div>

    <!-- 썸네일 목록 -->
    <div class="thumbnails">
      <PdfThumbnailItem
        v-for="(page, index) in pdfPages"
        :key="`page-${index}`"
        :page="page"
        :index="index"
        :is-active="index === currentPageIndex"
        :is-selected="selectedPages.includes(index)"
        :is-dragging="dragIndex === index"
        :is-drag-over="dropIndex === index && dragIndex !== index"
        :is-drag-placeholder="isDragPlaceholder(index)"
        @click="$emit('page-click', index)"
        @dblclick="$emit('page-dblclick', index)"
        @selection-change="$emit('selection-change', index)"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @drag-over="handleDragOver"
        @drag-leave="handleDragLeave"
        @drop="handleDrop"
      />
    </div>
  </div>
</template>

<script>
import PdfThumbnailItem from './PdfThumbnailItem.vue'

export default {
  name: 'PdfThumbnailGrid',
  components: {
    PdfThumbnailItem
  },
  props: {
    pdfPages: {
      type: Array,
      required: true
    },
    currentPageIndex: {
      type: Number,
      required: true
    },
    selectedPages: {
      type: Array,
      required: true
    },
    dragIndex: {
      type: Number,
      default: null
    },
    dropIndex: {
      type: Number,
      default: null
    }
  },
  emits: [
    'select-all',
    'clear-selection',
    'remove-selected',
    'page-click',
    'page-dblclick',
    'selection-change',
    'drag-start',
    'drag-end',
    'drag-over',
    'drag-leave',
    'drop'
  ],
  setup(props, { emit }) {
    // 드래그 플레이스홀더 여부 확인
    const isDragPlaceholder = (index) => {
      if (props.dragIndex === null || props.dropIndex === null) return false

      // 드래그 방향에 따라 플레이스홀더 표시
      if (props.dragIndex < props.dropIndex) {
        // 앞에서 뒤로 드래그: 드롭 위치에 빈 공간 표시
        return index === props.dropIndex
      } else {
        // 뒤에서 앞으로 드래그: 드롭 위치에 빈 공간 표시
        return index === props.dropIndex
      }
    }

    const handleDragStart = (event, index) => {
      console.log('📋 drag-start 수신:', index)

      // 인덱스 유효성 검사
      if (index === null || index === undefined || index < 0) {
        console.error('유효하지 않은 드래그 인덱스:', index)
        return
      }

      emit('drag-start', event, index)
    }

    const handleDragEnd = (event) => {
      emit('drag-end', event)
    }

    const handleDragOver = (event, index) => {
      // 인덱스 유효성 검사
      if (index === null || index === undefined || index < 0) {
        console.error('유효하지 않은 드래그 오버 인덱스:', index)
        return
      }

      emit('drag-over', event, index)
    }

    const handleDragLeave = (event) => {
      emit('drag-leave', event)
    }

    const handleDrop = (event, index) => {
      // 인덱스 유효성 검사
      if (index === null || index === undefined || index < 0) {
        console.error('유효하지 않은 드롭 인덱스:', index)
        return
      }

      emit('drop', event, index)
    }

    return {
      isDragPlaceholder,
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
/* 오른쪽: 썸네일 그리드 */
.thumbnail-grid {
  flex: 0.3 0 320px;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 700px;
  display: flex;
  flex-direction: column;
  max-height: 700px;
}

.thumbnail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
  gap: 1rem;
}

.thumbnail-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.thumbnail-title-section h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  white-space: nowrap;
}

.current-page-indicator {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 400;
  white-space: nowrap;
}

.drag-instruction {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.thumbnail-actions {
  display: flex;
  gap: 0.375rem;
  flex-wrap: nowrap;
  align-items: center;
  flex-shrink: 0;
}

.thumbnails {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
  align-content: start;
}

/* 버튼 스타일 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.1s ease;
}

.btn-small {
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  min-width: fit-content;
}

.btn-outline {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .thumbnail-grid {
    flex: none;
  }

  .thumbnails {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .thumbnails {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
