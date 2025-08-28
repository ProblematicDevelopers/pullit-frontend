/**
 * MathJax Performance Optimization Module
 * 
 * Provides optimized parallel rendering and batch processing for MathJax
 * to improve rendering performance in wizard components with multiple math expressions.
 */

import { renderMathJax, renderMathJaxBatch, waitForMathJax } from './mathjax'

// Rendering queue to prevent overlapping operations
let renderingQueue = Promise.resolve()
let isQueueActive = false

/**
 * Parallel MathJax rendering for multiple elements
 * Renders all elements in parallel instead of sequentially
 * 
 * @param {NodeList|Array<HTMLElement>} elements - Elements to render
 * @param {Object} options - Rendering options
 * @returns {Promise<void>}
 */
export const renderMathJaxParallel = async (elements, options = {}) => {
  if (!elements || elements.length === 0) return
  
  const {
    batchSize = 10, // Process in batches for optimal performance
    hideBeforeRender = true,
    clearFirst = false,
    markProcessed = true,
    useBatching = true // Use batch API when available
  } = options
  
  try {
    // Wait for MathJax to be ready
    await waitForMathJax()
    
    // Convert NodeList to Array if needed
    const elementsArray = Array.from(elements)
    
    // If batch rendering is available and enabled, use it
    if (useBatching && renderMathJaxBatch) {
      // Process in batches for optimal memory usage
      const batches = []
      for (let i = 0; i < elementsArray.length; i += batchSize) {
        batches.push(elementsArray.slice(i, i + batchSize))
      }
      
      // Render batches in parallel
      await Promise.all(
        batches.map(batch => renderMathJaxBatch(batch, {
          hideBeforeRender,
          clearFirst,
          markProcessed
        }))
      )
    } else {
      // Fallback to parallel individual rendering
      await Promise.all(
        elementsArray.map(element => 
          renderMathJax(element, {
            hideBeforeRender,
            clearFirst,
            markProcessed,
            debounceTime: 0 // No debounce for parallel rendering
          })
        )
      )
    }
  } catch (error) {
    console.error('Parallel MathJax rendering error:', error)
    // Attempt fallback to sequential rendering on error
    for (const element of elements) {
      try {
        await renderMathJax(element, options)
      } catch (e) {
        console.error('Failed to render element:', e)
      }
    }
  }
}

/**
 * Queued MathJax rendering to prevent overlapping operations
 * Ensures rendering operations don't interfere with each other
 * 
 * @param {Function} renderFunction - The rendering function to queue
 * @returns {Promise<void>}
 */
export const queueMathJaxRender = (renderFunction) => {
  renderingQueue = renderingQueue
    .then(async () => {
      isQueueActive = true
      try {
        await renderFunction()
      } finally {
        isQueueActive = false
      }
    })
    .catch(error => {
      console.error('Queued render error:', error)
      isQueueActive = false
    })
  
  return renderingQueue
}

/**
 * Progressive MathJax rendering for large lists
 * Renders visible items first, then renders remaining items progressively
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Rendering options
 * @returns {Promise<void>}
 */
export const renderMathJaxProgressive = async (container, options = {}) => {
  const {
    selector = '.mathjax-content',
    visibleFirst = true,
    batchSize = 5,
    delay = 50 // Delay between batches in ms
  } = options
  
  if (!container) return
  
  // Get all elements that need rendering
  const elements = container.querySelectorAll(`${selector}[data-mathjax-pending="true"]`)
  if (elements.length === 0) return
  
  const elementsArray = Array.from(elements)
  
  // Sort by visibility if requested
  if (visibleFirst) {
    elementsArray.sort((a, b) => {
      const aVisible = isElementInViewport(a)
      const bVisible = isElementInViewport(b)
      if (aVisible && !bVisible) return -1
      if (!aVisible && bVisible) return 1
      return 0
    })
  }
  
  // Process in batches with delay
  for (let i = 0; i < elementsArray.length; i += batchSize) {
    const batch = elementsArray.slice(i, i + batchSize)
    
    // Render batch in parallel
    await renderMathJaxParallel(batch, options)
    
    // Mark as processed
    batch.forEach(el => el.removeAttribute('data-mathjax-pending'))
    
    // Small delay between batches to prevent UI blocking
    if (i + batchSize < elementsArray.length && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Lazy MathJax rendering with Intersection Observer
 * Renders math content only when it becomes visible
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Rendering options
 * @returns {Function} Cleanup function to disconnect observer
 */
export const setupLazyMathJaxRendering = (container, options = {}) => {
  const {
    rootMargin = '200px', // Start rendering 200px before visible
    threshold = 0.01,
    selector = '.mathjax-content'
  } = options
  
  if (!container || !('IntersectionObserver' in window)) {
    // Fallback to immediate rendering if IntersectionObserver not supported
    renderMathJaxProgressive(container, options)
    return () => {}
  }
  
  const observer = new IntersectionObserver(
    async (entries) => {
      const toRender = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target)
        .filter(el => el.hasAttribute('data-mathjax-pending'))
      
      if (toRender.length > 0) {
        // Render visible elements in parallel
        await renderMathJaxParallel(toRender, options)
        
        // Mark as processed and unobserve
        toRender.forEach(el => {
          el.removeAttribute('data-mathjax-pending')
          observer.unobserve(el)
        })
      }
    },
    { rootMargin, threshold }
  )
  
  // Observe all pending math elements
  const elements = container.querySelectorAll(`${selector}[data-mathjax-pending="true"]`)
  elements.forEach(el => observer.observe(el))
  
  // Return cleanup function
  return () => observer.disconnect()
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
const isElementInViewport = (element) => {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Optimized render function for wizard components
 * Combines parallel rendering, batching, and progressive loading
 * 
 * @param {HTMLElement|NodeList|Array} target - Elements to render
 * @param {Object} options - Rendering options
 * @returns {Promise<void>}
 */
export const renderMathJaxOptimized = async (target, options = {}) => {
  const {
    method = 'parallel', // 'parallel', 'progressive', 'lazy'
    ...renderOptions
  } = options
  
  // Queue the rendering operation
  return queueMathJaxRender(async () => {
    if (method === 'lazy' && target instanceof HTMLElement) {
      return setupLazyMathJaxRendering(target, renderOptions)
    } else if (method === 'progressive' && target instanceof HTMLElement) {
      return renderMathJaxProgressive(target, renderOptions)
    } else {
      // Default to parallel rendering
      const elements = target instanceof NodeList || Array.isArray(target) 
        ? target 
        : target instanceof HTMLElement 
          ? target.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
          : []
      
      return renderMathJaxParallel(elements, renderOptions)
    }
  })
}

export default {
  renderMathJaxParallel,
  renderMathJaxProgressive,
  setupLazyMathJaxRendering,
  renderMathJaxOptimized,
  queueMathJaxRender,
  isQueueActive: () => isQueueActive
}