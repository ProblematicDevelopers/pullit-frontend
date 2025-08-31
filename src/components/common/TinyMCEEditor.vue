<template>
  <div class="tinymce-editor-wrapper">
    <!-- 에디터 로딩 상태 표시 -->
    <div v-if="!editorReady" class="editor-loading">
      <div class="loading-spinner">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">에디터 로딩 중...</span>
        </div>
        <p class="mt-2 text-muted">TinyMCE 에디터를 초기화하는 중입니다...</p>
      </div>
    </div>

    <!-- 에디터 컨테이너 -->
    <div
      v-show="editorReady"
      class="editor-container"
      :class="{ 'editor-disabled': disabled }"
    >
      <!-- LaTeX 수식 삽입 버튼 (툴바) -->
      <div v-if="showMathToolbar" class="math-toolbar">
        <button
          @click="insertMath"
          class="btn btn-outline-primary btn-sm"
          :disabled="!editorReady || disabled"
          title="LaTeX 수식 삽입 (Cmd+E)"
        >
          <i class="bi bi-calculator me-1"></i>수식
        </button>
      </div>

      <!-- TinyMCE 에디터 -->
      <div class="tinymce-container">
        <Editor
          v-if="editorReady && !disabled"
          v-model="localContent"
          :init="editorConfig"
          :api-key="apiKey || import.meta.env.VITE_TINYMCE_KEY"
          @onInit="onEditorInit"
          @onChange="onEditorChange"
          @onKeyDown="onEditorKeyDown"
        />

        <!-- 비활성화 상태일 때 읽기 전용 표시 -->
        <div v-if="disabled" class="editor-disabled-content" v-html="localContent"></div>
      </div>

      <!-- 수식 편집 모달 -->
      <MathEditModal
        v-if="showMathEditModal"
        :show="showMathEditModal"
        :latex="editingMathLatex"
        @apply="applyMathEdit"
        @cancel="cancelMathEdit"
      />
    </div>

    <!-- 에디터 오류 표시 -->
    <div v-if="editorError" class="editor-error alert alert-danger mt-2" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      에디터 오류: {{ editorError }}
      <button @click="retryEditor" class="btn btn-outline-danger btn-sm ms-2">다시 시도</button>
    </div>
  </div>
</template>

<script>
import Editor from '@tinymce/tinymce-vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import MathEditModal from '../item-process/MathEditModal.vue'

