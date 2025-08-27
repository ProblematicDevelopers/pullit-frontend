/**
 * MathJax Utility Module
 * Provides optimized MathJax 3 configuration and rendering functions
 */

// MathJax 렌더링 상태 관리
const renderingState = new Map()

/**
 * MathJax 초기화 확인
 */
export const waitForMathJax = () => {
  return new Promise((resolve) => {
    if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
      resolve()
    } else {
      const checkInterval = setInterval(() => {
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
      
      // 5초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval)
        console.warn('MathJax 초기화 타임아웃')
        resolve()
      }, 5000)
    }
  })
}

/**
 * 요소 내부의 수식 숨김 처리
 * @param {HTMLElement} element 
 */
export const hideFormulas = (element) => {
  if (!element) return
  
  // TeX 수식 패턴
  const texPatterns = [
    /\$\$[\s\S]*?\$\$/g,  // Display math
    /\$[^\$\n]+?\$/g,      // Inline math
    /\\\[[\s\S]*?\\\]/g,   // Display math alternative
    /\\\([\s\S]*?\\\)/g    // Inline math alternative
  ]
  
  // 수식을 포함하는 요소들 찾기
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )
  
  const textNodes = []
  let node
  while (node = walker.nextNode()) {
    textNodes.push(node)
  }
  
  textNodes.forEach(textNode => {
    const content = textNode.textContent
    let hasFormula = false
    
    for (const pattern of texPatterns) {
      if (pattern.test(content)) {
        hasFormula = true
        break
      }
    }
    
    if (hasFormula && textNode.parentElement) {
      textNode.parentElement.classList.add('mathjax-processing')
    }
  })
}

/**
 * 요소 내부의 수식 표시 처리
 * @param {HTMLElement} element 
 */
export const showFormulas = (element) => {
  if (!element) return
  
  // 숨김 클래스 제거
  const hiddenElements = element.querySelectorAll('.mathjax-processing')
  hiddenElements.forEach(el => {
    el.classList.remove('mathjax-processing')
    el.classList.add('mathjax-rendered')
  })
  
  // MathJax 컨테이너 표시
  const mathContainers = element.querySelectorAll('mjx-container, .MathJax, .MathJax_Display')
  mathContainers.forEach(container => {
    container.style.visibility = 'visible'
    container.style.opacity = '1'
  })
}

/**
 * MathJax 렌더링 수행 (최적화된 버전 - FOUC 방지 강화)
 * @param {HTMLElement|null} element - 렌더링할 요소 (null이면 전체 문서)
 * @param {Object} options - 렌더링 옵션
 */
