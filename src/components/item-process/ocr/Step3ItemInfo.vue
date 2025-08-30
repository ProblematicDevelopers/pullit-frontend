<template>
  <div class="step-content">
    <div class="item-info-layout">
      <!-- 문제 정보 헤더 -->
      <div class="info-header">
        <h3 class="step-title">문제 정보 입력</h3>
        <p class="step-description">
          문제의 기본 정보와 단원을 설정해주세요.
        </p>
      </div>

      <!-- 문제 정보 폼 -->
      <div class="info-form">
        <div class="form-section">
          <h5 class="section-title">
            <i class="bi bi-info-circle me-2"></i>기본 정보
          </h5>

          <div class="row g-3">
            <!-- 문제 유형 -->
            <div class="col-md-6">
              <label class="form-label">
                문제 유형 <span class="text-danger">*</span>
              </label>
              <select
                v-model="itemInfo.itemType"
                class="form-select"
                required
              >
                <option value="">문제 유형을 선택하세요</option>
                <option value="multiple">객관식</option>
                <option value="subjective">주관식</option>
                <option value="shortAnswer">단답형</option>
                <option value="essay">서술형</option>
              </select>
            </div>

            <!-- 난이도 -->
            <div class="col-md-6">
              <label class="form-label">
                난이도 <span class="text-danger">*</span>
              </label>
              <select
                v-model="itemInfo.difficulty"
                class="form-select"
                required
              >
                <option value="">난이도를 선택하세요</option>
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>

            <!-- 배점 -->
            <div class="col-md-6">
              <label class="form-label">
                배점 <span class="text-danger">*</span>
              </label>
              <input
                v-model.number="itemInfo.score"
                type="number"
                class="form-control"
                min="1"
                max="100"
                placeholder="배점을 입력하세요"
                required
              />
            </div>

            <!-- 소요 시간 -->
            <div class="col-md-6">
              <label class="form-label">예상 소요 시간 (분)</label>
              <input
                v-model.number="itemInfo.estimatedTime"
                type="number"
                class="form-control"
                min="1"
                max="60"
                placeholder="예상 시간을 입력하세요"
              />
            </div>
          </div>
        </div>

        <!-- 단원 선택 -->
        <div class="form-section">
          <h5 class="section-title">
            <i class="bi bi-diagram-3 me-2"></i>단원 선택
          </h5>

          <div class="chapter-selection">
            <div class="row g-3">
              <!-- 대단원 -->
              <div class="col-md-4">
                <label class="form-label">대단원</label>
                <select
                  v-model="itemInfo.majorChapter"
                  class="form-select"
                  @change="onMajorChapterChange"
                >
                  <option value="">대단원을 선택하세요</option>
                  <option
                    v-for="chapter in majorChapters"
                    :key="chapter.id"
                    :value="chapter.id"
                  >
                    {{ chapter.name }}
                  </option>
                </select>
              </div>

              <!-- 중단원 -->
              <div class="col-md-4">
                <label class="form-label">중단원</label>
                <select
                  v-model="itemInfo.middleChapter"
                  class="form-select"
                  @change="onMiddleChapterChange"
                  :disabled="!itemInfo.majorChapter"
                >
                  <option value="">중단원을 선택하세요</option>
                  <option
                    v-for="chapter in middleChapters"
                    :key="chapter.id"
                    :value="chapter.id"
                  >
                    {{ chapter.name }}
                  </option>
                </select>
              </div>

              <!-- 소단원 -->
              <div class="col-md-4">
                <label class="form-label">소단원</label>
                <select
                  v-model="itemInfo.minorChapter"
                  class="form-select"
                  :disabled="!itemInfo.middleChapter"
                >
                  <option value="">소단원을 선택하세요</option>
                  <option
                    v-for="chapter in minorChapters"
                    :key="chapter.id"
                    :value="chapter.id"
                  >
                    {{ chapter.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 선택된 단원 경로 표시 -->
            <div class="chapter-path-display">
              <div class="path-label">선택된 단원:</div>
              <div class="path-value">{{ getChapterPath() }}</div>
            </div>
          </div>
        </div>

        <!-- 추가 정보 -->
        <div class="form-section">
          <h5 class="section-title">
            <i class="bi bi-plus-circle me-2"></i>추가 정보
          </h5>

          <div class="row g-3">
            <!-- 키워드 -->
            <div class="col-md-6">
              <label class="form-label">키워드</label>
              <input
                v-model="itemInfo.keywords"
                type="text"
                class="form-control"
                placeholder="키워드를 쉼표로 구분하여 입력하세요"
              />
              <div class="form-text">예: 함수, 미분, 극한</div>
            </div>

            <!-- 학습 목표 -->
            <div class="col-md-6">
              <label class="form-label">학습 목표</label>
              <input
                v-model="itemInfo.learningObjective"
                type="text"
                class="form-control"
                placeholder="이 문제를 통해 학습할 내용을 입력하세요"
              />
            </div>

            <!-- 메모 -->
            <div class="col-12">
              <label class="form-label">메모</label>
              <textarea
                v-model="itemInfo.memo"
                class="form-control"
                rows="3"
                placeholder="문제에 대한 추가 메모를 입력하세요"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 유효성 검사 결과 -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div class="alert alert-danger">
          <h6 class="alert-heading">
            <i class="bi bi-exclamation-triangle me-2"></i>입력 오류
          </h6>
          <ul class="mb-0">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 네비게이션 버튼 -->
    <div class="navigation-buttons">
      <button @click="prevStep" class="btn btn-secondary">
        <i class="bi bi-arrow-left-circle me-2"></i>이전 단계
      </button>
      <button @click="nextStep" class="btn btn-success" :disabled="!isFormValid">
        <i class="bi bi-arrow-right-circle me-2"></i>다음 단계
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'Step3ItemInfo',
  props: {
    itemInfo: {
      type: Object,
      required: true
    }
  },
  emits: [
    'update:itemInfo',
    'prev-step',
    'next-step'
    ],
  setup(props, { emit }) {
    // 단원 데이터 (실제로는 API에서 가져올 데이터)
    const majorChapters = ref([
      { id: 1, name: '수학 I' },
      { id: 2, name: '수학 II' },
      { id: 3, name: '미적분' },
      { id: 4, name: '기하' }
    ])

    const middleChapters = ref([
      { id: 1, name: '중단원 1-1' },
      { id: 2, name: '중단원 1-2' },
      { id: 3, name: '중단원 2-1' },
      { id: 4, name: '중단원 2-2' }
    ])

    const minorChapters = ref([
      { id: 1, name: '소단원 1-1-1' },
      { id: 2, name: '소단원 1-1-2' },
      { id: 3, name: '소단원 1-2-1' },
      { id: 4, name: '소단원 1-2-2' }
    ])

    // 유효성 검사 오류
    const validationErrors = ref([])

    // 폼 유효성 검사
    const isFormValid = computed(() => {
      return validationErrors.value.length === 0
    })

    // 유효성 검사 실행
    const validateForm = () => {
      const errors = []

      // 필수 필드 검사
      if (!props.itemInfo.itemType) {
        errors.push('문제 유형을 선택해주세요.')
      }
      if (!props.itemInfo.difficulty) {
        errors.push('난이도를 선택해주세요.')
      }
      if (!props.itemInfo.score || props.itemInfo.score < 1 || props.itemInfo.score > 100) {
        errors.push('배점을 1-100 사이의 값으로 입력해주세요.')
      }

      validationErrors.value = errors
    }

    // 대단원 변경 시
    const onMajorChapterChange = () => {
      // 중단원과 소단원 초기화
      const newItemInfo = { ...props.itemInfo }
      newItemInfo.middleChapter = ''
      newItemInfo.minorChapter = ''
      emit('update:itemInfo', newItemInfo)

      // 중단원 목록 업데이트 (실제로는 API 호출)
      console.log('대단원 변경:', props.itemInfo.majorChapter)
    }

    // 중단원 변경 시
    const onMiddleChapterChange = () => {
      // 소단원 초기화
      const newItemInfo = { ...props.itemInfo }
      newItemInfo.minorChapter = ''
      emit('update:itemInfo', newItemInfo)

      // 소단원 목록 업데이트 (실제로는 API 호출)
      console.log('중단원 변경:', props.itemInfo.middleChapter)
    }

    // 단원 경로 문자열 생성
    const getChapterPath = () => {
      const parts = []

      if (props.itemInfo.majorChapter) {
        const major = majorChapters.value.find(c => c.id === props.itemInfo.majorChapter)
        if (major) parts.push(major.name)
      }

      if (props.itemInfo.middleChapter) {
        const middle = middleChapters.value.find(c => c.id === props.itemInfo.middleChapter)
        if (middle) parts.push(middle.name)
      }

      if (props.itemInfo.minorChapter) {
        const minor = minorChapters.value.find(c => c.id === props.itemInfo.minorChapter)
        if (minor) parts.push(minor.name)
      }

      return parts.join(' > ') || '단원 미선택'
    }

    // 이전 단계로
    const prevStep = () => {
      emit('prev-step')
    }

    // 다음 단계로
    const nextStep = () => {
      if (isFormValid.value) {
        emit('next-step')
      }
    }

    // itemInfo 변경 시 유효성 검사 실행
    watch(() => props.itemInfo, validateForm, { deep: true, immediate: true })

    return {
      majorChapters,
      middleChapters,
      minorChapters,
      validationErrors,
      isFormValid,
      onMajorChapterChange,
      onMiddleChapterChange,
      getChapterPath,
      prevStep,
      nextStep
    }
  }
}
</script>

<style scoped>
.step-content {
  padding: 1rem;
}

.item-info-layout {
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  overflow: hidden;
}

.info-header {
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

.info-form {
  padding: 2rem;
}

.form-section {
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

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-control,
.form-select {
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus,
.form-select:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-text {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.chapter-selection {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.chapter-path-display {
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.path-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.path-value {
  font-size: 1.1rem;
  color: #495057;
  font-weight: 500;
  padding: 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.validation-errors {
  margin: 1.5rem 0;
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
  .info-header {
    padding: 1.5rem 1rem;
  }

  .info-form {
    padding: 1.5rem 1rem;
  }

  .navigation-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .navigation-buttons .btn {
    width: 100%;
  }

  .chapter-selection {
    padding: 1rem;
  }
}
</style>
