import {createRouter, createWebHistory} from 'vue-router'
import Home from '../Home.vue'
import Report from '../components/student/report/BasicReport.vue'
import StudentMain from '../components/student/Main.vue'
import StudentLayout from '@/components/student/StudentLayout.vue'

// 시험지 마법사 컴포넌트 import
import TestWizardView from '@/views/TestWizardView.vue'

import CBTStep01 from '@/components/student/cbt/CBTStep01.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },

  // 시험지 마법사 팝업 전용 경로
  // 새창 팝업에서 로드되는 독립적인 페이지입니다
  {
    path: '/test-wizard',
    name: 'TestWizard',
    component: TestWizardView,
    meta: {
      // 팝업 전용 페이지임을 표시
      isPopup: true,
      // 인증이 필요한 경우 설정 (향후 구현)
      requiresAuth: false
    }
  },

  {
    path: '/student',
    component: StudentLayout, // 공통 레이아웃 or StudentMain 같은 것
    children: [
      { path: 'main', name: 'student.main', component: StudentMain },

      { path: 'report', name: 'student.report', component: Report},
      // { path: 'exam/:id', name: 'student.exam', component: StudentExam },

      { path: 'cbtstep01', name: 'student.cbt',component: CBTStep01 }

      // { path: 'result/:id', name: 'student.result', component: StudentResult },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(), // 히스토리 모드
  routes,
})

export default router
