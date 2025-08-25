import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.subscriptions = new Map()
  }

  connect(classId, userId, senderName, senderRole, callbacks = {}) {
    return new Promise((resolve, reject) => {
      try {
        // 새로운 STOMP 클라이언트 생성
        this.stompClient = new Client({
          webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        })

        this.stompClient.onConnect = () => {
          this.connected = true

          // 클래스 채팅 구독 (입장 메시지 포함)
          const classSubscription = this.stompClient.subscribe(
            `/topic/class/${classId}`,
            (message) => {
              try {
                const chatMessage = JSON.parse(message.body)
                if (callbacks.onChatMessage) {
                  callbacks.onChatMessage(chatMessage)
                }
              } catch (error) {
                console.error('Error parsing chat message:', error)
              }
            },
          )

          // 채팅 메시지 구독
          const chatSubscription = this.stompClient.subscribe(
            `/topic/class/${classId}/chat`,
            (message) => {
              try {
                const chatMessage = JSON.parse(message.body)
                if (callbacks.onChatMessage) {
                  callbacks.onChatMessage(chatMessage)
                }
              } catch (error) {
                console.error('Error parsing chat message:', error)
              }
            },
          )

          // 접속 상태 구독 (클래스 전체 브로드캐스트)
          const onlineSubscription = this.stompClient.subscribe(
            `/topic/class/${classId}/online`,
            (message) => {
              try {
                const onlineStatusResponse = JSON.parse(message.body)

                // OnlineStatusResponse에서 개별 사용자 상태 추출
                if (
                  onlineStatusResponse.onlineUsers &&
                  Array.isArray(onlineStatusResponse.onlineUsers)
                ) {
                  onlineStatusResponse.onlineUsers.forEach((userStatus) => {
                    if (callbacks.onOnlineStatus) {
                      callbacks.onOnlineStatus({
                        userId: userStatus.userId,
                        status: userStatus.status,
                        userName: userStatus.userName,
                        userRole: userStatus.userRole,
                        timestamp: userStatus.timestamp,
                      })
                    }
                  })
                } else {
                  // 단일 사용자 상태인 경우 (기존 형식)
                  if (callbacks.onOnlineStatus) {
                    callbacks.onOnlineStatus(onlineStatusResponse)
                  }
                }
              } catch (error) {
                console.error('Error parsing online status:', error)
              }
            },
          )

          // 개별 사용자 온라인 상태 구독
          const userOnlineSubscription = this.stompClient.subscribe(
            `/user/${userId}/queue/online/status`,
            (message) => {
              try {
                const onlineStatusResponse = JSON.parse(message.body)

                if (
                  onlineStatusResponse.onlineUsers &&
                  Array.isArray(onlineStatusResponse.onlineUsers)
                ) {
                  onlineStatusResponse.onlineUsers.forEach((userStatus) => {
                    if (callbacks.onOnlineStatus) {
                      callbacks.onOnlineStatus({
                        userId: userStatus.userId,
                        isOnline: userStatus.isOnline,
                        userName: userStatus.userName,
                        userRole: userStatus.userRole,
                        timestamp: userStatus.timestamp,
                      })
                    }
                  })
                }
              } catch (error) {
                console.error('Error parsing individual online status:', error)
              }
            },
          )

          // 구독 저장
          this.subscriptions.set('class', classSubscription)
          this.subscriptions.set('chat', chatSubscription)
          this.subscriptions.set('online', onlineSubscription)
          this.subscriptions.set('userOnline', userOnlineSubscription)

          // 사용자 입장 메시지 전송
          this.addUser(classId, userId, senderName, senderRole)

          // 접속 상태 업데이트
          this.updateOnlineStatus(classId, userId, senderName, senderRole, 'ONLINE')

          // 접속 알림 전송
          this.sendOnlineStatus(classId, userId, true)

          resolve()
        }

        this.stompClient.onStompError = () => {
          reject(new Error('STOMP connection failed'))
        }

        this.stompClient.onWebSocketError = (error) => {
          console.error('WebSocket Error:', error)
          reject(error)
        }

        // 연결 시작
        this.stompClient.activate()
      } catch (error) {
        console.error('Error creating WebSocket connection:', error)
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      // 구독 해제
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe()
      })
      this.subscriptions.clear()

      this.stompClient.deactivate()
      this.connected = false
    }
  }

  sendMessage(classId, message) {
    if (this.connected && this.stompClient) {
      try {
        const messageData = {
          ...message,
          classId: classId,
        }
        this.stompClient.publish({
          destination: `/app/chat.sendMessage`,
          body: JSON.stringify(messageData),
        })
      } catch (error) {
        console.error('Error sending message:', error)
      }
    } else {
      console.warn('WebSocket not connected')
    }
  }

  sendOnlineStatus(classId, userId, isOnline) {
    if (this.connected && this.stompClient) {
      try {
        const status = {
          userId: userId,
          classId: classId,
          isOnline: isOnline,
          timestamp: new Date().toISOString(),
        }

        this.stompClient.publish({
          destination: `/app/user.${isOnline ? 'join' : 'leave'}`,
          body: JSON.stringify(status),
        })
      } catch (error) {
        console.error('Error sending online status:', error)
      }
    } else {
      console.warn('WebSocket not connected')
    }
  }

  updateOnlineStatus(classId, userId, userName, userRole, status) {
    if (this.connected && this.stompClient) {
      try {
        const statusData = {
          classId: classId,
          userId: userId,
          userName: userName,
          userRole: userRole,
          status: status,
          timestamp: new Date().toISOString(),
        }

        this.stompClient.publish({
          destination: `/app/online.updateStatus`,
          body: JSON.stringify(statusData),
        })
      } catch (error) {
        console.error('Error updating online status:', error)
      }
    } else {
      console.warn('WebSocket not connected')
    }
  }

  getOnlineStatus(classId, userId) {
    if (this.connected && this.stompClient) {
      try {
        const requestData = {
          classId: classId,
          userId: userId,
          timestamp: new Date().toISOString(),
        }

        this.stompClient.publish({
          destination: `/app/online.getStatus`,
          body: JSON.stringify(requestData),
        })
      } catch (error) {
        console.error('Error requesting online status:', error)
      }
    } else {
      console.warn('WebSocket not connected')
    }
  }

  addUser(classId, userId, senderName, senderRole) {
    if (this.connected && this.stompClient) {
      try {
        const userData = {
          classId: classId,
          senderId: userId,
          senderName: senderName,
          senderRole: senderRole,
          messageType: 'JOIN',
          timestamp: new Date().toISOString(),
        }

        this.stompClient.publish({
          destination: `/app/chat.addUser`,
          body: JSON.stringify(userData),
        })
      } catch (error) {
        console.error('Error adding user to chat:', error)
      }
    } else {
      console.warn('WebSocket not connected')
    }
  }

  removeUser(classId, userId, senderName, senderRole) {
    if (this.connected && this.stompClient) {
      try {
        const userData = {
          classId: classId,
          senderId: userId,
          senderName: senderName,
          senderRole: senderRole,
          messageType: 'LEAVE',
          timestamp: new Date().toISOString(),
        }

        this.stompClient.publish({
          destination: `/app/chat.leaveUser`,
          body: JSON.stringify(userData),
        })
      } catch (error) {
        console.error('Error removing user from chat:', error)
      }
    } else {
      console.warn('WebSocket not connected')
    }
  }

  isConnected() {
    return this.connected
  }
}

export default new WebSocketService()
