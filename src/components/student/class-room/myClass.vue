<template>
  <div class="my-class-dashboard bg-light min-vh-100">
    <!-- Page Header -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">내 반 정보</h1>
        <p class="page-subtitle">
          {{ classInfo.className }} - {{ classInfo.grade }}학년 {{ classInfo.classNumber }}반
        </p>
      </div>
    </div>

    <!-- Class Stats Section -->
    <section class="stats-section mb-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-md-3 col-sm-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body d-flex align-items-center">
                <div class="bg-secondary bg-opacity-10 bg-gradient rounded-3 p-3 me-3">
                  <span class="text-white fs-2">👥</span>
                </div>
                <div>
                  <div class="h3 fw-bold text-dark mb-1">{{ classInfo.totalStudents }}</div>
                  <div class="text-muted small">전체 학생 수</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body d-flex align-items-center">
                <div class="bg-secondary bg-opacity-10 bg-gradient rounded-3 p-3 me-3">
                  <span class="text-white fs-2">📈</span>
                </div>
                <div>
                  <div class="h3 fw-bold text-dark mb-1">{{ classInfo.averageScore }}</div>
                  <div class="text-muted small">반 평균 점수</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body d-flex align-items-center">
                <div class="bg-secondary bg-opacity-10 bg-gradient rounded-3 p-3 me-3">
                  <span class="text-white fs-2">📅</span>
                </div>
                <div>
                  <div class="h3 fw-bold text-dark mb-1">{{ classInfo.totalExams }}</div>
                  <div class="text-muted small">이번 달 시험</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body d-flex align-items-center">
                <div class="bg-secondary bg-opacity-10 bg-gradient rounded-3 p-3 me-3">
                  <span class="text-white fs-2">🟢</span>
                </div>
                <div>
                  <div class="h3 fw-bold text-dark mb-1">{{ onlineStudents }}</div>
                  <div class="text-muted small">명 접속중</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Actions Section -->
    <section class="quick-actions mb-5">
      <div class="container">
        <h2 class="h4 fw-bold text-dark mb-4">빠른 실행</h2>
        <div class="row g-3">
          <div class="col-lg-4 col-md-6">
            <button
              class="btn btn-outline-primary w-100 p-4 text-start h-100"
              @click="$router.push('/student/exams')"
            >
              <div class="d-flex align-items-center">
                <div class="bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                  <span class="text-primary fs-2">📝</span>
                </div>
                <div>
                  <div class="fw-semibold">시험 응시</div>
                  <div class="text-muted small">예정된 시험 보기</div>
                </div>
              </div>
            </button>
          </div>

          <div class="col-lg-4 col-md-6">
            <button
              class="btn btn-outline-success w-100 p-4 text-start h-100"
              @click="$router.push('/student/scores')"
            >
              <div class="d-flex align-items-center">
                <div class="bg-success bg-opacity-10 rounded-3 p-3 me-3">
                  <span class="text-success fs-2">✅</span>
                </div>
                <div>
                  <div class="fw-semibold">성적 확인</div>
                  <div class="text-muted small">시험 결과 보기</div>
                </div>
              </div>
            </button>
          </div>

          <div class="col-lg-4 col-md-6">
            <button
              class="btn btn-outline-info w-100 p-4 text-start h-100"
              @click="$router.push('/student/class-schedule')"
            >
              <div class="d-flex align-items-center">
                <div class="bg-info bg-opacity-10 rounded-3 p-3 me-3">
                  <span class="text-info fs-2">📋</span>
                </div>
                <div>
                  <div class="fw-semibold">시험 일정</div>
                  <div class="text-muted small">예정된 시험 확인</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Section -->
    <section class="main-content mb-5">
      <div class="container">
        <div class="row g-4">
          <!-- Homeroom Teacher Info -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">
                  <span class="me-2">👨‍🏫</span>
                  담임 선생님
                </h5>
              </div>
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div
                    class="rounded-circle bg-secondary bg-opacity-10 p-3 me-3"
                    style="
                      width: 70px;
                      height: 70px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    "
                  >
                    <span class="text-secondary fs-1">👤</span>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-1">{{ teacherInfo.teacherName }} 선생님</h6>
                    <span class="badge bg-primary">{{ teacherInfo.subject }} 담당</span>
                  </div>
                </div>
                <div class="list-group list-group-flush">
                  <div class="list-group-item d-flex align-items-center border-0 px-0">
                    <span class="text-muted me-2">📧</span>
                    <small class="text-muted">{{ teacherInfo.email }}</small>
                  </div>
                  <div class="list-group-item d-flex align-items-center border-0 px-0">
                    <span class="text-muted me-2">📞</span>
                    <small class="text-muted">{{ teacherInfo.phoneNumber }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Classmates List -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                  <span class="me-2">👥</span>
                  반 친구들 ({{ classmates.length }}명)
                </h5>
              </div>
              <div class="card-body p-0">
                <div
                  class="list-group list-group-flush"
                  style="max-height: 400px; overflow-y: auto"
                >
                  <div
                    class="list-group-item list-group-item-action d-flex align-items-center"
                    v-for="classmate in classmates"
                    :key="classmate.studentId"
                    :class="{ active: classmate.studentId === currentUserId }"
                  >
                    <div class="d-flex align-items-center flex-grow-1">
                      <span
                        class="bg-primary text-white p-3 rounded-pill"
                        style="
                          width: 30px;
                          height: 30px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          margin-right: 1rem;
                        "
                      >
                        {{ classmate.studentNumber }}
                      </span>
                      <div class="flex-grow-1">
                        <div class="fw-semibold d-flex align-items-center justify-content-between">
                          <span class="me-2">{{ classmate.studentName }}</span>
                          <span v-if="classmate.status === 'ONLINE'">🟢</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Exam Schedule -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-warning text-dark">
                <h5 class="card-title mb-0">
                  <span class="me-2">📅</span>
                  시험 일정
                </h5>
              </div>
              <div class="card-body p-0">
                <div class="list-group list-group-flush">
                  <div class="list-group-item border-0" v-for="exam in examSchedule" :key="exam.id">
                    <router-link
                      :to="`/student/class-room/live-exam-room/${exam.id}?classId=${classInfo.classId}`"
                    >
                      <div class="d-flex align-items-center">
                        <div class="text-center me-3" style="min-width: 60px">
                          <div class="fw-bold text-primary fs-4">
                            {{ formatExamDate(exam.examDate).day }}
                          </div>
                          <small class="text-muted">{{
                            formatExamDate(exam.examDate).month
                          }}</small>
                        </div>
                        <div class="flex-grow-1">
                          <div class="fw-semibold text-dark">{{ exam.examName }}</div>
                          <div class="text-muted small">{{ exam.areaName }}</div>
                          <div class="text-muted small">{{ exam.timeLimit }} 분</div>
                        </div>
                        <div>
                          <span class="badge bg-danger">{{ exam.examType }}</span>
                        </div>
                      </div>
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Section -->
        <div class="row mt-4">
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-purple text-white">
                <h5 class="card-title mb-0 text-dark">
                  <span class="me-2">💬</span>
                  반 채팅방
                </h5>
                <div class="ms-auto">
                  <span class="badge bg-light text-dark"> {{ chatMessages.length }}개 메시지 </span>
                </div>
              </div>
              <div class="card-body p-0">
                <!-- Chat Messages -->
                <div
                  ref="chatContainerRef"
                  class="chat-messages p-3"
                  style="height: 300px; overflow-y: auto"
                >
                  <div
                    v-for="message in chatMessages"
                    :key="message.id"
                    class="chat-message mb-3"
                    :class="{
                      'text-end':
                        message.senderId === currentUserId &&
                        message.messageType !== 'JOIN' &&
                        message.messageType !== 'LEAVE',
                      'text-center':
                        message.messageType === 'JOIN' || message.messageType === 'LEAVE',
                    }"
                  >
                    <!-- JOIN/LEAVE 메시지 (입장/퇴장 알림) -->
                    <div
                      v-if="message.messageType === 'JOIN' || message.messageType === 'LEAVE'"
                      class="text-center"
                    >
                      <small class="text-muted">{{ message.content }}</small>
                    </div>

                    <!-- 일반 채팅 메시지 -->
                    <div
                      v-else
                      class="d-inline-block p-2 rounded"
                      :class="
                        message.senderId === currentUserId ? 'bg-primary text-white' : 'bg-light'
                      "
                      style="max-width: 70%"
                    >
                      <div class="fw-semibold small mb-1">
                        {{ message.senderName }}
                        <small class="text-muted ms-2">{{ formatTime(message.timestamp) }}</small>
                      </div>
                      <div>{{ message.content }}</div>
                    </div>
                  </div>
                </div>
                <!-- Chat Input -->
                <div class="chat-input p-3 border-top">
                  <div class="input-group">
                    <input
                      v-model="newMessage"
                      type="text"
                      class="form-control"
                      placeholder="메시지를 입력하세요..."
                      @keyup.enter="sendMessage"
                    />
                    <button
                      class="btn btn-primary"
                      @click="sendMessage"
                      :disabled="!newMessage.trim()"
                    >
                      <span>📤</span>
                    </button>
                  </div>
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
import { useClassWebSocket } from './composables/useClassWebSocket'

