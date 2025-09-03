<template>
  <div class="teacher-dashboard">
    <!-- Page Header -->
    <div class="page-header" style="background: white !important; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1) !important; border-bottom: 1px solid #e5e7eb !important;">
      <div class="container">
        <div class="header-content">
          <div>
            <h1 class="page-title" style="color: #1e293b !important;">선생님 대시보드</h1>
            <p class="page-subtitle" style="color: #6b7280 !important;">오늘도 좋은 하루 되세요! 학급 현황을 확인해보세요.</p>
          </div>
          <div class="header-actions">
<!--            <button class="notification-btn">-->
<!--              <svg viewBox="0 0 24 24" fill="currentColor">-->
<!--                <path d="M10 21H14C14 22.1 13.1 23 12 23S10 22.1 10 21M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29V4C10 2.9 10.9 2 12 2S14 2.9 14 4V4.29C16.97 5.17 19 7.9 19 11V17L21 19Z"/>-->
<!--              </svg>-->
<!--              <span class="notification-badge">3</span>-->
<!--            </button>-->
<!--            <div class="user-avatar">-->
<!--              <span>김선생</span>-->
<!--            </div>-->
          </div>
        </div>
      </div>
    </div>


    <!-- Online Status Section -->
    <section class="online-status" v-if="currentClassId">
      <div class="container">
        <div class="online-status-card">
          <div class="online-icon">
            <span class="pulse-dot"></span>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25Z"/>
            </svg>
          </div>
          <div class="online-info">
            <h3 class="online-title">현재 접속중인 학생</h3>
            <p class="online-count">{{ onlineStudents }}명</p>
          </div>
          <button class="view-class-btn" @click="showClassManagementModal = true">
            학급 상세보기
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Quick Actions Section -->
    <section class="quick-actions">
      <div class="container">
        <h2 class="section-title">빠른 실행</h2>
        <div class="actions-grid">
          <div
            v-for="action in quickActions"
            :key="action.title"
            class="action-card"
            @click="handleActionClick(action)"
          >
            <div class="action-icon">
              <component :is="action.icon" />
            </div>
            <div class="action-content">
              <h3 class="action-title">{{ action.title }}</h3>
              <p class="action-description">{{ action.description }}</p>
            </div>
            <svg viewBox="0 0 24 24" fill="currentColor" class="arrow-icon">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Grid -->
    <section class="main-content">
      <div class="container">
        <div class="content-grid">
          <!-- Recent Activities -->
          <div class="content-main">
            <div class="content-card">
              <div class="card-header">
                <h3 class="card-title">최근 활동</h3>
                <button class="view-all-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5M12 17C9.24 17 7 14.76 7 12S9.24 7 12 7 17 9.24 17 12 14.76 17 12 17M12 9C10.34 9 9 10.34 9 12S10.34 15 12 15 15 13.66 15 12 13.66 9 12 9Z"/>
                  </svg>
                  전체 보기
                </button>
              </div>
              <div class="activity-list">
                <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                  <div class="activity-avatar" :class="activity.type">
                    <component :is="activity.icon" />
                  </div>
                  <div class="activity-content">
                    <p class="activity-title">{{ activity.title }}</p>
                    <p class="activity-description">{{ activity.description }}</p>
                  </div>
                  <span class="activity-time">{{ activity.time }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="content-sidebar">
            <!-- Chat Section -->
            <div class="content-card">
              <div class="card-header">
                <h3 class="card-title">학급 채팅</h3>
                <span class="chat-badge">{{ chatMessages.length }}개 메시지</span>
              </div>
              <div class="chat-container">
                <div ref="chatContainerRef" class="chat-messages">
                  <div
                    v-for="message in chatMessages"
                    :key="message.id"
                    class="chat-message"
                    :class="{
                      'is-mine': message.senderId === currentUserId &&
                                 message.messageType !== 'JOIN' &&
                                 message.messageType !== 'LEAVE',
                      'is-system': message.messageType === 'JOIN' ||
                                   message.messageType === 'LEAVE'
                    }"
                  >
                    <!-- System Messages -->
                    <div v-if="message.messageType === 'JOIN' || message.messageType === 'LEAVE'"
                         class="system-message">
                      {{ message.content }}
                    </div>

                    <!-- Regular Messages -->
                    <div v-else class="message-bubble">
                      <div class="message-header">
                        <span class="sender-name">{{ message.senderName }}</span>
                        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                      </div>
                      <div class="message-content">{{ message.content }}</div>
                    </div>
                  </div>
                </div>
                <div class="chat-input">
                  <input
                    v-model="newMessage"
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    @keyup.enter="sendMessage"
                  />
                  <button @click="sendMessage" :disabled="!newMessage.trim()">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Upcoming Events -->
            <div class="content-card">
              <div class="card-header">
                <h3 class="card-title">예정된 일정</h3>
                <button class="calendar-btn" @click="showCalendarModal = true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19Z"/>
                  </svg>
                </button>
              </div>
              <div class="events-list">
                <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
                  <div class="event-indicator" :class="event.type"></div>
                  <div class="event-content">
                    <p class="event-title">{{ event.title }}</p>
                    <p class="event-meta">{{ event.date }} · {{ event.time }}</p>
                    <span v-if="event.participants" class="event-badge">
                      {{ event.participants }}명 참여
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- Student Invite Modal -->
    <StudentInviteModal
      :isOpen="showInviteModal"
      :classId="currentClassId"
      @close="showInviteModal = false"
      @invited="handleStudentsInvited"
    />

    <!-- Class Create Modal -->
    <ClassCreateModal
      :isOpen="showCreateClassModal"
      @close="showCreateClassModal = false"
      @created="handleClassCreated"
    />

    <!-- Class Management Modal -->
    <ClassManagementModal
      v-model="showClassManagementModal"
      @create-class="showCreateClassModal = true"
      @invite-students="openStudentInviteModal"
    />

    <!-- Calendar Modal -->
    <CalendarModal
      :isOpen="showCalendarModal"
      :upcomingEvents="upcomingEvents"
      :userId="currentUserId"
      :classId="currentClassId"
      :isStudent="false"
      @close="showCalendarModal = false"
      @schedule-added="handleScheduleAdded"
    />

    <!-- My Exams Modal -->
    <MyExamsModal
      :isOpen="showMyExamsModal"
      @close="showMyExamsModal = false"
      @exam-selected="handleExamSelected"
      @assign-exam="handleAssignExam"
    />

    <!-- Exam Assign Modal -->
    <ExamAssignModal
      :isOpen="showExamAssignModal"
      :exam="selectedExamForAssign"
      @close="showExamAssignModal = false"
      @assigned="handleExamAssigned"
    />

    <!-- Live Exam Control Modal -->
    <LiveExamControlModal
      :isOpen="showLiveExamControlModal"
      :classId="currentClassId"
      @close="showLiveExamControlModal = false"
      @exam-started="handleExamStarted"
      @exam-ended="handleExamEnded"
    />

    <!-- Grade Stats Modal -->
    <GradeStatsModal
      :isOpen="showGradeStatsModal"
      :classId="currentClassId"
      @close="showGradeStatsModal = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, markRaw, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import StudentInviteModal from '@/components/StudentInviteModal.vue'
