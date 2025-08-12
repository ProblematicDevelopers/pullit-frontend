<script setup>
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Pie, Bar } from 'vue-chartjs'

// Chart.js에서 쓸 플러그인/요소 등록
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement)

// 데이터 & 옵션
const pieData = {
  labels: ['빨강', '파랑', '노랑'],
  datasets: [
    {
      label: '색상 비율',
      data: [40, 25, 35],
      backgroundColor: ['red', 'blue', 'yellow']
    }
  ]
}

const barData = {
  labels: ['1월', '2월', '3월'],
  datasets: [
    {
      label: '매출',
      data: [100, 200, 150],
      backgroundColor: 'skyblue'
    }
  ]
}

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    },
    title: {
      display: true,
      text: '차트 예시'
    }
  }
}
</script>

<template>
  <div>
    <h2>파이 차트</h2>
    <Pie :data="pieData" :options="options" />

    <h2>막대 차트</h2>
    <Bar :data="barData" :options="options" />
  </div>
</template>
