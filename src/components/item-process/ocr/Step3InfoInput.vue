<template>
  <div class="step3-container">
    <!-- 좌측: 문제 미리보기 -->
    <div class="left-section">
      <div class="preview-panel">
        <h5 class="panel-title">작성한 문제 미리보기</h5>
        <div class="preview-content">
          <!-- 실제 문제처럼 표시 -->
          <div class="problem-display">
            <!-- 지문 영역 -->
            <div v-if="editedTexts.question" class="passage-section">
              <div class="passage-content" v-html="editedTexts.question"></div>
            </div>

            <!-- 문제 영역 -->
            <div v-if="editedTexts.problem" class="problem-section">
              <div class="problem-content" v-html="editedTexts.problem"></div>
            </div>

            <!-- 이미지 영역 -->
            <div v-if="hasValidPassageImage" class="image-section">
              <div class="image-content">
                <img :src="captureFullImg" alt="문제 이미지" class="problem-image" />
              </div>
            </div>

            <!-- 보기 영역 -->
            <div v-if="editedTexts.options" class="options-section">
              <div class="options-content">
                <div v-for="(option, index) in processedOptionsList" :key="index" class="option-item">
                  <div class="option-number">({{ index + 1 }})</div>
                  <div class="option-content" v-html="option"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 우측: 정보 입력 -->
    <div class="right-section">
      <!-- 문항 정보 입력 -->
      <div class="info-input-panel">
        <h5 class="panel-title">문항 정보 입력</h5>

        <div class="form-content">
          <!-- 문제 정보 -->
          <div class="form-section">
            <h6 class="section-title">문제 정보</h6>

            <div class="form-group">
              <label class="form-label">문제 형태</label>
              <select v-model="problemInfo.problemType" class="form-select">
                <option value="">선택 값</option>
                <option value="fiveChoice">5지 선택</option>
                <option value="shortAnswerOrdered">단답 유순형</option>
                <option value="shortAnswerUnOrdered">단답 무순형</option>
                <option value="freeChoice">자유 선지형</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">난이도</label>
              <select v-model="problemInfo.difficulty" class="form-select" @change="updateProblemInfo">
                <option value="">선택 값</option>
                <option value="easy">하</option>
                <option value="medium">중</option>
                <option value="hard">상</option>
              </select>
            </div>



            <div class="form-group">
              <label class="form-label">지문 여부</label>
              <input
                v-model="problemInfo.hasPassage"
                type="checkbox"
                class="form-check-input"
                disabled
              />
              <span class="form-text">자동 입력 / 비활성화</span>
            </div>

            <div class="form-group">
              <label class="form-label">정답</label>
              <input
                v-model="problemInfo.answer"
                type="text"
                class="form-control"
                :placeholder="getAnswerPlaceholder()"
                @input="updateProblemInfo"
              />
            </div>
          </div>

          <!-- 단원 정보 -->
          <div class="form-section">
            <h6 class="section-title">단원 정보</h6>

            <!-- 챕터 로딩 상태 -->
            <div v-if="chaptersLoading" class="alert alert-info">
              <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">로딩 중...</span>
                </div>
                <span>단원 정보를 불러오는 중...</span>
              </div>
            </div>

            <!-- 챕터 에러 상태 -->
            <div v-else-if="chaptersError" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>단원 정보 로드 실패:</strong> {{ chaptersError }}
              <button @click="loadChapters" class="btn btn-sm btn-outline-warning ms-2">
                다시 시도
              </button>
            </div>

            <!-- 챕터 선택 폼 -->
            <div v-else>
              <div class="form-group">
                <label class="form-label">대단원 챕터</label>
                <select v-model="problemInfo.majorChapter" class="form-select" :disabled="majorChapters.length === 0" @change="loadMiddleChapters(problemInfo.majorChapter)">
                  <option value="">{{ majorChapters.length === 0 ? '단원 정보가 없습니다' : '선택 값' }}</option>
                  <option v-for="chapter in majorChapters" :key="chapter.id" :value="chapter.id">
                    {{ chapter.name }}
                  </option>
                </select>
                <small v-if="majorChapters.length === 0" class="form-text text-muted">
                  교과서를 선택하면 단원 정보가 표시됩니다.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label">중단원 챕터</label>
                <select v-model="problemInfo.middleChapter" class="form-select" :disabled="middleChapters.length === 0" @change="loadMinorChapters(problemInfo.middleChapter)">
                  <option value="">{{ middleChapters.length === 0 ? '대단원을 먼저 선택하세요' : '선택 값' }}</option>
                  <option v-for="chapter in middleChapters" :key="chapter.id" :value="chapter.id">
                    {{ chapter.name }}
                  </option>
                </select>
                <small v-if="middleChapters.length === 0 && problemInfo.majorChapter" class="form-text text-muted">
                  대단원을 선택하면 중단원이 표시됩니다.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label">소단원 챕터</label>
                <select v-model="problemInfo.minorChapter" class="form-select" :disabled="minorChapters.length === 0" @change="loadTopicChapters(problemInfo.minorChapter)">
                  <option value="">{{ minorChapters.length === 0 ? '중단원을 먼저 선택하세요' : '선택 값' }}</option>
                  <option v-for="chapter in minorChapters" :key="chapter.id" :value="chapter.id">
                    {{ chapter.name }}
                  </option>
                </select>
                <small v-if="minorChapters.length === 0 && problemInfo.middleChapter" class="form-text text-muted">
                  중단원을 선택하면 소단원이 표시됩니다.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label">토픽 챕터</label>
                <select v-model="problemInfo.topicChapter" class="form-select" :disabled="topicChapters.length === 0">
                  <option value="">{{ topicChapters.length === 0 ? '소단원을 먼저 선택하세요' : '선택 값' }}</option>
                  <option v-for="topic in topicChapters" :key="topic.id" :value="topic.id">
                    {{ topic.name }}
                  </option>
                </select>
                <small v-if="topicChapters.length === 0 && problemInfo.minorChapter" class="form-text text-muted">
                  소단원을 선택하면 토픽이 표시됩니다.
                </small>
              </div>
            </div>
          </div>

          <!-- 해설 입력 -->
          <div class="form-section">
            <h6 class="section-title">
              해설 입력
              <button @click="toggleExplanationEditor" class="btn btn-sm btn-outline-secondary">
                {{ showExplanationEditor ? '접기' : '펼치기' }}
              </button>
            </h6>

            <div v-show="showExplanationEditor" class="explanation-editor">
              <div class="editor-with-tools">
                <!-- 에디터 섹션 -->
                <div class="editor-panel">
                  <div class="editor-header">
                    <h6 class="editor-title">해설 에디터</h6>
                  </div>
                  <div class="editor-content">
                    <Editor
                      :key="explanationEditorKey"
                      :api-key="tinymceApiKey"
                      :model-value="problemInfo.explanation"
                      @update:model-value="updateExplanation"
                      @init="onEditorInit"
                      :init="explanationEditorConfig"
                      class="explanation-tinymce-editor"
                    />
                  </div>
                </div>

                <!-- 우측 도구 패널 -->
                <div class="right-tools-panel">
                  <div class="tool-tabs">
                    <button
                      @click="activeToolTab = 'math'"
                      class="tool-tab"
                      :class="{ active: activeToolTab === 'math' }"
                    >
                      <i class="bi bi-calculator me-2"></i>수식
                    </button>
                    <button
                      @click="activeToolTab = 'preview'"
                      class="tool-tab"
                      :class="{ active: activeToolTab === 'preview' }"
                    >
                      <i class="bi bi-eye me-2"></i>미리보기
                    </button>
                  </div>

                  <!-- 수식 도구 탭 -->
                  <div v-if="activeToolTab === 'math'" class="tool-content">
                    <div class="math-tools">
                      <div class="tool-section">
                        <h6 class="tool-section-title">수식 검색</h6>
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
                        <h6 class="tool-section-title">수식 입력</h6>
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
                        <h6 class="tool-section-title">(LaTeX) 미리보기</h6>
                        <div class="latex-preview" v-html="mathPreviewHtml"></div>
                      </div>
                    </div>
                  </div>

                  <!-- 미리보기 탭 -->
                  <div v-if="activeToolTab === 'preview'" class="tool-content">
                    <div class="preview-tools">
                      <h6 class="tool-section-title">해설 미리보기</h6>
                      <div class="preview-content">
                        <div v-if="explanationPreviewHtml && explanationPreviewHtml.trim()"
                             class="explanation-preview-content tex2jax_process"
                             v-html="explanationPreviewHtml"></div>
                        <div v-else class="no-explanation">
                          <i class="bi bi-info-circle me-2"></i>
                          해설을 입력해주세요
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick, markRaw } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import chapterApi from '@/services/chapterApi'
import { useSubjectStore } from '@/store/subjectStore.js'
import { fileHistoryAPI } from '@/services/fileHistoryApi.js'
import { renderMathJax, waitForMathJax } from '@/utils/mathjax'
import { createCommonEditorConfig, getTinyMCEApiKey } from '@/utils/tinymce-common-config'

