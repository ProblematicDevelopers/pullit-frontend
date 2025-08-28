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
                <MathTools
                  :active-tool-tab="activeToolTab"
                  @insert-math="insertMath"
                />

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

                        <!-- 파일 히스토리 테스트 -->
                        <div class="mt-3 p-3 bg-light rounded">
                          <h6 class="fw-semibold text-dark mb-2 small">
                            <i class="bi bi-file-earmark-text me-2"></i>파일 히스토리 테스트
                          </h6>
                          <div class="mb-2">
                            <label class="form-label small">과목 ID:</label>
                            <input
                              v-model.number="currentSubjectId"
                              type="number"
                              placeholder="과목 ID를 입력하세요"
                              class="form-control form-control-sm"
                            />
                          </div>
                          <div class="d-grid">
                            <button
                              @click="testFileHistory"
                              class="btn btn-outline-primary btn-sm"
                              :disabled="!currentSubjectId"
                            >
                              파일 히스토리 생성 테스트
                            </button>
                          </div>
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
import MathTools from './MathTools.vue'
import { fileHistoryAPI } from '@/services/fileHistoryApi'

export default {
  name: 'TinyMCETestComponent',
  components: { Editor, LivePreview, MathEditModal, MathTools },
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

      // 파일 히스토리 관련
      currentSubjectId: null, // 현재 선택된 과목 ID

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
          return new Promise((resolve, reject) => {
            try {
              // 파일을 base64로 변환
              const reader = new FileReader();
              reader.onload = () => {
                const base64Data = reader.result;

                // 파일 히스토리 생성 (과목 ID가 있는 경우에만)
                if (this.currentSubjectId) {
                  // 비동기로 파일 히스토리 생성
                  this.createFileHistoryAfterUpload(Date.now()).catch(error => {
                    console.error('파일 히스토리 생성 실패:', error);
                  });
                }

                resolve(base64Data);
              };
              reader.readAsDataURL(blobInfo.blob());
            } catch (error) {
              reject(error);
            }
          });
        },

        setup: (editor) => {
          this.editorInstance = editor;

                    // ---- 수식 편집 관리 ----
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

            // 편집 UI 표시
            this.showMathEditUI(mathElement, mathId);
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

              if (mathElement && !this.showMathEdit) {
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
        }
      },

      // 수식 관련 데이터는 MathTools 컴포넌트로 이동
    }
  },
  computed: {
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
    // 도형 관련 속성 변경 시 미리보기 자동 업데이트
    shapeText() {
      if (this.showShapePreview) {
        this.previewShape()
      }
    },
    shapeLatex() {
      if (this.showShapePreview) {
        this.previewShape()
      }
    },
    textPosition() {
      if (this.showShapePreview) {
        this.previewShape()
      }
    },
    textColor() {
      if (this.showShapePreview) {
        this.previewShape()
      }
    },
    textSize() {
      if (this.showShapePreview) {
        this.previewShape()
      }
    },
    shapeColor() {
      if (this.showShapePreview) {
        this.previewShape()
      }
    },
    shapeStrokeWidth() {
      if (this.showShapePreview) {
        this.previewShape()
      }
    },
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
    // 수식 관련 메서드는 MathTools 컴포넌트로 이동

    quickTest(shapeType) {
      this.selectedShapeType = shapeType
      switch (shapeType) {
        case 'circle':
          this.shapeText = 'O';
          this.shapeLatex = '';
          this.textPosition = 'center';
          break
        case 'rectangle':
          this.shapeText = '';
          this.shapeLatex = '\\frac{a}{b}';
          this.textPosition = 'top';
          break
        case 'triangle':
          this.shapeText = 'θ';
          this.shapeLatex = '\\angle ABC';
          this.textPosition = 'right';
          break
      }
      // 미리보기 강제 업데이트
      this.$nextTick(() => {
        this.previewShape()
      })
    },

    previewShape() {
      console.log('previewShape 호출됨:', {
        selectedShapeType: this.selectedShapeType,
        shapeText: this.shapeText,
        shapeLatex: this.shapeLatex,
        textPosition: this.textPosition
      })

      this.shapePreviewHtml = this.generateShapeSVG()
      this.showShapePreview = true

      console.log('미리보기 HTML 생성됨:', this.shapePreviewHtml)
      console.log('showShapePreview:', this.showShapePreview)
    },

    generateShapeSVG() {
      console.log('generateShapeSVG 호출됨:', {
        selectedShapeType: this.selectedShapeType,
        shapeSize: this.shapeSize,
        shapeColor: this.shapeColor,
        shapeStrokeWidth: this.shapeStrokeWidth
      })

      const size = this.shapeSize
      const cx = size / 2
      const cy = size / 2
      const r = (size - 20) / 2
      let svg = ''

      // 텍스트/수식 위치 계산
      let textX = cx, textY = cy
      let textAnchor = 'middle'
      let dominantBaseline = 'middle'

      // 위치에 따른 텍스트/수식 좌표 조정
      switch (this.textPosition) {
        case 'top':
          textY = 15
          dominantBaseline = 'hanging'
          break
        case 'bottom':
          textY = size - 15
          dominantBaseline = 'auto'
          break
        case 'left':
          textX = 15
          textAnchor = 'start'
          dominantBaseline = 'middle'
          break
        case 'right':
          textX = size - 15
          textAnchor = 'end'
          dominantBaseline = 'middle'
          break
        case 'center':
        default:
          textX = cx
          textY = cy
          textAnchor = 'middle'
          dominantBaseline = 'middle'
          break
      }

      // 텍스트 요소 생성
      const textEl = this.shapeText
        ? `<text x="${textX}" y="${textY}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}"
                 fill="${this.textColor}" font-size="${this.textSize}">${this.shapeText}</text>`
        : ''

      // 수식 요소 생성 (LaTeX가 있는 경우)
      const mathEl = this.shapeLatex && this.shapeLatex.trim()
        ? `<text x="${textX}" y="${textY + (this.shapeText ? 20 : 0)}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}"
                 fill="${this.textColor}" font-size="${this.textSize}">$${this.shapeLatex.trim()}$</text>`
        : ''

      switch (this.selectedShapeType) {
        case 'circle':
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
            ${mathEl}
          </svg>`; break
        case 'rectangle': {
          const w = size - 20, h = (size - 20) * 0.6, x = (size - w)/2, y = (size - h)/2
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
            ${mathEl}
          </svg>`; break
        }
        case 'triangle': {
          const h = size - 20, w = h * 0.866, x = (size - w)/2, y = 10
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <polygon points="${x + w/2},${y} ${x},${y + h} ${x + w},${y + h}"
                     stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
            ${mathEl}
          </svg>`; break
        }
        case 'line':
          svg = `<svg width="${size}" height="20" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="10" x2="${size - 10}" y2="10" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" />
            ${this.shapeText ? `<text x="${size/2}" y="8" text-anchor="middle" dominant-baseline="central"
              fill="${this.textColor}" font-size="${this.textSize}">${this.shapeText}</text>` : ''}
            ${mathEl}
          </svg>`; break
        case 'polygon': {
          const pts = this.generatePolygonPoints(r, cx, cy)
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <polygon points="${pts}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
            ${mathEl}
          </svg>`; break
        }
        default:
          svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="${size - 20}" height="${size - 20}" stroke="${this.shapeColor}" stroke-width="${this.shapeStrokeWidth}" fill="none" />
            ${textEl}
            ${mathEl}
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

    // insertCustomMath는 MathTools 컴포넌트로 이동

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
    },

    // 파일 히스토리 관련 메서드
    async createFileHistoryAfterUpload(fileMetadataId) {
      try {
        if (!this.currentSubjectId) {
          console.warn('과목 ID가 설정되지 않았습니다.');
          return;
        }

        const response = await fileHistoryAPI.createFileHistory(fileMetadataId, this.currentSubjectId);
        console.log('파일 히스토리 생성 완료:', response.data);
        return response.data;
      } catch (error) {
        console.error('파일 히스토리 생성 실패:', error);
        throw error;
      }
    },

    // 과목 ID 설정 메서드
    setCurrentSubjectId(subjectId) {
      this.currentSubjectId = subjectId;
      console.log('현재 과목 ID 설정됨:', subjectId);
    },

    // 파일 히스토리 테스트 메서드
    async testFileHistory() {
      try {
        if (!this.currentSubjectId) {
          alert('과목 ID를 먼저 입력해주세요.');
          return;
        }

        const testFileMetadataId = Date.now(); // 테스트용 임시 ID
        const result = await this.createFileHistoryAfterUpload(testFileMetadataId);

        if (result) {
          alert(`파일 히스토리 생성 성공!\n파일 히스토리 ID: ${result.data}`);
        }
      } catch (error) {
        alert(`파일 히스토리 생성 실패: ${error.message}`);
      }
    }
  },
  mounted() {
    if (this.finalApiKey && this.finalApiKey.endsWith('%')) {
      this.finalApiKey = this.finalApiKey.replace(/%$/, '')
    }

    // 초기 도형 미리보기 설정
    this.$nextTick(() => {
      console.log('컴포넌트 마운트됨, 초기 도형 미리보기 설정')
      this.previewShape()
    })
  },
  beforeUnmount() {
    if (this.editorInstance) {
      try {
        this.editorInstance.destroy()
      } catch (error) {
        console.warn('에디터 인스턴스 정리 중 오류 발생:', error);
      }
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

/* 수식 관련 스타일은 MathTools 컴포넌트로 이동 */

/* 도형 미리보기 */
.preview-container { min-height: 100px; display: flex; align-items: center; justify-content: center; }

/* 템플릿 아이템 */
.template-item { transition: all 0.2s ease; }
.template-item:hover { background-color: #f8f9fa; }

/* API 키 안내 */
.api-key-notice { font-size: 0.875rem; }

/* 수식 편집 UI 스타일은 MathEditModal 컴포넌트로 이동 */
</style>
