<!--
  문항 미리보기 모달
  
  Step 0 디자인 스타일을 적용한 깔끔한 모달
-->

<template>
  <div class="modal-overlay" @click="handleClose">
    <div class="modal-container" @click.stop>
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h3>문항 미리보기</h3>
        <button class="btn-close" @click="handleClose">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- 모달 바디 -->
      <div class="modal-body">
        <!-- 문항 정보 -->
        <div class="item-info-bar">
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2"/>
            </svg>
            문항 {{ item.itemNumber || item.itemId }}
          </span>
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2"/>
            </svg>
            {{ item.chapterName }}
          </span>
          <span :class="['info-item', 'difficulty', `level-${item.difficulty?.code}`]">
            {{ item.difficulty?.name || '난이도 미정' }}
          </span>
          <span class="info-item">
            {{ item.questionType?.name || '유형 미정' }}
          </span>
        </div>

        <!-- 지문 (있는 경우) -->
        <div v-if="item.passageContent" class="passage-section">
          <h4>지문</h4>
          <div class="passage-content" v-html="item.passageContent" v-mathjax></div>
        </div>

        <!-- 문제 -->
        <div class="question-section">
          <h4>문제</h4>
          <div v-if="item.questionHtml" class="question-content" v-html="item.questionHtml" v-mathjax></div>
          <div v-else-if="item.questionImageUrl" class="question-image">
            <img :src="item.questionImageUrl" :alt="`문항 ${item.itemId}`">
          </div>
          <div v-else class="no-content">
            문제 내용이 없습니다
          </div>
        </div>

        <!-- 선택지 (있는 경우) -->
        <div v-if="hasChoices" class="choices-section">
          <h4>선택지</h4>
          <div class="choices-list">
            <div v-for="(choice, index) in choices" :key="index" class="choice-item">
              <span class="choice-number">{{ choiceNumbers[index] }}</span>
              <div v-if="choice.html" v-html="choice.html" v-mathjax class="choice-content"></div>
              <div v-else-if="choice.text" class="choice-content">{{ choice.text }}</div>
            </div>
          </div>
        </div>

        <!-- 정답 (있는 경우) -->
        <div v-if="item.answer" class="answer-section">
          <h4>정답</h4>
          <div class="answer-content">
            <span class="answer-value">{{ item.answer }}</span>
            <div v-if="item.explanation" class="answer-explanation">
              <h5>해설</h5>
              <div v-html="item.explanation" v-mathjax></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">
          닫기
        </button>
        <button class="btn btn-primary" @click="handleSelect">
          이 문항 선택
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { useMathJax } from '@/composables/useMathJax'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'select'])

const store = useTestBankStore()

// MathJax 컴포저블 사용 - Vue 재렌더링 안전 설정
const { render: renderMath } = useMathJax({
  immediate: false,
  watchContent: false,  // Vue 재렌더링과 충돌 방지
  hideBeforeRender: false,  // 숨기지 않음
  clearFirst: false,  // 중요: 기존 MathJax 렌더링 유지
  debounceDelay: 100
})

// 선택지 데이터 처리
const choices = computed(() => {
  const choiceList = []
  if (props.item.choice1Html || props.item.choice1) {
    choiceList.push({ html: props.item.choice1Html, text: props.item.choice1 })
  }
  if (props.item.choice2Html || props.item.choice2) {
    choiceList.push({ html: props.item.choice2Html, text: props.item.choice2 })
  }
  if (props.item.choice3Html || props.item.choice3) {
    choiceList.push({ html: props.item.choice3Html, text: props.item.choice3 })
  }
  if (props.item.choice4Html || props.item.choice4) {
    choiceList.push({ html: props.item.choice4Html, text: props.item.choice4 })
  }
  if (props.item.choice5Html || props.item.choice5) {
    choiceList.push({ html: props.item.choice5Html, text: props.item.choice5 })
  }
  return choiceList
})

const hasChoices = computed(() => choices.value.length > 0)

const choiceNumbers = ['①', '②', '③', '④', '⑤']

// Methods
const handleClose = () => {
  emit('close')
}

const handleSelect = () => {
  store.addItem(props.item)
  emit('select', props.item)
  handleClose()
}

// ESC 키로 닫기
const handleEscape = (e) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

// item 변경 시 MathJax 렌더링
watch(() => props.item, async () => {
  await nextTick()
  await renderMath()
}, { deep: true })

onMounted(async () => {
  document.addEventListener('keydown', handleEscape)
  document.body.style.overflow = 'hidden'
  
  // MathJax 렌더링
  await nextTick()
  await renderMath()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* 오버레이 */
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
  padding: 2rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 모달 컨테이너 */
.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 모달 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e4e8;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #24292e;
  margin: 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: #586069;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f6f8fa;
  color: #24292e;
}

/* 모달 바디 */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* 문항 정보 바 */
.item-info-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem;
  background: #f6f8fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #586069;
}

.info-item svg {
  color: #959da5;
}

.info-item.difficulty {
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.info-item.difficulty.level-VL {
  background: #dcfce7;
  color: #166534;
}

.info-item.difficulty.level-L {
  background: #d1fae5;
  color: #065f46;
}

.info-item.difficulty.level-M {
  background: #fed7aa;
  color: #9a3412;
}

.info-item.difficulty.level-H {
  background: #fecaca;
  color: #991b1b;
}

.info-item.difficulty.level-VH {
  background: #fca5a5;
  color: #7f1d1d;
}

/* 섹션 스타일 */
.passage-section,
.question-section,
.choices-section,
.answer-section {
  margin-bottom: 1.5rem;
}

.passage-section h4,
.question-section h4,
.choices-section h4,
.answer-section h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #24292e;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 지문 콘텐츠 */
.passage-content {
  padding: 1rem;
  background: #f1f8ff;
  border-left: 3px solid #0366d6;
  border-radius: 4px;
  font-size: 0.938rem;
  line-height: 1.6;
  color: #24292e;
}

/* 문제 콘텐츠 */
.question-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #24292e;
}

.question-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  border: 1px solid #e1e4e8;
}

.no-content {
  padding: 2rem;
  text-align: center;
  color: #959da5;
  font-style: italic;
  background: #f6f8fa;
  border-radius: 8px;
}

/* 선택지 */
.choices-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f6f8fa;
  border-radius: 6px;
  border: 1px solid #e1e4e8;
}

.choice-number {
  font-weight: 600;
  color: #0366d6;
  flex-shrink: 0;
}

.choice-content {
  flex: 1;
  font-size: 0.938rem;
  line-height: 1.5;
  color: #24292e;
}

/* 정답 섹션 */
.answer-content {
  padding: 1rem;
  background: #dcfce7;
  border-radius: 8px;
  border: 1px solid #86efac;
}

.answer-value {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #166534;
  color: white;
  border-radius: 4px;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.answer-explanation h5 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #166534;
  margin: 0.75rem 0 0.5rem 0;
}

.answer-explanation div {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #166534;
}

/* 모달 푸터 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e1e4e8;
}

/* 버튼 */
.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: white;
  border: 1px solid #e1e4e8;
  color: #586069;
}

.btn-secondary:hover {
  background: #f6f8fa;
  border-color: #d1d5da;
}

.btn-primary {
  background: #0366d6;
  color: white;
}

.btn-primary:hover {
  background: #0256c7;
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .item-info-bar {
    gap: 0.5rem;
  }
}
</style>