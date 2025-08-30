import api from './api'

// 파일 히스토리 관련 API
export const fileHistoryAPI = {
  // 파일 히스토리 생성 (FormData 방식)
  createFileHistory: (fileMetadataId, subjectId) => {
    const formData = new FormData()
    formData.append('fileMetadataId', fileMetadataId)
    formData.append('subjectId', subjectId)

    return api.post('/file-history/create', formData)
  },

  // 파일 히스토리 생성 (JSON 방식 - FormData가 실패할 경우 대안)
  createFileHistoryJson: (fileMetadataId, subjectId) => {
    const payload = {
      fileMetadataId: fileMetadataId,
      subjectId: subjectId
    }

    return api.post('/file-history/create', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },

  // 파일 히스토리 생성 (자동 재시도 포함)
  createFileHistoryWithRetry: async (fileMetadataId, subjectId, maxRetries = 2) => {
    let lastError = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 파일 히스토리 생성 시도 ${attempt}/${maxRetries}`)

        // 먼저 FormData 방식으로 시도
        const response = await fileHistoryAPI.createFileHistory(fileMetadataId, subjectId)
        console.log(`✅ 파일 히스토리 생성 성공 (시도 ${attempt})`)
        return response
      } catch (error) {
        lastError = error
        console.warn(`⚠️ FormData 방식 실패 (시도 ${attempt}):`, error.response?.status, error.response?.data)

        // 마지막 시도가 아니고 500 에러인 경우 JSON 방식으로 재시도
        if (attempt < maxRetries && error.response?.status === 500) {
          try {
            console.log(`🔄 JSON 방식으로 재시도...`)
            const response = await fileHistoryAPI.createFileHistoryJson(fileMetadataId, subjectId)
            console.log(`✅ JSON 방식으로 파일 히스토리 생성 성공`)
            return response
          } catch (jsonError) {
            console.warn(`⚠️ JSON 방식도 실패 (시도 ${attempt}):`, jsonError.response?.status, jsonError.response?.data)
            lastError = jsonError
          }
        }

        // 잠시 대기 후 재시도
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    throw lastError
  },

  // PDF를 이미지로 변환
  processPdfToImages: (pdfFile, fileHistoryId) => {
    const formData = new FormData()
    formData.append('file', pdfFile)
    formData.append('fileHistoryId', fileHistoryId)

    return api.post('/file-history/process-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 페이지 순서 변경
  updateImageOrder: (fileHistoryId, imageOrder) => {
    const params = new URLSearchParams()
    params.append('fileHistoryId', fileHistoryId)
    params.append('imageOrder', imageOrder)

    return api.put('/file-history/update-order', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  // 페이지 삭제
  removePage: (fileHistoryId, pageIndex) => {
    const params = new URLSearchParams()
    params.append('fileHistoryId', fileHistoryId)
    params.append('pageIndex', pageIndex)

    return api.delete('/file-history/remove-page', {
      data: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }
}

export default fileHistoryAPI
