<template>
  <div v-if="assignment" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h2 class="modal-title">제출물 확인</h2>
          <p class="modal-subtitle">{{ assignment.title }}</p>
        </div>
        <button @click="closeModal" class="close-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button 
            v-for="tab in filterTabs" 
            :key="tab.key"
            @click="activeFilter = tab.key"
            :class="['filter-tab', { active: activeFilter === tab.key }]"
          >
            {{ tab.label }}
            <span class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
        <div class="filter-actions">
          <button @click="downloadAll" class="action-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
            </svg>
            전체 다운로드
          </button>
          <button @click="exportGrades" class="action-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,15H9V10H15V15L13,19H10Z"/>
            </svg>
            성적 내보내기
          </button>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Submissions List -->
        <div class="submissions-list">
          <div v-if="filteredSubmissions.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M12 3C12.55 3 13 3.45 13 4S12.55 5 12 5 11 4.55 11 4 11.45 3 12 3"/>
            </svg>
            <p>{{ getEmptyMessage() }}</p>
          </div>

          <div v-else class="submission-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
                  </th>
                  <th>학생명</th>
                  <th>제출 시간</th>
                  <th>상태</th>
                  <th>점수</th>
                  <th>파일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="submission in filteredSubmissions" :key="submission.id">
                  <td>
                    <input type="checkbox" v-model="selectedSubmissions" :value="submission.id">
                  </td>
                  <td class="student-name">{{ submission.studentName }}</td>
                  <td>{{ formatSubmissionTime(submission) }}</td>
                  <td>
                    <span class="status-badge" :class="submission.status">
                      {{ getSubmissionStatus(submission) }}
                    </span>
                  </td>
                  <td class="score-cell">
                    <input 
                      v-if="submission.status === 'SUBMITTED'"
                      type="number" 
                      v-model="submission.score"
                      class="score-input"
                      :max="assignment.maxScore || 100"
                      min="0"
                      @change="updateScore(submission)"
                    >
                    <span v-else-if="submission.score !== null">
                      {{ submission.score }}점
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <button 
                      v-if="submission.files && submission.files.length > 0"
                      @click="viewFiles(submission)"
                      class="file-count-btn"
                    >
                      {{ submission.files.length }}개
                    </button>
                    <span v-else class="no-files">없음</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button @click="viewSubmissionDetail(submission)" class="action-icon-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                        </svg>
                      </button>
                      <button @click="downloadSubmission(submission)" class="action-icon-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                        </svg>
                      </button>
                      <button @click="provideFeedback(submission)" class="action-icon-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2M20,16H6L4,18V4H20M12.19,5.5C11.3,5.5 10.59,5.68 10.05,6.04C9.5,6.4 9.21,7 9.18,7.82H11.18C11.18,7.41 11.34,7.11 11.67,6.91C12,6.72 12.4,6.62 12.89,6.62C13.34,6.62 13.65,6.72 13.84,6.92C14.03,7.12 14.13,7.37 14.13,7.69C14.13,7.95 14.04,8.16 13.87,8.32C13.69,8.5 13.42,8.68 13.05,8.88C12.35,9.25 11.86,9.6 11.6,9.91C11.34,10.22 11.21,10.63 11.21,11.15H13.21C13.21,10.9 13.27,10.69 13.39,10.52C13.5,10.35 13.72,10.18 14.06,10C14.6,9.71 15,9.42 15.28,9.15C15.57,8.87 15.72,8.5 15.72,8.03C15.72,7.37 15.44,6.85 14.89,6.5C14.34,6.11 13.53,5.5 12.19,5.5M11,12V14H13V12H11Z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bulk Actions -->
        <div v-if="selectedSubmissions.length > 0" class="bulk-actions">
          <span class="selection-count">{{ selectedSubmissions.length }}개 선택됨</span>
          <div class="bulk-buttons">
            <button @click="bulkGrade" class="bulk-btn">
              일괄 채점
            </button>
            <button @click="bulkDownload" class="bulk-btn">
              선택 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Submission Detail Modal -->
  <SubmissionDetailModal
    v-if="showDetailModal"
    :submission="selectedSubmission"
    :assignment="assignment"
    @close="showDetailModal = false"
    @updated="handleSubmissionUpdated"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SubmissionDetailModal from './SubmissionDetailModal.vue'
import submissionApi from '@/api/submission'

