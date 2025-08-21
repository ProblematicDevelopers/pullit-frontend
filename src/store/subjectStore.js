// src/stores/subject.js
import { defineStore } from 'pinia'
import api from '@/services/api.js'

export const useSubjectStore = defineStore
('subject', {
  state: () => ({
    list: [],
    loading: false,
    error: null,
    lastFetchedAt: null,
  }),
  actions: {
    clearState() {
      this.list = []
      this.loading = false
      this.error = null
    },
    async fetchSubjects({ force = false } = {}) {
      // 캐시가 있고 강제 새로고침이 아니면 스킵 (옵션)
      if (!force && this.list.length > 0) return

      this.clearState()
      this.loading = true
      try {
        const { data } = await api.get('/subject')
        this.list = data.data;
        this.lastFetchedAt = Date.now()
      } catch (e) {
        this.error = e?.message || 'Failed to fetch subjects'
        throw e // 컴포넌트에서 필요시 catch 가능
      } finally {
        this.loading = false
      }
    }
  }
})
