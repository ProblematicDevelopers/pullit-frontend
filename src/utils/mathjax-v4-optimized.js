/**
 * MathJax 4.0 최적화된 렌더링 유틸리티
 * 
 * MathJax 4.0의 새로운 기능 활용:
 * - Promise 기반 렌더링 API
 * - 동적 폰트 로딩
 * - 향상된 렌더링 성능
 * - Lazy typesetting 지원
 */

/**
 * MathJax 초기화 및 대기
 */
export const waitForMathJax = () => {
  return new Promise((resolve) => {
    if (window.MathJax?.startup?.document) {
      resolve()
    } else {
      const checkInterval = setInterval(() => {
        if (window.MathJax?.startup?.document) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)
      
      // 타임아웃 설정 (5초)
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    }
  })
}

/**
 * 병렬 렌더링을 위한 최적화된 MathJax 4.0 렌더링
 * Promise.all()을 사용하여 모든 요소를 동시에 렌더링
 * 
 * @param {NodeList|Array|HTMLElement} target - 렌더링 대상
 * @param {Object} options - 렌더링 옵션
 */
export const renderMathJaxParallelV4 = async (target, options = {}) => {
  await waitForMathJax()
  
  if (!window.MathJax?.typesetPromise) {
    console.warn('MathJax 4.0 API를 사용할 수 없습니다')
    return
  }
  
  // 타겟 요소 배열로 변환
  let elements = []
  if (target instanceof NodeList) {
    elements = Array.from(target)
  } else if (Array.isArray(target)) {
    elements = target
  } else if (target instanceof HTMLElement) {
    // 단일 요소인 경우, 내부의 모든 MathJax 컨텐츠 찾기
    elements = [target]
  }
  
  if (elements.length === 0) return
  
  console.log(`🚀 MathJax 4.0 병렬 렌더링 시작: ${elements.length}개 요소`)
  const startTime = performance.now()
  
  try {
    // MathJax 4.0의 typesetPromise는 여러 요소를 한 번에 처리 가능
    // 이렇게 하면 내부적으로 최적화된 방식으로 렌더링됨
    if (elements.length > 1) {
      // 배치 렌더링: 모든 요소를 한 번에 전달
      await window.MathJax.typesetPromise(elements)
    } else {
      // 단일 요소 렌더링
      await window.MathJax.typesetPromise(elements)
    }
    
    // 렌더링 완료 후 처리
    elements.forEach(el => {
      // data-mathjax-pending 속성 제거
      if (el.hasAttribute('data-mathjax-pending')) {
        el.removeAttribute('data-mathjax-pending')
      }
      // 완료 클래스 추가
      el.classList.add('mathjax-rendered')
      
      // 이벤트 발생
      el.dispatchEvent(new CustomEvent('mathjax:rendered', {
        bubbles: true,
        detail: { element: el }
      }))
    })
    
    const endTime = performance.now()
    console.log(`✅ MathJax 4.0 병렬 렌더링 완료: ${(endTime - startTime).toFixed(2)}ms`)
    
  } catch (error) {
    console.error('MathJax 4.0 렌더링 오류:', error)
    
    // 오류 발생 시 순차 렌더링으로 폴백
    console.log('순차 렌더링으로 폴백')
    for (const el of elements) {
      try {
        await window.MathJax.typesetPromise([el])
        el.removeAttribute('data-mathjax-pending')
        el.classList.add('mathjax-rendered')
      } catch (e) {
        console.error('개별 요소 렌더링 실패:', e)
      }
    }
  }
}

/**
 * 점진적 렌더링 (Progressive Rendering)
 * 화면에 보이는 요소부터 우선적으로 렌더링
 */
export const renderMathJaxProgressive = async (container, options = {}) => {
  await waitForMathJax()
  
  const elements = container.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  if (elements.length === 0) return
  
  console.log(`📈 점진적 렌더링 시작: ${elements.length}개 요소`)
  
  // 요소들을 화면상 위치에 따라 정렬
  const sortedElements = Array.from(elements).sort((a, b) => {
    const rectA = a.getBoundingClientRect()
    const rectB = b.getBoundingClientRect()
    return rectA.top - rectB.top
  })
  
  // 화면에 보이는 요소 우선 렌더링
  const visibleElements = []
  const hiddenElements = []
  
  sortedElements.forEach(el => {
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
    await renderMathJaxParallelV4(visibleElements, options)
  }
  
  // 나머지 요소 병렬 렌더링
  if (hiddenElements.length > 0) {
    // 약간의 지연 후 렌더링하여 초기 로딩 성능 향상
    setTimeout(async () => {
      await renderMathJaxParallelV4(hiddenElements, options)
    }, 100)
  }
}

/**
 * Lazy Loading 설정 (스크롤 시 렌더링)
 * IntersectionObserver를 사용하여 뷰포트에 들어올 때 렌더링
 */
export const setupMathJaxLazyLoading = (container, options = {}) => {
  const { rootMargin = '200px', threshold = 0.1 } = options
  
  // IntersectionObserver 설정
  const observer = new IntersectionObserver(async (entries) => {
    const toRender = []
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target
        if (element.hasAttribute('data-mathjax-pending')) {
          toRender.push(element)
          observer.unobserve(element) // 한 번만 렌더링
        }
      }
    })
    
    // 보이는 요소들 병렬 렌더링
    if (toRender.length > 0) {
      await renderMathJaxParallelV4(toRender, options)
    }
  }, {
    rootMargin,
    threshold
  })
  
  // 모든 pending 요소 관찰
  const elements = container.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  elements.forEach(el => observer.observe(el))
  
  // cleanup 함수 반환
  return () => {
    observer.disconnect()
  }
}

