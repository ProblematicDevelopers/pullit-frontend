<!-- src/components/student/report/ReportTabs.vue -->
<template>
  <div class="report-wrap">
    <!-- 탭 헤더 -->

    <nav class="tabs" role="tablist" aria-label="리포트 탭">
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'basic' }"
        role="tab"
        aria-selected="true"
        @click="currentTab = 'basic'"
      >
        기본 리포트
        <span class="underline" v-if="currentTab === 'basic'"></span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: currentTab === 'detail' }"
        role="tab"
        aria-selected="false"
        @click="currentTab = 'detail'"
      >
        상세 리포트
        <span class="underline" v-if="currentTab === 'detail'"></span>
      </button>
    </nav>

    <!-- 콘텐츠 -->
    <section v-if="currentTab === 'basic'" class="panel">
      <h3 class="panel-title">🖊️ 시험참여 정보</h3>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>시험 데이터를 불러오는 중...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <p>{{ error }}</p>
          <button @click="fetchExamData" class="retry-btn">다시 시도</button>
        </div>
      </div>

      <!-- 데이터 표시 -->
      <div v-else>
        <div class="cardCustom">
          <ul class="info-list">
            <li class="row">
              <span class="bar"></span>
              <span class="label">이름</span>
              <span class="sep">|</span>
              <span class="value">{{ displayName }}</span>
            </li>
            <li class="row">
              <span class="bar"></span>
              <span class="label">학년</span>
              <span class="sep">|</span>
              <span class="value">{{ studentGrade }}</span>
            </li>
          </ul>
        </div>
        <div id="score-box">
          <div class="score-section">
            <span class="score"> {{ examData.score || '0' }}개 </span>
            <span class="sep"> | </span>
            <span class="value"> {{ examData.totalQuestions || '0' }}문제 </span>
          </div>
          <div class="duration-section">
            <span class="duration">{{ formatDuration(examData.totalDuration || 0) }}</span>
          </div>
        </div>
        <div>
          <table class="errata table table-bordered">
            <thead>
              <tr>
                <th>번호</th>
                <th>채점 결과</th>
                <th>소요시간</th>
                <th>문제 및 해설 보기</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="examData.questions.length === 0">
                <td colspan="4" class="no-data">문제 데이터가 없습니다.</td>
              </tr>
              <tr v-else v-for="(question, index) in examData.questions" :key="index">
                <td>{{ index + 1 }}</td>
                <td>
                  <span :class="question.isCorrect ? 'correct' : 'incorrect'">
                    {{ question.isCorrect ? '정답' : '오답' }}
                  </span>
                </td>
                <td>{{ question.duration }}초</td>
                <td>
                  <button
                    class="view-btn"
                    @click="viewQuestionDetail(question, index)"
                    :disabled="!question.questionId"
                  >
                    보기
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-else class="panel">
      <h3 class="panel-title">📊 평가결과 요약</h3>
      <DetailReport :examId="examId" :examName="examName" />
    </section>

    <!-- 문제 HTML 모달 -->
    <QuestionHtmlModal :is-visible="showModal" :question="selectedQuestion" @close="closeModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DetailReport from '@/components/student/report/DetailReport.vue'
import QuestionHtmlModal from '@/components/student/report/QuestionHtmlModal.vue'
import studentApi from '@/services/studentApi.js'
import reportApi from '@/services/reportApi.js'
import katex from 'katex'

const route = useRoute()
const studentGrade = ref('-')
const examData = ref({
  score: 0,
  totalQuestions: 0,
  totalDuration: 0,
  questions: [],
})
const examName = ref('')
const loading = ref(false)
const error = ref(null)
const showModal = ref(false)
const selectedQuestion = ref(null)

// detail report
const examId = ref(-1)

onMounted(async () => {
  await Promise.all([fetchStudentInfo(), fetchExamData()])
})

const fetchStudentInfo = async () => {
  try {
    // localStorage에서 userInfo 가져오기
    const userInfoStr = localStorage.getItem('userInfo')
    const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null

    // 토큰에서 userId 가져오기 (라우터 파라미터 대신)
    const userId = userInfo?.id

    if (userId) {
      try {
        const { data } = await studentApi.getByUserId(userId)

        // data.data.grade에서 학년 가져오기
        const grade = data?.data?.grade

        studentGrade.value = grade?.name ?? '-'

        // grade를 localStorage에 저장
        if (grade) {
          const updatedUserInfo = { ...userInfo, grade: grade.name }
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
        }
      } catch {
        studentGrade.value = '-'
      }
    }
  } catch {
    studentGrade.value = '-'
  }
}

const fetchExamData = async () => {
  loading.value = true
  error.value = null

  try {
    const attemptId = route.params.id || route.params.attemptId

    if (!attemptId) {
      throw new Error('시험 ID가 없습니다.')
    }

    const response = await reportApi.getAttemptIdBasic(attemptId)
    const data = response.data?.data || response.data || {}

    // detail report
    examId.value = data.examId

    // 시험 이름 가져오기
    examName.value = data.examName || data.examTitle || data.title || '시험지'

    // API 응답 데이터를 컴포넌트에서 사용할 수 있는 형태로 변환
    examData.value = {
      score: calculateCorrectCount(data.attemptQuestions || []),
      totalQuestions: data.attemptQuestions?.length || 0,
      totalDuration: calculateTotalDuration(data.attemptQuestions || []),
      questions: normalizeQuestions(data.attemptQuestions || []),
    }
  } catch (err) {
    console.error('시험 데이터를 가져오는데 실패했습니다:', err)
    error.value = '시험 데이터를 불러올 수 없습니다.'

    // 에러 시 기본 데이터 설정
    examData.value = {
      score: 0,
      totalQuestions: 0,
      totalDuration: 0,
      questions: [],
    }
  } finally {
    loading.value = false
  }
}

