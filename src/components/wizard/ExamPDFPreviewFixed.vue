<template>
  <div class="exam-pdf-preview">
    <!-- Header -->
    <div class="preview-header">
      <div class="header-left">
        <h3>시험지 미리보기</h3>
        <div class="header-info">
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 11L12 14L20 4" stroke="currentColor" stroke-width="2"/>
            </svg>
            {{ allQuestions.length }}문항
          </span>
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" stroke-width="2"/>
            </svg>
            {{ totalPages }}페이지
          </span>
        </div>
      </div>
      
      <!-- Title Settings -->
      <div class="header-settings">
        <input 
          v-model="examTitle" 
          type="text" 
          placeholder="시험지 제목"
          class="title-input"
        />
        <input 
          v-model="subject" 
          type="text" 
          placeholder="과목"
          class="subject-input"
        />
      </div>

      <div class="header-controls">
        <!-- Layout Toggle -->
        <div class="control-group">
          <button
            @click="layoutMode = 'single'"
            :class="['layout-btn', { active: layoutMode === 'single' }]"
            title="1단 레이아웃"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button
            @click="layoutMode = 'double'"
            :class="['layout-btn', { active: layoutMode === 'double' }]"
            title="2단 레이아웃"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="7" height="16" stroke="currentColor" stroke-width="2"/>
              <rect x="13" y="4" width="7" height="16" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <!-- Zoom Controls -->
        <div class="control-group">
          <button @click="decreaseZoom" class="zoom-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <span class="zoom-level">{{ zoomLevel }}%</span>
          <button @click="increaseZoom" class="zoom-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <!-- Actions -->
        <button @click="downloadPDF" class="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V15" stroke="white" stroke-width="2"/>
            <path d="M7 10L12 15L17 10" stroke="white" stroke-width="2"/>
            <path d="M12 15V3" stroke="white" stroke-width="2"/>
          </svg>
          PDF 다운로드
        </button>
      </div>
    </div>

    <!-- Page Navigation -->
    <div class="page-navigation">
      <button 
        @click="currentPage = Math.max(1, currentPage - 1)" 
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
        @click="currentPage = Math.min(totalPages, currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="nav-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Preview Container -->
    <div class="preview-container" :style="{ transform: `scale(${zoomLevel / 100})` }">
      <!-- Single Page Display for Preview -->
      <div class="a4-page" v-if="!isGeneratingPDF">
        <!-- Header (First Page Only) -->
        <div v-if="currentPage === 1" class="page-header">
          <h1 class="exam-title">{{ examTitle || '2024학년도 중간고사' }}</h1>
          <div class="exam-info">
            <span>과목: {{ subject || '수학' }}</span>
            <span>시간: {{ duration || '50' }}분</span>
            <span>총점: {{ totalScore || '100' }}점</span>
          </div>
        </div>

        <!-- Questions Content -->
        <div class="page-content" :class="`layout-${layoutMode}`">
          <div class="questions-wrapper">
            <template v-for="(group, gIndex) in currentPageGroups" :key="`group-${gIndex}`">
              <!-- 지문이 있는 그룹 -->
              <div v-if="group.type === 'passage-group'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content" v-html="sanitizeHtml(group.passageHtml)"></div>
                </div>
                
                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text" v-html="sanitizeHtml(item.questionHtml)"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text" v-html="sanitizeHtml(choice)"></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 독립 문제 -->
              <template v-else>
                <div v-for="item in group.questions" :key="item.id" class="question-item standalone">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text" v-html="sanitizeHtml(item.questionHtml)"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text" v-html="sanitizeHtml(choice)"></span>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Page Footer -->
        <div class="page-footer">
          <span>- {{ currentPage }} -</span>
        </div>
      </div>

      <!-- All Pages for PDF Generation (Hidden) -->
      <div v-show="isGeneratingPDF" ref="pdfContent" class="pdf-pages">
        <div v-for="pageNum in totalPages" :key="pageNum" class="a4-page pdf-page">
          <!-- Header (First Page Only) -->
          <div v-if="pageNum === 1" class="page-header">
            <h1 class="exam-title">{{ examTitle || '2024학년도 중간고사' }}</h1>
            <div class="exam-info">
              <span>과목: {{ subject || '수학' }}</span>
              <span>시간: {{ duration || '50' }}분</span>
              <span>총점: {{ totalScore || '100' }}점</span>
            </div>
          </div>

          <!-- Questions for this page -->
          <div class="page-content" :class="`layout-${layoutMode}`">
            <div class="questions-wrapper">
              <template v-for="(group, gIndex) in getPageGroups(pageNum)" :key="`pdf-group-${pageNum}-${gIndex}`">
                <!-- 지문이 있는 그룹 -->
                <div v-if="group.type === 'passage-group'" class="passage-group">
                  <div class="passage-section">
                    <div class="passage-header">
                      [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                    </div>
                    <div class="passage-content" v-html="sanitizeHtml(group.passageHtml)"></div>
                  </div>
                  
                  <!-- 그룹의 문제들 -->
                  <div v-for="item in group.questions" :key="item.id" class="question-item">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text" v-html="sanitizeHtml(item.questionHtml)"></div>
                    
                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text" v-html="sanitizeHtml(choice)"></span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 독립 문제 -->
                <template v-else>
                  <div v-for="item in group.questions" :key="item.id" class="question-item standalone">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text" v-html="sanitizeHtml(item.questionHtml)"></div>
                    
                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text" v-html="sanitizeHtml(choice)"></span>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

          <!-- Page Footer -->
          <div class="page-footer">
            <span>- {{ pageNum }} -</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isGeneratingPDF" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>PDF 생성 중...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
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

// Stores
const itemSelectionStore = useItemSelectionStore()

// State
const currentPage = ref(1)
const layoutMode = ref('single') // 'single' or 'double'
const zoomLevel = ref(100)
const isGeneratingPDF = ref(false)

// Exam Settings
const examTitle = ref('2024학년도 중간고사')
const subject = ref('수학')
const duration = ref(50)
const totalScore = ref(100)

// Process all questions and group by passage
const allQuestions = computed(() => {
  let items = props.selectedItems.length > 0 
    ? props.selectedItems 
    : itemSelectionStore.selectedItems || []
  
  // 테스트 데이터 (개발용)
  if (items.length === 0) {
    console.warn('No items found, using test data')
    items = Array.from({ length: 20 }, (_, i) => ({
      id: `test-${i}`,
      questionText: `문제 ${i + 1}: 이것은 테스트 문제입니다.`,
      passageId: i < 3 ? 'passage-1' : i < 6 ? 'passage-2' : null,
      passageHtml: i < 3 ? '<p>이것은 첫 번째 지문입니다. 매우 긴 내용이 포함되어 있습니다.</p>' : 
                   i < 6 ? '<p>이것은 두 번째 지문입니다.</p>' : null,
      choice1: '선택지 1',
      choice2: '선택지 2', 
      choice3: '선택지 3',
      choice4: '선택지 4',
      choice5: '선택지 5',
      correctAnswer: '1',
      points: 5
    }))
  }
  
  return items.map((item, index) => ({
    ...item,
    id: item.itemId || item.id || `q-${index}`,
    displayNumber: index + 1,
    questionHtml: item.questionHtml || item.questionText || '',
    passageHtml: item.passageHtml || '',
    passageId: item.passageId || null,
    choices: [
      item.choice1Html || item.choice1,
      item.choice2Html || item.choice2,
      item.choice3Html || item.choice3,
      item.choice4Html || item.choice4,
      item.choice5Html || item.choice5
    ].filter(Boolean),
    points: item.points || 5
  }))
})

// Group questions by passage
const groupedQuestions = computed(() => {
  const groups = []
  const passageMap = new Map()
  const processedQuestions = new Set()
  
  allQuestions.value.forEach(question => {
    if (processedQuestions.has(question.id)) return
    
    if (question.passageId && question.passageHtml) {
      // 이미 처리된 지문인지 확인
      if (!passageMap.has(question.passageId)) {
        // 같은 passageId를 가진 모든 문제 찾기
        const relatedQuestions = allQuestions.value.filter(q => 
          q.passageId === question.passageId && !processedQuestions.has(q.id)
        )
        
        const group = {
          type: 'passage-group',
          passageId: question.passageId,
          passageHtml: question.passageHtml,
          questions: relatedQuestions,
          questionNumbers: relatedQuestions.map(q => q.displayNumber).join(', ')
        }
        
        groups.push(group)
        passageMap.set(question.passageId, group)
        
        // 처리된 문제들 기록
        relatedQuestions.forEach(q => processedQuestions.add(q.id))
      }
    } else {
      // 지문이 없는 독립 문제
      groups.push({
        type: 'single',
        questions: [question]
      })
      processedQuestions.add(question.id)
    }
  })
  
  return groups
})

// Items per page based on layout and page position
const itemsPerPage = computed(() => {
  const isFirstPage = currentPage.value === 1
  if (layoutMode.value === 'single') {
    return isFirstPage ? 3 : 5
  } else {
    return isFirstPage ? 6 : 10
  }
})

// Dynamic page content storage
const pageContents = ref([])

// Calculate dynamic pagination based on actual content size
const calculateDynamicPagination = () => {
  if (!allQuestions.value.length) {
    pageContents.value = [[]]
    return
  }

  const pages = []
  let currentPageGroups = []
  let currentPageHeight = 0
  
  // 실제 A4 사용 가능 높이 (mm to px conversion)
  // A4: 297mm height, 15mm top/bottom margins = 267mm usable
  // 1mm ≈ 3.78px at 96dpi
  const MM_TO_PX = 3.78
  const USABLE_HEIGHT_MM = 267 // 297mm - 30mm margins
  const PAGE_HEIGHT = USABLE_HEIGHT_MM * MM_TO_PX // ≈ 1009px
  
  const HEADER_HEIGHT = 100 // 첫 페이지 헤더
  const FOOTER_HEIGHT = 30
  
  // 높이 추정 상수 (더 정확한 값)
  const PASSAGE_HEADER_HEIGHT = 35
  const PASSAGE_LINE_HEIGHT = 20
  const QUESTION_HEIGHT = 80
  const CHOICE_HEIGHT = 25
  const GROUP_MARGIN = 25
  
  let availableHeight = PAGE_HEIGHT - FOOTER_HEIGHT
  let isFirstPage = true
  
  // 모든 그룹 생성
  const allGroups = createAllGroups()
  
  allGroups.forEach((group, index) => {
    // 그룹 높이 계산
    let groupHeight = GROUP_MARGIN
    
    if (group.type === 'passage-group') {
      // 지문 헤더
      groupHeight += PASSAGE_HEADER_HEIGHT
      
      // 지문 내용 높이 (HTML 길이 기반 추정)
      const passageLength = (group.passageHtml || '').replace(/<[^>]*>/g, '').length
      const estimatedLines = Math.ceil(passageLength / 60) // 한 줄에 약 60자
      groupHeight += Math.min(estimatedLines * PASSAGE_LINE_HEIGHT, 200) // 최대 200px
      
      // 문제들 높이
      group.questions.forEach(q => {
        groupHeight += QUESTION_HEIGHT
        const choiceCount = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
          .filter(c => c).length
        groupHeight += choiceCount * CHOICE_HEIGHT
      })
    } else {
      // 독립 문제
      group.questions.forEach(q => {
        groupHeight += QUESTION_HEIGHT
        const choiceCount = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
          .filter(c => c).length
        groupHeight += choiceCount * CHOICE_HEIGHT
      })
    }
    
    // 2단 레이아웃에서는 높이가 약 60% (더 많은 콘텐츠 수용)
    if (layoutMode.value === 'double') {
      groupHeight = Math.ceil(groupHeight * 0.6)
    }
    
    // 첫 페이지 처리
    if (isFirstPage) {
      availableHeight = PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT
    }
    
    // 현재 페이지에 맞지 않으면 새 페이지로
    if (currentPageHeight + groupHeight > availableHeight && currentPageGroups.length > 0) {
      console.log(`Page ${pages.length + 1} full:`, {
        currentHeight: currentPageHeight,
        groupHeight: groupHeight,
        availableHeight: availableHeight,
        groupsInPage: currentPageGroups.length
      })
      
      pages.push([...currentPageGroups])
      currentPageGroups = []
      currentPageHeight = 0
      isFirstPage = false
      availableHeight = PAGE_HEIGHT - FOOTER_HEIGHT
    }
    
    currentPageGroups.push(group)
    currentPageHeight += groupHeight
  })
  
  // 마지막 페이지 추가
  if (currentPageGroups.length > 0) {
    pages.push(currentPageGroups)
    console.log(`Final page ${pages.length}:`, {
      groupsInPage: currentPageGroups.length,
      currentHeight: currentPageHeight
    })
  }
  
  console.log('Pagination complete:', {
    totalPages: pages.length,
    totalGroups: allGroups.length,
    layoutMode: layoutMode.value
  })
  
  pageContents.value = pages.length > 0 ? pages : [[]]
}

// 모든 그룹 생성
const createAllGroups = () => {
  const groups = []
  const processedIds = new Set()
  
  allQuestions.value.forEach(question => {
    if (processedIds.has(question.id)) return
    
    if (question.passageId && question.passageHtml) {
      const relatedQuestions = allQuestions.value.filter(q => 
        q.passageId === question.passageId && !processedIds.has(q.id)
      )
      
      if (relatedQuestions.length > 0) {
        groups.push({
          type: 'passage-group',
          passageId: question.passageId,
          passageHtml: question.passageHtml,
          questions: relatedQuestions,
          questionNumbers: relatedQuestions.map(q => q.displayNumber).join(', ')
        })
        
        relatedQuestions.forEach(q => processedIds.add(q.id))
      }
    } else {
      groups.push({
        type: 'single',
        questions: [question]
      })
      processedIds.add(question.id)
    }
  })
  
  return groups
}

// Watch for changes and recalculate
watch([allQuestions, layoutMode], () => {
  calculateDynamicPagination()
}, { immediate: true })

// Total pages from dynamic calculation
const totalPages = computed(() => {
  return Math.max(1, pageContents.value.length)
})

// Get groups for current page
const currentPageGroups = computed(() => {
  return pageContents.value[currentPage.value - 1] || []
})

// Get groups for specific page
const getPageGroups = (pageNum) => {
  return pageContents.value[pageNum - 1] || []
}

// Zoom controls
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

// Get choice number
const getChoiceNumber = (index) => {
  const numbers = ['①', '②', '③', '④', '⑤']
  return numbers[index] || `${index + 1}.`
}

// Sanitize HTML
const sanitizeHtml = (html) => {
  if (!html) return ''
  
  // Remove inline styles and clean up
  return html
    .replace(/style="[^"]*"/gi, '')
    .replace(/class="txt\s*"/gi, '')
    .replace(/<span\s*>([^<]*)<\/span>/gi, '$1')
}

// Download PDF
const downloadPDF = async () => {
  isGeneratingPDF.value = true
  
  try {
    // Import html2pdf dynamically
    const html2pdf = (await import('html2pdf.js')).default
    
    // Show all pages for PDF generation
    await nextTick()
    
    const element = document.querySelector('.pdf-pages')
    if (!element) {
      throw new Error('PDF 요소를 찾을 수 없습니다.')
    }
    
    const options = {
      margin: 10,
      filename: `${examTitle.value}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.pdf-page',
        avoid: '.question-block'
      }
    }
    
    await html2pdf().set(options).from(element).save()
    
    emit('download', {
      examTitle: examTitle.value,
      totalQuestions: allQuestions.value.length,
      totalPages: totalPages.value
    })
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    alert('PDF 생성 중 오류가 발생했습니다.')
  } finally {
    isGeneratingPDF.value = false
  }
}

// Initialize MathJax and debug
onMounted(() => {
  // Calculate initial pagination
  calculateDynamicPagination()
  
  // Debug logging
  console.log('ExamPDFPreviewFixed mounted:', {
    selectedItems: props.selectedItems,
    allQuestions: allQuestions.value,
    totalPages: totalPages.value,
    currentPage: currentPage.value,
    currentPageGroups: currentPageGroups.value,
    pageContents: pageContents.value
  })
  
  if (!window.MathJax) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
    script.async = true
    document.head.appendChild(script)
    
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
      }
    }
  }
})
</script>

<style scoped>
.exam-pdf-preview {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  background: #f5f7fa;
  overflow: hidden; /* 전체 컨테이너 overflow 방지 */
}

/* Header */
.preview-header {
  background: white;
  border-bottom: 1px solid #e0e6ed;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header-left h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.header-info {
  display: flex;
  gap: 1rem;
}

/* Header Settings */
.header-settings {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  max-width: 400px;
  margin: 0 1rem;
}

.title-input,
.subject-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.title-input {
  flex: 2;
}

.subject-input {
  flex: 1;
}

.title-input:focus,
.subject-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #606f7b;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.layout-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.layout-btn:hover:not(.active) {
  border-color: #cbd5e0;
}

.zoom-btn {
  padding: 0.375rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn:hover {
  border-color: #cbd5e0;
  background: #f8fafc;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 0.875rem;
  color: #606f7b;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

/* Page Navigation */
.page-navigation {
  background: white;
  padding: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #e0e6ed;
}

.nav-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.separator {
  color: #cbd5e0;
}

/* Preview Container */
.preview-container {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto; /* 세로 스크롤만 허용 */
  overflow-x: hidden; /* 가로 스크롤 방지 */
  background: #f5f7fa;
  transform-origin: top center;
  max-height: calc(100vh - 200px); /* 헤더와 네비게이션 높이 제외 */
}

/* A4 Page */
.a4-page {
  width: 210mm;
  height: 297mm; /* 고정 높이로 설정 */
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 15mm 20mm; /* 상하 여백 줄임 */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 넘치는 콘텐츠 숨김 */
  position: relative;
}

.pdf-page {
  page-break-after: always;
  margin-bottom: 20mm;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #2563eb;
}

.exam-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.exam-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.9375rem;
  color: #606f7b;
}

/* Page Content */
.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 페이지 넘침 방지 */
  max-height: calc(297mm - 30mm - 4rem); /* A4 높이 - 여백 - 헤더/푸터 */
}

/* Single Column Layout */
.page-content.layout-single .questions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  overflow: hidden;
}

/* Double Column Layout - Using CSS Columns for natural flow */
.page-content.layout-double .questions-wrapper {
  column-count: 2;
  column-gap: 2rem;
  column-rule: 1px solid #e0e6ed;
  column-fill: balance; /* 균형있게 컬럼 채우기 */
  height: calc(297mm - 30mm - 6rem); /* 정확한 높이 계산 */
  max-height: calc(297mm - 30mm - 6rem);
  overflow: hidden; /* 넘치는 내용 숨김 */
}

/* Passage Group */
.passage-group {
  break-inside: avoid; /* 페이지/컬럼 내에서 깨지지 않도록 */
  margin-bottom: 1.5rem;
  page-break-inside: avoid;
}

/* For double column layout, allow passage to flow naturally */
.layout-double .passage-group {
  column-span: none; /* 지문이 한 컬럼 내에서 흐르도록 */
  break-inside: auto; /* 긴 지문은 다음 컬럼으로 자연스럽게 이동 */
}

.passage-section {
  margin-bottom: 1rem;
}

.passage-header {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  break-inside: avoid;
  break-after: avoid;
}

.passage-content {
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #2c3e50;
  /* 긴 지문은 자연스럽게 흐르도록 */
  break-inside: auto;
}

/* Allow tables and complex HTML in passages to flow naturally */
.passage-content table,
.passage-content div {
  break-inside: auto;
}

.question-item {
  break-inside: avoid;
  page-break-inside: avoid;
  column-break-inside: avoid;
  margin-bottom: 1rem;
}

.question-item.standalone {
  margin-bottom: 1.5rem;
  break-inside: avoid;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.question-number {
  font-weight: 600;
  color: #2563eb;
  font-size: 1rem;
}

.question-points {
  font-size: 0.875rem;
  color: #606f7b;
}

.question-text {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: #2c3e50;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1rem;
}

.choice {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.choice-number {
  color: #606f7b;
  min-width: 20px;
}

.choice-text {
  flex: 1;
  line-height: 1.6;
  color: #2c3e50;
}

/* Page Footer */
.page-footer {
  text-align: center;
  padding-top: 1rem;
  color: #606f7b;
  font-size: 0.875rem;
}

/* PDF Generation */
.pdf-pages {
  background: white;
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
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e6ed;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Print Styles */
@media print {
  .preview-header,
  .page-navigation,
  .loading-overlay {
    display: none;
  }
  
  .preview-container {
    padding: 0;
    transform: none !important;
  }
  
  .a4-page {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
  }
}
</style>