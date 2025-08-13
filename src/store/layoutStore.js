import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    headerTitle: '기본 헤더 제목',
    footerText: '© 2025 My Website',
    userName: 'Guest'
  }),
  actions: {
    setHeaderTitle(title) {
      this.headerTitle = title
    },
    setUserName(name) {
      this.userName = name
    }
  }
})
