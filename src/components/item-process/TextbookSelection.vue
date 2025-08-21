<template>
  <div class="textbook-selection-section">
    <h2 class="section-title">1. 교과서 선택</h2>
    <p class="section-description">문제를 추가할 교과서를 선택하세요</p>

    <!-- 로딩 상태 표시 -->
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
            <!-- 과목 코드 배지 -->
            <div class="subject-badge" :style="{ backgroundColor: subject.color }">
              {{ areaCode }}
            </div>
            <span class="subject-name">{{ subject.name }}</span>
            <!-- 해당 과목의 교과서 개수 표시 -->
            <span class="subject-count">{{ getSubjectCount(areaCode) }}</span>
          </button>
        </div>
      </div>

      <!-- 오른쪽: 교과서 목록 -->
      <div class="textbook-list">
        <!-- 선택된 과목에 교과서가 있을 때 -->
        <div v-if="selectedSubject && filteredTextbooks.length > 0" class="textbook-grid">
          <div
            v-for="textbook in filteredTextbooks"
            :key="textbook.subjectId"
            class="textbook-card"
            @click="selectTextbook(textbook)"
          >
            <!-- 교과서 썸네일 -->
            <div class="textbook-thumbnail">
              <img
                v-if="textbook.subjectThumbnail"
                :src="textbook.subjectThumbnail"
                :alt="`${textbook.subjectName} 썸네일`"
                class="thumbnail-image"
              />
              <!-- 썸네일이 없을 때 기본 아이콘 표시 -->
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
              <!-- 교과서 메타데이터 배지들 -->
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

        <!-- 선택된 과목이 없을 때 안내 메시지 -->
        <div v-else-if="!selectedSubject" class="select-subject-prompt">
          <div class="prompt-icon">📚</div>
          <h3>과목을 선택해주세요</h3>
          <p>왼쪽에서 과목을 선택하면 해당 과목의 교과서가 표시됩니다.</p>
        </div>

        <!-- 선택된 과목에 교과서가 없을 때 안내 메시지 -->
        <div v-else class="no-textbooks">
          <div class="no-textbooks-icon">📖</div>
          <h3>해당 과목에 교과서가 없습니다</h3>
          <p>다른 과목을 선택해보세요.</p>
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
/* 섹션 제목 스타일 */
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

/* 교과서 선택 영역 레이아웃 */
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

/* 과목 코드 배지 */
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

/* 교과서 썸네일 */
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

/* 안내 메시지 스타일 */
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
  .textbook-grid {
    grid-template-columns: 1fr;
  }
}
</style>
