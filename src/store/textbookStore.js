import { defineStore } from 'pinia'

import { itemProcessingAPI } from '../services/itemProcessApi.js'

export const useTextbookStore = defineStore('textbook', {
  state: () => ({
    // 교과서(과목) 목록 데이터
    // [{ subjectId, subjectName, subjectThumbnail, curriculumCode, ... }]
    list: [],

    // 로딩/에러 상태
    loading: false,
    error: null,

    // 마지막으로 데이터를 성공적으로 받아온 시각(캐시 활용 가능)
    lastFetchedAt: null,
  }),
  actions: {
    // 스토어 상태 초기화
    clearState() {
      this.list = []
      this.loading = false
      this.error = null
    },

    /**
     * 교과서 목록을 서버에서 조회합니다.
     */
    async fetchTextbooks({ force = false } = {}) {
      // 간단한 캐시: 이미 데이터가 있으면 재요청 스킵(옵션으로 강제 갱신 가능)
      if (!force && this.list.length > 0) return

      this.clearState()
      this.loading = true
      try {
        const response = await itemProcessingAPI.getTextbooks()

        // 백엔드 표준 응답 스키마: { success, code, message, data, timestamp }
        if (response.data?.success) {
          this.list = Array.isArray(response.data.data) ? response.data.data : []
          this.lastFetchedAt = Date.now()
        } else {
          throw new Error(response.data?.message || '교과서 목록을 불러오지 못했습니다.')
        }
      } catch (e) {
        this.error = e?.response?.data?.message || e?.message || '교과서 목록 조회에 실패했습니다.'
        throw e
      } finally {
        this.loading = false
      }
    }
  }
})


