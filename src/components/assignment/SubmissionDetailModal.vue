<template>
  <div v-if="submission" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">제출물 상세</h2>
        <button @click="closeModal" class="close-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Student Info -->
        <div class="info-section">
          <h3 class="section-title">학생 정보</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">이름</span>
              <span class="info-value">{{ submission.studentName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">제출 시간</span>
              <span class="info-value">{{ formatDateTime(submission.submittedAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">상태</span>
              <span class="status-badge" :class="submission.status">
                {{ getStatusLabel(submission.status) }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">지각 여부</span>
              <span class="info-value">{{ submission.isLate ? '지각' : '정시 제출' }}</span>
            </div>
          </div>
        </div>

        <!-- Submitted Files -->
        <div v-if="submission.files && submission.files.length > 0" class="files-section">
          <h3 class="section-title">제출 파일</h3>
          <div class="files-list">
            <div v-for="file in submission.files" :key="file.id" class="file-item">
              <svg class="file-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M11,4H6V20H11L18,20V11H11V4Z"/>
              </svg>
              <div class="file-info">
                <span class="file-name">{{ file.originalFileName || file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.fileSize || 0) }}</span>
              </div>
              <button @click="downloadFile(file)" class="download-btn">
                다운로드
              </button>
            </div>
          </div>
        </div>

        <!-- Grading Section -->
        <div class="grading-section">
          <h3 class="section-title">채점</h3>
          <div class="grading-form">
            <div class="form-group">
              <label class="form-label">점수 (최대 {{ assignment.maxScore || 100 }}점)</label>
              <input
                v-model.number="gradeData.score"
                type="number"
                class="score-input"
                :max="assignment.maxScore || 100"
                min="0"
              />
            </div>
            <div class="form-group">
              <label class="form-label">피드백</label>
              <textarea
                v-model="gradeData.feedback"
                class="feedback-textarea"
                rows="4"
                placeholder="학생에게 전달할 피드백을 입력하세요"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button @click="closeModal" class="btn-cancel">
            취소
          </button>
          <button @click="saveGrade" class="btn-primary">
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import submissionApi from '@/api/submission'

// Props
const props = defineProps({
  submission: {
    type: Object,
    required: true
  },
  assignment: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'updated'])

// State
const gradeData = ref({
  score: props.submission.score || null,
  feedback: props.submission.feedback || ''
})

// Methods
const closeModal = () => {
  emit('close')
}

const formatDateTime = (date) => {
  if (!date) return '미제출'
  const d = new Date(date)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시 ${d.getMinutes()}분`
}

const getStatusLabel = (status) => {
  const labels = {
    NOT_SUBMITTED: '미제출',
    SUBMITTED: '제출완료',
    GRADED: '채점완료'
  }
  return labels[status] || status
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const downloadFile = async (file) => {
  try {
    const url = await submissionApi.getDownloadUrl(props.submission.id, file.id)
    window.open(url, '_blank')
  } catch (error) {
    console.error('파일 다운로드 실패:', error)
    alert('파일 다운로드에 실패했습니다')
  }
}

const saveGrade = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    await submissionApi.gradeSubmission(props.submission.id, gradeData.value, userInfo.id)
    alert('채점이 완료되었습니다')
    emit('updated')
    emit('close')
  } catch (error) {
    console.error('채점 저장 실패:', error)
    alert('채점 저장에 실패했습니다')
  }
}
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
  z-index: 1003;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.modal-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Info Section */
.info-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-value {
  font-size: 1rem;
  color: #111827;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  width: fit-content;
}

.status-badge.SUBMITTED {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.GRADED {
  background: #dcfce7;
  color: #166534;
}

.status-badge.NOT_SUBMITTED {
  background: #fee2e2;
  color: #991b1b;
}

/* Files Section */
.files-section {
  margin-bottom: 32px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.file-icon {
  width: 32px;
  height: 32px;
  color: #6b7280;
  margin-right: 12px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #374151;
  margin-bottom: 2px;
}

.file-size {
  font-size: 0.85rem;
  color: #6b7280;
}

.download-btn {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.download-btn:hover {
  background: #2563eb;
}

/* Grading Section */
.grading-section {
  margin-bottom: 32px;
}

.grading-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.score-input {
  width: 120px;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
}

.score-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.feedback-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 100px;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

.btn-primary,
.btn-cancel {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #2563eb;
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