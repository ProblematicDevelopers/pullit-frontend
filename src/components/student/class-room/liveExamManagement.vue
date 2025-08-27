<template>
  <div class="live-exam-container">
    <div class="container-fluid py-4">
      <!-- 헤더 -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="text-center mb-3">시험 관리실</h2>
          <div class="alert alert-warning" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            선생님 전용 페이지입니다. 시험을 시작하면 학생들이 응시할 수 있습니다.
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 시험 관리 버튼 -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-gear me-2"></i>
                시험 관리
              </h5>
            </div>
            <div class="card-body text-center">
              <div class="row">
                <div class="col-md-4">
                  <button
                    class="btn btn-success btn-lg w-100 mb-3"
                    @click="startExam"
                    :disabled="examStarted"
                  >
                    <i class="bi bi-play-circle me-2"></i>
                    {{ examStarted ? '시험 진행 중' : '시험 시작하기' }}
                  </button>
                </div>
                <div class="col-md-4">
                  <button
                    class="btn btn-warning btn-lg w-100 mb-3"
                    @click="pauseExam"
                    :disabled="!examStarted || examPaused"
                  >
                    <i class="bi bi-pause-circle me-2"></i>
                    {{ examPaused ? '일시정지됨' : '일시정지' }}
                  </button>
                </div>
                <div class="col-md-4">
                  <button
                    class="btn btn-danger btn-lg w-100 mb-3"
                    @click="endExam"
                    :disabled="!examStarted"
                  >
                    <i class="bi bi-stop-circle me-2"></i>
                    시험 종료
                  </button>
                </div>
              </div>
              <div class="row mt-3">
                <div class="col-12">
                  <div class="alert" :class="examStatusClass" role="alert">
                    <strong>시험 상태:</strong> {{ examStatusText }}
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
                실시간 참가자 ({{ onlineStudents }}명)
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
                        <span v-if="participant.status === 'ONLINE'" class="badge bg-success"
                          >🟢</span
                        >
                      </div>
                      <small class="text-muted">{{ participant.userRole }}</small>
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
                실시간 채팅 ({{ chatMessages.length }}개 메시지)
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

// 현재 사용자 정보
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')))
const currentUserId = ref(userInfo.value.id)
const currentUserName = ref(userInfo.value.fullName)
const currentUserRole = ref(userInfo.value.role)

// 시험 상태 관리
const examStarted = ref(false)
const examPaused = ref(false)

// 시험 상태 텍스트와 클래스
const examStatusText = computed(() => {
  if (!examStarted.value) return '대기 중'
  if (examPaused.value) return '일시정지'
  return '진행 중'
})

const examStatusClass = computed(() => {
  if (!examStarted.value) return 'alert-info'
  if (examPaused.value) return 'alert-warning'
  return 'alert-success'
})

// 채팅 관련
const newMessage = ref('')
const chatContainerRef = ref(null)
const channelName = ref('')

// 온라인 참가자 목록
const onlineParticipants = ref([])

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

// 시험 정보 로드
const loadExamInfo = async (examId, classId) => {
  try {
    const response = await classApi.getExam(examId, classId)
    const res = response.data.data
    examInfo.value = {
      examName: res.examName,
      examType: '실시간',
      timeLimit: res.timeLimit,
      areaName: res.areaName,
      totalItem: res.totalItems,
    }
  } catch (error) {
    console.error('시험 정보 로드 실패:', error)
    alert('접근 권한이 없습니다.')
    router.push('/teacher/main')
  }
}

// 시험 시작
const startExam = () => {
  examStarted.value = true
  examPaused.value = false

  // 시험 시작 메시지 전송
  const startMessage = {
    channelName: channelName.value,
    senderId: currentUserId.value,
    senderName: currentUserName.value,
    senderRole: currentUserRole.value,
    content: '시험이 시작되었습니다. 학생들은 이제 응시할 수 있습니다.',
    messageType: 'NOTICE',
    timestamp: new Date().toISOString(),
  }

  if (sendNoticeMessage) {
    sendNoticeMessage(startMessage.content)
  }

  // 시험 시작 상태를 웹소켓으로 브로드캐스트
  sendExamStatus('STARTED')
}

