<template>
  <div class="forbidden">
    <div class="card">
      <h1>403</h1>
      <p>접근 권한이 없습니다.</p>
      <router-link to="/">홈으로 이동</router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.forbidden {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}
.card {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  text-align: center;
}
h1 {
  margin: 0 0 8px;
  font-size: 40px;
}
p {
  margin: 0 0 16px;
  color: #6b7280;
}
a {
  color: #2563eb;
  text-decoration: none;
}
a:hover { text-decoration: underline; }
</style>

