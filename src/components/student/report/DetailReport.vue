<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import QuestionHtmlModal from '@/components/student/report/QuestionHtmlModal.vue'
import reportApi from '@/services/reportApi.js'
import katex from 'katex'
import { Chart, registerables } from 'chart.js'

// Chart.js 등록
Chart.register(...registerables)
// rendering data
const loading = ref(false)
const error = ref(null)
const showModal = ref(false)
const selectedQuestion = ref(null)

// common data
const props = defineProps({
  examId: { type: Number, default: -1 },
  questionId: { type: Number, default: -1 },
})

// detail errata
const errataData = ref([])

// 차트 관련 변수
const chartCanvas = ref(null)
let chart = null

// 문제 상세 보기 모달 열기
const viewQuestionDetail = (question, index) => {
  selectedQuestion.value = {
    ...question,
    questionNumber: index + 1,
  }
  showModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  selectedQuestion.value = null
}

async function getDetailErrata() {
  loading.value = true
  error.value = null

  try {
    const response = await reportApi.getDetailErrata(props.examId)
    const data = await response.data
    errataData.value = data.data

    // 차트 데이터 업데이트
    updateChartData()
  } catch (err) {
    console.error('상세 정오표 조회에 실패했습니다.:', err)
    error.value = '상세 정오표 조회에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 차트 생성 함수
function createChart() {
  if (!chartCanvas.value || !errataData.value || errataData.value.length === 0) return

  // 기존 차트가 있으면 제거
  if (chart) {
    chart.destroy()
  }

  // 문제 번호와 평균 정답률 데이터 추출
  const labels = errataData.value.map((question) => `문제 ${question.itemOrder}`)
  const accuracyData = errataData.value.map((question) => Math.round(question.accuracy * 100))
  const isCorrectData = errataData.value.map((question) => question.isCorrect)

  console.log('차트 데이터:', { labels, accuracyData, isCorrectData })

  // 차트 생성
  chart = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '평균 정답률 (%)',
          data: accuracyData,
          backgroundColor: isCorrectData.map((isCorrect) => {
            return isCorrect ? '#10b981' : '#ef4444' // 정답: 녹색, 오답: 빨간색
          }),
          borderColor: isCorrectData.map((isCorrect) => {
            return isCorrect ? '#059669' : '#dc2626' // 정답: 진한 녹색, 오답: 진한 빨간색
          }),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: '평균 정답률 분석',
          font: {
            size: 18,
            weight: 'bold',
            family: 'Inter, sans-serif',
          },
          color: '#1f2937',
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#3b6cff',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function (context) {
              const isCorrect = isCorrectData[context.dataIndex]
              const status = isCorrect ? '정답' : '오답'
              const domainName = errataData.value[context.dataIndex]?.domainName || 'N/A'
              return [`정답률: ${context.parsed.y}%`, `상태: ${status}`, `평가 영역: ${domainName}`]
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
              weight: '500',
            },
            color: '#6b7280',
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: '#e5e7eb',
            drawBorder: false,
          },
          ticks: {
            font: {
              size: 12,
              weight: '500',
            },
            color: '#6b7280',
            callback: function (value) {
              return value + '%'
            },
            padding: 8,
          },
          border: {
            display: false,
          },
        },
      },
      elements: {
        bar: {
          hoverBackgroundColor: function (context) {
            const isCorrect = isCorrectData[context.dataIndex]
            return isCorrect ? '#059669' : '#dc2626' // 정답: 진한 녹색, 오답: 진한 빨간색
          },
        },
      },
    },
  })
}

// 차트 데이터 업데이트 함수
function updateChartData() {
  nextTick(() => {
    createChart()
  })
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

watch(
  () => props.examId,
  (v) => {
    if (v != null && v !== -1) {
      getDetailErrata()
    }
  },
  { immediate: true },
)

// 컴포넌트 마운트 시 차트 초기화
onMounted(() => {
  if (props.examId && props.examId !== -1) {
    nextTick(() => {
      createChart()
    })
  }
})
</script>

<template>
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
  <!-- 상세 정오표 -->
  <div>
    <table class="errata table table-bordered">
      <thead>
        <tr>
          <th>번호</th>
          <th>평가 영역</th>
          <th>배점</th>
          <th>정답</th>
          <th>제출한 답</th>
          <th>정답 여부</th>
          <th>획득 점수</th>
          <th>평균 정답율</th>
          <th>문제 보기</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(question, index) in errataData" :key="`${question}_${index}`">
          <td>{{ question.itemOrder }}</td>
          <td>{{ question.domainName }}</td>
          <td>{{ question.points }}</td>
          <td v-html="renderMathInHtml(question.answer)"></td>
          <td>{{ question.userAnswer }}</td>
          <td>
            <span :class="question.isCorrect ? 'correct' : 'incorrect'">
              {{ question.isCorrect ? '정답' : '오답' }}
            </span>
          </td>
          <td>{{ question.userPoints }}</td>
          <td>{{ question.accuracy * 100 }} %</td>
          <td>
            <button
              class="view-btn"
              @click="viewQuestionDetail(question, index)"
              :disabled="!question.itemId"
            >
              보기
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- 문항 모달 -->
  <QuestionHtmlModal :is-visible="showModal" :question="selectedQuestion" @close="closeModal" />

  <!-- 평균 정답률 차트 -->
  <div class="chart-section">
    <h3 class="panel-title">📊 평균 정답률 분석</h3>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<style scoped>
/* 상세 정오표 스타일 */
.errata {
  margin-top: 60px;
  border: 1px solid #d3d3d3;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.errata th {
  background: #f8f9ff;
  color: #3b6cff;
  font-weight: bold;
  padding: 8px 12px;
  border: 1px solid #d3d3d3;
  text-align: center;
  font-size: 14px;
}

.errata td {
  padding: 8px 12px;
  border: 1px solid #d3d3d3;
  text-align: center;
  font-size: 14px;
}

.errata tr:hover {
  background: #f8f9ff;
}

/* 채점 결과 스타일 */
.correct {
  color: #10b981;
  font-weight: bold;
}

.incorrect {
  color: #ef4444;
  font-weight: bold;
}

.view-btn {
  background: #3b6cff;
  color: white;
  border: none;
  padding: 6px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background: #2d5af5;
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

/* 차트 섹션 스타일 */
.chart-section {
  margin-top: 40px;
  padding: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-title {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.chart-container {
  height: 400px;
  position: relative;
}
</style>
