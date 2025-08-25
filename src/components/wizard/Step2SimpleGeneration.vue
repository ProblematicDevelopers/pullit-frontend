<!--
  Step2: 간편 생성 설정
  
  이 컴포넌트는 간편 생성 모드에서 시험지 생성 옵션을 설정하는 화면입니다.
  학년, 과목, 문항 수, 난이도 등을 설정할 수 있습니다.
-->

<template>
  <div class="step2-simple-generation">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import itemApiService from '@/services/itemApi'
import chapterApi from '@/services/chapterApi'
import ChapterTreeSelector from './ChapterTreeSelector.vue'

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

// Methods
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

const handleGenerate = async () => {
  if (!canGenerate.value || isGenerating.value) return
  
  try {
    isGenerating.value = true
    
    // 난이도 매핑
    const difficultyMap = {
      easy: [1, 2],
      normal: [2, 3, 4],
      hard: [4, 5],
      mixed: [1, 2, 3, 4, 5]
    }
    
    // 랜덤 문항 검색 파라미터
    const searchParams = {
      subjects: [settings.value.subject],
      grades: [settings.value.grade],
      difficulties: difficultyMap[settings.value.difficulty] || [1, 2, 3, 4, 5],
      categories: settings.value.questionTypes.length > 0 ? settings.value.questionTypes : undefined,
      chapterIds: settings.value.chapters.length > 0 ? settings.value.chapters : undefined,
      size: settings.value.itemCount,
      random: true
    }
    
    const result = await itemApiService.searchItems(searchParams)
    
    if (result.success && result.data && result.data.length > 0) {
      // 생성된 문항과 설정 정보를 다음 단계로 전달
      const generatedData = {
        ...settings.value,
        selectedItems: result.data
      }
      
      emit('next', generatedData)
    } else {
      alert('조건에 맞는 문항을 찾을 수 없습니다. 다른 조건으로 시도해주세요.')
    }
  } catch (error) {
    console.error('문항 생성 오류:', error)
    alert('문항 생성 중 오류가 발생했습니다.')
  } finally {
    isGenerating.value = false
  }
}

// Lifecycle
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
</style>