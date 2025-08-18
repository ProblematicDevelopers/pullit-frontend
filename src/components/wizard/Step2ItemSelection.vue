<!--
  시험지 마법사 Step 2: 문항 선택
  
  이 컴포넌트는 시험지에 포함할 문항들을 선택하는 단계입니다.
  주요 기능:
  - 문항 검색 및 필터링 (단원, 난이도, 문제 유형)
  - 문항 이미지 표시 (ItemImageData)
  - 문항 선택 및 순서 조정
  - 선택된 문항 미리보기
-->

<template>
  <div class="step2-container">
    <!-- 헤더 영역 -->
    <div class="selection-header">
      <div class="header-left">
        <button class="btn-back" @click="$emit('back')">← 이전</button>
        <h2>문항 선택</h2>
      </div>
      <div class="header-info">
        <span class="exam-name">{{ examInfo?.examName || '새 시험지' }}</span>
        <span class="divider">|</span>
        <span class="grade">{{ examInfo?.gradeName }}</span>
        <span class="divider">|</span>
        <span class="subject">{{ examInfo?.subjectName }}</span>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 왼쪽: 필터 및 문항 목록 -->
      <div class="left-panel">
        <!-- 교과서 선택 섹션 -->
        <div class="textbook-section">
          <div class="section-header">
            <h3>
              <span class="section-icon">📚</span>
              교과서 선택
            </h3>
            <span class="section-desc">여러 교과서의 문제를 함께 선택할 수 있습니다</span>
          </div>
          <!-- 교과서 로딩 중 -->
          <div v-if="isLoadingTextbooks" class="textbook-loading">
            <div class="spinner"></div>
            <p>교과서 목록을 불러오는 중...</p>
          </div>
          
          <!-- 교과서 그리드 -->
          <div v-else-if="availableTextbooks.length > 0" class="textbook-grid">
            <div 
              v-for="textbook in availableTextbooks" 
              :key="textbook.id"
              :class="['textbook-card', { 'selected': selectedTextbook === textbook.id }]"
              @click="selectTextbook(textbook)"
            >
              <div class="textbook-check">
                <span v-if="selectedTextbook === textbook.id">✓</span>
              </div>
              <!-- 교과서 이미지 또는 아이콘 -->
              <div class="textbook-icon">
                <img 
                  v-if="textbook.imageUrl" 
                  :src="textbook.imageUrl" 
                  :alt="textbook.name"
                  @error="handleTextbookImageError($event)"
                />
                <span v-else>📖</span>
              </div>
              <div class="textbook-info">
                <h4>{{ textbook.name }}</h4>
                <p class="publisher">{{ textbook.publisher }}</p>
                <span class="year-badge">{{ textbook.year }}</span>
              </div>
              <div class="item-count">
                <span class="count-number">{{ textbook.itemCount || '-' }}</span>
                <span class="count-label">문항</span>
              </div>
            </div>
          </div>
          
          <!-- 교과서가 없을 때 -->
          <div v-else class="no-textbooks">
            <p>해당 학년과 과목에 맞는 교과서가 없습니다.</p>
          </div>
        </div>

        <!-- 선택된 교과서의 대단원 목록 -->
        <div v-if="selectedTextbook && textbookChapters.length > 0" class="chapters-section">
          <div class="section-header">
            <h3>
              <span class="section-icon">📚</span>
              대단원 목록
            </h3>
          </div>
          <div class="chapters-list">
            <div 
              v-for="chapter in textbookChapters" 
              :key="chapter.id"
              :class="['chapter-item', { 'selected': selectedChapters.includes(chapter.id) }]"
              @click="toggleChapterSelection(chapter.id)"
            >
              <div class="chapter-checkbox">
                <input 
                  type="checkbox" 
                  :checked="selectedChapters.includes(chapter.id)"
                  @click.stop="toggleChapterSelection(chapter.id)"
                />
              </div>
              <div class="chapter-info">
                <span class="chapter-number">{{ chapter.chapterNo }}단원</span>
                <span class="chapter-name">{{ chapter.chapterName }}</span>
              </div>
              <div class="chapter-count">
                <span>{{ chapter.itemCount || 0 }}문항</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 필터 섹션 -->
        <div class="filter-section">
          <div class="section-header">
            <h3>
              <span class="section-icon">🔍</span>
              상세 필터
            </h3>
            <button class="btn-reset" @click="resetFilters">
              <span>↻</span> 초기화
            </button>
          </div>
          
          <div class="filter-content">
            <!-- 단원 선택 (개선된 UI) -->
            <div class="filter-group">
              <label class="filter-label">
                <span class="label-icon">📑</span>
                단원 선택
              </label>
              <div class="chapter-grid">
                <button 
                  v-for="chapter in chapters" 
                  :key="chapter.id"
                  :class="['chapter-btn', { 'active': filters.chapterIds.includes(chapter.id) }]"
                  @click="toggleChapter(chapter.id)"
                >
                  <span class="chapter-num">{{ chapter.number }}</span>
                  <span class="chapter-name">{{ chapter.name }}</span>
                </button>
              </div>
            </div>

            <!-- 난이도 선택 -->
            <div class="filter-group">
              <label class="filter-label">
                <span class="label-icon">📊</span>
                난이도
              </label>
              <div class="difficulty-buttons">
                <button 
                  :class="['difficulty-btn', 'diff-high', { 'active': filters.difficulty.includes('H') }]"
                  @click="toggleDifficulty('H')"
                >
                  <span class="diff-icon">🔴</span>
                  <span>상</span>
                </button>
                <button 
                  :class="['difficulty-btn', 'diff-medium', { 'active': filters.difficulty.includes('M') }]"
                  @click="toggleDifficulty('M')"
                >
                  <span class="diff-icon">🟡</span>
                  <span>중</span>
                </button>
                <button 
                  :class="['difficulty-btn', 'diff-low', { 'active': filters.difficulty.includes('L') }]"
                  @click="toggleDifficulty('L')"
                >
                  <span class="diff-icon">🟢</span>
                  <span>하</span>
                </button>
              </div>
            </div>

            <!-- 문제 유형 -->
            <div class="filter-group">
              <label class="filter-label">
                <span class="label-icon">📝</span>
                문제 유형
              </label>
              <div class="type-buttons">
                <button 
                  :class="['type-btn', { 'active': filters.questionForm.includes('MC') }]"
                  @click="toggleQuestionType('MC')"
                >
                  <svg class="type-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>객관식</span>
                </button>
                <button 
                  :class="['type-btn', { 'active': filters.questionForm.includes('SA') }]"
                  @click="toggleQuestionType('SA')"
                >
                  <svg class="type-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>주관식</span>
                </button>
                <button 
                  :class="['type-btn', { 'active': filters.questionForm.includes('ES') }]"
                  @click="toggleQuestionType('ES')"
                >
                  <svg class="type-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  <span>서술형</span>
                </button>
              </div>
            </div>

            <button class="btn-search" @click="searchItems">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>검색하기</span>
            </button>
          </div>
        </div>

        <!-- 문항 목록 -->
        <div class="items-section">
          <div class="items-header">
            <div class="header-left">
              <span>검색 결과 ({{ totalItems }}개)</span>
              <span v-if="selectedTextbook" class="selected-textbook-info">
                | {{ getSelectedTextbookName() }}
              </span>
            </div>
            <label class="select-all">
              <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected">
              전체 선택
            </label>
          </div>

          <!-- 로딩 상태 -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>문항을 불러오는 중...</p>
          </div>

          <!-- 문항 그리드 -->
          <div v-else class="items-grid">
            <div 
              v-for="item in items" 
              :key="item.itemId"
              :class="['item-card', { selected: isSelected(item.itemId) }]"
              @click="toggleSelection(item)"
            >
              <!-- 선택 체크박스 -->
              <div class="item-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isSelected(item.itemId)"
                  @click.stop="toggleSelection(item)"
                />
              </div>

              <!-- 문항 번호 -->
              <div class="item-number">
                문항 #{{ item.itemId }}
              </div>

              <!-- 문항 내용 -->
              <div class="item-content">
                <!-- 이미지가 있는 경우 -->
                <div v-if="item.hasImageData && item.questionImageUrl" class="item-image">
                  <img 
                    :src="item.questionImageUrl" 
                    :alt="`문항 ${item.itemId}`"
                    @error="handleImageError($event, item)"
                    @click.stop="showImageModal(item.questionImageUrl)"
                  />
                  <div class="image-overlay">
                    <span>🔍 확대</span>
                  </div>
                </div>

                <!-- HTML 콘텐츠가 있는 경우 -->
                <div v-else-if="item.hasHtmlData" class="item-html">
                  <div class="question-text" v-html="truncateHtml(item.questionHtml, 150)"></div>
                </div>

                <!-- 콘텐츠가 없는 경우 -->
                <div v-else class="item-placeholder">
                  <span>문항 내용 없음</span>
                </div>
              </div>

              <!-- 메타 정보 -->
              <div class="item-meta">
                <span :class="['difficulty-badge', `difficulty-${item.difficulty?.code}`]">
                  {{ item.difficulty?.name || '난이도 없음' }}
                </span>
                <span class="type-badge">
                  {{ item.questionForm?.name || '유형 없음' }}
                </span>
                <span class="chapter-info">
                  {{ item.chapterName || '단원 정보 없음' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <div v-if="!isLoading && items.length === 0" class="empty-state">
            <div v-if="!selectedTextbook">
              <p>교과서를 선택해주세요.</p>
              <p class="empty-hint">왼쪽에서 교과서를 선택하면 해당 문제들이 표시됩니다.</p>
            </div>
            <div v-else>
              <p>검색 결과가 없습니다.</p>
              <p class="empty-hint">다른 검색 조건을 시도해보세요.</p>
            </div>
          </div>

          <!-- 페이지네이션 -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              class="page-btn prev"
              :disabled="currentPage === 1"
              @click="loadPage(currentPage - 1)"
            >
              ‹
            </button>
            
            <button 
              v-for="page in displayPages" 
              :key="page"
              :class="['page-btn', { active: page === currentPage }]"
              @click="loadPage(page)"
              :disabled="page === '...'"
            >
              {{ page }}
            </button>
            
            <button 
              class="page-btn next"
              :disabled="currentPage === totalPages"
              @click="loadPage(currentPage + 1)"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 선택된 문항 -->
      <div class="right-panel">
        <div class="selected-header">
          <h3>선택된 문항</h3>
          <span class="selected-count">{{ selectedItems.length }}개</span>
        </div>

        <!-- 선택된 문항이 없을 때 -->
        <div v-if="selectedItems.length === 0" class="no-selection">
          <p>선택된 문항이 없습니다.</p>
          <p class="hint">왼쪽에서 문항을 선택해주세요.</p>
        </div>

        <!-- 선택된 문항 목록 (드래그 가능) -->
        <div v-else class="selected-items-list">
          <transition-group name="list" tag="div">
            <div 
              v-for="(item, index) in selectedItems" 
              :key="item.itemId"
              class="selected-item"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent
              @drop="handleDrop($event, index)"
            >
              <span class="drag-handle">≡</span>
              <span class="item-order">{{ index + 1 }}</span>
              <div class="item-info">
                <span class="item-title">문항 #{{ item.itemId }}</span>
                <span class="item-meta">
                  {{ item.difficulty?.name }} | {{ item.questionForm?.name }}
                </span>
              </div>
              <button class="btn-remove" @click="removeItem(item.itemId)">
                ×
              </button>
            </div>
          </transition-group>
        </div>

        <!-- 선택된 문항 액션 -->
        <div class="selected-actions">
          <button class="btn btn-outline" @click="clearSelection">
            전체 해제
          </button>
          <button class="btn btn-outline" @click="randomizeOrder">
            순서 섞기
          </button>
        </div>
      </div>
    </div>

    <!-- 하단 액션 버튼 -->
    <div class="footer-actions">
      <button class="btn btn-secondary" @click="handleBack">
        ← 이전 단계
      </button>
      <div class="footer-info">
        <span>선택된 문항: {{ selectedItems.length }}개</span>
      </div>
      <button 
        class="btn btn-primary"
        :disabled="selectedItems.length === 0"
        @click="proceedToNext"
      >
        다음 단계 →
      </button>
    </div>

    <!-- 이미지 확대 모달 -->
    <div v-if="showModal" class="image-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">×</button>
        <img :src="modalImageUrl" alt="확대 이미지" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'
import { useTestBankStore } from '@/stores/testBank'
import { storeToRefs } from 'pinia'
import axios from 'axios'

// Props
const props = defineProps({
  examInfo: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['back', 'next'])

// Stores
const itemStore = useItemSelectionStore()
const testBankStore = useTestBankStore()

// Store의 상태를 반응형으로 가져오기
const { 
  items, 
  selectedItems, 
  currentPage, 
  totalPages, 
  totalItems,
  isLoading,
  filters,
  chapters 
} = storeToRefs(itemStore)

// Store의 getters 가져오기
const { isItemSelected, isAllSelected } = itemStore

// Local State (Store에서 관리하지 않는 UI 상태)
const showModal = ref(false)
const modalImageUrl = ref('')
const draggedIndex = ref(null)

// 교과서 관련 상태
const selectedTextbook = ref(null) // 현재 선택된 교과서 (단일 선택)
const availableTextbooks = ref([])
const isLoadingTextbooks = ref(false)
const textbookChapters = ref([]) // 선택된 교과서의 대단원 목록
const selectedChapters = ref([]) // 선택된 대단원들

// Computed
const displayPages = computed(() => {
  const pages = []
  const maxDisplay = 5
  
  if (totalPages.value <= maxDisplay) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages.value)
    } else if (currentPage.value >= totalPages.value - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage.value - 1; i <= currentPage.value + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages.value)
    }
  }
  
  return pages
})

