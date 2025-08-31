<template>
  <div class="pdf-upload">
    <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent @click="triggerFileInput">
      <div v-if="!pdfFile" class="upload-content">
        <!-- 메인 업로드 아이콘 -->
        <div class="upload-icon-container mb-4">
          <div class="upload-icon">📄</div>
          <div class="upload-icon-glow"></div>
        </div>

        <!-- 교과서 정보 -->
        <div v-if="props.selectedTextbook" class="textbook-info mb-4">
          <div class="textbook-badge">
            <span class="badge-icon">📚</span>
            <div class="badge-content">
              <span class="badge-label">선택된 교과서</span>
              <span class="badge-name">{{ props.selectedTextbook.subjectName }}</span>
            </div>
          </div>
        </div>

        <!-- 업로드 안내 -->
        <div class="upload-guide text-center mb-4">
          <p class="upload-description mb-4">문제를 추가할 PDF 파일을 선택하거나 드래그하여 업로드하세요</p>
        </div>

        <!-- 파일 선택 버튼 -->
        <div class="button-container d-flex justify-content-center mb-4">
          <button @click.stop="triggerFileInput" class="upload-button btn btn-primary btn-lg">
            <span class="btn-icon">📁</span>
            <span class="btn-text">파일 선택</span>
          </button>
        </div>

        <!-- 파일 형식 안내 -->
        <div class="file-info-hint mt-3">
          <small class="text-muted">지원 형식: PDF (최대 10MB)</small>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          @change="handleFileSelect"
          style="display: none"
        />
      </div>

      <!-- 파일 업로드 완료 상태 -->
      <div v-else class="file-info">
        <div class="file-info-header">
          <div class="file-icon">📄</div>
          <div class="file-details">
            <h4 class="file-name">{{ pdfFile.name }}</h4>
            <p class="file-size">{{ formatFileSize(pdfFile.size) }}</p>
          </div>
        </div>

        <!-- 이미지 변환 상태 표시 -->
        <div v-if="isProcessing" class="conversion-status">
          <div class="status-indicator">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span class="visually-hidden">변환 중...</span>
            </div>
            <span class="status-text">PDF를 이미지로 변환 중...</span>
          </div>
          <div class="status-description">
            <small class="text-muted">
              서버에서 PDF를 고품질 이미지로 변환하고 있습니다.<br>
              파일 크기에 따라 시간이 걸릴 수 있습니다.
            </small>
          </div>
        </div>

        <!-- 변환 완료 상태 -->
        <div v-else class="conversion-complete">
          <div class="success-indicator">
            <i class="bi bi-check-circle-fill text-success me-2"></i>
            <span class="status-text">이미지 변환 완료</span>
          </div>
          <div class="completion-description">
            <small class="text-muted">
              PDF가 성공적으로 이미지로 변환되었습니다.<br>
              이제 편집 및 OCR 처리를 진행할 수 있습니다.
            </small>
          </div>
        </div>

        <!-- 파일 제거 버튼 -->
        <div class="file-actions mt-3">
          <button @click="removeFile" class="btn btn-outline-danger">
            <i class="bi bi-trash me-1"></i>
            파일 제거
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useItemProcessingStore } from '../../store/itemProcessingStore.js'

// 파일 상태
const pdfFile = ref(null)
const isProcessing = ref(false)

// 파일 입력 참조
const fileInput = ref(null)

// Props 정의
const props = defineProps({
  selectedTextbook: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['file-selected'])
const itemProcessingStore = useItemProcessingStore()

// pdfFile 변경 감지 (자동 emit 제거 - 중복 호출 방지)
watch(pdfFile, (newFile) => {
  if (newFile) {
    // emit은 handleFileSelect나 handleDrop에서만 호출
  }
})

// 파일 선택 처리
const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    pdfFile.value = file
    itemProcessingStore.setPdfFile(file)
    isProcessing.value = true

    try {
      // 파일 선택 후 서버에서 이미지 변환 완료까지 기다림
      await emit('file-selected', {
        file: file,
        images: [] // 아직 변환되지 않음
      })

      // 이미지 변환 완료
    } catch (error) {
      console.error('❌ 이미지 변환 실패:', error)
      isProcessing.value = false
    }
  }
}

