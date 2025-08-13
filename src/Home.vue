<template>
  <div class="home-container">
    <h1>Pullit Frontend</h1>
    
    <!-- 시험지 마법사 테스트 섹션 -->
    <div class="test-section">
      <h2>시험지 마법사 테스트</h2>
      <p>새창 팝업으로 시험지 생성 마법사를 테스트해보세요.</p>
      
      <button 
        @click="openTestWizard"
        class="btn btn-primary btn-lg"
      >
        시험지 만들기 마법사 열기
      </button>
      
      <!-- 팝업 결과 표시 영역 -->
      <div v-if="wizardResult" class="result-section">
        <h3>마법사 완료 결과:</h3>
        <pre>{{ JSON.stringify(wizardResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 홈 페이지 컴포넌트
 * 시험지 마법사 팝업 테스트를 위한 기본 페이지입니다.
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { openTestWizardPopup, listenToPopupMessages } from '@/utils/popup'

// 마법사 완료 결과를 저장할 반응형 변수
const wizardResult = ref(null)

// 팝업 메시지 리스너 해제 함수
let removeMessageListener = null

/**
 * 컴포넌트 마운트 시 팝업 메시지 리스너 등록
 */
onMounted(() => {
  // 팝업으로부터의 메시지 수신 리스너 등록
  removeMessageListener = listenToPopupMessages((eventType, data) => {
    console.log('팝업 메시지 수신:', eventType, data)
    
    switch (eventType) {
      case 'POPUP_CLOSING':
        // 팝업이 닫힐 때의 결과 데이터 처리
        if (data && data.action === 'completed') {
          wizardResult.value = data
          console.log('마법사 완료됨:', data)
        }
        break
        
      case 'RESEARCH_REQUESTED':
        // 재검색 요청 처리
        console.log('재검색 요청됨')
        alert('재검색 기능은 향후 구현 예정입니다.')
        break
        
      case 'SHOW_SCOPE_REQUESTED':
        // 출제범위 보기 요청 처리
        console.log('출제범위 요청됨:', data)
        break
        
      case 'STEP_CHANGED':
        // 단계 변경 알림
        console.log('단계 변경됨:', data.step)
        break
    }
  })
  
  // 마법사 완료 커스텀 이벤트 리스너
  window.addEventListener('wizardCompleted', handleWizardCompleted)
})

/**
 * 컴포넌트 언마운트 시 리스너 정리
 */
onUnmounted(() => {
  if (removeMessageListener) {
    removeMessageListener()
  }
  window.removeEventListener('wizardCompleted', handleWizardCompleted)
})

/**
 * 시험지 마법사 팝업 열기
 */
const openTestWizard = async () => {
  try {
    // 테스트용 과목 데이터
    const subjectData = {
      id: 1,
      name: '수학 1',
      curriculum: '이준열(2015)',
      publisher: '이준열',
      grade: '고등학교 1학년'
    }
    
    // 팝업 열기
    const popup = openTestWizardPopup({
      subject: subjectData,
      width: 1200,
      height: 800
    })
    
    if (popup) {
      console.log('시험지 마법사 팝업이 열렸습니다.')
    } else {
      alert('팝업을 열 수 없습니다. 브라우저의 팝업 차단을 해제해주세요.')
    }
    
  } catch (error) {
    console.error('팝업 열기 실패:', error)
    alert('팝업을 열 수 없습니다.')
  }
}

/**
 * 마법사 완료 이벤트 핸들러
 * @param {CustomEvent} event - 완료 이벤트
 */
const handleWizardCompleted = (event) => {
  wizardResult.value = event.detail
  console.log('마법사 완료 이벤트 수신:', event.detail)
}
</script>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-section {
  margin-top: 2rem;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.test-section h2 {
  margin-top: 0;
  color: #111827;
}

.test-section p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.result-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.result-section h3 {
  margin-top: 0;
  color: #059669;
}

.result-section pre {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
