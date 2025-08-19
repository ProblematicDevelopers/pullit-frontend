<template>
  <!--
    교과서 기반 문제 등록 화면 (CBTStep01 유사 레이아웃)
    - 좌측: 교과서 목록(TextbookList)
    - 우측: 선택된 교과서의 목차(ChapterList)
    동작 흐름:
    1) TextbookList에서 교과서 카드를 클릭 → subjectId 전달(@view 이벤트)
    2) 이 컴포넌트에서 subjectId를 watch → chapterStore.fetchChapters(subjectId) 호출
    3) ChapterList는 주입받은 chapterStore를 통해 로딩/에러/목차 데이터를 표시
  -->
  <div class="cbt-step-container">
    <div class="main-content">
      <div class="container-fluid py-3">
        <div class="row g-4">
          <div class="col-6">
            <div class="card card-scroll">
              <div class="card-body">
                <!-- 교과서 목록 컴포넌트: 클릭 시 subjectId를 @view로 방출 -->
                <TextbookList @view="handleView" />
              </div>
            </div>
          </div>

          <div class="col-6">
            <div class="card card-scroll">
              <div class="card-body">
                <!-- 챕터 트리 표시 컴포넌트: 외부에서 store 주입 -->
                <ChapterList :chapterStore="chapterStore" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
// 컴포넌트/훅/스토어 임포트
import TextbookList from '@/components/common/subjects/TextbookList.vue'
import ChapterList from '@/components/common/subjects/ChapterList.vue'
import { ref, watch } from 'vue'
import { useChapterStore } from '@/store/chapterStore.js'

// 챕터 트리용 스토어 (axios로 백엔드에서 트리 데이터 로드)
const chapterStore = useChapterStore()

// TextbookList에서 선택된 교과서의 subjectId
const selectedSubjectId = ref(null)

// TextbookList → @view(id) 이벤트 핸들러
function handleView(id) {
  selectedSubjectId.value = id
}

// subjectId 변경을 감지해 해당 교과서의 챕터 트리를 새로 불러옴
watch(selectedSubjectId, (newId) => {
  if (newId) {
    chapterStore.fetchChapters(newId).catch(() => {})
  }
}, { immediate: false })
</script>

<style scoped>
/* 전체 컨테이너 레이아웃 */
.cbt-step-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: scroll;
}

/* 메인 콘텐츠(좌우 2컬럼) */
.main-content {
  flex: 1;
  overflow: hidden;
}

/* 카드 내부 스크롤 */
.card-scroll {
  height: 80vh !important;
  overflow-y: auto;
}

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


