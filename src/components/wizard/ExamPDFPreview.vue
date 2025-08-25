<template>
  <div class="exam-pdf-preview">
    <!-- Header with Controls -->
    <div class="preview-header">
      <div class="header-left">
        <h2 class="preview-title">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 18V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 15L12 12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          시험지 미리보기
        </h2>
        <div class="exam-info">
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M3 9H21" stroke="currentColor" stroke-width="2"/>
            </svg>
            {{ currentPageQuestions.length }}문항
          </span>
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M4 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            {{ totalPages }}페이지
          </span>
        </div>
      </div>

      <div class="header-controls">
        <!-- Layout Toggle -->
        <div class="layout-toggle">
          <button 
            @click="layoutMode = 'single'" 
            :class="['layout-btn', { active: layoutMode === 'single' }]"
            title="1열 레이아웃"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button 
            @click="layoutMode = 'double'" 
            :class="['layout-btn', { active: layoutMode === 'double' }]"
            title="2열 레이아웃"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M12 4V20" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <button @click="decreaseZoom" class="zoom-btn" :disabled="zoomLevel <= 50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <span class="zoom-level">{{ zoomLevel }}%</span>
          <button @click="increaseZoom" class="zoom-btn" :disabled="zoomLevel >= 150">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="toggleSettings" class="btn-icon" title="설정">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 1V6M12 18V23M4.22 4.22L6.34 6.34M17.66 17.66L19.78 19.78M1 12H6M18 12H23M4.22 19.78L6.34 17.66M17.66 6.34L19.78 4.22" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button @click="downloadPDF" class="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2V12M12 12L8 8M12 12L16 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <path d="M3 12V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            PDF 다운로드
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="preview-body">
      <!-- Settings Sidebar -->
      <transition name="slide">
        <div v-if="showSettings" class="settings-sidebar">
          <div class="settings-header">
            <h3>출력 설정</h3>
            <button @click="toggleSettings" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="settings-content">
            <!-- 시험지 정보 -->
            <div class="settings-section">
              <h4>시험지 정보</h4>
              <div class="form-field">
                <label>제목</label>
                <input 
                  v-model="examSettings.title" 
                  type="text" 
                  placeholder="2024학년도 1학기 중간고사"
                />
              </div>
              <div class="form-field">
                <label>과목</label>
                <input 
                  v-model="examSettings.subject" 
                  type="text" 
                  placeholder="수학"
                />
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label>시험 시간</label>
                  <select v-model="examSettings.duration">
                    <option value="40">40분</option>
                    <option value="50">50분</option>
                    <option value="60">60분</option>
                    <option value="90">90분</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>총점</label>
                  <input 
                    v-model.number="examSettings.totalScore" 
                    type="number" 
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            <!-- 출력 옵션 -->
            <div class="settings-section">
              <h4>출력 옵션</h4>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="printOptions.showAnswers" />
                  <span>정답 표시</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="printOptions.showPoints" />
                  <span>배점 표시</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="printOptions.showStudentInfo" />
                  <span>학생 정보란</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="printOptions.showPageNumbers" />
                  <span>페이지 번호</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="printOptions.showInstructions" />
                  <span>응시 안내</span>
                </label>
              </div>
            </div>

            <!-- 문제 그룹핑 -->
            <div class="settings-section">
              <h4>문제 그룹핑</h4>
              <div class="radio-group">
                <label class="radio-item">
                  <input type="radio" v-model="groupingMode" value="none" />
                  <span>그룹 없음</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="groupingMode" value="passage" />
                  <span>지문별 그룹</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="groupingMode" value="type" />
                  <span>문제 유형별</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- PDF Preview Area -->
      <div class="preview-container" :style="{ transform: `scale(${zoomLevel / 100})` }">
        <!-- Page Navigation -->
        <div class="page-navigation">
          <button 
            @click="previousPage" 
            :disabled="currentPage === 1"
            class="nav-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="page-info">
            <span>{{ currentPage }}</span>
            <span class="separator">/</span>
            <span>{{ totalPages }}</span>
          </div>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="nav-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- A4 Paper Preview -->
        <div class="a4-paper" :class="`layout-${layoutMode}`">
          <!-- Page Header (First Page Only) -->
          <div v-if="currentPage === 1" class="paper-header">
            <div class="exam-title-section">
              <h1>{{ examSettings.title || '시험지' }}</h1>
              <div class="exam-meta">
                <span v-if="examSettings.subject">과목: {{ examSettings.subject }}</span>
                <span v-if="examSettings.duration">시간: {{ examSettings.duration }}분</span>
                <span v-if="examSettings.totalScore">총점: {{ examSettings.totalScore }}점</span>
              </div>
            </div>

            <!-- Student Info Section -->
            <div v-if="printOptions.showStudentInfo" class="student-info-section">
              <div class="info-grid">
                <div class="info-field">
                  <label>학교</label>
                  <div class="fill-line"></div>
                </div>
                <div class="info-field">
                  <label>학년/반</label>
                  <div class="fill-line"></div>
                </div>
                <div class="info-field">
                  <label>번호</label>
                  <div class="fill-line"></div>
                </div>
                <div class="info-field">
                  <label>이름</label>
                  <div class="fill-line"></div>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div v-if="printOptions.showInstructions" class="instructions-section">
              <h3>※ 응시자 유의사항</h3>
              <ol>
                <li>문제를 잘 읽고 답안을 작성하시오.</li>
                <li>답안은 반드시 검은색 펜으로 작성하시오.</li>
                <li>수정 시 수정테이프 사용 가능합니다.</li>
                <li>문제지를 훼손하지 마시오.</li>
              </ol>
            </div>
          </div>

          <!-- Questions Container with CSS Columns -->
          <div class="questions-container" :class="`columns-${layoutMode === 'single' ? '1' : '2'}`">
            <!-- 지문이 있는 경우 -->
            <template v-for="group in currentPageGroups" :key="group.id">
              <div v-if="group.passageId && groupingMode === 'passage'" class="passage-group">
                <div class="passage-header">
                  <span class="passage-label">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </span>
                </div>
                <div class="passage-content" v-html="sanitizeAndRenderHtml(group.passageHtml)"></div>
                
                <!-- 지문 관련 문제들 -->
                <div v-for="question in group.questions" :key="question.id" class="question-item">
                  <div class="question-number">
                    {{ question.displayNumber }}.
                    <span v-if="printOptions.showPoints" class="points">({{ question.points }}점)</span>
                  </div>
                  <div class="question-content">
                    <div class="question-text" v-html="sanitizeAndRenderHtml(question.questionHtml)"></div>
                    
                    <!-- 보기 -->
                    <div v-if="question.choices && question.choices.length" class="choices-grid">
                      <div v-for="(choice, idx) in question.choices" :key="idx" class="choice-item">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text" v-html="sanitizeAndRenderHtml(choice)"></span>
                      </div>
                    </div>

                    <!-- 정답 표시 -->
                    <div v-if="printOptions.showAnswers && question.answer" class="answer-box">
                      <strong>정답:</strong> {{ question.answer }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 독립 문제들 (지문 없음) -->
              <template v-else>
                <div v-for="question in group.questions" :key="question.id" class="question-item standalone">
                  <div class="question-number">
                    {{ question.displayNumber }}.
                    <span v-if="printOptions.showPoints" class="points">({{ question.points }}점)</span>
                  </div>
                  <div class="question-content">
                    <div class="question-text" v-html="sanitizeAndRenderHtml(question.questionHtml)"></div>
                    
                    <!-- 보기 -->
                    <div v-if="question.choices && question.choices.length" class="choices-grid">
                      <div v-for="(choice, idx) in question.choices" :key="idx" class="choice-item">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text" v-html="sanitizeAndRenderHtml(choice)"></span>
                      </div>
                    </div>

                    <!-- 정답 표시 -->
                    <div v-if="printOptions.showAnswers && question.answer" class="answer-box">
                      <strong>정답:</strong> {{ question.answer }}
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>

          <!-- Page Footer -->
          <div v-if="printOptions.showPageNumbers" class="page-footer">
            <span class="page-number">- {{ currentPage }} -</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <transition name="fade">
      <div v-if="isGenerating" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>PDF 생성 중...</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'

// Props
const props = defineProps({
  selectedItems: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['download', 'save'])

// Store
const itemSelectionStore = useItemSelectionStore()

// State
const currentPage = ref(1)
const zoomLevel = ref(100)
const layoutMode = ref('double')
const showSettings = ref(false)
const isGenerating = ref(false)
const groupingMode = ref('passage')

// Exam Settings
const examSettings = ref({
  title: '2024학년도 1학기 중간고사',
  subject: '수학',
  duration: 50,
  totalScore: 100
})

// Print Options
const printOptions = ref({
  showAnswers: false,
  showPoints: true,
  showStudentInfo: true,
  showPageNumbers: true,
  showInstructions: true
})

// 전체 문제 목록
const allQuestions = computed(() => {
  const items = props.selectedItems.length > 0 
    ? props.selectedItems 
    : itemSelectionStore.selectedItems || []
  
  return items.map((item, index) => ({
    ...item,
    id: item.itemId || item.id || index,
    displayNumber: index + 1,
    questionHtml: item.questionHtml || item.questionText || '',
    passageHtml: item.passageHtml || '',
    passageId: item.passageId,
    choices: [
      item.choice1Html,
      item.choice2Html,
      item.choice3Html,
      item.choice4Html,
      item.choice5Html
    ].filter(Boolean),
    answer: item.correctAnswer || item.answer,
    points: item.points || 5
  }))
})

// 페이지당 문제 수 계산 (고정값으로 수정)
const questionsPerPage = computed(() => {
  // 레이아웃과 지문 유무에 따라 동적으로 계산
  // A4 높이(297mm)에서 헤더/푸터 제외하면 약 250mm 사용 가능
  // 평균 문제 높이를 고려하여 계산
  if (layoutMode.value === 'single') {
    // 단일 컬럼: 페이지당 4-5문제
    return 4
  } else {
    // 2컬럼: 페이지당 8-10문제
    return 8
  }
})

// 전체 페이지 수
const totalPages = computed(() => {
  const total = allQuestions.value.length
  if (total === 0) return 1
  
  const perPage = questionsPerPage.value
  const firstPageQuestions = (printOptions.value.showStudentInfo || printOptions.value.showInstructions) 
    ? Math.max(1, perPage - 2) // 헤더가 있으면 2문제 정도 줄임
    : perPage
  
  if (total <= firstPageQuestions) {
    return 1
  }
  
  const remainingQuestions = total - firstPageQuestions
  const additionalPages = Math.ceil(remainingQuestions / perPage)
  
  return 1 + additionalPages
})

// 현재 페이지의 문제들
const currentPageQuestions = computed(() => {
  let start = 0
  let end = 0
  const perPage = questionsPerPage.value
  
  // 첫 페이지는 헤더 공간 때문에 문제 수 조정
  const firstPageQuestions = (printOptions.value.showStudentInfo || printOptions.value.showInstructions) 
    ? Math.max(1, perPage - 2) // 헤더가 있으면 2문제 정도 줄임
    : perPage
  
  if (currentPage.value === 1) {
    start = 0
    end = firstPageQuestions
  } else {
    // 이후 페이지들 계산
    start = firstPageQuestions + (currentPage.value - 2) * perPage
    end = start + perPage
  }
  
  const questions = allQuestions.value.slice(start, end)
  
  // 디버깅용 로그
  console.log('Pagination Debug:', {
    currentPage: currentPage.value,
    questionsPerPage: perPage,
    firstPageQuestions,
    totalQuestions: allQuestions.value.length,
    start,
    end,
    currentPageQuestionCount: questions.length,
    totalPages: totalPages.value
  })
  
  return questions
})

// 현재 페이지의 그룹화된 문제들
const currentPageGroups = computed(() => {
  const questions = currentPageQuestions.value
  
  if (groupingMode.value === 'none') {
    return [{ questions, id: 'all' }]
  }
  
  if (groupingMode.value === 'passage') {
    const groups = []
    const passageMap = new Map()
    const standalone = []
    
    questions.forEach(q => {
      if (q.passageId) {
        if (!passageMap.has(q.passageId)) {
          passageMap.set(q.passageId, {
            passageId: q.passageId,
            passageHtml: q.passageHtml,
            questions: [],
            questionNumbers: []
          })
        }
        const group = passageMap.get(q.passageId)
        group.questions.push(q)
        group.questionNumbers.push(q.displayNumber)
      } else {
        standalone.push(q)
      }
    })
    
    passageMap.forEach((group, id) => {
      group.id = id
      group.questionNumbers = group.questionNumbers.join(', ')
      groups.push(group)
    })
    
    if (standalone.length > 0) {
      groups.push({ questions: standalone, id: 'standalone' })
    }
    
    return groups
  }
  
  return [{ questions, id: 'all' }]
})

// Methods
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const increaseZoom = () => {
  if (zoomLevel.value < 150) {
    zoomLevel.value += 10
  }
}

const decreaseZoom = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 10
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const getChoiceNumber = (index) => {
  const numbers = ['①', '②', '③', '④', '⑤']
  return numbers[index] || `${index + 1}.`
}

// HTML 정리 및 MathJax 렌더링
const sanitizeAndRenderHtml = (html) => {
  if (!html) return ''
  
  // HTML 문자열 정리 (불필요한 스타일 제거)
  let cleanHtml = html
    .replace(/style="[^"]*"/gi, '') // 인라인 스타일 제거
    .replace(/class="txt\s*"/gi, '') // 빈 클래스 제거
    .replace(/<span\s*>([^<]*)<\/span>/gi, '$1') // 불필요한 span 제거
  
  // MathJax 렌더링 트리거
  nextTick(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise()
    }
  })
  
  return cleanHtml
}

