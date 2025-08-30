<template>
  <div class="step-content">
    <div class="editing-layout">
      <!-- 편집 헤더 -->
      <div class="editing-header">
        <h3 class="step-title">추출된 텍스트 편집</h3>
        <div class="area-tabs">
          <button
            v-for="areaType in availableAreaTypes"
            :key="areaType"
            @click="selectEditingArea(areaType)"
            class="area-tab"
            :class="{ active: currentEditingArea === areaType }"
          >
            <i :class="getAreaIcon(areaType)" class="me-2"></i>
            {{ getAreaTypeLabel(areaType) }}
            <span
              v-if="selectedAreas[areaType]"
              class="badge bg-success ms-2"
            >
              <i class="bi bi-check-circle-fill"></i>
            </span>
          </button>
        </div>
      </div>

      <!-- 편집 영역 -->
      <div class="editing-content">
        <div class="editing-toolbar">
          <div class="toolbar-left">
            <button
              @click="copyOcrToEditor"
              class="btn btn-outline-primary btn-sm"
              :disabled="!ocrResults[currentEditingArea]"
            >
              <i class="bi bi-arrow-down-circle me-2"></i>OCR 결과 복사
            </button>
            <button
              @click="clearEditor"
              class="btn btn-outline-secondary btn-sm"
              :disabled="!editedTexts[currentEditingArea]"
            >
              <i class="bi bi-trash me-2"></i>편집 내용 지우기
            </button>
          </div>

          <div class="toolbar-right">
            <span class="text-muted">
              <i class="bi bi-info-circle me-1"></i>
              {{ getAreaTypeLabel(currentEditingArea) }} 편집 중
            </span>
          </div>
        </div>

        <!-- 텍스트 편집기 -->
        <div class="editor-container">
          <div class="editor-header">
            <h5 class="editor-title">
              <i :class="getAreaIcon(currentEditingArea)" class="me-2"></i>
              {{ getAreaTypeLabel(currentEditingArea) }} 편집
              <span v-if="isRequired(currentEditingArea)" class="badge bg-danger ms-2">필수</span>
              <span v-else class="badge bg-secondary ms-2">선택</span>
            </h5>
          </div>

          <div class="editor-content">
            <textarea
              v-model="editedTexts[currentEditingArea]"
              class="form-control text-editor"
              :placeholder="`${getAreaTypeLabel(currentEditingArea)} 내용을 편집하세요...`"
              rows="12"
            ></textarea>
          </div>
        </div>

        <!-- OCR 결과 미리보기 -->
        <div class="ocr-preview">
          <div class="preview-header">
            <h6 class="preview-title">
              <i class="bi bi-eye me-2"></i>OCR 원본 결과
            </h6>
            <button
              @click="togglePreview"
              class="btn btn-sm btn-outline-secondary"
            >
              <i :class="showPreview ? 'bi bi-chevron-up' : 'bi bi-chevron-down'" class="me-1"></i>
              {{ showPreview ? '접기' : '펼치기' }}
            </button>
          </div>

          <div v-if="showPreview" class="preview-content">
            <div class="ocr-text-display">
              <pre v-if="ocrResults[currentEditingArea]" class="ocr-text">{{ ocrResults[currentEditingArea] }}</pre>
              <div v-else class="no-ocr-result">
                <i class="bi bi-exclamation-circle text-muted"></i>
                <span class="text-muted">OCR 결과가 없습니다.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 네비게이션 버튼 -->
    <div class="navigation-buttons">
      <button @click="prevStep" class="btn btn-secondary">
        <i class="bi bi-arrow-left-circle me-2"></i>이전 단계
      </button>
      <button @click="nextStep" class="btn btn-success">
        <i class="bi bi-arrow-right-circle me-2"></i>다음 단계
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'Step2TextEditing',
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

    // 사용 가능한 영역 타입들
    const availableAreaTypes = computed(() => {
      return Object.keys(props.selectedAreas).filter(
        areaType => props.selectedAreas[areaType]
      )
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
        question: '지문',
        problem: '문제',
        image: '이미지',
        options: '보기'
      }
      return labels[areaType] || areaType
    }

    // 필수 영역 여부
    const isRequired = (areaType) => {
      return areaType === 'problem' || areaType === 'options'
    }

    // 편집 영역 선택
    const selectEditingArea = (areaType) => {
      emit('update:currentEditingArea', areaType)
    }

    // OCR 결과를 편집기에 복사
    const copyOcrToEditor = () => {
      const newEditedTexts = { ...props.editedTexts }
      newEditedTexts[props.currentEditingArea] = props.ocrResults[props.currentEditingArea] || ''
      emit('update:editedTexts', newEditedTexts)
    }

    // 편집 내용 지우기
    const clearEditor = () => {
      const newEditedTexts = { ...props.editedTexts }
      newEditedTexts[props.currentEditingArea] = ''
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

    return {
      showPreview,
      availableAreaTypes,
      getAreaIcon,
      getAreaTypeLabel,
      isRequired,
      selectEditingArea,
      copyOcrToEditor,
      clearEditor,
      togglePreview,
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

.editing-layout {
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  overflow: hidden;
}

.editing-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.step-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #495057;
}

.area-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.area-tab {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: #6c757d;
}

.area-tab:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.area-tab.active {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.area-tab .badge {
  font-size: 0.7rem;
}

.editing-content {
  padding: 1.5rem;
}

.editing-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.toolbar-left {
  display: flex;
  gap: 0.5rem;
}

.toolbar-right {
  font-size: 0.9rem;
}

.editor-container {
  margin-bottom: 2rem;
}

.editor-header {
  margin-bottom: 1rem;
}

.editor-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
}

.editor-content {
  border: 1px solid #ced4da;
  border-radius: 6px;
  overflow: hidden;
}

.text-editor {
  border: none;
  resize: vertical;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 0.95rem;
  line-height: 1.6;
  padding: 1rem;
}

.text-editor:focus {
  box-shadow: none;
  border-color: #80bdff;
}

.ocr-preview {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.preview-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
}

.preview-content {
  padding: 1rem;
  background: white;
}

.ocr-text-display {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
  min-height: 100px;
}

.ocr-text {
  margin: 0;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #495057;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-ocr-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100px;
  color: #6c757d;
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

@media (max-width: 768px) {
  .area-tabs {
    flex-direction: column;
  }

  .area-tab {
    justify-content: center;
  }

  .editing-toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .toolbar-left {
    justify-content: center;
  }

  .toolbar-right {
    text-align: center;
  }

  .navigation-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .navigation-buttons .btn {
    width: 100%;
  }
}
</style>
