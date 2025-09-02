<template>
  <div class="notification-container">
    <!-- 알림 벨 아이콘 -->
    <button
      class="notification-bell"
      @click="toggleDropdown"
      :class="{ 'has-unread': unreadCount > 0 }"
    >
      <svg viewBox="0 0 24 24" class="bell-icon">
        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
      </svg>

      <!-- 읽지 않은 알림 개수 배지 -->
      <span v-if="unreadCount > 0" class="notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- 알림 드롭다운 -->
    <transition name="dropdown">
      <div v-if="isDropdownOpen" class="notification-dropdown" ref="dropdown">
        <!-- 드롭다운 헤더 -->
        <div class="dropdown-header">
          <h3 class="dropdown-title">알림</h3>
          <div class="header-actions">
            <button
              v-if="notifications.length > 0"
              @click="markAllAsRead"
              class="mark-all-read-btn"
              :disabled="unreadCount === 0"
            >
              모두 읽음
            </button>
          </div>
        </div>

        <!-- 알림 리스트 -->
        <div class="notification-list" v-if="notifications.length > 0">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <!-- 알림 아이콘 -->
            <div class="notification-icon" :class="`type-${getNotificationType(notification.type)}`">
              <svg v-if="getNotificationIcon(notification.type) === 'exam'" viewBox="0 0 24 24">
                <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z"/>
              </svg>
              <svg v-else-if="getNotificationIcon(notification.type) === 'class'" viewBox="0 0 24 24">
                <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25M0 20V18.5C0 17.11 1.89 15.94 4.45 15.6C3.86 16.28 3.5 17.22 3.5 18.25V20H0M24 20H20.5V18.25C20.5 17.22 20.14 16.28 19.55 15.6C22.11 15.94 24 17.11 24 18.5V20Z"/>
              </svg>
              <svg v-else-if="getNotificationIcon(notification.type) === 'message'" viewBox="0 0 24 24">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path d="M13 9H11V7H13V9M13 17H11V11H13V17M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
              </svg>
            </div>

            <!-- 알림 내용 -->
            <div class="notification-content">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>

            <!-- 삭제 버튼 -->
            <button
              @click.stop="deleteNotification(notification.id)"
              class="delete-btn"
              title="삭제"
            >
              <svg viewBox="0 0 24 24" class="delete-icon">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 알림이 없을 때 -->
        <div v-else class="empty-state">
          <svg viewBox="0 0 24 24" class="empty-icon">
            <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z"/>
          </svg>
          <p class="empty-message">새로운 알림이 없습니다</p>
        </div>

        <!-- 드롭다운 푸터 -->
        <div class="dropdown-footer" v-if="notifications.length > 0">
          <router-link to="/notifications" class="view-all-link" @click="closeDropdown">
            모든 알림 보기
          </router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import notificationApi from '@/services/notificationApi'
import { useToast } from '@/composables/useToast'

