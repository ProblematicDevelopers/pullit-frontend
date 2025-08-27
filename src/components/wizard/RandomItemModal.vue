<!-- 
  랜덤 문항 생성 모달
  
  이 컴포넌트는 선택된 조건에 따라 랜덤으로 문항을 선택하는 모달입니다.
  단원별, 난이도별로 문항 수를 설정하여 랜덤하게 문항을 추출합니다.
-->

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="handleClose">
      <div class="modal-container" @click.stop>
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <h2>랜덤 문항 생성</h2>
          <button class="btn-close" @click="handleClose">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- 모달 바디 -->
        <div class="modal-body">
          <!-- 필터 설정 -->
          <div class="section">
            <h3>필터 설정</h3>
            <div class="filter-settings">
              <!-- 교과서 선택 -->
              <div class="filter-row" v-if="textbooks && textbooks.length > 0">
                <label>교과서</label>
                <select v-model="filters.textbook" class="filter-select" @change="handleFilterChange">
                  <option value="">전체 교과서</option>
                  <option v-for="textbook in textbooks" :key="textbook.id" :value="textbook.id">
                    {{ textbook.name }}
                  </option>
                </select>
              </div>

              <!-- 난이도 필터 -->
              <div class="filter-row">
                <label>난이도</label>
                <div class="filter-chips">
                  <label 
                    v-for="level in difficultyLevels" 
                    :key="level.code"
                    class="chip-option"
                    :class="{ active: filters.difficulties.includes(level.code) }"
                  >
                    <input 
                      type="checkbox"
                      :value="level.code"
                      v-model="filters.difficulties"
                      @change="handleFilterChange"
                    />
                    <span :class="'difficulty-' + level.code">{{ level.name }}</span>
                  </label>
                </div>
              </div>

              <!-- 문제 유형 필터 -->
              <div class="filter-row">
                <label>문제 유형</label>
                <div class="filter-chips">
                  <label 
                    v-for="type in questionTypes" 
                    :key="type.code"
                    class="chip-option"
                    :class="{ active: filters.questionTypes.includes(type.code) }"
                  >
                    <input 
                      type="checkbox"
                      :value="type.code"
                      v-model="filters.questionTypes"
                      @change="handleFilterChange"
                    />
                    <span>{{ type.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 전체 설정 -->
          <div class="section">
            <h3>전체 설정</h3>
            <div class="total-settings">
              <div class="setting-row">
                <label>총 문항 수</label>
                <div class="input-group">
                  <button class="btn-number" @click="adjustTotalCount(-5)" :disabled="totalCount <= 5">-5</button>
                  <button class="btn-number" @click="adjustTotalCount(-1)" :disabled="totalCount <= 1">-</button>
                  <input 
                    type="number" 
                    v-model.number="totalCount" 
                    min="1" 
                    max="100"
                    class="input-number"
                  />
                  <button class="btn-number" @click="adjustTotalCount(1)" :disabled="totalCount >= 100">+</button>
                  <button class="btn-number" @click="adjustTotalCount(5)" :disabled="totalCount >= 96">+5</button>
                </div>
              </div>
              
              <div class="setting-row">
                <label>선택 가능한 문항</label>
                <span class="available-count">{{ availableCount }}개</span>
              </div>
            </div>
          </div>

          <!-- 단원별 설정 -->
          <div class="section" v-if="selectedChapters.length > 0">
            <h3>단원별 분배</h3>
            <div class="chapter-distribution">
              <div 
                v-for="chapter in selectedChapters" 
                :key="chapter.id"
                class="chapter-item"
              >
                <div class="chapter-info">
                  <span class="chapter-name">{{ chapter.name }}</span>
                  <span class="chapter-available">({{ chapter.itemCount }}개 가능)</span>
                </div>
                <div class="input-group small">
                  <button 
                    class="btn-number small" 
                    @click="adjustChapterCount(chapter.id, -1)"
                    :disabled="getChapterCount(chapter.id) <= 0"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    :value="getChapterCount(chapter.id)"
                    @input="setChapterCount(chapter.id, $event.target.value)"
                    min="0" 
                    :max="chapter.itemCount"
                    class="input-number small"
                  />
                  <button 
                    class="btn-number small" 
                    @click="adjustChapterCount(chapter.id, 1)"
                    :disabled="getChapterCount(chapter.id) >= chapter.itemCount"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div class="distribution-summary">
                <span>합계: {{ distributionTotal }} / {{ totalCount }}문항</span>
                <button 
                  class="btn-auto-distribute"
                  @click="autoDistribute"
                >
                  자동 분배
                </button>
              </div>
            </div>
          </div>

          <!-- 난이도별 설정 -->
          <div class="section">
            <h3>난이도별 분배</h3>
            <div class="difficulty-distribution">
              <div 
                v-for="level in difficultyLevels" 
                :key="level.code"
                class="difficulty-item"
              >
                <div class="difficulty-info">
                  <span :class="'difficulty-badge level-' + level.code">{{ level.name }}</span>
                  <span class="difficulty-available">({{ getDifficultyAvailable(level.code) }}개 가능)</span>
                </div>
                <div class="percentage-input">
                  <input 
                    type="range" 
                    :value="getDifficultyPercentage(level.code)"
                    @input="setDifficultyPercentage(level.code, $event.target.value)"
                    min="0" 
                    max="100"
                    step="5"
                    class="slider"
                  />
                  <span class="percentage-value">{{ getDifficultyPercentage(level.code) }}%</span>
                </div>
              </div>
              
              <div class="distribution-summary">
                <span>합계: {{ difficultyPercentageTotal }}%</span>
                <button 
                  class="btn-auto-distribute"
                  @click="autoDistributeDifficulty"
                >
                  균등 분배
                </button>
              </div>
            </div>
          </div>

          <!-- 추가 옵션 -->
          <div class="section">
            <h3>추가 옵션</h3>
            <div class="additional-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="options.avoidDuplicate" />
                <span>중복 문항 제외</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="options.prioritizeRecent" />
                <span>최신 문항 우선</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" v-model="options.includePassage" />
                <span>지문 문항 포함</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">
            취소
          </button>
          <button 
            class="btn btn-primary"
            @click="handleGenerate"
            :disabled="!canGenerate"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 3L4.00999 20.892L6.45099 21.1105L9.85999 13H14.17L13 3Z" fill="currentColor"/>
              <path d="M17.96 11.0105L20 20L14.74 17.5005L11 3L17.96 11.0105Z" fill="currentColor"/>
            </svg>
            {{ totalCount }}개 문항 생성
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import itemApiService from '@/services/itemApi'

// Props & Emits
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  selectedChapters: {
    type: Array,
    default: () => []
  },
  currentFilters: {
    type: Object,
    default: () => ({})
  },
  existingItems: {
    type: Array,
    default: () => []
  },
  textbooks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'generate'])

