<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <!-- Modal Header -->
          <div class="modal-header">
            <h2 class="modal-title">학급 관리</h2>
            <button class="modal-close" @click="close">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
              <p class="loading-text">학급 정보를 불러오는 중...</p>
            </div>

            <!-- No Class State -->
            <div v-else-if="!classInfo" class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25M0 20V18.5C0 17.11 1.89 15.94 4.45 15.6C3.86 16.28 3.5 17.22 3.5 18.25V20H0M24 20H20.5V18.25C20.5 17.22 20.14 16.28 19.55 15.6C22.11 15.94 24 17.11 24 18.5V20Z" />
              </svg>
              <h3 class="empty-title">학급이 없습니다</h3>
              <p class="empty-description">새로운 학급을 생성하여 학생들을 관리하세요.</p>
              <button class="btn btn-primary" @click="showCreateClass">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
                학급 생성하기
              </button>
            </div>

            <!-- Class Info -->
            <div v-else class="class-content">
              <!-- Class Info Card -->
              <div class="info-card">
                <div class="info-card-header">
                  <h3 class="info-card-title">학급 정보</h3>
                  <div class="card-actions">
                    <button v-if="!isEditing" class="btn btn-sm btn-outline" @click="startEdit">
                      <svg class="btn-icon-sm" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.71 7.04C21.1 6.65 21.1 6 20.71 5.63L18.37 3.29C18 2.9 17.35 2.9 16.96 3.29L15.12 5.12L18.87 8.87M3 17.25V21H6.75L17.81 9.93L14.06 6.18L3 17.25Z" />
                      </svg>
                      수정
                    </button>
                    <template v-else>
                      <button class="btn btn-sm btn-primary" @click="saveEdit">
                        <svg class="btn-icon-sm" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 7L9 19L3.5 13.5L4.91 12.09L9 16.17L19.59 5.59L21 7Z" />
                        </svg>
                        저장
                      </button>
                      <button class="btn btn-sm btn-outline" @click="cancelEdit">
                        취소
                      </button>
                    </template>
                  </div>
                </div>
                <div class="info-card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">학급명</span>
                      <input v-if="isEditing" v-model="editForm.className" class="info-input" type="text" />
                      <span v-else class="info-value">{{ classInfo.className }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">학년</span>
                      <select v-if="isEditing" v-model="editForm.classGrade" class="info-select">
                        <option value="07">1학년</option>
                        <option value="08">2학년</option>
                        <option value="09">3학년</option>
                      </select>
                      <span v-else class="info-value">{{ getGradeName(classInfo.classGrade) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">담당 과목</span>
                      <select v-if="isEditing" v-model="editForm.classSubject" class="info-select">
                        <option value="MA">수학</option>
                        <option value="KO">국어</option>
                        <option value="EN">영어</option>
                        <option value="SC">과학</option>
                        <option value="SO">사회</option>
                      </select>
                      <span v-else class="info-value">{{ getSubjectName(classInfo.classSubject) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">담당 교사</span>
                      <span class="info-value">{{ classInfo.teacher?.teacherName || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">학생 수</span>
                      <span class="info-value">{{ classInfo.totalStudents || 0 }}명</span>
                    </div>
                    
                  </div>
                </div>
              </div>

              <!-- Students List -->
              <div class="students-card">
                <div class="students-card-header">
                  <h3 class="students-card-title">학생 목록</h3>
                  <span class="student-count">{{ classInfo.students?.length || 0 }}명</span>
                </div>
                <div class="students-card-body">
                  <div v-if="!classInfo.students || classInfo.students.length === 0" class="no-students">
                    <p>아직 등록된 학생이 없습니다.</p>
                    <p class="no-students-hint">대시보드의 '학생 초대' 메뉴를 이용해주세요.</p>
                  </div>
                  <div v-else class="students-grid">
                    <div v-for="student in classInfo.students" :key="student.studentId" class="student-card">
                      <div class="student-avatar">
                        {{ getInitials(student.studentName) }}
                      </div>
                      <div class="student-info">
                        <div class="student-name-wrapper">
                          <div class="student-name-with-status">
                            <span 
                              class="status-dot" 
                              :class="(student.isOnline || isStudentOnline(student.studentId)) ? 'online' : 'offline'"
                              :title="(student.isOnline || isStudentOnline(student.studentId)) ? '온라인' : '오프라인'"
                            ></span>
                            <p class="student-name">{{ student.studentName || `학생 ${student.studentId}` }}</p>
                          </div>
                        </div>
                        <p class="student-meta">{{ student.email || '-' }}</p>
                      </div>
                      <button class="remove-btn" @click="removeStudent(student.studentId)" title="제거">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import authService from '@/services/auth'
import { useToast } from '@/composables/useToast'
import wsService from '@/services/websocket'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'create-class', 'invite-students'])

const { showToast } = useToast()

// State
const isOpen = ref(false)
const loading = ref(false)
const classInfo = ref(null)
const isEditing = ref(false)
const editForm = ref({
  className: '',
  classGrade: '',
  classSubject: ''
})
const onlineStudents = ref(new Set())

// Grade and Subject mappings
const gradeMap = {
  '07': '1학년',
  '08': '2학년',
  '09': '3학년'
}

const subjectMap = {
  'MA': '수학',
  'KO': '국어',
  'EN': '영어',
  'SC': '과학',
  'SO': '사회'
}

// Watch for prop changes
watch(() => props.modelValue, async (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    await loadClassInfo()
    // 클래스 정보를 로드한 후에 WebSocket 연결
    if (classInfo.value && classInfo.value.classId) {
      await connectWebSocket()
    }
  } else {
    disconnectWebSocket()
  }
})

// Methods
const close = () => {
  isOpen.value = false
  emit('update:modelValue', false)
}

const loadClassInfo = async () => {
  loading.value = true
  try {
    const teacherClass = await authService.getTeacherClass()
    classInfo.value = teacherClass
  } catch (error) {
    console.error('Failed to load class info:', error)
    showToast('학급 정보를 불러오는데 실패했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

const getGradeName = (code) => {
  return gradeMap[code] || code
}

const getSubjectName = (code) => {
  return subjectMap[code] || code
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.slice(0, 2)
}



const showCreateClass = () => {
  close()
  emit('create-class')
}


const startEdit = () => {
  isEditing.value = true
  editForm.value = {
    className: classInfo.value.className,
    classGrade: classInfo.value.classGrade,
    classSubject: classInfo.value.classSubject
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {
    className: '',
    classGrade: '',
    classSubject: ''
  }
}

const saveEdit = async () => {
  try {
    // API call to update class
    const response = await authService.updateClass(classInfo.value.classId, editForm.value)
    if (response) {
      classInfo.value = response
      showToast('학급 정보가 수정되었습니다.', 'success')
      isEditing.value = false
    }
  } catch (error) {
    console.error('Failed to update class:', error)
    showToast('학급 정보 수정에 실패했습니다.', 'error')
  }
}

const removeStudent = (studentId) => {
  // TODO: Implement remove student
  showToast('학생 제거 기능은 준비 중입니다.', 'info')
}

// WebSocket 관련 함수들
const connectWebSocket = async () => {
  if (!classInfo.value || !classInfo.value.classId) {
    console.warn('클래스 정보가 없어 WebSocket 연결을 건너뜁니다')
    return
  }
  
  const user = authService.getCurrentUser()
  if (!user) {
    console.warn('사용자 정보가 없어 WebSocket 연결을 건너뜁니다')
    return
  }
  
  // userId는 백엔드에서 'id'로 반환됨
  const userId = user.id || user.userId
  const userName = user.fullName || user.name
  
  // 이미 연결되어 있으면 재사용
  if (wsService.isConnected()) {
    console.log('✅ WebSocket 이미 연결됨')
    // 온라인 상태만 다시 요청
    const channelName = `class-${classInfo.value.classId}`
    setTimeout(() => {
      wsService.getOnlineStatus(channelName, userId)
    }, 100)
    return
  }
  
  console.log('🔌 WebSocket 새로 연결 시작')
  
  try {
    const channelName = `class-${classInfo.value.classId}`
    
    await wsService.connect(
      channelName,
      userId,
      userName,
      user.role,
      {
        onOnlineStatus: (statusResponse) => {
          console.log('📡 온라인 상태 수신:', statusResponse)
          
          // 온라인 사용자 목록 업데이트
          if (statusResponse.onlineUsers && Array.isArray(statusResponse.onlineUsers)) {
            const onlineUsersList = statusResponse.onlineUsers
              .filter(u => u.userRole === 'STUDENT')
            
            // userId를 Set에 저장 (새로운 Set을 생성하여 반응성 보장)
            const studentIds = onlineUsersList.map(u => u.userId)
            onlineStudents.value = new Set(studentIds)
            
            // classInfo의 students 배열도 업데이트하여 반응성 트리거
            if (classInfo.value && classInfo.value.students) {
              classInfo.value.students.forEach(student => {
                // 강제로 반응성 업데이트 트리거
                student.isOnline = onlineStudents.value.has(student.studentId)
              })
              // 배열 자체를 재할당하여 Vue 반응성 트리거
              classInfo.value.students = [...classInfo.value.students]
            }
            
            console.log(`👥 온라인 학생: ${onlineStudents.value.size}명`, studentIds)
          }
        }
      }
    )
    
    console.log('✅ WebSocket 연결 성공')
    
    // 잠시 대기 후 접속 상태 요청 (연결 안정화)
    setTimeout(() => {
      console.log('📡 온라인 상태 요청 중...')
      wsService.getOnlineStatus(channelName, userId)
    }, 500)
  } catch (error) {
    console.error('❌ WebSocket 연결 실패:', error)
  }
}

const disconnectWebSocket = () => {
  if (wsService && wsService.isConnected()) {
    wsService.disconnect()
    onlineStudents.value.clear()
  }
}

const isStudentOnline = (studentId) => {
  // studentId는 실제로 userId값임 (백엔드에서 그렇게 매핑함)
  return onlineStudents.value.has(studentId)
}

// Cleanup on unmount
onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
/* Import wizard CSS variables */
@import '@/assets/styles/wizard.css';

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(-20px);
}

/* Modal Overlay */
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
  z-index: var(--wizard-z-modal);
  padding: 2rem;
}

/* Modal Container */
.modal-container {
  background: var(--wizard-bg-primary);
  border-radius: var(--wizard-radius-xl);
  box-shadow: var(--wizard-shadow-xl);
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

/* Modal Header */
.modal-header {
  padding: var(--wizard-spacing-xl);
  border-bottom: 1px solid var(--wizard-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--wizard-text-2xl);
  font-weight: 700;
  color: var(--wizard-text-primary);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: var(--wizard-radius-md);
  border: none;
  background: transparent;
  color: var(--wizard-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--wizard-transition-fast);
}

.modal-close:hover {
  background: var(--wizard-gray-100);
  color: var(--wizard-text-primary);
}

.modal-close svg {
  width: 24px;
  height: 24px;
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--wizard-spacing-xl);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--wizard-gray-200);
  border-top-color: var(--wizard-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 1rem;
  color: var(--wizard-text-secondary);
  font-size: var(--wizard-text-sm);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--wizard-gray-400);
  margin: 0 auto;
}

.empty-title {
  margin-top: 1rem;
  font-size: var(--wizard-text-lg);
  font-weight: 600;
  color: var(--wizard-text-primary);
}

.empty-description {
  margin-top: 0.5rem;
  color: var(--wizard-text-secondary);
  font-size: var(--wizard-text-sm);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--wizard-spacing-sm);
  padding: var(--wizard-spacing-md) var(--wizard-spacing-lg);
  border-radius: var(--wizard-radius-md);
  font-size: var(--wizard-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--wizard-transition-fast);
  border: none;
  margin-top: 1.5rem;
}

.btn-primary {
  background: var(--wizard-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--wizard-primary-dark);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--wizard-text-primary);
  border: 1px solid var(--wizard-border-color);
}

.btn-outline:hover {
  background: var(--wizard-gray-50);
}

.btn-sm {
  padding: var(--wizard-spacing-sm) var(--wizard-spacing-md);
  font-size: var(--wizard-text-xs);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.btn-icon-sm {
  width: 16px;
  height: 16px;
}

/* Class Content */
.class-content {
  display: flex;
  flex-direction: column;
  gap: var(--wizard-spacing-xl);
}

/* Info Card */
.info-card,
.students-card {
  background: var(--wizard-bg-primary);
  border: 1px solid var(--wizard-border-color);
  border-radius: var(--wizard-radius-lg);
  overflow: hidden;
}

.info-card-header,
.students-card-header {
  padding: var(--wizard-spacing-lg) var(--wizard-spacing-xl);
  background: var(--wizard-bg-secondary);
  border-bottom: 1px solid var(--wizard-border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-card-title,
.students-card-title {
  font-size: var(--wizard-text-lg);
  font-weight: 600;
  color: var(--wizard-text-primary);
  margin: 0;
}

.card-actions {
  display: flex;
  gap: var(--wizard-spacing-sm);
}

.info-card-body,
.students-card-body {
  padding: var(--wizard-spacing-xl);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--wizard-spacing-xl);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--wizard-spacing-xs);
}

.info-label {
  font-size: var(--wizard-text-sm);
  color: var(--wizard-text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: var(--wizard-text-base);
  color: var(--wizard-text-primary);
  font-weight: 600;
}

/* Invitation Code */
.invitation-code {
  display: flex;
  align-items: center;
  gap: var(--wizard-spacing-sm);
  padding: var(--wizard-spacing-sm) var(--wizard-spacing-md);
  background: var(--wizard-primary-50);
  border-radius: var(--wizard-radius-md);
  width: fit-content;
}

.code-text {
  font-family: monospace;
  font-size: var(--wizard-text-lg);
  font-weight: 700;
  color: var(--wizard-primary);
  letter-spacing: 0.1em;
}

.copy-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--wizard-radius-sm);
  border: none;
  background: var(--wizard-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--wizard-transition-fast);
}

.copy-btn:hover {
  background: var(--wizard-primary-dark);
}

.copy-btn svg {
  width: 16px;
  height: 16px;
}

/* Students */
.student-count {
  padding: var(--wizard-spacing-xs) var(--wizard-spacing-md);
  background: var(--wizard-primary-50);
  color: var(--wizard-primary);
  border-radius: var(--wizard-radius-full);
  font-size: var(--wizard-text-sm);
  font-weight: 600;
}

.no-students {
  text-align: center;
  padding: 2rem;
  color: var(--wizard-text-secondary);
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--wizard-spacing-lg);
}

.student-card {
  display: flex;
  align-items: center;
  gap: var(--wizard-spacing-md);
  padding: var(--wizard-spacing-md);
  background: var(--wizard-bg-secondary);
  border-radius: var(--wizard-radius-md);
  position: relative;
}

.student-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--wizard-radius-full);
  background: var(--wizard-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--wizard-text-sm);
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.student-name-with-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.status-dot.online {
  background-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-dot.offline {
  background-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }
}

.student-name {
  font-weight: 600;
  color: var(--wizard-text-primary);
  margin: 0;
}

.student-meta {
  font-size: var(--wizard-text-xs);
  color: var(--wizard-text-secondary);
  margin: 0;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--wizard-radius-sm);
  border: none;
  background: transparent;
  color: var(--wizard-error);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--wizard-transition-fast);
}

.remove-btn:hover {
  background: var(--wizard-error-50);
}

.remove-btn svg {
  width: 18px;
  height: 18px;
}

/* Edit Mode Inputs */
.info-input,
.info-select {
  padding: var(--wizard-spacing-sm) var(--wizard-spacing-md);
  border: 1px solid var(--wizard-border-color);
  border-radius: var(--wizard-radius-md);
  font-size: var(--wizard-text-base);
  font-weight: 600;
  color: var(--wizard-text-primary);
  background: var(--wizard-bg-primary);
  transition: all var(--wizard-transition-fast);
  width: 100%;
}

.info-input:focus,
.info-select:focus {
  outline: none;
  border-color: var(--wizard-primary);
  box-shadow: 0 0 0 3px var(--wizard-primary-50);
}

.no-students-hint {
  font-size: var(--wizard-text-sm);
  color: var(--wizard-text-tertiary);
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 100%;
    height: 100%;
    border-radius: 0;
  }
  
  .modal-overlay {
    padding: 0;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .students-grid {
    grid-template-columns: 1fr;
  }
}
</style>