// 파일 드래그 앤 드롭 처리
const handleDrop = async (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0 && files[0].type === 'application/pdf') {
    const file = files[0]
    pdfFile.value = file
    itemProcessingStore.setPdfFile(file)
    isProcessing.value = true

    try {
      // 파일 드롭 후 서버에서 이미지 변환 완료까지 기다림
      await emit('file-selected', {
        file: file,
        images: [] // 아직 변환되지 않음
      })

      // 이미지 변환 완료
    } catch (error) {
      console.error('❌ 이미지 변환 실패:', error)
      isProcessing.value = false
    }
  }
}

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 파일 제거
const removeFile = () => {
  pdfFile.value = null
  itemProcessingStore.setPdfFile(null)
}

// 파일 크기 포맷팅
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.pdf-upload {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 1;
}

.upload-content,
.file-info {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 450px;
}

.upload-icon-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem auto;
}

.upload-icon {
  font-size: 5rem;
  color: #94a3b8;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  transition: all 0.3s ease;
}

.upload-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 70%, transparent 100%);
  border-radius: 50%;
  z-index: 1;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.upload-area:hover .upload-icon-glow {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.upload-area:hover .upload-icon {
  color: #3b82f6;
  transform: translate(-50%, -50%) scale(1.1);
}

.textbook-info {
  width: 100%;
  margin-bottom: 2rem;
}

.textbook-badge {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  width: fit-content;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.textbook-badge:hover {
  transform: translateY(-3px);
}

.badge-icon {
  font-size: 2rem;
  color: #3b82f6;
}

.badge-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.badge-label {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
}

.badge-name {
  font-size: 1.25rem;
  color: #1e40af;
  font-weight: 700;
}

.button-container {
  width: 100%;
  margin-bottom: 2rem;
}

.upload-guide {
  width: 100%;
  margin-bottom: 2rem;
}

.upload-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.upload-description {
  color: #64748b;
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
}

.upload-button {
  padding: 1.25rem 3rem;
  font-weight: 600;
  font-size: 1.1rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.upload-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
}

.btn-icon {
  font-size: 1.25rem;
}

.btn-text {
  font-weight: 600;
}

.file-info-hint {
  text-align: center;
  margin-top: 1.5rem;
}

.file-info-hint small {
  color: #94a3b8;
  font-size: 0.875rem;
}

/* 파일 업로드 완료 상태 */
.file-info {
  text-align: center;
  padding-top: 1rem;
}

.file-info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.file-icon {
  font-size: 3rem;
  color: #3b82f6;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  word-break: break-all;
}

.file-size {
  color: #64748b;
  margin: 0;
  font-size: 1rem;
}

.conversion-status,
.conversion-complete {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.status-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.completion-description {
  text-align: center;
}

.completion-description small {
  color: #64748b;
  font-size: 0.9rem;
}

.success-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.success-indicator .bi-check-circle-fill {
  font-size: 1.5rem;
  color: #22c55e;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.file-actions .btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-actions .btn:hover {
  transform: translateY(-2px);
}

/* 애니메이션 */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 처리 중 상태 스타일 */
.processing-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #bae6fd;
  color: #0369a1;
  font-weight: 500;
}

.processing-status .spinner-border {
  width: 1rem;
  height: 1rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .upload-area {
    padding: 3rem 1.5rem;
    min-height: 350px;
  }

  .upload-icon-container {
    width: 100px;
    height: 100px;
  }

  .upload-icon {
    font-size: 4rem;
  }

  .upload-title {
    font-size: 1.5rem;
  }

  .upload-button {
    padding: 1rem 2rem;
  }

  .file-actions {
    flex-direction: column;
    align-items: center;
  }

  .file-actions .btn {
    width: 100%;
    max-width: 200px;
  }
}
</style>