// Methods
// 학년과 과목에 맞는 교과서 목록 가져오기
const fetchTextbooks = async () => {
  try {
    isLoadingTextbooks.value = true
    
    // Step1에서 이미 areaCode를 전달받음 (MA, KO, EN, SC, SO)
    const areaCode = props.examInfo.subjectId  // 이제 subjectId가 직접 areaCode임
    const gradeCode = props.examInfo.gradeCode
    
    console.log('교과서 조회 요청:', { gradeCode, areaCode })
    
    const response = await axios.get('/api/subject/filter', {
      params: {
        gradeCode: gradeCode,
        areaCode: areaCode
      }
    })
    
    console.log('교과서 API 응답:', response.data)
    
    if (response.data.success) {
      // 백엔드 응답을 프론트엔드 형식으로 변환
      availableTextbooks.value = response.data.data.map(subject => ({
        id: subject.subjectId,
        name: subject.subjectName || '교과서명 없음',
        publisher: extractPublisher(subject.subjectName), // 교과서명에서 출판사 추출
        year: subject.curriculumCode ? `20${subject.curriculumCode.substring(0, 2)}` : '2024',
        itemCount: 0, // 실제 문항 수는 별도 API 필요
        imageUrl: subject.subjectThumbnail || null,
        gradeCode: subject.gradeCode,
        areaCode: subject.areaCode
      }))
      
      console.log('교과서 목록 로드 완료:', availableTextbooks.value.length, '개')
    } else {
      console.warn('API 응답 success가 false:', response.data)
      availableTextbooks.value = []
    }
  } catch (error) {
    console.error('교과서 목록 로드 실패:', error.response || error)
    console.error('에러 상세:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    // 에러 시 빈 배열 유지
    availableTextbooks.value = []
  } finally {
    isLoadingTextbooks.value = false
  }
}

// 교과서명에서 출판사 추출 (예: "중학교 수학 1 (천재교육)" -> "천재교육")
const extractPublisher = (subjectName) => {
  if (!subjectName) return '출판사 정보 없음'
  const match = subjectName.match(/\(([^)]+)\)/)
  return match ? match[1] : '출판사 정보 없음'
}

