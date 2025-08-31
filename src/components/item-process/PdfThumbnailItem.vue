<template>
  <div
    class="thumbnail-item"
    :class="{
      active: isActive,
      selected: isSelected,
      'selected-for-move': isSelectedForMove,
      'move-target': isMoveTarget
    }"
    @click="handleClick"
    @dblclick="handleDblClick"
    :title="getTitle()"
  >
    <!-- 페이지 번호 -->
    <div class="thumbnail-number">{{ index + 1 }}</div>

    <!-- 페이지 미리보기 -->
    <img
      :src="page.preview"
      :alt="`페이지 ${index + 1} 썸네일`"
      class="pdf-thumbnail-image"
    />

    <!-- 선택 체크박스 -->
    <div class="thumbnail-checkbox">
      <input
        type="checkbox"
        :checked="isSelected"
        @change="handleSelectionChange"
        @click.stop
      />
    </div>


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
    isSelectedForMove: {
      type: Boolean,
      default: false
    },
    isMoveTarget: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click', 'dblclick', 'selection-change'],
  setup(props, { emit }) {
    const getTitle = () => {
      if (props.isMoveTarget) {
        return `페이지 ${props.index + 1} 클릭하여 순서 변경`;
      }
      return `페이지 ${props.index + 1} 클릭하여 미리보기, 클릭하여 순서 변경`;
    };

    const handleClick = () => {
      emit('click', props.index);
    };

    const handleDblClick = () => {
      emit('dblclick', props.index);
    };

    const handleSelectionChange = () => {
      emit('selection-change', props.index);
    };

    return {
      getTitle,
      handleClick,
      handleDblClick,
      handleSelectionChange
    };
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
  height: 180px;
  width: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

/* 이동 선택 상태 */
.thumbnail-item.selected-for-move {
  border-color: #10b981;
  background-color: #ecfdf5;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: pulse-border 1.5s infinite;
}

/* 이동 대상 페이지 상태 */
.thumbnail-item.move-target {
  border-color: #f59e0b;
  background-color: #fffbeb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.thumbnail-item.move-target:hover {
  border-color: #d97706;
  background-color: #fef3c7;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.thumbnail-item.move-target .thumbnail-number {
  background: #f59e0b;
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

.pdf-thumbnail-image {
  width: 100%;
  height: 140px;
  border: none;
  border-radius: 4px;
  background: #f8fafc;
  pointer-events: none;
  flex-shrink: 0;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
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


</style>
