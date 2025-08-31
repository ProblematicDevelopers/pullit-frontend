<!--
  유사 문항 조회 모달 컴포넌트
  ElasticSearch를 통해 유사한 문항을 조회하고 표시
-->

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <!-- 모달 헤더 -->
          <div class="modal-header">
            <h2 class="modal-title">
              <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" 
                      stroke="currentColor" stroke-width="2"/>
              </svg>
              유사 문항 조회
            </h2>
            <button class="btn-close" @click="close" aria-label="닫기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- 원본 문항 정보 -->
          <div v-if="originalItem" class="original-item-info">
            <h3 class="section-title">원본 문항</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">문항 ID:</span>
                <span class="value">#{{ originalItem.itemId }}</span>
              </div>
              <div class="info-item">
                <span class="label">난이도:</span>
                <span :class="'badge difficulty-' + originalItem.difficultyCode">
                  {{ getDifficultyName(originalItem.difficultyCode) }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">챕터:</span>
                <span class="value">{{ originalItem.topicChapterName || '미분류' }}</span>
              </div>
              <div class="info-item" v-if="originalItem.passageId">
                <span class="label">지문 ID:</span>
                <span class="value">#{{ originalItem.passageId }}</span>
              </div>
            </div>
          </div>

          <!-- 로딩 상태 -->
          <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p>유사 문항을 검색하고 있습니다...</p>
          </div>

          <!-- 에러 상태 -->
          <div v-else-if="error" class="error-container">
            <svg class="error-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12M12 16H12.01M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p class="error-message">{{ error }}</p>
            <button class="btn-retry" @click="loadSimilarItems">
              <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 4V10H7M23 20V14H17M20.49 9C19.79 5.91 16.85 3.5 13.36 3.5C9.87 3.5 6.93 5.91 6.23 9M3.51 15C4.21 18.09 7.15 20.5 10.64 20.5C14.13 20.5 17.07 18.09 17.77 15" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              다시 시도
            </button>
          </div>

          <!-- 유사 문항 목록 -->
          <div v-else-if="similarItems.length > 0" class="similar-items-container">
            <div class="results-header">
              <h3 class="section-title">
                유사 문항 
                <span class="count">({{ similarItems.length }}개)</span>
              </h3>
              <div class="sort-info">
                <span class="info-text">챕터 유사도 → 난이도 순 정렬</span>
              </div>
            </div>

            <div class="items-grid">
              <div 
                v-for="item in similarItems" 
                :key="item.itemId"
                class="similar-item-card"
                :class="{ selected: selectedItems.includes(item.itemId) }"
                @click="toggleItemSelection(item)"
              >
                <!-- 카드 헤더 -->
                <div class="card-header">
                  <div class="item-info">
                    <span class="item-id">#{{ item.itemId || item.item_id }}</span>
                    <span :class="'badge difficulty-' + (item.difficultyCode || item.difficulty_code)">
                      {{ getDifficultyName(item.difficultyCode || item.difficulty_code) }}
                    </span>
                  </div>
                  <div class="selection-checkbox">
                    <input 
                      type="checkbox" 
                      :checked="selectedItems.includes(item.itemId || item.item_id)"
                      @click.stop="toggleItemSelection(item)"
                    />
                  </div>
                </div>

                <!-- 문항 이미지 -->
                <div class="card-body">
                  <div v-if="item.questionUrl || item.question_url" class="item-image">
                    <img 
                      :src="item.questionUrl || item.question_url" 
                      :alt="`문항 ${item.itemId || item.item_id}`"
                      loading="lazy"
                      @error="handleImageError"
                    />
                  </div>
                  <div v-else class="no-image">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z" 
                            stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>이미지 없음</p>
                  </div>
                </div>

                <!-- 카드 푸터 -->
                <div class="card-footer">
                  <div class="meta-info">
                    <span v-if="item.topicChapterId || item.topic_chapter_id" class="meta-item">
                      <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" 
                              stroke="currentColor" stroke-width="2"/>
                      </svg>
                      챕터 {{ item.topicChapterId || item.topic_chapter_id }}
                    </span>
                    <span v-if="item.passageId || item.passage_id" class="meta-item">
                      <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.586C12.851 3 13.105 3.105 13.293 3.293L18.707 8.707C18.895 8.895 19 9.149 19 9.414V19C19 20.1046 18.1046 21 17 21Z" 
                              stroke="currentColor" stroke-width="2"/>
                      </svg>
                      지문 #{{ item.passageId || item.passage_id }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 선택된 문항 액션 -->
            <div v-if="selectedItems.length > 0" class="selection-actions">
              <p class="selection-count">
                <strong>{{ selectedItems.length }}</strong>개 문항 선택됨
              </p>
              <button class="btn-add-selected" @click="addSelectedItems">
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                선택 문항 추가
              </button>
            </div>
          </div>

          <!-- 결과 없음 -->
          <div v-else class="no-results">
            <svg class="icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>유사한 문항을 찾을 수 없습니다</p>
          </div>

          <!-- 모달 푸터 -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="close">닫기</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import itemApi from '@/services/itemApi'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'add-items'])

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const originalItem = computed(() => props.item)
const similarItems = ref([])
const selectedItems = ref([])
const isLoading = ref(false)
const error = ref(null)

