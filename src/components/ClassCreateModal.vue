<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-container">
      <!-- 배경 오버레이 -->
      <div class="modal-backdrop" @click="close"></div>

      <!-- 모달 -->
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">학급 생성</h3>
          <button @click="close" class="modal-close-btn">
            <svg class="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- 학급명 -->
          <div class="form-group">
            <label for="className" class="form-label">
              학급명 <span class="required">*</span>
            </label>
            <input
              v-model="formData.className"
              type="text"
              id="className"
              required
              placeholder="예: 1학년 3반"
              class="form-input"
            />
            <p class="form-help">학생들에게 표시될 학급 이름입니다.</p>
          </div>

          <!-- 학년 선택 -->
          <div class="form-group">
            <label for="classGrade" class="form-label">
              학년 <span class="required">*</span>
            </label>
            <select
              v-model="formData.classGrade"
              id="classGrade"
              required
              class="form-select"
            >
              <option value="">학년을 선택하세요</option>
              <option v-for="grade in grades" :key="grade.code" :value="grade.code">
                {{ grade.name }}
              </option>
            </select>
          </div>

          <!-- 과목 선택 -->
          <div class="form-group">
            <label for="classSubject" class="form-label">
              담당 과목 <span class="required">*</span>
            </label>
            <select
              v-model="formData.classSubject"
              id="classSubject"
              required
              class="form-select"
            >
              <option value="">과목을 선택하세요</option>
              <option v-for="subject in subjects" :key="subject.code" :value="subject.code">
                {{ subject.name }}
              </option>
            </select>
          </div>

          <!-- 초대 코드 생성 옵션 -->
          <div class="form-group">
            <div class="checkbox-wrapper">
              <input
                v-model="formData.generateInviteCode"
                type="checkbox"
                id="generateInviteCode"
                class="form-checkbox"
              />
              <label for="generateInviteCode" class="checkbox-label">
                초대 코드 자동 생성
              </label>
            </div>
            <p class="form-help">학생들이 학급에 가입할 수 있는 초대 코드를 생성합니다.</p>
          </div>

          <!-- 학급 생성 안내 -->
          <div class="info-box">
            <div class="info-content">
              <div class="info-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="info-text">
                <h3 class="info-title">학급 생성 안내</h3>
                <div class="info-list">
                  <ul>
                    <li>학급은 한 번 생성하면 수정할 수 있습니다.</li>
                    <li>초대 코드는 나중에도 생성할 수 있습니다.</li>
                    <li>학생들은 초대 코드나 직접 초대를 통해 가입할 수 있습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 버튼 -->
          <div class="form-buttons">
            <button
              type="button"
              @click="close"
              class="btn-cancel"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="creating"
              :class="['btn-submit', { 'btn-disabled': creating }]"
            >
              <span v-if="creating" class="flex items-center">
                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </span>
              <span v-else>학급 생성</span>
            </button>
          </div>
        </form>

        <!-- 생성 결과 표시 -->
        <div v-if="createdClass" class="success-box">
          <div class="success-content">
            <div class="success-icon">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="success-text">
              <h3 class="success-title">학급이 생성되었습니다!</h3>
              <div class="success-info">
                <p>학급명: {{ createdClass.className }}</p>
                <p v-if="createdClass.inviteCode" class="invite-code-wrapper">
                  초대 코드: <span class="invite-code">{{ createdClass.inviteCode }}</span>
                  <button
                    @click="copyInviteCode"
                    class="copy-btn"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

const toast = useToast()

// 폼 데이터
const formData = ref({
  className: '',
  classGrade: '',
  classSubject: '',
  generateInviteCode: true
})

// 학년 목록 (위자드와 동일한 코드 체계)
const grades = ref([
  { code: '07', name: '1학년' },
  { code: '08', name: '2학년' },
  { code: '09', name: '3학년' }
])

// 과목 목록 (위자드와 동일한 코드 체계)
const subjects = ref([
  { code: 'MA', name: '수학' },
  { code: 'KO', name: '국어' },
  { code: 'EN', name: '영어' },
  { code: 'SC', name: '과학' },
  { code: 'SO', name: '사회' }
])

