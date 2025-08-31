<template>
  <div class="pdf-test-container">
    <div class="test-header">
      <h1>PDF 생성 테스트 페이지</h1>
      <p>PDFMe를 사용한 시험지 PDF 생성 테스트</p>
    </div>

    <div class="test-content">
      <!-- 시험 정보 입력 -->
      <div class="test-section">
        <h2>1. 시험 정보 입력</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>시험지 제목</label>
            <input v-model="examData.title" type="text" placeholder="2024학년도 1학기 중간고사">
          </div>
          <div class="form-group">
            <label>학교명</label>
            <input v-model="examData.schoolName" type="text" placeholder="○○중학교">
          </div>
          <div class="form-group">
            <label>학년</label>
            <input v-model="examData.grade" type="text" placeholder="2학년">
          </div>
          <div class="form-group">
            <label>과목</label>
            <input v-model="examData.subject" type="text" placeholder="수학">
          </div>
          <div class="form-group">
            <label>출제자</label>
            <input v-model="examData.teacherName" type="text" placeholder="홍길동">
          </div>
          <div class="form-group">
            <label>제한시간(분)</label>
            <input v-model.number="examData.timeLimit" type="number" placeholder="50">
          </div>
        </div>
        
        <div class="options">
          <label>
            <input v-model="examData.includeAnswer" type="checkbox">
            정답 포함
          </label>
          <label>
            <input v-model="examData.includeExplanation" type="checkbox">
            해설 포함
          </label>
          <label>
            <input v-model="examData.shuffleQuestions" type="checkbox">
            문제 순서 섞기
          </label>
        </div>
      </div>

      <!-- 샘플 문항 -->
      <div class="test-section">
        <h2>2. 샘플 문항 ({{ sampleQuestions.length }}개)</h2>
        <div class="question-list">
          <div v-for="(q, index) in sampleQuestions" :key="index" class="question-item">
            <h4>문제 {{ index + 1 }}</h4>
            <p>{{ q.questionText }}</p>
            <div v-if="q.choices.length > 0" class="choices">
              <div v-for="(choice, i) in q.choices" :key="i">
                {{ ['①', '②', '③', '④', '⑤'][i] }} {{ choice }}
              </div>
            </div>
            <div v-if="examData.includeAnswer" class="answer">
              정답: {{ q.answer }}
            </div>
            <div v-if="examData.includeExplanation && q.explanation" class="explanation">
              해설: {{ q.explanation }}
            </div>
          </div>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="test-actions">
        <button @click="generateBasicPDF" class="btn btn-primary">
          기본 PDF 생성
        </button>
        <button @click="generateWithAnswerPDF" class="btn btn-secondary">
          정답 포함 PDF 생성
        </button>
        <button @click="generateWithExplanationPDF" class="btn btn-secondary">
          해설 포함 PDF 생성
        </button>
        <button @click="previewPDF" class="btn btn-info">
          미리보기
        </button>
        <button @click="generateAllVersions" class="btn btn-success">
          모든 버전 생성
        </button>
      </div>

      <!-- 상태 메시지 -->
      <div v-if="statusMessage" class="status-message" :class="statusClass">
        {{ statusMessage }}
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
import { ref, onMounted } from 'vue'
import * as pdfGenerator from '@/services/pdfGenerator'
import { getPDFMeFont } from '@/utils/pdfmeFonts'

// 상태
const isLoading = ref(false)
const loadingMessage = ref('')
const statusMessage = ref('')
const statusClass = ref('')

// 시험 데이터
const examData = ref({
  title: '2024학년도 1학기 중간고사',
  subtitle: '수학 평가',
  schoolName: '테스트중학교',
  grade: '2학년',
  subject: '수학',
  teacherName: '김선생',
  date: new Date().toISOString().split('T')[0],
  timeLimit: 50,
  includeAnswer: false,
  includeExplanation: false,
  shuffleQuestions: false,
  showPoints: true
})

// 샘플 문항
const sampleQuestions = ref([
  {
    questionText: '다음 중 가장 큰 수는?',
    choices: ['15', '23', '8', '19'],
    answer: '②',
    explanation: '23이 주어진 수 중에서 가장 큰 수입니다.',
    imageUrl: '',
    points: 5
  },
  {
    questionText: '2 + 3 × 4의 값은?',
    choices: ['20', '14', '12', '10'],
    answer: '②',
    explanation: '곱셈을 먼저 계산하고 덧셈을 나중에 합니다. 3×4=12, 2+12=14',
    imageUrl: '',
    points: 5
  },
  {
    questionText: '다음 도형 중 정사각형의 특징이 아닌 것은?',
    choices: [
      '네 변의 길이가 모두 같다',
      '네 각이 모두 직각이다',
      '대각선의 길이가 다르다',
      '두 대각선이 서로 수직이다'
    ],
    answer: '③',
    explanation: '정사각형의 대각선은 길이가 같습니다.',
    imageUrl: '',
    points: 5
  },
  {
    questionText: '원의 넓이를 구하는 공식은?',
    choices: ['πr', 'πr²', '2πr', 'πr³'],
    answer: '②',
    explanation: '원의 넓이 = π × 반지름²',
    imageUrl: '',
    points: 5
  },
  {
    questionText: '다음 분수를 소수로 나타내면? 3/4',
    choices: ['0.34', '0.75', '0.43', '0.25'],
    answer: '②',
    explanation: '3÷4 = 0.75',
    imageUrl: '',
    points: 5
  }
])