// PDF Download with html2pdf.js for Korean support
const downloadPDF = async () => {
  isGenerating.value = true
  
  try {
    // html2pdf.js를 동적으로 import
    const html2pdf = (await import('html2pdf.js')).default
    
    // PDF로 변환할 요소 가져오기
    const element = document.querySelector('.a4-paper')
    
    if (!element) {
      throw new Error('미리보기 요소를 찾을 수 없습니다.')
    }
    
    // PDF 옵션 설정
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${examSettings.value.title || '시험지'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break',
        after: '.page-break'
      }
    }
    
    // PDF 생성 및 다운로드
    await html2pdf().set(opt).from(element).save()
    
    // 이벤트 발생
    emit('download', {
      settings: examSettings.value,
      options: printOptions.value,
      questions: currentPageQuestions.value
    })
    
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    alert('PDF 생성 중 오류가 발생했습니다: ' + error.message)
  } finally {
    isGenerating.value = false
  }
}

// Initialize MathJax
onMounted(() => {
  // Load MathJax if not already loaded
  if (!window.MathJax) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
    script.async = true
    script.id = 'MathJax-script'
    document.head.appendChild(script)
    
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
      },
      svg: {
        fontCache: 'global'
      }
    }
  }
})

// Watch for content changes and re-render MathJax
watch([currentPage, currentPageQuestions], () => {
  nextTick(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise()
    }
  })
})

