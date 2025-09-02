<template>
  <div class="student-assignment-list">
    <div class="header">
      <h2>내 과제</h2>
      <div class="filter-tabs">
        <button 
          :class="['tab', { active: activeTab === 'pending' }]"
          @click="activeTab = 'pending'"
        >
          진행중 ({{ pendingCount }})
        </button>
        <button 
          :class="['tab', { active: activeTab === 'submitted' }]"
          @click="activeTab = 'submitted'"
        >
          제출완료 ({{ submittedCount }})
        </button>
        <button 
          :class="['tab', { active: activeTab === 'graded' }]"
          @click="activeTab = 'graded'"
        >
          평가완료 ({{ gradedCount }})
        </button>
      </div>
    </div>

    <div class="assignments-container">
      <div 
        v-for="assignment in filteredAssignments" 
        :key="assignment.id"
        class="assignment-item"
        @click="viewAssignmentDetail(assignment)"
      >
        <div class="assignment-status">
          <div :class="['status-indicator', getStatusClass(assignment)]"></div>
        </div>
        
        <div class="assignment-info">
          <h3>{{ assignment.title }}</h3>
          <p class="description">{{ assignment.description }}</p>
          
          <div class="meta-info">
            <span class="due-date">
              <i class="far fa-calendar"></i>
              마감: {{ formatDate(assignment.dueDate) }}
            </span>
            <span :class="['time-remaining', { urgent: isUrgent(assignment.dueDate) }]">
              <i class="far fa-clock"></i>
              {{ getRemainingTime(assignment.dueDate) }}
            </span>
          </div>
        </div>

        <div class="assignment-actions">
          <div v-if="assignment.submissionStatus === 'NOT_SUBMITTED'" class="not-submitted">
            <span class="status-text">미제출</span>
            <button 
              @click.stop="submitAssignment(assignment)"
              class="btn-submit"
              :disabled="isPastDue(assignment)"
            >
              {{ isPastDue(assignment) ? '마감됨' : '제출하기' }}
            </button>
          </div>
          
          <div v-else-if="assignment.submissionStatus === 'SUBMITTED'" class="submitted">
            <span class="status-text">제출완료</span>
            <span class="submitted-date">{{ formatDate(assignment.submittedAt) }}</span>
            <button @click.stop="viewSubmission(assignment)" class="btn-view">
              제출물 보기
            </button>
          </div>
          
          <div v-else-if="assignment.submissionStatus === 'GRADED'" class="graded">
            <div class="score">
              <span class="score-value">{{ assignment.score }}</span>
              <span class="score-max">/ {{ assignment.maxScore }}</span>
            </div>
            <button @click.stop="viewFeedback(assignment)" class="btn-feedback">
              평가 확인
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredAssignments.length === 0" class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>{{ getEmptyMessage() }}</p>
      </div>
    </div>

    <!-- 과제 제출 모달 -->
    <AssignmentSubmitModal
      v-if="showSubmitModal"
      :assignment="selectedAssignment"
      @close="showSubmitModal = false"
      @submitted="onAssignmentSubmitted"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, formatDistanceToNow, isPast, differenceInHours } from 'date-fns'
import { ko } from 'date-fns/locale'
import AssignmentSubmitModal from './AssignmentSubmitModal.vue'
import assignmentApi from '@/api/assignment'
import calendarApi from '@/api/calendar'

