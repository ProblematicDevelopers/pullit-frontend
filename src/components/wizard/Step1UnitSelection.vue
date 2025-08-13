<!--
  시험지 마법사 Step 1: 단원선택 컴포넌트
  
  이 컴포넌트는 시험지 생성 마법사의 첫 번째 단계를 담당합니다.
  주요 기능:
  - 과목 정보 표시 (상단 헤더)
  - 왼쪽 패널: 단원 트리 구조로 챕터 및 단원지 선택
  - 오른쪽 패널: 문제 유형 설정 및 문항 수 설정
  - 하단: 다음 단계 진행 버튼
  
  데이터 흐름:
  - Pinia store에서 단원 데이터 및 설정 관리
  - 사용자 선택에 따른 실시간 문항 수 계산
  - 선택 완료 시 Step 2로 진행
-->

<template>
  <div class="step1-container">
    <!-- 과목 정보 헤더 -->
    <div class="subject-header">
      <div class="subject-info">
        <!-- 과목명과 교육과정 정보 표시 -->
        <h3 class="subject-title">{{ subject.name }}</h3>
        <p class="subject-curriculum">{{ subject.curriculum }}</p>
      </div>
      
      <!-- 헤더 액션 버튼들 -->
      <div class="header-actions">
        <button 
          class="btn btn-secondary btn-sm" 
          @click="handleResearch"
          title="다른 과목 검색"
        >
          재검색
        </button>
        <button 
          class="btn btn-primary btn-sm" 
          @click="handleShowScope"
          title="선택된 단원의 출제범위 보기"
        >
          출제범위
        </button>
      </div>
    </div>

    <!-- 메인 콘텐츠 영역 -->
    <div class="main-content">
      <!-- 왼쪽 패널: 단원 트리 -->
      <div class="left-panel">
        <!-- 단원 선택 패널 헤더 -->
        <div class="panel-header">
          <h4>단원 선택</h4>
          <div class="select-actions">
            <!-- 전체 선택/해제 버튼 -->
            <button 
              class="btn btn-text btn-sm" 
              @click="selectAll"
              title="모든 단원지 선택"
            >
              전체선택
            </button>
            <button 
              class="btn btn-text btn-sm" 
              @click="deselectAll"
              title="모든 단원지 선택 해제"
            >
              전체해제
            </button>
          </div>
        </div>
        
        <!-- 단원 트리 구조 -->
        <div class="unit-tree">
          <div 
            v-for="chapter in chapters" 
            :key="chapter.id"
            class="chapter-item"
          >
            <!-- 챕터 헤더 (클릭 시 펼치기/접기) -->
            <div 
              class="chapter-header"
              @click="toggleChapter(chapter.id)"
            >
              <div class="chapter-info">
                <!-- 펼침/접힘 표시 화살표 -->
                <span 
                  class="expand-icon"
                  :class="{ expanded: chapter.expanded }"
                >
                  ▶
                </span>
                <span class="chapter-name">{{ chapter.name }}</span>
              </div>
              <!-- 챕터 내 선택된 문항 수 표시 -->
              <span class="question-count">
                {{ getChapterQuestionCount(chapter) }}문항
              </span>
            </div>

            <!-- 단원지 목록 (챕터가 펼쳐졌을 때만 표시) -->
            <div 
              v-if="chapter.expanded" 
              class="papers-list"
            >
              <div 
                v-for="paper in chapter.papers"
                :key="paper.id"
                class="paper-item"
              >
                <!-- 단원지 체크박스 -->
                <label class="form-check">
                  <input
                    type="checkbox"
                    v-model="paper.selected"
                    @change="updateQuestionCounts"
                  />
                  <span class="paper-title">{{ paper.title }}</span>
                  <span class="paper-count">({{ paper.questionCount }}문항)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽 패널: 문제 설정 -->
      <div class="right-panel">
        <!-- 문제 유형 설정 섹션 -->
        <div class="settings-section">
          <h4>문제 유형</h4>
          
          <!-- 문제 정렬 방식 선택 -->
          <div class="form-group">
            <label>문제 유형</label>
            <select class="form-control" v-model="wizardData.testType">
              <option value="단원순">단원순</option>
              <option value="난이도순">난이도순</option>
              <option value="혼합">혼합</option>
            </select>
          </div>
          
          <!-- 기본 난이도 설정 -->
          <div class="form-group">
            <label>기본 난이도</label>
            <select class="form-control" v-model="wizardData.difficulty">
              <option value="하">하</option>
              <option value="중">중</option>
              <option value="상">상</option>
            </select>
          </div>
        </div>

        <!-- 문항 수 설정 섹션 -->
        <div class="settings-section">
          <h4>문항 수 설정</h4>
          
          <!-- 난이도별 문항 수 입력 -->
          <div class="difficulty-settings">
            <div class="difficulty-item">
              <label>하 수준</label>
              <input 
                type="number" 
                class="form-control"
                v-model.number="wizardData.questionTypes['하']"
                :max="availableQuestionsByDifficulty['하']"
                min="0"
                @input="validateQuestionCount('하')"
              />
              <span class="available-count">
                / {{ availableQuestionsByDifficulty['하'] }}
              </span>
            </div>
            
            <div class="difficulty-item">
              <label>중 수준</label>
              <input 
                type="number" 
                class="form-control"
                v-model.number="wizardData.questionTypes['중']"
                :max="availableQuestionsByDifficulty['중']"
                min="0"
                @input="validateQuestionCount('중')"
              />
              <span class="available-count">
                / {{ availableQuestionsByDifficulty['중'] }}
              </span>
            </div>
            
            <div class="difficulty-item">
              <label>상 수준</label>
              <input 
                type="number" 
                class="form-control"
                v-model.number="wizardData.questionTypes['상']"
                :max="availableQuestionsByDifficulty['상']"
                min="0"
                @input="validateQuestionCount('상')"
              />
              <span class="available-count">
                / {{ availableQuestionsByDifficulty['상'] }}
              </span>
            </div>
          </div>
          
          <!-- 문항 수 요약 -->
          <div class="total-summary">
            <div class="summary-item">
              <span class="label">선택된 문항:</span>
              <span class="value">{{ totalSelectedQuestions }}문항</span>
            </div>
            <div class="summary-item">
              <span class="label">출제할 문항:</span>
              <span class="value primary">{{ totalWizardQuestions }}문항</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 액션 버튼들 -->
    <div class="footer-actions">
      <button 
        class="btn btn-secondary" 
        @click="handleCancel"
      >
        취소
      </button>
      <button 
        class="btn btn-primary btn-lg"
        :disabled="!canProceedToStep2"
        @click="handleNextStep"
      >
        STEP 2 문항 편집 →
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Step1UnitSelection 컴포넌트 스크립트
 * 
 * Vue 3 Composition API와 Pinia를 사용하여 구현되었습니다.
 * 단원 선택 및 문항 설정 로직을 처리합니다.
 */

