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

const app = createApp(App)
app.use(createPinia())
app.use(router)
// MathJax 지시어 전역 등록
installMathJaxDirective(app)
app.mount('#app')