// Watch for layout mode changes to adjust pagination
watch(layoutMode, () => {
  // Reset to first page when layout changes to avoid out of bounds
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1
  }
})

// Watch for selected items changes
watch(() => props.selectedItems, (newItems) => {
  console.log('Selected items changed:', newItems?.length || 0)
  // Reset to first page when items change
  currentPage.value = 1
}, { deep: true })
</script>

<style scoped>
.exam-pdf-preview {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

/* Header Styles */
.preview-header {
  background: white;
  border-bottom: 1px solid #e0e6ed;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.preview-title .icon {
  color: #2563eb;
}

.exam-info {
  display: flex;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #606f7b;
  font-size: 0.875rem;
}

.info-item svg {
  color: #2563eb;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* Layout Toggle */
.layout-toggle {
  display: flex;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 2px;
}

.layout-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  color: #606f7b;
}

.layout-btn:hover {
  color: #2563eb;
}

.layout-btn.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Zoom Controls */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 0.25rem 0.5rem;
}

.zoom-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  color: #606f7b;
  transition: all 0.2s;
}

.zoom-btn:hover:not(:disabled) {
  background: #f5f7fa;
  color: #2563eb;
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 0.875rem;
  color: #2c3e50;
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #606f7b;
}

.btn-icon:hover {
  border-color: #2563eb;
  color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

/* Main Body */
.preview-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Settings Sidebar */
.settings-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e0e6ed;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.settings-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e6ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #2c3e50;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  color: #606f7b;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #2c3e50;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #606f7b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  color: #2c3e50;
  font-weight: 500;
}

