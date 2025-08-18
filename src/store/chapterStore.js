// src/stores/subject.js
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL // 환경변수 권장

export const useChapterStore = defineStore('chapter', {
  state: () => ({
    list: [],
    loading: false,
    error: null,
    lastFetchedAt: null,
    currentSubjectId: null, // 현재 로드된 subjectId 추적
  }),
  actions: {
    clearState() {
      this.list = []
      this.loading = false
      this.error = null
    },
    async fetchChapters(subjectId, { force = false } = {}) {
      // 같은 subjectId에 대해 캐시가 있고 강제 새로고침이 아니면 스킵
      if (!force && this.list.length > 0 && this.currentSubjectId === subjectId) {
        return
      }

      this.clearState()
      this.loading = true
      try {
        const { data } = await axios.get(`${API_BASE_URL}/chapter/${subjectId}/tree`)
        this.list = data.data;
        this.currentSubjectId = subjectId
        this.lastFetchedAt = Date.now()
      } catch (e) {
        this.error = e?.message || 'Failed to fetch Chapters'
        throw e // 컴포넌트에서 필요시 catch 가능
      } finally {
        this.loading = false
      }
    }
  }
})
