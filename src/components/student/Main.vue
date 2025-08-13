<template>
  <div>
    <h1>Student Main</h1>
    <div class="row">

      <router-link to="/student/cbtstep01" class="col-4">
        <div class="card">
          <img src="" class="card-img-top" alt="...">
          <div class="card-body">
            <h3 class="card-title">CBT</h3>
            <p class="card-text">CBT 기출문제 연습</p>
          </div>
        </div>
      </router-link>
      <router-link to="" class="col-4">
        <div class="card">
          <img src="" class="card-img-top" alt="...">
          <div class="card-body">
            <h3 class="card-title">ClassRoom</h3>
            <p class="card-text">ClassRoom</p>
          </div>
        </div>
      </router-link>
      <router-link to="" class="col-4">
        <div></div>
        <div class="card">
          <img src="" class="card-img-top" alt="...">
          <div class="card-body">
            <h3 class="card-title">Report</h3>
            <p class="card-text">Report</p>
          </div>
        </div>
      </router-link>

    </div>
  </div>

</template>

<script>
export default {
  name: 'StudentMain',
}
</script>

<style scoped></style>
