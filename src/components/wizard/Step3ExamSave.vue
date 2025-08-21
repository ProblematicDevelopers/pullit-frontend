<template>
  <div class="step3-container">
    <!-- 헤더 영역 -->
    <div class="selection-header">
      <div class="header-left">
        <button class="btn-back" @click="handleBack">← 이전</button>
        <h2>시험지 저장</h2>
      </div>
      <div class="header-info">
        <span class="exam-name">{{ examInfo?.examName || '새 시험지' }}</span>
        <span class="divider">|</span>
        <span class="grade">{{ examInfo?.gradeName }}</span>
        <span class="divider">|</span>
        <span class="subject">{{ examInfo?.subjectName }}</span>
        <span class="divider">|</span>
        <span class="item-count">{{ selectedItems.length }}문항</span>
      </div>
    </div>

    <!-- 메인 콘텐츠 영역 -->
    <div class="main-content">
      <!-- 왼쪽 패널: 시험지 정보 입력 (40%) -->
      <div class="left-panel">
        <div class="sidebar-scroll">
          <!-- 기본 정보 섹션 -->
          <div class="info-section">
            <div class="section-header">
              <h3>
                <span class="section-icon">📝</span>
                시험지 정보
              </h3>
            </div>

            <div class="form-content">
              <div class="form-group">
                <label class="form-label required">시험지 제목</label>
                <input
                  v-model="examData.title"
                  type="text"
                  class="form-input"
                  placeholder="예: 2024학년도 1학기 중간고사"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">시험 날짜</label>
                  <input
                    v-model="examData.examDate"
                    type="date"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">제한 시간</label>
                  <select v-model="examData.timeLimit" class="form-select">
                    <option :value="30">30분</option>
                    <option :value="40">40분</option>
                    <option :value="50">50분</option>
                    <option :value="60">60분</option>
                    <option :value="90">90분</option>
                    <option :value="120">120분</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">시험 안내사항</label>
                <textarea
                  v-model="examData.instructions"
                  class="form-textarea"
                  rows="3"
                  placeholder="시험 응시 시 주의사항을 입력하세요."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- 출력 설정 섹션 -->
          <div class="setting-section">
            <div class="section-header">
              <h3>
                <span class="section-icon">⚙️</span>
                출력 설정
              </h3>
            </div>

            <div class="setting-content">
              <label class="checkbox-item">
                <input
                  v-model="examData.includeAnswerSheet"
                  type="checkbox"
                  class="checkbox"
                />
                <span class="checkbox-label">정답지 포함</span>
              </label>

              <label class="checkbox-item">
                <input
                  v-model="examData.shuffleQuestions"
                  type="checkbox"
                  class="checkbox"
                />
                <span class="checkbox-label">문제 순서 섞기</span>
              </label>

              <label class="checkbox-item">
                <input
                  v-model="examData.showPoints"
                  type="checkbox"
                  class="checkbox"
                />
                <span class="checkbox-label">배점 표시</span>
              </label>

              <div class="form-group" style="margin-top: 15px;">
                <label class="form-label">페이지 레이아웃</label>
                <select v-model="examData.layoutType" class="form-select">
                  <option value="STANDARD">표준 (페이지당 4문제)</option>
                  <option value="HALF_PAGE">반페이지 (페이지당 2문제)</option>
                  <option value="SINGLE">한 페이지 한 문제</option>
                  <option value="COMPACT">압축 (페이지당 6문제)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 공개 설정 섹션 -->
          <div class="visibility-section">
            <div class="section-header">
              <h3>
                <span class="section-icon">👁️</span>
                공개 설정
              </h3>
            </div>

            <div class="visibility-content">
              <label class="radio-item">
                <input
                  v-model="examData.visibility"
                  type="radio"
                  value="PRIVATE"
                  name="visibility"
                />
                <span class="radio-label">비공개</span>
              </label>

              <label class="radio-item">
                <input
                  v-model="examData.visibility"
                  type="radio"
                  value="SCHOOL"
                  name="visibility"
                />
                <span class="radio-label">학교 공개</span>
              </label>

              <label class="radio-item">
                <input
                  v-model="examData.visibility"
                  type="radio"
                  value="PUBLIC"
                  name="visibility"
                />
                <span class="radio-label">전체 공개</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽 패널: PDF 미리보기/편집 (60%) -->
      <div class="right-panel">
        <div v-if="selectedItems.length === 0" class="empty-state">
          <div class="empty-icon">📄</div>
          <p>선택된 문항이 없습니다.</p>
          <button class="btn-secondary" @click="goBackToStep2">
            문항 선택하러 가기
          </button>
        </div>

        <SimplePdfViewer
          v-else
          :questions="transformedQuestions"
          :exam-data="pdfExamData"
          @generate="handlePdfGenerate"
          @save="handlePdfSave"
        />
      </div>
    </div>

    <!-- 하단 액션 버튼 -->
    <div class="footer-actions">
      <div class="footer-left">
        <button class="btn-secondary" @click="saveDraft" disabled>
          <span class="icon">💾</span> 임시 저장 (준비중)
        </button>
      </div>
      <div class="footer-right">
        <button
          class="btn-primary"
          @click="saveExam"
          :disabled="!canSave"
        >
          <span class="icon">✓</span> 시험지 저장
        </button>
      </div>
    </div>

    <!-- 순서 변경 모달 -->
    <div v-if="showReorderModal" class="modal-overlay" @click="closeReorderModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>문항 순서 변경</h3>
          <button class="modal-close" @click="closeReorderModal">×</button>
        </div>
        <div class="modal-body">
          <div class="reorder-list">
            <div
              v-for="(item, index) in reorderedItems"
              :key="item.itemId"
              class="reorder-item"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent
              @drop="handleDrop($event, index)"
            >
              <span class="drag-handle">≡</span>
              <span class="item-order">{{ index + 1 }}</span>
              <span class="item-info">
                문항 #{{ item.itemId }}
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeReorderModal">취소</button>
          <button class="btn-primary" @click="applyReorder">적용</button>
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { useItemSelectionStore } from '@/stores/itemSelection'
import { storeToRefs } from 'pinia'
import * as pdfGenerator from '@/services/pdfGenerator'
import SimplePdfViewer from '@/components/pdf/SimplePdfViewer.vue'

