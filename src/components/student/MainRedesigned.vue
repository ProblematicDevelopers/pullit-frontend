<template>
  <div class="student-dashboard">
    <!-- Hero Section with Welcome Message -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="welcome-text">
            <h1 class="hero-title">
              안녕하세요, <span class="text-primary">{{ userInfo.fullName || '학생' }}</span>님!
            </h1>
            <p class="hero-subtitle">
              오늘도 열심히 공부해요! 당신의 학습 여정을 응원합니다.
            </p>
          </div>
          <div class="hero-illustration">
            <div class="floating-book">📚</div>
            <div class="floating-star star-1">⭐</div>
            <div class="floating-star star-2">✨</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Stats Section -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon completed">
              <i class="bi bi-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.completedExams || 0 }}</div>
              <div class="stat-label">완료한 시험</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon pending">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingExams || 0 }}</div>
              <div class="stat-label">대기 중인 시험</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon score">
              <i class="bi bi-graph-up"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.averageScore || 0 }}점</div>
              <div class="stat-label">평균 점수</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon rank">
              <i class="bi bi-trophy"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.classRank || '-' }}등</div>
              <div class="stat-label">반 순위</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Features Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">학습 도구</h2>
        <div class="features-grid">
          
          <!-- CBT 문제은행 -->
          <router-link to="/student/cbt/step01" class="feature-card">
            <div class="feature-header">
              <div class="feature-icon primary">
                <i class="bi bi-journal-text"></i>
              </div>
              <span class="feature-badge new">NEW</span>
            </div>
            <h3 class="feature-title">문제은행 CBT</h3>
            <p class="feature-description">
              15,000+ 검증된 문제로 실력을 향상시키세요. 과목별, 단원별로 체계적으로 분류된 문제를 풀어보세요.
            </p>
            <div class="feature-stats">
              <span class="stat-item">
                <i class="bi bi-database"></i> 15,000+ 문제
              </span>
              <span class="stat-item">
                <i class="bi bi-patch-check"></i> 검증된 문제
              </span>
            </div>
            <div class="feature-action">
              문제 풀기 <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- 우리반 시험 -->
          <router-link to="/student/class-room/my-class" class="feature-card">
            <div class="feature-header">
              <div class="feature-icon success">
                <i class="bi bi-people"></i>
              </div>
              <span class="feature-badge hot">HOT</span>
            </div>
            <h3 class="feature-title">똑똑한 우리반</h3>
            <p class="feature-description">
              실시간으로 진행되는 우리반 시험에 참여하세요. 선생님과 함께 공정한 온라인 시험을 경험할 수 있습니다.
            </p>
            <div class="feature-stats">
              <span class="stat-item">
                <i class="bi bi-broadcast"></i> 실시간 시험
              </span>
              <span class="stat-item">
                <i class="bi bi-shield-check"></i> 공정한 평가
              </span>
            </div>
            <div class="feature-action">
              반 입장하기 <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- 성적 분석 -->
          <router-link to="/student/report" class="feature-card">
            <div class="feature-header">
              <div class="feature-icon warning">
                <i class="bi bi-graph-up-arrow"></i>
              </div>
            </div>
            <h3 class="feature-title">시험 성적 분석</h3>
            <p class="feature-description">
              상세한 성적 분석과 문항별 리포트로 약점을 파악하고 학습 전략을 세우세요.
            </p>
            <div class="feature-stats">
              <span class="stat-item">
                <i class="bi bi-bar-chart"></i> 성적 추이
              </span>
              <span class="stat-item">
                <i class="bi bi-clipboard-data"></i> 문항 분석
              </span>
            </div>
            <div class="feature-action">
              리포트 보기 <i class="bi bi-arrow-right"></i>
            </div>
          </router-link>

          <!-- 학습 자료 -->
          <div class="feature-card disabled">
            <div class="feature-header">
              <div class="feature-icon secondary">
                <i class="bi bi-book"></i>
              </div>
              <span class="feature-badge coming">COMING</span>
            </div>
            <h3 class="feature-title">학습 자료실</h3>
            <p class="feature-description">
              선생님이 공유한 학습 자료와 참고 문서를 확인하고 다운로드할 수 있습니다.
            </p>
            <div class="feature-stats">
              <span class="stat-item">
                <i class="bi bi-file-earmark-pdf"></i> PDF 자료
              </span>
              <span class="stat-item">
                <i class="bi bi-camera-video"></i> 동영상 강의
              </span>
            </div>
            <div class="feature-action">
              준비 중 <i class="bi bi-lock"></i>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Recent Activities -->
    <section class="activities-section">
      <div class="container">
        <div class="activities-header">
          <h2 class="section-title">최근 활동</h2>
          <router-link to="/student/activities" class="view-all-link">
            전체 보기 <i class="bi bi-arrow-right"></i>
          </router-link>
        </div>
        
        <div class="activities-grid">
          <div class="activity-card" v-for="activity in recentActivities" :key="activity.id">
            <div class="activity-icon" :class="activity.type">
              <i :class="getActivityIcon(activity.type)"></i>
            </div>
            <div class="activity-content">
              <h4 class="activity-title">{{ activity.title }}</h4>
              <p class="activity-description">{{ activity.description }}</p>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>
          
          <div v-if="!recentActivities.length" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>아직 활동 내역이 없습니다.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import studentApi from '@/services/studentApi'

