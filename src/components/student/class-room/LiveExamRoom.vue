<template>
  <div class="live-exam-container">
    <div class="container-fluid py-4">
      <!-- 헤더 -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="text-center mb-3">시험 대기실</h2>
          <div class="alert" :class="examStatusClass" role="alert">
            {{ examStatusText }}
          </div>
        </div>
      </div>

      <!-- 시험 정보 표시 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-info-circle me-2"></i>
                시험 정보
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 이름:</strong>
                    <span class="ms-2">{{ examInfo.examName || '로딩 중...' }}</span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 유형:</strong>
                    <span class="ms-2">
                      {{ examInfo.examType || '-' }} ( {{ examInfo.totalItem || '-' }} 문제 )
                    </span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 시간:</strong>
                    <span class="ms-2">{{ examInfo.timeLimit || '-' }}분</span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">과목:</strong>
                    <span class="ms-2">{{ examInfo.areaName || '-' }}</span>
                  </div>
                </div>
                <div class="col-12">
                  <div class="d-flex justify-content-center">
                    <button
                      class="btn btn-primary btn-lg"
                      @click="startExam"
                      :disabled="!canStartExam"
                      style="width: 100%"
                    >
                      <i class="bi bi-play-circle me-2"></i>
                      {{ canStartExam ? '시험 응시하기' : '시험 시작 대기 중...' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 담임 선생님 정보 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-person-badge me-2"></i>
                담당 선생님
                <span v-if="isTeacherOnline" class="badge bg-success ms-2">🟢 접속중</span>
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">이름:</strong>
                    <span class="ms-2"> {{ teacherInfo.teacherName || '-' }} 선생님 </span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">담당 과목:</strong>
                    <span class="ms-2">{{ teacherInfo.subject || '-' }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">이메일:</strong>
                    <span class="ms-2">{{ teacherInfo.email || '-' }}</span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">연락처:</strong>
                    <span class="ms-2">{{ teacherInfo.phoneNumber || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 실시간 참가자 정보 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-people me-2"></i>
                실시간 참가자
              </h5>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush" style="max-height: 300px; overflow-y: auto">
                <div
                  class="list-group-item list-group-item-action d-flex align-items-center"
                  v-for="participant in onlineParticipants"
                  :key="participant.userId"
                >
                  <div class="d-flex align-items-center flex-grow-1">
                    <span
                      class="bg-primary text-white p-2 rounded-pill me-3"
                      style="
                        width: 35px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      "
                    >
                      {{ participant.userName ? participant.userName.charAt(0) : '?' }}
                    </span>
                    <div class="flex-grow-1">
                      <div class="fw-semibold d-flex align-items-center justify-content-between">
                        <span class="me-2">{{ participant.userName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 실시간 채팅 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-chat-dots me-2"></i>
                실시간 채팅
              </h5>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassWebSocket } from './composables/useClassWebSocket'
import classApi from '@/services/classApi'

const route = useRoute()
const router = useRouter()

// 시험 정보
const examInfo = ref({})
const teacherInfo = ref({})

// 현재 사용자 정보
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')))
const currentUserId = ref(userInfo.value.id)
const currentUserName = ref(userInfo.value.fullName)
const currentUserRole = ref(userInfo.value.role)

// 채팅 관련
const newMessage = ref('')
const chatContainerRef = ref(null)
const channelName = ref('')

// 온라인 참가자 목록
const onlineParticipants = ref([])

// 선생님 온라인 상태
const isTeacherOnline = ref(false)

// 시험 상태 관리
const examStarted = ref(false)

// 시험 상태 텍스트와 클래스
const examStatusText = computed(() => {
  if (!examStarted.value) return '시험이 시작될 때까지 잠시 기다려주세요.'
  return '시험이 진행 중입니다.'
})

const examStatusClass = computed(() => {
  if (!examStarted.value) return 'alert-info'
  return 'alert-success'
})

const canStartExam = computed(() => {
  return examStarted.value
})

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

// 시험 시작 함수
const startExam = () => {
  if (canStartExam.value) {
    // 전체화면 팝업 창 설정
    const popupFeatures = [
      'width=' + screen.width,
      'height=' + screen.height,
      'left=0',
      'top=0',
      'scrollbars=yes',
      'resizable=yes',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
      'directories=no',
      'fullscreen=yes',
    ].join(',')

    // 전체화면 팝업 창으로 시험 페이지 열기
    const examUrl = `/student/class-room/live-exam/${route.params.examId}?classId=${route.query.classId}`
    const popupWindow = window.open(examUrl, 'live_exam', popupFeatures)

    // 팝업 창이 차단되었는지 확인
    if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
      alert(
        '팝업이 차단되었습니다.\n\n팝업 차단을 해제하는 방법:\n1. 브라우저 주소창 옆의 팝업 차단 아이콘 클릭\n2. "팝업 허용" 선택\n3. 다시 시도해주세요.',
      )
      return
    }

    // 팝업 창이 열리면 포커스 이동
    popupWindow.focus()
  }
}

// 시험 상태 메시지 처리
const handleExamStatusMessage = (message) => {
  if (message.messageType === 'NOTICE') {
    const content = message.content.toLowerCase()

    if (content.includes('시험이 시작되었습니다')) {
      examStarted.value = true
    } else if (content.includes('시험이 종료되었습니다')) {
      examStarted.value = false
    }
  }
}

// 시험 상태 조회
const checkExamStatus = () => {
  if (getExamStatus) {
    getExamStatus()
  }
}

// 시험 상태 응답 처리
const handleExamStatusResponse = (examStatus) => {
  console.log('🔍 시험 상태 응답 처리:', examStatus)

  if (examStatus && examStatus.content) {
    if (examStatus.content === 'STARTED') {
      examStarted.value = true
    } else if (examStatus.content === 'WAITING') {
      examStarted.value = false
    } else if (examStatus.content === 'ENDED') {
      examStarted.value = false
    }
  }
}

// 시험 정보 로드
const loadExamInfo = async (examId, classId) => {
  try {
    const response = await classApi.getExam(examId, classId)
    const res = response.data.data
    console.log('🔍 시험 정보:', res)
    // TODO: 실제 API 호출로 시험 정보 가져오기
    examInfo.value = {
      examName: res.examName,
      examType: '실시간',
      timeLimit: res.timeLimit,
      areaName: res.areaName,
      totalItem: res.totalItems,
    }
    teacherInfo.value = {
      teacherName: res.createdBy.fullName,
      subject: res.areaName,
      email: res.createdBy.email,
      phoneNumber: res.createdBy.phone,
    }
  } catch (error) {
    console.error('시험 정보 로드 실패:', error)
    alert('접근 권한이 없습니다.')
    router.push('/student/main')
  }
}

const loadTeacherInfo = async () => {
  try {
    await classApi.getMyClass()
  } catch (error) {
    console.error('클래스 정보 로드 실패:', error)
    alert('접근 권한이 없습니다.')
    router.push('/student/main')
  }
}

// 온라인 참가자 상태 업데이트
const updateParticipantsStatus = (participants, status) => {
  // 전체 온라인 사용자 목록이 있는 경우
  if (status.onlineUsers && Array.isArray(status.onlineUsers)) {
    // 기존 참가자 목록을 완전히 교체 (온라인 사용자만 유지)
    participants.length = 0 // 배열 초기화
    isTeacherOnline.value = false // 선생님 온라인 상태 초기화

    // 온라인 사용자들만 추가
    status.onlineUsers.forEach((onlineUser) => {
      if (onlineUser.status === 'ONLINE') {
        // 선생님인 경우 별도로 관리
        if (onlineUser.userRole === 'TEACHER') {
          isTeacherOnline.value = true
        } else {
          // 학생만 참가자 목록에 추가
          participants.push({
            userId: onlineUser.userId,
            userName: onlineUser.userName,
            userRole: onlineUser.userRole,
            status: 'ONLINE',
          })
        }
      }
    })
  } else if (status.userId && status.status) {
    // 개별 사용자 상태 업데이트
    if (status.status === 'ONLINE') {
      // 선생님인 경우 별도로 관리
      if (status.userRole === 'TEACHER') {
        isTeacherOnline.value = true
      } else {
        // 학생만 참가자 목록에 추가
        const existingParticipant = participants.find((p) => p.userId == status.userId)
        if (!existingParticipant) {
          participants.push({
            userId: status.userId,
            userName: status.userName || '알 수 없음',
            userRole: status.userRole || 'STUDENT',
            status: 'ONLINE',
          })
        }
      }
    } else if (status.status === 'OFFLINE') {
      // 선생님인 경우 별도로 관리
      if (status.userRole === 'TEACHER') {
        isTeacherOnline.value = false
      } else {
        // 학생만 참가자 목록에서 제거
        const index = participants.findIndex((p) => p.userId == status.userId)
        if (index !== -1) {
          participants.splice(index, 1)
        }
      }
    }
  }
}

onMounted(async () => {
  // 라우터에서 examId와 classId 가져오기
  const examId = route.params.examId
  const classId = route.query.classId

  if (!examId || !classId) {
    console.error('examId 또는 classId가 없습니다.')
    return
  }

  // 채널명 설정
  channelName.value = `live_exam_${examId}_${classId}`

  await loadTeacherInfo()
  await loadExamInfo(examId, classId)

  // 웹소켓 연결
  if (connectWebSocket) {
    await connectWebSocket({
      onChatMessage: (message) => {
        // 시험 상태 메시지 처리
        handleExamStatusMessage(message)
      },
      onOnlineStatus: (status) => {
        // 참가자 목록 업데이트
        updateParticipantsStatus(onlineParticipants.value, status)
      },
      onExamStatus: (examStatus) => {
        // 시험 상태 응답 처리
        console.log('examStatus', examStatus)
        handleExamStatusResponse(examStatus)
      },
    })

    checkExamStatus()

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
const { chatMessages, connectWebSocket, disconnectWebSocket, sendChatMessage, getExamStatus } =
  useClassWebSocket(
    currentUserId.value,
    currentUserName.value,
    currentUserRole.value,
    scrollToBottom,
    channelName,
  )
</script>

<style scoped>
.live-exam-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.info-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
}

.online-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dc3545;
  transition: background-color 0.3s;
}

.online-indicator.active {
  background: #28a745;
}

.chat-messages {
  background: #f8f9fa;
}

.message {
  margin-bottom: 8px;
}

.alert {
  border-left: 4px solid #0dcaf0;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
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
