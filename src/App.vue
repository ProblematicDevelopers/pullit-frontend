<template>
  <div class="app-container">
    <!-- 팝업 창이 아닐 때만 헤더 표시 -->
    <Header v-if="!isPopup" />
    <main class="main" :class="{ 'popup-main': isPopup }">
      <router-view /> <!-- 페이지별 콘텐츠 표시 -->
    </main>
    <!-- 팝업 창이 아닐 때만 푸터 표시 -->
    <Footer v-if="!isPopup" />
  </div>
</template>
<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import ApiTest from './components/ApiTest.vue'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'

export default {
  components: { Header, Footer, HelloWorld, ApiTest },
  setup() {
    const route = useRoute()
    
    // 팝업 창인지 확인 (라우터 메타 정보 또는 경로로 판단)
    const isPopup = computed(() => {
      // test-wizard 경로이거나 메타에 isPopup이 true인 경우
      return route.path.includes('/test-wizard') || route.meta.isPopup === true
    })
    
    return {
      isPopup
    }
  }
}
</script>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main {
  flex: 1;
  padding: 1rem;
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
}
</style>
