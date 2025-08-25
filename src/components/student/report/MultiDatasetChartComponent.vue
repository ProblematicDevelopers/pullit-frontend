<template>
  <div class="chart-container">
    <!-- 로딩 오버레이 -->
    <div v-if="isUpdating" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">차트 업데이트 중...</span>
    </div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  BarController, 
  LineController,
  RadarController
} from 'chart.js'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  BarController,
  LineController,
  RadarController
)

// Props 정의
const props = defineProps({
  // 차트 데이터 - x축 키와 각 키별 데이터 배열
  chartData: {
    type: Object,
    required: true,
    // default: () => ({
    //     "정답률": [85, 78, 82],
    //   "소요시간": [25, 38, 32],
    //   "획득점수": [892, 756, 825]
    // })
  },
   
  // 데이터셋 라벨들 (각 배열 인덱스에 해당하는 라벨)
  datasetLabels: {
    type: Array,
//    default: () => ['학생1', '학생2', '평균']
  },
  
  // 차트 타입
  chartType: {
    type: String,
    default: 'bar',
    validator: (value) => ['bar', 'line', 'radar'].includes(value)
  },
  
  // 차트 제목
  title: {
    type: String,
//    default: '성적 비교 차트'
  },
  
  // 색상 테마
  colorScheme: {
    type: Array,
    default: () => [
      'rgba(59, 130, 246, 0.8)',   // 파랑
      'rgba(239, 68, 68, 0.8)',    // 빨강
      'rgba(16, 185, 129, 0.8)',   // 초록
      'rgba(245, 158, 11, 0.8)',   // 주황
      'rgba(139, 69, 19, 0.8)',    // 갈색
      'rgba(168, 85, 247, 0.8)'    // 보라
    ]
  },
  
  // 정규화 여부
  normalize: {
    type: Boolean,
    default: false
  },
  
  // 정규화시 사용할 최대값들 (데이터셋별로 다르게 설정 가능)
  maxValues: {
    type: [Object, Array],
    // Object: 모든 데이터셋에 동일한 maxValue 적용
    // Array: 각 데이터셋별로 다른 maxValue 적용
    /*
    // Object 방식 (기존)
    default: () => ({
        "정답률": 100, "소요시간": 60, "획득점수": 990
    })
    
    // Array 방식 (새로운 기능)
    default: () => [
      { "정답률": 100, "소요시간": 45, "획득점수": 900 }, // 학생1용
      { "정답률": 95, "소요시간": 60, "획득점수": 850 },  // 학생2용  
      { "정답률": 100, "소요시간": 50, "획득점수": 990 }  // 평균용
    ]
    */
  },
  
  // 차트 옵션 (추가 커스터마이징용)
  chartOptions: {
    type: Object,
    default: () => ({})
  }
})

const chartCanvas = ref(null)
const chartInstance = ref(null)
const isUpdating = ref(false)

// X축 라벨 (chartData의 키들)
const xAxisLabels = computed(() => Object.keys(props.chartData))

// 데이터 정규화 함수 (데이터셋별 maxValue 지원)
const normalizeValue = (key, value, datasetIndex) => {
  if (!props.normalize) return value
  
  let maxValue
  
  // maxValues가 배열인 경우 (각 데이터셋별로 다른 maxValue)
  if (Array.isArray(props.maxValues)) {
    const datasetMaxValues = props.maxValues[datasetIndex]
    maxValue = datasetMaxValues ? datasetMaxValues[key] : undefined
  } 
  // maxValues가 객체인 경우 (모든 데이터셋에 동일한 maxValue)
  else if (props.maxValues) {
    maxValue = props.maxValues[key]
  }
  
  if (!maxValue) return value
  
  // 모든 지표를 일반적인 정규화로 처리
  return (value / maxValue) * 100
}

