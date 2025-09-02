<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M12 3C12.55 3 13 3.45 13 4S12.55 5 12 5 11 4.55 11 4 11.45 3 12 3M7 7H17V5H19V19H5V5H7V7M12 9V13.5L17 11L12 9Z"/>
          </svg>
          과제 관리
        </h2>
        <button @click="closeModal" class="close-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button @click="openCreateModal" class="action-btn primary">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          새 과제 만들기
        </button>
        <button @click="refreshAssignments" class="action-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"/>
          </svg>
          새로고침
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="['tab', { active: activeTab === tab.key }]"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="modal-content">
        <!-- Assignment List -->
        <div v-if="activeTab === 'active'" class="assignments-grid">
          <div v-if="activeAssignments.length === 0" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M12 3C12.55 3 13 3.45 13 4S12.55 5 12 5 11 4.55 11 4 11.45 3 12 3"/>
            </svg>
            <p>진행 중인 과제가 없습니다</p>
            <button @click="openCreateModal" class="empty-action-btn">첫 과제 만들기</button>
          </div>
          
          <div v-else v-for="assignment in activeAssignments" :key="assignment.id" class="assignment-card">
            <div class="assignment-header">
              <h3 class="assignment-title">{{ assignment.title }}</h3>
              <span class="assignment-status" :class="assignment.status">
                {{ getStatusLabel(assignment.status) }}
              </span>
            </div>
            
            <div class="assignment-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19Z"/>
                </svg>
                마감: {{ formatDate(assignment.dueDate) }}
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8"/>
                </svg>
                대상: {{ assignment.targetClasses.join(', ') }}
              </div>
            </div>

            <div class="assignment-progress">
              <div class="progress-header">
                <span>제출 현황</span>
                <span class="progress-text">{{ assignment.submittedCount }}/{{ assignment.totalStudents }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${(assignment.submittedCount / assignment.totalStudents) * 100}%` }"
                ></div>
              </div>
            </div>

            <div class="assignment-actions">
              <button @click="viewAssignmentDetail(assignment)" class="card-btn">
                상세보기
              </button>
              <button @click="viewSubmissions(assignment)" class="card-btn primary">
                제출 확인
              </button>
            </div>
          </div>
        </div>

        <!-- Completed Assignments -->
        <div v-if="activeTab === 'completed'" class="assignments-list">
          <div v-if="completedAssignments.length === 0" class="empty-state">
            <p>완료된 과제가 없습니다</p>
          </div>
          <div v-else class="assignment-table">
            <table>
              <thead>
                <tr>
                  <th>과제명</th>
                  <th>대상 반</th>
                  <th>마감일</th>
                  <th>제출률</th>
                  <th>평균 점수</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in completedAssignments" :key="assignment.id">
                  <td>{{ assignment.title }}</td>
                  <td>{{ assignment.targetClasses.join(', ') }}</td>
                  <td>{{ formatDate(assignment.dueDate) }}</td>
                  <td>
                    <span class="submission-rate">
                      {{ Math.round((assignment.submittedCount / assignment.totalStudents) * 100) }}%
                    </span>
                  </td>
                  <td>{{ assignment.averageScore || '-' }}</td>
                  <td>
                    <button @click="viewAssignmentReport(assignment)" class="table-action-btn">
                      리포트 보기
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Draft Assignments -->
        <div v-if="activeTab === 'draft'" class="assignments-grid">
          <div v-if="draftAssignments.length === 0" class="empty-state">
            <p>임시 저장된 과제가 없습니다</p>
          </div>
          <div v-else v-for="assignment in draftAssignments" :key="assignment.id" class="assignment-card draft">
            <div class="assignment-header">
              <h3 class="assignment-title">{{ assignment.title || '제목 없음' }}</h3>
              <span class="draft-badge">임시저장</span>
            </div>
            <div class="assignment-meta">
              <span>작성일: {{ formatDate(assignment.createdAt) }}</span>
            </div>
            <div class="assignment-actions">
              <button @click="editDraft(assignment)" class="card-btn">
                계속 작성
              </button>
              <button @click="deleteDraft(assignment)" class="card-btn danger">
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Assignment Create Modal -->
  <AssignmentQuickCreateModal
    v-if="showCreateModal"
    @close="showCreateModal = false"
    @created="handleAssignmentCreated"
  />

  <!-- Assignment Detail Modal -->
  <AssignmentDetailModal
    v-if="showDetailModal"
    :assignment="selectedAssignment"
    @close="showDetailModal = false"
    @updated="handleAssignmentUpdated"
  />

  <!-- Submissions Modal -->
  <AssignmentSubmissionsModal
    v-if="showSubmissionsModal"
    :assignment="selectedAssignment"
    @close="showSubmissionsModal = false"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AssignmentQuickCreateModal from './AssignmentQuickCreateModal.vue'
import AssignmentDetailModal from './AssignmentDetailModal.vue'
import AssignmentSubmissionsModal from './AssignmentSubmissionsModal.vue'
import assignmentApi from '@/api/assignment'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  classId: {
    type: [String, Number],
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'assignment-created'])

// State
const activeTab = ref('active')
const assignments = ref([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showSubmissionsModal = ref(false)
const selectedAssignment = ref(null)
const loading = ref(false)

// Tabs configuration
const tabs = computed(() => [
  { 
    key: 'active', 
    label: '진행 중', 
    count: activeAssignments.value.length 
  },
  { 
    key: 'completed', 
    label: '완료됨', 
    count: completedAssignments.value.length 
  },
  { 
    key: 'draft', 
    label: '임시저장', 
    count: draftAssignments.value.length 
  }
])

// Computed assignments by status
const activeAssignments = computed(() => 
  assignments.value.filter(a => ['PUBLISHED', 'GRADING'].includes(a.status))
)

const completedAssignments = computed(() => 
  assignments.value.filter(a => a.status === 'COMPLETED')
)

const draftAssignments = computed(() => 
  assignments.value.filter(a => a.status === 'DRAFT')
)

// Methods
const closeModal = () => {
  emit('close')
}

const openCreateModal = () => {
  showCreateModal.value = true
}

const loadAssignments = async () => {
  loading.value = true
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const response = await assignmentApi.getTeacherAssignments(userInfo.id)
    
    // Transform the data to include mock submission data
    assignments.value = response.data.content.map(assignment => ({
      ...assignment,
      submittedCount: Math.floor(Math.random() * 25) + 5,
      totalStudents: 30,
      targetClasses: assignment.assignmentClasses?.map(c => c.className) || ['6학년 1반'],
      averageScore: assignment.status === 'COMPLETED' ? Math.floor(Math.random() * 20) + 75 : null
    }))
  } catch (error) {
    console.error('과제 목록 로드 실패:', error)
    // Use mock data for demonstration
    assignments.value = generateMockAssignments()
  } finally {
    loading.value = false
  }
}

const generateMockAssignments = () => [
  {
    id: 1,
    title: '수학 문제집 3단원',
    status: 'PUBLISHED',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    submittedCount: 18,
    totalStudents: 25,
    targetClasses: ['6학년 1반'],
    createdAt: new Date()
  },
  {
    id: 2,
    title: '영어 단어 암기',
    status: 'PUBLISHED',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    submittedCount: 22,
    totalStudents: 25,
    targetClasses: ['6학년 1반'],
    createdAt: new Date()
  },
  {
    id: 3,
    title: '과학 실험 보고서',
    status: 'COMPLETED',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    submittedCount: 25,
    totalStudents: 25,
    targetClasses: ['6학년 1반'],
    averageScore: 88,
    createdAt: new Date()
  },
  {
    id: 4,
    title: '국어 독후감',
    status: 'DRAFT',
    dueDate: null,
    targetClasses: ['6학년 1반'],
    createdAt: new Date()
  }
]

const refreshAssignments = () => {
  loadAssignments()
}

const viewAssignmentDetail = (assignment) => {
  selectedAssignment.value = assignment
  showDetailModal.value = true
}

const viewSubmissions = (assignment) => {
  selectedAssignment.value = assignment
  showSubmissionsModal.value = true
}

const viewAssignmentReport = (assignment) => {
  // Navigate to report page or open report modal
  console.log('View report for assignment:', assignment)
}

const editDraft = (assignment) => {
  selectedAssignment.value = assignment
  showCreateModal.value = true
}

const deleteDraft = async (assignment) => {
  if (confirm('이 임시저장 과제를 삭제하시겠습니까?')) {
    try {
      await assignmentApi.deleteAssignment(assignment.id)
      loadAssignments()
    } catch (error) {
      console.error('과제 삭제 실패:', error)
    }
  }
}

const handleAssignmentCreated = (assignment) => {
  loadAssignments()
  emit('assignment-created', assignment)
}

const handleAssignmentUpdated = () => {
  loadAssignments()
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
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

// Lifecycle
onMounted(() => {
  if (props.isOpen) {
    loadAssignments()
  }
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
  z-index: 1000;
  animation: fadeIn 0.2s ease;
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

/* Quick Actions */
.quick-actions {
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

/* Tabs */
.tabs {
  display: flex;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  padding: 16px 24px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  color: #3b82f6;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #3b82f6;
  border-radius: 3px 3px 0 0;
}

.tab-badge {
  background: #e5e7eb;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab.active .tab-badge {
  background: #dbeafe;
  color: #3b82f6;
}

/* Content Area */
.modal-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Assignments Grid */
.assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.assignment-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  cursor: pointer;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.assignment-card.draft {
  border-style: dashed;
  background: #f9fafb;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.assignment-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.assignment-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.assignment-status.PUBLISHED {
  background: #dcfce7;
  color: #166534;
}

.assignment-status.GRADING {
  background: #fef3c7;
  color: #92400e;
}

.assignment-status.COMPLETED {
  background: #e5e7eb;
  color: #374151;
}

.draft-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.assignment-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 0.9rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item svg {
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

/* Progress */
.assignment-progress {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #6b7280;
}

.progress-text {
  font-weight: 600;
  color: #374151;
}

.progress-bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Assignment Actions */
.assignment-actions {
  display: flex;
  gap: 8px;
}

.card-btn {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.card-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.card-btn.primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.card-btn.primary:hover {
  background: #2563eb;
}

.card-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.card-btn.danger:hover {
  background: #fef2f2;
  border-color: #f87171;
}

/* Table */
.assignment-table {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.assignment-table table {
  width: 100%;
  border-collapse: collapse;
}

.assignment-table th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  border-bottom: 1px solid #e5e7eb;
}

.assignment-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
  font-size: 0.95rem;
}

.assignment-table tbody tr:hover {
  background: #f9fafb;
}

.submission-rate {
  display: inline-block;
  padding: 4px 8px;
  background: #dcfce7;
  color: #166534;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
}

.table-action-btn {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.table-action-btn:hover {
  background: #2563eb;
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
  margin-bottom: 16px;
}

.empty-state p {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 20px;
}

.empty-action-btn {
  padding: 10px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.empty-action-btn:hover {
  background: #2563eb;
}
</style>