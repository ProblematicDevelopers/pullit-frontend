<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">내 시험지 관리</h2>
        <button @click="close" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="action-section">
        <button @click="createNewExam" class="create-exam-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          새 시험지 만들기
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="search-section">
        <div class="search-input-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="search-icon">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="시험지 검색..." 
            class="search-input"
            @input="handleSearch"
          />
        </div>
        <select v-model="selectedGrade" @change="handleFilter" class="filter-select">
          <option value="">전체 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
          <option value="4">4학년</option>
          <option value="5">5학년</option>
          <option value="6">6학년</option>
        </select>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>시험지를 불러오는 중...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!exams.length" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3>아직 생성한 시험지가 없습니다</h3>
          <p>새로운 시험지를 만들어보세요!</p>
        </div>

        <!-- Exam List -->
        <div v-else class="exam-grid">
          <div 
            v-for="exam in paginatedExams" 
            :key="exam.id" 
            class="exam-card"
            @click="selectExam(exam)"
          >
            <div class="exam-card-header">
              <h3 class="exam-title">{{ exam.examName }}</h3>
              <span class="exam-status" :class="`status-${exam.status || 'active'}`">
                {{ getStatusText(exam.status) }}
              </span>
            </div>
            
            <div class="exam-info">
              <div class="info-item">
                <svg viewBox="0 0 24 24" fill="currentColor" class="info-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>{{ exam.itemCount || exam.totalItems }}문항</span>
              </div>
              <div class="info-item">
                <svg viewBox="0 0 24 24" fill="currentColor" class="info-icon">
                  <path d="M12 2L1 9L12 15L21 9.18V17H23V9L12 2M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
                </svg>
                <span>{{ exam.gradeName }}</span>
              </div>
              <div class="info-item">
                <svg viewBox="0 0 24 24" fill="currentColor" class="info-icon">
                  <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19Z"/>
                </svg>
                <span>{{ formatDate(exam.createdDate) }}</span>
              </div>
            </div>

            <div class="exam-actions">
              <button @click.stop="assignExam(exam)" class="action-btn assign-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M12 3C12.55 3 13 3.45 13 4S12.55 5 12 5 11 4.55 11 4 11.45 3 12 3M7 7H17V5H19V19H5V5H7V7M12 17L7 12L8.41 10.59L12 14.17L15.59 10.59L17 12L12 17Z"/>
                </svg>
                출제하기
              </button>
              <button @click.stop="deleteExam(exam)" class="action-btn delete-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19M8 9H16V19H8V9M15.5 4L14.5 3H9.5L8.5 4H5V6H19V4H15.5Z"/>
                </svg>
                삭제
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            이전
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import examApi from '@/services/examApi'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'exam-selected', 'assign-exam'])

const router = useRouter()
const { showToast } = useToast()

// State
const loading = ref(false)
const exams = ref([])
const searchQuery = ref('')
const selectedGrade = ref('')
const currentPage = ref(1)
const itemsPerPage = 6

// Computed
const filteredExams = computed(() => {
  let filtered = exams.value

  // 검색어 필터
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(exam => 
      exam.examName.toLowerCase().includes(query) ||
      exam.gradeName.toLowerCase().includes(query)
    )
  }

  // 학년 필터
  if (selectedGrade.value) {
    filtered = filtered.filter(exam => 
      exam.gradeName.includes(selectedGrade.value)
    )
  }

  return filtered
})

const totalPages = computed(() => 
  Math.ceil(filteredExams.value.length / itemsPerPage)
)

const paginatedExams = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredExams.value.slice(start, end)
})

