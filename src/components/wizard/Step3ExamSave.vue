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

    <!-- 메인 컨텐츠 영역 -->
  <div class="content-wrapper">

      <!-- 왼쪽: 시험 설정 -->
      <div class="exam-settings-section">
        <div class="settings-card">
          <h3 class="settings-title">시험 설정</h3>

          <!-- 공개 범위 설정 -->
          <div class="setting-group">
            <label class="setting-label">공개 범위</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="examSettings.visibility"
                  value="PRIVATE"
                />
                <span class="radio-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7V11C2 16.55 6.84 21.73 12 23C17.16 21.73 22 16.55 22 11V7L12 2Z"
                          stroke="currentColor" stroke-width="2"/>
                  </svg>
                  비공개
                  <small>나만 볼 수 있음</small>
                </span>
              </label>

              <label class="radio-option">
                <input
                  type="radio"
                  v-model="examSettings.visibility"
                  value="PUBLIC"
                />
                <span class="radio-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 2C14.5 5 14.5 9 12 12C9.5 15 9.5 19 12 22" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  공개
                  <small>모든 사용자가 볼 수 있음</small>
                </span>
              </label>
            </div>
          </div>

          <!-- 시험 날짜 설정 -->
          <div class="setting-group">
            <label class="setting-label">시험 예정일</label>
            <input
              type="date"
              v-model="examSettings.examDate"
              class="setting-input"
              :min="todayDate"
            />
          </div>

          <!-- 시간 제한 설정 -->
          <div class="setting-group">
            <label class="setting-label">제한 시간 (분)</label>
            <div class="time-input-wrapper">
              <input
                type="number"
                v-model.number="examSettings.timeLimit"
                class="setting-input"
                min="10"
                max="180"
                step="5"
              />
              <span class="time-suffix">분</span>
            </div>
            <div class="time-presets">
              <button
                v-for="time in [30, 50, 70, 90]"
                :key="time"
                @click="examSettings.timeLimit = time"
                :class="['preset-btn', { active: examSettings.timeLimit === time }]"
              >
                {{ time }}분
              </button>
            </div>
          </div>

          <!-- 총점 설정 -->
          <div class="setting-group">
            <label class="setting-label">총점</label>
            <div class="time-input-wrapper">
              <input
                type="number"
                v-model.number="examSettings.totalPoints"
                class="setting-input"
                min="1"
                max="1000"
                step="1"
              />
              <span class="time-suffix">점</span>
            </div>
            <div class="time-presets">
              <button
                v-for="pts in [50, 100, 200]"
                :key="pts"
                @click="examSettings.totalPoints = pts"
                :class="['preset-btn', { active: examSettings.totalPoints === pts }]"
              >
                {{ pts }}점
              </button>
            </div>
          </div>

          <!-- 설명 추가 -->
          <div class="setting-group">
            <label class="setting-label">시험 설명 (선택)</label>
            <textarea
              v-model="examSettings.description"
              class="setting-textarea"
              placeholder="이 시험에 대한 설명을 입력하세요..."
              rows="3"
            />
          </div>

          <!-- 추가 옵션 -->
          <div class="setting-group">
            <label class="checkbox-option">
              <input
                type="checkbox"
                v-model="examSettings.shuffleQuestions"
              />
              <span>문제 순서 섞기</span>
            </label>

            <label class="checkbox-option">
              <input
                type="checkbox"
                v-model="examSettings.showAnswerAfterSubmit"
              />
              <span>제출 후 정답 공개</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 오른쪽: PDF 미리보기 -->
      <div class="pdf-preview-section">
        <!-- 이미지 기반 미리보기만 사용 -->
        <ExamImagePreview
          ref="pdfPreviewRef"
          :converted-images="convertedImages"
        />
      </div>
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
        <button @click="handleSaveClick" class="btn-success" :disabled="isSaving">
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
/* 이미지 기반 미리보기만 사용하도록 간소화 */
import examApi from '@/services/examApi'
import userExamApi from '@/services/userExamApi'
import ExamImagePreview from './ExamImagePreview.vue'

// Emits
const emit = defineEmits(['back', 'complete'])

// State
const isSaving = ref(false)
const examSavedId = ref(null)
const pdfPreviewRef = ref(null)

// 시험 설정 상태
const examSettings = ref({
  visibility: 'PRIVATE',  // PRIVATE, PUBLIC, CLASS_ONLY
  classId: null,
  examDate: null,
  timeLimit: 50,  // 기본 50분
  totalPoints: 100,
  description: '',
  shuffleQuestions: false,
  showAnswerAfterSubmit: false
})

// 사용 가능한 클래스 목록 (실제로는 API에서 가져와야 함)
const availableClasses = ref([
  { id: 1, name: '중2 A반' },
  { id: 2, name: '중2 B반' },
  { id: 3, name: '중3 수학 심화반' }
])

// 오늘 날짜 (최소 날짜 설정용)
const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Stores
const testBankStore = useTestBankStore()
const itemSelectionStore = useItemSelectionStore()