const selectTextbook = async (textbook) => {
  // 같은 교과서를 다시 클릭하면 선택 해제
  if (selectedTextbook.value === textbook.id) {
    selectedTextbook.value = null
    // 선택 해제시 초기화
    items.value = []
    totalItems.value = 0
    textbookChapters.value = []
    selectedChapters.value = []
  } else {
    // 새로운 교과서 선택
    selectedTextbook.value = textbook.id
    console.log('선택된 교과서:', textbook)
    
    // 해당 교과서의 대단원 정보 가져오기
    await fetchTextbookChapters(textbook.id)
    
    // 교과서 선택시 해당 교과서의 문제 자동 검색
    searchItems()
  }
}

// 교과서의 대단원 정보 가져오기
const fetchTextbookChapters = async (textbookId) => {
  try {
    console.log('대단원 정보 조회 - 교과서 ID:', textbookId)
    
    // API 호출해서 해당 교과서의 대단원 정보 가져오기
    const response = await axios.get(`/api/subject/${textbookId}/chapters`)
    
    if (response.data.success) {
      textbookChapters.value = response.data.data || []
      console.log('대단원 목록:', textbookChapters.value)
    } else {
      // 임시 데이터 (API가 없을 경우)
      textbookChapters.value = [
        { id: 1, chapterNo: 1, chapterName: '수와 연산', itemCount: 45 },
        { id: 2, chapterNo: 2, chapterName: '문자와 식', itemCount: 38 },
        { id: 3, chapterNo: 3, chapterName: '함수', itemCount: 42 },
        { id: 4, chapterNo: 4, chapterName: '기하', itemCount: 35 },
        { id: 5, chapterNo: 5, chapterName: '확률과 통계', itemCount: 30 }
      ]
    }
  } catch (error) {
    console.error('대단원 정보 조회 실패:', error)
    // 임시 데이터
    textbookChapters.value = [
      { id: 1, chapterNo: 1, chapterName: '수와 연산', itemCount: 45 },
      { id: 2, chapterNo: 2, chapterName: '문자와 식', itemCount: 38 },
      { id: 3, chapterNo: 3, chapterName: '함수', itemCount: 42 },
      { id: 4, chapterNo: 4, chapterName: '기하', itemCount: 35 },
      { id: 5, chapterNo: 5, chapterName: '확률과 통계', itemCount: 30 }
    ]
  }
}

