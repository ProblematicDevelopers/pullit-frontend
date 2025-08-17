<!--
  시험지 마법사 메인 뷰 컴포넌트
  
  이 컴포넌트는 팝업 창에서 실행되는 시험지 생성 마법사의 메인 페이지입니다.
  3단계로 구성된 마법사의 전체 흐름을 관리합니다:
  
  Step 1: 단원선택 - 과목, 단원 선택 및 문제 설정
  Step 2: 문항편집 - 선택된 문제들의 편집 및 순서 조정
  Step 3: 시험지저장 - 최종 시험지 생성 및 저장
  
  주요 기능:
  - 단계별 컴포넌트 전환
  - 진행 상태 관리
  - 팝업 창 닫기 처리
  - 데이터 보존 및 전달
-->

<template>
  <div class="test-wizard-view">
    <!-- 마법사 헤더: 진행 단계 표시 및 닫기 버튼 -->
    <WizardHeader 
      :currentStep="currentStep"
      @close="handleClose"
    />
    
    <!-- 마법사 콘텐츠 영역 -->
    <div class="wizard-content">
      <!-- Step 0: 모드 선택 (신규/편집) -->
      <Step0SelectMode
        v-if="currentStep === 0"
        @next="handleStep0Next"
        @cancel="handleCancel"
        @selectNew="handleSelectNew"
        @selectExisting="handleSelectExisting"
      />
      
      <!-- Step 1: 단원선택 -->
      <Step1UnitSelection
        v-else-if="currentStep === 1"
        :mode="store.mode"
        :examId="store.selectedExam?.id"
        @next="handleStep1Next"
        @cancel="handleCancel"
        @research="handleResearch"
        @show-scope="handleShowScope"
      />
      
      <!-- Step 2: 문항선택 -->
      <Step2ItemSelection
        v-else-if="currentStep === 2"
        :examInfo="store.examInfo"
        @back="handleStep2Back"
        @next="handleStep2Next"
      />
      
      <!-- Step 3: 시험지저장 (향후 구현) -->
      <div 
        v-else-if="currentStep === 3"
        class="step-placeholder"
      >
        <div class="placeholder-content">
          <h3>Step 3: 시험지저장</h3>
          <p>완성된 시험지를 저장하고 다운로드하는 단계입니다.</p>
          <p>현재 개발 중입니다.</p>
          
          <!-- 임시 네비게이션 버튼 -->
          <div class="temp-navigation">
            <button 
              class="btn btn-secondary"
              @click="goToStep(2)"
            >
              ← Step 2로 돌아가기
            </button>
            <button 
              class="btn btn-success"
              @click="handleComplete"
            >
              마법사 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * TestWizardView 컴포넌트 스크립트
 * 
 * 시험지 마법사의 전체 흐름을 관리하는 메인 컴포넌트입니다.
 * Pinia store를 통해 상태를 관리하고, 각 단계 간의 전환을 처리합니다.
 */

import { onMounted, onUnmounted } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { storeToRefs } from 'pinia'
import { isPopupWindow, closePopup, sendToParent } from '@/utils/popup'

// 컴포넌트 import
import WizardHeader from '@/components/wizard/WizardHeader.vue'
import Step0SelectMode from '@/components/wizard/Step0SelectMode.vue'
import Step1UnitSelection from '@/components/wizard/Step1UnitSelection.vue'
import Step2ItemSelection from '@/components/wizard/Step2ItemSelection.vue'

// Props 정의
const props = defineProps({
  isModal: {
    type: Boolean,
    default: false
  }
})

// Emit 정의
const emit = defineEmits(['close'])

// Pinia store 사용
const store = useTestBankStore()
const { currentStep } = storeToRefs(store)
const { setCurrentStep, resetWizard } = store

/**
 * 컴포넌트 마운트 시 초기화
 * 팝업 창에서 전달받은 데이터가 있다면 store에 설정합니다.
 */
