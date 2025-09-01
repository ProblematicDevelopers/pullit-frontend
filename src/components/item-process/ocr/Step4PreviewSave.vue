<template>
  <div class="step4-container">
    <!-- 좌측: 문제/해설 미리보기 -->
    <div class="left-section">
      <div class="preview-panels">
        <!-- 문제 미리보기 -->
        <div class="preview-panel">
          <h5 class="panel-title">문제</h5>
          <div class="preview-content problem-preview">
            <!-- 문제 영역 -->
            <div v-if="editedTexts.problem" class="preview-section">
              <div class="preview-html" v-html="editedTexts.problem"></div>
            </div>

            <!-- 지문 영역 -->
            <div v-if="editedTexts.question" class="preview-section">
              <h6>지문</h6>
              <div class="preview-html" v-html="editedTexts.question"></div>
            </div>

            <!-- 이미지 영역 -->
            <div v-if="editedTexts.image" class="preview-section">
              <h6>이미지</h6>
              <div class="preview-html" v-html="editedTexts.image"></div>
            </div>

            <!-- 보기 영역 -->
            <div v-if="editedTexts.options" class="preview-section">
              <h6>보기</h6>
              <div class="preview-html" v-html="editedTexts.options"></div>
            </div>

            <!-- 빈 내용 표시 -->
            <div v-if="!hasAnyContent" class="no-content">
              작성된 문제 내용이 없습니다.
            </div>
          </div>
        </div>

        <!-- 해설 미리보기 -->
        <div class="preview-panel">
          <h5 class="panel-title">해설</h5>
          <div class="preview-content explanation-preview">
            <div v-if="problemInfo.explanation" class="preview-section">
              <div class="preview-html" v-html="problemInfo.explanation"></div>
            </div>
            <div v-else class="no-content">
              작성된 해설이 없습니다.
            </div>
          </div>
        </div>
      </div>

      <!-- 네비게이션 -->
      <div class="navigation-panel">
        <button @click="prevStep" class="btn btn-secondary">이전</button>
        <button @click="completeProblem" class="btn btn-primary btn-lg" :disabled="saving">
          {{ saving ? '저장 중...' : '완료' }}
        </button>
      </div>
    </div>

    <!-- 우측: 정보 출력 -->
    <div class="right-section">
      <div class="info-summary-panel">
        <h5 class="panel-title">추가 정보</h5>

        <div class="info-content">
          <!-- 단원 정보 -->
          <div class="info-section">
            <h6 class="info-section-title">단원 정보</h6>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">대단원 챕터</span>
                <span class="info-value">{{ getChapterName('major', problemInfo.majorChapter) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">중단원 챕터</span>
                <span class="info-value">{{ getChapterName('middle', problemInfo.middleChapter) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">소단원 챕터</span>
                <span class="info-value">{{ getChapterName('minor', problemInfo.minorChapter) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">토픽 챕터</span>
                <span class="info-value">{{ getChapterName('topic', problemInfo.topicChapter) }}</span>
              </div>
            </div>
          </div>

          <!-- 문제 정보 -->
          <div class="info-section">
            <h6 class="info-section-title">문제 정보</h6>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">문제 형태</span>
                <span class="info-value">{{ getProblemTypeLabel(problemInfo.problemType) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">난이도</span>
                <span class="info-value">{{ getDifficultyLabel(problemInfo.difficulty) }}</span>
              </div>
            </div>
          </div>

          <!-- 지문 여부 -->
          <div class="info-section">
            <h6 class="info-section-title">지문 여부</h6>
            <div class="passage-status">
              <span class="status-badge" :class="problemInfo.hasPassage ? 'has-passage' : 'no-passage'">
                {{ problemInfo.hasPassage ? '지문 있음' : '지문 없음' }}
              </span>
              <span class="status-note">자동 입력 / 비활성화</span>
            </div>
          </div>

          <!-- 정답 -->
          <div class="answer-section">
            <h6 class="info-section-title">정답</h6>
            <div class="answer-display">
              <span class="answer-value">{{ problemInfo.answer || '입력되지 않음' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 저장 상태 표시 -->
      <div v-if="saveStatus" class="save-status-panel">
        <div class="alert" :class="saveStatus.type">
          <strong>{{ saveStatus.title }}</strong>
          <p>{{ saveStatus.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'Step4PreviewSave',
  props: {
    editedTexts: {
      type: Object,
      required: true
    },
    problemInfo: {
      type: Object,
      required: true
    },
    selectedAreas: {
      type: Object,
      required: true
    }
  },
  emits: [
    'prev-step',
    'complete-problem'
  ],
  setup(props, { emit }) {
    const saving = ref(false)
    const saveStatus = ref(null)

    // 챕터 데이터 (실제로는 Step3에서 전달받아야 함)
    const chapterData = {
      major: [
        { id: 1, name: '수와 연산' },
        { id: 2, name: '문자와 식' },
        { id: 3, name: '함수' },
        { id: 4, name: '기하' },
        { id: 5, name: '확률과 통계' }
      ],
      middle: [
        { id: 1, name: '자연수의 성질' },
        { id: 2, name: '정수와 유리수' },
        { id: 3, name: '실수' }
      ],
      minor: [
        { id: 1, name: '소인수분해' },
        { id: 2, name: '최대공약수와 최소공배수' }
      ],
      topic: [
        { id: 1, name: '범위내에서 유한소수가 되게 하는 값 찾기' },
        { id: 2, name: '분수의 덧셈과 뺄셈' }
      ]
    }

    // 문제 내용이 있는지 확인
    const hasAnyContent = computed(() => {
      return !!(props.editedTexts.problem ||
                props.editedTexts.question ||
                props.editedTexts.image ||
                props.editedTexts.options)
    })

    // 챕터 이름 가져오기
    const getChapterName = (type, id) => {
      if (!id) return '선택 값'
      const chapter = chapterData[type]?.find(item => item.id === id)
      return chapter ? chapter.name : '선택 값'
    }

    // 문제 형태 라벨
    const getProblemTypeLabel = (type) => {
      const labels = {
        'fiveChoice': '5지 선택',
        'shortAnswerOrdered': '단답 유순형',
        'shortAnswerUnOrdered': '단답 무순형',
        'freeChoice': '자유 선지형'
      }
      return labels[type] || '선택 값'
    }

    // 난이도 라벨
    const getDifficultyLabel = (difficulty) => {
      const labels = {
        'easy': '하',
        'medium': '중',
        'hard': '상'
      }
      return labels[difficulty] || '선택 값'
    }

    // 이전 단계로
    const prevStep = () => {
      emit('prev-step')
    }

    // 문제 완료 처리
    const completeProblem = async () => {
      saving.value = true
      saveStatus.value = null

      try {
        // 필수 정보 검증
        const validationResult = validateProblemData()
        if (!validationResult.isValid) {
          saveStatus.value = {
            type: 'alert-warning',
            title: '입력 정보 확인 필요',
            message: validationResult.message
          }
          saving.value = false
          return
        }

        // 저장 데이터 준비
        const saveData = prepareSaveData()

        // 부모 컴포넌트에 완료 이벤트 전달
        emit('complete-problem', saveData)

        // 성공 상태 표시
        saveStatus.value = {
          type: 'alert-success',
          title: '저장 완료',
          message: '문제가 성공적으로 저장되었습니다.'
        }

        // 2초 후 상태 메시지 제거
        setTimeout(() => {
          saveStatus.value = null
        }, 2000)

      } catch (error) {
        console.error('문제 저장 중 오류:', error)
        saveStatus.value = {
          type: 'alert-danger',
          title: '저장 실패',
          message: '문제 저장 중 오류가 발생했습니다. 다시 시도해 주세요.'
        }
      } finally {
        saving.value = false
      }
    }

    // 문제 데이터 검증
    const validateProblemData = () => {
      // 문제 내용 확인
      if (!hasAnyContent.value) {
        return {
          isValid: false,
          message: '문제 내용이 입력되지 않았습니다. 2단계에서 내용을 입력해 주세요.'
        }
      }

      // 필수 정보 확인
      if (!props.problemInfo.problemType) {
        return {
          isValid: false,
          message: '문제 형태를 선택해 주세요.'
        }
      }

      if (!props.problemInfo.difficulty) {
        return {
          isValid: false,
          message: '난이도를 선택해 주세요.'
        }
      }

      if (!props.problemInfo.answer) {
        return {
          isValid: false,
          message: '정답을 입력해 주세요.'
        }
      }

      return { isValid: true }
    }

    // 저장용 데이터 준비
    const prepareSaveData = () => {
      return {
        // 문제 내용
        content: {
          problem: props.editedTexts.problem || '',
          question: props.editedTexts.question || '',
          image: props.editedTexts.image || '',
          options: props.editedTexts.options || ''
        },
        // 문제 정보
        metadata: {
          majorChapter: props.problemInfo.majorChapter,
          middleChapter: props.problemInfo.middleChapter,
          minorChapter: props.problemInfo.minorChapter,
          topicChapter: props.problemInfo.topicChapter,
          problemType: props.problemInfo.problemType,
          difficulty: props.problemInfo.difficulty,
          hasPassage: props.problemInfo.hasPassage,
          answer: props.problemInfo.answer,
          explanation: props.problemInfo.explanation || ''
        },
        // 선택된 영역 정보
        areas: props.selectedAreas,
        // 저장 타임스탬프
        timestamp: new Date().toISOString()
      }
    }

    return {
      saving,
      saveStatus,
      hasAnyContent,
      getChapterName,
      getProblemTypeLabel,
      getDifficultyLabel,
      prevStep,
      completeProblem
    }
  }
}
</script>

<style scoped>
.step4-container {
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
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.preview-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.preview-panel {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.problem-preview {
  background: #ffffff;
}

.explanation-preview {
  background: #f8f9fa;
}

.preview-section {
  margin-bottom: 1.5rem;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-section h6 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  padding: 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
}

.preview-html {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #333;
}

.no-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
}

/* 우측 영역 - 정보 출력 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.info-summary-panel {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.info-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.info-grid {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
}

.info-value {
  font-size: 0.875rem;
  color: #333;
  font-weight: 600;
}

/* 지문 여부 */
.passage-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.has-passage {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.status-badge.no-passage {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-note {
  font-size: 0.75rem;
  color: #6c757d;
}

/* 정답 */
.answer-section {
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
}

.answer-display {
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.answer-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #495057;
}

/* 저장 상태 */
.save-status-panel {
  margin-top: 1rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.alert-warning {
  background: #fff3cd;
  color: #856404;
  border-color: #ffeaa7;
}

.alert-danger {
  background: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.alert strong {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.alert p {
  margin: 0;
  font-size: 0.875rem;
}

/* 네비게이션 */
.navigation-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn-lg {
  font-size: 1.1rem;
  padding: 0.75rem 2rem;
  font-weight: 600;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .step4-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .preview-panels {
    max-height: 60vh;
  }

  .info-content {
    max-height: 40vh;
  }
}

@media (max-width: 768px) {
  .step4-container {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .info-item {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .passage-status {
    flex-direction: column;
    align-items: flex-start;
  }

  .navigation-panel {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-lg {
    width: 100%;
  }
}
</style>
