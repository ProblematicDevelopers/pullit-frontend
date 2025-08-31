<template>
  <div class="mathjax-test">
    <h2>MathJax 테스트 페이지</h2>
    
    <div class="test-section">
      <h3>인라인 수식 테스트</h3>
      <p>인라인 수식 1: $x^2 + y^2 = z^2$</p>
      <p>인라인 수식 2: \(a^2 + b^2 = c^2\)</p>
    </div>
    
    <div class="test-section">
      <h3>블록 수식 테스트</h3>
      <p>블록 수식 1:</p>
      $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
      
      <p>블록 수식 2:</p>
      \[\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}\]
    </div>
    
    <div class="test-section">
      <h3>복잡한 수식</h3>
      <p>행렬: $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$</p>
      <p>분수: $\frac{d}{dx}\left(\frac{1}{x}\right) = -\frac{1}{x^2}$</p>
    </div>
    
    <div class="test-section">
      <h3>동적 추가 테스트</h3>
      <button @click="addFormula">수식 추가</button>
      <div v-html="dynamicContent" class="dynamic-content"></div>
    </div>
    
    <div class="test-section">
      <h3>수동 렌더링 테스트</h3>
      <button @click="manualRender">수동 렌더링</button>
      <button @click="checkMathJax">MathJax 상태 확인</button>
    </div>
    
    <div class="status">
      <h3>상태</h3>
      <p>MathJax 준비: {{ mathJaxReady ? '✅' : '❌' }}</p>
      <p>렌더링 중: {{ isRendering ? '⏳' : '✅' }}</p>
      <p>렌더링 횟수: {{ renderCount }}</p>
      <p>마지막 오류: {{ lastError || '없음' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useMathJax } from '@/composables/useMathJax'

// MathJax 컴포저블 사용
const { 
  render: renderMathJax, 
  isReady: mathJaxReady,
  isRendering,
  renderCount,
  lastError,
  forceRender
} = useMathJax({
  immediate: true,
  watchContent: true,
  debounceDelay: 200,
  hideBeforeRender: false,
  clearFirst: false
})

const dynamicContent = ref('')

// 동적으로 수식 추가
const addFormula = async () => {
  const formulas = [
    '$E = mc^2$',
    '$\\sin(x)^2 + \\cos(x)^2 = 1$',
    '$$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$',
    '$\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}$'
  ]
  const randomFormula = formulas[Math.floor(Math.random() * formulas.length)]
  dynamicContent.value += `<p>새 수식: ${randomFormula}</p>`
  
  await nextTick()
  await renderMathJax()
}

// 수동 렌더링
const manualRender = async () => {
  console.log('수동 렌더링 시작...')
  await forceRender()
  console.log('수동 렌더링 완료!')
  
  // 렌더링된 요소 확인
  const containers = document.querySelectorAll('mjx-container')
  console.log(`렌더링된 MathJax 컨테이너: ${containers.length}개`)
}

// MathJax 상태 확인
const checkMathJax = () => {
  console.log('=== MathJax 상태 확인 ===')
  console.log('window.MathJax:', window.MathJax)
  console.log('MathJax.version:', window.MathJax?.version)
  console.log('MathJax.startup:', window.MathJax?.startup)
  console.log('MathJax.startup.document:', window.MathJax?.startup?.document)
  console.log('MathJax.tex:', window.MathJax?.tex)
  console.log('MathJax 설정:', window.MathJax?.config)
  
  // DOM 확인
  const mathElements = document.querySelectorAll('mjx-container')
  console.log(`현재 렌더링된 수식: ${mathElements.length}개`)
  
  // 수식 텍스트 찾기
  const texPatterns = [
    /\$[^\$]+\$/g,
    /\\\([^\)]+\\\)/g,
    /\$\$[^\$]+\$\$/g,
    /\\\[[^\]]+\\\]/g
  ]
  
  const body = document.body.innerHTML
  let foundMath = false
  texPatterns.forEach(pattern => {
    const matches = body.match(pattern)
    if (matches && matches.length > 0) {
      console.log(`패턴 ${pattern} 매치:`, matches)
      foundMath = true
    }
  })
  
  if (!foundMath) {
    console.log('수식 패턴을 찾을 수 없습니다!')
  }
}

onMounted(() => {
  console.log('MathJaxTest 컴포넌트 마운트됨')
  // 2초 후 자동 체크
  setTimeout(checkMathJax, 2000)
})
</script>

<style scoped>
.mathjax-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin: 30px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h2 {
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

h3 {
  color: #555;
  margin-bottom: 15px;
}

button {
  margin: 5px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.dynamic-content {
  margin-top: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
}

.status {
  margin-top: 30px;
  padding: 20px;
  background-color: #e9ecef;
  border-radius: 8px;
}

.status p {
  margin: 5px 0;
  font-family: monospace;
}

/* MathJax 요소가 보이도록 강제 */
:deep(mjx-container) {
  visibility: visible !important;
  opacity: 1 !important;
  display: inline-block !important;
}

:deep(mjx-container[display="true"]) {
  display: block !important;
  text-align: center;
  margin: 1em 0;
}
</style>