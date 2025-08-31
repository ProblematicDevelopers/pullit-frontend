<template>
  <div class="area-selection-item">
    <h4 class="area-title">
      <i :class="getAreaIcon(areaType)" class="me-2"></i>
      {{ getAreaTypeLabel(areaType) }}
      <span :class="getBadgeClass(areaType)" class="ms-2">
        {{ getBadgeText(areaType) }}
      </span>
    </h4>

    <div
      :class="['area-selection-box', `${areaType}-box`, { selected: selectedAreas[areaType] }]"
      @click="handleAreaClick"
    >
      <div v-if="!selectedAreas[areaType]" class="area-placeholder">
        <i class="bi bi-plus-circle display-6 text-muted"></i>
        <span class="placeholder-text">{{ getAreaTypeLabel(areaType) }} 영역 선택 공간</span>
        <small class="text-muted d-block mt-2">
          {{ getAreaTypeLabel(areaType) }} 탭이 선택되었습니다. 이미지에서 {{ getAreaTypeLabel(areaType) }} 영역을 드래그하여 선택하세요
        </small>
      </div>

      <div v-else class="selected-area-content">
        <img
          :src="selectedAreas[areaType].imageData"
          :alt="`선택된 ${getAreaTypeLabel(areaType)} 영역`"
          class="selected-area-image"
        />
        <span :class="getAreaBadgeClass(areaType)" class="area-badge">
          {{ getAreaTypeLabel(areaType) }}
        </span>
        <span class="area-check">
          <i class="bi bi-check-circle-fill"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  areaType: {
    type: String,
    required: true
  },
  selectedAreas: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['area-clicked'])

const handleAreaClick = () => {
  if (!props.selectedAreas[props.areaType]) {
    emit('area-clicked', props.areaType)
  }
}

const getAreaIcon = (type) => {
  const icons = {
    question: 'bi bi-file-text',
    options: 'bi bi-list-check',
    problem: 'bi bi-question-circle',
    image: 'bi bi-image'
  }
  return icons[type] || 'bi bi-question-circle'
}

const getAreaTypeLabel = (type) => {
  const labels = {
    question: '지문',
    options: '보기',
    problem: '문제',
    image: '이미지'
  }
  return labels[type] || type
}

const getBadgeClass = (type) => {
  const badgeClasses = {
    question: 'badge bg-secondary',
    options: 'badge bg-primary',
    problem: 'badge bg-primary',
    image: 'badge bg-secondary'
  }
  return badgeClasses[type] || 'badge bg-secondary'
}

const getBadgeText = (type) => {
  const badgeTexts = {
    question: '선택사항',
    options: '필수',
    problem: '필수',
    image: '선택사항'
  }
  return badgeTexts[type] || '선택사항'
}

const getAreaBadgeClass = (type) => {
  const badgeClasses = {
    question: 'bg-primary',
    options: 'bg-warning',
    problem: 'bg-info',
    image: 'bg-success'
  }
  return badgeClasses[type] || 'bg-secondary'
}
</script>

<style scoped>
.area-selection-item {
  margin-bottom: 2rem;
}

.area-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
}

.area-selection-box {
  min-height: 160px;
  height: auto;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: white;
  padding: 1.5rem;
}

.area-selection-box:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.area-selection-box.selected {
  border-style: solid;
  border-width: 3px;
  background-color: #f0f9ff;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transform: scale(1.02);
}

.area-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #64748b;
}

.placeholder-text {
  font-size: 1rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.selected-area-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.selected-area-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.area-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  border-radius: 4px;
}

.area-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #10b981;
  font-size: 1.25rem;
}

.display-6 {
  font-size: 3rem;
}

.text-muted {
  color: #6b7280;
}

.me-2 {
  margin-right: 0.5rem;
}

.ms-2 {
  margin-left: 0.5rem;
}

.d-block {
  display: block;
}

.mt-2 {
  margin-top: 0.5rem;
}
</style>
