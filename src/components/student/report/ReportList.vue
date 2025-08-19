<template>
  <div class="report-list-container">
    <!-- 검색 및 필터 영역 -->
    <div class="search-filter-section">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="시험 제목을 검색하세요..."
          class="search-input"
        />
        <button @click="clearSearch" class="clear-btn" v-if="searchQuery">✕</button>
      </div>

      <div class="filter-buttons">
        <button
          @click="setFilter('all')"
          :class="['filter-btn', { active: currentFilter === 'all' }]"
        >
          전체
        </button>
        <button
          @click="setFilter('수학')"
          :class="['filter-btn', { active: currentFilter === '수학' }]"
        >
          수학
        </button>
        <button
          @click="setFilter('영어')"
          :class="['filter-btn', { active: currentFilter === '영어' }]"
        >
          영어
        </button>
        <button
          @click="setFilter('국어')"
          :class="['filter-btn', { active: currentFilter === '국어' }]"
        >
          국어
        </button>
        <button
          @click="setFilter('과학')"
          :class="['filter-btn', { active: currentFilter === '과학' }]"
        >
          과학
        </button>
        <button
          @click="setFilter('사회')"
          :class="['filter-btn', { active: currentFilter === '사회' }]"
        >
          사회
        </button>
      </div>
    </div>

    <!-- 결과 개수 표시 -->
    <div class="result-info">
      <span>총 {{ filteredItems.length }}개의 시험</span>
    </div>

    <div
      v-for="(item, index) in paginatedItems"
      :key="item.id"
      class="list-item"
      @click="goToReport(item.id, item.attemptId)"
    >
      <div class="left">
        <div class="num">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</div>
        <div class="info">
          <span class="tag">{{ item.subject }}</span>
          <span class="title">{{ item.title }}</span>
          <span class="sub">{{ item.grade }} 사용 {{ item.usage }}회</span>
        </div>
      </div>
      <div class="right"><a @click.stop="goToReport(item.id, item.attemptId)">자세히 보기</a></div>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn prev-btn">
        이전
      </button>

      <div class="page-numbers">
        <button
          v-for="page in pageNumbers"
          :key="page"
          @click="goToPage(page)"
          :class="['page-btn', { active: page === currentPage, disabled: page === '...' }]"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
      </div>

      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn next-btn">
        다음
      </button>
    </div>
  </div>
</template>

<script>
import examApi from '@/services/examApi.js'

