<template>
  <div class="thumbnail-grid">
    <div class="thumbnail-header">
      <div class="thumbnail-title-section">
        <h3>페이지 목록</h3>
        <p class="current-page-indicator">
          현재 {{ currentPageIndex + 1 }}/{{ pdfPages.length }}
        </p>
        <p v-if="selectedForMove === null" class="click-instruction">
          🖱️ 썸네일을 클릭하여 순서를 변경할 수 있습니다
        </p>
        <p v-else class="move-instruction">
          🎯 <strong>페이지 {{ selectedForMove + 1 }}</strong>을 이동할 위치를 선택하세요
        </p>
      </div>
      <div class="thumbnail-actions">
        <button
          @click="handleSelectAll"
          class="btn btn-small btn-outline"
        >
          전체 선택
        </button>
        <button
          @click="handleClearSelection"
          class="btn btn-small btn-outline"
        >
          선택 해제
        </button>
        <button
          @click="handleRemoveSelected"
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
        :is-selected-for-move="selectedForMove === index"
        :is-move-target="selectedForMove !== null && selectedForMove !== index"
        @click="handlePageClick(index)"
        @dblclick="handlePageDblClick(index)"
        @selection-change="handleSelectionChange(index)"
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
    selectedForMove: {
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
    'page-moved'
  ],
  setup(props, { emit }) {

    // 클릭 기반 순서 변경 로직
        const handlePageClick = (index) => {
      if (props.selectedForMove === null) {
        // 첫 번째 클릭: 이동할 페이지 선택
        emit('page-click', index)
      } else if (props.selectedForMove === index) {
        // 같은 페이지 클릭: 선택 해제
        emit('page-click', null)
      } else {
        // 두 번째 클릭: 순서 변경
        // PdfEditor에서 page-moved 이벤트를 발생시키기 위해 page-click 이벤트 전달
        emit('page-click', index)
      }
    }

    // 추가 핸들러 함수들
    const handleSelectAll = () => {
      emit('select-all')
    }

    const handleClearSelection = () => {
      emit('clear-selection')
    }

    const handleRemoveSelected = () => {
      emit('remove-selected')
    }

    const handlePageDblClick = (index) => {
      emit('page-dblclick', index)
    }

    const handleSelectionChange = (index) => {
      emit('selection-change', index)
    }

    return {
      handlePageClick,
      handleSelectAll,
      handleClearSelection,
      handleRemoveSelected,
      handlePageDblClick,
      handleSelectionChange
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

.click-instruction {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.move-instruction {
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
  gap: 1rem;
  margin-bottom: 1rem;
  flex: 1;
  overflow-y: auto;
  max-height: 600px;
  align-content: start;
  justify-items: center;
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
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .thumbnails {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
}
</style>