export default {
  name: 'StudentAssignmentList',
  components: {
    AssignmentSubmitModal
  },
  setup() {
    const router = useRouter()
    const assignments = ref([])
    const activeTab = ref('pending')
    const showSubmitModal = ref(false)
    const selectedAssignment = ref(null)
    const studentId = ref(1) // TODO: 실제 로그인한 학생 ID로 변경
    const studentClassIds = ref([1, 2]) // TODO: 실제 학생이 속한 반 ID들로 변경

    const fetchAssignments = async () => {
      try {
        const response = await assignmentApi.getStudentAssignments(
          studentId.value,
          studentClassIds.value
        )
        assignments.value = response.data
        
        // 과제를 캘린더에 추가
        addAssignmentsToCalendar(response.data)
      } catch (error) {
        console.error('과제 목록 조회 실패:', error)
      }
    }

    const addAssignmentsToCalendar = async (assignmentList) => {
      for (const assignment of assignmentList) {
        if (assignment.status === 'PUBLISHED' && assignment.submissionStatus === 'NOT_SUBMITTED') {
          try {
            // 캘린더에 과제 마감일 추가
            await calendarApi.addEvent({
              title: `[과제] ${assignment.title}`,
              start: assignment.dueDate,
              end: assignment.dueDate,
              allDay: false,
              type: 'assignment',
              assignmentId: assignment.id,
              color: '#ff9800',
              description: assignment.description
            })
          } catch (error) {
            console.error('캘린더 이벤트 추가 실패:', error)
          }
        }
      }
    }

    const filteredAssignments = computed(() => {
      return assignments.value.filter(assignment => {
        if (activeTab.value === 'pending') {
          return assignment.submissionStatus === 'NOT_SUBMITTED' && 
                 assignment.status === 'PUBLISHED'
        } else if (activeTab.value === 'submitted') {
          return assignment.submissionStatus === 'SUBMITTED'
        } else if (activeTab.value === 'graded') {
          return assignment.submissionStatus === 'GRADED'
        }
        return false
      })
    })

    const pendingCount = computed(() => 
      assignments.value.filter(a => 
        a.submissionStatus === 'NOT_SUBMITTED' && a.status === 'PUBLISHED'
      ).length
    )

    const submittedCount = computed(() => 
      assignments.value.filter(a => a.submissionStatus === 'SUBMITTED').length
    )

    const gradedCount = computed(() => 
      assignments.value.filter(a => a.submissionStatus === 'GRADED').length
    )

    const getStatusClass = (assignment) => {
      if (assignment.submissionStatus === 'GRADED') return 'status-graded'
      if (assignment.submissionStatus === 'SUBMITTED') return 'status-submitted'
      if (isPastDue(assignment)) return 'status-overdue'
      if (isUrgent(assignment.dueDate)) return 'status-urgent'
      return 'status-pending'
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'MM/dd HH:mm', { locale: ko })
    }

    const getRemainingTime = (dateString) => {
      const date = new Date(dateString)
      if (isPast(date)) {
        return '마감됨'
      }
      return formatDistanceToNow(date, { locale: ko, addSuffix: true })
    }

    const isUrgent = (dateString) => {
      const date = new Date(dateString)
      return differenceInHours(date, new Date()) <= 24 && !isPast(date)
    }

    const isPastDue = (assignment) => {
      return isPast(new Date(assignment.dueDate)) && !assignment.allowLateSubmission
    }

    const getEmptyMessage = () => {
      if (activeTab.value === 'pending') return '진행중인 과제가 없습니다'
      if (activeTab.value === 'submitted') return '제출한 과제가 없습니다'
      if (activeTab.value === 'graded') return '평가완료된 과제가 없습니다'
      return '과제가 없습니다'
    }

    const viewAssignmentDetail = (assignment) => {
      router.push(`/student/assignments/${assignment.id}`)
    }

    const submitAssignment = (assignment) => {
      selectedAssignment.value = assignment
      showSubmitModal.value = true
    }

    const viewSubmission = (assignment) => {
      router.push(`/student/assignments/${assignment.id}/submission`)
    }

    const viewFeedback = (assignment) => {
      router.push(`/student/assignments/${assignment.id}/feedback`)
    }

    const onAssignmentSubmitted = async (submission) => {
      showSubmitModal.value = false
      
      // 캘린더에서 과제 이벤트 업데이트
      try {
        await calendarApi.updateEventStatus({
          assignmentId: submission.assignmentId,
          status: 'completed',
          color: '#4caf50'
        })
      } catch (error) {
        console.error('캘린더 이벤트 업데이트 실패:', error)
      }
      
      fetchAssignments()
    }

    onMounted(() => {
      fetchAssignments()
    })

    return {
      assignments,
      activeTab,
      showSubmitModal,
      selectedAssignment,
      filteredAssignments,
      pendingCount,
      submittedCount,
      gradedCount,
      getStatusClass,
      formatDate,
      getRemainingTime,
      isUrgent,
      isPastDue,
      getEmptyMessage,
      viewAssignmentDetail,
      submitAssignment,
      viewSubmission,
      viewFeedback,
      onAssignmentSubmitted
    }
  }
}
</script>

<style scoped>
.student-assignment-list {
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: -2px;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
  font-weight: 600;
}

.assignments-container {
  margin-top: 20px;
}

.assignment-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assignment-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.assignment-status {
  flex-shrink: 0;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-pending {
  background: #2196f3;
}

.status-urgent {
  background: #ff9800;
  animation: pulse 2s infinite;
}

.status-overdue {
  background: #f44336;
}

.status-submitted {
  background: #4caf50;
}

.status-graded {
  background: #9c27b0;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
}

.assignment-info {
  flex: 1;
}

.assignment-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.description {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #888;
}

.meta-info i {
  margin-right: 5px;
}

.time-remaining.urgent {
  color: #ff5722;
  font-weight: 500;
}

.assignment-actions {
  flex-shrink: 0;
  text-align: right;
}

.not-submitted,
.submitted,
.graded {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5f5f5;
}

.not-submitted .status-text {
  color: #ff5722;
  background: #ffebee;
}

.submitted .status-text {
  color: #4caf50;
  background: #e8f5e9;
}

.submitted-date {
  font-size: 12px;
  color: #888;
}

.score {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-size: 24px;
  font-weight: 600;
  color: #9c27b0;
}

.score-max {
  font-size: 14px;
  color: #666;
}

.btn-submit,
.btn-view,
.btn-feedback {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit {
  background: #1976d2;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #1565c0;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-view {
  background: #4caf50;
  color: white;
}

.btn-view:hover {
  background: #43a047;
}

.btn-feedback {
  background: #9c27b0;
  color: white;
}

.btn-feedback:hover {
  background: #8e24aa;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
  color: #ddd;
}

.empty-state p {
  font-size: 16px;
}
</style>