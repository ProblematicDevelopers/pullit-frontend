<template>
  <div class="exam-test-preview">
    <!-- Header -->
    <div class="preview-header">
      <div class="header-left">
        <h3>시험지 미리보기 TEST (2컬럼)</h3>
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

      <!-- Simple controls: page navigation only for test component -->
      <div class="header-controls">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="nav-btn"
          title="이전 페이지"
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
          title="다음 페이지"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="preview-body">
      <div class="a4-page">
        <!-- First Page Header -->
        <div v-if="currentPage === 1" class="page-header">
          <h1 class="exam-title">{{ examTitle }}</h1>
          <div class="exam-info">
            <span>과목: {{ subject }}</span>
            <span>시간: {{ duration }}분</span>
            <span>총점: {{ totalScore }}점</span>
          </div>
        </div>

        <div class="page-content two-column-manual">
          <div class="column">
            <template v-for="(group, idx) in getPageColumn(currentPage, 1)" :key="`col1-${idx}`">
              <template v-if="group.type === 'passage-with-questions' || group.type === 'passage-only'">
                <div class="passage-group">
                  <div class="passage-header">[{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.</div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>
              </template>
              <template v-if="group.type === 'questions-only' || group.type === 'standalone-question'">
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, cidx) in item.choices" :key="cidx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(cidx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
          <div class="column">
            <template v-for="(group, idx) in getPageColumn(currentPage, 2)" :key="`col2-${idx}`">
              <template v-if="group.type === 'passage-with-questions' || group.type === 'passage-only'">
                <div class="passage-group">
                  <div class="passage-header">[{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.</div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>
              </template>
              <template v-if="group.type === 'questions-only' || group.type === 'standalone-question'">
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, cidx) in item.choices" :key="cidx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(cidx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>

        <div class="page-footer">- {{ currentPage }} -</div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'
import DOMPurify from 'dompurify'
import { renderMathJaxSmartHybrid, renderMathJaxParallelHybrid } from '@/utils/mathjax-hybrid'
import { paginateContent } from '@/utils/pdf-paginator-v2'

// Props
const props = defineProps({
  selectedItems: {
    type: Array,
    default: () => []
  }
})

// Emits (keep same as existing for compatibility)
defineEmits(['download', 'save'])

// Local state
const currentPage = ref(1)
const pageContents = ref([])

// Display info (simple)
const examTitle = ref('시험지 미리보기')
const subject = ref('과목')
const duration = ref(50)
const totalScore = ref(100)

// Build question list
const itemStore = useItemSelectionStore()
const allQuestions = computed(() => {
  const items = (props.selectedItems && props.selectedItems.length > 0)
    ? props.selectedItems
    : (itemStore.selectedItems || [])

  return items.map((item, index) => ({
    ...item,
    id: item.itemId || item.id || `q-${index}`,
    displayNumber: item.displayNumber || index + 1,
    questionHtml: item.questionHtml || item.questionText || item.question || '',
    passageHtml: item.passageHtml || item.passage || '',
    passageText: item.passageText || item.passage_text || '',
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

// Calculate pages (force double layout) with guard
const recalcPages = async () => {
  try {
    if (allQuestions.value.length === 0) {
      pageContents.value = [{ column1: [], column2: [] }]
      currentPage.value = 1
      return
    }
    const pages = await paginateContent(allQuestions.value, 'double')
    pageContents.value = Array.isArray(pages) && pages.length > 0
      ? pages
      : [{ column1: [], column2: [] }]
    currentPage.value = 1
    await nextTick()
    await renderCurrentPageMath()
  } catch (err) {
    console.error('[ExamPDFPreviewTest] 페이지 분할 중 오류:', err)
    // Fallback to a single empty page to avoid render crash
    pageContents.value = [{ column1: [], column2: [] }]
    currentPage.value = 1
  }
}

watch(allQuestions, () => recalcPages(), { immediate: true })

const totalPages = computed(() => Math.max(1, pageContents.value.length))

const getPageColumn = (pageNum, columnNum) => {
  const page = pageContents.value[pageNum - 1]
  if (!page) return []
  return columnNum === 1 ? (page.column1 || []) : (page.column2 || [])
}

const getChoiceNumber = (idx) => ['①','②','③','④','⑤'][idx] || `${idx+1}.`

// Sanitize HTML content
const sanitizeHtml = (html) => {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ADD_TAGS: [
      'math','mrow','mi','mn','mo','mfrac','msup','msub','munder','mover','msqrt','mroot',
      'table','thead','tbody','tfoot','tr','th','td','caption','colgroup','col',
      'span','div','p','br','hr','strong','em','u','sub','sup',
      'ul','ol','li','img'
    ],
    ADD_ATTR: [
      'mathvariant','display','data-latex','data-math',
      'class','style','id','colspan','rowspan','border','cellpadding','cellspacing','align','valign',
      'src','alt','width','height','title'
    ],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['script','iframe','object','embed','applet'],
    FORCE_BODY: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|data|blob):|[^:]+$)/i
  })
}

// MathJax rendering for current page
const renderCurrentPageMath = async () => {
  await nextTick()
  const container = document.querySelector('.exam-test-preview .a4-page')
  if (!container) return
  await renderMathJaxSmartHybrid(container, { hideBeforeRender: true, clearFirst: false })
  const pendings = container.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  if (pendings.length > 0) await renderMathJaxParallelHybrid(pendings)
}

watch(currentPage, renderCurrentPageMath)

onMounted(async () => {
  await renderCurrentPageMath()
})

// Optional method for parent compatibility (returns null to skip PDF generation)
function generateAndSavePDF() {
  return null
}

defineExpose({ generateAndSavePDF })
</script>

<style scoped>
.exam-test-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  background: #f5f7fa;
}

.preview-header {
  background: white;
  border-bottom: 1px solid #e0e6ed;
  padding: 0.875rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.header-info {
  display: flex;
  gap: 0.75rem;
}

.info-item { color: #475569; display: inline-flex; gap: 6px; align-items: center; font-size: 0.9rem; }

.header-controls { display: inline-flex; gap: 8px; align-items: center; }
.nav-btn {
  background: white; border: 1px solid #e2e8f0; color: #334155; width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer;
}
.nav-btn:disabled { opacity: .5; cursor: not-allowed; }
.page-info { display: inline-flex; gap: 6px; min-width: 70px; justify-content: center; color: #334155; }

.preview-body { flex: 1; overflow: auto; padding: 1rem; }

.a4-page {
  width: 794px; /* 210mm @ 96DPI approx */
  min-height: 1122px; /* 297mm @ 96DPI approx */
  margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.06);
  position: relative; padding: 48px 56px 56px; box-sizing: border-box;
}

.page-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
.exam-title { font-size: 24px; color: #1f2937; margin: 0; }
.exam-info { color: #64748b; display: flex; gap: 16px; justify-content: center; margin-top: 8px; }

.page-content.two-column-manual { display: grid; grid-template-columns: 1fr 1fr; column-gap: 32px; row-gap: 0; }
.column { min-width: 0; }

.passage-group { break-inside: avoid; page-break-inside: avoid; margin: 0 0 16px; }
.passage-header { background: #2563eb; color: white; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px; font-weight: 600; font-size: 0.9rem; }
.passage-content { padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }

.question-item { break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px; }
.question-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.question-number { font-weight: 700; color: #2563eb; }
.question-points { color: #64748b; font-size: 0.9rem; }
.question-text { color: #1f2937; line-height: 1.72; font-size: 0.92rem; }
.choices { display: flex; flex-direction: column; gap: 6px; padding-left: 12px; }
.choice { display: flex; gap: 8px; align-items: flex-start; }
.choice-number { color: #475569; min-width: 20px; }
.choice-text { color: #111827; line-height: 1.6; font-size: 0.9rem; }

.page-footer { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: #64748b; font-size: 0.9rem; }

.mathjax-content mjx-container { font-size: inherit !important; }
</style>
