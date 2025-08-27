<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import MultiDatasetChartComponent from './MultiDatasetChartComponent.vue'
import QuestionHtmlModal from '@/components/student/report/QuestionHtmlModal.vue'
import reportApi from '@/services/reportApi.js'
import katex from 'katex'
import { Chart, registerables } from 'chart.js'

// Chart.js 등록
Chart.register(...registerables)

// rendering data
const showModal = ref(false)
const selectedQuestion = ref(null)

// common data
const props = defineProps({
  examId: { type: Number, default: -1 },
  questionId: { type: Number, default: -1 },
  examName: { type: String, default: '' },
})

// detail errata
const errataData = ref([])
const errataLoading = ref(false)
const errataError = ref(null)

// 차트 관련 변수
const chartCanvas = ref(null)
let chart = null

// 문제 상세 보기 모달 열기
const viewQuestionDetail = (question, index) => {
  selectedQuestion.value = {
    ...question,
    answer: renderMathInHtml(question.userAnswer),
    questionNumber: index + 1,
  }
  showModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  selectedQuestion.value = null
}

// 정오표 데이터 로드
async function getDetailErrata() {
  errataLoading.value = true
  errataError.value = null

  try {
    const response = await reportApi.getDetailErrata(props.examId)
    const data = await response.data
    errataData.value = data.data

    // 차트 데이터 업데이트
    updateChartData()
  } catch (err) {
    console.error('상세 정오표 조회에 실패했습니다.:', err)
    errataError.value = '상세 정오표 조회에 실패했습니다.'
  } finally {
    errataLoading.value = false
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
            style: 'normal',
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
              style: 'normal',
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
              style: 'normal',
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

// detail difficulty
const difficultyData = ref([])
const difficultyLoading = ref(false)
const difficultyError = ref(null)
const difficultyChartData = ref({
  '정답 문항수': [],
  '정답 문항수 평균': [],
  '획득 점수': [],
  '획득 점수 평균': [],
  소요시간: [],
  '소요시간 평균': [],
})
const difficultyDisplayLabels = ref(['최하', '하', '중', '상', '최상'])

const difficultyMaxValues = ref({})
const difficultyNormalize = ref(true)
const difficultyChartType = ref('bar')

// 난이도 데이터 정규화 함수
const normalizeDifficultyData = (rawData) => {
  const difficultyLabels = ['1', '2', '3', '4', '5']
  const normalizedData = []

  // 각 난이도별로 데이터 확인 및 채우기
  difficultyLabels.forEach((code) => {
    const existingData = rawData.find((item) => item.difficultyCode === code)

    if (existingData) {
      // 데이터가 존재하는 경우 그대로 사용
      normalizedData.push(existingData)
    } else {
      // 데이터가 없는 경우 기본값으로 생성
      normalizedData.push({
        avgCount: 0,
        avgDuration: 0,
        avgPoints: 0,
        difficultyCode: code,
        itemCount: 0,
        totalPoints: 0,
        userCount: 0,
        userDuration: 0,
        userPoints: 0,
      })
    }
  })

  return normalizedData
}

// 난이도별 통계 데이터 로드
async function getDetailDifficulty() {
  difficultyLoading.value = true
  difficultyError.value = null

  try {
    const response = await reportApi.getDetailDifficulty(props.examId)
    const data = await response.data
    difficultyData.value = normalizeDifficultyData(data.data)

    // 각 측정 항목별로 영역 순서대로 데이터 배열 구성
    difficultyData.value.forEach((item, index) => {
      difficultyChartData.value['정답 문항수'][index] = item.userCount
      difficultyChartData.value['정답 문항수 평균'][index] = item.avgCount
      difficultyChartData.value['획득 점수'][index] = item.userPoints
      difficultyChartData.value['획득 점수 평균'][index] = item.avgPoints
      difficultyChartData.value['소요시간'][index] = item.userDuration
      difficultyChartData.value['소요시간 평균'][index] = item.avgDuration
    })

    // 소요시간 최대값 계산
    const maxDuration = Math.max(
      ...difficultyData.value.map((item) => Math.max(item.userDuration, item.avgDuration)),
    )

    // 각 영역(데이터셋)별로 측정 항목별 최대값 설정
    difficultyMaxValues.value = difficultyData.value.map((item) => ({
      '정답 문항수': item.itemCount,
      '정답 문항수 평균': item.itemCount,
      '획득 점수': item.totalPoints,
      '획득 점수 평균': item.totalPoints,
      소요시간: maxDuration,
      '소요시간 평균': maxDuration,
    }))
  } catch (err) {
    console.log('난이도별 통계표 조회에 실패했습니다.:', err)
    difficultyError.value = '난이도별 통계표 조회에 실패했습니다.'
  } finally {
    difficultyLoading.value = false
  }
}
// 차트 타입별 설명
const difficultyChartTypeLabel = computed(() => {
  const labels = {
    bar: '막대 차트',
    line: '선 차트',
    radar: '레이더 차트',
  }
  return labels[difficultyChartType.value]
})

const difficultyChartTypeDescription = computed(() => {
  const descriptions = {
    bar: '항목별 비교에 적합, 정확한 수치 파악 가능',
    line: '추세와 변화 패턴 파악에 적합',
    radar: '다차원 성능 비교에 적합, 전체적인 균형 파악',
  }
  return descriptions[difficultyChartType.value]
})

// 난이도 코드 컨버터
const difficultyCodeConverter = (code) => {
  switch (code) {
    case '1':
      return '최하'
    case '2':
      return '하'
    case '3':
      return '중'
    case '4':
      return '상'
    case '5':
      return '최상'
    default:
      return '미상 난도'
  }
}

// detail evaluation
const evaluationData = ref([])
const evaluationLoading = ref(false)
const evaluationError = ref(null)

const evaluationChartData = ref({
  '정답 문항수': [],
  '정답 문항수 평균': [],
  '획득 점수': [],
  '획득 점수 평균': [],
  소요시간: [],
  '소요시간 평균': [],
})
const evaluationDatasetLabels = ref([])
const evaluationMaxValues = ref({})
const evaluationNormalize = ref(true)
const evaluationChartType = ref('bar')

// 평가 영역 통계 데이터 로드
async function getDetailEvaluation() {
  evaluationLoading.value = true
  evaluationError.value = null

  try {
    const response = await reportApi.getDetailEvaluation(props.examId)
    const data = await response.data
    evaluationData.value = data.data

    // 각 영역을 데이터셋으로 설정
    evaluationDatasetLabels.value = data.data.map((item) => item.domainName)

    // 각 측정 항목별로 영역 순서대로 데이터 배열 구성
    data.data.forEach((item, index) => {
      evaluationChartData.value['정답 문항수'][index] = item.userCount
      evaluationChartData.value['정답 문항수 평균'][index] = item.avgCount
      evaluationChartData.value['획득 점수'][index] = item.userPoints
      evaluationChartData.value['획득 점수 평균'][index] = item.avgPoints
      evaluationChartData.value['소요시간'][index] = item.userDuration
      evaluationChartData.value['소요시간 평균'][index] = item.avgDuration
    })

    // 소요시간 최대값 계산
    const maxDuration = Math.max(
      ...data.data.map((item) => Math.max(item.userDuration, item.avgDuration)),
    )

    // 각 영역(데이터셋)별로 측정 항목별 최대값 설정
    evaluationMaxValues.value = data.data.map((item) => ({
      '정답 문항수': item.totalCount,
      '정답 문항수 평균': item.totalCount,
      '획득 점수': item.totalPoints,
      '획득 점수 평균': item.totalPoints,
      소요시간: maxDuration,
      '소요시간 평균': maxDuration,
    }))
  } catch (err) {
    console.log('평가 영역별 통계표 조회에 실패했습니다.:', err)
    evaluationError.value = '평가 영역별 통계표 조회에 실패했습니다.'
  } finally {
    evaluationLoading.value = false
  }
}

// 차트 타입별 설명
const evaluationChartTypeLabel = computed(() => {
  const labels = {
    bar: '막대 차트',
    line: '선 차트',
    radar: '레이더 차트',
  }
  return labels[evaluationChartType.value]
})

const evaluationChartTypeDescription = computed(() => {
  const descriptions = {
    bar: '항목별 비교에 적합, 정확한 수치 파악 가능',
    line: '추세와 변화 패턴 파악에 적합',
    radar: '다차원 성능 비교에 적합, 전체적인 균형 파악',
  }
  return descriptions[evaluationChartType.value]
})

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
      getDetailDifficulty()
      getDetailEvaluation()
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

// 리포트 다운로드 함수
async function downloadReport() {
  try {
    // 로딩 상태 표시
    const downloadBtn = document.querySelector('.download-btn')
    if (downloadBtn) {
      downloadBtn.disabled = true
      downloadBtn.textContent = '📄 PDF 생성 중...'
    }

    // HTML을 PDF로 변환하는 서비스 사용
    const { convertDetailReportToPdf } = await import('@/services/htmlToPdfService.js')

    // examName이 있으면 파일명에 포함, 없으면 자동 생성
    let fileName = null
    if (props.examName) {
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD

      // 사용자 정보 가져오기
      let userName = '사용자'
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          if (user.fullName) {
            userName = user.fullName.replace(/[^\w\s가-힣]/g, '_')
          } else if (user.name) {
            userName = user.name.replace(/[^\w\s가-힣]/g, '_')
          } else if (user.username) {
            userName = user.username.replace(/[^\w\s가-힣]/g, '_')
          }
        } catch (error) {
          console.warn('사용자 정보 파싱 오류:', error)
        }
      }

      fileName = `${props.examName}_${userName}_${dateStr}.pdf`
    }

    await convertDetailReportToPdf(fileName)
  } catch (error) {
    console.error('상세리포트 PDF 다운로드 실패:', error)
    alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
  } finally {
    // 버튼 상태 복원
    const downloadBtn = document.querySelector('.download-btn')
    if (downloadBtn) {
      downloadBtn.disabled = false
      downloadBtn.textContent = '📄 상세 리포트 다운로드'
    }
  }
}
</script>

