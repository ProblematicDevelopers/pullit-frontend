<template>
  <div class="app-container">
    <Header />
    <main class="main">
      <router-view /> <!-- 페이지별 콘텐츠 표시 -->
    </main>
    <Footer />
  </div>
</template>
<script>
import HelloWorld from './components/HelloWorld.vue'
import ApiTest from './components/ApiTest.vue'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'

export default {
  components: { Header, Footer, HelloWorld, ApiTest }
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
</style>
