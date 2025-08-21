<template>
  <div class="cbt-step-container">
    <!-- 메인 콘텐츠 영역 -->
    <div class="main-content">
      <div class="container-fluid py-3">
        <div class="row g-4">
          <!-- 교과서 목록 -->
          <div class="col-6">
            <div class="card card-scroll">
              <div class="card-body">
                <SubjectList @view="handleView" subject-id="" />
              </div>
            </div>
          </div>

          <!-- 챕터 목록 -->
          <div class="col-6">
            <div class="card card-scroll">
              <div class="card-body">
                <ChapterList
                  :chapterStore="chapterStore"
                  @selection-change="handleSelectionChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 고정 영역 (선택된 항목이 있을 때만 표시) -->
    <div v-if="hasSelection" class="fixed-bottom-area">
      <div class="d-flex justify-content-between align-items-center p-3">
        <div class="selection-summary">
          <span class="text-muted">선택된 항목:</span>
          <span class="ms-2 fw-semibold">{{ getSelectionCount() }}개</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <!-- 문항수 설정 -->
          <div class="exam-time-selector">
            <span class="text-muted me-2">시험 시간:</span>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="decrementExamTime"
              :disabled="selectedExamTime <= 10"
            >
              -
            </button>
            <span class="mx-2 fw-semibold">{{ selectedExamTime }}분</span>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="incrementExamTime"
              :disabled="selectedExamTime >= 120"
            >
              +
            </button>
          </div>
          <div class="question-count-selector">
            <span class="text-muted me-2">문항수:</span>
            <div class="btn-group" role="group">
              <button
                v-for="count in [10, 20, 30, 40, 50]"
                :key="count"
                type="button"
                class="btn"
                :class="
                  selectedQuestionCount === count
                    ? 'btn-outline-primary active'
                    : 'btn-outline-secondary'
                "
                @click="setQuestionCount(count)"
              >
                {{ count }}개
              </button>
            </div>
          </div>
          <button class="btn btn-primary btn-lg" @click="createCBT" :disabled="isLoading">
            <i v-if="isLoading" class="bi bi-hourglass-split me-2"></i>
            <i v-else class="bi bi-plus-circle me-2"></i>
            {{ isLoading ? '생성 중...' : 'CBT 생성하기' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h5 class="text-white mb-2">CBT를 생성 중입니다...</h5>
        <p class="text-white-50 mb-0">잠시만 기다려주세요.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import SubjectList from '@/components/common/subjects/SubjectList.vue'
import ChapterList from '@/components/common/subjects/ChapterList.vue'
import { ref, watch, computed } from 'vue'
import { useChapterStore } from '@/store/chapterStore.js'
import { cbtAPI } from '@/store/cbtStore.js'
import { useRouter } from 'vue-router'
const router = useRouter()
const chapterStore = useChapterStore()

// 선택된 subject ID를 추적하는 ref
const selectedSubjectId = ref(null)

// 선택된 챕터/유닛 데이터
const selectedData = ref([])

// 선택된 문항수 (기본값: 10)
const selectedQuestionCount = ref(10)

// 시험 시간 상태 및 증감 함수
const selectedExamTime = ref(30)

// 로딩 상태
const isLoading = ref(false)

function handleView(id) {
  selectedSubjectId.value = id
}

// selectedSubjectId가 변경될 때마다 chapter 데이터를 새로 가져오기
watch(
  selectedSubjectId,
  (newId) => {
    if (newId) {
      chapterStore.fetchChapters(newId).catch(() => {})
    }
  },
  { immediate: false },
)

function handleSelectionChange(selection) {
  console.log(selection)
  selectedData.value = selection
}

// 선택된 항목이 있는지 확인
const hasSelection = computed(() => {
  return selectedData.value.length > 0
})

// 선택된 항목 개수 계산
function getSelectionCount() {
  let totalCount = 0
  selectedData.value.forEach((node) => {
    totalCount += node.units.length
  })
  return totalCount
}

// 문항수 설정 함수
function setQuestionCount(count) {
  selectedQuestionCount.value = count
}

// 시험 시간 상태 및 증감 함수
function incrementExamTime() {
  selectedExamTime.value = Math.min(120, selectedExamTime.value + 10)
}
function decrementExamTime() {
  selectedExamTime.value = Math.max(10, selectedExamTime.value - 10)
}

// CBT 생성 함수
async function createCBT() {
  try {
    isLoading.value = true
    console.log('CBT 생성 시작:', selectedData.value)
    console.log('선택된 문항수:', selectedQuestionCount.value)

    // API로 전송할 데이터 준비
    const cbtData = {
      questionCount: selectedQuestionCount.value,
      timeLimit: selectedExamTime.value,
      subjectId: selectedSubjectId.value,
      selectedChapters: selectedData.value.map((node) => ({
        largeChapterId: node.chapter,
        mediumChapters: node.units,
      })),
    }

    // API 호출
    const response = await cbtAPI.createCBT(cbtData)

    // 성공 시 처리 (예: 다음 단계로 이동)
    // 세션스토리지에 데이터 저장
    sessionStorage.setItem('cbtData', JSON.stringify(cbtData))
    sessionStorage.setItem('examData', JSON.stringify(response.data.data))
    router.push({
      path: '/student/cbtstep02',
    })
  } catch (error) {
    console.error('CBT 생성 실패:', error)
    // 에러 처리 (예: 알림 표시)
    alert('CBT 생성에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 전체 컨테이너 */
.cbt-step-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: scroll;
}

/* 메인 콘텐츠 영역 */
.main-content {
  flex: 1;
  overflow: hidden;
}

.card-scroll {
  height: 80vh !important;
  overflow-y: auto;
}

/* 하단 고정 영역 */
.fixed-bottom-area {
  background: white;
  border-top: 1px solid #dee2e6;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 100%;
  position: fixed;
  bottom: 0;
}

.selection-summary {
  font-size: 1.1rem;
}

.question-count-selector {
  display: flex;
  align-items: center;
}

.question-count-selector .btn-group .btn {
  font-size: 0.9rem;
  padding: 0.375rem 0.75rem;
}

.question-count-selector .btn-group .btn.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

/* 로딩 오버레이 스타일 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 2rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(5px);
}

.loading-content .spinner-border {
  width: 3rem;
  height: 3rem;
}

/* 스크롤바 스타일 */
.card-scroll::-webkit-scrollbar {
  width: 6px;
}

.card-scroll::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.card-scroll::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.card-scroll::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>
