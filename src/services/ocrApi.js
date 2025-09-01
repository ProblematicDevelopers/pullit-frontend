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
      console.log('📤 [ocrApi] processImage 호출 시작:', { areaCode, imageSize: imageBase64?.length })

      // 이미지 데이터 유효성 검증
      if (!imageBase64 || imageBase64.length === 0) {
        throw new Error('이미지 데이터가 비어있습니다.')
      }

      if (!imageBase64.startsWith('data:image/')) {
        throw new Error('이미지 데이터가 올바른 형식이 아닙니다.')
      }

      // base64 데이터 크기 계산 및 검증
      const base64Data = imageBase64.split(',')[1]
      if (!base64Data) {
        throw new Error('이미지 데이터 형식이 올바르지 않습니다.')
      }

      const dataSize = Math.ceil((base64Data.length * 3) / 4)
      console.log('📊 [ocrApi] 이미지 데이터 크기:', dataSize, 'bytes')

      if (dataSize < 1024) {
        throw new Error(`이미지가 너무 작습니다. (${dataSize} bytes, 최소 1KB 필요)`)
      }

      if (dataSize > 52428800) {
        throw new Error(`이미지가 너무 큽니다. (${dataSize} bytes, 최대 50MB)`)
      }

      const formData = new FormData()

      // 이미지 데이터를 Blob으로 변환하여 FormData에 추가
      const imageBlob = await fetch(imageBase64).then(res => res.blob())

      // Blob 유효성 검증
      if (!imageBlob || imageBlob.size === 0) {
        throw new Error('이미지 Blob 생성에 실패했습니다.')
      }

      console.log('✅ [ocrApi] Blob 생성 성공:', {
        size: imageBlob.size,
        type: imageBlob.type
      })

      // subject code와 fileId만 순서대로 추가
      formData.append('areaCode', areaCode)
      formData.append('file', imageBlob, 'selected_area.png')

      console.log('🚀 [ocrApi] OCR API 호출 시작:', {
        areaCode,
        imageSize: imageBlob.size,
        imageType: imageBlob.type
      })

      // FormData 내용 확인
      console.log('📋 [ocrApi] FormData 내용:')
      for (let [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`- ${key}: Blob(${value.size} bytes, ${value.type})`)
        } else {
          console.log(`- ${key}: ${value}`)
        }
      }

      const response = await api.post('/item-process/trans-ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ [ocrApi] processImage 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] processImage 실패:', error)

      // 서버 응답이 있는 경우 더 자세한 에러 정보 제공
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)

        const errorCode = error.response.data?.code
        const errorMessage = error.response.data?.message

        // 에러 코드별 구체적인 메시지
        let userMessage = 'OCR 처리에 실패했습니다.'
        if (errorCode === 'COMMON_004') {
          userMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        } else if (errorCode) {
          userMessage = `오류가 발생했습니다. (코드: ${errorCode})`
        }

        throw new Error(`${userMessage} (${error.response.status}: ${errorMessage || '알 수 없는 오류'})`)
      } else if (error.request) {
        console.error('❌ [ocrApi] 서버 연결 실패:', error.request)
        throw new Error('OCR 서버에 연결할 수 없습니다.')
      } else {
        console.error('❌ [ocrApi] 요청 설정 오류:', error.message)
        throw new Error(`OCR 처리 중 오류가 발생했습니다: ${error.message}`)
      }
    }
  },

  /**
   * 영역 이미지를 S3에 업로드
   * @param {string} imageBase64 - Base64로 인코딩된 이미지 데이터
   * @returns {Promise<string>} 업로드된 이미지 URL
   */
  async uploadAreaImage(imageBase64) {
    try {
      console.log('📤 [ocrApi] uploadAreaImage 호출 시작:', { imageSize: imageBase64?.length })

      const formData = new FormData()

      // Base64를 Blob으로 변환
      const imageBlob = await fetch(imageBase64).then(res => res.blob())
      formData.append('file', imageBlob, 'area_image.png')

      console.log('🚀 [ocrApi] S3 업로드 API 호출:', { imageSize: imageBlob.size, imageType: imageBlob.type })

      const response = await api.post('/item-process/upload-area-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ [ocrApi] uploadAreaImage 성공:', response.data)
      return response.data.data // S3 URL 반환
    } catch (error) {
      console.error('❌ [ocrApi] uploadAreaImage 실패:', error)
      throw new Error('이미지 업로드에 실패했습니다.')
    }
  },

  /**
   * 처리된 문항 정보 저장 (OCR 히스토리 포함)
   * @param {Object} processedItemData - ProcessedItemSaveRequest 형식의 문항 데이터
   * @returns {Promise<Object>} 저장된 문항 정보
   */
  async saveProcessedItem(processedItemData) {
    try {
      console.log('📤 [ocrApi] saveProcessedItem 호출 시작:', processedItemData)

      const response = await api.post('/item-process/save-processed-item', processedItemData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ [ocrApi] saveProcessedItem 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] saveProcessedItem 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('문항 저장에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * 저장된 처리된 문항 목록 조회
   * @param {Object} params - 조회 조건
   * @param {number} params.page - 페이지 번호 (기본값: 0)
   * @param {number} params.size - 페이지 크기 (기본값: 20)
   * @param {string} params.subjectCode - 과목 코드 (선택사항)
   * @returns {Promise<Object>} 저장된 문항 목록
   */
  async getProcessedItems(params = {}) {
    try {
      console.log('📤 [ocrApi] getProcessedItems 호출 시작:', params)

      const queryParams = {
        page: params.page || 0,
        size: params.size || 20
      }

      if (params.subjectCode) {
        queryParams.subjectCode = params.subjectCode
      }

      const response = await api.get('/item-process/get-processed-items', {
        params: queryParams
      })

      console.log('✅ [ocrApi] getProcessedItems 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] getProcessedItems 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('저장된 문항 조회에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * 특정 문항의 상세 정보 조회
   * @param {string|number} itemId - 문항 ID
   * @returns {Promise<Object>} 문항 상세 정보
   */
  async getProcessedItem(itemId) {
    try {
      console.log('📤 [ocrApi] getProcessedItem 호출 시작:', { itemId })

      if (!itemId) {
        throw new Error('문항 ID가 필요합니다.')
      }

      const response = await api.get(`/item-process/get-processed-item/${itemId}`)

      console.log('✅ [ocrApi] getProcessedItem 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] getProcessedItem 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('문항 상세 정보 조회에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * 특정 파일의 OCR 히스토리 조회
   * @param {string|number} fileId - PDF 파일 ID 또는 pdfImageId
   * @returns {Promise<Object>} OCR 히스토리 목록
   */
  async getOcrHistory(fileId) {
    try {
      console.log('📤 [ocrApi] getOcrHistory 호출 시작:', { fileId })

      if (!fileId) {
        throw new Error('파일 ID가 필요합니다.')
      }

      const response = await api.get(`/item-process/get-ocr-history/${fileId}`)

      console.log('✅ [ocrApi] getOcrHistory 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] getOcrHistory 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('OCR 히스토리 조회에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * 파일의 완료된 OCR 영역 조회 (위치 정보 포함)
   * @param {string|number} fileId - PDF 파일 ID
   * @returns {Promise<Array>} 완료된 OCR 영역 목록 (positionX, positionY, sizeX, sizeY 포함)
   */
  async getCompletedOcrRegions(fileId) {
    try {
      console.log('📤 [ocrApi] getCompletedOcrRegions 호출 시작:', { fileId })

      if (!fileId) {
        throw new Error('파일 ID가 필요합니다.')
      }

      const response = await api.get(`/item-process/get-completed-regions/${fileId}`)

      console.log('✅ [ocrApi] getCompletedOcrRegions 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] getCompletedOcrRegions 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('완료된 OCR 영역 조회에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * OCR 영역 일괄 저장 (모달 진입 전)
   * @param {Object} bulkData - 일괄 저장 데이터
   * @returns {Promise<Object>} 저장된 OCR 히스토리 ID 목록
   */
  async bulkSaveOcrHistories(bulkData) {
    try {
      console.log('📤 [ocrApi] bulkSaveOcrHistories 호출:', bulkData)

      const response = await api.post('/ocr-history/bulk', bulkData)

      console.log('✅ [ocrApi] bulkSaveOcrHistories 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] bulkSaveOcrHistories 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('OCR 영역 일괄 저장에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * ProcessedItem의 OCR 히스토리 조회
   * @param {number} processedItemId - ProcessedItem ID
   * @returns {Promise<Object>} OCR 히스토리 목록
   */
  async getOcrHistoriesByProcessedItemId(processedItemId) {
    try {
      console.log('📤 [ocrApi] getOcrHistoriesByProcessedItemId 호출:', processedItemId)

      const response = await api.get(`/ocr-history/processed-item/${processedItemId}`)

      console.log('✅ [ocrApi] getOcrHistoriesByProcessedItemId 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] getOcrHistoriesByProcessedItemId 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('OCR 히스토리 조회에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * PdfImage의 OCR 히스토리 조회
   * @param {number} pdfImageId - PdfImage ID
   * @returns {Promise<Object>} OCR 히스토리 목록
   */
  async getOcrHistoriesByPdfImageId(pdfImageId) {
    try {
      console.log('📤 [ocrApi] getOcrHistoriesByPdfImageId 호출:', pdfImageId)

      const response = await api.get(`/ocr-history/pdf-image/${pdfImageId}`)

      console.log('✅ [ocrApi] getOcrHistoriesByPdfImageId 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] getOcrHistoriesByPdfImageId 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('OCR 히스토리 조회에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * 임시 OCR 히스토리 정리 (모달에서 나갈 때)
   * @param {number} pdfImageId - PdfImage ID
   * @returns {Promise<Object>} 삭제된 항목 수
   */
  async cleanupTemporaryOcrHistories(pdfImageId) {
    try {
      console.log('🧹 [ocrApi] cleanupTemporaryOcrHistories 호출:', pdfImageId)

      const response = await api.delete(`/ocr-history/temporary/${pdfImageId}`)

      console.log('✅ [ocrApi] cleanupTemporaryOcrHistories 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] cleanupTemporaryOcrHistories 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('임시 OCR 히스토리 정리에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * OCR 히스토리 확정 저장 (ProcessedItem 저장 완료 후)
   * @param {number} pdfImageId - PdfImage ID
   * @param {number} processedItemId - ProcessedItem ID
   * @returns {Promise<Object>} 확정된 항목 수
   */
  async confirmOcrHistories(pdfImageId, processedItemId) {
    try {
      console.log('✅ [ocrApi] confirmOcrHistories 호출:', { pdfImageId, processedItemId })

      const response = await api.put(`/ocr-history/confirm/${pdfImageId}/${processedItemId}`)

      console.log('✅ [ocrApi] confirmOcrHistories 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] confirmOcrHistories 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('OCR 히스토리 확정에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  },

  /**
   * ProcessedItem을 실제 문항으로 변환 (publish)
   * @param {number} processedItemId - ProcessedItem ID
   * @returns {Promise<Object>} 변환 결과
   */
  async publishProcessedItem(processedItemId) {
    try {
      console.log('📤 [ocrApi] publishProcessedItem 호출 시작:', processedItemId)

      const response = await api.post(`/item-process/publish/${processedItemId}`)

      console.log('✅ [ocrApi] publishProcessedItem 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] publishProcessedItem 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error(`문항 변환에 실패했습니다: ${error.response?.data?.message || error.message}`)
    }
  },

  /**
   * 임시 OCR 히스토리 조회
   * @param {number} pdfImageId - PdfImage ID
   * @returns {Promise<Object>} 임시 OCR 히스토리 목록
   */
  async getTemporaryOcrHistories(pdfImageId) {
    try {
      console.log('📤 [ocrApi] getTemporaryOcrHistories 호출:', pdfImageId)

      const response = await api.get(`/ocr-history/temporary/${pdfImageId}`)

      console.log('✅ [ocrApi] getTemporaryOcrHistories 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [ocrApi] getTemporaryOcrHistories 실패:', error)
      if (error.response) {
        console.error('📡 [ocrApi] 서버 응답 상태:', error.response.status)
        console.error('📡 [ocrApi] 서버 응답 데이터:', error.response.data)
      }
      throw new Error('임시 OCR 히스토리 조회에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  }
}
