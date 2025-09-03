<template>
  <div class="step-content">
    <div class="save-layout">
      <!-- 저장 헤더 -->
      <div class="save-header">
        <h3 class="step-title">문제 저장 및 완료</h3>
        <p class="step-description">
          입력한 정보를 확인하고 문제를 저장하세요.
        </p>
      </div>

      <!-- 최종 확인 섹션 -->
      <div class="confirmation-sections">

        <!-- 문제 정보 요약 -->
        <div class="confirmation-section">
          <h5 class="section-title">
            <i class="bi bi-info-circle me-2"></i>문제 정보 요약
          </h5>
          <div class="info-summary">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="info-item">
                  <label class="info-label">문제 유형</label>
                  <div class="info-value">{{ getItemTypeLabel(itemInfo.problemType) || '미선택' }}</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-item">
                  <label class="info-label">난이도</label>
                  <div class="info-value">{{ getDifficultyLabel(itemInfo.difficulty) }}</div>
                </div>
              </div>

              <div class="col-12">
                <div class="info-item">
                  <label class="info-label">선택된 단원</label>
                  <div class="info-value">{{ getChapterPath() }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
         <!-- 문제 미리보기 -->
      <div class="problem-preview-section">
        <h5 class="section-title">
          <i class="bi bi-eye me-2"></i>문제 미리보기
        </h5>
        <div class="problem-preview-content">
          <!-- 실제 문제처럼 표시 -->
          <div class="problem-display">
            <!-- 이미지 영역 -->
            <div v-if="safeCaptureFullImg" class="image-section d-flex justify-content-center">
              <div class="image-content">
                <img :src="safeCaptureFullImg" alt="문제 이미지" class="problem-image" />
                <div class="text-xs text-secondary">[문제 원본 이미지]</div>
              </div>

            </div>
            <!-- 지문 영역 -->
            <div v-if="editedTexts.question" class="passage-section">
              <div class="passage-content" v-html="editedTexts.question"></div>
            </div>

            <!-- 문제 영역 -->
            <div v-if="editedTexts.problem" class="problem-section">
              <div class="problem-content" v-html="editedTexts.problem"></div>
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


      <!-- 정답 및 해설 정보 -->
      <div class="answer-explanation-section">
        <h5 class="section-title">
          <i class="bi bi-lightbulb me-2"></i>정답 및 해설
        </h5>
        <div class="answer-explanation-content">
          <div class="row g-3">
            <div class="col-md-6">
              <div class="info-item">
                <label class="info-label">정답</label>
                <div class="info-value">{{ itemInfo.answer || '미입력' }}</div>
              </div>
            </div>
            <div class="col-12">
              <div class="info-item">
                <label class="info-label">해설</label>
                <div class="info-value">
                  <div v-if="itemInfo.explanation && itemInfo.explanation.trim()"
                       class="explanation-content tex2jax_process"
                       v-html="explanationPreviewHtml || itemInfo.explanation"></div>
                  <div v-else class="text-muted">해설이 입력되지 않았습니다.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
<!-- 선택된 영역 요약 -->
<div class="confirmation-section">
          <h5 class="section-title">
            <i class="bi bi-check-circle me-2"></i>선택된 영역 요약
          </h5>
          <div class="area-summary">
            <div class="row g-3">
              <div
                v-for="areaType in availableAreaTypes"
                :key="areaType"
                class="col-md-6"
              >
                <div class="area-summary-item" :class="{ required: isRequired(areaType) }">
                  <div class="area-header">
                    <i :class="getAreaIcon(areaType)" class="me-2"></i>
                    <span class="area-name">{{ getAreaTypeLabel(areaType) }}</span>
                    <span v-if="isRequired(areaType)" class="badge bg-danger ms-2">필수</span>
                    <span v-else class="badge bg-secondary ms-2">선택</span>
                  </div>
                  <div class="area-status">
                    <span v-if="selectedAreas[areaType]" class="status-success">
                      <i class="bi bi-check-circle-fill me-2"></i>선택 완료
                    </span>
                    <span v-else class="status-missing">
                      <i class="bi bi-x-circle me-2"></i>미선택
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 편집된 텍스트 요약 -->
        <div class="confirmation-section">
          <h5 class="section-title">
            <i class="bi bi-file-text me-2"></i>편집된 텍스트 요약
          </h5>
          <div class="text-summary">
            <div
              v-for="areaType in availableAreaTypes"
              :key="areaType"
              class="text-summary-item"
            >
              <div class="text-header">
                <i :class="getAreaIcon(areaType)" class="me-2"></i>
                <span class="text-name">{{ getAreaTypeLabel(areaType) }}</span>
                <span class="text-length">{{ editedTexts[areaType]?.length || 0 }}자</span>
              </div>
              <div class="text-preview">
                <div v-if="editedTexts[areaType]" class="text-content">
                  {{ getTextPreview(editedTexts[areaType]) }}
                </div>
                <div v-else class="no-text">
                  <i class="bi bi-exclamation-circle text-muted"></i>
                  <span class="text-muted">편집된 텍스트가 없습니다.</span>
                </div>
              </div>
            </div>
          </div>
        </div>




      <!-- 유효성 검사 결과 -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div class="alert alert-danger">
          <h6 class="alert-heading">
            <i class="bi bi-exclamation-triangle me-2"></i>저장 불가
          </h6>
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>

      <!-- 저장 진행 상태 -->
      <div v-if="isSaving" class="saving-status">
        <div class="alert alert-info">
          <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-3" role="status">
              <span class="visually-hidden">저장 중...</span>
            </div>
            <div>
              <h6 class="alert-heading mb-1">문제 저장 중...</h6>
              <p class="mb-0">잠시만 기다려주세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { renderMathJax, waitForMathJax } from '@/utils/mathjax'

export default {
  name: 'Step4ItemSave',
  props: {
    selectedAreas: {
      type: Object,
      required: true
    },
    editedTexts: {
      type: Object,
      required: true
    },
    itemInfo: {
      type: Object,
      required: true
    },
    majorChapters: {
      type: Array,
      default: () => []
    },
    middleChapters: {
      type: Array,
      default: () => []
    },
    minorChapters: {
      type: Array,
      default: () => []
    },
    topicChapters: {
      type: Array,
      default: () => []
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
    'save-complete'
  ],
  setup(props, { emit }) {
    const isSaving = ref(false)

    // captureFullImg를 안전하게 접근하기 위한 computed
    const safeCaptureFullImg = computed(() => {
      return props.captureFullImg || ''
    })

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

    // 보기 텍스트를 항목별로 분리하는 함수
    const splitOptions = (optionsText) => {
      if (!optionsText) return []

      try {
        console.log('splitOptions 입력:', optionsText)

        // 옵션을 수동으로 분리하는 방법
        const options = []

        // 여러 패턴 시도 (국어 문제의 줄바꿈 고려)
        const patterns = [
          // (1) 형태 - 괄호 안 숫자
          /\((\d+)\)\s*([\s\S]*?)(?=\(\d+\)|$)/g,
          // 1. 형태 - 한 줄에 여러 개 (우선 처리)
          /(\d+)\.\s*([\s\S]*?)(?=\d+\.|$)/g,
          // 1) 형태 - 한 줄에 여러 개 (우선 처리)
          /(\d+)\)\s*([\s\S]*?)(?=\d+\)|$)/g,
          // 1. 형태 - 점이 있는 숫자 (줄바꿈 고려)
          /(\d+)\.\s*([\s\S]*?)(?=\n\s*\d+\.|$)/g,
          // 1) 형태 - 괄호 밖 숫자 (줄바꿈 고려)
          /(\d+)\)\s*([\s\S]*?)(?=\n\s*\d+\)|$)/g,
          // HTML p 태그 형태
          /<p>\s*(\d+)\.\s*([\s\S]*?)<\/p>/g
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

    // 처리된 보기 목록 (Step3와 동일한 로직)
    const processedOptionsList = computed(() => {
      const options = splitOptions(props.editedTexts.options)

      // 각 옵션에 줄바꿈 처리 적용
      const processedOptions = options.map(option => {
        // 줄바꿈을 <br> 태그로 변환
        const withLineBreaks = option.replace(/\n/g, '<br>')

        // MathJax가 로드되어 있으면 raw LaTeX 반환, 아니면 스타일링된 LaTeX 반환
        if (window.MathJax && window.MathJax.startup) {
          return withLineBreaks // raw LaTeX for MathJax processing
        } else {
          return styleLatexCode(withLineBreaks)
        }
      })

      return processedOptions
    })

    // 사용 가능한 영역 타입들
    const availableAreaTypes = computed(() => {
      return Object.keys(props.selectedAreas).filter(
        areaType => props.selectedAreas[areaType]
      )
    })

    // 유효성 검사 오류
    const validationErrors = ref([])

    // 저장 가능 여부
    const canSave = computed(() => {
      return validationErrors.value.length === 0
    })

    // 영역 타입별 아이콘
    const getAreaIcon = (areaType) => {
      const icons = {
        question: 'bi bi-file-text',
        problem: 'bi bi-question-circle',
        image: 'bi bi-image',
        options: 'bi bi-list-check'
      }
      return icons[areaType] || 'bi bi-file-text'
    }

    // 영역 타입별 라벨
    const getAreaTypeLabel = (areaType) => {
      const labels = {
        problem: '문제',
        passage: '지문',
        options: '보기'
      }
      return labels[areaType] || areaType
    }

    // 필수 영역 여부
    const isRequired = (areaType) => {
      return areaType === 'problem'
    }

    // 문제 유형 라벨
    const getItemTypeLabel = (type) => {
      const labels = {
        fiveChoice: '5지 선택',
        shortAnswerOrdered: '단답 유순형',
        shortAnswerUnOrdered: '단답 무순형',
        freeChoice: '자유 선지형'
      }
      return labels[type] || ''
    }

    // 난이도 라벨
    const getDifficultyLabel = (difficulty) => {
      const labels = {
        easy: '하',
        medium: '중',
        hard: '상'
      }
      return labels[difficulty] || ''
    }

    // 단원 경로 문자열 생성
    const getChapterPath = () => {
      console.log('🔍 [Step4ItemSave] getChapterPath 호출됨')
      console.log('🔍 [Step4ItemSave] itemInfo:', props.itemInfo)
      console.log('🔍 [Step4ItemSave] majorChapters:', props.majorChapters)
      console.log('🔍 [Step4ItemSave] middleChapters:', props.middleChapters)
      console.log('🔍 [Step4ItemSave] minorChapters:', props.minorChapters)
      console.log('🔍 [Step4ItemSave] topicChapters:', props.topicChapters)

      // Step3InfoInput에서 전달받은 단원 정보로 경로 생성
      if (props.itemInfo?.majorChapter || props.itemInfo?.middleChapter || props.itemInfo?.minorChapter || props.itemInfo?.topicChapter) {
        let path = ''

        // 대단원
        if (props.itemInfo.majorChapter) {
          const majorChapter = props.majorChapters.find(ch => ch.id === props.itemInfo.majorChapter)
          console.log('🔍 [Step4ItemSave] 대단원 검색:', {
            searchId: props.itemInfo.majorChapter,
            foundChapter: majorChapter,
            allMajorChapters: props.majorChapters
          })
          path += `대단원 ${majorChapter?.name || props.itemInfo.majorChapter}`
        }

        // 중단원
        if (props.itemInfo.middleChapter) {
          const middleChapter = props.middleChapters.find(ch => ch.id === props.itemInfo.middleChapter)
          console.log('🔍 [Step4ItemSave] 중단원 검색:', {
            searchId: props.itemInfo.middleChapter,
            foundChapter: middleChapter,
            allMiddleChapters: props.middleChapters
          })
          path += ` > 중단원 ${middleChapter?.name || props.itemInfo.middleChapter}`
        }

        // 소단원
        if (props.itemInfo.minorChapter) {
          const minorChapter = props.minorChapters.find(ch => ch.id === props.itemInfo.minorChapter)
          console.log('🔍 [Step4ItemSave] 소단원 검색:', {
            searchId: props.itemInfo.minorChapter,
            foundChapter: minorChapter,
            allMinorChapters: props.minorChapters
          })
          path += ` > 소단원 ${minorChapter?.name || props.itemInfo.minorChapter}`
        }

        // 토픽
        if (props.itemInfo.topicChapter) {
          const topicChapter = props.topicChapters.find(ch => ch.id === props.itemInfo.topicChapter)
          console.log('🔍 [Step4ItemSave] 토픽 검색:', {
            searchId: props.itemInfo.topicChapter,
            foundChapter: topicChapter,
            allTopicChapters: props.topicChapters
          })
          path += ` > 토픽 ${topicChapter?.name || props.itemInfo.topicChapter}`
        }

        console.log('🔍 [Step4ItemSave] 최종 경로:', path)
        return path
      }

      // 단원 정보가 없는 경우
      console.log('🔍 [Step4ItemSave] 단원 정보 없음')
      return '단원 정보 없음'
    }

    // 텍스트 미리보기 생성
    const getTextPreview = (text) => {
      if (!text) return ''
      return text.length > 100 ? text.substring(0, 100) + '...' : text
    }

    // 유효성 검사 실행
    const validateForm = () => {
      const errors = []

      // 필수 영역 검사
      if (!props.selectedAreas.problem) {
        errors.push('문제 영역을 선택해야 합니다.')
      }
      if (!props.selectedAreas.options) {
        errors.push('보기 영역을 선택해야 합니다.')
      }

      // 필수 문제 정보 검사 (Step3 구조에 맞춤)
      if (!props.itemInfo.problemType) {
        errors.push('문제 유형을 선택해야 합니다.')
      }
      if (!props.itemInfo.difficulty) {
        errors.push('난이도를 선택해야 합니다.')
      }
      if (!props.itemInfo.answer || props.itemInfo.answer.trim() === '') {
        errors.push('정답을 입력해야 합니다.')
      }

      // 편집된 텍스트 검사
      if (!props.editedTexts.problem || props.editedTexts.problem.trim() === '') {
        errors.push('문제 텍스트를 편집해야 합니다.')
      }
      if (!props.editedTexts.options || props.editedTexts.options.trim() === '') {
        errors.push('보기 텍스트를 편집해야 합니다.')
      }

      validationErrors.value = errors
    }

    // 문제 저장
    const saveItem = async () => {
      if (!canSave.value) return

      try {
        isSaving.value = true

        // 백엔드 ProcessedItem 구조에 맞춘 데이터 준비
        const processedItemData = {
          // 백엔드 enum에 맞춘 문항 정보 (Step3 problemType 사용)
          type: props.itemInfo.problemType === 'fiveChoice' ? 'FIVE_CHOICE' :
                props.itemInfo.problemType === 'shortAnswerOrdered' ? 'SHORT_ANSWER_ORDERED' :
                props.itemInfo.problemType === 'shortAnswerUnOrdered' ? 'SHORT_ANSWER_UNORDERED' :
                props.itemInfo.problemType === 'freeChoice' ? 'FREE_CHOICE' : 'FIVE_CHOICE',

          difficulty: props.itemInfo.difficulty === 'easy' ? 'easy' :
                     props.itemInfo.difficulty === 'medium' ? 'medium' :
                     props.itemInfo.difficulty === 'hard' ? 'hard' : 'medium',

          // 백엔드 필드명에 맞춤
          answer: props.editedTexts.problem || '',
          solution: props.editedTexts.options || '',
          explanation: props.editedTexts.explanation || '',

          // 단원 정보 (Step3에서 설정된 값 사용)
          majorChapterId: props.itemInfo.majorChapter || null,
          middleChapterId: props.itemInfo.middleChapter || null,
          minorChapterId: props.itemInfo.minorChapter || null,

          // 지문 그룹 정보
          passageId: props.itemInfo.passageId || null,

          // OCR 히스토리는 이미 저장된 상태이므로 빈 배열
          ocrHistories: []
        }

        console.log('문제 저장 시작:', processedItemData)

        // OCR API를 통해 문제 저장
        const { ocrApi } = await import('@/services/ocrApi')
        const result = await ocrApi.saveProcessedItem(processedItemData)

        console.log('문제 저장 완료:', result)

        // 저장 완료 이벤트 발생
        emit('save-complete')

      } catch (error) {
        console.error('문제 저장 실패:', error)
        validationErrors.value.push('문제 저장 중 오류가 발생했습니다: ' + error.message)
      } finally {
        isSaving.value = false
      }
    }



    // MathJax 로드 확인 및 로드 함수 (Step3와 동일)
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

        console.log('Step4 MathJax LaTeX 설정 강제 적용 및 문서 재설정 완료')
      }
    }

    // MathJax 로드 상태 추적 (Step3와 동일)
    const mathJaxLoaded = computed(() => {
      return !!(window.MathJax && window.MathJax.startup && window.MathJax.startup.document)
    })

    // 해설 미리보기 (MathJax 렌더링 적용)
    const explanationPreviewHtml = ref('')

    // 해설 내용이 변경될 때마다 미리보기 업데이트
    watch(() => props.itemInfo.explanation, async (newExplanation) => {
      if (newExplanation && newExplanation.trim()) {
        try {
          const rendered = await renderLatexContent(newExplanation)
          explanationPreviewHtml.value = rendered
        } catch (error) {
          console.warn('Step4 해설 미리보기 렌더링 실패:', error)
          explanationPreviewHtml.value = styleLatexCode(newExplanation)
        }
      } else {
        explanationPreviewHtml.value = ''
      }
    }, { immediate: true })

    // LaTeX 수식을 MathJax로 렌더링하는 함수 (Step3와 동일)
    const renderLatexContent = async (content) => {
      console.log('Step4 renderLatexContent 호출됨:', {
        content,
        type: typeof content,
        length: content ? content.length : 0,
        hasLatex: content ? (content.includes('$') || content.includes('\\')) : false
      })

      if (!content || typeof content !== 'string') {
        console.log('Step4 content가 유효하지 않음:', content)
        return ''
      }

      try {
        // MathJax가 로드되었는지 확인
        console.log('Step4 MathJax 상태 확인:', {
          mathJaxExists: !!window.MathJax,
          startupExists: !!(window.MathJax && window.MathJax.startup)
        })

        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
          console.log('Step4 MathJax 사용하여 렌더링 시작')

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
            console.log('Step4 MathJax 렌더링 성공')

            // 렌더링된 HTML 가져오기
            const result = tempDiv.innerHTML

            // 임시 div 제거
            document.body.removeChild(tempDiv)

            console.log('Step4 최종 렌더링 결과:', result)
            return result

          } catch (renderError) {
            console.warn('Step4 MathJax 렌더링 실패:', renderError)
            document.body.removeChild(tempDiv)

            // 렌더링 실패 시 LaTeX 코드를 스타일링하여 표시
            return styleLatexCode(content)
          }
        } else {
          console.log('Step4 MathJax가 로드되지 않음, LaTeX 코드 스타일링 적용')
          return styleLatexCode(content)
        }
      } catch (error) {
        console.warn('Step4 LaTeX 렌더링 함수 오류:', error)
        return styleLatexCode(content)
      }
    }

    // MathJax 렌더링 함수 (Step3와 동일한 로직)
    const renderMathJaxInPreview = async () => {
      try {
        // MathJax 로드 대기
        await waitForMathJax()

        console.log('Step4 미리보기 MathJax 렌더링 시작')

        // DOM이 완전히 업데이트될 때까지 대기
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))

        // 미리보기 영역 요소들 찾기
        const previewElements = document.querySelectorAll('.passage-content, .problem-content, .option-content, .explanation-content')
        console.log(`Step4 미리보기 영역 ${previewElements.length}개 발견:`, Array.from(previewElements).map(el => el.className))

        for (const element of previewElements) {
          console.log('Step4 미리보기 영역 요소 검사:', element.className, element.innerHTML.substring(0, 100))

          if (element.innerHTML && (element.innerHTML.includes('$') || element.innerHTML.includes('\\'))) {
            console.log('Step4 미리보기 영역 렌더링 시작:', element.className)

            // MathJax 설정 재확인
            if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
              // MathJax 문서 업데이트
              window.MathJax.startup.document.updateDocument()

              // 강제 렌더링 시도
              try {
                await window.MathJax.typesetPromise([element])
                console.log('Step4 미리보기 영역 MathJax 강제 렌더링 성공:', element.className)
              } catch (error) {
                console.warn('Step4 미리보기 영역 MathJax 강제 렌더링 실패, 기본 렌더링 시도:', error)
                await renderMathJax(element, { clearFirst: false })
              }
            } else {
              await renderMathJax(element, { clearFirst: false })
            }
          } else {
            console.log('Step4 미리보기 영역 요소에 LaTeX 없음:', element.className)
          }
        }

        // 전체 미리보기 컨테이너도 렌더링
        const previewContainer = document.querySelector('.problem-display')
        if (previewContainer) {
          console.log('Step4 미리보기 컨테이너 렌더링 시도')
          try {
            await renderMathJax(previewContainer, { clearFirst: false })
            console.log('Step4 미리보기 컨테이너 렌더링 성공')
          } catch (error) {
            console.warn('Step4 미리보기 컨테이너 렌더링 실패:', error)
          }
        }

        console.log('Step4 미리보기 MathJax 렌더링 완료')
      } catch (error) {
        console.error('Step4 미리보기 MathJax 렌더링 중 오류:', error)
      }
    }

    // props 변경 시 유효성 검사 실행
    watch([() => props.selectedAreas, () => props.editedTexts, () => props.itemInfo],
      validateForm,
      { deep: true, immediate: true }
    )

    // editedTexts 변경 시 MathJax 렌더링
    watch(() => props.editedTexts, async (newTexts) => {
      // LaTeX 패턴이 포함된 텍스트가 있는지 확인
      const hasLatex = Object.values(newTexts).some(text =>
        text && (text.includes('$') || text.includes('\\'))
      )

      if (hasLatex) {
        await nextTick()
        await renderMathJaxInPreview()
      }
    }, { deep: true })

    // processedOptionsList 변경 시 MathJax 렌더링
    watch(processedOptionsList, async (newOptions) => {
      if (newOptions.length > 0) {
        await nextTick()
        await renderMathJaxInPreview()
      }
    })

    // 컴포넌트 마운트 시 MathJax 초기화 및 렌더링
    onMounted(async () => {
      try {
        await ensureMathJaxLoaded()
        console.log('Step4 MathJax 초기화 완료')
      } catch (error) {
        console.warn('Step4 MathJax 초기화 실패:', error)
      }

      await nextTick()
      await renderMathJaxInPreview()
    })

    return {
      isSaving,
      availableAreaTypes,
      validationErrors,
      canSave,
      getAreaIcon,
      getAreaTypeLabel,
      isRequired,
      getItemTypeLabel,
      getDifficultyLabel,
      getChapterPath,
      getTextPreview,
      saveItem,
      processedOptionsList,
      renderMathJaxInPreview,
      styleLatexCode,
      safeCaptureFullImg,
      formatOptionsWithLineBreaks,
      mathJaxLoaded,
      explanationPreviewHtml,
      renderLatexContent,
      ensureMathJaxLoaded
    }
  }
}
</script>

