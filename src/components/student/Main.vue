<!-- src/components/student/StudentMain.vue -->
<template>
  <div class="hero-wrap py-5">
    <!-- 기능 카드 3개 -->
    <div class="container mt-4">
      <div class="row g-4">
        <!-- 1) AI 문제은행 시스템 -->
        <div class="col-12 col-md-6 col-lg-4">
          <router-link to="/student/cbt/step01" class="text-decoration-none">
            <div class="card feature-card active h-100 rounded-4 border-0 shadow-sm">
              <div class="card-body p-4">
                <!-- 아이콘 + NEW 뱃지 -->
                <div class="d-flex align-items-start justify-content-between">
                  <div class="icon-blob">
                    <!-- 간단한 문서 아이콘 SVG -->
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2
                      2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <span class="badge rounded-pill bg-success-subtle text-success fw-semibold"
                    >NEW</span
                  >
                </div>

                <h4 class="mt-3 mb-2 text-dark fw-bold">문제은행 CBT</h4>
                <p class="text-secondary mb-3">
                  문제은행에서 15,000+ 검증된 문제를 스마트하게 분석하여 실시간으로 CBT를
                  출제합니다. 과목별, 단원별 체계적인 분류로 다양한 문제를 쉽게 찾고 바로 풀 수
                  있습니다.
                </p>

                <ul class="list-unstyled m-0 text-secondary small">
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 방대한 문제 은행 데이터
                  </li>
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 다양한 검증 교과서 기반 문제 지원
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <span class="check text-success">✓</span> 실시간 생성 & 원하는 단원 필터링
                  </li>
                </ul>
              </div>
            </div>
          </router-link>
        </div>

        <!-- 2) 스마트 시험지 생성 -->
        <div class="col-12 col-md-6 col-lg-4">
          <router-link to="/student/class-room/my-class" class="text-decoration-none">
            <div class="card feature-card h-100 rounded-4 border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex align-items-start justify-content-between">
                  <div class="icon-blob">
                    <!-- 캘린더 느낌 아이콘 -->
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2v2M17 2v2M3 7h18M5 22h14a2 2 0 0 0 2-2V7H3v13a2 2 0 0 0 2 2Z" />
                    </svg>
                  </div>
                  <span class="badge rounded-pill bg-warning-subtle text-warning fw-semibold"
                    >HOT</span
                  >
                </div>

                <h4 class="mt-3 mb-2 text-dark fw-bold">똑똑한 우리반</h4>
                <p class="text-secondary mb-3">
                  똑똑한 우리반과 함께라면, 온라인 시험도 교실처럼 실시간으로! 체계적으로 공정한
                  시험 경험을 제공합니다. 모두가 동시에 풀고 즉시 결과를 확인해보세요!
                </p>

                <ul class="list-unstyled m-0 text-secondary small">
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 교실처럼 모두가 동시에 시작하는 실시간
                    시험
                  </li>
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 문제 풀이 후 즉시 확인되는 결과
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <span class="check text-success">✓</span> 공정하고 투명한 온라인 시험 환경
                  </li>
                </ul>
              </div>
            </div>
          </router-link>
        </div>

        <!-- 3) 심화 성적 분석 -->
        <div class="col-12 col-md-6 col-lg-4">
          <router-link to="/student/report" class="text-decoration-none">
            <div class="card feature-card h-100 rounded-4 border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex align-items-start justify-content-between">
                  <div class="icon-blob">
                    <!-- 차트 아이콘 -->
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3v18h18M7 15v3M11 12v6M15 9v9M19 6v12" />
                    </svg>
                  </div>
                </div>

                <h4 class="mt-3 mb-2 text-dark fw-bold">시험 성적 분석</h4>
                <p class="text-secondary mb-3">
                  점수만 확인하는 시대는 끝! 평가 결과 요약으로 큰 그림을 보고, 문항 분석 리포트로
                  세부 데이터를 파악하며, 성적 분석으로 학습 성장을 이끌어갑니다.
                </p>

                <ul class="list-unstyled m-0 text-secondary small">
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 성적 분석
                  </li>
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 문항 분석 리포트
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <span class="check text-success">✓</span> 평가 결과 요약
                  </li>
                </ul>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import wsService from '@/services/websocket'
import classApi from '@/services/classApi'

// 현재 사용자 정보
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const classInfo = ref(null)

// WebSocket 연결 함수
const connectToClassWebSocket = async () => {
  try {
    // 학생의 반 정보 조회
    const response = await classApi.getStudentClass()
    if (response.data && response.data.success && response.data.data) {
      classInfo.value = response.data.data

      // WebSocket 연결
      if (classInfo.value.classId) {
        const userId = userInfo.value.id || userInfo.value.userId
        const userName = userInfo.value.fullName || userInfo.value.name
        const channelName = `class-${classInfo.value.classId}`

        console.log('🎓 학생 WebSocket 연결 시작:', {
          classId: classInfo.value.classId,
          userId: userId,
          userName: userName,
          channelName: channelName
        })

        // 기존 연결이 있으면 끊기
        if (wsService.isConnected()) {
          wsService.disconnect()
        }

        // 새로 연결
        await wsService.connect(
          channelName,
          userId,
          userName,
          'STUDENT',
          {
            onOnlineStatus: (status) => {
              console.log('📡 학생 온라인 상태 업데이트:', status)
            }
          }
        )

        console.log('✅ 학생 WebSocket 연결 성공')

        // 온라인 상태 전송
        wsService.updateOnlineStatus(channelName, userId, userName, 'STUDENT', 'ONLINE')
      }
    }
  } catch (error) {
    console.error('❌ 학생 WebSocket 연결 실패:', error)
  }
}

onMounted(() => {
  // 학생이 로그인하면 바로 WebSocket 연결
  if (userInfo.value && userInfo.value.role === 'STUDENT') {
    connectToClassWebSocket()
  }
})

onUnmounted(() => {
  // 페이지를 떠날 때 연결 해제
  if (wsService.isConnected()) {
    const userId = userInfo.value.id || userInfo.value.userId
    const userName = userInfo.value.fullName || userInfo.value.name
    const channelName = classInfo.value ? `class-${classInfo.value.classId}` : null

    if (channelName) {
      // 오프라인 상태 전송
      wsService.updateOnlineStatus(channelName, userId, userName, 'STUDENT', 'OFFLINE')
      wsService.removeUser(channelName, userId, userName, 'STUDENT')
    }

    wsService.disconnect()
  }
})
</script>

<style scoped>
/* 배경 영역 (연한 회색 + 패턴 느낌) */
.hero-wrap {
  background: linear-gradient(180deg, #f6f8fc 0%, #f8fafc 100%);
  min-height: 60vh;
}

/* 상단 탭 감싸는 영역 여백/둥근모서리 */
.nav-surface {
  border-radius: 18px;
}

/* 카드 공통 */
.feature-card {
  transition:
    box-shadow 0.2s ease,
    transform 0.15s ease,
    border-color 0.2s ease;
  background-color: #fff;
}

.feature-card.active {
  box-shadow: 0 10px 24px rgba(33, 114, 255, 0.08) !important;
}

/* hover 효과 */
.feature-card:hover {
  transform: translateY(-2px);
  outline: 2px solid rgba(33, 114, 255, 0.35);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
}

/* 아이콘 파란 원형 배경 */
.icon-blob {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #0d6efd; /* Bootstrap primary */
  color: #fff;
  box-shadow: 0 6px 18px rgba(13, 110, 253, 0.2);
}

/* 체크 마크 정렬용 */
.check {
  line-height: 1.2;
  font-weight: 700;
}
</style>
