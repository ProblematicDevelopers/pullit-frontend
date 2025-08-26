import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

// WebSocket 기본 URL 설정 (API와 동일한 패턴 사용)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// 프로덕션 환경인지 확인
const isProduction = import.meta.env.PROD

// WebSocket URL 생성 (프로덕션에서는 현재 호스트 사용, 로컬에서는 API_BASE_URL 사용)
const WS_URL = isProduction
  ? `${window.location.protocol}//${window.location.host}/ws`
  : `${API_BASE_URL}/ws`

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.subscriptions = new Map()
  }

  connect(channelName, userId, senderName, senderRole, callbacks = {}) {
    return new Promise((resolve, reject) => {
      try {
        // 새로운 STOMP 클라이언트 생성
        this.stompClient = new Client({
          webSocketFactory: () => new SockJS(WS_URL),
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        })

        this.stompClient.onConnect = () => {
          this.connected = true

          // 채널 채팅 구독 (입장 메시지 포함)
          const classSubscription = this.stompClient.subscribe(
            `/topic/${channelName}`,
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

          // 접속 상태 구독 (채널 전체 브로드캐스트)
          const onlineSubscription = this.stompClient.subscribe(
            `/topic/${channelName}/online`,
            (message) => {
              try {
                const onlineStatusResponse = JSON.parse(message.body)
                console.log('📢 채널 전체 온라인 상태 응답:', onlineStatusResponse)

                // OnlineStatusResponse에서 전체 온라인 사용자 목록 처리
                if (
                  onlineStatusResponse.onlineUsers &&
                  Array.isArray(onlineStatusResponse.onlineUsers)
                ) {
                  console.log('👥 전체 온라인 사용자 목록:', onlineStatusResponse.onlineUsers)
                  // 전체 온라인 사용자 목록을 한 번에 전달
                  if (callbacks.onOnlineStatus) {
                    callbacks.onOnlineStatus(onlineStatusResponse)
                  }
                } else {
                  console.log('👤 단일 사용자 상태:', onlineStatusResponse)
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

          // 구독 저장
          this.subscriptions.set('class', classSubscription)
          this.subscriptions.set('online', onlineSubscription)

          // 사용자 입장 메시지 전송
          this.addUser(channelName, userId, senderName, senderRole)

          // 접속 상태 업데이트
          this.updateOnlineStatus(channelName, userId, senderName, senderRole, 'ONLINE')

          // 접속 알림 전송
          this.sendOnlineStatus(channelName, userId, true)

          // 연결 완료 후 전체 온라인 상태 조회 (약간의 지연 후)
          setTimeout(() => {
            this.getOnlineStatus(channelName, userId)
          }, 500)

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

  sendMessage(channelName, message) {
    if (this.connected && this.stompClient) {
      try {
        const messageData = {
          ...message,
          channelName: channelName,
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

  sendOnlineStatus(channelName, userId, isOnline) {
    if (this.connected && this.stompClient) {
      try {
        const status = {
          userId: userId,
          channelName: channelName,
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

  updateOnlineStatus(channelName, userId, userName, userRole, status) {
    if (this.connected && this.stompClient) {
      try {
        const statusData = {
          channelName: channelName,
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

  getOnlineStatus(channelName, userId) {
    if (this.connected && this.stompClient) {
      try {
        const requestData = {
          channelName: channelName,
          userId: userId,
          timestamp: new Date().toISOString(),
        }

        console.log('📡 getOnlineStatus 요청 보냄:', requestData)

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

  addUser(channelName, userId, senderName, senderRole) {
    if (this.connected && this.stompClient) {
      try {
        const userData = {
          channelName: channelName,
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

  removeUser(channelName, userId, senderName, senderRole) {
    if (this.connected && this.stompClient) {
      try {
        const userData = {
          channelName: channelName,
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
