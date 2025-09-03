import api from './api.js'

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// 프로덕션 환경인지 확인
const isProduction = import.meta.env.PROD

/**
 * 이미지 API 서비스
 * 이미지 프록시 및 이미지 관련 기능을 제공합니다.
 */
export const imageApiService = {
  /**
   * 이미지 프록시 URL 생성
   * @param {string} imageUrl - 원본 이미지 URL
   * @returns {string} 프록시 URL
   */
  getProxyUrl(imageUrl) {
    if (!imageUrl) return ''

    // S3 URL인 경우에만 프록시 사용
    if (imageUrl.includes('s3.ap-northeast-2.amazonaws.com')) {
      const encodedUrl = encodeURIComponent(imageUrl)
      return `${isProduction ? API_BASE_URL : `${API_BASE_URL}/api`}/image/proxy?url=${encodedUrl}`
    }

    // S3 URL이 아닌 경우 원본 URL 반환
    return imageUrl
  },

  /**
   * 이미지 프록시 요청 (실제 이미지 데이터 가져오기)
   * @param {string} imageUrl - 원본 이미지 URL
   * @returns {Promise<Blob>} 이미지 데이터
   */
  async getImageProxy(imageUrl) {
    try {
      console.log('📤 [imageApi] getImageProxy 호출:', imageUrl)

      const proxyUrl = this.getProxyUrl(imageUrl)
      if (!proxyUrl) {
        throw new Error('유효하지 않은 이미지 URL입니다.')
      }

      const response = await api.get(proxyUrl, {
        responseType: 'blob'
      })

      console.log('✅ [imageApi] getImageProxy 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [imageApi] getImageProxy 실패:', error)
      throw new Error('이미지 프록시 요청에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * 이미지 URL 유효성 검사
   * @param {string} imageUrl - 이미지 URL
   * @returns {Promise<boolean>} 유효성 여부
   */
  async validateImageUrl(imageUrl) {
    try {
      if (!imageUrl) return false

      // S3 URL인 경우 프록시로 검사
      if (imageUrl.includes('s3.ap-northeast-2.amazonaws.com')) {
        await this.getImageProxy(imageUrl)
        return true
      }

      // 일반 URL인 경우 직접 검사
      const response = await fetch(imageUrl, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      console.warn('이미지 URL 유효성 검사 실패:', error)
      return false
    }
  },

  /**
   * 이미지 로드 실패 시 fallback URL 생성
   * @param {string} originalUrl - 원본 URL
   * @param {string} proxyUrl - 프록시 URL
   * @returns {string} fallback URL
   */
  getFallbackUrl(originalUrl, proxyUrl) {
    // 프록시 URL에서 실패한 경우 원본 URL 반환
    if (proxyUrl && proxyUrl.includes('/image/proxy')) {
      return originalUrl
    }
    return originalUrl
  }
}

export default imageApiService
