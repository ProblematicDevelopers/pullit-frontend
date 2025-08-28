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
      
      <!-- Enhanced Title Settings -->
      <div class="header-settings">
        <div class="settings-row">
          <input 
            v-model="examTitle" 
            type="text" 
            placeholder="시험지 제목 (예: 2024학년도 1학기 중간고사)"
            class="title-input"
          />
        </div>
        <div class="settings-row">
          <select v-model="selectedGrade" @change="updateGradeInfo" class="grade-select">
            <option value="">학년 선택</option>
            <option value="07">중학교 1학년</option>
            <option value="08">중학교 2학년</option>
            <option value="09">중학교 3학년</option>
          </select>
          <select v-model="selectedSubject" @change="updateSubjectInfo" class="subject-select">
            <option value="">과목 선택</option>
            <option value="MA">수학</option>
            <option value="KO">국어</option>
            <option value="EN">영어</option>
            <option value="SC">과학</option>
            <option value="SO">사회</option>
          </select>
        </div>
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
          <!-- Single column layout -->
          <div v-if="layoutMode === 'single'" class="questions-wrapper">
            <template v-for="(group, gIndex) in currentPageGroups" :key="`group-${gIndex}`">
              <!-- 지문이 있는 그룹 -->
              <div v-if="group.type === 'passage-group'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  <!-- Split indicator if this is a split passage -->
                  <div v-if="group.isSplit" class="passage-continuation-indicator">
                    {{ group.splitPart < group.totalSplits ? '(다음 페이지에서 계속)' : '' }}
                  </div>
                </div>
                
                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 지문 연속 그룹 (이어지는 문제들) -->
              <div v-else-if="group.type === 'passage-group-continuation'" class="passage-group continuation">
                <div class="continuation-header">
                  (앞 페이지 지문에서 이어지는 문제)
                </div>
                
                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
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
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
          
          <!-- Two column layout for preview with CSS columns -->
          <div v-if="layoutMode === 'double'" class="two-column-wrapper">
            <template v-for="(group, gIndex) in currentPageGroups" :key="`group-${gIndex}`">
              <!-- 지문이 있는 그룹 -->
              <div v-if="group.type === 'passage-group'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  <!-- Split indicator if this is a split passage -->
                  <div v-if="group.isSplit" class="passage-continuation-indicator">
                    {{ group.splitPart < group.totalSplits ? '(다음 페이지에서 계속)' : '' }}
                  </div>
                </div>
                
                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 지문 연속 그룹 (이어지는 문제들) -->
              <div v-else-if="group.type === 'passage-group-continuation'" class="passage-group continuation">
                <div class="continuation-header">
                  (앞 페이지 지문에서 이어지는 문제)
                </div>
                
                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
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
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  
                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
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
            <!-- Single column layout -->
            <div v-if="layoutMode === 'single'" class="questions-wrapper">
              <template v-for="(group, gIndex) in getPageColumn(pageNum, 1)" :key="`pdf-group-${pageNum}-${gIndex}`">
                <!-- 지문이 있는 그룹 -->
                <div v-if="group.type === 'passage-group'" class="passage-group">
                  <div class="passage-section">
                    <div class="passage-header">
                      [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                    </div>
                    <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  </div>
                  
                  <!-- 그룹의 문제들 -->
                  <div v-for="item in group.questions" :key="item.id" class="question-item">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                    
                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
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
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                    
                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
            
            <!-- Two column layout with CSS columns for PDF -->
            <div v-if="layoutMode === 'double'" class="two-column-wrapper">
              <template v-for="(group, gIndex) in getPageGroups(pageNum)" :key="`pdf-group-${pageNum}-${gIndex}`">
                <!-- 지문이 있는 그룹 -->
                <div v-if="group.type === 'passage-group'" class="passage-group">
                  <div class="passage-section">
                    <div class="passage-header">
                      [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                    </div>
                    <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  </div>
                  
                  <!-- 그룹의 문제들 -->
                  <div v-for="item in group.questions" :key="item.id" class="question-item">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                    
                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
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
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                    
                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
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

    <!-- Footer with Actions -->
    <div class="preview-footer">
      <div class="footer-info">
        <span class="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L20 4" stroke="currentColor" stroke-width="2"/>
          </svg>
          총 {{ allQuestions.length }}문항
        </span>
        <span class="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ duration }}분
        </span>
        <span class="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ totalScore }}점 만점
        </span>
      </div>
      
      <div class="footer-actions">
        <button @click="downloadPDF" class="btn-action btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 15V3" stroke="currentColor" stroke-width="2"/>
          </svg>
          PDF 다운로드
        </button>
        
        <button @click="savePDF" class="btn-action btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="white" stroke-width="2"/>
            <polyline points="17 21 17 13 7 13 7 21" stroke="white" stroke-width="2"/>
            <polyline points="7 3 7 8 15 8" stroke="white" stroke-width="2"/>
          </svg>
          시험지 저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'
import { renderMathJaxSmartHybrid, renderMathJaxParallelHybrid } from '@/utils/mathjax-hybrid'
import { generateEnhancedPDF, generateEnhancedPDFAsBlob } from '@/utils/pdf-generator-enhanced'
import { 
  calculateOptimalPageBreaks,
  measureContentHeight,
  splitHtmlContent,
  createContinuationIndicator,
  A4_CONSTANTS,
  USABLE_HEIGHT
} from '@/utils/pdf-content-paginator'

// Props
const props = defineProps({
  selectedItems: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['download', 'save', 'update:gradeInfo', 'update:subjectInfo'])

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
const selectedGrade = ref('08')
const selectedSubject = ref('MA')
const duration = ref(50)
const totalScore = ref(100)

// Grade and Subject mappings
const gradeMapping = {
  '07': '중1',
  '08': '중2',
  '09': '중3'
}

const subjectMapping = {
  'MA': '수학',
  'KO': '국어',
  'EN': '영어',
  'SC': '과학',
  'SO': '사회'
}

// Update grade info
const updateGradeInfo = () => {
  // Update display name
  if (gradeMapping[selectedGrade.value]) {
    // You can emit this to parent component
    emit('update:gradeInfo', { 
      code: selectedGrade.value, 
      name: gradeMapping[selectedGrade.value] 
    })
  }
}

// Update subject info
const updateSubjectInfo = () => {
  if (subjectMapping[selectedSubject.value]) {
    subject.value = subjectMapping[selectedSubject.value]
    emit('update:subjectInfo', { 
      code: selectedSubject.value, 
      name: subjectMapping[selectedSubject.value] 
    })
  }
}

// Process all questions and group by passage
const allQuestions = computed(() => {
  let items = props.selectedItems.length > 0 
    ? props.selectedItems 
    : itemSelectionStore.selectedItems || []
  
  console.log('Raw selected items:', items.length, items)
  
  // 테스트 데이터 (개발용)
  if (items.length === 0) {
    console.warn('No items found, using test data')
    items = Array.from({ length: 20 }, (_, i) => ({
      id: `test-${i}`,
      questionText: `문제 ${i + 1}: 이것은 테스트 문제입니다. 긴 문제 텍스트를 포함합니다.`,
      passageId: i < 3 ? 'passage-1' : i < 6 ? 'passage-2' : null,
      passageHtml: i < 3 ? '<p>이것은 첫 번째 지문입니다. 매우 긴 내용이 포함되어 있습니다. 지문은 여러 줄에 걸쳐 표시됩니다.</p>' : 
                   i < 6 ? '<p>이것은 두 번째 지문입니다. 짧은 지문입니다.</p>' : null,
      choice1: '선택지 1',
      choice2: '선택지 2', 
      choice3: '선택지 3',
      choice4: '선택지 4',
      choice5: '선택지 5',
      correctAnswer: '1',
      points: 5
    }))
  }
  
  const processed = items.map((item, index) => ({
    ...item,
    id: item.itemId || item.id || `q-${index}`,
    displayNumber: item.displayNumber || index + 1,
    questionHtml: item.questionHtml || item.questionText || item.question || '',
    passageHtml: item.passageHtml || item.passage || '',
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
  
  console.log('Processed questions:', processed.length, processed)
  return processed
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

// Dynamic page content storage - 2D structure for two-column layout
const pageContents = ref([])

// Calculate dynamic pagination with smart page breaks
const calculateDynamicPagination = async () => {
  if (!allQuestions.value.length) {
    pageContents.value = [{ column1: [], column2: [] }]
    return
  }

  try {
    // Create all groups first
    const allGroups = createAllGroups()
    
    // Use the optimized page break calculation
    const pages = await calculateOptimalPageBreaks(allGroups, layoutMode.value)
    
    console.log('Smart pagination complete:', {
      totalPages: pages.length,
      layoutMode: layoutMode.value,
      totalGroups: allGroups.length,
      questionsTotal: allQuestions.value.length
    })
    
    // Validate pages structure
    if (pages && pages.length > 0) {
      pageContents.value = pages
    } else {
      // If no pages created, use fallback
      console.warn('No pages created, using fallback')
      calculateBasicPagination()
    }
  } catch (error) {
    console.error('Error in smart pagination, using fallback:', error)
    // Fallback to basic pagination
    calculateBasicPagination()
  }
}

// Fallback basic pagination (without measurements)
const calculateBasicPagination = () => {
  const pages = []
  const allGroups = createAllGroups()
  
  // Use simplified height estimation for fallback
  const PAGE_HEIGHT = USABLE_HEIGHT.REGULAR_PAGE
  const HEADER_HEIGHT = A4_CONSTANTS.HEADER_HEIGHT_PX
  const FOOTER_HEIGHT = A4_CONSTANTS.FOOTER_HEIGHT_PX
  
  if (layoutMode.value === 'double') {
    // 2단 레이아웃 fallback
    let currentPage = { column1: [], column2: [] }
    let column1Height = 0
    let column2Height = 0
    let pageNum = 1
    
    allGroups.forEach((group) => {
      const groupHeight = estimateGroupHeight(group)
      const availableHeight = pageNum === 1 
        ? USABLE_HEIGHT.FIRST_PAGE
        : USABLE_HEIGHT.REGULAR_PAGE
      
      let placed = false
      
      if (column1Height <= column2Height) {
        if (column1Height + groupHeight <= availableHeight) {
          currentPage.column1.push(group)
          column1Height += groupHeight
          placed = true
        } else if (column2Height + groupHeight <= availableHeight) {
          currentPage.column2.push(group)
          column2Height += groupHeight
          placed = true
        }
      } else {
        if (column2Height + groupHeight <= availableHeight) {
          currentPage.column2.push(group)
          column2Height += groupHeight
          placed = true
        } else if (column1Height + groupHeight <= availableHeight) {
          currentPage.column1.push(group)
          column1Height += groupHeight
          placed = true
        }
      }
      
      if (!placed) {
        pages.push(currentPage)
        currentPage = { column1: [group], column2: [] }
        column1Height = groupHeight
        column2Height = 0
        pageNum++
      }
    })
    
    if (currentPage.column1.length > 0 || currentPage.column2.length > 0) {
      pages.push(currentPage)
    }
  } else {
    // 1단 레이아웃 fallback
    let currentPageGroups = []
    let currentPageHeight = 0
    let isFirstPage = true
    
    allGroups.forEach((group) => {
      const groupHeight = estimateGroupHeight(group)
      const availableHeight = isFirstPage ? USABLE_HEIGHT.FIRST_PAGE : USABLE_HEIGHT.REGULAR_PAGE
      
      if (currentPageHeight + groupHeight > availableHeight && currentPageGroups.length > 0) {
        pages.push({ column1: currentPageGroups, column2: [] })
        currentPageGroups = []
        currentPageHeight = 0
        isFirstPage = false
      }
      
      currentPageGroups.push(group)
      currentPageHeight += groupHeight
    })
    
    if (currentPageGroups.length > 0) {
      pages.push({ column1: currentPageGroups, column2: [] })
    }
  }
  
  pageContents.value = pages.length > 0 ? pages : [{ column1: [], column2: [] }]
}

// Helper function to estimate group height for fallback
const estimateGroupHeight = (group) => {
  let height = A4_CONSTANTS.GROUP_MARGIN_PX
  
  if (group.type === 'passage-group' || group.type === 'passage-group-continuation') {
    if (group.type === 'passage-group') {
      height += A4_CONSTANTS.PASSAGE_HEADER_HEIGHT_PX
      
      // Estimate passage height
      const passageLength = (group.passageHtml || '').replace(/<[^>]*>/g, '').length
      const charsPerLine = layoutMode.value === 'double' ? 30 : 60
      const lines = Math.ceil(passageLength / charsPerLine)
      height += Math.min(lines * A4_CONSTANTS.LINE_HEIGHT_PX, 300)
    }
    
    // Add question heights
    group.questions.forEach(q => {
      height += A4_CONSTANTS.QUESTION_BASE_HEIGHT_PX
      const choices = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
        .filter(c => c)
      height += choices.length * A4_CONSTANTS.CHOICE_HEIGHT_PX
    })
  } else {
    // Independent questions
    group.questions.forEach(q => {
      height += A4_CONSTANTS.QUESTION_BASE_HEIGHT_PX
      const choices = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
        .filter(c => c)
      height += choices.length * A4_CONSTANTS.CHOICE_HEIGHT_PX
    })
  }
  
  // Add extra margin for two-column layout
  if (layoutMode.value === 'double') {
    height = Math.ceil(height * 1.15)
  }
  
  return height
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
  
  console.log('Created groups:', groups.length, 'total groups')
  groups.forEach((g, i) => {
    console.log(`Group ${i}:`, g.type, g.questions.length, 'questions')
  })
  
  return groups
}

// Watch for changes and recalculate
watch([allQuestions, layoutMode], async () => {
  await calculateDynamicPagination()
}, { immediate: true })

// Total pages from dynamic calculation
const totalPages = computed(() => {
  return Math.max(1, pageContents.value.length)
})

// Get groups for current page
const currentPageGroups = computed(() => {
  const page = pageContents.value[currentPage.value - 1]
  if (!page) return []
  // For single column layout or preview, merge columns
  return [...(page.column1 || []), ...(page.column2 || [])]
})

// Get groups for specific page
const getPageGroups = (pageNum) => {
  const page = pageContents.value[pageNum - 1]
  if (!page) return []
  // For single column layout, merge columns
  return [...(page.column1 || []), ...(page.column2 || [])]
}

// Get groups for specific column of a page
const getPageColumn = (pageNum, columnNum) => {
  const page = pageContents.value[pageNum - 1]
  if (!page) {
    console.warn(`Page ${pageNum} not found`)
    return []
  }
  
  const result = columnNum === 1 ? (page.column1 || []) : (page.column2 || [])
  console.log(`getPageColumn(${pageNum}, ${columnNum}):`, result.length, 'items')
  return result
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

// Sanitize HTML and remove input fields
const sanitizeHtml = (html) => {
  if (!html) return ''
  
  // MathJax 수식을 임시로 보호
  const mathPatterns = []
  let mathIndex = 0
  
  // LaTeX 수식 패턴들을 임시 플레이스홀더로 교체
  let cleaned = html
    // Display math $$ ... $$ 보호
    .replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })
    // Inline math $ ... $ 보호
    .replace(/\$[^\$\n]+?\$/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })
    // \[ ... \] 보호
    .replace(/\\\[[\s\S]*?\\\]/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })
    // \( ... \) 보호
    .replace(/\\\([\s\S]*?\\\)/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })
  
  // 위험한 요소 제거하되 이미지는 유지
  cleaned = cleaned
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 스크립트 제거
    .replace(/on\w+="[^"]*"/g, '') // 이벤트 핸들러 제거
    .replace(/on\w+='[^']*'/g, '')
    .replace(/<input[^>]*>/gi, '')  // input 제거
    .replace(/<textarea[^>]*>.*?<\/textarea>/gi, '')  // textarea 제거
    .replace(/contenteditable="true"/gi, '')  // contenteditable 제거
  
  // 보호했던 수식들을 다시 복원
  mathPatterns.forEach((math, index) => {
    cleaned = cleaned.replace(`__MATH_${index}__`, math)
  })
  
  return cleaned
}

// Download PDF with enhanced features - returns blob for upload
const downloadPDF = async (returnBlob = false) => {
  isGeneratingPDF.value = true
  
  try {
    // Show all pages for PDF generation
    await nextTick()
    
    const element = document.querySelector('.pdf-pages')
    if (!element) {
      throw new Error('PDF 요소를 찾을 수 없습니다.')
    }
    
    // MathJax 렌더링 먼저 수행
    console.log('PDF: MathJax 렌더링 시작')
    await renderMathJaxForPDF(element)
    
    // Enhanced PDF generation with proper page breaks
    const filename = `${examTitle.value}_${new Date().toISOString().split('T')[0]}.pdf`
    
    // Generate PDF and get blob if needed
    if (returnBlob) {
      const pdfBlob = await generateEnhancedPDFAsBlob(element, { filename })
      
      emit('download', {
        examTitle: examTitle.value,
        totalQuestions: allQuestions.value.length,
        totalPages: totalPages.value,
        pdfBlob: pdfBlob,
        filename: filename
      })
      
      return pdfBlob
    } else {
      await generateEnhancedPDF(element, { filename })
      
      emit('download', {
        examTitle: examTitle.value,
        totalQuestions: allQuestions.value.length,
        totalPages: totalPages.value
      })
    }
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    alert('PDF 생성 중 오류가 발생했습니다.')
    throw error
  } finally {
    isGeneratingPDF.value = false
  }
}

// Generate PDF and save to S3
const generateAndSavePDF = async () => {
  try {
    const pdfBlob = await downloadPDF(true)
    emit('save', {
      pdfBlob: pdfBlob,
      examTitle: examTitle.value,
      filename: `${examTitle.value}_${new Date().toISOString().split('T')[0]}.pdf`
    })
    return pdfBlob
  } catch (error) {
    console.error('PDF 저장 오류:', error)
    throw error
  }
}

// Save PDF handler for footer button
const savePDF = () => {
  // Emit save event to parent component (Step3ExamSave)
  emit('save', {
    examTitle: examTitle.value,
    gradeCode: selectedGrade.value,
    gradeName: gradeMapping[selectedGrade.value],
    areaCode: selectedSubject.value,
    areaName: subjectMapping[selectedSubject.value],
    duration: duration.value,
    totalScore: totalScore.value
  })
}

// Expose method for parent component
defineExpose({
  generateAndSavePDF
})

// PDF용 MathJax 렌더링
const renderMathJaxForPDF = async (container) => {
  // 모든 수식 요소에 mathjax-content 클래스 추가
  const mathElements = container.querySelectorAll('.question-text, .passage-content, .choice-text')
  mathElements.forEach(el => {
    if (!el.classList.contains('mathjax-content')) {
      el.classList.add('mathjax-content')
      el.setAttribute('data-mathjax-pending', 'true')
    }
  })
  
  // 스마트 병렬 렌더링
  await renderMathJaxSmartHybrid(container, {
    hideBeforeRender: false,
    clearFirst: false
  })
  
  // MathJax 렌더링 후 이미지 크기 조정 (더 크게)
  console.log('MathJax 렌더링 후 이미지 크기 조정 시작')
  const allImages = container.querySelectorAll('img')
  console.log(`총 ${allImages.length}개의 이미지 발견`)
  
  allImages.forEach(img => {
    // img_box 내부 이미지 처리 (표 이미지)
    const imgBox = img.closest('.img_box')
    if (imgBox) {
      console.log('img_box 내부 이미지 발견')
      imgBox.style.setProperty('max-width', '300px', 'important')
      imgBox.style.setProperty('display', 'inline-block', 'important')
      imgBox.style.setProperty('vertical-align', 'middle', 'important')
      img.style.setProperty('max-width', '100%', 'important')
      img.style.setProperty('max-height', '160px', 'important')
      img.style.setProperty('object-fit', 'scale-down', 'important')
    } else {
      // 일반 이미지
      img.style.setProperty('max-width', '250px', 'important')
      img.style.setProperty('max-height', '180px', 'important')
      img.style.setProperty('object-fit', 'scale-down', 'important')
      img.style.setProperty('display', 'inline-block', 'important')
      img.style.setProperty('vertical-align', 'middle', 'important')
    }
    
    // 천재교육 플랫폼 이미지
    if (img.src && img.src.includes('chunjae-platform')) {
      console.log('천재교육 이미지 발견:', img.src)
      img.style.setProperty('max-width', '280px', 'important')
      img.style.setProperty('max-height', '150px', 'important')
    }
  })
  
  console.log('이미지 크기 조정 완료')
}

// Initialize exam info from store
const initializeExamInfo = () => {
  const testBankStore = useTestBankStore()
  const examInfo = testBankStore.examInfo
  
  if (examInfo) {
    // Set grade
    if (examInfo.gradeCode) {
      selectedGrade.value = examInfo.gradeCode
    }
    
    // Set subject
    if (examInfo.areaCode) {
      selectedSubject.value = examInfo.areaCode
    } else if (examInfo.subjectCode) {
      selectedSubject.value = examInfo.subjectCode
    }
    
    // Set exam title if available
    if (examInfo.title || examInfo.examName) {
      examTitle.value = examInfo.title || examInfo.examName
    }
    
    // Update subject display name
    updateSubjectInfo()
  }
}

// Initialize MathJax and render
onMounted(async () => {
  // Initialize exam info from store
  initializeExamInfo()
  
  // Calculate initial pagination
  calculateDynamicPagination()
  
  // Debug logging
  console.log('ExamPDFPreviewFixed mounted:', {
    selectedItems: props.selectedItems,
    allQuestions: allQuestions.value,
    totalPages: totalPages.value,
    currentPage: currentPage.value
  })
  
  // MathJax 초기화
  if (!window.MathJax) {
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
    }
    
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js'
    script.async = true
    document.head.appendChild(script)
  }
  
  // 초기 렌더링
  await nextTick()
  await renderCurrentPageMath()
})

// 현재 페이지 MathJax 렌더링
const renderCurrentPageMath = async () => {
  await nextTick()
  
  // requestAnimationFrame을 사용하여 렌더링 최적화 (Step2와 동일)
  requestAnimationFrame(async () => {
    const container = document.querySelector('.a4-page') || document.querySelector('.preview-content')
    if (container) {
      // 스마트 하이브리드 렌더링 (Step2와 동일한 옵션)
      await renderMathJaxSmartHybrid(container, {
        hideBeforeRender: true,
        clearFirst: false
      })
      
      // 렌더링 후 이미지 크기 조정 (더 크게)
      const allImages = container.querySelectorAll('img')
      allImages.forEach(img => {
        // img_box 내부 이미지 처리 (표 이미지)
        const imgBox = img.closest('.img_box')
        if (imgBox) {
          // img_box 컨테이너 스타일
          imgBox.style.setProperty('max-width', '320px', 'important')
          imgBox.style.setProperty('display', 'inline-block', 'important')
          imgBox.style.setProperty('vertical-align', 'middle', 'important')
          // 내부 이미지 스타일
          img.style.setProperty('max-width', '100%', 'important')
          img.style.setProperty('max-height', '160px', 'important')
          img.style.setProperty('object-fit', 'scale-down', 'important')
        }
        
        // 천재교육 플랫폼 이미지
        if (img.src && img.src.includes('chunjae-platform')) {
          img.style.setProperty('max-width', '280px', 'important')
          img.style.setProperty('max-height', '150px', 'important')
        }
      })
    }
  })
}

// 페이지 변경 시 MathJax 재렌더링
watch(currentPage, async () => {
  await renderCurrentPageMath()
  // 병렬 하이브리드로 추가 처리 (Step2 방식)
  const elements = document.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  if (elements.length > 0) {
    await renderMathJaxParallelHybrid(elements)
  }
})

// 레이아웃 변경 시 MathJax 재렌더링
watch(layoutMode, async () => {
  await renderCurrentPageMath()
  // 병렬 하이브리드로 추가 처리
  const elements = document.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  if (elements.length > 0) {
    await renderMathJaxParallelHybrid(elements)
  }
})
</script>

<style scoped>
.exam-pdf-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
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
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  max-width: 600px;
  margin: 0 1rem;
}

.settings-row {
  display: flex;
  gap: 0.75rem;
}

.grade-select,
.subject-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  min-width: 150px;
}

.grade-select:focus,
.subject-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
  max-height: calc(100% - 150px); /* 헤더와 네비게이션 높이 제외 */
  min-height: 0; /* Important for flexbox overflow */
}

