<template>
  <div class="app-container">
    <!-- 팝업 창이 아닐 때만 헤더 표시 -->
    <Header v-if="!isPopup" />
    <main class="main" :class="{ 'popup-main': isPopup }">
      <router-view /> <!-- 페이지별 콘텐츠 표시 -->
    </main>
    <!-- 팝업 창이 아닐 때만 푸터 표시 -->
    <Footer v-if="!isPopup" />
    
    <!-- 전역 Toast 컴포넌트 -->
    <Toast />
  </div>
</template>
<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'
import Toast from '@/components/common/Toast.vue'

export default {
  components: { Header, Footer, Toast },
  setup() {
    const route = useRoute()
    
    // 팝업 창인지 확인 (라우터 메타 정보 또는 경로로 판단)
    const isPopup = computed(() => {
      // wizard 경로이거나 메타에 isPopup이 true인 경우
      // 또는 로그인 페이지인 경우 헤더/푸터 숨김
      return route.path.includes('/exam/wizard') || 
             route.path.includes('/test-wizard') || 
             route.meta.isPopup === true ||
             route.meta.hideHeader === true
    })
    
    return {
      isPopup
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

.main {
  flex: 1;
  width: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

/* 팝업 창일 때 main의 padding 제거 및 전체 화면 사용 */
.main.popup-main {
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}
</style>
