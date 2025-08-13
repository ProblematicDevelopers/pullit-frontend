<template>
  <div>
    <SubjectList @view="handleView"  subject-id=""/>
  </div>
</template>

<script setup>
import SubjectList from '@/components/common/subjects/SubjectList.vue'

function handleView(id) {
  console.log('자식에서 받은 ID:', id)
}
</script>

<style scoped>

</style>
