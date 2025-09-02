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

          <div v-if="localEditedTexts[currentEditingArea] && localEditedTexts[currentEditingArea].trim()" class="ocr-text">
            <!-- LaTeX 렌더링이 적용된 텍스트 표시 -->
            <div class="ocr-text-content tex2jax_process" v-html="renderedOcrText"></div>

          </div>
          <div v-else class="no-ocr">
            OCR 결과가 없습니다.
            <br><small class="text-muted">현재 편집 영역: {{ currentEditingArea || '없음' }}</small>
            <br><small class="text-muted">editedTexts 내용: {{ localEditedTexts[currentEditingArea] || '빈 문자열' }}</small>
          </div>


        </div>
        <div class="ocr-actions">
          <button
            @click="copyOcrToEditor"
            class="btn btn-primary btn-sm me-2 mb-2 w-50"
            :disabled="!localEditedTexts[currentEditingArea]"
          >
            <i class="bi bi-arrow-clockwise me-1 "></i>에디터 새로고침
          </button>
          <button
            @click="syncEditorToPreview"
            class="btn btn-success btn-sm mb-2 w-50"
            :disabled="!editorInstance"
          >
            <i class="bi bi-arrow-down-circle me-1 "></i>미리보기 동기화
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
              id="tm-editor-main"
              :api-key="tinymceApiKey"
              :model-value="localEditedTexts[currentEditingArea] || ''"
              @update:model-value="updateEditedText"
              :init="editorConfig"
              class="tinymce-editor"
              @init="onEditorInit"
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

          </div>

          <div class="tool-content-container">
            <!-- 수식 도구 -->
            <div v-if="activeToolTab === 'math'" class="tool-content math-tools">
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
            <div v-if="activeToolTab === 'shapes'" class="tool-content shape-tools">
              <div class="tool-sections">
                <!-- LaTeX 기반 도형 (수정 가능) -->
                <div class="tool-section">
                  <h6>LaTeX 도형 (수정 가능)</h6>
                  <div class="shape-buttons">
                    <button @click="insertMath('\\bigcirc')" class="shape-btn">원 ○</button>
                    <button @click="insertMath('\\triangle')" class="shape-btn">삼각형 △</button>
                    <button @click="insertMath('\\square')" class="shape-btn">사각형 □</button>
                    <button @click="insertMath('\\diamond')" class="shape-btn">다이아몬드 ◇</button>
                    <button @click="insertMath('\\overline{AB}')" class="shape-btn">직선 AB</button>
                    <button @click="insertMath('\\angle ABC')" class="shape-btn">각도 ∠ABC</button>
                    <button @click="insertMath('AB \\parallel CD')" class="shape-btn">평행선 ∥</button>
                    <button @click="insertMath('AB \\perp CD')" class="shape-btn">수직선 ⊥</button>
                  </div>
                  <div class="mt-2">
                    <small class="text-muted">※ LaTeX 도형은 에디터에서 직접 수정 가능합니다</small>
                  </div>
                </div>

                <!-- 기존 도형 도구 (수정 불가) -->
                <div class="tool-section">
                  <h6>기존 도형 도구 (수정 불가)</h6>
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
                  <input v-model="shapeLatex" placeholder="예: \\triangle ABC, \\angle A, \\frac{a}{b}" class="form-control form-control-sm" />
                </div>
                <div class="tool-section">
                  <h6>(LaTeX) 미리보기</h6>
                  <div class="shape-preview" v-html="shapePreviewHtml"></div>
                  <div class="shape-actions">
                    <button @click="exportShapeAsSvg" class="btn btn-primary btn-sm">SVG 내보내기</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 템플릿 도구 -->
            <div v-if="activeToolTab === 'templates'" class="tool-content template-tools">
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
        <div v-if="showPreview" class="preview-content">
                    <!-- 문제 영역 -->
          <div v-if="localEditedTexts.problem" class="preview-section">
            <h6>문제</h6>
            <div class="preview-html" v-html="problemPreview"></div>
          </div>
          <!-- 보기 영역 -->
          <div v-if="localEditedTexts.options" class="preview-section">
            <h6>보기</h6>

            <!-- 보기 내용 (단순화된 구조) -->
            <div class="options-content">
              <!-- 객관식일 때 번호와 함께 표시 -->
              <div v-if="questionType === 'fiveChoice'" class="multiple-choice-options">
                <div v-for="(option, index) in optionsList" :key="index" class="option-item">
                  <span class="option-number">({{ index + 1 }})</span>
                  <span class="option-content" v-html="option"></span>
                </div>
              </div>

              <!-- 주관식일 때 일반 텍스트로 표시 -->
              <div v-else class="subjective-options">
                <div class="options-text" v-html="optionsPreview"></div>
              </div>
            </div>
          </div>
          <!-- 지문 영역 -->
          <div v-if="localEditedTexts.question" class="preview-section">
            <h6>지문</h6>
            <div class="preview-html" v-html="questionPreview"></div>
          </div>
          <!-- 이미지 영역 - 사용자가 실제로 image 타입을 선택했을 때만 표시 -->
          <div v-if="currentEditingArea === 'image' && getCurrentAreaImage()" class="preview-section">
            <h6>선택된 이미지 영역</h6>
            <div class="preview-html">
              <img :src="getCurrentAreaImage()" alt="선택된 이미지 영역" class="problem-image" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, markRaw } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import { createCommonEditorConfig, getTinyMCEApiKey, insertShapeToEditor } from '@/utils/tinymce-common-config'
