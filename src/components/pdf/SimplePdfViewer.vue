<template>
  <div class="simple-pdf-viewer">
    <!-- PDF 미리보기/편집 영역 -->
    <div class="pdf-preview-section">
      <div class="preview-header">
        <h3>📄 시험지 미리보기</h3>
        <div class="preview-controls">
          <select v-model="selectedLayout" @change="updateLayout" class="layout-select">
            <option value="STANDARD">표준 (페이지당 4문제)</option>
            <option value="HALF_PAGE">반페이지 (페이지당 2문제)</option>
            <option value="SINGLE">한 페이지 한 문제</option>
            <option value="COMPACT">압축 (페이지당 6문제)</option>
          </select>
          <button @click="toggleEditMode" class="btn-edit">
            {{ isEditMode ? '미리보기 모드' : '편집 모드' }}
          </button>
          <button @click="generatePDF" class="btn-generate" :disabled="!canGenerate">
            PDF 생성
          </button>
        </div>
      </div>

      <div class="preview-body">
        <!-- 편집 모드 -->
        <div v-if="isEditMode" class="edit-mode">
          <div ref="designerContainer" class="designer-container"></div>
        </div>

        <!-- 미리보기 모드 -->
        <div v-else class="preview-mode">
          <!-- 페이지 네비게이션 -->
          <div class="page-navigation">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="page-btn"
            >
              ← 이전 페이지
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }} 페이지</span>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              다음 페이지 →
            </button>
          </div>

          <!-- 현재 페이지 -->
          <div class="exam-paper">
            <!-- 시험지 헤더 (첫 페이지에만) -->
            <div v-if="currentPage === 1" class="exam-header">
              <h2>{{ examTitle || '새 시험지' }}</h2>
              <div class="exam-info">
                <span>{{ examGrade }} {{ examSubject }}</span>
                <span v-if="examDate">{{ examDate }}</span>
                <span v-if="teacherName" class="teacher-name">{{ teacherName }} 선생님</span>
              </div>
              <div class="exam-student">
                <span class="student-label">이름:</span>
                <span class="student-name"></span>
              </div>
            </div>
            <!-- 첫 페이지가 아닌 경우 여백 -->
            <div v-else class="exam-header-spacer"></div>

            <!-- 현재 페이지의 문항들 -->
            <div :class="['questions-list', `layout-${selectedLayout.toLowerCase()}`]">
              <div
                v-for="(question, index) in currentPageQuestions"
                :key="question.id || question.globalIndex"
                class="question-item"
              >
                <div class="question-header">
                  <span class="question-number">{{ question.globalIndex + 1 }}</span>
                  <span class="question-chapter" v-if="question.topicChapter">{{ question.topicChapter }}</span>
                </div>
                <div class="question-content">
                  <!-- 이미지가 있는 경우 우선 표시 -->
                  <div v-if="question.imageUrl || question.questionImageUrl" class="question-image">
                    <img
                      :src="question.imageUrl || question.questionImageUrl"
                      :alt="`문제 ${question.globalIndex + 1}`"
                      @error="handleImageError"
                    />
                  </div>
                  <!-- 이미지가 없을 때만 텍스트 표시 -->
                  <div v-else-if="question.questionText" class="question-text">
                    {{ question.questionText }}
                  </div>
                  <div v-if="question.choices && question.choices.length" class="question-choices">
                    <div
                      v-for="(choice, idx) in question.choices"
                      :key="idx"
                      class="choice-item"
                    >
                      {{ getChoiceLabel(idx) }} {{ choice }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Designer } from '@pdfme/ui'
import { generate } from '@pdfme/generator'
import { text } from '@pdfme/schemas'
import { BLANK_PDF } from '@pdfme/common'

