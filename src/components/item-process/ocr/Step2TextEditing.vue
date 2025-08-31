<template>
  <div class="step2-container">
    <!-- 좌측: 유형 선택 창 및 OCR 결과 -->
    <div class="left-section">
      <!-- 문제 내 유형 선택 -->
      <div class="type-selection-panel">
        <h5 class="panel-title">문제 내 유형 선택</h5>
        <div class="area-type-tabs">
          <button
            v-for="areaType in availableAreaTypes"
            :key="areaType"
            @click="selectEditingArea(areaType)"
            class="area-type-tab"
            :class="{ active: currentEditingArea === areaType }"
          >
            (1){{ getAreaTypeLabel(areaType) }}
          </button>
        </div>
      </div>

      <!-- 캡처 이미지 -->
      <div class="captured-image-panel">
        <h6 class="panel-subtitle">캡처 이미지</h6>
        <div class="image-container">
          <div v-if="getCurrentAreaImage()" class="area-image">
            <img :src="getCurrentAreaImage()" :alt="`${getAreaTypeLabel(currentEditingArea)} 영역`" />
          </div>
          <div v-else class="no-image">
            선택한 유형의 이미지들
          </div>
        </div>
      </div>

      <!-- OCR 텍스트 변환 -->
      <div class="ocr-result-panel">
        <h6 class="panel-subtitle">OCR 텍스트 변환</h6>
        <div class="ocr-content">
          <div v-if="editedTexts[currentEditingArea]" class="ocr-text">
            <!-- LaTeX 렌더링이 적용된 텍스트 표시 -->
            <div v-html="renderLatexContent(editedTexts[currentEditingArea])"></div>
          </div>
          <div v-else class="no-ocr">
            OCR 결과가 없습니다.
          </div>
        </div>
        <div class="ocr-actions">
          <button
            @click="copyOcrToEditor"
            class="btn btn-primary btn-sm"
            :disabled="!editedTexts[currentEditingArea]"
          >
            에디터 새로고침
          </button>
        </div>
      </div>
    </div>

    <!-- 우측: 에디터 및 도구 -->
    <div class="right-section">
      <!-- TinyMCE 에디터와 도구 -->
      <div class="editor-with-tools">
        <!-- 에디터 섹션 -->
        <div class="editor-panel">
          <div class="editor-header">
            <h5 class="editor-title">TinyMCE 에디터</h5>
          </div>

          <div class="editor-content">
            <Editor
              :key="`editor-${currentEditingArea}-${editorKey}`"
              :api-key="tinymceApiKey"
              :model-value="editedTexts[currentEditingArea] || ''"
              @update:model-value="updateEditedText"
              :init="editorConfig"
              class="tinymce-editor"
            />
          </div>
        </div>

        <!-- 우측 도구 패널 -->
        <div class="right-tools-panel">
          <div class="tool-tabs">
            <button
              @click="activeToolTab = 'math'"
              :class="['tool-tab', { active: activeToolTab === 'math' }]"
            >
              수식
            </button>
            <button
              @click="activeToolTab = 'shapes'"
              :class="['tool-tab', { active: activeToolTab === 'shapes' }]"
            >
              도형
            </button>
            <button
              @click="activeToolTab = 'templates'"
              :class="['tool-tab', { active: activeToolTab === 'templates' }]"
            >
              템플릿
            </button>
          </div>

          <div class="tool-content-container">
            <!-- 수식 도구 -->
            <div v-show="activeToolTab === 'math'" class="tool-content math-tools">
              <div class="tool-sections">
                <div class="tool-section">
                  <h6>수식 검색</h6>
                  <input
                    v-model="mathSearch"
                    type="text"
                    placeholder="덧셈, 방정식, 분수..."
                    class="form-control form-control-sm"
                  />
                  <!-- 검색 결과 -->
                  <div class="search-results mt-2" v-if="filteredMathTemplates.length > 0 && mathSearch">
                    <div
                      v-for="template in filteredMathTemplates"
                      :key="template.id"
                      @click="insertMath(template.latex)"
                      class="search-result-item small p-2 border rounded mb-1"
                    >
                      <div class="template-name fw-semibold">{{ template.name }}</div>
                      <div class="template-preview text-muted">{{ template.preview }}</div>
                    </div>
                  </div>
                </div>
                <div class="tool-section">
                  <h6>수식 입력</h6>
                  <div class="math-buttons">
                    <button @click="insertMath('+')" class="math-btn">덧셈</button>
                    <button @click="insertMath('-')" class="math-btn">뺄셈</button>
                    <button @click="insertMath('\\times')" class="math-btn">곱셈</button>
                    <button @click="insertMath('\\div')" class="math-btn">나눗셈</button>
                    <button @click="insertMath('\\sqrt{}')" class="math-btn">제곱근</button>
                    <button @click="insertMath('^{}')" class="math-btn">지수</button>
                    <button @click="insertMath('\\log')" class="math-btn">로그</button>
                    <button @click="insertMath('\\int')" class="math-btn">적분</button>
                  </div>
                </div>
                <div class="tool-section">
                  <h6>(LaTeX) 미리보기</h6>
                  <div class="latex-preview" v-html="mathPreviewHtml"></div>
                </div>
              </div>
            </div>

            <!-- 도형 도구 -->
            <div v-show="activeToolTab === 'shapes'" class="tool-content shape-tools">
              <div class="tool-sections">
                <div class="tool-section">
                  <h6>도형타입</h6>
                  <select v-model="selectedShapeType" class="form-select form-select-sm">
                    <option value="circle">원</option>
                    <option value="rectangle">사각형</option>
                    <option value="triangle">삼각형</option>
                  </select>
                </div>
                <div class="tool-section">
                  <h6>색상 / 크기 / 테두리</h6>
                  <div class="shape-controls">
                    <input v-model="shapeColor" type="color" class="form-control form-control-color" />
                    <input v-model="shapeSize" type="range" min="50" max="200" class="form-range" />
                    <input v-model="shapeStrokeWidth" type="number" min="1" max="10" class="form-control form-control-sm" />
                  </div>
                </div>
                <div class="tool-section">
                  <h6>텍스트 / 수식</h6>
                  <input v-model="shapeText" placeholder="텍스트" class="form-control form-control-sm mb-2" />
                  <input v-model="shapeLatex" placeholder="LaTeX 수식" class="form-control form-control-sm" />
                </div>
                <div class="tool-section">
                  <h6>(LaTeX) 미리보기</h6>
                  <div class="shape-preview" v-html="shapePreviewHtml"></div>
                  <div class="shape-actions">
                    <button @click="insertShape" class="btn btn-success btn-sm">도형 삽입</button>
                    <button @click="exportShape" class="btn btn-outline-primary btn-sm">내보내기</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 템플릿 도구 -->
            <div v-show="activeToolTab === 'templates'" class="tool-content template-tools">
              <div class="tool-sections">
                <div class="template-list">
                  <div v-if="templates.length === 0" class="no-templates">
                    저장된 템플릿이 없습니다.
                  </div>
                  <div v-for="template in templates" :key="template.id" class="template-item">
                    <h6>{{ template.name }}</h6>
                    <p>{{ template.description }}</p>
                    <button @click="loadTemplate(template)" class="btn btn-outline-primary btn-sm">불러오기</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 전체 미리보기 렌더링뷰 -->
      <div class="preview-panel">
        <h6 class="panel-subtitle">
          전체 미리보기 렌더링뷰 (문제, 이미지, 보기 공간 고정하여 출력)
          <button @click="togglePreview" class="btn btn-sm btn-outline-secondary">
            {{ showPreview ? '접기' : '펼치기' }}
          </button>
        </h6>
        <div v-show="showPreview" class="preview-content">
          <!-- 문제 영역 -->
          <div v-if="editedTexts.problem" class="preview-section">
            <h6>문제</h6>
            <div class="preview-html" v-html="renderLatexContent(editedTexts.problem)"></div>
          </div>
          <!-- 보기 영역 -->
          <div v-if="editedTexts.options" class="preview-section">
            <h6>보기</h6>
            <div class="preview-html" v-html="renderLatexContent(editedTexts.options)"></div>
          </div>
          <!-- 지문 영역 -->
          <div v-if="editedTexts.question" class="preview-section">
            <h6>지문</h6>
            <div class="preview-html" v-html="renderLatexContent(editedTexts.question)"></div>
          </div>
          <!-- 이미지 영역 -->
          <div v-if="editedTexts.image" class="preview-section">
            <h6>이미지</h6>
            <div class="preview-html" v-html="renderLatexContent(editedTexts.image)"></div>
          </div>
        </div>
      </div>

      <!-- 네비게이션 -->
      <div class="navigation-panel">
        <button @click="prevStep" class="btn btn-secondary">이전</button>
        <button @click="nextStep" class="btn btn-primary">다음</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import { createCommonEditorConfig, getTinyMCEApiKey, insertMathToEditor, insertShapeToEditor } from '@/utils/tinymce-common-config'