import ClassCreateModal from '@/components/ClassCreateModal.vue'
import ClassManagementModal from '@/components/ClassManagementModal.vue'
import CalendarModal from '@/components/CalendarModal.vue'
import MyExamsModal from '@/components/MyExamsModal.vue'
import ExamAssignModal from '@/components/ExamAssignModal.vue'
import LiveExamControlModal from '@/components/LiveExamControlModal.vue'
import GradeStatsModal from '@/components/teacher/GradeStatsModal.vue'
import authService from '@/services/auth'
import examApi from '@/services/examApi'
import dashboardApi from '@/services/dashboardApi'
import scheduleApi from '@/services/scheduleApi'
import { teacherStatsAPI } from '@/services/api'
import { useClassWebSocket } from '@/components/student/class-room/composables/useClassWebSocket'

const router = useRouter()

// 사용자 타입 확인
const userType = ref('teacher')

// 모달 상태
const showInviteModal = ref(false)
const showCreateClassModal = ref(false)
const showClassManagementModal = ref(false)
const showCalendarModal = ref(false)
const showMyExamsModal = ref(false)
const showExamAssignModal = ref(false)
const showLiveExamControlModal = ref(false)
const showGradeStatsModal = ref(false)
const currentClassId = ref(null)
const selectedExamForAssign = ref(null)

