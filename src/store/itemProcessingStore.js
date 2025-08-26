/**
 * 문제 등록 Store
 * ItemProcessing 페이지에서 사용하는 상태 관리
 * 교과서 선택 및 PDF 처리 과정을 관리
 */

import { defineStore } from 'pinia'
import { itemProcessingAPI } from '../services/itemProcessApi.js'
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
    originalPageCount: 0
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
     * PDF 페이지 순서 변경
     * @param {number} fromIndex - 이동할 페이지의 현재 인덱스
     * @param {number} toIndex - 이동할 페이지의 목표 인덱스
     */
    movePage(fromIndex, toIndex) {
      if (fromIndex >= 0 && toIndex >= 0 && fromIndex < this.pdfPages.length && toIndex < this.pdfPages.length) {
        const page = this.pdfPages.splice(fromIndex, 1)[0]
        this.pdfPages.splice(toIndex, 0, page)
      } else {
        console.warn('유효하지 않은 인덱스:', { fromIndex, toIndex, pdfPagesLength: this.pdfPages.length })
      }
    },

    /**
     * PDF 페이지 삭제
     * @param {number} pageIndex - 삭제할 페이지의 인덱스
     */
    removePage(pageIndex) {
      if (pageIndex >= 0 && pageIndex < this.pdfPages.length) {
        // Blob URL도 함께 정리
        const page = this.pdfPages[pageIndex]
        if (page && page.preview) {
          this.removeBlobUrl(page.preview)
        }
        this.pdfPages.splice(pageIndex, 1)
      } else {
        console.warn('유효하지 않은 페이지 인덱스:', pageIndex)
      }
    },

    /**
     * 여러 PDF 페이지 일괄 삭제
     * @param {Array<number>} pageIndexes - 삭제할 페이지 인덱스 배열
     */
    removeMultiplePages(pageIndexes) {
      if (!Array.isArray(pageIndexes) || pageIndexes.length === 0) {
        console.warn('유효하지 않은 페이지 인덱스 배열:', pageIndexes)
        return
      }

      // 인덱스를 내림차순으로 정렬하여 뒤에서부터 삭제 (인덱스 변화 방지)
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
     * OCR 결과를 PDF 페이지로 변환
     * @param {Object} ocrResult - OCR 처리 결과
     * @returns {Promise<Object>}
     */
    async convertOcrToPdfPages(ocrResult) {
      try {
        console.log('OCR 결과를 PDF 페이지로 변환 시작:', ocrResult)

        if (!ocrResult || !ocrResult.selectedAreas) {
          throw new Error('OCR 결과 데이터가 유효하지 않습니다.')
        }

        const { selectedAreas } = ocrResult

        // 필수 영역 확인
        if (!selectedAreas.question || !selectedAreas.options) {
          throw new Error('지문과 보기 영역이 모두 선택되어야 합니다.')
        }

        // 새로운 PDF 페이지 생성
        const newPage = {
          id: Date.now(), // 고유 ID
          index: this.pdfPages.length, // 페이지 인덱스
          preview: selectedAreas.question.imageData, // 지문 이미지를 메인으로 사용
          width: selectedAreas.question.width,
          height: selectedAreas.question.height,
          selectedAreas: selectedAreas, // 선택된 영역 정보 저장
          ocrData: ocrResult.ocrResults || [], // OCR 결과 데이터
          createdAt: new Date().toISOString()
        }

        // PDF 페이지 목록에 추가
        this.pdfPages.push(newPage)

        console.log('새로운 PDF 페이지 추가됨:', newPage)
        console.log('현재 PDF 페이지 수:', this.pdfPages.length)

        return newPage

      } catch (error) {
        console.error('OCR 결과를 PDF 페이지로 변환 실패:', error)
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

        // 최종 PDF 크기만 간단히 로깅
        console.log(`📄 최종 PDF 생성: ${(pdfBlob.size / 1024 / 1024).toFixed(2)}MB`)

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
     * 편집된 PDF를 서버에 업로드
     * @param {Function} progressCallback - PDF 생성 진행률 콜백 함수 (선택사항)
     * @returns {Promise<Object>} 업로드 결과
     */
    async uploadProcessedPdf(progressCallback = null) {
      try {
        // 최종 PDF가 없으면 생성
        if (!this.finalPdf) {
          await this.generateFinalPdf(progressCallback)
        }

        // 파일명 생성 (원본 파일명 + 편집됨 + 타임스탬프)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const originalName = this.pdfFile.name.replace('.pdf', '')
        const fileName = `${originalName}_편집됨_${timestamp}.pdf`

        // 업로드 파일 크기만 간단히 로깅
        console.log(`🚀 PDF 업로드: ${(this.finalPdf.size / 1024 / 1024).toFixed(2)}MB (원본: ${(this.pdfFile.size / 1024 / 1024).toFixed(2)}MB)`)

        const response = await itemProcessingAPI.uploadProcessedPdf(
          this.finalPdf,          // file
          fileName,               // fileName
          "DOCUMENT",             // category
          "file_history",         // entityType
          0,                      // entityId
          "편집된 PDF 파일"        // description
        )

        if (response.data.success) {
          this.uploadedPdfInfo = response.data.data
          return response.data.data
        } else {
          throw new Error(response.data.message || 'PDF 업로드에 실패했습니다.')
        }

      } catch (error) {
        console.error('PDF 업로드 실패:', error)
        throw error
      }
    },

    /**
     * 상태 초기화
     */
    reset() {
      // Blob URL들 먼저 정리
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
    }
  }
})