import { defineEmits } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { storeToRefs } from 'pinia'
import { closePopup, sendToParent } from '@/utils/popup'

// Events 정의
const emit = defineEmits([
  'next',      // 다음 단계로 진행
  'cancel',    // 취소
  'research',  // 재검색
  'show-scope' // 출제범위 보기
])

// Pinia store 사용
const store = useTestBankStore()

// 반응형 상태 데이터 가져오기
const { 
  subject, 
  chapters, 
  wizardData, 
  selectedPapers,
  totalSelectedQuestions, 
  totalWizardQuestions,
  availableQuestionsByDifficulty,
  canProceedToStep2
} = storeToRefs(store)

// Store actions 가져오기
const { 
  toggleChapter, 
  selectAll, 
  deselectAll, 
  setCurrentStep,
  updateQuestionCounts,
  setQuestionCount,
  proceedToStep2
} = store

/**
 * 챕터 내 선택된 문항 수 계산
 * @param {Object} chapter - 챕터 객체
 * @returns {Number} 선택된 문항 수
 */
const getChapterQuestionCount = (chapter) => {
  return chapter.papers.reduce((sum, paper) => {
    return sum + (paper.selected ? paper.questionCount : 0)
  }, 0)
}

/**
 * 문항 수 입력값 유효성 검사
 * 사용 가능한 문항 수를 초과하지 않도록 제한합니다.
 * @param {String} difficulty - 난이도 ('하', '중', '상')
 */
const validateQuestionCount = (difficulty) => {
  const currentValue = wizardData.value.questionTypes[difficulty]
  const maxValue = availableQuestionsByDifficulty.value[difficulty]
  
  // 최대값 초과 시 최대값으로 제한
  if (currentValue > maxValue) {
    setQuestionCount(difficulty, maxValue)
  }
  
  // 음수 방지
  if (currentValue < 0) {
    setQuestionCount(difficulty, 0)
  }
}

/**
 * 다음 단계 진행 핸들러
 * Step 2로 이동합니다.
 */
