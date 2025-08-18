<!-- src/components/student/report/ReportTabs.vue -->
<template>
  <div class="report-wrap">
    <!-- 탭 헤더 -->

    <nav class="tabs" role="tablist" aria-label="리포트 탭">
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'basic' }"
        role="tab"
        aria-selected="true"
        @click="currentTab = 'basic'"
      >
        기본 리포트
        <span class="underline" v-if="currentTab === 'basic'"></span>
      </button>

      <button
        class="tab-btn"
        :class="{ inactive: currentTab !== 'detail' }"
        role="tab"
        aria-selected="false"
        @click="currentTab = 'detail'"
      >
        상세 리포트
        <span class="underline" v-if="currentTab === 'detail'"></span>
      </button>
    </nav>

    <!-- 콘텐츠 -->
    <section v-if="currentTab === 'basic'" class="panel">
      <h3 class="panel-title">🖊️ 시험참여 정보</h3>

      <div class="cardCustom">
        <ul class="info-list">
          <li class="row">
            <span class="bar"></span>
            <span class="label">이름</span>
            <span class="sep">|</span>
            <span class="value">{{ user.username }}</span>
          </li>
          <li class="row">
            <span class="bar"></span>
            <span class="label">학년</span>
            <span class="sep">|</span>
            <span class="value">{{ user.grade }}</span>
          </li>
        </ul>
      </div>
      <div id="score-box">
          <span class="score"> {{exams.answer}} </span>
          <span class="sep"> | </span>
          <span class="value"> {{exams.count}} </span>
      </div>
      <div>
        <table class="errata table table-bordered">
          <thead>
          <tr>
            <th>번호</th>
            <th>채점 결과</th>
            <th>문제 및 해설 보기</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="panel">
      <h3 class="panel-title">📊 평가결과 요약</h3>
      <div class="card empty">
        <DetailReport/>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import DetailReport from '@/components/student/report/DetailReport.vue'
import { useUserStore } from '@/store/userStore.js'

const userStore = useUserStore()
const { list } = storeToRefs(userStore)

onMounted(() => {
  userStore.fetchUsers().catch(() => {})
})

// 첫 번째 사용자만 보여주는 예 (원하는 로직에 맞게 고치세요)
const user = computed(() => list.value[0] ?? { name: '-', grade: '-' })

// exams는 그대로 props로 받되, 기본값 보장
const props = defineProps({
  defaultTab: { type: String, default: 'basic' },
  exams: { type: Object, default: () => ({ answer: '-', count: '-' }) },
})
const currentTab = ref(props.defaultTab)
</script>

<style scoped>
.report-wrap {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 48px;
  justify-content: center;
  align-items: flex-end;
  margin: 40px 0 28px;
}

.tab-btn {
  position: relative;
  background: transparent;
  border: 0;
  padding: 8px 4px 12px;
  font-size: 24px;
  font-weight: 700;
  color: #2b2f36;
  cursor: pointer;
}

.tab-btn.inactive {
  color: #c7c9cf; /* 스크린샷처럼 비활성 흐리게 */
}

.tab-btn.active {
  color: #2b2f36;
}

.underline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 4px;
  width: 100%;
  background: #193a6a; /* 남색 */
  border-radius: 2px;
}

/* Panel & Card */
.panel {
  margin-top: 8px;
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
}

.cardCustom {
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
  width: 100%;
}

.card.empty {
  color: #6b7280;
}

/* Info list */
.info-list {
  display: grid;
  gap: 18px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 8px 80px 24px 1fr; /* bar | label | | | value */
  align-items: center;
  gap: 12px;
  min-height: 32px;
}



.label {
  color: #3a4760;
  font-weight: 700;
}

.sep {
  color: #9aa3b2;
}

.value {
  color: #1f2937;
  font-weight: 500;
}

#score-box {
  margin-top: 60px;
  height: 100px;
  background-color: #f1f1f1;
  text-align: center;
  align-content: center;
  font-size: 20px;
}

.errata {
  margin-top: 60px;
}

</style>
