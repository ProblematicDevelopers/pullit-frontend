<!--
  시험지 마법사 Step 2: 문항 선택 (Enhanced)
  
  이 컴포넌트는 시험지에 포함할 문항들을 선택하는 단계입니다.
  주요 기능:
  - 실제 Backend API 연동
  - Elasticsearch 유사 문항 검색
  - 실시간 검색 with 디바운싱
  - 가상 스크롤링으로 성능 최적화
  - Toast 알림 시스템
  - 반응형 디자인
  - 문항 이미지 lazy loading
  - 향상된 UX/UI
-->

<template>
  <div class="step2-container">
    <!-- 헤더 영역 -->
    <div class="selection-header">
      <div class="header-left">
        <button class="btn-back" @click="handleBack">← 이전</button>
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

    <!-- 검색 바 -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="문항 내용 검색... (예: 이차방정식, 삼각함수)"
            class="search-input"
            @keyup.enter="performSearch"
          />
          <button class="search-button" @click="performSearch" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-mini"></span>
            <span v-else>🔍</span>
          </button>
        </div>
        <div class="search-stats" v-if="totalItems > 0">
          총 {{ totalItems }}개 문항 중 {{ selectedItems.length }}개 선택
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 왼쪽: 필터 및 문항 목록 -->
      <div class="left-panel">
        <!-- 교과서 선택 섹션 -->
        <div class="textbook-section" v-if="subjects.length > 0">
          <div class="section-header">
            <h3>
              <span class="section-icon">📚</span>
              교과서 선택
            </h3>
            <span class="section-desc">여러 교과서의 문제를 함께 선택할 수 있습니다</span>
          </div>
          
          <!-- 로딩 상태 -->
          <div v-if="isSubjectsLoading" class="textbook-loading">
            <div class="spinner"></div>
            <p>교과서 정보를 불러오는 중...</p>
          </div>
          
          <!-- 교과서 그리드 -->
          <div v-else class="textbook-grid">
            <div 
              v-for="subject in subjects" 
              :key="subject.code"
              class="subject-group"
            >
              <h4 class="subject-title">{{ subject.name }}</h4>
              <div class="textbook-list">
                <div 
                  v-for="textbook in (textbooks[subject.code] || [])" 
                  :key="textbook.id"
                  :class="['textbook-card', { 'selected': selectedTextbooks.includes(textbook.id) }]"
                  @click="toggleTextbook(textbook.id)"
                >
                  <div class="textbook-check">
                    <span v-if="selectedTextbooks.includes(textbook.id)">✓</span>
                  </div>
                  <div class="textbook-icon">📖</div>
                  <div class="textbook-info">
                    <h5>{{ textbook.name }}</h5>
                    <p class="publisher">{{ textbook.publisher }}</p>
                    <span class="year-badge">{{ textbook.year }}</span>
                  </div>
                  <div class="item-count">
                    <span class="count-number">{{ textbook.itemCount || 0 }}</span>
                    <span class="count-label">문항</span>
                  </div>
                </div>
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

            <!-- 난이도 선택 (실제 DB 코드 사용) -->
            <div class="filter-group">
              <label class="filter-label">
                <span class="label-icon">📊</span>
                난이도
              </label>
              <div class="difficulty-buttons">
                <button 
                  :class="['difficulty-btn', 'diff-high', { 'active': filters.difficulties.includes('4') }]"
                  @click="toggleDifficulty('4')"
                >
                  <span class="diff-icon">🔴</span>
                  <span>상</span>
                </button>
                <button 
                  :class="['difficulty-btn', 'diff-medium', { 'active': filters.difficulties.includes('3') }]"
                  @click="toggleDifficulty('3')"
                >
                  <span class="diff-icon">🟡</span>
                  <span>중</span>
                </button>
                <button 
                  :class="['difficulty-btn', 'diff-low', { 'active': filters.difficulties.includes('2') }]"
                  @click="toggleDifficulty('2')"
                >
                  <span class="diff-icon">🟢</span>
                  <span>하</span>
                </button>
              </div>
            </div>

            <!-- 문제 유형 (실제 DB 코드 사용) -->
            <div class="filter-group">
              <label class="filter-label">
                <span class="label-icon">📝</span>
                문제 유형
              </label>
              <div class="type-buttons">
                <button 
                  :class="['type-btn', { 'active': questionFormFilters.includes('50') }]"
                  @click="toggleQuestionForm('50')"
                >
                  <span class="type-icon">🔘</span>
                  <span>5지선택</span>
                </button>
                <button 
                  :class="['type-btn', { 'active': questionFormFilters.includes('60') }]"
                  @click="toggleQuestionForm('60')"
                >
                  <span class="type-icon">✏️</span>
                  <span>단답유순</span>
                </button>
                <button 
                  :class="['type-btn', { 'active': questionFormFilters.includes('70') }]"
                  @click="toggleQuestionForm('70')"
                >
                  <span class="type-icon">📄</span>
                  <span>서술형</span>
                </button>
              </div>
            </div>

            <button class="btn-search" @click="searchItems">
              <span>🔍</span> 검색하기
            </button>
          </div>
        </div>

        <!-- 문항 목록 -->
        <div class="items-section">
          <div class="items-header">
            <span>검색 결과 ({{ totalItems }}개)</span>
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

          <!-- 문항 그리드 (가상 스크롤링 적용) -->
          <div v-else class="items-grid" ref="itemsContainer">
            <div 
              v-for="item in visibleItems" 
              :key="item.itemId"
              :class="['item-card', { selected: isSelected(item.itemId) }]"
              :style="{ transform: `translateY(${offsetY}px)` }"
              @click="toggleSelection(item)"
            >
              <!-- 가상 스크롤 스페이서 -->
              <div class="virtual-spacer" :style="{ height: totalHeight + 'px' }"></div>
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
                <!-- 이미지가 있는 경우 (Lazy Loading 적용) -->
                <div v-if="item.hasImageData && item.questionImageUrl" class="item-image">
                  <img 
                    :src="item.questionImageUrl" 
                    :alt="`문항 ${item.itemId}`"
                    loading="lazy"
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
                  {{ getDifficultyName(item.difficulty?.code) }}
                </span>
                <span class="type-badge">
                  {{ getQuestionFormName(item.questionForm?.code) }}
                </span>
                <span class="chapter-info">
                  {{ item.chapterName || item.chapter?.name || '단원 정보 없음' }}
                </span>
              </div>
              
              <!-- 유사문항 찾기 버튼 -->
              <div class="item-actions">
                <button 
                  class="btn-similar"
                  @click.stop="showSimilarItems(item)"
                  :disabled="isSimilarItemsLoading"
                >
                  <span v-if="isSimilarItemsLoading">⏳</span>
                  <span v-else>🔍</span>
                  유사문항
                </button>
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <div v-if="!isLoading && items.length === 0" class="empty-state">
            <p>검색 결과가 없습니다.</p>
            <p class="empty-hint">다른 검색 조건을 시도해보세요.</p>
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

    <!-- 유사문항 모달 -->
    <div v-if="showSimilarModal" class="similar-modal" @click="closeSimilarModal">
      <div class="similar-modal-content" @click.stop>
        <div class="similar-modal-header">
          <h3>유사 문항 검색 결과</h3>
          <button class="modal-close" @click="closeSimilarModal">×</button>
        </div>
        
        <div class="similar-modal-body">
          <!-- 기준 문항 -->
          <div class="base-item-section">
            <h4>기준 문항</h4>
            <div class="base-item-card">
              <div class="item-number">문항 #{{ currentBaseItem?.itemId }}</div>
              <div class="item-preview">
                <div v-if="currentBaseItem?.questionImageUrl" class="item-image-small">
                  <img :src="currentBaseItem.questionImageUrl" :alt="`문항 ${currentBaseItem.itemId}`" />
                </div>
                <div v-else-if="currentBaseItem?.questionHtml" class="item-html-small" v-html="truncateHtml(currentBaseItem.questionHtml, 100)"></div>
                <div v-else class="no-content">문항 내용 없음</div>
              </div>
            </div>
          </div>
          
          <!-- 유사 문항 목록 -->
          <div class="similar-items-section">
            <h4>유사 문항 ({{ currentSimilarItems.length }}개)</h4>
            
            <div v-if="isSimilarItemsLoading" class="similar-loading">
              <div class="spinner"></div>
              <p>유사 문항을 검색하는 중...</p>
            </div>
            
            <div v-else-if="currentSimilarItems.length === 0" class="no-similar-items">
              <p>유사한 문항을 찾을 수 없습니다.</p>
            </div>
            
            <div v-else class="similar-items-list">
              <div 
                v-for="similar in currentSimilarItems" 
                :key="similar.itemId"
                :class="['similar-item-card', { 'selected': isSelected(similar.itemId) }]"
                @click="toggleSelection(similar)"
              >
                <div class="similarity-score">
                  유사도: {{ Math.round(similar.score * 100) }}%
                </div>
                
                <div class="item-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="isSelected(similar.itemId)"
                    @click.stop="toggleSelection(similar)"
                  />
                </div>
                
                <div class="item-number">문항 #{{ similar.itemId }}</div>
                
                <div class="item-content-small">
                  <div v-if="similar.questionImageUrl" class="item-image-small">
                    <img :src="similar.questionImageUrl" :alt="`문항 ${similar.itemId}`" loading="lazy" />
                  </div>
                  <div v-else-if="similar.questionHtml" class="item-html-small" v-html="truncateHtml(similar.questionHtml, 100)"></div>
                  <div v-else class="no-content">문항 내용 없음</div>
                </div>
                
                <div class="similar-item-meta">
                  <span class="difficulty-badge">{{ getDifficultyName(similar.difficulty?.code) }}</span>
                  <span class="type-badge">{{ getQuestionFormName(similar.questionForm?.code) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="similar-modal-footer">
          <button class="btn btn-secondary" @click="closeSimilarModal">
            취소
          </button>
          <button class="btn btn-primary" @click="selectAllSimilarItems" :disabled="currentSimilarItems.length === 0">
            모두 선택 ({{ currentSimilarItems.filter(item => !isSelected(item.itemId)).length }}개)
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 알림 컨테이너 -->
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
        >
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">✅</span>
            <span v-else-if="toast.type === 'error'">❌</span>
            <span v-else-if="toast.type === 'warning'">⚠️</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" @click="removeToast(toast.id)">×</button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'
import { useTestBankStore } from '@/stores/testBank'
import { useToast } from '@/composables/useToast'
import { useDebounce } from '@/composables/useDebounce'
import { useVirtualScroll } from '@/composables/useVirtualScroll'
import { storeToRefs } from 'pinia'

// Props
const props = defineProps({
  examInfo: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['back', 'next'])

// Composables
const { toasts, success, error, warning, info, removeToast } = useToast()
const { value: searchKeyword, debouncedValue: debouncedSearchKeyword } = useDebounce('', 500)

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
  isSimilarItemsLoading,
  isSubjectsLoading,
  filters,
  subjects,
  textbooks,
  chapters 
} = storeToRefs(itemStore)

// Store의 getters 가져오기
const { isItemSelected, isAllSelected } = itemStore

// Virtual Scrolling
const itemsContainer = ref(null)
const { visibleItems, totalHeight, offsetY } = useVirtualScroll(items, 250, 600)

// Local State (Store에서 관리하지 않는 UI 상태)
const showModal = ref(false)
const modalImageUrl = ref('')
const draggedIndex = ref(null)

// 유사문항 모달 상태
const showSimilarModal = ref(false)
const currentBaseItem = ref(null)
const currentSimilarItems = ref([])

// 교과서 관련 상태
const selectedTextbooks = ref([])

// 문제 유형 필터 (실제 DB 코드 반영)
const questionFormFilters = ref([])

// 검색 상태
const lastSearchTime = ref(0)
const searchDebounceTimeout = ref(null)

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
const toggleTextbook = (textbookId) => {
  const index = selectedTextbooks.value.indexOf(textbookId)
  if (index > -1) {
    selectedTextbooks.value.splice(index, 1)
    success('교과서 선택이 해제되었습니다.')
  } else {
    selectedTextbooks.value.push(textbookId)
    success('교과서가 선택되었습니다.')
  }
  // 교과서 선택 변경시 자동 검색
  performSearchWithDelay()
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
  const index = filters.value.difficulties.indexOf(level)
  if (index > -1) {
    filters.value.difficulties.splice(index, 1)
  } else {
    filters.value.difficulties.push(level)
  }
  performSearchWithDelay()
}

const toggleQuestionForm = (formCode) => {
  const index = questionFormFilters.value.indexOf(formCode)
  if (index > -1) {
    questionFormFilters.value.splice(index, 1)
  } else {
    questionFormFilters.value.push(formCode)
  }
  performSearchWithDelay()
}

const resetFilters = () => {
  filters.value.chapterIds = []
  filters.value.difficulties = []
  questionFormFilters.value = []
  selectedTextbooks.value = []
  searchKeyword.value = ''
  performSearchWithDelay()
  info('필터가 초기화되었습니다.')
}

// 검색 수행
const performSearch = async () => {
  try {
    const searchParams = {
      keyword: searchKeyword.value.trim(),
      subjects: props.examInfo.subjectId ? [props.examInfo.subjectId] : [],
      grades: props.examInfo.gradeCode ? [props.examInfo.gradeCode] : [],
      difficulties: filters.value.difficulties,
      categories: questionFormFilters.value,
      page: currentPage.value - 1,
      size: 20
    }
    
    await itemStore.searchItems(searchParams)
    
    if (items.value.length === 0 && !isLoading.value) {
      warning('검색 결과가 없습니다. 다른 검색 조건을 시도해보세요.')
    }
    
  } catch (err) {
    error('문항 검색 중 오류가 발생했습니다.')
    console.error('Search error:', err)
  }
}

// 디바운싱된 검색
const performSearchWithDelay = () => {
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value)
  }
  
  searchDebounceTimeout.value = setTimeout(() => {
    performSearch()
  }, 300)
}

