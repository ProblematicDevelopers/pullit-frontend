<template>
  <div class="pdf-upload-section">
    <h2 class="section-title">2. PDF 업로드</h2>
    <p class="section-description">선택된 교과서: {{ selectedTextbook?.subjectName }}</p>

    <!-- PDF 업로드 영역 -->
    <div
      class="upload-area"
      @click="triggerFileInput"
      @drop="handleFileDrop"
      @dragover.prevent
      @dragenter.prevent
      @dragleave.prevent
    >
      <!-- 업로드 아이콘 -->
      <div class="upload-icon">
        <svg viewBox="0 0 24 24" class="icon">
          <path
            d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"
          />
        </svg>
      </div>

      <!-- 업로드 안내 텍스트 -->
      <p class="upload-text">PDF 파일을 클릭하거나 드래그하여 업로드하세요</p>
      <p class="upload-hint">지원 형식: PDF</p>

      <!-- 파일 크기 제한 안내 -->
      <p class="upload-limit">최대 파일 크기: 50MB</p>
    </div>

    <!-- 숨겨진 파일 입력 요소 -->
    <input
      ref="fileInput"
      type="file"
      accept=".pdf"
      @change="handleFileSelect"
      style="display: none"
    />

    <!-- 네비게이션 버튼들 -->
    <div class="navigation-buttons">
      <button @click="goBack" class="btn btn-secondary">
        뒤로가기
      </button>
      <button
        @click="goToPdfEdit"
        class="btn btn-primary"
        :disabled="!pdfFile"
      >
        다음
      </button>
    </div>

    <!-- 에러 메시지 표시 -->
    <div v-if="errorMessage" class="error-message">
      <div class="error-icon">⚠️</div>
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'PdfUpload',
  props: {
    // 선택된 교과서 정보
    selectedTextbook: {
      type: Object,
      required: true
    },
    // 현재 PDF 파일
    pdfFile: {
      type: File,
      default: null
    }
  },
  emits: ['file-selected', 'go-back', 'go-to-pdf-edit'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const errorMessage = ref('')

    // 파일 입력 트리거 (업로드 영역 클릭 시)
    const triggerFileInput = () => {
      fileInput.value.click()
    }

    // 파일 선택 처리
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        validateAndProcessFile(file)
      }
    }

    // 파일 드롭 처리
    const handleFileDrop = (event) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file) {
        validateAndProcessFile(file)
      }
    }

    // 파일 유효성 검사 및 처리
    const validateAndProcessFile = (file) => {
      // 에러 메시지 초기화
      errorMessage.value = ''

      // 파일 타입 검사
      if (file.type !== 'application/pdf') {
        errorMessage.value = 'PDF 파일만 업로드할 수 있습니다.'
        return
      }

      // 파일 크기 검사 (50MB 제한)
      const maxSize = 50 * 1024 * 1024 // 50MB in bytes
      if (file.size > maxSize) {
        errorMessage.value = '파일 크기가 50MB를 초과합니다.'
        return
      }

      // 파일이 유효하면 부모 컴포넌트에 전달
      emit('file-selected', file)
    }

    // 뒤로가기 처리
    const goBack = () => {
      emit('go-back')
    }

    // PDF 편집 화면으로 이동
    const goToPdfEdit = () => {
      if (props.pdfFile) {
        emit('go-to-pdf-edit')
      }
    }

    return {
      fileInput,
      errorMessage,
      triggerFileInput,
      handleFileSelect,
      handleFileDrop,
      goBack,
      goToPdfEdit
    }
  }
}
</script>

<style scoped>
/* 섹션 제목 스타일 */
.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: #64748b;
  margin: 0 0 2rem 0;
}

/* PDF 업로드 영역 */
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  margin-bottom: 2rem;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.upload-area:active {
  transform: scale(0.98);
}

/* 업로드 아이콘 */
.upload-icon {
  width: 64px;
  height: 64px;
  background: #eff6ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.upload-icon .icon {
  width: 32px;
  height: 32px;
  color: #3b82f6;
}

/* 업로드 텍스트 */
.upload-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.upload-hint {
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
}

.upload-limit {
  color: #94a3b8;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 네비게이션 버튼 */
.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover {
  background: #475569;
}

/* 에러 메시지 */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  color: #dc2626;
}

.error-icon {
  font-size: 1.25rem;
}

.error-message p {
  margin: 0;
  font-weight: 500;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .upload-area {
    padding: 2rem 1rem;
  }

  .navigation-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
