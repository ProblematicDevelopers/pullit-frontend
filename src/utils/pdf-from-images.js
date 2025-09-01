/**
 * Image-based PDF Generator
 * 이미지 데이터를 받아서 PDF로 변환
 * 자동 페이지 분할 및 컬럼 레이아웃 지원
 */

import jsPDF from 'jspdf'

// A4 페이지 설정 (mm 단위)
const A4_CONFIG = {
  width: 210,
  height: 297,
  margin: {
    top: 20,
    bottom: 20,
    left: 15,
    right: 15
  },
  columnGap: 10 // 2단 레이아웃일 때 컬럼 간격
}

/**
 * 이미지 배열로부터 PDF 생성
 * @param {Array} images - 이미지 데이터 배열
 * @param {Object} options - PDF 생성 옵션
 * @returns {Promise<jsPDF>} 생성된 PDF 객체
 */
export async function generatePDFFromImages(images, options = {}) {
  const {
    examTitle = '시험지',
    subject = '',
    grade = '',
    duration = '',
    totalScore = '',
    layoutMode = 'double', // 기본값을 'double'로 변경
    showPageNumbers = true,
    onProgress
  } = options

  // PDF 초기화 - 압축 설정 추가
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  // 사용 가능한 영역 계산
  const contentWidth = A4_CONFIG.width - A4_CONFIG.margin.left - A4_CONFIG.margin.right
  const contentHeight = A4_CONFIG.height - A4_CONFIG.margin.top - A4_CONFIG.margin.bottom

  // 레이아웃에 따른 컬럼 너비 계산
  const columnWidth = layoutMode === 'double' 
    ? (contentWidth - A4_CONFIG.columnGap) / 2 
    : contentWidth

  // 첫 페이지에 헤더 추가 - 한글 문제로 인해 간단하게 처리
  // addExamHeader(pdf, {
  //   examTitle,
  //   subject,
  //   grade,
  //   duration,
  //   totalScore
  // })

  let currentY = A4_CONFIG.margin.top // 헤더 제거로 인해 바로 시작
  let currentColumn = 0 // 0: 왼쪽, 1: 오른쪽 (2단 레이아웃용)
  let currentPage = 1

  // 각 이미지를 PDF에 추가
  for (let i = 0; i < images.length; i++) {
    const imageData = images[i]
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: images.length,
        message: `PDF 생성 중... (${i + 1}/${images.length})`
      })
    }

    // 헤더 이미지는 전체 너비로 표시
    const isHeader = imageData.type === 'header' || imageData.isHeader
    const imgWidth = isHeader ? contentWidth : columnWidth
    
    // 이미지 크기 계산 (비율 유지)
    const imgAspectRatio = imageData.naturalWidth / imageData.naturalHeight
    const imgHeight = imgWidth / imgAspectRatio

    // 현재 위치에서 이미지가 페이지를 벗어나는지 확인
    const needNewColumn = currentY + imgHeight > A4_CONFIG.height - A4_CONFIG.margin.bottom
    const needNewPage = layoutMode === 'single' 
      ? needNewColumn 
      : (needNewColumn && currentColumn === 1)

    if (needNewPage) {
      // 새 페이지 추가
      pdf.addPage()
      currentPage++
      currentY = A4_CONFIG.margin.top
      currentColumn = 0

      // 페이지 번호 추가
      if (showPageNumbers) {
        addPageNumber(pdf, currentPage)
      }
    } else if (needNewColumn && layoutMode === 'double' && currentColumn === 0) {
      // 오른쪽 컬럼으로 이동
      currentColumn = 1
      currentY = A4_CONFIG.margin.top
    }

    // 이미지 위치 계산 (헤더는 항상 가운데 정렬)
    const xPosition = isHeader 
      ? A4_CONFIG.margin.left
      : (layoutMode === 'double' && currentColumn === 1
        ? A4_CONFIG.margin.left + columnWidth + A4_CONFIG.columnGap
        : A4_CONFIG.margin.left)

    // 이미지 추가
    try {
      pdf.addImage(
        imageData.dataUrl,
        'PNG',
        xPosition,
        currentY,
        imgWidth,
        imgHeight
      )

      // 문제 번호는 이미지에 포함되어 있으므로 별도로 추가하지 않음
      // (한글 폰트 문제 회피)

      // Y 위치 업데이트 (이미지 높이 + 간격)
      currentY += imgHeight + 10

      // 2단 레이아웃에서 컬럼 전환
      if (layoutMode === 'double' && currentColumn === 0 && !needNewColumn) {
        // 다음 이미지를 위해 오른쪽 컬럼 체크
        const nextImageFitsInRightColumn = i + 1 < images.length
        if (nextImageFitsInRightColumn) {
          const nextImage = images[i + 1]
          const nextImgHeight = (columnWidth / nextImage.naturalWidth) * nextImage.naturalHeight
          
          // 오른쪽 컬럼에 공간이 있으면 이동
          if (A4_CONFIG.margin.top + nextImgHeight <= A4_CONFIG.height - A4_CONFIG.margin.bottom) {
            currentColumn = 1
            currentY = A4_CONFIG.margin.top
          }
        }
      }
    } catch (error) {
      console.error(`이미지 ${i + 1} 추가 실패:`, error)
    }
  }

  // 첫 페이지 번호 추가
  if (showPageNumbers) {
    pdf.setPage(1)
    addPageNumber(pdf, 1)
  }

  return pdf
}