// 마운트 시 한글 폰트 프리로드
onMounted(async () => {
  statusMessage.value = '한글 폰트를 로딩중입니다...'
  statusClass.value = 'info'
  
  try {
    const font = await getPDFMeFont()
    console.log('로드된 폰트:', font)
    statusMessage.value = '한글 폰트 로딩 완료!'
    statusClass.value = 'success'
    setTimeout(() => {
      statusMessage.value = ''
    }, 2000)
  } catch (error) {
    statusMessage.value = '한글 폰트 로딩 실패: ' + error.message
    statusClass.value = 'error'
  }
})

// 기본 PDF 생성
const generateBasicPDF = async () => {
  isLoading.value = true
  loadingMessage.value = '기본 PDF를 생성하는 중...'
  
  try {
    const pdfBlob = await pdfGenerator.generateExamPDF(
      examData.value,
      sampleQuestions.value,
      'basic'
    )
    
    const filename = `${examData.value.title}_기본.pdf`
    pdfGenerator.downloadPDF(pdfBlob, filename)
    
    statusMessage.value = '기본 PDF 생성 완료!'
    statusClass.value = 'success'
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    statusMessage.value = 'PDF 생성 실패: ' + error.message
    statusClass.value = 'error'
  } finally {
    isLoading.value = false
  }
}

// 정답 포함 PDF 생성
const generateWithAnswerPDF = async () => {
  isLoading.value = true
  loadingMessage.value = '정답 포함 PDF를 생성하는 중...'
  
  try {
    const pdfBlob = await pdfGenerator.generateExamPDF(
      { ...examData.value, includeAnswer: true },
      sampleQuestions.value,
      'withAnswer'
    )
    
    const filename = `${examData.value.title}_정답포함.pdf`
    pdfGenerator.downloadPDF(pdfBlob, filename)
    
    statusMessage.value = '정답 포함 PDF 생성 완료!'
    statusClass.value = 'success'
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    statusMessage.value = 'PDF 생성 실패: ' + error.message
    statusClass.value = 'error'
  } finally {
    isLoading.value = false
  }
}

// 해설 포함 PDF 생성
const generateWithExplanationPDF = async () => {
  isLoading.value = true
  loadingMessage.value = '해설 포함 PDF를 생성하는 중...'
  
  try {
    const pdfBlob = await pdfGenerator.generateExamPDF(
      { ...examData.value, includeAnswer: true, includeExplanation: true },
      sampleQuestions.value,
      'withExplanation'
    )
    
    const filename = `${examData.value.title}_해설포함.pdf`
    pdfGenerator.downloadPDF(pdfBlob, filename)
    
    statusMessage.value = '해설 포함 PDF 생성 완료!'
    statusClass.value = 'success'
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    statusMessage.value = 'PDF 생성 실패: ' + error.message
    statusClass.value = 'error'
  } finally {
    isLoading.value = false
  }
}

// PDF 미리보기
const previewPDF = async () => {
  isLoading.value = true
  loadingMessage.value = 'PDF 미리보기를 준비중...'
  
  try {
    const pdfBlob = await pdfGenerator.generateExamPDF(
      examData.value,
      sampleQuestions.value,
      examData.value.includeExplanation ? 'withExplanation' : 
      examData.value.includeAnswer ? 'withAnswer' : 'basic'
    )
    
    pdfGenerator.previewPDF(pdfBlob)
    
    statusMessage.value = '미리보기 창이 열렸습니다!'
    statusClass.value = 'success'
  } catch (error) {
    console.error('미리보기 실패:', error)
    statusMessage.value = '미리보기 실패: ' + error.message
    statusClass.value = 'error'
  } finally {
    isLoading.value = false
  }
}

// 모든 버전 생성
const generateAllVersions = async () => {
  isLoading.value = true
  loadingMessage.value = '모든 버전의 PDF를 생성하는 중...'
  
  try {
    const results = await pdfGenerator.generateAllVersions(
      examData.value,
      sampleQuestions.value
    )
    
    // 각 버전 다운로드
    if (results.basic) {
      pdfGenerator.downloadPDF(results.basic, `${examData.value.title}_기본.pdf`)
    }
    if (results.withAnswer) {
      pdfGenerator.downloadPDF(results.withAnswer, `${examData.value.title}_정답포함.pdf`)
    }
    if (results.withExplanation) {
      pdfGenerator.downloadPDF(results.withExplanation, `${examData.value.title}_해설포함.pdf`)
    }
    
    statusMessage.value = '모든 버전 생성 완료!'
    statusClass.value = 'success'
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    statusMessage.value = 'PDF 생성 실패: ' + error.message
    statusClass.value = 'error'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.pdf-test-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 3rem;
}

.test-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.test-header p {
  color: #6c757d;
}

.test-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-section h2 {
  color: #495057;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.25rem;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.options {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

.options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.question-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.question-item {
  background: white;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.question-item h4 {
  color: #495057;
  margin-bottom: 0.5rem;
}

.choices {
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.choices div {
  padding: 0.25rem 0;
}

.answer {
  color: #dc3545;
  font-weight: bold;
  margin-top: 0.5rem;
}

.explanation {
  color: #6c757d;
  font-style: italic;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.test-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #117a8b;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.status-message {
  text-align: center;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-overlay p {
  color: white;
  margin-top: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>