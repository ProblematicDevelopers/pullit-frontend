<!--
  Step2: 간편 생성 설정
  
  이 컴포넌트는 간편 생성 모드에서 시험지 생성 옵션을 설정하는 화면입니다.
  학년, 과목, 문항 수, 난이도 등을 설정할 수 있습니다.
-->

<template>
  <div class="step2-simple-generation">
    <!-- 생성된 문항 미리보기 화면 -->
    <div v-if="showPreview && generatedItems.length > 0" class="preview-mode">
      <!-- 미리보기 헤더 -->
      <header class="step-header">
        <button class="btn-back" @click="backToSettings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          설정으로 돌아가기
        </button>
        
        <div class="header-info">
          <h2>생성된 문항 확인</h2>
          <p class="header-desc">AI가 선택한 {{ generatedItems.length }}개의 문항을 확인하세요</p>
        </div>
      </header>

      <!-- 생성 리포트 -->
      <div class="generation-report" v-if="selectionReport">
        <div class="report-card">
          <h4>📊 문항 생성 결과</h4>
          <div class="report-stats">
            <div class="stat-item">
              <span class="stat-label">요청 문항 수:</span>
              <span class="stat-value">{{ selectionReport.requestedCount }}개</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">실제 생성 문항 수:</span>
              <span class="stat-value">{{ selectionReport.actualCount }}개</span>
            </div>
            <div class="stat-item" v-if="selectionReport.difficultyAdjusted">
              <span class="stat-label warning">⚠️ 난이도 조정:</span>
              <span class="stat-value warning">{{ selectionReport.adjustmentMessage }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 문항 목록 -->
      <div class="preview-items">
        <div class="items-header">
          <h3>문항 목록</h3>
          <span class="item-count">총 {{ generatedItems.length }}문항</span>
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
                <div v-if="group.passageHtml" v-html="sanitizeHtml(group.passageHtml)" class="passage-text mathjax-content" data-mathjax-pending="true"></div>
                <div v-else-if="group.passageText" class="passage-text">{{ group.passageText }}</div>
              </div>
            </div>
            
            <!-- 오른쪽: 문제 영역 -->
            <div class="passage-items">
              <div 
                v-for="item in group.items"
                :key="item.itemId"
                class="item-card"
              >
                <!-- 카드 헤더 -->
                <div class="card-header">
                  <span class="item-id">#{{ item.itemId }}</span>
                  <div class="item-badges">
                    <span :class="'badge-difficulty difficulty-' + item.difficulty?.code">
                      {{ item.difficulty?.name }}
                    </span>
                    <span class="badge-type">{{ item.questionForm?.name }}</span>
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
                    <div v-if="item.questionHtml" class="item-html mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                    <div v-else-if="item.questionImageUrl" class="item-image">
                      <img 
                        :src="item.questionImageUrl" 
                        :alt="`문항 ${item.itemId}`"
                        loading="lazy"
                      />
                    </div>
                    <div v-else class="item-text">
                      {{ item.questionText || '내용 없음' }}
                    </div>
                  </div>

                  <!-- 선택지 (객관식인 경우) -->
                  <div v-if="hasChoices(item)" class="item-choices mathjax-content" data-mathjax-pending="true">
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
        </div>
        
        <!-- 일반 문항 그리드 뷰 (지문이 없는 문제들) -->
        <div class="items-grid">
          <div
            v-for="item in regularItems"
            :key="item.itemId"
            class="item-card"
          >
            <!-- 카드 헤더 -->
            <div class="card-header">
              <span class="item-id">#{{ item.itemId }}</span>
              <div class="item-badges">
                <span :class="'badge-difficulty difficulty-' + item.difficulty?.code">
                  {{ item.difficulty?.name }}
                </span>
                <span class="badge-type">{{ item.questionForm?.name }}</span>
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
                <div v-if="item.questionHtml" class="item-html mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>
                <div v-else-if="item.questionImageUrl" class="item-image">
                  <img 
                    :src="item.questionImageUrl" 
                    :alt="`문항 ${item.itemId}`"
                    loading="lazy"
                  />
                </div>
                <div v-else class="item-text">
                  {{ item.questionText || '내용 없음' }}
                </div>
              </div>

              <!-- 선택지 (객관식인 경우) -->
              <div v-if="hasChoices(item)" class="item-choices mathjax-content" data-mathjax-pending="true">
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

      <!-- 하단 액션 버튼 -->
      <footer class="step-footer">
        <button class="btn btn-secondary" @click="regenerate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3.51 15C4.15 16.84 5.54 18.34 7.34 19.06C9.14 19.78 11.17 19.68 12.9 18.77C14.63 17.86 15.89 16.25 16.37 14.34C16.85 12.43 16.51 10.39 15.43 8.72C14.35 7.05 12.64 5.89 10.71 5.5C8.78 5.11 6.81 5.52 5.2 6.64L1 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          다시 생성
        </button>
        
        <button class="btn btn-primary" @click="confirmAndProceed">
          확인 후 다음 단계
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </footer>
    </div>

    <!-- 기존 설정 화면 -->
    <template v-else>
      <!-- 헤더 -->
      <header class="step-header">
        <button class="btn-back" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          이전
        </button>
        
        <div class="header-info">
          <h2>간편 생성 설정</h2>
          <p class="header-desc">시험지를 자동으로 생성하기 위한 조건을 설정해주세요</p>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <div class="content-wrapper">
      <div class="settings-container">
        <!-- 기본 설정 섹션 -->
        <div class="setting-section">
          <h3 class="section-title">
            <span class="icon">📚</span>
            기본 설정
          </h3>
          
          <div class="setting-group">
            <!-- 학년 선택 -->
            <div class="setting-item">
              <label>학년</label>
              <div class="radio-group">
                <label 
                  v-for="grade in grades" 
                  :key="grade.code"
                  class="radio-chip"
                  :class="{ active: settings.grade === grade.code }"
                >
                  <input 
                    type="radio" 
                    :value="grade.code" 
                    v-model="settings.grade"
                    @change="handleGradeChange"
                  />
                  <span>{{ grade.name }}</span>
                </label>
              </div>
            </div>

            <!-- 과목 선택 -->
            <div class="setting-item">
              <label>과목</label>
              <div class="radio-group">
                <label 
                  v-for="subject in subjects" 
                  :key="subject.code"
                  class="radio-chip"
                  :class="{ active: settings.subject === subject.code }"
                  :style="{ '--subject-color': subject.color }"
                >
                  <input 
                    type="radio" 
                    :value="subject.code" 
                    v-model="settings.subject"
                    @change="handleSubjectChange"
                  />
                  <span>{{ subject.name }}</span>
                </label>
              </div>
            </div>

            <!-- 교과서 선택 (선택적) -->
            <div class="setting-item" v-if="textbooks.length > 0">
              <label>교과서 <span class="optional">(선택)</span></label>
              <select v-model="settings.textbook" @change="handleTextbookChange" class="select-input">
                <option value="">전체 교과서</option>
                <option 
                  v-for="textbook in textbooks" 
                  :key="textbook.subjectId"
                  :value="textbook.subjectId"
                >
                  {{ textbook.subjectName }} ({{ textbook.itemCount }}문항)
                </option>
              </select>
            </div>

            <!-- 단원 선택 -->
            <div class="setting-item" v-if="settings.textbook">
              <label>단원 선택 <span class="optional">(선택)</span></label>
              <ChapterTreeSelector
                v-if="chapters.length > 0"
                v-model="settings.chapters"
                :chapters="chapters"
              />
              <p class="help-text" v-else-if="!settings.textbook">
                교과서를 선택하면 단원을 선택할 수 있습니다
              </p>
              <p class="help-text" v-else>
                단원 정보를 불러오는 중...
              </p>
            </div>
          </div>
        </div>

        <!-- 문항 설정 섹션 -->
        <div class="setting-section">
          <h3 class="section-title">
            <span class="icon">📝</span>
            문항 설정
          </h3>
          
          <div class="setting-group">
            <!-- 문항 수 설정 -->
            <div class="setting-item">
              <label>총 문항 수</label>
              <div class="number-control">
                <button @click="adjustItemCount(-5)" :disabled="settings.itemCount <= 5" class="btn-adjust">-5</button>
                <button @click="adjustItemCount(-1)" :disabled="settings.itemCount <= 1" class="btn-adjust">-</button>
                <input 
                  type="number" 
                  v-model.number="settings.itemCount"
                  min="1"
                  max="50"
                  class="number-input"
                />
                <button @click="adjustItemCount(1)" :disabled="settings.itemCount >= 50" class="btn-adjust">+</button>
                <button @click="adjustItemCount(5)" :disabled="settings.itemCount >= 46" class="btn-adjust">+5</button>
              </div>
              <p class="help-text">1~50개 사이로 설정할 수 있습니다</p>
            </div>

            <!-- 난이도 설정 -->
            <div class="setting-item">
              <label>난이도 분포</label>
              <div class="radio-group">
                <label 
                  v-for="level in difficultyLevels" 
                  :key="level.value"
                  class="radio-chip difficulty"
                  :class="{ active: settings.difficulty === level.value }"
                >
                  <input 
                    type="radio" 
                    :value="level.value" 
                    v-model="settings.difficulty"
                  />
                  <span>{{ level.label }}</span>
                  <span class="badge">{{ level.description }}</span>
                </label>
              </div>
            </div>

            <!-- 문제 유형 설정 -->
            <div class="setting-item">
              <label>문제 유형</label>
              <div class="checkbox-group">
                <label 
                  v-for="type in questionTypes" 
                  :key="type.code"
                  class="checkbox-chip"
                  :class="{ active: settings.questionTypes.includes(type.code) }"
                >
                  <input 
                    type="checkbox" 
                    :value="type.code" 
                    v-model="settings.questionTypes"
                  />
                  <span>{{ type.name }}</span>
                </label>
              </div>
              <p class="help-text">선택하지 않으면 모든 유형이 포함됩니다</p>
            </div>
          </div>
        </div>

        <!-- 고급 설정 섹션 -->
        <div class="setting-section">
          <h3 class="section-title">
            <span class="icon">⚙️</span>
            고급 설정
          </h3>
          
          <div class="setting-group">
            <!-- 추가 옵션 -->
            <div class="setting-item">
              <label>추가 옵션</label>
              <div class="option-group">
                <label class="switch-option">
                  <input type="checkbox" v-model="settings.includePassage" />
                  <span class="switch"></span>
                  <span>지문 문항 포함</span>
                </label>
                <label class="switch-option">
                  <input type="checkbox" v-model="settings.avoidDuplicate" />
                  <span class="switch"></span>
                  <span>최근 사용 문항 제외</span>
                </label>
                <label class="switch-option">
                  <input type="checkbox" v-model="settings.prioritizeLatest" />
                  <span class="switch"></span>
                  <span>최신 문항 우선</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 생성 미리보기 -->
        <div class="preview-section">
          <h3 class="section-title">
            <span class="icon">✨</span>
            생성 예상 결과
          </h3>
          <div class="preview-content">
            <div class="preview-item">
              <span class="label">학년/과목:</span>
              <span class="value">{{ getGradeName }} {{ getSubjectName }}</span>
            </div>
            <div class="preview-item">
              <span class="label">문항 수:</span>
              <span class="value">{{ settings.itemCount }}문항</span>
            </div>
            <div class="preview-item">
              <span class="label">난이도:</span>
              <span class="value">{{ getDifficultyName }}</span>
            </div>
            <div class="preview-item" v-if="settings.questionTypes.length > 0">
              <span class="label">문제 유형:</span>
              <span class="value">{{ getQuestionTypesName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 액션 버튼 -->
    <footer class="step-footer">
      <button class="btn btn-secondary" @click="handleBack">
        이전
      </button>
      
      <button 
        class="btn btn-primary"
        :disabled="!canGenerate || isGenerating"
        @click="handleGenerate"
      >
        <span v-if="!isGenerating">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M13 3L4.00999 20.892L6.45099 21.1105L9.85999 13H14.17L13 3Z" fill="currentColor"/>
            <path d="M17.96 11.0105L20 20L14.74 17.5005L11 3L17.96 11.0105Z" fill="currentColor"/>
          </svg>
          시험지 생성
        </span>
        <span v-else>
          생성 중...
        </span>
      </button>
    </footer>
    </template>
    
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
import itemApiService from '@/services/itemApi'
import chapterApi from '@/services/chapterApi'
import ChapterTreeSelector from './ChapterTreeSelector.vue'
import SimilarItemsModal from '@/components/common/SimilarItemsModal.vue'
import { useMathJax } from '@/composables/useMathJax'
import { renderMathJaxSmartHybrid } from '@/utils/mathjax-hybrid'
import DOMPurify from 'dompurify'

// Props & Emits
const props = defineProps({
  examInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['back', 'next'])

// State
const settings = ref({
  grade: null,
  subject: null,
  textbook: '',
  itemCount: 20,
  difficulty: 'mixed',
  questionTypes: [],
  chapters: [],
  includePassage: true,
  avoidDuplicate: true,
  prioritizeLatest: false
})

const textbooks = ref([])
const chapters = ref([])
const isGenerating = ref(false)

// 미리보기 관련 상태
const showPreview = ref(false)
const generatedItems = ref([])
const selectionMetadata = ref(null)
const selectionReport = ref(null)

// 유사 문항 모달 관련 상태
const showSimilarItemsModal = ref(false)
const selectedItemForSimilar = ref(null)

// MathJax 컴포저블 사용 - FOUC 방지 설정
const { render: renderMath } = useMathJax({
  immediate: false,  // 수동 렌더링
  hideBeforeRender: true,  // FOUC 방지
  clearFirst: false,  // 기존 렌더링 유지
  waitForContent: true,  // 컨텐츠 준비 대기
  debounceDelay: 100
})

// 학년 옵션
const grades = [
  { code: '07', name: '중1' },
  { code: '08', name: '중2' },
  { code: '09', name: '중3' }
]

// 과목 옵션
const subjects = [
  { code: 'MA', name: '수학', color: '#3B82F6' },
  { code: 'KO', name: '국어', color: '#10B981' },
  { code: 'EN', name: '영어', color: '#F59E0B' },
  { code: 'SC', name: '과학', color: '#8B5CF6' },
  { code: 'SO', name: '사회', color: '#EF4444' }
]

// 난이도 옵션
const difficultyLevels = [
  { value: 'easy', label: '쉬움', description: '하 70% · 중 30%' },
  { value: 'normal', label: '보통', description: '하 20% · 중 60% · 상 20%' },
  { value: 'hard', label: '어려움', description: '중 30% · 상 70%' },
  { value: 'mixed', label: '혼합', description: '고른 분포' }
]

// 문제 유형
const questionTypes = [
  { code: 'OBJ', name: '객관식' },
  { code: 'SUB', name: '주관식' },
  { code: 'ESS', name: '서술형' }
]

// Computed
const canGenerate = computed(() => {
  return settings.value.grade && 
         settings.value.subject && 
         settings.value.textbook &&  // 교과서 선택 필수
         settings.value.chapters.length > 0 &&  // 챕터 선택 필수
         settings.value.itemCount > 0
})

const getGradeName = computed(() => {
  const grade = grades.find(g => g.code === settings.value.grade)
  return grade ? grade.name : '-'
})

const getSubjectName = computed(() => {
  const subject = subjects.find(s => s.code === settings.value.subject)
  return subject ? subject.name : '-'
})

const getDifficultyName = computed(() => {
  const level = difficultyLevels.find(l => l.value === settings.value.difficulty)
  return level ? level.label : '-'
})

const getQuestionTypesName = computed(() => {
  return settings.value.questionTypes
    .map(code => {
      const type = questionTypes.find(t => t.code === code)
      return type ? type.name : ''
    })
    .filter(Boolean)
    .join(', ') || '전체'
})

// 지문 그룹핑 관련 computed properties
const passageGroups = computed(() => {
  const groups = new Map()
  
  generatedItems.value.forEach(item => {
    if (item.passageId) {
      if (!groups.has(item.passageId)) {
        groups.set(item.passageId, {
          passageId: item.passageId,
          passageHtml: item.passageHtml,
          passageText: item.passageText,
          items: []
        })
      }
      groups.get(item.passageId).items.push(item)
    }
  })
  
  return Array.from(groups.values())
})

// 지문이 없는 일반 문제들
const regularItems = computed(() => {
  return generatedItems.value.filter(item => !item.passageId)
})

// 지문 그룹이 있는지 확인
const hasPassageGroups = computed(() => {
  return passageGroups.value.length > 0
})

// Methods
// HTML 정리 함수 - 도수분포표와 지문 콘텐츠 보존
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

const adjustItemCount = (delta) => {
  const newCount = settings.value.itemCount + delta
  if (newCount >= 1 && newCount <= 50) {
    settings.value.itemCount = newCount
  }
}

const handleGradeChange = async () => {
  // 학년이 변경되면 교과서와 단원 초기화
  settings.value.textbook = ''
  settings.value.chapters = []
  chapters.value = []
  
  if (settings.value.grade && settings.value.subject) {
    await loadTextbooks()
  }
}

const handleSubjectChange = async () => {
  // 과목이 변경되면 교과서와 단원 초기화
  settings.value.textbook = ''
  settings.value.chapters = []
  chapters.value = []
  
  if (settings.value.grade && settings.value.subject) {
    await loadTextbooks()
  }
}

const handleTextbookChange = async () => {
  // 교과서가 변경되면 단원 초기화 후 로드
  settings.value.chapters = []
  chapters.value = []
  
  if (settings.value.textbook) {
    await loadChapters()
  }
}

const loadTextbooks = async () => {
  try {
    const response = await itemApiService.getSubjects({
      gradeCode: settings.value.grade,
      areaCode: settings.value.subject,
      includeTextbooks: true
    })
    
    if (response.success) {
      textbooks.value = response.data || []
      
      // 교과서가 하나면 자동 선택
      if (textbooks.value.length === 1) {
        settings.value.textbook = textbooks.value[0].subjectId
        // 자동으로 단원 로드
        await loadChapters()
      }
    }
  } catch (error) {
    console.error('교과서 로드 실패:', error)
  }
}

const loadChapters = async () => {
  if (!settings.value.textbook) {
    chapters.value = []
    return
  }
  
  try {
    console.log('단원 트리 로드 시작:', settings.value.textbook)
    
    // Step2ItemSelection과 동일하게 getChapterTree 사용
    const response = await chapterApi.getChapterTree(settings.value.textbook)
    console.log('단원 트리 응답:', response)
    
    if (response.success && response.data) {
      // 트리 구조로 받은 데이터 그대로 사용
      chapters.value = response.data
      console.log('단원 트리 로드 성공:', chapters.value)
    } else if (response.data?.success && response.data?.data) {
      // response.data 안에 success가 있는 경우
      chapters.value = response.data.data
      console.log('단원 트리 로드 성공 (nested):', chapters.value)
    } else {
      console.warn('단원 트리 데이터가 비어있습니다:', response)
      chapters.value = []
    }
  } catch (error) {
    console.error('단원 트리 로드 실패:', error)
    chapters.value = []
  }
}

const handleBack = () => {
  emit('back')
}

// 유사 문항 모달 메서드
const openSimilarItemsModal = (item) => {
  console.log('Opening similar items modal for:', item)
  selectedItemForSimilar.value = item
  showSimilarItemsModal.value = true
}

const handleAddSimilarItems = (items) => {
  console.log('Adding similar items:', items)
  // 선택된 유사 문항들을 generatedItems에 추가
  if (items && items.length > 0) {
    // 중복 체크 후 추가
    const existingItemIds = generatedItems.value.map(item => item.itemId || item.item_id)
    const newItems = items.filter(item => !existingItemIds.includes(item.itemId || item.item_id))
    
    if (newItems.length > 0) {
      generatedItems.value.push(...newItems)
      console.log(`Added ${newItems.length} similar items to the list`)
    } else {
      console.log('All selected items already exist in the list')
    }
  }
}

// 미리보기 관련 메서드
const backToSettings = () => {
  showPreview.value = false
  generatedItems.value = []
  selectionReport.value = null
}

const regenerate = () => {
  // 설정 화면으로 돌아가서 다시 생성
  backToSettings()
}

const confirmAndProceed = () => {
  // 생성된 문항과 설정 정보를 다음 단계로 전달
  const generatedData = {
    ...settings.value,
    selectedItems: generatedItems.value,
    selectionMetadata: selectionMetadata.value,
    selectionReport: selectionReport.value
  }
  
  emit('next', generatedData)
}

const getQuestionTypeName = (code) => {
  const typeMap = {
    1: '객관식',
    2: '주관식',
    3: '서술형'
  }
  return typeMap[code] || '기타'
}

const handleGenerate = async () => {
  if (!canGenerate.value || isGenerating.value) return
  
  try {
    isGenerating.value = true
    
    // 교과서가 선택되지 않은 경우
    if (!settings.value.textbook) {
      alert('교과서를 선택해주세요.')
      isGenerating.value = false
      return
    }
    
    // 챕터가 선택되지 않은 경우
    if (settings.value.chapters.length === 0) {
      alert('최소 하나 이상의 단원을 선택해주세요.')
      isGenerating.value = false
      return
    }
    
    // 문제 유형 코드를 ID로 매핑 (백엔드에서 필요 시)
    // 일단 빈 배열로 전송 (백엔드에서 questionTypes는 Long 타입 ID를 기대함)
    const questionTypeIds = []
    
    // Smart Random Selection API 파라미터
    const searchParams = {
      subjectId: parseInt(settings.value.textbook), // 교과서 ID (필수)
      chapters: settings.value.chapters.map(id => parseInt(id)), // 챕터 ID 배열 (필수)
      itemCount: settings.value.itemCount,
      difficulty: settings.value.difficulty, // 문자열 그대로 (easy, normal, hard, mixed)
      questionTypes: questionTypeIds, // Long 타입 ID 배열
      includePassage: settings.value.includePassage,
      avoidDuplicate: settings.value.avoidDuplicate,
      prioritizeLatest: settings.value.prioritizeLatest
    }
    
    console.log('Smart Random Selection 요청 파라미터:', searchParams)
    const result = await itemApiService.smartRandomSelection(searchParams)
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`Smart Random Selection 성공: ${result.data.length}개 문항 생성됨`)
      
      // 메타데이터와 리포트 로깅
      if (result.metadata) {
        console.log('선택 메타데이터:', result.metadata)
        selectionMetadata.value = result.metadata
      }
      if (result.report) {
        console.log('선택 리포트:', result.report)
        
        // 리포트 정보 가공
        selectionReport.value = {
          requestedCount: result.metadata?.requestedCount || settings.value.itemCount,
          actualCount: result.data.length,
          difficultyAdjusted: result.report?.hasFallback || false,
          adjustmentMessage: result.report?.fallbackReason || ''
        }
      }
      
      // 생성된 문항 저장
      generatedItems.value = result.data
      
      // 미리보기 화면으로 전환
      showPreview.value = true
      
      // MathJax 스마트 하이브리드 렌더링
      await nextTick()
      requestAnimationFrame(async () => {
        const container = document.querySelector('.preview-content') || document.body
        await renderMathJaxSmartHybrid(container, {
          hideBeforeRender: true,
          clearFirst: false
        })
      })
    } else {
      console.warn('Smart Random Selection 결과 없음:', result)
      
      // 에러 메시지가 있으면 표시
      if (result.error) {
        alert(`문항 생성 실패: ${result.error}`)
      } else {
        alert('조건에 맞는 문항을 찾을 수 없습니다. 다른 조건으로 시도해주세요.')
      }
    }
  } catch (error) {
    console.error('Smart Random Selection 오류:', error)
    alert('문항 생성 중 오류가 발생했습니다.')
  } finally {
    isGenerating.value = false
  }
}

// Lifecycle
// showPreview 변경 시 MathJax 렌더링
watch(showPreview, async (newVal) => {
  if (newVal) {
    await nextTick()
    requestAnimationFrame(async () => {
      const container = document.querySelector('.preview-content') || document.body
      await renderMathJaxSmartHybrid(container, {
        hideBeforeRender: true,
        clearFirst: false
      })
    })
  }
})

// generatedItems 변경 시 MathJax 렌더링
watch(generatedItems, async () => {
  if (showPreview.value && generatedItems.value.length > 0) {
    await nextTick()
    requestAnimationFrame(async () => {
      const container = document.querySelector('.preview-content') || document.body
      await renderMathJaxSmartHybrid(container, {
        hideBeforeRender: true,
        clearFirst: false
      })
    })
  }
}, { deep: true })

onMounted(async () => {
  // 이전 설정이 있으면 복원
  if (props.examInfo) {
    if (props.examInfo.gradeCode) settings.value.grade = props.examInfo.gradeCode
    if (props.examInfo.areaCode) settings.value.subject = props.examInfo.areaCode
    
    // 학년과 과목이 있으면 교과서 로드
    if (settings.value.grade && settings.value.subject) {
      await loadTextbooks()
      
      // 이전에 선택한 교과서가 있으면 복원하고 단원 로드
      if (props.examInfo.textbook) {
        settings.value.textbook = props.examInfo.textbook
        await loadChapters()
      }
    }
  }
})
</script>

<style scoped>
.step2-simple-generation {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #F9FAFB;
}

/* 헤더 */
.step-header {
  padding: 24px;
  background: white;
  border-bottom: 1px solid #E5E7EB;
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
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

.header-info h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.header-desc {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

/* 메인 컨텐츠 */
.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

/* 설정 섹션 */
.setting-section {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #F3F4F6;
  transition: all 0.3s;
}

.setting-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid #F3F4F6;
}

.section-title .icon {
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #F9FAFB;
  border-radius: 10px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-item label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.optional {
  color: #9CA3AF;
  font-weight: 400;
  text-transform: none;
}

.help-text {
  font-size: 12px;
  color: #6B7280;
  margin-top: 8px;
}

/* 라디오/체크박스 그룹 */
.radio-group,
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.radio-chip,
.checkbox-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  background: #FAFBFC;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.radio-chip input,
.checkbox-chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-chip:hover,
.checkbox-chip:hover {
  background: white;
  border-color: #9CA3AF;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.radio-chip.active,
.checkbox-chip.active {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border-color: #3B82F6;
  color: #1E40AF;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.radio-chip.difficulty {
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  min-width: 120px;
}

.radio-chip.difficulty .badge {
  font-size: 11px;
  color: #6B7280;
  margin-top: 4px;
}

/* 숫자 컨트롤 */
.number-control {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: #F9FAFB;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.btn-adjust {
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.btn-adjust:hover:not(:disabled) {
  background: #3B82F6;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-adjust:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-adjust:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #F3F4F6;
}

.number-input {
  width: 80px;
  height: 40px;
  text-align: center;
  border: none;
  background: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.number-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* 셀렉트 */
.select-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  cursor: pointer;
}

.select-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 단원 선택 */
.chapter-selector {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.chapter-item {
  padding: 8px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.checkbox-label .count {
  color: #9CA3AF;
  font-size: 12px;
  margin-left: auto;
}

/* 스위치 옵션 */
.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.switch-option input {
  display: none;
}

.switch {
  width: 44px;
  height: 24px;
  background: #D1D5DB;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s;
}

.switch::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 10px;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
}

.switch-option input:checked + .switch {
  background: #3B82F6;
}

.switch-option input:checked + .switch::after {
  left: 22px;
}

/* 미리보기 섹션 */
.preview-section {
  background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
  border-radius: 16px;
  padding: 28px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.preview-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.3; }
}

.preview-section .section-title {
  color: white;
  margin-bottom: 20px;
  border-bottom-color: rgba(255,255,255,0.2);
  position: relative;
  z-index: 1;
}

.preview-section .section-title .icon {
  background: rgba(255,255,255,0.15);
}

.preview-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.preview-item .label {
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-item .value {
  font-size: 18px;
  font-weight: 700;
}

/* 푸터 */
.step-footer {
  padding: 24px;
  background: white;
  border-top: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* 미리보기 모드 스타일 */
.preview-mode {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #F9FAFB;
}

/* 문항 카드 스타일 */
.preview-mode .item-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  min-height: 280px;
  max-height: 350px;
  display: flex;
  flex-direction: column;
}

.preview-mode .item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.preview-mode .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.preview-mode .item-id {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.preview-mode .item-badges {
  display: flex;
  gap: 0.5rem;
}

.preview-mode .badge-difficulty,
.preview-mode .badge-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.preview-mode .badge-difficulty {
  background: #fef3c7;
  color: #92400e;
}

.preview-mode .badge-difficulty.difficulty-1,
.preview-mode .badge-difficulty.difficulty-L {
  background: #dcfce7;
  color: #166534;
}

.preview-mode .badge-difficulty.difficulty-2,
.preview-mode .badge-difficulty.difficulty-M {
  background: #fef3c7;
  color: #92400e;
}

.preview-mode .badge-difficulty.difficulty-3,
.preview-mode .badge-difficulty.difficulty-H {
  background: #fee2e2;
  color: #991b1b;
}

.preview-mode .badge-type {
  background: #e0e7ff;
  color: #3730a3;
}

.preview-mode .card-body {
  flex: 1;
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-mode .question-section {
  flex: 1;
}

.preview-mode .item-html,
.preview-mode .item-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  word-break: break-word;
}

.preview-mode .item-image img {
  max-width: 400px;  /* 미리보기 모드에서도 크기 제한 */
  max-height: 300px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
}

.preview-mode .item-choices {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.preview-mode .choice {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  color: #4b5563;
}

/* 지문 그룹 스타일 */
.passage-groups {
  padding: 1rem;
  overflow-y: auto;
}

.passage-group {
  display: flex;
  gap: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

/* 왼쪽 지문 영역 */
.passage-section {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #e5e7eb;
  padding-right: 1.5rem;
  height: 100%;
  min-width: 0; /* flexbox에서 오버플로우 방지 */
  overflow: hidden; /* 섹션 전체 오버플로우 숨김 */
}

.passage-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 600;
}

.passage-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 가로 스크롤 제거 */
  width: 100%;
  padding-right: 0.5rem; /* 스크롤바 공간 확보 */
}

.passage-text {
  line-height: 1.8;
  color: #4b5563;
  font-size: 0.9375rem;
  /* 모든 내용이 컨테이너 내에 들어가도록 설정 */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word; /* 긴 단어도 줄바꿈 */
  hyphens: auto; /* 자동 하이픈 추가 */
}

/* 지문 HTML 내부 요소 스타일 */
.passage-text :deep(*) {
  max-width: 100% !important; /* 모든 요소가 컨테이너 너비를 초과하지 않도록 */
  box-sizing: border-box;
}

.passage-text :deep(p),
.passage-text :deep(div) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.passage-text :deep(img) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 0.5rem 0;
}

.passage-text :deep(table) {
  max-width: 100% !important;
  width: 100% !important;
  overflow: hidden;
  table-layout: fixed; /* 테이블 레이아웃 고정 */
  border-collapse: collapse;
}

.passage-text :deep(table td),
.passage-text :deep(table th) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  padding: 0.25rem;
}

.passage-text :deep(pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  max-width: 100%;
  background: #f6f8fa;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem; /* 코드 블록 폰트 크기 줄임 */
}

/* 수식 처리 */
.passage-text :deep(.MathJax),
.passage-text :deep(.MathJax_Display),
.passage-text :deep(.MathJax_Preview),
.passage-text :deep(.MJXc-display),
.passage-text :deep(.math-tex),
.passage-text :deep(mjx-container) {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100% !important;
  display: block;
  margin: 0.5rem 0;
  /* 수식이 길 경우 스크롤바 표시 */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.passage-text :deep(mjx-container[display="true"]) {
  display: block !important;
  text-align: center;
  margin: 1rem 0;
}

.passage-text :deep(mjx-container:not([display="true"])) {
  display: inline-block;
  max-width: 100%;
  overflow-x: auto;
  vertical-align: middle;
}

/* iframe 처리 */
.passage-text :deep(iframe) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto;
  min-height: 200px;
}

/* 오른쪽 문항 영역 */
.passage-items {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  align-content: start;
}

/* 지문 섹션 내 문제 카드 */
.passage-items .item-card {
  min-height: 200px;
  max-height: none;
  width: 100%;
}

/* 생성 리포트 */
.generation-report {
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid #E5E7EB;
}

.report-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border-radius: 12px;
  border: 1px solid #BFDBFE;
}

.report-card h4 {
  margin: 0 0 16px 0;
  color: #1E40AF;
  font-size: 18px;
  font-weight: 700;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #DBEAFE;
}

.stat-label {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  color: #111827;
  font-weight: 700;
}

.stat-label.warning {
  color: #F59E0B;
}

.stat-value.warning {
  color: #D97706;
}

/* 문항 목록 */
.preview-items {
  flex: 1;
  overflow-y: auto;
  padding: 20px 32px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.items-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.item-count {
  padding: 6px 12px;
  background: #3B82F6;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.item-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  padding: 20px;
  transition: all 0.2s;
}

.item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.item-number {
  font-size: 14px;
  font-weight: 700;
  color: #3B82F6;
}

.item-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
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

.badge.difficulty {
  background: #F3F4F6;
  color: #374151;
}

.badge.difficulty.level-1 {
  background: #D1FAE5;
  color: #065F46;
}

.badge.difficulty.level-2 {
  background: #DBEAFE;
  color: #1E40AF;
}

.badge.difficulty.level-3 {
  background: #FEF3C7;
  color: #92400E;
}

.badge.difficulty.level-4 {
  background: #FED7AA;
  color: #C2410C;
}

.badge.difficulty.level-5 {
  background: #FEE2E2;
  color: #991B1B;
}

.badge.type {
  background: #E5E7EB;
  color: #374151;
}

.item-content {
  margin-bottom: 16px;
}

.passage {
  padding: 12px;
  background: #F9FAFB;
  border-left: 4px solid #3B82F6;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.question {
  font-size: 15px;
  line-height: 1.6;
  color: #111827;
  margin-bottom: 12px;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
}

.choice {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #374151;
}

.choice-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #F3F4F6;
  border-radius: 50%;
  font-weight: 600;
  flex-shrink: 0;
}

.item-footer {
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
}

.chapter-info {
  font-size: 12px;
  color: #9CA3AF;
}

/* MathJax 렌더링 스타일 */
.mathjax-content {
  /* MathJax 렌더링 전 깜빡임 방지 */
  min-height: 1em;
}

/* MathJax 렌더링 중 숨김 */
.mathjax-content[data-mathjax-pending="true"] {
  visibility: hidden !important;
}

/* MathJax 렌더링 완료 후 표시 */
.mathjax-content.mathjax-rendered {
  visibility: visible !important;
}

/* MathJax 요소 스타일 */
.mathjax-content mjx-container {
  display: inline-block !important;
  margin: 0.2em 0;
}

/* MathJax 표 스타일 (도수분포표 등) */
.mathjax-content mjx-container[display="true"] {
  display: block !important;
  text-align: center;
  margin: 1em 0;
}

/* MathJax 표 내부 정렬 */
.mathjax-content mjx-mtable {
  margin: 0 auto;
}

/* 선택지 내 수식 정렬 */
.choice-content mjx-container {
  vertical-align: middle;
}

/* HTML 테이블 스타일 (도수분포표 등) */
.mathjax-content table,
.passage-text table,
.item-html table {
  margin: 1em auto;
  border-collapse: collapse;
  border: 1px solid #ddd;
}

.mathjax-content th,
.mathjax-content td,
.passage-text th,
.passage-text td,
.item-html th,
.item-html td {
  padding: 8px 12px;
  border: 1px solid #ddd;
  text-align: center;
}

.mathjax-content th,
.passage-text th,
.item-html th {
  background-color: #f5f5f5;
  font-weight: 600;
}

/* 이미지 스타일 */
.mathjax-content img,
.passage-text img,
.item-html img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

/* 문제 이미지 크기 제한 */
.item-image {
  display: flex;
  justify-content: center;
  margin: 1em 0;
}

.item-image img {
  max-width: 500px;  /* 최대 너비 500px로 제한 */
  max-height: 400px; /* 최대 높이 400px로 제한 */
  width: auto;
  height: auto;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  background: #f9fafb;
}

/* 지문 영역의 문제 이미지는 더 작게 */
.passage-items .item-image img {
  max-width: 350px;
  max-height: 250px;
}
</style>