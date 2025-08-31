<template>
  <div class="wizard-container">
    <div class="wizard-header">
      <h2>설정 마법사</h2>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <p class="step-indicator">{{ currentStep + 1 }} / {{ totalSteps }}</p>
    </div>

    <div class="wizard-content">
      <!-- Step 1: 기본 정보 -->
      <div v-if="currentStep === 0" class="step-content">
        <h3>기본 정보 입력</h3>
        <div class="form-group">
          <label for="name">이름</label>
          <input 
            id="name" 
            v-model="formData.name" 
            type="text" 
            placeholder="이름을 입력하세요"
            required
          />
        </div>
        <div class="form-group">
          <label for="email">이메일</label>
          <input 
            id="email" 
            v-model="formData.email" 
            type="email" 
            placeholder="email@example.com"
            required
          />
        </div>
      </div>

      <!-- Step 2: 추가 정보 -->
      <div v-if="currentStep === 1" class="step-content">
        <h3>추가 정보</h3>
        <div class="form-group">
          <label for="phone">전화번호</label>
          <input 
            id="phone" 
            v-model="formData.phone" 
            type="tel" 
            placeholder="010-0000-0000"
          />
        </div>
        <div class="form-group">
          <label for="company">회사명</label>
          <input 
            id="company" 
            v-model="formData.company" 
            type="text" 
            placeholder="회사명을 입력하세요"
          />
        </div>
      </div>

      <!-- Step 3: 설정 선택 -->
      <div v-if="currentStep === 2" class="step-content">
        <h3>설정 선택</h3>
        <div class="form-group">
          <label>알림 설정</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="formData.notifications.email"
              />
              이메일 알림 받기
            </label>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="formData.notifications.sms"
              />
              SMS 알림 받기
            </label>
          </div>
        </div>
        <div class="form-group">
          <label for="language">언어 선택</label>
          <select id="language" v-model="formData.language">
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </div>

      <!-- Step 4: 완료 -->
      <div v-if="currentStep === 3" class="step-content">
        <h3>설정 완료</h3>
        <div class="summary">
          <h4>입력하신 정보</h4>
          <ul>
            <li><strong>이름:</strong> {{ formData.name }}</li>
            <li><strong>이메일:</strong> {{ formData.email }}</li>
            <li><strong>전화번호:</strong> {{ formData.phone || '미입력' }}</li>
            <li><strong>회사명:</strong> {{ formData.company || '미입력' }}</li>
            <li><strong>이메일 알림:</strong> {{ formData.notifications.email ? '예' : '아니오' }}</li>
            <li><strong>SMS 알림:</strong> {{ formData.notifications.sms ? '예' : '아니오' }}</li>
            <li><strong>언어:</strong> {{ getLanguageName(formData.language) }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="wizard-footer">
      <button 
        v-if="currentStep > 0" 
        @click="previousStep" 
        class="btn btn-secondary"
      >
        이전
      </button>
      
      <button 
        v-if="currentStep < totalSteps - 1" 
        @click="nextStep" 
        class="btn btn-primary"
        :disabled="!canProceed"
      >
        다음
      </button>
      
      <button 
        v-if="currentStep === totalSteps - 1" 
        @click="completeWizard" 
        class="btn btn-success"
      >
        완료
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentStep = ref(0)
const totalSteps = 4

const formData = ref({
  name: '',
  email: '',
  phone: '',
  company: '',
  notifications: {
    email: false,
    sms: false
  },
  language: 'ko'
})

const progressPercentage = computed(() => {
  return ((currentStep.value + 1) / totalSteps) * 100
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return formData.value.name && formData.value.email && isValidEmail(formData.value.email)
    case 1:
      return true // 선택 사항이므로 항상 진행 가능
    case 2:
      return true // 선택 사항이므로 항상 진행 가능
    default:
      return true
  }
})

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < totalSteps - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const completeWizard = () => {
  console.log('Wizard completed with data:', formData.value)
  alert('설정이 완료되었습니다!')
  // 여기에 API 호출이나 다른 완료 로직을 추가할 수 있습니다
}

const getLanguageName = (code) => {
  const languages = {
    ko: '한국어',
    en: 'English',
    ja: '日本語'
  }
  return languages[code] || code
}
</script>

<style scoped>
.wizard-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.wizard-header {
  margin-bottom: 2rem;
}

.wizard-header h2 {
  color: #333;
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #42b883;
  transition: width 0.3s ease;
}

.step-indicator {
  text-align: right;
  color: #666;
  font-size: 0.9rem;
}

.wizard-content {
  min-height: 300px;
  margin-bottom: 2rem;
}

.step-content h3 {
  color: #42b883;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #42b883;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-weight: normal;
}

.checkbox-label input {
  width: auto;
  margin-right: 0.5rem;
}

.summary {
  background-color: #f5f5f5;
  padding: 1.5rem;
  border-radius: 4px;
}

.summary h4 {
  color: #333;
  margin-bottom: 1rem;
}

.summary ul {
  list-style: none;
  padding: 0;
}

.summary li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.summary li:last-child {
  border-bottom: none;
}

.wizard-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #35a372;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}
</style>