export const renderMathJax = async (element = null, options = {}) => {
  const {
    hideBeforeRender = true, // FOUC 방지를 위해 기본값 true로 변경
    clearFirst = true,
    processClass = 'math-content',
    skipTags = ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    debounceTime = 50,
    markProcessed = true, // 처리된 요소 표시 옵션
    forceHide = true // 강제 숨김 처리 추가
  } = options
  
  try {
    // MathJax 준비 대기
    await waitForMathJax()
    
    if (!window.MathJax || !window.MathJax.startup) {
      console.warn('MathJax가 로드되지 않았습니다')
      return
    }
    
    // 렌더링 대상 설정
    const targetElement = element || document.body
    const elementId = element?.id || 'document'
    
    // 중복 렌더링 방지
    if (renderingState.has(elementId)) {
      const lastRender = renderingState.get(elementId)
      if (Date.now() - lastRender < debounceTime) {
        return
      }
    }
    renderingState.set(elementId, Date.now())
    
    // FOUC 방지: 렌더링 전 요소 숨김 처리
    if (forceHide) {
      targetElement.style.visibility = 'hidden'
      targetElement.dataset.mathjaxPending = 'true'
    }
    
    // hideBeforeRender가 true일 때만 수동으로 숨김 처리
    if (hideBeforeRender) {
      // 수식을 포함할 가능성이 있는 요소들을 찾아서 표시
      const potentialMathElements = targetElement.querySelectorAll(
        '.item-html, .choice-text, .question-text, .math-content, [data-mathjax], p, div, span, td, th'
      )
      
      potentialMathElements.forEach(el => {
        const text = el.textContent || ''
        // LaTeX 패턴 검사
        if (text.includes('$') || text.includes('\\(') || text.includes('\\[') || 
            text.includes('\\begin{') || text.includes('\\frac')) {
          if (!el.classList.contains('mathjax-formula') && !el.classList.contains('mathjax-processed')) {
            el.classList.add('mathjax-formula')
          }
        }
      })
    }
    
    // 기존 MathJax 렌더링 정리
    if (clearFirst) {
      const existingMath = targetElement.querySelectorAll('mjx-container, .MathJax, .MathJax_Display, .MathJax_Preview')
      existingMath.forEach(el => el.remove())
      
      // MathJax 문서 초기화
      if (window.MathJax.startup.document) {
        window.MathJax.startup.document.clear()
        window.MathJax.startup.document.updateDocument()
      }
    }
    
    // MathJax 렌더링 수행
    console.log('MathJax 렌더링 시작:', targetElement)
    
    // Document update to recognize new math
    if (window.MathJax.startup.document) {
      window.MathJax.startup.document.updateDocument()
    }
    
    // MathJax typesetting 실행 - Promise를 사용한 안전한 렌더링
    try {
      await window.MathJax.typesetPromise([targetElement])
      console.log('MathJax 렌더링 완료')
      
      // 렌더링 성공 후 즉시 표시
      if (forceHide) {
        // 작은 지연 후 표시 (레이아웃 안정화)
        await new Promise(resolve => requestAnimationFrame(resolve))
        targetElement.style.visibility = 'visible'
        delete targetElement.dataset.mathjaxPending
      }
    } catch (typesetError) {
      console.error('MathJax typesetting 오류:', typesetError)
      // 오류 발생 시에도 요소 표시
      if (forceHide) {
        targetElement.style.visibility = 'visible'
        delete targetElement.dataset.mathjaxPending
      }
      throw typesetError
    }
    
    // 렌더링 결과 확인
    const renderedContainers = targetElement.querySelectorAll('mjx-container')
    console.log(`렌더링된 수식 개수: ${renderedContainers.length}`)
    
    // 렌더링 완료 후 처리
    if (markProcessed) {
      // mathjax-processed 클래스 추가 (디렉티브에서 사용)
      targetElement.classList.add('mathjax-processed')
      
      // 숨김 클래스 제거 (필요한 경우)
      if (hideBeforeRender) {
        const hiddenElements = targetElement.querySelectorAll('.mathjax-formula')
        hiddenElements.forEach(el => {
          el.classList.remove('mathjax-formula')
          el.classList.add('mathjax-processed')
        })
      }
    }
    
    // 렌더링 완료 후 처리된 요소 표시
    if (markProcessed) {
      targetElement.classList.add('mathjax-processed')
      
      // mjx-container가 생성된 부모 요소들도 처리됨 표시
      const processedElements = targetElement.querySelectorAll('mjx-container')
      processedElements.forEach(mjx => {
        if (mjx.parentElement) {
          mjx.parentElement.classList.add('mathjax-processed')
        }
      })
    }
    
    // 렌더링 완료 이벤트 발생
    targetElement.dispatchEvent(new CustomEvent('mathjax:rendered', {
      bubbles: true,
      detail: { element: targetElement }
    }))
    
  } catch (error) {
    console.error('MathJax 렌더링 오류:', error)
    // 오류 발생 시에도 요소들이 보이도록 처리
    const targetElement = element || document.body
    if (forceHide && targetElement) {
      targetElement.style.visibility = 'visible'
      delete targetElement.dataset.mathjaxPending
    }
    if (hideBeforeRender && targetElement) {
      const hiddenElements = targetElement.querySelectorAll('.mathjax-formula')
      hiddenElements.forEach(el => {
        el.classList.remove('mathjax-formula')
        el.classList.add('mathjax-error')
      })
    }
  }
}

/**
 * MathJax 일괄 렌더링 (여러 요소를 효율적으로 렌더링)
 * @param {Array<HTMLElement>} elements - 렌더링할 요소 배열
 * @param {Object} options - 렌더링 옵션
 */
