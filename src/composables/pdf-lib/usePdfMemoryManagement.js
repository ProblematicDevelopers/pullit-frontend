import { ref, onUnmounted } from 'vue'

/**
 * PDF Blob URL 메모리 관리를 위한 Composable
 * Blob URL 생성, 추적, 정리를 담당하여 메모리 누수 방지
 */
export function usePdfMemoryManagement() {
  // 생성된 Blob URL들을 추적
  const blobUrls = ref([])

  /**
   * 새로운 Blob URL 추가
   * @param {string} url - 생성된 Blob URL
   */
  const addBlobUrl = (url) => {
    if (url && !blobUrls.value.includes(url)) {
      blobUrls.value.push(url)
      console.log('Blob URL 추가됨:', url)
    }
  }

  /**
   * 특정 Blob URL 정리
   * @param {string} url - 정리할 Blob URL
   */
  const removeBlobUrl = (url) => {
    if (url && blobUrls.value.includes(url)) {
      URL.revokeObjectURL(url)
      const index = blobUrls.value.indexOf(url)
      blobUrls.value.splice(index, 1)
      console.log('Blob URL 정리됨:', url)
    }
  }

  /**
   * 모든 Blob URL 정리
   */
  const cleanupAll = () => {
    console.log(`${blobUrls.value.length}개의 Blob URL 정리 시작`)
    blobUrls.value.forEach(url => {
      try {
        URL.revokeObjectURL(url)
        console.log('Blob URL 정리됨:', url)
      } catch (error) {
        console.warn('Blob URL 정리 중 오류:', error)
      }
    })
    blobUrls.value = []
    console.log('모든 Blob URL 정리 완료')
  }

  /**
   * 현재 추적 중인 Blob URL 개수 반환
   */
  const getBlobUrlCount = () => blobUrls.value.length

  /**
   * 특정 URL이 추적 중인지 확인
   */
  const isTrackingUrl = (url) => blobUrls.value.includes(url)

  // 컴포넌트 언마운트 시 자동 정리
  onUnmounted(() => {
    if (blobUrls.value.length > 0) {
      console.log('컴포넌트 언마운트 시 Blob URL 자동 정리')
      cleanupAll()
    }
  })

  return {
    blobUrls,
    addBlobUrl,
    removeBlobUrl,
    cleanupAll,
    getBlobUrlCount,
    isTrackingUrl
  }
}