onMounted(() => {
  console.log('시험지 마법사가 시작되었습니다.')
  
  // localStorage에서 전달받은 과목 데이터 확인
  const subjectData = localStorage.getItem('wizard_subject_data')
  if (subjectData) {
    try {
      const subject = JSON.parse(subjectData)
      store.setSubject(subject)
      console.log('과목 데이터 로드됨:', subject)
    } catch (error) {
      console.error('과목 데이터 파싱 실패:', error)
    }
  }
  
  // 브라우저 새로고침 방지 경고
  window.addEventListener('beforeunload', handleBeforeUnload)
})

/**
 * 컴포넌트 언마운트 시 정리
 */
onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

/**
 * 브라우저 새로고침/닫기 시 경고 메시지
 * @param {Event} event - beforeunload 이벤트
 */
const handleBeforeUnload = (event) => {
  // 작업 중인 데이터가 있을 때만 경고
  if (store.selectedPapers.length > 0 || store.totalWizardQuestions > 0) {
    event.preventDefault()
    event.returnValue = '작업 중인 내용이 있습니다. 정말 페이지를 벗어나시겠습니까?'
    return event.returnValue
  }
}

/**
 * Step 0 완료 및 Step 1로 진행 핸들러
 */
const handleStep0Next = () => {
  console.log('Step 0 완료, 다음 단계로 진행')
  // mode가 설정되어 있어야 진행 가능
  if (store.mode) {
    // 기존 시험지 편집 모드면 Step2로 바로 이동
    if (store.mode === 'edit' && store.selectedExam) {
      console.log('기존 시험지 편집 모드 - Step2로 바로 이동')
      setCurrentStep(2)
    } else {
      // 새 시험지 생성 모드면 Step1로 이동
      setCurrentStep(1)
    }
  }
}

/**
 * 새 시험지 생성 선택 핸들러
 */
const handleSelectNew = () => {
  console.log('새 시험지 생성 선택')
  store.setMode('new')
  store.setSelectedExam(null)
}

/**
 * 기존 시험지 편집 선택 핸들러
 * @param {Object} exam - 선택된 기존 시험지
 */
const handleSelectExisting = (exam) => {
  console.log('기존 시험지 편집 선택:', exam)
  store.setMode('edit')
  store.setSelectedExam(exam)
}

/**
 * Step 1 완료 및 Step 2로 진행 핸들러
 */
const handleStep1Next = () => {
  console.log('Step 1 완료, Step 2로 진행')
  setCurrentStep(2)
}

/**
 * Step 2에서 뒤로가기 핸들러
 */
const handleStep2Back = () => {
  console.log('Step 2에서 뒤로가기, mode:', store.mode)
  // 새 시험지 모드면 Step1로, 기존 시험지 편집 모드면 Step0로
  if (store.mode === 'new') {
    setCurrentStep(1)
  } else {
    setCurrentStep(0)
  }
}

/**
 * Step 2 완료 및 Step 3로 진행 핸들러
 */
const handleStep2Next = () => {
  console.log('Step 2 완료, Step 3로 진행')
  setCurrentStep(3)
}

/**
 * 특정 단계로 이동
 * @param {Number} step - 이동할 단계 번호
 */
const goToStep = (step) => {
  setCurrentStep(step)
  console.log(`Step ${step}로 이동`)
}

/**
 * 마법사 취소 핸들러
 */
const handleCancel = () => {
  const confirmCancel = confirm('시험지 작성을 취소하시겠습니까? 입력한 내용이 삭제됩니다.')
  
  if (confirmCancel) {
    handleClose()
  }
}

/**
 * 재검색 핸들러
 * 과목 선택 화면으로 돌아가거나 부모 창에 알림을 보냅니다.
 */
const handleResearch = () => {
  if (isPopupWindow()) {
    // 팝업인 경우 부모 창에 재검색 요청 알림
    sendToParent('RESEARCH_REQUESTED')
    closePopup({ action: 'research' })
  } else {
    // 일반 모달인 경우 첫 번째 단계로 돌아가거나 이벤트 처리
    console.log('재검색 요청')
  }
}

