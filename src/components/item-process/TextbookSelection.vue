<template>
  <div class="textbook-selection-section">
    <h2 class="section-title fw-semibold text-dark mb-2">1. 교과서 선택</h2>
    <p class="section-description text-muted mb-4">문제를 추가할 교과서를 선택하세요</p>

    <!-- 로딩 상태 표시 -->
    <div v-if="loading" class="loading-section text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted fs-5">교과서 목록을 불러오는 중...</p>
    </div>

    <!-- 교과서 선택 영역 -->
    <div v-else class="textbook-selection-area d-flex gap-4">
      <!-- 왼쪽: 과목별 필터 -->
      <div class="subject-filter bg-white rounded-4 shadow-custom p-4" style="width: 250px; flex-shrink: 0; height: 700px; overflow-y: auto;">
        <h3 class="filter-title fw-semibold text-dark mb-4">과목 선택</h3>
        <div class="filter-list d-flex flex-column gap-3">
          <button
            v-for="(subject, areaCode) in subjects"
            :key="areaCode"
            class="filter-item btn text-start p-3 rounded-3 border-2 w-100"
            :class="{
              'filter-item-active': selectedSubject === areaCode,
              'filter-item-default': selectedSubject !== areaCode
            }"
            @click="selectSubject(areaCode)"
          >
            <!-- 과목 코드 배지 -->
            <div
              class="subject-badge rounded-circle d-flex align-items-center justify-content-center fw-bold fs-6 me-3"
              :style="{
                backgroundColor: selectedSubject === areaCode ? 'white' : subject.color,
                color: selectedSubject === areaCode ? subject.color : 'white',
                width: '32px',
                height: '32px'
              }"
            >
              {{ areaCode }}
            </div>
            <span class="subject-name fw-medium text-dark me-3">{{ subject.name }}</span>
            <!-- 해당 과목의 교과서 개수 표시 -->
            <span class="subject-count badge rounded-pill fs-6">{{ getSubjectCount(areaCode) }}</span>
          </button>
        </div>
      </div>

      <!-- 오른쪽: 교과서 목록 -->
      <div class="textbook-list flex-grow-1" style="min-height: 600px;">
        <!-- 선택된 과목에 교과서가 있을 때 -->
        <div v-if="selectedSubject && filteredTextbooks.length > 0" class="textbook-grid row g-4">
          <div
            v-for="textbook in filteredTextbooks"
            :key="textbook.subjectId"
            class="textbook-card col-12 col-md-6 col-lg-4 col-xl-3"
          >
            <div
              class="textbook-card-inner card h-100 border-0 shadow-custom rounded-4 overflow-hidden cursor-pointer"
              @click="selectTextbook(textbook)"
            >
              <!-- 교과서 썸네일 -->
              <div class="textbook-thumbnail bg-light" style="height: 200px; overflow: hidden;">
                <img
                  v-if="textbook.subjectThumbnail"
                  :src="textbook.subjectThumbnail"
                  :alt="`${textbook.subjectName} 썸네일`"
                  class="w-100 h-100 object-fit-contain bg-light"
                />
                <!-- 썸네일이 없을 때 기본 아이콘 표시 -->
                <div v-else class="d-flex align-items-center justify-content-center h-100 bg-light">
                  <svg viewBox="0 0 24 24" class="text-muted" style="width: 48px; height: 48px;">
                    <path
                      fill="currentColor"
                      d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"
                    />
                  </svg>
                </div>
              </div>

              <!-- 교과서 정보 -->
              <div class="card-body p-3">
                <h4 class="textbook-title fw-semibold text-dark mb-3" style="line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  {{ textbook.subjectName }}
                </h4>
                <!-- 교과서 메타데이터 배지들 -->
                <div class="textbook-badges d-flex flex-wrap gap-2 mb-3">
                  <span v-if="textbook.schoolLevelName" class="badge bg-light text-dark rounded-pill px-3 py-2 fs-6">
                    {{ textbook.schoolLevelName }}
                  </span>
                  <span v-if="textbook.gradeName" class="badge bg-light text-dark rounded-pill px-3 py-2 fs-6">
                    {{ textbook.gradeName }}
                  </span>
                  <span
                    v-if="textbook.termName && textbook.termName !== '0학기'"
                    class="badge bg-light text-dark rounded-pill px-3 py-2 fs-6"
                  >
                    {{ textbook.termName }}
                  </span>
                </div>
                <p v-if="textbook.curriculumName" class="textbook-curriculum text-muted mb-0 fs-6" style="line-height: 1.4;">
                  {{ textbook.curriculumName }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 선택된 과목이 없을 때 안내 메시지 -->
        <div v-else-if="!selectedSubject" class="select-subject-prompt text-center py-5">
          <div class="prompt-icon fs-1 mb-3">📚</div>
          <h3 class="fw-semibold text-dark mb-2">과목을 선택해주세요</h3>
          <p class="text-muted mb-0">왼쪽에서 과목을 선택하면 해당 과목의 교과서가 표시됩니다.</p>
        </div>

        <!-- 선택된 과목에 교과서가 없을 때 안내 메시지 -->
        <div v-else class="no-textbooks text-center py-5">
          <div class="no-textbooks-icon fs-1 mb-3">📖</div>
          <h3 class="fw-semibold text-dark mb-2">해당 과목에 교과서가 없습니다</h3>
          <p class="text-muted mb-0">다른 과목을 선택해보세요.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'TextbookSelection',
  props: {
    // 로딩 상태
    loading: {
      type: Boolean,
      default: false
    },
    // 과목 목록
    subjects: {
      type: Object,
      required: true
    },
    // 그룹화된 교과서 목록
    groupedTextbooks: {
      type: Object,
      required: true
    },
    // 현재 선택된 과목
    selectedSubject: {
      type: String,
      default: null
    }
  },
  emits: ['select-subject', 'select-textbook'],
  setup(props, { emit }) {
    // 선택된 과목의 교과서만 필터링
    const filteredTextbooks = computed(() => {
      if (!props.selectedSubject) return []
      return props.groupedTextbooks[props.selectedSubject] || []
    })

    // 과목 선택 처리
    const selectSubject = (areaCode) => {
      emit('select-subject', areaCode)
    }

    // 교과서 선택 처리
    const selectTextbook = (textbook) => {
      emit('select-textbook', textbook)
    }

    // 과목별 교과서 개수 계산
    const getSubjectCount = (areaCode) => {
      return props.groupedTextbooks[areaCode]?.length || 0
    }

    return {
      filteredTextbooks,
      selectSubject,
      selectTextbook,
      getSubjectCount
    }
  }
}
</script>

