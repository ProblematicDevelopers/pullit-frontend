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
          <!-- 문제 영역 -->
          <div v-if="editedTexts.problem" class="preview-item">
            <h6>문제</h6>
            <div class="preview-text" v-html="editedTexts.problem"></div>
          </div>

          <!-- 이미지 영역 -->
          <div v-if="passage" class="preview-item">
            <h6>이미지</h6>
            <div class="preview-image">
              <img :src="passage" alt="문제 이미지" class="problem-image" />
            </div>
          </div>

          <!-- 보기 영역 -->
          <div v-if="editedTexts.options" class="preview-item">
            <h6>보기</h6>
            <div class="preview-options">
              <div v-for="(option, index) in processedOptionsList" :key="index" class="option-item">
                <span class="option-number">({{ index + 1 }})</span>
                <span class="option-content" v-html="option"></span>
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
                       class="explanation-content"
                       v-html="itemInfo.explanation"></div>
                  <div v-else class="text-muted">해설이 입력되지 않았습니다.</div>
                </div>
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
import { ref, computed, watch } from 'vue'

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
    }
  },
  emits: [
    'save-complete'
  ],
  setup(props, { emit }) {
    const isSaving = ref(false)

    // 보기 텍스트를 항목별로 분리하는 함수
    const splitOptions = (optionsText) => {
      if (!optionsText) return []
      const parts = optionsText.split(/\(\d+\)/)
      return parts.filter(part => part.trim()).map(part => part.trim())
    }

    // 처리된 보기 목록
    const processedOptionsList = computed(() => {
      return splitOptions(props.editedTexts.options)
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
        multiple_choice: '객관식 (5지 선택)',
        subjective: '주관식',
        short_answer: '단답형',
        essay: '서술형'
      }
      return labels[type] || ''
    }

    // 난이도 라벨
    const getDifficultyLabel = (difficulty) => {
      const labels = {
        easy: '쉬움',
        medium: '보통',
        hard: '어려움'
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
          type: props.itemInfo.problemType === 'multiple_choice' ? 'multiple' :
                props.itemInfo.problemType === 'subjective' ? 'subjective' :
                props.itemInfo.problemType === 'short_answer' ? 'shortAnswer' :
                props.itemInfo.problemType === 'essay' ? 'essay' : 'multiple',

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



    // props 변경 시 유효성 검사 실행
    watch([() => props.selectedAreas, () => props.editedTexts, () => props.itemInfo],
      validateForm,
      { deep: true, immediate: true }
    )

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
      processedOptionsList
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

.preview-item {
  margin-bottom: 1.5rem;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item h6 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.preview-text {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #dee2e6;
  line-height: 1.6;
  color: #333;
}

.preview-image {
  text-align: center;
}

.problem-image {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-options {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #dee2e6;
}

.preview-options .option-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.preview-options .option-item:last-child {
  margin-bottom: 0;
}

.preview-options .option-number {
  font-weight: bold;
  color: #007bff;
  font-size: 0.9em;
  min-width: 2rem;
}

.preview-options .option-content {
  flex: 1;
  line-height: 1.5;
  color: #333;
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
