<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          새 과제 만들기
        </h2>
        <button @click="closeModal" class="close-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <form @submit.prevent="handleSubmit">
          <!-- Basic Information -->
          <div class="form-section">
            <h3 class="section-title">기본 정보</h3>
            
            <div class="form-group">
              <label class="form-label required">과제 제목</label>
              <input
                v-model="formData.title"
                type="text"
                class="form-input"
                placeholder="예: 수학 3단원 복습 문제"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">과제 설명</label>
              <textarea
                v-model="formData.description"
                class="form-textarea"
                rows="4"
                placeholder="과제에 대한 자세한 설명을 입력하세요"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">마감일</label>
                <input
                  v-model="formData.dueDate"
                  type="datetime-local"
                  class="form-input"
                  :min="minDateTime"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">최대 점수</label>
                <input
                  v-model.number="formData.maxScore"
                  type="number"
                  class="form-input"
                  placeholder="100"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <!-- Target Classes -->
          <div class="form-section">
            <h3 class="section-title">대상 학급</h3>
            
            <div class="class-selection">
              <div v-if="availableClasses.length === 0" class="no-classes">
                <p>관리하는 학급이 없습니다</p>
                <button type="button" class="create-class-btn">학급 만들기</button>
              </div>
              
              <div v-else class="class-checkboxes">
                <label v-for="cls in availableClasses" :key="cls.id" class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="cls.id"
                    v-model="formData.classIds"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">{{ cls.name }}</span>
                  <span class="student-count">({{ cls.studentCount }}명)</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Assignment Files -->
          <div class="form-section">
            <h3 class="section-title">과제 파일</h3>
            
            <div class="file-upload-area">
              <div
                class="dropzone"
                :class="{ 'dragging': isDragging }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
                @click="$refs.fileInput.click()"
              >
                <svg class="upload-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,15.74L9.41,14.33L11,15.91V10H13V15.91L14.59,14.33L16,15.74L12,19.74L8,15.74Z"/>
                </svg>
                <p class="dropzone-text">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <p class="dropzone-hint">
                  PDF, DOC, DOCX, HWP • 최대 10MB
                </p>
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.hwp"
                  @change="handleFileSelect"
                  style="display: none"
                />
              </div>

              <!-- File List -->
              <div v-if="formData.files.length > 0" class="file-list">
                <div v-for="(file, index) in formData.files" :key="index" class="file-item">
                  <div class="file-info">
                    <svg class="file-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M11,4H6V20H11L18,20V11H11V4Z"/>
                    </svg>
                    <div class="file-details">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeFile(index)"
                    class="remove-file-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Options -->
          <div class="form-section">
            <h3 class="section-title">추가 옵션</h3>
            
            <div class="options-grid">
              <label class="option-label">
                <input
                  type="checkbox"
                  v-model="formData.allowLateSubmission"
                  class="option-checkbox"
                />
                <span class="option-text">늦은 제출 허용</span>
              </label>

              <label class="option-label">
                <input
                  type="checkbox"
                  v-model="formData.publishImmediately"
                  class="option-checkbox"
                />
                <span class="option-text">즉시 발행</span>
              </label>

              <label class="option-label">
                <input
                  type="checkbox"
                  v-model="formData.sendNotification"
                  class="option-checkbox"
                />
                <span class="option-text">학생에게 알림 전송</span>
              </label>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" @click="saveDraft" class="btn-secondary">
              임시저장
            </button>
            <div class="right-actions">
              <button type="button" @click="closeModal" class="btn-cancel">
                취소
              </button>
              <button type="submit" class="btn-primary" :disabled="!isFormValid">
                {{ formData.publishImmediately ? '과제 발행' : '과제 생성' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import assignmentApi from '@/api/assignment'

// Emits
const emit = defineEmits(['close', 'created'])

// State
const formData = ref({
  title: '',
  description: '',
  dueDate: '',
  maxScore: 100,
  classIds: [],
  files: [],
  allowLateSubmission: false,
  publishImmediately: true,
  sendNotification: true
})

const availableClasses = ref([])
const isDragging = ref(false)
const loading = ref(false)

// Computed
const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

const isFormValid = computed(() => {
  return formData.value.title.trim() && 
         formData.value.dueDate && 
         formData.value.classIds.length > 0
})

// Methods
const closeModal = () => {
  if (formData.value.title || formData.value.description) {
    if (confirm('작성 중인 내용이 있습니다. 정말 닫으시겠습니까?')) {
      emit('close')
    }
  } else {
    emit('close')
  }
}

const loadClasses = async () => {
  try {
    // Mock data for demonstration
    availableClasses.value = [
      { id: 1, name: '6학년 1반', studentCount: 25 },
      { id: 2, name: '6학년 2반', studentCount: 28 },
      { id: 3, name: '6학년 3반', studentCount: 26 }
    ]
  } catch (error) {
    console.error('학급 목록 로드 실패:', error)
  }
}

const handleFileDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  addFiles(files)
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  addFiles(files)
}

const addFiles = (files) => {
  const validFiles = files.filter(file => {
    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/x-hwp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.hwp')) {
      alert(`${file.name}: 지원하지 않는 파일 형식입니다`)
      return false
    }
    
    if (file.size > maxSize) {
      alert(`${file.name}: 파일 크기가 10MB를 초과합니다`)
      return false
    }
    
    return true
  })
  
  formData.value.files.push(...validFiles)
}

