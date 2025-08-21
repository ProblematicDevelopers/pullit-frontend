import api from './api.js'

/**
 * OCR API 서비스
 * PDF 이미지에서 텍스트를 추출하는 기능을 제공합니다.
 */
export const ocrApi = {
  /**
   * 선택된 이미지 영역에 대해 OCR 처리
   * @param {string} imageBase64 - Base64로 인코딩된 이미지 데이터
   * @param {string} areaCode - 과목 코드 (KO, EN, MA, SO, SC, HS, MO)
   * @param {string} fileId - PDF 파일 ID
   * @returns {Promise<Object>} OCR 처리 결과
   */
  async processImage(imageBase64, areaCode) {
    try {
      const formData = new FormData()

      // 이미지 데이터를 Blob으로 변환하여 FormData에 추가
      const imageBlob = await fetch(imageBase64).then(res => res.blob())

      // subject code와 fileId만 순서대로 추가
      formData.append('areaCode', areaCode)
      formData.append('file', imageBlob, 'selected_area.png')

      const response = await api.post('/item-process/trans-ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data
    } catch (error) {
      console.error('OCR 처리 API 오류:', error)
      throw new Error('OCR 처리에 실패했습니다.')
    }
  }
}