// WebSocket 관련 변수
const currentUserId = ref(null)
const currentUserName = ref(null)
const currentUserRole = ref('TEACHER')
const channelName = ref('')

// Icons as components (markRaw to prevent reactivity)
const UsersIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25Z' })
  ])
})

const FileTextIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z' })
  ])
})

const AwardIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2M12 7L9 12L6 9L2 21H22L18 9L15 12L12 7Z' })
  ])
})

const CalendarIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19Z' })
  ])
})

const BookOpenIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M21 5C19.89 4.65 18.67 4.5 17.5 4.5C15.55 4.5 13.45 4.9 12 6C10.55 4.9 8.45 4.5 6.5 4.5S2.11 4.65 1 5V18.65C1 19.05 1.25 19.25 1.5 19.25C1.6 19.25 1.65 19.15 1.75 19.15C2.86 18.65 4.08 18.5 5.5 18.5C7.45 18.5 9.55 18.9 11 20C12.35 19.15 14.8 18.5 16.5 18.5C17.94 18.5 19.38 18.65 20.25 19.15C20.35 19.15 20.4 19.25 20.5 19.25C20.75 19.25 21 19.05 21 18.65V5M19 17.05C18.13 16.75 17.19 16.5 16.5 16.5C14.8 16.5 12.35 17.15 11 18V8C12.35 7.15 14.8 6.5 16.5 6.5C17.2 6.5 18.15 6.65 19 6.95V17.05Z' })
  ])
})

const BarChart3Icon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M5 19H7V8H5V19M9 19H11V4H9V19M13 19H15V11H13V19M17 19H19V15H17V19M3 22V2L21 2V22L3 22Z' })
  ])
})

const GraduationCapIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3M18.82 9L12 12.72L5.18 9L12 5.28L18.82 9M17 16L12 18.72L7 16V12.27L12 15L17 12.27V16Z' })
  ])
})

const UserPlusIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M15 14C12.33 14 7 15.33 7 18V20H23V18C23 15.33 17.67 14 15 14M15 12C17.21 12 19 10.21 19 8S17.21 4 15 4 11 5.79 11 8 12.79 12 15 12M5 9.59L7.12 7.46L8.54 8.88L6.41 11L8.54 13.12L7.12 14.54L5 12.41L2.88 14.54L1.46 13.12L3.59 11L1.46 8.88L2.88 7.46L5 9.59Z' })
  ])
})

const ClipboardListIcon = markRaw({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M12 3C12.55 3 13 3.45 13 4S12.55 5 12 5 11 4.55 11 4 11.45 3 12 3M7 7H17V5H19V19H5V5H7V7M12 9V13.5L17 11L12 9Z' })
  ])
})

// 통계 데이터 - 초기값은 0으로 설정
const stats = ref({
  totalStudents: 0,
  activeExams: 0,
  averageGrade: 0,
  classesToday: 0
})

// Display stats computed - 실제 데이터 기반으로 표시
const displayStats = computed(() => [
  {
    title: '전체 학생',
    value: stats.value.totalStudents.toString(),
    change: '',  // 변화량은 별도 API 필요시 구현
    trend: 'stable',
    icon: UsersIcon,
    color: 'blue'
  },
  {
    title: '진행중 시험',
    value: stats.value.activeExams.toString(),
    change: '',
    trend: 'stable',
    icon: FileTextIcon,
    color: 'green'
  },
  {
    title: '평균 성적',
    value: stats.value.averageGrade ? `${stats.value.averageGrade.toFixed(1)}점` : '0점',
    change: '',
    trend: 'stable',
    icon: AwardIcon,
    color: 'purple'
  },
  {
    title: '오늘 일정',
    value: stats.value.classesToday.toString(),
    change: '',
    trend: 'stable',
    icon: CalendarIcon,
    color: 'orange'
  }
])