export default {
  name: 'Step2TextEditing',
  components: {
    Editor
  },
  props: {
    selectedAreas: {
      type: Object,
      required: true
    },
    ocrResults: {
      type: Object,
      required: true
    },
    editedTexts: {
      type: Object,
      required: true
    },
    currentEditingArea: {
      type: String,
      required: true
    }
  },
  emits: [
    'update:editedTexts',
    'update:currentEditingArea',
    'prev-step',
    'next-step'
  ],
  setup(props, { emit }) {
    const showPreview = ref(true)
    const editorKey = ref(0)
    const activeToolTab = ref('math')

    // Math tools
    const mathSearch = ref('')
    const currentMathLatex = ref('')

    // Shape tools
    const selectedShapeType = ref('circle')
    const shapeColor = ref('#000000')
    const shapeSize = ref(100)
    const shapeStrokeWidth = ref(2)
    const shapeText = ref('')
    const shapeLatex = ref('')
    const shapePreviewHtml = ref('')

    // Templates
    const templates = ref([])

    // 수식 검색을 위한 템플릿 데이터 (먼저 정의)
    const mathTemplates = ref([
      { id: 1, name: '이차방정식', latex: 'ax^2 + bx + c = 0', preview: 'ax² + bx + c = 0', category: 'algebra' },
      { id: 2, name: '분수', latex: '\\frac{a}{b}', preview: 'a/b', category: 'algebra' },
      { id: 3, name: '근의 공식', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', preview: 'x = (-b ± √(b²-4ac))/2a', category: 'algebra' },
      { id: 4, name: '피타고라스', latex: 'a^2 + b^2 = c^2', preview: 'a² + b² = c²', category: 'geometry' },
      { id: 5, name: '원의 넓이', latex: 'A = \\pi r^2', preview: 'A = πr²', category: 'geometry' },
      { id: 6, name: '미분', latex: '\\frac{d}{dx}f(x)', preview: 'd/dx f(x)', category: 'calculus' },
      { id: 7, name: '적분', latex: '\\int_a^b f(x) dx', preview: '∫ₐᵇ f(x) dx', category: 'calculus' },
      { id: 8, name: '평균', latex: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i', preview: 'x̄ = (1/n)Σxᵢ', category: 'statistics' }
    ])

    // TinyMCE 설정
    const tinymceApiKey = getTinyMCEApiKey()
    const editorConfig = createCommonEditorConfig(tinymceApiKey)

    // 편집 영역이 변경될 때 에디터 새로고침 (필요한 경우에만)
    watch(() => props.currentEditingArea, (newArea, oldArea) => {
      // 영역이 실제로 변경되었을 때만 에디터 새로고침
      if (newArea && newArea !== oldArea) {
        // 에디터 내용이 변경되었을 때만 새로고침
        if (props.editedTexts[newArea] !== props.editedTexts[oldArea]) {
          editorKey.value += 1
        }
      }
    })

    // 사용 가능한 영역 타입들
    const availableAreaTypes = computed(() => {
      return Object.keys(props.selectedAreas).filter(
        areaType => props.selectedAreas[areaType]
      )
    })

    // 영역 타입별 라벨
    const getAreaTypeLabel = (areaType) => {
      const labels = {
        question: '지문',
        problem: '문제',
        image: '이미지',
        options: '보기'
      }
      return labels[areaType] || areaType
    }

    // 현재 영역의 이미지 가져오기
    const getCurrentAreaImage = () => {
      if (!props.currentEditingArea || !props.selectedAreas[props.currentEditingArea]) {
        return null
      }

      const currentArea = props.selectedAreas[props.currentEditingArea]
      return currentArea.imageData || null
    }

    // 편집 영역 선택
    const selectEditingArea = async (areaType) => {
      try {
        // 현재 편집 중인 내용이 있다면 저장
        if (props.currentEditingArea && props.currentEditingArea !== areaType) {
          // 에디터 내용을 현재 영역에 저장
          const newEditedTexts = { ...props.editedTexts }
          // 현재 에디터 내용을 가져와서 저장 (실제로는 TinyMCE 인스턴스에서 가져와야 함)
          emit('update:editedTexts', newEditedTexts)
        }

        // DOM 업데이트를 기다린 후 새로운 영역으로 전환
        await nextTick()

        // 새로운 영역으로 전환
        emit('update:currentEditingArea', areaType)

        // 추가 DOM 업데이트를 기다림
        await nextTick()

        console.log('편집 영역 변경:', {
          from: props.currentEditingArea,
          to: areaType,
          hasContent: !!props.editedTexts[areaType]
        })
      } catch (error) {
        console.error('편집 영역 변경 중 오류:', error)
      }
    }

    // 현재 편집 영역의 내용을 에디터에 새로고침
    const copyOcrToEditor = () => {
      // 현재 editedTexts의 내용을 에디터에 다시 설정
      const currentContent = props.editedTexts[props.currentEditingArea] || ''

      // 에디터 내용이 변경되었으므로 에디터 새로고침
      editorKey.value += 1

      console.log('에디터 내용 새로고침:', {
        area: props.currentEditingArea,
        content: currentContent.substring(0, 100) + '...'
      })
    }

    // 편집 내용 업데이트
    const updateEditedText = (content) => {
      const newEditedTexts = { ...props.editedTexts }
      newEditedTexts[props.currentEditingArea] = content
      emit('update:editedTexts', newEditedTexts)

      console.log('편집 내용 업데이트:', {
        area: props.currentEditingArea,
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      })
    }

    // 수식 삽입
    const insertMath = (latex) => {
      currentMathLatex.value = latex
      insertMathToEditor(editorConfig, currentMathLatex.value)
    }

    // 도형 삽입
    const insertShape = () => {
      insertShapeToEditor(editorConfig, selectedShapeType.value, shapeColor.value, shapeSize.value, shapeStrokeWidth.value, shapeText.value, shapeLatex.value)
    }

    // 도형 내보내기
    const exportShape = () => {
      // 도형 내보내기 로직
    }

    // 템플릿 로드
    const loadTemplate = (template) => {
      const newEditedTexts = { ...props.editedTexts }
      newEditedTexts[props.currentEditingArea] = template.content || ''
      emit('update:editedTexts', newEditedTexts)
    }

    // 미리보기 토글
    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }

    // 이전 단계로
    const prevStep = () => {
      emit('prev-step')
    }

    // 다음 단계로
    const nextStep = () => {
      emit('next-step')
    }

    // Math preview computed
    const mathPreviewHtml = computed(() => {
      if (!currentMathLatex.value.trim()) return ''
      try {
        return window.katex ?
          window.katex.renderToString(currentMathLatex.value, { throwOnError: false, displayMode: false }) :
          `$${currentMathLatex.value}$`
      } catch {
        return `<span class="text-danger">LaTeX 오류</span>`
      }
    })

    // 수식 검색 결과 (안전장치 추가)
    const filteredMathTemplates = computed(() => {
      if (!mathSearch.value?.trim() || !mathTemplates.value) return []

      const query = mathSearch.value.toLowerCase()
      return mathTemplates.value.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.preview.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      )
    })



    // LaTeX 수식을 KaTeX로 렌더링하는 함수
    const renderLatexContent = (content) => {
      if (!content || typeof content !== 'string') return ''

      try {
        // KaTeX가 로드되었는지 확인
        if (window.katex) {
          // LaTeX 수식을 찾아서 렌더링 ($$...$$ 또는 $...$ 형태)
          return content.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
            try {
              return window.katex.renderToString(latex, {
                throwOnError: false,
                displayMode: true
              })
            } catch {
              return match
            }
          }).replace(/\$([^$]+)\$/g, (match, latex) => {
            try {
              return window.katex.renderToString(latex, {
                throwOnError: false,
                displayMode: false
              })
            } catch {
              return match
            }
          })
        } else {
          // KaTeX가 로드되지 않은 경우 LaTeX 코드를 그대로 표시
          return content
        }
      } catch (error) {
        console.warn('LaTeX 렌더링 오류:', error)
        return content
      }
    }

    // KaTeX 로드 확인 및 로드 함수
    const ensureKatexLoaded = () => {
      if (window.katex) return Promise.resolve()

      return new Promise((resolve, reject) => {
        // KaTeX CSS 로드
        if (!document.querySelector('link[href*="katex"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
          link.onload = () => {
            // KaTeX JS 로드
            if (!window.katex) {
              const script = document.createElement('script')
              script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
              script.onload = resolve
              script.onerror = reject
              document.head.appendChild(script)
            } else {
              resolve()
            }
          }
          link.onerror = reject
          document.head.appendChild(link)
        } else {
          resolve()
        }
      })
    }

    // 컴포넌트 마운트 시 초기화 및 KaTeX 로드
    onMounted(async () => {
      try {
        await ensureKatexLoaded()
        console.log('Step2TextEditing 초기화 완료 - KaTeX 로드 완료')
      } catch (error) {
        console.warn('Step2TextEditing 초기화 실패:', error)
      }
    })

    return {
      showPreview,
      editorKey,
      activeToolTab,
      mathSearch,
      currentMathLatex,
      selectedShapeType,
      shapeColor,
      shapeSize,
      shapeStrokeWidth,
      shapeText,
      shapeLatex,
      shapePreviewHtml,
      templates,
      tinymceApiKey,
      editorConfig,
      availableAreaTypes,
      mathPreviewHtml,
      mathTemplates,
      filteredMathTemplates,
      renderLatexContent,
      ensureKatexLoaded,
      getAreaTypeLabel,
      getCurrentAreaImage,
      selectEditingArea,
      copyOcrToEditor,
      updateEditedText,
      insertMath,
      insertShape,
      exportShape,
      loadTemplate,
      togglePreview,
      prevStep,
      nextStep
    }
  }
}
</script>