export default {
  name: 'TinyMCEEditor',
  components: {
    Editor,
    MathEditModal
  },
  props: {
    // v-model 바인딩용
    modelValue: {
      type: String,
      default: ''
    },
    // 에디터 설정
    height: {
      type: [Number, String],
      default: 400
    },
    minHeight: {
      type: [Number, String],
      default: 300
    },
    maxHeight: {
      type: [Number, String],
      default: 800
    },
    // API 키
    apiKey: {
      type: String,
      default: ''
    },
    // 읽기 전용 모드
    readonly: {
      type: Boolean,
      default: false
    },
    // 비활성화 상태
    disabled: {
      type: Boolean,
      default: false
    },
    // 수식 도구 표시 여부
    showMathToolbar: {
      type: Boolean,
      default: true
    },
    // 커스텀 설정
    customConfig: {
      type: Object,
      default: () => ({})
    }
  },
  emits: [
    'update:modelValue',
    'editor-ready',
    'editor-change',
    'editor-error',
    'math-inserted'
  ],
  data() {
    return {
      // 에디터 상태
      editorReady: false,
      editorInstance: null,
      editorError: '',
      retryCount: 0,
      maxRetries: 3,

      // 로컬 콘텐츠 (v-model 동기화용)
      localContent: this.modelValue,

      // 수식 편집 관련
      showMathEditModal: false,
      editingMathLatex: '',
      editingMathElement: null,

      // 마운트 안전성 체크
      isMounted: false,
      mountCheckTimer: null
    }
  },
  computed: {
    // 에디터 설정
    editorConfig() {
      const baseConfig = {
        // 기본 설정
        height: this.height,
        min_height: this.minHeight,
        max_height: this.maxHeight,
        readonly: this.readonly,
        branding: false,
        promotion: false,
        menubar: true,
        statusbar: true,
        resize: true,
        language: 'ko',

        // 플러그인
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
          'nonbreaking', 'pagebreak', 'quickbars'
        ],

        // 툴바
        toolbar: 'undo redo | formatselect | bold italic underline strikethrough | ' +
                'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
                'link image media | codesample | table',

        // 콘텐츠 스타일
        content_style: `
          body {
            font-family: 'Noto Sans KR', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 !important;
            padding: 0 !important;
          }
          .math-latex {
            text-align: center;
            margin: 12px 0;
            padding: 4px 6px;
            font-size: 14px;
            color: #495057;
            border-radius: 4px;
            display: inline-block;
            cursor: pointer;
          }
          .math-latex:hover {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
          }
        `,

        // HTML 검증 설정
        verify_html: false,
        extended_valid_elements: 'span[*],div[*],svg[*],circle[*],rect[*],polygon[*],line[*],text[*],*[*]',
        custom_elements: '~math-latex',

        // 이미지 업로드 핸들러
        images_upload_handler: this.handleImageUpload,

        // 에디터 설정 함수
        setup: this.setupEditor
      }

      // 커스텀 설정과 병합
      return { ...baseConfig, ...this.customConfig }
    }
  },
  watch: {
    // v-model 동기화
    modelValue(newVal) {
      if (newVal !== this.localContent && this.editorReady) {
        this.localContent = newVal
        // 에디터가 준비된 후에만 내용 설정
        this.$nextTick(() => {
          if (this.editorInstance && this.editorInstance.getContent() !== newVal) {
            this.editorInstance.setContent(newVal)
          }
        })
      }
    },

    // 로컬 콘텐츠 변경 시 부모로 전달
    localContent(newVal) {
      this.$emit('update:modelValue', newVal)
    },

    // readonly 상태 변경
    readonly(newVal) {
      if (this.editorInstance && this.editorReady) {
        this.editorInstance.setMode(newVal ? 'readonly' : 'design')
      }
    },

    // disabled 상태 변경
    disabled(newVal) {
      if (newVal && this.editorInstance) {
        this.editorInstance.setMode('readonly')
      }
    }
  },
  mounted() {
    this.isMounted = true

    // 마운트 후 안전하게 에디터 초기화
    this.$nextTick(() => {
      this.initializeEditor()
    })
  },
  beforeUnmount() {
    this.isMounted = false

    // 타이머 정리
    if (this.mountCheckTimer) {
      clearTimeout(this.mountCheckTimer)
    }

    // 에디터 인스턴스 정리
    if (this.editorInstance) {
      try {
        this.editorInstance.destroy()
      } catch (error) {
        console.warn('에디터 인스턴스 정리 중 오류 발생:', error)
      }
    }
  },
  methods: {
    // 에디터 초기화
    initializeEditor() {
      if (!this.isMounted) return

      // 마운트 상태 재확인
      this.mountCheckTimer = setTimeout(() => {
        if (this.isMounted) {
          this.editorReady = true
        }
      }, 100)
    },

    // 에디터 설정 함수
    setupEditor(editor) {
      try {
        this.editorInstance = editor

        // 에디터 초기화 완료
        editor.on('init', () => {
          if (!this.isMounted) return

          this.editorReady = true
          this.editorError = ''

          // 초기 콘텐츠 설정
          if (this.localContent && this.localContent !== editor.getContent()) {
            editor.setContent(this.localContent)
          }

          // 수식 렌더링
          this.renderMathInEditor()

          // 부모에게 에디터 준비 완료 알림
          this.$emit('editor-ready', editor)

          // 수식 더블클릭 이벤트
          this.setupMathEditEvents(editor)
        })

        // 콘텐츠 변경 감지
        editor.on('SetContent keyup change input undo redo', () => {
          if (!this.isMounted) return

          this.renderMathInEditor()
          this.localContent = editor.getContent()
          this.$emit('editor-change', this.localContent)
        })

        // 노드 변경 감지
        editor.on('NodeChange SelectionChange', () => {
          if (!this.isMounted) return

          this.localContent = editor.getContent()
        })

        // 에러 처리
        editor.on('error', (error) => {
          console.error('TinyMCE 에러:', error)
          this.editorError = error.message || '알 수 없는 에러가 발생했습니다.'
          this.$emit('editor-error', error)
        })

      } catch (error) {
        console.error('에디터 설정 중 오류:', error)
        this.editorError = error.message || '에디터 설정 중 오류가 발생했습니다.'
        this.$emit('editor-error', error)
      }
    },

    // 에디터 초기화 완료
    onEditorInit() {
      // setup 함수에서 처리됨
    },

    // 에디터 변경
    onEditorChange() {
      // setup 함수에서 처리됨
    },

    // 키보드 이벤트 처리
    onEditorKeyDown(event) {
      // Cmd+E (Mac) 또는 Ctrl+E (Windows/Linux)로 수식 삽입
      if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
        event.preventDefault()
        this.insertMath()
      }
    },

    // 수식 편집 이벤트 설정
    setupMathEditEvents(editor) {
      // 수식 더블클릭 → 편집 모드
      editor.on('DblClick', (e) => {
        const target = e.target
        let mathElement = null

        if (target.classList && target.classList.contains('math-latex')) {
          mathElement = target
        } else if (target.closest) {
          mathElement = target.closest('span.math-latex')
        }

        if (mathElement && !this.showMathEditModal) {
          e.preventDefault()
          e.stopPropagation()
          this.editMath(mathElement)
        }
      })
    },

    // 수식 렌더링
    renderMathInEditor() {
      if (!this.editorInstance || !this.editorReady) return

      try {
        const body = this.editorInstance.getBody()
        if (!body) return

        body.querySelectorAll('span.math-latex').forEach(el => {
          let latex = el.getAttribute('data-latex')
          if (!latex) {
            const raw = (el.textContent || '').trim()
            const m = raw.match(/^\$(.*)\$$/s)
            latex = m ? m[1] : raw
            el.setAttribute('data-latex', latex)
          }

          try {
            el.innerHTML = katex.renderToString(latex, {
              throwOnError: false,
              displayMode: false
            })
          } catch (e) {
            console.warn('KaTeX 렌더 실패:', e)
            el.textContent = `$${latex}$`
          }
        })
      } catch (e) {
        console.warn('수식 렌더링 중 오류:', e)
      }
    },

    // 수식 삽입
    insertMath() {
      if (!this.editorReady || this.disabled) {
        this.showEditorNotReadyMessage()
        return
      }

      this.editingMathLatex = ''
      this.editingMathElement = null
      this.showMathEditModal = true
    },

    // 수식 편집
    editMath(mathElement) {
      if (!this.editorReady || this.disabled) return

      const latex = mathElement.getAttribute('data-latex') || ''
      this.editingMathLatex = latex
      this.editingMathElement = mathElement
      this.showMathEditModal = true
    },

    // 수식 편집 적용
    applyMathEdit(newLatex) {
      if (!this.editorReady || this.disabled) return

      try {
        if (this.editingMathElement) {
          // 기존 수식 수정
          this.editingMathElement.setAttribute('data-latex', newLatex)
          this.editingMathElement.innerHTML = katex.renderToString(newLatex, {
            throwOnError: false,
            displayMode: false
          })
        } else {
          // 새 수식 삽입
          const html = `<span class="math-latex" data-latex="${newLatex}">$${newLatex}$</span>`
          this.editorInstance.insertContent(html)
        }

        // 수식 렌더링 업데이트
        this.renderMathInEditor()

        // 부모에게 알림
        this.$emit('math-inserted', newLatex)

        // 모달 닫기
        this.cancelMathEdit()

      } catch (error) {
        console.error('수식 적용 실패:', error)
        this.editorError = '수식 적용 중 오류가 발생했습니다.'
      }
    },

    // 수식 편집 취소
    cancelMathEdit() {
      this.showMathEditModal = false
      this.editingMathLatex = ''
      this.editingMathElement = null
    },

    // 이미지 업로드 처리
    handleImageUpload(blobInfo) {
      return new Promise((resolve, reject) => {
        try {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blobInfo.blob())
        } catch (error) {
          reject(error)
        }
      })
    },

    // 에디터 재시도
    retryEditor() {
      this.retryCount++
      if (this.retryCount <= this.maxRetries) {
        this.editorReady = false
        this.editorError = ''
        this.editorInstance = null

        this.$nextTick(() => {
          this.initializeEditor()
        })
      } else {
        this.editorError = '최대 재시도 횟수를 초과했습니다.'
      }
    },

    // 에디터 준비되지 않음 메시지
    showEditorNotReadyMessage() {
      alert('에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
    },

    // 외부에서 에디터 인스턴스 접근용 메서드
    getEditorInstance() {
      return this.editorInstance
    },

    // 외부에서 콘텐츠 설정
    setContent(content) {
      if (this.editorInstance && this.editorReady) {
        this.editorInstance.setContent(content)
        this.localContent = content
      } else {
        this.localContent = content
      }
    },

    // 외부에서 콘텐츠 가져오기
    getContent() {
      if (this.editorInstance && this.editorReady) {
        return this.editorInstance.getContent()
      }
      return this.localContent
    },

    // 외부에서 수식 삽입
    insertMathFromExternal(latex) {
      if (!this.editorReady || this.disabled) return false

      try {
        const html = `<span class="math-latex" data-latex="${latex}">$${latex}$</span>`
        this.editorInstance.insertContent(html)
        this.renderMathInEditor()
        this.$emit('math-inserted', latex)
        return true
      } catch (error) {
        console.error('외부 수식 삽입 실패:', error)
        return false
      }
    }
  }
}
</script>

<style scoped>
.tinymce-editor-wrapper {
  position: relative;
  width: 100%;
}

.editor-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.loading-spinner {
  text-align: center;
}

.editor-container {
  width: 100%;
}

.editor-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.math-toolbar {
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.tinymce-container {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-disabled-content {
  min-height: 200px;
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.editor-error {
  margin-top: 10px;
}

/* TinyMCE 내부 스타일 조정 */
:deep(.tox.tox-tinymce) {
  border: none !important;
  border-radius: 0 !important;
}

:deep(.tox .tox-edit-area) {
  min-height: 200px !important;
}

:deep(.tox .tox-edit-area__iframe) {
  min-height: 200px !important;
}
</style>