// Quick actions
const quickActions = ref([
  {
    title: '내 시험지 관리',
    description: '내 시험지로 학생들에게 시험을 출제하세요',
    icon: BookOpenIcon,
    action: 'assign-exam'
  },
  {
    title: '실시간 시험 관리',
    description: 'CBT 시험만 실시간으로 출제하고 관리하세요',
    icon: CalendarIcon,
    action: 'live-exam-control'
  },
  {
    title: '성적 통계',
    description: '학생 성적을 확인하고 분석하세요',
    icon: BarChart3Icon,
    action: 'grade-stats'
  },
  {
    title: '학급 관리',
    description: '학급과 학생 정보를 관리하세요',
    icon: GraduationCapIcon,
    action: 'class-management'
  },
  {
    title: '학생 초대',
    description: '새로운 학생을 학급에 초대하세요',
    icon: UserPlusIcon,
    action: 'invite-students'
  }
])

// Recent activities - 초기값만 설정, 실제 데이터는 API에서 로드
const recentActivities = ref([])

// Upcoming events - 초기값만 설정, 실제 데이터는 API에서 로드
const upcomingEvents = ref([])


// Handle action click
const handleActionClick = (action) => {
  switch(action.action) {
    case 'assign-exam':
      showMyExamsModal.value = true  // 내 시험지 목록 모달 열기
      break
    case 'live-exam-control':
      showLiveExamControlModal.value = true  // CBT 실시간 시험 관리 모달 열기
      break
    case 'grade-stats':
      showGradeStatsModal.value = true  // 성적 통계 모달 열기
      break
    case 'class-management':
      showClassManagementModal.value = true
      break
    case 'invite-students':
      openStudentInviteModal()
      break
  }
}

// 시험지 선택 처리
const handleExamSelected = (exam) => {
  console.log('시험지 선택됨:', exam)
  // 선택한 시험지로 추가 작업 수행 가능
}

// 시험 출제 처리
const handleAssignExam = (exam) => {
  selectedExamForAssign.value = exam
  showExamAssignModal.value = true
}

// 시험 출제 완료 처리
const handleExamAssigned = (result) => {
  console.log('시험 출제 완료:', result)
  // 대시보드 데이터 새로고침
  loadDashboardData()
}