.form-field input,
.form-field select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.checkbox-group,
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item,
.radio-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-item input,
.radio-item input {
  width: auto;
  margin-right: 0.5rem;
  cursor: pointer;
}

.checkbox-item span,
.radio-item span {
  font-size: 0.875rem;
  color: #2c3e50;
}

/* Preview Container */
.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  overflow: auto;
  background: #f5f7fa;
  transform-origin: top center;
  transition: transform 0.2s;
}

/* Page Navigation */
.page-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  color: #606f7b;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #f5f7fa;
  color: #2563eb;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #2c3e50;
}

.page-info .separator {
  color: #cbd5e0;
}

/* A4 Paper */
.a4-paper {
  width: 210mm;
  min-height: 297mm;
  background: white;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 25mm 20mm;
  border-radius: 4px;
  position: relative;
  font-size: 10pt; /* 표준 시험지 폰트 크기 */
}

/* 2컬럼 레이아웃 시 A4 최적화 */
.a4-paper.layout-double {
  padding: 20mm 15mm; /* 2컬럼일 때 좌우 여백 조정 */
}

.a4-paper.layout-single {
  font-size: 11pt; /* 1컬럼일 때는 조금 더 큰 글씨 */
}

/* Paper Header */
.paper-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e0e6ed;
}

