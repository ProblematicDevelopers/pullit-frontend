import {createRouter, createWebHistory} from 'vue-router'
import Home from '../Home.vue'
import MainDashboard from '../views/MainDashboard.vue'
import Report from '../components/student/report/BasicReport.vue'
import StudentMain from '../components/student/Main.vue'
import StudentLayout from '@/components/student/StudentLayout.vue'

// 시험지 마법사 컴포넌트 import
import TestWizardView from '@/views/TestWizardView.vue'

// 로그인 페이지 import
import Login from '@/views/Login.vue'

import CBTStep01 from '@/components/student/cbt/CBTStep01.vue'

// 라우트 가드 import
import { requireAuth, requireRole, preventAuthenticated } from './guards'

const routes = [
  { path: '/', name: 'Home', component: Home },
  
  // 로그인 페이지
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: preventAuthenticated, // 이미 로그인한 사용자 접근 방지
    meta: {
      hideHeader: true,  // 헤더 숨김
      hideFooter: true   // 푸터 숨김
    }
  },

  // 시험지 마법사 경로 (통일)
  {
    path: '/exam/wizard',
    name: 'ExamWizard',
    component: TestWizardView,
    meta: {
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
  
  // 학급관리 페이지 (대시보드)
  {
    path: '/class-management',
    name: 'ClassManagement',
    component: MainDashboard,
    beforeEnter: requireAuth,
    meta: {
      requiresAuth: true,
      role: 'teacher'
    }
  },
]

const router = createRouter({
  history: createWebHistory(), // 히스토리 모드
  routes,
})

export default router