<style scoped>
/* 부트스트랩으로 대체할 수 없는 일부 커스텀 스타일 */
.section-title {
  font-size: 1.5rem;
  color: #1e293b;
}

.section-description {
  color: #64748b;
}

.textbook-selection-area {
  min-height: 600px;
}

/* 과목 선택 버튼 스타일 - 원래 디자인 복원 */
.filter-item {
  background: #f8fafc;
  border-color: transparent !important;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0 !important;
}

.filter-item-active {
  background: #e0eeff !important;
  border-color: #3b82f6 !important;
}

.filter-item-default {
  background: #f8fafc;
}

/* 과목 코드 배지 스타일 */
.subject-badge {
  flex-shrink: 0;
}

/* 과목 이름 스타일 */
.subject-name {
  flex: 1;
  margin-right: 1rem;
}

/* 과목 개수 배지 스타일 - 원래 디자인 복원 */
.subject-count {
  background: #e2e8f0 !important;
  color: #64748b !important;
  font-weight: 600;
  flex-shrink: 0;
}

/* 교과서 카드 스타일 - 원래 디자인 복원 */
.textbook-card-inner {
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.textbook-card-inner:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
  border-color: #3b82f6 !important;
}

/* 교과서 썸네일 스타일 */
.textbook-thumbnail {
  background: #f8fafc !important;
}

/* 교과서 배지 스타일 - 원래 디자인 복원 */
.textbook-badges .badge {
  background: #f1f5f9 !important;
  color: #64748b !important;
  font-weight: 500;
}

/* 커스텀 그림자 효과 */
.shadow-custom {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

/* 커스텀 그림자 효과 */
.shadow-custom {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

/* 커서 포인터 */
.cursor-pointer {
  cursor: pointer;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .textbook-selection-area {
    flex-direction: column !important;
  }

  .subject-filter {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .textbook-grid .col-xl-3 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

/* 왼쪽: 과목별 필터 */
.subject-filter {
  height: 800px;
  overflow-y: auto;
}

/* 스크롤바 스타일링 */
.subject-filter::-webkit-scrollbar {
  width: 6px;
}

.subject-filter::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.subject-filter::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.subject-filter::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
