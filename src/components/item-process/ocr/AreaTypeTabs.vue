<template>
  <div class="area-type-tabs">
    <div class="tab-header">
      <button
        @click="selectAreaType('question')"
        class="tab-btn"
        :class="{ active: activeSelectionType === 'question' }"
      >
        <i class="bi bi-file-text me-1"></i>지문
      </button>
      <button
        @click="selectAreaType('options')"
        class="tab-btn"
        :class="{ active: activeSelectionType === 'options' }"
      >
        <i class="bi bi-list-check me-1"></i>보기
      </button>
      <button
        @click="selectAreaType('problem')"
        class="tab-btn"
        :class="{ active: activeSelectionType === 'problem' }"
      >
        <i class="bi bi-question-circle me-1"></i>문제
      </button>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  activeSelectionType: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['areaTypeSelected'])

const selectAreaType = (areaType) => {
  emit('areaTypeSelected', areaType)
}
</script>

<style scoped>
/* 영역 타입 선택 탭 스타일 */
.area-type-tabs {
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  overflow: hidden;
}

.tab-header {
  display: flex;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.tab-btn {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border: none;
  background-color: transparent;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  justify-content: center;
  position: relative;
  border-right: 1px solid #e2e8f0;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.tab-btn.active {
  background-color: white;
  color: #1e293b;
  font-weight: 600;
  border-bottom: 2px solid #3b82f6;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3b82f6;
}

.tab-btn i {
  font-size: 0.875rem;
  margin-right: 0.5rem;
}
</style>
