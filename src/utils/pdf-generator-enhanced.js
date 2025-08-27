/**
 * Enhanced PDF Generator with MathJax support and proper page breaks
 * 
 * Features:
 * - MathJax rendering before PDF generation
 * - Smart page break handling for questions
 * - Optimized font sizes for PDF
 * - Prevention of question splitting across pages
 */

import html2pdf from 'html2pdf.js'
import { renderMathJaxParallelHybrid } from './mathjax-hybrid'

/**
 * Enhanced PDF options with proper page break handling
 */
export const getEnhancedPDFOptions = (filename = 'exam.pdf') => ({
  margin: [10, 10, 15, 10], // top, right, bottom, left in mm (상단 여백 줄임)
  filename: filename,
  image: { 
    type: 'jpeg', 
    quality: 0.98  // 품질 향상
  },
  html2canvas: {
    scale: 2,
    useCORS: true,
    letterRendering: true,
    logging: false,
    windowHeight: 1122, // A4 높이에 맞춤
    windowWidth: 794,  // A4 너비에 맞춤
    // 한글 폰트 최적화
    font: {
      size: 11  // 기본 폰트 크기 설정
    }
  },
  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  },
  pagebreak: {
    mode: ['css', 'legacy', 'avoid-all'],
    before: ['.page-break-before', '.pdf-page'],
    after: ['.page-break-after'],
    avoid: ['.question-item', '.passage-group', '.passage-section', '.choices']
  }
})

/**
 * MathJax 렌더링 대기
 */
