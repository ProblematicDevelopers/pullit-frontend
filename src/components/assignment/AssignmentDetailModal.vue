<template>
  <div v-if="assignment" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">과제 상세 정보</h2>
        <button @click="closeModal" class="close-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Assignment Info -->
        <div class="detail-section">
          <h3 class="section-title">{{ assignment.title }}</h3>
          <span class="status-badge" :class="assignment.status">
            {{ getStatusLabel(assignment.status) }}
          </span>
        </div>

        <div class="detail-section">
          <p class="description">{{ assignment.description || '설명이 없습니다.' }}</p>
        </div>

        <!-- Meta Information -->
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">마감일</span>
            <span class="detail-value">{{ formatDateTime(assignment.dueDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">대상 학급</span>
            <span class="detail-value">{{ assignment.targetClasses?.join(', ') || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">최대 점수</span>
            <span class="detail-value">{{ assignment.maxScore || 100 }}점</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">늦은 제출</span>
            <span class="detail-value">{{ assignment.allowLateSubmission ? '허용' : '불가' }}</span>
          </div>
        </div>

        <!-- Submission Statistics -->
        <div class="stats-section">
          <h4 class="stats-title">제출 현황</h4>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ assignment.submittedCount || 0 }}</div>
              <div class="stat-label">제출 완료</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ (assignment.totalStudents || 0) - (assignment.submittedCount || 0) }}</div>
              <div class="stat-label">미제출</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ Math.round(((assignment.submittedCount || 0) / (assignment.totalStudents || 1)) * 100) }}%</div>
              <div class="stat-label">제출률</div>
            </div>
            <div class="stat-card" v-if="assignment.averageScore">
              <div class="stat-value">{{ assignment.averageScore }}점</div>
              <div class="stat-label">평균 점수</div>
            </div>
          </div>
        </div>

        <!-- Assignment Files -->
        <div v-if="assignment.files && assignment.files.length > 0" class="files-section">
          <h4 class="files-title">첨부 파일</h4>
          <div class="files-list">
            <div v-for="file in assignment.files" :key="file.id" class="file-item">
              <svg class="file-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M11,4H6V20H11L18,20V11H11V4Z"/>
              </svg>
              <span class="file-name">{{ file.originalFileName }}</span>
              <button @click="downloadFile(file)" class="download-btn">
                다운로드
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button @click="editAssignment" class="btn-secondary">
            수정하기
          </button>
          <button @click="viewSubmissions" class="btn-primary">
            제출물 확인
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  assignment: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'updated'])

// Methods
const closeModal = () => {
  emit('close')
}

const getStatusLabel = (status) => {
  const labels = {
    DRAFT: '임시저장',
    PUBLISHED: '진행중',
    CLOSED: '마감',
    GRADING: '채점중',
    COMPLETED: '완료'
  }
  return labels[status] || status
}

const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시 ${d.getMinutes()}분`
}

const downloadFile = (file) => {
  // Implement file download logic
  console.log('Download file:', file)
}

const editAssignment = () => {
  // Implement edit logic
  console.log('Edit assignment')
}

const viewSubmissions = () => {
  emit('close')
  // Navigate to submissions view
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
  z-index: 1002;
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

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  display: inline-block;
  margin-right: 12px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.PUBLISHED {
  background: #dcfce7;
  color: #166534;
}

.status-badge.GRADING {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.COMPLETED {
  background: #e5e7eb;
  color: #374151;
}

.description {
  color: #4b5563;
  line-height: 1.6;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
}

/* Statistics */
.stats-section {
  margin-bottom: 32px;
}

.stats-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

/* Files */
.files-section {
  margin-bottom: 32px;
}

.files-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
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
  width: 24px;
  height: 24px;
  color: #6b7280;
  margin-right: 12px;
}

.file-name {
  flex: 1;
  color: #374151;
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

/* Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px 24px;
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

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}
</style>