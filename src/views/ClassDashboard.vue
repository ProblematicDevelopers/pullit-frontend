<template>
  <div class="teacher-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div>
            <h1 class="page-title">선생님 대시보드</h1>
            <p class="page-subtitle">오늘도 좋은 하루 되세요! 학급 현황을 확인해보세요.</p>
          </div>
          <div class="header-actions">
            <button class="notification-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 21H14C14 22.1 13.1 23 12 23S10 22.1 10 21M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29V4C10 2.9 10.9 2 12 2S14 2.9 14 4V4.29C16.97 5.17 19 7.9 19 11V17L21 19Z"/>
              </svg>
              <span class="notification-badge">3</span>
            </button>
            <div class="user-avatar">
              <span>김선생</span>
            </div>
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
            <!-- Upcoming Events -->
            <div class="content-card">
              <div class="card-header">
                <h3 class="card-title">예정된 일정</h3>
                <button class="calendar-btn">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, markRaw, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import StudentInviteModal from '@/components/StudentInviteModal.vue'
import ClassCreateModal from '@/components/ClassCreateModal.vue'
import ClassManagementModal from '@/components/ClassManagementModal.vue'
import authService from '@/services/auth'
import examApi from '@/services/examApi'
import { useClassWebSocket } from '@/components/student/class-room/composables/useClassWebSocket'

const router = useRouter()

// 사용자 타입 확인
const userType = ref('teacher')

// 모달 상태
const showInviteModal = ref(false)
const showCreateClassModal = ref(false)
const showClassManagementModal = ref(false)
const currentClassId = ref(null)

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

// 통계 데이터
const stats = ref({
  totalStudents: 156,
  activeExams: 8,
  averageGrade: 87.5,
  classesToday: 5
})

// Display stats computed
const displayStats = computed(() => [
  {
    title: '전체 학생',
    value: stats.value.totalStudents.toString(),
    change: '+12%',
    trend: 'up',
    icon: UsersIcon,
    color: 'blue'
  },
  {
    title: '진행중 시험',
    value: stats.value.activeExams.toString(),
    change: '+3',
    trend: 'up',
    icon: FileTextIcon,
    color: 'green'
  },
  {
    title: '평균 성적',
    value: `${stats.value.averageGrade}%`,
    change: '+2.3%',
    trend: 'up',
    icon: AwardIcon,
    color: 'purple'
  },
  {
    title: '오늘 수업',
    value: stats.value.classesToday.toString(),
    change: '2 대기중',
    trend: 'up',
    icon: CalendarIcon,
    color: 'orange'
  }
])

