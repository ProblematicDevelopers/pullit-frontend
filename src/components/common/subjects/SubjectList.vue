<template>
  <div class="container py-3">
    <ul class="nav nav-tabs mb-3">
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

    <!-- States -->
    <div v-if="loading" class="alert alert-info">교과서를 불러오는 중입니다.</div>
    <div v-else-if="error" class="alert alert-danger">⚠️ {{ error }}</div>

    <!-- Content -->
    <div v-else>
      <div v-if="filteredList.length === 0" class="text-muted py-5 text-center">
        해당 탭에 표시할 교과서가 없습니다.
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
              <div v-else class="d-flex align-items-center justify-content-center text-muted">
                <small class="fw-semibold">썸네일 없음</small>
              </div>
            </div>
            <div class="card-body">
              <h5 class="card-title mb-1 text-truncate" :title="s.subjectName">{{ s.subjectName }}</h5>
              <div class="d-flex gap-1 small text-muted">
<!--                <span class="badge text-bg-light border">{{ s.areaCode || 'N/A' }}</span>-->
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubjectStore } from '@/store/subjectStore.js'

// 탭 정의
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

const selectedTab = ref('ALL')

const subjectStore = useSubjectStore()
const { list, loading, error } = storeToRefs(subjectStore)

const emit = defineEmits(['view'])
function onDetail(id) {
  emit('view', id)
}
onMounted(() => {
  subjectStore.fetchSubjects().catch(() => {})
})

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
.object-fit-cover { object-fit: cover; }
.card-title { line-height: 1.2; }
.nav-tabs .nav-link { border: none; }
.nav-tabs .nav-link.active {
  border-bottom: 2px solid var(--bs-primary);
  font-weight: 600;
}
</style>
