<template>
  <div class="item-processing-container">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">문제 등록</h1>
        <p class="page-subtitle">문제를 추가할 방법을 선택하세요</p>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="main-content">
      <div class="content-wrapper">
        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-section">
          <div class="loading-spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 선택 옵션들 -->
        <div v-else-if="options.length > 0" class="options-section">
          <div
            v-for="option in options"
            :key="option.code"
            class="option-card"
            @click="selectOption(option.code)"
          >
            <div class="option-icon">
              <svg viewBox="0 0 24 24" class="icon">
                <path v-if="option.code === 'TEXTBOOK'" d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"/>
                <path v-else-if="option.code === 'CBT'" d="M9 2H18C18.55 2 19 2.45 19 3V14L17 12V4H9V20H17V18L19 16V21C19 21.55 18.55 22 18 22H8C7.45 22 7 21.55 7 21V3C7 2.45 7.45 2 8 2H9M12 8L16 12L12 16L10.6 14.6L12.2 13H3V11H12.2L10.6 9.4L12 8Z"/>
                <path v-else d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            </div>
            <div class="option-content">
              <h3 class="option-title">{{ option.name }}</h3>
              <p class="option-description">{{ option.description }}</p>
            </div>
            <div class="option-arrow">
              <svg viewBox="0 0 24 24" class="arrow-icon">
                <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="error-section">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">데이터를 불러올 수 없습니다</h3>
          <p class="error-message">{{ error }}</p>
          <button @click="fetchOptions" class="retry-btn">다시 시도</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { useItemProcessingStore } from '@/store/itemProcessingStore'
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  export default {
    name: 'ItemProcessing',
    setup(){
      //피니아 사용
      const itemProcessingStore = useItemProcessingStore();
      const router = useRouter();

      //컴포넌트 마운트 시 데이터 로드
      onMounted(() => {
        itemProcessingStore.fetchOptions()
      })

      // 옵션 선택 시 라우터 이동
      const selectOption = (code) => {
        const route = itemProcessingStore.getOptionRoute(code);
        router.push(route);
      };

      return {
        loading: itemProcessingStore.loading,
        error: itemProcessingStore.error,
        options: itemProcessingStore.options,
        selectOption
      }
    }
  }
</script>

<style scoped>
.item-processing-container {
  min-height: 100vh;
  background: #f8fafc;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.header-content {
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.container {
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border: 2px solid transparent;
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.option-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  background: #eff6ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 32px;
  height: 32px;
  color: #3b82f6;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.option-description {
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.option-arrow {
  flex-shrink: 0;
}

.arrow-icon {
  width: 24px;
  height: 24px;
  color: #9ca3af;
  transition: color 0.2s;
}

.option-card:hover .arrow-icon {
  color: #3b82f6;
}

/* 로딩 상태 */
.loading-section {
  text-align: center;
  padding: 3rem 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-section p {
  color: #64748b;
  font-size: 1.1rem;
}

/* 에러 상태 */
.error-section {
  text-align: center;
  padding: 3rem 0;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #dc2626;
  margin: 0 0 1rem 0;
}

.error-message {
  color: #64748b;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 2rem 1rem;
  }

  .page-header {
    padding: 2rem 0;
  }

  .page-title {
    font-size: 2rem;
  }

  .option-card {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
  }

  .option-icon {
    width: 56px;
    height: 56px;
  }

  .icon {
    width: 28px;
    height: 28px;
  }
}
</style>
