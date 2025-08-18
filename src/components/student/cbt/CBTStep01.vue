<template>
  <div>
    <SubjectList @view="handleView"  subject-id=""/>
    <ChapterList :chapterStore="chapterStore" />
  </div>
</template>

<script setup>
import SubjectList from '@/components/common/subjects/SubjectList.vue'
import ChapterList from '@/components/common/subjects/ChapterList.vue'
import { ref, watch } from 'vue'
import { useChapterStore } from '@/store/chapterStore.js'

const chapterStore = useChapterStore()

// 선택된 subject ID를 추적하는 ref
const selectedSubjectId = ref(null)

function handleView(id) {
  selectedSubjectId.value = id
}

// selectedSubjectId가 변경될 때마다 chapter 데이터를 새로 가져오기
watch(selectedSubjectId, (newId) => {
  if (newId) {
    chapterStore.fetchChapters(newId).catch(() => {})
  }
}, { immediate: false })



</script>

<style scoped>

</style>
