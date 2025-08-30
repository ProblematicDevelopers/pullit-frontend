<template>
  <div class="modal-header">
    <div class="header-left">
      <h2 class="modal-title">
        <i class="bi bi-file-earmark-text me-2"></i>
        OCR 결과 처리
      </h2>
      <div class="step-indicator">
        <span class="step-label">단계 {{ currentStep }}/{{ totalSteps }}</span>
        <div class="step-progress">
          <div
            class="step-progress-bar"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>
    <div class="header-right">
      <button @click="closeModal" class="btn-close">
        <span>&times;</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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
</script>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.header-left {
  flex: 1;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.step-progress {
  width: 200px;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.step-progress-bar {
  height: 100%;
  background-color: #3b82f6;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.header-right {
  flex-shrink: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
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

.btn-close span {
  line-height: 1;
}
</style>
