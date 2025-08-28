/**
 * Safe parallel MathJax rendering
 * 점진적 개선을 위한 안전한 병렬 렌더링 유틸리티
 */

import { renderMathJax, renderMathJaxBatch, waitForMathJax } from './mathjax'

/**
 * 안전한 병렬 렌더링 - Promise.all 사용
 * @param {NodeList|Array} elements - 렌더링할 요소들
 * @param {Object} options - 옵션
 */
export const renderMathJaxParallelSafe = async (elements, options = {}) => {
  if (!elements || elements.length === 0) return
  
  const elementsArray = Array.from(elements)
  console.log(`병렬 렌더링 시작: ${elementsArray.length}개 요소`)
  
  try {
    // MathJax 준비 대기
    await waitForMathJax()
    
    // 기존 renderMathJaxBatch가 있으면 사용
    if (typeof renderMathJaxBatch === 'function') {
      console.log('renderMathJaxBatch 사용')
      await renderMathJaxBatch(elementsArray, {
        hideBeforeRender: true,
        clearFirst: false,
        ...options
      })
    } else {
      // 없으면 Promise.all로 병렬 처리
      console.log('Promise.all 병렬 처리')
      await Promise.all(
        elementsArray.map(element => 
          renderMathJax(element, {
            hideBeforeRender: true,
            clearFirst: false,
            debounceTime: 0,
            ...options
          })
        )
      )
    }
    
    console.log('병렬 렌더링 완료')
  } catch (error) {
    console.error('병렬 렌더링 오류, 순차 렌더링으로 폴백:', error)
    // 오류 시 순차 렌더링으로 폴백
    for (const element of elementsArray) {
      try {
        await renderMathJax(element, options)
      } catch (e) {
        console.error('요소 렌더링 실패:', e)
      }
    }
  }
}

export default renderMathJaxParallelSafe