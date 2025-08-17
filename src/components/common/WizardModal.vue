<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <!-- Modal Header -->
          <div class="modal-header">
            <h2 class="modal-title">시험지 생성 마법사</h2>
            <button @click="closeModal" class="modal-close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <TestWizardView 
              v-if="isOpen"
              :is-modal="true" 
              @close="closeModal" 
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import TestWizardView from '@/views/TestWizardView.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const isOpen = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    // 모달이 열릴 때 body 스크롤 방지
    document.body.style.overflow = 'hidden'
  } else {
    // 모달이 닫힐 때 body 스크롤 복구
    document.body.style.overflow = ''
  }
})

const closeModal = () => {
  isOpen.value = false
  emit('update:modelValue', false)
  emit('close')
  document.body.style.overflow = ''
}

const handleOverlayClick = (e) => {
  // 오버레이 클릭 시 닫기 (선택적)
  // closeModal()
}

// ESC 키로 닫기
const handleEscape = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

// ESC 키 이벤트 리스너 추가
document.addEventListener('keydown', handleEscape)

// 컴포넌트 unmount 시 이벤트 리스너 제거
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1400px;
  height: 90vh;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 9999;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
  flex-shrink: 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  background: white;
}

/* 모달 트랜지션 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-container {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-title {
    font-size: 18px;
  }
}
</style>