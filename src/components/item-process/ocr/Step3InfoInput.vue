<template>
  <div class="step3-container">
    <!-- 좌측: 문제 미리보기 -->
    <div class="left-section">
      <div class="preview-panel">
        <h5 class="panel-title">작성한 문제 미리보기</h5>
        <div class="preview-content">
          <!-- 문제 영역 -->
          <div v-if="editedTexts.problem" class="preview-section problem-section">
            <h6>문제</h6>
            <div class="preview-html" v-html="editedTexts.problem"></div>
          </div>

          <!-- 지문 영역 -->
          <div v-if="editedTexts.question" class="preview-section question-section">
            <h6>지문</h6>
            <div class="preview-html" v-html="editedTexts.question"></div>
          </div>

          <!-- 이미지 영역 -->
          <div v-if="editedTexts.image" class="preview-section image-section">
            <h6>이미지</h6>
            <div class="preview-h tml" v-html="editedTexts.image"></div>
          </div>

          <!-- 보기 영역 -->
          <div v-if="editedTexts.options" class="preview-section options-section">
            <h6>보기</h6>
            <div class="preview-html" v-html="editedTexts.options"></div>
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
          <!-- 단원 정보 -->
          <div class="form-section">
            <h6 class="section-title">단원 정보</h6>

            <div class="form-group">
              <label class="form-label">대단원 챕터</label>
              <select v-model="problemInfo.majorChapter" class="form-select">
                <option value="">선택 값</option>
                <option v-for="chapter in majorChapters" :key="chapter.id" :value="chapter.id">
                  {{ chapter.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">중단원 챕터</label>
              <select v-model="problemInfo.middleChapter" class="form-select">
                <option value="">선택 값</option>
                <option v-for="chapter in middleChapters" :key="chapter.id" :value="chapter.id">
                  {{ chapter.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">소단원 챕터</label>
              <select v-model="problemInfo.minorChapter" class="form-select">
                <option value="">선택 값</option>
                <option v-for="chapter in minorChapters" :key="chapter.id" :value="chapter.id">
                  {{ chapter.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">토픽 챕터</label>
              <select v-model="problemInfo.topicChapter" class="form-select">
                <option value="">선택 값</option>
                <option v-for="topic in topicChapters" :key="topic.id" :value="topic.id">
                  {{ topic.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- 문제 정보 -->
          <div class="form-section">
            <h6 class="section-title">문제 정보</h6>

            <div class="form-group">
              <label class="form-label">문제 형태</label>
              <select v-model="problemInfo.problemType" class="form-select">
                <option value="">선택 값</option>
                <option value="multiple_choice">5지 선택</option>
                <option value="short_answer">단답</option>
                <option value="subjective">주관식</option>
                <option value="sequence">유순형</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">난이도</label>
              <select v-model="problemInfo.difficulty" class="form-select">
                <option value="">선택 값</option>
                <option value="highest">최상</option>
                <option value="high">상</option>
                <option value="medium">중</option>
                <option value="low">하</option>
                <option value="lowest">최하</option>
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
              />
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
              <!-- TinyMCE 에디터 -->
              <div class="editor-container">
                <Editor
                  :key="explanationEditorKey"
                  :api-key="tinymceApiKey"
                  :model-value="problemInfo.explanation"
                  @update:model-value="updateExplanation"
                  :init="explanationEditorConfig"
                  class="explanation-tinymce-editor"
                />
              </div>

              <!-- 수식 도구 -->
              <div class="math-tools-section">
                <h6>수식 도구</h6>
                <div class="math-buttons">
                  <button @click="insertMathToExplanation('+')" class="math-btn">덧셈</button>
                  <button @click="insertMathToExplanation('-')" class="math-btn">뺄셈</button>
                  <button @click="insertMathToExplanation('\\times')" class="math-btn">곱셈</button>
                  <button @click="insertMathToExplanation('\\div')" class="math-btn">나눗셈</button>
                  <button @click="insertMathToExplanation('\\sqrt{}')" class="math-btn">제곱근</button>
                  <button @click="insertMathToExplanation('^{}')" class="math-btn">지수</button>
                  <button @click="insertMathToExplanation('\\log')" class="math-btn">로그</button>
                  <button @click="insertMathToExplanation('\\int')" class="math-btn">적분</button>
                </div>
              </div>
            </div>
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
import { ref } from 'vue'
import Editor from '@tinymce/tinymce-vue'

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
    }
  },
  emits: [
    'update:problemInfo',
    'prev-step',
    'next-step'
  ],
  setup(props, { emit }) {
    // 문제 정보 상태
    const problemInfo = ref({
      majorChapter: '',
      middleChapter: '',
      minorChapter: '',
      topicChapter: '',
      problemType: '',
      difficulty: '',
      hasPassage: !!props.selectedAreas.question,
      answer: '',
      explanation: ''
    })

    // 해설 에디터 상태
    const showExplanationEditor = ref(false)
    const explanationEditorKey = ref(0)

    // 챕터 데이터 (실제로는 API에서 가져와야 함)
    const majorChapters = ref([
      { id: 1, name: '수와 연산' },
      { id: 2, name: '문자와 식' },
      { id: 3, name: '함수' },
      { id: 4, name: '기하' },
      { id: 5, name: '확률과 통계' }
    ])

    const middleChapters = ref([
      { id: 1, name: '자연수의 성질' },
      { id: 2, name: '정수와 유리수' },
      { id: 3, name: '실수' }
    ])

    const minorChapters = ref([
      { id: 1, name: '소인수분해' },
      { id: 2, name: '최대공약수와 최소공배수' }
    ])

    const topicChapters = ref([
      { id: 1, name: '범위내에서 유한소수가 되게 하는 값 찾기' },
      { id: 2, name: '분수의 덧셈과 뺄셈' }
    ])

    // TinyMCE 설정
    const tinymceApiKey = import.meta.env.VITE_TINYMCE_KEY || 'no-api-key'
    const explanationEditorConfig = {
      height: 300,
      min_height: 200,
      max_height: 400,
      branding: false,
      promotion: false,
      menubar: false,
      statusbar: true,
      resize: true,
      language: 'en',

      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code',
        'insertdatetime', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | mathformula',

      content_style: `
        body {
          font-family: 'Noto Sans KR', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          margin: 8px !important;
          padding: 8px !important;
        }
        .math-latex {
          background: #f0f8ff;
          padding: 4px 6px;
          border-radius: 4px;
          border: 1px solid #d0e7ff;
          font-family: 'Times New Roman', serif;
          color: #1e40af;
          display: inline-block;
          margin: 0 2px;
        }
      `,

      setup: (editor) => {
        editor.ui.registry.addButton('mathformula', {
          text: '수식',
          icon: 'equation',
          onAction: () => {
            const mathText = prompt('LaTeX 수식을 입력하세요:', 'x^2 + y^2 = r^2')
            if (mathText) {
              const html = `<span class="math-latex" data-latex="${mathText}">$${mathText}$</span>`
              editor.insertContent(html)
            }
          }
        })
      }
    }

    // 정답 플레이스홀더
    const getAnswerPlaceholder = () => {
      switch (problemInfo.value.problemType) {
        case 'multiple_choice':
          return '예: 4'
        case 'short_answer':
          return '예: 12'
        case 'subjective':
          return '주관식 답안'
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
      emit('update:problemInfo', problemInfo.value)
    }

    // 수식 삽입 (해설용)
    const insertMathToExplanation = (latex) => {
      // TinyMCE 에디터에 수식 삽입 로직
      // 실제 구현에서는 에디터 인스턴스에 접근해서 삽입
    }

    // 이전 단계로
    const prevStep = () => {
      emit('prev-step')
    }

    // 다음 단계로
    const nextStep = () => {
      emit('update:problemInfo', problemInfo.value)
      emit('next-step')
    }

    return {
      problemInfo,
      showExplanationEditor,
      explanationEditorKey,
      majorChapters,
      middleChapters,
      minorChapters,
      topicChapters,
      tinymceApiKey,
      explanationEditorConfig,
      getAnswerPlaceholder,
      toggleExplanationEditor,
      updateExplanation,
      insertMathToExplanation,
      prevStep,
      nextStep
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

.editor-container {
  margin-bottom: 1rem;
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

/* TinyMCE 스타일링 */
:deep(.tox-tinymce) {
  border: 1px solid #ced4da !important;
  border-radius: 4px !important;
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
