/**
 * 이미지 관련 유틸리티 함수들
 * PDF 이미지 로딩 및 에러 처리에 사용
 */

/**
 * 이미지 URL의 유효성을 검사
 * @param {string} url - 검사할 이미지 URL
 * @returns {boolean} 유효한 이미지 URL인지 여부
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }

  // base64 이미지 체크
  if (url.startsWith('data:image/')) {
    return true
  }

  // 외부 URL 체크
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }

  // Blob URL 체크
  if (url.startsWith('blob:')) {
    return true
  }

  return false
}

/**
 * 이미지 로딩 상태를 확인
 * @param {string} url - 이미지 URL
 * @returns {Promise<boolean>} 이미지 로딩 성공 여부
 */
export function checkImageLoadable(url) {
  return new Promise((resolve) => {
    if (!isValidImageUrl(url)) {
      resolve(false)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      resolve(true)
    }

    img.onerror = () => {
      resolve(false)
    }

    img.src = url
  })
}

/**
 * fallback 이미지 생성 (SVG 기반)
 * @param {number} pageNumber - 페이지 번호
 * @param {number} width - 이미지 너비
 * @param {number} height - 이미지 높이
 * @returns {string} base64로 인코딩된 SVG 이미지
 */
export function createFallbackImage(pageNumber, width = 400, height = 600) {
  const fallbackSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
      <text x="${width/2}" y="${height/2 - 30}" font-family="Arial, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">
        페이지 ${pageNumber}
      </text>
      <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">
        이미지를 불러올 수 없습니다
      </text>
      <text x="${width/2}" y="${height/2 + 30}" font-family="Arial, sans-serif" font-size="12" fill="#cbd5e1" text-anchor="middle">
        PDF를 다시 업로드해주세요
      </text>
    </svg>
  `

  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(fallbackSvg)))
}

/**
 * 썸네일용 fallback 이미지 생성
 * @param {number} pageNumber - 페이지 번호
 * @returns {string} base64로 인코딩된 SVG 이미지
 */
export function createThumbnailFallbackImage(pageNumber) {
  return createFallbackImage(pageNumber, 120, 140)
}

/**
 * 이미지 로딩 재시도
 * @param {string} url - 이미지 URL
 * @param {number} maxRetries - 최대 재시도 횟수
 * @param {number} delay - 재시도 간격 (ms)
 * @returns {Promise<string>} 로딩된 이미지 URL 또는 fallback 이미지
 */
export async function retryImageLoad(url, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const isLoadable = await checkImageLoadable(url)
      if (isLoadable) {
        return url
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    } catch (error) {
      console.warn(`이미지 로딩 재시도 ${attempt}/${maxRetries} 실패:`, error)

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  // 모든 재시도 실패 시 fallback 이미지 반환
  return createFallbackImage(1)
}

/**
 * 이미지 URL을 안전하게 변환
 * @param {string} url - 원본 이미지 URL
 * @param {number} pageNumber - 페이지 번호
 * @returns {string} 안전한 이미지 URL
 */
export function sanitizeImageUrl(url, pageNumber = 1) {
  if (isValidImageUrl(url)) {
    return url
  }

  // URL이 유효하지 않은 경우 fallback 이미지 반환
  return createFallbackImage(pageNumber)
}