// 대단원 선택/해제
const toggleChapterSelection = (chapterId) => {
  const index = selectedChapters.value.indexOf(chapterId)
  if (index > -1) {
    selectedChapters.value.splice(index, 1)
  } else {
    selectedChapters.value.push(chapterId)
  }
  // 대단원 선택 변경 시 문항 검색
  searchItems()
}

const getSelectedTextbookName = () => {
  if (!selectedTextbook.value) return ''
  const textbook = availableTextbooks.value.find(t => t.id === selectedTextbook.value)
  return textbook ? textbook.name : ''
}

const toggleChapter = (chapterId) => {
  const index = filters.value.chapterIds.indexOf(chapterId)
  if (index > -1) {
    filters.value.chapterIds.splice(index, 1)
  } else {
    filters.value.chapterIds.push(chapterId)
  }
}

const toggleDifficulty = (level) => {
  const index = filters.value.difficulty.indexOf(level)
  if (index > -1) {
    filters.value.difficulty.splice(index, 1)
  } else {
    filters.value.difficulty.push(level)
  }
}

const toggleQuestionType = (type) => {
  const index = filters.value.questionForm.indexOf(type)
  if (index > -1) {
    filters.value.questionForm.splice(index, 1)
  } else {
    filters.value.questionForm.push(type)
  }
}

