<!--
  시험지 마법사 헤더 컴포넌트
  
  이 컴포넌트는 시험지 생성 마법사의 상단 헤더를 표시합니다.
  - 3단계 진행 상황 표시 (Step 1: 방식선택, Step 2: 문항선택, Step 3: 시험지저장)
  - 각 단계의 활성화/완료 상태 시각적 표현
  - 팝업 창 닫기 버튼
  
  Props:
  - currentStep: 현재 진행 중인 단계 (1, 2, 3)
  
  Events:
  - close: 팝업 창 닫기 이벤트
-->

<template>
  <div class="wizard-header">
    <!-- 3단계 진행 표시 -->
    <div class="wizard-steps">
      <div class="step-container">
        <!-- Step 1: 방식선택 -->
        <div 
          class="step"
          :class="{ 
            'active': currentStep === 1, 
            'completed': currentStep > 1 
          }"
        >
          <!-- 단계 번호 또는 완료 체크 아이콘 -->
          <div class="step-circle">
            <span v-if="currentStep > 1" class="check-icon">✓</span>
            <span v-else>1</span>
          </div>
          
          <!-- 단계 정보 -->
          <div class="step-info">
            <div class="step-label">STEP 1</div>
            <div class="step-title">방식선택</div>
          </div>
        </div>

        <!-- 화살표 1 (Step 1 → Step 2) -->
        <div 
          class="step-arrow"
          :class="{ 'active': currentStep > 1 }"
        >
          <!-- SVG 화살표 아이콘 -->
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
            <path 
              d="M1 6L19 6M19 6L14 1M19 6L14 11" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- Step 2: 문항선택 -->
        <div 
          class="step"
          :class="{ 
            'active': currentStep === 2, 
            'completed': currentStep > 2 
          }"
        >
          <div class="step-circle">
            <span v-if="currentStep > 2" class="check-icon">✓</span>
            <span v-else>2</span>
          </div>
          <div class="step-info">
            <div class="step-label">STEP 2</div>
            <div class="step-title">문항선택</div>
          </div>
        </div>

        <!-- 화살표 2 (Step 2 → Step 3) -->
        <div 
          class="step-arrow"
          :class="{ 'active': currentStep > 2 }"
        >
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
            <path 
              d="M1 6L19 6M19 6L14 1M19 6L14 11" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- Step 3: 시험지저장 -->
        <div 
          class="step"
          :class="{ 
            'active': currentStep === 3, 
            'completed': currentStep > 3 
          }"
        >
          <div class="step-circle">
            <span v-if="currentStep > 3" class="check-icon">✓</span>
            <span v-else>3</span>
          </div>
          <div class="step-info">
            <div class="step-label">STEP 3</div>
            <div class="step-title">시험지저장</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 팝업 닫기 버튼 -->
    <button 
      class="close-button"
      @click="handleClose"
      type="button"
      title="닫기"
    >
      <!-- X 아이콘 -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path 
          d="M18 6L6 18M6 6L18 18" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
/**
 * 시험지 마법사 헤더 컴포넌트 스크립트
 * 
 * Vue 3 Composition API를 사용하여 구현되었습니다.
 * Props와 Events를 정의하고 닫기 동작을 처리합니다.
 */

import { defineProps, defineEmits } from 'vue'
import { isPopupWindow, closePopup } from '@/utils/popup'

// Props 정의: 부모 컴포넌트로부터 받을 데이터
const props = defineProps({
  /**
   * 현재 진행 중인 단계
   * @type {Number}
   * @required
   * @default 1
   * @description 1: 단원선택, 2: 문항편집, 3: 시험지저장
   */
  currentStep: {
    type: Number,
    required: true,
    default: 1,
    validator: (value) => {
      // 1, 2, 3 중 하나의 값만 허용
      return [1, 2, 3].includes(value)
    }
  }
})

// Events 정의: 부모 컴포넌트로 전달할 이벤트
const emit = defineEmits([
  /**
   * 닫기 버튼 클릭 이벤트
   * @event close
   */
  'close'
])