// 사용자 정보
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// 통계 데이터
const stats = ref({
  completedExams: 0,
  pendingExams: 0,
  averageScore: 0,
  classRank: '-'
})

// 최근 활동
const recentActivities = ref([])

// 활동 타입별 아이콘
const getActivityIcon = (type) => {
  const icons = {
    exam_completed: 'bi bi-check-circle',
    exam_assigned: 'bi bi-clipboard',
    score_improved: 'bi bi-graph-up',
    achievement: 'bi bi-trophy'
  }
  return icons[type] || 'bi bi-circle'
}

// 시간 포맷
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}일 전`
  if (hours > 0) return `${hours}시간 전`
  if (minutes > 0) return `${minutes}분 전`
  return '방금 전'
}

// 데이터 로드
const loadDashboardData = async () => {
  try {
    // TODO: API 호출로 실제 데이터 로드
    // const response = await studentApi.getDashboardStats()
    // stats.value = response.data
    
    // 임시 데이터
    stats.value = {
      completedExams: 12,
      pendingExams: 3,
      averageScore: 85,
      classRank: 5
    }
    
    recentActivities.value = [
      {
        id: 1,
        type: 'exam_completed',
        title: '중간고사 수학 완료',
        description: '85점 획득',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: 2,
        type: 'exam_assigned',
        title: '새로운 시험 배정',
        description: '영어 단원평가가 배정되었습니다',
        timestamp: new Date(Date.now() - 7200000)
      }
    ]
  } catch (error) {
    console.error('대시보드 데이터 로드 실패:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.student-dashboard {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 3rem;
}

/* Hero Section */
.hero-section {
  padding: 3rem 0 2rem;
  background: #2563eb;
  color: white;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.hero-title .text-primary {
  color: rgba(255, 255, 255, 0.95);
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.95;
}

.hero-illustration {
  position: relative;
  width: 200px;
  height: 150px;
}

.floating-book {
  font-size: 4rem;
  animation: float 3s ease-in-out infinite;
}

.floating-star {
  position: absolute;
  font-size: 1.5rem;
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 {
  top: 10px;
  right: 20px;
  animation-delay: 0.5s;
}

.star-2 {
  bottom: 20px;
  left: 30px;
  animation-delay: 1s;
}

/* Stats Section */
.stats-section {
  padding: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.completed {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.pending {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-icon.score {
  background: #ecfdf5;
  color: #10b981;
}

.stat-icon.rank {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
}

/* Features Section */
.features-section {
  padding: 3rem 0;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 1.75rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #2563eb;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.feature-card:hover::before {
  transform: translateX(0);
}

.feature-card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
  transform: translateY(-2px);
}

.feature-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: #eff6ff;
  color: #2563eb;
}

.feature-icon.primary {
  background: #eff6ff;
  color: #2563eb;
}

.feature-icon.success {
  background: #eff6ff;
  color: #2563eb;
}

.feature-icon.warning {
  background: #eff6ff;
  color: #2563eb;
}

.feature-icon.secondary {
  background: #f8fafc;
  color: #64748b;
}

.feature-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background: #f1f5f9;
  color: #475569;
}

.feature-badge.new {
  background: #dbeafe;
  color: #2563eb;
}

.feature-badge.hot {
  background: #fee2e2;
  color: #dc2626;
}

.feature-badge.coming {
  background: #f1f5f9;
  color: #64748b;
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.feature-description {
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.25rem;
  flex-grow: 1;
  font-size: 0.875rem;
}

.feature-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.8125rem;
}

.feature-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.feature-card:hover .feature-action {
  color: #1d4ed8;
}

/* Activities Section */
.activities-section {
  padding: 3rem 0;
}

.activities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-all-link {
  color: #64748b;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.view-all-link:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.activities-grid {
  display: grid;
  gap: 1rem;
}

.activity-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  border: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.activity-card:hover {
  background: #f8fafc;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: #eff6ff;
  color: #2563eb;
}

.activity-icon.exam_completed {
  background: #eff6ff;
  color: #2563eb;
}

.activity-icon.exam_assigned {
  background: #eff6ff;
  color: #2563eb;
}

.activity-icon.score_improved {
  background: #eff6ff;
  color: #2563eb;
}

.activity-icon.achievement {
  background: #eff6ff;
  color: #2563eb;
}

.activity-content {
  flex-grow: 1;
}

.activity-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.activity-description {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.activity-time {
  color: #a0aec0;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.empty-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

/* Animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-illustration {
    margin-top: 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .activities-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>