// Props
const props = defineProps({
  examInfo: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['back', 'complete'])

// Stores
const testBankStore = useTestBankStore()
const itemStore = useItemSelectionStore()
const { selectedItems } = storeToRefs(itemStore)

// State
const examData = ref({
  title: '',
  examDate: '',
  timeLimit: 60,
  instructions: '',
  includeAnswerSheet: true,
  shuffleQuestions: false,
  showPoints: true,
  visibility: 'PRIVATE',
  layoutType: 'HALF_PAGE'  // 기본값을 반페이지(2문제)로 설정
})

const showReorderModal = ref(false)
const reorderedItems = ref([])
const draggedIndex = ref(null)
const isLoading = ref(false)
const loadingMessage = ref('')

// Computed
const transformedQuestions = computed(() => {
  return selectedItems.value ? pdfGenerator.transformQuestions(selectedItems.value) : []
})

const pdfExamData = computed(() => {
  return {
    title: examData.value.title || '새 시험지',
    subtitle: props.examInfo?.examName || '',
    schoolName: '○○중학교',
    grade: props.examInfo?.gradeName || '',
    subject: props.examInfo?.subjectName || props.examInfo?.areaName || '',
    date: examData.value.examDate,
    teacherName: '',
    timeLimit: examData.value.timeLimit,
    includeAnswer: examData.value.includeAnswerSheet,
    includeExplanation: false,
    shuffleQuestions: examData.value.shuffleQuestions,
    showPoints: examData.value.showPoints
  }
})

const canSave = computed(() => {
  return examData.value.title.trim() !== '' && selectedItems.value.length > 0
})

// Methods
const getDifficultyClass = (difficulty) => {
  const code = difficulty?.code || 'M'
  switch(code) {
    case 'L': return 'easy'
    case 'M': return 'medium'
    case 'H': return 'hard'
    default: return 'medium'
  }
}

const handleBack = () => {
  if (examData.value.title || examData.value.instructions) {
    if (!confirm('작성 중인 내용이 있습니다. 이전 단계로 돌아가시겠습니까?')) {
      return
    }
  }
  emit('back')
}

const goBackToStep2 = () => {
  emit('back')
}

const saveDraft = () => {
  alert('임시 저장 기능은 준비 중입니다.')
}

const saveExam = async () => {
  if (!canSave.value) {
    alert('시험지 제목을 입력해주세요.')
    return
  }

  // 시험지 데이터를 저장
  console.log('시험지 저장:', {
    examData: examData.value,
    questions: selectedItems.value
  })

  alert('시험지가 저장되었습니다.')
  emit('complete')
}


const reorderItems = () => {
  reorderedItems.value = [...selectedItems.value]
  showReorderModal.value = true
}

const closeReorderModal = () => {
  showReorderModal.value = false
}

const handleDragStart = (event, index) => {
  draggedIndex.value = index
}

const handleDrop = (event, dropIndex) => {
  if (draggedIndex.value === null) return

  const draggedItem = reorderedItems.value[draggedIndex.value]
  reorderedItems.value.splice(draggedIndex.value, 1)
  reorderedItems.value.splice(dropIndex, 0, draggedItem)

  draggedIndex.value = null
}

const applyReorder = () => {
  itemStore.selectedItems = [...reorderedItems.value]
  closeReorderModal()
}

// PDF 관련 핸들러
const handlePdfSave = (template) => {
  console.log('PDF 템플릿 저장됨:', template)
  // 템플릿을 localStorage나 서버에 저장할 수 있습니다
}

const handlePdfGenerate = (pdfBlob) => {
  console.log('PDF 생성 완료:', pdfBlob)
  // PDF가 생성되면 추가 처리를 할 수 있습니다
}

// Lifecycle
onMounted(() => {
  const today = new Date().toISOString().split('T')[0]
  examData.value.examDate = today

  if (testBankStore.wizardData.examTitle) {
    examData.value.title = testBankStore.wizardData.examTitle
  }
})
</script>

<style scoped>
/* 전체 컨테이너 */
.step3-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
}