import { renderMathJax, waitForMathJax } from '@/utils/mathjax'


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
      type: Array,
      required: true
    },
    editedTexts: {
      type: Object,
      required: true
    },
    currentEditingArea: {
      type: String,
      required: true
    },
    passage: {
      type: String,
      default: ''
    }
  },
  emits: [
    'update:edited-texts',
    'update:current-editing-area',
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

        // 도형 미리보기 (computed로 변경)
    const shapePreviewHtml = computed(() => {
      if (!shapeLatex.value && !shapeText.value && !selectedShapeType.value) {
        return '<div class="text-muted">미리보기</div>'
      }

      let previewContent = ''

      // 실제 도형 시각화 추가
      const shapeStyle = `
        width: ${shapeSize.value}px;
        height: ${shapeSize.value}px;
        border: ${shapeStrokeWidth.value}px solid ${shapeColor.value};
        background-color: ${shapeColor.value}20;
        margin: 0 auto 1rem auto;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      `

      // 선택된 도형 타입에 따른 시각적 표현
      let shapeElement = ''
      const textContent = shapeText.value ? `<span style="color: ${shapeColor.value}; font-weight: bold;">${shapeText.value}</span>` : ''

      switch (selectedShapeType.value) {
        case 'circle':
          shapeElement = `<div class="shape-visual circle" style="${shapeStyle} border-radius: 50%;">${textContent}</div>`
          break
        case 'rectangle':
          shapeElement = `<div class="shape-visual rectangle" style="${shapeStyle} border-radius: 4px;">${textContent}</div>`
          break
        case 'triangle': {
          // 삼각형을 SVG로 그려서 색상 제어
          const triangleSize = shapeSize.value
          const strokeWidth = shapeStrokeWidth.value
          shapeElement = `
            <div class="shape-visual triangle" style="margin: 0 auto 1rem auto; position: relative;">
              <svg width="${triangleSize}" height="${triangleSize}" viewBox="0 0 ${triangleSize} ${triangleSize}">
                <polygon
                  points="${triangleSize/2},${strokeWidth} ${strokeWidth},${triangleSize-strokeWidth} ${triangleSize-strokeWidth},${triangleSize-strokeWidth}"
                  fill="${shapeColor.value}20"
                  stroke="${shapeColor.value}"
                  stroke-width="${strokeWidth}"
                />
              </svg>
            </div>
          `
          if (textContent) {
            shapeElement += `<div style="text-align: center; margin-top: -${triangleSize/2}px; color: ${shapeColor.value}; font-weight: bold;">${textContent}</div>`
          }
          break
        }
        default:
          shapeElement = `<div class="shape-visual default" style="${shapeStyle} border-radius: 4px;">${textContent}</div>`
      }

      previewContent += shapeElement

      // LaTeX 수식이 있으면 렌더링 (텍스트와 별도로)
      if (shapeLatex.value) {
        previewContent += `<div class="shape-latex-preview">$${shapeLatex.value}$</div>`
      } else if (selectedShapeType.value) {
        // LaTeX 수식이 없을 때 예시 표시
        let exampleLatex = ''
        switch (selectedShapeType.value) {
          case 'circle':
            exampleLatex = '\\bigcirc'
            break
          case 'rectangle':
            exampleLatex = '\\square'
            break
          case 'triangle':
            exampleLatex = '\\triangle ABC'
            break
          default:
            exampleLatex = '\\square'
        }
        previewContent += `<div class="shape-latex-preview ">예시: $${exampleLatex}$</div>`
      }

      return previewContent
    })

    // 보기 선택 기능
    const selectedOptions = ref([true, false, false, false, false]) // 첫 번째는 기본 선택

    // 문제 유형 자동 감지
    const detectQuestionType = (questionText, optionsText) => {
      if (!optionsText || optionsText.trim() === '') {
        return 'freeChoice' // 보기가 없으면 자유 선지형
      }

      // 객관식 패턴 감지
      const hasOptions = /\(\d+\)/.test(optionsText)
      const hasMultipleChoice = /[①②③④⑤⑥⑦⑧⑨⑩]/.test(optionsText) // 원문자 패턴

      if (hasOptions || hasMultipleChoice) {
        return 'multiple-choice'
      }

      return 'subjective'
    }

    // 문제 유형 computed
    const questionType = computed(() => {
      return detectQuestionType(props.editedTexts.question, props.editedTexts.options)
    })

        // 보기 텍스트를 항목별로 분리하는 함수
    const splitOptions = (optionsText) => {
      if (!optionsText) return []

      // 옵션을 수동으로 분리하는 방법
      const options = []
      const parts = optionsText.split(/(?=\(\d+\))/g) // (숫자) 앞에서 분리

      for (const part of parts) {
        if (part.trim()) {
          // (숫자) 부분을 제거하고 나머지 내용만 추출
          const content = part.replace(/\(\d+\)\s*/, '').trim()
          if (content) {
            options.push(content)
          }
        }
      }

      return options
    }

    // 보기 텍스트를 줄바꿈이 포함된 형태로 변환하는 함수 (새로운 방식)
    const formatOptionsWithLineBreaks = (optionsText) => {
      if (!optionsText) return ''

      // splitOptions를 사용해서 각 옵션을 분리한 후 줄바꿈으로 연결
      const options = splitOptions(optionsText)
      return options.join('\n')
    }



    // 보기 목록 computed
    const optionsList = computed(() => {
      const optionsText = localEditedTexts.value.options
      const result = splitOptions(optionsText)

      // optionsList가 변경될 때 MathJax 렌더링 실행
      nextTick(() => {
        renderOptionsMathJax()
      })

      return result
    })

    // 선택된 보기 텍스트
    const selectedOptionsText = computed(() => {
      return optionsList.value
        .map((option, index) => selectedOptions.value[index] ? option : null)
        .filter(Boolean)
        .join('\n')
    })

    // 보기 선택 상태 초기화
    const initializeOptionsSelection = () => {
      const optionsCount = optionsList.value.length
      if (optionsCount > 0) {
        // 배열 크기 조정 (필수 제약 없음)
        selectedOptions.value = new Array(Math.min(optionsCount, 5)).fill(false)
        // 첫 번째도 선택하지 않음 (자유 선택)
      }
    }

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
      { id: 8, name: '평균', latex: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i', preview: 'x̄ = (1/n)Σxᵢ', category: 'statistics' },
      // 도형 LaTeX 템플릿 추가
      { id: 9, name: '원', latex: '\\bigcirc', preview: '○', category: 'shapes' },
      { id: 10, name: '삼각형', latex: '\\triangle', preview: '△', category: 'shapes' },
      { id: 11, name: '사각형', latex: '\\square', preview: '□', category: 'shapes' },
      { id: 12, name: '다이아몬드', latex: '\\diamond', preview: '◇', category: 'shapes' },
      { id: 13, name: '직선', latex: '\\overline{AB}', preview: 'AB', category: 'shapes' },
      { id: 14, name: '각도', latex: '\\angle ABC', preview: '∠ABC', category: 'shapes' },
      { id: 15, name: '평행선', latex: 'AB \\parallel CD', preview: 'AB ∥ CD', category: 'shapes' },
      { id: 16, name: '수직선', latex: 'AB \\perp CD', preview: 'AB ⊥ CD', category: 'shapes' }
    ])

    // TinyMCE 설정 (에디터 내 MathJax 렌더링 비활성화)
    const tinymceApiKey = getTinyMCEApiKey()
    const editorConfig = createCommonEditorConfig({
      enableMathTools: false, // MathJax 렌더링 비활성화
      enableImageUpload: true, // 이미지 업로드 활성화
      setup: (editor) => {
        // MathJax 렌더링 비활성화 - 에디터 내에서는 LaTeX 코드만 표시
        editor.on('init', () => {
          // 기존의 renderMathInEditor 함수를 오버라이드하여 아무것도 하지 않음
          editor.renderMathInEditor = () => {
            console.log('에디터 내 MathJax 렌더링 비활성화됨')
          }
        })

        // 변화 감지 - 더 즉각적으로 반응
        editor.on('input keyup change undo redo paste cut', () => {
          if (editor.removed !== true && editor.getContent && typeof editor.getContent === 'function') {
            try {
              const content = editor.getContent()

              // 로컬 상태 즉시 업데이트 (미리보기 즉시 반영) - 완전히 새로 할당
              localEditedTexts.value = {
                ...localEditedTexts.value,
                [props.currentEditingArea]: content
              }

              console.log('로컬 상태 업데이트:', {
                area: props.currentEditingArea,
                content: content.substring(0, 100) + '...',
                localEditedTexts: localEditedTexts.value
              })

              // 즉시 emit하여 부모 컴포넌트에 반영
              emitEdited(props.currentEditingArea, content)

              // MathJax 렌더링도 즉시 업데이트 (미리보기에서만)
              nextTick(async () => {
                await reRenderMathJax()
                // 보기 영역이 현재 편집 중인 경우 추가 렌더링
                if (props.currentEditingArea === 'options') {
                  await renderOptionsMathJax()
                }
                // 미리보기 영역 렌더링
                await renderPreviewMathJax()
              })
            } catch (getContentError) {
              console.warn('⚠️ 에디터 내용 가져오기 실패:', getContentError)
            }
          }
        })
      }
    })







    // editedTexts가 변경될 때 LaTeX 렌더링 강제 업데이트 및 에디터 동기화
    watch(() => props.editedTexts, async (newTexts, oldTexts) => {
      try {
        // 다음 tick에서 DOM 업데이트를 기다린 후 강제로 렌더링 다시 실행
        await nextTick()

        // 현재 편집 영역의 내용이 변경되었는지 확인
        const currentArea = props.currentEditingArea
        if (currentArea && newTexts[currentArea] !== oldTexts?.[currentArea]) {
          // 에디터 내용을 업데이트된 내용으로 동기화
          if (editorInstance.value && !editorInstance.value.destroyed) {
            try {
              const currentEditorContent = editorInstance.value.getContent()
              const newContent = newTexts[currentArea] || ''

              // 에디터 내용과 새로운 내용이 다르면 업데이트
              if (currentEditorContent !== newContent) {
                editorInstance.value.setContent(newContent)
                console.log('에디터 내용 동기화 완료:', currentArea)
              }
            } catch (error) {
              console.warn('에디터 내용 동기화 실패:', error)
            }
          }
        }

        // LaTeX 렌더링이 자동으로 업데이트되도록 강제 리렌더링
        await reRenderMathJax()
      } catch (error) {
        console.error('editedTexts 변경 감지 중 오류:', error)
      }
    }, { deep: true, flush: 'post' })

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

      // 좌표 정보 디버깅
      console.log('Step2 - 현재 영역 정보:', {
        areaType: props.currentEditingArea,
        area: currentArea,
        좌표정보: {
          화면좌표: { x: currentArea.x, y: currentArea.y, width: currentArea.width, height: currentArea.height },
          원본좌표: { x: currentArea.originalX, y: currentArea.originalY, width: currentArea.originalWidth, height: currentArea.originalHeight },
          줌레벨: currentArea.zoomLevel
        }
      })

      return currentArea.imageData || null
    }

    // 현재 영역의 정보 가져오기
    const getCurrentAreaInfo = () => {
      if (!props.currentEditingArea || !props.selectedAreas[props.currentEditingArea]) {
        return null
      }

      return props.selectedAreas[props.currentEditingArea]
    }

    // 편집 영역 전환 상태 (중복 호출 방지)
    const switching = ref(false)

    // 편집 영역 선택 (직렬화된 버전 - 중복 호출/렌더 재진입 방지)
    const selectEditingArea = async (areaType) => {
      if (switching.value || props.currentEditingArea === areaType) {
        return
      }

      switching.value = true
      try {
        console.log('편집 영역 선택 시작:', { from: props.currentEditingArea, to: areaType })

        // 현재 내용 저장 (안전하게)
        if (editorInstance.value && props.currentEditingArea) {
          try {
            if (typeof editorInstance.value.getContent === 'function' && editorInstance.value.removed !== true) {
              const currentContent = editorInstance.value.getContent()
              if (currentContent) {
                const newEditedTexts = { ...props.editedTexts }
                newEditedTexts[props.currentEditingArea] = currentContent
                emit('update:edited-texts', newEditedTexts)
                console.log('현재 에디터 내용 저장됨')
              }
            }
          } catch (e) {
            console.warn('내용 저장 실패 (무시됨):', e)
          }
        }

        // Vue 상태 업데이트
        emit('update:current-editing-area', areaType)

        // DOM 업데이트를 기다림
        await nextTick()
        // 레이아웃 반영까지 한 틱 더
        await new Promise(r => requestAnimationFrame(() => r(null)))

        const html = (props.editedTexts?.[areaType] ?? '')
        if (editorInstance.value && editorInstance.value.removed !== true) {
          editorInstance.value.setContent(html)
          await nextTick()
          editorInstance.value.focus()
        }

        console.log('✅ 편집 영역 변경 완료:', areaType)
      } catch (error) {
        console.error('편집 영역 변경 중 오류:', error)
      } finally {
        switching.value = false
      }
    }

    // 현재 편집 영역의 내용을 에디터에 새로고침
    const copyOcrToEditor = async () => {
      try {
        // 현재 editedTexts의 내용을 에디터에 다시 설정
        const currentContent = props.editedTexts[props.currentEditingArea] || ''

        // 에디터 인스턴스가 있고 유효하다면 내용만 교체
        if (editorInstance.value && !editorInstance.value.destroyed) {
          try {
            editorInstance.value.setContent(currentContent)
            console.log('에디터 내용 새로고침 완료:', {
              area: props.currentEditingArea,
              content: currentContent.substring(0, 100) + '...'
            })
          } catch (error) {
            console.warn('에디터 내용 설정 중 오류:', error)
          }
        } else {
          console.log('에디터 인스턴스가 준비되지 않음, 다음 초기화 시 내용이 설정됩니다.')
        }
      } catch (error) {
        console.error('에디터 내용 새로고침 중 오류:', error)
      }
    }

    // 에디터 내용을 미리보기에 강제 동기화
    const syncEditorToPreview = async () => {
      try {
        if (!editorInstance.value || editorInstance.value.destroyed) {
          console.warn('에디터 인스턴스가 유효하지 않습니다.')
          return
        }

        // 에디터에서 현재 내용 가져오기
        const editorContent = editorInstance.value.getContent()
        console.log('에디터에서 내용 가져옴:', {
          area: props.currentEditingArea,
          content: editorContent.substring(0, 100) + '...'
        })

        // 로컬 상태 강제 업데이트
        localEditedTexts.value = {
          ...localEditedTexts.value,
          [props.currentEditingArea]: editorContent
        }

        // 부모 컴포넌트에도 업데이트
        emitEdited(props.currentEditingArea, editorContent)

        // MathJax 렌더링 강제 실행
        await nextTick()
        await reRenderMathJax()
        if (props.currentEditingArea === 'options') {
          await renderOptionsMathJax()
        }
        // 미리보기 영역 렌더링
        await renderPreviewMathJax()

        console.log('미리보기 동기화 완료:', {
          area: props.currentEditingArea,
          localEditedTexts: localEditedTexts.value
        })
      } catch (error) {
        console.error('미리보기 동기화 중 오류:', error)
      }
    }

    // 편집 내용 업데이트 (emitEdited 사용)
    const updateEditedText = (content) => {
      emitEdited(props.currentEditingArea, content)

      console.log('편집 내용 업데이트:', {
        area: props.currentEditingArea,
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      })
    }

    // 로컬 editedTexts 상태 (즉시 미리보기 반영용)
    const localEditedTexts = ref({ ...props.editedTexts })

    // props.editedTexts가 변경될 때 로컬 상태 동기화
    watch(() => props.editedTexts, (newTexts) => {
      localEditedTexts.value = { ...newTexts }
    }, { deep: true, immediate: true })



    // TinyMCE 에디터 인스턴스 참조
    const editorInstance = ref(null)

    // editedTexts 업데이트를 렌더 밖에서 emit (동시성 충돌 방지)
    const emitEdited = (area, val) => {
      // 렌더/patch 중간에 올려보내지 않기
      Promise.resolve().then(() => emit('update:edited-texts', { [area]: val }))
    }

        // 안전한 에디터 초기화 핸들러
    const onEditorInit = async (...args) => {
      try {
        console.log('TinyMCE 에디터 초기화 시작...')
        console.log('onEditorInit args:', args)

        // 에디터 인스턴스 안전하게 추출
        let editor = null

        // 1) 직접 에디터 인스턴스가 첫 인자로 온 경우
        for (const arg of args) {
          if (arg && typeof arg.getBody === 'function' && typeof arg.setContent === 'function') {
            editor = arg
            break
          }
        }

        // 2) 이벤트 객체 형태 (e.target / e.editor)
        if (!editor) {
          for (const arg of args) {
            const candidate = arg?.target || arg?.editor
            if (candidate && typeof candidate.getBody === 'function' && typeof candidate.setContent === 'function') {
              editor = candidate
              break
            }
          }
        }

        if (!editor) {
          console.error('❌ 에디터 초기화 실패 - 에디터 인스턴스를 찾지 못했습니다')
          return
        }

        console.log('✅ 에디터 인스턴스 발견:', editor.id)

        // 이전 인스턴스가 있다면 정리
        if (editorInstance.value && editorInstance.value !== editor) {
          try {
            if (editorInstance.value.removed !== true && typeof editorInstance.value.remove === 'function') {
              editorInstance.value.remove()
            }
          } catch (error) {
            console.warn('이전 에디터 인스턴스 정리 중 오류:', error)
          }
        }

        editorInstance.value = markRaw(editor)

        // 에디터 상태 확인
        const state = {
          hasAllMethods: ['getBody', 'setContent', 'remove'].every(m => typeof editor[m] === 'function'),
          hasBody: typeof editor.getBody === 'function',
          hasValidId: !!editor.id,
          isNotDestroyed: editor.removed !== true,
          editorId: editor.id,
        }
        console.log('✅ 에디터 상태:', state)

        // 내용 주입은 nextTick 이후가 안전
        await nextTick()
        try {
          const html = props.editedTexts[props.currentEditingArea] || ''
          editor.setContent(html)
          await nextTick()
          editor.focus()
          console.log('✅ 에디터 내용 설정 및 포커스 완료')
        } catch (e) {
          console.warn('init 시 setContent/focus 중 경고(무시 가능):', e)
        }



      } catch (error) {
        console.error('에디터 초기화 중 오류:', error)
      }
    }

    // 테스트용 샘플 LaTeX 텍스트 추가
    const addSampleLatexText = () => {
      const sampleText = `이것은 테스트 텍스트입니다.

수식 예시:
- 인라인 수식: $x^2 + y^2 = z^2$
- 블록 수식: $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- 분수: $\\frac{a}{b}$
- 적분: $$\\int_0^1 x^2 dx$$

더 많은 수식들...`

      const newEditedTexts = { ...props.editedTexts }
      newEditedTexts[props.currentEditingArea] = sampleText
      emit('update:edited-texts', newEditedTexts)

      console.log('샘플 LaTeX 텍스트 추가됨:', sampleText)
    }

    // 강제 재렌더링 함수
    const forceRerender = async () => {
      console.log('강제 재렌더링 실행')

      try {
        // 에디터 인스턴스가 있다면 내용만 새로고침
        if (editorInstance.value && !editorInstance.value.destroyed) {
          try {
            const currentContent = props.editedTexts[props.currentEditingArea] || ''
            editorInstance.value.setContent(currentContent)
            console.log('에디터 내용 새로고침 완료')
          } catch (error) {
            console.warn('에디터 내용 새로고침 중 오류:', error)
          }
        } else {
          console.log('에디터 인스턴스가 준비되지 않음')
        }

        console.log('강제 재렌더링 완료')
      } catch (error) {
        console.error('강제 재렌더링 중 오류:', error)
      }
    }

    // 전체 미리보기 텍스트를 editedTexts에 복사
    const copyPreviewToEditedTexts = () => {
      console.log('전체 미리보기 텍스트를 editedTexts에 복사 시작')

      const previewTexts = {
        problem: `1. 다음 그림의 원 \\( O \\) 에서 \\( \\overline{A B}=\\overline{B C}=\\overline{D E} \\) 일 때, 다음 중에서 옳지 않은 것은?

보기
(1) \\( \\overline{A B}=\\overline{D E} \\) (2) \\( \\overline{A C}=2 \\overline{D E} \\) (3) \\( \\overline{A C}=2 \\overline{D E} \\) (4) \\( \\angle A O C=2 \\angle D O E \\) (5) (부채꼴 \\( A O C \\) 의 넓이) \\( =2 \\times \\) (부채꼴 \\( D O E \\) 의 넓이)`,
        question: '지문 영역의 기본 텍스트입니다.',
        options: '보기 영역의 기본 텍스트입니다.',
        image: '이미지 영역의 기본 텍스트입니다.'
      }

      const newEditedTexts = { ...props.editedTexts, ...previewTexts }
      emit('update:edited-texts', newEditedTexts)

      console.log('전체 미리보기 텍스트 복사 완료:', newEditedTexts)
    }

    // 수식 삽입 (최대 안정성)
    const insertMath = async (latex) => {
      currentMathLatex.value = latex
      console.log('수식 삽입 시도:', latex)

      let retries = 40
      while (retries > 0) {
        if (editorInstance.value &&
            typeof editorInstance.value.insertContent === 'function' &&
            !editorInstance.value.destroyed) {

          try {
            const html = `<span class="math-latex" data-latex="${latex}">$${latex}$</span>`
            editorInstance.value.insertContent(html)
            console.log('수식 삽입 성공:', latex)
            return
          } catch (insertError) {
            console.warn('수식 삽입 시도 실패:', insertError)
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100))
        retries--
      }

      console.error('수식 삽입 최종 실패:', latex)
      alert('수식 삽입에 실패했습니다. 에디터를 새로고침해주세요.')
    }

    // 도형 삽입 (안전한 버전)
    const insertShape = async () => {
      try {
        // 에디터 인스턴스 검증
        if (!editorInstance.value) {
          console.warn('에디터 인스턴스가 아직 초기화되지 않았습니다.')
          return
        }

        // 에디터가 준비되었는지 확인
        if (!editorInstance.value.insertContent || typeof editorInstance.value.insertContent !== 'function') {
          console.warn('에디터 insertContent 메서드가 사용할 수 없습니다.')
          return
        }

        // 에디터에 포커스
        editorInstance.value.focus()

        // 도형 삽입
        insertShapeToEditor(editorInstance.value, {
          type: selectedShapeType.value,
          color: shapeColor.value,
          size: shapeSize.value,
          strokeWidth: shapeStrokeWidth.value,
          text: shapeText.value,
          latex: shapeLatex.value
        })

        console.log('도형 삽입 성공')
      } catch (error) {
        console.error('도형 삽입 중 오류:', error)
        // 에디터 재초기화 시도
        await forceRerender()
      }
    }

    // 도형 SVG 내보내기
    const exportShapeAsSvg = () => {
      if (!selectedShapeType.value) {
        alert('도형을 먼저 선택해주세요.')
        return
      }

      try {
        // 도형 정보 수집
        const shapeData = {
          type: selectedShapeType.value,
          color: shapeColor.value,
          size: shapeSize.value,
          strokeWidth: shapeStrokeWidth.value,
          text: shapeText.value,
          latex: shapeLatex.value
        }

        // SVG 생성
        let svgContent = ''
        const padding = 20
        const totalSize = shapeData.size + (padding * 2)

        if (shapeData.type === 'triangle') {
          // 삼각형 SVG
          svgContent = `
            <svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
              <polygon
                points="${totalSize/2},${padding + shapeData.strokeWidth} ${padding + shapeData.strokeWidth},${totalSize - padding - shapeData.strokeWidth} ${totalSize - padding - shapeData.strokeWidth},${totalSize - padding - shapeData.strokeWidth}"
                fill="${shapeData.color}20"
                stroke="${shapeData.color}"
                stroke-width="${shapeData.strokeWidth}"
              />
              ${shapeData.text ? `<text x="${totalSize/2}" y="${totalSize/2 + 5}" text-anchor="middle" fill="${shapeData.color}" font-family="Arial, sans-serif" font-weight="bold" font-size="14">${shapeData.text}</text>` : ''}
              ${shapeData.latex ? `<text x="${totalSize/2}" y="${totalSize - 5}" text-anchor="middle" fill="${shapeData.color}" font-family="Arial, sans-serif" font-size="12">${shapeData.latex}</text>` : ''}
            </svg>
          `
        } else if (shapeData.type === 'circle') {
          // 원 SVG
          const centerX = totalSize / 2
          const centerY = totalSize / 2
          const radius = (shapeData.size - shapeData.strokeWidth) / 2

          svgContent = `
            <svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="${centerX}"
                cy="${centerY}"
                r="${radius}"
                fill="${shapeData.color}20"
                stroke="${shapeData.color}"
                stroke-width="${shapeData.strokeWidth}"
              />
              ${shapeData.text ? `<text x="${centerX}" y="${centerY + 5}" text-anchor="middle" fill="${shapeData.color}" font-family="Arial, sans-serif" font-weight="bold" font-size="14">${shapeData.text}</text>` : ''}
              ${shapeData.latex ? `<text x="${centerX}" y="${totalSize - 5}" text-anchor="middle" fill="${shapeData.color}" font-family="Arial, sans-serif" font-size="12">${shapeData.latex}</text>` : ''}
            </svg>
          `
        } else {
          // 사각형 SVG
          const rectX = padding + shapeData.strokeWidth / 2
          const rectY = padding + shapeData.strokeWidth / 2
          const rectWidth = shapeData.size - shapeData.strokeWidth
          const rectHeight = shapeData.size - shapeData.strokeWidth

          svgContent = `
            <svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="${rectX}"
                y="${rectY}"
                width="${rectWidth}"
                height="${rectHeight}"
                fill="${shapeData.color}20"
                stroke="${shapeData.color}"
                stroke-width="${shapeData.strokeWidth}"
                rx="4"
              />
              ${shapeData.text ? `<text x="${totalSize/2}" y="${totalSize/2 + 5}" text-anchor="middle" fill="${shapeData.color}" font-family="Arial, sans-serif" font-weight="bold" font-size="14">${shapeData.text}</text>` : ''}
              ${shapeData.latex ? `<text x="${totalSize/2}" y="${totalSize - 5}" text-anchor="middle" fill="${shapeData.color}" font-family="Arial, sans-serif" font-size="12">${shapeData.latex}</text>` : ''}
            </svg>
          `
        }

        // SVG 파일 다운로드
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `shape_${shapeData.type}_${Date.now()}.svg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        console.log('SVG 내보내기 성공:', shapeData)
        alert('SVG 파일이 다운로드되었습니다.')

      } catch (error) {
        console.error('SVG 내보내기 실패:', error)
        alert('SVG 내보내기에 실패했습니다.')
      }
    }

    // 템플릿 로드
    const loadTemplate = (template) => {
      const newEditedTexts = { ...props.editedTexts }
      newEditedTexts[props.currentEditingArea] = template.content || ''
      emit('update:editedTexts', newEditedTexts)
    }

    // 미리보기 토글
    const togglePreview = async () => {
      showPreview.value = !showPreview.value

      // 미리보기가 열릴 때 MathJax 렌더링 실행
      if (showPreview.value) {
        await nextTick()
        await renderPreviewMathJax()
      }
    }

    // 이전 단계로
    const prevStep = () => {
      emit('prev-step')
    }

    // 다음 단계로
    const nextStep = () => {
      emit('next-step')
    }

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

        // MathJax 로드 확인 및 로드 함수 (기존 시스템 사용)
    const ensureMathJaxLoaded = async () => {
      await waitForMathJax()

      // MathJax 설정 강제 적용 (LaTeX 패턴 인식)
      if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
        // MathJax 설정 강제 적용
        window.MathJax.config = {
          tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            processEscapes: true,
            processEnvironments: true,
            packages: ['base', 'ams', 'noerrors', 'noundefined']
          },
          options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
            ignoreHtmlClass: 'tex2jax_ignore',
            processHtmlClass: 'tex2jax_process'
          }
        }

        // MathJax 문서 재설정
        if (window.MathJax.startup.document) {
          window.MathJax.startup.document.clear()
          window.MathJax.startup.document.updateDocument()
        }

        console.log('MathJax LaTeX 설정 강제 적용 및 문서 재설정 완료')
      }
    }



    // MathJax 로드 상태 추적 (기존 시스템 사용)
    const mathJaxLoaded = computed(() => {
      return !!(window.MathJax && window.MathJax.startup && window.MathJax.startup.document)
    })

    // LaTeX 수식을 MathJax로 렌더링하는 함수 (기존 시스템 사용)
    const renderLatexContent = async (content) => {
      console.log('renderLatexContent 호출됨:', {
        content,
        type: typeof content,
        length: content ? content.length : 0,
        hasLatex: content ? (content.includes('$') || content.includes('\\')) : false
      })

      if (!content || typeof content !== 'string') {
        console.log('content가 유효하지 않음:', content)
        return ''
      }

      try {
        // MathJax가 로드되었는지 확인
        console.log('MathJax 상태 확인:', {
          mathJaxExists: !!window.MathJax,
          startupExists: !!(window.MathJax && window.MathJax.startup)
        })

        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
          console.log('MathJax 사용하여 렌더링 시작')

          // 임시 div에 수식 렌더링
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = content
          tempDiv.style.position = 'absolute'
          tempDiv.style.left = '-9999px'
          tempDiv.style.visibility = 'hidden'
          document.body.appendChild(tempDiv)

          try {
            // MathJax로 렌더링
            await renderMathJax(tempDiv, { clearFirst: false })
            console.log('MathJax 렌더링 성공')

            // 렌더링된 HTML 가져오기
            const result = tempDiv.innerHTML

            // 임시 div 제거
            document.body.removeChild(tempDiv)

            console.log('최종 렌더링 결과:', result)
            return result

          } catch (renderError) {
            console.warn('MathJax 렌더링 실패:', renderError)
            document.body.removeChild(tempDiv)

            // 렌더링 실패 시 LaTeX 코드를 스타일링하여 표시
            return styleLatexCode(content)
          }
        } else {
          console.log('MathJax가 로드되지 않음, LaTeX 코드 스타일링 적용')
          return styleLatexCode(content)
        }
      } catch (error) {
        console.warn('LaTeX 렌더링 함수 오류:', error)
        return styleLatexCode(content)
      }
    }

    // LaTeX 코드를 스타일링하는 함수 (MathJax가 로드되지 않은 경우)
    const styleLatexCode = (content) => {
      let result = content

      // $$...$$ 패턴 (display mode)
      result = result.replace(/\$\$([^$]+?)\$\$/g, '<div class="latex-code-display">$$$1$$</div>')

      // $...$ 패턴 (inline mode)
      result = result.replace(/\$([^$\n]+?)\$/g, '<span class="latex-code-inline">$$1$</span>')

      // \(...\) 패턴 (inline mode) - 원본 LaTeX 유지
      result = result.replace(/\\\(([^)]+?)\\\)/g, '<span class="latex-code-inline">\\($1\\)</span>')

      // \[...\] 패턴 (display mode) - 원본 LaTeX 유지
      result = result.replace(/\\\[([^\]]+?)\\\]/g, '<div class="latex-code-display">\\[$1\\]</div>')

      // \displaystyle{...} 패턴
      result = result.replace(/\\displaystyle\s*\{([^}]+?)\}/g, '<div class="latex-code-display">displaystyle: $1</div>')

      // \text{...} 패턴
      result = result.replace(/\\text\{([^}]+?)\}/g, '<span class="latex-text">$1</span>')

      return result
    }



    // 보기 영역 전용 MathJax 렌더링 함수
    const renderOptionsMathJax = async () => {
      try {
        // MathJax 로드 대기
        await waitForMathJax()

        console.log('보기 영역 전용 MathJax 렌더링 시작')

        // DOM이 완전히 업데이트될 때까지 대기
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        // 보기 영역 요소들 찾기 (더 포괄적으로)
        const optionsElements = document.querySelectorAll('.option-content, .options-text, .multiple-choice-options, .subjective-options')
        console.log(`보기 영역 ${optionsElements.length}개 발견:`, Array.from(optionsElements).map(el => el.className))

        for (const element of optionsElements) {
          console.log('보기 영역 요소 검사:', element.className, element.innerHTML.substring(0, 100))

          if (element.innerHTML && (element.innerHTML.includes('$') || element.innerHTML.includes('\\'))) {
            console.log('보기 영역 렌더링 시작:', element.className)

            // MathJax 설정 재확인
            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
              // MathJax 문서 업데이트
              window.MathJax.startup.document.updateDocument()

              // 강제 렌더링 시도
              try {
                await window.MathJax.typesetPromise([element])
                console.log('보기 영역 MathJax 강제 렌더링 성공:', element.className)
              } catch (error) {
                console.warn('보기 영역 MathJax 강제 렌더링 실패, 기본 렌더링 시도:', error)
                await renderMathJax(element, { clearFirst: false })
              }
            } else {
              await renderMathJax(element, { clearFirst: false })
            }
          } else {
            console.log('보기 영역 요소에 LaTeX 없음:', element.className)
          }
        }

        // 추가로 전체 보기 컨테이너도 렌더링
        const optionsContainer = document.querySelector('.options-content')
        if (optionsContainer) {
          console.log('보기 컨테이너 렌더링 시도')
          try {
            await renderMathJax(optionsContainer, { clearFirst: false })
            console.log('보기 컨테이너 렌더링 성공')
          } catch (error) {
            console.warn('보기 컨테이너 렌더링 실패:', error)
          }
        }

        console.log('보기 영역 MathJax 렌더링 완료')
      } catch (error) {
        console.error('보기 영역 MathJax 렌더링 중 오류:', error)
      }
    }

    // 미리보기 영역 전용 MathJax 렌더링 함수
    const renderPreviewMathJax = async () => {
      try {
        // MathJax 로드 대기
        await waitForMathJax()

        console.log('미리보기 영역 전용 MathJax 렌더링 시작')

        // DOM이 완전히 업데이트될 때까지 대기
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        // 미리보기 영역 요소들 찾기
        const previewElements = document.querySelectorAll('.preview-html, .preview-content')
        console.log(`미리보기 영역 ${previewElements.length}개 발견:`, Array.from(previewElements).map(el => el.className))

        for (const element of previewElements) {
          console.log('미리보기 영역 요소 검사:', element.className, element.innerHTML.substring(0, 100))

          if (element.innerHTML && (element.innerHTML.includes('$') || element.innerHTML.includes('\\'))) {
            console.log('미리보기 영역 렌더링 시작:', element.className)

            // MathJax 설정 재확인
            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
              // MathJax 문서 업데이트
              window.MathJax.startup.document.updateDocument()

              // 강제 렌더링 시도
              try {
                await window.MathJax.typesetPromise([element])
                console.log('미리보기 영역 MathJax 강제 렌더링 성공:', element.className)
              } catch (error) {
                console.warn('미리보기 영역 MathJax 강제 렌더링 실패, 기본 렌더링 시도:', error)
                await renderMathJax(element, { clearFirst: false })
              }
            } else {
              await renderMathJax(element, { clearFirst: false })
            }
          } else {
            console.log('미리보기 영역 요소에 LaTeX 없음:', element.className)
          }
        }

        // 전체 미리보기 컨테이너도 렌더링
        const previewContainer = document.querySelector('.preview-content')
        if (previewContainer) {
          console.log('미리보기 컨테이너 렌더링 시도')
          try {
            await renderMathJax(previewContainer, { clearFirst: false })
            console.log('미리보기 컨테이너 렌더링 성공')
          } catch (error) {
            console.warn('미리보기 컨테이너 렌더링 실패:', error)
          }
        }

        console.log('미리보기 영역 MathJax 렌더링 완료')
      } catch (error) {
        console.error('미리보기 영역 MathJax 렌더링 중 오류:', error)
      }
    }

    // MathJax로 수식 재렌더링 (기존 시스템 사용)
    const reRenderMathJax = async () => {
      try {
        // MathJax 로드 대기
        await waitForMathJax()

        console.log('MathJax 재렌더링 시작')

        // OCR 텍스트 영역 찾기
        const ocrTextElement = document.querySelector('.ocr-text-content') ||
                               document.querySelector('.ocr-text > div') ||
                               document.querySelector('.ocr-text')
        if (ocrTextElement) {
          console.log('OCR 텍스트 영역 렌더링:', ocrTextElement)

          // MathJax가 로드된 경우 강제 렌더링
          if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
            try {
              await window.MathJax.typesetPromise([ocrTextElement])
              console.log('OCR 텍스트 영역 MathJax 강제 렌더링 성공')
            } catch (error) {
              console.warn('OCR 텍스트 영역 MathJax 강제 렌더링 실패, 기본 렌더링 시도:', error)
              await renderMathJax(ocrTextElement, { clearFirst: false })
            }
          } else {
            await renderMathJax(ocrTextElement, { clearFirst: false })
          }
        }

        // 미리보기 영역들 찾기 (더 정확한 선택자)
        const previewElements = document.querySelectorAll('.preview-html')
        console.log(`미리보기 영역 ${previewElements.length}개 발견`)

        for (const element of previewElements) {
          if (element.innerHTML && (element.innerHTML.includes('$') || element.innerHTML.includes('\\'))) {
            console.log('미리보기 영역 렌더링:', element.innerHTML.substring(0, 100))

            // 원본 LaTeX 텍스트가 이미 있으므로 별도 복원 불필요
            console.log('원본 LaTeX 텍스트로 렌더링 진행')

            // MathJax 설정 재확인
            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
              console.log('MathJax 상태 확인:', {
                config: window.MathJax.config,
                tex: window.MathJax.config?.tex,
                inlineMath: window.MathJax.config?.tex?.inlineMath
              })

              // MathJax 문서 업데이트
              window.MathJax.startup.document.updateDocument()

              // 강제 렌더링 시도
              try {
                await window.MathJax.typesetPromise([element])
                console.log('MathJax 강제 렌더링 성공:', element)
              } catch (error) {
                console.warn('MathJax 강제 렌더링 실패, 기본 렌더링 시도:', error)
                await renderMathJax(element, { clearFirst: false })
              }
            } else {
              await renderMathJax(element, { clearFirst: false })
            }
          }
        }

        // 보기 영역은 별도 함수에서 처리하므로 여기서는 제거

        console.log('MathJax 재렌더링 완료')
      } catch (error) {
        console.error('MathJax 재렌더링 중 오류:', error)
      }
    }

    // OCR 텍스트 렌더링 (computed로 반응형 처리)
    const renderedOcrText = computed(() => {
      const currentText = localEditedTexts.value[props.currentEditingArea]
      console.log('renderedOcrText computed 실행:', {
        currentText,
        area: props.currentEditingArea,
        editedTextsKeys: Object.keys(props.editedTexts),
        currentTextType: typeof currentText,
        currentTextLength: currentText ? currentText.length : 0,
        currentTextTrimmed: currentText ? currentText.trim() : '',
        isEmpty: !currentText || currentText.trim() === ''
      })

      if (!currentText || currentText.trim() === '') {
        console.log('renderedOcrText: 텍스트가 비어있음')
        return ''
      }

      console.log('renderedOcrText: 텍스트 렌더링 시작')

      // 보기 영역이고 주관식인 경우 줄바꿈 처리 적용
      let textToProcess = currentText
      if (props.currentEditingArea === 'options' && questionType.value === 'subjective') {
        textToProcess = formatOptionsWithLineBreaks(currentText)
        console.log('OCR 텍스트에 줄바꿈 처리 적용:', textToProcess)
      }

      // MathJax가 로드된 경우 LaTeX 코드를 그대로 반환 (렌더링은 별도로 처리)
      if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
        console.log('MathJax가 로드됨, LaTeX 코드 반환:', textToProcess)
        return textToProcess
      } else {
        // MathJax가 로드되지 않은 경우 스타일링된 코드 반환
        console.log('MathJax가 로드되지 않음, 스타일링된 코드 반환')
        try {
          const styledResult = styleLatexCode(textToProcess)
          return styledResult
        } catch (error) {
          console.error('styleLatexCode 오류:', error)
          return textToProcess
        }
      }
    })

    // 각 영역별 미리보기 computed (로컬 상태 사용으로 즉시 반영)
    const problemPreview = computed(() => {
      const text = localEditedTexts.value.problem
      console.log('problemPreview computed 실행:', {
        text: text ? text.substring(0, 100) : '없음',
        localEditedTexts: localEditedTexts.value
      })
      if (!text) return ''
      return text // 원본 LaTeX 텍스트 반환
    })

    const optionsPreview = computed(() => {
      const text = localEditedTexts.value.options
      console.log('optionsPreview computed 실행:', {
        text: text ? text.substring(0, 100) : '없음',
        localEditedTexts: localEditedTexts.value
      })
      if (!text) return ''

      // 주관식 보기인 경우 줄바꿈이 포함된 형태로 변환
      if (questionType.value === 'subjective') {
        return formatOptionsWithLineBreaks(text)
      }

      return text // 원본 LaTeX 텍스트 반환
    })

    const questionPreview = computed(() => {
      const text = localEditedTexts.value.question
      if (!text) return ''
      return text // 원본 LaTeX 텍스트 반환
    })

    const imagePreview = computed(() => {
      const text = localEditedTexts.value.image
      if (!text) return ''
      return text // 원본 LaTeX 텍스트 반환
    })

    // 안전한 passage 접근 - 보존용 전체 캡쳐
    const fullCaptureImage = computed(() => {
      return props.passage || ''
    })

        // MathJax 렌더링을 위한 watch 추가 (더 포괄적으로)
    watch(() => props.editedTexts, async (newTexts) => {
      // LaTeX 패턴이 포함된 텍스트가 있는지 확인
      const hasLatex = Object.values(newTexts).some(text =>
        text && (text.includes('$') || text.includes('\\'))
      )

      if (hasLatex) {
        await nextTick()
        await reRenderMathJax()

        // 추가로 보기 영역만 특별히 렌더링
        await nextTick()
        await renderOptionsMathJax()
      }
    }, { deep: true })

    // 보기 텍스트 변경 시 선택 상태 초기화 및 MathJax 렌더링
    watch(() => props.editedTexts.options, async (newOptions) => {
      if (newOptions) {
        initializeOptionsSelection()

        // 보기 영역 변경 시 강제 MathJax 렌더링
        await nextTick()
        await renderOptionsMathJax()
      }
    })

    // 도형 LaTeX 변경 시 미리보기 렌더링
    watch([shapeLatex, shapeText, selectedShapeType], async () => {
      await nextTick()
      const previewElement = document.querySelector('.shape-preview')
      if (previewElement) {
        try {
          // MathJax가 로드되어 있으면 렌더링
          if (window.MathJax && window.MathJax.typesetPromise) {
            await window.MathJax.typesetPromise([previewElement])
          } else {
            // MathJax가 없으면 기본 렌더링
            await renderLatexContent(previewElement.innerHTML)
          }
        } catch (error) {
          console.warn('도형 미리보기 렌더링 실패:', error)
        }
      }
    })

    // OCR 텍스트 변경 시 MathJax 렌더링
    watch(() => localEditedTexts.value[props.currentEditingArea], async (newText) => {
      if (newText && (newText.includes('$') || newText.includes('\\'))) {
        console.log('OCR 텍스트 변경 감지, MathJax 렌더링 실행:', newText.substring(0, 100))

        // DOM 업데이트 대기
        await nextTick()

        // OCR 텍스트 영역에 MathJax 렌더링 적용
        const ocrTextElement = document.querySelector('.ocr-text-content') ||
                               document.querySelector('.ocr-text > div') ||
                               document.querySelector('.ocr-text')
        if (ocrTextElement) {
          console.log('OCR 텍스트 영역 MathJax 렌더링 시작')
          try {
            await renderMathJax(ocrTextElement, { clearFirst: false })
            console.log('OCR 텍스트 영역 MathJax 렌더링 완료')
          } catch (error) {
            console.warn('OCR 텍스트 영역 MathJax 렌더링 실패:', error)
          }
        }
      }
    })

        // Math preview computed (기존 MathJax 시스템 사용)
    const mathPreviewHtml = computed(() => {
      if (!currentMathLatex.value.trim()) return ''

      try {
        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
          // MathJax가 로드된 경우 LaTeX 코드 반환 (렌더링은 별도로 처리)
          return `$${currentMathLatex.value}$`
        } else {
          return `$${currentMathLatex.value}$`
        }
      } catch {
        return `<span class="text-danger">LaTeX 오류</span>`
      }
    })

    // 컴포넌트 마운트 시 초기화 및 MathJax 로드 (기존 시스템 사용)
    onMounted(async () => {
      try {
        await ensureMathJaxLoaded()
        console.log('Step2TextEditing 초기화 완료 - MathJax 로드 완료')

        // 디버깅: 현재 상태 확인
        console.log('마운트 시 상태:', {
          currentEditingArea: props.currentEditingArea,
          editedTexts: props.editedTexts,
          selectedAreas: props.selectedAreas
        })

        // editedTexts가 비어있다면 기본값 설정
        if (!props.editedTexts || Object.keys(props.editedTexts).length === 0) {
          console.log('editedTexts가 비어있음, 기본값 설정 시도')
          const defaultTexts = {}

          // 선택된 영역들에 기본 텍스트 설정
          if (props.selectedAreas) {
            Object.keys(props.selectedAreas).forEach(areaType => {
              if (props.selectedAreas[areaType]) {
                defaultTexts[areaType] = `이것은 ${areaType} 영역의 기본 텍스트입니다.

LaTeX 수식 예시:
- 인라인 수식: $x^2 + y^2 = z^2$
- 블록 수식: $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- 분수: $\\frac{a}{b}$
- 적분: $$\\int_0^1 x^2 dx$$
- displaystyle: $\\displaystyle{\\frac{1}{2} + \\frac{1}{3}}$
- text 환경: $\\text{이것은 텍스트입니다}$

더 많은 수식들...`
              }
            })
          }

          if (Object.keys(defaultTexts).length > 0) {
            emit('update:edited-texts', defaultTexts)
            console.log('기본 텍스트 설정됨:', defaultTexts)
          }
        }

        // 초기 MathJax 렌더링 실행
        await nextTick()
        // DOM이 완전히 준비될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        await reRenderMathJax()

        // 보기 선택 상태 초기화
        initializeOptionsSelection()

      } catch (error) {
        console.warn('Step2TextEditing 초기화 실패:', error)
      }
    })

    // 컴포넌트 정리
    onUnmounted(async () => {
      try {
        console.log('Step2TextEditing 컴포넌트 정리 시작')

        // 타임아웃 정리 (areaChangeTimeout 제거됨)

        // 에디터 정리 (더 안전하게)
        if (editorInstance.value) {
          try {
            if (editorInstance.value.removed !== true && typeof editorInstance.value.remove === 'function') {
              editorInstance.value.remove()
            }
          } catch (editorError) {
            console.warn('에디터 정리 중 오류 (무시됨):', editorError)
          } finally {
            // 에디터 정리 실패 시에도 인스턴스는 null로 설정
            editorInstance.value = null
          }
        }

        console.log('Step2TextEditing 컴포넌트 정리 완료')
      } catch (error) {
        console.error('컴포넌트 정리 중 오류:', error)
        // 최종 정리
        editorInstance.value = null

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
            ensureMathJaxLoaded,
      getAreaTypeLabel,
      getCurrentAreaImage,
      getCurrentAreaInfo,
      selectEditingArea,
      copyOcrToEditor,
      syncEditorToPreview,
      updateEditedText,
      insertMath,
      insertShape,
      exportShapeAsSvg,
      loadTemplate,
      togglePreview,
      prevStep,
      nextStep,
      editorInstance,
      onEditorInit,
      renderedOcrText,
      addSampleLatexText,
      forceRerender,
      copyPreviewToEditedTexts,
      mathJaxLoaded,
      reRenderMathJax,
      renderOptionsMathJax,
      renderPreviewMathJax,
      styleLatexCode,
      problemPreview,
      optionsPreview,
      questionPreview,
      imagePreview,
      fullCaptureImage,
      optionsList,
      selectedOptions,
      selectedOptionsText,
      initializeOptionsSelection,
      questionType,
      localEditedTexts,
      formatOptionsWithLineBreaks
    }
  }
}
</script>

<style scoped>
.step2-container {
  display: grid;
  grid-template-columns: minmax(300px, 0.5fr) minmax(500px, 1fr);
  height: 100vh;
  width: 100%;
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

.coordinate-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
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
  white-space: pre-line; /* 줄바꿈 문자를 실제 줄바꿈으로 표시 */
  word-break: break-word;
}

.ocr-text-content {
  font-family: inherit; /* MathJax 렌더링을 위해 monospace 제거 */
  white-space: pre-line;
  word-break: break-word;
}

.ocr-actions {
  display: flex;
  align-content: space-around;
  padding: 1rem;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e9ecef;
  height: 100%;
}

.right-tools-panel {
  flex: 0.5;
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

/* 문제 유형 배지 */
.question-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.question-type-badge.multiple-choice {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.question-type-badge.subjective {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

/* 보기 선택 UI 스타일링 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: #e9ecef;
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
}

/* 개선된 보기 영역 스타일 */
.options-content {
  margin-top: 0.5rem;
}

.multiple-choice-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
}

.option-number {
  font-weight: bold;
  color: #007bff;
  font-size: 1.1em;
  min-width: 2rem;
  text-align: center;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 0.25rem;
  border: 1px solid #dee2e6;
}

.option-content {
  flex: 1;
  line-height: 1.6;
  color: #495057;
  padding: 0.25rem 0;
}

/* 주관식 보기 스타일 */
.subjective-options {
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.options-text {
  line-height: 1.6;
  color: #495057;
  white-space: pre-line; /* 줄바꿈 문자를 실제 줄바꿈으로 표시 */
}

/* MathJax 렌더링 스타일링 (기존 시스템 사용) */
.ocr-text mjx-container,
.preview-html mjx-container,
.option-preview mjx-container {
  font-size: 1em;
  line-height: 1.2;
}

.ocr-text mjx-container[display="true"],
.preview-html mjx-container[display="true"] {
  margin: 0.5em 0;
  text-align: center;
}

.ocr-text .mathjax-error,
.preview-html .mathjax-error {
  color: #dc3545;
  background: #f8d7da;
  padding: 0.25em 0.5em;
  border-radius: 0.25em;
  font-family: monospace;
}

/* LaTeX 도형 버튼 스타일 */
.shape-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.shape-btn {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  text-align: center;
}

.shape-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.shape-btn:active {
  background: #007bff;
  color: white;
}

/* 도형 미리보기 스타일 */
.shape-preview {
  min-height: 120px;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #f8f9fa;
  margin-bottom: 1rem;
  text-align: center;
}

.shape-visual {
  transition: all 0.3s ease;
}

.shape-visual:hover {
  transform: scale(1.05);
}

.shape-latex-preview {
  margin-top: 1rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.shape-latex-preview.placeholder {
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  color: #6c757d;
  font-style: italic;
}

.shape-text-preview {
  font-size: 0.9rem;
  color: #495057;
}

/* LaTeX 코드 스타일링 (KaTeX가 로드되지 않은 경우) */
.latex-code-display {
  display: block;
  font-family: 'Courier New', monospace;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5em;
  margin: 0.5em 0;
  font-size: 0.9em;
  color: #495057;
}

.latex-code-inline {
  font-family: 'Courier New', monospace;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-size: 0.9em;
  color: #495057;
}

/* LaTeX 오류 스타일링 */
.latex-error {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-size: 0.9em;
  cursor: help;
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


}
</style>
