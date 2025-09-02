<template>
  <div class="student-dashboard">
    <!-- 실시간 시험 상태 배너 -->
    <ExamStatusBanner 
      v-if="classId"
      ref="examBanner"
      :class-id="classId"
    />
    
    <!-- 기존 대시보드 내용 -->
    <div class="dashboard-container" :class="{ 'with-banner': hasActiveExam }">
      <h1>학생 대시보드</h1>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ExamStatusBanner from '@/components/student/ExamStatusBanner.vue'
import { useExamWebSocket } from '@/composables/useExamWebSocket'

// 학생 정보
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const studentName = ref(userInfo.fullName || '학생')
const classId = ref(userInfo.classId || null)

// 클래스 정보
const classInfo = ref(null)

// 시험 배너 참조
const examBanner = ref(null)
const hasActiveExam = ref(false)

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

onMounted(() => {
  loadClassInfo()
})
</script>

<style scoped>
.student-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
</style>