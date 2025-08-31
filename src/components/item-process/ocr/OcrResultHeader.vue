<template>
  <div class="ocr-result-header">
    <div class="header-container">
      <h1 class="header-title">
        <i class="bi bi-file-earmark-text me-2"></i>
        문제 추출
      </h1>
      <p class="header-subtitle">PDF에서 추출한 문제를 편집하세요</p>

      <!-- 단계별 진행 표시기 -->
      <div class="progress-stepper">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="step-item d-flex align-items-center"
          :class="{
            active: currentStep === index + 1,
            completed: currentStep > index + 1
          }"
        >
          <div class="step-number rounded-circle d-flex align-items-center justify-content-center fw-bold">
            {{ index + 1 }}
          </div>
          <span class="step-label ms-2 fw-medium">{{ step.label }}</span>
          <div class="step-connector ms-3" v-if="currentStep > index + 1"></div>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button @click="closeModal" class="btn-close">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

// 단계 정보
const steps = [
  { label: '추출', key: 'extract' },
  { label: '편집', key: 'edit' },
  { label: '정보입력', key: 'info' },
  { label: '미리보기', key: 'preview' }
]
</script>

<style scoped>
.ocr-result-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-container {
  flex: 1;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 2rem;
}

.header-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
}

.header-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 2rem 0;
}

.progress-stepper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
}

.step-item {
  position: relative;
  display: flex;
  align-items: center;
}

.step-number {
  width: 32px;
  height: 32px;
  background-color: #e2e8f0;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
}

.step-connector {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  height: 2px;
  background-color: #e2e8f0;
  z-index: -1;
}

.step-item.active .step-number {
  background-color: #3b82f6;
  color: white;
}

.step-item.active .step-label {
  color: #1e293b;
  font-weight: 600;
}

.step-item.completed .step-number {
  background-color: #10b981;
  color: white;
}

.step-item.completed .step-label {
  color: #10b981;
  font-weight: 600;
}

.header-actions {
  flex-shrink: 0;
  padding-right: 2rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.btn-close:hover {
  background-color: #e2e8f0;
  color: #1e293b;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .ocr-result-header {
    padding: 2rem 0;
  }

  .header-container {
    padding: 0 1rem;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .progress-stepper {
    gap: 1rem;
  }

  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .step-label {
    font-size: 0.75rem;
  }

  .header-actions {
    padding-right: 1rem;
  }
}
</style>
