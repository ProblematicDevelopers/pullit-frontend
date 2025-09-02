<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container modal-lg" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          <i class="bi bi-broadcast me-2"></i>
          실시간 시험 관리
        </h2>
        <button @click="close" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- 시험 선택 섹션 -->
        <div v-if="!selectedExam" class="exam-selection">
          <div class="section-header">
            <h3 class="section-title">시험 선택</h3>
            <p class="section-subtitle">실시간으로 관리할 시험을 선택하세요</p>
          </div>
          
          <!-- 시험 유형 선택 -->
          <div class="exam-type-selector">
            <h4 class="selector-title">시험 유형 선택</h4>
            <div class="type-buttons">
              <button 
                class="type-btn"
                :class="{ active: selectedExamType === 'CBT' }"
                @click="selectedExamType = 'CBT'"
              >
                <i class="bi bi-display"></i>
                실시간 CBT
                <span class="type-desc">학생들이 동시에 응시하는 실시간 시험</span>
              </button>
              <button 
                class="type-btn"
                :class="{ active: selectedExamType === 'ASSIGNMENT' }"
                @click="selectedExamType = 'ASSIGNMENT'"
              >
                <i class="bi bi-clipboard-check"></i>
                과제 제출
                <span class="type-desc">기한 내 자유롭게 제출하는 과제</span>
              </button>
            </div>
          </div>
          
          <!-- 시험 목록 -->
          <div class="exam-list">
            <div 
              v-for="exam in availableExams" 
              :key="exam.id"
              class="exam-item"
              @click="selectExam(exam)"
            >
              <div class="exam-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <div class="exam-details">
                <h4 class="exam-name">{{ exam.examName }}</h4>
                <div class="exam-meta">
                  <span class="meta-item" v-if="exam.areaName">
                    <i class="bi bi-book"></i>
                    {{ exam.areaName }}
                  </span>
                  <span class="meta-item">
                    <i class="bi bi-list-ol"></i>
                    {{ exam.totalItems || exam.itemCount || 0 }}문제
                  </span>
                  <span class="meta-item" v-if="exam.totalPoints">
                    <i class="bi bi-trophy"></i>
                    {{ exam.totalPoints }}점
                  </span>
                  <span class="meta-item" v-if="exam.timeLimit">
                    <i class="bi bi-clock"></i>
                    {{ exam.timeLimit }}분
                  </span>
                  <span class="meta-item" v-if="exam.examDate">
                    <i class="bi bi-calendar"></i>
                    {{ formatDate(exam.examDate) }}
                  </span>
                </div>
              </div>
              <div class="exam-arrow">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <div v-if="!availableExams.length" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3>실행 가능한 시험이 없습니다</h3>
            <p>먼저 시험을 출제해주세요</p>
          </div>
        </div>

        <!-- 시험 관리 섹션 -->
        <div v-else class="exam-control">
          <!-- 시험 정보 카드 -->
          <div class="info-card">
            <div class="info-header">
              <h3 class="info-title">
                <i class="bi bi-info-circle me-2"></i>
                시험 정보
              </h3>
              <button @click="selectedExam = null" class="back-btn">
                <i class="bi bi-arrow-left me-1"></i>
                다른 시험 선택
              </button>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">시험명</span>
                <span class="info-value">{{ selectedExam.examName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">과목</span>
                <span class="info-value">{{ selectedExam.areaName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">문제 수</span>
                <span class="info-value">{{ selectedExam.totalItems }}문제</span>
              </div>
              <div class="info-item">
                <span class="info-label">제한 시간</span>
                <span class="info-value">{{ selectedExam.timeLimit }}분</span>
              </div>
            </div>
          </div>

          <!-- 시험 컨트롤 버튼 -->
          <div class="control-section">
            <div class="control-header">
              <h3 class="control-title">
                <i class="bi bi-gear me-2"></i>
                시험 제어
              </h3>
              <div class="exam-status" :class="examStarted ? 'status-active' : 'status-waiting'">
                <span class="status-dot"></span>
                {{ examStarted ? '시험 진행 중' : '대기 중' }}
              </div>
            </div>
            
            <div class="control-buttons">
              <button 
                v-if="selectedExamType === 'CBT'"
                class="control-btn btn-start"
                @click="startExam"
                :disabled="examStarted"
              >
                <i class="bi bi-play-circle me-2"></i>
                {{ examStarted ? '시험 진행 중' : '시험 시작' }}
              </button>
              <button 
                v-if="selectedExamType === 'CBT'"
                class="control-btn btn-stop"
                @click="endExam"
                :disabled="!examStarted"
              >
                <i class="bi bi-stop-circle me-2"></i>
                시험 종료
              </button>
              <div v-if="selectedExamType === 'ASSIGNMENT'" class="assignment-info">
                <i class="bi bi-info-circle"></i>
                <span>과제는 학생들이 자유롭게 제출할 수 있습니다.</span>
              </div>
            </div>
          </div>

          <!-- 실시간 참가자 -->
          <div class="participants-section">
            <div class="participants-header">
              <h3 class="participants-title">
                <i class="bi bi-people me-2"></i>
                실시간 참가자
              </h3>
              <span class="participant-count">
                <span class="count-number">{{ onlineStudents }}</span>명 접속 중
              </span>
            </div>
            
            <div class="participants-list">
              <div 
                v-for="participant in participantsWithProgress" 
                :key="participant.userId"
                class="participant-item"
              >
                <div class="participant-avatar">
                  {{ participant.userName ? participant.userName.charAt(0) : '?' }}
                </div>
                <div class="participant-info">
                  <div class="participant-name">
                    {{ participant.userName }}
                    <span v-if="participant.status === 'ONLINE'" class="online-badge">● 접속중</span>
                  </div>
                  
                  <!-- 진행 상황 -->
                  <div v-if="participant.progress && examStarted" class="progress-info">
                    <div class="progress-stats">
                      <span class="stat-item">
                        <i class="bi bi-pencil"></i>
                        {{ participant.progress.currentQuestion }}번 문제
                      </span>
                      <span class="stat-item">
                        <i class="bi bi-clock"></i>
                        {{ formatRemainingTime(participant.progress.remainingTime) }}
                      </span>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill"
                        :style="{width: `${(participant.progress.answeredQuestions / participant.progress.totalQuestions) * 100}%`}"
                      ></div>
                    </div>
                    <div class="progress-text">
                      {{ participant.progress.answeredQuestions }}/{{ participant.progress.totalQuestions }}문제 완료
                      ({{ Math.round((participant.progress.answeredQuestions / participant.progress.totalQuestions) * 100) }}%)
                    </div>
                  </div>
                  
                  <!-- 대기 상태 -->
                  <div v-else-if="!examStarted" class="waiting-status">
                    <i class="bi bi-hourglass-split"></i>
                    시험 대기 중
                  </div>
                </div>
              </div>

              <!-- 참가자 없음 -->
              <div v-if="!participantsWithProgress.length" class="no-participants">
                <i class="bi bi-person-x"></i>
                <p>아직 접속한 학생이 없습니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useClassWebSocket } from '@/components/student/class-room/composables/useClassWebSocket'
import classApi from '@/services/classApi'
import examApi from '@/services/examApi'
import teacherLiveExamAPI from '@/services/teacherLiveExamApi'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  classId: {
    type: Number,
    required: false
  }
})

// Emits
const emit = defineEmits(['close', 'exam-started', 'exam-ended'])

// State
const selectedExam = ref(null)
const selectedExamType = ref('CBT')  // 기본값 CBT
const availableExams = ref([])
const examStarted = ref(false)
const loading = ref(false)
const isCreatingCbt = ref(false)

// 사용자 정보
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const currentUserId = ref(userInfo.value.id)
const currentUserName = ref(userInfo.value.fullName)
const currentUserRole = ref('TEACHER')

// WebSocket 관련
const channelName = ref('')
const onlineParticipants = ref([])
const studentProgress = ref({})
let wsComposable = null

// 온라인 학생 수
const onlineStudents = computed(() => onlineParticipants.value.length)

// 참가자와 진행상황 결합
const participantsWithProgress = computed(() => {
  return onlineParticipants.value.map(participant => ({
    ...participant,
    progress: studentProgress.value[participant.userId] || null
  }))
})

// 시험 선택: 원본 UserExam을 그대로 사용 (중복 생성 방지)
const selectExam = async (exam) => {
  selectedExam.value = exam
  channelName.value = `live_exam_${exam.id}_${props.classId}`
  // 생성 시점에 TeacherLiveExam을 미리 만들어 '예정'으로 노출 (중복은 서버에서 방지)
  try {
    const createRes = await teacherLiveExamAPI.createLiveExam({
      examName: exam.examName,
      classId: props.classId,
      timeLimit: exam.timeLimit,
      sourceExamId: exam.id,
      randomSelection: false,
    })
    if (createRes.success) {
      liveExamId.value = createRes.data.id
    }
  } catch (e) {
    console.warn('실시간 시험 생성(예정) 실패: ', e)
  }
  await connectToWebSocket()
}

// WebSocket 연결
const connectToWebSocket = async () => {
  if (!wsComposable) {
    wsComposable = useClassWebSocket(
      currentUserId.value,
      currentUserName.value,
      currentUserRole.value,
      null,
      channelName
    )
  }

  await wsComposable.connectWebSocket({
    onOnlineStatus: (status) => {
      updateParticipantsStatus(onlineParticipants.value, status)
    },
    onExamProgress: (examProgress) => {
      if (examProgress.userProgresses) {
        Object.keys(examProgress.userProgresses).forEach(userId => {
          const userProgress = examProgress.userProgresses[userId]
          updateStudentProgress(userProgress)
        })
      }
    }
  })
}

// 참가자 상태 업데이트
const updateParticipantsStatus = (participants, status) => {
  if (status.onlineUsers && Array.isArray(status.onlineUsers)) {
    participants.length = 0
    status.onlineUsers.forEach(onlineUser => {
      if (onlineUser.status === 'ONLINE' && onlineUser.userRole !== 'TEACHER') {
        participants.push({
          userId: onlineUser.userId,
          userName: onlineUser.userName,
          userRole: onlineUser.userRole,
          status: 'ONLINE',
          progress: null
        })
      }
    })
  } else if (status.userId && status.status) {
    if (status.status === 'ONLINE' && status.userRole !== 'TEACHER') {
      const existingParticipant = participants.find(p => p.userId == status.userId)
      if (!existingParticipant) {
        participants.push({
          userId: status.userId,
          userName: status.userName || '알 수 없음',
          userRole: status.userRole || 'STUDENT',
          status: 'ONLINE',
          progress: null
        })
      }
    } else if (status.status === 'OFFLINE' && status.userRole !== 'TEACHER') {
      const index = participants.findIndex(p => p.userId == status.userId)
      if (index !== -1) {
        participants.splice(index, 1)
      }
    }
  }
}

// 학생 진행 상황 업데이트
const updateStudentProgress = (progressData) => {
  studentProgress.value[progressData.userId] = {
    currentQuestion: progressData.currentQuestion,
    answeredQuestions: progressData.answeredQuestions?.length || 0,
    totalQuestions: selectedExam.value?.totalItems || 0,
    remainingTime: progressData.remainingTime,
    lastUpdate: progressData.timestamp
  }
}

// 시험 시작: TeacherLiveExam으로 생성 후 시작
const liveExamId = ref(null)
const startExam = async () => {
  try {
    const sourceExamId = selectedExam.value.examId || selectedExam.value.id
    // 1) 실시간 시험 생성
    const createRes = await teacherLiveExamAPI.createLiveExam({
      examName: selectedExam.value.examName,
      classId: props.classId,
      timeLimit: selectedExam.value.timeLimit,
      sourceExamId,
      randomSelection: false,
    })
    if (!createRes.success) throw new Error(createRes.message || '생성 실패')
    liveExamId.value = createRes.data.id

    // 2) 실시간 시험 시작
    const startRes = await teacherLiveExamAPI.startExam(liveExamId.value)
    if (startRes.success) {
      examStarted.value = true
      console.log('실시간 시험 시작 완료:', startRes.data)

      if (wsComposable) {
        wsComposable.sendNoticeMessage('실시간 시험이 시작되었습니다. 학생들은 이제 응시할 수 있습니다.')
        wsComposable.sendStatusMessage('STARTED')
      }
      emit('exam-started', selectedExam.value)
    }
  } catch (error) {
    console.error('시험 시작 실패:', error)
    const msg = error.response?.data?.message || error.message || '알 수 없는 오류'
    alert('시험 시작에 실패했습니다: ' + msg)
  }
}

// 시험 종료: TeacherLiveExam 종료
const endExam = async () => {
  try {
    if (!liveExamId.value) throw new Error('진행 중인 실시간 시험이 없습니다')
    const response = await teacherLiveExamAPI.endExam(liveExamId.value)
    if (response.success) {
      examStarted.value = false
      console.log('실시간 시험 종료 완료:', response.data)
      if (wsComposable) {
        wsComposable.sendNoticeMessage('실시간 시험이 종료되었습니다.')
        wsComposable.sendStatusMessage('ENDED')
      }
      emit('exam-ended', selectedExam.value)
    }
  } catch (error) {
    console.error('시험 종료 실패:', error)
    const msg = error.response?.data?.message || error.message || '알 수 없는 오류'
    alert('시험 종료에 실패했습니다: ' + msg)
  }
}

// 날짜 포맷
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}/${day}`
}

// 남은 시간 포맷
const formatRemainingTime = (seconds) => {
  if (!seconds || seconds <= 0) return '시간 종료'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 모달 오버레이 클릭
const handleOverlayClick = () => {
  close()
}

// 모달 닫기
const close = () => {
  if (wsComposable && wsComposable.disconnectWebSocket) {
    wsComposable.disconnectWebSocket()
  }
  selectedExam.value = null
  examStarted.value = false
  onlineParticipants.value = []
  studentProgress.value = {}
  emit('close')
}

// 사용 가능한 시험 로드
const loadAvailableExams = async () => {
  loading.value = true
  try {
    // 선생님이 만든 시험 목록 조회
    const response = await examApi.getMyExams()
    console.log('시험 목록 응답:', response.data)
    
    // Page 객체 직접 처리 (ApiResponse로 감싸지지 않음)
    let exams = []
    if (response.data.content) {
      // Page 객체 형태
      exams = response.data.content
    } else if (Array.isArray(response.data)) {
      // 배열 형태
      exams = response.data
    } else if (response.data.success && response.data.data) {
      // ApiResponse 형태 (혹시나)
      exams = Array.isArray(response.data.data) ? response.data.data : 
              (response.data.data?.content ? response.data.data.content : [])
    }
    
    availableExams.value = exams.map(exam => ({
      ...exam,
      // 필드명 매핑 (백엔드 응답에 맞춰 조정)
      itemCount: exam.totalItems || exam.itemCount || 0,
      totalPoints: exam.totalPoints || 100
    }))
    
    console.log('처리된 시험 목록:', availableExams.value)
  } catch (error) {
    console.error('시험 목록 로드 실패:', error)
    console.error('에러 상세:', error.response?.data)
  } finally {
    loading.value = false
  }
}

// 모달이 열릴 때
watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.classId) {
    await loadAvailableExams()
  }
})

// 컴포넌트 언마운트 시
onUnmounted(() => {
  if (wsComposable && wsComposable.disconnectWebSocket) {
    wsComposable.disconnectWebSocket()
  }
})
</script>

<style scoped>
/* 모달 기본 스타일 */
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
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

.modal-container.modal-lg {
  max-width: 1000px;
}

/* 모달 헤더 */
.modal-header {
  padding: 1.75rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

/* 모달 컨텐츠 */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.75rem;
}

/* 시험 선택 섹션 */
.section-header {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* 시험 목록 */
.exam-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.exam-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.exam-item:hover {
  background: white;
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
  transform: translateX(4px);
}

.exam-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exam-icon svg {
  width: 24px;
  height: 24px;
  fill: #2563eb;
}

.exam-details {
  flex: 1;
}

.exam-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.exam-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-item i {
  font-size: 0.875rem;
}

.exam-arrow {
  flex-shrink: 0;
}

.exam-arrow svg {
  width: 20px;
  height: 20px;
  fill: #94a3b8;
}

/* 시험 유형 선택 */
.exam-type-selector {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.selector-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 1rem 0;
}

.type-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.type-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.type-btn.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.type-btn i {
  font-size: 1.5rem;
  color: #64748b;
}

.type-btn.active i {
  color: #2563eb;
}

.type-desc {
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: center;
  line-height: 1.3;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #cbd5e1;
  margin: 0 auto 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

/* 시험 관리 섹션 */
.exam-control {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 정보 카드 */
.info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
}

.back-btn {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.back-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

/* 컨트롤 섹션 */
.control-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.control-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
}

.exam-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.exam-status.status-waiting {
  background: #fef3c7;
  color: #92400e;
}

.exam-status.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.control-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.control-btn {
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-start {
  background: #10b981;
  color: white;
}

.btn-start:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-stop {
  background: #ef4444;
  color: white;
}

.btn-stop:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.assignment-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  font-size: 0.875rem;
}

.assignment-info i {
  font-size: 1.125rem;
  flex-shrink: 0;
}

/* 참가자 섹션 */
.participants-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
}

.participants-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.participants-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
}

.participant-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #64748b;
}

.count-number {
  font-size: 1.125rem;
  font-weight: 700;
  color: #2563eb;
}

.participants-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.participant-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
  transition: background 0.2s;
}

.participant-item:hover {
  background: #f1f5f9;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.participant-info {
  flex: 1;
  min-width: 0;
}

.participant-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.online-badge {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

.progress-info {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.625rem;
}

.progress-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-item i {
  font-size: 0.75rem;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.375rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  justify-content: space-between;
}

.waiting-status {
  font-size: 0.875rem;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.no-participants {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
}

.no-participants i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.no-participants p {
  font-size: 0.875rem;
  margin: 0;
}

/* 스크롤바 스타일 */
.participants-list::-webkit-scrollbar {
  width: 6px;
}

.participants-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.participants-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.participants-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .control-buttons {
    grid-template-columns: 1fr;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
