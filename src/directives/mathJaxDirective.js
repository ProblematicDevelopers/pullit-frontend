/**
 * Vue 3 MathJax Directive
 * v-mathjax 지시어를 통해 요소의 MathJax 렌더링을 자동으로 처리
 */

import { renderMathJax } from '@/utils/mathjax'
import { nextTick } from 'vue'

// 렌더링 상태를 추적하기 위한 WeakMap
const renderingMap = new WeakMap()

export const mathJaxDirective = {
  // 요소가 DOM에 삽입되기 전 - 기본적으로 숨김 (CSS에서 처리됨)
  created(el) {
    // visibility: hidden이 CSS에서 이미 적용됨
    // 추가 플래그만 설정
    el.dataset.mathjaxPending = 'true'
  },
  
  // 요소가 DOM에 삽입될 때
  mounted(el, binding) {
    console.log('v-mathjax mounted, element:', el)
    
    // Double RAF를 사용하여 v-html이 확실히 완료되도록 보장
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 이미 MathJax가 렌더링되어 있는지 확인
        const hasMathJaxContainers = el.querySelector('mjx-container') !== null
        
        if (hasMathJaxContainers) {
          console.log('MathJax already rendered, skipping re-render')
          // 이미 렌더링되어 있으면 processed 표시만 하고 종료
          el.classList.add('mathjax-processed')
          delete el.dataset.mathjaxPending
          return
        }
        
        // 수식이 있는지 확인
        const hasFormula = checkForFormulas(el)
        console.log('Has formula:', hasFormula, 'Content:', el.innerHTML.substring(0, 100))
        
        if (!hasFormula) {
          // 수식이 없으면 바로 표시
          el.classList.add('mathjax-processed')
          delete el.dataset.mathjaxPending
          return
        }
        
        // 렌더링 실행
        renderElement(el, binding.value)
      })
    })
  },
  
  // 요소가 업데이트될 때
  updated(el, binding) {
    console.log('v-mathjax updated')
    
    // Double RAF를 사용하여 v-html 업데이트 완료 보장
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 값이 변경되었는지 확인
        const oldValue = renderingMap.get(el)
        const newValue = el.innerHTML
        
        if (oldValue !== newValue) {
          renderingMap.set(el, newValue)
          
          // 이미 MathJax가 렌더링되어 있는지 확인
          const hasMathJaxContainers = el.querySelector('mjx-container') !== null
          
          if (hasMathJaxContainers) {
            console.log('MathJax already rendered in updated content')
            el.classList.add('mathjax-processed')
            delete el.dataset.mathjaxPending
            return
          }
          
          // 수식이 있는지 확인
          const hasFormula = checkForFormulas(el)
          console.log('Updated has formula:', hasFormula)
          
          if (!hasFormula) {
            // 수식이 없으면 바로 표시
            el.classList.add('mathjax-processed')
            delete el.dataset.mathjaxPending
            return
          }
          
          // 숨기고 재렌더링
          el.classList.remove('mathjax-processed')
          el.dataset.mathjaxPending = 'true'
          renderElement(el, binding.value)
        } else {
          // 변경사항이 없으면 다시 표시
          el.classList.add('mathjax-processed')
          delete el.dataset.mathjaxPending
        }
      })
    })
  },
  
  // 요소가 DOM에서 제거되기 전
  beforeUnmount(el) {
    // 렌더링 상태 정리
    renderingMap.delete(el)
  }
}

/**
 * 요소에 수식이 포함되어 있는지 확인
 * @param {HTMLElement} el 
 * @returns {boolean}
 */
function checkForFormulas(el) {
  const text = el.textContent || ''
  return text.includes('$') || 
         text.includes('\\(') || 
         text.includes('\\[') || 
         text.includes('\\begin')
}

/**
 * 요소의 MathJax 렌더링 수행
 * @param {HTMLElement} el 
 * @param {Object} options 
 */
async function renderElement(el, options = {}) {
  try {
    // DOM이 완전히 업데이트되도록 대기
    await nextTick()
    
    // MathJax 렌더링
    await renderMathJax(el, {
      hideBeforeRender: false,  // CSS로 처리하므로 false
      clearFirst: true,
      markProcessed: true,
      ...options
    })
    
    // 렌더링 성공 후 표시
    el.classList.add('mathjax-processed')
    delete el.dataset.mathjaxPending
    
    console.log('MathJax rendering completed for element')
  } catch (error) {
    console.error('v-mathjax 렌더링 오류:', error)
    // 오류 발생 시에도 요소 표시
    el.classList.add('mathjax-processed')
    delete el.dataset.mathjaxPending
  }
}

// 전역 등록을 위한 설치 함수
export function installMathJaxDirective(app) {
  app.directive('mathjax', mathJaxDirective)
}

export default mathJaxDirective