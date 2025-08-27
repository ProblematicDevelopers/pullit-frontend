/**
 * MathJax 하이브리드 렌더링
 * 기존 renderMath 함수와 병렬 처리를 결합
 */

import { renderMathJax, waitForMathJax } from './mathjax'

/**
 * 병렬 MathJax 렌더링 - 기존 renderMathJax를 Promise.all로 처리
 * @param {NodeList|Array} elements - 렌더링할 요소들
 * @param {Object} options - 렌더링 옵션
 */
export const renderMathJaxParallelHybrid = async (elements, options = {}) => {
  if (!elements || elements.length === 0) return
  
  const elementsArray = Array.from(elements)
  console.log(`🚀 병렬 렌더링 시작: ${elementsArray.length}개 요소`)
  const startTime = performance.now()
  
  try {
    // MathJax 준비 대기
    await waitForMathJax()
    
    // Promise.all을 사용하여 모든 요소를 병렬로 렌더링
    await Promise.all(
      elementsArray.map(element => 
        renderMathJax(element, {
          hideBeforeRender: true,
          clearFirst: false,
          debounceTime: 0,  // 디바운싱 제거로 즉시 실행
          ...options
        })
      )
    )
    
    // 렌더링 완료 후 처리
    elementsArray.forEach(el => {
      if (el.hasAttribute('data-mathjax-pending')) {
        el.removeAttribute('data-mathjax-pending')
      }
      el.classList.add('mathjax-rendered')
    })
    
    const endTime = performance.now()
    console.log(`✅ 병렬 렌더링 완료: ${(endTime - startTime).toFixed(2)}ms`)
    
  } catch (error) {
    console.error('병렬 렌더링 오류, 순차 렌더링으로 폴백:', error)
    // 오류 시 순차 렌더링으로 폴백
    for (const element of elementsArray) {
      try {
        await renderMathJax(element, options)
        element.removeAttribute('data-mathjax-pending')
      } catch (e) {
        console.error('요소 렌더링 실패:', e)
      }
    }
  }
}

/**
 * 스마트 렌더링 - 요소 수에 따라 전략 선택
 * @param {HTMLElement} container - 컨테이너 요소
 * @param {Object} options - 렌더링 옵션
 */
export const renderMathJaxSmartHybrid = async (container, options = {}) => {
  await waitForMathJax()
  
  const elements = container.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  const count = elements.length
  
  if (count === 0) return
  
  console.log(`🎯 스마트 렌더링: ${count}개 요소 감지`)
  
  if (count <= 20) {
    // 20개 이하: 병렬 렌더링
    console.log('전략: 병렬 렌더링')
    await renderMathJaxParallelHybrid(elements, options)
  } else {
    // 20개 초과: 점진적 렌더링
    console.log('전략: 점진적 렌더링')
    
    // 화면에 보이는 요소 우선 렌더링
    const visibleElements = []
    const hiddenElements = []
    
    Array.from(elements).forEach(el => {
      const rect = el.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0
      if (isVisible) {
        visibleElements.push(el)
      } else {
        hiddenElements.push(el)
      }
    })
    
    // 보이는 요소 먼저 병렬 렌더링
    if (visibleElements.length > 0) {
      await renderMathJaxParallelHybrid(visibleElements, options)
    }
    
    // 나머지 요소 병렬 렌더링 (약간의 지연)
    if (hiddenElements.length > 0) {
      setTimeout(async () => {
        await renderMathJaxParallelHybrid(hiddenElements, options)
      }, 100)
    }
  }
}

export default {
  renderMathJaxParallelHybrid,
  renderMathJaxSmartHybrid
}