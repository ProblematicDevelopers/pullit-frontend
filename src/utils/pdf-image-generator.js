/**
 * PDF Image Generator
 * HTML 콘텐츠를 이미지로 변환하여 PDF로 저장하는 시스템
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * HTML 요소를 캔버스로 변환
 * 개선된 옵션으로 레이아웃 보존 및 품질 향상
 */
export async function htmlToCanvas(element, options = {}) {
  const defaultOptions = {
    scale: 3, // 해상도 향상 (2 → 3)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    letterRendering: true,
    imageTimeout: 30000, // 타임아웃 증가
    // 한글 폰트 및 복잡한 CSS 지원
    foreignObjectRendering: true,
    // 스크롤 처리
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    // 추가 옵션들
    removeContainer: false, // 컨테이너 유지
    ignoreElements: (element) => {
      // 불필요한 요소 제거 (예: 숨겨진 요소)
      return element.classList?.contains('no-print')
    },
    onclone: (clonedDoc, element) => {
      // 클론된 문서에서 스타일 조정
      const clonedElement = clonedDoc.querySelector(`[data-element-id="${element.getAttribute('data-element-id')}"]`)
      if (clonedElement) {
        // 인쇄용 스타일 적용
        clonedElement.classList.add('print-mode')
      }
    }
  }
  
  // 렌더링 전 대기 (MathJax 등의 비동기 렌더링 완료 대기)
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return await html2canvas(element, { ...defaultOptions, ...options })
}

/**
 * 캔버스를 이미지 데이터로 변환
 */
export function canvasToImage(canvas, format = 'png', quality = 1.0) {
  return canvas.toDataURL(`image/${format}`, quality)
}

/**
 * 캔버스를 Blob으로 변환
 */
export function canvasToBlob(canvas, format = 'png', quality = 1.0) {
  return new Promise((resolve) => {
    canvas.toBlob(blob => resolve(blob), `image/${format}`, quality)
  })
}

/**
 * 여러 페이지를 이미지로 변환하여 PDF 생성
 */
export async function generatePDFFromPages(pageElements, options = {}) {
  const {
    filename = 'exam.pdf',
    format = 'a4',
    orientation = 'portrait',
    imageFormat = 'jpeg',
    imageQuality = 0.95,
    margin = 10, // mm
    onProgress = null
  } = options
  
  // PDF 생성
  const pdf = new jsPDF({
    unit: 'mm',
    format: format,
    orientation: orientation,
    compress: true
  })
  
  // A4 크기 (mm)
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - (margin * 2)
  const contentHeight = pageHeight - (margin * 2)
  
  // 각 페이지를 이미지로 변환
  for (let i = 0; i < pageElements.length; i++) {
    const element = pageElements[i]
    
    // 진행 상황 콜백
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: pageElements.length,
        status: 'converting',
        message: `페이지 ${i + 1}/${pageElements.length} 변환 중...`
      })
    }
    
    try {
      // HTML을 캔버스로 변환 (개선된 옵션 사용)
      const canvas = await htmlToCanvas(element, {
        scale: 3, // 고해상도
        useCORS: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        foreignObjectRendering: true
      })
      
      // 캔버스를 이미지로 변환
      const imgData = canvasToImage(canvas, imageFormat, imageQuality)
      
      // 이미지 비율 계산
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight)
      
      // 실제 이미지 크기 계산
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio
      
      // 페이지 중앙 정렬
      const xOffset = margin + (contentWidth - finalWidth) / 2
      const yOffset = margin + (contentHeight - finalHeight) / 2
      
      // 새 페이지 추가 (첫 페이지 제외)
      if (i > 0) {
        pdf.addPage()
      }
      
      // 이미지 추가
      pdf.addImage(imgData, imageFormat.toUpperCase(), xOffset, yOffset, finalWidth, finalHeight)
      
    } catch (error) {
      console.error(`페이지 ${i + 1} 변환 실패:`, error)
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: pageElements.length,
          status: 'error',
          message: `페이지 ${i + 1} 변환 실패`,
          error: error
        })
      }
    }
  }
  
  // 완료 콜백
  if (onProgress) {
    onProgress({
      current: pageElements.length,
      total: pageElements.length,
      status: 'complete',
      message: 'PDF 생성 완료'
    })
  }
  
  return pdf
}

/**
 * 단일 HTML 요소를 PDF로 변환 (긴 콘텐츠 자동 분할)
 */
