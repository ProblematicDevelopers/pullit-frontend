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
        :class="{ active: currentTab === 'detail' }"
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
            <span class="value">{{ displayName }}</span>
          </li>
          <li class="row">
            <span class="bar"></span>
            <span class="label">학년</span>
            <span class="sep">|</span>
            <span class="value">{{ studentGrade }}</span>
          </li>
        </ul>
      </div>
      <div id="score-box">
        <span class="score"> {{ exams.answer }} </span>
        <span class="sep"> | </span>
        <span class="value"> {{ exams.count }} </span>
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
        <DetailReport />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DetailReport from '@/components/student/report/DetailReport.vue'
import studentApi from '@/services/studentApi.js'
const studentGrade = ref('-')

onMounted(async () => {
  try {
    // localStorage에서 userInfo 가져오기
    const userInfoStr = localStorage.getItem('userInfo')
    const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null

    // 토큰에서 userId 가져오기 (라우터 파라미터 대신)
    const userId = userInfo?.id

    if (userId) {
      try {
        const { data } = await studentApi.getByUserId(userId)

        // data.data.grade에서 학년 가져오기
        const grade = data?.data?.grade

        studentGrade.value = grade ?? '-'

        // grade를 localStorage에 저장
        if (grade) {
          const updatedUserInfo = { ...userInfo, grade: grade }
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
        }
      } catch {
        studentGrade.value = '-'
      }
    }
  } catch {
    studentGrade.value = '-'
  }
})

const user = computed(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {}
  return {
    fullName: userInfo.fullName || userInfo.name || '사용자',
    username: userInfo.username || '사용자',
  }
})

const displayName = computed(
  () => user.value.fullName || user.value.name || user.value.username || '-',
)

// 시험 데이터 (실제로는 API에서 가져와야 함)
const exams = computed(() => ({
  answer: '85점',
  count: '20문제',
}))

// props는 그대로 유지하되, 기본값 보장
const props = defineProps({
  defaultTab: { type: String, default: 'basic' },
})
const currentTab = ref(props.defaultTab)
</script>

<style scoped>
.report-wrap {
  max-width: 1000px;
  margin: 80px auto 80px;
  padding: 0 20px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin: 40px 0 28px;
  flex-wrap: wrap;
}

.tab-btn {
  position: relative;
  background: white;
  border: 1px solid #d3d3d3;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.tab-btn.inactive {
  color: #333;
  background: white;
}

.tab-btn.active {
  background: #3b6cff;
  color: white;
  border-color: #3b6cff;
}

.tab-btn:hover {
  border-color: #3b6cff;
  background: #f8f9ff;
}

.tab-btn.active:hover {
  background: #3b6cff;
  color: white;
}

.underline {
  display: none;
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
  border: 1px solid #d3d3d3;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 100%;
  transition: all 0.3s ease;
}

.cardCustom:hover {
  border-color: #2d5af5;
  box-shadow: 0 4px 12px rgba(59, 108, 255, 0.15);
  transform: translateY(-2px);
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
  color: #3b6cff;
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
  background: #fff;
  border: 1px solid #d3d3d3;
  border-radius: 6px;
  text-align: center;
  align-content: center;
  font-size: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

/* hover 효과 제거 */

.errata {
  margin-top: 60px;
  border: 1px solid #d3d3d3;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.errata th {
  background: #f8f9ff;
  color: #3b6cff;
  font-weight: bold;
  padding: 12px;
  border: 1px solid #d3d3d3;
}

.errata td {
  padding: 12px;
  border: 1px solid #d3d3d3;
}

.errata tr:hover {
  background: #f8f9ff;
}
</style>
