<template>
  <div class="cbt-step02-container">
    <div class="container-fluid py-4">
      <!-- 헤더 -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="text-center mb-3">CBT 생성 완료</h2>
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle me-2"></i>
            CBT가 성공적으로 생성되었습니다!
          </div>
        </div>
      </div>

      <!-- CBT 정보 표시 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-info-circle me-2"></i>
                CBT 정보
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 이름:</strong>
                    <span class="ms-2">{{ examName || '로딩 중...' }}</span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">생성 시간:</strong>
                    <span class="ms-2">{{ currentTime }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="info-item mb-3">
                    <strong class="text-muted">문항 수:</strong>
                    <span class="ms-2">{{ cbtData?.questionCount || '-' }}개</span>
                  </div>
                  <div class="info-item mb-3">
                    <strong class="text-muted">시험 시간:</strong>
                    <span class="ms-2">{{ cbtData?.timeLimit || '-' }}분</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="row mt-4">
        <div class="col-12 text-center">
          <button class="btn btn-primary btn-lg me-3" @click="startCBT">
            <i class="bi bi-play-circle me-2"></i>
            CBT 시작하기
          </button>
          <button class="btn btn-outline-secondary btn-lg" @click="goBack">
            <i class="bi bi-arrow-left me-2"></i>
            뒤로 가기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// CBT 데이터 상태
const examId = ref(null)
const examName = ref(null)
const examType = ref(null)
const cbtData = ref(null)
const currentTime = ref('')

// 라우터에서 전달된 데이터 받기
onMounted(() => {
  // 2. 세션스토리지에서 CBT ID 가져오기 (쿼리에 없을 경우)
  const storedExamData = sessionStorage.getItem('examData')
  if (storedExamData) {
    try {
      examId.value = JSON.parse(storedExamData).examId;
      examName.value = JSON.parse(storedExamData).examName;
      examType.value = JSON.parse(storedExamData).examType;
    } catch (error) {
      console.error('CBT 데이터 파싱 오류:', error)
    }
  }

  // 3. 세션스토리지에서 CBT 데이터 가져오기
  const storedCbtData = sessionStorage.getItem('cbtData')
  if (storedCbtData) {
    try {
      cbtData.value = JSON.parse(storedCbtData)
      console.log('세션스토리지에서 받은 CBT 데이터:', cbtData.value)
    } catch (error) {
      console.error('CBT 데이터 파싱 오류:', error)
    }
  }


  // 현재 시간 설정
  currentTime.value = new Date().toLocaleString('ko-KR')

  // 데이터가 없으면 에러 처리
  if (!examId.value) {
    console.error('CBT ID를 찾을 수 없습니다.')
    alert('CBT 정보를 찾을 수 없습니다. 다시 시도해주세요.')
    router.push('/student/cbtstep01')
  }
})

// 컴포넌트 언마운트 시 세션스토리지 정리
onUnmounted(() => {
  sessionStorage.removeItem('cbtData')
  sessionStorage.removeItem('examData')
})

// CBT 시작 함수
function startCBT() {
  if (examId.value) {
    // 팝업 창 설정
    const popupFeatures = [
      'width=' + screen.width,
      'height=' + screen.height,
      'left=0',
      'top=0',
      'scrollbars=yes',
      'resizable=yes',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
      'directories=no',
      'fullscreen=yes'
    ].join(',')

    // 전체화면 팝업 창으로 CBT 시험 페이지 열기
    const examUrl = `/student/cbt/exam/${examId.value}`
    const popupWindow = window.open(examUrl, 'cbt_exam', popupFeatures)

    // 팝업 창이 차단되었는지 확인
    if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
      alert('팝업이 차단되었습니다.\n\n팝업 차단을 해제하는 방법:\n1. 브라우저 주소창 옆의 팝업 차단 아이콘 클릭\n2. "팝업 허용" 선택\n3. 다시 시도해주세요.')
      return
    }

    // 팝업 창이 열리면 포커스 이동
    popupWindow.focus()

    // 팝업 창이 닫힐 때 감지
    const checkClosed = setInterval(() => {
      if (popupWindow.closed) {
        clearInterval(checkClosed)
        console.log('CBT 팝업 창이 닫혔습니다.')
        // 팝업 창이 닫히면 세션스토리지 정리
        sessionStorage.removeItem('cbtData')
        sessionStorage.removeItem('examData')
      }
    }, 1000)

    // 세션스토리지 정리 (CBT 시작 시)
    sessionStorage.removeItem('cbtData')
    sessionStorage.removeItem('examData')

    // 현재 창을 메인 페이지로 이동
    router.push('/student/main')
  } else {
    alert('CBT ID가 없습니다.')
  }
}

// 뒤로 가기 함수
function goBack() {
  // 세션스토리지 정리
  sessionStorage.removeItem('cbtData')
  sessionStorage.removeItem('examData')
  router.push('/student/cbtstep01')
}
</script>

<style scoped>
.cbt-step02-container {
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

.chapter-item {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  border-left: 3px solid #0d6efd;
}

.unit-item {
  padding: 0.25rem 0;
  color: #6c757d;
}

.alert {
  border-left: 4px solid #198754;
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
