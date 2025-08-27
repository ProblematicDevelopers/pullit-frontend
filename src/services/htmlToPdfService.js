/**
 * HTML을 PDF로 변환하는 서비스
 * html2canvas와 jsPDF를 사용하여 실제 화면을 PDF로 변환
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * HTML 요소를 PDF로 변환
 * @param {HTMLElement} element - 변환할 HTML 요소
 * @param {String} filename - 다운로드 파일명
 * @returns {Promise<Object>} 변환 결과
 */
export const convertHtmlToPdf = async (element, filename = 'report.pdf') => {
  try {
    // Vue 컴포넌트들이 완전히 렌더링될 때까지 기다리기
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 1초 대기

    // 차트나 동적 콘텐츠가 있는지 확인하고 추가 대기
    const charts = element.querySelectorAll('canvas')
    if (charts.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000)) // 차트가 있으면 추가 2초 대기
    }

    // HTML을 캔버스로 변환
    const canvas = await html2canvas(element, {
      scale: 2, // 고해상도
      useCORS: true, // 외부 이미지 허용
      allowTaint: true, // 외부 리소스 허용
      backgroundColor: '#ffffff', // 배경색
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      logging: false, // 로그 비활성화
      onclone: (clonedDoc) => {
        // 복제된 문서에서 차트나 동적 콘텐츠가 제대로 렌더링되었는지 확인
        const clonedElement = clonedDoc.querySelector(element.tagName.toLowerCase())
        if (clonedElement) {
          // 스타일 복사
          const computedStyle = window.getComputedStyle(element)
          clonedElement.style.width = computedStyle.width
          clonedElement.style.height = computedStyle.height
          clonedElement.style.backgroundColor = '#ffffff'
        }
      },
    })

    // 캔버스를 이미지로 변환
    const imgData = canvas.toDataURL('image/png')

    // 원본 HTML 크기를 픽셀 단위로 계산 (1mm = 약 3.78px)
    const mmToPx = 3.78
    const originalWidth = canvas.width / mmToPx
    const originalHeight = canvas.height / mmToPx

    // 여백 설정 (mm 단위)
    const margin = 10 // 최소 여백

    // PDF 크기를 원본 HTML 크기에 맞춤
    const pdfWidth = originalWidth + margin * 2
    const pdfHeight = originalHeight + margin * 2

    // PDF 생성 (원본 크기에 맞춤)
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    })

    // 원본 크기 그대로 이미지 추가 (중앙 정렬)
    const x = margin
    const y = margin
    const imageWidth = originalWidth
    const imageHeight = originalHeight

    pdf.addImage(imgData, 'PNG', x, y, imageWidth, imageHeight)

    // PDF 다운로드
    pdf.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error('HTML을 PDF로 변환 실패:', error)
    throw error
  }
}

/**
 * 상세리포트 전체 페이지를 PDF로 변환
 * @param {String} filename - 다운로드 파일명
 * @returns {Promise<Object>} 변환 결과
 */
