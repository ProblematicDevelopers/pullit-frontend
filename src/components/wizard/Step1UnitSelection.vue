<!--
  시험지 마법사 Step 1: 모드 선택 및 시험지 설정

  이 컴포넌트는 시험지 생성 마법사의 첫 번째 단계를 담당합니다.
  주요 기능:
  - 모드 선택: 새로 만들기 vs 기존 수정
  - 학년/과목 선택
  - 기존 시험지 선택
  - 시험지 기본 정보 설정
-->

<template>
  <div class="step1-container">
    <!-- 학년/과목 선택 화면 -->
    <div class="selection-container">
      <div class="selection-header">
        <button class="btn-back" @click="handleCancel">← 이전</button>
        <h2>학년 및 과목 선택</h2>
        <p class="header-desc">시험지를 만들 학년과 과목을 선택해주세요</p>
      </div>

      <div class="selection-content">
        <!-- 학년 선택 섹션 -->
        <div class="section-card">
          <div class="section-title">
            <div class="title-icon grade-title-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/>
              </svg>
            </div>
            <h3>학년 선택</h3>
          </div>
          <div class="grade-grid">
            <div
              v-for="grade in grades"
              :key="grade.code"
              :class="['grade-card', { 'selected': examInfo.gradeCode === grade.code }]"
              @click="selectGrade(grade)"
            >
              <div class="grade-number">
                <span v-if="examInfo.gradeCode === grade.code" class="check-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span v-else class="grade-num">{{ grade.grade }}</span>
              </div>
              <div class="grade-name">{{ grade.name }}</div>
              <div class="grade-desc">{{ grade.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 과목 선택 섹션 -->
        <div class="section-card">
          <div class="section-title">
            <div class="title-icon subject-title-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <h3>과목 선택</h3>
          </div>
          <div class="subject-grid">
            <div
              v-for="subject in subjects"
              :key="subject.id"
              :class="['subject-card', { 'selected': examInfo.areaCode === subject.id }]"
              @click="selectSubject(subject)"
              :style="{ '--subject-color': subject.color }"
            >
              <div class="subject-icon-wrapper">
                <div class="subject-icon" :style="{ backgroundColor: examInfo.areaCode === subject.id ? subject.color : '#F3F4F6' }">
                  <span v-if="examInfo.areaCode === subject.id" class="check-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span v-else>{{ subject.name.charAt(0) }}</span>
                </div>
              </div>
              <div class="subject-name">{{ subject.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 액션 버튼들 -->
      <div class="footer-actions">
        <div class="footer-left">
          <button
            class="btn btn-secondary"
            @click="handleCancel"
          >
            취소
          </button>
        </div>
        <div class="footer-center">
          <span class="selection-status">
            <span v-if="examInfo.gradeCode && examInfo.areaCode" class="status-complete">
              {{ examInfo.gradeName }} {{ examInfo.areaName }} 선택됨
            </span>
            <span v-else class="status-incomplete">
              학년과 과목을 선택해주세요
            </span>
          </span>
        </div>
        <div class="footer-right">
          <button
            class="btn btn-primary"
            :disabled="!canProceedToItemSelection"
            @click="proceedToItemSelection"
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, ref, computed } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { storeToRefs } from 'pinia'
import { closePopup, sendToParent } from '@/utils/popup'
import axios from 'axios'

// Events 정의
const emit = defineEmits([
  'next',      // 다음 단계로 진행
  'cancel',    // 취소
])

// Pinia store 사용
const store = useTestBankStore()

// Props 정의
const props = defineProps({
  mode: {
    type: String,
    default: 'new', // 'new' or 'edit'
  },
  examId: {
    type: Number,
    default: null
  }
})

// 로컬 상태
const isLoading = ref(false)
const mode = computed(() => props.mode)

// 시험지 정보 (간소화 - 학년과 과목만)
const examInfo = ref({
  gradeCode: null,
  gradeName: '',
  subjectId: null,
  subjectName: ''
})

// 학년 옵션
const grades = ref([
  { code: '07', name: '중학교 1학년', grade: '1', desc: '중등 1학년 과정' },
  { code: '08', name: '중학교 2학년', grade: '2', desc: '중등 2학년 과정' },
  { code: '09', name: '중학교 3학년', grade: '3', desc: '중등 3학년 과정' }
])

// 과목 옵션 (고정값) - 백엔드 areaCode와 매칭
const subjects = ref([
  { id: 'MA', name: '수학', color: '#3B82F6' },
  { id: 'KO', name: '국어', color: '#10B981' },
  { id: 'EN', name: '영어', color: '#F59E0B' },
  { id: 'SC', name: '과학', color: '#8B5CF6' },
  { id: 'SO', name: '사회', color: '#EF4444' }
])

// 학기 옵션
const terms = ref([
  { code: '01', name: '1학기' },
  { code: '02', name: '2학기' }
])


// ===== Computed Properties =====

/**
 * 문제 선택 단계로 진행 가능 여부
 */
const canProceedToItemSelection = computed(() => {
  return examInfo.value.gradeCode && examInfo.value.areaCode
})

// ===== 메서드 =====

/**
 * 학년 선택
 */
const selectGrade = (grade) => {
  examInfo.value.gradeCode = grade.code
  examInfo.value.gradeName = grade.name
  console.log('학년 선택:', examInfo.value)
}

/**
 * 과목 선택
 */
const selectSubject = (subject) => {
  // subject.id는 areaCode (MA, KO 등)이고
  // 실제 subjectId는 Step2에서 교과서 선택시 결정됨
  examInfo.value.areaCode = subject.id // MA, KO, EN, SC, SO
  examInfo.value.areaName = subject.name // 수학, 국어, 영어, 과학, 사회
  examInfo.value.subjectArea = subject.name // 과목 영역 추가 (수학, 국어 등)
  examInfo.value.subject = subject.name // 호환성을 위해 subject 필드도 추가
  console.log('과목 선택:', examInfo.value)
  console.log('진행 가능:', canProceedToItemSelection.value)
}

/**
 * 날짜 포맷팅
 */
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

/**
 * 취소 버튼 핸들러
 */
const handleCancel = () => {
  const confirmCancel = confirm('시험지 작성을 취소하시겠습니까? 입력한 내용이 삭제됩니다.')

  if (confirmCancel) {
    // 팝업인 경우 닫기
    closePopup({ action: 'cancelled' })

    // 일반 모달인 경우 부모에 취소 이벤트 전달
    emit('cancel')
  }
}

/**
 * 문제 선택 단계로 진행
 */
const proceedToItemSelection = () => {
  // Store에 시험지 정보 저장
  store.setExamInfo(examInfo.value)

  // 다음 단계로 진행
  emit('next')
  sendToParent('PROCEED_TO_ITEM_SELECTION', examInfo.value)
}

// ===== API 연동 함수들 =====


/**
 * 사용자의 기존 시험지 목록 로드
 */
const loadUserExams = async () => {
  try {
    isLoading.value = true
    const params = {
      page: 0,
      size: 20,
      keyword: examSearchKeyword.value
    }

    const response = await axios.get('/api/user-exams/my', { params })
    userExams.value = response.data.content || []
  } catch (error) {
    console.error('시험지 목록 로드 실패:', error)
    userExams.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * 시험지 검색
 */
const searchUserExams = debounce(() => {
  loadUserExams()
}, 300)

/**
 * 기존 시험지의 문제 목록 로드
 */
const loadExamItems = async (examId) => {
  try {
    const response = await axios.get(`/api/user-exams/${examId}/items`)
    // 문제 목록을 store에 저장
    store.setExamItems(response.data.data || [])
  } catch (error) {
    console.error('시험지 문제 로드 실패:', error)
  }
}

/**
 * 디바운스 유틸리티
 */
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Lifecycle - 컴포넌트 마운트 시 초기화
onMounted(async () => {
  console.log('Step1 컴포넌트 마운트됨', { mode: props.mode, examId: props.examId })

  if (props.mode === 'edit' && props.examId) {
    // 수정 모드: 기존 시험지 정보 로드
    await loadExamData(props.examId)
  }
  // 새로 만들기 모드는 과목이 이미 정의되어 있음
})

// 기존 시험지 데이터 로드
const loadExamData = async (examId) => {
  try {
    const response = await axios.get(`/api/user-exams/${examId}`)
    const exam = response.data.data

    examInfo.value = {
      examName: exam.examName,
      gradeCode: exam.gradeCode,
      gradeName: exam.gradeName,
      subjectId: exam.subjectId,
      subjectName: exam.subjectName || '',
      examType: exam.examType || '단원평가',
      visibility: exam.visibility || 'PRIVATE',
      description: exam.description || ''
    }

    // 문제 목록도 로드
    await loadExamItems(examId)
  } catch (error) {
    console.error('시험지 정보 로드 실패:', error)
  }
}
</script>

<style scoped>
.step1-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8faff 0%, #f3f7ff 100%);
}

/* 선택 컨테이너 */
.selection-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 헤더 */
.selection-header {
  padding: 2rem 2.5rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.selection-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0.5rem 0;
}

.header-desc {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.9375rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.btn-back:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

/* 컨텐츠 영역 */
.selection-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 섹션 카드 */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.title-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f5f9;
}

.grade-title-icon {
  color: #3b82f6;
}

.subject-title-icon {
  color: #10b981;
}

.section-title h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

/* 학년 그리드 */
.grade-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.grade-card {
  position: relative;
  padding: 1.5rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.grade-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.grade-card.selected {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  border-width: 2px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
  transform: scale(1.02);
}

.grade-number {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.grade-card.selected .grade-number {
  background: #3b82f6;
  border-color: #3b82f6;
}

.grade-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: #64748b;
}

.grade-card.selected .grade-num {
  color: white;
}

.check-icon {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.grade-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.grade-desc {
  font-size: 0.8125rem;
  color: #64748b;
}

/* 과목 그리드 */
.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.subject-card {
  padding: 1.25rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.subject-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.subject-card.selected {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  border-width: 2px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
  transform: scale(1.02);
}

.subject-icon-wrapper {
  margin-bottom: 0.75rem;
}

.subject-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.subject-icon span {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
}

.subject-card.selected .subject-icon span {
  color: white;
}

.subject-icon .check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.subject-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1a202c;
}

/* 모드 선택 화면 */
.mode-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.mode-header {
  text-align: center;
  margin-bottom: 3rem;
}

.mode-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin-bottom: 0.5rem;
}

.mode-header p {
  font-size: 1.125rem;
  color: var(--text-secondary, #6b7280);
}

.mode-options {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.mode-card {
  background: white;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 2.5rem;
  width: 280px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 0.1));
}

.mode-card:hover {
  border-color: var(--primary, #3b82f6);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
  transform: translateY(-4px);
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.mode-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin-bottom: 0.5rem;
}

.mode-card p {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

/* 학년/과목 선택 화면 */
.grade-subject-selection,
.exam-list-selection {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
}

.selection-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e1e4e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.selection-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #586069;
  cursor: pointer;
  font-size: 0.9375rem;
  padding: 0.5rem 0.75rem;
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

.selection-content {
  flex: 1;
  padding: 2.5rem;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.selection-group {
  background: white;
  border-radius: 12px;
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.selection-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #586069;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 1rem;
}

.selection-group label::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #3b82f6;
  border-radius: 2px;
}

.grade-options,
.subject-options,
.term-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.grade-btn,
.subject-btn,
.term-btn {
  padding: 1rem;
  border: 2px solid #e1e4e8;
  background: white;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #24292e;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.grade-btn::before,
.subject-btn::before,
.term-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.grade-btn:hover,
.subject-btn:hover,
.term-btn:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.grade-btn.active,
.subject-btn.active,
.term-btn.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

/* 과목 버튼에 아이콘 추가 */
.subject-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
}

.subject-btn::after {
  content: '';
  width: 32px;
  height: 32px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin-bottom: 0.25rem;
}

/* 과목별 아이콘 */
.subject-btn:nth-child(1)::after { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23586069'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'%3E%3C/path%3E%3C/svg%3E"); }
.subject-btn:nth-child(2)::after { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23586069'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'%3E%3C/path%3E%3C/svg%3E"); }
.subject-btn:nth-child(3)::after { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23586069'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9'%3E%3C/path%3E%3C/svg%3E"); }
.subject-btn:nth-child(4)::after { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23586069'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'%3E%3C/path%3E%3C/svg%3E"); }

.subject-btn.active::after {
  filter: brightness(0) invert(1);
}

.selection-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: flex-end;
}

/* 시험지 목록 화면 */
.exam-list {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.exam-filters {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.exam-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: white;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exam-item:hover {
  border-color: var(--primary, #3b82f6);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
}

.exam-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin-bottom: 0.5rem;
}

.exam-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

.exam-meta span {
  display: inline-flex;
  align-items: center;
}

.exam-meta span::after {
  content: '•';
  margin-left: 1rem;
  color: var(--border-color, #e5e7eb);
}

.exam-meta span:last-child::after {
  display: none;
}

/* 시험지 설정 화면 */
.exam-setup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.exam-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.exam-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #24292e;
  margin: 0;
}

/* 시험지 설정 폼 */
.exam-form {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  gap: 2rem;
}

.form-section {
  flex: 1;
  min-width: 300px;
}

.form-section h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

/* 하단 액션 버튼 */
.footer-actions {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.footer-left {
  display: flex;
  justify-content: flex-start;
}

.footer-center {
  display: flex;
  justify-content: center;
}

.footer-right {
  display: flex;
  justify-content: flex-end;
}

.selection-status {
  font-size: 0.9375rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: #f1f5f9;
}

.status-complete {
  color: #059669;
  font-weight: 600;
}

.status-incomplete {
  color: #64748b;
}

/* 선택 버튼 그룹 */
.select-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.select-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e1e4e8;
  background: white;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #24292e;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-btn:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.select-btn.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

/* 버튼 기본 스타일 */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-primary {
  background: var(--primary, #3b82f6);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark, #2563eb);
}

.btn-primary:disabled {
  background: var(--gray-300, #d1d5db);
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--gray-200, #e5e7eb);
  color: var(--text-primary, #111827);
}

.btn-secondary:hover {
  background: var(--gray-300, #d1d5db);
}

/* 반응형 */
@media (max-width: 768px) {
  .mode-options {
    flex-direction: column;
    align-items: center;
  }

  .exam-form {
    flex-direction: column;
  }

  .footer-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .footer-actions .btn {
    width: 100%;
  }
}
</style>