// Props
const props = defineProps({
  questions: {
    type: Array,
    default: () => []
  },
  examData: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['generate', 'save'])

// State
const isEditMode = ref(false)
const isLoading = ref(false)
const loadingMessage = ref('')
const designerContainer = ref(null)
const designer = ref(null)
const selectedLayout = ref('STANDARD')
const currentPage = ref(1)

// Computed
const examTitle = computed(() => props.examData?.title || '새 시험지')
const examGrade = computed(() => props.examData?.grade || '')
const examSubject = computed(() => props.examData?.subject || '')
const examDate = computed(() => props.examData?.date || '')
const canGenerate = computed(() => props.questions && props.questions.length > 0)

// examData 확인용 로그
console.log('examData from props:', props.examData)

// 선생님 이름 가져오기 (로그인한 사용자가 선생님)
const teacherName = computed(() => {
  try {
    const userInfo = localStorage.getItem('userInfo')
    console.log('localStorage userInfo raw:', userInfo)  // raw 데이터 로그

    if (userInfo) {
      const userData = JSON.parse(userInfo)
      console.log('Parsed userData:', userData)  // 파싱된 데이터 로그
      console.log('Available fields:', Object.keys(userData))  // 사용 가능한 필드들

      // 다양한 필드 체크
      const name = userData.fullName || userData.userName || userData.name || userData.teacherName || ''
      console.log('Selected teacher name:', name)  // 선택된 이름
      return name
    }
  } catch (e) {
    console.error('사용자 정보 로드 실패:', e)
  }
  return ''
})

// 레이아웃별 페이지당 문항 수
const questionsPerPage = computed(() => {
  const config = getLayoutConfig(selectedLayout.value)
  return config.questionsPerPage
})

// 전체 페이지 수
const totalPages = computed(() => {
  if (!props.questions || props.questions.length === 0) return 1
  return Math.ceil(props.questions.length / questionsPerPage.value)
})

// 현재 페이지의 문항들
const currentPageQuestions = computed(() => {
  if (!props.questions || props.questions.length === 0) return []

  const start = (currentPage.value - 1) * questionsPerPage.value
  const end = start + questionsPerPage.value

  return props.questions.slice(start, end).map((q, idx) => ({
    ...q,
    globalIndex: start + idx
  }))
})

// Methods
const getChoiceLabel = (index) => {
  const labels = ['①', '②', '③', '④', '⑤']
  return labels[index] || `${index + 1}.`
}

const handleImageError = (event) => {
  console.error('이미지 로드 실패:', event.target.src)
  event.target.style.display = 'none'
}

// 레이아웃 업데이트
const updateLayout = () => {
  console.log('레이아웃 변경:', selectedLayout.value)
  currentPage.value = 1  // 레이아웃 변경 시 첫 페이지로 이동
  if (isEditMode.value && designer.value) {
    initializeDesigner()
  }
}

// SVG를 PNG로 변환하는 더 나은 방법
const convertSvgToPng = async (svgUrl) => {
  return new Promise((resolve) => {
    // SVG를 fetch로 가져오기
    fetch('/api/proxy/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: svgUrl })
    })
    .then(response => response.json())
    .then(data => {
      if (data.base64) {
        // 백엔드에서 변환된 base64 반환
        resolve(data.base64)
      } else {
        throw new Error('백엔드 변환 실패')
      }
    })
    .catch(error => {
      console.error('SVG 변환 실패:', error)
      // 오류 시 빈 JPEG 이미지 반환
      resolve('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCABkAGQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD+/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Z')
    })
  })
}

// 이미지를 base64로 변환 (백엔드 프록시 활용)
const convertImageToBase64 = async (url) => {
  try {
    if (!url) return ''

    // 이미 base64인 경우
    if (url.startsWith('data:image')) {
      return url
    }

    console.log('이미지 변환 시작:', url)

    // SVG 파일인 경우 특별 처리
    if (url.includes('.svg')) {
      const pngBase64 = await convertSvgToPng(url)
      console.log('SVG->PNG 변환 완료')
      return pngBase64
    }

    // 일반 이미지는 백엔드 프록시를 통해 가져오기
    try {
      const response = await fetch('/api/proxy/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.base64) {
          console.log('이미지 프록시 변환 성공')
          return data.base64
        }
      }
    } catch (proxyError) {
      console.log('백엔드 프록시 실패:', proxyError)
    }

    // 실패 시 빈 JPEG 이미지 반환
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCABkAGQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD+/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Z'

  } catch (error) {
    console.error('이미지 변환 실패:', error)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
}

