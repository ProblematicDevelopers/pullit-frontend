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
    console.log('PDF 변환 시작')

    // Vue 컴포넌트들이 완전히 렌더링될 때까지 대기
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 차트가 있는지 확인하고 추가 대기
    const charts = element.querySelectorAll('canvas')
    if (charts.length > 0) {
      console.log(`차트 ${charts.length}개 발견, 추가 렌더링 대기`)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    // HTML을 캔버스로 변환
    // 폰트가 모두 로드될 때까지 대기 (웹폰트 줄바꿈/깨짐 방지)
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }
    } catch (err) {
      console.debug('fonts.ready 대기 중 예외(무시 가능):', err)
    }

    // 이미지 선로딩 (CORS 및 지연 로딩으로 인한 빈칸 방지)
    try {
      const imgs = Array.from(element.querySelectorAll('img'))
      const loadImage = (img) => new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) return resolve()
        const onDone = () => {
          img.removeEventListener('load', onDone)
          img.removeEventListener('error', onDone)
          resolve()
        }
        img.addEventListener('load', onDone, { once: true })
        img.addEventListener('error', onDone, { once: true })
      })
      await Promise.race([
        Promise.all(imgs.map(loadImage)),
        new Promise((r) => setTimeout(r, 5000)),
      ])
    } catch (err) {
      console.debug('이미지 선로딩 중 예외(무시 가능):', err)
    }

    const canvas = await html2canvas(element, {
      scale: 2.0,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        console.log('PDF용 문서 복제 시작')

        // 메인 컨테이너 설정
        const clonedElement = clonedDoc.querySelector(element.tagName.toLowerCase())
        if (clonedElement) {
          clonedElement.style.width = '1600px'
          clonedElement.style.maxWidth = '1600px'
          clonedElement.style.minWidth = '1600px'
          clonedElement.style.backgroundColor = '#ffffff'
          clonedElement.style.boxSizing = 'border-box'
          clonedElement.style.margin = '0 auto'
          clonedElement.style.textAlign = 'center'
          clonedElement.style.display = 'flex'
          clonedElement.style.flexDirection = 'column'
          clonedElement.style.alignItems = 'center'
        }

                          // PDF에서 숨길 요소들 제거
         const hideElements = clonedDoc.querySelectorAll('.hide-in-pdf')
         hideElements.forEach(el => el.style.display = 'none')

         // PDF에서 탭 버튼만 숨기기 (기본리포트, 상세리포트 버튼)
         const tabButtons = clonedDoc.querySelectorAll('.tab-btn')
         tabButtons.forEach(btn => btn.style.display = 'none')

                 // 차트 컨테이너 설정
         const chartContainers = clonedDoc.querySelectorAll('.chart-container, .statistics-section')
         chartContainers.forEach(container => {
           container.style.margin = '20px auto'
           container.style.padding = '30px'
           container.style.boxSizing = 'border-box'
           container.style.overflow = 'visible'
           container.style.width = '100%'
           container.style.maxWidth = '2400px'
           container.style.border = 'none'
           container.style.outline = 'none'
           container.style.textAlign = 'center'
           container.style.display = 'block'
           container.style.position = 'relative'
           container.style.clear = 'both'

           // 컨테이너 내부 요소들도 가운데 정렬
           const containerChildren = container.querySelectorAll('*')
           containerChildren.forEach(child => {
             if (child.style) {
               child.style.textAlign = 'center'
             }
           })
         })

        // 차트 섹션 마진 설정
        const chartSections = clonedDoc.querySelectorAll('.chart-section')
        chartSections.forEach(section => {
          section.style.marginBottom = '40px'
          section.style.paddingBottom = '30px'
        })

                                   // 테이블 설정
         const tables = clonedDoc.querySelectorAll('table')
         tables.forEach(table => {
           table.style.marginTop = '80px'
           table.style.marginBottom = '40px'
           table.style.marginLeft = 'auto'
           table.style.marginRight = 'auto'
           table.style.paddingTop = '20px'
           table.style.width = '100%'
           table.style.maxWidth = '1600px'
           table.style.boxSizing = 'border-box'
           table.style.textAlign = 'center'

            // 테이블 헤더(th) 텍스트 줄바꿈 방지 (헤더는 한 줄 유지)
            const tableHeaders = table.querySelectorAll('th')
            tableHeaders.forEach(th => {
              th.style.whiteSpace = 'nowrap'
              th.style.overflow = 'hidden'
              th.style.textOverflow = 'ellipsis'
              th.style.maxWidth = '150px'
              th.style.textAlign = 'center'
            })

            // 테이블 셀(td)도 가운데 정렬
            const tableCells = table.querySelectorAll('td')
            tableCells.forEach(td => {
              td.style.textAlign = 'center'
            })
         })

                 // 제목 간격 설정 및 가운데 정렬
         const titles = clonedDoc.querySelectorAll('h3, h4, .section-title')
         titles.forEach(title => {
           title.style.marginBottom = '25px'
           title.style.paddingBottom = '10px'
           title.style.textAlign = 'center'
         })

         // 모든 텍스트 요소 가운데 정렬
         const textElements = clonedDoc.querySelectorAll('p, span, div, label')
         textElements.forEach(element => {
           if (element.style && !element.classList.contains('chart-container') && !element.classList.contains('statistics-section')) {
             element.style.textAlign = 'center'
           }
         })

        // 이미지 crossOrigin 설정 (tainted canvas 방지)
        const clonedImages = clonedDoc.querySelectorAll('img')
        clonedImages.forEach((img) => {
          try {
            if (!img.crossOrigin) img.crossOrigin = 'anonymous'
            // 이미 로드된 경우에도 스냅샷 시점을 맞추기 위해 decoding 힌트
            if ('decoding' in img) img.decoding = 'sync'
          } catch (err) {
            console.debug('이미지 crossOrigin/decoding 설정 실패(무시 가능):', err)
          }
        })

        // 차트 재렌더링
        const clonedCharts = clonedDoc.querySelectorAll('canvas')
        if (clonedCharts.length > 0 && window.Chart) {
          console.log(`차트 ${clonedCharts.length}개 재렌더링 시작`)

          const originalCharts = element.querySelectorAll('canvas')
          originalCharts.forEach((originalCanvas, index) => {
            const clonedCanvas = clonedCharts[index]
            if (clonedCanvas && originalCanvas.chart) {
              try {
                // 기존 차트 제거
                if (clonedCanvas.chart) {
                  clonedCanvas.chart.destroy()
                }

                // 문제 수에 따른 동적 크기 계산
                const questionCount = originalCanvas.chart?.data?.labels?.length || 0
                const dynamicWidth = 1600
                const dynamicHeight = Math.max(600, questionCount * 50 + 200)

                // 캔버스 크기 설정
                clonedCanvas.width = dynamicWidth
                clonedCanvas.height = dynamicHeight
                clonedCanvas.style.width = dynamicWidth + 'px'
                clonedCanvas.style.height = dynamicHeight + 'px'

                // 컨테이너 크기 조정
                const container = clonedCanvas.closest('.chart-container, .statistics-section, .chart-section')
                if (container) {
                  container.style.height = dynamicHeight + 'px'
                  container.style.minHeight = dynamicHeight + 'px'
                  container.style.maxHeight = dynamicHeight + 'px'
                }

                // 차트 설정 복사 및 수정
                const chartConfig = JSON.parse(JSON.stringify(originalCanvas.chart.config))
                chartConfig.options.responsive = false
                chartConfig.options.maintainAspectRatio = false
                chartConfig.options.animation = false
                chartConfig.options.width = dynamicWidth
                chartConfig.options.height = dynamicHeight
                chartConfig.options.layout = { padding: { top: 20, right: 20, bottom: 20, left: 20 } }

                                                  // 폰트 크기 동적 조정
                 const fontSize = questionCount <= 20 ? 18 : questionCount <= 50 ? 16 : 14
                 if (chartConfig.options.scales) {
                   if (chartConfig.options.scales.x?.ticks) {
                     chartConfig.options.scales.x.ticks.font = { size: fontSize, weight: '600' }
                   }
                   if (chartConfig.options.scales.y?.ticks) {
                     chartConfig.options.scales.y.ticks.font = { size: fontSize, weight: '600' }
                   }
                 }

                // 새 차트 생성
                const newChart = new window.Chart(clonedCanvas.getContext('2d'), chartConfig)
                clonedCanvas.chart = newChart

                // 차트 크기 강제 적용
                newChart.canvas.width = dynamicWidth
                newChart.canvas.height = dynamicHeight
                newChart.canvas.style.width = dynamicWidth + 'px'
                newChart.canvas.style.height = dynamicHeight + 'px'

                if (newChart.resize) newChart.resize()
                newChart.options.width = dynamicWidth
                newChart.options.height = dynamicHeight

                console.log(`차트 ${index + 1} 설정 완료: ${dynamicWidth}x${dynamicHeight}px (문제 수: ${questionCount}개)`)

                // 차트 업데이트
                setTimeout(() => {
                  newChart.update('none')
                  console.log(`차트 ${index + 1} 업데이트 완료`)
                }, 500)

              } catch (error) {
                console.error(`차트 ${index + 1} 재렌더링 실패:`, error)
              }
            }
          })
        }
      }
    })

    // 모든 차트 렌더링 완료 대기
    console.log('차트 렌더링 완료 대기 중...')
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // 캔버스를 이미지로 변환
    const imgData = canvas.toDataURL('image/png', 1.0)

    // PDF 크기 계산
    const mmToPx = 3.78
    const originalWidth = canvas.width / mmToPx
    const originalHeight = canvas.height / mmToPx
    const margin = 10
    const pdfWidth = originalWidth + margin * 2
    const pdfHeight = originalHeight + margin * 2

    // PDF 생성
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight],
      compress: true,
    })

    // 이미지 추가
    pdf.addImage(imgData, 'PNG', margin, margin, originalWidth, originalHeight)

    // PDF 다운로드
    pdf.save(filename)
    console.log('PDF 변환 완료:', filename)

    return { success: true, filename }

  } catch (error) {
    console.error('PDF 변환 실패:', error)
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
      const dateStr = now.toISOString().slice(0, 10)

      let examName = '시험지'
      let userName = '사용자'

      try {
        // 시험지 이름과 사용자 이름 가져오기
        const examNameElement = document.querySelector('.exam-title, h1, .title')
        if (examNameElement) {
          examName = examNameElement.textContent.trim()
        }

        const userNameElement = document.querySelector('.user-name, .student-name, .name')
        if (userNameElement) {
          userName = userNameElement.textContent.trim()
        }
      } catch (err) {
        console.warn('시험지 이름 또는 사용자 이름을 가져오는데 실패했습니다:', err)
      }

      filename = `[CBT]${examName}_${dateStr}_${userName}_${dateStr}.pdf`
    }

         // 상세리포트 컨테이너 찾기 (DetailReport.vue의 실제 구조에 맞춤)
     console.log('상세리포트 컨테이너 검색 시작...')

     let reportContainer = document.querySelector('[data-report-container], .report-wrap')
     console.log('data-report-container 또는 .report-wrap:', reportContainer)

     if (!reportContainer) {
       // 백업: 다른 가능한 컨테이너들 찾기
       reportContainer = document.querySelector('.detail-report-container, .report-container, .main-content, .report-content')
       console.log('백업 컨테이너 검색 결과:', reportContainer)
     }

     if (!reportContainer) {
       console.warn('상세리포트 컨테이너를 찾을 수 없어 body를 사용합니다.')
       reportContainer = document.body
     }

     console.log('최종 선택된 컨테이너:', reportContainer, '클래스:', reportContainer.className)

    // PDF 변환 실행
    return await convertHtmlToPdf(reportContainer, filename)

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