.exam-title-section h1 {
  text-align: center;
  font-size: 1.75rem;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
}

.exam-meta {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.9375rem;
  color: #606f7b;
}

/* Student Info Section */
.student-info-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2c3e50;
  min-width: 60px;
}

.fill-line {
  flex: 1;
  height: 1px;
  background: #cbd5e0;
  position: relative;
  top: -2px;
}

/* Instructions Section */
.instructions-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fffef7;
  border: 1px solid #f6e05e;
  border-radius: 8px;
}

.instructions-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9375rem;
  color: #744210;
}

.instructions-section ol {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
  color: #5a4a2e;
  line-height: 1.6;
}

/* Questions Container - Using CSS Columns for natural flow */
.questions-container {
  column-gap: 2rem;
  column-rule: 1px solid #e0e6ed;
  height: auto;
  max-height: calc(297mm - 100mm); /* A4 높이에서 헤더/푸터 제외 */
  overflow: visible;
}

.questions-container.columns-1 {
  column-count: 1;
}

.questions-container.columns-2 {
  column-count: 2;
  column-fill: balance; /* 컬럼 균등 배분 */
  column-width: calc(50% - 1rem); /* 명시적 컬럼 너비 */
}

/* Passage Group */
.passage-group {
  break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 1.5rem;
  width: 100%;
}

.passage-header {
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
}

.passage-content {
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #2c3e50;
  break-inside: avoid;
  column-span: all; /* 지문은 전체 너비 사용 */
  max-width: 100%;
  overflow-wrap: break-word;
}

/* 지문 내 HTML 스타일 정리 */
.passage-content :deep(.paragraph) {
  margin-bottom: 0.5rem;
  text-align: justify;
}

.passage-content :deep(table) {
  width: 100% !important;
  margin: 0.5rem 0;
  border-collapse: collapse;
}

.passage-content :deep(td) {
  padding: 0.5rem;
  border: 1px solid #e0e6ed;
}

.passage-content :deep(.txt) {
  line-height: 1.7;
}

.passage-content :deep(div[style*="text-indent"]) {
  text-indent: 0 !important;
  padding-left: 1em;
}

/* Question Item */
.question-item {
  break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 1.5rem;
  display: inline-block; /* 컬럼 내에서 적절히 배치 */
  width: 100%;
}

.question-item.standalone {
  padding: 1rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  transition: all 0.2s;
}

.question-item.standalone:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.question-number {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.points {
  font-size: 0.875rem;
  color: #606f7b;
  font-weight: normal;
}

.question-content {
  padding-left: 1.5rem;
}

.question-text {
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #2c3e50;
}

/* Choices */
.choices-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.choice-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.choice-number {
  color: #2563eb;
  font-weight: 500;
  min-width: 20px;
}

.choice-text {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #2c3e50;
}

/* Answer Box */
.answer-box {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #eff6ff;
  border: 1px solid #2563eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1e3a8a;
}

/* Page Footer */
.page-footer {
  position: absolute;
  bottom: 15mm;
  left: 0;
  right: 0;
  text-align: center;
}

.page-number {
  font-size: 0.875rem;
  color: #606f7b;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 2rem 3rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e6ed;
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-content p {
  margin: 0;
  font-size: 0.9375rem;
  color: #2c3e50;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1400px) {
  .a4-paper {
    transform: scale(0.9);
    transform-origin: top center;
  }
}

@media (max-width: 1200px) {
  .a4-paper {
    transform: scale(0.8);
  }
}

@media print {
  .preview-header,
  .settings-sidebar,
  .page-navigation {
    display: none;
  }
  
  .preview-container {
    padding: 0;
    background: white;
  }
  
  .a4-paper {
    box-shadow: none;
    width: 100%;
    min-height: auto;
    padding: 0;
    margin: 0;
  }
}
</style>