// 정답 개수 계산 함수
const calculateCorrectCount = (attemptQuestions) => {
  if (!Array.isArray(attemptQuestions)) {
    return 0
  }

  return attemptQuestions.filter((question) => question.isCorrect).length
}

// 총 소요시간 계산 함수
const calculateTotalDuration = (attemptQuestions) => {
  if (!Array.isArray(attemptQuestions)) {
    return 0
  }

  return attemptQuestions.reduce((total, question) => {
    return total + (question.duration || 0)
  }, 0)
}

// 소요시간을 분:초 형식으로 변환하는 함수
const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  const formattedMinutes = minutes.toString().padStart(2, '0')
  const formattedSeconds = seconds.toString().padStart(2, '0')

  return `${formattedMinutes}분 ${formattedSeconds}초`
}

// 문제 데이터 정규화 함수
const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    return []
  }

  return questions.map((question, index) => {
    // API 응답 구조에 맞게 정규화
    return {
      id: question.id || question.questionId || index + 1,
      questionId: question.questionId || question.id || index + 1,
      isCorrect: question.isCorrect || false,
      answer: question.userAnswer || '',
      points: question.points || 0,
      duration: question.duration || 0,
      answeredAt: question.answeredAt || null,
    }
  })
}
// 수식 정규화 함수
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

const viewQuestionDetail = (question, index) => {
  // 문제 상세 보기 모달 열기
  selectedQuestion.value = {
    ...question,
    answer: renderMathInHtml(question.answer),
    questionNumber: index + 1, // 실제 문제 순서 추가
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedQuestion.value = null
}

const user = computed(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {}
  return {
    fullName: userInfo.fullName || userInfo.name || '사용자',
    username: userInfo.username || '사용자',
  }
})

const displayName = computed(
  () => user.value.fullName || user.value.name || user.value.username || '-',
)

// props는 그대로 유지하되, 기본값 보장
const props = defineProps({
  defaultTab: { type: String, default: 'basic' },
})
const currentTab = ref(props.defaultTab)
</script>

<style scoped>
.report-wrap {
  max-width: 1000px;
  margin: 80px auto 80px;
  padding: 0 20px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin: 40px 0 28px;
  flex-wrap: wrap;
}

.tab-btn {
  position: relative;
  background: white;
  border: 1px solid #d3d3d3;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.tab-btn.inactive {
  color: #333;
  background: white;
}

.tab-btn.active {
  background: #3b6cff;
  color: white;
  border-color: #3b6cff;
}

.tab-btn:hover {
  border-color: #3b6cff;
  background: #f8f9ff;
}

.tab-btn.active:hover {
  background: #3b6cff;
  color: white;
}

.underline {
  display: none;
}

/* Panel & Card */
.panel {
  margin-top: 8px;
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
}

.cardCustom {
  background: #fff;
  border: 1px solid #d3d3d3;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 100%;
  transition: all 0.3s ease;
}

.cardCustom:hover {
  border-color: #2d5af5;
  box-shadow: 0 4px 12px rgba(59, 108, 255, 0.15);
  transform: translateY(-2px);
}

.card.empty {
  color: #6b7280;
}

/* Info list */
.info-list {
  display: grid;
  gap: 18px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 8px 80px 24px 1fr; /* bar | label | | | value */
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

.label {
  color: #3b6cff;
  font-weight: 700;
}

.sep {
  color: #9aa3b2;
}

.value {
  color: #1f2937;
  font-weight: 500;
}

.duration {
  color: #059669;
  font-weight: 500;
  white-space: pre-line;
  line-height: 1.2;
}

#score-box {
  margin-top: 60px;
  margin-bottom: 60px;
  height: 120px;
  background: #fff;
  border: 1px solid #d3d3d3;
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.score-section {
  margin-bottom: 8px;
}

.duration-section {
  margin-top: 4px;
}

/* hover 효과 제거 */

.errata {
  margin-top: 20px;
  margin-bottom: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background: white;
}

.errata th {
  background: #f8f9ff;
  color: #3b6cff;
  font-weight: 600;
  padding: 16px 20px;
  border: none;
  border-bottom: 2px solid #e2e8f0;
  text-align: center;
  font-size: 13px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.errata td {
  padding: 16px 20px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  text-align: center;
  font-size: 14px;
  color: #475569;
  transition: background-color 0.2s ease;
}

.errata tr:hover {
  background: #f8fafc;
}

.errata tr:last-child td {
  border-bottom: none;
}

/* 채점 결과 스타일 */
.correct {
  color: #10b981;
  font-weight: 600;
  background: #d1fae5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.incorrect {
  color: #ef4444;
  font-weight: 600;
  background: #fee2e2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.view-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.view-btn:hover {
  background: #2563eb;
}

.view-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
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
</style>