export const renderMathJaxBatch = async (elements, options = {}) => {
  try {
    await waitForMathJax()
    
    if (!window.MathJax || !window.MathJax.startup) {
      console.warn('MathJax가 로드되지 않았습니다')
      return
    }
    
    // 모든 요소 숨김 처리
    if (options.hideBeforeRender !== false) {
      elements.forEach(el => hideFormulas(el))
    }
    
    // 일괄 렌더링
    await window.MathJax.typesetPromise(elements)
    
    // 모든 요소 표시
    if (options.hideBeforeRender !== false) {
      await new Promise(resolve => setTimeout(resolve, 50))
      elements.forEach(el => showFormulas(el))
    }
    
  } catch (error) {
    console.error('MathJax 일괄 렌더링 오류:', error)
    elements.forEach(el => showFormulas(el))
  }
}

/**
 * MathJax 재설정 (전역 설정 업데이트)
 * @param {Object} config - 새로운 설정
 */
export const resetMathJax = async (config = {}) => {
  try {
    await waitForMathJax()
    
    if (window.MathJax && window.MathJax.startup) {
      // 기존 렌더링 정리
      if (window.MathJax.startup.document) {
        window.MathJax.startup.document.clear()
      }
      
      // 설정 업데이트
      window.MathJax.config = {
        ...window.MathJax.config,
        ...config
      }
      
      // MathJax 재시작
      await window.MathJax.startup.getComponents()
      
      console.log('MathJax 재설정 완료')
    }
  } catch (error) {
    console.error('MathJax 재설정 오류:', error)
  }
}

/**
 * MathJax 렌더링 정리
 * @param {HTMLElement} element - 정리할 요소
 */
export const clearMathJax = (element) => {
  if (!element) return
  
  const mathElements = element.querySelectorAll('mjx-container, .MathJax, .MathJax_Display, .MathJax_Preview')
  mathElements.forEach(el => el.remove())
  
  // 클래스 정리
  const processedElements = element.querySelectorAll('.mathjax-processing, .mathjax-rendered')
  processedElements.forEach(el => {
    el.classList.remove('mathjax-processing', 'mathjax-rendered')
  })
}

// 전역 스타일 추가 - FOUC 방지 강화 버전
const addGlobalStyles = () => {
  if (document.getElementById('mathjax-global-styles')) return
  
  const style = document.createElement('style')
  style.id = 'mathjax-global-styles'
  style.innerHTML = `
    /* 렌더링 전 수식 숨기기 (index.html의 스타일과 동기화) */
    .mathjax-formula {
      visibility: hidden !important;
      position: relative;
    }
    
    /* MathJax 컨테이너는 항상 표시 */
    mjx-container {
      visibility: visible !important;
      opacity: 1 !important;
      display: inline-block !important;
      overflow: visible !important;
      max-width: 100%;
      padding: 2px 0;
    }
    
    /* 블록 수식 중앙 정렬 */
    mjx-container[display="true"] {
      display: block !important;
      text-align: center;
      margin: 1em 0;
    }
    
    /* 인라인 수식 정렬 */
    mjx-container[display="false"] {
      display: inline-block !important;
      vertical-align: middle;
    }
    
    /* MathJax 요소 표시 */
    .MathJax, .MathJax_Display {
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* 렌더링 전 원본 텍스트 숨기기 - $ 기호가 포함된 텍스트를 찾아서 처리 */
    .mathjax-hide-source {
      font-size: 0 !important;
      color: transparent !important;
      user-select: none !important;
    }
    
    /* 렌더링 완료 후 표시 */
    .mathjax-processed {
      visibility: visible !important;
    }
    
    /* 문제 카드 내 수식 스타일 */
    .item-html mjx-container,
    .choice mjx-container {
      margin: 0.2em 0;
    }
    
    /* 수식이 있는 선택지 정렬 */
    .choice {
      display: flex;
      align-items: baseline;
      gap: 0.5em;
    }
    
    .choice mjx-container[display="false"] {
      vertical-align: baseline;
    }
    
    /* 렌더링 에러 시 원본 표시 */
    .mathjax-error {
      color: #d32f2f;
      font-style: italic;
    }
  `
  document.head.appendChild(style)
}

// 초기화 시 전역 스타일 추가
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addGlobalStyles)
  } else {
    addGlobalStyles()
  }
}

export default {
  waitForMathJax,
  renderMathJax,
  renderMathJaxBatch,
  resetMathJax,
  clearMathJax,
  hideFormulas,
  showFormulas
}