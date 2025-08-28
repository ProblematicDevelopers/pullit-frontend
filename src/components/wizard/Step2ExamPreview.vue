<!--
  Step2: 기존 시험지 문항 미리보기
  
  기존 시험지를 선택한 후 문항들을 미리보기하는 컴포넌트입니다.
  Step2SimpleGeneration의 미리보기 모드와 유사한 UI를 제공합니다.
-->

<template>
  <div class="step2-exam-preview">
    <!-- 미리보기 헤더 -->
    <header class="step-header">
      <button class="btn-back" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        뒤로가기
      </button>
      
      <div class="header-info">
        <h2>{{ examTitle }} - 문항 확인</h2>
        <p class="header-desc">시험지의 {{ items.length }}개 문항을 확인하세요</p>
      </div>
    </header>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>문항을 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="retryLoad" class="btn-retry">다시 시도</button>
    </div>

    <!-- 문항 목록 -->
    <div v-else-if="items.length > 0" class="preview-items">
      <div class="items-header">
        <h3>문항 목록</h3>
        <span class="item-count">총 {{ items.length }}문항</span>
      </div>
      
      <!-- 지문 그룹 표시 (passageId가 있는 문제들) -->
      <div v-if="hasPassageGroups" class="passage-groups">
        <div 
          v-for="group in passageGroups"
          :key="group.passageId"
          class="passage-group"
        >
          <!-- 왼쪽: 지문 영역 -->
          <div class="passage-section">
            <div class="passage-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>지문</span>
            </div>
            <div class="passage-content">
              <div v-if="group.passageHtml" v-html="sanitizeHtml(group.passageHtml)" class="passage-text math-content"></div>
              <div v-else-if="group.passageText" class="passage-text">{{ group.passageText }}</div>
            </div>
          </div>
          
          <!-- 오른쪽: 문제 영역 -->
          <div class="passage-items">
            <div 
              v-for="(item, index) in group.items"
              :key="item.itemId"
              class="item-card"
            >
              <!-- 카드 헤더 -->
              <div class="card-header">
                <span class="item-number">{{ getItemNumber(item, index) }}</span>
                <div class="item-badges">
                  <span v-if="item.difficulty" :class="'badge-difficulty difficulty-' + (item.difficulty?.code || item.difficulty?.toLowerCase())">
                    {{ item.difficulty?.name || item.difficulty }}
                  </span>
                  <span v-if="item.questionForm" class="badge-type">{{ item.questionForm?.name || item.questionForm }}</span>
                  <button 
                    class="btn-similar-items"
                    @click.stop="openSimilarItemsModal(item)"
                    title="유사 문항 조회"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
                            stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    유사문항
                  </button>
                </div>
              </div>
              
              <!-- 카드 내용 -->
              <div class="card-body">
                <!-- 문제 내용 -->
                <div class="question-section">
                  <div v-if="item.questionHtml" class="item-html math-content" v-html="sanitizeHtml(item.questionHtml)"></div>
                  <div v-else-if="item.questionImageUrl" class="item-image">
                    <img 
                      :src="item.questionImageUrl" 
                      :alt="`문항 ${getItemNumber(item, index)}`"
                      loading="lazy"
                    />
                  </div>
                  <div v-else class="item-text">
                    {{ item.questionText || '내용 없음' }}
                  </div>
                </div>

                <!-- 선택지 (객관식인 경우) -->
                <div v-if="hasChoices(item)" class="item-choices">
                  <div v-if="item.choice1Html || item.choice1Text" class="choice">
                    ① <span v-if="item.choice1Html" v-html="sanitizeHtml(item.choice1Html)" v-mathjax></span>
                    <span v-else>{{ item.choice1Text }}</span>
                  </div>
                  <div v-if="item.choice2Html || item.choice2Text" class="choice">
                    ② <span v-if="item.choice2Html" v-html="sanitizeHtml(item.choice2Html)" v-mathjax></span>
                    <span v-else>{{ item.choice2Text }}</span>
                  </div>
                  <div v-if="item.choice3Html || item.choice3Text" class="choice">
                    ③ <span v-if="item.choice3Html" v-html="sanitizeHtml(item.choice3Html)" v-mathjax></span>
                    <span v-else>{{ item.choice3Text }}</span>
                  </div>
                  <div v-if="item.choice4Html || item.choice4Text" class="choice">
                    ④ <span v-if="item.choice4Html" v-html="sanitizeHtml(item.choice4Html)" v-mathjax></span>
                    <span v-else>{{ item.choice4Text }}</span>
                  </div>
                  <div v-if="item.choice5Html || item.choice5Text" class="choice">
                    ⑤ <span v-if="item.choice5Html" v-html="sanitizeHtml(item.choice5Html)" v-mathjax></span>
                    <span v-else>{{ item.choice5Text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 일반 문항 그리드 뷰 (지문이 없는 문제들) -->
      <div class="items-grid">
        <div
          v-for="(item, index) in regularItems"
          :key="item.itemId"
          class="item-card"
        >
          <!-- 카드 헤더 -->
          <div class="card-header">
            <span class="item-number">{{ getItemNumber(item, index) }}</span>
            <div class="item-badges">
              <span v-if="item.difficulty" :class="'badge-difficulty difficulty-' + (item.difficulty?.code || item.difficulty?.toLowerCase())">
                {{ item.difficulty?.name || item.difficulty }}
              </span>
              <span v-if="item.questionForm" class="badge-type">{{ item.questionForm?.name || item.questionForm }}</span>
              <button 
                class="btn-similar-items"
                @click.stop="openSimilarItemsModal(item)"
                title="유사 문항 조회"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                유사문항
              </button>
            </div>
          </div>
          
          <!-- 카드 내용 -->
          <div class="card-body">
            <!-- 문제 내용 -->
            <div class="question-section">
              <div v-if="item.questionHtml" class="item-html" v-html="sanitizeHtml(item.questionHtml)"></div>
              <div v-else-if="item.questionImageUrl" class="item-image">
                <img 
                  :src="item.questionImageUrl" 
                  :alt="`문항 ${getItemNumber(item, index)}`"
                  loading="lazy"
                />
              </div>
              <div v-else class="item-text">
                {{ item.questionText || '내용 없음' }}
              </div>
            </div>

            <!-- 선택지 (객관식인 경우) -->
            <div v-if="hasChoices(item)" class="item-choices math-content">
              <div v-if="item.choice1Html || item.choice1Text" class="choice">
                ① <span v-if="item.choice1Html" v-html="sanitizeHtml(item.choice1Html)" class="choice-content"></span>
                <span v-else>{{ item.choice1Text }}</span>
              </div>
              <div v-if="item.choice2Html || item.choice2Text" class="choice">
                ② <span v-if="item.choice2Html" v-html="sanitizeHtml(item.choice2Html)" class="choice-content"></span>
                <span v-else>{{ item.choice2Text }}</span>
              </div>
              <div v-if="item.choice3Html || item.choice3Text" class="choice">
                ③ <span v-if="item.choice3Html" v-html="sanitizeHtml(item.choice3Html)" class="choice-content"></span>
                <span v-else>{{ item.choice3Text }}</span>
              </div>
              <div v-if="item.choice4Html || item.choice4Text" class="choice">
                ④ <span v-if="item.choice4Html" v-html="sanitizeHtml(item.choice4Html)" class="choice-content"></span>
                <span v-else>{{ item.choice4Text }}</span>
              </div>
              <div v-if="item.choice5Html || item.choice5Text" class="choice">
                ⑤ <span v-if="item.choice5Html" v-html="sanitizeHtml(item.choice5Html)" class="choice-content"></span>
                <span v-else>{{ item.choice5Text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-state">
      <p>문항이 없습니다.</p>
    </div>

    <!-- 하단 액션 버튼 -->
    <div class="step-footer">
      <button class="btn-secondary" @click="handleBack">
        이전 단계
      </button>
      <button class="btn-primary" @click="handleNext" :disabled="items.length === 0">
        다음 단계 (저장)
      </button>
    </div>
    
    <!-- 유사 문항 조회 모달 -->
    <SimilarItemsModal
      v-model="showSimilarItemsModal"
      :item="selectedItemForSimilar"
      @add-items="handleAddSimilarItems"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { useItemSelectionStore } from '@/stores/itemSelection'
import examApiService from '@/services/examApi'
import api from '@/services/api'
import DOMPurify from 'dompurify'
import { useMathJax } from '@/composables/useMathJax'
import SimilarItemsModal from '@/components/common/SimilarItemsModal.vue'

const props = defineProps({
  examInfo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'next'])

const testBankStore = useTestBankStore()
const itemSelectionStore = useItemSelectionStore()

// 상태 변수
const items = ref([])
const isLoading = ref(true)
const error = ref(null)
const examTitle = computed(() => props.examInfo?.title || props.examInfo?.examName || '시험지')

// 유사 문항 모달 관련 상태
const showSimilarItemsModal = ref(false)
const selectedItemForSimilar = ref(null)

// MathJax 컴포저블 사용 - 안전한 렌더링 설정
const { render: renderMath } = useMathJax({
  immediate: false,
  watchContent: false,  // Vue 재렌더링과 충돌 방지
  hideBeforeRender: true,  // 렌더링 전 숨김
  clearFirst: true,  // 기존 렌더링 정리
  debounceDelay: 200,  // 렌더링 안정화를 위한 지연
  targetSelector: '.math-content'  // math-content 클래스를 가진 요소만 렌더링
})

// 지문이 있는 그룹과 일반 문항 분리
const passageGroups = computed(() => {
  const groups = {}
  items.value.forEach(item => {
    if (item.passageId) {
      if (!groups[item.passageId]) {
        groups[item.passageId] = {
          passageId: item.passageId,
          passageHtml: item.passageHtml,
          passageText: item.passageText,
          items: []
        }
      }
      groups[item.passageId].items.push(item)
    }
  })
  return Object.values(groups)
})

const regularItems = computed(() => {
  return items.value.filter(item => !item.passageId)
})

const hasPassageGroups = computed(() => {
  return passageGroups.value.length > 0
})

// 문항 번호 표시
const getItemNumber = (item, index) => {
  // 전체 items 배열에서의 인덱스 찾기
  const globalIndex = items.value.findIndex(i => i.itemId === item.itemId)
  return globalIndex >= 0 ? `문항 ${globalIndex + 1}` : `문항 ${index + 1}`
}

// HTML 정화 - 도수분포표와 지문 콘텐츠 보존
const sanitizeHtml = (html) => {
  if (!html) return ''
  
  // DOMPurify를 사용한 안전한 HTML 정화
  // LaTeX 수식, MathJax, 테이블, 이미지 모두 보존
  const cleaned = DOMPurify.sanitize(html, {
    ADD_TAGS: [
      // MathJax 관련 태그
      'math', 'mrow', 'mi', 'mn', 'mo', 'mfrac', 'msup', 'msub', 'munder', 'mover', 'msqrt', 'mroot',
      // HTML 테이블 태그 (도수분포표용)
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      // 기본 HTML 태그
      'span', 'div', 'p', 'br', 'hr', 'strong', 'em', 'u', 'sub', 'sup',
      // 리스트 태그
      'ul', 'ol', 'li'
    ],
    ADD_ATTR: [
      // MathJax 속성
      'mathvariant', 'display', 'data-latex', 'data-math',
      // 일반 속성
      'class', 'style', 'id',
      // 테이블 속성
      'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing', 'align', 'valign',
      // 이미지 속성
      'src', 'alt', 'width', 'height', 'title'
    ],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: true,
    // script 태그만 제거, img는 허용 (도수분포표가 이미지일 수 있음)
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'applet'],
    FORCE_BODY: false,
    // 안전한 이미지 URL만 허용
    ALLOWED_URI_REGEXP: /^(?:(?:https?|data|blob):|[^:]+$)/i
  })
  
  return cleaned
}

// 선택지가 있는지 확인
const hasChoices = (item) => {
  return item.choice1Html || item.choice1Text ||
         item.choice2Html || item.choice2Text ||
         item.choice3Html || item.choice3Text ||
         item.choice4Html || item.choice4Text ||
         item.choice5Html || item.choice5Text
}

// 문항 로드
const loadExamItems = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // examId가 있으면 API에서 직접 문항 로드
    const examId = props.examInfo?.examId || props.examInfo?.id
    
    if (examId) {
      console.log('API에서 문항 로드 중... examId:', examId)
      
      // 1단계: 시험지의 문항 ID 목록을 가져옴
      const response = await examApiService.getExamItems(examId)
      console.log('getExamItems 응답:', response)
      
      let itemIds = []
      
      // 응답에서 itemIds 추출
      if (response.data) {
        if (response.data.success && response.data.data) {
          // ApiResponse 구조인 경우
          if (response.data.data.itemIds) {
            itemIds = response.data.data.itemIds
          } else if (Array.isArray(response.data.data)) {
            itemIds = response.data.data
          }
        } else if (response.data.itemIds) {
          // 직접 itemIds가 있는 경우
          itemIds = response.data.itemIds
        } else if (Array.isArray(response.data)) {
          // response.data가 직접 ID 배열인 경우
          itemIds = response.data
        }
      }
      
      console.log('추출된 문항 ID 목록:', itemIds)
      
      let itemData = []
      
      // 2단계: itemIds로 실제 문항 데이터 가져오기
      if (itemIds && itemIds.length > 0) {
        try {
          console.log('문항 상세 정보 조회 중... IDs:', itemIds)
          const itemsResponse = await api.post('/items/batch', itemIds)
          console.log('문항 상세 정보 응답:', itemsResponse)
          
          // 원본 HTML 데이터 디버깅
          if (itemsResponse.data) {
            const responseData = itemsResponse.data.data || itemsResponse.data
            if (Array.isArray(responseData) && responseData.length > 0) {
              console.log('첫 번째 문항 원본 HTML:', responseData[0].questionHtml)
              console.log('첫 번째 문항 전체 데이터:', responseData[0])
            }
          }
          
          if (itemsResponse.data) {
            if (itemsResponse.data.success && itemsResponse.data.data) {
              itemData = itemsResponse.data.data
            } else if (Array.isArray(itemsResponse.data)) {
              itemData = itemsResponse.data
            } else if (itemsResponse.data.items) {
              itemData = itemsResponse.data.items
            }
          }
        } catch (err) {
          console.error('문항 상세 정보 조회 실패:', err)
          // 실패 시 기본 데이터로 표시
          itemData = itemIds.map((id, index) => ({
            itemId: id,
            questionNumber: index + 1,
            questionText: `문항 ${id}`,
            questionHtml: `<p>문항 ${id}의 내용을 불러올 수 없습니다.</p>`,
            difficulty: { code: 1, name: '보통' },
            questionForm: { name: '객관식' }
          }))
        }
      }
      
      console.log('처리된 문항 데이터:', itemData)
      
      if (itemData && itemData.length > 0) {
        items.value = itemData
        console.log(`${itemData.length}개 문항 로드 완료`)
        
        // store에도 저장
        itemSelectionStore.setSelectedItems(itemData)
        testBankStore.existingItemIds = itemData
      } else {
        // API 응답이 비어있으면 store에서 가져오기 시도
        if (itemSelectionStore.selectedItems && itemSelectionStore.selectedItems.length > 0) {
          items.value = itemSelectionStore.selectedItems
          console.log('Store에서 문항 로드')
        } else if (testBankStore.existingItemIds && testBankStore.existingItemIds.length > 0) {
          items.value = testBankStore.existingItemIds
          console.log('TestBank store에서 문항 로드')
        } else {
          console.warn('문항 데이터가 없습니다')
          error.value = '문항이 없습니다.'
        }
      }
    } else {
      // examId가 없으면 store에서 가져오기
      if (itemSelectionStore.selectedItems && itemSelectionStore.selectedItems.length > 0) {
        items.value = itemSelectionStore.selectedItems
      } else if (testBankStore.existingItemIds && testBankStore.existingItemIds.length > 0) {
        items.value = testBankStore.existingItemIds
      } else {
        error.value = 'examId가 없어 문항을 불러올 수 없습니다.'
      }
    }
  } catch (err) {
    console.error('문항 로드 실패:', err)
    error.value = '문항을 불러오는 중 오류가 발생했습니다: ' + (err.message || err)
  } finally {
    isLoading.value = false
    // MathJax 렌더링
    await nextTick()
    await renderMath()
  }
}

// 다시 시도
const retryLoad = () => {
  loadExamItems()
}

// 뒤로가기
const handleBack = () => {
  emit('back')
}

// 유사 문항 모달 메서드
const openSimilarItemsModal = (item) => {
  console.log('Opening similar items modal for:', item)
  selectedItemForSimilar.value = item
  showSimilarItemsModal.value = true
}

const handleAddSimilarItems = (similarItems) => {
  console.log('Adding similar items:', similarItems)
  // 선택된 유사 문항들을 items에 추가
  if (similarItems && similarItems.length > 0) {
    // 중복 체크 후 추가
    const existingItemIds = items.value.map(item => item.itemId || item.item_id)
    const newItems = similarItems.filter(item => !existingItemIds.includes(item.itemId || item.item_id))
    
    if (newItems.length > 0) {
      items.value.push(...newItems)
      console.log(`Added ${newItems.length} similar items to the list`)
    } else {
      console.log('All selected items already exist in the list')
    }
  }
}

// 다음 단계로
const handleNext = () => {
  // Step3로 이동
  emit('next')
}

// items 변경 시 MathJax 렌더링
watch(items, async () => {
  if (items.value.length > 0) {
    await nextTick()
    await renderMath()
  }
}, { deep: true })

onMounted(() => {
  loadExamItems()
})
</script>

<style scoped>
.step2-exam-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 헤더 스타일 */
.step-header {
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.header-info {
  flex: 1;
}

.header-info h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-desc {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 로딩 & 에러 상태 */
.loading-container,
.error-container,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #ef4444;
  font-size: 14px;
}

.btn-retry {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

/* 문항 미리보기 영역 */
.preview-items {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f9fafb;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.items-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.item-count {
  font-size: 14px;
  color: #6b7280;
  background: white;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #e5e5e5;
}

/* 지문 그룹 스타일 */
.passage-groups {
  margin-bottom: 24px;
}

.passage-group {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  gap: 20px;
}

.passage-section {
  flex: 0 0 40%;
  border-right: 1px solid #e5e5e5;
  padding-right: 20px;
}

.passage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.passage-content {
  max-height: 400px;
  overflow-y: auto;
}

.passage-text {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.passage-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 일반 문항 그리드 */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 16px;
}

/* 문항 카드 */
.item-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-number {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.item-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 유사 문항 버튼 */
.btn-similar-items {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;
}

.btn-similar-items:hover {
  background: #f9fafb;
  border-color: #3b82f6;
  color: #3b82f6;
}

.btn-similar-items:active {
  transform: scale(0.95);
}

.btn-similar-items svg {
  width: 14px;
  height: 14px;
}

.badge-difficulty,
.badge-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-difficulty {
  background: #e5e5e5;
  color: #374151;
}

.badge-difficulty.difficulty-1,
.badge-difficulty.difficulty-easy {
  background: #d1fae5;
  color: #065f46;
}

.badge-difficulty.difficulty-2,
.badge-difficulty.difficulty-medium {
  background: #dbeafe;
  color: #1e40af;
}

.badge-difficulty.difficulty-3,
.badge-difficulty.difficulty-hard {
  background: #fee2e2;
  color: #991b1b;
}

.badge-type {
  background: #f3e8ff;
  color: #6b21a8;
}

.card-body {
  padding: 16px;
}

.question-section {
  margin-bottom: 16px;
}

.item-html,
.item-text {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.item-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* 선택지 스타일 */
.item-choices {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.choice {
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
}

/* 하단 버튼 영역 */
.step-footer {
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.btn-secondary,
.btn-primary {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #3b82f6;
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* MathJax 렌더링 스타일 */
.math-content {
  /* MathJax 렌더링 전 깜빡임 방지 */
  min-height: 1em;
}

/* MathJax 요소 스타일 */
.math-content mjx-container {
  display: inline-block !important;
  margin: 0.2em 0;
}

/* MathJax 표 스타일 (도수분포표 등) */
.math-content mjx-container[display="true"] {
  display: block !important;
  text-align: center;
  margin: 1em 0;
}

/* MathJax 표 내부 정렬 */
.math-content mjx-mtable {
  margin: 0 auto;
}

/* 선택지 내 수식 정렬 */
.choice-content mjx-container {
  vertical-align: middle;
}

/* MathJax 렌더링 중 숨김 처리 */
.math-content[data-mathjax-pending="true"] {
  visibility: hidden;
}

/* MathJax 렌더링 완료 후 표시 */
.math-content.mathjax-processed {
  visibility: visible;
}

/* HTML 테이블 스타일 (도수분포표 등) */
.math-content table,
.passage-text table,
.item-html table {
  margin: 1em auto;
  border-collapse: collapse;
  border: 1px solid #ddd;
}

.math-content th,
.math-content td,
.passage-text th,
.passage-text td,
.item-html th,
.item-html td {
  padding: 8px 12px;
  border: 1px solid #ddd;
  text-align: center;
}

.math-content th,
.passage-text th,
.item-html th {
  background-color: #f5f5f5;
  font-weight: 600;
}

/* 이미지 스타일 */
.math-content img,
.passage-text img,
.item-html img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}
</style>