/**
 * MathJax 4.0 설정 최적화
 * 성능 향상을 위한 설정 적용
 */
export const configureMathJaxV4 = () => {
  if (!window.MathJax) {
    window.MathJax = {}
  }
  
  // MathJax 4.0 최적화 설정
  window.MathJax = {
    ...window.MathJax,
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
      // 성능 최적화: 불필요한 기능 비활성화
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'select', 'option']
    },
    options: {
      // 렌더링 성능 최적화
      enableMenu: false, // 컨텍스트 메뉴 비활성화로 성능 향상
      enableExplorer: false, // 접근성 탐색기 비활성화
      enableAssistiveMml: false, // 보조 MathML 비활성화
      // 렌더링 옵션
      renderActions: {
        findScript: [10, doc => {
          // 스크립트 찾기 최적화
          for (const node of document.querySelectorAll('.mathjax-content')) {
            if (!node.querySelector('mjx-container')) {
              doc.addMathItem(node)
            }
          }
        }, '']
      }
    },
    chtml: {
      // CHTML 출력 최적화
      scale: 1,
      minScale: 0.5,
      mtextInheritFont: false,
      merrorInheritFont: false,
      mathmlSpacing: false,
      skipAttributes: {}, 
      exFactor: 0.5,
      displayAlign: 'center',
      displayIndent: '0',
      // 폰트 로딩 최적화
      fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@4/es5/output/chtml/fonts/woff-v2'
    },
    startup: {
      // 시작 시 설정
      pageReady: () => {
        console.log('MathJax 4.0 준비 완료')
        return window.MathJax.startup.defaultPageReady()
      }
    }
  }
}

/**
 * 스마트 렌더링 선택
 * 요소 수와 상황에 따라 최적의 렌더링 방식 자동 선택
 */
export const renderMathJaxSmart = async (container, options = {}) => {
  await waitForMathJax()
  
  const elements = container.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  const count = elements.length
  
  if (count === 0) return
  
  console.log(`🎯 스마트 렌더링: ${count}개 요소 감지`)
  
  // 요소 수에 따라 렌더링 전략 선택
  if (count <= 10) {
    // 적은 수: 병렬 렌더링
    console.log('전략: 병렬 렌더링 (요소 10개 이하)')
    await renderMathJaxParallelV4(elements, options)
  } else if (count <= 30) {
    // 중간: 점진적 렌더링
    console.log('전략: 점진적 렌더링 (요소 11-30개)')
    await renderMathJaxProgressive(container, options)
  } else {
    // 많은 수: Lazy Loading
    console.log('전략: Lazy Loading (요소 30개 초과)')
    setupMathJaxLazyLoading(container, options)
    // 초기에 보이는 요소만 즉시 렌더링
    const visibleElements = Array.from(elements).filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.top < window.innerHeight && rect.bottom > 0
    })
    if (visibleElements.length > 0) {
      await renderMathJaxParallelV4(visibleElements, options)
    }
  }
}

// 기본 export
export default {
  waitForMathJax,
  renderMathJaxParallelV4,
  renderMathJaxProgressive,
  setupMathJaxLazyLoading,
  configureMathJaxV4,
  renderMathJaxSmart
}