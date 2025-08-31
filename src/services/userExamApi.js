/**
 * User Exam API 서비스
 *
 * 사용자 시험지 관리 관련 API 호출
 */

import api from '@/services/api'

const BASE_URL = '/user-exams'

const userExamApi = {
  /**
   * 시험지 생성 (PDF 파일 포함)
   * @param {FormData} formData - examData JSON과 pdfFile을 포함한 FormData
   * @returns {Promise} 생성된 시험지 정보
   */
  createExamWithPDF(formData) {
    return api.post(BASE_URL, formData)
  },

  /**
   * 시험지 PDF 업데이트
   * @param {number} examId - 시험지 ID
   * @param {File} pdfFile - PDF 파일
   * @returns {Promise} 업데이트된 시험지 정보
   */
  updatePDF(examId, pdfFile) {
    const formData = new FormData()
    formData.append('pdfFile', pdfFile)

    return api.put(`${BASE_URL}/${examId}/pdf`, formData)
  },

  /**
   * 시험지 조회
   * @param {number} examId - 시험지 ID
   * @returns {Promise} 시험지 정보
   */
  getExam(examId) {
    return api.get(`${BASE_URL}/${examId}`)
  },

  /**
   * 시험지 목록 조회
   * @param {Object} params - 검색 파라미터
   * @returns {Promise} 시험지 목록
   */
  getExams(params = {}) {
    return api.get(BASE_URL, { params })
  },

  /**
   * 시험지 삭제
   * @param {number} examId - 시험지 ID
   * @returns {Promise}
   */
  deleteExam(examId) {
    return api.delete(`${BASE_URL}/${examId}`)
  },

  /**
   * 답안지 PDF 업로드
   * @param {number} examId - 시험지 ID
   * @param {File} answerPdfFile - 답안지 PDF 파일
   * @returns {Promise} 업데이트된 시험지 정보
   */
  updateAnswerPDF(examId, answerPdfFile) {
    const formData = new FormData()
    formData.append('answerPdfFile', answerPdfFile)

    return api.put(`${BASE_URL}/${examId}/answer-pdf`, formData)
  }
}

export default userExamApi
