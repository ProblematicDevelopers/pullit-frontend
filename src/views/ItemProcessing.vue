<template>
  <div class="item-processing-container">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">문제 등록</h1>
        <p class="page-subtitle">교과서를 선택하고 PDF를 업로드하여 문제를 가공하세요</p>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="main-content">
      <div class="content-wrapper">
        <!-- 교과서 선택 섹션 -->
        <div v-if="!selectedTextbook" class="textbook-selection-section">
          <h2 class="section-title">1. 교과서 선택</h2>
          <p class="section-description">문제를 추가할 교과서를 선택하세요</p>

          <!-- 로딩 상태 -->
          <div v-if="loading" class="loading-section">
            <div class="loading-spinner"></div>
            <p>교과서 목록을 불러오는 중...</p>
          </div>

          <!-- 교과서 선택 영역 -->
          <div v-else class="textbook-selection-area">
            <!-- 왼쪽: 과목별 필터 -->
            <div class="subject-filter">
              <h3 class="filter-title">과목 선택</h3>
              <div class="filter-list">
                <button
                  v-for="(subject, areaCode) in subjects"
                  :key="areaCode"
                  class="filter-item"
                  :class="{ active: selectedSubject === areaCode }"
                  @click="selectSubject(areaCode)"
                >
                  <div class="subject-badge" :style="{ backgroundColor: subject.color }">
                    {{ areaCode }}
                  </div>
                  <span class="subject-name">{{ subject.name }}</span>
                  <span class="subject-count">{{ getSubjectCount(areaCode) }}</span>
                </button>
              </div>
            </div>

            <!-- 오른쪽: 교과서 목록 -->
            <div class="textbook-list">
              <div v-if="selectedSubject && filteredTextbooks.length > 0" class="textbook-grid">
                <div
                  v-for="textbook in filteredTextbooks"
                  :key="textbook.subjectId"
                  class="textbook-card"
                  @click="selectTextbook(textbook)"
                >
                  <!-- 썸네일 -->
                  <div class="textbook-thumbnail">
                    <img
                      v-if="textbook.subjectThumbnail"
                      :src="textbook.subjectThumbnail"
                      :alt="`${textbook.subjectName} 썸네일`"
                      class="thumbnail-image"
                    />
                    <div v-else class="no-thumbnail">
                      <svg viewBox="0 0 24 24" class="icon">
                        <path
                          d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"
                        />
                      </svg>
                    </div>
                  </div>

                  <!-- 교과서 정보 -->
                  <div class="textbook-content">
                    <h4 class="textbook-title">{{ textbook.subjectName }}</h4>
                    <div class="textbook-badges">
                      <span v-if="textbook.schoolLevelName" class="badge">{{
                        textbook.schoolLevelName
                      }}</span>
                      <span v-if="textbook.gradeName" class="badge">{{ textbook.gradeName }}</span>
                      <span
                        v-if="textbook.termName && textbook.termName !== '0학기'"
                        class="badge"
                        >{{ textbook.termName }}</span
                      >
                    </div>
                    <p v-if="textbook.curriculumName" class="textbook-curriculum">
                      {{ textbook.curriculumName }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 선택된 과목이 없을 때 -->
              <div v-else-if="!selectedSubject" class="select-subject-prompt">
                <div class="prompt-icon">📚</div>
                <h3>과목을 선택해주세요</h3>
                <p>왼쪽에서 과목을 선택하면 해당 과목의 교과서가 표시됩니다.</p>
              </div>

              <!-- 선택된 과목에 교과서가 없을 때 -->
              <div v-else class="no-textbooks">
                <div class="no-textbooks-icon">📖</div>
                <h3>해당 과목에 교과서가 없습니다</h3>
                <p>다른 과목을 선택해보세요.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- PDF 업로드 섹션 -->
        <div v-else-if="!pdfFile" class="pdf-upload-section">
          <h2 class="section-title">2. PDF 업로드</h2>
          <p class="section-description">선택된 교과서: {{ selectedTextbook?.subjectName }}</p>

          <div
            class="upload-area"
            @click="triggerFileInput"
            @drop="handleFileDrop"
            @dragover.prevent
          >
            <div class="upload-icon">
              <svg viewBox="0 0 24 24" class="icon">
                <path
                  d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M18 12V16H16V12H15L12 15L9 12H8V16H6V12H7L12 7L17 12H18Z"
                />
              </svg>
            </div>
            <p class="upload-text">PDF 파일을 클릭하거나 드래그하여 업로드하세요</p>
            <p class="upload-hint">지원 형식: PDF</p>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept=".pdf"
            @change="handleFileSelect"
            style="display: none"
          />

          <div class="navigation-buttons">
            <button @click="goBack" class="btn btn-secondary">뒤로가기</button>
          </div>
        </div>

        <!-- PDF 편집 섹션 -->
        <div v-else class="pdf-edit-section">
          <h2 class="section-title">3. PDF 페이지 편집</h2>
          <p class="section-description">
            PDF 페이지의 순서를 조정하거나 불필요한 페이지를 삭제하세요
          </p>

          <div class="pdf-pages">
            <div v-for="(page, index) in pdfPages" :key="index" class="page-item">
              <div class="page-number">{{ index + 1 }}</div>
              <div class="page-preview">
                <img :src="page.preview" :alt="`페이지 ${index + 1}`" />
              </div>
              <div class="page-actions">
                <button
                  @click="movePage(index, index - 1)"
                  :disabled="index === 0"
                  class="btn btn-small"
                >
                  ↑
                </button>
                <button
                  @click="movePage(index, index + 1)"
                  :disabled="index === pdfPages.length - 1"
                  class="btn btn-small"
                >
                  ↓
                </button>
                <button @click="removePage(index)" class="btn btn-small btn-danger">삭제</button>
              </div>
            </div>
          </div>

          <div class="navigation-buttons">
            <button @click="goBack" class="btn btn-secondary">뒤로가기</button>
            <button @click="nextStep" class="btn btn-primary">다음</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useItemProcessingStore } from '@/store/itemProcessingStore'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ItemProcessing',
  setup() {
    const itemProcessingStore = useItemProcessingStore()
    const router = useRouter()
    const fileInput = ref(null)

    const selectedTextbook = ref(null)
    const pdfFile = ref(null)
    const pdfPages = ref([])
    const selectedSubject = ref(null)

    // store에서 데이터 가져오기
    const loading = computed(() => itemProcessingStore.loading)
    const error = computed(() => itemProcessingStore.error)
    const textbooks = computed(() => itemProcessingStore.textbooks)
    const groupedTextbooks = computed(() => itemProcessingStore.groupedTextbooks)
    const subjects = computed(() => itemProcessingStore.subjects)

    // 선택된 과목의 교과서만 필터링
    const filteredTextbooks = computed(() => {
      if (!selectedSubject.value) return []
      return groupedTextbooks.value[selectedSubject.value] || []
    })

    // 컴포넌트 마운트 시 교과서 목록 로드
    onMounted(() => {
      console.log('컴포넌트 마운트됨')
      itemProcessingStore.fetchTextbooks()
    })

    // 과목 선택
    const selectSubject = (areaCode) => {
      selectedSubject.value = areaCode
    }

    // 과목별 교과서 개수
    const getSubjectCount = (areaCode) => {
      return groupedTextbooks.value[areaCode]?.length || 0
    }

    // 교과서 선택
    const selectTextbook = (textbook) => {
      selectedTextbook.value = textbook
      itemProcessingStore.selectTextbook(textbook)
    }

    // 파일 입력 트리거
    const triggerFileInput = () => {
      fileInput.value.click()
    }

    // 파일 선택 처리
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && file.type === 'application/pdf') {
        handlePdfFile(file)
      }
    }

    // 파일 드롭 처리
    const handleFileDrop = (event) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file && file.type === 'application/pdf') {
        handlePdfFile(file)
      }
    }

    // PDF 파일 처리
    const handlePdfFile = (file) => {
      pdfFile.value = file
      itemProcessingStore.setPdfFile(file)

      // 임시로 페이지 데이터 생성 (실제로는 PDF 파싱 필요)
      pdfPages.value = Array.from({ length: 5 }, (_, i) => ({
        preview: `data:image/svg+xml;base64,${btoa(`<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="300" fill="#f0f0f0"/><text x="100" y="150" text-anchor="middle" fill="#666">페이지 ${i + 1}</text></svg>`)}`,
      }))
    }

    // 페이지 이동
    const movePage = (fromIndex, toIndex) => {
      itemProcessingStore.movePage(fromIndex, toIndex)
      // 로컬 상태도 업데이트
      const page = pdfPages.value.splice(fromIndex, 1)[0]
      pdfPages.value.splice(toIndex, 0, page)
    }

    // 페이지 삭제
    const removePage = (pageIndex) => {
      itemProcessingStore.removePage(pageIndex)
      pdfPages.value.splice(pageIndex, 1)
    }

    // 뒤로가기
    const goBack = () => {
      if (pdfFile.value) {
        // PDF 편집에서 뒤로가기
        pdfFile.value = null
        pdfPages.value = []
        itemProcessingStore.setPdfFile(null)
      } else if (selectedTextbook.value) {
        // 교과서 선택에서 뒤로가기
        selectedTextbook.value = null
        itemProcessingStore.selectTextbook(null)
      }
    }

    // 다음 단계
    const nextStep = () => {
      // PDF 편집 완료 후 다음 단계로 이동
      router.push('/item-processing/area-selection')
    }

    // 교과서 목록 다시 로드
    const fetchTextbooks = () => {
      itemProcessingStore.fetchTextbooks()
    }

    return {
      loading,
      error,
      textbooks,
      groupedTextbooks,
      subjects,
      selectedSubject,
      filteredTextbooks,
      selectedTextbook,
      pdfFile,
      pdfPages,
      fileInput,
      selectSubject,
      getSubjectCount,
      selectTextbook,
      triggerFileInput,
      handleFileSelect,
      handleFileDrop,
      movePage,
      removePage,
      goBack,
      nextStep,
      fetchTextbooks,
    }
  },
}
</script>