const removeFile = (index) => {
  formData.value.files.splice(index, 1)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const saveDraft = async () => {
  loading.value = true
  try {
    const assignmentData = {
      ...formData.value,
      status: 'DRAFT',
      teacherId: JSON.parse(localStorage.getItem('userInfo') || '{}').id
    }
    
    const response = await assignmentApi.createAssignment(assignmentData, formData.value.files)
    
    alert('임시저장되었습니다')
    emit('created', response.data)
    emit('close')
  } catch (error) {
    console.error('임시저장 실패:', error)
    alert('임시저장에 실패했습니다')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const assignmentData = {
      ...formData.value,
      status: formData.value.publishImmediately ? 'PUBLISHED' : 'DRAFT',
      teacherId: userInfo.id,
      classNames: availableClasses.value
        .filter(cls => formData.value.classIds.includes(cls.id))
        .reduce((acc, cls) => {
          acc[cls.id] = cls.name
          return acc
        }, {})
    }
    
    const response = await assignmentApi.createAssignment(assignmentData, formData.value.files)
    
    if (formData.value.sendNotification) {
      // Send notification to students
      console.log('Sending notifications to students...')
    }
    
    alert(formData.value.publishImmediately ? '과제가 발행되었습니다' : '과제가 생성되었습니다')
    emit('created', response.data)
    emit('close')
  } catch (error) {
    console.error('과제 생성 실패:', error)
    alert('과제 생성에 실패했습니다')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadClasses()
  
  // Set default due date to 1 week from now
  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 7)
  defaultDueDate.setHours(23, 59, 0, 0)
  defaultDueDate.setMinutes(defaultDueDate.getMinutes() - defaultDueDate.getTimezoneOffset())
  formData.value.dueDate = defaultDueDate.toISOString().slice(0, 16)
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
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: #3b82f6;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* Modal Content */
.modal-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Form Sections */
.form-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

/* Form Groups */
.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Class Selection */
.class-selection {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.no-classes {
  text-align: center;
  padding: 24px;
}

.no-classes p {
  color: #6b7280;
  margin-bottom: 12px;
}

.create-class-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.create-class-btn:hover {
  background: #2563eb;
}

.class-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-label:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  cursor: pointer;
}

.checkbox-text {
  flex: 1;
  font-weight: 500;
  color: #374151;
}

.student-count {
  color: #6b7280;
  font-size: 0.9rem;
}

/* File Upload */
.file-upload-area {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.dropzone:hover,
.dropzone.dragging {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
  margin: 0 auto 16px;
}

.dropzone-text {
  font-size: 1rem;
  color: #374151;
  margin-bottom: 4px;
}

.dropzone-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

/* File List */
.file-list {
  margin-top: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  width: 32px;
  height: 32px;
  color: #6b7280;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
}

.file-size {
  font-size: 0.85rem;
  color: #6b7280;
}

.remove-file-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-file-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.remove-file-btn svg {
  width: 16px;
  height: 16px;
}

/* Options */
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.option-label {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-label:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.option-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  cursor: pointer;
}

.option-text {
  font-size: 0.95rem;
  color: #374151;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.right-actions {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary,
.btn-cancel {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-cancel {
  background: transparent;
  color: #6b7280;
  border: none;
}

.btn-cancel:hover {
  background: #f3f4f6;
  color: #374151;
}
</style>