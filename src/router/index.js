import { createRouter, createWebHistory } from 'vue-router'
import Home from '../Home.vue'
import Report from '../components/student/report/BasicReport.vue'
import StudentMain from '../components/student/Main.vue'
import StudentLayout from '@/components/student/StudentLayout.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  {
    path: '/student',
    component: StudentLayout, // 공통 레이아웃 or StudentMain 같은 것
    children: [
      { path: 'main', name: 'student.main', component: StudentMain },
      { path: 'report', name: 'student.report', component: Report},
      // { path: 'exam/:id', name: 'student.exam', component: StudentExam },
      // { path: 'result/:id', name: 'student.result', component: StudentResult },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(), // 히스토리 모드
  routes,
})

export default router