const resetFilters = () => {
  filters.value.chapterIds = []
  filters.value.difficulty = []
  filters.value.questionForm = []
  selectedTextbook.value = null
  // 필터 초기화시 문항 목록도 초기화
  items.value = []
  totalItems.value = 0
}

const searchItems = async () => {
  // 교과서가 선택되지 않았으면 검색하지 않음
  if (!selectedTextbook.value) {
    console.log('교과서가 선택되지 않았습니다.')
    items.value = []
    totalItems.value = 0
    return
  }
  
  // 선택된 교과서의 문항을 검색
  console.log('문항 검색 시작 - 교과서 ID:', selectedTextbook.value)
  await itemStore.searchItems({
    subjectId: selectedTextbook.value, // 교과서 ID를 subjectId로 전달
    gradeCode: props.examInfo.gradeCode,
    page: currentPage.value
  })
}

const toggleSelection = (item) => {
  itemStore.toggleItemSelection(item)
}

const isSelected = (itemId) => {
  return itemStore.isItemSelected(itemId)
}

const toggleSelectAll = (event) => {
  itemStore.toggleSelectAll()
}

const removeItem = (itemId) => {
  itemStore.deselectItem(itemId)
}

const clearSelection = () => {
  itemStore.clearSelection()
}

const randomizeOrder = () => {
  itemStore.shuffleSelectedItems()
}

const loadPage = (page) => {
  if (page === '...' || page === currentPage.value) return
  itemStore.setCurrentPage(page)
  searchItems()
}

const handleImageError = (event, item) => {
  console.error(`이미지 로드 실패: 문항 ${item.itemId}`)
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjE1MCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjE5cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+SU1BR0UgTE9BRCBFUlJPUjwvdGV4dD48L3N2Zz4='
}

