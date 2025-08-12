<template>
  <div>
    <a href="#" class="nav-link">기본 리포트</a>
    <a href="#" class="nav-link">상세 리포트</a>
  </div>
</template>

<script>
import DetailReport from '@/components/student/report/DetailReport.vue'
export default {
  name:"BasicReportCoponrnt",
  components:{ DetailReport }
}
</script>

<style scoped>

  a {
   display: flex;
 }

</style>
