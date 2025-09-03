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
      <div class="distribution-chart">
        <h3>성적 등급별 분포</h3>
        <template v-if="hasDistributionData">
          <canvas ref="gradeChart"></canvas>
        </template>
        <template v-else>
          <div class="empty-state">분포 데이터가 없습니다.</div>
        </template>
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
          <tbody v-if="sortedStudents.length > 0">
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
          <tbody v-else>
            <tr>
              <td colspan="8" style="text-align:center; color:#6b7280; padding:24px;">
                학생 성적 데이터가 없습니다.
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
import { teacherStatsAPI } from '@/services/api'

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
        // 교사 성적 통계 API에서 클래스 개요 데이터 가져오기
        const overviewResponse = await teacherStatsAPI.getClassOverview(props.classId)
        
        if (overviewResponse.data.success) {
          const data = overviewResponse.data.data
          
          // 개요 데이터 설정
          overview.value = {
            totalStudents: data.totalStudents || 0,
            totalExams: data.totalExams || 0,
            classAverageScore: data.classAverageScore || 0,
            classMedianScore: data.classMedianScore || 0,
            gradeDistribution: data.gradeDistribution || {
              excellent: 0,
              good: 0,
              average: 0,
              belowAverage: 0,
              poor: 0
            },
            recentExams: data.recentExams || []
          }
          
          // 시험 목록 설정
          exams.value = data.recentExams || []
          
          // 차트 그리기 (실데이터가 있을 때만)
          if (hasDistributionData.value) {
            drawGradeChart()
          }
          return
        }
        // 성공이 아니면 빈 상태로 처리
        overview.value = getEmptyOverview()
        exams.value = []
      } catch (error) {
        console.error('Failed to load class overview:', error)
        // 에러 발생 시 빈 데이터로 초기화 (더미 데이터 제거)
        overview.value = getEmptyOverview()
        exams.value = []
        
        // 사용자에게 에러 메시지 표시 (옵션)
        // alert('성적 데이터를 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.')
      }
    }

    // 학생별 성적 데이터 로드
    const loadStudentGrades = async () => {
      try {
        // 교사 성적 통계 API 사용
        const response = await teacherStatsAPI.getStudentsGrades(props.classId, selectedExam.value)
        
        if (response.data.success) {
          students.value = response.data.data || []
        } else {
          // API 응답이 실패한 경우
          console.warn('API returned unsuccessful response:', response.data)
          students.value = []
        }
      } catch (error) {
        console.error('Failed to load student grades:', error)
        // 에러 발생 시 빈 배열로 초기화 (더미 데이터 제거)
        students.value = []
        
        // 에러가 401(인증) 또는 403(권한) 문제가 아닌 경우에만 알림
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          console.error('학생 성적 데이터 로드 실패:', error.message)
        }
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

    // 분포 데이터 존재 여부
    const hasDistributionData = computed(() => {
      const d = overview.value?.gradeDistribution
      if (!d) return false
      const sum = (d.excellent || 0) + (d.good || 0) + (d.average || 0) + (d.belowAverage || 0) + (d.poor || 0)
      return sum > 0
    })

    // 빈 개요 데이터 생성기
    const getEmptyOverview = () => ({
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
      showStudentDetail,
      hasDistributionData
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

.empty-state {
  text-align: center;
  color: #6b7280;
  padding: 24px 0;
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
