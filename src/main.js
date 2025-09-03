import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import './assets/main.css'
// 시험지 마법사 전용 스타일 추가
import './assets/styles/wizard.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
// MathJax 지시어 import
import { installMathJaxDirective } from './directives/mathJaxDirective'

// 프로덕션 환경에서 console.log 비활성화
if (import.meta.env.PROD) {
  // console 메서드들을 빈 함수로 오버라이드
  console.log = () => {}
  console.debug = () => {}
  console.info = () => {}
  console.warn = () => {}
  
  // error는 남겨두거나 원하면 이것도 비활성화
  // console.error = () => {}
  
  // 또는 모든 console 출력을 한 번에 비활성화
  // globalThis.console = {
  //   ...console,
  //   log: () => {},
  //   debug: () => {},
  //   info: () => {},
  //   warn: () => {},
  //   error: () => {}
  // }
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
// MathJax 지시어 전역 등록
installMathJaxDirective(app)
app.mount('#app')
