<template>
  <div class="box-plot-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot'

// Chart.js 기본 요소 등록
Chart.register(...registerables)
// BoxPlot 플러그인 등록
Chart.register(BoxPlotController, BoxAndWiskers)

const props = defineProps({
  examData: {
    type: Array,
    default: () => []
  },
  useNormalized: {
    type: Boolean,
    default: true  // 기본적으로 정규화된 데이터 사용
  }
})

const chartCanvas = ref(null)
let chart = null

const normalizeData = (exam) => {
  // 정규화 공식: (값 - 최솟값) / (최댓값 - 최솟값) * 100
  const range = exam.max - exam.min
  
  if (range === 0) {
    // 모든 점수가 같을 경우
    return {
      min: 50,
      q1: 50,
      median: 50,
      q3: 50,
      max: 50,
      mean: 50,
      userScore: 50
    }
  }
  
  return {
    min: 0,  // 정규화된 최솟값은 항상 0
    q1: Math.round((exam.q1 - exam.min) / range * 100 * 100) / 100,
    median: Math.round((exam.median - exam.min) / range * 100 * 100) / 100,
    q3: Math.round((exam.q3 - exam.min) / range * 100 * 100) / 100,
    max: 100,  // 정규화된 최댓값은 항상 100
    mean: Math.round((exam.mean - exam.min) / range * 100 * 100) / 100,
    userScore: Math.round((exam.userScore - exam.min) / range * 100 * 100) / 100
  }
}

const createChart = () => {
  if (!props.examData || !Array.isArray(props.examData) || props.examData.length === 0) {
    console.warn('examData가 유효하지 않습니다:', props.examData)
    return
  }

  const ctx = chartCanvas.value.getContext('2d')
  
  // 데이터 변환
  const chartData = props.examData.map(exam => {
    if (props.useNormalized) {
      // 클라이언트에서 정규화 수행
      const normalized = normalizeData(exam)
      return {
        min: normalized.min,
        q1: normalized.q1,
        median: normalized.median,
        q3: normalized.q3,
        max: normalized.max,
        mean: normalized.mean,
        outliers: [normalized.userScore]
      }
    } else {
      // 원본 데이터 사용
      return {
        min: exam.min,
        q1: exam.q1,
        median: exam.median,
        q3: exam.q3,
        max: exam.max,
        mean: exam.mean
      }
    }
  })

  // 사용자 점수 데이터 추출
  const userScoreData = props.examData.map((exam) => {
    if (props.useNormalized) {
      const normalized = normalizeData(exam)
      return normalized.userScore
    } else {
      return exam.userScore
    }
  })

  // 평균값 데이터 추출
  const meanData = chartData.map((data, index) => ({
    x: index,
    y: data.mean
  }))

  chart = new Chart(ctx, {
    type: 'boxplot',
    data: {
      labels: props.examData.map(exam => exam.examName || '시험'),
      datasets: [
        {
          label: props.useNormalized ? '정규화된 성적 분포 (%)' : '성적 분포',
          data: chartData.map(data => ({
            ...data,
            outliers: []  // outliers 제거
          })),
          backgroundColor: 'rgba(54, 162, 235, 0.3)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          medianColor: 'rgba(255, 206, 86, 1)',
          meanColor: 'transparent',  // 박스플롯의 평균값 표시 비활성화
          meanRadius: 0,  // 박스플롯의 평균값 포인트 숨김
          order: 3  // 박스플롯을 가장 뒤로
        },
        {
          type: 'scatter',
          label: '평균값',
          data: meanData,
          backgroundColor: 'rgba(34, 139, 34, 1)',  // 진한 녹색으로 박스와 구분
          borderColor: 'rgba(34, 139, 34, 1)',
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 10,
          pointStyle: 'circle',
          showLine: false,
          order: 2  // 평균값을 박스보다 앞으로
        },
        {
          type: 'scatter',
          label: '내 점수',
          data: userScoreData.map((score, index) => ({
            x: index,
            y: score
          })),
          backgroundColor: 'rgba(255, 99, 132, 1)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointRadius: 10,
          pointHoverRadius: 12,
          pointStyle: 'star',
          showLine: false,
          order: 1  // 사용자 점수를 가장 앞으로
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: props.useNormalized ? '시험별 정규화된 성적 분포 (0-100%)' : '시험별 성적 분포',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: true,
          labels: {
            generateLabels: () => {
              return [
                {
                  text: props.useNormalized ? '정규화된 성적 분포' : '성적 분포',
                  fillStyle: 'rgba(54, 162, 235, 0.3)',
                  strokeStyle: 'rgba(54, 162, 235, 1)',
                  lineWidth: 2
                },
                {
                  text: '중앙값 (Q2)',
                  fillStyle: 'rgba(255, 206, 86, 1)',
                  strokeStyle: 'rgba(255, 206, 86, 1)',
                  lineWidth: 3,
                  pointStyle: 'line',
                  pointRadius: 0
                },
                {
                  text: '평균값',
                  fillStyle: 'rgba(34, 139, 34, 1)',  // 진한 녹색으로 수정
                  strokeStyle: 'rgba(34, 139, 34, 1)',
                  lineWidth: 2,
                  pointStyle: 'circle',
                  pointRadius: 8
                },
                {
                  text: '내 점수',
                  fillStyle: 'rgba(255, 99, 132, 1)',
                  strokeStyle: 'rgba(255, 99, 132, 1)',
                  lineWidth: 2,
                  pointStyle: 'star',
                  pointRadius: 10
                }
              ]
            }
          }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label
            },
            label: function(context) {
              const suffix = props.useNormalized ? '%' : '점'
              
              // 사용자 점수 scatter plot인 경우
              if (context.dataset.label === '내 점수') {
                return `내 점수: ${context.parsed.y}${suffix}`
              }
              
              // 평균값 scatter plot인 경우
              if (context.dataset.label === '평균값') {
                return `평균값: ${context.parsed.y}${suffix}`
              }
              
              // Box plot인 경우
              const dataPoint = context.parsed
              const userScore = userScoreData[context.dataIndex]
              const meanScore = meanData[context.dataIndex].y
              return [
                `최솟값: ${dataPoint.min}${suffix}`,
                `1사분위수 (Q1): ${dataPoint.q1}${suffix}`,
                `중앙값 (Q2): ${dataPoint.median}${suffix}`,
                `3사분위수 (Q3): ${dataPoint.q3}${suffix}`,
                `최댓값: ${dataPoint.max}${suffix}`,
                `평균값: ${meanScore}${suffix}`,
                `내 점수: ${userScore}${suffix}`
              ]
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: props.useNormalized ? 100 : undefined,
          title: {
            display: true,
            text: props.useNormalized ? '정규화된 점수 (%)' : '점수',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            callback: function(value) {
              return props.useNormalized ? value + '%' : value
            }
          }
        },
        x: {
          title: {
            display: true,
            text: '시험',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    }
  })
}

onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

watch(() => props.examData, () => {
  if (chart) {
    chart.destroy()
  }
  nextTick(() => {
    createChart()
  })
}, { deep: true })

watch(() => props.useNormalized, () => {
  if (chart) {
    chart.destroy()
  }
  nextTick(() => {
    createChart()
  })
})

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy()
  }
})
</script>

<style scoped>
.box-plot-container {
  width: 100%;
  height: 500px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>