<template>
  <!-- 상세 정오표 -->
  <div class="report-wrap" data-report-container>
    <!-- 로딩 상태 -->
    <div v-if="errataLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>시험 데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="errataError" class="error-container">
      <div class="error-message">
        <p>{{ error }}</p>
        <button @click="getDetailErrata" class="retry-btn">다시 시도</button>
      </div>
    </div>
    <!-- 정오표 -->
    <table v-else class="errata table table-bordered">
      <thead>
        <tr>
          <th>번호</th>
          <th>평가 영역</th>
          <th>배점</th>
          <th>정답</th>
          <th>제출한 답</th>
          <th>획득 점수</th>
          <th>정답 여부</th>
          <th>평균 정답율</th>
          <th>문제 보기</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="errataData.length === 0">
          <td colspan="9">조회된 결과가 없습니다.</td>
        </tr>
        <tr v-else v-for="(question, index) in errataData" :key="`${question}_${index}`">
          <td>{{ question.itemOrder }}</td>
          <td>{{ question.domainName }}</td>
          <td>{{ question.points }}점</td>
          <td v-html="renderMathInHtml(question.answer)"></td>
          <td v-html="renderMathInHtml(question.userAnswer)"></td>
          <td>{{ question.userPoints }}점</td>
          <td>
            <span :class="question.isCorrect ? 'correct' : 'incorrect'">
              {{ question.isCorrect ? '정답' : '오답' }}
            </span>
          </td>
          <td>{{ Math.round(question.accuracy * 10000) / 100 }} %</td>
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
        <tr v-if="errataData.length !== 0">
          <td colspan="2">총 배점</td>
          <td>{{ errataData.reduce((sum, item) => sum + item.points, 0) }}점</td>
          <td colspan="2">총 획득 점수</td>
          <td>{{ errataData.reduce((sum, item) => sum + item.userPoints, 0) }}점</td>
          <td>총 정답률</td>
          <td>
            {{
              Math.round(
                (errataData.reduce((sum, item) => sum + (item.accuracy || 0), 0) /
                  (errataData.length || 1)) *
                  10000,
              ) / 100
            }}%
          </td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- 문항 모달 -->
  <QuestionHtmlModal :is-visible="showModal" :question="selectedQuestion" @close="closeModal" />

  <!-- 평균 정답률 차트 -->
  <div class="statistics-section">
    <h2 class="section-title">📊 평균 정답률 분석</h2>
    <div class="chart-section">
      <div class="chart-container">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  </div>

  <!-- 난이도별 통계 -->
  <div class="statistics-section">
    <h2 class="section-title">📊 난이도별 통계</h2>

    <!-- 로딩 상태 -->
    <div v-if="difficultyLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>시험 데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="difficultyError" class="error-container">
      <div class="error-message">
        <p>{{ error }}</p>
        <button @click="getDetailDifficulty" class="retry-btn">다시 시도</button>
      </div>
    </div>

    <!-- 난이도별 차트 -->
    <MultiDatasetChartComponent
      v-if="difficultyData.length > 0"
      :chartData="difficultyChartData"
      :datasetLabels="difficultyDisplayLabels"
      title="난이도별 통계"
      :normalize="difficultyNormalize"
      :maxValues="difficultyMaxValues"
      :chartType="difficultyChartType"
    />
    <!-- 차트 설정 패널 -->
    <div class="chart-controls">
      <div class="controls-panel">
        <h3 class="controls-title">📊 차트 설정</h3>

        <div class="controls-grid">
          <div class="control-group">
            <label class="control-label">데이터 표시 방식</label>
            <select class="control-select" v-model="difficultyNormalize">
              <option :value="false">📊 원본 데이터 (실제 값)</option>
              <option :value="true">📈 정규화 데이터 (0-100%)</option>
            </select>
            <p class="control-description">
              {{
                difficultyNormalize
                  ? '각 영역별 최대값 기준으로 백분율 표시'
                  : '실제 점수, 시간, 문항수 그대로 표시'
              }}
            </p>
          </div>

          <div class="control-group">
            <label class="control-label">차트 타입</label>
            <select class="control-select" v-model="difficultyChartType">
              <option value="bar">📊 막대 차트 (Bar Chart)</option>
              <option value="line">📈 선 차트 (Line Chart)</option>
              <option value="radar">🎯 레이더 차트 (Radar Chart)</option>
            </select>
            <p class="control-description">
              {{ difficultyChartTypeDescription }}
            </p>
          </div>
        </div>

        <div class="control-status">
          <div>
            <span class="status-badge">
              {{ difficultyNormalize ? '정규화 데이터' : '원본 데이터' }}
            </span>
            <span class="status-divider">|</span>
            <span class="status-badge">{{ difficultyChartTypeLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 난이도별 통계표 -->
    <table v-if="!difficultyLoading && !difficultyError" class="errata table table-bordered">
      <thead>
        <tr>
          <th>난이도</th>
          <th>총 문항수</th>
          <th>정답 문항수</th>
          <th>정답 문항수 평균</th>
          <th>총 배점</th>
          <th>획득 점수</th>
          <th>획득 점수 평균</th>
          <th>소요시간</th>
          <th>소요시간 평균</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="data in difficultyData" :key="data">
          <td>{{ difficultyCodeConverter(data.difficultyCode) }}</td>
          <td>{{ data.itemCount }}개</td>
          <template v-if="data.itemCount === 0">
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </template>
          <template v-else>
            <td>{{ data.userCount }}개</td>
            <td>{{ Math.round(data.avgCount * 10) / 10 }}개</td>
            <td>{{ data.totalPoints }}점</td>
            <td>{{ Math.round(data.userPoints * 100) / 100 }}점</td>
            <td>{{ Math.round(data.avgPoints * 100) / 100 }}점</td>
            <td>{{ Math.round(data.userDuration * 100) / 100 }}초</td>
            <td>{{ Math.round(data.avgDuration * 100) / 100 }}초</td>
          </template>
        </tr>
        <tr>
          <td>전체</td>
          <td>{{ difficultyData.reduce((sum, item) => sum + (item.itemCount || 0), 0) }}개</td>
          <td>{{ difficultyData.reduce((sum, item) => sum + (item.userCount || 0), 0) }}개</td>
          <td>
            {{
              Math.round(difficultyData.reduce((sum, item) => sum + (item.avgCount || 0), 0) * 10) /
              10
            }}개
          </td>
          <td>{{ difficultyData.reduce((sum, item) => sum + (item.totalPoints || 0), 0) }}점</td>
          <td>{{ difficultyData.reduce((sum, item) => sum + (item.userPoints || 0), 0) }}점</td>
          <td>
            {{
              Math.round(
                difficultyData.reduce((sum, item) => sum + (item.avgPoints || 0), 0) * 100,
              ) / 100
            }}점
          </td>
          <td colspan="2">-</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 평가영역별 통계 -->
  <div class="statistics-section">
    <h2 class="section-title">📈 평가 영역별 통계</h2>

    <!-- 로딩 상태 -->
    <div v-if="evaluationLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>시험 데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="evaluationError" class="error-container">
      <div class="error-message">
        <p>{{ error }}</p>
        <button @click="getDetailEvaluation" class="retry-btn">다시 시도</button>
      </div>
    </div>

    <MultiDatasetChartComponent
      v-if="evaluationData.length > 0"
      :chartData="evaluationChartData"
      :datasetLabels="evaluationDatasetLabels"
      title="평가 영역별 통계"
      :normalize="evaluationNormalize"
      :maxValues="evaluationMaxValues"
      :chartType="evaluationChartType"
    />
    <!-- 차트 컨트롤 패널 -->
    <div class="chart-controls">
      <div class="controls-panel">
        <h3 class="controls-title">📊 차트 설정</h3>

        <div class="controls-grid">
          <div class="control-group">
            <label class="control-label">데이터 표시 방식</label>
            <select class="control-select" v-model="evaluationNormalize">
              <option :value="false">📊 원본 데이터 (실제 값)</option>
              <option :value="true">📈 정규화 데이터 (0-100%)</option>
            </select>
            <p class="control-description">
              {{
                evaluationNormalize
                  ? '각 영역별 최대값 기준으로 백분율 표시'
                  : '실제 점수, 시간, 문항수 그대로 표시'
              }}
            </p>
          </div>

          <div class="control-group">
            <label class="control-label">차트 타입</label>
            <select class="control-select" v-model="evaluationChartType">
              <option value="bar">📊 막대 차트 (Bar Chart)</option>
              <option value="line">📈 선 차트 (Line Chart)</option>
              <option value="radar">🎯 레이더 차트 (Radar Chart)</option>
            </select>
            <p class="control-description">
              {{ evaluationChartTypeDescription }}
            </p>
          </div>
        </div>

        <div class="control-status">
          <div>
            <span class="status-badge">
              {{ evaluationNormalize ? '정규화 데이터' : '원본 데이터' }}
            </span>
            <span class="status-divider">|</span>
            <span class="status-badge">{{ evaluationChartTypeLabel }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 평가 영역별 통계표 -->
    <table v-if="!evaluationLoading && !evaluationError" class="errata table table-bordered">
      <thead>
        <tr>
          <th>평가 영역</th>
          <th>총 문항수</th>
          <th>정답 문항수</th>
          <th>정답 문항수 평균</th>
          <th>총 배점</th>
          <th>획득 점수 평균</th>
          <th>획득 점수 평균</th>
          <th>소요시간</th>
          <th>소요시간 평균</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="evaluationData.length === 0">
          <td colspan="8">조회된 결과가 없습니다.</td>
        </tr>
        <tr v-else v-for="evaluation in evaluationData" :key="`${evaluation}`">
          <td>{{ evaluation.domainName }}</td>
          <td>{{ evaluation.totalCount }}개</td>
          <td>{{ evaluation.userCount }}개</td>
          <td>{{ Math.round(evaluation.avgCount * 10) / 10 }}개</td>
          <td>{{ evaluation.totalPoints }}점</td>
          <td>{{ Math.round(evaluation.userPoints * 100) / 100 }}점</td>
          <td>{{ Math.round(evaluation.avgPoints * 100) / 100 }}점</td>
          <td>{{ Math.round(evaluation.userDuration * 100) / 100 }}초</td>
          <td>{{ Math.round(evaluation.avgDuration * 100) / 100 }}초</td>
        </tr>
        <tr v-if="evaluationData.length !== 0">
          <td>전체</td>
          <td>{{ evaluationData.reduce((sum, item) => sum + (item.totalCount || 0), 0) }}개</td>
          <td>{{ evaluationData.reduce((sum, item) => sum + (item.userCount || 0), 0) }}개</td>
          <td>{{ evaluationData.reduce((sum, item) => sum + (item.avgCount || 0), 0) }}개</td>
          <td>{{ evaluationData.reduce((sum, item) => sum + (item.totalPoints || 0), 0) }}점</td>
          <td>{{ evaluationData.reduce((sum, item) => sum + (item.userPoints || 0), 0) }}점</td>
          <td>{{ evaluationData.reduce((sum, item) => sum + (item.avgPoints || 0), 0) }}점</td>
          <td colspan="2">-</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 다운로드 버튼 -->
  <div class="download-section">
    <button class="download-btn" @click="downloadReport">📄 상세 리포트 다운로드</button>
  </div>
</template>

<style scoped>
/* 상세 정오표 스타일 */
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

/* 차트 패널 스타일 */
.chart-controls {
  margin-bottom: 60px;
  margin-top: 60px;
}

.controls-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
}

.controls-title {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 16px 0;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .controls-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.control-group {
  display: flex;
  flex-direction: column;
}

.control-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
  letter-spacing: 0.2px;
}

.control-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.control-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.control-select:hover {
  border-color: #3b82f6;
}

.control-description {
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;
  line-height: 1.5;
  font-weight: 400;
}

.control-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #f1f5f9;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f8fafc;
  color: #64748b;
  letter-spacing: 0.2px;
}

.status-divider {
  color: #d1d5db;
  margin: 0 8px;
}

@media (max-width: 767px) {
  .simple-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .simple-control-group {
    justify-content: space-between;
  }

  .simple-status {
    margin-left: 0;
    text-align: center;
    margin-top: 8px;
  }
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
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 20px;
  margin: 20px 0;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
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
  padding: 80px 20px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 20px;
  margin: 20px 0;
  border: 2px solid #fecaca;
}

.error-message {
  text-align: center;
  color: #dc2626;
}

.error-message p {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
}

.retry-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

/* 차트 섹션 스타일 */
.chart-section {
  margin-top: 0;
  margin-bottom: 0;
  padding: 32px;
  background: white;
  border-radius: 12px;
}

.chart-title {
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
  letter-spacing: -0.5px;
}

.chart-container {
  height: 500px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

/* 통계 섹션 스타일 */
.statistics-section {
  margin-top: 80px;
  margin-bottom: 50px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
}

/* 같은 분류 내 요소들 간격 */
.chart-controls {
  margin-bottom: 40px;
  margin-top: 30px;
}

/* 난이도별 통계 섹션 */
.chart-section + div {
  margin-top: 40px;
  margin-bottom: 50px;
}

/* 평가영역별 통계 섹션 */
.chart-section + div + div {
  margin-top: 40px;
  margin-bottom: 50px;
}

/* 다운로드 섹션 스타일 */
.download-section {
  margin-top: 60px;
  margin-bottom: 40px;
  text-align: center;
}

.download-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  letter-spacing: 0.5px;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.download-btn:active {
  transform: translateY(0);
}

.download-btn:disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(156, 163, 175, 0.3);
}
</style>
