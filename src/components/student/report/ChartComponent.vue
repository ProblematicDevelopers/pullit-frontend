<script setup>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

// Chart.js에서 쓸 플러그인/요소 등록
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement)

// Props 정의
const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      labels: [],
      datasets: [],
    }),
  },
  chartOptions: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div class="chart-wrapper">
    <Bar :data="props.chartData" :options="props.chartOptions" />
  </div>
</template>
