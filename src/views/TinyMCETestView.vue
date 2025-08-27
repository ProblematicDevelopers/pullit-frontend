<template>
  <div class="tinymce-test-view">
    <div class="container">

      <!-- TinyMCE 테스트 에디터 -->
      <div class="test-section">
        <h2>TinyMCE 테스트 에디터</h2>
        <p>기본 TinyMCE 에디터의 기능을 테스트합니다.</p>

        <TinyMCETestComponent
          v-model="editorContent"
          :show-math-tools="true"
          :show-output="true"
          :readonly="isReadonly"
        />

        <div class="control-panel">
          <label class="readonly-toggle">
            <input type="checkbox" v-model="isReadonly" />
            <span class="toggle-label">읽기 전용 모드</span>
          </label>
          <div class="status-indicator">
            현재 상태: <span :class="['status', isReadonly ? 'readonly' : 'editable']">
              {{ isReadonly ? '읽기 전용' : '편집 가능' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TinyMCETestComponent from '@/components/item-process/TinyMCETestComponent.vue'

export default {
  name: 'TinyMCETestView',
  components: {
    TinyMCETestComponent
  },
  data() {
    return {
      editorContent: '<p>기본 에디터 테스트 내용입니다.</p>',
      isReadonly: false
    }
  },
  methods: {
    // 기본 메서드 (필요시 추가)
  }
}
</script>

<style scoped>
.tinymce-test-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', Arial, sans-serif;
}

.container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.header h1 {
  margin: 0 0 15px 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.test-section {
  padding: 30px;
}

.test-section h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 1.8rem;
  border-bottom: 3px solid #3b82f6;
  padding-bottom: 10px;
}

.test-section p {
  margin: 0 0 20px 0;
  color: #6b7280;
  font-size: 1rem;
}

.control-panel {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.readonly-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.readonly-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.toggle-label {
  font-weight: 500;
  color: #374151;
}

.status-indicator {
  font-size: 0.9rem;
  color: #6b7280;
}

.status.readonly {
  color: #dc2626;
  font-weight: 600;
}

.status.editable {
  color: #059669;
  font-weight: 600;
}

@media (max-width: 768px) {
  .tinymce-test-view {
    padding: 15px;
  }

  .header {
    padding: 30px 20px;
  }

  .header h1 {
    font-size: 2rem;
  }

  .test-section {
    padding: 20px;
  }

  .control-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
}
</style>
