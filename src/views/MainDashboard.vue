<template>
  <div class="class-management-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">학급 관리</h1>
        <p class="page-subtitle">학급 현황 및 학생 관리</p>
      </div>
    </div>

    <!-- Quick Stats Section -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <!-- Teacher Stats -->
          <template v-if="userType === 'teacher'">
            <div class="stat-card">
              <div class="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M7 8H9V12H8V9H7V8M10 17V13H11V14H12V13H13V17H12V15H11V17H10M14 12V11H15V8H16V11H17V12H14M12 2.75C12.41 2.75 12.75 3.09 12.75 3.5S12.41 4.25 12 4.25 11.25 3.91 11.25 3.5 11.59 2.75 12 2.75Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.createdExams }}</div>
                <div class="stat-label">생성한 시험지</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon green">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M12 20C7.58 20 4 16.42 4 12S7.58 4 12 4 20 7.58 20 12 16.42 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.completedGrading }}</div>
                <div class="stat-label">완료된 채점</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25M0 20V18.5C0 17.11 1.89 15.94 4.45 15.6C3.86 16.28 3.5 17.22 3.5 18.25V20H0M24 20H20.5V18.25C20.5 17.22 20.14 16.28 19.55 15.6C22.11 15.94 24 17.11 24 18.5V20Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.managedStudents }}</div>
                <div class="stat-label">관리 학생 수</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalQuestions.toLocaleString() }}</div>
                <div class="stat-label">문제 보유</div>
              </div>
            </div>
          </template>

          <!-- Student Stats -->
          <template v-else>
            <div class="stat-card">
              <div class="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">12</div>
                <div class="stat-label">응시한 시험</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon green">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3.09 8.26L12 14L20.91 8.26L12 2M21 16.25L12 22.5L3 16.25V10.75L12 17L21 10.75V16.25Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">85.4</div>
                <div class="stat-label">평균 점수</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20M8.93 12.22H16V19.29L8.93 12.22Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">234</div>
                <div class="stat-label">오답 문제</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 7V13L16.2 15.5L17 14.2L12.5 12.2V7H11M20 12V18H22V12H20M20 20V22H22V20H20M18 20C16.3 21.3 14.3 22 12 22C7 22 2.6 19.2 0.6 15L2.4 14.1C4 17.5 7.6 20 12 20C14 20 15.9 19.5 17.5 18.5L15 16L22 15L21 22L18 20Z"/>
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">8</div>
                <div class="stat-label">학습 일수</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Quick Actions Section -->
    <section class="quick-actions">
      <div class="container">
        <h2 class="section-title">빠른 실행</h2>
        <div class="actions-grid">
          <template v-if="userType === 'teacher'">
            <button class="action-card" @click="openTestWizardPopup">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
              </div>
              <div class="action-title">시험지 생성</div>
              <div class="action-desc">새로운 시험지 만들기</div>
            </button>

            <button class="action-card" @click="$router.push('/test-bank')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6M20 18H4V8H20V18Z"/>
                </svg>
              </div>
              <div class="action-title">문제 은행</div>
              <div class="action-desc">문제 관리 및 검색</div>
            </button>

            <button class="action-card" @click="$router.push('/class-report')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11H7V9H9M13 11H11V9H13M17 11H15V9H17M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4M19 20H5V8H19V20Z"/>
                </svg>
              </div>
              <div class="action-title">성적 분석</div>
              <div class="action-desc">학생 성적 확인</div>
            </button>

            <button class="action-card" @click="$router.push('/class-management')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25Z"/>
                </svg>
              </div>
              <div class="action-title">학급 관리</div>
              <div class="action-desc">학생 정보 관리</div>
            </button>
          </template>

          <template v-else>
            <button class="action-card" @click="$router.push('/student/exams')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 2H18C18.55 2 19 2.45 19 3V14L17 12V4H9V20H17V18L19 16V21C19 21.55 18.55 22 18 22H8C7.45 22 7 21.55 7 21V3C7 2.45 7.45 2 8 2H9M12 8L16 12L12 16L10.6 14.6L12.2 13H3V11H12.2L10.6 9.4L12 8Z"/>
                </svg>
              </div>
              <div class="action-title">시험 응시</div>
              <div class="action-desc">예정된 시험 보기</div>
            </button>

            <button class="action-card" @click="$router.push('/student/scores')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6"/>
                </svg>
              </div>
              <div class="action-title">성적 확인</div>
              <div class="action-desc">시험 결과 보기</div>
            </button>

            <button class="action-card" @click="$router.push('/student/wrong-notes')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20M8.93 12.22H16V19.29L8.93 12.22Z"/>
                </svg>
              </div>
              <div class="action-title">오답 노트</div>
              <div class="action-desc">틀린 문제 복습</div>
            </button>

            <button class="action-card" @click="$router.push('/student/progress')">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 7V13L16.2 15.5L17 14.2L12.5 12.2V7H11M20 12V18H22V12H20M20 20V22H22V20H20M18 20C16.3 21.3 14.3 22 12 22C7 22 2.6 19.2 0.6 15L2.4 14.1C4 17.5 7.6 20 12 20C14 20 15.9 19.5 17.5 18.5L15 16L22 15L21 22L18 20Z"/>
                </svg>
              </div>
              <div class="action-title">학습 진도</div>
              <div class="action-desc">학습 현황 확인</div>
            </button>
          </template>
        </div>
      </div>
    </section>

    <!-- Recent Activity Section -->
    <section class="recent-activity">
      <div class="container">
        <div class="activity-grid">
          <!-- Recent Tests/Exams -->
          <div class="activity-card">
            <h3 class="card-title">
              {{ userType === 'teacher' ? '최근 생성한 시험지' : '최근 응시한 시험' }}
            </h3>
            <div class="activity-list">
              <template v-if="userType === 'teacher'">
                <div class="activity-item" v-for="i in 5" :key="i">
                  <div class="activity-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">2학년 중간고사 수학</div>
                    <div class="activity-meta">30문제 · 2일 전</div>
                  </div>
                  <div class="activity-status">
                    <span class="status-badge green">완료</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="activity-item" v-for="i in 5" :key="i">
                  <div class="activity-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z"/>
                    </svg>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">수학 단원평가 3</div>
                    <div class="activity-meta">85점 · 3일 전</div>
                  </div>
                  <div class="activity-status">
                    <span class="status-badge blue">응시완료</span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Upcoming Schedule -->
          <div class="activity-card">
            <h3 class="card-title">예정된 일정</h3>
            <div class="schedule-list">
              <div class="schedule-item" v-for="i in 4" :key="i">
                <div class="schedule-date">
                  <div class="date-day">{{ 15 + i }}</div>
                  <div class="date-month">8월</div>
                </div>
                <div class="schedule-content">
                  <div class="schedule-title">
                    {{ userType === 'teacher' ? '2학년 단원평가' : '영어 모의고사' }}
                  </div>
                  <div class="schedule-time">14:00 - 15:30</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Chart -->
          <div class="activity-card chart-card">
            <h3 class="card-title">
              {{ userType === 'teacher' ? '학급 평균 성적 추이' : '내 성적 추이' }}
            </h3>
            <div class="simple-chart">
              <div class="chart-bars">
                <div class="chart-item" v-for="i in 7" :key="i">
                  <div class="chart-bar" :style="`height: ${60 + Math.random() * 30}%`"></div>
                  <div class="chart-label">{{ i }}월</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import authService from '@/services/auth'