/* A4 Page */
.a4-page {
  width: 210mm;
  min-height: 297mm; /* 고정 높이 대신 최소 높이 사용 */
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 15mm 20mm 20mm 20mm; /* 상단 여백 줄임 */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: visible; /* hidden에서 visible로 변경 */
  position: relative;
  box-sizing: border-box;
}

.pdf-page {
  page-break-after: always;
  margin-bottom: 20mm;
  min-height: 297mm; /* A4 height */
  max-height: 297mm;
  overflow: hidden;
  position: relative;
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
  overflow: visible; /* hidden에서 visible로 변경 */
  /* max-height 제거하여 내용이 잘리지 않도록 함 */
  /* Ensure proper column and page breaks */
  break-before: auto;
  break-after: auto;
  min-height: 250mm; /* Minimum content height */
}

/* Single Column Layout */
.page-content.layout-single .questions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: visible; /* hidden에서 visible로 변경 */
}

/* Two-column layout with CSS columns for automatic flow */
.two-column-wrapper {
  /* Use CSS columns for automatic content flow */
  column-count: 2;
  column-gap: 2rem;
  column-rule: 1px solid #e0e6ed;
  column-fill: balance;
  overflow: visible;
  /* Ensure proper page breaks */
  break-before: auto;
  break-after: auto;
  break-inside: auto;
}

