<template>
  <div class="area-selection-container">
    <!-- 지문 영역 -->
    <AreaSelectionBox
      v-if="activeSelectionType === 'question'"
      area-type="question"
      :selected-areas="selectedAreas"
    />

    <!-- 문제 영역 -->
    <AreaSelectionBox
      v-if="activeSelectionType === 'problem'"
      area-type="problem"
      :selected-areas="selectedAreas"
    />

    <!-- 이미지 영역 -->
    <AreaSelectionBox
      v-if="activeSelectionType === 'image'"
      area-type="image"
      :selected-areas="selectedAreas"
    />

    <!-- 보기 영역 -->
    <AreaSelectionBox
      v-if="activeSelectionType === 'options'"
      area-type="options"
      :selected-areas="selectedAreas"
    />
  </div>
</template>

<script setup>
import AreaSelectionBox from './AreaSelectionBox.vue'

const props = defineProps({
  activeSelectionType: {
    type: String,
    required: true
  },
  selectedAreas: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
/* 영역 선택 컨테이너 개선 */
.area-selection-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
  max-height: 800px;
  overflow-y: auto;
  padding: 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
  min-height: 600px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.area-selection-container::-webkit-scrollbar {
  width: 8px;
}

.area-selection-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.area-selection-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.area-selection-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .area-selection-container {
    max-height: 600px;
    padding: 1rem;
    gap: 1.5rem;
  }
}
</style>
