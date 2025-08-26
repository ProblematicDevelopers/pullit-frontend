<template>
  <div class="live-exam-container">
    <div class="container-fluid py-4">
      <!-- 헤더 -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="text-center mb-3">시험 대기실</h2>
          <div class="alert alert-info" role="alert">
            <i class="bi bi-clock me-2"></i>
            시험이 시작될 때까지 잠시 기다려주세요.
          </div>
        </div>
      </div>

      <!-- 시험 정보 표시 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-info-circle me-2"></i>
                시험 정보
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 이름:</strong>
                    <span class="ms-2">{{ examInfo.examName || '로딩 중...' }}</span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 유형:</strong>
                    <span class="ms-2">{{ examInfo.examType || '-' }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 시간:</strong>
                    <span class="ms-2">{{ examInfo.timeLimit || '-' }}분</span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">과목:</strong>
                    <span class="ms-2">{{ examInfo.areaName || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import {} from 'vue-router'

// 웹소켓 관련 변수들
let connectWebSocket = null
let disconnectWebSocket = null
onMounted(async () => {
  // 웹소켓 연결 (loadClassData에서 초기화된 후)
  if (connectWebSocket) {
    await connectWebSocket({
      onChatMessage: (message) => {
        console.log('실시간 시험 채팅 메시지 수신:', message)
      },
      onOnlineStatus: (status) => {
        console.log('실시간 시험 온라인 상태 변경:', status)
      },
    })
  }
})

// 컴포넌트 언마운트 시 웹소켓 연결 해제
onUnmounted(() => {
  if (disconnectWebSocket) {
    disconnectWebSocket()
  }
})
</script>

<style scoped>
.live-exam-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.info-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
}

.online-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dc3545;
  transition: background-color 0.3s;
}

.online-indicator.active {
  background: #28a745;
}

.chat-messages {
  background: #f8f9fa;
}

.message {
  margin-bottom: 8px;
}

.alert {
  border-left: 4px solid #0dcaf0;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}
</style>