export default {
  name: 'Step3InfoInput',
  components: {
    Editor
  },
  props: {
    editedTexts: {
      type: Object,
      required: true
    },
    selectedAreas: {
      type: Object,
      required: true
    },
    selectedTextbook: {
      type: Object,
      required: true
    },
    isNewFile: {
      type: Boolean,
      default: false
    },
    selectedFile: {
      type: Object,
      default: null
    },
    passage: {
      type: String,
      default: ''
    },
    captureFullImg: {
      type: String,
      default: ''
    }
  },
  emits: [
    'update:problemInfo',
    'update:chapters'
  ],
  setup(props, { emit }) {
    // 도구 탭 상태
    const activeToolTab = ref('math')

    // Math tools (Step2와 동일)
    const mathSearch = ref('')
    const currentMathLatex = ref('')
    const editorInstance = ref(null)

    // 문제 정보 상태
    const problemInfo = ref({
      majorChapter: '',
      middleChapter: '',
      minorChapter: '',
      topicChapter: '',
      problemType: 'fiveChoice', // 기본값 설정
      difficulty: 'medium', // 기본값 설정
      hasPassage: !!props.selectedAreas.question,
      answer: '',
      explanation: ''
    })

    // 해설 에디터 상태
    const showExplanationEditor = ref(false)
    const explanationEditorKey = ref(0)

    // 수식 검색을 위한 템플릿 데이터 (Step2와 동일)
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

    // 챕터 데이터 상태
    const majorChapters = ref([])
    const middleChapters = ref([])
    const minorChapters = ref([])
    const topicChapters = ref([])
    const chaptersLoading = ref(false)
    const chaptersError = ref(null)

    // 수식 검색 결과 (Step2와 동일)
    const filteredMathTemplates = computed(() => {
      if (!mathSearch.value?.trim() || !mathTemplates.value) return []

      const query = mathSearch.value.toLowerCase()
      return mathTemplates.value.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.preview.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      )
    })

        // 수식 미리보기 (Step2와 동일)
    const mathPreviewHtml = computed(() => {
      if (!currentMathLatex.value) return '<div class="text-muted">수식을 입력하거나 선택하세요</div>'

      try {
        return `$$${currentMathLatex.value}$$`
      } catch {
        return '<div class="text-danger">수식 오류</div>'
      }
    })

    // 해설 미리보기 (MathJax 렌더링 적용)
    const explanationPreviewHtml = ref('')

    // 해설 내용이 변경될 때마다 미리보기 업데이트
    watch(() => problemInfo.value.explanation, async (newExplanation) => {
      if (newExplanation && newExplanation.trim()) {
        try {
          const rendered = await renderLatexContent(newExplanation)
          explanationPreviewHtml.value = rendered
        } catch (error) {
          console.warn('해설 미리보기 렌더링 실패:', error)
          explanationPreviewHtml.value = styleLatexCode(newExplanation)
        }
      } else {
        explanationPreviewHtml.value = ''
      }
    }, { immediate: true })

    // 컴포넌트 마운트 시 MathJax 초기화
    onMounted(async () => {
      try {
        await ensureMathJaxLoaded()
        console.log('Step3 MathJax 초기화 완료')
      } catch (error) {
        console.warn('Step3 MathJax 초기화 실패:', error)
      }
    })

    // 보기 텍스트를 항목별로 분리하는 함수
    const splitOptions = (optionsText) => {
      if (!optionsText) return []

      try {
        console.log('splitOptions 입력:', optionsText)

        // 옵션을 수동으로 분리하는 방법
        const options = []

        // 여러 패턴 시도
        const patterns = [
          /\((\d+)\)\s*([\s\S]*?)(?=\(\d+\)|$)/g,  // (1) 텍스트 (2) 텍스트
          /(\d+)\.\s*([\s\S]*?)(?=\d+\.|$)/g,       // 1. 텍스트 2. 텍스트
          /(\d+)\)\s*([\s\S]*?)(?=\d+\)|$)/g        // 1) 텍스트 2) 텍스트
        ]

        for (const pattern of patterns) {
          let match
          pattern.lastIndex = 0 // 정규식 인덱스 리셋

          while ((match = pattern.exec(optionsText)) !== null) {
            const choiceNumber = match[1]
            const choiceText = match[2]?.trim()

            // 1-5번까지만 처리 (6번 이상은 무시)
            if (choiceNumber && parseInt(choiceNumber) <= 5 && choiceText && choiceText.length > 0) {
              options.push(choiceText)
            }
          }

          if (options.length > 0) {
            break // 패턴이 매치되면 다른 패턴은 시도하지 않음
          }
        }

        console.log('splitOptions 결과:', options)
        return options
      } catch (error) {
        console.warn('선택지 파싱 실패:', error)
        return []
      }
    }

        // 보기 텍스트를 줄바꿈이 포함된 형태로 변환하는 함수
    const formatOptionsWithLineBreaks = (optionsText) => {
      if (!optionsText) return ''

      // splitOptions를 사용해서 각 옵션을 분리한 후 줄바꿈으로 연결
      const options = splitOptions(optionsText)
      return options.join('\n')
    }

    // 처리된 보기 목록
    const processedOptionsList = computed(() => {
      const options = splitOptions(props.editedTexts.options)

      // MathJax가 로드되어 있으면 raw LaTeX 반환, 아니면 스타일링된 LaTeX 반환
      if (window.MathJax && window.MathJax.startup) {
        return options // raw LaTeX for MathJax processing
      } else {
        // MathJax가 없을 때 LaTeX 스타일링
        return options.map(option => styleLatexCode(option))
      }
    })



    // 유효한 지문 이미지가 있는지 확인
    const hasValidPassageImage = computed(() => {
      // passage 텍스트가 있고, captureFullImg prop이 있는지 확인
      return props.editedTexts.question &&
             props.editedTexts.question.trim() !== '' &&
             props.captureFullImg &&
             props.captureFullImg.trim() !== '' &&
             (props.captureFullImg.startsWith('data:image/') || props.captureFullImg.startsWith('http'))
    })

    // MathJax 렌더링 함수
    const renderPreviewMathJax = async () => {
      try {
        // MathJax 로드 대기
        await waitForMathJax()

        console.log('Step3 미리보기 MathJax 렌더링 시작')

        // DOM이 완전히 업데이트될 때까지 대기
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        // 미리보기 영역 요소들 찾기
        const previewElements = document.querySelectorAll('.passage-content, .problem-content, .option-content')
        console.log(`Step3 미리보기 영역 ${previewElements.length}개 발견:`, Array.from(previewElements).map(el => el.className))

        for (const element of previewElements) {
          console.log('Step3 미리보기 영역 요소 검사:', element.className, element.innerHTML.substring(0, 100))

          if (element.innerHTML && (element.innerHTML.includes('$') || element.innerHTML.includes('\\'))) {
            console.log('Step3 미리보기 영역 렌더링 시작:', element.className)

            // MathJax 설정 재확인
            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
              // MathJax 문서 업데이트
              window.MathJax.startup.document.updateDocument()

              // 강제 렌더링 시도
              try {
                await window.MathJax.typesetPromise([element])
                console.log('Step3 미리보기 영역 MathJax 강제 렌더링 성공:', element.className)
              } catch (error) {
                console.warn('Step3 미리보기 영역 MathJax 강제 렌더링 실패, 기본 렌더링 시도:', error)
                await renderMathJax(element, { clearFirst: false })
              }
            } else {
              await renderMathJax(element, { clearFirst: false })
            }
          } else {
            console.log('Step3 미리보기 영역 요소에 LaTeX 없음:', element.className)
          }
        }

        // 전체 미리보기 컨테이너도 렌더링
        const previewContainer = document.querySelector('.problem-display')
        if (previewContainer) {
          console.log('Step3 미리보기 컨테이너 렌더링 시도')
          try {
            await renderMathJax(previewContainer, { clearFirst: false })
            console.log('Step3 미리보기 컨테이너 렌더링 성공')
          } catch (error) {
            console.warn('Step3 미리보기 컨테이너 렌더링 실패:', error)
          }
        }

        console.log('Step3 미리보기 MathJax 렌더링 완료')
      } catch (error) {
        console.error('Step3 미리보기 MathJax 렌더링 중 오류:', error)
      }
    }

    // 폼 유효성 검사
    const isFormValid = computed(() => {
      return !!(
        problemInfo.value.problemType &&
        problemInfo.value.difficulty &&
        problemInfo.value.answer.trim()
      )
    })

        // 대단원 선택 시 중단원 로드
    const loadMiddleChapters = (majorChapterId) => {
      const majorChapter = majorChapters.value.find(ch => ch.id === majorChapterId)
      if (majorChapter && majorChapter.children) {
        middleChapters.value = majorChapter.children.map(chapter => ({
          id: chapter.id,
          name: chapter.name,
          children: chapter.children || []
        }))
        console.log('📚 [Step3InfoInput] 중단원 로드 완료:', middleChapters.value.length)

        // 중단원, 소단원, 토픽 초기화
        minorChapters.value = []
        topicChapters.value = []
        problemInfo.value.middleChapter = majorChapterId
        problemInfo.value.minorChapter = ''
        problemInfo.value.topicChapter = ''

        // 문제 정보 업데이트
        updateProblemInfo()

        // 부모 컴포넌트에 챕터 데이터 전달
        emit('update:chapters', {
          majorChapters: majorChapters.value,
          middleChapters: middleChapters.value,
          minorChapters: minorChapters.value,
          topicChapters: topicChapters.value
        })
      }
    }

        // 중단원 선택 시 소단원 로드
    const loadMinorChapters = (middleChapterId) => {
      const middleChapter = middleChapters.value.find(ch => ch.id === middleChapterId)
      if (middleChapter && middleChapter.children) {
        minorChapters.value = middleChapter.children.map(chapter => ({
          id: chapter.id,
          name: chapter.name,
          topics: chapter.topics || []
        }))
        console.log('📚 [Step3InfoInput] 소단원 로드 완료:', minorChapters.value.length)

        // 소단원, 토픽 초기화
        topicChapters.value = []
        problemInfo.value.minorChapter = middleChapterId
        problemInfo.value.topicChapter = ''

        // 문제 정보 업데이트
        updateProblemInfo()

        // 부모 컴포넌트에 챕터 데이터 전달
        emit('update:chapters', {
          majorChapters: majorChapters.value,
          middleChapters: middleChapters.value,
          minorChapters: minorChapters.value,
          topicChapters: topicChapters.value
        })
      }
    }

    // 소단원 선택 시 토픽 로드
    const loadTopicChapters = (minorChapterId) => {
      const minorChapter = minorChapters.value.find(ch => ch.id === minorChapterId)
      if (minorChapter && minorChapter.topics) {
        topicChapters.value = minorChapter.topics.map(topic => ({
          id: topic.id,
          name: topic.name
        }))
        console.log('📚 [Step3InfoInput] 토픽 로드 완료:', topicChapters.value.length)
        // topicChapter는 초기화만 하고 사용자가 선택하도록 함
        problemInfo.value.topicChapter = ''

        // 문제 정보 업데이트
        updateProblemInfo()

        // 부모 컴포넌트에 챕터 데이터 전달
        emit('update:chapters', {
          majorChapters: majorChapters.value,
          middleChapters: middleChapters.value,
          minorChapters: minorChapters.value,
          topicChapters: topicChapters.value
        })
      }
    }

    // 챕터 데이터 로드
    const loadChapters = async () => {
      console.log('🚀 [Step3InfoInput] loadChapters 시작')

      let subjectId = null

      if (props.isNewFile) {
        // 새 파일: 교과서에서 subjectId
        subjectId = props.selectedTextbook?.subjectId
                 || props.selectedTextbook?.id   // 혹시 id로 오는 경로 대비
                 || props.selectedTextbook?.code || null
      } else if (props.selectedFile?.id) {
        // 기존 파일: selectedFile.subjectId 우선 사용 (상위에서 이미 설정됨)
        subjectId = props.selectedFile?.subjectId || props.selectedFile?.subject?.id

        if (!subjectId) {
          // subjectId가 없는 경우에만 fileHistoryId로 조회
          try {
            const { subjectId: sid, areaCode } = await fileHistoryAPI.getSubjectIdByFileHistoryId(props.selectedFile.id)
            subjectId = sid
            if (!subjectId && areaCode) {
              // areaCode만 왔다면 매핑(필요시 subjectStore 사용)
              const subjectStore = useSubjectStore()
              if (subjectStore.list.length === 0) {
                await subjectStore.fetchSubjects()
              }
              const subject = subjectStore.list.find(s => s.areaCode === areaCode)
              if (subject) {
                subjectId = subject.subjectId
                console.log('✅ [Step3InfoInput] areaCode 매핑 성공:', areaCode, '→', subjectId)
              }
            }
          } catch (e) {
            console.warn('⚠️ fileHistory→subjectId 조회 실패:', e)
          }
        }
      }

      if (!subjectId) {
        console.warn('⚠️ subjectId 없음 → 챕터 로드 중단', {
          selectedTextbook: props.selectedTextbook,
          selectedFile: props.selectedFile
        })
        chaptersError.value = '과목 정보를 찾을 수 없어 챕터를 로드할 수 없습니다.'
        return
      }

      try {
        chaptersLoading.value = true
        chaptersError.value = null

        console.log('📚 [Step3InfoInput] API 호출 정보:', {
          method: 'GET',
          endpoint: `/chapter/${subjectId}/tree`,
          subjectId,
          textbookName: props.selectedTextbook?.name,
          fileName: props.selectedFile?.name
        })

        const startTime = Date.now()
        const response = await chapterApi.getChapterTree(subjectId)
        const endTime = Date.now()

        console.log('📊 [Step3InfoInput] API 응답 정보:', {
          status: response.status,
          statusText: response.statusText,
          responseTime: `${endTime - startTime}ms`,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          success: response.data?.success
        })

        // 실제 응답 데이터 구조 상세 확인
        console.log('🔍 [Step3InfoInput] 전체 응답 데이터:', response.data)
        if (response.data?.data) {
          console.log('🔍 [Step3InfoInput] 챕터 데이터 상세:', response.data.data)
          console.log('🔍 [Step3InfoInput] 대단원 배열:', response.data.data.majorChapters)
          console.log('🔍 [Step3InfoInput] 중단원 배열:', response.data.data.middleChapters)
          console.log('🔍 [Step3InfoInput] 소단원 배열:', response.data.data.minorChapters)
        }

                  if (response.data && response.data.success) {
            const chapterData = response.data.data
            console.log('✅ [Step3InfoInput] 챕터 데이터 로드 완료')
            console.log('📊 [Step3InfoInput] 챕터 데이터 구조:', {
              isArray: Array.isArray(chapterData),
              length: Array.isArray(chapterData) ? chapterData.length : 0,
              sampleChapter: Array.isArray(chapterData) ? chapterData[0] : null
            })

            // API 응답이 배열 형태로 오므로 직접 사용
                    if (Array.isArray(chapterData)) {
          // 대단원: 최상위 배열 요소들
          majorChapters.value = chapterData.map(chapter => ({
            id: chapter.id,
            name: chapter.name,
            children: chapter.children || []
          }))

          console.log('📚 [Step3InfoInput] 대단원 설정 완료:', majorChapters.value.length)
          console.log('📚 [Step3InfoInput] 대단원 내용:', majorChapters.value)
          console.log('📚 [Step3InfoInput] 첫 번째 대단원 상세:', majorChapters.value[0])

              // 중단원, 소단원, 토픽은 선택된 대단원에 따라 동적으로 설정
              middleChapters.value = []
              minorChapters.value = []
              topicChapters.value = []

              // 선택된 챕터들도 초기화
              problemInfo.value.middleChapter = ''
              problemInfo.value.minorChapter = ''
              problemInfo.value.topicChapter = ''

              console.log('🔄 [Step3InfoInput] 하위 챕터 초기화 완료')
              console.log('🔄 [Step3InfoInput] 대단원 개수:', majorChapters.value.length)
              console.log('🔄 [Step3InfoInput] 첫 번째 대단원:', majorChapters.value[0])

              // 부모 컴포넌트에 챕터 데이터 전달
              console.log('📤 [Step3InfoInput] emit update:chapters 호출:', {
                majorChapters: majorChapters.value,
                middleChapters: middleChapters.value,
                minorChapters: minorChapters.value,
                topicChapters: topicChapters.value
              })
              emit('update:chapters', {
                majorChapters: majorChapters.value,
                middleChapters: middleChapters.value,
                minorChapters: minorChapters.value,
                topicChapters: topicChapters.value
              })
            } else {
              console.warn('⚠️ [Step3InfoInput] 챕터 데이터가 배열 형태가 아님:', chapterData)
              majorChapters.value = []
              middleChapters.value = []
              minorChapters.value = []
              topicChapters.value = []
            }

        } else {
          console.error('❌ [Step3InfoInput] API 응답이 성공하지 않음:', response.data)
          throw new Error(response.data?.message || '챕터 데이터 로드 실패')
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 챕터 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        })
        chaptersError.value = error.message || '챕터 데이터를 불러오는데 실패했습니다.'
      } finally {
        chaptersLoading.value = false
        console.log('🏁 [Step3InfoInput] 챕터 로드 완료 (성공/실패 여부와 관계없이)')
      }
    }

    // 대단원 변경 시 중단원 로드
    const onMajorChapterChange = async () => {
      console.log('🔄 [Step3InfoInput] onMajorChapterChange 호출됨')
      console.log('📋 [Step3InfoInput] 선택된 대단원:', problemInfo.value.majorChapter)

      if (!problemInfo.value.majorChapter) {
        console.log('🔄 [Step3InfoInput] 대단원이 선택되지 않음 - 하위 챕터 초기화')
        middleChapters.value = []
        minorChapters.value = []
        topicChapters.value = []
        problemInfo.value.middleChapter = ''
        problemInfo.value.minorChapter = ''
        problemInfo.value.topicChapter = ''
        return
      }

      try {
        console.log('🔍 [Step3InfoInput] 대단원에서 중단원 정보 찾는 중...')
        const majorChapter = majorChapters.value.find(c => c.id === problemInfo.value.majorChapter)

        if (majorChapter && majorChapter.children) {
          console.log('✅ [Step3InfoInput] 중단원 데이터 발견:', {
            majorChapterId: majorChapter.id,
            majorChapterName: majorChapter.name,
            middleChaptersCount: majorChapter.children.length,
            sampleMiddleChapter: majorChapter.children[0] || null
          })

          middleChapters.value = majorChapter.children
          minorChapters.value = []
          topicChapters.value = []
          problemInfo.value.middleChapter = ''
          problemInfo.value.minorChapter = ''
          problemInfo.value.topicChapter = ''

          console.log('🔄 [Step3InfoInput] 하위 챕터 초기화 완료')

          // 부모 컴포넌트에 챕터 데이터 전달
          emit('update:chapters', {
            majorChapters: majorChapters.value,
            middleChapters: middleChapters.value,
            minorChapters: minorChapters.value,
            topicChapters: topicChapters.value
          })
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 대단원에 중단원 데이터가 없음:', {
            majorChapterId: problemInfo.value.majorChapter,
            hasMajorChapter: !!majorChapter,
            hasChildren: !!(majorChapter && majorChapter.children)
          })
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 중단원 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          majorChapterId: problemInfo.value.majorChapter
        })
      }
    }

    // 중단원 변경 시 소단원 로드
    const onMiddleChapterChange = async () => {
      console.log('🔄 [Step3InfoInput] onMiddleChapterChange 호출됨')
      console.log('📋 [Step3InfoInput] 선택된 중단원:', problemInfo.value.middleChapter)

      if (!problemInfo.value.middleChapter) {
        console.log('🔄 [Step3InfoInput] 중단원이 선택되지 않음 - 하위 챕터 초기화')
        minorChapters.value = []
        topicChapters.value = []
        problemInfo.value.minorChapter = ''
        problemInfo.value.topicChapter = ''
        return
      }

      try {
        console.log('🔍 [Step3InfoInput] 중단원에서 소단원 정보 찾는 중...')
        const middleChapter = middleChapters.value.find(c => c.id === problemInfo.value.middleChapter)

        if (middleChapter && middleChapter.children) {
          console.log('✅ [Step3InfoInput] 소단원 데이터 발견:', {
            middleChapterId: middleChapter.id,
            middleChapterName: middleChapter.name,
            minorChaptersCount: middleChapter.children.length,
            sampleMinorChapter: middleChapter.children[0] || null
          })

          minorChapters.value = middleChapter.children
          topicChapters.value = []
          problemInfo.value.minorChapter = ''
          problemInfo.value.topicChapter = ''

          console.log('🔄 [Step3InfoInput] 하위 챕터 초기화 완료')
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 중단원에 소단원 데이터가 없음:', {
            middleChapterId: problemInfo.value.middleChapter,
            hasMiddleChapter: !!middleChapter,
            hasChildren: !!(middleChapter && middleChapter.children)
          })
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 소단원 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          middleChapterId: problemInfo.value.middleChapter
        })
      }
    }

    // 소단원 변경 시 토픽 로드
    const onMinorChapterChange = async () => {
      console.log('🔄 [Step3InfoInput] onMinorChapterChange 호출됨')
      console.log('📋 [Step3InfoInput] 선택된 소단원:', problemInfo.value.minorChapter)

      if (!problemInfo.value.minorChapter) {
        console.log('🔄 [Step3InfoInput] 소단원이 선택되지 않음 - 토픽 초기화')
        topicChapters.value = []
        problemInfo.value.topicChapter = ''
        return
      }

      try {
        console.log('🔍 [Step3InfoInput] 소단원에서 토픽 정보 찾는 중...')
        const minorChapter = minorChapters.value.find(c => c.id === problemInfo.value.minorChapter)

        if (minorChapter && minorChapter.children) {
          console.log('✅ [Step3InfoInput] 토픽 데이터 발견:', {
            minorChapterId: minorChapter.id,
            minorChapterName: minorChapter.name,
            topicChaptersCount: minorChapter.children.length,
            sampleTopicChapter: minorChapter.children[0] || null
          })

          topicChapters.value = minorChapter.children
          problemInfo.value.topicChapter = ''

          console.log('🔄 [Step3InfoInput] 토픽 초기화 완료')
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 소단원에 토픽 데이터가 없음:', {
            minorChapterId: problemInfo.value.minorChapter,
            hasMinorChapter: !!minorChapter,
            hasChildren: !!(minorChapter && minorChapter.children)
          })
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 토픽 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          minorChapterId: problemInfo.value.minorChapter
        })
      }
    }

    // 문제 정보 업데이트
    const updateProblemInfo = () => {
      console.log('📝 [Step3InfoInput] updateProblemInfo 호출됨')
      console.log('📋 [Step3InfoInput] 업데이트할 문제 정보:', problemInfo.value)

      const problemInfoCopy = { ...problemInfo.value }
      emit('update:problemInfo', problemInfoCopy)

      console.log('✅ [Step3InfoInput] 문제 정보 업데이트 완료 - 부모 컴포넌트로 전달됨')
    }



        // 컴포넌트 마운트 시 챕터 데이터 로드
    onMounted(() => {
      console.log('🚀 [Step3InfoInput] 컴포넌트 마운트됨')
      console.log('📋 [Step3InfoInput] 초기 props 상태:', {
        selectedTextbook: props.selectedTextbook,
        hasSubjectId: !!props.selectedTextbook?.subjectId,
        subjectId: props.selectedTextbook?.subjectId,
        isNewFile: props.isNewFile,
        selectedFile: props.selectedFile,
        fileSubjectId: props.selectedFile?.subjectId || props.selectedFile?.subject?.id
      })

      // 신규 파일 또는 기존 파일에서 subjectId가 있는 경우 챕터 데이터 로드
      if (props.isNewFile && props.selectedTextbook?.subjectId) {
        console.log('📚 [Step3InfoInput] 신규 파일 - 교과서 정보 발견 - 챕터 데이터 로드 시작')
        loadChapters()
      } else if (!props.isNewFile && (props.selectedFile?.subjectId || props.selectedFile?.subject?.id)) {
        console.log('📚 [Step3InfoInput] 기존 파일 - FileHistory에서 subjectId 발견 - 챕터 데이터 로드 시작')
        loadChapters()
      } else {
        console.warn('⚠️ [Step3InfoInput] subjectId를 찾을 수 없어 챕터 데이터를 로드할 수 없음')
        console.warn('⚠️ [Step3InfoInput] 신규 파일 여부:', props.isNewFile)
        console.warn('⚠️ [Step3InfoInput] 교과서 정보:', props.selectedTextbook)
        console.warn('⚠️ [Step3InfoInput] 파일 정보:', props.selectedFile)
      }

      // 컴포넌트 마운트 시 부모 컴포넌트로 초기 문제 정보 전달
      console.log('📝 [Step3InfoInput] 마운트 시 초기 문제 정보 전달:', problemInfo.value)
      updateProblemInfo()

      // MathJax 렌더링 실행
      nextTick(() => {
        renderPreviewMathJax()
      })
    })

        // 교과서 변경 시 챕터 데이터 재로드 (신규 파일)
    watch(() => props.selectedTextbook?.subjectId, (newSubjectId, oldSubjectId) => {
      console.log('🔄 [Step3InfoInput] 교과서 변경 감지 (신규 파일):', {
        oldSubjectId,
        newSubjectId,
        hasChanged: oldSubjectId !== newSubjectId,
        isNewFile: props.isNewFile
      })

      if (newSubjectId && props.isNewFile) {
        console.log('📚 [Step3InfoInput] 새로운 교과서 선택됨 (신규 파일) - 챕터 데이터 재로드')
        loadChapters()
      } else if (!newSubjectId && props.isNewFile) {
        console.warn('⚠️ [Step3InfoInput] 교과서 정보가 제거됨 (신규 파일)')
      }
    })

    // 파일 변경 시 챕터 데이터 재로드 (기존 파일)
    watch(() => props.selectedFile, (newFile, oldFile) => {
      console.log('🔄 [Step3InfoInput] 파일 변경 감지 (기존 파일):', {
        oldFileId: oldFile?.id,
        newFileId: newFile?.id,
        oldSubjectId: oldFile?.subjectId || oldFile?.subject?.id,
        newSubjectId: newFile?.subjectId || newFile?.subject?.id,
        hasChanged: oldFile?.id !== newFile?.id,
        isNewFile: props.isNewFile
      })

      if (newFile && !props.isNewFile) {
        const newSubjectId = newFile.subjectId || newFile.subject?.id
        if (newSubjectId) {
          console.log('📚 [Step3InfoInput] 새로운 파일 선택됨 (기존 파일) - 챕터 데이터 재로드')
          loadChapters()
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 파일에 subjectId가 없음 (기존 파일)')
        }
      }
    }, { deep: true })

    // 챕터 선택 변경 시 하위 챕터 로드
    watch(() => problemInfo.value.majorChapter, (newMajorChapter, oldMajorChapter) => {
      console.log('🔄 [Step3InfoInput] 대단원 변경 감지:', {
        oldMajorChapter,
        newMajorChapter,
        hasChanged: oldMajorChapter !== newMajorChapter
      })
      onMajorChapterChange()
    })

    watch(() => problemInfo.value.middleChapter, (newMiddleChapter, oldMiddleChapter) => {
      console.log('🔄 [Step3InfoInput] 중단원 변경 감지:', {
        oldMiddleChapter,
        newMiddleChapter,
        hasChanged: oldMiddleChapter !== newMiddleChapter
      })
      onMiddleChapterChange()
    })

    watch(() => problemInfo.value.minorChapter, (newMinorChapter, oldMinorChapter) => {
      console.log('🔄 [Step3InfoInput] 소단원 변경 감지:', {
        oldMinorChapter,
        newMinorChapter,
        hasChanged: oldMinorChapter !== newMinorChapter
      })
      onMinorChapterChange()
    })

    // editedTexts 변경 시 MathJax 렌더링
    watch(() => props.editedTexts, async (newTexts) => {
      // LaTeX 패턴이 포함된 텍스트가 있는지 확인
      const hasLatex = Object.values(newTexts).some(text =>
        text && (text.includes('$') || text.includes('\\'))
      )

      if (hasLatex) {
        await nextTick()
        await renderPreviewMathJax()
      }
    }, { deep: true })

    // processedOptionsList 변경 시 MathJax 렌더링
    watch(processedOptionsList, async (newOptions) => {
      if (newOptions.length > 0) {
        await nextTick()
        await renderPreviewMathJax()
      }
    })

    // captureFullImg 변경 시 MathJax 렌더링
    watch(() => props.captureFullImg, async (newImg) => {
      if (newImg) {
        await nextTick()
        await renderPreviewMathJax()
      }
    })

    // 문제 정보 변경 시 부모 컴포넌트에 전달
    watch(problemInfo, (newProblemInfo, oldProblemInfo) => {
      console.log('🔄 [Step3InfoInput] 문제 정보 변경 감지')
      console.log('📋 [Step3InfoInput] 변경된 내용:', {
        old: oldProblemInfo,
        new: newProblemInfo,
        changedFields: Object.keys(newProblemInfo).filter(key =>
          newProblemInfo[key] !== oldProblemInfo[key]
        )
      })

      updateProblemInfo()
    }, { deep: true })

    // TinyMCE 설정 (Step2와 동일)
    const tinymceApiKey = getTinyMCEApiKey()
    const explanationEditorConfig = createCommonEditorConfig({
      enableMathTools: false, // MathJax 렌더링 비활성화
      enableImageUpload: true, // 이미지 업로드 활성화
      setup: (editor) => {
        // MathJax 렌더링 비활성화 - 에디터 내에서는 LaTeX 코드만 표시
        editor.on('init', () => {
          // 기존의 renderMathInEditor 함수를 오버라이드하여 아무것도 하지 않음
          editor.renderMathInEditor = () => {
            console.log('해설 에디터 내 MathJax 렌더링 비활성화됨')
          }
        })
      }
    })

    // 정답 플레이스홀더
    const getAnswerPlaceholder = () => {
      switch (problemInfo.value.problemType) {
        case 'fiveChoice':
          return '예: 4'
        case 'shortAnswerOrdered':
          return '예: 12'
        case 'shortAnswerUnOrdered':
          return '예: 12'
        case 'freeChoice':
          return '자유 선지형 답안'
        default:
          return '정답을 입력하세요'
      }
    }

    // 해설 에디터 토글
    const toggleExplanationEditor = () => {
      showExplanationEditor.value = !showExplanationEditor.value
    }

    // 해설 업데이트
    const updateExplanation = (content) => {
      problemInfo.value.explanation = content
    }

    // 수식 삽입 (Step2와 동일한 최대 안정성)
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

    // MathJax 로드 확인 및 로드 함수 (Step2와 동일)
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

    // MathJax 로드 상태 추적 (Step2와 동일)
    const mathJaxLoaded = computed(() => {
      return !!(window.MathJax && window.MathJax.startup && window.MathJax.startup.document)
    })

    // LaTeX 수식을 MathJax로 렌더링하는 함수 (Step2와 동일)
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

      // math-latex 클래스가 있는 span 태그 처리
      result = result.replace(/<span class="math-latex"[^>]*data-latex="([^"]*)"[^>]*>([^<]*)<\/span>/g,
        '<span class="latex-code-inline" data-latex="$1">$2</span>')

      return result
    }

    // 해설 미리보기 렌더링 함수
    const renderExplanationPreview = async () => {
      if (!problemInfo.value.explanation) return

      try {
        const renderedContent = await renderLatexContent(problemInfo.value.explanation)
        return renderedContent
      } catch (error) {
        console.warn('해설 미리보기 렌더링 실패:', error)
        return styleLatexCode(problemInfo.value.explanation)
      }
    }

    // 안전한 에디터 초기화 핸들러 (Step2와 동일)
    const onEditorInit = async (...args) => {
      try {
        console.log('해설 TinyMCE 에디터 초기화 시작...')
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

        if (!editor) {
          console.error('에디터 인스턴스를 찾을 수 없습니다')
          return
        }

        console.log('✅ 해설 에디터 인스턴스 발견:', editor.id)

        // 이전 인스턴스가 있다면 정리
        if (editorInstance.value && editorInstance.value !== editor) {
          try {
            if (editorInstance.value.removed !== true && typeof editorInstance.value.remove === 'function') {
              editorInstance.value.remove()
            }
          } catch (error) {
            console.warn('이전 해설 에디터 인스턴스 정리 중 오류:', error)
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
        console.log('✅ 해설 에디터 상태:', state)

        // 에디터 준비 완료
        console.log('✅ 해설 에디터 초기화 완료')
      } catch (error) {
        console.error('해설 에디터 초기화 중 오류:', error)
      }
    }

    return {
      activeToolTab,
      mathSearch,
      currentMathLatex,
      editorInstance,
      mathTemplates,
      filteredMathTemplates,
      mathPreviewHtml,
      explanationPreviewHtml,
      mathJaxLoaded,
      problemInfo,
      showExplanationEditor,
      explanationEditorKey,
      isFormValid,
      majorChapters,
      middleChapters,
      minorChapters,
      topicChapters,
      chaptersLoading,
      chaptersError,
      tinymceApiKey,
      explanationEditorConfig,
      processedOptionsList,
      hasValidPassageImage,
      getAnswerPlaceholder,
      toggleExplanationEditor,
      updateExplanation,
      insertMath,
      onEditorInit,
      ensureMathJaxLoaded,
      renderLatexContent,
      renderExplanationPreview,
      loadChapters,
      loadMiddleChapters,
      loadMinorChapters,
      loadTopicChapters,
      styleLatexCode,
      formatOptionsWithLineBreaks
    }
  }
}
</script>

