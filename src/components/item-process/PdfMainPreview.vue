<template>
  <div class="main-preview">
    <!-- 큰 미리보기 영역 -->
    <div class="large-preview">
      <div v-if="currentPage" class="pdf-container">
        <!-- 이미지 미리보기 -->
        <img
          v-if="currentPage.preview"
          :src="currentPage.preview"
          :alt="`페이지 ${currentPageIndex + 1}`"
          class="pdf-preview-image"
        />
        <!-- 페이지 번호 오버레이 -->
        <div class="page-number-overlay">
          {{ currentPageIndex + 1 }}
        </div>
      </div>
      <!-- 페이지가 없을 때 안내 메시지 -->
      <div v-else class="no-page-message">
        <div class="no-page-icon">📄</div>
        <p>편집할 페이지가 없습니다</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'PdfMainPreview',
  props: {
    pdfPages: {
      type: Array,
      required: true
    },
    currentPageIndex: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // 현재 페이지 정보
    const currentPage = computed(() => {
      return props.pdfPages[props.currentPageIndex] || null
    })

    return {
      currentPage
    }
  }
}
</script>

<style scoped>
/* 왼쪽: 메인 미리보기 */
.main-preview {
  flex: 0.65 0 700px;
  display: flex;
  flex-direction: column;
  min-height: 700px;
}

.large-preview {
  flex: 1;
  min-height: 700px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pdf-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-preview-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  border: none;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.page-number-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  z-index: 10;
}

.no-page-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
}

.no-page-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>
