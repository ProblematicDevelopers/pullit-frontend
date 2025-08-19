<template>
  <!--
    교과서 목록 컴포넌트
    - 상단 탭으로 과목 영역 필터(국어/수학/영어 등)를 전환할 수 있습니다.
    - 본문에는 카드 형태로 교과서들이 표시됩니다.
    - 카드의 "선택하기" 버튼을 클릭하면 선택된 교과서의 subjectId를 부모에게 알립니다(@view).
    데이터 소스:
    - `textbookStore.fetchTextbooks()`가 axios로 `{BASE}/file-history/textbook` 호출
    - 응답 스키마: { success, code, message, data: Array<...>, timestamp }
  -->
  <div class="subject-list-container">
    <div class="sticky-tabs">
      <ul class="nav nav-tabs">
        <li class="nav-item" v-for="t in tabs" :key="t.value">
          <button
            class="nav-link"
            :class="{ active: selectedTab === t.value }"
            @click="selectedTab = t.value"
            type="button"
          >
            <span class="me-2">{{ t.label }}</span>
            <span class="badge bg-secondary">{{ countByTab(t.value) }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div class="scrollable-content">
      <div v-if="loading" class="alert alert-info">교과서를 불러오는 중입니다.</div>
      <div v-else-if="error" class="alert alert-danger">⚠️ {{ error }}</div>

      <div v-else>
        <div v-if="filteredList.length === 0" class="text-muted py-5 text-center">
          표시할 교과서가 없습니다.
        </div>

        <div class="row g-3">
          <div class="col-12 col-sm-6 col-md-4 col-lg-4" v-for="s in filteredList" :key="s.subjectId">
            <div class="card h-100 shadow-sm overflow-hidden">
              <div class="bg-light">
                <img
                  v-if="s.subjectThumbnail"
                  :src="s.subjectThumbnail"
                  class="card-img-top object-fit-cover"
                  :alt="`${s.subjectName} 썸네일`"
                />
                <div v-else class="d-flex align-items-center justify-content-center text-muted" style="height: 180px;">
                  <small class="fw-semibold">썸네일 없음</small>
                </div>
              </div>
              <div class="card-body">
                <h5 class="card-title mb-1 text-truncate" :title="s.subjectName">{{ s.subjectName }}</h5>
                <div class="d-flex gap-1 small text-muted">
                  <span class="badge text-bg-light border" v-if="s.schoolLevelName">{{ s.schoolLevelName }}</span>
                  <span class="badge text-bg-light border" v-if="s.gradeName">{{ s.gradeName }}</span>
                  <span class="badge text-bg-light border" v-if="s.termName">{{ s.termName }}</span>
                </div>
              </div>
              <div class="card-footer bg-transparent d-flex justify-content-between align-items-center border-0">
                <div></div>
                <button class="btn btn-sm btn-primary" @click="onDetail(s.subjectId)">선택하기</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 컴포넌트 로직: 탭 상태/필터/데이터 로딩/이벤트 방출
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTextbookStore } from '@/store/textbookStore.js'

const tabs = [
  { label: '전체', value: 'ALL' },
  { label: '국어', value: 'KO' },
  { label: '수학', value: 'MA' },
  { label: '영어', value: 'EN' },
  { label: '과학', value: 'SC' },
  { label: '사회', value: 'SO' },
  { label: '역사', value: 'HS' },
  { label: '도덕', value: 'MO' },
]

// 현재 선택된 과목 영역 탭 값('ALL'은 전체 표시)
const selectedTab = ref('ALL')

// 교과서 데이터는 textbookStore에서 가져옵니다
const textbookStore = useTextbookStore()
const { list, loading, error } = storeToRefs(textbookStore)

// 부모로 subjectId를 전달하기 위한 이벤트 정의
const emit = defineEmits(['view'])
function onDetail(id) {
  emit('view', id)
}

onMounted(() => {
  textbookStore.fetchTextbooks().catch(() => {})
})

// 탭에 따라 리스트를 필터링합니다(기본은 전체)
const filteredList = computed(() => {
  if (selectedTab.value === 'ALL') return list.value
  return list.value.filter(s => (s.areaCode || '').toUpperCase() === selectedTab.value)
})

function countByTab(tabVal) {
  if (tabVal === 'ALL') return list.value.length
  return list.value.filter(s => (s.areaCode || '').toUpperCase() === tabVal).length
}
</script>

<style scoped>
.subject-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  padding: 0.5rem 0;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.object-fit-cover { object-fit: cover; }
.card-title { line-height: 1.2; }
.nav-tabs .nav-link { border: none; }
.nav-tabs .nav-link.active {
  border-bottom: 2px solid var(--bs-primary);
  font-weight: 600;
}

.scrollable-content::-webkit-scrollbar { width: 6px; }
.scrollable-content::-webkit-scrollbar-track { background: #f8f9fa; }
.scrollable-content::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 3px; }
.scrollable-content::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
</style>


