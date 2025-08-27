<template>
  <div class="tinymce-test bg-light min-vh-100">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">TinyMCE 에디터</h1>
        <p class="page-subtitle">수식과 도형을 포함한 텍스트 편집 테스트 (디버깅)</p>
      </div>
    </div>

    <!-- 메인 컨테이너 -->
    <div class="main-content container py-5">
      <div class="content-wrapper">
        <div class="row">
          <!-- 왼쪽: 미리보기 + TinyMCE 에디터 -->
          <div class="col-md-8">
            <!-- 라이브 미리보기 -->
            <LivePreview :content="editorContent" />

            <!-- 에디터 -->
            <div class="card shadow-sm border-0">
              <div class="card-header bg-white border-bottom py-3">
                <h5 class="card-title mb-0 fw-semibold text-dark">
                  <i class="bi bi-pencil-square me-2"></i>TinyMCE 에디터
                </h5>
              </div>
              <div class="card-body p-0 editor-body">
                <div class="editor-container">
                  <div v-if="editorError" class="alert alert-danger mt-3" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    에디터 로딩 중 오류가 발생했습니다: {{ editorError }}
                    <button @click="retryEditorLoad" class="btn btn-outline-danger btn-sm ms-2">다시 시도</button>
                  </div>

                  <Editor v-model="editorContent" :init="editorConfig" :api-key="finalApiKey" />

                  <!-- 수식 편집 UI -->
                  <MathEditModal
                    :show="showMathEdit"
                    :latex="editingMathLatex"
                    @apply="applyMathEdit"
                    @cancel="cancelMathEdit"
                  />

                  <div
                    v-if="!finalApiKey"
                    class="api-key-notice mt-2 p-2 bg-warning bg-opacity-10 border border-warning rounded"
                  >
                    <small class="text-warning">
                      <i class="bi bi-exclamation-triangle me-1"></i>
                      API 키가 설정되지 않았습니다. 무료 버전으로 실행 중입니다.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 오른쪽: 도구 패널 -->
          <div class="col-md-4">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-light border-bottom py-3">
                <ul class="nav nav-tabs nav-fill" role="tablist">
                  <li class="nav-item">
                    <button
                      @click="activeToolTab = 'math'"
                      :class="['nav-link', { active: activeToolTab === 'math' }]"
                      type="button"
                      role="tab"
                    >
                      <i class="bi bi-calculator me-2"></i>수식
                    </button>
                  </li>
                  <li class="nav-item">
                    <button
                      @click="activeToolTab = 'shapes'"
                      :class="['nav-link', { active: activeToolTab === 'shapes' }]"
                      type="button"
                      role="tab"
                    >
                      <i class="bi bi-shapes me-2"></i>도형
                    </button>
                  </li>
                  <li class="nav-item">
                    <button
                      @click="activeToolTab = 'templates'"
                      :class="['nav-link', { active: activeToolTab === 'templates' }]"
                      type="button"
                      role="tab"
                    >
                      <i class="bi bi-collection me-2"></i>템플릿
                    </button>
                  </li>
                </ul>
              </div>

              <div class="card-body">
                <!-- 수식 도구 탭 -->
                <div v-show="activeToolTab === 'math'" class="tab-content">
                  <div class="row g-2">
                    <!-- 수식 검색 -->
                    <div class="col-12">
                      <div class="math-search">
                        <label class="form-label fw-semibold small">수식 검색:</label>
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-light border-end-0">
                            <i class="bi bi-search"></i>
                          </span>
                          <input
                            v-model="searchQuery"
                            placeholder="덧셈, 방정식, 분수..."
                            class="form-control border-start-0"
                            @input="filterMathTemplates"
                          />
                        </div>
                        <div class="search-results mt-2" v-if="filteredTemplates.length > 0 && searchQuery">
                          <div
                            v-for="template in filteredTemplates"
                            :key="template.id"
                            @click="insertMath(template.latex)"
                            class="search-result-item small p-2 border rounded mb-1 cursor-pointer"
                          >
                            <div class="template-name fw-semibold">{{ template.name }}</div>
                            <div class="template-preview text-muted">{{ template.preview }}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 수식 카테고리 -->
                    <div class="col-12">
                      <div class="math-categories">
                        <label class="form-label fw-semibold small">수식 카테고리:</label>
                        <ul class="nav nav-tabs nav-fill" role="tablist">
                          <li class="nav-item" v-for="category in categories" :key="category.id">
                            <button
                              @click="activeCategory = category.id"
                              :class="['nav-link', { active: activeCategory === category.id }]"
                              type="button"
                              role="tab"
                              class="small"
                            >
                              {{ category.name }}
                            </button>
                          </li>
                        </ul>

                        <!-- 카테고리별 수식 버튼 -->
                        <div class="tab-content mt-3">
                          <div v-for="category in categories" :key="category.id" v-show="activeCategory === category.id">
                            <div class="d-grid gap-2">
                              <button
                                v-for="template in category.templates"
                                :key="template.id"
                                @click="insertMath(template.latex)"
                                class="btn btn-outline-primary btn-sm"
                                :title="template.description"
                              >
                                {{ template.name }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 커스텀 수식 입력 -->
                    <div class="col-12">
                      <div class="custom-math">
                        <label class="form-label fw-semibold small">커스텀 수식:</label>
                        <div class="input-group input-group-sm">
                          <input
                            v-model="customMath"
                            placeholder="LaTeX 수식 입력"
                            class="form-control"
                            @keyup.enter="insertCustomMath"
                          />
                          <button
                            @click="insertCustomMath"
                            class="btn btn-primary btn-sm"
                            :disabled="!customMath.trim()"
                          >
                            삽입
                          </button>
                        </div>
                        <div class="math-preview mt-2" v-if="customMath.trim()">
                          <small class="text-muted">미리보기:</small>
                          <div class="preview-content border rounded p-2 bg-light mt-1" v-html="previewMathContent"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 도형 도구 탭 -->
                <div v-show="activeToolTab === 'shapes'" class="tab-content">
                  <div class="row g-2">
                    <div class="col-12">
                      <div class="shape-type">
                        <label class="form-label fw-semibold small">도형 타입:</label>
                        <select v-model="selectedShapeType" class="form-select form-select-sm">
                          <option value="circle">원</option>
                          <option value="rectangle">사각형</option>
                          <option value="triangle">삼각형</option>
                          <option value="polygon">다각형</option>
                          <option value="line">선</option>
                        </select>
                      </div>
                    </div>

                    <div class="col-12">
                      <div class="shape-properties">
                        <div class="mb-2">
                          <label class="form-label small">색상:</label>
                          <input v-model="shapeColor" type="color" class="form-control form-control-color form-control-sm">
                        </div>
                        <div class="mb-2">
                          <label class="form-label small">크기:</label>
                          <div class="input-group input-group-sm">
                            <input v-model="shapeSize" type="number" min="50" max="200" class="form-control" />
                            <span class="input-group-text">px</span>
                          </div>
                        </div>
                        <div class="mb-2">
                          <label class="form-label small">테두리:</label>
                          <div class="input-group input-group-sm">
                            <input v-model="shapeStrokeWidth" type="number" min="1" max="10" class="form-control" />
                            <span class="input-group-text">px</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 도형 위 텍스트/수식 설정 -->
                    <div class="col-12">
                      <div class="shape-text-settings">
                        <h6 class="fw-semibold text-dark mb-2 small">
                          <i class="bi bi-type me-2"></i>텍스트/수식
                        </h6>
                        <div class="mb-2">
                          <input v-model="shapeText" type="text" placeholder="예: O, A, B, θ, α" class="form-control form-control-sm mb-2" />
                          <input v-model="shapeLatex" type="text" placeholder="예: \\frac{a}{b}, \\angle ABC" class="form-control form-control-sm" />
                        </div>
                        <div class="row g-2 mb-2">
                          <div class="col-6">
                            <label class="form-label small">텍스트 색상:</label>
                            <input v-model="textColor" type="color" class="form-control form-control-color w-100" />
                          </div>
                          <div class="col-6">
                            <label class="form-label small">텍스트 크기:</label>
                            <div class="input-group input-group-sm">
                              <input v-model="textSize" type="number" min="8" max="24" class="form-control" />
                              <span class="input-group-text">px</span>
                            </div>
                          </div>
                        </div>
                        <div class="mb-2">
                          <label class="form-label small">위치:</label>
                          <select v-model="textPosition" class="form-select form-select-sm">
                            <option value="top">위쪽</option>
                            <option value="bottom">아래쪽</option>
                            <option value="left">왼쪽</option>
                            <option value="right">오른쪽</option>
                            <option value="center">중앙</option>
                          </select>
                        </div>
                        <div class="d-grid gap-1 mb-2">
                          <button @click="quickTest('circle')" class="btn btn-outline-secondary btn-sm">원 + 점 O</button>
                          <button @click="quickTest('rectangle')" class="btn btn-outline-secondary btn-sm">직사각형 + 수식</button>
                          <button @click="quickTest('triangle')" class="btn btn-outline-secondary btn-sm">삼각형 + 각도</button>
                        </div>
                      </div>
                    </div>

                    <!-- 도형 삽입 버튼 -->
                    <div class="col-12">
                      <button @click="insertShape" class="btn btn-outline-success w-100">
                        <i class="bi bi-plus-circle me-2"></i>도형 삽입
                      </button>
                    </div>

                    <!-- 도형 미리보기 -->
                    <div class="col-12" v-if="showShapePreview">
                      <div class="shape-preview">
                        <label class="form-label fw-semibold small">미리보기:</label>
                        <div class="preview-container border rounded p-2 bg-light mt-2" v-html="shapePreviewHtml"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 템플릿 탭 -->
                <div v-show="activeToolTab === 'templates'" class="tab-content">
                  <div class="row g-2">
                    <div class="col-12">
                      <h6 class="fw-semibold text-dark mb-3 small">저장된 템플릿</h6>
                      <div class="saved-templates">
                        <div v-if="savedTemplates.length === 0" class="text-muted text-center py-4">
                          저장된 템플릿이 없습니다.
                        </div>
                        <div v-else class="template-list">
                          <div
                            v-for="template in savedTemplates"
                            :key="template.id"
                            class="template-item border rounded p-2 mb-2"
                          >
                            <div class="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 class="mb-1 small">{{ template.name }}</h6>
                                <p class="text-muted small mb-2">{{ template.description }}</p>
                              </div>
                              <div class="btn-group btn-group-sm">
                                <button @click="loadTemplate(template)" class="btn btn-outline-primary btn-sm">불러오기</button>
                                <button @click="deleteTemplate(template.id)" class="btn btn-outline-danger btn-sm">삭제</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> <!-- /templates -->
              </div>
            </div>
          </div> <!-- /오른쪽 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Editor from '@tinymce/tinymce-vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import LivePreview from './LivePreview.vue'
import MathEditModal from './MathEditModal.vue'

export default {
  name: 'TinyMCETestComponent',
  components: { Editor, LivePreview, MathEditModal },
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
      // 미리보기는 LivePreview 컴포넌트로 이동

      // 에디터 상태
      editorContent: this.modelValue || '<p>안녕하세요! TinyMCE 테스트입니다.</p>',
      editorInstance: null,
      editorLoaded: false,
      editorError: '',
      retryCount: 0,
      maxRetries: 3,

      // 수식 편집 UI 상태
      showMathEdit: false,
      editingMathId: null,
      editingMathLatex: '',
      editingMathElement: null,

      // 수식 도구
      customMath: '',
      searchQuery: '',
      activeCategory: 'basic',
      activeToolTab: 'math',

      // 도형 관련
      selectedShapeType: 'circle',
      shapeColor: '#000000',
      shapeStrokeWidth: 2,
      shapeSize: 100,
      polygonSides: 6,
      showShapePreview: false,
      shapePreviewHtml: '',
      shapeText: '',
      shapeLatex: '',
      textColor: '#000000',
      textSize: 14,
      textPosition: 'top',

      // 템플릿
      savedTemplates: [],

      finalApiKey: this.apiKey || import.meta.env.VITE_TINYMCE_KEY || '',

      editorConfig: {
        // 에디터 높이 설정 추가
        height: 400,
        min_height: 300,
        max_height: 800,

        readonly: this.readonly,
        branding: false,
        promotion: false,
        menubar: true,
        statusbar: true,
        resize: true,
        language: 'en',
        // language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n/langs6/ko.js', // 한국어 로드 실패로 영어로 변경

        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
          'nonbreaking', 'pagebreak', 'quickbars'
        ],
        toolbar:
          'undo redo | formatselect | bold italic underline strikethrough | ' +
          'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
          'link image media | codesample | table',

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
          }
          /* 수식 편집 관련 스타일은 더 이상 사용하지 않음 */
          .shape-wrap{ display: inline-block; margin: 8px 4px; }
        `,
        verify_html: false,
        extended_valid_elements: 'span[*],div[*],svg[*],circle[*],rect[*],polygon[*],line[*],text[*],*[*]',
        custom_elements: '~math-latex',
        images_upload_handler: (blobInfo) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blobInfo.blob());
          });
        },

        setup: (editor) => {
          this.editorInstance = editor;

          // ---- 수식 편집 관리 ----
          let editingMathId = null;

          const renderMathInEditor = () => {
            try {
              const body = editor.getBody();
              if (!body) return;
              body.querySelectorAll('span.math-latex').forEach(el => {
                let latex = el.getAttribute('data-latex');
                if (!latex) {
                  const raw = (el.textContent || '').trim();
                  const m = raw.match(/^\$(.*)\$$/s);
                  latex = m ? m[1] : raw;
                  el.setAttribute('data-latex', latex);
                }
                el.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode: false });
              });
            } catch (e) {
              console.warn('KaTeX 렌더 실패:', e);
            }
          };

          // 수식 편집 모드 진입
          const enterMathEditMode = (mathElement) => {
            const mathId = 'math-' + Date.now();
            mathElement.setAttribute('data-math-id', mathId);
            editingMathId = mathId;

            // 편집 UI 표시
            this.showMathEditUI(mathElement, mathId);
          };

          // 수식 편집 모드 종료
          const exitMathEditMode = () => {
            editingMathId = null;
            this.hideMathEditUI();
          };

          // 수식 업데이트
          const updateMath = (mathId, newLatex) => {
            const mathElement = editor.getBody().querySelector(`[data-math-id="${mathId}"]`);
            if (mathElement) {
              mathElement.setAttribute('data-latex', newLatex);
              try {
                mathElement.innerHTML = katex.renderToString(newLatex, { throwOnError: false, displayMode: false });
              } catch {
                mathElement.textContent = `$${newLatex}$`;
              }
              mathElement.removeAttribute('data-math-id');
            }
            exitMathEditMode();
          };

          editor.on('init', () => {
            this.editorLoaded = true;
            renderMathInEditor();

            // 에디터 초기화 후 내용 동기화
            this.editorContent = editor.getContent();

            // 수식 더블클릭 → 편집 모드 진입
            editor.on('DblClick', (e) => {
              const target = e.target;
              let mathElement = null;

              if (target.classList && target.classList.contains('math-latex')) {
                mathElement = target;
              } else if (target.closest) {
                mathElement = target.closest('span.math-latex');
              }

              if (mathElement && !editingMathId) {
                e.preventDefault();
                e.stopPropagation();
                enterMathEditMode(mathElement);
              }
            });
          });

          // 내용 변경 시 렌더링
          editor.on('SetContent keyup change input undo redo', () => {
            renderMathInEditor();
            // 에디터 내용을 Vue 데이터와 동기화
            this.editorContent = editor.getContent();
          });

          // 추가 이벤트로 더 확실한 감지
          editor.on('NodeChange', () => {
            // 노드 변경 시 내용 동기화
            this.editorContent = editor.getContent();
          });

          editor.on('SelectionChange', () => {
            // 선택 변경 시에도 내용 확인
            this.editorContent = editor.getContent();
          });

          // 편집 함수들을 Vue 컴포넌트에 노출
          this.enterMathEditMode = enterMathEditMode;
          this.exitMathEditMode = exitMathEditMode;
          this.updateMath = updateMath;
        }
      },

      categories: [
        {
          id: 'basic',
          name: '기본',
          templates: [
            { id: 1, name: '덧셈', latex: 'a + b = c', description: '기본 덧셈', preview: 'a + b = c' },
            { id: 2, name: '뺄셈', latex: 'a - b = c', description: '기본 뺄셈', preview: 'a - b = c' },
            { id: 3, name: '곱셈', latex: 'a \\times b = c', description: '기본 곱셈', preview: 'a × b = c' },
            { id: 4, name: '나눗셈', latex: '\\frac{a}{b} = c', description: '기본 나눗셈', preview: 'a/b = c' }
          ]
        },
        {
          id: 'advanced',
          name: '고급',
          templates: [
            { id: 5, name: '제곱근', latex: '\\sqrt{a} = b', description: '제곱근', preview: '√a = b' },
            { id: 6, name: '지수', latex: 'a^b = c', description: '지수', preview: 'a^b = c' },
            { id: 7, name: '로그', latex: '\\log_a(b) = c', description: '로그', preview: 'log_a(b) = c' },
            { id: 8, name: '적분', latex: '\\int_a^b f(x) dx', description: '적분', preview: '∫f(x)dx' }
          ]
        }
      ],
      filteredTemplates: []
    }
  },
  computed: {
    previewMathContent() {
      if (!this.customMath.trim()) return ''
      try {
        return katex.renderToString(this.customMath, { throwOnError: false, displayMode: false })
      } catch {
        return `<span class="text-danger">LaTeX 오류: ${this.customMath}</span>`
      }
    },

    mathPreviewHtml() {
      if (!this.editingMathLatex.trim()) return ''
      try {
        return katex.renderToString(this.editingMathLatex, { throwOnError: false, displayMode: false })
      } catch {
        return `<span class="text-danger">LaTeX 오류: ${this.editingMathLatex}</span>`
      }
    }
  },
  watch: {
    modelValue(newVal) {
      if (newVal !== this.editorContent) {
        this.editorContent = newVal
      }
    },
    editorContent() {
      // 미리보기는 LivePreview 컴포넌트에서 자동으로 처리됨
      this.$emit('update:modelValue', this.editorContent)
    }
  },
  methods: {
        /* ===== 미리보기 렌더링 ===== */
    // 미리보기는 LivePreview 컴포넌트에서 처리

    /* ===== 수식/도형/템플릿 ===== */
    filterMathTemplates() {
      if (!this.searchQuery.trim()) { this.filteredTemplates = []; return }
      const query = this.searchQuery.toLowerCase()
      this.filteredTemplates = this.categories
        .flatMap(category => category.templates)
        .filter(t => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query))
    },

    quickTest(shapeType) {
      this.selectedShapeType = shapeType
      switch (shapeType) {
        case 'circle': this.shapeText = 'O'; this.shapeLatex = ''; this.textPosition = 'center'; break
        case 'rectangle': this.shapeText = ''; this.shapeLatex = '\\frac{a}{b}'; this.textPosition = 'top'; break
        case 'triangle': this.shapeText = 'θ'; this.shapeLatex = '\\angle ABC'; this.textPosition = 'right'; break
      }
      this.previewShape()
    },

    previewShape() {
      this.shapePreviewHtml = this.generateShapeSVG()
      this.showShapePreview = true
    },

    generateShapeSVG() {
      const size = this.shapeSize
      const cx = size / 2
      const cy = size / 2
      const r = (size - 20) / 2
      let svg = ''
      const textEl = this.shapeText
        ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
                 fill="${this.textColor}" font-size="${this.textSize}">${this.shapeText}</text>`
        : ''

      switch (this.selectedShapeType) {
        case 'circle':
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
          </svg>`; break
        case 'rectangle': {
          const w = size - 20, h = (size - 20) * 0.6, x = (size - w)/2, y = (size - h)/2
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
          </svg>`; break
        }
        case 'triangle': {
          const h = size - 20, w = h * 0.866, x = (size - w)/2, y = 10
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <polygon points="${x + w/2},${y} ${x},${y + h} ${x + w},${y + h}"
                     stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
          </svg>`; break
        }
        case 'line':
          svg = `<svg width="${size}" height="20" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="10" x2="${size - 10}" y2="10" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" />
            ${this.shapeText ? `<text x="${size/2}" y="8" text-anchor="middle" dominant-baseline="central"
              fill="${this.textColor}" font-size="${this.textSize}">${this.shapeText}</text>` : ''}
          </svg>`; break
        case 'polygon': {
          const pts = this.generatePolygonPoints(r, cx, cy)
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <polygon points="${pts}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
          </svg>`; break
        }
        default:
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="${size - 20}" height="${size - 20}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
          </svg>`
      }
      return svg
    },

    generatePolygonPoints(radius, cx, cy) {
      const sides = this.polygonSides || 6
      const pts = []
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2
        pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`)
      }
      return pts.join(' ')
    },

    insertMath(latex) {
      if (!this.editorInstance || !this.editorLoaded) { this.showEditorNotReadyMessage(); return }
      const safe = String(latex || '').trim()
      const html = `<span class="math-latex" data-latex="${safe}">$${safe}$</span>`
      this.editorInstance.insertContent(html)

              // 수식 삽입 완료
    },

    insertCustomMath() {
      if (!this.customMath.trim()) return
      this.insertMath(this.customMath)
      this.customMath = ''
    },

    insertShape() {
      if (!this.editorInstance || !this.editorLoaded) { this.showEditorNotReadyMessage(); return }
      try {
        const svg = this.generateShapeSVG()
        let html = `<div class="shape-wrap" contenteditable="false">${svg}</div>`
        if (this.shapeLatex && this.shapeLatex.trim()) {
          const latex = this.shapeLatex.trim()
          html += `<div class="math-latex" data-latex="${latex}">$${latex}$</div>`
        }
        this.editorInstance.insertContent(html)

        // 도형 삽입 완료
      } catch (e) {
        console.error('도형 삽입 실패:', e)
      }
    },

    loadTemplate(template) {
      const content = template.content || template.latex || template.description || ''
      if (!this.editorInstance || !this.editorLoaded) {
        this.editorContent = content
        this.$emit('update:modelValue', content)
      } else {
        this.editorInstance.insertContent(content)
      }
    },

    deleteTemplate(id) {
      this.savedTemplates = this.savedTemplates.filter(t => t.id !== id)
    },

    showEditorNotReadyMessage() {
      alert('에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
    },

    retryEditorLoad() {
      this.retryCount++;
      if (this.retryCount <= this.maxRetries) {
        this.editorLoaded = false; this.editorError = '';
      } else {
        this.editorError = '에디터 로딩 중 오류가 발생했습니다. 최대 재시도 횟수를 초과했습니다.';
      }
    },

    // 수식 편집 UI 관련 메서드
    showMathEditUI(mathElement, mathId) {
      const latex = mathElement.getAttribute('data-latex') || '';
      this.editingMathId = mathId;
      this.editingMathLatex = latex;
      this.editingMathElement = mathElement;
      this.showMathEdit = true;
    },

    hideMathEditUI() {
      this.showMathEdit = false;
      this.editingMathId = null;
      this.editingMathLatex = '';
      this.editingMathElement = null;
    },

    applyMathEdit(newLatex) {
      console.log('applyMathEdit 호출됨:', this.editingMathId, newLatex);

      if (this.editingMathId && this.editorInstance) {
        // 수식 업데이트
        const mathElement = this.editorInstance.getBody().querySelector(`[data-math-id="${this.editingMathId}"]`);
        console.log('찾은 수식 요소:', mathElement);

        if (mathElement) {
          mathElement.setAttribute('data-latex', newLatex);
          try {
            mathElement.innerHTML = katex.renderToString(newLatex, { throwOnError: false, displayMode: false });
            console.log('수식 렌더링 성공');
          } catch (e) {
            console.warn('수식 렌더링 실패:', e);
            mathElement.textContent = `$${newLatex}$`;
          }
          mathElement.removeAttribute('data-math-id');
        } else {
          console.warn('수식 요소를 찾을 수 없음');
        }

        // 편집 모드 종료
        this.hideMathEditUI();

        // 에디터 내용 동기화
        this.editorContent = this.editorInstance.getContent();
        console.log('에디터 내용 동기화 완료');
      } else {
        console.warn('editingMathId 또는 editorInstance가 없음');
      }
    },

    cancelMathEdit() {
      this.hideMathEditUI();
    }
  },
  mounted() {
    if (this.finalApiKey && this.finalApiKey.endsWith('%')) {
      this.finalApiKey = this.finalApiKey.replace(/%$/, '')
    }
    // 초기 미리보기는 LivePreview 컴포넌트에서 처리
  },
  beforeUnmount() {
    if (this.editorInstance) {
      try { this.editorInstance.destroy() } catch {}
    }
    // previewDebounceTimer는 LivePreview 컴포넌트에서 관리
  }
}
</script>