/* Remove manual column styling for CSS columns */
.two-column-wrapper .column {
  /* Columns are handled automatically by CSS columns */
  display: none; /* Hide manual column divs */
}

/* Direct children of two-column wrapper for automatic flow */
.two-column-wrapper > .passage-group,
.two-column-wrapper > .question-item {
  break-inside: avoid;
  margin-bottom: 0.75rem;
  display: block;
}

/* Passage Group */
.passage-group {
  margin-bottom: 1rem;
  page-break-inside: avoid;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
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
  page-break-inside: avoid;
  page-break-after: avoid;
}

.passage-content {
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #2c3e50;
  /* 지문을 한 번에 표시하도록 변경 */
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Image sizing in all content areas - 더 크게 조정 */
.passage-content img,
.question-text img,
.choice-text img {
  max-width: 60% !important;
  width: auto !important;
  height: auto !important;
  max-height: 200px !important;
  display: inline-block !important;
  margin: 0.5rem 0.8rem !important;
  object-fit: contain !important;
  vertical-align: middle !important;
}

/* img_box 클래스를 가진 컨테이너의 이미지 특별 처리 - 표 이미지 */
.img_box {
  display: inline-block !important;
  max-width: 350px !important;
  width: auto !important;
  margin: 0.8rem auto !important;
  vertical-align: middle !important;
}

.img_box img {
  max-width: 100% !important;
  max-height: 180px !important;
  width: auto !important;
  height: auto !important;
  object-fit: scale-down !important;
  display: block !important;
}

/* 문제 내 img_box 표 이미지 */
.question-text .img_box,
.choice-text .img_box,
.passage-content .img_box {
  max-width: 320px !important;
}

.question-text .img_box img,
.choice-text .img_box img,
.passage-content .img_box img {
  max-height: 160px !important;
}

/* JPG 이미지 특별 처리 (천재교육 플랫폼) */
img[src*="chunjae-platform"],
img[src$=".JPG"],
img[src$=".jpg"] {
  max-width: 300px !important;
  max-height: 160px !important;
  object-fit: scale-down !important;
  display: inline-block !important;
}

/* 표 이미지는 특별히 더 작게 */
.passage-content table,
.question-text table {
  max-width: 80%;
  margin: 0.5rem auto;
}

.passage-content table img,
.question-text table img {
  max-width: 100%;
  max-height: 100px; /* 200px -> 100px로 축소 */
}

/* 일반 표 형태의 이미지 (표처럼 보이는 PNG) */
.passage-content img[src*="table"],
.question-text img[src*="table"],
.passage-content img[src*="표"],
.question-text img[src*="표"],
.passage-content img.table-image,
.question-text img.table-image {
  max-width: 70%;
  max-height: 120px;
  display: block;
  margin: 0.5rem auto;
}

/* Math formulas in images - 수식은 더 작게 */
.passage-content img[src*="math"],
.question-text img[src*="math"],
.choice-text img[src*="math"],
.passage-content img[src*="formula"],
.question-text img[src*="formula"],
.choice-text img[src*="formula"] {
  max-height: 40px; /* 60px -> 40px */
  max-width: auto;
  display: inline-block;
  vertical-align: middle;
  margin: 0 0.25rem;
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
  -webkit-column-break-inside: avoid;
  margin-bottom: 0.75rem;
  position: relative;
  /* Prevent orphaned questions */
  orphans: 3;
  widows: 3;
}

/* Force page break after every 10-12 questions */
.question-item:nth-child(12n) {
  page-break-after: always;
}

.question-item.standalone {
  margin-bottom: 1rem;
  break-inside: avoid;
  page-break-inside: avoid;
  column-break-inside: avoid;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.question-number {
  font-weight: 600;
  color: #2563eb;
  font-size: 0.9rem;
}

.question-points {
  font-size: 0.875rem;
  color: #606f7b;
}

.question-text {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: #2c3e50;
  font-size: 0.875rem;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
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
  line-height: 1.5;
  color: #2c3e50;
  font-size: 0.825rem;
}

/* Page Footer */
.page-footer {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #606f7b;
  font-size: 0.875rem;
  width: 100%;
}

/* PDF Generation */
.pdf-pages {
  background: white;
  /* Handle multiple pages properly */
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

/* MathJax Styles */
.mathjax-content mjx-container {
  font-size: inherit !important;
  margin: 0.25em 0;
}

.mathjax-content mjx-container[display="true"] {
  margin: 1em 0;
  text-align: center;
}

/* MathJax 처리된 콘텐츠 내부의 이미지 강제 크기 조정 */
.mathjax-processed .img_box,
.mathjax-rendered .img_box,
.mathjax-content .img_box {
  max-width: 80px !important;
  width: auto !important;
  display: inline-block !important;
  vertical-align: middle !important;
}

.mathjax-processed .img_box img,
.mathjax-rendered .img_box img,
.mathjax-content .img_box img {
  max-width: 80px !important;
  max-height: 18px !important;
  width: auto !important;
  height: auto !important;
  object-fit: scale-down !important;
}

/* MathJax 처리된 콘텐츠의 모든 이미지 강제 축소 */
.mathjax-processed img,
.mathjax-rendered img,
.mathjax-content img,
.question-text.mathjax-processed img,
.question-text.mathjax-rendered img {
  max-width: 70px !important;
  max-height: 18px !important;
  width: auto !important;
  height: auto !important;
  object-fit: scale-down !important;
  display: inline-block !important;
  vertical-align: middle !important;
}

/* 천재교육 플랫폼 이미지 특별 강제 처리 */
img[src*="chunjae-platform"] {
  max-width: 70px !important;
  max-height: 16px !important;
  width: auto !important;
  height: auto !important;
}

.question-text mjx-container,
.choice-text mjx-container {
  display: inline-block;
  vertical-align: middle;
}

.passage-content mjx-container {
  font-size: 0.95em;
}

/* Continuation Indicators for Split Content */
.passage-continuation-indicator,
.passage-continue-indicator,
.passage-continue,
p.passage-continue,
.continuation-header {
  color: #606f7b;
  font-style: italic;
  font-size: 0.875rem;
  margin: 0.75rem 0;
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border-left: 3px solid #cbd5e0;
  display: block;
  clear: both;
}

.passage-group.continuation {
  margin-top: 1.5rem;
}

.continuation-header {
  margin-bottom: 1rem;
  font-weight: 500;
}

/* PDF Page Break Control */
.question-block,
.question-item,
.passage-group {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

.page-break-before {
  page-break-before: always !important;
}

.page-break-after {
  page-break-after: always !important;
}

/* PDF Font Optimization */
@media print {
  /* A4 page setup */
  @page {
    size: A4;
    margin: 15mm 15mm 20mm 15mm;
  }
  
  body {
    font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif !important;
  }
  
  .exam-title {
    font-size: 18pt !important;
    font-weight: bold !important;
    margin-bottom: 10mm !important;
  }
  
  .question-number {
    font-size: 10pt !important;
    font-weight: bold !important;
  }
  
  .question-text {
    font-size: 10pt !important;
    line-height: 1.5 !important;
  }
  
  .passage-content {
    font-size: 9.5pt !important;
    line-height: 1.6 !important;
    text-align: justify !important;
  }
  
  .choice-text {
    font-size: 9.5pt !important;
    line-height: 1.4 !important;
  }
  
  /* MathJax 수식 크기 */
  mjx-container {
    font-size: 10pt !important;
  }
  
  mjx-container[display="false"] {
    font-size: 9.5pt !important;
  }
  
  mjx-container[display="true"] {
    font-size: 10pt !important;
    margin: 8px 0 !important;
  }
  
  /* 페이지 설정 */
  @page {
    size: A4;
    margin: 15mm 10mm;
  }
  
  /* 문제가 페이지를 넘어가지 않도록 */
  .question-item {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-bottom: 10mm !important;
  }
  
  .passage-group {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  /* 지문과 관련 문제 함께 유지 */
  .passage-section + .question-item {
    page-break-before: avoid !important;
  }
  
  /* 숨김 요소 */
  .preview-header,
  .page-navigation,
  .loading-overlay {
    display: none !important;
  }
  
  .preview-container {
    padding: 0;
    transform: none !important;
  }
  
  .a4-page {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
    width: 100%;
    height: auto;
    padding: 0;
  }
  
  .pdf-page {
    page-break-after: always !important;
    min-height: 277mm !important; /* A4 minus margins */
    max-height: 277mm !important;
  }
  
  /* Image sizing for print - 인쇄 시 더 작게 */
  .passage-content img,
  .question-text img,
  .choice-text img {
    max-width: 50% !important;
    max-height: 60px !important;
    page-break-inside: avoid !important;
  }
  
  /* 표 이미지는 인쇄 시 특별 처리 */
  .passage-content table img,
  .question-text table img,
  .passage-content img[src*="table"],
  .question-text img[src*="table"],
  /* PNG 파일 및 표 이미지 특별 처리 - 매우 작게 */
  .passage-content img[src*="표"],
  .question-text img[src*="표"],
  .passage-content img[src*="table"],
  .question-text img[src*="table"],
  .passage-content img[src$=".png"],
  .question-text img[src$=".png"],
  .choice-text img[src$=".png"] {
    max-width: 80px !important;
    max-height: 20px !important;
    object-fit: scale-down !important;
    display: inline-block !important;
  }
  
  /* 수식 이미지는 인쇄 시 더 작게 */
  img[src*="math"], 
  img[src*="formula"],
  img[src*="equation"] {
    max-height: 25px !important;
    max-width: auto !important;
  }

  /* 일반 이미지도 인쇄시 더 작게 */
  .passage-content img,
  .question-text img,
  .choice-text img {
    max-height: 40px !important;
    max-width: 35% !important;
  }
  
  /* Hide input elements in print */
  input, textarea, [contenteditable] {
    display: none !important;
  }
  
  /* Ensure columns work in print */
  .two-column-wrapper {
    column-count: 2 !important;
    column-gap: 15mm !important;
  }
}

/* Footer Styles */
.preview-footer {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e0e6ed;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.04);
  z-index: 100;
  margin-top: auto;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.footer-actions {
  display: flex;
  gap: 1rem;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-action.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e0e6ed;
}

.btn-action.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
}

.btn-action.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
}

.btn-action.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}
</style>