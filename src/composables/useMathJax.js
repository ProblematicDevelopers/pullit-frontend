/**
 * Vue Composable for MathJax
 * Vue 컴포넌트에서 MathJax를 쉽게 사용하기 위한 컴포저블
 */

import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { renderMathJax, renderMathJaxBatch, clearMathJax, waitForMathJax } from '@/utils/mathjax'

/**
 * MathJax 렌더링을 위한 Vue Composable
 * @param {Object} options - 옵션 설정
 */
export const useMathJax = (options = {}) => {
  const {
    immediate = true,           // 마운트 시 즉시 렌더링
    watchContent = true,         // 컨텐츠 변경 감지
    debounceDelay = 200,        // 디바운스 지연 시간
    containerSelector = null,   // 특정 컨테이너 선택자
    hideBeforeRender = true,     // 렌더링 전 수식 숨김
    clearFirst = true           // 렌더링 전 기존 수식 정리
  } = options
  
  // 상태 관리
  const isRendering = ref(false)
  const isReady = ref(false)
  const renderCount = ref(0)
  const lastError = ref(null)
  
  // 디바운스 타이머
  let debounceTimer = null
  let observerInstance = null
  
  /**
   * 단일 요소 렌더링
   * @param {HTMLElement|string} target - 렌더링 대상 요소 또는 선택자
   */
  const render = async (target = null) => {
    try {
      isRendering.value = true
      lastError.value = null
      
      await nextTick()
      
      let element = target
      
      // 문자열 선택자인 경우 요소 찾기
      if (typeof target === 'string') {
        element = document.querySelector(target)
      }
      
      // 컨테이너 선택자가 설정된 경우
      if (!element && containerSelector) {
        element = document.querySelector(containerSelector)
      }
      
      // 렌더링 수행
      await renderMathJax(element, {
        hideBeforeRender,
        clearFirst,
        debounceTime: 0 // 컴포저블 레벨에서 디바운스 처리
      })
      
      renderCount.value++
      
    } catch (error) {
      console.error('MathJax 렌더링 오류:', error)
      lastError.value = error
    } finally {
      isRendering.value = false
    }
  }
  
  /**
   * 디바운스된 렌더링
   * @param {HTMLElement|string} target - 렌더링 대상
   */
  const renderDebounced = (target = null) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    debounceTimer = setTimeout(() => {
      render(target)
    }, debounceDelay)
  }
  
  /**
   * 여러 요소 일괄 렌더링
   * @param {Array<HTMLElement>|string} targets - 렌더링 대상 요소들 또는 선택자
   */
  const renderBatch = async (targets) => {
    try {
      isRendering.value = true
      lastError.value = null
      
      await nextTick()
      
      let elements = targets
      
      // 문자열 선택자인 경우 요소들 찾기
      if (typeof targets === 'string') {
        elements = Array.from(document.querySelectorAll(targets))
      }
      
      // 렌더링 수행
      await renderMathJaxBatch(elements, {
        hideBeforeRender,
        clearFirst
      })
      
      renderCount.value++
      
    } catch (error) {
      console.error('MathJax 일괄 렌더링 오류:', error)
      lastError.value = error
    } finally {
      isRendering.value = false
    }
  }
  
  /**
   * MathJax 정리
   * @param {HTMLElement|string} target - 정리할 요소
   */
  const clear = (target = null) => {
    let element = target
    
    if (typeof target === 'string') {
      element = document.querySelector(target)
    }
    
    if (!element && containerSelector) {
      element = document.querySelector(containerSelector)
    }
    
    if (element) {
      clearMathJax(element)
    }
  }
  
  /**
   * 컨텐츠 변경 감지를 위한 MutationObserver 설정
   * @param {HTMLElement} element - 감지할 요소
   */
  const setupObserver = (element) => {
    if (!element || !watchContent) return
    
    // 기존 옵저버 정리
    if (observerInstance) {
      observerInstance.disconnect()
    }
    
    // 새 옵저버 생성
    observerInstance = new MutationObserver((mutations) => {
      // 텍스트 변경이나 요소 추가/제거 감지
      const hasRelevantChanges = mutations.some(mutation => {
        if (mutation.type === 'characterData') return true
        if (mutation.type === 'childList') {
          // MathJax 컨테이너는 무시
          return !Array.from(mutation.addedNodes).some(node => 
            node.nodeName === 'MJX-CONTAINER' || 
            node.className?.includes('MathJax')
          )
        }
        return false
      })
      
      if (hasRelevantChanges) {
        renderDebounced(element)
      }
    })
    
    // 옵저버 시작
    observerInstance.observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
      characterDataOldValue: false,
      attributes: false
    })
  }
  
  /**
   * 강제 재렌더링
   */
  const forceRender = async () => {
    renderCount.value = 0
    await render()
  }
  
  /**
   * 특정 컨텐츠 변경 시 렌더링
   * @param {any} content - 감시할 컨텐츠
   */
  const watchAndRender = (content) => {
    const stopWatcher = watch(
      () => content,
      () => {
        renderDebounced()
      },
      { deep: true }
    )
    
    return stopWatcher
  }
  
  // 초기화
  onMounted(async () => {
    // MathJax 준비 대기
    await waitForMathJax()
    isReady.value = true
    
    // 즉시 렌더링 옵션이 켜져있으면 렌더링 수행
    if (immediate) {
      await render()
    }
    
    // 컨텐츠 변경 감지 설정
    if (watchContent && containerSelector) {
      const element = document.querySelector(containerSelector)
      if (element) {
        setupObserver(element)
      }
    }
  })
  
  // 정리
  onUnmounted(() => {
    // 타이머 정리
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // 옵저버 정리
    if (observerInstance) {
      observerInstance.disconnect()
    }
    
    // MathJax 렌더링 정리
    if (containerSelector) {
      clear()
    }
  })
  
  return {
    // 상태
    isRendering,
    isReady,
    renderCount,
    lastError,
    
    // 메서드
    render,
    renderDebounced,
    renderBatch,
    clear,
    forceRender,
    watchAndRender,
    setupObserver
  }
}

/**
 * 전역 MathJax 렌더링 훅
 * 페이지 전체 또는 특정 영역의 모든 수식을 렌더링
 */
export const useGlobalMathJax = () => {
  const isReady = ref(false)
  const isRendering = ref(false)
  
  /**
   * 전체 페이지 렌더링
   */
  const renderAll = async () => {
    try {
      isRendering.value = true
      await renderMathJax(document.body, {
        hideBeforeRender: true,
        clearFirst: false // 전체 렌더링 시에는 기존 것 유지
      })
    } finally {
      isRendering.value = false
    }
  }
  
  /**
   * 특정 클래스를 가진 모든 요소 렌더링
   * @param {string} className - 대상 클래스명
   */
  const renderByClass = async (className) => {
    try {
      isRendering.value = true
      const elements = Array.from(document.querySelectorAll(`.${className}`))
      if (elements.length > 0) {
        await renderMathJaxBatch(elements, {
          hideBeforeRender: true
        })
      }
    } finally {
      isRendering.value = false
    }
  }
  
  onMounted(async () => {
    await waitForMathJax()
    isReady.value = true
  })
  
  return {
    isReady,
    isRendering,
    renderAll,
    renderByClass
  }
}

export default useMathJax