export default {
  name: 'ReportList',
  components: 'BasicReport',
  data() {
    return {
      items: [
        {
          id: 1,
          attemptId: 101,
          userId: 1,
          subject: '수학',
          title: '2024년 1학기 중간고사',
          grade: '고등학교 1학년',
          usage: 1,
          status: 'completed',
          score: 17,
          totalQuestions: 20,
          type: 'exam',
        },
        {
          id: 2,
          attemptId: 102,
          userId: 1,
          subject: '영어',
          title: '2024년 1학기 중간고사',
          grade: '고등학교 1학년',
          usage: 2,
          status: 'completed',
          score: 23,
          totalQuestions: 25,
          type: 'exam',
        },
        {
          id: 3,
          attemptId: null,
          userId: 1,
          subject: '과학',
          title: '2024년 1학기 중간고사',
          grade: '고등학교 1학년',
          usage: 0,
          status: 'not_started',
          score: null,
          totalQuestions: 30,
          type: 'cbt',
        },
        {
          id: 4,
          attemptId: 104,
          userId: 1,
          subject: '국어',
          title: '2024년 1학기 중간고사',
          grade: '고등학교 1학년',
          usage: 1,
          status: 'completed',
          score: 17,
          totalQuestions: 22,
          type: 'exam',
        },
        {
          id: 5,
          attemptId: null,
          userId: 1,
          subject: '사회',
          title: '2024년 1학기 중간고사',
          grade: '고등학교 1학년',
          usage: 0,
          status: 'not_started',
          score: null,
          totalQuestions: 28,
          type: 'cbt',
        },
        {
          id: 6,
          attemptId: 106,
          userId: 1,
          subject: '수학',
          title: '2024년 1학기 기말고사',
          grade: '고등학교 1학년',
          usage: 1,
          status: 'completed',
          score: 22,
          totalQuestions: 25,
          type: 'exam',
        },
        {
          id: 7,
          attemptId: 104,
          userId: 1,
          subject: '영어',
          title: '2024년 1학기 기말고사',
          grade: '고등학교 1학년',
          usage: 1,
          status: 'completed',
          score: 28,
          totalQuestions: 30,
          type: 'exam',
        },
        {
          id: 8,
          attemptId: null,
          userId: 1,
          subject: '과학',
          title: '2024년 1학기 기말고사',
          grade: '고등학교 1학년',
          usage: 0,
          status: 'not_started',
          score: null,
          totalQuestions: 35,
          type: 'cbt',
        },
      ],
      loading: false,
      error: null,
      currentPage: 1,
      itemsPerPage: 5,
      searchQuery: '',
      currentFilter: 'all',
    }
  },
  mounted() {
    // 더미데이터 사용으로 API 호출 제거
  },
  computed: {
    filteredItems() {
      let filtered = this.items

      // 과목 필터링
      if (this.currentFilter !== 'all') {
        filtered = filtered.filter((item) => item.subject === this.currentFilter)
      }

      // 검색어 필터링
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim()
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(query) || item.subject.toLowerCase().includes(query),
        )
      }

      return filtered
    },
    totalPages() {
      return Math.ceil(this.filteredItems.length / this.itemsPerPage)
    },
    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredItems.slice(start, end)
    },
    pageNumbers() {
      const pages = []
      const maxVisiblePages = 5

      if (this.totalPages <= maxVisiblePages) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (this.currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(this.totalPages)
        } else if (this.currentPage >= this.totalPages - 2) {
          pages.push(1)
          pages.push('...')
          for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(this.totalPages)
        }
      }

      return pages
    },
  },
  methods: {
    async fetchStudentExams() {
      this.loading = true
      try {
        // localStorage에서 userInfo 가져오기
        const userInfoStr = localStorage.getItem('userInfo')
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null

        if (userInfo?.id) {
          let allExams = []

          // 1. 해당 학생의 시험 목록 가져오기 (exams)
          try {
            const examResponse = await examApi.get(`/student/${userInfo.id}/exams`)
            const examData = examResponse.data?.data || examResponse.data || []
            allExams = allExams.concat(
              examData.map((exam) => ({
                id: exam.id,
                attemptId: exam.attemptId || exam.attempt_id,
                userId: exam.userId || userInfo.id,
                subject: exam.subject,
                title: exam.title,
                grade: exam.grade,
                usage: exam.attemptCount || 0,
                status: exam.status, // 'completed', 'in_progress', 'not_started'
                score: exam.score,
                totalQuestions: exam.totalQuestions,
                type: 'exam',
              })),
            )
          } catch (examError) {
            console.error('시험 목록 조회 실패:', examError)
          }

          // 2. CBT 시험지 목록도 가져오기
          try {
            const cbtResponse = await examApi.getCBTList()
            const cbtData = cbtResponse.data?.data || cbtResponse.data || []
            allExams = allExams.concat(
              cbtData.map((cbt) => ({
                id: cbt.id,
                attemptId: null, // CBT는 아직 시도하지 않았을 수 있음
                userId: userInfo.id,
                subject: cbt.subject,
                title: cbt.title,
                grade: cbt.grade,
                usage: 0, // 아직 시도하지 않음
                status: 'not_started',
                score: null,
                totalQuestions: cbt.totalQuestions,
                type: 'cbt',
              })),
            )
          } catch (cbtError) {
            console.error('CBT 목록 조회 실패:', cbtError)
          }

          // 3. 중복 제거 및 정렬 (최신순)
          const uniqueExams = allExams.filter(
            (exam, index, self) => index === self.findIndex((e) => e.id === exam.id),
          )

          this.items = uniqueExams.sort((a, b) => {
            // 완료된 시험을 먼저, 그 다음 최신순
            if (a.status === 'completed' && b.status !== 'completed') return -1
            if (a.status !== 'completed' && b.status === 'completed') return 1
            return b.id - a.id
          })
        }
      } catch (error) {
        console.error('시험 목록을 가져오는데 실패했습니다:', error)
        this.error = '시험 목록을 불러올 수 없습니다.'
        this.items = []
      } finally {
        this.loading = false
      }
    },
    goToReport(id, attemptId) {
      this.$router.push({
        name: 'student.basicReport',
        params: { id: id, attemptId: attemptId },
      })
    },
    goToPage(page) {
      if (page !== '...' && page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    setFilter(filter) {
      this.currentFilter = filter
      this.currentPage = 1 // 필터 변경 시 첫 페이지로 이동
    },
    clearSearch() {
      this.searchQuery = ''
      this.currentPage = 1
    },
  },
}
</script>

<style scoped>
.report-list-container {
  max-width: 1000px;
  margin: 80px auto 80px;
  padding: 0 20px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #d3d3d3;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 16px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.list-item:hover {
  border-color: #2d5af5;
  box-shadow: 0 4px 12px rgba(59, 108, 255, 0.15);
  transform: translateY(-2px);
}
.left {
  display: flex;
  align-items: center;
  gap: 18px;
}
.num {
  font-size: 18px;
  font-weight: bold;
  color: #555;
  width: 24px;
  text-align: center;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tag {
  display: inline-block;
  font-size: 12px;
  background: #f0f4ff;
  color: #3b6cff;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 0;
}
.title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 0;
}
.sub {
  font-size: 13px;
  color: #777;
}
.right a {
  text-decoration: none;
  font-weight: bold;
  border-color: #2d5af5;
  color: #3b6cff;
  font-size: 14px;
}
.right a:hover {
  text-decoration: underline;
  color: #3b6cff;
}

/* 페이지네이션 스타일 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  gap: 10px;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #d3d3d3;
  background: white;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;
  min-width: 40px;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #3b6cff;
}

.page-btn.active {
  background: #3b6cff;
  color: white !important;
  border-color: #3b6cff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.disabled {
  cursor: default;
  background: transparent;
  border: none;
}

.prev-btn,
.next-btn {
  font-weight: bold;
}

/* 검색 및 필터 스타일 */
.search-filter-section {
  margin-bottom: 30px;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #d3d3d3;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #3b6cff;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.clear-btn:hover {
  color: #666;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #d3d3d3;
  background: white;
  color: #333;
  cursor: pointer;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #3b6cff;
  background: #f8f9ff;
}

.filter-btn.active {
  background: #3b6cff;
  color: white;
  border-color: #3b6cff;
}

.result-info {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}
</style>
