/**
 * Image-Based PDF Generator
 * 각 문제와 지문을 개별 이미지로 변환 후 PDF 페이지에 배치
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * HTML 요소를 이미지로 변환 (개선된 옵션)
 */
async function elementToImage(element) {
  const canvas = await html2canvas(element, {
    scale: 3, // 고해상도
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    letterRendering: true,
    foreignObjectRendering: true,
    removeContainer: false
  })
  
  return {
    canvas: canvas,
    dataUrl: canvas.toDataURL('image/png', 1.0),
    width: canvas.width,
    height: canvas.height
  }
}

/**
 * 컨테이너를 처리하고 이미지로 변환하는 헬퍼 함수
 */
async function processAndAddImage(container, images, type, data) {
  document.body.appendChild(container)
  
  // MathJax 렌더링 처리
  if (window.MathJax) {
    container.classList.add('mathjax-content')
    container.setAttribute('data-mathjax-pending', 'true')
    
    try {
      await window.MathJax.typesetPromise([container])
    } catch (error) {
      console.warn('MathJax 렌더링 실패:', error)
    }
  }
  
  // 렌더링 완료 대기
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 이미지로 변환
  try {
    const imageData = await elementToImage(container)
    images.push({
      ...imageData,
      type: type, // 'passage' or 'question'
      data: data
    })
  } catch (error) {
    console.error('이미지 변환 실패:', error)
  }
  
  // 임시 컨테이너 제거
  document.body.removeChild(container)
}

/**
 * 문제 그룹을 개별 이미지로 변환 (지문과 문제 분리 처리)
 */