const toggleSelection = (item) => {
  const wasSelected = isSelected(item.itemId)
  itemStore.toggleItemSelection(item)
  
  if (wasSelected) {
    info(`문항 #${item.itemId}가 선택 해제되었습니다.`)
  } else {
    success(`문항 #${item.itemId}가 선택되었습니다.`)
  }
}

const isSelected = (itemId) => {
  return itemStore.isItemSelected(itemId)
}

const toggleSelectAll = (event) => {
  itemStore.toggleSelectAll()
}

const removeItem = (itemId) => {
  itemStore.deselectItem(itemId)
  info(`문항 #${itemId}가 선택 해제되었습니다.`)
}

const clearSelection = () => {
  const count = selectedItems.value.length
  itemStore.clearSelection()
  info(`${count}개 문항 선택이 모두 해제되었습니다.`)
}

const randomizeOrder = () => {
  itemStore.shuffleSelectedItems()
  info('선택된 문항 순서가 섬어졌습니다.')
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

const showImageModal = (imageUrl) => {
  modalImageUrl.value = imageUrl
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalImageUrl.value = ''
}

const truncateHtml = (html, maxLength) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const text = tmp.textContent || tmp.innerText || ''
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...'
  }
  return text
}

// 유사문항 검색 및 표시
const showSimilarItems = async (item) => {
  try {
    currentBaseItem.value = item
    showSimilarModal.value = true
    currentSimilarItems.value = []
    
    // Elasticsearch를 통한 유사문항 검색
    const similarItems = await itemStore.searchSimilarItems(item.itemId, {
      subjects: props.examInfo.subjectId ? [props.examInfo.subjectId] : [],
      grades: props.examInfo.gradeCode ? [props.examInfo.gradeCode] : [],
      limit: 10,
      minScore: 0.2
    })
    
    currentSimilarItems.value = similarItems
    
    if (similarItems.length === 0) {
      warning('유사한 문항을 찾을 수 없습니다.')
    } else {
      success(`${similarItems.length}개의 유사 문항을 찾았습니다.`)
    }
    
  } catch (err) {
    error('유사 문항 검색 중 오류가 발생했습니다.')
    console.error('Similar items search error:', err)
  }
}

