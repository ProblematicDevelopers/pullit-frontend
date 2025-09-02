<template>
  <div class="teacher-grade-stats">
    <!-- 클래스 성적 개요 섹션 -->
    <div class="overview-section">
      <h2 class="section-title">클래스 성적 개요</h2>
      
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">{{ overview.totalStudents || 0 }}</div>
          <div class="stat-label">전체 학생 수</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ overview.totalExams || 0 }}</div>
          <div class="stat-label">시행 시험 수</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatScore(overview.classAverageScore) }}</div>
          <div class="stat-label">반 평균 점수</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatScore(overview.classMedianScore) }}</div>
          <div class="stat-label">중간값</div>
        </div>
      </div>

      <!-- 성적 분포 차트 -->
      <div class="distribution-chart" v-if="overview.gradeDistribution">
        <h3>성적 등급별 분포</h3>
        <canvas ref="gradeChart"></canvas>
      </div>
    </div>

    <!-- 학생별 성적 목록 -->
    <div class="students-section">
      <div class="section-header">
        <h2 class="section-title">학생별 성적</h2>
        <div class="filters">
          <select v-model="selectedExam" @change="loadStudentGrades" class="exam-filter">
            <option value="">전체 시험</option>
            <option v-for="exam in exams" :key="exam.examId" :value="exam.examId">
              {{ exam.examName }}
            </option>
          </select>
        </div>
      </div>

      <div class="students-table-wrapper">
        <table class="students-table">
          <thead>
            <tr>
              <th @click="sortBy('studentNo')">
                학번 <span class="sort-icon">{{ getSortIcon('studentNo') }}</span>
              </th>
              <th @click="sortBy('studentName')">
                이름 <span class="sort-icon">{{ getSortIcon('studentName') }}</span>
              </th>
              <th @click="sortBy('averageScore')">
                평균 점수 <span class="sort-icon">{{ getSortIcon('averageScore') }}</span>
              </th>
              <th @click="sortBy('totalExamsTaken')">
                응시 횟수 <span class="sort-icon">{{ getSortIcon('totalExamsTaken') }}</span>
              </th>
              <th @click="sortBy('classRank')">
                등수 <span class="sort-icon">{{ getSortIcon('classRank') }}</span>
              </th>
              <th @click="sortBy('percentile')">
                백분위 <span class="sort-icon">{{ getSortIcon('percentile') }}</span>
              </th>
              <th>성적 추이</th>
              <th>상세보기</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in sortedStudents" :key="student.studentId">
              <td>{{ student.studentNo }}</td>
              <td>{{ student.studentName }}</td>
              <td>
                <span class="score-badge">{{ formatScore(student.averageScore) }}</span>
              </td>
              <td>{{ student.totalExamsTaken || 0 }}회</td>
              <td>
                <span class="rank-badge">{{ student.classRank || '-' }}등</span>
              </td>
              <td>{{ formatPercentile(student.percentile) }}</td>
              <td>
                <span :class="getTrendClass(student.trend)">
                  {{ getTrendIcon(student.trend) }} {{ getTrendText(student.trend) }}
                </span>
              </td>
              <td>
                <button @click="showStudentDetail(student.studentId)" class="detail-btn">
                  상세
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 학생 상세 모달 -->
    <StudentDetailModal
      v-if="showDetailModal"
      :studentId="selectedStudentId"
      :classId="classId"
      @close="showDetailModal = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import StudentDetailModal from './StudentDetailModal.vue'
import api from '@/services/api'
import classApi from '@/services/classApi'

