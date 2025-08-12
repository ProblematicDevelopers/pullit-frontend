
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../Home.vue'
import statistics from '../components/statistics/StatisticsTest.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/statistics', name: 'statistics', component: statistics},
]

const router = createRouter({
  history: createWebHistory(), // 히스토리 모드
  routes,
})

export default router
