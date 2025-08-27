<template>
  <div class="tinymce-test">

    <!-- TinyMCE 에디터 -->
    <Editor
      v-model="editorContent"
      :init="editorConfig"
      :api-key="finalApiKey"
      @onInit="onEditorInit"
      @onChange="onEditorChange"
    />

    <!-- 수식 입력 도구 -->
    <div v-if="showMathTools" class="math-tools">
      <h4>수식 삽입 도구</h4>

      <!-- 수식 검색 -->
      <div class="math-search">
        <input
          v-model="searchQuery"
          placeholder="수식 검색 (예: 덧셈, 방정식, 분수, 피타고라스...)"
          class="search-input"
          @input="filterMathTemplates"
        />
        <div class="search-results" v-if="filteredTemplates.length > 0 && searchQuery">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            @click="insertMath(template.latex)"
            class="search-result-item"
          >
            <span class="template-name">{{ template.name }}</span>
            <span class="template-preview">{{ template.preview }}</span>
          </div>
        </div>
      </div>

      <!-- 카테고리 탭 -->
      <div class="math-categories">
        <div class="category-tabs">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="activeCategory = category.id"
            :class="['category-tab', { active: activeCategory === category.id }]"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- 카테고리별 수식 버튼 -->
        <div class="category-content">
          <div v-for="category in categories" :key="category.id" v-show="activeCategory === category.id">
            <div class="math-buttons">
              <button
                v-for="template in category.templates"
                :key="template.id"
                @click="insertMath(template.latex)"
                class="math-btn"
                :title="template.description"
              >
                {{ template.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 실시간 미리보기 -->
      <div class="math-preview" v-if="customMath.trim()">
        <h5>수식 미리보기:</h5>
        <div class="preview-content" v-html="previewMathContent"></div>
      </div>

      <!-- 커스텀 수식 입력 -->
      <div class="custom-math">
        <input
          v-model="customMath"
          placeholder="LaTeX 수식 입력 (예: a + b = c, x² + y² = r², \frac{a}{b})"
          class="math-input"
        />
        <button @click="insertCustomMath" class="insert-btn">수식 삽입</button>
      </div>

      <div class="math-tip">
        💡 <strong>사용법:</strong> 에디터에서 원하는 위치를 클릭한 후 수식 버튼을 누르면 해당 위치에 수식이 삽입됩니다.
      </div>

            <!-- 도형 그리기 도구 -->
      <div class="drawing-tools">
        <h5>🎨 도형 그리기 도구</h5>

        <!-- 도형 타입 선택 -->
        <div class="shape-type-selector">
          <label>도형 타입:</label>
          <select v-model="selectedShapeType" class="shape-select">
            <option value="circle">원</option>
            <option value="rectangle">직사각형</option>
            <option value="triangle">삼각형</option>
            <option value="line">직선</option>
            <option value="arrow">화살표</option>
            <option value="angle">각도</option>
            <option value="polygon">다각형</option>
          </select>
        </div>

        <!-- 도형 속성 설정 -->
        <div class="shape-properties">
          <div class="property-group">
            <label>색상: <input v-model="shapeColor" type="color" class="color-picker" /></label>
            <label>두께: <input v-model="shapeStrokeWidth" type="range" min="1" max="10" class="stroke-slider" />
              <span class="value-display">{{ shapeStrokeWidth }}px</span>
            </label>
            <label>채우기: <input v-model="shapeFill" type="checkbox" class="fill-checkbox" /></label>
          </div>

          <div class="property-group">
            <label>크기: <input v-model="shapeSize" type="range" min="50" max="300" class="size-slider" />
              <span class="value-display">{{ shapeSize }}px</span>
            </label>
            <label>회전: <input v-model="shapeRotation" type="range" min="0" max="360" class="rotation-slider" />
              <span class="value-display">{{ shapeRotation }}°</span>
            </label>
          </div>

          <!-- 다각형 설정 -->
          <div v-if="selectedShapeType === 'polygon'" class="polygon-settings">
            <label>꼭짓점 수: <input v-model="polygonSides" type="number" min="3" max="12" class="sides-input" /></label>
          </div>

          <!-- 도형 위 텍스트/수식 설정 -->
          <div class="text-settings">
            <h6>📝 도형 위 텍스트/수식</h6>
            <div class="text-input-group">
              <label>텍스트: <input v-model="shapeText" type="text" placeholder="예: O, A, B, θ, α" class="text-input" /></label>
              <label>LaTeX 수식: <input v-model="shapeLatex" type="text" placeholder="예: \frac{a}{b}, \angle ABC" class="latex-input" /></label>
            </div>

            <!-- 빠른 테스트 버튼들 -->
            <div class="quick-test-buttons">
              <button @click="quickTest('circle')" class="quick-test-btn">원 + 점 O</button>
              <button @click="quickTest('rectangle')" class="quick-test-btn">직사각형 + 수식</button>
              <button @click="quickTest('triangle')" class="quick-test-btn">삼각형 + 각도</button>
            </div>
            <div class="text-properties">
              <label>텍스트 색상: <input v-model="textColor" type="color" class="text-color-picker" /></label>
              <label>텍스트 크기: <input v-model="textSize" type="range" min="8" max="24" class="text-size-slider" />
                <span class="value-display">{{ textSize }}px</span>
              </label>
              <label>위치:
                <select v-model="textPosition" class="position-select">
                  <option value="top">위쪽</option>
                  <option value="bottom">아래쪽</option>
                  <option value="left">왼쪽</option>
                  <option value="right">오른쪽</option>
                  <option value="center">중앙</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <!-- 도형 삽입 버튼 -->
        <div class="shape-actions">
          <button @click="insertShape()" class="insert-shape-btn" :disabled="!selectedShapeType">
            <span class="btn-icon">➕</span> 도형 삽입
          </button>
          <button @click="previewShape()" class="preview-shape-btn">
            <span class="btn-icon">👁️</span> 미리보기
          </button>
        </div>

        <!-- 도형 미리보기 -->
        <div v-if="showShapePreview" class="shape-preview">
          <h6>도형 미리보기:</h6>
          <div class="preview-container" v-html="shapePreviewHtml"></div>
        </div>
      </div>

      <!-- 이미지와 수식 함께 사용하는 예시 -->
      <div class="usage-example">
        <h5>📚 이미지와 수식 함께 사용 예시:</h5>
        <div class="example-content">
          <p><strong>1단계:</strong> 이미지 삽입 (툴바의 📷 버튼 클릭) 또는 도형 그리기</p>
          <p><strong>2단계:</strong> 이미지/도형 아래에 문제 텍스트 입력</p>
          <p><strong>3단계:</strong> 수식 버튼으로 수학 기호 삽입</p>
          <p><strong>4단계:</strong> 선택지 번호 매기기 (툴바의 1. 2. 3. 버튼 사용)</p>
        </div>
        <div class="example-preview">
          <p><strong>예시 결과:</strong></p>
          <div class="example-math">
            <p>1. 다음 그림의 원 O에서 <span class="math-latex">$\overparen{AB} = \overparen{BC} = \overparen{DE}$</span>일 때, 다음 중 옳지 않은 것은?</p>
            <p>① <span class="math-latex">$\overparen{AB} = \overparen{DE}$</span></p>
            <p>② <span class="math-latex">$\overparen{AC} = 2\overparen{DE}$</span></p>
            <p>③ <span class="math-latex">$\angle AOC = 2\angle DOE$</span></p>
          </div>
        </div>
      </div>

      <!-- 최종 HTML 확인 버튼 -->
      <div class="html-actions">
        <button @click="showFinalHtml = !showFinalHtml" class="html-btn">
          {{ showFinalHtml ? 'HTML 숨기기' : '최종 HTML 보기' }}
        </button>
        <button @click="copyFinalHtml" class="copy-btn">HTML 복사</button>
      </div>

      <!-- 최종 HTML 표시 영역 -->
      <div v-if="showFinalHtml" class="final-html">
        <h4>최종 HTML (수식 포함):</h4>
        <pre class="html-code">{{ getFinalHtml() }}</pre>
      </div>
    </div>

    <!-- 출력 영역 (미리보기) -->
    <div v-if="showOutput" class="output">
      <h3>미리보기 (수식 렌더링됨):</h3>
      <div v-html="renderedPreview"></div>
    </div>
  </div>
</template>

<script>
import Editor from '@tinymce/tinymce-vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default {
  name: 'TinyMCETestComponent',
  components: { Editor },
  props: {
    modelValue: { type: String, default: '' },
    showMathTools: { type: Boolean, default: true },
    showOutput: { type: Boolean, default: true },
    readonly: { type: Boolean, default: false },
    apiKey: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      editorContent: this.modelValue || '<p>안녕하세요! TinyMCE 테스트입니다.</p>',
      customMath: '',
      searchQuery: '',
      activeCategory: 'basic',
      editorLoaded: false,
      editorInstance: null,
      showFinalHtml: false,
      // 도형 그리기 관련 변수
      selectedShapeType: 'circle',
      shapeColor: '#000000',
      shapeStrokeWidth: 2,
      shapeFill: false,
      shapeSize: 100,
      shapeRotation: 0,
      polygonSides: 6,
      showShapePreview: false,
      shapePreviewHtml: '',
      // 도형 위 텍스트/수식 관련 변수
      shapeText: '',
      shapeLatex: '',
      textColor: '#000000',
      textSize: 14,
      textPosition: 'top',
      editorConfig: {
        height: 500,
        language: 'ko-KR',
        readonly: this.readonly,
        branding: false,
        promotion: false,
        // HTML 정리 기능 비활성화
        cleanup: false,
        verify_html: false,
        extended_valid_elements: 'span[*],div[*],*[*]',
        custom_elements: '~math-latex',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample'
        ],
        toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | codesample | table | help | drawshapes',
        content_style: `
          body { font-family: 'Noto Sans KR', Arial, sans-serif; font-size: 14px; line-height: 1.6; }
          .math-latex {
            text-align: center;
            margin: 15px 0;
            padding: 5px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #495057;
            white-space: pre-wrap;
            word-break: break-all;
          }
        `,
        setup: (editor) => {
          this.editorInstance = editor
          try {
            editor.setMode(this.readonly ? 'readonly' : 'design')
          } catch {
            console.warn('readonly 상태 설정 실패')
          }

          // MathJax 자동 로드 및 수식 렌더링
          this.loadMathJax(editor)
        },
        images_upload_handler: (blobInfo) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(blobInfo.blob())
          })
        }
      },
      // 수식 카테고리 및 템플릿 (중학생 수준)
      categories: [
        {
          id: 'basic',
          name: '기본 수학',
          templates: [
            { id: 'addition', name: '덧셈', latex: 'a + b = c', preview: 'a + b = c', description: '기본 덧셈' },
            { id: 'subtraction', name: '뺄셈', latex: 'a - b = c', preview: 'a - b = c', description: '기본 뺄셈' },
            { id: 'multiplication', name: '곱셈', latex: 'a \\times b = c', preview: 'a × b = c', description: '기본 곱셈' },
            { id: 'division', name: '나눗셈', latex: '\\frac{a}{b} = c', preview: 'a ÷ b = c', description: '기본 나눗셈' }
          ]
        },
        {
          id: 'algebra',
          name: '대수학',
          templates: [
            { id: 'linear', name: '일차방정식', latex: 'ax + b = 0', preview: 'ax + b = 0', description: '일차방정식' },
            { id: 'quadratic', name: '이차방정식', latex: 'ax^2 + bx + c = 0', preview: 'ax² + bx + c = 0', description: '이차방정식' },
            { id: 'quadratic_formula', name: '근의 공식', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', preview: 'x = (-b ± √(b²-4ac))/2a', description: '이차방정식 근의 공식' },
            { id: 'factoring', name: '인수분해', latex: 'x^2 + 5x + 6 = (x+2)(x+3)', preview: 'x² + 5x + 6 = (x+2)(x+3)', description: '이차식 인수분해' }
          ]
        },
        {
          id: 'geometry',
          name: '기하학',
          templates: [
            { id: 'pythagoras', name: '피타고라스 정리', latex: 'a^2 + b^2 = c^2', preview: 'a² + b² = c²', description: '직각삼각형에서' },
            { id: 'circle_area', name: '원의 넓이', latex: 'A = \\pi r^2', preview: 'A = πr²', description: '원의 넓이 공식' },
            { id: 'circle_circumference', name: '원의 둘레', latex: 'C = 2\\pi r', preview: 'C = 2πr', description: '원의 둘레 공식' },
            { id: 'rectangle_area', name: '직사각형 넓이', latex: 'A = l \\times w', preview: 'A = l × w', description: '직사각형 넓이' }
          ]
        },
        {
          id: 'fractions',
          name: '분수',
          templates: [
            { id: 'fraction', name: '분수', latex: '\\frac{a}{b}', preview: 'a/b', description: '기본 분수' },
            { id: 'mixed_fraction', name: '대분수', latex: '2\\frac{1}{3}', preview: '2⅓', description: '대분수' },
            { id: 'fraction_addition', name: '분수 덧셈', latex: '\\frac{a}{b} + \\frac{c}{d} = \\frac{ad+bc}{bd}', preview: 'a/b + c/d = (ad+bc)/bd', description: '분수 덧셈 공식' },
            { id: 'fraction_multiplication', name: '분수 곱셈', latex: '\\frac{a}{b} \\times \\frac{c}{d} = \\frac{ac}{bd}', preview: 'a/b × c/d = ac/bd', description: '분수 곱셈 공식' }
          ]
        },
        {
          id: 'percentages',
          name: '백분율',
          templates: [
            { id: 'percent', name: '백분율', latex: '\\frac{part}{whole} \\times 100\\%', preview: 'part/whole × 100%', description: '백분율 계산' },
            { id: 'percent_change', name: '백분율 변화', latex: '\\frac{new-old}{old} \\times 100\\%', preview: '(new-old)/old × 100%', description: '백분율 변화율' },
            { id: 'discount', name: '할인율', latex: '\\frac{discount}{original} \\times 100\\%', preview: '할인액/원가 × 100%', description: '할인율 계산' }
          ]
        },
        {
          id: 'geometry_problems',
          name: '기하학 문제',
          templates: [
            { id: 'circle_problem', name: '원 문제', latex: '\\text{원 } O \\text{에서 } \\overparen{AB} = \\overparen{BC} = \\overparen{DE}', preview: '원 O에서 호 AB = 호 BC = 호 DE', description: '원과 호 관련 문제' },
            { id: 'angle_problem', name: '각도 문제', latex: '\\angle AOC = 2\\angle DOE', preview: '∠AOC = 2∠DOE', description: '중심각 관계' },
            { id: 'area_problem', name: '넓이 문제', latex: 'S_{AOC} = 2 \\times S_{DOE}', preview: 'S_AOC = 2 × S_DOE', description: '부채꼴 넓이 관계' }
          ]
        }
      ]
    }
  },
  computed: {
    // 최종 API 키 (props 우선, 없으면 env에서 가져오기)
    finalApiKey() {
      return (
        this.apiKey ||
        import.meta.env.VITE_TINYMCE_KEY ||
        ''
      )
    },
    // 검색 결과 필터링
    filteredTemplates() {
      if (!this.searchQuery.trim()) return []

      const query = this.searchQuery.toLowerCase()
      const results = []

      this.categories.forEach(category => {
        category.templates.forEach(template => {
          if (
            template.name.toLowerCase().includes(query) ||
            template.description.toLowerCase().includes(query) ||
            template.latex.toLowerCase().includes(query)
          ) {
            results.push({
              ...template,
              category: category.name
            })
          }
        })
      })

      return results.slice(0, 10) // 최대 10개 결과
    },
    // 실시간 수식 미리보기
    previewMathContent() {
      if (!this.customMath.trim()) return ''

      try {
        // LaTeX 구문 정리 (헬퍼 메서드 사용)
        let cleanLatex = this.cleanLatexSyntax(this.customMath)

        console.log('미리보기 LaTeX 정리:', cleanLatex)

        return katex.renderToString(cleanLatex, {
          throwOnError: false,
          displayMode: false,
          strict: false
        })
      } catch {
        return `<span style="color: red; font-family: monospace;">수식 오류: ${this.customMath}</span>`
      }
    },

    // 미리보기용 렌더링된 콘텐츠
    renderedPreview() {
      if (!this.editorContent) return ''

      let content = this.editorContent

      // LaTeX 코드를 찾아서 수식으로 렌더링 (개선된 패턴 - 여러 줄 지원)
      const mathRegex = /<[^>]*class="[^"]*math-latex[^"]*"[^>]*>.*?\$([^$]+)\$.*?<\/[^>]*>/gs

      content = content.replace(mathRegex, (match, latex) => {
        try {
          // LaTeX 구문 정리 및 수정 (헬퍼 메서드 사용)
          let cleanLatex = this.cleanLatexSyntax(latex)

          console.log('정리된 LaTeX:', cleanLatex)

          const rendered = katex.renderToString(cleanLatex, {
            throwOnError: false,
            displayMode: false, // 인라인 모드로 변경
            strict: false
          })
          return `<span class="math-inline">${rendered}</span>`
        } catch (error) {
          console.warn('LaTeX 렌더링 오류:', error, '원본:', latex)
          return `<span class="math-error" style="color: red; font-family: monospace;">LaTeX 오류: ${latex}</span>`
        }
      })

      return content
    }
  },

  // 에디터에서는 수식 렌더링을 하지 않으므로 timeout 정리가 필요 없음
  watch: {
    modelValue(newVal) {
      if (newVal !== this.editorContent) this.editorContent = newVal
    },
    editorContent(newVal) {
      this.$emit('update:modelValue', newVal)
    },
    readonly(newVal) {
      if (this.editorInstance) {
        this.editorInstance.setMode(newVal ? 'readonly' : 'design')
      }
    }
  },
  methods: {
    onEditorInit() {
      this.editorLoaded = true
      console.log('TinyMCE 초기화 완료')
      // 에디터에서는 수식 렌더링을 하지 않음
    },
    onEditorChange() {
      console.log('에디터 내용 변경됨')
    },
            insertMath(math) {
      if (!this.editorInstance) return
      try {
        console.log('수식 삽입 시작:', math)

        // 에디터에는 LaTeX 코드만 삽입 (HTML 정리 방지)
        const mathHtml = `<span class="math-latex" data-latex="${math}" style="display: inline-block; margin: 0 2px;">$${math}$</span>`

        // 현재 커서 위치에 수식 삽입
        this.editorInstance.insertContent(mathHtml)
        console.log('LaTeX 코드 삽입 완료')

        // 커서를 에디터 끝으로 이동
        setTimeout(() => {
          this.editorInstance.focus()
          const body = this.editorInstance.getBody()
          const lastElement = body.lastElementChild
          if (lastElement) {
            this.editorInstance.selection.select(lastElement)
            this.editorInstance.selection.collapse(false)
          }
        }, 100)

      } catch (error) {
        console.error('수식 삽입 오류:', error)
      }
    },
    insertCustomMath() {
      if (this.customMath.trim()) {
        this.insertMath(this.customMath)
        this.customMath = ''
      }
    },
    filterMathTemplates() {
      // 검색 입력 시 자동으로 필터링됨 (computed에서 처리)
    },

    // MathJax 로드 및 수식 렌더링
    loadMathJax(editor) {
      // MathJax가 이미 로드되어 있는지 확인
      if (window.MathJax && window.MathJax.typesetPromise) {
        this.setupMathJax(editor)
        return
      }

      // MathJax 로드
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
      script.async = true

      script.onload = () => {
        console.log('MathJax 로드 완료')
        this.setupMathJax(editor)
      }

      script.onerror = () => {
        console.warn('MathJax 로드 실패, KaTeX 사용')
        this.setupKaTeX(editor)
      }

      document.head.appendChild(script)
    },

        // MathJax 설정 (에디터에서는 렌더링하지 않음)
    setupMathJax() {
      console.log('MathJax 설정 완료 (에디터 렌더링 비활성화)')
      // 에디터에서는 수식 렌더링을 하지 않음
    },

    // KaTeX 설정 (에디터에서는 렌더링하지 않음)
    setupKaTeX() {
      console.log('KaTeX 설정 완료 (에디터 렌더링 비활성화)')
      // 에디터에서는 수식 렌더링을 하지 않음
    },

        // KaTeX로 수식 렌더링
    renderKaTeX(element) {
      if (!window.katex) return

      const mathElements = element.querySelectorAll('.math-display')
      mathElements.forEach(mathEl => {
        const latex = mathEl.textContent.replace(/^\$|\$$/g, '')
        try {
          const rendered = window.katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true
          })
          mathEl.innerHTML = rendered
        } catch (error) {
          console.warn('KaTeX 렌더링 오류:', error)
        }
      })
    },

    // 최종 HTML 가져오기 (수식 포함)
    getFinalHtml() {
      if (!this.editorInstance) {
        console.warn('에디터 인스턴스가 없음')
        return this.editorContent
      }

      try {
        // 에디터에서 최종 HTML 가져오기
        const finalHtml = this.editorInstance.getContent()
        console.log('최종 HTML:', finalHtml)
        return finalHtml
      } catch (error) {
        console.error('HTML 가져오기 오류:', error)
        return this.editorContent
      }
    },

            // 수식이 포함된 최종 콘텐츠 가져오기
    getFinalContent() {
      const html = this.getFinalHtml()

      // LaTeX 코드를 찾아서 수식으로 렌더링 (여러 줄 지원)
      const mathRegex = /<[^>]*class="[^"]*math-latex[^"]*"[^>]*>.*?\$([^$]+)\$.*?<\/[^>]*>/gs

      let content = html
      content = content.replace(mathRegex, (match, latex) => {
        try {
          // LaTeX 구문 정리 및 수정 (헬퍼 메서드 사용)
          let cleanLatex = this.cleanLatexSyntax(latex)

          console.log('최종 콘텐츠 LaTeX 정리:', cleanLatex)

          const rendered = katex.renderToString(cleanLatex, {
            throwOnError: false,
            displayMode: false, // 인라인 모드로 변경
            strict: false
          })
          return `<span class="math-inline">${rendered}</span>`
        } catch (error) {
          console.warn('LaTeX 렌더링 오류:', error, '원본:', latex)
          return `<span class="math-error" style="color: red; font-family: monospace;">LaTeX 오류: ${latex}</span>`
        }
      })

      return content
    },

        // 도형 삽입 메서드 (개선된 버전)
    insertShape() {
      if (!this.editorInstance || !this.selectedShapeType) return

      try {
        console.log('도형 삽입 시작:', this.selectedShapeType)

        const svgContent = this.generateShapeSVG()

        // SVG를 에디터에 삽입
        const imgHtml = `<div class="shape-container" style="text-align: center; margin: 10px 0;">
          ${svgContent}
        </div>`

        this.editorInstance.insertContent(imgHtml)
        console.log('도형 삽입 완료:', this.selectedShapeType)

      } catch (error) {
        console.error('도형 삽입 오류:', error)
      }
    },

        // SVG 도형 생성 메서드
    generateShapeSVG() {
      console.log('SVG 도형 생성 시작:', {
        type: this.selectedShapeType,
        size: this.shapeSize,
        color: this.shapeColor,
        strokeWidth: this.shapeStrokeWidth,
        fill: this.shapeFill,
        rotation: this.shapeRotation,
        text: this.shapeText,
        latex: this.shapeLatex
      })

      const fillColor = this.shapeFill ? this.shapeColor : 'none'
      const centerX = this.shapeSize / 2
      const centerY = this.shapeSize / 2
      const radius = (this.shapeSize - 20) / 2

      let svgContent = ''

      switch (this.selectedShapeType) {
        case 'circle':
          svgContent = `<svg width="${this.shapeSize}" height="${this.shapeSize}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${this.shapeRotation}deg)">
            <circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="${fillColor}" />
            ${this.generateTextElements(centerX, centerY, radius)}
          </svg>`
          break

        case 'rectangle': {
          const rectWidth = this.shapeSize - 20
          const rectHeight = (this.shapeSize - 20) * 0.6
          const rectX = (this.shapeSize - rectWidth) / 2
          const rectY = (this.shapeSize - rectHeight) / 2

          svgContent = `<svg width="${this.shapeSize}" height="${this.shapeSize}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${this.shapeRotation}deg)">
            <rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="${fillColor}" />
            ${this.generateTextElements(centerX, centerY, rectWidth/2)}
          </svg>`
          break
        }

        case 'triangle': {
          const triHeight = this.shapeSize - 20
          const triWidth = triHeight * 0.866 // 정삼각형 비율
          const triX = (this.shapeSize - triWidth) / 2
          const triY = 10

          svgContent = `<svg width="${this.shapeSize}" height="${this.shapeSize}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${this.shapeRotation}deg)">
            <polygon points="${triX + triWidth/2},${triY} ${triX},${triY + triHeight} ${triX + triWidth},${triY + triHeight}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="${fillColor}" />
            ${this.generateTextElements(centerX, centerY, triHeight/2)}
          </svg>`
          break
        }

        case 'line': {
          svgContent = `<svg width="${this.shapeSize}" height="20" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${this.shapeRotation}deg)">
            <line x1="10" y1="10" x2="${this.shapeSize - 10}" y2="10" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" />
            ${this.generateTextElements(this.shapeSize/2, 5, 0)}
          </svg>`
          break
        }

        case 'arrow': {
          const arrowY = 15

          svgContent = `<svg width="${this.shapeSize}" height="30" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${this.shapeRotation}deg)">
            <defs>
              <marker id="arrowhead-${Date.now()}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="${this.shapeColor}" />
              </marker>
            </defs>
            <line x1="10" y1="${arrowY}" x2="${this.shapeSize - 20}" y2="${arrowY}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" marker-end="url(#arrowhead-${Date.now()})" />
            ${this.generateTextElements(this.shapeSize/2, arrowY - 5, 0)}
          </svg>`
          break
        }

        case 'angle': {
          svgContent = `<svg width="${this.shapeSize}" height="${this.shapeSize}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${this.shapeRotation}deg)">
            <line x1="20" y1="${this.shapeSize - 20}" x2="${this.shapeSize - 20}" y2="${this.shapeSize - 20}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" />
            <line x1="20" y1="${this.shapeSize - 20}" x2="20" y2="20" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" />
            <path d="M 20 ${this.shapeSize - 20} Q 30 ${this.shapeSize - 30} 40 ${this.shapeSize - 40}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${this.generateTextElements(centerX, centerY, radius)}
          </svg>`
          break
        }

        case 'polygon': {
          const polyRadius = radius
          const points = this.generatePolygonPoints(polyRadius, centerX, centerY)

          svgContent = `<svg width="${this.shapeSize}" height="${this.shapeSize}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${this.shapeRotation}deg)">
            <polygon points="${points}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="${fillColor}" />
            ${this.generateTextElements(centerX, centerY, polyRadius)}
          </svg>`
          break
        }

        default:
          console.warn('알 수 없는 도형 타입:', this.selectedShapeType)
          return ''
      }

      console.log('SVG 생성 완료:', svgContent)
      return svgContent
    },

    // 다각형 점 생성 메서드
    generatePolygonPoints(radius, centerX, centerY) {
      const points = []
      const angleStep = (2 * Math.PI) / this.polygonSides

      for (let i = 0; i < this.polygonSides; i++) {
        const angle = i * angleStep - Math.PI / 2 // 12시 방향부터 시작
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        points.push(`${x},${y}`)
      }

      return points.join(' ')
    },

    // 도형 위 텍스트/수식 요소 생성 메서드
    generateTextElements(centerX, centerY, radius) {
      let textElements = ''
      console.log('텍스트 요소 생성 시작:', {
        text: this.shapeText,
        latex: this.shapeLatex,
        position: this.textPosition,
        centerX,
        centerY,
        radius
      })

      // 텍스트와 LaTeX가 모두 있는 경우 위치 조정
      let textPosition = this.textPosition
      let latexPosition = this.textPosition

      if (this.shapeText.trim() && this.shapeLatex.trim()) {
        // 텍스트와 LaTeX가 모두 있으면 위치를 다르게 설정
        if (this.textPosition === 'center') {
          textPosition = 'top'
          latexPosition = 'bottom'
        } else if (this.textPosition === 'top') {
          textPosition = 'top'
          latexPosition = 'bottom'
        } else if (this.textPosition === 'bottom') {
          textPosition = 'bottom'
          latexPosition = 'top'
        } else if (this.textPosition === 'left') {
          textPosition = 'left'
          latexPosition = 'right'
        } else if (this.textPosition === 'right') {
          textPosition = 'right'
          latexPosition = 'left'
        }
      }

      // 일반 텍스트가 있는 경우
      if (this.shapeText.trim()) {
        const textPos = this.calculateTextPosition(centerX, centerY, radius, textPosition)
        textElements += `<text x="${textPos.x}" y="${textPos.y}" font-size="${this.textSize}" fill="${this.textColor}" text-anchor="middle" dominant-baseline="middle">${this.shapeText}</text>`
        console.log('텍스트 추가됨:', textPos, this.shapeText)
      }

      // LaTeX 수식이 있는 경우
      if (this.shapeLatex.trim()) {
        try {
          // LaTeX 렌더링 테스트 (에러 체크용)
          katex.renderToString(this.shapeLatex, {
            throwOnError: false,
            displayMode: false,
            strict: false
          })

          const latexPos = this.calculateTextPosition(centerX, centerY, radius, latexPosition)

          // SVG에서는 LaTeX를 직접 렌더링할 수 없으므로 원본 텍스트로 표시
          textElements += `<text x="${latexPos.x}" y="${latexPos.y}" font-size="${this.textSize}" fill="${this.textColor}" text-anchor="middle" dominant-baseline="middle">${this.shapeLatex}</text>`
          console.log('LaTeX 추가됨:', latexPos, this.shapeLatex)
        } catch (error) {
          console.warn('LaTeX 렌더링 오류:', error)
          // LaTeX 실패 시 일반 텍스트로 표시
          const fallbackPos = this.calculateTextPosition(centerX, centerY, radius, latexPosition)
          textElements += `<text x="${fallbackPos.x}" y="${fallbackPos.y}" font-size="${this.textSize}" fill="${this.textColor}" text-anchor="middle" dominant-baseline="middle">${this.shapeLatex}</text>`
          console.log('LaTeX 폴백 텍스트 추가됨:', fallbackPos, this.shapeLatex)
        }
      }

      console.log('최종 텍스트 요소:', textElements)
      return textElements
    },

    // 텍스트 위치 계산 메서드
    calculateTextPosition(centerX, centerY, radius, position) {
      const offset = 20 // 도형과의 간격

      switch (position) {
        case 'top':
          return { x: centerX, y: centerY - radius - offset }
        case 'bottom':
          return { x: centerX, y: centerY + radius + offset }
        case 'left':
          return { x: centerX - radius - offset, y: centerY }
        case 'right':
          return { x: centerX + radius + offset, y: centerY }
        case 'center':
          return { x: centerX, y: centerY }
        default:
          return { x: centerX, y: centerY - radius - offset }
      }
    },

    // 빠른 테스트 메서드
    quickTest(shapeType) {
      this.selectedShapeType = shapeType

      switch (shapeType) {
        case 'circle':
          this.shapeText = 'O'
          this.shapeLatex = ''
          this.textPosition = 'center'
          break
        case 'rectangle':
          this.shapeText = ''
          this.shapeLatex = '\\frac{a}{b}'
          this.textPosition = 'top'
          break
        case 'triangle':
          this.shapeText = 'θ'
          this.shapeLatex = '\\angle ABC'
          this.textPosition = 'right'
          break
      }

      console.log('빠른 테스트 설정 완료:', {
        type: shapeType,
        text: this.shapeText,
        latex: this.shapeLatex,
        position: this.textPosition
      })

      // 자동으로 미리보기 표시
      this.previewShape()
    },

    // 도형 미리보기 메서드
    previewShape() {
      this.shapePreviewHtml = this.generateShapeSVG()
      this.showShapePreview = true
    },

    // HTML 복사 메서드
    async copyFinalHtml() {
      try {
        const html = this.getFinalHtml()
        await navigator.clipboard.writeText(html)
        console.log('HTML이 클립보드에 복사되었습니다.')
        // 간단한 토스트 메시지 (선택사항)
        alert('HTML이 클립보드에 복사되었습니다!')
      } catch (error) {
        console.error('HTML 복사 실패:', error)
        alert('HTML 복사에 실패했습니다.')
      }
    },

    // LaTeX 구문 정리 헬퍼 메서드
    cleanLatexSyntax(latex) {
      return latex
        .replace(/\n/g, ' ') // 줄바꿈을 공백으로 변환
        .replace(/\\overparen\s*\{([^}]+)\}/g, '\\overparen{$1}') // 호 표시 정리
        .replace(/\\angle\s+([A-Z]+)\s+([A-Z]+)\s+([A-Z]+)/g, '\\angle $1$2$3') // 각도 표시 정리
        .replace(/\\text\{([^}]+)\}/g, '$1') // 텍스트 명령어 제거
        .replace(/\s+/g, ' ') // 연속 공백 제거
        .trim()
    },

    // 에디터에서는 수식 렌더링을 하지 않음 (미리보기에서만 렌더링)
  }
}
</script>

