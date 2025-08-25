<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>
          문제 {{ question?.questionNumber || question?.questionId || question?.id }} 상세보기
        </h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>문제 내용을 불러오는 중...</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="error-container">
          <div class="error-message">
            <p>{{ error }}</p>
            <button @click="loadQuestionHtml" class="retry-btn">다시 시도</button>
          </div>
        </div>

        <!-- 문제 내용 -->
        <div v-else>
          <!-- 문제 정보 -->
          <div class="question-info">
            <div class="info-row">
              <span class="label">정답 여부:</span>
              <span :class="question?.isCorrect ? 'correct' : 'incorrect'">
                {{ question?.isCorrect ? '정답' : '오답' }}
              </span>
            </div>

            <div class="info-row">
              <span class="label">내 답안:</span>
              <span class="answer" v-html="question?.answer || '답안 없음'"></span>
            </div>

            <div class="info-row">
              <span class="label">소요 시간:</span>
              <span>{{ question?.duration || 0 }}초</span>
            </div>

            <div v-if="question?.answeredAt" class="info-row">
              <span class="label">제출 시간:</span>
              <span>{{ formatDate(question.answeredAt) }}</span>
            </div>
          </div>

          <!-- 문제 HTML 내용 -->
          <div v-if="questionHtml || passageHtml" class="question-content">
            <h4>문제 내용</h4>
            <div class="content-box">
              <div v-if="passageHtml" v-html="passageHtml"></div>
              <div v-if="questionHtml" v-html="questionHtml"></div>
            </div>
          </div>

          <!-- 선택지 HTML 내용 -->
          <div v-if="filteredChoices.length > 0" class="choices">
            <h4>선택지</h4>
            <div class="choices-container">
              <div v-for="item in filteredChoices" :key="item.index" class="choice-item">
                <span class="choice-number">{{ item.index + 1 }}.</span>
                <div class="choice-content" v-html="item.choice"></div>
              </div>
            </div>
          </div>

          <!-- 정답 HTML 내용 -->
          <div v-if="answerHtml" class="answer">
            <h4>정답</h4>
            <div class="content-box">
              <div v-html="answerHtml"></div>
            </div>
          </div>

          <!-- 해설 HTML 내용 -->
          <div v-if="explainHtml" class="explain">
            <h4>해설</h4>
            <div class="content-box">
              <div v-html="explainHtml"></div>
            </div>
          </div>

          <!-- 디버깅: 해설 데이터 확인 -->
          <div v-if="!explainHtml" class="debug-info">
            <p style="color: red; font-size: 12px">
              해설 데이터가 없습니다. (explainHtml: {{ explainHtml }})
            </p>
          </div>

          <!-- 데이터 없음 -->
          <div
            v-if="
              !questionHtml &&
              !passageHtml &&
              !explainHtml &&
              !answerHtml &&
              !choiceHtmls.some((choice) => choice)
            "
            class="no-data"
          >
            <p>문제 내용이나 해설이 없습니다.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import reportApi from '@/services/reportApi.js'
import katex from 'katex'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  question: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref(null)
const questionHtml = ref('')
const explainHtml = ref('')
const choiceHtmls = ref([])
const answerHtml = ref('')
const passageHtml = ref('')

// 필터링된 선택지 (빈 값 제외)
const filteredChoices = computed(() => {
  return choiceHtmls.value.map((choice, index) => ({ choice, index })).filter((item) => item.choice)
})

const closeModal = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('ko-KR')
}

// 수식 렌더링 함수
const renderMathInHtml = (htmlContent) => {
  if (!htmlContent) return ''

  // KaTeX를 사용해서 수식 렌더링
  try {
    let processedHtml = htmlContent

    // HTML 엔티티를 원래 문자로 변환
    const decodeHtmlEntities = (text) => {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = text
      return textarea.value
    }

    // \displaystyle 형태의 수식 처리 - 중첩된 중괄호 고려
    let displayMatch
    const displayRegex = /\\displaystyle\s*\{((?:[^{}]|{[^{}]*})*)\}/g
    while ((displayMatch = displayRegex.exec(processedHtml)) !== null) {
      try {
        const formula = decodeHtmlEntities(displayMatch[1])
        const rendered = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true,
        })
        processedHtml = processedHtml.replace(displayMatch[0], rendered)
        // 정규식 인덱스 재설정
        displayRegex.lastIndex = 0
      } catch (error) {
        console.warn('KaTeX displaystyle 수식 렌더링 실패:', error)
      }
    }

    // 인라인 수식 (\(...\)) 처리 - 더 강력한 정규식
    let match
    const inlineRegex = /\\\(([^)]*(?:\([^)]*\)[^)]*)*)\\\)/g
    while ((match = inlineRegex.exec(processedHtml)) !== null) {
      try {
        const formula = decodeHtmlEntities(match[1])

        const rendered = katex.renderToString(formula, { throwOnError: false })
        processedHtml = processedHtml.replace(match[0], rendered)
        // 정규식 인덱스 재설정
        inlineRegex.lastIndex = 0
      } catch (error) {
        console.warn('KaTeX 인라인 수식 렌더링 실패:', error)
      }
    }

    // 블록 수식 (\[...\]) 처리
    const blockRegex = /\\\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\\\]/g
    while ((match = blockRegex.exec(processedHtml)) !== null) {
      try {
        const formula = decodeHtmlEntities(match[1])

        const rendered = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true,
        })
        processedHtml = processedHtml.replace(match[0], rendered)
        // 정규식 인덱스 재설정
        blockRegex.lastIndex = 0
      } catch (error) {
        console.warn('KaTeX 블록 수식 렌더링 실패:', error)
      }
    }

    // 기존 $...$ 형태도 지원
    processedHtml = processedHtml.replace(/\$([^$]+)\$/g, (match, formula) => {
      try {
        return katex.renderToString(decodeHtmlEntities(formula), { throwOnError: false })
      } catch (error) {
        console.warn('KaTeX 인라인 수식 렌더링 실패:', error)
        return match
      }
    })

    // 기존 $$...$$ 형태도 지원
    processedHtml = processedHtml.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(decodeHtmlEntities(formula), {
          throwOnError: false,
          displayMode: true,
        })
      } catch (error) {
        console.warn('KaTeX 블록 수식 렌더링 실패:', error)
        return match
      }
    })

    return processedHtml
  } catch (error) {
    console.error('수식 렌더링 중 오류:', error)
    return htmlContent
  }
}

