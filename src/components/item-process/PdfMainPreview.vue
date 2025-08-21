<template>
  <div class="main-preview">
    <!-- 큰 미리보기 영역 -->
    <div class="large-preview">
      <iframe
        v-if="currentPage"
        :src="currentPage.preview"
        :title="`페이지 ${currentPageIndex + 1} 미리보기`"
        class="pdf-large-frame"
        frameborder="0"
      ></iframe>
      <!-- 페이지가 없을 때 안내 메시지 -->
      <div v-else class="no-page-message">
        <div class="no-page-icon">📄</div>
        <p>편집할 페이지가 없습니다</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PdfMainPreview',
  props: {
    currentPage: {
      type: Object,
      default: null
    },
    currentPageIndex: {
      type: Number,
      required: true
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

.pdf-large-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #f8fafc;
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