export async function generatePDFFromElement(element, options = {}) {
  const {
    filename = 'exam.pdf',
    format = 'a4',
    orientation = 'portrait',
    imageFormat = 'jpeg',
    imageQuality = 0.95,
    margin = 10, // mm
    splitHeight = null, // 분할 높이 (픽셀)
    onProgress = null
  } = options
  
  // PDF 생성
  const pdf = new jsPDF({
    unit: 'mm',
    format: format,
    orientation: orientation,
    compress: true
  })
  
  // A4 크기 (mm)
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - (margin * 2)
  const contentHeight = pageHeight - (margin * 2)
  
  // HTML을 캔버스로 변환
  if (onProgress) {
    onProgress({
      status: 'converting',
      message: '콘텐츠를 이미지로 변환 중...'
    })
  }
  
  const canvas = await htmlToCanvas(element, {
    scale: 3, // 고해상도
    useCORS: true,
    backgroundColor: '#ffffff',
    removeContainer: false,
    foreignObjectRendering: true
  })
  
  // 이미지 크기
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  
  // A4 비율로 스케일 계산
  const ratio = contentWidth / imgWidth
  const scaledHeight = imgHeight * ratio
  
  // 페이지 수 계산
  const pageCount = Math.ceil(scaledHeight / contentHeight)
  
  // 각 페이지별로 이미지 잘라서 추가
  for (let page = 0; page < pageCount; page++) {
    if (onProgress) {
      onProgress({
        current: page + 1,
        total: pageCount,
        status: 'generating',
        message: `페이지 ${page + 1}/${pageCount} 생성 중...`
      })
    }
    
    // 새 페이지 추가 (첫 페이지 제외)
    if (page > 0) {
      pdf.addPage()
    }
    
    // 현재 페이지에 해당하는 부분만 잘라내기
    const sourceY = (page * contentHeight) / ratio
    const sourceHeight = Math.min(contentHeight / ratio, imgHeight - sourceY)
    
    // 임시 캔버스 생성하여 부분 이미지 추출
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCanvas.width = imgWidth
    tempCanvas.height = sourceHeight
    
    // 원본 캔버스에서 부분 복사
    tempCtx.drawImage(
      canvas,
      0, sourceY, imgWidth, sourceHeight, // source
      0, 0, imgWidth, sourceHeight // destination
    )
    
    // 부분 이미지를 PDF에 추가
    const partialImgData = tempCanvas.toDataURL(`image/${imageFormat}`, imageQuality)
    const partialHeight = sourceHeight * ratio
    
    pdf.addImage(
      partialImgData,
      imageFormat.toUpperCase(),
      margin,
      margin,
      contentWidth,
      partialHeight
    )
  }
  
  // 완료 콜백
  if (onProgress) {
    onProgress({
      status: 'complete',
      message: 'PDF 생성 완료'
    })
  }
  
  return pdf
}

/**
 * PDF를 파일로 저장
 */
export function savePDF(pdf, filename = 'exam.pdf') {
  pdf.save(filename)
}

/**
 * PDF를 Blob으로 변환
 */
export function pdfToBlob(pdf) {
  return pdf.output('blob')
}

/**
 * PDF를 Base64로 변환
 */
export function pdfToBase64(pdf) {
  return pdf.output('datauristring')
}

/**
 * 미리보기용 이미지 생성
 */
export async function generatePreviewImages(pageElements, options = {}) {
  const {
    format = 'jpeg',
    quality = 0.8,
    maxWidth = 800,
    onProgress = null
  } = options
  
  const images = []
  
  for (let i = 0; i < pageElements.length; i++) {
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: pageElements.length,
        message: `페이지 ${i + 1} 미리보기 생성 중...`
      })
    }
    
    try {
      const canvas = await htmlToCanvas(pageElements[i], {
        scale: 1,
        backgroundColor: '#ffffff'
      })
      
      // 크기 조정이 필요한 경우
      if (canvas.width > maxWidth) {
        const ratio = maxWidth / canvas.width
        const resizedCanvas = document.createElement('canvas')
        const ctx = resizedCanvas.getContext('2d')
        
        resizedCanvas.width = maxWidth
        resizedCanvas.height = canvas.height * ratio
        
        ctx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height)
        
        images.push({
          url: resizedCanvas.toDataURL(`image/${format}`, quality),
          width: resizedCanvas.width,
          height: resizedCanvas.height
        })
      } else {
        images.push({
          url: canvas.toDataURL(`image/${format}`, quality),
          width: canvas.width,
          height: canvas.height
        })
      }
    } catch (error) {
      console.error(`페이지 ${i + 1} 미리보기 생성 실패:`, error)
      images.push(null)
    }
  }
  
  return images
}

/**
 * 전체 프로세스를 한 번에 처리하는 헬퍼 함수
 */
export async function convertHTMLToPDF(element, options = {}) {
  const {
    method = 'single', // 'single' | 'pages'
    pageElements = null,
    ...pdfOptions
  } = options
  
  let pdf
  
  if (method === 'pages' && pageElements) {
    // 여러 페이지로 분할된 경우
    pdf = await generatePDFFromPages(pageElements, pdfOptions)
  } else {
    // 단일 요소를 자동 분할
    pdf = await generatePDFFromElement(element, pdfOptions)
  }
  
  // 파일 저장
  if (pdfOptions.save !== false) {
    savePDF(pdf, pdfOptions.filename)
  }
  
  return pdf
}