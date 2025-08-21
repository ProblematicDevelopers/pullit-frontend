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

        console.log('교과서 목록 API 호출 시작')

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
        console.log('최종 textbooks 상태:', this.textbooks)
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
      console.log('=== Store setPdfPages 호출됨 ===')
      console.log('이전 pdfPages 길이:', this.pdfPages.length)
      console.log('새로운 pages 길이:', pages.length)
      console.log('새로운 pages:', pages.map(p => ({ index: p.index, pageNumber: p.pageNumber })))

      this.pdfPages = pages

      console.log('Store pdfPages 업데이트 완료:', this.pdfPages.length)
    },

    /**
     * Blob URL 추가 (메모리 관리용)
     * @param {string} url - 생성된 Blob URL
     */
    addBlobUrl(url) {
      if (url && !this.blobUrls.includes(url)) {
        this.blobUrls.push(url)
        console.log('Store에 Blob URL 추가됨:', url)
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
          console.log('Store에서 Blob URL 정리됨:', url)
        } catch (error) {
          console.warn('Blob URL 정리 중 오류:', error)
        }
      }
    },

    /**
     * 모든 Blob URL 정리
     */
    cleanupBlobUrls() {
      console.log(`Store에서 ${this.blobUrls.length}개의 Blob URL 정리 시작`)
      this.blobUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url)
          console.log('Blob URL 정리됨:', url)
        } catch (error) {
          console.warn('Blob URL 정리 중 오류:', error)
        }
      })
      this.blobUrls = []
      console.log('Store에서 모든 Blob URL 정리 완료')
    },

    /**
     * PDF 페이지 순서 변경
     * @param {number} fromIndex - 이동할 페이지의 현재 인덱스
     * @param {number} toIndex - 이동할 페이지의 목표 인덱스
     */
    movePage(fromIndex, toIndex) {
      console.log('=== Store movePage 호출됨 ===')
      console.log('이동할 페이지 인덱스:', fromIndex, '->', toIndex)
      console.log('이동 전 pdfPages 길이:', this.pdfPages.length)

      if (fromIndex >= 0 && toIndex >= 0 && fromIndex < this.pdfPages.length && toIndex < this.pdfPages.length) {
        const page = this.pdfPages.splice(fromIndex, 1)[0]
        this.pdfPages.splice(toIndex, 0, page)

        console.log('페이지 이동 완료')
        console.log('이동 후 페이지들:', this.pdfPages.map(p => ({ index: p.index, pageNumber: p.pageNumber })))
      } else {
        console.warn('유효하지 않은 인덱스:', { fromIndex, toIndex, pdfPagesLength: this.pdfPages.length })
      }
    },

    /**
     * PDF 페이지 삭제
     * @param {number} pageIndex - 삭제할 페이지의 인덱스
     */
    removePage(pageIndex) {
      console.log('=== Store removePage 호출됨 ===')
      console.log('삭제할 페이지 인덱스:', pageIndex)
      console.log('삭제 전 pdfPages 길이:', this.pdfPages.length)

      if (pageIndex >= 0 && pageIndex < this.pdfPages.length) {
        // Blob URL도 함께 정리
        const page = this.pdfPages[pageIndex]
        if (page && page.preview) {
          this.removeBlobUrl(page.preview)
        }
        this.pdfPages.splice(pageIndex, 1)

        console.log('페이지 삭제 완료, 남은 길이:', this.pdfPages.length)
        console.log('남은 페이지들:', this.pdfPages.map(p => ({ index: p.index, pageNumber: p.pageNumber })))
      } else {
        console.warn('유효하지 않은 페이지 인덱스:', pageIndex)
      }
    },

    /**
     * 여러 PDF 페이지 일괄 삭제
     * @param {Array<number>} pageIndexes - 삭제할 페이지 인덱스 배열
     */
    removeMultiplePages(pageIndexes) {
      console.log('=== Store removeMultiplePages 호출됨 ===')
      console.log('삭제할 페이지 인덱스들:', pageIndexes)
      console.log('삭제 전 pdfPages 길이:', this.pdfPages.length)

      if (!Array.isArray(pageIndexes) || pageIndexes.length === 0) {
        console.warn('유효하지 않은 페이지 인덱스 배열:', pageIndexes)
        return
      }

      console.log('Store에서 일괄 삭제 시작:', pageIndexes)

      // 인덱스를 내림차순으로 정렬하여 뒤에서부터 삭제 (인덱스 변화 방지)
      const sortedIndexes = [...pageIndexes].sort((a, b) => b - a)
      console.log('정렬된 인덱스 (내림차순):', sortedIndexes)

      sortedIndexes.forEach(index => {
        if (index >= 0 && index < this.pdfPages.length) {
          // Blob URL도 함께 정리
          const page = this.pdfPages[index]
          if (page && page.preview) {
            this.removeBlobUrl(page.preview)
          }
          this.pdfPages.splice(index, 1)
          console.log(`인덱스 ${index} 페이지 삭제 완료`)
        } else {
          console.warn(`유효하지 않은 인덱스 ${index} 건너뜀`)
        }
      })

      console.log('Store에서 일괄 삭제 완료, 남은 페이지 수:', this.pdfPages.length)
      console.log('남은 페이지들:', this.pdfPages.map(p => ({ index: p.index, pageNumber: p.pageNumber })))
    },

    /**
     * OCR 데이터 저장
     * @param {Object} data - OCR 처리된 데이터
     */
    saveOcrData(data) {
      this.ocrData.push(data)
    },

    /**
     * 편집된 PDF를 최종 PDF로 생성
     * @returns {Promise<Blob>} 생성된 최종 PDF Blob
     */
    async generateFinalPdf() {
      try {
        if (!this.pdfPages || this.pdfPages.length === 0) {
          throw new Error('편집할 PDF 페이지가 없습니다.')
        }

        console.log('최종 PDF 생성 시작, 페이지 수:', this.pdfPages.length)

        // PDFDocument 생성
        const { PDFDocument } = await import('pdf-lib')
        const pdfDoc = await PDFDocument.create()

        // 편집된 순서대로 페이지 추가
        for (let i = 0; i < this.pdfPages.length; i++) {
          const page = this.pdfPages[i]
          if (page.blob) {
            try {
              const pagePdf = await PDFDocument.load(await page.blob.arrayBuffer())
              const [copiedPage] = await pdfDoc.copyPages(pagePdf, [0])
              pdfDoc.addPage(copiedPage)
              console.log(`페이지 ${i + 1} 추가 완료`)
            } catch (pageError) {
              console.warn(`페이지 ${i + 1} 처리 중 오류:`, pageError)
            }
          }
        }

        // 최종 PDF를 Blob으로 변환
        const pdfBytes = await pdfDoc.save()
        const finalPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

        // Store에 최종 PDF 저장
        this.finalPdf = finalPdfBlob
        this.finalPdfGeneratedAt = new Date().toISOString()

        console.log('최종 PDF 생성 완료, 크기:', finalPdfBlob.size, 'bytes')
        return finalPdfBlob

      } catch (error) {
        console.error('최종 PDF 생성 실패:', error)
        throw error
      }
    },

    /**
     * 편집된 PDF를 서버에 업로드
     * @returns {Promise<Object>} 업로드 결과
     */
    async uploadProcessedPdf() {
      try {
        console.log('PDF 업로드 시작:')

        // 최종 PDF가 없으면 생성
        if (!this.finalPdf) {
          console.log('최종 PDF가 없어서 생성 시작')
          await this.generateFinalPdf()
        }

        const response = await itemProcessingAPI.uploadProcessedPdf(
          this.finalPdf,          // file
          this.pdfFile.name,
          "DOCUMENT",             // category
          "file_history",         // entityType
          0,                      // entityId
          "user uploaded pdf"     // description
        )
        console.log(response)
        if (response.data.success) {
          this.uploadedPdfInfo = response.data.data
          console.log('PDF 업로드 성공:', response.data.data)
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
