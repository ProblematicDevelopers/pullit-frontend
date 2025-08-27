/**
 * Simplified MathJax Utility Module
 * 단순하고 안정적인 MathJax 렌더링
 */

/**
 * MathJax 초기화 대기
 */
export const waitForMathJax = () => {
  return new Promise((resolve) => {
    const checkMathJax = () => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        resolve()
      } else {
        setTimeout(checkMathJax, 100)
      }
    }
    checkMathJax()
  })
}

/**
 * 단순 MathJax 렌더링
 * @param {HTMLElement|null} element - 렌더링할 요소
 */
export const renderMathJaxSimple = async (element = null) => {
  try {
    await waitForMathJax()
    
    const target = element || document.body
    
    // 기존 MathJax 컨테이너 제거
    const existing = target.querySelectorAll('mjx-container')
    existing.forEach(el => el.remove())
    
    // MathJax 문서 초기화
    if (window.MathJax.startup?.document) {
      window.MathJax.startup.document.clear()
      window.MathJax.startup.document.updateDocument()
    }
    
    // 렌더링 수행
    console.log('Simple MathJax render start')
    console.log('Target element:', target)
    console.log('HTML content sample:', target.innerHTML.substring(0, 500))
    
    await window.MathJax.typesetPromise([target])
    console.log('Simple MathJax render complete')
    
    // 렌더링된 컨테이너 확인 및 강제 표시
    const containers = target.querySelectorAll('mjx-container')
    console.log(`Rendered ${containers.length} formulas`)
    
    // 모든 MathJax 컨테이너를 강제로 표시
    containers.forEach(container => {
      container.style.visibility = 'visible'
      container.style.opacity = '1'
      container.style.display = container.hasAttribute('display') && container.getAttribute('display') === 'true' 
        ? 'block' 
        : 'inline-block'
    })
    
    // MathJax 관련 모든 요소 표시
    const mathElements = target.querySelectorAll('.MathJax, .MathJax_Display')
    mathElements.forEach(el => {
      el.style.visibility = 'visible'
      el.style.opacity = '1'
    })
    
    return containers.length
    
  } catch (error) {
    console.error('MathJax render error:', error)
    return 0
  }
}

// 전역 스타일 추가
const addSimpleStyles = () => {
  if (document.getElementById('mathjax-simple-styles')) return
  
  const style = document.createElement('style')
  style.id = 'mathjax-simple-styles'
  style.innerHTML = `
    /* MathJax 컨테이너 기본 스타일 - 강제 표시 */
    mjx-container {
      display: inline-block !important;
      visibility: visible !important;
      opacity: 1 !important;
      margin: 0.1em 0.25em;
      font-size: inherit;
      /* overflow visible로 설정하여 스크롤바 제거 */
      overflow: visible !important;
    }
    
    /* 블록 수식 */
    mjx-container[display="true"] {
      display: block !important;
      text-align: center;
      margin: 1em 0;
    }
    
    /* MathJax 관련 모든 요소 강제 표시 */
    .MathJax, .MathJax_Display {
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* 문제 카드 내 수식 */
    .item-html mjx-container,
    .item-text mjx-container,
    .choice mjx-container {
      vertical-align: middle;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* 선택지 정렬 */
    .choice {
      display: flex;
      align-items: baseline;
      gap: 0.5em;
    }
  `
  document.head.appendChild(style)
}

// 페이지 로드 시 스타일 추가
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSimpleStyles)
  } else {
    addSimpleStyles()
  }
}

export default {
  waitForMathJax,
  renderMathJaxSimple
}