// Props
const props = defineProps({
  assignment: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close'])

// State
const submissions = ref([])
const activeFilter = ref('all')
const selectedSubmissions = ref([])
const selectAll = ref(false)
const showDetailModal = ref(false)
const selectedSubmission = ref(null)
const loading = ref(false)

// Filter tabs configuration
const filterTabs = computed(() => [
  { 
    key: 'all', 
    label: '전체', 
    count: submissions.value.length 
  },
  { 
    key: 'submitted', 
    label: '제출완료', 
    count: submissions.value.filter(s => s.status === 'SUBMITTED').length 
  },
  { 
    key: 'graded', 
    label: '채점완료', 
    count: submissions.value.filter(s => s.status === 'GRADED').length 
  },
  { 
    key: 'not_submitted', 
    label: '미제출', 
    count: submissions.value.filter(s => s.status === 'NOT_SUBMITTED').length 
  }
])

// Filtered submissions based on active filter
const filteredSubmissions = computed(() => {
  switch(activeFilter.value) {
    case 'submitted':
      return submissions.value.filter(s => s.status === 'SUBMITTED')
    case 'graded':
      return submissions.value.filter(s => s.status === 'GRADED')
    case 'not_submitted':
      return submissions.value.filter(s => s.status === 'NOT_SUBMITTED')
    default:
      return submissions.value
  }
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadSubmissions = async () => {
  loading.value = true
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const response = await submissionApi.getAssignmentSubmissions(props.assignment.id, userInfo.id)
    
    // Transform data with mock values for demonstration
    submissions.value = response.data.content || generateMockSubmissions()
  } catch (error) {
    console.error('제출물 목록 로드 실패:', error)
    // Use mock data for demonstration
    submissions.value = generateMockSubmissions()
  } finally {
    loading.value = false
  }
}

const generateMockSubmissions = () => {
  const students = [
    { id: 1, name: '김철수', submitted: true, score: 95 },
    { id: 2, name: '이영희', submitted: true, score: 88 },
    { id: 3, name: '박민수', submitted: true, score: null },
    { id: 4, name: '정수진', submitted: false, score: null },
    { id: 5, name: '최동현', submitted: true, score: 92 }
  ]

  return students.map(student => ({
    id: student.id,
    studentId: student.id,
    studentName: student.name,
    status: student.submitted ? (student.score !== null ? 'GRADED' : 'SUBMITTED') : 'NOT_SUBMITTED',
    submittedAt: student.submitted ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
    score: student.score,
    isLate: student.submitted && Math.random() > 0.8,
    files: student.submitted ? [{ id: 1, name: '과제.pdf' }] : [],
    feedback: student.score ? '잘했습니다!' : null
  }))
}

const formatSubmissionTime = (submission) => {
  if (!submission.submittedAt) return '미제출'
  const date = new Date(submission.submittedAt)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return `${diffMins}분 전`
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`
  } else {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
}

const getSubmissionStatus = (submission) => {
  const statuses = {
    NOT_SUBMITTED: '미제출',
    SUBMITTED: '제출완료',
    GRADED: '채점완료'
  }
  
  if (submission.isLate) {
    return statuses[submission.status] + ' (지각)'
  }
  
  return statuses[submission.status] || submission.status
}

const getEmptyMessage = () => {
  switch(activeFilter.value) {
    case 'submitted':
      return '제출된 과제가 없습니다'
    case 'graded':
      return '채점 완료된 과제가 없습니다'
    case 'not_submitted':
      return '모든 학생이 과제를 제출했습니다'
    default:
      return '제출 내역이 없습니다'
  }
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedSubmissions.value = filteredSubmissions.value.map(s => s.id)
  } else {
    selectedSubmissions.value = []
  }
}

const updateScore = async (submission) => {
  try {
    await submissionApi.gradeSubmission(submission.id, {
      score: submission.score,
      feedback: submission.feedback
    })
    submission.status = 'GRADED'
  } catch (error) {
    console.error('점수 업데이트 실패:', error)
  }
}

const viewFiles = (submission) => {
  console.log('View files for submission:', submission)
}

const viewSubmissionDetail = (submission) => {
  selectedSubmission.value = submission
  showDetailModal.value = true
}

const downloadSubmission = (submission) => {
  console.log('Download submission:', submission)
}

const provideFeedback = (submission) => {
  const feedback = prompt('피드백을 입력하세요:', submission.feedback || '')
  if (feedback !== null) {
    submission.feedback = feedback
    updateScore(submission)
  }
}

const downloadAll = () => {
  console.log('Download all submissions')
}

const exportGrades = () => {
  console.log('Export grades to Excel')
}

const bulkGrade = () => {
  const score = prompt('일괄 적용할 점수를 입력하세요 (0-100):')
  if (score !== null && !isNaN(score)) {
    selectedSubmissions.value.forEach(id => {
      const submission = submissions.value.find(s => s.id === id)
      if (submission) {
        submission.score = parseInt(score)
        updateScore(submission)
      }
    })
  }
}

const bulkDownload = () => {
  console.log('Bulk download selected submissions')
}

const handleSubmissionUpdated = () => {
  loadSubmissions()
}

// Lifecycle
onMounted(() => {
  loadSubmissions()
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
  z-index: 1002;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
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
  margin: 0;
}

.modal-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin-top: 4px;
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

/* Filter Bar */
.filter-bar {
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-tab:hover {
  border-color: #9ca3af;
  color: #374151;
}

.filter-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
}

.filter-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Content */
.modal-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Submission Table */
.submission-table {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.submission-table table {
  width: 100%;
  border-collapse: collapse;
}

.submission-table th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  border-bottom: 1px solid #e5e7eb;
}

.submission-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.95rem;
}

.submission-table tbody tr:hover {
  background: #f9fafb;
}

.student-name {
  font-weight: 500;
  color: #111827;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
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

.score-cell {
  width: 100px;
}

.score-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
}

.score-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.file-count-btn {
  padding: 4px 8px;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.file-count-btn:hover {
  background: #d1d5db;
}

.no-files {
  color: #9ca3af;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.action-icon-btn {
  width: 32px;
  height: 32px;
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

.action-icon-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.action-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #e5e7eb;
  margin: 0 auto 16px;
}

.empty-state p {
  color: #6b7280;
  font-size: 1rem;
}

/* Bulk Actions */
.bulk-actions {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-count {
  color: #6b7280;
  font-size: 0.9rem;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

.bulk-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.bulk-btn:hover {
  background: #2563eb;
}
</style>