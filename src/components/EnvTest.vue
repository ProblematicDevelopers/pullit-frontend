<template>
  <div class="env-test">
    <h3>환경 변수 확인</h3>
    <ul>
      <li>VITE_TINYMCE_KEY: {{ envKey }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const envKey = ref('')

onMounted(() => {
  envKey.value = import.meta.env.VITE_TINYMCE_KEY || '(없음)'
  console.log('EnvTest.vue: VITE_TINYMCE_KEY =', envKey.value)
})
</script>

<style scoped>
.env-test {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f8f9fa;
}
</style>