// State
const totalCount = ref(20)
const chapterDistribution = ref({})
const difficultyDistribution = ref({
  1: 10, // 매우쉬움
  2: 20, // 쉬움
  3: 40, // 보통
  4: 20, // 어려움
  5: 10  // 매우어려움
})

// 필터 상태
const filters = ref({
  textbook: '',
  difficulties: [],
  questionTypes: []
})

const options = ref({
  avoidDuplicate: true,
  prioritizeRecent: false,
  includePassage: true
})

const availableCount = ref(0)
const difficultyAvailable = ref({})

// 난이도 레벨
const difficultyLevels = [
  { code: 1, name: '매우쉬움' },
  { code: 2, name: '쉬움' },
  { code: 3, name: '보통' },
  { code: 4, name: '어려움' },
  { code: 5, name: '매우어려움' }
]

// 문제 유형
const questionTypes = [
  { code: 'OBJ', name: '객관식' },
  { code: 'SUB', name: '주관식' },
  { code: 'ESS', name: '서술형' }
]

// 부모에서 전달받은 교과서 데이터 사용
const textbooks = computed(() => props.textbooks || [])

// Computed
const distributionTotal = computed(() => {
  return Object.values(chapterDistribution.value).reduce((sum, count) => sum + count, 0)
})

const difficultyPercentageTotal = computed(() => {
  return Object.values(difficultyDistribution.value).reduce((sum, percent) => sum + percent, 0)
})