const closeSimilarModal = () => {
  showSimilarModal.value = false
  currentBaseItem.value = null
  currentSimilarItems.value = []
}

const selectAllSimilarItems = () => {
  let addedCount = 0
  currentSimilarItems.value.forEach(item => {
    if (!isSelected(item.itemId)) {
      itemStore.selectItem(item)
      addedCount++
    }
  })
  
  if (addedCount > 0) {
    success(`${addedCount}개의 유사 문항이 추가되었습니다.`)
  } else {
    info('모든 유사 문항이 이미 선택되어 있습니다.')
  }
  
  closeSimilarModal()
}

// 난이도/문제유형 이름 변환 함수
const getDifficultyName = (code) => {
  const difficultyMap = {
    '2': '하',
    '3': '중', 
    '4': '상',
    'L': '하',
    'M': '중',
    'H': '상'
  }
  return difficultyMap[code] || '미정'
}

const getQuestionFormName = (code) => {
  const formMap = {
    '50': '5지선택',
    '60': '단답유순',
    '70': '서술형',
    'MC': '객관식',
    'SA': '주관식',
    'ES': '서술형'
  }
  return formMap[code] || '기타'
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
  if (selectedItems.value.length > 0) {
    const confirmBack = confirm('선택한 문항이 있습니다. 이전 단계로 돌아가시겠습니까?')
    if (!confirmBack) return
  }
  emit('back')
}

