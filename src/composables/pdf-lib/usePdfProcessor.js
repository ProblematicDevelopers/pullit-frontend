import { PDFDocument } from 'pdf-lib'

/**
 * PDF 파일 처리 로직을 담당하는 Composable
 * PDF 로딩, 페이지 분리, 썸네일 생성을 담당
 */
export function usePdfProcessor() {

  /**
   * PDF 파일을 ArrayBuffer로 읽기
   * @param {File} file - PDF 파일
   * @returns {Promise<ArrayBuffer>} ArrayBuffer
   */
  const readPdfFile = async (file) => {
    try {
      return await file.arrayBuffer()
    } catch (error) {
      throw new Error(`PDF 파일 읽기 실패: ${error.message}`)
    }
  }

  /**
   * PDF 문서 로딩
   * @param {ArrayBuffer} arrayBuffer - PDF 파일의 ArrayBuffer
   * @returns {Promise<PDFDocument>} PDF 문서 객체
   */
  const loadPdfDocument = async (arrayBuffer) => {
    try {
      return await PDFDocument.load(arrayBuffer)
    } catch (error) {
      throw new Error(`PDF 문서 로딩 실패: ${error.message}`)
    }
  }

  /**
   * PDF 페이지 정보 추출
   * @param {PDFDocument} pdfDoc - PDF 문서 객체
   * @returns {Array} 페이지 정보 배열
   */
  const extractPageInfo = (pdfDoc) => {
    const pageCount = pdfDoc.getPageCount()
    const pages = []

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i)
      pages.push({
        index: i,
        pageNumber: i + 1,
        originalPage: i,
        width: page.getWidth(),
        height: page.getHeight()
      })
    }

    return pages
  }

  /**
   * 개별 페이지 PDF 생성
   * @param {PDFDocument} pdfDoc - 원본 PDF 문서
   * @param {number} pageIndex - 페이지 인덱스
   * @returns {Promise<Blob>} 페이지별 PDF Blob
   */
  const createSinglePagePdf = async (pdfDoc, pageIndex) => {
    try {
      const singlePagePdf = await PDFDocument.create()
      const [page] = await singlePagePdf.copyPages(pdfDoc, [pageIndex])
      singlePagePdf.addPage(page)

      const pdfBytes = await singlePagePdf.save()
      return new Blob([pdfBytes], { type: 'application/pdf' })
    } catch (error) {
      throw new Error(`페이지 ${pageIndex + 1} PDF 생성 실패: ${error.message}`)
    }
  }

  /**
   * PDF 파일 전체 처리
   * @param {File} file - PDF 파일
   * @returns {Promise<Array>} 처리된 페이지 정보 배열
   */
  const processPdfFile = async (file) => {
    try {
      console.log('PDF 파일 처리 시작:', file.name)

      // 1. 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await readPdfFile(file)

      // 2. PDF 문서 로딩
      const pdfDoc = await loadPdfDocument(arrayBuffer)
      const pageCount = pdfDoc.getPageCount()
      console.log(`PDF 페이지 수: ${pageCount}`)

      // 3. 페이지 정보 추출
      const pages = extractPageInfo(pdfDoc)

      // 4. 각 페이지별 개별 PDF 생성
      const processedPages = []
      for (let i = 0; i < pageCount; i++) {
        const blob = await createSinglePagePdf(pdfDoc, i)

        processedPages.push({
          ...pages[i],
          blob: blob,
          // preview는 외부에서 Blob URL 생성 후 설정
          preview: null
        })
      }

      console.log('PDF 파일 처리 완료:', processedPages.length)
      return processedPages

    } catch (error) {
      console.error('PDF 처리 중 오류 발생:', error)
      throw error
    }
  }

  /**
   * PDF 페이지 유효성 검사
   * @param {Array} pages - 페이지 배열
   * @returns {boolean} 유효성 여부
   */
  const validatePages = (pages) => {
    if (!Array.isArray(pages) || pages.length === 0) {
      return false
    }

    return pages.every(page =>
      page.index !== undefined &&
      page.pageNumber !== undefined &&
      page.blob instanceof Blob
    )
  }

  return {
    processPdfFile,
    readPdfFile,
    loadPdfDocument,
    extractPageInfo,
    createSinglePagePdf,
    validatePages
  }
}
