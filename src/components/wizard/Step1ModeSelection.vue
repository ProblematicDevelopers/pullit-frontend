<!--
  Step1: 생성 방식 선택
  
  이 컴포넌트는 시험지 생성 방식을 선택하는 화면입니다.
  - 간편 생성: AI/랜덤으로 빠르게 문항 생성
  - 문항 직접 선택: 세밀하게 문항을 하나씩 선택
-->

<template>
  <div class="step1-mode-selection">
    <!-- 헤더 -->
    <header class="step-header">
      <button class="btn-back" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        이전
      </button>
      
      <div class="header-info">
        <h2>생성 방식 선택</h2>
        <p class="header-desc">시험지를 만들 방식을 선택해주세요</p>
      </div>
    </header>

    <!-- 메인 컨텐츠 -->
    <div class="content-wrapper">
      <div class="mode-cards">
        <!-- 간편 생성 카드 -->
        <div 
          class="mode-card"
          :class="{ selected: selectedMode === 'simple' }"
          @click="selectMode('simple')"
        >
          <div class="card-icon simple">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M13 3L4.00999 20.892L6.45099 21.1105L9.85999 13H14.17L13 3Z" fill="currentColor"/>
              <path d="M17.96 11.0105L20 20L14.74 17.5005L11 3L17.96 11.0105Z" fill="currentColor"/>
            </svg>
          </div>
          
          <h3 class="card-title">간편 생성</h3>
          <p class="card-desc">
            학년과 과목, 문항 수만 선택하면<br/>
            AI가 자동으로 문항을 구성합니다
          </p>
          
          <ul class="feature-list">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              빠른 시험지 생성
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              난이도 자동 배분
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              단원별 균형 배치
            </li>
          </ul>
          
          <div class="card-badge">추천</div>
        </div>

        <!-- 문항 직접 선택 카드 -->
        <div 
          class="mode-card"
          :class="{ selected: selectedMode === 'manual' }"
          @click="selectMode('manual')"
        >
          <div class="card-icon manual">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          
          <h3 class="card-title">문항 직접 선택</h3>
          <p class="card-desc">
            문항을 하나씩 검토하면서<br/>
            원하는 문항만 선택합니다
          </p>
          
          <ul class="feature-list">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              세밀한 문항 선택
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              문항별 미리보기
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              자유로운 순서 조정
            </li>
          </ul>
        </div>
      </div>

    </div>

    <!-- 하단 액션 버튼 -->
    <footer class="step-footer">
      <button class="btn btn-secondary" @click="handleBack">
        이전
      </button>
      
      <button 
        class="btn btn-primary"
        :disabled="!canProceed"
        @click="handleNext"
      >
        다음
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props & Emits
const props = defineProps({
  examInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['back', 'next'])

// State
const selectedMode = ref(null)

// Computed
const canProceed = computed(() => {
  return selectedMode.value !== null
})

// Methods
const selectMode = (mode) => {
  selectedMode.value = mode
}

const handleBack = () => {
  emit('back')
}

const handleNext = () => {
  if (!canProceed.value) return
  
  emit('next', { mode: selectedMode.value })
}
</script>

<style scoped>
.step1-mode-selection {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #F9FAFB;
}

/* 헤더 */
.step-header {
  padding: 24px;
  background: white;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

.header-info h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.header-desc {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

/* 메인 컨텐츠 */
.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.mode-card {
  position: relative;
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-card:hover {
  border-color: #9CA3AF;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.mode-card.selected {
  border-color: #3B82F6;
  background: #EFF6FF;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
}

.card-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.card-icon.simple {
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  color: white;
}

.card-icon.manual {
  background: linear-gradient(135deg, #F093FB 0%, #F5576C 100%);
  color: white;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px 0;
  text-align: center;
}

.card-desc {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  text-align: center;
  margin: 0 0 24px 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}

.feature-list svg {
  color: #10B981;
  flex-shrink: 0;
}

.card-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  background: #10B981;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 16px;
}


/* 하단 푸터 */
.step-footer {
  padding: 24px;
  background: white;
  border-top: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 버튼 */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563EB;
}

.btn-primary:disabled {
  background: #9CA3AF;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.btn-secondary:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

</style>