// 반 정보
const classInfo = ref({})

// 담임 선생님 정보
const teacherInfo = ref({})

// 반 친구들 목록
const classmates = ref([])

// 시험 일정
const examSchedule = ref([])

// 현재 사용자 정보 (실제로는 로그인 정보에서 가져옴)
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')))
const currentUserId = ref(userInfo.value.id)
const currentUserName = ref(userInfo.value.fullName)
const currentUserRole = ref(userInfo.value.role)
// 채팅 입력
const newMessage = ref('')
const channelName = ref('')

// 채팅 컨테이너 ref
const chatContainerRef = ref(null)

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
  // timestamp가 문자열인 경우 Date 객체로 변환
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
  const month = date.getMonth() + 1 // getMonth()는 0부터 시작하므로 +1
  const day = date.getDate()

  return {
    month: `${month}월`,
    day: day.toString(),
  }
}

// 데이터 로드
const loadClassData = async () => {
  try {
    // API 호출로 실제 데이터 가져오기
    const response = await classApi.getMyClass()
    const res = response.data.data
    classInfo.value.classId = res.classId
    classInfo.value.className = res.className
    classInfo.value.totalStudents = res.totalStudents
    teacherInfo.value = res.teacher
    classmates.value = res.students
    channelName.value = 'my_class_' + res.classId
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

onMounted(async () => {
  await loadClassData()
  await loadExamSchedule()

  // 웹소켓 연결 (channelName이 설정된 후)
  if (connectWebSocket) {
    await connectWebSocket({
      onOnlineStatus: (status) => {
        // classmates 목록 업데이트 (UI 표시용)
        updateClassmatesStatus(classmates.value, status)
      },
    })

    // 연결 완료 후 초기 온라인 상태 조회
    setTimeout(() => {
      refreshOnlineStatus()
    }, 1000)

    // 초기 스크롤을 최하단으로 이동
    scrollToBottom()
  }
})

onUnmounted(() => {
  // 페이지 떠날 때 웹소켓 연결 해제
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
/* 페이지 헤더 스타일은 common.css에서 관리 */
/* 학급관리 전용 헤더 여백 */
.page-header {
  margin-bottom: 2rem;
}

/* 커스텀 스타일 추가 */
.card {
  transition: transform 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
}

.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: translateY(-1px);
}

.list-group-item.active {
  background-color: #e3f2fd;
  border-color: #2196f3;
  color: #1976d2;
}

/* 스크롤바 스타일링 */
.list-group-flush::-webkit-scrollbar {
  width: 6px;
}

.list-group-flush::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.list-group-flush::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.list-group-flush::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
