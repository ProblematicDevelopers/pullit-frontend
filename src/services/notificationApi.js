import api from './api'

const notificationApi = {
  // 알림 목록 조회
  getNotifications(page = 0, size = 20) {
    return api.get('/notifications', {
      params: { page, size }
    })
  },

  // 읽지 않은 알림 개수 조회
  getUnreadCount() {
    return api.get('/notifications/unread-count')
  },

  // 알림 읽음 처리
  markAsRead(notificationId) {
    return api.put(`/notifications/${notificationId}/read`)
  },

  // 모든 알림 읽음 처리
  markAllAsRead() {
    return api.put('/notifications/read-all')
  },

  // 알림 삭제
  deleteNotification(notificationId) {
    return api.delete(`/notifications/${notificationId}`)
  },

  // 테스트 알림 생성 (개발용)
  createTestNotification(data) {
    return api.post('/notifications/test', data)
  }
}

export default notificationApi