const proceedToNext = () => {
  if (selectedItems.value.length === 0) {
    warning('문항을 선택해주세요.')
    return
  }
  
  // testBankStore에도 선택된 문항 저장 (다음 단계에서 사용)
  testBankStore.setSelectedQuestions(selectedItems.value)
  success(`${selectedItems.value.length}개 문항이 선택되어 다음 단계로 이동합니다.`)
  emit('next')
}

// 실시간 검색을 위한 디바운싱
watch(debouncedSearchKeyword, (newKeyword) => {
  if (newKeyword !== searchKeyword.value) {
    performSearch()
  }
})

// 주제목 및 과목 정보 로드
const loadSubjectsAndTextbooks = async () => {
  try {
    await itemStore.loadSubjects({
      includeTextbooks: true,
      grades: props.examInfo.gradeCode ? [props.examInfo.gradeCode] : []
    })
  } catch (err) {
    error('과목 정보 로드에 실패했습니다.')
    console.error('Load subjects error:', err)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // 과목 및 교과서 정보 로드
    await loadSubjectsAndTextbooks()
    
    // 기본 단원 데이터 설정 (실제 API에서 가져올 때까지 임시)
    itemStore.setChapters([
      { id: 1, number: '1', name: '수와 연산' },
      { id: 2, number: '2', name: '문자와 식' },
      { id: 3, number: '3', name: '함수' },
      { id: 4, number: '4', name: '기하' },
      { id: 5, number: '5', name: '확률과 통계' }
    ])
    
    // 초기 검색 수행
    await performSearch()
    
  } catch (err) {
    error('초기 데이터 로드에 실패했습니다.')
    console.error('Mount error:', err)
  }
})