// 변환된 이미지 데이터
const convertedImages = computed(() => {
  const images = itemSelectionStore.getConvertedImages() || []
  console.log('[Step3] Converted images to pass:', images.length)
  if (images.length > 0) {
    console.log('[Step3] First image check:', {
      hasDataUrl: !!images[0].dataUrl,
      dataUrlStart: images[0].dataUrl ? images[0].dataUrl.substring(0, 50) : 'no dataUrl'
    })
  }
  return images
})

// 선택된 문항들
const selectedItems = computed(() => {
  const items = itemSelectionStore.selectedItems ||
                testBankStore.examInfo?.selectedItems ||
                testBankStore.selectedItems ||
                []

  console.log('Step3: 선택된 문항 수:', items.length)
  console.log('Step3: 변환된 이미지 수:', itemSelectionStore.getConvertedImages()?.length || 0)

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

// 저장 처리 (ExamPDFPreview에서 호출)
const handleSave = async (data) => {
  console.log('시험지 저장 데이터 수신:', data)

  // 받은 데이터에 실제 문항이 포함되어 있는지 확인
  if (!data.items || data.items.length === 0) {
    console.error('문항 데이터가 없습니다!')
    alert('저장할 문항이 없습니다.')
    return
  }

  // 실제 데이터베이스에 저장하는 함수 호출
  console.log('데이터베이스에 저장 시작...')
  await saveExamToDatabase()
}

// (제거됨) ExamPDFPreview 관련 업데이트 핸들러

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

// 저장 버튼 클릭 핸들러
const handleSaveClick = async (event) => {
  console.log('✅ handleSaveClick 호출됨!')
  console.log('selectedItems.value.length:', selectedItems.value.length)
  console.log('isSaving.value:', isSaving.value)

  // 선택된 문항이 없으면 경고
  if (selectedItems.value.length === 0) {
    alert('문항을 선택해주세요.')
    return
  }

  // 실제 저장 함수 호출
  await saveExamToDatabase()
}

// 시험지를 데이터베이스에 저장 (PDF 업로드 포함)
const saveExamToDatabase = async () => {
  console.log('🚀 saveExamToDatabase 함수 호출됨')
  console.log('selectedItems 수:', selectedItems.value.length)

  if (isSaving.value) {
    console.warn('이미 저장 중입니다.')
    return
  }

  if (selectedItems.value.length === 0) {
    console.error('선택된 문항이 없습니다!')
    alert('문항을 선택해주세요.')
    return
  }

  isSaving.value = true

  try {
    // 1. PDF 생성은 선택적으로 처리
    console.log('PDF 생성 시작...')
    let pdfBlob = null

    try {
      if (pdfPreviewRef.value && pdfPreviewRef.value.generateAndSavePDF) {
        pdfBlob = await pdfPreviewRef.value.generateAndSavePDF()
        console.log('PDF Blob 생성 완료:', pdfBlob)
      }
    } catch (pdfError) {
      console.warn('PDF 생성 실패, 시험지만 저장합니다:', pdfError)
    }

    // examInfo에서 기본 정보 가져오기
    const examInfo = testBankStore.examInfo || {}

    // 시험지 저장 데이터 준비
    const examData = {
      // UserExam 기본 정보
      examName: examInfo.title || examInfo.examName || `${new Date().getFullYear()}년 ${examInfo.gradeName || '중2'} ${examInfo.areaName || '수학'} 시험지`,
      gradeCode: examInfo.gradeCode || '08',
      gradeName: examInfo.gradeName || '중2',
      termCode: examInfo.termCode || '1',
      termName: examInfo.termName || '1학기',
      areaCode: examInfo.areaCode || examInfo.subjectCode || 'MAT',
      areaName: examInfo.areaName || examInfo.subject || '수학',
      examType: 'TESTWIZARD',

      // 시험 설정 (사용자가 설정한 값 사용)
      visibility: examSettings.value.visibility,
      classId: examSettings.value.classId,
      timeLimit: examSettings.value.timeLimit,
      examDate: examSettings.value.examDate,
      description: examSettings.value.description ||
                   `${examInfo.gradeName || '중2'} ${examInfo.areaName || '수학'} ${examInfo.termName || '1학기'} 시험지`,
      totalPoints: examSettings.value.totalPoints,

      // 추가 옵션
      shuffleQuestions: examSettings.value.shuffleQuestions,
      showAnswerAfterSubmit: examSettings.value.showAnswerAfterSubmit,

      // items 테이블용 데이터 (백엔드 ExamItemRequest에 맞춤)
      items: selectedItems.value.map((item, index) => ({
        itemId: item.itemId || item.id,  // Item 테이블의 ID (필수)
        subjectId: item.subjectId || item.subject_id || null,  // 과목 ID 추가 (중요!)
        itemOrder: index + 1,  // 시험지 내 문제 순서
        points: item.points || 5  // 문제 배점
      }))
    }

    console.log('시험지 저장 데이터:', examData)

    // 2. FormData 생성 (PDF와 함께 전송)
    const formData = new FormData()
    // JSON 문자열로 직접 추가 (Blob 대신)
    formData.append('examData', JSON.stringify(examData))

    if (pdfBlob) {
      const fileName = `${examData.examName}_${new Date().toISOString().split('T')[0]}.pdf`
      formData.append('pdfFile', pdfBlob, fileName)
      console.log('PDF 파일 추가됨:', fileName)
    }

    // 3. API 호출 시도 - 실패 시 로컬 저장으로 대체
    let response = null

    try {
      console.log('API 호출 시작 - userExamApi.createExamWithPDF')
      response = await userExamApi.createExamWithPDF(formData)
      console.log('API 응답 받음:', response)

      if (response && response.data) {
        console.log('시험지 및 PDF 저장 성공:', response.data)
        examSavedId.value = response.data.id
      } else {
        throw new Error('응답 데이터가 없습니다')
      }
    } catch (apiError) {
      console.error('API 저장 실패:', apiError)
      console.error('에러 상세:', {
        message: apiError.message,
        response: apiError.response,
        status: apiError.response?.status,
        data: apiError.response?.data
      })

      // 로컬 스토리지에 저장
      const localExamData = {
        ...examData,
        id: `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        isLocal: true
      }

      // 기존 로컬 시험지 목록 가져오기
      const existingLocalExams = JSON.parse(localStorage.getItem('localExams') || '[]')
      existingLocalExams.push(localExamData)
      localStorage.setItem('localExams', JSON.stringify(existingLocalExams))

      examSavedId.value = localExamData.id
      response = { data: localExamData }
    }

    // 성공 메시지 (저장 방식에 따라 다르게)
    const isLocalSave = response.data.isLocal
    const successMessage = isLocalSave
      ? '시험지가 로컬에 임시 저장되었습니다. 나중에 서버에 동기화됩니다.'
      : pdfBlob
        ? '시험지가 PDF와 함께 성공적으로 저장되었습니다!'
        : '시험지가 성공적으로 저장되었습니다!'
    alert(successMessage)

    // store에 저장된 시험지 ID와 URL 저장
    testBankStore.setExamInfo({
      ...testBankStore.examInfo,
      savedExamId: response.data.id,
      pdfUrl: response.data.pdfUrl || null,
      savedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('시험지 저장 실패:', error)

    // 상세한 에러 메시지 처리
    let errorMessage = '시험지 저장 중 오류가 발생했습니다.'

    if (error.response) {
      // 서버 응답 에러
      if (error.response.status === 413) {
        errorMessage = 'PDF 파일이 너무 큽니다. 파일 크기를 줄여주세요.'
      } else if (error.response.status === 400) {
        errorMessage = error.response.data?.message || '요청 데이터가 올바르지 않습니다.'
      } else if (error.response.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      } else {
        errorMessage = error.response.data?.message || errorMessage
      }
    } else if (error.request) {
      // 네트워크 에러
      errorMessage = '네트워크 연결을 확인해주세요.'
    }

    alert(errorMessage)
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
  console.log('testBankStore.examInfo:', testBankStore.examInfo)
  console.log('itemSelectionStore.selectedItems:', itemSelectionStore.selectedItems)
  console.log('testBankStore.selectedItems:', testBankStore.selectedItems)
})

// 총점 변경 시 store에 반영하여 미리보기 헤더와 동기화
import { watch } from 'vue'
watch(() => examSettings.value.totalPoints, (val) => {
  const info = testBankStore.examInfo || {}
  testBankStore.setExamInfo({ ...info, totalPoints: val })
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
.btn-secondary,
.btn-success {
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

/* 메인 컨텐츠 레이아웃 */
.content-wrapper {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  overflow: hidden;
}

.pdf-preview-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  order: 2;
}

/* (제거됨) 미리보기 토글 스타일 */

.exam-settings-section {
  width: 420px;
  overflow-y: auto;
  padding-right: 1rem;
  order: 1;
}

/* 설정 카드 */
.settings-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.settings-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e0e6ed;
}

/* 설정 그룹 */
.setting-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #606f7b;
  margin-bottom: 0.5rem;
}

.setting-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
}

.setting-input:focus {
  outline: none;
  border-color: #2563eb;
}

.setting-textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.9375rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.setting-textarea:focus {
  outline: none;
  border-color: #2563eb;
}

/* 라디오 그룹 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
}

.radio-option:has(input:checked) {
  background: #f0f9ff;
  border-color: #2563eb;
}

.radio-option input[type="radio"] {
  margin-right: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.radio-label svg {
  color: #606f7b;
}

.radio-label small {
  display: block;
  margin-left: auto;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* 시간 입력 */
.time-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-suffix {
  color: #606f7b;
  font-size: 0.875rem;
}

.time-presets {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.preset-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  background: white;
  color: #606f7b;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
}

.preset-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

/* 체크박스 옵션 */
.checkbox-option {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  margin-right: 0.5rem;
}

.checkbox-option span {
  font-size: 0.875rem;
  color: #4a5568;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
  }

  .exam-settings-section {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
