<template>
  <div class="rich-editor-with-math">
    <!-- 수식 툴바 -->
    <div class="math-toolbar">
      <div class="toolbar-section">
        <h6>수식 도구</h6>
        <div class="math-buttons">
          <button
            v-for="tool in mathTools"
            :key="tool.name"
            @click="insertMath(tool.latex)"
            class="btn btn-sm btn-outline-primary me-2 mb-2"
            :title="tool.description"
          >
            <i :class="tool.icon"></i>
            {{ tool.name }}
          </button>
        </div>
      </div>

      <div class="toolbar-section">
        <h6>커스텀 수식</h6>
        <div class="custom-math-input">
          <input
            v-model="customLatex"
            type="text"
            placeholder="LaTeX 수식 입력..."
            class="form-control form-control-sm mb-2"
            @keyup.enter="insertCustomMath"
          />
          <button
            @click="insertCustomMath"
            class="btn btn-sm btn-primary"
            :disabled="!customLatex.trim()"
          >
            삽입
          </button>
        </div>
      </div>
    </div>

    <!-- TinyMCE 에디터 -->
    <div class="editor-container">
      <TinyMCEEditor
        ref="tinyMceEditor"
        v-model="editorContent"
        :init="editorConfig"
        @onInit="onEditorInit"
        @onChange="onContentChange"
        class="math-editor"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import TinyMCEEditor from './TinyMCEEditor.vue'

export default {
  name: 'RichEditorWithMath',
  components: {
    TinyMCEEditor
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '내용을 입력하세요...'
    },
    height: {
      type: [String, Number],
      default: 400
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const tinyMceEditor = ref(null)
    const editorInstance = ref(null)
    const editorContent = ref(props.modelValue)
    const customLatex = ref('')

    // 수식 도구 정의
    const mathTools = ref([
      {
        name: '분수',
        latex: '\\frac{a}{b}',
        icon: 'bi bi-divide',
        description: '분수 삽입'
      },
      {
        name: '제곱근',
        latex: '\\sqrt{x}',
        icon: 'bi bi-square-root',
        description: '제곱근 삽입'
      },
      {
        name: '적분',
        latex: '\\int_{a}^{b} f(x) dx',
        icon: 'bi bi-integral',
        description: '적분 기호 삽입'
      },
      {
        name: '극한',
        latex: '\\lim_{x \\to \\infty}',
        icon: 'bi bi-arrow-right',
        description: '극한 기호 삽입'
      },
      {
        name: '시그마',
        latex: '\\sum_{i=1}^{n}',
        icon: 'bi bi-plus-circle',
        description: '합계 기호 삽입'
      },
      {
        name: '행렬',
        latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        icon: 'bi bi-grid-3x3',
        description: '행렬 삽입'
      },
      {
        name: '절댓값',
        latex: '|x|',
        icon: 'bi bi-vertical-bar',
        description: '절댓값 기호 삽입'
      },
      {
        name: '지수',
        latex: 'x^{n}',
        icon: 'bi bi-arrow-up',
        description: '지수 삽입'
      }
    ])

    // TinyMCE 설정
    const editorConfig = computed(() => ({
      height: props.height,
      menubar: false,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | bold italic backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | help',
      content_style: `
        body { font-family: 'Noto Sans KR', Arial, sans-serif; }
        .math { font-family: 'Times New Roman', serif; }
      `,
      placeholder: props.placeholder,
      readonly: props.readonly,
      setup: (editor) => {
        // MathJax 통합을 위한 커스텀 명령어
        editor.addCommand('insertMath', (latex) => {
          const mathContent = `$${latex}$`
          editor.insertContent(mathContent)

          // MathJax 렌더링 (MathJax가 로드된 경우)
          if (window.MathJax) {
            nextTick(() => {
              window.MathJax.typesetPromise([editor.getBody()])
            })
          }
        })
      }
    }))

    // 에디터 초기화 완료 시
    const onEditorInit = (editor) => {
      editorInstance.value = editor
      console.log('TinyMCE 에디터 초기화 완료')
    }

    // 내용 변경 시
    const onContentChange = (content) => {
      editorContent.value = content
      emit('update:modelValue', content)
      emit('change', content)
    }

    // 수식 삽입
    const insertMath = (latex) => {
      if (editorInstance.value) {
        editorInstance.value.execCommand('insertMath', false, latex)
      } else {
        // fallback: textarea에 직접 삽입
        insertToTextarea(latex)
      }
    }

    // 커스텀 수식 삽입
    const insertCustomMath = () => {
      if (customLatex.value.trim()) {
        insertMath(customLatex.value)
        customLatex.value = ''
      }
    }

    // textarea fallback 삽입
    const insertToTextarea = (latex) => {
      const textarea = document.querySelector('.math-editor textarea')
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        const before = text.substring(0, start)
        const after = text.substring(end, text.length)
        const mathContent = `$${latex}$`

        textarea.value = before + mathContent + after
        textarea.selectionStart = textarea.selectionEnd = start + mathContent.length
        textarea.focus()

        // 내용 업데이트
        editorContent.value = textarea.value
        emit('update:modelValue', textarea.value)
      }
    }

    // props 변경 감지
    watch(() => props.modelValue, (newValue) => {
      if (newValue !== editorContent.value) {
        editorContent.value = newValue
        if (editorInstance.value) {
          editorInstance.value.setContent(newValue)
        }
      }
    })

    // readonly 변경 감지
    watch(() => props.readonly, (newValue) => {
      if (editorInstance.value) {
        editorInstance.value.setMode(newValue ? 'readonly' : 'design')
      }
    })

    return {
      tinyMceEditor,
      editorInstance,
      editorContent,
      customLatex,
      mathTools,
      editorConfig,
      onEditorInit,
      onContentChange,
      insertMath,
      insertCustomMath
    }
  }
}
</script>

<style scoped>
.rich-editor-with-math {
  display: flex;
  gap: 1rem;
  height: 100%;
}

.math-toolbar {
  width: 280px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  overflow-y: auto;
}

.toolbar-section {
  margin-bottom: 1.5rem;
}

.toolbar-section h6 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
}

.math-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.math-buttons .btn {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
}

.custom-math-input input {
  font-size: 0.875rem;
}

.editor-container {
  flex: 1;
  min-height: 400px;
}

.math-editor {
  height: 100%;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .rich-editor-with-math {
    flex-direction: column;
  }

  .math-toolbar {
    width: 100%;
    order: 2;
  }

  .editor-container {
    order: 1;
  }
}

/* 수식 버튼 호버 효과 */
.math-buttons .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

/* 커스텀 수식 입력 필드 포커스 */
.custom-math-input input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}
</style>
