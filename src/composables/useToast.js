/**
 * Toast notification composable
 * Provides toast notification functionality with different types
 */
import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  // Flexible addToast API
  // addToast(message, type = 'info', duration = 5000)
  // addToast(message, options = { type, duration, onClick, actionText, route, href })
  const addToast = (message, typeOrOptions = 'info', maybeDuration = 5000) => {
    let type = 'info'
    let duration = 5000
    let onClick = null
    let actionText = null
    let route = null
    let href = null

    if (typeof typeOrOptions === 'string') {
      type = typeOrOptions
      duration = typeof maybeDuration === 'number' ? maybeDuration : 5000
    } else if (typeof typeOrOptions === 'object' && typeOrOptions !== null) {
      const opts = typeOrOptions
      type = opts.type || 'info'
      duration = typeof opts.duration === 'number' ? opts.duration : 5000
      onClick = typeof opts.onClick === 'function' ? opts.onClick : null
      actionText = typeof opts.actionText === 'string' ? opts.actionText : null
      route = typeof opts.route === 'string' ? opts.route : null
      href = typeof opts.href === 'string' ? opts.href : null
    }

    const toast = {
      id: Date.now() + Math.random(),
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      visible: true,
      onClick,
      actionText,
      route,
      href
    }

    toasts.value.push(toast)

    // Auto remove after duration (unless explicitly set to 0 or negative)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, duration)
    }

    return toast.id
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  // Helper variants accept either duration (number) or options object
  const success = (message, arg) => (
    typeof arg === 'object' ? addToast(message, { ...arg, type: 'success' }) : addToast(message, 'success', arg)
  )
  const error = (message, arg) => (
    typeof arg === 'object' ? addToast(message, { ...arg, type: 'error' }) : addToast(message, 'error', arg)
  )
  const warning = (message, arg) => (
    typeof arg === 'object' ? addToast(message, { ...arg, type: 'warning' }) : addToast(message, 'warning', arg)
  )
  const info = (message, arg) => (
    typeof arg === 'object' ? addToast(message, { ...arg, type: 'info' }) : addToast(message, 'info', arg)
  )
  
  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
