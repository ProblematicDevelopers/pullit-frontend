<template>
  <div class="my-class-dashboard">
    <!-- Exam Status Banner -->
    <ExamStatusBanner
      ref="examStatusBanner"
      :class-id="classInfo.classId"
    />

    <!-- Page Header -->
    <div class="page-header" :style="{ marginTop: hasActiveExam ? '80px' : '0' }">
      <div class="container">
        <div class="header-content">
          <div>
            <h1 class="page-title">우리반</h1>
            <p class="page-subtitle">{{ classInfo.className }} </p>
          </div>
          <div class="header-actions">
<!--            <button class="notification-btn">-->
<!--              <svg viewBox="0 0 24 24" fill="currentColor">-->
<!--                <path d="M10 21H14C14 22.1 13.1 23 12 23S10 22.1 10 21M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29V4C10 2.9 10.9 2 12 2S14 2.9 14 4V4.29C16.97 5.17 19 7.9 19 11V17L21 19Z"/>-->
<!--              </svg>-->
<!--              <span class="notification-badge">{{ unreadNotifications || 0 }}</span>-->
<!--            </button>-->
<!--            <div class="user-avatar">-->
<!--              <span>{{ currentUserName }}</span>-->
<!--            </div>-->
          </div>
        </div>
      </div>
    </div>

    <!-- Online Status Section -->
    <section class="online-status">
      <div class="container">
        <div class="online-status-card">
          <div class="online-icon">
            <span class="pulse-dot"></span>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25Z"/>
            </svg>
          </div>
          <div class="online-info">
            <h3 class="online-title">현재 접속중인 친구들</h3>
            <p class="online-count">{{ onlineStudents }}명 / {{ classInfo.totalStudents }}명</p>
          </div>
          <button class="view-class-btn" @click="scrollToClassmates">
            친구 목록 보기
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
          <div class="action-card" @click="$router.push('/student/cbt/step01')">
            <div class="action-icon exam">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3M19 5V19H5V5H19M13.5 13.5H16.5V16.5H13.5V13.5M7.5 7.5H10.5V10.5H7.5V7.5"/>
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title">시험 응시</h3>
              <p class="action-description">내가 골라서 시험 보기</p>
            </div>
            <svg viewBox="0 0 24 24" fill="currentColor" class="arrow-icon">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
            </svg>
          </div>

          <div class="action-card" @click="$router.push('/student/scores')">
            <div class="action-icon score">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 11H7V13H9V11M13 11H11V13H13V11M17 11H15V13H17V11M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4M19 20H5V9H19V20Z"/>
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title">성적 확인</h3>
              <p class="action-description">시험 결과 보기</p>
            </div>
            <svg viewBox="0 0 24 24" fill="currentColor" class="arrow-icon">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
            </svg>
          </div>

          <div class="action-card" @click="$router.push('/student/report')">
            <div class="action-icon report">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 11H14.82C14.4 9.84 13.3 9 12 9S9.6 9.84 9.18 11H2V13H9.18C9.6 14.16 10.7 15 12 15S14.4 14.16 14.82 13H22V11M12 6C12 4.89 11.1 4 10 4S8 4.89 8 6 8.9 8 10 8 12 7.1 12 6M16 17C16 18.11 16.9 19 18 19S20 18.11 20 17 19.1 15 18 15 16 15.89 16 17Z"/>
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title">학습 리포트</h3>
              <p class="action-description">상세 분석 보기</p>
            </div>
            <svg viewBox="0 0 24 24" fill="currentColor" class="arrow-icon">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
            </svg>
          </div>

          <div class="action-card" @click="scrollToExamSchedule">
            <div class="action-icon schedule">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3M19 5V19H5V5H19M12 12H17V17H12V12Z"/>
              </svg>
            </div>
            <div class="action-content">
              <h3 class="action-title">시험 일정</h3>
              <p class="action-description">예정된 시험 확인</p>
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
          <!-- Recent Activities / Chat -->
          <div class="content-main">
            <div class="content-card">
              <div class="card-header">
                <h3 class="card-title">반 채팅방</h3>
                <span class="badge">{{ chatMessages.length }}개 메시지</span>
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

            <!-- Live Exams from Teacher -->
            <div ref="examScheduleRef" class="content-card">
              <div class="card-header">
                <h3 class="card-title">🔴 실시간 시험</h3>
                <span class="badge">선생님이 만든 시험</span>
              </div>
              <div class="exam-list">
                <div v-if="liveExams.length === 0" class="empty-state">
                  <p>현재 실시간 시험이 없습니다.</p>
                </div>
                <router-link
                  v-for="exam in liveExams"
                  :key="`live-${exam.id}`"
                  :to="'/student/cbt/exam/' + (exam.examId || exam.id)"
                  class="exam-item live-exam"
                  :class="{ 'is-active': exam.examStatus === 'STARTED' }"
                >
                  <div class="exam-status-indicator">
                    <span v-if="exam.examStatus === 'CREATED'" class="status-badge created">예정</span>
                    <span v-else-if="exam.examStatus === 'STARTED'" class="status-badge started">진행중</span>
                    <span v-else-if="exam.examStatus === 'ENDED'" class="status-badge ended">종료</span>
                  </div>
                  <div class="exam-info">
                    <div class="exam-name">{{ exam.examName }}</div>
                    <div class="exam-meta">
                      <span>{{ exam.areaName }}</span>
                      <span class="dot">·</span>
                      <span>{{ exam.timeLimit }}분</span>
                    </div>
                  </div>
                  <span class="exam-badge" :class="'type-' + (exam.examType || 'CBT').toLowerCase()">
                    {{ exam.examType || 'CBT' }}
                  </span>
                </router-link>
              </div>
            </div>

            <!-- Student CBT Exams -->
            <div class="content-card">
              <div class="card-header">
                <h3 class="card-title">📝 내 CBT 시험</h3>
                <span class="badge">내가 만든 시험</span>
              </div>
              <div class="exam-list">
                <div v-if="studentCBTs.length === 0" class="empty-state">
                  <p>생성한 CBT 시험이 없습니다.</p>
                </div>
                <router-link
                  v-for="exam in studentCBTs"
                  :key="`cbt-${exam.id}`"
                  :to="'/student/cbt/exam/' + exam.id"
                  class="exam-item student-cbt"
                >
                  <div class="exam-info">
                    <div class="exam-name">{{ exam.examName }}</div>
                    <div class="exam-meta">
                      <span>{{ exam.areaName }}</span>
                      <span class="dot">·</span>
                      <span>{{ exam.timeLimit }}분</span>
                      <span class="dot">·</span>
                      <span>{{ exam.totalQuestions }}문제</span>
                    </div>
                  </div>
                  <span class="exam-badge type-cbt">CBT</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="content-sidebar">
            <!-- Teacher Info -->
            <div class="sidebar-card">
              <div class="sidebar-header">
                <h4 class="sidebar-title">담임 선생님</h4>
              </div>
              <div class="teacher-info">
                <div class="teacher-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 5C13.66 5 15 6.34 15 8S13.66 11 12 11 9 9.66 9 8 10.34 5 12 5M12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9S17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"/>
                  </svg>
                </div>
                <div class="teacher-details">
                  <h5 class="teacher-name">{{ teacherInfo.teacherName }} 선생님</h5>
                  <p class="teacher-subject">{{ teacherInfo.subject }} 담당</p>
                  <div class="teacher-contact">
                    <p>
                      <svg viewBox="0 0 24 24" fill="currentColor" class="contact-icon">
                        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4M20 8L12 13L4 8V6L12 11L20 6V8Z"/>
                      </svg>
                      {{ teacherInfo.email || 'teacher@school.ac.kr' }}
                    </p>
                    <p>
                      <svg viewBox="0 0 24 24" fill="currentColor" class="contact-icon">
                        <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"/>
                      </svg>
                      {{ teacherInfo.phoneNumber || '02-1234-5678' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Class Stats -->
            <div class="sidebar-card">
              <div class="sidebar-header">
                <h4 class="sidebar-title">학급 현황</h4>
              </div>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="stat-label">전체 학생</span>
                  <span class="stat-value">{{ classInfo.totalStudents }}명</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">평균 점수</span>
                  <span class="stat-value">{{ classInfo.averageScore || '85' }}점</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">이번 달 시험</span>
                  <span class="stat-value">{{ classInfo.totalExams || '3' }}개</span>
                </div>
              </div>
            </div>

            <!-- Classmates -->
            <div ref="classmatesRef" class="sidebar-card">
              <div class="sidebar-header">
                <h4 class="sidebar-title">우리반 친구들</h4>
                <span class="badge">{{ classmates.length }}명</span>
              </div>
              <div class="classmates-list">
                <div
                  v-for="classmate in classmates"
                  :key="classmate.studentId"
                  class="classmate-item"
                  :class="{ 'is-me': classmate.studentId === currentUserId }"
                >
                  <span class="student-number">{{ classmate.studentNumber }}</span>
                  <span class="student-name">{{ classmate.studentName }}</span>
                  <span v-if="classmate.status === 'ONLINE'" class="online-dot"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import classApi from '@/services/classApi'
import studentApi from '@/services/studentApi'
import teacherLiveExamAPI from '@/services/teacherLiveExamApi'
import { useClassWebSocket } from './composables/useClassWebSocket'
import ExamStatusBanner from '@/components/student/ExamStatusBanner.vue'

// 반 정보
const classInfo = ref({})

// 담임 선생님 정보
const teacherInfo = ref({})

// 시험 상태 관련
const hasActiveExam = ref(false)
const examStatusBanner = ref(null)

// 반 친구들 목록
const classmates = ref([])

// 시험 일정
const examSchedule = ref([])

// 실시간 시험 목록 (선생님이 만든 시험)
const liveExams = ref([])

// 학생 개인 CBT 목록
const studentCBTs = ref([])

// 알림 개수
const unreadNotifications = ref(0)

// 현재 사용자 정보 (실제로는 로그인 정보에서 가져옴)
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')))
const currentUserId = ref(userInfo.value.id)
const currentUserName = ref(userInfo.value.fullName)
const currentUserRole = ref(userInfo.value.role)
// 채팅 입력
const newMessage = ref('')
const channelName = ref('')

// refs
const chatContainerRef = ref(null)
const classmatesRef = ref(null)
const examScheduleRef = ref(null)

// 스크롤 함수들
const scrollToClassmates = () => {
  classmatesRef.value?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToExamSchedule = () => {
  examScheduleRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// 스크롤을 최하단으로 이동시키는 함수
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// 메시지 전송 함수
const sendMessage = () => {
  if (sendChatMessage && sendChatMessage(newMessage.value)) {
    newMessage.value = ''
    scrollToBottom()
  }
}

// 시간 포맷팅 함수
const formatTime = (timestamp) => {
  const messageDate = new Date(timestamp)
  const now = new Date()
  const diff = now - messageDate
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  return messageDate.toLocaleDateString()
}

// 날짜 포맷팅 함수
const formatExamDate = (dateString) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()

  return {
    month: `${month}월`,
    day: day.toString(),
  }
}

// 데이터 로드
const loadClassData = async () => {
  try {
    const response = await classApi.getMyClass()
    const res = response.data.data
    classInfo.value.classId = res.classId
    classInfo.value.className = res.className
    classInfo.value.totalStudents = res.totalStudents
    classInfo.value.grade = res.grade
    classInfo.value.classNumber = res.classNumber
    teacherInfo.value = res.teacher
    classmates.value = res.students
    channelName.value = 'class-' + res.classId
  } catch (error) {
    console.error('반 정보 로드 실패:', error)
  }
}

const loadExamSchedule = async () => {
  try {
    const response = await classApi.getExamSchedule(classInfo.value.classId)
    examSchedule.value = response.data.data
  } catch (error) {
    console.error('시험 일정 로드 실패:', error)
  }
}

// 시험 데이터 로드 (학생 CBT와 선생님 실시간 시험 분리)
const loadExams = async () => {
  try {
    // 선생님이 생성한 실시간 시험 로드 (TeacherLiveExam 또는 CBT 생성본)
    if (classInfo.value?.classId) {
      const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const isTeacher = user?.role === 'TEACHER'
      // 1) 우선 TeacherLiveExam 목록 시도
      if (isTeacher) {
        try {
          const liveResponse = await teacherLiveExamAPI.getClassLiveExams(classInfo.value.classId)
          if (liveResponse.success && Array.isArray(liveResponse.data)) {
            liveExams.value = liveResponse.data
          }
        } catch (e) {
          console.warn('TeacherLiveExam 목록 조회 실패:', e)
        }
      }

      // 2) 비어있으면 클래스의 CBT 시험을 기본으로 노출 (생성 이벤트 수신 전 초기 표시용)
      if (!liveExams.value.length) {
        try {
          const classExamsRes = await classApi.getClassExams(classInfo.value.classId)
          const classExams = classExamsRes?.data?.data || []
          liveExams.value = classExams
            .filter(exam => (exam.examType || 'CBT') === 'CBT')
            .map(exam => ({
              id:               exam.id,
              examName:         exam.examName,
              areaName:         exam.areaName,
              timeLimit:        exam.timeLimit,
              totalItems:       exam.totalItems,
              examType:         exam.examType || 'CBT',
              examStatus:       'CREATED',
            }))
        } catch (e) {
          console.warn('클래스 CBT 시험 초기 로드 실패:', e)
        }
      }
    }
  } catch (error) {
    console.error('시험 목록 로드 실패:', error)
  }
}

onMounted(async () => {
  await loadClassData()
  await loadExamSchedule()
  await loadExams()

  // 웹소켓 연결
  if (connectWebSocket) {
    await connectWebSocket({
      onOnlineStatus: (status) => {
        updateClassmatesStatus(classmates.value, status)
      },
      onExamStatus: (data) => {
        console.log('Received exam status from WebSocket:', data)

        // 새로운 구조로 처리
        if (data.eventType) {
          hasActiveExam.value = true

          if (examStatusBanner.value) {
            examStatusBanner.value.onExamStatusUpdate(data)
          }

          // 시험 목록 업데이트
          if (data.eventType === 'EXAM_CREATED') {
            // 실시간 시험 목록에 추가
            if (!liveExams.value.find(exam => exam.id === data.id)) {
              liveExams.value.unshift(data)
            }
          } else if (data.eventType === 'EXAM_STARTED') {
            // 시험 상태 업데이트
            const exam = liveExams.value.find(e => e.id === data.id)
            if (exam) {
              exam.examStatus = 'STARTED'
            }
          } else if (data.eventType === 'EXAM_ENDED') {
            // 시험 상태 업데이트
            const exam = liveExams.value.find(e => e.id === data.id)
            if (exam) {
              exam.examStatus = 'ENDED'
            }
            setTimeout(() => {
              hasActiveExam.value = false
            }, 5000)
          }
        }
      }
    })

    setTimeout(() => {
      refreshOnlineStatus()
    }, 1000)

    scrollToBottom()
  }
})

onUnmounted(() => {
  if (disconnectWebSocket) {
    disconnectWebSocket()
  }
})

// 웹소켓 컴포저블 사용
const {
  onlineStudents,
  chatMessages,
  connectWebSocket,
  disconnectWebSocket,
  sendChatMessage,
  refreshOnlineStatus,
  updateClassmatesStatus,
} = useClassWebSocket(
  currentUserId.value,
  currentUserName.value,
  currentUserRole.value,
  scrollToBottom,
  channelName,
)
</script>

<style scoped>
/* 선생님 대시보드와 동일한 스타일 */
.my-class-dashboard {
  background: #f8fafc;
  min-height: 100vh;
  padding-bottom: 2rem;
}

/* Page Header */
.page-header {
  background: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border-bottom: 1px solid #e5e7eb;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.notification-btn {
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-btn:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.notification-btn svg {
  width: 24px;
  height: 24px;
  color: #475569;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
}

.user-avatar {
  background: #f8fafc;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  color: #1e293b;
  font-weight: 600;
  border: 2px solid #e2e8f0;
}

/* Online Status Section */
.online-status {
  margin-bottom: 2rem;
}

.online-status-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.online-status-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.online-icon {
  position: relative;
  background: #eff6ff;
  width: 56px;
  height: 56px;
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
  width: 12px;
  height: 12px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
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
  color: #64748b;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.online-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.view-class-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: white;
  border: 1px solid #2563eb;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
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
  width: 20px;
  height: 20px;
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 2rem;
}

.section-title {
  color: #1e293b;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  border: 1px solid #e2e8f0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  flex-shrink: 0;
}

.action-icon.exam {
  background: #eff6ff;
}

.action-icon.score {
  background: #eff6ff;
}

.action-icon.report {
  background: #eff6ff;
}

.action-icon.schedule {
  background: #eff6ff;
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

/* Main Content Grid */
.main-content {
  padding-bottom: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
}

.content-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.card-header {
  padding: 1.75rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.view-all-btn {
  background: transparent;
  border: none;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.view-all-btn:hover {
  background: #f3f4f6;
}

/* Chat Styles */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f9fafb;
}

.chat-message {
  margin-bottom: 1rem;
}

.chat-message.is-mine {
  text-align: right;
}

.chat-message.is-system {
  text-align: center;
}

.system-message {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
}

.message-bubble {
  display: inline-block;
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: white;
  text-align: left;
}

.is-mine .message-bubble {
  background: #2563eb;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.sender-name {
  font-weight: 600;
  color: #2563eb;
}

.is-mine .sender-name {
  color: rgba(255, 255, 255, 0.9);
}

.message-time {
  color: #9ca3af;
}

.is-mine .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-content {
  word-wrap: break-word;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input input:focus {
  border-color: #2563eb;
}

.chat-input button {
  padding: 0.75rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.chat-input button:hover:not(:disabled) {
  transform: scale(1.05);
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-input button svg {
  width: 20px;
  height: 20px;
}

/* Exam List */
.exam-list {
  padding: 0.5rem 0;
}

.exam-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
}

.exam-item:hover {
  background: #f9fafb;
}

/* Live Exam Styles */
.exam-item.live-exam {
  border-left: 3px solid transparent;
}

.exam-item.live-exam.is-active {
  background: linear-gradient(to right, rgba(255, 59, 48, 0.05), transparent);
  border-left-color: #ff3b30;
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0%, 100% { border-left-width: 3px; }
  50% { border-left-width: 5px; }
}

/* Status Indicator */
.exam-status-indicator {
  min-width: 70px;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.created {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.status-badge.started {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  animation: pulse 2s infinite;
}

.status-badge.ended {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Student CBT Styles */
.exam-item.student-cbt {
  border-left: 3px solid #e5e7eb;
}

.exam-item.student-cbt:hover {
  border-left-color: #6b7280;
}

.exam-date {
  text-align: center;
  min-width: 50px;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2563eb;
  line-height: 1;
}

.date-month {
  font-size: 0.75rem;
  color: #6b7280;
}

.exam-info {
  flex: 1;
}

.exam-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.exam-meta {
  font-size: 0.875rem;
  color: #6b7280;
}

.dot {
  margin: 0 0.25rem;
}

.exam-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.exam-badge.type-cbt {
  background: #dbeafe;
  color: #1e40af;
}

.exam-badge.type-실시간 {
  background: #fce7f3;
  color: #be185d;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
}

/* Sidebar */
.sidebar-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.sidebar-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* Teacher Info */
.teacher-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.teacher-avatar {
  width: 64px;
  height: 64px;
  background: #2563eb;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.teacher-avatar svg {
  width: 32px;
  height: 32px;
  color: white;
}

.teacher-name {
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.teacher-subject {
  display: inline-block;
  background: #2563eb;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.teacher-contact {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.teacher-contact p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  color: #64748b;
  font-size: 0.875rem;
}

.contact-icon {
  width: 16px;
  height: 16px;
  fill: #94a3b8;
  flex-shrink: 0;
}

/* Stats List */
.stats-list {
  padding: 1rem 1.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 600;
  color: #111827;
}

/* Classmates List */
.classmates-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.classmate-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  transition: background 0.2s ease;
}

.classmate-item:hover {
  background: #f9fafb;
}

.classmate-item.is-me {
  background: rgba(37, 99, 235, 0.1);
}

.student-number {
  width: 28px;
  height: 28px;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

.student-name {
  flex: 1;
  color: #111827;
  font-size: 0.875rem;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f3f4f6;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .content-sidebar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .online-status-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
