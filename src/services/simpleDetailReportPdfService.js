/**
 * 간단한 상세리포트 PDF 생성 서비스
 * jsPDF를 사용한 상세리포트 PDF 생성 로직
 */

import jsPDF from 'jspdf'

/**
 * 상세리포트 PDF 생성 메인 함수
 * @param {Object} reportData - 리포트 데이터
 * @returns {Promise<Blob>} PDF Blob 객체
 */
export const generateSimpleDetailReportPDF = async (reportData) => {
  try {
    // PDF 생성
    const pdf = new jsPDF()

    // 한글 폰트 설정
    pdf.setFont('helvetica')

    let yPosition = 20
    const lineHeight = 7
    const margin = 20

    // 제목
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Detail Report', 105, yPosition, { align: 'center' })
    yPosition += lineHeight * 2

    // 시험 정보
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${reportData.examTitle} - ${reportData.studentName}`, 105, yPosition, {
      align: 'center',
    })
    yPosition += lineHeight * 1.5

    // 생성일
    pdf.setFontSize(12)
    pdf.text(`Generated: ${reportData.currentDate}`, 105, yPosition, { align: 'center' })
    yPosition += lineHeight * 2

    // 기본 정보
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Basic Information', margin, yPosition)
    yPosition += lineHeight * 1.5

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      `Total Score: ${reportData.totalScore} / ${reportData.totalPoints} (Accuracy: ${reportData.accuracy}%)`,
      margin,
      yPosition,
    )
    yPosition += lineHeight

    pdf.text(`Duration: ${reportData.totalDuration} minutes`, margin, yPosition)
    yPosition += lineHeight * 2

    // 정오표
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Answer Sheet', margin, yPosition)
    yPosition += lineHeight * 1.5

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    if (reportData.errataData && reportData.errataData.length > 0) {
      reportData.errataData.forEach((item) => {
        // HTML 태그 제거 함수
        const stripHtml = (html) => {
          if (!html) return ''
          try {
            const tmp = document.createElement('div')
            tmp.innerHTML = html
            return tmp.textContent || tmp.innerText || ''
          } catch (error) {
            console.warn('HTML 태그 제거 중 오류:', error)
            return String(html).replace(/<[^>]*>/g, '')
          }
        }

        const text = `${item.itemOrder || '-'}. ${item.domainName || '-'} | Points: ${item.points || '-'} | Answer: ${stripHtml(item.answer) || '-'} | User Answer: ${stripHtml(item.userAnswer) || '-'} | Score: ${item.userPoints || '-'} | ${item.isCorrect ? 'Correct' : 'Incorrect'} | Avg Accuracy: ${Math.round((item.accuracy || 0) * 10000) / 100}%`

        // 긴 텍스트를 여러 줄로 나누기
        const lines = pdf.splitTextToSize(text, 170)

        if (yPosition + lines.length * lineHeight > 280) {
          pdf.addPage()
          yPosition = 20
        }

        lines.forEach((line) => {
          pdf.text(line, margin, yPosition)
          yPosition += lineHeight
        })
        yPosition += 2
      })
    } else {
      pdf.text('No answer sheet data available.', margin, yPosition)
      yPosition += lineHeight
    }

    yPosition += lineHeight

    // 난이도별 통계
    if (reportData.difficultyData && reportData.difficultyData.length > 0) {
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Difficulty Statistics', margin, yPosition)
      yPosition += lineHeight * 1.5

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      reportData.difficultyData.forEach((item) => {
        const difficultyName = getDifficultyName(item.difficultyCode)
        const text = `${difficultyName} | Total Items: ${item.itemCount || '-'} | Correct Items: ${item.userCount || '-'} | Avg Correct: ${Math.round((item.avgCount || 0) * 10) / 10} | Total Points: ${item.totalPoints || '-'} | Score: ${Math.round((item.userPoints || 0) * 100) / 100} | Avg Score: ${Math.round((item.avgPoints || 0) * 100) / 100} | Duration: ${Math.round((item.userDuration || 0) * 100) / 100}s | Avg Duration: ${Math.round((item.avgDuration || 0) * 100) / 100}s`

        const lines = pdf.splitTextToSize(text, 170)

        if (yPosition + lines.length * lineHeight > 280) {
          pdf.addPage()
          yPosition = 20
        }

        lines.forEach((line) => {
          pdf.text(line, margin, yPosition)
          yPosition += lineHeight
        })
        yPosition += 2
      })
    }

    // 평가영역별 통계
    if (reportData.evaluationData && reportData.evaluationData.length > 0) {
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Evaluation Area Statistics', margin, yPosition)
      yPosition += lineHeight * 1.5

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      reportData.evaluationData.forEach((item) => {
        const text = `${item.domainName || '-'} | Total Items: ${item.totalCount || '-'} | Correct Items: ${item.userCount || '-'} | Avg Correct: ${Math.round((item.avgCount || 0) * 10) / 10} | Total Points: ${item.totalPoints || '-'} | Score: ${Math.round((item.userPoints || 0) * 100) / 100} | Avg Score: ${Math.round((item.avgPoints || 0) * 100) / 100} | Duration: ${Math.round((item.userDuration || 0) * 100) / 100}s | Avg Duration: ${Math.round((item.avgDuration || 0) * 100) / 100}s`

        const lines = pdf.splitTextToSize(text, 170)

        if (yPosition + lines.length * lineHeight > 280) {
          pdf.addPage()
          yPosition = 20
        }

        lines.forEach((line) => {
          pdf.text(line, margin, yPosition)
          yPosition += lineHeight
        })
        yPosition += 2
      })
    }

    // Blob 변환
    const pdfBlob = pdf.output('blob')

    return pdfBlob
  } catch (error) {
    console.error('간단한 상세리포트 PDF 생성 실패:', error)
    throw new Error(`간단한 상세리포트 PDF 생성 중 오류 발생: ${error.message}`)
  }
}

/**
 * 난이도 코드를 한글 이름으로 변환
 * @param {string} code - 난이도 코드
 * @returns {string} 난이도 한글 이름
 */
const getDifficultyName = (code) => {
  const difficultyMap = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Very Hard',
  }
  return difficultyMap[code] || 'Unknown'
}

/**
 * 간단한 상세리포트 PDF 생성 및 다운로드 (통합 함수)
 * @param {Object} reportData - 리포트 데이터
 * @param {String} filename - 다운로드 파일명
 */
export const generateAndDownloadSimpleDetailReport = async (reportData, filename = null) => {
  try {
    // 파일명이 없으면 자동 생성
    if (!filename) {
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-') // HH-MM-SS
      filename = `상세리포트_${dateStr}_${timeStr}.pdf`
    }

    // PDF 생성
    const pdfBlob = await generateSimpleDetailReportPDF(reportData)

    // 다운로드
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // 정리
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)

    return { success: true, filename }
  } catch (error) {
    console.error('간단한 상세리포트 PDF 생성 및 다운로드 실패:', error)
    throw error
  }
}

// 기본 export
export default {
  generateSimpleDetailReportPDF,
  generateAndDownloadSimpleDetailReport,
}