<style scoped>
.item-processing-container {
  min-height: 100vh;
  background: #f8fafc;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.container {
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: #64748b;
  margin: 0 0 2rem 0;
}

/* 교과서 선택 영역 */
.textbook-selection-area {
  display: flex;
  gap: 2rem;
  min-height: 600px;
}

/* 왼쪽: 과목별 필터 */
.subject-filter {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.filter-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid transparent;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.1s ease;
  text-align: left;
  width: 100%;
}

.filter-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.filter-item.active {
  background: #e0eeff;
  border-color: #3b82f6;
}

.subject-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.subject-name {
  font-weight: 500;
  color: #1e293b;
  flex: 1;
}

.subject-count {
  background: #e2e8f0;
  color: #64748b;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* 오른쪽: 교과서 목록 */
.textbook-list {
  flex: 1;
  min-height: 600px;
}

.textbook-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.textbook-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.textbook-card:hover {
  transform: translateY(0px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

/* 썸네일 */
.textbook-thumbnail {
  height: 250px;
  overflow: hidden;
  background: #f8fafc;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f8fafc;
}

.no-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}

.no-thumbnail .icon {
  width: 48px;
  height: 48px;
  color: #94a3b8;
}

/* 교과서 정보 */
.textbook-content {
  padding: 1rem;
}

.textbook-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.textbook-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.textbook-curriculum {
  color: #94a3b8;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

/* 프롬프트 */
.select-subject-prompt,
.no-textbooks {
  text-align: center;
  padding: 3rem 0;
  color: #64748b;
}

.prompt-icon,
.no-textbooks-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.select-subject-prompt h3,
.no-textbooks h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.select-subject-prompt p,
.no-textbooks p {
  margin: 0;
  line-height: 1.5;
}

/* 로딩 상태 */
.loading-section {
  text-align: center;
  padding: 3rem 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-section p {
  color: #64748b;
  font-size: 1.1rem;
}

/* PDF 업로드 */
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.upload-icon {
  width: 64px;
  height: 64px;
  background: #eff6ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.upload-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.upload-hint {
  color: #64748b;
  margin: 0;
  font-size: 0.875rem;
}

/* PDF 편집 */
.pdf-pages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.page-item {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-number {
  text-align: center;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.5rem;
}

.page-preview {
  text-align: center;
  margin-bottom: 1rem;
}

.page-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.page-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* 버튼 스타일 */
.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-small {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .textbook-selection-area {
    flex-direction: column;
  }

  .subject-filter {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 2rem 1rem;
  }

  .textbook-grid {
    grid-template-columns: 1fr;
  }

  .pdf-pages {
    grid-template-columns: 1fr;
  }

  .navigation-buttons {
    flex-direction: column;
  }
}
</style>
