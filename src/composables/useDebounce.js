/**
 * Debounce composable for search optimization
 */
import { ref, watch } from 'vue'

export function useDebounce(initialValue = '', delay = 300) {
  const value = ref(initialValue)
  const debouncedValue = ref(initialValue)
  
  let timeoutId = null
  
  watch(value, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })
  
  const setValue = (newValue) => {
    value.value = newValue
  }
  
  const setDebouncedValue = (newValue) => {
    debouncedValue.value = newValue
  }
  
  return {
    value,
    debouncedValue,
    setValue,
    setDebouncedValue
  }
}