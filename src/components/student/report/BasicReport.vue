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

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>시험 데이터를 불러오는 중...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <p>{{ error }}</p>
          <button @click="fetchExamData" class="retry-btn">다시 시도</button>
        </div>
      </div>

      <!-- 데이터 표시 -->
      <div v-else>
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
          <span class="score"> {{ examData.score || '0' }}개 </span>
          <span class="sep"> | </span>
          <span class="value"> {{ examData.totalQuestions || '0' }}문제 </span>
        </div>
        <div>
          <table class="errata table table-bordered">
            <thead>
              <tr>
                <th>번호</th>
                <th>채점 결과</th>
                <th>소요시간</th>
                <th>문제 및 해설 보기</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="examData.questions.length === 0">
                <td colspan="4" class="no-data">문제 데이터가 없습니다.</td>
              </tr>
              <tr v-else v-for="(question, index) in examData.questions" :key="index">
                <td>{{ index + 1 }}</td>
                <td>
                  <span :class="question.isCorrect ? 'correct' : 'incorrect'">
                    {{ question.isCorrect ? '정답' : '오답' }}
                  </span>
                </td>
                <td>{{ question.duration }}초</td>
                <td>
                  <button
                    class="view-btn"
                    @click="viewQuestionDetail(question, index)"
                    :disabled="!question.questionId"
                  >
                    보기
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-else class="panel">
      <h3 class="panel-title">📊 평가결과 요약</h3>
      <div class="card empty">
        <DetailReport />
      </div>
    </section>

    <!-- 문제 HTML 모달 -->
    <QuestionHtmlModal :is-visible="showModal" :question="selectedQuestion" @close="closeModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DetailReport from '@/components/student/report/DetailReport.vue'
import QuestionHtmlModal from '@/components/student/report/QuestionHtmlModal.vue'
import studentApi from '@/services/studentApi.js'
import reportApi from '@/services/reportApi.js'

const route = useRoute()
const studentGrade = ref('-')
const examData = ref({
  score: 0,
  totalQuestions: 0,
  questions: [],
})
const loading = ref(false)
const error = ref(null)
const showModal = ref(false)
const selectedQuestion = ref(null)

onMounted(async () => {
  await Promise.all([fetchStudentInfo(), fetchExamData()])
})

const fetchStudentInfo = async () => {
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
}

const fetchExamData = async () => {
  loading.value = true
  error.value = null

  try {
    const attemptId = route.params.id || route.params.attemptId

    if (!attemptId) {
      throw new Error('시험 ID가 없습니다.')
    }

    const response = await reportApi.getAttemptIdBasic(attemptId)
    const data = response.data?.data || response.data || {}

    // API 응답 데이터를 컴포넌트에서 사용할 수 있는 형태로 변환
    examData.value = {
      score: calculateCorrectCount(data.attemptQuestions || []),
      totalQuestions: data.attemptQuestions?.length || 0,
      questions: normalizeQuestions(data.attemptQuestions || []),
    }
  } catch (err) {
    console.error('시험 데이터를 가져오는데 실패했습니다:', err)
    error.value = '시험 데이터를 불러올 수 없습니다.'

    // 에러 시 기본 데이터 설정
    examData.value = {
      score: 0,
      totalQuestions: 0,
      questions: [],
    }
  } finally {
    loading.value = false
  }
}

// 정답 개수 계산 함수
const calculateCorrectCount = (attemptQuestions) => {
  if (!Array.isArray(attemptQuestions)) {
    return 0
  }

  return attemptQuestions.filter((question) => question.isCorrect).length
}

// 문제 데이터 정규화 함수
const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    return []
  }

  return questions.map((question, index) => {
    // API 응답 구조에 맞게 정규화
    return {
      id: question.id || question.questionId || index + 1,
      questionId: question.questionId || question.id || index + 1,
      isCorrect: question.isCorrect || false,
      answer: question.userAnswer || '',
      points: question.points || 0,
      duration: question.duration || 0,
      answeredAt: question.answeredAt || null,
    }
  })
}

const viewQuestionDetail = (question, index) => {
  // 문제 상세 보기 모달 열기
  selectedQuestion.value = {
    ...question,
    questionNumber: index + 1, // 실제 문제 순서 추가
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedQuestion.value = null
}

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
  padding: 8px 12px;
  border: 1px solid #d3d3d3;
  text-align: center;
  font-size: 14px;
}

.errata td {
  padding: 8px 12px;
  border: 1px solid #d3d3d3;
  text-align: center;
  font-size: 14px;
}

.errata tr:hover {
  background: #f8f9ff;
}

/* 채점 결과 스타일 */
.correct {
  color: #10b981;
  font-weight: bold;
}

.incorrect {
  color: #ef4444;
  font-weight: bold;
}

.view-btn {
  background: #3b6cff;
  color: white;
  border: none;
  padding: 6px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background: #2d5af5;
}

.view-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 로딩 상태 스타일 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b6cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 에러 상태 스타일 */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.error-message {
  text-align: center;
  color: #ef4444;
}

.error-message p {
  margin-bottom: 16px;
  font-size: 16px;
}

.retry-btn {
  background: #3b6cff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #2d5af5;
}

/* 데이터 없음 스타일 */
.no-data {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 40px 20px;
}
</style>