/**
 * 출제범위 보기 핸들러
 * @param {Array} selectedPapers - 선택된 단원지 목록
 */
const handleShowScope = (selectedPapers) => {
  console.log('출제범위 보기:', selectedPapers)
  
  // 출제범위 모달 또는 팝업 열기 (향후 구현)
  // 현재는 콘솔 로그로 대체
  alert(`선택된 ${selectedPapers.length}개 단원의 출제범위를 표시합니다.`)
}

/**
 * 마법사 완료 핸들러
 */
const handleComplete = () => {
  const confirmComplete = confirm('시험지 생성을 완료하시겠습니까?')
  
  if (confirmComplete) {
    // 최종 결과 데이터 생성
    const result = {
      action: 'completed',
      subject: store.subject,
      selectedPapers: store.selectedPapers,
      wizardData: store.wizardData,
      selectedQuestions: store.selectedQuestions,
      completedAt: new Date().toISOString()
    }
    
    console.log('마법사 완료:', result)
    
    // 팝업인 경우 결과와 함께 닫기
    if (isPopupWindow()) {
      closePopup(result)
    } else {
      // 일반 모달인 경우 부모에 완료 이벤트 전달
      // emit('completed', result)
    }
  }
}

/**
 * 마법사 닫기 핸들러
 */
const handleClose = () => {
  // 작업 중인 내용이 있는지 확인
  const hasUnsavedWork = store.selectedPapers.length > 0 || store.totalWizardQuestions > 0
  
  if (hasUnsavedWork) {
    const confirmClose = confirm('작업 중인 내용이 있습니다. 정말 닫으시겠습니까?')
    if (!confirmClose) {
      return
    }
  }
  
  // 데이터 정리
  resetWizard()
  
  // 모달 모드인 경우
  if (props.isModal) {
    emit('close')
  } 
  // 팝업인 경우 창 닫기
  else if (isPopupWindow()) {
    closePopup({ action: 'closed' })
  }
}
</script>

<style scoped>
/**
 * TestWizardView 컴포넌트 스타일
 * 
 * 팝업 창 전체를 사용하는 전체 화면 레이아웃입니다.
 * 헤더와 콘텐츠 영역으로 구성됩니다.
 */

.test-wizard-view {
  display: flex;
  flex-direction: column;
  width: 100vw; /* 팝업 창 전체 너비 사용 */
  height: 100vh; /* 팝업 창 전체 높이 사용 */
  background: var(--bg-primary, #ffffff);
  overflow: hidden;
  position: fixed; /* 전체 화면 고정 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.wizard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Step 2, 3 임시 플레이스홀더 스타일 */
.step-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, #f9fafb);
}

.placeholder-content {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 0.1));
  max-width: 500px;
}

.placeholder-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.placeholder-content p {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary, #6b7280);
  line-height: 1.5;
}

.temp-navigation {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

/* 버튼 스타일 */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--primary, #3b82f6);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark, #2563eb);
}

.btn-secondary {
  background: var(--gray-200, #e5e7eb);
  color: var(--text-primary, #111827);
}

.btn-secondary:hover {
  background: var(--gray-300, #d1d5db);
}

.btn-success {
  background: var(--success, #10b981);
  color: white;
}

.btn-success:hover {
  background: var(--success-dark, #059669);
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .placeholder-content {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .temp-navigation {
    flex-direction: column;
  }
  
  .temp-navigation .btn {
    width: 100%;
  }
}

/* CSS 변수 정의 (기본 디자인 시스템) */
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #dbeafe;
  --success: #10b981;
  --success-dark: #059669;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-disabled: #9ca3af;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --border-color: #e5e7eb;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-500: #6b7280;
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

/* 다크 모드 지원 (선택적) */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-disabled: #6b7280;
    --bg-primary: #111827;
    --bg-secondary: #1f2937;
    --border-color: #374151;
    --gray-50: #1f2937;
    --gray-100: #374151;
    --gray-200: #4b5563;
    --gray-300: #6b7280;
    --gray-500: #9ca3af;
  }
}
</style>