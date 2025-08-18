/**
 * Virtual scrolling composable for performance optimization
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useVirtualScroll(items, itemHeight = 200, containerHeight = 600) {
  const scrollTop = ref(0)
  const containerRef = ref(null)
  
  const visibleStart = computed(() => {
    return Math.floor(scrollTop.value / itemHeight)
  })
  
  const visibleEnd = computed(() => {
    return Math.min(
      visibleStart.value + Math.ceil(containerHeight / itemHeight) + 2,
      items.value.length
    )
  })
  
  const visibleItems = computed(() => {
    return items.value.slice(visibleStart.value, visibleEnd.value)
  })
  
  const totalHeight = computed(() => {
    return items.value.length * itemHeight
  })
  
  const offsetY = computed(() => {
    return visibleStart.value * itemHeight
  })
  
  const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
  }
  
  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
    }
  })
  
  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })
  
  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    visibleStart,
    visibleEnd
  }
}