<style scoped>
.step3-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
}

/* 좌측 영역 - 미리보기 */
.left-section {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.preview-panel {
  flex: 1;
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

.preview-content {
  padding: 1rem;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
}

.preview-section h6 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

/* 실제 문제처럼 표시하는 스타일 */
.problem-display {
  background: white;
  border: none;
  border-radius: 0;
  padding: 2rem;
  box-shadow: none;
  font-family: 'Noto Sans KR', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  font-size: 1rem;
}

.passage-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ddd;
}

.passage-content {
  font-size: 1rem;
  line-height: 1.7;
  color: #333;
  background: transparent;
  padding: 0;
  border-radius: 0;
  border-left: none;
}

.problem-section {
  margin-bottom: 2rem;
}

.problem-content {
  font-size: 1rem;
  font-weight: normal;
  line-height: 1.6;
  color: #333;
  margin-bottom: 1.5rem;
}

.image-section {
  margin-bottom: 2rem;
  text-align: center;
}

.image-content {
  max-width: 100%;
  height: auto;
  border-radius: 0;
  box-shadow: none;
}

.problem-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.options-section {
  margin-top: 2rem;
}

.options-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
}

/* 객관식 보기 스타일 - 실제 문제처럼 */
.options-content .option-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}

.options-content .option-number {
  font-weight: bold;
  color: #333;
  font-size: 1rem;
  min-width: 2.5rem;
  text-align: left;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  line-height: 1.6;
}

