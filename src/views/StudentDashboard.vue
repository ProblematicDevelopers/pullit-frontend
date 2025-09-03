<template>
  <div class="student-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div>
            <h1 class="page-title">학생 대시보드</h1>
            <p class="page-subtitle">오늘도 열심히 공부해요! 학습 현황을 확인해보세요.</p>
          </div>
          <div class="header-actions">
            <button class="notification-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 21H14C14 22.1 13.1 23 12 23S10 22.1 10 21M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29V4C10 2.9 10.9 2 12 2S14 2.9 14 4V4.29C16.97 5.17 19 7.9 19 11V17L21 19Z"/>
              </svg>
              <span class="notification-badge">2</span>
            </button>
            <div class="user-avatar">
              <span>{{ studentName || '학생' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 실시간 시험 상태 배너 -->
    <ExamStatusBanner 
      v-if="classId"
      ref="examBanner"
      :class-id="classId"
    />
    
    <!-- 기존 대시보드 내용 -->
    <div class="dashboard-container" :class="{ 'with-banner': hasActiveExam }">
      <!-- 여기에 기존 대시보드 콘텐츠 추가 -->
      <div class="dashboard-content">
        <div class="welcome-section">
          <h2>안녕하세요, {{ studentName }}님!</h2>
          <p>오늘도 열심히 공부해요! 💪</p>
        </div>
        
        <div class="class-info" v-if="classInfo">
          <h3>우리 반 정보</h3>
          <p>{{ classInfo.className }} ({{ classInfo.teacherName }} 선생님)</p>
        </div>
        
        <!-- 예정된 시험 섹션 추가 -->
        <div class="exams-section">
          <h3>📝 예정된 시험</h3>
          
          <div v-if="loading" class="loading">
            시험 정보를 불러오는 중...
          </div>
          
          <div v-else-if="upcomingExams.length === 0" class="no-exams">
            <p>예정된 시험이 없습니다.</p>
          </div>
          
          <div v-else class="exam-list">
            <div 
              v-for="exam in upcomingExams" 
              :key="`${exam.type}-${exam.id}`"
              class="exam-card"
              :class="{ 'cbt-exam': exam.type === 'cbt_exam', 'general-exam': exam.type === 'general_exam' }"
            >
              <div class="exam-header">
                <span class="exam-type-badge" :class="exam.type">
                  {{ exam.type === 'cbt_exam' ? 'CBT' : '일반' }}
                </span>
                <h4>{{ exam.title }}</h4>
              </div>
              
              <div class="exam-info">
                <div class="info-item">
                  <span class="label">📅 날짜:</span>
                  <span>{{ exam.dateDisplay }}</span>
                </div>
                <div class="info-item">
                  <span class="label">⏰ 시간:</span>
                  <span>{{ exam.timeDisplay }}</span>
                </div>
                <div class="info-item" v-if="exam.description">
                  <span class="label">📋 내용:</span>
                  <span>{{ exam.description }}</span>
                </div>
                <div class="info-item">
                  <span class="label">상태:</span>
                  <span class="exam-status" :class="exam.status">
                    {{ getStatusText(exam.status) }}
                  </span>
                </div>
              </div>
              
              <div class="exam-actions">
                <button 
                  v-if="exam.type === 'cbt_exam' && exam.status === 'ongoing'"
                  @click="enterCbtExam(exam)"
                  class="btn-enter-exam"
                >
                  시험 응시하기
                </button>
                <button 
                  v-else-if="exam.type === 'general_exam'"
                  @click="viewExamDetails(exam)"
                  class="btn-view-details"
                >
                  상세보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ExamStatusBanner from '@/components/student/ExamStatusBanner.vue'
import { useExamWebSocket } from '@/composables/useExamWebSocket'
import dashboardApi from '@/services/dashboardApi'

// 라우터
const router = useRouter()

// 학생 정보
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const studentName = ref(userInfo.fullName || '학생')
const classId = ref(userInfo.classId || null)

// 클래스 정보
const classInfo = ref(null)

// 시험 배너 참조
const examBanner = ref(null)
const hasActiveExam = ref(false)

// 시험 목록
const upcomingExams = ref([])
const loading = ref(false)

// WebSocket 연결 (클래스 ID가 있을 때만)
if (classId.value) {
  const { onExamStatusUpdate } = useExamWebSocket(classId.value)
  
  // WebSocket 메시지 수신 시 배너 업데이트
  onExamStatusUpdate((data) => {
    console.log('대시보드에서 시험 상태 수신:', data)
    
    // ExamStatusBanner 컴포넌트로 이벤트 전달
    if (examBanner.value && examBanner.value.onExamStatusUpdate) {
      examBanner.value.onExamStatusUpdate(data)
      
      // 활성 시험 여부 업데이트
      if (data.eventType === 'EXAM_STARTED' || data.examStatus === 'STARTED') {
        hasActiveExam.value = true
      } else if (data.eventType === 'EXAM_ENDED' || data.examStatus === 'ENDED') {
        hasActiveExam.value = false
      }
    }
  })
}

// 클래스 정보 로드
const loadClassInfo = async () => {
  if (!classId.value) return
  
  try {
    // API 호출로 클래스 정보 로드
    // const response = await classApi.getClassInfo(classId.value)
    // classInfo.value = response.data
    
    // 임시 데이터
    classInfo.value = {
      className: '6학년 1반',
      teacherName: '김선생'
    }
  } catch (error) {
    console.error('클래스 정보 로드 실패:', error)
  }
}

// 시험 목록 로드
const loadUpcomingExams = async () => {
  loading.value = true
  try {
    const response = await dashboardApi.getStudentExams(classId.value)
    upcomingExams.value = response.data || []
    console.log('시험 목록 로드 완료:', upcomingExams.value)
  } catch (error) {
    console.error('시험 목록 로드 실패:', error)
    upcomingExams.value = []
  } finally {
    loading.value = false
  }
}

// 상태 텍스트 변환
const getStatusText = (status) => {
  const statusMap = {
    'upcoming': '예정',
    'ongoing': '진행중',
    'completed': '완료',
    'cancelled': '취소됨'
  }
  return statusMap[status] || status
}

// CBT 시험 응시
const enterCbtExam = (exam) => {
  console.log('CBT 시험 응시:', exam)
  // CBT 시험 페이지로 이동
  router.push({
    name: 'CBTExam',
    params: { examId: exam.examId }
  })
}

// 일반 시험 상세보기
const viewExamDetails = (exam) => {
  console.log('시험 상세보기:', exam)
  // 시험 상세 페이지로 이동 또는 모달 표시
  alert(`${exam.title} 시험 상세 정보\n\n날짜: ${exam.dateDisplay}\n시간: ${exam.timeDisplay}\n${exam.description}`)
}

onMounted(() => {
  loadClassInfo()
  loadUpcomingExams()
})
</script>

<style scoped>
.student-dashboard {
  min-height: 100vh;
  background: #f8fafc;
}

/* Page Header - 일관된 헤더 스타일 */
.student-dashboard .page-header {
  background: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border-bottom: 1px solid #e5e7eb;
}

.student-dashboard .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.student-dashboard .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-dashboard .page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  margin-bottom: 0.5rem;
}

.student-dashboard .page-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

.student-dashboard .header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-dashboard .notification-btn {
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.student-dashboard .notification-btn:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.student-dashboard .notification-btn svg {
  width: 24px;
  height: 24px;
  fill: #475569;
}

.student-dashboard .notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.student-dashboard .user-avatar {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: #1e293b;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.student-dashboard .user-avatar:hover {
  background: #f1f5f9;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  transition: padding-top 0.3s ease;
}

.dashboard-container.with-banner {
  padding-top: 120px; /* 배너 공간 확보 */
}

.dashboard-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.welcome-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.welcome-section h2 {
  color: #1f2937;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  color: #6b7280;
  font-size: 1.125rem;
}

.class-info {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.class-info h3 {
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.class-info p {
  color: #6b7280;
  font-size: 1rem;
}

/* 시험 섹션 스타일 */
.exams-section {
  margin-top: 2rem;
}

.exams-section h3 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.no-exams {
  text-align: center;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
}

.exam-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.exam-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.exam-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.exam-card.cbt-exam {
  border-left: 4px solid #3b82f6;
}

.exam-card.general-exam {
  border-left: 4px solid #10b981;
}

.exam-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.exam-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.exam-type-badge.cbt_exam {
  background: #dbeafe;
  color: #1d4ed8;
}

.exam-type-badge.general_exam {
  background: #d1fae5;
  color: #065f46;
}

.exam-header h4 {
  flex: 1;
  margin: 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.exam-info {
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.info-item .label {
  color: #6b7280;
  min-width: 60px;
}

.exam-status {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.exam-status.upcoming {
  background: #fef3c7;
  color: #92400e;
}

.exam-status.ongoing {
  background: #fee2e2;
  color: #991b1b;
}

.exam-status.completed {
  background: #e5e7eb;
  color: #374151;
}

.exam-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-enter-exam,
.btn-view-details {
  flex: 1;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-enter-exam {
  background: #ef4444;
  color: white;
}

.btn-enter-exam:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-view-details {
  background: #f3f4f6;
  color: #374151;
}

.btn-view-details:hover {
  background: #e5e7eb;
}
</style>