<style scoped>
.step2-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  height: 100vh;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
}

/* 좌측 영역 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.type-selection-panel,
.captured-image-panel,
.ocr-result-panel {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.panel-title {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid #e9ecef;
}

.panel-subtitle {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  border-bottom: 1px solid #e9ecef;
}

.area-type-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
}

.area-type-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.area-type-tab:hover {
  background: #e9ecef;
}

.area-type-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.image-container,
.ocr-content {
  padding: 1rem;
  min-height: 120px;
}

.area-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.no-image,
.no-ocr {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 4px;
}

.ocr-text {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.ocr-actions {
  margin-top: 0.75rem;
}

/* 우측 영역 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

/* 에디터와 도구를 나란히 배치 - Flexbox 방식 */
.editor-with-tools {
  display: flex;
  flex-direction: row;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  height: 500px;
  width: 100%;
}

.editor-panel {
  flex: 2;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e9ecef;
  height: 100%;
}

.right-tools-panel {
  flex: 1;
  background: #f8f9fa;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
  min-width: 250px;
}

.editor-header {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.tool-tabs {
  display: flex;
  gap: 0.5rem;
}

.tool-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.tool-tab:hover {
  background: #e9ecef;
}

.tool-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.editor-content {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tinymce-editor {
  flex: 1;
  height: 100%;
}


.tool-content-container {
  flex: 1;
  overflow-y: auto;
}

.tool-content {
  display: block;
}

.tool-sections {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tool-section {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.tool-section h6 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.math-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.25rem;
}

.math-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.math-btn:hover {
  background: #e9ecef;
}

.shape-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.shape-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.latex-preview,
.shape-preview {
  min-height: 60px;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
}

.preview-panel {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.preview-content {
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: #f8f9fa;
}

.preview-section h6 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.preview-html {
  font-size: 0.875rem;
  line-height: 1.4;
}

.navigation-panel {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: white;
}

.template-item h6 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.template-item p {
  margin: 0 0 0.5rem 0;
  font-size: 0.75rem;
  color: #6c757d;
}

.no-templates {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 2rem;
}

/* 수식 검색 결과 스타일링 */
.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: #f8f9fa;
}

.search-result-item {
  background: white;
  border-color: #dee2e6 !important;
  transition: all 0.2s ease;
  cursor: pointer;
}

.search-result-item:hover {
  background: #e9ecef;
  border-color: #007bff !important;
}

.search-result-item .template-name {
  color: #495057;
  font-size: 0.875rem;
}

.search-result-item .template-preview {
  color: #6c757d;
  font-size: 0.75rem;
}

/* LaTeX 렌더링 스타일링 */
.ocr-text .katex,
.preview-html .katex {
  font-size: 1em;
  line-height: 1.2;
}

.ocr-text .katex-display,
.preview-html .katex-display {
  margin: 0.5em 0;
  text-align: center;
}

.ocr-text .katex-error,
.preview-html .katex-error {
  color: #dc3545;
  background: #f8d7da;
  padding: 0.25em 0.5em;
  border-radius: 0.25em;
  font-family: monospace;
}

/* TinyMCE 스타일링 */
:deep(.tox-tinymce) {
  border: none !important;
  border-radius: 4px !important;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .step2-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .editor-with-tools {
    flex-direction: column;
    height: auto;
  }

  .editor-panel {
    border-right: none;
    border-bottom: 1px solid #e9ecef;
    flex: none;
  }

  .right-tools-panel {
    flex: none;
  }
}

@media (max-width: 768px) {
  .step2-container {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .area-type-tabs {
    flex-direction: column;
  }

  .tool-tabs {
    flex-direction: column;
  }

  .navigation-panel {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