// 상태
const creating = ref(false)
const createdClass = ref(null)

// 학급 생성 처리
const handleSubmit = async () => {
  creating.value = true
  
  try {
    // 백엔드 요청 형식에 맞게 데이터 구성 (DB 코드 그대로 사용)
    const requestData = {
      className: formData.value.className,
      classGrade: formData.value.classGrade, // 07, 08, 09 그대로 사용
      classSubject: formData.value.classSubject, // MA, KO, EN, SC, SO 그대로 사용
      generateInviteCode: formData.value.generateInviteCode,
      description: '' // 선택적 필드
    }
    
    console.log('학급 생성 요청 데이터:', requestData)
    
    const response = await axios.post('/api/classes/test', requestData) // 테스트용 엔드포인트 사용
    
    if (response.data.success) {
      createdClass.value = response.data.data
      toast.success('학급이 성공적으로 생성되었습니다!')
      
      // 2초 후 모달 닫기
      setTimeout(() => {
        emit('created', createdClass.value)
        close()
      }, 2000)
    }
  } catch (error) {
    console.error('Failed to create class:', error)
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error ||
                        '학급 생성에 실패했습니다.'
    toast.error(errorMessage)
  } finally {
    creating.value = false
  }
}

// 초대 코드 복사
const copyInviteCode = async () => {
  if (!createdClass.value?.inviteCode) return
  
  try {
    await navigator.clipboard.writeText(createdClass.value.inviteCode)
    toast.success('초대 코드가 복사되었습니다!')
  } catch (error) {
    console.error('Failed to copy invite code:', error)
    toast.error('초대 코드 복사에 실패했습니다.')
  }
}

// 모달 닫기
const close = () => {
  emit('close')
  // 폼 초기화
  formData.value = {
    className: '',
    classGrade: '',
    classSubject: '',
    generateInviteCode: true
  }
  createdClass.value = null
}

// 모달이 열릴 때 초기화
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    createdClass.value = null
  }
})
</script>

<style scoped>
/* Modal Container & Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 42rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
  z-index: 1002;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close-btn {
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #6b7280;
}

.modal-close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Form */
.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-help {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Checkbox */
.checkbox-wrapper {
  display: flex;
  align-items: center;
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  margin-right: 0.5rem;
  cursor: pointer;
}

.form-checkbox:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-label {
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

/* Info Box */
.info-box {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-content {
  display: flex;
  gap: 0.75rem;
}

.info-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: #3b82f6;
}

.info-icon svg {
  width: 100%;
  height: 100%;
}

.info-text {
  flex: 1;
}

.info-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
}

.info-list ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.8125rem;
  color: #1e40af;
}

.info-list li {
  margin-bottom: 0.25rem;
}

/* Success Box */
.success-box {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.success-content {
  display: flex;
  gap: 0.75rem;
}

.success-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: #10b981;
}

.success-icon svg {
  width: 100%;
  height: 100%;
}

.success-text {
  flex: 1;
}

.success-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
  margin: 0 0 0.5rem 0;
}

.success-info {
  font-size: 0.8125rem;
  color: #047857;
}

.success-info p {
  margin: 0.25rem 0;
}

.invite-code-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.invite-code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  background-color: #dcfce7;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.copy-btn {
  padding: 0.25rem;
  background: transparent;
  border: 1px solid #10b981;
  border-radius: 0.25rem;
  color: #10b981;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  background-color: #10b981;
  color: white;
}

.copy-btn svg {
  width: 1rem;
  height: 1rem;
}

/* Buttons */
.form-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-submit {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #3b82f6;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(.btn-disabled) {
  background-color: #2563eb;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-disabled:hover {
  background-color: #3b82f6;
}

/* Loading Spinner */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.h-4 {
  height: 1rem;
}

.w-4 {
  width: 1rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.opacity-25 {
  opacity: 0.25;
}

.opacity-75 {
  opacity: 0.75;
}

/* Responsive Design */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }
  
  .modal-content {
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-form {
    padding: 1rem;
  }
}
</style>