<style scoped>
/* 미리보기 스타일은 LivePreview 컴포넌트로 이동 */

/* 에디터 바디를 스크롤 컨테이너로 (footer 침범 방지용) */
.editor-body {
  max-height: calc(100vh - 220px); /* 페이지 상단 여백/헤더에 맞게 조정 가능 */
  overflow: visible;
  min-height: 400px; /* 0에서 400px로 변경 */
}

/* TinyMCE 외곽 정렬 */
:deep(.editor-body .tox.tox-tinymce) {
  border: 0;
  border-radius: 0;
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-height: 400px; /* 최소 높이 추가 */
}

/* TinyMCE 내부 스크롤 정돈 - overflow hidden 제거 */
:deep(.editor-body .tox .tox-editor-container) {
  overflow: visible; /* hidden에서 visible로 변경 */
}
:deep(.editor-body .tox .tox-sidebar-wrap) {
  overflow: visible; /* auto에서 visible로 변경 */
  max-height: none; /* 100%에서 none으로 변경 */
}

/* 상태바 보정 */
:deep(.editor-body .tox .tox-statusbar) {
  border-top: 1px solid #e9ecef;
  margin: 0;
}

/* 프로모션 띠 숨김(드물게 뜰 때가 있어요) */
:deep(.editor-body .tox .tox-promotion) { display: none; }