const toggleEditMode = async () => {
  isEditMode.value = !isEditMode.value

  if (isEditMode.value) {
    // 편집 모드 진입 시 Designer 초기화
    await initializeDesigner()
  } else {
    // 미리보기 모드로 전환 시 Designer 정리
    if (designer.value) {
      designer.value.destroy()
      designer.value = null
    }
  }
}

// 레이아웃별 설정값
const getLayoutConfig = (layout) => {
  switch(layout) {
    case 'SINGLE':
      return { columns: 1, questionsPerPage: 1, width: 170, height: 200 }
    case 'HALF_PAGE':
      return { columns: 1, questionsPerPage: 2, width: 170, height: 120 }
    case 'STANDARD':
      return { columns: 2, questionsPerPage: 4, width: 80, height: 100 }
    case 'COMPACT':
      return { columns: 2, questionsPerPage: 6, width: 80, height: 70 }
    default:
      return { columns: 2, questionsPerPage: 4, width: 80, height: 100 }
  }
}

// 문항 위치 계산
const getQuestionPosition = (index, layout) => {
  const config = getLayoutConfig(layout)
  const col = index % config.columns
  const row = Math.floor(index / config.columns)

  let x = 20
  let y = 45

  if (config.columns === 2) {
    x = col === 0 ? 20 : 110
    y = 45 + (row * (config.height + 10))
  } else {
    y = 45 + (index * (config.height + 10))
  }

  return { x, y }
}

// 레이아웃별 템플릿 생성
const createLayoutTemplate = () => {
  const layout = selectedLayout.value
  const config = getLayoutConfig(layout)
  const schemas = [
    {
      name: 'title',
      type: 'text',
      position: { x: 20, y: 10 },
      width: 170,
      height: 15,
      fontSize: 16,
      alignment: 'center'
    },
    {
      name: 'subtitle',
      type: 'text',
      position: { x: 20, y: 25 },
      width: 170,
      height: 10,
      fontSize: 12,
      alignment: 'center'
    }
  ]

  // 문항별로 텍스트 스키마만 추가 (이미지도 일단 텍스트로 처리)
  props.questions.forEach((question, index) => {
    const position = getQuestionPosition(index, layout)

    // 모든 문항을 일단 텍스트로 처리
    schemas.push({
      name: `question_${index}`,
      type: 'text',
      position: position,
      width: config.width,
      height: config.height,
      fontSize: 11
    })
  })

  return {
    basePdf: BLANK_PDF,
    schemas: [schemas]
  }
}

// Designer 초기화
const initializeDesigner = async () => {
  if (!designerContainer.value) {
    console.error('Designer container not found')
    return
  }

  try {
    isLoading.value = true
    loadingMessage.value = 'PDF 편집기 초기화 중...'

    // 템플릿 생성
    const template = createLayoutTemplate()

    // 입력 데이터 생성 (이미지 base64 변환)
    const inputData = {
      title: examTitle.value,
      subtitle: `${examGrade.value} ${examSubject.value}`
    }

    // 각 문항에 대한 데이터 추가 (모두 텍스트로 처리)
    for (let i = 0; i < props.questions.length; i++) {
      const question = props.questions[i]
      const hasImage = question.imageUrl || question.questionImageUrl

      // 모든 문항을 텍스트로 처리
      if (hasImage) {
        inputData[`question_${i}`] = `문제 ${i + 1}. [이미지 문제]\n${question.questionText || ''}`
      } else {
        inputData[`question_${i}`] = `문제 ${i + 1}. ${question.questionText || ''}`
      }
    }

    console.log('최종 inputData:', inputData)

    const inputs = [inputData]

    // Designer 생성
    designer.value = new Designer({
      domContainer: designerContainer.value,
      template,
      inputs,
      options: {
        lang: 'ko'
      },
      plugins: {
        text: text
      }
    })

    isLoading.value = false
  } catch (error) {
    console.error('Designer 초기화 실패:', error)
    isLoading.value = false
    alert('PDF 편집기 초기화에 실패했습니다.')
  }
}