<style scoped>
.tinymce-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.math-tools {
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.math-tools h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.1rem;
}

/* 수식 검색 */
.math-search {
  margin-bottom: 20px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.search-result-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background-color: #f8f9fa;
}

.search-result-item:last-child {
  border-bottom: none;
}

.template-name {
  display: block;
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.template-preview {
  display: block;
  font-size: 0.9rem;
  color: #6c757d;
}

/* 카테고리 탭 */
.math-categories {
  margin-bottom: 20px;
}

.category-tabs {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 15px;
  overflow-x: auto;
}

.category-tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-tab:hover {
  color: #007bff;
  background-color: #f8f9fa;
}

.category-tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.math-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.math-btn {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.math-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* 실시간 미리보기 */
.math-preview {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.math-preview h5 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 1rem;
}

.preview-content {
  text-align: center;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  overflow-x: auto;
}

.custom-math {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.math-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.math-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.insert-btn {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.insert-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.math-tip {
  padding: 12px;
  background-color: #e7f3ff;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #0056b3;
}

/* 도형 그리기 도구 */
.drawing-tools {
  margin: 20px 0;
  padding: 20px;
  background-color: #e8f5e8;
  border: 1px solid #c3e6c3;
  border-radius: 8px;
}

.drawing-tools h5 {
  margin: 0 0 15px 0;
  color: #2d5a2d;
  font-size: 1rem;
}

.shape-type-selector {
  margin-bottom: 15px;
}

.shape-type-selector label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #2d5a2d;
}

.shape-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #c3e6c3;
  border-radius: 6px;
  background-color: white;
  color: #2d5a2d;
  font-size: 14px;
  cursor: pointer;
}

.shape-select:focus {
  outline: none;
  border-color: #2d5a2d;
  box-shadow: 0 0 0 2px rgba(45, 90, 45, 0.2);
}

.shape-properties {
  margin-bottom: 15px;
}

.property-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
  align-items: center;
  font-size: 0.9rem;
  color: #2d5a2d;
}

.property-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.color-picker {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.stroke-slider, .size-slider, .rotation-slider {
  width: 80px;
  cursor: pointer;
}

.fill-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.value-display {
  min-width: 40px;
  text-align: center;
  font-weight: 500;
  color: #1a3d1a;
}

.polygon-settings {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f8f0;
  border-radius: 6px;
  border: 1px solid #c3e6c3;
}

.sides-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #c3e6c3;
  border-radius: 4px;
  text-align: center;
}

.shape-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.insert-shape-btn, .preview-shape-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.insert-shape-btn {
  background-color: #28a745;
  color: white;
}

.insert-shape-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.insert-shape-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.preview-shape-btn {
  background-color: #17a2b8;
  color: white;
}

.preview-shape-btn:hover {
  background-color: #138496;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.1em;
}

.shape-preview {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.shape-preview h6 {
  margin: 0 0 10px 0;
  color: #2d5a2d;
  font-size: 0.9rem;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

/* 텍스트/수식 설정 */
.text-settings {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.text-settings h6 {
  margin: 0 0 10px 0;
  color: #2d5a2d;
  font-size: 0.9rem;
}

.text-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.text-input-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #2d5a2d;
}

.text-input, .latex-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #c3e6c3;
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 200px;
}

.text-input:focus, .latex-input:focus {
  outline: none;
  border-color: #2d5a2d;
  box-shadow: 0 0 0 2px rgba(45, 90, 45, 0.2);
}

.text-properties {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.text-color-picker {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.text-size-slider {
  width: 80px;
  cursor: pointer;
}

.position-select {
  padding: 4px 8px;
  border: 1px solid #c3e6c3;
  border-radius: 4px;
  background-color: white;
  color: #2d5a2d;
  font-size: 0.9rem;
  cursor: pointer;
}

.quick-test-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.quick-test-btn {
  padding: 6px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-test-btn:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

/* 사용법 예시 */
.usage-example {
  margin: 20px 0;
  padding: 20px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
}

.usage-example h5 {
  margin: 0 0 15px 0;
  color: #856404;
  font-size: 1rem;
}

.example-content {
  margin-bottom: 15px;
}

.example-content p {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #856404;
}

.example-preview {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.example-preview p {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #495057;
}

.example-math {
  margin-top: 10px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.example-math p {
  margin: 8px 0;
  line-height: 1.5;
}

.output {
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.output h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.2rem;
}

.output .math-display {
  text-align: center;
  margin: 15px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.output .math-display .katex {
  font-size: 1.2em;
}

/* 인라인 수식 스타일 */
.math-inline {
  display: inline;
  margin: 0 2px;
  vertical-align: middle;
}

.math-inline .katex {
  font-size: 1em;
  line-height: 1.2;
}

/* 수식 오류 표시 */
.math-error {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

/* HTML 액션 버튼 */
.html-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.html-btn, .copy-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.html-btn {
  background-color: #6c757d;
  color: white;
}

.html-btn:hover {
  background-color: #5a6268;
}

.copy-btn {
  background-color: #17a2b8;
  color: white;
}

.copy-btn:hover {
  background-color: #138496;
}

/* 최종 HTML 표시 영역 */
.final-html {
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.final-html h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.1rem;
}

.html-code {
  background-color: #f1f3f4;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .category-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .category-tab {
    padding: 8px 15px;
    font-size: 0.9rem;
  }

  .math-buttons {
    flex-direction: column;
  }

  .math-btn {
    width: 100%;
  }

  .custom-math {
    flex-direction: column;
  }

  .shape-properties {
    flex-direction: column;
    align-items: flex-start;
  }

  .property-group {
    flex-direction: column;
    gap: 10px;
  }

  .shape-actions {
    flex-direction: column;
  }

  .insert-shape-btn, .preview-shape-btn {
    width: 100%;
    justify-content: center;
  }

  .text-input-group {
    flex-direction: column;
  }

  .text-input, .latex-input {
    min-width: auto;
    width: 100%;
  }

  .text-properties {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
