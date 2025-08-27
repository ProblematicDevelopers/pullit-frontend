  <template>
    <div class="tinymce-test-view container-fluid w-100">
      <!-- TinyMCE 테스트 에디터 -->
      <TinyMCETestComponent
            v-model="editorContent"
            :show-math-tools="true"
            :show-output="true"
            :readonly="isReadonly"
        />

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
    margin: 0 auto;
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

    .control-panel {
      flex-direction: column;
      align-items: stretch;
      gap: 15px;
    }
  }
  </style>
