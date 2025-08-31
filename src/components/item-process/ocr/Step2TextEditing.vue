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

          <div v-if="editedTexts[currentEditingArea] && editedTexts[currentEditingArea].trim()" class="ocr-text">
            <!-- LaTeX 렌더링이 적용된 텍스트 표시 -->
            <div v-html="renderedOcrText"></div>

            <!-- 디버깅: 원본 텍스트와 렌더링된 텍스트 비교 -->
            <div class="debug-latex mt-3 p-2 bg-light border rounded">
              <small class="text-muted">
                <strong>LaTeX 디버깅:</strong><br>
                원본 텍스트: <code>{{ editedTexts[currentEditingArea] }}</code><br>
                LaTeX 패턴 포함: {{ editedTexts[currentEditingArea].includes('$') ? '예' : '아니오' }}<br>
                MathJax v3 로드 상태: {{ mathJaxLoaded ? '로드됨' : '로드되지 않음' }}<br>
                <button @click="forceRerender" class="btn btn-sm btn-outline-warning mt-1">강제 재렌더링</button>
              </small>
            </div>
          </div>
          <div v-else class="no-ocr">
            OCR 결과가 없습니다.
            <br><small class="text-muted">현재 편집 영역: {{ currentEditingArea || '없음' }}</small>
            <br><small class="text-muted">editedTexts 내용: {{ editedTexts[currentEditingArea] || '빈 문자열' }}</small>
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
            <div class="preview-html" v-html="problemPreview"></div>
          </div>
          <!-- 보기 영역 -->
          <div v-if="editedTexts.options" class="preview-section">
            <h6>보기</h6>
            <div class="preview-html" v-html="optionsPreview"></div>
          </div>
          <!-- 지문 영역 -->
          <div v-if="editedTexts.question" class="preview-section">
            <h6>지문</h6>
            <div class="preview-html" v-html="questionPreview"></div>
          </div>
          <!-- 이미지 영역 -->
          <div v-if="editedTexts.image" class="preview-section">
            <h6>이미지</h6>
            <div class="preview-html" v-html="imagePreview"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import { createCommonEditorConfig, getTinyMCEApiKey, insertMathToEditor, insertShapeToEditor } from '@/utils/tinymce-common-config'
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
    watch(() => props.currentEditingArea, async (newArea, oldArea) => {
      try {
        // 영역이 실제로 변경되었을 때만 에디터 새로고침
        if (newArea && newArea !== oldArea) {
          // 현재 에디터 인스턴스가 있다면 안전하게 제거
          if (editorInstance.value) {
            try {
              editorInstance.value.destroy()
              editorInstance.value = null
            } catch (error) {
              console.warn('에디터 인스턴스 제거 중 오류:', error)
            }
          }

          // DOM 업데이트를 기다림
          await nextTick()

          // 에디터 내용이 변경되었을 때만 새로고침
          if (props.editedTexts[newArea] !== props.editedTexts[oldArea]) {
            editorKey.value += 1
          }

          // 추가 DOM 업데이트를 기다림
          await nextTick()
        }
      } catch (error) {
        console.error('편집 영역 변경 감지 중 오류:', error)
      }
    })

    // editedTexts가 변경될 때 LaTeX 렌더링 강제 업데이트
    watch(() => props.editedTexts, async () => {
      try {
        // 다음 tick에서 DOM 업데이트를 기다린 후 강제로 렌더링 다시 실행
        await nextTick()

        // LaTeX 렌더링이 자동으로 업데이트되도록 강제 리렌더링
        // editorKey 변경은 하지 않음 (불필요한 에디터 재생성 방지)
      } catch (error) {
        console.error('editedTexts 변경 감지 중 오류:', error)
      }
    }, { deep: true })

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

        // 현재 에디터 인스턴스가 있다면 안전하게 제거
        if (editorInstance.value) {
          try {
            editorInstance.value.destroy()
            editorInstance.value = null
          } catch (error) {
            console.warn('에디터 인스턴스 제거 중 오류:', error)
          }
        }

        // DOM 업데이트를 기다린 후 새로운 영역으로 전환
        await nextTick()

        // 새로운 영역으로 전환
        emit('update:currentEditingArea', areaType)

        // 에디터 키를 변경하여 새로운 에디터 생성
        editorKey.value += 1

        // 추가 DOM 업데이트를 기다림
        await nextTick()

        console.log('편집 영역 변경:', {
          from: props.currentEditingArea,
          to: areaType,
          hasContent: !!props.editedTexts[areaType]
        })
      } catch (error) {
        console.error('편집 영역 변경 중 오류:', error)
        // 오류 발생 시 기본값으로 복구
        editorKey.value += 1
      }
    }

    // 현재 편집 영역의 내용을 에디터에 새로고침
    const copyOcrToEditor = async () => {
      try {
        // 현재 editedTexts의 내용을 에디터에 다시 설정
        const currentContent = props.editedTexts[props.currentEditingArea] || ''

        // 현재 에디터 인스턴스가 있다면 안전하게 제거
        if (editorInstance.value) {
          try {
            editorInstance.value.destroy()
            editorInstance.value = null
          } catch (error) {
            console.warn('에디터 인스턴스 제거 중 오류:', error)
          }
        }

        // DOM 업데이트를 기다림
        await nextTick()

        // 에디터 내용이 변경되었으므로 에디터 새로고침
        editorKey.value += 1

        // 추가 DOM 업데이트를 기다림
        await nextTick()

        console.log('에디터 내용 새로고침:', {
          area: props.currentEditingArea,
          content: currentContent.substring(0, 100) + '...'
        })
      } catch (error) {
        console.error('에디터 새로고침 중 오류:', error)
        // 오류 발생 시 기본값으로 복구
        editorKey.value += 1
      }
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

    // TinyMCE 에디터 인스턴스 참조
    const editorInstance = ref(null)

    // 에디터 초기화 이벤트 핸들러
    const onEditorInit = (editor) => {
      editorInstance.value = editor
      console.log('TinyMCE 에디터 초기화 완료:', editor)
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
      emit('update:editedTexts', newEditedTexts)

      console.log('샘플 LaTeX 텍스트 추가됨:', sampleText)
    }

    // 강제 재렌더링 함수
    const forceRerender = async () => {
      console.log('강제 재렌더링 실행')

      try {
        // 현재 에디터 인스턴스가 있다면 안전하게 제거
        if (editorInstance.value) {
          try {
            editorInstance.value.destroy()
            editorInstance.value = null
          } catch (error) {
            console.warn('에디터 인스턴스 제거 중 오류:', error)
          }
        }

        // DOM 업데이트를 기다림
        await nextTick()

        // editorKey를 변경하여 컴포넌트 강제 새로고침
        editorKey.value += 1

        // 추가 DOM 업데이트를 기다림
        await nextTick()

        console.log('강제 재렌더링 완료')
      } catch (error) {
        console.error('강제 재렌더링 중 오류:', error)
        // 오류 발생 시 기본값으로 복구
        editorKey.value += 1
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
      emit('update:editedTexts', newEditedTexts)

      console.log('전체 미리보기 텍스트 복사 완료:', newEditedTexts)
    }

    // 수식 삽입
    const insertMath = (latex) => {
      currentMathLatex.value = latex
      if (editorInstance.value) {
        insertMathToEditor(editorInstance.value, currentMathLatex.value)
      } else {
        console.warn('에디터 인스턴스가 아직 초기화되지 않았습니다.')
      }
    }

    // 도형 삽입
    const insertShape = () => {
      if (editorInstance.value) {
        insertShapeToEditor(editorInstance.value, {
          type: selectedShapeType.value,
          color: shapeColor.value,
          size: shapeSize.value,
          strokeWidth: shapeStrokeWidth.value,
          text: shapeText.value,
          latex: shapeLatex.value
        })
      } else {
        console.warn('에디터 인스턴스가 아직 초기화되지 않았습니다.')
      }
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



    // MathJax로 수식 재렌더링 (기존 시스템 사용)
    const reRenderMathJax = async () => {
      try {
        // MathJax 로드 대기
        await waitForMathJax()

        console.log('MathJax 재렌더링 시작')

        // OCR 텍스트 영역 찾기
        const ocrTextElement = document.querySelector('.ocr-text > div') ||
                               document.querySelector('.ocr-text')
        if (ocrTextElement) {
          console.log('OCR 텍스트 영역 렌더링:', ocrTextElement)
          await renderMathJax(ocrTextElement, { clearFirst: false })
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

        console.log('MathJax 재렌더링 완료')
      } catch (error) {
        console.error('MathJax 재렌더링 중 오류:', error)
      }
    }

    // OCR 텍스트 렌더링 (computed로 반응형 처리)
    const renderedOcrText = computed(() => {
      const currentText = props.editedTexts[props.currentEditingArea]
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

      // 동기적으로 처리하고 Promise가 아닌 문자열 반환 보장
      try {
        const styledResult = styleLatexCode(currentText)
        // Promise인지 확인
        if (styledResult instanceof Promise) {
          console.warn('styleLatexCode가 Promise를 반환함')
          return currentText // Promise인 경우 원본 텍스트 반환
        }
        return styledResult
      } catch (error) {
        console.error('styleLatexCode 오류:', error)
        return currentText // 오류 시 원본 텍스트 반환
      }
    })

    // 각 영역별 미리보기 computed (원본 LaTeX 텍스트 반환)
    const problemPreview = computed(() => {
      const text = props.editedTexts.problem
      if (!text) return ''
      console.log('problemPreview computed 실행:', { text: text.substring(0, 100) })
      return text // 원본 LaTeX 텍스트 반환
    })

    const optionsPreview = computed(() => {
      const text = props.editedTexts.options
      if (!text) return ''
      return text // 원본 LaTeX 텍스트 반환
    })

    const questionPreview = computed(() => {
      const text = props.editedTexts.question
      if (!text) return ''
      return text // 원본 LaTeX 텍스트 반환
    })

    const imagePreview = computed(() => {
      const text = props.editedTexts.image
      if (!text) return ''
      return text // 원본 LaTeX 텍스트 반환
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
      }
    }, { deep: true })

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
            emit('update:editedTexts', defaultTexts)
            console.log('기본 텍스트 설정됨:', defaultTexts)
          }
        }

        // 초기 MathJax 렌더링 실행
        await nextTick()
        // DOM이 완전히 준비될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        await reRenderMathJax()

      } catch (error) {
        console.warn('Step2TextEditing 초기화 실패:', error)
      }
    })

    // 컴포넌트 언마운트 시 에디터 인스턴스 정리
    onUnmounted(() => {
      try {
        if (editorInstance.value) {
          editorInstance.value.destroy()
          editorInstance.value = null
          console.log('에디터 인스턴스 정리 완료')
        }
      } catch (error) {
        console.warn('에디터 인스턴스 정리 중 오류:', error)
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
      selectEditingArea,
      copyOcrToEditor,
      updateEditedText,
      insertMath,
      insertShape,
      exportShape,
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
      styleLatexCode,
      problemPreview,
      optionsPreview,
      questionPreview,
      imagePreview
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

/* MathJax 렌더링 스타일링 (기존 시스템 사용) */
.ocr-text mjx-container,
.preview-html mjx-container {
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
