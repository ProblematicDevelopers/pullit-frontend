/**
 * Optimized MathJax Composable for Vue
 * 
 * Provides high-performance MathJax rendering with parallel processing,
 * lazy loading, and progressive rendering capabilities.
 */

import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { 
  renderMathJaxOptimized, 
  setupLazyMathJaxRendering,
  renderMathJaxProgressive,
  renderMathJaxParallel
} from '@/utils/mathjax-performance'
import { waitForMathJax } from '@/utils/mathjax'

/**
 * Optimized MathJax rendering composable with performance enhancements
 * @param {Object} options - Configuration options
 */
export const useMathJaxOptimized = (options = {}) => {
  const {
    immediate = true,           // Auto render on mount
    method = 'parallel',        // 'parallel', 'progressive', 'lazy'
    batchSize = 10,            // Batch size for rendering
    delay = 50,                // Delay between batches (progressive mode)
    visibleFirst = true,       // Prioritize visible elements
    rootMargin = '200px',      // Lazy loading margin
    containerSelector = null,  // Container for scoped rendering
    watchContent = true,       // Watch for content changes
    debounceDelay = 100       // Debounce for content changes
  } = options
  
  // State
  const isRendering = ref(false)
  const isReady = ref(false)
  const renderCount = ref(0)
  const lastError = ref(null)
  const cleanupFunctions = []
  
  // Debounce timer
  let debounceTimer = null
  let observerInstance = null
  
  /**
   * Main render function with optimization
   * @param {HTMLElement|NodeList|Array|string} target - Rendering target
   */
  const render = async (target = null) => {
    try {
      isRendering.value = true
      lastError.value = null
      
      await nextTick()
      
      // Determine target element(s)
      let targetElement = target
      
      if (!targetElement && containerSelector) {
        targetElement = document.querySelector(containerSelector)
      }
      
      if (!targetElement) {
        targetElement = document.body
      }
      
      // Perform optimized rendering
      await renderMathJaxOptimized(targetElement, {
        method,
        batchSize,
        delay,
        visibleFirst,
        hideBeforeRender: true,
        clearFirst: false,
        markProcessed: true
      })
      
      renderCount.value++
      
    } catch (error) {
      console.error('Optimized MathJax rendering error:', error)
      lastError.value = error
    } finally {
      isRendering.value = false
    }
  }
  
  /**
   * Render with debouncing
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
   * Render all pending elements in parallel
   */
  const renderAllParallel = async () => {
    try {
      isRendering.value = true
      
      const elements = document.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
      if (elements.length > 0) {
        await renderMathJaxParallel(elements, {
          batchSize,
          hideBeforeRender: true,
          clearFirst: false
        })
        
        elements.forEach(el => el.removeAttribute('data-mathjax-pending'))
      }
      
      renderCount.value++
    } catch (error) {
      console.error('Parallel rendering error:', error)
      lastError.value = error
    } finally {
      isRendering.value = false
    }
  }
  
  /**
   * Setup lazy loading for container
   */
  const setupLazyLoading = (container = null) => {
    const targetContainer = container || 
                           (containerSelector ? document.querySelector(containerSelector) : null) ||
                           document.body
    
    if (targetContainer) {
      const cleanup = setupLazyMathJaxRendering(targetContainer, {
        rootMargin,
        selector: '.mathjax-content'
      })
      
      cleanupFunctions.push(cleanup)
      return cleanup
    }
  }
  
  /**
   * Progressive rendering with visible elements first
   */
  const renderProgressive = async (container = null) => {
    try {
      isRendering.value = true
      
      const targetContainer = container || 
                             (containerSelector ? document.querySelector(containerSelector) : null) ||
                             document.body
      
      await renderMathJaxProgressive(targetContainer, {
        batchSize,
        delay,
        visibleFirst,
        selector: '.mathjax-content'
      })
      
      renderCount.value++
    } catch (error) {
      console.error('Progressive rendering error:', error)
      lastError.value = error
    } finally {
      isRendering.value = false
    }
  }
  
  /**
   * Setup content observer for dynamic updates
   */
  const setupContentObserver = (element) => {
    if (!element || !watchContent) return
    
    // Clean up existing observer
    if (observerInstance) {
      observerInstance.disconnect()
    }
    
    observerInstance = new MutationObserver((mutations) => {
      const hasRelevantChanges = mutations.some(mutation => {
        if (mutation.type === 'characterData') return true
        if (mutation.type === 'childList') {
          // Ignore MathJax containers
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
    
    observerInstance.observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
      characterDataOldValue: false,
      attributes: false
    })
  }
  
  /**
   * Force re-render all content
   */
  const forceRender = async () => {
    renderCount.value = 0
    await render()
  }
  
  /**
   * Watch and render on content change
   */
  const watchAndRender = (content) => {
    const stopWatcher = watch(
      () => content,
      () => renderDebounced(),
      { deep: true }
    )
    
    cleanupFunctions.push(stopWatcher)
    return stopWatcher
  }
  
  // Lifecycle hooks
  onMounted(async () => {
    await waitForMathJax()
    isReady.value = true
    
    // Setup based on method
    if (method === 'lazy') {
      setupLazyLoading()
    } else if (immediate) {
      if (method === 'progressive') {
        await renderProgressive()
      } else {
        await render()
      }
    }
    
    // Setup content observer if needed
    if (watchContent && containerSelector) {
      const element = document.querySelector(containerSelector)
      if (element) {
        setupContentObserver(element)
      }
    }
  })
  
  onUnmounted(() => {
    // Clean up timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Clean up observer
    if (observerInstance) {
      observerInstance.disconnect()
    }
    
    // Clean up other functions
    cleanupFunctions.forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup()
      }
    })
  })
  
  return {
    // State
    isRendering,
    isReady,
    renderCount,
    lastError,
    
    // Methods
    render,
    renderDebounced,
    renderAllParallel,
    renderProgressive,
    setupLazyLoading,
    forceRender,
    watchAndRender,
    setupContentObserver
  }
}

export default useMathJaxOptimized