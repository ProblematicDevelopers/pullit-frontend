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
    <div class="pdf-preview-wrapper">
      <ExamPDFPreview 
        ref="pdfPreviewRef"
        :selected-items="selectedItems"
        @download="handleDownload"
        @save="handleSave"
        @update:gradeInfo="handleGradeUpdate"
        @update:subjectInfo="handleSubjectUpdate"
      />
    </div>

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
        <button @click="saveExamToDatabase" class="btn-success" :disabled="!canComplete || isSaving">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" 
                  stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="17 21 17 13 7 13 7 21" stroke="white" stroke-width="2"/>
            <polyline points="7 3 7 8 15 8" stroke="white" stroke-width="2"/>
          </svg>
          {{ isSaving ? '저장 중...' : '시험지 저장' }}
        </button>
        
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
import { computed, onMounted, ref } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { useItemSelectionStore } from '@/stores/itemSelection'
import ExamPDFPreview from './ExamPDFPreviewFixed.vue'
import examApi from '@/services/examApi'
import userExamApi from '@/services/userExamApi'

// Emits
const emit = defineEmits(['back', 'complete'])

// State
const isSaving = ref(false)
const examSavedId = ref(null)
const pdfPreviewRef = ref(null)

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

// Handle grade info update from ExamPDFPreview
const handleGradeUpdate = (gradeInfo) => {
  if (testBankStore.examInfo) {
    testBankStore.setExamInfo({
      ...testBankStore.examInfo,
      gradeCode: gradeInfo.code,
      gradeName: gradeInfo.name
    })
  }
}

// Handle subject info update from ExamPDFPreview
const handleSubjectUpdate = (subjectInfo) => {
  if (testBankStore.examInfo) {
    testBankStore.setExamInfo({
      ...testBankStore.examInfo,
      areaCode: subjectInfo.code,
      areaName: subjectInfo.name
    })
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

// 시험지를 데이터베이스에 저장 (PDF 업로드 포함)
const saveExamToDatabase = async () => {
  if (!canComplete.value || isSaving.value) return
  
  isSaving.value = true
  
  try {
    // 1. PDF 생성
    console.log('PDF 생성 시작...')
    let pdfBlob = null
    
    if (pdfPreviewRef.value && pdfPreviewRef.value.generateAndSavePDF) {
      pdfBlob = await pdfPreviewRef.value.generateAndSavePDF()
      console.log('PDF Blob 생성 완료:', pdfBlob)
    } else {
      console.warn('PDF 생성 기능을 사용할 수 없습니다.')
    }
    
    // examInfo에서 기본 정보 가져오기
    const examInfo = testBankStore.examInfo || {}
    
    // 시험지 저장 데이터 준비
    const examData = {
      // 기본 정보
      examName: examInfo.title || examInfo.examName || '2024년 시험지',
      gradeCode: examInfo.gradeCode || '08',
      gradeName: examInfo.gradeName || '중2',
      termCode: examInfo.termCode || '1',
      termName: examInfo.termName || '1학기',
      areaCode: examInfo.areaCode || examInfo.subjectCode,
      areaName: examInfo.areaName || examInfo.subject || '수학',
      examType: 'TESTWIZARD',
      
      // 추가 정보
      timeLimit: 50, // 기본 50분
      examDate: null, // 필요시 설정
      description: `${examInfo.gradeName} ${examInfo.areaName} 시험지`,
      
      // 문항 리스트
      items: selectedItems.value.map((item, index) => ({
        itemId: item.itemId || item.id,
        subjectId: item.subjectId,
        itemOrder: index + 1,
        points: item.points || 5
      }))
    }
    
    console.log('시험지 저장 데이터:', examData)
    
    // 2. FormData 생성 (PDF와 함께 전송)
    const formData = new FormData()
    formData.append('examData', new Blob([JSON.stringify(examData)], { type: 'application/json' }))
    
    if (pdfBlob) {
      const fileName = `${examData.examName}_${new Date().toISOString().split('T')[0]}.pdf`
      formData.append('pdfFile', pdfBlob, fileName)
      console.log('PDF 파일 추가됨:', fileName)
    }
    
    // 3. API 호출 (UserExam 생성 + PDF S3 업로드)
    const response = await userExamApi.createExamWithPDF(formData)
    
    console.log('시험지 및 PDF 저장 성공:', response.data)
    examSavedId.value = response.data.id
    
    // 성공 메시지
    alert(`시험지가 성공적으로 저장되었습니다. (ID: ${response.data.id})`)
    
    // store에 저장된 시험지 ID 저장
    testBankStore.setExamInfo({
      ...testBankStore.examInfo,
      savedExamId: response.data.id,
      pdfUrl: response.data.pdfUrl
    })
    
  } catch (error) {
    console.error('시험지 저장 실패:', error)
    alert('시험지 저장 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message))
  } finally {
    isSaving.value = false
  }
}

// 완료 처리
const handleComplete = () => {
  if (!canComplete.value) return
  
  console.log('시험지 생성 완료')
  emit('complete', {
    items: selectedItems.value,
    examId: examSavedId.value,
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

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* PDF 미리보기 래퍼 */
.pdf-preview-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ExamPDFPreview 컴포넌트가 차지할 공간 */
.pdf-preview-wrapper > :deep(.exam-pdf-preview) {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>