// PDF 생성
const generatePDF = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'PDF 생성 중...'

    let template, inputs

    // 입력 데이터 생성 (이미지 base64 변환)
    const inputData = {
      title: examTitle.value,
      subtitle: `${examGrade.value} ${examSubject.value}`
    }

    // 각 문항에 대한 데이터 추가 (모두 텍스트로 처리)
    for (let i = 0; i < props.questions.length; i++) {
      const question = props.questions[i]
      const hasImage = question.imageUrl || question.questionImageUrl

      // 모든 문항을 텍스트로 처리
      if (hasImage) {
        inputData[`question_${i}`] = `문제 ${i + 1}. [이미지 문제]\n${question.questionText || ''}`
      } else {
        inputData[`question_${i}`] = `문제 ${i + 1}. ${question.questionText || ''}`
      }
    }

    console.log('최종 inputData:', inputData)

    if (designer.value) {
      // Designer에서 템플릿 가져오기
      template = designer.value.getTemplate()
    } else {
      // 기본 템플릿 사용
      template = createLayoutTemplate()
    }

    inputs = [inputData]

    // PDF 생성
    const pdf = await generate({
      template,
      inputs,
      plugins: {
        text: text
      }
    })

    // Blob 생성
    const blob = new Blob([pdf.buffer || pdf], { type: 'application/pdf' })

    // 다운로드
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${examTitle.value}_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    isLoading.value = false
    emit('generate', blob)
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    isLoading.value = false
    alert('PDF 생성에 실패했습니다: ' + error.message)
  }
}

// Lifecycle
onUnmounted(() => {
  if (designer.value) {
    designer.value.destroy()
  }
})
</script>

<style scoped>
.simple-pdf-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.preview-controls {
  display: flex;
  gap: 0.5rem;
}

.layout-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.layout-select:hover {
  border-color: #9ca3af;
}

.layout-select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.btn-edit,
.btn-generate {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-edit {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-edit:hover {
  background: #e5e7eb;
}

.btn-generate {
  background: #4CAF50;
  color: white;
}

.btn-generate:hover:not(:disabled) {
  background: #45a049;
}

.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
  background: #f9fafb;
}

/* 편집 모드 */
.edit-mode {
  height: 100%;
}

.designer-container {
  width: 100%;
  height: 600px;
  min-height: 400px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

/* 미리보기 모드 */
.preview-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #e5e7eb;
  min-height: 100%;
}

/* 페이지 네비게이션 */
.page-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: #4b5563;
  min-width: 100px;
  text-align: center;
}

/* A4 용지 스타일 */
.exam-paper {
  /* A4 크기: 210mm x 297mm */
  width: 210mm;
  min-height: 297mm;
  max-height: 297mm;
  padding: 20mm 15mm;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;

  /* 인쇄 시 실제 크기 유지 */
  transform-origin: top center;

  /* 화면 크기에 따라 스케일 조정 */
  @media (max-width: 900px) {
    transform: scale(0.7);
    margin-bottom: -100mm;
  }

  @media (max-width: 700px) {
    transform: scale(0.5);
    margin-bottom: -150mm;
  }
}

.exam-header {
  text-align: center;
  margin-bottom: 25mm;
  padding-bottom: 5mm;
  border-bottom: 2px solid #1f2937;
}

.exam-header h2 {
  margin: 0 0 3mm 0;
  font-size: 18pt;
  font-weight: 700;
  color: #1f2937;
}

.exam-info {
  display: flex;
  justify-content: center;
  gap: 10mm;
  color: #4b5563;
  font-size: 11pt;
  margin-bottom: 3mm;
}

.teacher-name {
  color: #1f2937;
  font-weight: 600;
}

.exam-student {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 3mm;
  margin-top: 5mm;
  padding-top: 3mm;
  border-top: 1px solid #e5e7eb;
}

.student-label {
  font-size: 10pt;
  color: #6b7280;
  font-weight: 500;
}

