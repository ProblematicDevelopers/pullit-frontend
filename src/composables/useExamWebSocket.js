import { ref, onMounted, onUnmounted } from 'vue'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

export function useExamWebSocket(classId) {
  const stompClient = ref(null)
  const connected = ref(false)
  const examStatusCallbacks = ref([])

  // WebSocket 연결
  const connect = () => {
    const socket = new SockJS('http://localhost:8080/ws')
    stompClient.value = Stomp.over(socket)
    
    // 디버그 모드 비활성화
    stompClient.value.debug = () => {}
    
    stompClient.value.connect(
      {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      },
      (frame) => {
        console.log('WebSocket 연결 성공:', frame)
        connected.value = true
        
        // 클래스별 시험 상태 구독
        if (classId) {
          subscribeToExamStatus(classId)
        }
      },
      (error) => {
        console.error('WebSocket 연결 실패:', error)
        connected.value = false
        // 재연결 시도
        setTimeout(() => connect(), 5000)
      }
    )
  }

  // 시험 상태 구독
  const subscribeToExamStatus = (classId) => {
    if (!stompClient.value || !connected.value) {
      console.warn('WebSocket이 연결되지 않았습니다')
      return
    }

    const destination = `/topic/class/${classId}/exam-status`
    console.log('시험 상태 구독:', destination)
    
    stompClient.value.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body)
        console.log('시험 상태 업데이트 수신:', data)
        
        // 등록된 콜백 함수들 실행
        examStatusCallbacks.value.forEach(callback => {
          callback(data)
        })
      } catch (error) {
        console.error('메시지 파싱 오류:', error)
      }
    })
  }

  // 시험 상태 콜백 등록
  const onExamStatusUpdate = (callback) => {
    examStatusCallbacks.value.push(callback)
  }

  // 연결 해제
  const disconnect = () => {
    if (stompClient.value) {
      stompClient.value.disconnect(() => {
        console.log('WebSocket 연결 해제')
        connected.value = false
      })
    }
  }

  // 컴포넌트 마운트/언마운트 시 자동 연결/해제
  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    disconnect,
    subscribeToExamStatus,
    onExamStatusUpdate
  }
}