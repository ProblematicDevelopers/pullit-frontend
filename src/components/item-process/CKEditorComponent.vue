<template>
  <div>
    <h2>CKEditor 5 테스트</h2>
    <Ckeditor :editor="editor" v-model="editorData" :config="editorConfig"></Ckeditor>

    <!-- 수식 입력 도구 -->
    <div v-if="showMathTools" class="math-tools">
      <h3>수식 입력 도구</h3>
      <div class="math-buttons">
        <button @click="insertMath('x^2 + y^2 = r^2')" class="math-btn">원의 방정식</button>
        <button @click="insertMath('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}')" class="math-btn">근의 공식</button>
        <button @click="insertMath('\\int_{a}^{b} f(x) dx')" class="math-btn">정적분</button>
        <button @click="insertMath('\\sum_{i=1}^{n} x_i')" class="math-btn">합계</button>
        <button @click="insertMath('\\lim_{x \\to \\infty} f(x)')" class="math-btn">극한</button>
        <button @click="insertMath('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}')" class="math-btn">행렬</button>
        <button @click="insertMath('\\begin{cases} x + y = 1 \\\\ x - y = 2 \\end{cases}')" class="math-btn">연립방정식</button>
        <button @click="insertMath('\\vec{F} = m\\vec{a}')" class="math-btn">벡터</button>
        <button @click="insertMath('e^{i\\pi} + 1 = 0')" class="math-btn">오일러 공식</button>
      </div>
      <div class="custom-math">
        <input v-model="customMath" placeholder="LaTeX 수식 입력 (예: x^2 + y^2 = r^2)" class="math-input" />
        <button @click="insertCustomMath" class="insert-btn">수식 삽입</button>
      </div>
      <div class="math-help">
        <h4>LaTeX 수식 작성 팁:</h4>
        <ul>
          <li><code>^</code> : 위첨자 (예: x^2)</li>
          <li><code>_</code> : 아래첨자 (예: x_1)</li>
          <li><code>\\frac{분자}{분모}</code> : 분수</li>
          <li><code>\\sqrt{내용}</code> : 제곱근</li>
          <li><code>\\sum_{시작}^{끝}</code> : 합계</li>
          <li><code>\\int_{시작}^{끝}</code> : 적분</li>
        </ul>
      </div>
    </div>

    <div v-if="showOutput" class="output">
      <h3>에디터 내용:</h3>
      <div v-html="editorData"></div>
    </div>

    <div v-if="showOutput" class="output">
      <h3>렌더링된 수식:</h3>
      <div v-html="renderedMath"></div>
    </div>
  </div>
</template>

<script>
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document'
import '@ckeditor/ckeditor5-build-decoupled-document/build/translations/ko'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default {
  name: 'CKEditorComponent',
  components: {
    Ckeditor
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    showMathTools: {
      type: Boolean,
      default: true
    },
    showOutput: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      editor: DecoupledEditor,
      customMath: '',
      editorConfig: {
        language: 'ko',
        licenseKey: '',
        toolbar: {
          items: [
            'heading', '|', 'bold', 'italic', '|',
            'numberedList', 'bulletedList', '|',
            'link', 'insertTable', '|',
            'undo', 'redo'
          ]
        }
      }
    }
  },
  computed: {
    editorData: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    renderedMath() {
      // 에디터 내용에서 수식을 찾아서 KaTeX로 렌더링
      const mathRegex = /\$\$(.*?)\$\$/g
      let result = this.editorData
      let match

      while ((match = mathRegex.exec(this.editorData)) !== null) {
        try {
          const rendered = katex.renderToString(match[1], {
            throwOnError: false,
            displayMode: true,
            strict: false,
            trust: true
          })
          result = result.replace(match[0], rendered)
        } catch (error) {
          console.error('수식 렌더링 오류:', error)
          result = result.replace(match[0], `<div class="math-error"><code>${match[1]}</code><br><small>수식 렌더링 오류</small></div>`)
        }
      }

      return result
    }
  },
  mounted() {
    // CKEditor 라이선스 키 설정
    if (window.CKEDITOR_LICENSE_KEY) {
      window.CKEDITOR_LICENSE_KEY = ''
    }
  },
  methods: {
    insertMath(mathExpression) {
      const mathBlock = `$$${mathExpression}$$`
      this.editorData += `<p>${mathBlock}</p>`
    },
    insertCustomMath() {
      if (this.customMath.trim()) {
        this.insertMath(this.customMath)
        this.customMath = ''
      }
    }
  }
}
</script>

<style scoped>
.output {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.math-tools {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.math-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.math-btn {
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.math-btn:hover {
  background-color: #0056b3;
}

.custom-math {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.math-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.insert-btn {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.insert-btn:hover {
  background-color: #218838;
}

.math-help {
  background-color: #e9ecef;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.math-help h4 {
  margin-top: 0;
  color: #495057;
}

.math-help ul {
  margin: 10px 0;
  padding-left: 20px;
}

.math-help li {
  margin: 5px 0;
  color: #6c757d;
}

.math-help code {
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

h2, h3 {
  color: #333;
}

/* KaTeX 스타일 오버라이드 */
:deep(.katex) {
  font-size: 1.1em;
}

:deep(.katex-display) {
  margin: 1em 0;
  text-align: center;
}

/* 수식 오류 표시 */
.math-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
  color: #721c24;
}

.math-error code {
  background-color: #f1f2f3;
  padding: 5px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>