// Methods
const getDifficultyName = (code) => {
  const difficulties = {
    1: '매우쉬움',
    2: '쉬움',
    3: '보통',
    4: '어려움',
    5: '매우어려움'
  }
  return difficulties[code] || '미분류'
}

const loadSimilarItems = async () => {
  if (!originalItem.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    console.log('Loading similar items for:', originalItem.value)
    
    // 챕터 ID 추출 - 계층적 챕터 ID를 조합해서 만들어야 함
    // ElasticSearch는 12자리 topicChapterId를 기대함 (예: 010101010101)
    const subjectId = originalItem.value.subjectId || originalItem.value.subject?.id || '0000'
    const largeChapterId = originalItem.value.largeChapterId || originalItem.value.largeChapter?.id || '00'
    const mediumChapterId = originalItem.value.mediumChapterId || originalItem.value.mediumChapter?.id || '00'
    const smallChapterId = originalItem.value.smallChapterId || originalItem.value.smallChapter?.id || '00'
    const topicId = originalItem.value.topicChapterId || originalItem.value.topicChapter?.id || '00'
    
    // 12자리 코드 생성 (subject(4) + large(2) + medium(2) + small(2) + topic(2))
    let chapterId = 0
    if (subjectId && subjectId !== '0000') {
      // 각 ID를 문자열로 변환하고 패딩
      const subjectStr = String(subjectId).padStart(4, '0')
      const largeStr = String(largeChapterId).padStart(2, '0')
      const mediumStr = String(mediumChapterId).padStart(2, '0')
      const smallStr = String(smallChapterId).padStart(2, '0')
      const topicStr = String(topicId).padStart(2, '0')
      
      // 12자리 코드 조합
      chapterId = parseInt(subjectStr + largeStr + mediumStr + smallStr + topicStr)
    }
    
    // 만약 조합된 ID가 없다면 item의 모든 챕터 관련 필드 확인
    if (!chapterId || chapterId === 0) {
      chapterId = originalItem.value.topicChapterId || 
                  originalItem.value.chapterId ||
                  originalItem.value.chapter?.id ||
                  0
    }
    
    // 난이도 코드 추출
    const diffCode = originalItem.value.difficultyCode || 
                     originalItem.value.difficulty?.code ||
                     originalItem.value.difficulty ||
                     -1
    
    // 지문 ID 추출
    const passId = originalItem.value.passageId || 
                   originalItem.value.passage_id ||
                   -1
    
    const params = {
      topicChapterId: chapterId,
      difficultyCode: typeof diffCode === 'object' ? -1 : Number(diffCode),
      passageId: passId,
      excludeItemIds: [originalItem.value.itemId],
      size: 20
    }
    
    console.log('Item structure:', {
      itemId: originalItem.value.itemId,
      subjectInfo: {
        subjectId: originalItem.value.subjectId,
        subject: originalItem.value.subject,
        subjectName: originalItem.value.subjectName
      },
      chapterFields: {
        largeChapterId: originalItem.value.largeChapterId,
        largeChapter: originalItem.value.largeChapter,
        mediumChapterId: originalItem.value.mediumChapterId,
        mediumChapter: originalItem.value.mediumChapter,
        smallChapterId: originalItem.value.smallChapterId,
        smallChapter: originalItem.value.smallChapter,
        topicChapterId: originalItem.value.topicChapterId,
        topicChapter: originalItem.value.topicChapter,
        chapterId: originalItem.value.chapterId,
        chapter: originalItem.value.chapter
      },
      difficultyFields: {
        difficultyCode: originalItem.value.difficultyCode,
        difficulty: originalItem.value.difficulty
      },
      passageFields: {
        passageId: originalItem.value.passageId,
        passage_id: originalItem.value.passage_id
      },
      calculatedChapterId: chapterId
    })
    
    console.log('Similar items request params:', params)
    
    const result = await itemApi.getSimilarItems(params)
    
    if (result.success) {
      similarItems.value = result.data || []
      console.log(`Found ${similarItems.value.length} similar items`)
    } else {
      throw new Error(result.error || '유사 문항 조회에 실패했습니다')
    }
  } catch (err) {
    console.error('Error loading similar items:', err)
    error.value = err.message || '유사 문항을 불러오는 중 오류가 발생했습니다'
  } finally {
    isLoading.value = false
  }
}