// Quick actions
const quickActions = ref([
  {
    title: '시험지 생성',
    description: '새로운 시험지를 만들고 관리하세요',
    icon: BookOpenIcon,
    action: 'create-exam'
  },
  {
    title: '성적 관리',
    description: '학생 성적을 확인하고 분석하세요',
    icon: BarChart3Icon,
    action: 'manage-grades'
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

// Recent activities
const recentActivities = ref([
  {
    id: '1',
    type: 'grade',
    title: '수학 퀴즈 #3 채점 완료',
    description: '32명 완료 - 평균: 89%',
    time: '2시간 전',
    icon: AwardIcon
  },
  {
    id: '2',
    type: 'student',
    title: '새 학생 등록',
    description: '김민지 학생이 물리학 수업에 참여했습니다',
    time: '4시간 전',
    icon: UsersIcon
  },
  {
    id: '3',
    type: 'exam',
    title: '화학 시험 발행',
    description: '기말고사가 다음 주로 예정되었습니다',
    time: '1일 전',
    icon: FileTextIcon
  },
  {
    id: '4',
    type: 'grade',
    title: '생물학 성적 업데이트',
    description: '28명의 실험 보고서 점수 추가',
    time: '2일 전',
    icon: AwardIcon
  }
])

// Upcoming events
const upcomingEvents = ref([
  {
    id: '1',
    title: '물리학 기말고사',
    date: '내일',
    time: '오전 10:00',
    type: 'exam',
    participants: 45
  },
  {
    id: '2',
    title: '학부모 상담',
    date: '금요일',
    time: '오후 2:00',
    type: 'meeting',
    participants: 12
  },
  {
    id: '3',
    title: '과제 마감',
    date: '월요일',
    time: '오후 11:59',
    type: 'deadline',
    participants: 38
  },
  {
    id: '4',
    title: '화학 실험 평가',
    date: '다음주',
    time: '오전 9:00',
    type: 'exam',
    participants: 32
  }
])


// Handle action click
const handleActionClick = (action) => {
  switch(action.action) {
    case 'create-exam':
      openTestWizardPopup()
      break
    case 'manage-grades':
      router.push('/class-report')
      break
    case 'class-management':
      showClassManagementModal.value = true
      break
    case 'invite-students':
      openStudentInviteModal()
      break
  }
}

// 시험지 제작 팝업 열기
const openTestWizardPopup = () => {
  const width = 1200
  const height = 800
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2

  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`

  // 새 창으로 시험지 제작 마법사 열기
  window.open('/test-wizard', 'TestWizardPopup', features)
}

// 학생 초대 모달 열기
const openStudentInviteModal = async () => {
  // 이미 currentClassId가 있으면 바로 모달 열기
  if (currentClassId.value) {
    showInviteModal.value = true
    return
  }
  
  try {
    // 현재 학급 정보 가져오기
    const response = await authService.getClassInfo()
    if (response && response.classId) {
      currentClassId.value = response.classId
      showInviteModal.value = true
    } else {
      // 학급이 없는 경우 학급 생성 모달 표시
      showCreateClassModal.value = true
    }
  } catch (error) {
    console.error('Failed to open invite modal:', error)
    // 404 에러는 학급이 없는 경우
    if (error.response?.status === 404) {
      showCreateClassModal.value = true
    } else {
      alert('학급 정보를 불러오는데 실패했습니다.')
    }
  }
}

// 학생 초대 완료 핸들러
const handleStudentsInvited = () => {
  // 학생 수 업데이트 등의 처리
  loadStatistics()
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

// 통계 데이터 로드
const loadStatistics = async () => {
  try {
    // 내 시험지 목록 조회
    const myExamsResponse = await examApi.get('/my', {
      params: { page: 0, size: 100 }
    })

    if (myExamsResponse.data.success) {
      stats.value.createdExams = myExamsResponse.data.data.totalElements || 0

      // 총 문항 수 계산
      const exams = myExamsResponse.data.data.content || []
      stats.value.totalQuestions = exams.reduce((total, exam) => {
        return total + (exam.totalItems || 0)
      }, 0)
    }

    // 필터 옵션에서 추가 통계 가져오기
    const filterResponse = await examApi.get('/filters')
    if (filterResponse.data.success) {
      // 필터 데이터에서 추가 통계 활용 가능
      const filterData = filterResponse.data.data
      // 예: 과목별 문제 수 등
    }
  } catch (error) {
    console.error('통계 데이터 로드 실패:', error)
  }
}

// WebSocket composable 관련 변수
let wsComposable = null
const onlineStudents = ref(0)

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
            null, // scrollToBottom 함수 (채팅이 없으므로 null)
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
            }
          })
          
          // 연결 후 온라인 상태 조회
          setTimeout(() => {
            wsComposable.refreshOnlineStatus()
          }, 1000)
          
          // onlineStudents 값 동기화를 위한 watch
          watch(() => wsComposable.onlineStudents.value, (newVal) => {
            onlineStudents.value = newVal
          })
          
          // 통계 데이터 로드
          await loadStatistics()
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

  // 통계 데이터 로드
  await loadStatistics()
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
  background: #2563eb !important;
  padding: 2rem 0 !important;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
  border-bottom: none !important;
}

.teacher-dashboard .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.teacher-dashboard .page-title {
  font-size: 2rem !important;
  font-weight: 700 !important;
  color: white !important;
  margin: 0 !important;
  margin-bottom: 0.5rem !important;
}

.teacher-dashboard .page-subtitle {
  font-size: 1.1rem !important;
  color: rgba(255, 255, 255, 0.9) !important;
  margin: 0 !important;
}

.teacher-dashboard .header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.teacher-dashboard .notification-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.teacher-dashboard .notification-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.teacher-dashboard .notification-btn svg {
  width: 24px;
  height: 24px;
  fill: white;
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
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: white;
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