const handleTextbookImageError = (event) => {
  console.error('교과서 이미지 로드 실패')
  // 이미지 요소를 숨기고 부모의 아이콘이 보이도록
  event.target.style.display = 'none'
}

const showImageModal = (imageUrl) => {
  modalImageUrl.value = imageUrl
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalImageUrl.value = ''
}

const truncateHtml = (html, maxLength) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const text = tmp.textContent || tmp.innerText || ''
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...'
  }
  return text
}

// 드래그 앤 드롭
const handleDragStart = (event, index) => {
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

const handleDrop = (event, dropIndex) => {
  event.preventDefault()
  
  if (draggedIndex.value === null) return
  
  itemStore.reorderSelectedItems(draggedIndex.value, dropIndex)
  draggedIndex.value = null
}

const handleBack = () => {
  console.log('Step2 handleBack 호출됨')
  if (selectedItems.value.length > 0) {
    const confirmBack = confirm('선택한 문항이 있습니다. 이전 단계로 돌아가시겠습니까?')
    if (!confirmBack) {
      console.log('뒤로가기 취소됨')
      return
    }
  }
  console.log('Step2에서 back 이벤트 emit')
  emit('back')
}

const proceedToNext = () => {
  // testBankStore에도 선택된 문항 저장 (다음 단계에서 사용)
  testBankStore.setSelectedQuestions(selectedItems.value)
  emit('next')
}

// Lifecycle
onMounted(async () => {
  console.log('Step2 마운트, examInfo:', props.examInfo)
  
  // 교과서 목록 가져오기
  await fetchTextbooks()
  
  // 임시 단원 데이터 설정 (개선된 형식)
  itemStore.setChapters([
    { id: 1, number: '1', name: '수와 연산' },
    { id: 2, number: '2', name: '문자와 식' },
    { id: 3, number: '3', name: '함수' },
    { id: 4, number: '4', name: '기하' },
    { id: 5, number: '5', name: '확률과 통계' }
  ])
  
  // 교과서가 선택될 때까지 문항 검색하지 않음
  // await searchItems() <- 제거
})

// Cleanup
onUnmounted(() => {
  // 컴포넌트가 언마운트될 때 store 상태 유지 (다시 돌아올 때 복원)
  // 필요시 itemStore.resetStore() 호출
})
</script>

<style scoped>
.step2-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

/* 헤더 */
.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e1e4e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 교과서 선택 섹션 */
.textbook-section {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8faff 0%, #f3f7ff 100%);
  border-bottom: 1px solid #e1e4e8;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.section-icon {
  font-size: 1.25rem;
}

.section-desc {
  font-size: 0.8125rem;
  color: #64748b;
  margin-left: auto;
  margin-right: 1rem;
}

.textbook-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.textbook-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 1rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.textbook-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #3b82f6;
}

.textbook-card.selected {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
}

.textbook-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.textbook-card.selected .textbook-check {
  opacity: 1;
  transform: scale(1);
}

.textbook-icon {
  width: 80px;
  height: 100px;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.textbook-icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.textbook-icon > span {
  font-size: 2.5rem;
}

.textbook-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
}

.textbook-loading p {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.no-textbooks {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-size: 0.9375rem;
}

/* 대단원 섹션 */
.chapters-section {
  margin-top: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.chapters-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.chapter-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateX(2px);
}

.chapter-item.selected {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
}

.chapter-checkbox {
  margin-right: 0.75rem;
}

.chapter-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.chapter-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chapter-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3b82f6;
}

.chapter-name {
  font-size: 0.9375rem;
  color: #24292e;
}

.chapter-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.textbook-info {
  text-align: center;
  margin-bottom: 0.75rem;
}

.textbook-info h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.25rem 0;
}

.textbook-info .publisher {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.25rem 0;
}

.year-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.item-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
  width: 100%;
}

.count-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #3b82f6;
}

.count-label {
  font-size: 0.75rem;
  color: #64748b;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: #586069;
  cursor: pointer;
  font-size: 0.9375rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: #f3f4f6;
  color: #3b82f6;
}

.selection-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #24292e;
  margin: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
  color: #586069;
}

.header-info .divider {
  color: #d1d5db;
}

.exam-name {
  font-weight: 600;
  color: #24292e;
}

/* 콘텐츠 래퍼 */
.content-wrapper {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow: hidden;
}