/* 에디터 입력 영역 보장 */
:deep(.editor-body .tox .tox-edit-area) {
  overflow: visible !important;
  min-height: 290px !important; /* 최소 높이 추가 */
}

:deep(.editor-body .tox .tox-edit-area__iframe) {
  overflow: visible !important;
  min-height: 290px !important; /* 최소 높이 추가 */
}

/* 에디터 본문 영역 보장 */
:deep(.editor-body .tox .tox-edit-focus) {
  overflow: visible !important;
  min-height: 290px !important; /* 최소 높이 추가 */
}

/* 에디터 컨테이너 높이 보장 */
:deep(.editor-body .tox .tox-editor-container) {
  min-height: 290px !important;
}

/* 검색 결과 */
.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
}
.search-result-item { padding: 0.5rem 1rem; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background-color 0.2s ease; }
.search-result-item:hover { background-color: #f8f9fa; }
.search-result-item:last-child { border-bottom: none; }

.template-name { display: block; font-weight: 500; color: #495057; }
.template-preview { display: block; font-size: 0.875rem; color: #6c757d; }

/* 도구 내 작은 미리보기 */
.preview-content { min-height: 40px; display: flex; align-items: center; justify-content: center; }

/* 도형 미리보기 */
.preview-container { min-height: 100px; display: flex; align-items: center; justify-content: center; }

/* 템플릿 아이템 */
.template-item { transition: all 0.2s ease; }
.template-item:hover { background-color: #f8f9fa; }

/* API 키 안내 */
.api-key-notice { font-size: 0.875rem; }

/* 수식 편집 UI 스타일은 MathEditModal 컴포넌트로 이동 */
</style>
