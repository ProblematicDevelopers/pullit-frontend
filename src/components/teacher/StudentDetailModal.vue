<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>학생 성적 상세</h2>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      
      <div v-if="loading" class="loading">
        데이터를 불러오는 중...
      </div>
      
      <div v-else-if="studentDetail" class="modal-body">
        <!-- 학생 기본 정보 -->
        <div class="student-info">
          <h3>학생 정보</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">이름:</span>
              <span class="value">{{ studentDetail.studentName }}</span>
            </div>
            <div class="info-item">
              <span class="label">학번:</span>
              <span class="value">{{ studentDetail.studentNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">학년:</span>
              <span class="value">{{ studentDetail.grade }}</span>
            </div>
            <div class="info-item">
              <span class="label">학교:</span>
              <span class="value">{{ studentDetail.schoolName || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 성적 요약 -->
        <div class="grade-summary">
          <h3>성적 요약</h3>
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-value">{{ formatScore(studentDetail.summary?.overallAverage) }}</div>
              <div class="card-label">전체 평균</div>
            </div>
            <div class="summary-card">
              <div class="card-value">{{ studentDetail.summary?.totalExamsTaken || 0 }}회</div>
              <div class="card-label">시험 응시</div>
            </div>
            <div class="summary-card">
              <div class="card-value">{{ formatRank(studentDetail.summary?.averageRank) }}</div>
              <div class="card-label">평균 등수</div>
            </div>
            <div class="summary-card">
              <div class="card-value">{{ studentDetail.summary?.overallGrade || '-' }}</div>
              <div class="card-label">전체 등급</div>
            </div>
          </div>
        </div>

        <!-- 시험 이력 -->
        <div class="exam-history">
          <h3>시험 이력</h3>
          <div class="history-chart">
            <canvas ref="scoreChart"></canvas>
          </div>
          
          <table class="history-table">
            <thead>
              <tr>
                <th>시험명</th>
                <th>날짜</th>
                <th>점수</th>
                <th>백분율</th>
                <th>등수</th>
                <th>소요시간</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="exam in studentDetail.examHistory" :key="exam.examId">
                <td>{{ exam.examName }}</td>
                <td>{{ formatDate(exam.examDate) }}</td>
                <td>{{ exam.score }}/{{ exam.totalPoints }}</td>
                <td>
                  <span class="percentage-badge">{{ formatPercentage(exam.percentage) }}</span>
                </td>
                <td>{{ exam.rank }}/{{ exam.totalStudents }}</td>
                <td>{{ formatTime(exam.timeTaken) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 성과 분석 -->
        <div v-if="studentDetail.analysis" class="performance-analysis">
          <h3>성과 분석</h3>
          <div class="analysis-content">
            <div class="analysis-item">
              <strong>성적 추이:</strong>
              <span :class="getTrendClass(studentDetail.analysis.trend)">
                {{ getTrendText(studentDetail.analysis.trend) }}
                ({{ formatTrendScore(studentDetail.analysis.trendScore) }})
              </span>
            </div>
            <div class="analysis-item">
              <strong>강점:</strong>
              <span>{{ studentDetail.analysis.strengths?.join(', ') || '-' }}</span>
            </div>
            <div class="analysis-item">
              <strong>개선점:</strong>
              <span>{{ studentDetail.analysis.weaknesses?.join(', ') || '-' }}</span>
            </div>
            <div class="analysis-item">
              <strong>권장사항:</strong>
              <span>{{ studentDetail.analysis.recommendation || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import api from '@/services/api'
import classApi from '@/services/classApi'

export default {
  name: 'StudentDetailModal',
  props: {
    studentId: {
      type: [Number, String],
      required: true
    },
    classId: {
      type: [Number, String],
      required: true
    }
  },
  emits: ['close'],
  setup(props) {
    const studentDetail = ref(null)
    const loading = ref(true)
    const scoreChart = ref(null)
    let chartInstance = null

    // 학생 상세 정보 로드
    const loadStudentDetail = async () => {
      loading.value = true
      try {
        const response = await api.get(
          `/teacher/stats/class/${props.classId}/student/${props.studentId}`
        )
        studentDetail.value = response.data.data
        
        // 차트 그리기
        if (studentDetail.value.examHistory && studentDetail.value.examHistory.length > 0) {
          setTimeout(() => drawScoreChart(), 100)
        }
      } catch (error) {
        console.error('Failed to load student detail:', error)
        // 개발 중 임시 데이터
        studentDetail.value = {
          studentId: props.studentId,
          studentName: '김민수',
          studentNo: '20240001',
          grade: '고1',
          schoolName: '서울고등학교',
          summary: {
            overallAverage: 85.5,
            totalExamsTaken: 5,
            averageRank: 3,
            averagePercentile: 88.0,
            overallGrade: 'B',
            highestScore: 95,
            lowestScore: 72
          },
          examHistory: [
            {
              examId: 1,
              examName: '1차 중간고사',
              examDate: new Date('2024-03-15'),
              score: 85,
              totalPoints: 100,
              percentage: 85,
              rank: 5,
              totalStudents: 25,
              percentile: 80,
              timeTaken: 45
            },
            {
              examId: 2,
              examName: '단원평가 1',
              examDate: new Date('2024-04-10'),
              score: 92,
              totalPoints: 100,
              percentage: 92,
              rank: 2,
              totalStudents: 25,
              percentile: 92,
              timeTaken: 40
            },
            {
              examId: 3,
              examName: '1차 기말고사',
              examDate: new Date('2024-05-20'),
              score: 88,
              totalPoints: 100,
              percentage: 88,
              rank: 3,
              totalStudents: 25,
              percentile: 88,
              timeTaken: 50
            },
            {
              examId: 4,
              examName: '2차 중간고사',
              examDate: new Date('2024-09-15'),
              score: 95,
              totalPoints: 100,
              percentage: 95,
              rank: 1,
              totalStudents: 25,
              percentile: 96,
              timeTaken: 42
            },
            {
              examId: 5,
              examName: '단원평가 2',
              examDate: new Date('2024-10-10'),
              score: 72,
              totalPoints: 100,
              percentage: 72,
              rank: 8,
              totalStudents: 25,
              percentile: 68,
              timeTaken: 38
            }
          ],
          analysis: {
            trend: 'IMPROVING',
            trendScore: 5.2,
            strengths: ['문제 해결 능력', '시간 관리'],
            weaknesses: ['응용 문제', '서술형 답안'],
            recommendation: '기초 개념 복습 후 응용 문제 연습 권장'
          }
        }
        
        // 차트 그리기
        if (studentDetail.value.examHistory && studentDetail.value.examHistory.length > 0) {
          setTimeout(() => drawScoreChart(), 100)
        }
      } finally {
        loading.value = false
      }
    }

    // 점수 추이 차트 그리기
    const drawScoreChart = () => {
      if (chartInstance) {
        chartInstance.destroy()
      }

      const ctx = scoreChart.value?.getContext('2d')
      if (!ctx) return

      const history = studentDetail.value.examHistory
      const labels = history.map(exam => 
        new Date(exam.examDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      )
      const scores = history.map(exam => exam.percentage)

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '점수 (%)',
            data: scores,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%'
                }
              }
            }
          }
        }
      })
    }

    // 포맷팅 함수들
    const formatScore = (score) => {
      if (score === null || score === undefined) return '-'
      const n = typeof score === 'number' ? score : Number(score)
      if (!Number.isFinite(n)) return '-'
      return n.toFixed(1)
    }

    const formatRank = (rank) => {
      if (!rank) return '-'
      return Math.round(rank) + '등'
    }

    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('ko-KR')
    }

    const formatPercentage = (percentage) => {
      if (percentage === null || percentage === undefined) return '-'
      const n = typeof percentage === 'number' ? percentage : Number(percentage)
      if (!Number.isFinite(n)) return '-'
      return n.toFixed(1) + '%'
    }

    const formatTime = (minutes) => {
      if (!minutes) return '-'
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0) {
        return `${hours}시간 ${mins}분`
      }
      return `${mins}분`
    }

    const formatTrendScore = (score) => {
      if (score === null || score === undefined) return ''
      const n = typeof score === 'number' ? score : Number(score)
      if (!Number.isFinite(n)) return ''
      const sign = n > 0 ? '+' : ''
      return `${sign}${n.toFixed(1)}%`
    }

    const getTrendClass = (trend) => {
      return {
        'trend-up': trend === 'IMPROVING',
        'trend-down': trend === 'DECLINING',
        'trend-stable': trend === 'STABLE'
      }
    }

    const getTrendText = (trend) => {
      if (trend === 'IMPROVING') return '상승 추세'
      if (trend === 'DECLINING') return '하락 추세'
      return '유지'
    }

    onMounted(() => {
      loadStudentDetail()
    })

    return {
      studentDetail,
      loading,
      scoreChart,
      formatScore,
      formatRank,
      formatDate,
      formatPercentage,
      formatTime,
      formatTrendScore,
      getTrendClass,
      getTrendText
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
}

.loading {
  padding: 60px;
  text-align: center;
  color: #6b7280;
}

.modal-body {
  padding: 20px;
}

/* 학생 정보 섹션 */
.student-info {
  margin-bottom: 24px;
}

.student-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-item .label {
  color: #6b7280;
}

.info-item .value {
  color: #111827;
  font-weight: 500;
}

/* 성적 요약 섹션 */
.grade-summary {
  margin-bottom: 24px;
}

.grade-summary h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.summary-card {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 4px;
}

.card-label {
  font-size: 12px;
  color: #6b7280;
}

/* 시험 이력 섹션 */
.exam-history {
  margin-bottom: 24px;
}

.exam-history h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.history-chart {
  height: 200px;
  margin-bottom: 20px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  background-color: #f3f4f6;
  padding: 8px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.history-table td {
  padding: 8px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #374151;
}

.percentage-badge {
  display: inline-block;
  padding: 2px 6px;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

/* 성과 분석 섹션 */
.performance-analysis {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.performance-analysis h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  font-size: 14px;
}

.analysis-item strong {
  color: #374151;
  margin-right: 8px;
}

.analysis-item span {
  color: #6b7280;
}

.trend-up {
  color: #10b981 !important;
  font-weight: 600;
}

.trend-down {
  color: #ef4444 !important;
  font-weight: 600;
}

.trend-stable {
  color: #6b7280 !important;
}
</style>