import examApi from '@/services/examApi'

// 사용자 타입 확인
const userType = ref('teacher')

// 통계 데이터
const stats = ref({
  createdExams: 0,
  completedGrading: 186, // 임시 고정값 (실제 API 필요)
  managedStudents: 142, // 임시 고정값 (실제 API 필요)
  totalQuestions: 0
})

// 시험지 제작 팝업 열기
const openTestWizardPopup = () => {
  const width = 1200
  const height = 800
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
  
  // 새 창으로 시험지 제작 마법사 열기
  window.open('/test-wizard', 'TestWizardPopup', features)
}

// 통계 데이터 로드
const loadStatistics = async () => {
  try {
    // 내 시험지 목록 조회
    const myExamsResponse = await examApi.get('/my', {
      params: { page: 0, size: 100 }
    })
    
    if (myExamsResponse.data.success) {
      stats.value.createdExams = myExamsResponse.data.data.totalElements || 0
      
      // 총 문항 수 계산
      const exams = myExamsResponse.data.data.content || []
      stats.value.totalQuestions = exams.reduce((total, exam) => {
        return total + (exam.totalItems || 0)
      }, 0)
    }
    
    // 필터 옵션에서 추가 통계 가져오기
    const filterResponse = await examApi.get('/filters')
    if (filterResponse.data.success) {
      // 필터 데이터에서 추가 통계 활용 가능
      const filterData = filterResponse.data.data
      // 예: 과목별 문제 수 등
    }
  } catch (error) {
    console.error('통계 데이터 로드 실패:', error)
  }
}

onMounted(async () => {
  const user = authService.getCurrentUser()
  if (user) {
    userType.value = user.role === 'TEACHER' ? 'teacher' : 'student'
  } else {
    // 로그인하지 않은 경우 localStorage에서 확인
    userType.value = localStorage.getItem('userType') || 'teacher'
  }
  
  // 통계 데이터 로드
  await loadStatistics()
})
</script>

<style scoped>
.class-management-dashboard {
  background: #f8fafc;
  min-height: calc(100vh - 200px);
}

/* Page Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* Container */
.container {
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
}

/* Stats Section */
.stats-section {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
  fill: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.green { background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%); }
.stat-icon.purple { background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%); }
.stat-icon.orange { background: linear-gradient(135deg, #f2994a 0%, #f2c94c 100%); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.action-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon svg {
  width: 24px;
  height: 24px;
  fill: #2563eb;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.action-desc {
  font-size: 0.875rem;
  color: #64748b;
}

/* Recent Activity */
.recent-activity {
  margin-bottom: 2rem;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.activity-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.activity-card.chart-card {
  grid-column: span 2;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.activity-item:hover {
  background: #f8fafc;
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon svg {
  width: 20px;
  height: 20px;
  fill: #2563eb;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.125rem;
}

.activity-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.green {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.blue {
  background: #dbeafe;
  color: #2563eb;
}

/* Schedule */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-left: 3px solid #2563eb;
  background: #f8fafc;
  border-radius: 0 8px 8px 0;
}

.schedule-date {
  text-align: center;
  flex-shrink: 0;
  width: 50px;
}

.date-day {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.date-month {
  font-size: 0.75rem;
  color: #64748b;
}

.schedule-content {
  flex: 1;
}

.schedule-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.125rem;
}

.schedule-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Simple Chart */
.simple-chart {
  padding: 1rem 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 150px;
  gap: 0.5rem;
}

.chart-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.chart-bar {
  width: 100%;
  background: linear-gradient(180deg, #2563eb 0%, #60a5fa 100%);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .activity-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-card.chart-card {
    grid-column: span 1;
  }
}
</style>