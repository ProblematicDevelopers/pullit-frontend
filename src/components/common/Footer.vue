<template>
  <div>
    <footer class="footer">
      <p>{{ footerText }}</p>
    </footer>
  </div>
</template>

<script>
import { useLayoutStore } from '@/store/layoutStore.js'
import { storeToRefs } from 'pinia'

export default {
  // eslint-disable-next-line vue/multi-word-component-names,vue/no-reserved-component-names
  name:"Footer",
  setup() {
    const layoutStore = useLayoutStore()
    const { footerText } = storeToRefs(layoutStore)

    return { footerText }
  }
}
</script>

<style scoped>
.footer {
  background: #eee;
  padding: 1rem;
  text-align: center;
}
</style>