.options-content .option-content {
  flex: 1;
  line-height: 1.6;
  color: #333;
  padding: 0;
  font-size: 1rem;
}

.preview-html {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #333;
}

/* 우측 영역 - 정보 입력 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.info-input-panel {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.form-content {
  padding: 1rem;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
}

.form-select,
.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus,
.form-control:focus {
  border-color: #007bff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-text {
  font-size: 0.75rem;
  color: #6c757d;
}

/* 해설 에디터 */
.explanation-editor {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
}

.editor-with-tools {
  gap: 1rem;
  height: 400px;
}

/* 에디터 패널 */
.editor-panel {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.editor-header {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
}

.editor-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.editor-content {
  height: calc(100% - 50px);
  padding: 0;
}

/* 우측 도구 패널 */
.right-tools-panel {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  display: flex;
  flex-direction: column;
}

.tool-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tool-tab {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tool-tab:hover {
  background: #e9ecef;
  color: #495057;
}

.tool-tab.active {
  background: white;
  color: #0d6efd;
  border-bottom-color: #0d6efd;
}

.tool-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.tool-section-title {
  margin: 0 0 1rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #495057;
}

.math-tools {
  margin-bottom: 1rem;
}

.math-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.math-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
  font-size: 0.7rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.math-btn:hover {
  background: #f8f9fa;
  border-color: #0d6efd;
  color: #0d6efd;
}

.preview-tools {
  height: 100%;
}

.preview-content {
  height: 100%;
  overflow-y: auto;
}

.explanation-preview-content {
  line-height: 1.6;
  font-size: 0.875rem;
}

.no-explanation {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

/* 수식 검색 결과 스타일링 */
.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
}

.search-result-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background-color: #f8f9fa;
}

.template-name {
  font-size: 0.75rem;
  color: #495057;
}

.template-preview {
  font-size: 0.7rem;
  color: #6c757d;
}

/* 수식 미리보기 */
.latex-preview {
  min-height: 60px;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #f8f9fa;
  font-size: 0.875rem;
  line-height: 1.4;
}

/* 도구 섹션 */
.tool-section {
  margin-bottom: 1.5rem;
}

.tool-section:last-child {
  margin-bottom: 0;
}

/* LaTeX 코드 스타일링 (Step2와 동일) */
.latex-code-display {
  display: block;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-family: 'Times New Roman', serif;
  color: #1e40af;
  text-align: center;
  font-size: 1.1em;
}

.latex-code-inline {
  display: inline;
  padding: 2px 4px;
  background: #f0f8ff;
  border: 1px solid #d0e7ff;
  border-radius: 3px;
  font-family: 'Times New Roman', serif;
  color: #1e40af;
  font-size: 0.9em;
  margin: 0 1px;
}

/* 해설 미리보기 스타일 */
.explanation-preview-content {
  line-height: 1.6;
  font-size: 0.875rem;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: #f8f9fa;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.math-tools-section h6 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.math-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.math-btn {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.math-btn:hover {
  background: #e9ecef;
}

/* 네비게이션 */
.navigation-panel {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.navigation-panel .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 유효성 검사 */
.validation-errors {
  margin-top: 1rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.alert h6 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.alert ul {
  margin: 0;
  padding-left: 1.25rem;
}

.alert li {
  margin-bottom: 0.25rem;
}

/* TinyMCE 스타일링 */
:deep(.tox-tinymce) {
  border: 1px solid #ced4da !important;
  border-radius: 4px !important;
}

/* 챕터 로딩 및 에러 상태 */
.d-flex {
  display: flex !important;
}

.align-items-center {
  align-items: center !important;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: text-bottom;
  border: 0.125em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.125em;
}

.me-2 {
  margin-right: 0.5rem !important;
}

.ms-2 {
  margin-left: 0.5rem !important;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.2rem;
}

.btn-outline-warning {
  color: #ffc107;
  border-color: #ffc107;
}

.btn-outline-warning:hover {
  color: #212529;
  background-color: #ffc107;
  border-color: #ffc107;
}

.bi {
  display: inline-block;
  font-family: bootstrap-icons !important;
  font-style: normal;
  font-weight: normal !important;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  vertical-align: text-bottom;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.bi-exclamation-triangle::before {
  content: "\F33A";
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* LaTeX 코드 스타일링 (MathJax가 로드되지 않은 경우) */
.latex-code-display {
  display: inline-block;
  font-family: 'Courier New', monospace;
  background: #f0f8ff;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid #d0e7ff;
  color: #1e40af;
  font-size: 0.9em;
  margin: 0 1px;
}

.latex-command {
  color: #dc2626;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .step3-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .preview-content,
  .form-content {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .step3-container {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .math-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .navigation-panel {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