/* 헤더 영역 */
.selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e1e4e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e5e7eb;
  transform: translateX(-2px);
}

.selection-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-info .divider {
  color: #d1d5db;
}

.header-info .exam-name {
  font-weight: 500;
  color: #4b5563;
}

/* 메인 콘텐츠 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 왼쪽 패널 */
.left-panel {
  width: 40%;
  background: white;
  border-right: 1px solid #e1e4e8;
  display: flex;
  flex-direction: column;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* 섹션 스타일 */
.info-section,
.setting-section,
.visibility-section {
  margin-bottom: 2rem;
}

.section-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.section-icon {
  font-size: 1.25rem;
}

/* 폼 스타일 */
.form-content {
  padding: 0.5rem 0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

/* 체크박스 & 라디오 */
.setting-content,
.visibility-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-item,
.radio-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.checkbox-item:hover,
.radio-item:hover {
  background-color: #f9fafb;
}

.checkbox,
input[type="radio"] {
  cursor: pointer;
}

.checkbox-label,
.radio-label {
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
}

/* 오른쪽 패널 */
.right-panel {
  flex: 1;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e1e4e8;
}

.preview-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action .icon {
  font-size: 1rem;
}

/* 미리보기 콘텐츠 */
.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

/* 문항 리스트 */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
}

.item-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.item-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-easy {
  background: #d1fae5;
  color: #065f46;
}

.badge-medium {
  background: #fed7aa;
  color: #92400e;
}

.badge-hard {
  background: #fee2e2;
  color: #991b1b;
}

.badge-type {
  background: #e0e7ff;
  color: #3730a3;
}

.badge-points {
  background: #fef3c7;
  color: #92400e;
}

.item-content {
  padding-left: 2.5rem;
}

.item-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.item-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.item-placeholder {
  color: #9ca3af;
  font-style: italic;
}

/* 더보기 버튼 */
.show-more {
  text-align: center;
  padding: 1rem;
}

/* 요약 정보 */
.preview-summary {
  display: flex;
  justify-content: space-around;
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e1e4e8;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-item .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* 하단 액션 */
.footer-actions {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e1e4e8;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.footer-left,
.footer-right {
  display: flex;
  gap: 0.75rem;
}

/* 버튼 스타일 */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 모달 */
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

/* 순서 변경 리스트 */
.reorder-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reorder-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s;
}

.reorder-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.drag-handle {
  color: #9ca3af;
  font-size: 1.125rem;
  cursor: grab;
}

.item-order {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-info {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
}

/* 로딩 오버레이 */
.loading-overlay {
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
}

.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* 스피너 */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 반응형 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e1e4e8;
  }
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .preview-actions {
    flex-direction: column;
  }

  .preview-summary {
    flex-direction: column;
    gap: 0.5rem;
  }
}


/* 액션 버튼 스타일 */
.btn-action {
  padding: 0.5rem 1rem;
  background: white;
  color: #4CAF50;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #4CAF50;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}
</style>