const waitForMathJax = () => {
  return new Promise((resolve) => {
    if (window.MathJax?.startup?.document) {
      resolve()
    } else {
      const checkInterval = setInterval(() => {
        if (window.MathJax?.startup?.document) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
      
      // 최대 10초 대기
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 10000)
    }
  })
}

/**
 * PDF 생성 전 콘텐츠 준비
 * - MathJax 렌더링
 * - 페이지 브레이크 마커 추가
 * - 폰트 크기 최적화
 */
export const preparePDFContent = async (element) => {
  // 1. MathJax 렌더링
  await waitForMathJax()
  
  // MathJax 콘텐츠 찾기
  const mathElements = element.querySelectorAll('.question-text, .passage-content, .choice-text')
  
  if (mathElements.length > 0) {
    console.log(`PDF: ${mathElements.length}개 수식 요소 렌더링 시작`)
    
    // 병렬 렌더링
    await renderMathJaxParallelHybrid(mathElements, {
      hideBeforeRender: false,
      clearFirst: false
    })
    
    console.log('PDF: MathJax 렌더링 완료')
  }
  
  // 2. 페이지 브레이크 최적화
  optimizePageBreaks(element)
  
  // 3. 폰트 크기 조정
  optimizeFontSizes(element)
  
  return element
}

/**
 * 페이지 브레이크 최적화
 * 문제가 페이지를 넘어가지 않도록 조정
 */
const optimizePageBreaks = (element) => {
  // A4 실제 높이 계산 (더 보수적으로)
  const MM_TO_PX = 3.78
  const A4_HEIGHT_MM = 297
  const MARGIN_TOP_MM = 10
  const MARGIN_BOTTOM_MM = 15
  const USABLE_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM
  const PAGE_HEIGHT = USABLE_HEIGHT_MM * MM_TO_PX // 사용 가능한 높이
  
  // 현재 페이지 높이 추적
  let currentPageHeight = 0
  let isFirstPage = true
  
  // 모든 콘텐츠 요소 선택
  const allElements = element.querySelectorAll('.question-item, .passage-group, .page-header')
  
  allElements.forEach((block, index) => {
    const blockHeight = block.offsetHeight || 100 // 기본값 설정
    
    // 첫 페이지는 헤더 공간 고려
    const availableHeight = isFirstPage && block.classList.contains('page-header') 
      ? PAGE_HEIGHT - 100 
      : PAGE_HEIGHT
    
    // 현재 블록이 페이지를 넘어가는지 확인
    if (currentPageHeight + blockHeight > availableHeight * 0.85) { // 85%에서 페이지 넘김
      // 새 페이지로 시작
      block.classList.add('page-break-before')
      currentPageHeight = blockHeight
      isFirstPage = false
    } else {
      currentPageHeight += blockHeight
    }
    
    // CSS로 문제 분할 방지
    block.style.pageBreakInside = 'avoid'
    block.style.breakInside = 'avoid'
    block.style.webkitColumnBreakInside = 'avoid'
    
    // 지문 그룹 특별 처리
    if (block.classList.contains('passage-group')) {
      block.style.keepTogether = 'always'
      block.style.orphans = '3'
      block.style.widows = '3'
    }
  })
  
  // 선택지가 문제와 분리되지 않도록
  const choices = element.querySelectorAll('.choices')
  choices.forEach(choice => {
    choice.style.pageBreakInside = 'avoid'
    choice.style.breakInside = 'avoid'
    choice.style.pageBreakBefore = 'avoid'
  })
}

/**
 * PDF용 폰트 크기 최적화
 */
const optimizeFontSizes = (element) => {
  // 제목
  const titles = element.querySelectorAll('.exam-title')
  titles.forEach(title => {
    title.style.fontSize = '18pt'
    title.style.fontWeight = 'bold'
  })
  
  // 문제 번호
  const questionNumbers = element.querySelectorAll('.question-number')
  questionNumbers.forEach(num => {
    num.style.fontSize = '12pt'
    num.style.fontWeight = 'bold'
  })
  
  // 문제 텍스트
  const questionTexts = element.querySelectorAll('.question-text')
  questionTexts.forEach(text => {
    text.style.fontSize = '11pt'
    text.style.lineHeight = '1.6'
  })
  
  // 선택지
  const choices = element.querySelectorAll('.choice-text')
  choices.forEach(choice => {
    choice.style.fontSize = '11pt'
    choice.style.lineHeight = '1.5'
  })
  
  // 지문
  const passages = element.querySelectorAll('.passage-content')
  passages.forEach(passage => {
    passage.style.fontSize = '10.5pt'
    passage.style.lineHeight = '1.7'
    passage.style.textAlign = 'justify'
  })
  
  // MathJax 수식 크기 조정
  const mathContainers = element.querySelectorAll('mjx-container')
  mathContainers.forEach(container => {
    container.style.fontSize = '11pt'
    // 인라인 수식
    if (container.getAttribute('display') === 'false') {
      container.style.fontSize = '10.5pt'
    }
    // 블록 수식
    else {
      container.style.fontSize = '11pt'
      container.style.margin = '10px 0'
    }
  })
}

/**
 * 향상된 PDF 생성 함수
 */
export const generateEnhancedPDF = async (element, options = {}) => {
  try {
    // 기본 옵션과 사용자 옵션 병합
    const pdfOptions = {
      ...getEnhancedPDFOptions(options.filename),
      ...options
    }
    
    // PDF 콘텐츠 준비 (MathJax 렌더링 포함)
    const preparedElement = await preparePDFContent(element)
    
    // 추가 CSS 스타일 적용
    applyPDFStyles(preparedElement)
    
    // PDF 생성
    console.log('PDF 생성 시작...')
    await html2pdf()
      .set(pdfOptions)
      .from(preparedElement)
      .save()
    
    console.log('PDF 생성 완료')
    
    return true
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    throw error
  }
}

/**
 * 향상된 PDF Blob 생성 함수
 */
export const generateEnhancedPDFAsBlob = async (element, options = {}) => {
  try {
    // 기본 옵션과 사용자 옵션 병합
    const pdfOptions = {
      ...getEnhancedPDFOptions(options.filename),
      ...options
    }
    
    // PDF 콘텐츠 준비 (MathJax 렌더링 포함)
    const preparedElement = await preparePDFContent(element)
    
    // 추가 CSS 스타일 적용
    applyPDFStyles(preparedElement)
    
    // PDF Blob 생성
    console.log('PDF Blob 생성 시작...')
    const pdfBlob = await html2pdf()
      .set(pdfOptions)
      .from(preparedElement)
      .outputPdf('blob')
    
    console.log('PDF Blob 생성 완료', pdfBlob)
    
    return pdfBlob
  } catch (error) {
    console.error('PDF Blob 생성 오류:', error)
    throw error
  }
}

/**
 * PDF 전용 스타일 적용
 */
const applyPDFStyles = (element) => {
  // 임시 스타일 태그 추가
  const style = document.createElement('style')
  style.textContent = `
    @media print {
      /* 페이지 설정 */
      @page {
        size: A4;
        margin: 15mm 10mm;
      }
      
      /* 문제 블록이 페이지를 넘어가지 않도록 */
      .question-item,
      .passage-group {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* 지문과 관련 문제 함께 유지 */
      .passage-section + .question-item {
        page-break-before: avoid !important;
      }
      
      /* 페이지 브레이크 클래스 */
      .page-break-before {
        page-break-before: always !important;
      }
      
      .page-break-after {
        page-break-after: always !important;
      }
      
      /* 여백 조정 */
      .question-item {
        margin-bottom: 20px;
        padding-bottom: 10px;
      }
      
      /* 선택지 들여쓰기 */
      .choices {
        margin-left: 20px;
        margin-top: 10px;
      }
      
      .choice {
        margin-bottom: 8px;
      }
      
      /* 폰트 최적화 */
      body {
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
      }
      
      /* MathJax 수식 스타일 */
      mjx-container {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      mjx-container[display="true"] {
        margin: 15px 0;
      }
      
      /* 숨김 요소 */
      .no-print {
        display: none !important;
      }
    }
  `
  
  element.appendChild(style)
  
  // PDF 생성 후 스타일 제거를 위한 클린업 함수 반환
  return () => {
    style.remove()
  }
}

export default {
  getEnhancedPDFOptions,
  preparePDFContent,
  generateEnhancedPDF
}