// Multi Dataset 생성
const chartDatasets = computed(() => {
  const datasets = []
  
  // 각 데이터셋 라벨별로 dataset 생성
  props.datasetLabels.forEach((label, datasetIndex) => {
    const data = xAxisLabels.value.map(xKey => {
      const values = props.chartData[xKey] || []
      const value = values[datasetIndex] || 0
      return props.normalize ? normalizeValue(xKey, value, datasetIndex) : value
    })
    
    // 색상 설정
    const baseColor = props.colorScheme[datasetIndex % props.colorScheme.length]
    const borderColor = baseColor.replace('0.8)', '1)')
    
    const dataset = {
      label: label,
      data: data,
      backgroundColor: baseColor,
      borderColor: borderColor,
      borderWidth: 2
    }
    
    // 차트 타입별 추가 설정
    if (props.chartType === 'bar') {
      dataset.borderRadius = 6
      dataset.borderSkipped = false
    } else if (props.chartType === 'radar') {
      dataset.backgroundColor = baseColor.replace('0.8)', '0.3)')
      dataset.pointBackgroundColor = borderColor
      dataset.pointBorderColor = '#fff'
      dataset.pointRadius = 5
      dataset.borderWidth = 3
    } else if (props.chartType === 'line') {
      dataset.backgroundColor = baseColor.replace('0.8)', '0.3)')
      dataset.pointBackgroundColor = borderColor
      dataset.pointBorderColor = '#fff'
      dataset.pointRadius = 5
      dataset.fill = false
      dataset.tension = 0.4
    }
    
    datasets.push(dataset)
  })
  
  return datasets
})

// 차트 데이터 객체
const finalChartData = computed(() => ({
  labels: xAxisLabels.value,
  datasets: chartDatasets.value
}))

// 차트 옵션
const finalChartOptions = computed(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: props.title,
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: props.chartType === 'line',
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label
            let value = context.parsed.y || context.parsed.r || context.parsed
            
            // value가 숫자가 아닌 경우 처리
            if (typeof value !== 'number') {
              value = parseFloat(value) || 0
            }
            
            // 정규화된 경우 % 표시
            if (props.normalize) {
              return `${label}: ${value.toFixed(1)}%`
            }
            
            // 원본 값에 적절한 단위 추가
            const xLabel = context.label
            let unit = ''
            if (xLabel.includes('률') || xLabel.includes('Rate')) unit = '%'
            else if (xLabel.includes('시간') || xLabel.includes('Time')) unit = '분'
            else if (xLabel.includes('점수') || xLabel.includes('Score')) unit = '점'
            
            return `${label}: ${value.toFixed(1)}${unit}`
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  }
  
  // 차트 타입별 스케일 설정
  if (props.chartType === 'radar') {
    baseOptions.scales = {
      r: {
        beginAtZero: true,
        max: props.normalize ? 100 : undefined,
        ticks: {
          stepSize: props.normalize ? 20 : undefined
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  } else {
    baseOptions.scales = {
      y: {
        beginAtZero: true,
        max: props.normalize ? 100 : undefined,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return props.normalize ? `${value}%` : value
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }
  
  // 사용자 정의 옵션 병합
  return {
    ...baseOptions,
    ...props.chartOptions
  }
})

// 차트 생성 함수
const createChart = () => {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  
  // 기존 차트 제거 (안전하게)
  if (chartInstance.value) {
    try {
      chartInstance.value.destroy()
    } catch (error) {
      console.warn('차트 제거 중 오류:', error)
    }
    chartInstance.value = null
  }
  
  // 잠시 대기 후 새 차트 생성 (충돌 방지)
  setTimeout(() => {
    if (!chartCanvas.value) return // 컴포넌트가 언마운트된 경우 체크
    
    try {
      chartInstance.value = new ChartJS(ctx, {
        type: props.chartType,
        data: finalChartData.value,
        options: finalChartOptions.value
      })
    } catch (error) {
      console.error('차트 생성 중 오류:', error)
    }
  }, 50)
}

// 라이프사이클 및 반응성
onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

onUnmounted(() => {
  // 타이머 정리
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  
  // 차트 인스턴스 정리
  if (chartInstance.value) {
    try {
      chartInstance.value.destroy()
    } catch (error) {
      console.warn('차트 정리 중 오류:', error)
    }
  }
})

// props 변경 감지하여 차트 업데이트 (디바운싱 적용)
let updateTimeout = null
watch(
  () => [props.chartData, props.chartType, props.normalize, props.datasetLabels],
  () => {
    // 기존 타이머 취소
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    
    isUpdating.value = true
    
    // 1000ms 후 차트 업데이트 (디바운싱)
    updateTimeout = setTimeout(() => {
      nextTick(() => {
        createChart()
        isUpdating.value = false
      })
    }, 1000)
  },
  { deep: true }
)

// 외부에서 차트 인스턴스에 접근할 수 있도록 expose
defineExpose({
  chartInstance: computed(() => chartInstance.value),
  updateChart: createChart
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  canvas {
    max-width: 100%;
    max-height: 100%;
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

.loading-text {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>