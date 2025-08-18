/**
 * 문제 등록 Store
 * ItemProcessing 페이지에서 사용하는 상태 관리
 * 교과서 내 문제추가와 CBT(기출문제) 옵션을 관리
 */

import { defineStore } from 'pinia'
import axios from 'axios'

// API 기본 URL 설정 (환경변수에서 가져오거나 기본값 사용)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const useItemProcessingStore = defineStore('itemProcessing', {
  /**
   * 상태 정의
   * 컴포넌트에서 사용할 반응형 데이터들을 정의
   */
  state: () => ({
    // API 호출 중 로딩 상태
    loading: true,

    // API 호출 시 발생한 에러 메시지
    error: null,

    // /api/file-history/source에서 받아온 문제 등록 옵션 목록
    // 예: [{ code: "CBT", name: "CBT(기출문제)", description: "..." }, ...]
    options: []
  }),

  /**
   * 액션 정의
   * 상태를 변경하거나 외부 API를 호출하는 메서드들
   */
  actions: {
    /**
     * 문제 등록 옵션을 API에서 가져오는 함수
     * 컴포넌트 마운트 시 자동으로 호출됨
     */
    async fetchOptions() {
      try {
        // 로딩 상태 시작
        this.loading = true
        this.error = null

        // API 호출: 문제 등록 소스 옵션 가져오기
        const response = await axios.get(`${API_BASE_URL}/api/file-history/source`)

        // API 응답이 성공인 경우
        if (response.data.success) {
          // 받아온 데이터를 store의 options에 저장
          this.options = response.data.data
        } else {
          // API에서 success: false를 반환한 경우
          throw new Error(response.data.message || '데이터를 불러오는데 실패했습니다')
        }
      } catch (err) {
        // 에러 발생 시 처리
        console.error('API 호출 실패:', err)

        // 서버에서 보낸 에러 메시지가 있으면 사용, 없으면 기본 메시지 사용
        this.error = err.response?.data?.message || err.message || '서버와의 연결에 실패했습니다'
      } finally {
        // 성공/실패와 관계없이 로딩 상태 종료
        this.loading = false
      }
    },

    /**
     * 선택된 옵션의 코드를 반환하는 함수
     * @param {string} code - 선택된 옵션의 코드 ('TEXTBOOK' 또는 'CBT')
     * @returns {string} 해당 옵션에 맞는 라우터 경로
     */
    getOptionRoute(code) {
      // 교과서 내 문제추가 선택 시
      if (code === 'TEXTBOOK') {
        return '/item-processing/textbook'
      }
      // CBT(기출문제) 선택 시
      else if (code === 'CBT') {
        return '/item-processing/cbt'
      }
      // 기본값
      return '/item-processing'
    }
  }
})
