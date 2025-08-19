/**
 * 문제 등록 Store
 * ItemProcessing 페이지에서 사용하는 상태 관리
 * 교과서 선택 및 PDF 처리 과정을 관리
 */

import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// 과목 정보 정의 (areaCode와 매칭)
const SUBJECTS = {
  'KO': { name: '국어', color: '#ef4444' },
  'EN': { name: '영어', color: '#10b981' },
  'MA': { name: '수학', color: '#3b82f6' },
  'SO': { name: '사회', color: '#f59e0b' },
  'SC': { name: '과학', color: '#84cc16' },
  'HS': { name: '역사', color: '#8b5cf6' },
  'MO': { name: '도덕', color: '#06b6d4' },
}

export const useItemProcessingStore = defineStore('itemProcessing', {
  /**
   * 상태 정의
   * 컴포넌트에서 사용할 반응형 데이터들을 정의
   */
  state: () => ({
    // API 호출 중 로딩 상태
    loading: false,

    // API 호출 시 발생한 에러 메시지
    error: null,

    // 교과서 목록
    textbooks: [],

    // 선택된 교과서 정보
    selectedTextbook: null,

    // PDF 파일 정보
    pdfFile: null,

    // PDF 페이지 정보 (순서, 삭제 여부 등)
    pdfPages: [],

    // OCR 처리된 데이터
    ocrData: []
  }),

  /**
   * 게터 정의
   * 계산된 상태값들을 정의
   */
  getters: {
    /**
     * 과목별로 그룹화된 교과서 목록
     */
    groupedTextbooks: (state) => {
      console.log('groupedTextbooks getter 호출됨')
      console.log('현재 textbooks:', state.textbooks)

      const grouped = {}

      // 과목별로 그룹 초기화
      Object.keys(SUBJECTS).forEach(areaCode => {
        grouped[areaCode] = []
      })

      // 교과서를 과목별로 분류 (areaCode 기준)
      state.textbooks.forEach(textbook => {
        const areaCode = textbook.areaCode
        console.log('교과서 areaCode:', areaCode, 'textbook:', textbook)
        if (grouped[areaCode]) {
          grouped[areaCode].push(textbook)
        }
      })

      console.log('그룹화된 결과:', grouped)
      return grouped
    },

    /**
     * 과목 정보
     */
    subjects: () => SUBJECTS
  },

  /**
   * 액션 정의
   * 상태를 변경하거나 외부 API를 호출하는 메서드들
   */
  actions: {
    /**
     * 교과서 목록을 API에서 가져오는 함수
     * 컴포넌트 마운트 시 자동으로 호출됨
     */
    async fetchTextbooks() {
      try {
        // 로딩 상태 시작
        this.loading = true
        this.error = null

        console.log('API 호출 시작:', `${API_BASE_URL}/api/file-history/textbook`)

        // API 호출: 교과서 목록 가져오기
        const response = await axios.get(`${API_BASE_URL}/api/file-history/textbook`)

        console.log('API 응답:', response.data) // 디버깅용 로그

        // API 응답이 성공인 경우
        if (response.data.success && response.data.data) {
          // 받아온 데이터를 store의 textbooks에 저장
          this.textbooks = response.data.data
          console.log('API에서 받은 교과서 저장됨:', this.textbooks) // 디버깅용 로그
        } else {
          // API에서 success: false를 반환한 경우
          throw new Error(response.data.message || '교과서 목록을 불러오는데 실패했습니다')
        }
      } catch (err) {
        // 에러 발생 시 처리
        console.error('API 호출 실패:', err)

        // 서버에서 보낸 에러 메시지가 있으면 사용, 없으면 기본 메시지 사용
        this.error = err.response?.data?.message || err.message || '서버와의 연결에 실패했습니다'
      } finally {
        // 성공/실패와 관계없이 로딩 상태 종료
        this.loading = false
        console.log('최종 textbooks 상태:', this.textbooks)
      }
    },

    /**
     * 교과서 선택
     * @param {Object} textbook - 선택된 교과서 객체
     */
    selectTextbook(textbook) {
      this.selectedTextbook = textbook
    },

    /**
     * PDF 파일 설정
     * @param {File} file - 업로드된 PDF 파일
     */
    setPdfFile(file) {
      this.pdfFile = file
      // PDF 파일이 변경되면 페이지 정보 초기화
      this.pdfPages = []
      this.ocrData = []
    },

    /**
     * PDF 페이지 순서 변경
     * @param {number} fromIndex - 이동할 페이지의 현재 인덱스
     * @param {number} toIndex - 이동할 페이지의 목표 인덱스
     */
    movePage(fromIndex, toIndex) {
      if (fromIndex >= 0 && toIndex >= 0 && fromIndex < this.pdfPages.length && toIndex < this.pdfPages.length) {
        const page = this.pdfPages.splice(fromIndex, 1)[0]
        this.pdfPages.splice(toIndex, 0, page)
      }
    },

    /**
     * PDF 페이지 삭제
     * @param {number} pageIndex - 삭제할 페이지의 인덱스
     */
    removePage(pageIndex) {
      if (pageIndex >= 0 && pageIndex < this.pdfPages.length) {
        this.pdfPages.splice(pageIndex, 1)
      }
    },

    /**
     * OCR 데이터 저장
     * @param {Object} data - OCR 처리된 데이터
     */
    saveOcrData(data) {
      this.ocrData.push(data)
    },

    /**
     * 상태 초기화
     */
    reset() {
      this.textbooks = []
      this.selectedTextbook = null
      this.pdfFile = null
      this.pdfPages = []
      this.ocrData = []
      this.error = null
    }
  }
})
