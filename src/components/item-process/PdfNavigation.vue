<template>
  <div class="navigation-buttons">
    <button @click="$emit('go-back')" class="btn btn-secondary">뒤로가기</button>
    <button @click="$emit('next-step')" class="btn btn-primary">다음</button>
  </div>
</template>

<script>
export default {
  name: 'PdfNavigation',
  emits: ['go-back', 'next-step']
}
</script>

<style scoped>
/* 네비게이션 버튼들 */
.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 3rem;
}

/* 버튼 스타일 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.1s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #475569;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .navigation-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