export default {
  name: 'TeacherGradeStats',
  components: {
    StudentDetailModal
  },
  props: {
    classId: {
      type: [Number, String],
      required: true
    }
  },
  setup(props) {
    const overview = ref({})
    const students = ref([])
    const exams = ref([])
    const selectedExam = ref('')
    const sortField = ref('classRank')
    const sortOrder = ref('asc')
    const showDetailModal = ref(false)
    const selectedStudentId = ref(null)
    const gradeChart = ref(null)
    let chartInstance = null

    // 클래스 개요 데이터 로드
    const loadClassOverview = async () => {
      try {
        // 시험별 통계 데이터 가져오기
        const [statsLineResponse, statsDetailResponse] = await Promise.all([
          classApi.getStatsLines(props.classId),
          classApi.getStatsDetail(props.classId)
        ])
        
        const statsLines = statsLineResponse.data.data
        const statsDetails = statsDetailResponse.data.data
        
        // 개요 데이터 구성
        if (statsLines && statsLines.length > 0) {
          // 전체 평균 계산
          const totalAverage = statsLines.reduce((sum, exam) => sum + exam.avgPoints, 0) / statsLines.length
          const totalExams = statsLines.length
          
          // 시험 목록 구성
          exams.value = statsLines.map(exam => ({
            examId: exam.examId,
            examName: exam.examName,
            examDate: new Date(),
            averageScore: exam.avgPoints,
            participantCount: statsDetails.find(d => d.examId === exam.examId)?.totalStudents || 0
          }))
          
          // 성적 분포 계산 (백분위 기준)
          let gradeDistribution = {
            excellent: 0,    // 90-100
            good: 0,         // 80-89
            average: 0,      // 70-79
            belowAverage: 0, // 60-69
            poor: 0          // 0-59
          }
          
          // 각 시험의 평균 점수를 기준으로 분포 계산
          statsLines.forEach(exam => {
            const percentage = (exam.avgPoints / exam.totalPoints) * 100
            if (percentage >= 90) gradeDistribution.excellent++
            else if (percentage >= 80) gradeDistribution.good++
            else if (percentage >= 70) gradeDistribution.average++
            else if (percentage >= 60) gradeDistribution.belowAverage++
            else gradeDistribution.poor++
          })
          
          overview.value = {
            totalStudents: statsDetails[0]?.totalStudents || 0,
            totalExams: totalExams,
            // keep raw numbers; format in UI helpers
            classAverageScore: Number(totalAverage),
            classMedianScore: statsDetails[0]?.median || 0,
            gradeDistribution: gradeDistribution,
            recentExams: exams.value
          }
        } else {
          // 데이터가 없을 경우 기본값
          overview.value = {
            totalStudents: 0,
            totalExams: 0,
            classAverageScore: 0,
            classMedianScore: 0,
            gradeDistribution: {
              excellent: 0,
              good: 0,
              average: 0,
              belowAverage: 0,
              poor: 0
            },
            recentExams: []
          }
        }
        
        // 차트 그리기
        if (overview.value.gradeDistribution) {
          drawGradeChart()
        }
      } catch (error) {
        console.error('Failed to load class overview:', error)
        // 개발 중 임시 데이터 (401 에러 등)
        overview.value = {
          totalStudents: 25,
          totalExams: 5,
          classAverageScore: 78.5,
          classMedianScore: 80.0,
          gradeDistribution: {
            excellent: 5,
            good: 8,
            average: 7,
            belowAverage: 3,
            poor: 2
          },
          recentExams: [
            { examId: 1, examName: '중간고사', examDate: new Date(), averageScore: 75.2, participantCount: 24 },
            { examId: 2, examName: '단원평가', examDate: new Date(), averageScore: 82.1, participantCount: 25 }
          ]
        }
        exams.value = overview.value.recentExams
        drawGradeChart()
      }
    }

    // 학생별 성적 데이터 로드
    const loadStudentGrades = async () => {
      try {
        const params = selectedExam.value ? { examId: selectedExam.value } : {}
        const response = await api.get(
          `/teacher/stats/class/${props.classId}/students`,
          { params }
        )
        students.value = response.data.data
      } catch (error) {
        console.error('Failed to load student grades:', error)
        // 개발 중 임시 데이터
        students.value = [
          {
            studentId: 1,
            studentName: '김민수',
            studentNo: '20240001',
            averageScore: 85.5,
            totalExamsTaken: 5,
            classRank: 3,
            percentile: 88.0,
            trend: 'IMPROVING'
          },
          {
            studentId: 2,
            studentName: '이영희',
            studentNo: '20240002',
            averageScore: 92.3,
            totalExamsTaken: 5,
            classRank: 1,
            percentile: 96.0,
            trend: 'STABLE'
          },
          {
            studentId: 3,
            studentName: '박철수',
            studentNo: '20240003',
            averageScore: 78.2,
            totalExamsTaken: 5,
            classRank: 8,
            percentile: 68.0,
            trend: 'DECLINING'
          },
          {
            studentId: 4,
            studentName: '정수진',
            studentNo: '20240004',
            averageScore: 88.7,
            totalExamsTaken: 5,
            classRank: 2,
            percentile: 92.0,
            trend: 'IMPROVING'
          },
          {
            studentId: 5,
            studentName: '최동현',
            studentNo: '20240005',
            averageScore: 73.5,
            totalExamsTaken: 5,
            classRank: 15,
            percentile: 40.0,
            trend: 'STABLE'
          }
        ]
      }
    }

    // 성적 분포 차트 그리기
    const drawGradeChart = () => {
      if (chartInstance) {
        chartInstance.destroy()
      }

      const ctx = gradeChart.value?.getContext('2d')
      if (!ctx) return

      const distribution = overview.value.gradeDistribution
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['90-100 (A)', '80-89 (B)', '70-79 (C)', '60-69 (D)', '0-59 (F)'],
          datasets: [{
            label: '학생 수',
            data: [
              distribution.excellent || 0,
              distribution.good || 0,
              distribution.average || 0,
              distribution.belowAverage || 0,
              distribution.poor || 0
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(251, 146, 60, 0.8)',
              'rgba(251, 191, 36, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
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
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      })
    }

    // 정렬된 학생 목록
    const sortedStudents = computed(() => {
      return [...students.value].sort((a, b) => {
        const aVal = a[sortField.value] || 0
        const bVal = b[sortField.value] || 0
        
        if (sortOrder.value === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    })

    // 정렬 기능
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortOrder.value = 'asc'
      }
    }

    // 정렬 아이콘
    const getSortIcon = (field) => {
      if (sortField.value !== field) return '↕'
      return sortOrder.value === 'asc' ? '↑' : '↓'
    }

    // 점수 포맷팅
    const formatScore = (score) => {
      if (score === null || score === undefined) return '-'
      const n = typeof score === 'number' ? score : Number(score)
      if (!Number.isFinite(n)) return '-'
      return n.toFixed(1)
    }

    // 백분위 포맷팅
    const formatPercentile = (percentile) => {
      if (percentile === null || percentile === undefined) return '-'
      const n = typeof percentile === 'number' ? percentile : Number(percentile)
      if (!Number.isFinite(n)) return '-'
      return `상위 ${(100 - n).toFixed(1)}%`
    }

    // 성적 추이 클래스
    const getTrendClass = (trend) => {
      return {
        'trend-up': trend === 'IMPROVING',
        'trend-down': trend === 'DECLINING',
        'trend-stable': trend === 'STABLE' || !trend
      }
    }

    // 성적 추이 아이콘
    const getTrendIcon = (trend) => {
      if (trend === 'IMPROVING') return '↑'
      if (trend === 'DECLINING') return '↓'
      return '→'
    }

    // 성적 추이 텍스트
    const getTrendText = (trend) => {
      if (trend === 'IMPROVING') return '상승'
      if (trend === 'DECLINING') return '하락'
      return '유지'
    }

    // 학생 상세 보기
    const showStudentDetail = (studentId) => {
      selectedStudentId.value = studentId
      showDetailModal.value = true
    }

    // 컴포넌트 마운트시 데이터 로드
    onMounted(() => {
      loadClassOverview()
      loadStudentGrades()
    })

    // classId 변경 감지
    watch(() => props.classId, () => {
      loadClassOverview()
      loadStudentGrades()
    })

    return {
      overview,
      students,
      exams,
      selectedExam,
      sortedStudents,
      showDetailModal,
      selectedStudentId,
      gradeChart,
      loadStudentGrades,
      sortBy,
      getSortIcon,
      formatScore,
      formatPercentile,
      getTrendClass,
      getTrendIcon,
      getTrendText,
      showStudentDetail
    }
  }
}
</script>

<style scoped>
.teacher-grade-stats {
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100vh;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 20px;
}

/* 통계 카드 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

/* 차트 섹션 */
.distribution-chart {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.distribution-chart h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #374151;
}

.distribution-chart canvas {
  max-height: 300px;
}

/* 학생 섹션 */
.students-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.exam-filter {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
}

/* 테이블 스타일 */
.students-table-wrapper {
  overflow-x: auto;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th {
  background-color: #f3f4f6;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.students-table th:hover {
  background-color: #e5e7eb;
}

.sort-icon {
  margin-left: 4px;
  color: #9ca3af;
}

.students-table td {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  color: #374151;
}

.students-table tbody tr:hover {
  background-color: #f9fafb;
}

/* 배지 스타일 */
.score-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-weight: 600;
}

.rank-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-weight: 600;
}

/* 추이 스타일 */
.trend-up {
  color: #10b981;
  font-weight: 600;
}

.trend-down {
  color: #ef4444;
  font-weight: 600;
}

.trend-stable {
  color: #6b7280;
}

/* 상세 버튼 */
.detail-btn {
  padding: 6px 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.detail-btn:hover {
  background-color: #2563eb;
}
</style>
