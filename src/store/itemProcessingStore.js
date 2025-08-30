/**
 * 문제 등록 Store
 * ItemProcessing 페이지에서 사용하는 상태 관리
 * 교과서 선택 및 PDF 처리 과정을 관리
 */

import { defineStore } from 'pinia'
import { itemProcessingAPI } from '../services/itemProcessApi.js'
import { fileHistoryAPI } from '../services/fileHistoryApi.js'
import { useSubjectStore } from './subjectStore.js'
// 과목 정보 정의 (areaCode와 매칭)
const SUBJECTS = {
  'KO': { name: '국어', color: '#ef4444' },
  'EN': { name: '영어', color: '#10b981' },
  'MA': { name: '수학', color: '#3b82f6' },
  'SO': { name: '사회', color: '#f59e0b' },
  'SC': { name: '과학', color: '#84cc16' },
  'HS': { name: '역사', color: '#8b5cf6' },
  'MO': { name: '도덕', color: '#06b6d4' },
}

export const useItemProcessingStore = defineStore('itemProcessingStore', {
  /**
   * 상태 정의
   * 컴포넌트에서 사용할 반응형 데이터들을 정의
   */
  state: () => ({
    // API 호출 중 로딩 상태
    loading: false,

    // API 호출 시 발생한 에러 메시지
    error: null,

    // 교과서 목록
    textbooks: [],

    // 선택된 교과서 정보
    selectedTextbook: null,

    // PDF 파일 정보
    pdfFile: null,

    // PDF 페이지 정보 (순서, 삭제 여부 등)
    pdfPages: [],

    // OCR 처리된 데이터
    ocrData: [],

    // 생성된 Blob URL들 (메모리 관리용)
    blobUrls: [],

    // 최종 생성된 PDF Blob (uploadProcessedPdf에서 설정)
    finalPdf: null,

    // 최종 PDF 생성 시간 (추가)
    finalPdfGeneratedAt: null,

    // 업로드된 PDF 정보 (추가)
    uploadedPdfInfo: null,

    // 원본 페이지 수 (추가)
    originalPageCount: 0,

    // 삭제된 페이지 인덱스 추적 (추가)
    deletedPageIndexes: [],

    // 파일 히스토리 에러 상태 (추가)
    showFileHistoryError: false,
    fileHistoryErrorMessage: ''
  }),

  /**
   * 게터 정의
   * 계산된 상태값들을 정의
   */
  getters: {
    /**
     * 과목별로 그룹화된 교과서 목록
     */
    groupedTextbooks: (state) => {

      const grouped = {}

      // 과목별로 그룹 초기화
      Object.keys(SUBJECTS).forEach(areaCode => {
        grouped[areaCode] = []
      })

      // 교과서를 과목별로 분류 (areaCode 기준)
      state.textbooks.forEach(textbook => {
        const areaCode = textbook.areaCode
        if (grouped[areaCode]) {
          grouped[areaCode].push(textbook)
        }
      })

      return grouped
    },

    /**
     * 과목 정보
     */
    subjects: () => SUBJECTS,

    /**
     * 현재 단계 확인
     */
    currentStep: (state) => {
      if (!state.selectedTextbook) return 1
      if (!state.pdfFile) return 2
      return 3
    },

    /**
     * 다음 단계로 이동 가능한지 확인
     */
    canProceedToNext: (state) => {
      const step = state.currentStep

      switch (step) {
        case 1:
          return state.selectedTextbook !== null
        case 2:
          return state.pdfFile !== null && state.pdfPages.length > 0
        case 3:
          return state.pdfPages.length > 0
        default:
          return false
      }
    }
  },

  /**
   * 액션 정의
   * 상태를 변경하거나 외부 API를 호출하는 메서드들
   */
  actions: {
    /**
     * 교과서 목록을 API에서 가져오는 함수
     * 컴포넌트 마운트 시 자동으로 호출됨
     */
    async fetchTextbooks() {
      try {
        // 로딩 상태 시작
        this.loading = true
        this.error = null

        // API 호출
        const response = await itemProcessingAPI.getTextbooks()

        // API 응답이 성공인 경우
        if (response.data.success && response.data.data) {
          // 받아온 데이터를 store의 textbooks에 저장
          this.textbooks = response.data.data
        } else {
          // API에서 success: false를 반환한 경우
          throw new Error(response.data.message || '교과서 목록을 불러오는데 실패했습니다')
        }
      } catch (err) {
        // 에러 발생 시 처리
        console.error('API 호출 실패:', err)

        // 서버에서 보낸 에러 메시지가 있으면 사용, 없으면 기본 메시지 사용
        this.error = err.response?.data?.message || err.message || '서버와의 연결에 실패했습니다'
      } finally {
        // 성공/실패와 관계없이 로딩 상태 종료
        this.loading = false
      }
    },

    /**
     * 교과서 선택
     * @param {Object} textbook - 선택된 교과서 객체
     */
    selectTextbook(textbook) {
      this.selectedTextbook = textbook
    },

    /**
     * PDF 파일 설정
     * @param {File} file - 업로드된 PDF 파일
     */
    setPdfFile(file) {
      this.pdfFile = file
      // PDF 파일이 변경되면 페이지 정보 초기화
      this.pdfPages = []
      this.ocrData = []
      // Blob URL들도 정리
      this.cleanupBlobUrls()
    },

    /**
     * PDF 페이지 설정
     * @param {Array} pages - PDF 페이지 배열
     */
    setPdfPages(pages) {
      this.pdfPages = pages
    },

    /**
     * Blob URL 추가 (메모리 관리용)
     * @param {string} url - 생성된 Blob URL
     */
    addBlobUrl(url) {
      if (url && !this.blobUrls.includes(url)) {
        this.blobUrls.push(url)
      }
    },

    /**
     * 특정 Blob URL 정리
     * @param {string} url - 정리할 Blob URL
     */
    removeBlobUrl(url) {
      if (url && this.blobUrls.includes(url)) {
        try {
          URL.revokeObjectURL(url)
          const index = this.blobUrls.indexOf(url)
          this.blobUrls.splice(index, 1)
        } catch (error) {
          console.warn('Blob URL 정리 중 오류:', error)
        }
      }
    },

    /**
     * 모든 Blob URL 정리
     */
    cleanupBlobUrls() {
      this.blobUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url)
        } catch (error) {
          console.warn('Blob URL 정리 중 오류:', error)
        }
      })
      this.blobUrls = []
    },

            /**
     * PDF 페이지 순서 변경 (실시간 서버 연동)
     * @param {number} fromIndex - 이동할 페이지의 현재 인덱스
     * @param {number} toIndex - 이동할 페이지의 목표 인덱스
     */
    async movePage(fromIndex, toIndex) {
      try {
        if (fromIndex >= 0 && toIndex >= 0 && fromIndex < this.pdfPages.length && toIndex < this.pdfPages.length) {
          // 로컬에서 먼저 변경
          const page = this.pdfPages.splice(fromIndex, 1)[0]
          this.pdfPages.splice(toIndex, 0, page)

          // 서버에 즉시 변경된 순서 전달
          if (this.uploadedPdfInfo?.fileHistoryId) {

            // 현재 남아있는 페이지들의 원본 인덱스를 순서대로 imgOrder 생성
            const imageOrder = this.pdfPages.map(page => page.originalPage || 0).join(',')
            const response = await fileHistoryAPI.updateImageOrder(
              this.uploadedPdfInfo.fileHistoryId,
              imageOrder
            )

            if (response.data.success) {
              // 서버 페이지 순서 업데이트 완료
            } else {
              console.warn('⚠️ 서버 페이지 순서 업데이트 실패:', response.data.message)
            }
          } else {
            // 파일 히스토리 ID가 없어 서버 업데이트를 건너뜁니다
          }
        } else {
          // 유효하지 않은 인덱스
        }
      } catch (error) {
        console.error('❌ 페이지 순서 변경 실패:', error)
        // 에러 시 UI는 그대로 두고 경고만 표시
      }
    },

        /**
     * PDF 페이지 삭제 (실시간 서버 연동)
     * @param {number} pageIndex - 삭제할 페이지의 인덱스
     */
    async removePage(pageIndex) {
      try {
        if (pageIndex >= 0 && pageIndex < this.pdfPages.length) {
          const page = this.pdfPages[pageIndex]
          const originalIndex = page.originalPage || pageIndex

          // 서버에서 페이지 삭제 (fileHistoryId가 있는 경우)
          if (this.uploadedPdfInfo?.fileHistoryId) {
            try {
              const response = await fileHistoryAPI.removePage(this.uploadedPdfInfo.fileHistoryId, originalIndex)

              if (response.data.success) {
                // 서버에서 반환된 새로운 이미지 목록으로 업데이트
                const remainingUrls = response.data.data
                this.pdfPages = remainingUrls.map((imageUrl, index) => {
                  // 기존 정보는 가능한 유지하되 새로운 URL로 업데이트
                  const existingPage = this.pdfPages[index] || {}
                  return {
                    index: index,
                    pageNumber: index + 1,
                    preview: imageUrl,
                    originalPage: index,
                    width: existingPage.width,
                    height: existingPage.height,
                    fileSize: existingPage.fileSize,
                    pdfImageId: existingPage.pdfImageId
                  }
                })

                // 서버 페이지 삭제 완료
              } else {
                throw new Error(response.data.message || '서버 페이지 삭제 실패')
              }
            } catch (serverError) {
              console.error('❌ 서버 페이지 삭제 실패:', serverError)
              // 서버 삭제 실패 시 로컬에서만 삭제
              if (page && page.preview) {
                this.removeBlobUrl(page.preview)
              }
              this.pdfPages.splice(pageIndex, 1)
                              // 로컬 페이지 삭제로 대체
              }
            } else {
              // 서버 연동이 없는 경우 로컬에서만 삭제
              if (page && page.preview) {
                this.removeBlobUrl(page.preview)
              }
              this.pdfPages.splice(pageIndex, 1)
              // 로컬 페이지 삭제 완료
            }
        } else {
          // 유효하지 않은 페이지 인덱스
        }
      } catch (error) {
        console.error('❌ 페이지 삭제 실패:', error)
        this.error = error.message || '페이지 삭제 중 오류가 발생했습니다.'
      }
    },

    /**
     * 여러 PDF 페이지 일괄 삭제 (실시간 서버 연동)
     * @param {Array<number>} pageIndexes - 삭제할 페이지 인덱스 배열
     */
    async removeMultiplePages(pageIndexes) {
              if (!Array.isArray(pageIndexes) || pageIndexes.length === 0) {
          // 유효하지 않은 페이지 인덱스 배열
          return
        }

      try {
        // 서버 연동이 있는 경우 하나씩 삭제 (백엔드에 일괄 삭제 API가 없을 경우)
        if (this.uploadedPdfInfo?.fileHistoryId) {
          // 인덱스를 내림차순으로 정렬하여 뒤에서부터 삭제 (인덱스 변화 방지)
          const sortedIndexes = [...pageIndexes].sort((a, b) => b - a)

          for (const index of sortedIndexes) {
            await this.removePage(index)
          }
        } else {
          // 서버 연동이 없는 경우 로컬에서만 삭제
          const sortedIndexes = [...pageIndexes].sort((a, b) => b - a)

          sortedIndexes.forEach(index => {
            if (index >= 0 && index < this.pdfPages.length) {
              // Blob URL도 함께 정리
              const page = this.pdfPages[index]
              if (page && page.preview) {
                this.removeBlobUrl(page.preview)
              }
              this.pdfPages.splice(index, 1)
            } else {
              console.warn(`유효하지 않은 인덱스 ${index} 건너뜀`)
            }
          })
        }

        console.log(`✅ 다중 페이지 삭제 완료: ${pageIndexes.length}개 페이지`)
      } catch (error) {
        console.error('❌ 다중 페이지 삭제 실패:', error)
        this.error = error.message || '다중 페이지 삭제 중 오류가 발생했습니다.'
      }
    },

    /**
     * OCR 결과 저장
     * @param {Object} ocrResult - OCR 처리 결과
     * @returns {Promise<Object>}
     */
    async saveOcrResult(ocrResult) {
      try {
        console.log('OCR 결과 저장 시작:', ocrResult)

        if (!ocrResult || !ocrResult.selectedAreas) {
          throw new Error('OCR 결과 데이터가 유효하지 않습니다.')
        }

        const { selectedAreas } = ocrResult

        // 필수 영역 확인
        if (!selectedAreas.question || !selectedAreas.options) {
          throw new Error('지문과 보기 영역이 모두 선택되어야 합니다.')
        }

        // OCR 결과를 ocrData에 저장
        const ocrDataItem = {
          id: Date.now(), // 고유 ID
          selectedAreas: selectedAreas, // 선택된 영역 정보
          ocrResults: ocrResult.ocrResults || [], // OCR 결과 데이터
          capturedImage: ocrResult.capturedImage,
          timestamp: new Date().toISOString()
        }

        // OCR 데이터 목록에 추가
        this.ocrData.push(ocrDataItem)

        console.log('OCR 결과 저장 완료:', ocrDataItem)
        console.log('현재 OCR 데이터 수:', this.ocrData.length)

        return ocrDataItem

      } catch (error) {
        console.error('OCR 결과 저장 실패:', error)
        throw error
      }
    },



    /**
     * 최종 PDF 생성
     * @param {Function} progressCallback - 진행률 콜백 함수 (선택사항)
     * @returns {Promise<Blob>} 생성된 최종 PDF Blob
     */
    async generateFinalPdf(progressCallback = null) {
      try {
        if (!this.pdfPages || this.pdfPages.length === 0) {
          throw new Error('편집할 PDF 페이지가 없습니다.')
        }

        // 진행률 콜백이 있으면 초기 상태 알림
        if (progressCallback) {
          progressCallback({
            stage: '시작',
            current: 0,
            total: this.pdfPages.length,
            percentage: 0
          })
        }

        // pdf-lib을 사용하여 이미지들을 PDF로 변환 (극한 품질 보존)
        const { PDFDocument } = await import('pdf-lib')

        if (progressCallback) {
          progressCallback({
            stage: '라이브러리 로드',
            current: 0,
            total: this.pdfPages.length,
            percentage: 5
          })
        }

        // PDF 문서 생성
        const pdfDoc = await PDFDocument.create()

        if (progressCallback) {
          progressCallback({
            stage: 'PDF 문서 생성',
            current: 0,
            total: this.pdfPages.length,
            percentage: 10
          })
        }

        // 편집된 순서대로 페이지 추가
        for (let i = 0; i < this.pdfPages.length; i++) {
          const page = this.pdfPages[i]

          if (progressCallback) {
            progressCallback({
              stage: `페이지 ${i + 1} 처리 시작`,
              current: i + 1,
              total: this.pdfPages.length,
              percentage: 10 + Math.round((i / this.pdfPages.length) * 30)
            })
          }

          if (page.preview) {
            try {
              // 이미지 품질을 최대한 보존하기 위해 직접 fetch 사용
              if (progressCallback) {
                progressCallback({
                  stage: `이미지 ${i + 1} 로딩 중...`,
                  current: i + 1,
                  total: this.pdfPages.length,
                  percentage: 10 + Math.round((i / this.pdfPages.length) * 30) + 5
                })
              }

              const imageResponse = await fetch(page.preview)
              const imageArrayBuffer = await imageResponse.arrayBuffer()

              // PNG 이미지를 PDF에 직접 임베딩 (Canvas 처리 없이)
              if (progressCallback) {
                progressCallback({
                  stage: `이미지 ${i + 1} PDF 임베딩 중...`,
                  current: i + 1,
                  total: this.pdfPages.length,
                  percentage: 10 + Math.round((i / this.pdfPages.length) * 30) + 10
                })
              }

              const pdfImage = await pdfDoc.embedPng(imageArrayBuffer)

              // 원본 이미지 크기 정보 가져오기
              let { width, height } = page
              if (!width || !height) {
                if (progressCallback) {
                  progressCallback({
                    stage: `이미지 ${i + 1} 크기 추출 중...`,
                    current: i + 1,
                    total: this.pdfPages.length,
                    percentage: 10 + Math.round((i / this.pdfPages.length) * 30) + 15
                  })
                }

                // 이미지 메타데이터에서 크기 추출
                const img = new Image()
                await new Promise((resolve, reject) => {
                  img.onload = () => {
                    width = img.naturalWidth
                    height = img.naturalHeight
                    resolve()
                  }
                  img.onerror = reject
                  img.src = page.preview
                })
              }

              // 새 페이지 생성 (원본 크기)
              if (progressCallback) {
                progressCallback({
                  stage: `페이지 ${i + 1} 생성 중...`,
                  current: i + 1,
                  total: this.pdfPages.length,
                  percentage: 10 + Math.round((i / this.pdfPages.length) * 30) + 20
                })
              }

              const pdfPage = pdfDoc.addPage([width, height])

              // 이미지를 페이지에 그리기 (원본 크기 그대로, 품질 손실 없음)
              pdfPage.drawImage(pdfImage, {
                x: 0,
                y: 0,
                width: width,
                height: height
              })

              // 페이지 완료 시 진행률 업데이트
              if (progressCallback) {
                progressCallback({
                  stage: `페이지 ${i + 1} 완료`,
                  current: i + 1,
                  total: this.pdfPages.length,
                  percentage: 10 + Math.round(((i + 1) / this.pdfPages.length) * 30)
                })
              }

            } catch (pageError) {
              console.warn(`페이지 ${i + 1} 처리 중 오류:`, pageError)
            }
          }
        }

        if (progressCallback) {
          progressCallback({
            stage: 'PDF 생성',
            current: this.pdfPages.length,
            total: this.pdfPages.length,
            percentage: 90
          })
        }

        // 최종 PDF를 Blob으로 변환
        const pdfBytes = await pdfDoc.save()
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })



        if (progressCallback) {
          progressCallback({
            stage: '완료',
            current: this.pdfPages.length,
            total: this.pdfPages.length,
            percentage: 100
          })
        }

        // Store에 최종 PDF 저장
        this.finalPdf = pdfBlob
        this.finalPdfGeneratedAt = new Date().toISOString()

        return pdfBlob

      } catch (error) {
        console.error('최종 PDF 생성 실패:', error)
        throw error
      }
    },

    /**
     * 원본 PDF를 서버에 업로드 (새로 추가)
     * @returns {Promise<Object>} 업로드 결과
     */
    async uploadOriginalPdf() {
      try {
        if (!this.pdfFile) {
          throw new Error('업로드할 PDF 파일이 없습니다.')
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const originalName = this.pdfFile.name.replace('.pdf', '')
        const fileName = `${originalName}_${timestamp}.pdf`

        const response = await itemProcessingAPI.uploadProcessedPdf(
          this.pdfFile,
          fileName,
          "DOCUMENT",
          "file_history",
          0,
          "원본 PDF 파일"
        )

        if (!response.data.success) {
          throw new Error(response.data.message || '원본 PDF 업로드 실패')
        }

        this.uploadedPdfInfo = response.data.data

        // 원본 PDF 업로드 후 파일 히스토리 생성
        const fileMetadataId = response.data?.data?.id ?? response.data?.data?.fileMetadataId ?? response.data?.data?.fileId
        if (fileMetadataId && this.selectedTextbook?.areaCode) {
          const subjectId = await this.getSubjectIdFromAreaCode(this.selectedTextbook.areaCode)
          if (subjectId) {
            try {
              const fileHistoryResponse = await fileHistoryAPI.createFileHistoryWithRetry(fileMetadataId, subjectId)
              this.uploadedPdfInfo.fileHistoryId = fileHistoryResponse.data.data
            } catch (err) {
              console.error('❌ 원본 PDF 파일 히스토리 생성 실패:', err)
              this.showFileHistoryError = true
              this.fileHistoryErrorMessage = '원본 PDF 파일 히스토리 생성 실패 (서버 문제일 수 있음).'
            }
          } else {
            console.warn('⚠️ 과목 ID를 찾을 수 없어 파일 히스토리를 생성하지 않습니다.')
          }
        } else {
          console.warn('⚠️ 파일 히스토리 생성 조건 미충족:', {
            fileMetadataId: !!fileMetadataId,
            selectedTextbook: !!this.selectedTextbook,
            areaCode: this.selectedTextbook?.areaCode
          })
        }

        // PDF를 서버에서 이미지로 변환은 handlePdfFile에서 처리
        // (중복 호출 방지)
        console.log('📝 이미지 변환은 handlePdfFile에서 처리됩니다.')

        return this.uploadedPdfInfo
      } catch (error) {
        console.error('❌ 원본 PDF 업로드 실패:', error)
        throw error
      }
    },

    /**
     * PDF를 서버에서 이미지로 변환
     * 새로운 백엔드 API를 사용하여 PDF를 고품질 이미지로 변환
     * @returns {Promise<void>}
     */
    async processPdfToImages() {
      try {
        if (!this.pdfFile || !this.uploadedPdfInfo?.fileHistoryId) {
          throw new Error('PDF 파일 또는 파일 히스토리 ID가 없습니다.')
        }

        this.loading = true

        const response = await fileHistoryAPI.processPdfToImages(
          this.pdfFile,
          this.uploadedPdfInfo.fileHistoryId
        )

        if (!response.data.success) {
          throw new Error(response.data.message || 'PDF 이미지 변환 실패')
        }

        const processingResult = response.data.data

        // 변환된 이미지들을 페이지 데이터로 설정
        this.pdfPages = processingResult.images.map((imageInfo, index) => ({
          index: index,
          pageNumber: imageInfo.pageNumber,
          preview: imageInfo.imageUrl,
          originalPage: index, // 원본 페이지 인덱스 (0부터 시작)
          width: imageInfo.width,
          height: imageInfo.height,
          fileSize: imageInfo.fileSize,
          pdfImageId: imageInfo.pdfImageId
        }))



        // 원본 페이지 수 설정
        this.originalPageCount = processingResult.totalPages

        // 삭제된 페이지 인덱스 초기화 (새로운 PDF 처리 시)
        this.deletedPageIndexes = []

      } catch (error) {
        console.error('❌ PDF 이미지 변환 실패:', error)
        this.error = error.message || 'PDF 이미지 변환 중 오류가 발생했습니다.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 편집된 PDF를 서버에 업로드
     * @param {Function} progressCallback - PDF 생성 진행률 콜백 함수 (선택사항)
     * @returns {Promise<Object>} 업로드 결과
     */
    async uploadProcessedPdf(progressCallback) {
      try {
        if (!this.pdfPages || this.pdfPages.length === 0) {
          console.log('📄 편집된 페이지 없음 → 원본 업로드로 대체')
          return await this.uploadOriginalPdf()
        }

        if (!this.finalPdf) await this.generateFinalPdf(progressCallback)

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const originalName = this.pdfFile.name.replace('.pdf', '')
        const fileName = `${originalName}_편집_${timestamp}.pdf`

        const response = await itemProcessingAPI.uploadProcessedPdf(
          this.finalPdf, fileName, "DOCUMENT", "file_history", 0, "편집된 PDF 파일"
        )

        if (!response.data.success) throw new Error(response.data.message || '편집된 PDF 업로드 실패')
        this.uploadedPdfInfo = response.data.data

        const fileMetadataId = response.data?.data?.id ?? response.data?.data?.fileMetadataId ?? response.data?.data?.fileId
        if (!fileMetadataId) return this.uploadedPdfInfo

        const subjectId = await this.getSubjectIdFromAreaCode(this.selectedTextbook?.areaCode)
        if (!subjectId) return this.uploadedPdfInfo

        try {
          const fileHistoryResponse = await fileHistoryAPI.createFileHistoryWithRetry(fileMetadataId, subjectId)
          this.uploadedPdfInfo.fileHistoryId = fileHistoryResponse.data.data
        } catch (err) {
          console.error('❌ 파일 히스토리 생성 실패:', err)
          this.showFileHistoryError = true
          this.fileHistoryErrorMessage = '파일 히스토리 생성 실패 (서버 문제일 수 있음).'
        }

        return this.uploadedPdfInfo
      } catch (error) {
        console.error('❌ PDF 업로드 실패:', error)
        throw error
      }
    },

    async getSubjectIdFromAreaCode(areaCode) {
      try {
        const subjectStore = useSubjectStore()
        if (subjectStore.list.length === 0) await subjectStore.fetchSubjects()
        const subject = subjectStore.list.find(s => s.areaCode === areaCode)
        return subject ? subject.subjectId : null
      } catch (error) {
        console.error('❌ 과목 정보 조회 실패:', error)
        const fallbackMapping = { 'KO': 1, 'EN': 2, 'MA': 3, 'SO': 4, 'SC': 5, 'HS': 6, 'MO': 7 }
        return fallbackMapping[areaCode] || null
      }
    },

    /**
     * "다음" 버튼 클릭 시 변경사항을 서버에 저장 (더 이상 사용하지 않음)
     * 현재는 편집할 때마다 실시간으로 API를 호출하므로 이 메서드는 deprecated
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async saveChangesToServer() {
      console.log('⚠️ saveChangesToServer는 더 이상 사용하지 않습니다. 편집할 때마다 실시간으로 API를 호출합니다.')
      return true
    },

    reset() {
      this.cleanupBlobUrls()
      this.textbooks = []
      this.selectedTextbook = null
      this.pdfFile = null
      this.pdfPages = []
      this.ocrData = []
      this.error = null
      this.finalPdf = null
      this.finalPdfGeneratedAt = null
      this.uploadedPdfInfo = null
      this.originalPageCount = 0
      this.deletedPageIndexes = []
    }
  }
})

