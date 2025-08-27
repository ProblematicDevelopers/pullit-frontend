/**
 * 상세리포트 PDF 생성 서비스
 * PDFMe를 사용한 상세리포트 PDF 생성 로직
 */

import { generate } from '@pdfme/generator'
import {
  createDetailReportTemplate,
  generateDetailReportInputData,
} from '@/utils/pdftemplates/detailReportTemplate'
import { getPDFMeFont } from '@/utils/pdfmeFonts'
import { applyFontToTemplate } from '@/utils/pdftemplates/addFont'

/**
 * 상세리포트 PDF 생성 메인 함수
 * @param {Object} reportData - 리포트 데이터
 * @returns {Promise<Blob>} PDF Blob 객체
 */
export const generateDetailReportPDF = async (reportData) => {
  try {
    console.log('상세리포트 PDF 생성 시작:', reportData)

    // 1. 템플릿 생성
    const baseTemplate = createDetailReportTemplate()

    // 2. 템플릿에 폰트 적용
    const template = applyFontToTemplate(baseTemplate, 'NotoSansKR')

    // 3. 한글 폰트 로드
    const font = await getPDFMeFont()

    // 4. 입력 데이터 생성
    const inputs = generateDetailReportInputData(reportData)

    // 5. PDF 생성
    console.log('템플릿:', template)
    console.log('입력 데이터:', inputs)
    console.log('폰트:', font)

    const pdf = await generate({
      template: template,
      inputs: inputs,
      options: {
        font: font,
      },
    })

    // 6. Blob 변환
    const blob = new Blob([pdf.buffer || pdf], {
      type: 'application/pdf',
    })

    console.log('상세리포트 PDF 생성 완료:', blob.size, 'bytes')

    return blob
  } catch (error) {
    console.error('상세리포트 PDF 생성 실패:', error)
    throw new Error(`상세리포트 PDF 생성 중 오류 발생: ${error.message}`)
  }
}

/**
 * 상세리포트 PDF 다운로드 함수
 * @param {Blob} pdfBlob - PDF Blob 객체
 * @param {String} filename - 다운로드 파일명
 */
export const downloadDetailReportPDF = (pdfBlob, filename = '상세리포트.pdf') => {
  try {
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

    console.log('상세리포트 PDF 다운로드 완료:', filename)
  } catch (error) {
    console.error('상세리포트 PDF 다운로드 실패:', error)
    throw error
  }
}

/**
 * 상세리포트 PDF 미리보기 창 열기
 * @param {Blob} pdfBlob - PDF Blob 객체
 */
export const previewDetailReportPDF = (pdfBlob) => {
  try {
    const url = URL.createObjectURL(pdfBlob)
    const win = window.open(url, '_blank')

    if (!win) {
      alert('팝업 차단을 해제해주세요.')
      return
    }

    // 일정 시간 후 URL 해제
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 60000) // 1분 후
  } catch (error) {
    console.error('상세리포트 PDF 미리보기 실패:', error)
    throw error
  }
}

/**
 * 리포트 데이터를 PDF 생성용 형식으로 변환
 * @param {Object} errataData - 정오표 데이터
 * @param {Object} difficultyData - 난이도별 통계 데이터
 * @param {Object} evaluationData - 평가영역별 통계 데이터
 * @param {Object} examInfo - 시험 정보
 * @param {Object} studentInfo - 학생 정보
 * @returns {Object} PDF 생성용 리포트 데이터
 */
export const transformReportData = (
  errataData,
  difficultyData,
  evaluationData,
  examInfo = {},
  studentInfo = {},
) => {
  return {
    examTitle: examInfo.title || examInfo.examName || '시험',
    studentName: studentInfo.name || studentInfo.displayName || '학생',
    errataData: errataData || [],
    difficultyData: difficultyData || [],
    evaluationData: evaluationData || [],
  }
}

/**
 * 상세리포트 PDF 생성 및 다운로드 (통합 함수)
 * @param {Object} reportData - 리포트 데이터
 * @param {String} filename - 다운로드 파일명
 */
export const generateAndDownloadDetailReport = async (reportData, filename = null) => {
  try {
    // 파일명이 없으면 자동 생성
    if (!filename) {
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-') // HH-MM-SS
      filename = `상세리포트_${dateStr}_${timeStr}.pdf`
    }

    // PDF 생성
    const pdfBlob = await generateDetailReportPDF(reportData)

    // 다운로드
    downloadDetailReportPDF(pdfBlob, filename)

    return { success: true, filename }
  } catch (error) {
    console.error('상세리포트 PDF 생성 및 다운로드 실패:', error)
    throw error
  }
}

// 기본 export
export default {
  generateDetailReportPDF,
  downloadDetailReportPDF,
  previewDetailReportPDF,
  transformReportData,
  generateAndDownloadDetailReport,
}