const loadQuestionHtml = async () => {
  if (!props.question?.questionId) {
    error.value = '문제 ID가 없습니다.'
    return
  }

  loading.value = true
  error.value = null
  questionHtml.value = ''
  explainHtml.value = ''
  passageHtml.value = ''

  try {
    const response = await reportApi.getQuestionHtml(props.question.questionId)
    const data = response.data?.data || response.data || {}

    // HTML 데이터 가져오기
    const rawQuestionHtml = data.item_html || data.questionHtml || data.html || ''
    const rawPassageHtml = data.passage_html || data.passageHtml || data.passage || ''
    const rawExplanationHtml =
      data.explain_html ||
      data.explainHtml ||
      data.explanation_html ||
      data.explanationHtml ||
      data.solutionHtml ||
      data.solution_html ||
      ''
    const rawAnswerHtml = data.answer_html || data.answerHtml || data.correctAnswerHtml || ''

    // 선택지 HTML 데이터 가져오기 (choice1Html ~ choice5Html)
    const rawChoiceHtmls = []
    for (let i = 1; i <= 5; i++) {
      const choiceKey = `choice${i}Html`
      const choiceHtml = data[choiceKey] || ''
      rawChoiceHtmls.push(choiceHtml)
    }

    // 수식 렌더링 적용
    questionHtml.value = renderMathInHtml(rawQuestionHtml)
    passageHtml.value = renderMathInHtml(rawPassageHtml)
    explainHtml.value = renderMathInHtml(rawExplanationHtml)
    answerHtml.value = renderMathInHtml(rawAnswerHtml)
    choiceHtmls.value = rawChoiceHtmls.map((choiceHtml) => renderMathInHtml(choiceHtml))
  } catch (err) {
    console.error('문제 HTML 데이터를 가져오는데 실패했습니다:', err)
    error.value = '문제 내용을 불러올 수 없습니다.'
  } finally {
    loading.value = false
  }
}

// 모달이 열릴 때 데이터 로드
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue && props.question) {
      loadQuestionHtml()
    }
  },
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.question-info {
  margin-bottom: 24px;
  background: #f9fafb;
  border-radius: 6px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
}

.answer {
  font-weight: 500;
  color: #1f2937;
}

.correct {
  color: #10b981;
  font-weight: bold;
}

.incorrect {
  color: #ef4444;
  font-weight: bold;
}

.passage-content,
.question-content,
.explain,
.choices,
.answer {
  margin-bottom: 24px;
}
div.explain > div > div > div {
  padding: 20px !important;
}

div.explain > div > div > div:nth-child(1) {
  margin-top: 24px !important;
}
.passage-content h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #10b981;
}

.question-content h4,
.explain h4,
.choices h4,
.answer h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.content-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  min-height: 60px;
}

.content-box div {
  line-height: 1.6;
  color: #374151;
}

/* HTML 콘텐츠 스타일링 */
.content-box h1,
.content-box h2,
.content-box h3,
.content-box h4,
.content-box h5,
.content-box h6 {
  margin: 8px 0;
  color: #1f2937;
  font-weight: 600;
}

.content-box p {
  margin: 8px 0;
}

.content-box ul,
.content-box ol {
  margin: 8px 0;
  padding-left: 20px;
}

.content-box li {
  margin: 4px 0;
}

.content-box img {
  max-width: 100%;
  height: auto;
  margin: 8px 0;
  border-radius: 4px;
}

.content-box table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}

.content-box th,
.content-box td {
  border: 1px solid #d1d5db;
  padding: 8px;
  text-align: left;
}

.content-box th {
  background-color: #f9fafb;
  font-weight: 600;
}

.content-box code {
  background-color: #f3f4f6;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.content-box pre {
  background-color: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.content-box blockquote {
  border-left: 4px solid #3b6cff;
  padding-left: 12px;
  margin: 8px 0;
  color: #6b7280;
  font-style: italic;
}

/* 선택지 스타일링 */
.choices-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
}

.choice-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.choice-number {
  font-weight: 600;
  color: #3b6cff;
  min-width: 24px;
  margin-top: 2px;
}

.choice-content {
  flex: 1;
  line-height: 1.6;
  color: #374151;
}

/* KaTeX 수식 스타일링 */
.content-box .katex {
  font-size: 1.1em;
}

.content-box .katex-display {
  margin: 16px 0;
  text-align: center;
}

.content-box .katex-display .katex {
  font-size: 1.2em;
}

/* 로딩 상태 스타일 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b6cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 에러 상태 스타일 */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.error-message {
  text-align: center;
  color: #ef4444;
}

.error-message p {
  margin-bottom: 16px;
  font-size: 16px;
}

.retry-btn {
  background: #3b6cff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #2d5af5;
}

/* 데이터 없음 스타일 */
.no-data {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 40px 20px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .label {
    min-width: auto;
  }
}
</style>
