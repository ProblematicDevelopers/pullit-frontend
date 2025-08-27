<template>
  <div class="mathjax-fouc-test">
    <h2>MathJax FOUC Test Component</h2>
    
    <div class="test-controls">
      <button @click="toggleContent" class="btn btn-primary">Toggle Content</button>
      <button @click="addFormula" class="btn btn-success">Add Formula</button>
      <button @click="clearFormulas" class="btn btn-danger">Clear All</button>
    </div>

    <div class="test-sections">
      <!-- Static Math Test -->
      <section class="test-section">
        <h3>Static Math Content</h3>
        <div v-mathjax class="math-content">
          <p>Inline math: $E = mc^2$ and $\sqrt{x^2 + y^2}$</p>
          <p>Display math:</p>
          <p>$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$</p>
        </div>
      </section>

      <!-- Dynamic Math Test -->
      <section class="test-section">
        <h3>Dynamic Math Content</h3>
        <div v-if="showDynamic" v-mathjax class="math-content">
          <p v-html="dynamicContent"></p>
        </div>
      </section>

      <!-- List of Formulas -->
      <section class="test-section">
        <h3>Formula List ({{ formulas.length }} items)</h3>
        <div class="formula-list">
          <div 
            v-for="(formula, index) in formulas" 
            :key="index"
            v-mathjax
            class="formula-item"
          >
            <span class="formula-index">{{ index + 1 }}.</span>
            <span v-html="formula"></span>
          </div>
        </div>
      </section>

      <!-- Complex Math Test -->
      <section class="test-section">
        <h3>Complex Math Expressions</h3>
        <div v-mathjax class="math-content">
          <p>Matrix: $$\begin{bmatrix} a & b \\ c & d \end{bmatrix}$$</p>
          <p>Fraction: $$\frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$</p>
          <p>Sum: $$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$</p>
        </div>
      </section>
    </div>

    <!-- Performance Monitor -->
    <div class="performance-monitor">
      <h4>Performance Monitor</h4>
      <p>Render Count: {{ renderCount }}</p>
      <p>Last Render Time: {{ lastRenderTime }}ms</p>
      <p>FOUC Detected: {{ foucDetected ? 'Yes' : 'No' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useMathJax } from '@/composables/useMathJax'

// MathJax composable with optimized settings
const { render: renderMath, renderCount } = useMathJax({
  immediate: false,
  hideBeforeRender: true,
  clearFirst: false,
  waitForContent: true,
  debounceDelay: 50
})

// State
const showDynamic = ref(true)
const dynamicContent = ref('Dynamic equation: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$')
const formulas = ref([
  '$a^2 + b^2 = c^2$',
  '$\\sin^2(x) + \\cos^2(x) = 1$',
  '$e^{i\\pi} + 1 = 0$'
])

// Performance monitoring
const lastRenderTime = ref(0)
const foucDetected = ref(false)

// Methods
const toggleContent = async () => {
  showDynamic.value = !showDynamic.value
  
  if (showDynamic.value) {
    // Measure render time
    const startTime = performance.now()
    await nextTick()
    await renderMath()
    lastRenderTime.value = Math.round(performance.now() - startTime)
  }
}

const addFormula = async () => {
  const newFormulas = [
    '$\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}$',
    '$\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I$',
    '$F = G\\frac{m_1 m_2}{r^2}$',
    '$\\Delta S \\geq 0$',
    '$\\psi(x,t) = Ae^{i(kx-\\omega t)}$'
  ]
  
  const randomFormula = newFormulas[Math.floor(Math.random() * newFormulas.length)]
  formulas.value.push(randomFormula)
  
  // Measure render time
  const startTime = performance.now()
  await nextTick()
  await renderMath()
  lastRenderTime.value = Math.round(performance.now() - startTime)
}

const clearFormulas = () => {
  formulas.value = []
}

// FOUC Detection
const detectFOUC = () => {
  // Check for visible LaTeX syntax
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent
            if (text && (text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
              // Check if the text is visible
              const parent = node.parentElement
              if (parent && window.getComputedStyle(parent).visibility !== 'hidden') {
                console.warn('FOUC detected: LaTeX visible before rendering')
                foucDetected.value = true
              }
            }
          }
        })
      }
    })
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  return observer
}

// Lifecycle
onMounted(async () => {
  // Start FOUC detection
  const observer = detectFOUC()
  
  // Initial render
  const startTime = performance.now()
  await renderMath()
  lastRenderTime.value = Math.round(performance.now() - startTime)
  
  // Stop detection after initial render
  setTimeout(() => {
    observer.disconnect()
  }, 2000)
})
</script>

<style scoped>
.mathjax-fouc-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.test-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.test-section {
  padding: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.test-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.math-content {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  min-height: 100px;
}

.formula-list {
  max-height: 300px;
  overflow-y: auto;
}

.formula-item {
  padding: 10px;
  margin: 5px 0;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  min-height: 40px;
}

.formula-index {
  font-weight: bold;
  margin-right: 10px;
  color: #666;
}

.performance-monitor {
  margin-top: 20px;
  padding: 15px;
  background: #2c3e50;
  color: white;
  border-radius: 8px;
  font-family: monospace;
}

.performance-monitor h4 {
  margin-top: 0;
  color: #3498db;
}

.performance-monitor p {
  margin: 5px 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

/* Ensure math content doesn't jump */
.math-content p {
  margin: 10px 0;
  line-height: 1.6;
}
</style>