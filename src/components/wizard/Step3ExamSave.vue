<template>
  <div class="step3-container">
    <!-- 상단 헤더 -->
    <div class="step-header">
      <button @click="$emit('back')" class="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        이전 단계
      </button>
      
      <div class="step-info">
        <h2>시험지 저장 및 출력</h2>
        <p class="step-description">생성된 시험지를 미리보고 PDF로 저장하거나 출력할 수 있습니다.</p>
      </div>
    </div>

    <!-- PDF 미리보기 컴포넌트 -->
    <ExamPDFPreview 
      :selected-items="selectedItems"
      @download="handleDownload"
      @save="handleSave"
    />

    <!-- 하단 액션 버튼 -->
    <div class="step-actions">
      <button @click="saveDraft" class="btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M17 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3Z" 
                stroke="currentColor" stroke-width="2"/>
          <path d="M17 3V7H21" stroke="currentColor" stroke-width="2"/>
        </svg>
        임시 저장
      </button>
      
      <div class="actions-right">
        <button @click="handleComplete" class="btn-primary" :disabled="!canComplete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L22 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          완료
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { useItemSelectionStore } from '@/stores/itemSelection'
import ExamPDFPreview from './ExamPDFPreviewFixed.vue'

// Emits
const emit = defineEmits(['back', 'complete'])

// Stores
const testBankStore = useTestBankStore()
const itemSelectionStore = useItemSelectionStore()

// 선택된 문항들
const selectedItems = computed(() => {
  const items = itemSelectionStore.selectedItems ||
                testBankStore.examInfo?.selectedItems ||
                testBankStore.selectedItems ||
                []
  
  console.log('Step3: 선택된 문항 수:', items.length)
  
  return items.map((item, index) => ({
    ...item,
    itemId: item.itemId || item.id || `item-${index}`,
    displayNumber: item.questionNumber || (index + 1),
    questionHtml: item.questionHtml || item.questionText || '',
    passageHtml: item.passageHtml || '',
    passageId: item.passageId,
    choice1Html: item.choice1Html || item.choice1,
    choice2Html: item.choice2Html || item.choice2,
    choice3Html: item.choice3Html || item.choice3,
    choice4Html: item.choice4Html || item.choice4,
    choice5Html: item.choice5Html || item.choice5,
    correctAnswer: item.correctAnswer || item.answer,
    points: item.points || 5
  }))
})

// 완료 가능 여부
const canComplete = computed(() => {
  return selectedItems.value.length > 0
})

// PDF 다운로드 처리 (ExamPDFPreview 컴포넌트에서 처리)
const handleDownload = async (data) => {
  console.log('PDF 다운로드 완료:', data)
  // ExamPDFPreview 컴포넌트에서 html2pdf.js로 처리됨
}

// 저장 처리
const handleSave = async (data) => {
  console.log('시험지 저장:', data)
  
  try {
    // 저장 로직 구현
    // API 호출 등
    
    alert('시험지가 저장되었습니다.')
  } catch (error) {
    console.error('저장 오류:', error)
    alert('저장 중 오류가 발생했습니다.')
  }
}

// 임시 저장
const saveDraft = async () => {
  console.log('임시 저장')
  
  try {
    // 임시 저장 로직
    const draftData = {
      items: selectedItems.value,
      savedAt: new Date().toISOString()
    }
    
    // LocalStorage에 저장
    localStorage.setItem('examDraft', JSON.stringify(draftData))
    
    alert('임시 저장되었습니다.')
  } catch (error) {
    console.error('임시 저장 오류:', error)
    alert('임시 저장 중 오류가 발생했습니다.')
  }
}

// 완료 처리
const handleComplete = () => {
  if (!canComplete.value) return
  
  console.log('시험지 생성 완료')
  emit('complete', {
    items: selectedItems.value,
    completedAt: new Date().toISOString()
  })
}

// 컴포넌트 마운트
onMounted(() => {
  console.log('Step3ExamSave 마운트됨')
  console.log('선택된 문항 수:', selectedItems.value.length)
})
</script>

<style scoped>
.step3-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

/* 헤더 스타일 */
.step-header {
  background: white;
  border-bottom: 1px solid #e0e6ed;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  color: #606f7b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  border-color: #2563eb;
  color: #2563eb;
  transform: translateX(-2px);
}

.step-info h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.step-description {
  margin: 0;
  color: #606f7b;
  font-size: 0.875rem;
}

/* 액션 버튼 영역 */
.step-actions {
  background: white;
  border-top: 1px solid #e0e6ed;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.04);
}

.actions-right {
  display: flex;
  gap: 1rem;
}

/* 버튼 스타일 */
.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #606f7b;
  border: 1px solid #e0e6ed;
}

.btn-secondary:hover {
  border-color: #cbd5e0;
  background: #f8fafc;
}

/* ExamPDFPreview 컴포넌트가 차지할 공간 */
.step3-container > :deep(.exam-pdf-preview) {
  flex: 1;
  overflow: hidden;
}
</style>