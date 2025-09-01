<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">시험 출제하기</h2>
        <button @click="close" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- 시험 정보 -->
        <div class="exam-info-section" v-if="selectedExam">
          <h3>시험 정보</h3>
          <div class="exam-info-card">
            <div class="info-row">
              <span class="label">시험명:</span>
              <span class="value">{{ selectedExam.examName }}</span>
            </div>
            <div class="info-row">
              <span class="label">문항 수:</span>
              <span class="value">{{ selectedExam.itemCount || selectedExam.totalItems }}문항</span>
            </div>
            <div class="info-row">
              <span class="label">학년:</span>
              <span class="value">{{ selectedExam.gradeName }}</span>
            </div>
          </div>
        </div>

        <!-- 학급 정보 -->
        <div class="class-info-section">
          <h3>출제 대상 학급</h3>
          <div v-if="loadingClass" class="loading">
            <div class="spinner"></div>
            <p>학급 정보를 불러오는 중...</p>
          </div>
          
          <div v-else-if="!myClass" class="empty-state">
            <p>담당 학급이 없습니다.</p>
            <p>먼저 학급을 생성해주세요.</p>
          </div>
          
          <div v-else class="class-info-card">
            <div class="info-row">
              <span class="label">학급명:</span>
              <span class="value">{{ myClass.className }}</span>
            </div>
            <div class="info-row">
              <span class="label">학년:</span>
              <span class="value">{{ getGradeName(myClass.classGrade) }}</span>
            </div>
            <div class="info-row">
              <span class="label">학생 수:</span>
              <span class="value">{{ myClass.totalStudents || myClass.students?.length || 0 }}명</span>
            </div>
          </div>
        </div>

        <!-- 시험 설정 -->
        <div class="exam-settings-section">
          <h3>시험 설정</h3>
          
          <div class="form-group">
            <label>시험 날짜</label>
            <input 
              type="date" 
              v-model="examDate"
              :min="todayDate"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>시험 시간</label>
            <input 
              type="time" 
              v-model="examTime"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>제한 시간 (분)</label>
            <input 
              type="number" 
              v-model="timeLimit"
              min="10"
              max="180"
              step="5"
              class="form-input"
              placeholder="예: 50"
            />
          </div>

          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                v-model="sendNotification"
              />
              학생들에게 알림 보내기
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="close" class="btn-cancel">취소</button>
        <button 
          @click="assignExam" 
          :disabled="!canAssign"
          class="btn-assign"
        >
          출제하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import classApi from '@/services/classApi'
import examApi from '@/services/examApi'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  exam: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'assigned'])

// State
const selectedExam = ref(null)
const loadingClass = ref(false)
const myClass = ref(null)
const examDate = ref('')
const examTime = ref('')
const timeLimit = ref(50)
const sendNotification = ref(true)

// Computed
const todayDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const canAssign = computed(() => {
  return myClass.value && 
         examDate.value && 
         examTime.value && 
         timeLimit.value > 0
})

// Methods
const loadMyClass = async () => {
  loadingClass.value = true
  try {
    const response = await classApi.getMyClass()
    console.log('API 전체 응답:', response)
    console.log('response.data:', response.data)
    
    // axios는 response.data에 실제 데이터가 있음
    if (response.data) {
      // ApiResponse 구조 (success, data 필드)
      if (response.data.success && response.data.data) {
        myClass.value = response.data.data
        console.log('설정된 myClass:', myClass.value)
      } 
      // 직접 데이터인 경우
      else if (response.data.classId) {
        myClass.value = response.data
        console.log('직접 설정된 myClass:', myClass.value)
      }
      else {
        console.warn('예상치 못한 응답 구조:', response.data)
      }
    }
  } catch (error) {
    console.error('학급 정보 로드 실패:', error)
    console.error('에러 상세:', error.response)
  } finally {
    loadingClass.value = false
  }
}

const assignExam = async () => {
  if (!canAssign.value) {
    console.warn('필수 정보를 모두 입력해주세요.')
    return
  }

  try {
    // 시험 출제 API 호출
    const assignData = {
      examId: selectedExam.value.id,
      classIds: [myClass.value.classId], // 단일 학급 ID를 배열로 감싸서 전송
      examDate: examDate.value,
      examTime: examTime.value,
      timeLimit: timeLimit.value,
      sendNotification: sendNotification.value
    }

    const response = await examApi.assignExamToClasses(assignData)
    
    if (response.data && response.data.success) {
      console.log(`${myClass.value.className}에 시험이 출제되었습니다.`)
      
      if (sendNotification.value) {
        console.log('학생들에게 알림이 발송되었습니다.')
      }
      
      emit('assigned', response.data.data)
      close()
    }
  } catch (error) {
    console.error('시험 출제 실패:', error)
  }
}

const getGradeName = (gradeCode) => {
  const gradeMap = {
    '07': '중1',
    '08': '중2',
    '09': '중3'
  }
  return gradeMap[gradeCode] || '중학생'
}

const close = () => {
  // 상태 초기화
  myClass.value = null
  examDate.value = ''
  examTime.value = ''
  timeLimit.value = 50
  sendNotification.value = true
  emit('close')
}

const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    close()
  }
}

// Watch for exam prop changes
watch(() => props.exam, (newExam) => {
  if (newExam) {
    selectedExam.value = newExam
  }
})

// Watch for modal open
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadMyClass()
    // 기본값 설정
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    examDate.value = tomorrow.toISOString().split('T')[0]
    examTime.value = '09:00'
  }
})

// Lifecycle
onMounted(() => {
  if (props.exam) {
    selectedExam.value = props.exam
  }
})
</script>

<style scoped>
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
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.modal-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.exam-info-section,
.class-info-section,
.exam-settings-section {
  margin-bottom: 24px;
}

.exam-info-section h3,
.class-info-section h3,
.exam-settings-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.exam-info-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #6b7280;
  margin-right: 8px;
  min-width: 80px;
}

.value {
  color: #1f2937;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  margin-top: 12px;
  color: #6b7280;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}

.empty-state p {
  margin: 4px 0;
}

/* 기존 class-list 관련 스타일 제거 - 더 이상 사용하지 않음 */

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group label input[type="checkbox"] {
  margin-right: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-assign {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-assign {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: white;
}

.btn-assign:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-assign:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }
}
</style>