// 시험 일시정지
const pauseExam = () => {
  examPaused.value = true

  // 일시정지 메시지 전송
  const pauseMessage = {
    channelName: channelName.value,
    senderId: currentUserId.value,
    senderName: currentUserName.value,
    senderRole: currentUserRole.value,
    content: '시험이 일시정지되었습니다.',
    messageType: 'NOTICE',
    timestamp: new Date().toISOString(),
  }

  if (sendNoticeMessage) {
    sendNoticeMessage(pauseMessage.content)
  }

  // 일시정지 상태를 웹소켓으로 브로드캐스트
  sendExamStatus('PAUSED')
}

// 시험 종료
const endExam = () => {
  examStarted.value = false
  examPaused.value = false

  // 시험 종료 메시지 전송
  const endMessage = {
    channelName: channelName.value,
    senderId: currentUserId.value,
    senderName: currentUserName.value,
    senderRole: currentUserRole.value,
    content: '시험이 종료되었습니다.',
    messageType: 'NOTICE',
    timestamp: new Date().toISOString(),
  }

  if (sendNoticeMessage) {
    sendNoticeMessage(endMessage.content)
  }

  // 시험 종료 상태를 웹소켓으로 브로드캐스트
  sendExamStatus('ENDED')
}

// 시험 상태 전송
const sendExamStatus = (status) => {
  // TODO: 웹소켓으로 시험 상태 전송
  console.log('시험 상태 전송:', status)
}

// 온라인 참가자 상태 업데이트
const updateParticipantsStatus = (participants, status) => {
  // 전체 온라인 사용자 목록이 있는 경우
  if (status.onlineUsers && Array.isArray(status.onlineUsers)) {
    // 기존 참가자 목록을 완전히 교체 (온라인 사용자만 유지)
    participants.length = 0 // 배열 초기화

    // 온라인 사용자들만 추가 (선생님 제외)
    status.onlineUsers.forEach((onlineUser) => {
      if (onlineUser.status === 'ONLINE' && onlineUser.userRole !== 'TEACHER') {
        participants.push({
          userId: onlineUser.userId,
          userName: onlineUser.userName,
          userRole: onlineUser.userRole,
          status: 'ONLINE',
        })
      }
    })
  } else if (status.userId && status.status) {
    // 개별 사용자 상태 업데이트
    if (status.status === 'ONLINE' && status.userRole !== 'TEACHER') {
      // 온라인 상태가 되면 참가자 목록에 추가 (선생님 제외)
      const existingParticipant = participants.find((p) => p.userId == status.userId)
      if (!existingParticipant) {
        participants.push({
          userId: status.userId,
          userName: status.userName || '알 수 없음',
          userRole: status.userRole || 'STUDENT',
          status: 'ONLINE',
        })
      }
    } else if (status.status === 'OFFLINE' && status.userRole !== 'TEACHER') {
      // 오프라인 상태가 되면 참가자 목록에서 제거 (선생님 제외)
      const index = participants.findIndex((p) => p.userId == status.userId)
      if (index !== -1) {
        participants.splice(index, 1)
      }
    }
  }
}

onMounted(async () => {
  // 선생님 권한 확인
  if (currentUserRole.value !== 'TEACHER') {
    alert('선생님만 접근할 수 있습니다.')
    router.push('/student/main')
    return
  }

  // 라우터에서 examId와 classId 가져오기
  const examId = route.params.examId
  const classId = route.query.classId

  if (!examId || !classId) {
    console.error('examId 또는 classId가 없습니다.')
    return
  }

  // 채널명 설정 (liveExam.vue와 동일)
  channelName.value = `live_exam_${examId}_${classId}`

  await loadExamInfo(examId, classId)

  // 웹소켓 연결
  if (connectWebSocket) {
    await connectWebSocket({
      onOnlineStatus: (status) => {
        // 참가자 목록 업데이트
        updateParticipantsStatus(onlineParticipants.value, status)
      },
    })

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
  sendNoticeMessage,
} = useClassWebSocket(
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
