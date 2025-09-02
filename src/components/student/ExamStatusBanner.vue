<template>
  <transition name="slide-down">
    <div v-if="activeExam" class="exam-status-banner" :class="bannerClass">
      <div class="container">
        <div class="banner-content">
          <div class="banner-left">
            <div class="status-icon">
              <i :class="statusIcon"></i>
            </div>
            <div class="exam-info">
              <h3 class="exam-title">{{ activeExam.examName }}</h3>
              <p class="exam-status">{{ statusText }}</p>
            </div>
          </div>
          
          <div class="banner-right">
            <div v-if="activeExam.examStatus === 'STARTED'" class="timer">
              <i class="bi bi-clock"></i>
              <span>{{ remainingTime }}</span>
            </div>
            
            <button 
              v-if="activeExam.examStatus === 'STARTED' || activeExam.examStatus === 'CREATED'"
              @click="goToExam"
              class="take-exam-btn"
            >
              <i class="bi bi-pencil-square me-2"></i>
              시험 응시하기
            </button>
            
            <button 
              v-else-if="activeExam.examStatus === 'ENDED'"
              @click="viewResults"
              class="view-results-btn"
            >
              <i class="bi bi-bar-chart-line me-2"></i>
              결과 확인
            </button>
          </div>
        </div>
      </div>
      
      <button @click="dismissBanner" class="dismiss-btn">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  classId: {
    type: Number,
    required: true
  }
})

const router = useRouter()
const activeExam = ref(null)
const remainingTime = ref('00:00')
let timerInterval = null

// WebSocket에서 시험 상태 수신
const onExamStatusUpdate = (data) => {
  console.log('Received exam status update:', data)
  
  // eventType으로 처리 (새로운 구조)
  if (data.eventType === 'EXAM_CREATED') {
    activeExam.value = {
      ...data,
      examStatus: 'CREATED'
    }
    // 알림 표시
    showNotification('새로운 실시간 시험이 생성되었습니다!')
  } else if (data.eventType === 'EXAM_STARTED') {
    activeExam.value = {
      ...data,
      examStatus: 'STARTED',
      startTime: new Date()
    }
    startTimer()
    showNotification('실시간 시험이 시작되었습니다!')
  } else if (data.eventType === 'EXAM_ENDED') {
    if (activeExam.value) {
      activeExam.value.examStatus = 'ENDED'
    }
    stopTimer()
    showNotification('시험이 종료되었습니다.')
  }
}

// 알림 표시 함수
const showNotification = (message) => {
  // 브라우저 알림 API 사용
  if (Notification.permission === 'granted') {
    new Notification('똑똑한 우리반', {
      body: message,
      icon: '/favicon.ico'
    })
  }
  
  // 화면 내 토스트 알림도 표시
  console.log('Notification:', message)
}

// 배너 클래스
const bannerClass = computed(() => {
  if (!activeExam.value) return ''
  const status = activeExam.value.examStatus
  if (status === 'STARTED') return 'banner-active'
  if (status === 'ENDED') return 'banner-ended'
  if (status === 'CREATED') return 'banner-created'
  return ''
})

// 상태 아이콘
const statusIcon = computed(() => {
  if (!activeExam.value) return ''
  const status = activeExam.value.examStatus
  if (status === 'STARTED') return 'bi bi-broadcast text-danger pulse'
  if (status === 'ENDED') return 'bi bi-check-circle text-success'
  if (status === 'CREATED') return 'bi bi-calendar-event text-info'
  return ''
})

// 상태 텍스트
const statusText = computed(() => {
  if (!activeExam.value) return ''
  const status = activeExam.value.examStatus
  if (status === 'STARTED') return '실시간 시험이 진행 중입니다'
  if (status === 'ENDED') return '시험이 종료되었습니다'
  if (status === 'CREATED') return '시험이 예정되어 있습니다'
  return ''
})

// 타이머 시작
const startTimer = () => {
  if (!activeExam.value?.timeLimit) return
  
  let totalSeconds = activeExam.value.timeLimit * 60
  
  timerInterval = setInterval(() => {
    if (totalSeconds <= 0) {
      stopTimer()
      return
    }
    
    totalSeconds--
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    remainingTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, 1000)
}

// 타이머 정지
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// 시험 응시 페이지로 이동
const goToExam = () => {
  if (activeExam.value) {
    router.push('/student/cbt/exam/' + activeExam.value.examId)
  }
}

// 결과 확인 페이지로 이동
const viewResults = () => {
  if (activeExam.value) {
    router.push(`/student/exam/results/${activeExam.value.examId}`)
  }
}

// 배너 닫기
const dismissBanner = () => {
  activeExam.value = null
  stopTimer()
}

// 컴포넌트 마운트 시 현재 진행 중인 시험 확인
onMounted(() => {
  // TODO: API 호출로 현재 진행 중인 시험 확인
  // checkActiveExam()
})

onUnmounted(() => {
  stopTimer()
})

// WebSocket 이벤트 노출
defineExpose({
  onExamStatusUpdate
})
</script>

<style scoped>
.exam-status-banner {
  position: fixed;
  top: 60px; /* 헤더 아래 */
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid;
  animation: slideDown 0.3s ease-out;
}

.banner-active {
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.95) 0%, rgba(255, 45, 85, 0.95) 100%);
  border-bottom-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.banner-ended {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.95) 0%, rgba(48, 209, 88, 0.95) 100%);
  border-bottom-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.banner-created {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.95) 0%, rgba(0, 112, 235, 0.95) 100%);
  border-bottom-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.exam-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.exam-status {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.95;
  color: white;
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
}

.take-exam-btn,
.view-results-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.take-exam-btn {
  color: #ff3b30;
}

.take-exam-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.view-results-btn {
  color: #34c759;
}

.view-results-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dismiss-btn {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 트랜지션 애니메이션 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .banner-left {
    flex-direction: column;
  }
  
  .banner-right {
    width: 100%;
    justify-content: center;
  }
  
  .exam-title {
    font-size: 1.1rem;
  }
  
  .take-exam-btn,
  .view-results-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