/* 왼쪽 패널 */
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 필터 섹션 */
.filter-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e1e4e8;
  background: white;
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.75rem;
}

.label-icon {
  font-size: 1rem;
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

/* 단원 선택 버튼 */
.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.chapter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chapter-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.chapter-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.chapter-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.75rem;
}

.chapter-btn.active .chapter-num {
  background: rgba(255, 255, 255, 0.3);
}

.chapter-name {
  flex: 1;
  font-weight: 500;
}

/* 난이도 버튼 */
.difficulty-buttons {
  display: flex;
  gap: 0.75rem;
}

.difficulty-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.diff-high {
  color: #dc2626;
}

.diff-high.active {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #dc2626;
}

.diff-medium {
  color: #d97706;
}

.diff-medium.active {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  border-color: #d97706;
}

.diff-low {
  color: #059669;
}

.diff-low.active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #059669;
}

.diff-icon {
  font-size: 1rem;
}

/* 문제 유형 버튼 */
.type-buttons {
  display: flex;
  gap: 0.75rem;
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.75rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.type-btn.active {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-color: #6366f1;
  color: #4f46e5;
}

.type-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}


.btn-search {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-search:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.btn-search svg {
  flex-shrink: 0;
}

/* 문항 섹션 */
.items-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* flexbox 내부 스크롤을 위해 중요 */
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e4e8;
  background: #fafbfc;
  flex-shrink: 0; /* 헤더가 축소되지 않도록 */
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selected-textbook-info {
  color: #3b82f6;
  font-weight: 600;
  font-size: 0.9375rem;
}

.items-header span {
  font-size: 0.9375rem;
  color: #586069;
  font-weight: 600;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #24292e;
}

/* 문항 그리드 */
.items-grid {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  align-content: start;
  max-height: calc(100vh - 400px); /* 전체 뷰포트에서 다른 요소들 높이 빼기 */
}

/* 스크롤바 스타일링 */
.items-grid::-webkit-scrollbar {
  width: 8px;
}

.items-grid::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.item-card {
  position: relative;
  background: white;
  border: 2px solid #e1e4e8;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.item-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.item-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.item-checkbox {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
}

.item-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.item-content {
  margin-bottom: 0.75rem;
  min-height: 100px;
}

.item-image {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
  border-radius: 4px;
  background: #f3f4f6;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: zoom-in;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.item-image:hover .image-overlay {
  opacity: 1;
}

.item-html {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #24292e;
}

.question-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #9ca3af;
  font-size: 0.875rem;
}

.item-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.difficulty-badge,
.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.difficulty-badge {
  background: #f3f4f6;
  color: #6b7280;
}

.difficulty-badge.difficulty-H {
  background: #fee2e2;
  color: #dc2626;
}

.difficulty-badge.difficulty-M {
  background: #fef3c7;
  color: #d97706;
}

.difficulty-badge.difficulty-L {
  background: #dbeafe;
  color: #2563eb;
}

.type-badge {
  background: #e0e7ff;
  color: #4f46e5;
}

.chapter-info {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* 로딩 상태 */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 빈 상태 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  padding: 3rem;
}

.empty-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: #9ca3af;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border-top: 1px solid #e1e4e8;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.page-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.prev,
.page-btn.next {
  font-weight: bold;
}

/* 오른쪽 패널 */
.right-panel {
  width: 350px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e1e4e8;
}

.selected-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #24292e;
  margin: 0;
}

.selected-count {
  padding: 0.25rem 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.no-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

.no-selection .hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: #9ca3af;
}

.selected-items-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: move;
  transition: all 0.2s ease;
}

.selected-item:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.drag-handle {
  color: #9ca3af;
  font-size: 1.125rem;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.item-order {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #24292e;
}

.item-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.btn-remove {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #dc2626;
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: #fee2e2;
}

.selected-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e1e4e8;
}

.btn-outline {
  flex: 1;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

/* 하단 액션 */
.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-top: 1px solid #e1e4e8;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.footer-info {
  font-size: 0.9375rem;
  color: #586069;
  font-weight: 600;
}

.btn {
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 이미지 모달 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.modal-content img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

/* 트랜지션 애니메이션 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 반응형 */
@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }
  
  .right-panel {
    width: 100%;
    max-height: 300px;
  }
  
  .filter-row {
    flex-wrap: wrap;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .header-info {
    display: none;
  }
}
</style>