<style scoped>
.step-content {
  padding: 1rem;
}

.save-layout {
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  overflow: hidden;
}

.save-header {
  background: #f8f9fa;
  padding: 2rem;
  border-bottom: 1px solid #dee2e6;
  text-align: center;
}

.step-title {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #495057;
}

.step-description {
  margin: 0;
  color: #6c757d;
  font-size: 1.1rem;
}

.confirmation-sections {
  padding: 2rem;
}

.confirmation-section {
  margin-bottom: 2.5rem;
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.area-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.area-summary-item {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.area-summary-item.required {
  border-left: 4px solid #dc3545;
}

.area-summary-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.area-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.area-name {
  font-weight: 600;
  color: #495057;
}

.area-status {
  font-size: 0.9rem;
}

.status-success {
  color: #198754;
  font-weight: 500;
}

.status-missing {
  color: #dc3545;
  font-weight: 500;
}

.text-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.text-summary-item {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
}

.text-summary-item:last-child {
  margin-bottom: 0;
}

.text-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.text-name {
  font-weight: 600;
  color: #495057;
  flex: 1;
}

.text-length {
  font-size: 0.85rem;
  color: #6c757d;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.text-preview {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 0.75rem;
  min-height: 60px;
}

.text-content {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 60px;
  color: #6c757d;
}

.info-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.info-item {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #dee2e6;
}

.info-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
  display: block;
}

.info-value {
  font-size: 1rem;
  color: #495057;
  font-weight: 500;
}

.answer-explanation-section {
  padding: 0 2rem 2rem 2rem;
}

.answer-explanation-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.explanation-content {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #dee2e6;
  max-height: 200px;
  overflow-y: auto;
}

.text-muted {
  color: #6c757d;
  font-style: italic;
}

/* 문제 미리보기 스타일 */
.problem-preview-section {
  margin: 0 2rem 2rem 2rem;
}

.problem-preview-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

/* 실제 문제처럼 표시하는 스타일 (3단계와 동일) */
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
  max-width: 30%;
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

/* 객관식 보기 스타일 - 실제 문제처럼 (3단계와 동일) */
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

/* MathJax 렌더링 스타일링 */
.passage-content mjx-container,
.problem-content mjx-container,
.option-content mjx-container,
.explanation-content mjx-container {
  font-size: 1em;
  line-height: 1.2;
}

.passage-content mjx-container[display="true"],
.problem-content mjx-container[display="true"],
.option-content mjx-container[display="true"],
.explanation-content mjx-container[display="true"] {
  margin: 0.5em 0;
  text-align: center;
}

.passage-content .mathjax-error,
.problem-content .mathjax-error,
.option-content .mathjax-error,
.explanation-content .mathjax-error {
  color: #dc3545;
  background: #f8d7da;
  padding: 0.25em 0.5em;
  border-radius: 0.25em;
  font-family: monospace;
}

/* LaTeX 코드 스타일링 (MathJax가 로드되지 않은 경우) */
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

.latex-command {
  color: #dc2626;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}



.validation-errors {
  margin: 0 2rem 2rem 2rem;
}

.alert {
  border-radius: 8px;
  border: none;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.alert-heading {
  color: #721c24;
  font-weight: 600;
}

.saving-status {
  margin: 0 2rem 2rem 2rem;
}

.alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border-left: 4px solid #17a2b8;
}

.alert-heading {
  color: #0c5460;
  font-weight: 600;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding: 1rem 0;
}

.navigation-buttons .btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .save-header {
    padding: 1.5rem 1rem;
  }

  .confirmation-sections {
    padding: 1.5rem 1rem;
  }

  .save-options {
    padding: 0 1rem 1.5rem 1rem;
  }

  .options-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .navigation-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .navigation-buttons .btn {
    width: 100%;
  }

  .validation-errors,
  .saving-status {
    margin: 0 1rem 1.5rem 1rem;
  }
}
</style>