// Cleanup
onUnmounted(() => {
  // 디바운스 타이머 정리
  if (searchDebounceTimeout.value) {
    clearTimeout(searchDebounceTimeout.value)
  }
  
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
  position: relative;
}

/* 검색 섹션 */
.search-section {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e1e4e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input {
  flex: 1;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1a202c;
}

.search-input::placeholder {
  color: #64748b;
}

.search-button {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-stats {
  text-align: center;
  margin-top: 0.75rem;
  color: #64748b;
  font-size: 0.9rem;
}

.spinner-mini {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

.textbook-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.textbook-loading .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

.subject-group {
  margin-bottom: 2rem;
}

.subject-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 1rem 0;
  padding-left: 0.5rem;
  border-left: 4px solid #3b82f6;
}

.textbook-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
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
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.textbook-info {
  text-align: center;
  margin-bottom: 0.75rem;
}

.textbook-info h4,
.textbook-info h5 {
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

/* 난이도 배지 업데이트 (실제 DB 코드) */
.difficulty-badge.difficulty-2 {
  background: #dbeafe;
  color: #2563eb;
}

.difficulty-badge.difficulty-3 {
  background: #fef3c7;
  color: #d97706;
}

.difficulty-badge.difficulty-4 {
  background: #fee2e2;
  color: #dc2626;
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
  font-size: 1rem;
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
}

.btn-search:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

/* 문항 섹션 */
.items-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e4e8;
  background: white;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  align-content: start;
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

/* 기존 코드와의 호환성 */
.difficulty-badge.difficulty-low,
.difficulty-badge.difficulty-L {
  background: #dbeafe;
  color: #2563eb;
}

.difficulty-badge.difficulty-medium,
.difficulty-badge.difficulty-M {
  background: #fef3c7;
  color: #d97706;
}

.difficulty-badge.difficulty-high,
.difficulty-badge.difficulty-H {
  background: #fee2e2;
  color: #dc2626;
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

/* 추가 애니메이션 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.similar-modal-content {
  animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.similar-item-card {
  animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 스크롤바 스타일링 */
.items-grid::-webkit-scrollbar,
.similar-modal-body::-webkit-scrollbar {
  width: 8px;
}

.items-grid::-webkit-scrollbar-track,
.similar-modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb,
.similar-modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb:hover,
.similar-modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 가상 스크롤링 */
.virtual-spacer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

/* 문항 액션 */
.item-actions {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.btn-similar {
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-similar:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

.btn-similar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* 유사문항 모달 */
.similar-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

.similar-modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.similar-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e1e4e8;
  background: #f8fafc;
}

.similar-modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.similar-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.base-item-section {
  margin-bottom: 2rem;
}

.base-item-section h4,
.similar-items-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.base-item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.item-image-small {
  width: 60px;
  height: 40px;
  overflow: hidden;
  border-radius: 4px;
  background: #f3f4f6;
}

.item-image-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-html-small {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.no-content {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.similar-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.no-similar-items {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.similar-items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.similar-item-card {
  position: relative;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.similar-item-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.similar-item-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.similarity-score {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-content-small {
  margin: 0.75rem 0;
}

.similar-item-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.similar-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e1e4e8;
  background: #f8fafc;
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

/* Toast 알림 */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #3b82f6;
  min-width: 300px;
  position: relative;
}

.toast-success {
  border-left-color: #059669;
}

.toast-error {
  border-left-color: #dc2626;
}

.toast-warning {
  border-left-color: #d97706;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* Toast 애니메이션 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
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
  
  .similar-modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .similar-items-list {
    grid-template-columns: 1fr;
  }
  
  .toast-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
  
  .toast {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .header-info {
    display: none;
  }
  
  .search-section {
    padding: 1rem;
  }
  
  .search-input {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .search-button {
    padding: 0.75rem 1rem;
  }
  
  .textbook-section {
    padding: 1rem;
  }
  
  .textbook-list {
    grid-template-columns: 1fr;
  }
  
  .difficulty-buttons,
  .type-buttons {
    flex-direction: column;
  }
  
  .similar-modal-content {
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
  }
  
  .similar-modal-header,
  .similar-modal-body,
  .similar-modal-footer {
    padding: 1rem;
  }
}
</style>