const handleNextStep = () => {
  if (canProceedToStep2.value) {
    // Pinia store를 통해 Step 2로 진행
    const success = proceedToStep2()
    
    if (success) {
      // 부모 컴포넌트나 팝업에 진행 완료 알림
      emit('next')
      
      // 팝업인 경우 부모 창에 알림
      sendToParent('STEP_CHANGED', { step: 2 })
    }
  }
}

/**
 * 취소 버튼 핸들러
 * 마법사를 종료하고 팝업을 닫습니다.
 */
const handleCancel = () => {
  const confirmCancel = confirm('시험지 작성을 취소하시겠습니까? 입력한 내용이 삭제됩니다.')
  
  if (confirmCancel) {
    // 팝업인 경우 닫기
    closePopup({ action: 'cancelled' })
    
    // 일반 모달인 경우 부모에 취소 이벤트 전달
    emit('cancel')
  }
}

/**
 * 재검색 버튼 핸들러
 * 과목 선택 화면으로 돌아갑니다.
 */
const handleResearch = () => {
  emit('research')
  sendToParent('RESEARCH_REQUESTED')
}

/**
 * 출제범위 보기 핸들러
 * 선택된 단원들의 상세 출제범위를 표시합니다.
 */
const handleShowScope = () => {
  const selectedPapersData = selectedPapers.value
  
  if (selectedPapersData.length === 0) {
    alert('먼저 단원을 선택해주세요.')
    return
  }
  
  emit('show-scope', selectedPapersData)
  sendToParent('SHOW_SCOPE_REQUESTED', selectedPapersData)
}
</script>

<style scoped>
/**
 * Step1UnitSelection 컴포넌트 스타일
 * 
 * 레이아웃:
 * - 상단: 과목 정보 헤더
 * - 중간: 좌우 분할 레이아웃 (단원 선택 + 설정 패널)
 * - 하단: 액션 버튼
 */

.step1-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary, #f9fafb);
}

/* 과목 정보 헤더 */
.subject-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 0.1));
}

.subject-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.subject-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0;
}

.subject-curriculum {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* 메인 콘텐츠 영역 */
.main-content {
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 1.5rem 2rem;
  overflow: hidden;
}

/* 왼쪽 패널: 단원 트리 */
.left-panel {
  flex: 2;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 0.1));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 오른쪽 패널: 설정 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 패널 헤더 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--gray-50, #f9fafb);
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.select-actions {
  display: flex;
  gap: 0.5rem;
}

/* 단원 트리 */
.unit-tree {
  flex: 1;
  overflow-y: auto;
}

.chapter-item {
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.chapter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chapter-header:hover {
  background: var(--gray-50, #f9fafb);
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.expand-icon {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  transition: transform 0.2s ease;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.chapter-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.question-count {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

/* 단원지 목록 */
.papers-list {
  background: var(--gray-50, #f9fafb);
  padding: 0.5rem 0;
}

.paper-item {
  padding: 0.5rem 1.25rem 0.5rem 3rem;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.paper-title {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
}

.paper-count {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
}

/* 설정 섹션 */
.settings-section {
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 0.1));
  padding: 1.25rem;
}

.settings-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

/* 난이도별 문항 수 설정 */
.difficulty-settings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.difficulty-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.difficulty-item label {
  width: 60px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin: 0;
}

.difficulty-item input {
  flex: 1;
  max-width: 80px;
}

.available-count {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
}

/* 문항 수 요약 */
.total-summary {
  border-top: 1px solid var(--border-color, #e5e7eb);
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item .label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

.summary-item .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.summary-item .value.primary {
  color: var(--primary, #3b82f6);
  font-size: 1rem;
}

/* 하단 액션 버튼 */
.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: white;
  border-top: 1px solid var(--border-color, #e5e7eb);
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 0.1));
}

/* 버튼 기본 스타일 */
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

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-primary {
  background: var(--primary, #3b82f6);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark, #2563eb);
}

.btn-primary:disabled {
  background: var(--gray-300, #d1d5db);
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--gray-200, #e5e7eb);
  color: var(--text-primary, #111827);
}

.btn-secondary:hover {
  background: var(--gray-300, #d1d5db);
}

.btn-text {
  background: transparent;
  color: var(--primary, #3b82f6);
}

.btn-text:hover {
  background: var(--primary-light, #dbeafe);
}

/* 태블릿 반응형 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .left-panel {
    flex: none;
    max-height: 400px;
  }
  
  .right-panel {
    flex: none;
  }
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .subject-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .footer-actions {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .footer-actions .btn {
    width: 100%;
  }
}
</style>