<template>
  <div class="method-selection-container">
    <!-- 방식 선택 헤더 -->
    <div class="selection-header text-center mb-5">
      <h2 class="selection-title">문제 등록 방식을 선택하세요</h2>
      <p class="selection-subtitle text-muted">새 파일을 업로드하거나 기존 파일에서 선택할 수 있습니다</p>
    </div>

    <!-- 방식 선택 카드들 -->
    <div class="row g-4">
      <!-- 새 파일 업로드 방식 -->
      <div class="col-md-6">
        <div class="method-card h-100" @click="selectMethod('new')" :class="{ active: selectedMethod === 'new' }">
          <div class="card-body text-center p-4">
            <div class="method-icon mb-3">
              <i class="bi bi-cloud-upload display-4 text-primary"></i>
            </div>
            <h4 class="method-title mb-3">새 파일 업로드</h4>
            <p class="method-description text-muted mb-4">
              교과서를 선택하고 새로운 PDF 파일을 업로드하여 문제를 등록합니다.
            </p>
            <div class="method-steps">
              <div class="step-item">
                <i class="bi bi-1-circle-fill me-2"></i>교과서 선택
              </div>
              <div class="step-item">
                <i class="bi bi-2-circle-fill me-2"></i>PDF 업로드
              </div>
              <div class="step-item">
                <i class="bi bi-3-circle-fill me-2"></i>PDF 편집
              </div>
              <div class="step-item">
                <i class="bi bi-4-circle-fill me-2"></i>문제 추출
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 기존 파일 선택 방식 -->
      <div class="col-md-6">
        <div class="method-card h-100" @click="selectMethod('existing')" :class="{ active: selectedMethod === 'existing' }">
          <div class="card-body text-center p-4">
            <div class="method-icon mb-3">
              <i class="bi bi-files display-4 text-success"></i>
            </div>
            <h4 class="method-title mb-3">기존 파일 선택</h4>
            <p class="method-description text-muted mb-4">
              이전에 업로드한 파일 목록에서 선택하여 바로 편집을 시작합니다.
            </p>
            <div class="method-steps">
              <div class="step-item">
                <i class="bi bi-1-circle-fill me-2"></i>파일 목록 조회
              </div>
              <div class="step-item">
                <i class="bi bi-2-circle-fill me-2"></i>파일 선택
              </div>
              <div class="step-item">
                <i class="bi bi-3-circle-fill me-2"></i>PDF 편집
              </div>
              <div class="step-item">
                <i class="bi bi-4-circle-fill me-2"></i>문제 추출
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 선택 확인 버튼 -->
    <div class="selection-actions text-center mt-5">
      <button 
        class="btn btn-primary btn-lg px-5" 
        :disabled="!selectedMethod"
        @click="confirmSelection"
      >
        <i class="bi bi-arrow-right me-2"></i>
        {{ selectedMethod === 'new' ? '새 파일 업로드 시작' : '기존 파일에서 선택' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'ProcessingMethodSelection',
  emits: ['method-selected'],
  setup(props, { emit }) {
    const selectedMethod = ref(null)

    const selectMethod = (method) => {
      selectedMethod.value = method
    }

    const confirmSelection = () => {
      if (selectedMethod.value) {
        emit('method-selected', selectedMethod.value)
      }
    }

    return {
      selectedMethod,
      selectMethod,
      confirmSelection
    }
  }
}
</script>

<style scoped>
.method-selection-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 0;
}

.selection-header {
  margin-bottom: 3rem;
}

.selection-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.selection-subtitle {
  font-size: 1.125rem;
  color: #64748b;
}

.method-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.method-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.method-card.active {
  border-color: #3b82f6;
  background: #f8faff;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.method-icon {
  opacity: 0.8;
}

.method-card.active .method-icon {
  opacity: 1;
}

.method-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #1e293b;
}

.method-description {
  font-size: 1rem;
  line-height: 1.6;
}

.method-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.step-item i {
  color: #3b82f6;
  font-size: 1rem;
}

.selection-actions {
  margin-top: 3rem;
}

.btn-primary {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 1.125rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .method-selection-container {
    padding: 1rem;
  }
  
  .selection-title {
    font-size: 1.5rem;
  }
  
  .selection-subtitle {
    font-size: 1rem;
  }
  
  .method-card {
    margin-bottom: 1rem;
  }
  
  .method-steps {
    text-align: left;
  }
  
  .btn-primary {
    width: 100%;
    padding: 1rem;
  }
}
</style>