const canGenerate = computed(() => {
  return totalCount.value > 0 && 
         totalCount.value <= availableCount.value &&
         (props.selectedChapters.length === 0 || distributionTotal.value === totalCount.value) &&
         Math.abs(difficultyPercentageTotal.value - 100) < 5
})

// Methods
const adjustTotalCount = (delta) => {
  totalCount.value = Math.max(1, Math.min(100, totalCount.value + delta))
}

const getChapterCount = (chapterId) => {
  return chapterDistribution.value[chapterId] || 0
}

const setChapterCount = (chapterId, value) => {
  const count = Math.max(0, Math.min(totalCount.value, parseInt(value) || 0))
  chapterDistribution.value[chapterId] = count
}

const adjustChapterCount = (chapterId, delta) => {
  const current = getChapterCount(chapterId)
  setChapterCount(chapterId, current + delta)
}

const getDifficultyPercentage = (code) => {
  return difficultyDistribution.value[code] || 0
}

const setDifficultyPercentage = (code, value) => {
  difficultyDistribution.value[code] = parseInt(value) || 0
}

const getDifficultyAvailable = (code) => {
  return difficultyAvailable.value[code] || 0
}

const autoDistribute = () => {
  if (props.selectedChapters.length === 0) return
  
  const baseCount = Math.floor(totalCount.value / props.selectedChapters.length)
  const remainder = totalCount.value % props.selectedChapters.length
  
  props.selectedChapters.forEach((chapter, index) => {
    const count = baseCount + (index < remainder ? 1 : 0)
    chapterDistribution.value[chapter.id] = Math.min(count, chapter.itemCount)
  })
}

const autoDistributeDifficulty = () => {
  const equalPercent = 20
  difficultyLevels.forEach(level => {
    difficultyDistribution.value[level.code] = equalPercent
  })
}

const handleFilterChange = async () => {
  // 필터가 변경되면 사용 가능한 문항 수 재계산
  await loadAvailableCounts()
}

const handleClose = () => {
  emit('close')
}

const handleGenerate = async () => {
  if (!canGenerate.value) return
  
  const config = {
    totalCount: totalCount.value,
    chapterDistribution: chapterDistribution.value,
    difficultyDistribution: difficultyDistribution.value,
    options: options.value,
    filters: {
      ...props.currentFilters,
      ...filters.value, // 모달 내부 필터 추가
      textbook: filters.value.textbook || props.currentFilters.textbook,
      difficulties: filters.value.difficulties.length > 0 ? 
        filters.value.difficulties : props.currentFilters.difficulties,
      questionTypes: filters.value.questionTypes.length > 0 ? 
        filters.value.questionTypes : props.currentFilters.questionTypes
    }
  }
  
  // 실제 랜덤 생성 로직은 부모 컴포넌트에서 처리
  emit('generate', config)
}

// 사용 가능한 문항 수 계산
const loadAvailableCounts = async () => {
  // 여기서 실제 API 호출하여 사용 가능한 문항 수 가져오기
  // 임시로 설정
  availableCount.value = 150
  
  difficultyAvailable.value = {
    1: 20,
    2: 35,
    3: 50,
    4: 30,
    5: 15
  }
}

