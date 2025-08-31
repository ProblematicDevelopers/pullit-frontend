<template>
  <div class="image-loading-status">
    <!-- 로딩 중 상태 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">이미지 로딩 중...</span>
        </div>
      </div>
      <div class="loading-text">
        <h5>이미지 로딩 중...</h5>
        <p class="text-muted">{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- 로딩 완료 상태 -->
    <div v-else-if="isLoaded" class="loaded-state">
      <div class="success-icon">
        <i class="bi bi-check-circle-fill text-success"></i>
      </div>
      <div class="success-text">
        <h5 class="text-success">이미지 로딩 완료</h5>
        <p class="text-muted">{{ successMessage }}</p>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="hasError" class="error-state">
      <div class="error-icon">
        <i class="bi bi-exclamation-triangle-fill text-warning"></i>
      </div>
      <div class="error-text">
        <h5 class="text-warning">이미지 로딩 실패</h5>
        <p class="text-muted">{{ errorMessage }}</p>
        <button @click="retryLoading" class="btn btn-outline-warning btn-sm mt-2">
          <i class="bi bi-arrow-clockwise me-1"></i>
          다시 시도
        </button>
      </div>
    </div>

    <!-- 대기 상태 -->
    <div v-else class="waiting-state">
      <div class="waiting-icon">
        <i class="bi bi-hourglass-split text-muted"></i>
      </div>
      <div class="waiting-text">
        <h5 class="text-muted">이미지 대기 중</h5>
        <p class="text-muted">{{ waitingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ImageLoadingStatus',
  props: {
    status: {
      type: String,
      default: 'waiting', // 'waiting', 'loading', 'loaded', 'error'
      validator: (value) => ['waiting', 'loading', 'loaded', 'error'].includes(value)
    },
    loadingMessage: {
      type: String,
      default: 'PDF 이미지를 변환하고 있습니다...'
    },
    successMessage: {
      type: String,
      default: '모든 이미지가 성공적으로 로드되었습니다.'
    },
    errorMessage: {
      type: String,
      default: '이미지 로딩에 실패했습니다. 다시 시도해주세요.'
    },
    waitingMessage: {
      type: String,
      default: 'PDF 업로드를 기다리고 있습니다.'
    }
  },
  emits: ['retry'],
  setup(props, { emit }) {
    const isLoading = computed(() => props.status === 'loading')
    const isLoaded = computed(() => props.status === 'loaded')
    const hasError = computed(() => props.status === 'error')

    const retryLoading = () => {
      emit('retry')
    }

    return {
      isLoading,
      isLoaded,
      hasError,
      retryLoading
    }
  }
}
</script>

<style scoped>
.image-loading-status {
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.loading-state,
.loaded-state,
.error-state,
.waiting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner,
.success-icon,
.error-icon,
.waiting-icon {
  font-size: 3rem;
}

.loading-text,
.success-text,
.error-text,
.waiting-text {
  text-align: center;
}

.loading-text h5,
.success-text h5,
.error-text h5,
.waiting-text h5 {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.loading-text p,
.success-text p,
.error-text p,
.waiting-text p {
  margin-bottom: 0;
  font-size: 0.9rem;
}

.bi-check-circle-fill {
  color: #22c55e;
}

.bi-exclamation-triangle-fill {
  color: #f59e0b;
}

.bi-hourglass-split {
  color: #94a3b8;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