const toggleItemSelection = (item) => {
  const itemId = item.itemId || item.item_id
  const index = selectedItems.value.indexOf(itemId)
  
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(itemId)
  }
}

const addSelectedItems = () => {
  const itemsToAdd = similarItems.value.filter(item => 
    selectedItems.value.includes(item.itemId || item.item_id)
  )
  
  emit('add-items', itemsToAdd)
  close()
}

const close = () => {
  isOpen.value = false
  selectedItems.value = []
  error.value = null
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.innerHTML = `
    <div class="image-error">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>이미지 로드 실패</span>
    </div>
  `
}

// Watchers
watch(isOpen, (newValue) => {
  if (newValue) {
    loadSimilarItems()
  }
})
</script>

<style scoped>
/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

/* 모달 컨테이너 */
.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 1200px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 모달 헤더 */
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title .icon {
  color: #3b82f6;
}

.btn-close {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #111827;
}

/* 원본 문항 정보 */
.original-item-info {
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-size: 14px;
  color: #6b7280;
}

.info-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-1 { background: #dbeafe; color: #1e40af; }
.difficulty-2 { background: #d1fae5; color: #065f46; }
.difficulty-3 { background: #fed7aa; color: #c2410c; }
.difficulty-4 { background: #fecaca; color: #991b1b; }
.difficulty-5 { background: #e9d5ff; color: #6b21a8; }

/* 로딩 상태 */
.loading-container {
  padding: 60px 24px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: #6b7280;
  font-size: 14px;
}

/* 에러 상태 */
.error-container {
  padding: 60px 24px;
  text-align: center;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.error-message {
  color: #374151;
  font-size: 14px;
  margin-bottom: 16px;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #2563eb;
}

/* 유사 문항 컨테이너 */
.similar-items-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.results-header .section-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  color: #3b82f6;
  font-weight: 600;
}

.sort-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-text {
  font-size: 13px;
  color: #6b7280;
}

/* 문항 그리드 */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.similar-item-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.similar-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.similar-item-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.card-header {
  padding: 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-id {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.selection-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.card-body {
  padding: 12px;
  background: white;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.no-image {
  text-align: center;
  color: #9ca3af;
}

.no-image svg {
  margin-bottom: 8px;
}

.no-image p {
  font-size: 12px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.card-footer {
  padding: 12px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item .icon {
  flex-shrink: 0;
}

/* 선택 액션 */
.selection-actions {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px -24px -24px;
}

.selection-count {
  font-size: 14px;
  color: #374151;
}

.btn-add-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-selected:hover {
  background: #2563eb;
}

/* 결과 없음 */
.no-results {
  padding: 60px 24px;
  text-align: center;
  color: #9ca3af;
}

.no-results .icon {
  margin-bottom: 16px;
}

.no-results p {
  font-size: 14px;
}

/* 모달 푸터 */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

/* 애니메이션 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
    margin: 10px;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .modal-header {
    padding: 16px;
  }

  .similar-items-container {
    padding: 16px;
  }
}
</style>