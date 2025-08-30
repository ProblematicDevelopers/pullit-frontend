<template>
  <div class="existing-file-selection">
    <!-- 헤더 -->
    <div class="selection-header d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="selection-title mb-1">기존 파일 선택</h3>
        <p class="selection-subtitle text-muted mb-0">이전에 업로드한 파일 중 하나를 선택하세요</p>
      </div>
      <button class="btn btn-outline-secondary" @click="$emit('go-back')">
        <i class="bi bi-arrow-left me-2"></i>뒤로가기
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">파일 목록을 불러오는 중...</p>
    </div>

    <!-- 파일 목록이 없는 경우 -->
    <div v-else-if="!fileHistories || fileHistories.length === 0" class="empty-state text-center py-5">
      <div class="empty-icon mb-3">
        <i class="bi bi-folder2-open display-4 text-muted"></i>
      </div>
      <h4 class="mb-3">업로드된 파일이 없습니다</h4>
      <p class="text-muted mb-4">먼저 PDF 파일을 업로드해주세요.</p>
      <button class="btn btn-primary" @click="$emit('method-selected', 'new')">
        <i class="bi bi-cloud-upload me-2"></i>새 파일 업로드하기
      </button>
    </div>

    <!-- 파일 목록 -->
    <div v-else class="file-list">
      <!-- 검색 및 필터 -->
      <div class="list-controls mb-4">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input
                type="text"
                class="form-control"
                placeholder="파일명으로 검색..."
                v-model="searchQuery"
              >
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="selectedSubject">
              <option value="">전체 과목</option>
              <option v-for="subject in subjects" :key="subject.code" :value="subject.code">
                {{ subject.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="sortBy">
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="name">파일명순</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 파일 카드 목록 -->
      <div class="file-grid">
        <div
          v-for="fileHistory in filteredFiles"
          :key="fileHistory.id"
          class="file-card"
          @click="selectFile(fileHistory)"
          :class="{ selected: selectedFileId === fileHistory.id }"
        >
          <div class="card h-100">
            <div class="card-body p-3">
              <!-- 파일 정보 헤더 -->
              <div class="file-header d-flex justify-content-between align-items-start mb-3">
                <div class="file-info flex-grow-1">
                  <h6 class="file-name mb-1" :title="fileHistory.originalFileName">
                    {{ truncateFileName(fileHistory.originalFileName) }}
                  </h6>
                  <div class="file-meta">
                    <span class="badge bg-primary me-2">{{ getSubjectName(fileHistory.areaCode) }}</span>
                    <small class="text-muted">{{ formatDate(fileHistory.createdDate) }}</small>
                  </div>
                </div>
                <div class="file-status">
                  <i class="bi bi-check-circle-fill text-success" v-if="fileHistory.status === 'completed'"></i>
                  <i class="bi bi-clock text-warning" v-else-if="fileHistory.status === 'processing'"></i>
                  <i class="bi bi-exclamation-circle text-danger" v-else></i>
                </div>
              </div>

              <!-- 미리보기 이미지들 -->
              <div class="preview-images mb-3" v-if="fileHistory.pdfImages && fileHistory.pdfImages.length > 0">
                <div class="image-grid">
                  <div
                    v-for="(image, index) in fileHistory.pdfImages.slice(0, 4)"
                    :key="index"
                    class="preview-image"
                  >
                    <img :src="image.imageUrl" :alt="`페이지 ${image.pageNumber}`" />
                    <div class="page-number">{{ image.pageNumber }}</div>
                  </div>
                  <div v-if="fileHistory.pdfImages.length > 4" class="more-pages">
                    +{{ fileHistory.pdfImages.length - 4 }}
                  </div>
                </div>
              </div>

              <!-- 파일 상세 정보 -->
              <div class="file-details">
                <div class="detail-item">
                  <i class="bi bi-file-earmark-pdf me-2"></i>
                  <span>{{ fileHistory.pdfImages?.length || 0 }}페이지</span>
                </div>
                <div class="detail-item">
                  <i class="bi bi-hdd me-2"></i>
                  <span>{{ formatFileSize(fileHistory.fileSize) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 선택된 파일이 있을 때 다음 단계 버튼 -->
      <div v-if="selectedFileId" class="selection-footer text-center mt-4">
        <button class="btn btn-primary btn-lg px-5" @click="confirmSelection">
          <i class="bi bi-arrow-right me-2"></i>선택한 파일로 편집 시작
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ExistingFileSelection',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    fileHistories: {
      type: Array,
      default: () => []
    },
    subjects: {
      type: Array,
      default: () => []
    }
  },
  emits: ['go-back', 'method-selected', 'file-selected'],
  setup(props, { emit }) {
    const selectedFileId = ref(null)
    const searchQuery = ref('')
    const selectedSubject = ref('')
    const sortBy = ref('latest')

    // 필터링된 파일 목록
    const filteredFiles = computed(() => {
      let files = [...props.fileHistories]

      // 검색 필터
      if (searchQuery.value) {
        files = files.filter(file =>
          file.originalFileName.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }

      // 과목 필터
      if (selectedSubject.value) {
        files = files.filter(file => file.areaCode === selectedSubject.value)
      }

      // 정렬
      files.sort((a, b) => {
        switch (sortBy.value) {
          case 'latest':
            return new Date(b.createdDate) - new Date(a.createdDate)
          case 'oldest':
            return new Date(a.createdDate) - new Date(b.createdDate)
          case 'name':
            return a.originalFileName.localeCompare(b.originalFileName)
          default:
            return 0
        }
      })

      return files
    })

    const selectFile = (fileHistory) => {
      selectedFileId.value = fileHistory.id
    }

    const confirmSelection = () => {
      const selectedFile = props.fileHistories.find(f => f.id === selectedFileId.value)
      if (selectedFile) {
        emit('file-selected', selectedFile)
      }
    }

    const getSubjectName = (areaCode) => {
      const subject = props.subjects.find(s => s.code === areaCode)
      return subject ? subject.name : areaCode
    }

    const truncateFileName = (fileName) => {
      if (fileName.length > 30) {
        return fileName.substring(0, 27) + '...'
      }
      return fileName
    }

    const formatDate = (dateString) => {
      // dateString이 유효하지 않은 경우 처리
      if (!dateString) {
        return '날짜 없음'
      }

      // ISO 문자열이나 타임스탬프인 경우 직접 처리
      let date
      if (typeof dateString === 'string') {
        // ISO 8601 형식 (예: "2025-08-30T11:24:54.674Z") 처리
        if (dateString.includes('T') || dateString.includes('Z')) {
          date = new Date(dateString)
        } else {
          // 일반 날짜 문자열 처리
          date = new Date(dateString)
        }
      } else if (typeof dateString === 'number') {
        // 타임스탬프 처리
        date = new Date(dateString)
      } else {
        date = new Date(dateString)
      }

      // Invalid Date 체크
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString, 'type:', typeof dateString)
        return '날짜 형식 오류'
      }

      try {
        const now = new Date()
        const diffTime = Math.abs(now - date)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // 오늘, 어제, 이번 주 등 상대적 시간 표시
        if (diffDays === 0) {
          return '오늘 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        } else if (diffDays === 1) {
          return '어제 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        } else if (diffDays < 7) {
          return `${diffDays}일 전`
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7)
          return `${weeks}주 전`
        } else {
          // 1개월 이상 지난 경우 절대 날짜 표시
          return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }
      } catch (error) {
        console.error('날짜 포맷팅 오류:', error, 'dateString:', dateString)
        return '날짜 표시 오류'
      }
    }

    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return {
      selectedFileId,
      searchQuery,
      selectedSubject,
      sortBy,
      filteredFiles,
      selectFile,
      confirmSelection,
      getSubjectName,
      truncateFileName,
      formatDate,
      formatFileSize
    }
  }
}
</script>

<style scoped>
.existing-file-selection {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 0;
}

.selection-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
}

.selection-subtitle {
  font-size: 1rem;
  color: #64748b;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  z-index: 2;
}

.search-box input {
  padding-left: 2.5rem;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.file-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-card:hover .card {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.file-card.selected .card {
  border-color: #3b82f6;
  background-color: #f8faff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.file-header {
  min-height: 60px;
}

.file-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.file-status {
  font-size: 1.25rem;
}

.preview-images {
  height: 80px;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}

.image-grid {
  display: flex;
  height: 100%;
  position: relative;
}

.preview-image {
  flex: 1;
  position: relative;
  border-right: 1px solid #e2e8f0;
  overflow: hidden;
}

.preview-image:last-child {
  border-right: none;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-number {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.7rem;
  padding: 1px 4px;
  border-radius: 2px;
}

.more-pages {
  flex-shrink: 0;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.file-details {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #64748b;
}

.detail-item {
  display: flex;
  align-items: center;
}

.empty-state {
  padding: 4rem 2rem;
}

.empty-icon {
  opacity: 0.5;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .existing-file-selection {
    padding: 1rem;
  }

  .selection-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .file-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .list-controls .row > div {
    margin-bottom: 1rem;
  }

  .file-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