export const convertDetailReportToPdf = async (filename = null) => {
  try {
    // 파일명이 없으면 자동 생성
    if (!filename) {
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD

      // 시험지 이름과 사용자 이름 가져오기
      let examName = '시험지'
      let userName = '사용자'

      try {
        // 시험지 이름 찾기 (여러 가능한 소스에서)
        const examTitleElement = document.querySelector('.exam-title, .exam-name, h2, h3')
        if (examTitleElement) {
          examName = examTitleElement.textContent.trim().replace(/[^\w\s가-힣]/g, '_')
        }

        // 로그인한 사용자 정보 가져오기 (localStorage에서)
        const userInfo = localStorage.getItem('userInfo')

        if (userInfo) {
          try {
            const user = JSON.parse(userInfo)

            if (user.fullName) {
              userName = user.fullName.replace(/[^\w\s가-힣]/g, '_')
            } else if (user.name) {
              userName = user.name.replace(/[^\w\s가-힣]/g, '_')
            } else if (user.username) {
              userName = user.username.replace(/[^\w\s가-힣]/g, '_')
            }
          } catch (parseError) {
            console.warn('사용자 정보 파싱 오류:', parseError)
          }
        }

        // DOM에서 사용자 이름 찾기 (백업)
        if (userName === '사용자') {
          const userNameElement = document.querySelector('.user-name, .student-name, .display-name')
          if (userNameElement) {
            userName = userNameElement.textContent.trim().replace(/[^\w\s가-힣]/g, '_')
          }
        }
      } catch (error) {
        console.warn('파일명 생성 중 오류:', error)
      }

      // 파일명 생성: 시험지이름_사용자이름_날짜.pdf
      filename = `${examName}_${userName}_${dateStr}.pdf`
    }

    // 상세리포트 컨테이너 찾기 (탭 버튼만 제외)
    let reportContainer = document.querySelector('[data-report-container]')

    // data-report-container가 있으면 상세리포트의 모든 내용을 포함하도록 처리
    if (reportContainer) {
      // Vue 컴포넌트들이 완전히 렌더링될 때까지 기다리기
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // 차트가 완전히 렌더링될 때까지 기다리기
      const charts = document.querySelectorAll('canvas')
      if (charts.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // 차트가 실제로 그려졌는지 확인
        for (let i = 0; i < 15; i++) {
          const canvas = charts[0]
          if (canvas && canvas.getContext) {
            try {
              const ctx = canvas.getContext('2d')
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const hasContent = imageData.data.some((pixel) => pixel !== 0)
              if (hasContent) {
                break
              }
            } catch {
              // 차트 렌더링 확인 중 오류 무시
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        // 추가 대기 (차트가 완전히 안정화될 때까지)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // 상세리포트의 모든 내용을 포함하는 임시 컨테이너 생성
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '100%'
      tempContainer.style.backgroundColor = '#ffffff'

      // data-report-container 내용 복사
      tempContainer.appendChild(reportContainer.cloneNode(true))

      // statistics-section들도 추가 (차트, 통계 등)
      const statisticsSections = document.querySelectorAll('.statistics-section')
      statisticsSections.forEach((section) => {
        const clonedSection = section.cloneNode(true)

        // 차트가 있는 경우 원본 canvas에서 이미지 추출
        const originalCanvas = section.querySelector('canvas')
        const clonedCanvas = clonedSection.querySelector('canvas')

        if (originalCanvas && clonedCanvas) {
          try {
            // 원본 canvas에서 이미지 데이터 추출
            const chartImage = originalCanvas.toDataURL('image/png', 1.0)

            // 이미지가 제대로 생성되었는지 확인
            if (chartImage && chartImage !== 'data:,' && chartImage.length > 100) {
              const img = document.createElement('img')
              img.src = chartImage
              img.style.width = '900px'
              img.style.height = '440px'
              img.style.display = 'block'
              img.style.margin = '20px auto'
              img.style.objectFit = 'contain'

              // canvas를 img로 교체 (안전한 교체)
              if (clonedCanvas.parentNode) {
                clonedCanvas.parentNode.replaceChild(img, clonedCanvas)
              }
            }
          } catch (error) {
            console.error('차트 이미지 변환 실패:', error)
          }
        }

        tempContainer.appendChild(clonedSection)
      })

      document.body.appendChild(tempContainer)
      reportContainer = tempContainer

      // 임시 컨테이너가 DOM에 추가된 후 추가 대기 (컴포넌트 렌더링을 위해)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } else {
      // data-report-container가 없으면 탭 버튼만 숨기고 나머지는 그대로 캡처
      const reportWrap = document.querySelector('.report-wrap')
      if (reportWrap) {
        // 탭 버튼들을 임시로 숨기기 (visibility 사용으로 레이아웃 유지)
        const tabButtons = reportWrap.querySelectorAll('.tabs, .tab-btn')
        const originalVisibility = []

        tabButtons.forEach((tab, index) => {
          originalVisibility[index] = tab.style.visibility
          tab.style.visibility = 'hidden'
        })

        // PDF 변환
        const result = await convertHtmlToPdf(reportWrap, filename)

        // 탭 버튼들 복원
        tabButtons.forEach((tab, index) => {
          tab.style.visibility = originalVisibility[index] || ''
        })

        return result
      } else {
        reportContainer = document.body
      }
    }

    // PDF 변환
    const result = await convertHtmlToPdf(reportContainer, filename)

    // 임시 컨테이너 정리
    if (reportContainer && reportContainer.style.position === 'absolute') {
      try {
        if (document.body.contains(reportContainer)) {
          document.body.removeChild(reportContainer)
        }
      } catch (error) {
        console.warn('임시 컨테이너 정리 중 오류:', error)
      }
    }

    return result
  } catch (error) {
    console.error('상세리포트 PDF 변환 실패:', error)
    throw error
  }
}

/**
 * 특정 섹션만 PDF로 변환
 * @param {String} selector - CSS 선택자
 * @param {String} filename - 다운로드 파일명
 * @returns {Promise<Object>} 변환 결과
 */
export const convertSectionToPdf = async (selector, filename = 'section.pdf') => {
  try {
    const element = document.querySelector(selector)
    if (!element) {
      throw new Error(`요소를 찾을 수 없습니다: ${selector}`)
    }

    return await convertHtmlToPdf(element, filename)
  } catch (error) {
    console.error('섹션 PDF 변환 실패:', error)
    throw error
  }
}

// 기본 export
export default {
  convertHtmlToPdf,
  convertDetailReportToPdf,
  convertSectionToPdf,
}