// Watch
watch(() => props.show, (newVal) => {
  if (newVal) {
    // 부모 컴포넌트의 필터를 초기값으로 설정
    if (props.currentFilters) {
      filters.value = {
        textbook: props.currentFilters.textbook || '',
        difficulties: props.currentFilters.difficulties || [],
        questionTypes: props.currentFilters.questionTypes || []
      }
    }
    
    loadAvailableCounts()
    
    // 선택된 단원이 있으면 초기 분배
    if (props.selectedChapters.length > 0) {
      autoDistribute()
    }
  }
})

watch(totalCount, () => {
  // 총 문항 수가 변경되면 자동 재분배
  if (props.selectedChapters.length > 0) {
    autoDistribute()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 모달 헤더 */
.modal-header {
  padding: 24px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  color: #6B7280;
}

.btn-close:hover {
  background: #F3F4F6;
  color: #111827;
}

/* 모달 바디 */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.section {
  margin-bottom: 32px;
}

.section:last-child {
  margin-bottom: 0;
}

.section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 필터 설정 */
.filter-settings {
  background: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
}

.filter-row {
  margin-bottom: 16px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-row > label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.filter-select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-option {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-option input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.chip-option:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

.chip-option.active {
  background: #EBF5FF;
  border-color: #3B82F6;
  color: #1E40AF;
}

.chip-option span {
  font-weight: 500;
}

.chip-option .difficulty-1 {
  color: #1E40AF;
}

.chip-option .difficulty-2 {
  color: #065F46;
}

.chip-option .difficulty-3 {
  color: #92400E;
}

.chip-option .difficulty-4 {
  color: #9A3412;
}

.chip-option .difficulty-5 {
  color: #991B1B;
}

/* 전체 설정 */
.total-settings {
  background: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-row label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.available-count {
  font-size: 16px;
  font-weight: 600;
  color: #10B981;
}

/* 입력 그룹 */
.input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-group.small {
  gap: 2px;
}

.btn-number {
  width: 32px;
  height: 32px;
  border: 1px solid #D1D5DB;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-number.small {
  width: 24px;
  height: 24px;
  font-size: 12px;
}

.btn-number:hover:not(:disabled) {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

.btn-number:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-number {
  width: 60px;
  height: 32px;
  text-align: center;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.input-number.small {
  width: 40px;
  height: 24px;
  font-size: 12px;
}

.input-number:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 단원별 분배 */
.chapter-distribution {
  background: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
}

.chapter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #E5E7EB;
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.chapter-name {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.chapter-available {
  font-size: 12px;
  color: #6B7280;
}

.distribution-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.distribution-summary span {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.btn-auto-distribute {
  padding: 6px 12px;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-auto-distribute:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

/* 난이도별 분배 */
.difficulty-distribution {
  background: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
}

.difficulty-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.difficulty-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.difficulty-badge.level-1 {
  background: #DBEAFE;
  color: #1E40AF;
}

.difficulty-badge.level-2 {
  background: #D1FAE5;
  color: #065F46;
}

.difficulty-badge.level-3 {
  background: #FEF3C7;
  color: #92400E;
}

.difficulty-badge.level-4 {
  background: #FED7AA;
  color: #9A3412;
}

.difficulty-badge.level-5 {
  background: #FEE2E2;
  color: #991B1B;
}

.difficulty-available {
  font-size: 12px;
  color: #6B7280;
}

.percentage-input {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 300px;
}

.slider {
  flex: 1;
  height: 4px;
  background: #E5E7EB;
  outline: none;
  -webkit-appearance: none;
  border-radius: 2px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3B82F6;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3B82F6;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.percentage-value {
  min-width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

/* 추가 옵션 */
.additional-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-option span {
  font-size: 14px;
  color: #374151;
}

/* 모달 푸터 */
.modal-footer {
  padding: 24px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

/* 버튼 */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563EB;
}

.btn-primary:disabled {
  background: #9CA3AF;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.btn-secondary:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

/* 스크롤바 스타일 */
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #9CA3AF;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #6B7280;
}
</style>