export async function convertGroupsToImages(groups, layoutMode = 'single', onProgress) {
  const images = []
  const columnWidth = layoutMode === 'double' ? 350 : 700 // 2컬럼일 때는 절반 너비
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: groups.length,
        message: `그룹 ${i + 1}/${groups.length} 이미지 변환 중...`
      })
    }
    
    // 지문과 문제를 분리 처리
    if (group.type === 'passage-with-questions') {
      // 1. 지문을 별도 이미지로
      if (group.passageHtml) {
        const passageContainer = document.createElement('div')
        passageContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: ${columnWidth}px;
          padding: 15px;
          background: white;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 13px;
          line-height: 1.8;
        `
        
        passageContainer.innerHTML = `
          <div class="passage-group">
            <div style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-weight: 600; font-size: 13px;">
              [${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.
            </div>
            <div style="padding: 12px; background: #f8fafc; border: 1px solid #e0e6ed; border-radius: 6px; font-size: 13px;">
              ${group.passageHtml}
            </div>
          </div>
        `
        
        await processAndAddImage(passageContainer, images, 'passage', group)
      }
      
      // 2. 각 문제를 개별 이미지로
      for (const question of group.questions) {
        const questionContainer = document.createElement('div')
        questionContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: ${columnWidth}px;
          padding: 10px;
          background: white;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 13px;
          line-height: 1.7;
        `
        
        questionContainer.innerHTML = renderQuestionHTML(question)
        
        await processAndAddImage(questionContainer, images, 'question', question)
      }
      
    } else if (group.type === 'standalone-question') {
      // 독립 문제들도 각각 개별 이미지로
      for (const question of group.questions) {
        const questionContainer = document.createElement('div')
        questionContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: ${columnWidth}px;
          padding: 10px;
          background: white;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 13px;
          line-height: 1.7;
        `
        
        questionContainer.innerHTML = renderQuestionHTML(question)
        
        await processAndAddImage(questionContainer, images, 'question', question)
      }
    }
  }
  
  return images
}

/**
 * 개별 문제 HTML 생성
 */
function renderQuestionHTML(question) {
  return `
    <div style="margin-bottom: 25px; page-break-inside: avoid;">
      <div style="margin-bottom: 10px;">
        <span style="font-weight: 600; color: #2563eb; font-size: 16px;">
          ${question.displayNumber || ''}.
        </span>
        <span style="color: #606f7b; font-size: 14px; margin-left: 8px;">
          (${question.points || 5}점)
        </span>
      </div>
      <div style="margin-bottom: 15px; line-height: 1.8;">
        ${question.questionHtml || question.questionText || ''}
      </div>
      ${question.choices && question.choices.length > 0 ? `
        <div style="padding-left: 20px;">
          ${question.choices.map((choice, idx) => {
            const num = ['①', '②', '③', '④', '⑤'][idx] || `${idx + 1}.`
            return `
              <div style="margin-bottom: 8px;">
                <span style="margin-right: 10px;">${num}</span>
                <span>${choice}</span>
              </div>
            `
          }).join('')}
        </div>
      ` : ''}
    </div>
  `
}

/**
 * 이미지들을 PDF 페이지에 배치 (2컬럼 지원)
 */
export async function createPDFFromImages(images, options = {}) {
  const {
    filename = 'exam.pdf',
    examTitle = '시험지',
    subject = '',
    duration = '',
    totalScore = '',
    layoutMode = 'single',
    onProgress = null
  } = options
  
  // PDF 생성
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  })
  
  // A4 크기 상수 (mm)
  const PAGE_WIDTH = 210
  const PAGE_HEIGHT = 297
  const MARGIN = 15
  const COLUMN_GAP = 10 // 컬럼 간격
  const HEADER_HEIGHT = 30 // 첫 페이지 헤더
  const FOOTER_HEIGHT = 10 // 페이지 번호
  
  // 레이아웃에 따른 컬럼 설정
  const isDoubleColumn = layoutMode === 'double'
  const COLUMN_WIDTH = isDoubleColumn 
    ? (PAGE_WIDTH - (MARGIN * 2) - COLUMN_GAP) / 2 
    : PAGE_WIDTH - (MARGIN * 2)
  const CONTENT_HEIGHT = PAGE_HEIGHT - (MARGIN * 2)
  
  let currentPage = 1
  let currentColumn = 1 // 현재 컬럼 (1 or 2)
  let currentY = MARGIN
  let isFirstPage = true
  
  // 첫 페이지 헤더 추가
  if (isFirstPage) {
    pdf.setFontSize(18)
    pdf.text(examTitle, PAGE_WIDTH / 2, MARGIN + 10, { align: 'center' })
    
    if (subject || duration || totalScore) {
      pdf.setFontSize(12)
      const infoText = [subject, duration && `${duration}분`, totalScore && `${totalScore}점`]
        .filter(Boolean)
        .join(' | ')
      pdf.text(infoText, PAGE_WIDTH / 2, MARGIN + 20, { align: 'center' })
    }
    
    currentY = MARGIN + HEADER_HEIGHT
  }
  
  // 각 이미지를 PDF에 추가
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: images.length,
        message: `PDF 페이지 생성 중... (${i + 1}/${images.length})`
      })
    }
    
    // 이미지 크기 계산 (mm 단위로 변환)
    const imageWidthMM = (image.width / 3) * 0.264583 // 픽셀을 mm로 변환 (scale 3 고려)
    const imageHeightMM = (image.height / 3) * 0.264583
    
    // 컬럼 너비에 맞춰 크기 조정
    const ratio = Math.min(COLUMN_WIDTH / imageWidthMM, 1)
    const finalWidth = imageWidthMM * ratio
    const finalHeight = imageHeightMM * ratio
    
    // 현재 컬럼에서 사용 가능한 높이
    const availableHeight = isFirstPage 
      ? CONTENT_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT
      : CONTENT_HEIGHT - FOOTER_HEIGHT
    
    // 문제가 현재 컬럼/페이지에 들어가지 않는 경우
    if (image.type === 'question' && currentY + finalHeight > MARGIN + availableHeight) {
      if (isDoubleColumn && currentColumn === 1) {
        // 2컬럼 모드에서 첫 번째 컬럼인 경우 -> 두 번째 컬럼으로 이동
        currentColumn = 2
        currentY = isFirstPage ? MARGIN + HEADER_HEIGHT : MARGIN
      } else {
        // 새 페이지로 이동
        pdf.addPage()
        currentPage++
        currentColumn = 1
        currentY = MARGIN
        isFirstPage = false
      }
    }
    
    // 지문은 잘려도 상관없으므로 그대로 배치
    // 문제는 위에서 이미 처리했으므로 그대로 진행
    
    // X 위치 계산 (컬럼에 따라)
    let xPos
    if (isDoubleColumn) {
      if (currentColumn === 1) {
        xPos = MARGIN
      } else {
        xPos = MARGIN + COLUMN_WIDTH + COLUMN_GAP
      }
    } else {
      xPos = (PAGE_WIDTH - finalWidth) / 2 // 1컬럼일 때는 중앙 정렬
    }
    
    // 이미지 추가
    pdf.addImage(image.dataUrl, 'PNG', xPos, currentY, finalWidth, finalHeight)
    
    // 다음 이미지 위치 계산
    currentY += finalHeight + 3 // 3mm 간격
    
    // 2컬럼 모드에서 컬럼이 꽉 찬 경우
    if (isDoubleColumn && currentY + 50 > MARGIN + availableHeight) { // 50mm는 최소 여유 공간
      if (currentColumn === 1) {
        // 두 번째 컬럼으로 이동
        currentColumn = 2
        currentY = isFirstPage ? MARGIN + HEADER_HEIGHT : MARGIN
      } else {
        // 새 페이지로 이동
        pdf.addPage()
        currentPage++
        currentColumn = 1
        currentY = MARGIN
        isFirstPage = false
      }
    }
  }
  
  // 페이지 번호 추가
  const totalPages = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(10)
    pdf.text(
      `- ${i} -`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - MARGIN + 5,
      { align: 'center' }
    )
  }
  
  if (onProgress) {
    onProgress({
      current: images.length,
      total: images.length,
      message: 'PDF 생성 완료!'
    })
  }
  
  return pdf
}

/**
 * 전체 프로세스 헬퍼 함수
 */
export async function generateImageBasedPDF(groups, options = {}) {
  const { onProgress, layoutMode = 'single', ...pdfOptions } = options
  
  // 1. 그룹들을 이미지로 변환 (layoutMode 전달)
  const images = await convertGroupsToImages(groups, layoutMode, onProgress)
  
  // 2. 이미지들을 PDF로 조합
  const pdf = await createPDFFromImages(images, {
    ...pdfOptions,
    layoutMode,
    onProgress
  })
  
  // 3. PDF 저장 또는 반환
  if (options.returnBlob) {
    return pdf.output('blob')
  } else if (options.save !== false) {
    pdf.save(options.filename || 'exam.pdf')
  }
  
  return pdf
}