export default {
  name: 'NotificationBell',
  setup() {
    const router = useRouter()
    const toast = useToast()

    // 상태
    const isDropdownOpen = ref(false)
    const notifications = ref([])
    const unreadCount = ref(0)
    const isLoading = ref(false)
    const websocket = ref(null)

    // 드롭다운 토글
    const toggleDropdown = async () => {
      isDropdownOpen.value = !isDropdownOpen.value

      if (isDropdownOpen.value) {
        await fetchNotifications()
      }
    }

    const closeDropdown = () => {
      isDropdownOpen.value = false
    }

    // 알림 가져오기
    const fetchNotifications = async () => {
      isLoading.value = true
      try {
        const response = await notificationApi.getNotifications()
        // ApiResponse 형태 처리
        const list = response?.data?.data
        notifications.value = Array.isArray(list) ? list : []
        updateUnreadCount()
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        toast.error('알림을 불러올 수 없습니다')
      } finally {
        isLoading.value = false
      }
    }

    // 읽지 않은 알림 개수 업데이트
    const updateUnreadCount = async () => {
      try {
        const response = await notificationApi.getUnreadCount()
        unreadCount.value = response?.data?.data?.count || 0
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    // 알림 클릭 처리
    const handleNotificationClick = async (notification) => {
      // 읽지 않은 알림이면 읽음 처리
      if (!notification.isRead) {
        await markAsRead(notification.id)
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }

      // 타겟 URL이 있으면 이동
      if (notification.targetUrl) {
        router.push(notification.targetUrl)
        closeDropdown()
      }
    }

    // 알림 읽음 처리
    const markAsRead = async (notificationId) => {
      try {
        await notificationApi.markAsRead(notificationId)
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }

    // 모든 알림 읽음 처리
    const markAllAsRead = async () => {
      try {
        await notificationApi.markAllAsRead()
        notifications.value.forEach(n => n.isRead = true)
        unreadCount.value = 0
        toast.success('모든 알림을 읽음 처리했습니다')
      } catch (error) {
        console.error('Failed to mark all as read:', error)
        toast.error('읽음 처리에 실패했습니다')
      }
    }

    // 알림 삭제
    const deleteNotification = async (notificationId) => {
      try {
        await notificationApi.deleteNotification(notificationId)
        const index = notifications.value.findIndex(n => n.id === notificationId)
        if (index > -1) {
          const notification = notifications.value[index]
          if (!notification.isRead) {
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          }
          notifications.value.splice(index, 1)
        }
        toast.success('알림이 삭제되었습니다')
      } catch (error) {
        console.error('Failed to delete notification:', error)
        toast.error('알림 삭제에 실패했습니다')
      }
    }

    // WebSocket 연결
    const connectWebSocket = () => {
      const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (!user.id) return

      const wsUrl = `ws://localhost:8080/ws/notifications?userId=${user.id}`
      websocket.value = new WebSocket(wsUrl)

      websocket.value.onopen = () => {
        console.log('Notification WebSocket connected')
      }

      websocket.value.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      }

      websocket.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      websocket.value.onclose = () => {
        console.log('WebSocket disconnected')
        // 재연결 시도
        setTimeout(connectWebSocket, 5000)
      }
    }

    // WebSocket 메시지 처리
    const handleWebSocketMessage = (data) => {
      switch (data.type) {
        case 'NOTIFICATION':
          // 새 알림 추가
          notifications.value.unshift(data.data)
          unreadCount.value++

          // 토스트 알림 표시
          toast.info(data.data.title, {
            duration: 5000,
            onClick: () => handleNotificationClick(data.data)
          })
          break

        case 'UNREAD_COUNT_UPDATE':
          unreadCount.value = data.count
          break

        default:
          console.log('Unknown WebSocket message type:', data.type)
      }
    }

    // 알림 타입 아이콘 가져오기
    const getNotificationIcon = (type) => {
      const iconMap = {
        'EXAM_ASSIGNED': 'exam',
        'EXAM_STARTED': 'exam',
        'EXAM_ENDED': 'exam',
        'EXAM_COMPLETED': 'exam',
        'EXAM_RESULT': 'exam',
        'CLASS_INVITATION': 'class',
        'CLASS_ANNOUNCEMENT': 'class',
        'MESSAGE_RECEIVED': 'message',
        'HOMEWORK_ASSIGNED': 'exam',
        'GRADE_UPDATED': 'exam'
      }
      return iconMap[type] || 'info'
    }

    // 알림 타입 클래스 가져오기
    const getNotificationType = (type) => {
      return type.toLowerCase().replace(/_/g, '-')
    }

    // 시간 포맷팅
    const formatTime = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date

      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return '방금 전'
      if (minutes < 60) return `${minutes}분 전`
      if (hours < 24) return `${hours}시간 전`
      if (days < 7) return `${days}일 전`

      return date.toLocaleDateString('ko-KR')
    }

    // 외부 클릭 감지
    const handleClickOutside = (event) => {
      const container = event.target.closest('.notification-container')
      if (!container && isDropdownOpen.value) {
        closeDropdown()
      }
    }

    onMounted(() => {
      updateUnreadCount()
      connectWebSocket()
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      if (websocket.value) {
        websocket.value.close()
      }
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      isDropdownOpen,
      notifications,
      unreadCount,
      isLoading,
      toggleDropdown,
      closeDropdown,
      fetchNotifications,
      handleNotificationClick,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      getNotificationIcon,
      getNotificationType,
      formatTime
    }
  }
}
</script>

<style scoped>
.notification-container {
  position: relative;
}

/* 알림 벨 버튼 */
.notification-bell {
  position: relative;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.2s;
}

.notification-bell:hover {
  background: #f3f4f6;
}

.notification-bell.has-unread .bell-icon {
  animation: bell-ring 0.5s ease-in-out;
}

@keyframes bell-ring {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.bell-icon {
  width: 24px;
  height: 24px;
  fill: #6b7280;
}

.notification-bell:hover .bell-icon {
  fill: #374151;
}

/* 알림 배지 */
.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* 드롭다운 */
.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 380px;
  max-height: 500px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

/* 드롭다운 헤더 */
.dropdown-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.mark-all-read-btn:hover:not(:disabled) {
  background: #eff6ff;
}

.mark-all-read-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

/* 알림 리스트 */
.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #2563eb;
}

/* 알림 아이콘 */
.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon svg {
  width: 20px;
  height: 20px;
}

.notification-icon.type-exam-assigned,
.notification-icon.type-exam-completed,
.notification-icon.type-exam-result {
  background: #fef3c7;
  color: #d97706;
}

.notification-icon.type-exam-assigned svg,
.notification-icon.type-exam-completed svg,
.notification-icon.type-exam-result svg {
  fill: #d97706;
}

.notification-icon.type-class-invitation,
.notification-icon.type-class-announcement {
  background: #dbeafe;
  color: #2563eb;
}

.notification-icon.type-class-invitation svg,
.notification-icon.type-class-announcement svg {
  fill: #2563eb;
}

.notification-icon.type-message-received {
  background: #e0e7ff;
  color: #6366f1;
}

.notification-icon.type-message-received svg {
  fill: #6366f1;
}

/* 알림 내용 */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.notification-message {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 4px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #9ca3af;
}

/* 삭제 버튼 */
.delete-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-icon {
  width: 16px;
  height: 16px;
  fill: #9ca3af;
}

.delete-btn:hover .delete-icon {
  fill: #ef4444;
}

/* 빈 상태 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  fill: #d1d5db;
  margin-bottom: 12px;
}

.empty-message {
  color: #9ca3af;
  font-size: 14px;
}

/* 드롭다운 푸터 */
.dropdown-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.view-all-link {
  color: #2563eb;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.view-all-link:hover {
  text-decoration: underline;
}

/* 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 반응형 */
@media (max-width: 480px) {
  .notification-dropdown {
    width: calc(100vw - 32px);
    right: -8px;
  }
}
</style>
