import { ref } from 'vue'
import WebSocketService from '@/services/websocket'

export function useClassWebSocket(
  currentUserId,
  currentUserName,
  currentUserRole,
  onNewMessage,
  channelName,
) {
  // 실시간 온라인 사용자 목록
  const onlineUsers = ref(new Set())

  // 접속중인 학생 수
  const onlineStudents = ref(0)

  // 채팅 관련 데이터
  const chatMessages = ref([])

  // 웹소켓 연결 상태
  const isWebSocketConnected = ref(false)

  // 웹소켓 연결
  const connectWebSocket = async (callbacks = {}) => {
    if (!channelName.value) {
      console.warn('channelName.value이 설정되지 않았습니다.')
      return
    }

    try {
      await WebSocketService.connect(
        channelName.value,
        currentUserId,
        currentUserName,
        currentUserRole,
        {
          onChatMessage: (message) => {
            // 새 메시지 수신 시 채팅 목록에 추가
            chatMessages.value.push(message)

            if (callbacks.onChatMessage) {
              callbacks.onChatMessage(message)
            }
            // 새 메시지가 추가되면 스크롤을 최하단으로 이동
            if (onNewMessage) {
              onNewMessage()
            }
          },
          onOnlineStatus: (status) => {
            console.log('🔍 useClassWebSocket - onOnlineStatus called with:', status)
            
            // 서버에서 전체 온라인 사용자 목록을 받은 경우
            if (status.onlineUsers && Array.isArray(status.onlineUsers)) {
              console.log('📋 Processing full online users list:', status.onlineUsers.length, 'users')
              
              // 기존 온라인 사용자 목록 초기화
              onlineUsers.value.clear()
              
              // 학생 수 카운트 초기화
              let studentCount = 0
              let teacherCount = 0

              // 서버에서 받은 온라인 사용자들을 추가 (학생만 카운트)
              status.onlineUsers.forEach((user) => {
                console.log(`  👤 User: id=${user.userId}, name=${user.userName}, role=${user.userRole}, status=${user.status}`)
                
                if (user.status === 'ONLINE') {
                  onlineUsers.value.add(user.userId)
                  // 학생만 카운트 (STUDENT 역할만)
                  if (user.userRole === 'STUDENT') {
                    studentCount++
                    console.log(`    ✅ Counted as STUDENT: ${user.userName}`)
                  } else if (user.userRole === 'TEACHER') {
                    teacherCount++
                    console.log(`    ℹ️ Skipped (TEACHER): ${user.userName}`)
                  }
                }
              })

              // 접속중인 학생 수 업데이트 (학생만)
              onlineStudents.value = studentCount
              console.log('📊 Final count - Students:', studentCount, 'Teachers:', teacherCount, 'Total online:', onlineUsers.value.size)
            } else if (status.userId && status.status) {
              // 개별 사용자 상태 업데이트
              if (status.status === 'ONLINE') {
                onlineUsers.value.add(status.userId)
              } else if (status.status === 'OFFLINE') {
                onlineUsers.value.delete(status.userId)
              }
              
              // 개별 업데이트 시에도 전체 온라인 상태를 다시 요청하는 것이 더 정확함
              // 왜냐하면 개별 업데이트에는 role 정보가 없을 수 있기 때문
            }

            if (callbacks.onOnlineStatus) {
              callbacks.onOnlineStatus(status)
            }
          },
          onExamStatus: (examStatus) => {
            if (callbacks.onExamStatus) {
              callbacks.onExamStatus(examStatus)
            }
          },
          onExamProgress: (examProgress) => {
            if (callbacks.onExamProgress) {
              callbacks.onExamProgress(examProgress)
            }
          },
        },
      )

      isWebSocketConnected.value = true
    } catch (error) {
      console.error('WebSocket 연결 실패:', error)
      isWebSocketConnected.value = false
    }
  }

  // 웹소켓 연결 해제
  const disconnectWebSocket = () => {
    if (WebSocketService.isConnected()) {
      WebSocketService.removeUser(
        channelName.value,
        currentUserId,
        currentUserName,
        currentUserRole,
      )
      WebSocketService.updateOnlineStatus(
        channelName.value,
        currentUserId,
        currentUserName,
        currentUserRole,
        'OFFLINE',
      )
      WebSocketService.sendOnlineStatus(channelName.value, currentUserId, false)
    }
    WebSocketService.disconnect()
    isWebSocketConnected.value = false
  }

  // 채팅 메시지 전송
  const sendChatMessage = (content) => {
    if (!channelName.value) {
      console.warn('channelName.value이 설정되지 않았습니다.')
      return false
    }

    if (content.trim()) {
      const messageData = {
        channelName: channelName.value,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        content: content.trim(),
        messageType: 'MESSAGE',
        timestamp: new Date().toISOString(),
      }
      WebSocketService.sendMessage(channelName.value, messageData)
      return true
    }
    return false
  }

  // 채팅 메시지 전송
  const sendNoticeMessage = (content) => {
    console.log('sendNoticeMessage', content.trim())
    if (!channelName.value) {
      console.warn('channelName.value이 설정되지 않았습니다.')
      return false
    }

    if (content.trim()) {
      const messageData = {
        channelName: channelName.value,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        content: content.trim(),
        messageType: 'NOTICE',
        timestamp: new Date().toISOString(),
      }
      WebSocketService.sendNotice(channelName.value, messageData)
      return true
    }
    return false
  }

  // 온라인 상태 업데이트
  const updateOnlineStatus = (status) => {
    WebSocketService.updateOnlineStatus(
      channelName.value,
      currentUserId,
      currentUserName,
      currentUserRole,
      status,
    )
  }

  // 온라인 상태 조회
  const getOnlineStatus = () => {
    if (channelName.value && currentUserId) {
      WebSocketService.getOnlineStatus(channelName.value, currentUserId)
    } else {
      console.warn('channelName 또는 currentUserId가 설정되지 않았습니다.')
    }
  }

  const sendStatusMessage = (content) => {
    if (channelName.value && currentUserId) {
      WebSocketService.sendExamStatus(channelName.value, content)
    } else {
      console.warn('channelName 또는 currentUserId가 설정되지 않았습니다.')
    }
  }

  const getExamStatus = () => {
    if (channelName.value) {
      WebSocketService.getExamStatus(channelName.value)
    } else {
      console.warn('channelName이 설정되지 않았습니다.')
    }
  }

  const sendExamProgressMessage = (content) => {
    if (channelName.value && currentUserId) {
      WebSocketService.sendExamProgress(channelName.value, content)
    } else {
      console.warn('channelName 또는 currentUserId가 설정되지 않았습니다.')
    }
  }
  // 초기 온라인 상태 강제 조회
  const refreshOnlineStatus = () => {
    if (isWebSocketConnected.value) {
      getOnlineStatus()
    }
  }

  // classmates 목록 업데이트 (UI 표시용)
  const updateClassmatesStatus = (classmates, status) => {
    // 전체 온라인 사용자 목록이 있는 경우
    if (status.onlineUsers && Array.isArray(status.onlineUsers)) {
      // 모든 classmates의 상태를 초기화
      classmates.forEach((classmate) => {
        classmate.status = 'OFFLINE'
      })

      // 온라인 학생들의 상태를 업데이트 (STUDENT 역할만)
      status.onlineUsers.forEach((onlineUser) => {
        if (onlineUser.status === 'ONLINE' && onlineUser.userRole === 'STUDENT') {
          const classmate = classmates.find((c) => c.studentId == onlineUser.userId)
          if (classmate) {
            classmate.status = 'ONLINE'
          }
        }
      })
    } else if (status.userId && status.status) {
      // 개별 사용자 상태 업데이트
      const classmate = classmates.find((c) => c.studentId == status.userId)
      if (classmate) {
        classmate.status = status.status
      }
    }
  }

  return {
    // 상태
    onlineUsers,
    onlineStudents,
    chatMessages,
    isWebSocketConnected,
    // 메서드
    connectWebSocket,
    disconnectWebSocket,
    sendChatMessage,
    sendNoticeMessage,
    sendStatusMessage,
    sendExamProgressMessage,
    updateOnlineStatus,
    getOnlineStatus,
    getExamStatus,
    refreshOnlineStatus,
    updateClassmatesStatus,
  }
}