// Methods
const loadMyExams = async () => {
  loading.value = true
  try {
    const response = await examApi.getMyExams()
    console.log('API 전체 응답:', response)
    console.log('response.data:', response.data)
    
    // axios 응답은 response.data에 실제 데이터가 있음
    if (response.data) {
      // Spring Boot Page 객체 구조
      if (response.data.content !== undefined) {
        exams.value = response.data.content
        console.log('Page content:', response.data.content)
      } 
      // ApiResponse 구조 (success, data 필드가 있는 경우)
      else if (response.data.success && response.data.data) {
        if (response.data.data.content !== undefined) {
          exams.value = response.data.data.content
        } else if (Array.isArray(response.data.data)) {
          exams.value = response.data.data
        } else {
          exams.value = []
        }
      }
      // 직접 배열인 경우
      else if (Array.isArray(response.data)) {
        exams.value = response.data
      } 
      else {
        console.warn('알 수 없는 응답 구조:', response.data)
        exams.value = []
      }
    } else {
      exams.value = []
    }
    
    console.log('최종 exams:', exams.value)
  } catch (error) {
    console.error('시험지 목록 로드 실패:', error)
    console.error('에러 상세:', error.response)
    showToast('시험지 목록을 불러오는데 실패했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

const createNewExam = () => {
  // 팝업 창 크기 및 위치 설정
  const width = 1200
  const height = 800
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
  
  // 팝업으로 시험지 마법사 열기
  window.open('/exam/wizard', 'TestWizardPopup', features)
  close()
}

const selectExam = (exam) => {
  emit('exam-selected', exam)
  // 시험지 상세 페이지로 이동하거나 다른 동작 수행
  router.push(`/exam/${exam.id}`)
  close()
}

const editExam = (exam) => {
  // 팝업 창 크기 및 위치 설정
  const width = 1200
  const height = 800
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
  
  // 팝업으로 시험지 수정 마법사 열기
  window.open(`/exam/wizard?id=${exam.id}`, 'TestWizardPopup', features)
  close()
}

const assignExam = (exam) => {
  // 출제를 위한 이벤트 발생
  emit('assign-exam', exam)
  close()
}

const deleteExam = async (exam) => {
  if (!confirm(`"${exam.examName}" 시험지를 삭제하시겠습니까?`)) {
    return
  }
  
  try {
    await examApi.deleteExam(exam.id)
    showToast('시험지가 삭제되었습니다.', 'success')
    await loadMyExams()
  } catch (error) {
    console.error('시험지 삭제 실패:', error)
    showToast('시험지 삭제에 실패했습니다.', 'error')
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const getStatusText = (status) => {
  const statusMap = {
    'active': '활성',
    'draft': '임시저장',
    'completed': '완료',
    'archived': '보관됨'
  }
  return statusMap[status] || '활성'
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const close = () => {
  emit('close')
}

const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    close()
  }
}

// Watch for modal open
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadMyExams()
  }
})

// Lifecycle
onMounted(() => {
  if (props.isOpen) {
    loadMyExams()
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
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.action-section {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.create-exam-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-exam-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.search-section {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: #f9fafb;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modal-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  margin-top: 16px;
  color: #6b7280;
  font-size: 0.95rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #d1d5db;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.empty-state p {
  color: #6b7280;
  font-size: 0.95rem;
}

.exam-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.exam-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.exam-card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.exam-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.exam-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  margin-right: 12px;
}

.exam-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-active {
  background: #dcfce7;
  color: #16a34a;
}

.status-draft {
  background: #fef3c7;
  color: #d97706;
}

.status-completed {
  background: #dbeafe;
  color: #2563eb;
}

.status-archived {
  background: #f3f4f6;
  color: #6b7280;
}

.exam-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 0.9rem;
}

.info-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.exam-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.assign-btn:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #2563eb;
}

.delete-btn:hover {
  background: #fef2f2;
  border-color: #dc2626;
  color: #dc2626;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #2563eb;
  color: #2563eb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }
  
  .exam-grid {
    grid-template-columns: 1fr;
  }
  
  .search-section {
    flex-direction: column;
  }
  
  .exam-actions {
    flex-direction: column;
  }
}
</style>