.student-name {
  display: inline-block;
  width: 40mm;
  height: 5mm;
  border-bottom: 1px solid #374151;
}

/* 첫 페이지가 아닌 경우 헤더 공간 */
.exam-header-spacer {
  height: 15mm;
  margin-bottom: 10mm;
}

.questions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

/* 표준 레이아웃 - 2x2 그리드 */
.questions-list.layout-standard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10mm;
  height: auto;
  min-height: calc(297mm - 40mm - 80mm); /* A4 높이 - 패딩 - 헤더 */
}

.questions-list.layout-standard .question-item {
  max-width: 85mm;
  height: auto;
  min-height: 60mm;
}

/* 반페이지 레이아웃 - 세로 2개 */
.questions-list.layout-half_page {
  display: flex;
  flex-direction: column;
  gap: 15mm;
  height: auto;
  min-height: calc(297mm - 40mm - 80mm);
}

.questions-list.layout-half_page .question-item {
  width: 100%;
  height: auto;
  min-height: 80mm;
}

/* 단일 레이아웃 - 한 페이지 한 문제 */
.questions-list.layout-single {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: calc(297mm - 40mm - 80mm);
}

.questions-list.layout-single .question-item {
  width: 100%;
  height: auto;
  min-height: 150mm;
}

/* 압축 레이아웃 - 2x3 그리드 */
.questions-list.layout-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8mm;
  height: auto;
  min-height: calc(297mm - 40mm - 80mm);
}

.questions-list.layout-compact .question-item {
  max-width: 85mm;
  height: auto;
  min-height: 45mm;
}

.question-item {
  display: flex;
  flex-direction: column;
  gap: 2mm;
  padding: 5mm;
  border: 1px solid #d1d5db;
  border-radius: 2mm;
  overflow: visible; /* 이미지가 잘리지 않도록 */
  height: auto; /* 내용에 맞춰 높이 자동 조정 */
  min-height: 40mm; /* 최소 높이 보장 */
}

.question-header {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin-bottom: 2mm;
}

.question-number {
  font-weight: 700;
  color: #1f2937;
  font-size: 11pt;
  min-width: 8mm;
}

.question-chapter {
  font-weight: 500;
  color: #6b7280;
  font-size: 9pt;
  padding: 1mm 3mm;
  background: #f3f4f6;
  border-radius: 2mm;
}

.question-content {
  flex: 1;
  overflow: hidden;
}

.question-text {
  margin-bottom: 3mm;
  line-height: 1.5;
  font-size: 10pt;
  color: #1f2937;
}

.question-image {
  margin-bottom: 5mm;
  text-align: left; /* 왼쪽 정렬 */
}

.question-image img {
  width: auto;
  height: auto;
  max-width: 100%;
  display: inline-block;
  object-fit: contain;
}

/* 레이아웃별 이미지 크기 조정 (A4 기준) - 이미지 원본 비율 유지 */
.layout-standard .question-image img {
  max-width: 75mm; /* 좌우 여백 고려 */
  max-height: none; /* 높이는 자동 */
}

.layout-half_page .question-image img {
  max-width: 160mm; /* 좌우 여백 고려 */
  max-height: none; /* 높이는 자동 */
}

.layout-single .question-image img {
  max-width: 170mm; /* 좌우 여백 고려 */
  max-height: none; /* 높이는 자동 */
}

.layout-compact .question-image img {
  max-width: 75mm; /* 좌우 여백 고려 */
  max-height: none; /* 높이는 자동 */
}

.question-choices {
  display: flex;
  flex-direction: column;
  gap: 2mm;
  margin-left: 5mm;
  margin-top: 3mm;
}

.choice-item {
  line-height: 1.4;
  font-size: 10pt;
  color: #374151;
}

/* 로딩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 1rem;
  color: white;
  font-size: 0.875rem;
}

/* PDFMe Designer 스타일 오버라이드 */
:deep(.pdfme-designer) {
  height: 100%;
}

:deep(.pdfme-designer-sidebar) {
  background: white;
}

:deep(.pdfme-designer-canvas) {
  background: #f5f5f5;
}
</style>