/**
 * 닫기 버튼 클릭 핸들러
 * 팝업 창인 경우와 일반 모달인 경우를 구분하여 처리합니다.
 */
const handleClose = () => {
  // 팝업 창인지 확인
  if (isPopupWindow()) {
    // 팝업 창인 경우: 창을 닫습니다
    closePopup()
  } else {
    // 일반 모달인 경우: 부모 컴포넌트에 닫기 이벤트 전달
    emit('close')
  }
}
</script>

<style scoped>
/**
 * 시험지 마법사 헤더 스타일
 * 
 * 3단계 진행 표시와 닫기 버튼을 포함한 헤더 레이아웃을 정의합니다.
 * 각 단계의 상태에 따른 시각적 변화도 포함됩니다.
 */

.wizard-header {
  /* 헤더 전체 레이아웃 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 0.1));
  position: relative;
  z-index: 10;
}

.wizard-steps {
  /* 진행 단계 영역 */
  flex: 1;
  display: flex;
  justify-content: center;
}

.step-container {
  /* 3단계 + 2개 화살표 컨테이너 */
  display: flex;
  align-items: center;
  gap: 2rem;
}

.step {
  /* 각 단계 기본 스타일 */
  display: flex;
  align-items: center;
  gap: 0.75rem;
  opacity: 0.4; /* 비활성 상태 */
  transition: all 0.3s ease;
}

/* 활성 상태 및 완료 상태 */
.step.active,
.step.completed {
  opacity: 1;
}

.step-circle {
  /* 단계 번호/체크 아이콘을 담는 원형 영역 */
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid var(--gray-300, #d1d5db);
  background: white;
  color: var(--gray-500, #6b7280);
  transition: all 0.3s ease;
}

/* 활성 단계의 원형 스타일 */
.step.active .step-circle {
  border-color: var(--primary, #3b82f6);
  background: var(--primary, #3b82f6);
  color: white;
}

/* 완료된 단계의 원형 스타일 */
.step.completed .step-circle {
  border-color: var(--success, #10b981);
  background: var(--success, #10b981);
  color: white;
}

.check-icon {
  /* 완료 체크 아이콘 */
  font-size: 1rem;
  font-weight: bold;
}

.step-info {
  /* 단계 정보 텍스트 영역 */
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.step-label {
  /* "STEP 1" 라벨 */
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-disabled, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 활성/완료 단계의 라벨 색상 */
.step.active .step-label,
.step.completed .step-label {
  color: var(--primary, #3b82f6);
}

.step-title {
  /* "단원선택" 등의 단계 제목 */
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
}

/* 활성/완료 단계의 제목 색상 */
.step.active .step-title,
.step.completed .step-title {
  color: var(--text-primary, #111827);
}

.step-arrow {
  /* 단계 간 화살표 */
  color: var(--gray-300, #d1d5db);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

/* 완료된 화살표 색상 */
.step-arrow.active {
  color: var(--success, #10b981);
}

.close-button {
  /* 닫기 버튼 */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  transition: all 0.2s ease;
}

.close-button:hover {
  /* 호버 시 배경과 색상 변경 */
  background: var(--gray-100, #f3f4f6);
  color: var(--text-primary, #111827);
}

.close-button:active {
  /* 클릭 시 스케일 효과 */
  transform: scale(0.95);
}

/* 태블릿 이하 반응형 */
@media (max-width: 768px) {
  .wizard-header {
    padding: 1rem;
  }
  
  .step-container {
    gap: 1rem;
  }
  
  .step-info {
    /* 모바일에서는 텍스트 정보 숨김 */
    display: none;
  }
  
  .step-circle {
    /* 모바일에서는 원형 크기 축소 */
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
}

/* 작은 모바일 화면 */
@media (max-width: 480px) {
  .wizard-header {
    padding: 0.75rem 1rem;
  }
  
  .step-container {
    gap: 0.75rem;
  }
  
  .close-button {
    width: 32px;
    height: 32px;
  }
  
  .close-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>