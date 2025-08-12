<template>
  <header class="header">
    <h1>{{ headerTitle }}</h1>
    <nav>
      <router-link to="/">홈</router-link> |
      <router-link to="/statistics">통계</router-link>
    </nav>
  </header>
</template>

<script>
import { useLayoutStore } from '@/store/layoutStore'
import { storeToRefs } from 'pinia'

export default {
  setup() {
    const layoutStore = useLayoutStore()
    const { headerTitle } = storeToRefs(layoutStore)
    return { headerTitle }
  }
}
</script>
