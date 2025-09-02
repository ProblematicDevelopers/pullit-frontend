<template>
  <div class="teacher-assignment-list">
    <div class="header">
      <h2>과제 관리</h2>
      <button @click="showCreateModal = true" class="btn-primary">
        <i class="fas fa-plus"></i> 새 과제 만들기
      </button>
    </div>

    <div class="filter-section">
      <select v-model="filterStatus" @change="fetchAssignments">
        <option value="">전체 상태</option>
        <option value="DRAFT">초안</option>
        <option value="PUBLISHED">발행됨</option>
        <option value="CLOSED">마감</option>
        <option value="GRADING">평가중</option>
        <option value="COMPLETED">완료</option>
      </select>
    </div>

    <div class="assignment-grid">
      <div 
        v-for="assignment in assignments" 
        :key="assignment.id"
        class="assignment-card"
        @click="viewAssignmentDetail(assignment.id)"
      >
        <div class="card-header">
          <h3>{{ assignment.title }}</h3>
          <span :class="['status-badge', `status-${assignment.status.toLowerCase()}`]">
            {{ getStatusText(assignment.status) }}
          </span>
        </div>
        
        <div class="card-body">
          <p class="description">{{ assignment.description }}</p>
          
          <div class="info-row">
            <span><i class="far fa-calendar"></i> 마감: {{ formatDate(assignment.dueDate) }}</span>
            <span><i class="far fa-clock"></i> {{ getRemainingTime(assignment.dueDate) }}</span>
          </div>
          
          <div class="stats-row">
            <div class="stat">
              <span class="stat-label">학생</span>
              <span class="stat-value">{{ assignment.totalStudents }}명</span>
            </div>
            <div class="stat">
              <span class="stat-label">제출</span>
              <span class="stat-value">{{ assignment.submittedCount }}명</span>
            </div>
            <div class="stat">
              <span class="stat-label">평가</span>
              <span class="stat-value">{{ assignment.gradedCount }}명</span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <button 
            v-if="assignment.status === 'DRAFT'" 
            @click.stop="publishAssignment(assignment.id)"
            class="btn-sm btn-success"
          >
            발행하기
          </button>
          <button 
            @click.stop="viewSubmissions(assignment.id)"
            class="btn-sm btn-info"
          >
            제출 현황
          </button>
          <button 
            v-if="assignment.status === 'DRAFT'"
            @click.stop="editAssignment(assignment.id)"
            class="btn-sm btn-warning"
          >
            수정
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> 로딩중...
    </div>

    <!-- 과제 생성 모달 -->
    <AssignmentCreateModal 
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="onAssignmentCreated"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { ko } from 'date-fns/locale'
import AssignmentCreateModal from './AssignmentCreateModal.vue'
import assignmentApi from '@/api/assignment'

export default {
  name: 'TeacherAssignmentList',
  components: {
    AssignmentCreateModal
  },
  setup() {
    const router = useRouter()
    const assignments = ref([])
    const loading = ref(false)
    const showCreateModal = ref(false)
    const filterStatus = ref('')
    const teacherId = ref(1) // TODO: 실제 로그인한 선생님 ID로 변경

    const fetchAssignments = async () => {
      loading.value = true
      try {
        const response = await assignmentApi.getTeacherAssignments(teacherId.value, {
          status: filterStatus.value || undefined
        })
        assignments.value = response.data.content
      } catch (error) {
        console.error('과제 목록 조회 실패:', error)
        alert('과제 목록을 불러오는데 실패했습니다.')
      } finally {
        loading.value = false
      }
    }

    const publishAssignment = async (id) => {
      if (!confirm('이 과제를 발행하시겠습니까? 발행 후에는 일부 항목만 수정 가능합니다.')) {
        return
      }

      try {
        await assignmentApi.publishAssignment(id, teacherId.value)
        alert('과제가 발행되었습니다.')
        fetchAssignments()
      } catch (error) {
        console.error('과제 발행 실패:', error)
        alert('과제 발행에 실패했습니다.')
      }
    }

    const viewAssignmentDetail = (id) => {
      router.push(`/teacher/assignments/${id}`)
    }

    const viewSubmissions = (id) => {
      router.push(`/teacher/assignments/${id}/submissions`)
    }

    const editAssignment = (id) => {
      router.push(`/teacher/assignments/${id}/edit`)
    }

    const onAssignmentCreated = () => {
      showCreateModal.value = false
      fetchAssignments()
    }

    const formatDate = (dateString) => {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko })
    }

    const getRemainingTime = (dateString) => {
      const date = new Date(dateString)
      if (isPast(date)) {
        return '마감됨'
      }
      return formatDistanceToNow(date, { locale: ko, addSuffix: true })
    }

    const getStatusText = (status) => {
      const statusMap = {
        'DRAFT': '초안',
        'PUBLISHED': '진행중',
        'CLOSED': '마감',
        'GRADING': '평가중',
        'COMPLETED': '완료'
      }
      return statusMap[status] || status
    }

    onMounted(() => {
      fetchAssignments()
    })

    return {
      assignments,
      loading,
      showCreateModal,
      filterStatus,
      fetchAssignments,
      publishAssignment,
      viewAssignmentDetail,
      viewSubmissions,
      editAssignment,
      onAssignmentCreated,
      formatDate,
      getRemainingTime,
      getStatusText
    }
  }
}
</script>

<style scoped>
.teacher-assignment-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  font-weight: 600;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.assignment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.assignment-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assignment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-draft {
  background: #f0f0f0;
  color: #666;
}

.status-published {
  background: #e3f2fd;
  color: #1976d2;
}

.status-closed {
  background: #ffebee;
  color: #c62828;
}

.status-grading {
  background: #fff3e0;
  color: #f57c00;
}

.status-completed {
  background: #e8f5e9;
  color: #2e7d32;
}

.card-body {
  margin-bottom: 15px;
}

.description {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-row {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #888;
  margin-bottom: 15px;
}

.info-row i {
  margin-right: 5px;
}

.stats-row {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
}

.stat {
  flex: 1;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-footer {
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.btn-primary, .btn-sm {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-info {
  background: #2196f3;
  color: white;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>