// src/store/userStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL // 환경변수 권장

export const useUserStore = defineStore('userStore', {
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
    async fetchUsers({ force = false } = {}) {
      if (!force && this.list.length > 0) return
      this.clearState()
      this.loading = true
      try {
        const { data } = await axios.get(`${API_BASE_URL}/users/me`)
        this.list = Array.isArray(data) ? data : (data.content ?? [])
        this.lastFetchedAt = Date.now()
      } catch (e) {
        this.error = e?.message || 'Failed to fetch users'
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
