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
    layoutMode = 'double', // 기본값 'double' (2단 레이아웃)
    questionsPerPage = 4, // 페이지당 문항 수 (기본값: 4개)
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

  let currentPage = 1
  let leftColumnY = A4_CONFIG.margin.top
  let rightColumnY = A4_CONFIG.margin.top
  let currentColumn = 0 // 0: 왼쪽, 1: 오른쪽
  let questionsOnCurrentPage = 0 // 현재 페이지의 문항 수

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

    // 헤더 처리
    if (isHeader) {
      // 헤더는 항상 새 위치에서 시작
      if (i === 0) {
        // 첫 페이지 헤더
        leftColumnY = A4_CONFIG.margin.top
        rightColumnY = A4_CONFIG.margin.top
      }

      pdf.addImage(
        imageData.dataUrl,
        'PNG',
        A4_CONFIG.margin.left,
        leftColumnY,
        contentWidth,
        imgHeight
      )

      // 헤더 후 Y 위치 업데이트 - 간격을 줄임
      leftColumnY += imgHeight + 10  // 20에서 10으로 줄임
      rightColumnY = leftColumnY
      currentColumn = 0
      continue
    }

    // 일반 이미지 처리 (2단 레이아웃)
    if (layoutMode === 'double') {
      // 페이지당 문항 수 체크 (헤더 제외)
      if (questionsPerPage > 0 && questionsOnCurrentPage >= questionsPerPage) {
        // 페이지당 문항 수를 초과하면 새 페이지로
        pdf.addPage()
        currentPage++
        leftColumnY = A4_CONFIG.margin.top
        rightColumnY = A4_CONFIG.margin.top
        currentColumn = 0
        questionsOnCurrentPage = 0
        
        if (showPageNumbers) {
          addPageNumber(pdf, currentPage)
        }
      }
      
      let currentY = currentColumn === 0 ? leftColumnY : rightColumnY

      // 페이지 넘침 체크 (questionsPerPage가 0이거나 음수일 때만 적용)
      if (questionsPerPage <= 0 && currentY + imgHeight > A4_CONFIG.height - A4_CONFIG.margin.bottom) {
        // 현재 컬럼이 가득 찬 경우
        if (currentColumn === 0) {
          // 왼쪽 컬럼이 가득 -> 오른쪽 컬럼으로
          currentColumn = 1
          currentY = rightColumnY

          // 오른쪽 컬럼도 가득 찬 경우 새 페이지
          if (currentY + imgHeight > A4_CONFIG.height - A4_CONFIG.margin.bottom) {
            pdf.addPage()
            currentPage++
            leftColumnY = A4_CONFIG.margin.top
            rightColumnY = A4_CONFIG.margin.top
            currentColumn = 0
            currentY = leftColumnY

            if (showPageNumbers) {
              addPageNumber(pdf, currentPage)
            }
          }
        } else {
          // 오른쪽 컬럼이 가득 -> 새 페이지
          pdf.addPage()
          currentPage++
          leftColumnY = A4_CONFIG.margin.top
          rightColumnY = A4_CONFIG.margin.top
          currentColumn = 0
          currentY = leftColumnY

          if (showPageNumbers) {
            addPageNumber(pdf, currentPage)
          }
        }
      }

      // 이미지 추가
      const xPosition = currentColumn === 0
        ? A4_CONFIG.margin.left
        : A4_CONFIG.margin.left + columnWidth + A4_CONFIG.columnGap

      try {
        pdf.addImage(
          imageData.dataUrl,
          'PNG',
          xPosition,
          currentY,
          columnWidth,
          imgHeight
        )

        // 문항 수 증가
        questionsOnCurrentPage++
        
        // Y 위치 업데이트 - 왼쪽 컬럼을 먼저 채우기
        if (currentColumn === 0) {
          leftColumnY = currentY + imgHeight + 10
          
          // questionsPerPage 설정이 있을 때는 단순히 컬럼 전환
          if (questionsPerPage > 0) {
            currentColumn = 1 // 다음은 오른쪽 컬럼으로
          } else {
            // 기존 로직: 다음 이미지가 왼쪽 컬럼에 들어갈 수 있는지 확인
            if (i + 1 < images.length) {
              const nextImage = images[i + 1]
              const nextImgHeight = (columnWidth / nextImage.naturalWidth) * nextImage.naturalHeight
              // 왼쪽 컬럼에 공간이 없으면 오른쪽으로
              if (leftColumnY + nextImgHeight > A4_CONFIG.height - A4_CONFIG.margin.bottom) {
                currentColumn = 1
              }
            }
          }
        } else {
          rightColumnY = currentY + imgHeight + 10
          // 오른쪽 컬럼을 채운 후 다시 왼쪽으로
          currentColumn = 0
        }
      } catch (error) {
        console.error(`이미지 ${i + 1} 추가 실패:`, error)
      }
    } else {
      // 단일 컬럼 레이아웃 (사용하지 않지만 안전을 위해)
      if (leftColumnY + imgHeight > A4_CONFIG.height - A4_CONFIG.margin.bottom) {
        pdf.addPage()
        currentPage++
        leftColumnY = A4_CONFIG.margin.top

        if (showPageNumbers) {
          addPageNumber(pdf, currentPage)
        }
      }

      try {
        pdf.addImage(
          imageData.dataUrl,
          'PNG',
          A4_CONFIG.margin.left,
          leftColumnY,
          contentWidth,
          imgHeight
        )

        leftColumnY += imgHeight + 10
      } catch (error) {
        console.error(`이미지 ${i + 1} 추가 실패:`, error)
      }
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