// 시험지 제작 팝업 열기
const openTestWizardPopup = () => {
  const width = 1200
  const height = 800
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2

  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`

  // 새 창으로 시험지 제작 마법사 열기
  window.open('/exam/wizard', 'TestWizardPopup', features)
}

// 학생 초대 모달 열기
const openStudentInviteModal = async () => {
  console.log('=== openStudentInviteModal 호출 ===')
  console.log('현재 currentClassId.value:', currentClassId.value)

  // 이미 currentClassId가 있으면 바로 모달 열기
  if (currentClassId.value) {
    console.log('학급 ID 있음, 학생 초대 모달 열기')
    showInviteModal.value = true
    return
  }

  try {
    console.log('학급 정보 다시 조회 시도...')
    // 선생님의 담당 학급 정보 가져오기
    const teacherClass = await authService.getTeacherClass()
    console.log('getTeacherClass 응답:', teacherClass)

    if (teacherClass && teacherClass.classId) {
      currentClassId.value = teacherClass.classId
      console.log('학급 ID 설정됨:', currentClassId.value)
      showInviteModal.value = true
    } else {
      console.log('학급이 없음, 학급 생성 모달 표시')
      // 학급이 없는 경우 학급 생성 모달 표시
      showCreateClassModal.value = true
    }
  } catch (error) {
    console.error('Failed to open invite modal:', error)
    // 404 에러는 학급이 없는 경우
    if (error.response?.status === 404) {
      console.log('404 에러 - 학급 없음')
      showCreateClassModal.value = true
    } else {
      console.error('학급 정보 조회 실패:', error)
      alert('학급 정보를 불러오는데 실패했습니다.')
    }
  }
}

// 학생 초대 완료 핸들러
const handleStudentsInvited = () => {
  // 학생 수 업데이트 등의 처리
  loadDashboardData()
}

// 학급 생성 완료 핸들러
const handleClassCreated = (createdClass) => {
  currentClassId.value = createdClass.classId
  showCreateClassModal.value = false
  // 학급 생성 후 자동으로 학생 초대 모달 열기
  setTimeout(() => {
    showInviteModal.value = true
  }, 500)
}


// 대시보드 데이터 로드
const loadDashboardData = async () => {
  try {
    // 클래스 ID가 있는 경우에만 통계 로드
    if (currentClassId.value) {
      // 1. 교사 성적 통계 API에서 클래스 개요 로드
      try {
        const overviewResponse = await teacherStatsAPI.getClassOverview(currentClassId.value)
        if (overviewResponse.data.success) {
          const overview = overviewResponse.data.data
          stats.value = {
            totalStudents: overview.totalStudents || 0,
            activeExams: overview.totalExams || 0,
            averageGrade: overview.classAverageScore || 0,
            classesToday: overview.recentExams ? overview.recentExams.length : 0
          }
        }
      } catch (error) {
        console.error('클래스 개요 로드 실패:', error)
        // 기본 대시보드 API 시도
        const statsResponse = await dashboardApi.getDashboardStats()
        if (statsResponse.success) {
          stats.value = statsResponse.data
        }
      }
    }

    // 2. 최근 활동 로드
    const activitiesResponse = await dashboardApi.getRecentActivities(5)
    if (activitiesResponse.success) {
      recentActivities.value = activitiesResponse.data.map(activity => ({
        id: activity.id,
        type: activity.iconType,
        title: activity.title,
        description: activity.description,
        time: activity.relativeTime,
        icon: getIconComponent(activity.iconType)
      }))
    }

    // 3. 예정된 일정 로드
    const schedulesResponse = await dashboardApi.getUpcomingSchedules(5)
    if (schedulesResponse.success) {
      upcomingEvents.value = schedulesResponse.data.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        date: schedule.dateDisplay,
        time: schedule.timeDisplay,
        type: schedule.type,
        participants: schedule.participants
      }))
    }
  } catch (error) {
    console.error('대시보드 데이터 로드 실패:', error)
    // 에러 발생 시 기본값 유지
    stats.value = {
      totalStudents: 0,
      activeExams: 0,
      averageGrade: 0,
      classesToday: 0
    }
  }
}

// 아이콘 컴포넌트 매핑
const getIconComponent = (type) => {
  switch(type) {
    case 'exam': return FileTextIcon
    case 'student': return UsersIcon
    case 'grade': return AwardIcon
    default: return CalendarIcon
  }
}

// 일정 추가 완료 핸들러
const handleScheduleAdded = () => {
  // 예정된 일정 목록 새로고침
  loadDashboardData()
}

// 실시간 시험 시작 핸들러
const handleExamStarted = (exam) => {
  console.log('실시간 시험 시작됨:', exam)
  // 필요한 경우 추가 작업 수행
}

// 실시간 시험 종료 핸들러
const handleExamEnded = (exam) => {
  console.log('실시간 시험 종료됨:', exam)
  // 필요한 경우 추가 작업 수행
}

// 채팅 메시지 전송
const sendMessage = () => {
  if (!newMessage.value.trim() || !wsComposable) return

  wsComposable.sendChatMessage(newMessage.value.trim())
  newMessage.value = ''
}

// 시간 포맷팅
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 채팅 스크롤 하단 이동
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// 시험 출제 모달 열기
const openExamAssignModal = async () => {
  // 내 시험지 목록을 먼저 조회
  try {
    const myExamsResponse = await examApi.get('/my', {
      params: { page: 0, size: 100 }
    })

    if (myExamsResponse.data.success && myExamsResponse.data.data.content.length > 0) {
      // 시험지가 있으면 시험 출제 모달 열기
      router.push('/exam-assign') // 시험 출제 페이지로 이동
    } else {
      // 시험지가 없으면 먼저 시험지 제작 유도
      alert('먼저 시험지를 생성해주세요.')
      openTestWizardPopup()
    }
  } catch (error) {
    console.error('시험지 조회 실패:', error)
    alert('시험지 목록을 불러오는데 실패했습니다.')
  }
}

// WebSocket composable 관련 변수
let wsComposable = null
const onlineStudents = ref(0)

// 채팅 관련 변수
const chatMessages = ref([])
const newMessage = ref('')
const chatContainerRef = ref(null)

onMounted(async () => {
  const user = authService.getCurrentUser()
  if (user) {
    userType.value = user.role === 'TEACHER' ? 'teacher' : 'student'

    // WebSocket용 사용자 정보 설정
    currentUserId.value = user.id || user.userId
    currentUserName.value = user.fullName || user.name
    currentUserRole.value = user.role

    // 선생님인 경우 담당 학급 체크
    if (user.role === 'TEACHER') {
      try {
        const teacherClass = await authService.getTeacherClass()
        if (teacherClass && teacherClass.classId) {
          // 담당 학급이 있으면 클래스 정보 저장
          currentClassId.value = teacherClass.classId
          channelName.value = `class-${teacherClass.classId}`

          // 사용자 정보가 설정된 후에 WebSocket composable 초기화
          wsComposable = useClassWebSocket(
            currentUserId.value,
            currentUserName.value,
            currentUserRole.value,
            scrollToBottom, // 채팅 스크롤 함수 전달
            channelName,
          )

          // WebSocket 연결
          console.log('🔌 ClassDashboard: WebSocket 연결 시작', {
            classId: teacherClass.classId,
            userId: currentUserId.value,
            userName: currentUserName.value,
            channelName: channelName.value
          })

          await wsComposable.connectWebSocket({
            onOnlineStatus: (status) => {
              console.log('📊 ClassDashboard: 온라인 상태 업데이트', status)
              // onlineStudents는 composable 내부에서 자동 업데이트됨
              onlineStudents.value = wsComposable.onlineStudents.value
            },
            onChatMessage: (message) => {
              console.log('💬 ClassDashboard: 채팅 메시지', message)
              // 채팅 메시지 처리
              chatMessages.value = wsComposable.chatMessages.value
              scrollToBottom()
            }
          })

          // 연결 후 온라인 상태 조회
          setTimeout(() => {
            wsComposable.refreshOnlineStatus()
          }, 1000)

          // onlineStudents와 chatMessages 값 동기화를 위한 watch
          watch(() => wsComposable.onlineStudents.value, (newVal) => {
            onlineStudents.value = newVal
          })

          watch(() => wsComposable.chatMessages.value, (newVal) => {
            chatMessages.value = newVal
            scrollToBottom()
          })

          // 대시보드 데이터 로드
          await loadDashboardData()
        } else {
          // 담당 학급이 없으면 학급 생성 유도
          currentClassId.value = null
          setTimeout(() => {
            showCreateClassModal.value = true
          }, 1000)
        }
      } catch (error) {
        console.error('Failed to load teacher class:', error)
        // 에러가 발생해도 학급 생성 모달 표시
        setTimeout(() => {
          showCreateClassModal.value = true
        }, 1000)
      }
    }
  } else {
    // 로그인하지 않은 경우 localStorage에서 확인
    userType.value = localStorage.getItem('userType') || 'teacher'
  }

  // 대시보드 데이터 로드
  await loadDashboardData()
})

onUnmounted(() => {
  // 페이지를 떠날 때 WebSocket 연결 해제
  if (wsComposable && wsComposable.disconnectWebSocket) {
    console.log('🔌 ClassDashboard: WebSocket 연결 해제')
    wsComposable.disconnectWebSocket()
  }
})
</script>

<style scoped>
.teacher-dashboard {
  background: #f8fafc;
  min-height: 100vh;
  padding-bottom: 2rem;
}

/* Page Header - Override common.css with higher specificity */
.teacher-dashboard .page-header {
  background: white !important;
  padding: 2rem 0 !important;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border-bottom: 1px solid #e5e7eb !important;
}

.teacher-dashboard .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.teacher-dashboard .page-title {
  font-size: 2rem !important;
  font-weight: 700 !important;
  color: #1e293b !important;
  margin: 0 !important;
  margin-bottom: 0.5rem !important;
}

.teacher-dashboard .page-subtitle {
  font-size: 1.1rem !important;
  color: #6b7280 !important;
  margin: 0 !important;
}

.teacher-dashboard .header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.teacher-dashboard .notification-btn {
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.teacher-dashboard .notification-btn:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.teacher-dashboard .notification-btn svg {
  width: 24px;
  height: 24px;
  fill: #475569;
}

.teacher-dashboard .notification-badge {
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

.teacher-dashboard .user-avatar {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: #1e293b;
  font-weight: 600;
}

/* Container */
.container {
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
}

/* Online Status Section */
.online-status {
  margin-bottom: 2rem;
}

.online-status-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.online-status-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.online-icon {
  position: relative;
  width: 56px;
  height: 56px;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-icon svg {
  width: 28px;
  height: 28px;
  fill: #2563eb;
}

.pulse-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.online-info {
  flex: 1;
}

.online-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 0.25rem 0;
}

.online-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.online-count::after {
  content: ' 온라인';
  font-size: 0.875rem;
  font-weight: 400;
  color: #64748b;
  margin-left: 0.25rem;
}

.view-class-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-class-btn:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.view-class-btn svg {
  width: 16px;
  height: 16px;
  fill: white;
}


/* Quick Actions */
.quick-actions {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
  transform: translateX(4px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon svg {
  width: 24px;
  height: 24px;
  fill: #2563eb;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.action-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.arrow-icon {
  width: 20px;
  height: 20px;
  fill: #94a3b8;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.action-card:hover .arrow-icon {
  fill: #2563eb;
  transform: translateX(3px);
}

/* Main Content */
.main-content {
  margin-bottom: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 1.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.view-all-btn,
.calendar-btn {
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-all-btn:hover,
.calendar-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.view-all-btn svg,
.calendar-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  transition: background 0.2s;
}

.activity-item:hover {
  background: #f8fafc;
}

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #eff6ff;
}

.activity-avatar svg {
  width: 20px;
  height: 20px;
  fill: #2563eb;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.activity-description {
  font-size: 0.875rem;
  color: #64748b;
}

.activity-time {
  font-size: 0.8125rem;
  color: #94a3b8;
  white-space: nowrap;
}

/* Events List */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  transition: background 0.2s;
  position: relative;
}

.event-item:hover {
  background: #f8fafc;
}

.event-indicator {
  width: 3px;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 2px;
  background: #2563eb;
}

.event-content {
  flex: 1;
  padding-left: 0.5rem;
}

.event-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.event-meta {
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.event-badge {
  display: inline-block;
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}


/* Chat Styles */
.chat-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.chat-message {
  margin-bottom: 1rem;
}

.chat-message.is-mine .message-bubble {
  background: #2563eb;
  color: white;
  margin-left: auto;
  max-width: 70%;
}

.chat-message.is-system {
  text-align: center;
  margin: 1rem 0;
}

.system-message {
  display: inline-block;
  background: #e2e8f0;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.message-bubble {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  max-width: 70%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.sender-name {
  font-weight: 600;
  color: #475569;
}

.chat-message.is-mine .sender-name {
  color: rgba(255, 255, 255, 0.9);
}

.message-time {
  color: #94a3b8;
}

.chat-message.is-mine .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-content {
  font-size: 0.875rem;
  line-height: 1.4;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  padding: 0.625rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.chat-input input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.chat-input button {
  padding: 0.625rem 1rem;
  background: #2563eb;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-input button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-input button svg {
  width: 18px;
  height: 18px;
  fill: white;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .content-sidebar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .content-sidebar {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }
}
</style>
