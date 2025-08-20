<template>
  <div class="pdf-designer-container">
    <!-- 헤더 -->
    <div class="designer-header">
      <div class="header-left">
        <button class="btn-back" @click="$emit('close')">
          <span class="icon">←</span> 돌아가기
        </button>
        <h3>PDF 편집기</h3>
      </div>
      <div class="header-right">
        <button class="btn-action" @click="saveTemplate">
          <span class="icon">💾</span> 템플릿 저장
        </button>
        <button class="btn-primary" @click="generatePDF">
          <span class="icon">📄</span> PDF 생성
        </button>
      </div>
    </div>

    <!-- PDFMe Designer 컨테이너 -->
    <div ref="designerContainer" class="designer-container"></div>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Designer } from '@pdfme/ui'
import { generate } from '@pdfme/generator'
import { getPDFMeFont } from '@/utils/pdfmeFonts'
import { BLANK_PDF } from '@pdfme/common'
// 스키마는 전체 모듈로 import
import * as schemas from '@pdfme/schemas'

// Props
const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  examData: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'save', 'generate'])

// Refs
const designerContainer = ref(null)
const designer = ref(null)
const isLoading = ref(false)
const loadingMessage = ref('')

// 문제를 이미지로 변환 (HTML to Canvas)
const questionToImage = async (question) => {
  const html2canvas = (await import('html2canvas')).default
  
  // 임시 div 생성
  const tempDiv = document.createElement('div')
  tempDiv.style.position = 'absolute'
  tempDiv.style.left = '-9999px'
  tempDiv.style.width = '600px'
  tempDiv.style.padding = '20px'
  tempDiv.style.backgroundColor = 'white'
  tempDiv.style.fontFamily = 'Noto Sans KR, sans-serif'
  
  // 문제 HTML 생성
  tempDiv.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px;">
        문제 ${question.questionNumber}
      </h3>
      <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
        ${question.questionText}
      </p>
      ${question.choices && question.choices.length > 0 ? `
        <div style="margin-left: 20px; font-size: 13px; line-height: 1.8;">
          ${question.choices.map((choice, i) => `
            <div>${['①', '②', '③', '④', '⑤'][i]} ${choice}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `
  
  document.body.appendChild(tempDiv)
  
  try {
    // HTML을 Canvas로 변환
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      backgroundColor: '#ffffff'
    })
    
    // Canvas를 Base64로 변환
    const base64 = canvas.toDataURL('image/png')
    
    return base64
  } finally {
    // 임시 div 제거
    document.body.removeChild(tempDiv)
  }
}

// 초기 템플릿 생성
const createInitialTemplate = async () => {
  // PDFMe Designer는 단일 페이지 스키마 배열을 사용
  const schema = []
  
  // 페이지 제목
  schema.push({
    name: 'title',
    type: 'text',
    position: { x: 20, y: 10 },
    width: 170,
    height: 15,
    fontSize: 18,
    alignment: 'center',
    fontName: 'NotoSansKR'
  })
  
  schema.push({
    name: 'subtitle',
    type: 'text',
    position: { x: 20, y: 28 },
    width: 170,
    height: 10,
    fontSize: 12,
    alignment: 'center',
    fontName: 'NotoSansKR'
  })
  
  // 문제 이미지 추가 (첫 2문제만 Designer에서 편집)
  for (let i = 0; i < Math.min(2, props.questions.length); i++) {
    const yPosition = 50 + (i * 120)
    
    schema.push({
      name: `question_${i}`,
      type: 'image',
      position: { x: 15, y: yPosition },
      width: 180,
      height: 100
    })
  }
  
  return {
    basePdf: BLANK_PDF,
    schemas: [schema]  // 단일 스키마 배열
  }
}

// 입력 데이터 생성
const createInputData = async () => {
  isLoading.value = true
  loadingMessage.value = '문제를 이미지로 변환 중...'
  
  const input = {}
  
  // 제목 정보
  input['title'] = props.examData.title || '시험지'
  input['subtitle'] = `${props.examData.grade || ''} ${props.examData.subject || ''}`
  
  // 첫 2문제만 이미지로 변환 (Designer에서 편집)
  for (let i = 0; i < Math.min(2, props.questions.length); i++) {
    const imageData = await questionToImage(props.questions[i])
    input[`question_${i}`] = imageData
  }
  
  isLoading.value = false
  
  return [input]  // 배열로 반환하지만 단일 객체만 포함
}

// Designer 초기화
const initializeDesigner = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'PDF 편집기 초기화 중...'
    
    // 폰트 로드
    const font = await getPDFMeFont()
    
    // 템플릿 생성
    const template = await createInitialTemplate()
    
    // 입력 데이터 생성 (배열의 첫 번째 요소만 사용)
    const inputsArray = await createInputData()
    const inputs = inputsArray[0] || {}
    
    console.log('Designer 초기화 - template:', template)
    console.log('Designer 초기화 - inputs:', inputs)
    console.log('Designer 초기화 - font:', font)
    
    // Designer 생성
    designer.value = new Designer({
      domContainer: designerContainer.value,
      template: template,
      input: inputs,  // 'input'으로 변경 (단수형)
      options: {
        font: font,
        lang: 'ko'
      },
      plugins: {
        text: schemas.text,
        image: schemas.image
      }
    })
    
    isLoading.value = false
  } catch (error) {
    console.error('Designer 초기화 실패:', error)
    alert('PDF 편집기 초기화에 실패했습니다: ' + error.message)
    isLoading.value = false
  }
}

// 템플릿 저장
const saveTemplate = () => {
  if (!designer.value) return
  
  const template = designer.value.getTemplate()
  console.log('저장된 템플릿:', template)
  
  // localStorage에 저장
  localStorage.setItem('examPdfTemplate', JSON.stringify(template))
  
  emit('save', template)
  alert('템플릿이 저장되었습니다.')
}

// PDF 생성
const generatePDF = async () => {
  if (!designer.value) return
  
  try {
    isLoading.value = true
    loadingMessage.value = 'PDF 생성 중...'
    
    const template = designer.value.getTemplate()
    const inputsArray = await createInputData()
    const font = await getPDFMeFont()
    
    const pdf = await generate({
      template: template,
      inputs: inputsArray,  // 배열로 전달
      options: {
        font: font
      }
    })
    
    // Blob 생성 및 다운로드
    const blob = new Blob([pdf.buffer || pdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.examData.title || '시험지'}_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    isLoading.value = false
    emit('generate', blob)
    alert('PDF가 생성되었습니다.')
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    alert('PDF 생성에 실패했습니다: ' + error.message)
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  console.log('PdfDesigner mounted')
  console.log('Props questions:', props.questions)
  console.log('Props examData:', props.examData)
  initializeDesigner()
})

onUnmounted(() => {
  if (designer.value) {
    designer.value.destroy()
  }
})

// Props 변경 감지
watch(() => props.questions, () => {
  if (designer.value) {
    initializeDesigner()
  }
}, { deep: true })
</script>

<style scoped>
.pdf-designer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 10px;
}

.btn-back {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f5f5f5;
}

.btn-action {
  padding: 8px 16px;
  background: white;
  border: 1px solid #4CAF50;
  color: #4CAF50;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #4CAF50;
  color: white;
}

.btn-primary {
  padding: 8px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.designer-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 20px;
  font-size: 16px;
  color: #666;
}

.icon {
  font-size: 16px;
}

/* PDFMe Designer 스타일 오버라이드 */
:deep(.pdfme-designer) {
  height: 100%;
}

:deep(.pdfme-designer-sidebar) {
  background: white;
  border-right: 1px solid #e0e0e0;
}

:deep(.pdfme-designer-canvas) {
  background: #f5f5f5;
}
</style>