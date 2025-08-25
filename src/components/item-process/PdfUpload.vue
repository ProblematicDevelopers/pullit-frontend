<template>
  <div class="pdf-upload">
    <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
      <div v-if="!pdfFile" class="upload-content">
        <div class="upload-icon">📄</div>
        <div class="upload-text">
          <p v-if="props.selectedTextbook" class="selected-textbook">
            선택된 교과서: {{ props.selectedTextbook.subjectName }}
          </p>
          <p>PDF 파일 업로드</p>
          <button @click="triggerFileInput" class="upload-button">파일 선택</button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".pdf"
          @change="handleFileSelect"
          style="display: none"
        />
      </div>

      <div v-else class="file-info">
        <div class="file-details">
          <div class="file-icon">📄</div>
          <div class="file-text">
            <p class="file-name">{{ pdfFile.name }}</p>
            <p class="file-size">{{ formatFileSize(pdfFile.size) }}</p>
          </div>
        </div>

        <div class="file-actions">
          <button @click="removeFile" class="remove-button">제거</button>
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

// pdfFile 변경 감지하여 자동으로 다음 단계로 진행
watch(pdfFile, (newFile) => {
  if (newFile) {
    console.log('PDF 파일이 설정됨, 다음 단계로 진행')
    // 부모 컴포넌트에 파일 설정 완료 알림
    emit('file-selected', {
      file: newFile,
      images: [] // 아직 변환되지 않음
    })
  }
})

// 파일 선택 처리
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    pdfFile.value = file
    itemProcessingStore.setPdfFile(file)

    // 파일 선택 즉시 다음 단계로 진행
    emit('file-selected', {
      file: file,
      images: [] // 아직 변환되지 않음
    })
  }
}

// 파일 드래그 앤 드롭 처리
const handleDrop = (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0 && files[0].type === 'application/pdf') {
    const file = files[0]
    pdfFile.value = file
    itemProcessingStore.setPdfFile(file)

    // 파일 드롭 즉시 다음 단계로 진행
    emit('file-selected', {
      file: file,
      images: [] // 아직 변환되지 않음
    })
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
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
  color: #6b7280;
}

.upload-text p {
  margin: 0.5rem 0;
  color: #374151;
}

.selected-textbook {
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #dbeafe;
}

.upload-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.upload-button:hover {
  background: #2563eb;
}

.file-info {
  text-align: left;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.file-icon {
  font-size: 2rem;
  color: #3b82f6;
}

.file-text {
  flex: 1;
}

.file-name {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #111827;
}

.file-size {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.file-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.remove-button {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.remove-button:hover {
  background: #dc2626;
}
</style>