/**
 * PDF에 시험 헤더 추가
 */
function addExamHeader(pdf, headerInfo) {
  const { examTitle, subject, grade, duration, totalScore } = headerInfo
  
  pdf.setFontSize(18)
  pdf.setFont(undefined, 'bold')
  pdf.text(examTitle, A4_CONFIG.width / 2, A4_CONFIG.margin.top, { align: 'center' })
  
  pdf.setFontSize(12)
  pdf.setFont(undefined, 'normal')
  
  const infoY = A4_CONFIG.margin.top + 10
  const infoTexts = []
  
  if (grade) infoTexts.push(`학년: ${grade}`)
  if (subject) infoTexts.push(`과목: ${subject}`)
  if (duration) infoTexts.push(`시간: ${duration}분`)
  if (totalScore) infoTexts.push(`총점: ${totalScore}점`)
  
  if (infoTexts.length > 0) {
    pdf.text(infoTexts.join(' | '), A4_CONFIG.width / 2, infoY, { align: 'center' })
  }
  
  // 구분선
  pdf.setLineWidth(0.5)
  pdf.line(
    A4_CONFIG.margin.left,
    A4_CONFIG.margin.top + 15,
    A4_CONFIG.width - A4_CONFIG.margin.right,
    A4_CONFIG.margin.top + 15
  )
}

/**
 * 페이지 번호 추가
 */
function addPageNumber(pdf, pageNumber) {
  pdf.setFontSize(10)
  pdf.setTextColor(128)
  // 페이지 번호만 숫자로 표시 (한글 문제 회피)
  pdf.text(
    String(pageNumber),
    A4_CONFIG.width / 2,
    A4_CONFIG.height - 10,
    { align: 'center' }
  )
}

/**
 * PDF를 Blob으로 변환
 */
export function pdfToBlob(pdf) {
  return pdf.output('blob')
}

/**
 * PDF 다운로드
 */
export function downloadPDF(pdf, filename = 'exam.pdf') {
  pdf.save(filename)
}

/**
 * 이미지 기반 PDF 생성 및 다운로드 (통합 함수)
 */
export async function createAndDownloadPDF(images, options = {}) {
  try {
    const pdf = await generatePDFFromImages(images, options)
    const filename = options.filename || `exam_${new Date().toISOString().split('T')[0]}.pdf`
    downloadPDF(pdf, filename)
    return pdf
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    throw error
  }
}

export default {
  generatePDFFromImages,
  pdfToBlob,
  downloadPDF,
  createAndDownloadPDF
}