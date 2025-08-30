<template>
  <div class="modal-footer">
    <div class="footer-actions">
      <button
        @click="prevStep"
        :disabled="!canGoPrev"
        class="btn btn-outline-secondary"
      >
        <i class="bi bi-arrow-left me-2"></i>이전
      </button>

      <button
        @click="nextStep"
        :disabled="!canGoNext"
        class="btn btn-primary"
      >
        {{ nextButtonText }}
        <i class="bi bi-arrow-right ms-2"></i>
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
  },
  canGoPrev: {
    type: Boolean,
    default: true
  },
  canGoNext: {
    type: Boolean,
    default: true
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  canConvert: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['prev', 'next'])

const nextButtonText = computed(() => {
  if (props.isProcessing) return '처리 중...'

  switch (props.currentStep) {
    case 1:
      return props.canConvert ? 'OCR 처리 시작' : '문제와 보기를 선택해주세요'
    case 2:
      return '다음'
    case 3:
      return '문제 저장'
    default:
      return '다음'
  }
})

const prevStep = () => {
  emit('prev')
}

const nextStep = () => {
  emit('next')
}
</script>

<style scoped>
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.btn {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-secondary {
  border: 1px solid #d1d5db;
  background-color: white;
  color: #64748b;
}

.btn-outline-secondary:hover:not(:disabled) {
  border-color: #94a3b8;
  background-color: #f1f5f9;
  color: #475569;
}

.btn-primary {
  border: 1px solid #3b82f6;
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn i {
  font-size: 0.875rem;
}
</style>
