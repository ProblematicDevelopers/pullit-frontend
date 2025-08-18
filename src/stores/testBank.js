import { defineStore } from 'pinia'
import examApi from '@/services/examApi'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const useTestBankStore = defineStore('testBank', {
  state: () => ({
    // ===== 마법사 진행 상태 =====
    currentStep: 0, // 현재 진행 중인 단계 (0: 모드선택, 1: 단원선택, 2: 문항편집, 3: 시험지저장)
    isWizardOpen: false, // 마법사 모달 열림/닫힘 상태
    mode: null, // 'new' 또는 'edit' - 신규 생성 또는 편집 모드

    // ===== 선택된 기존 시험지 (편집 모드용) =====
    selectedExam: null, // 편집할 기존 시험지 정보
    
    // ===== 시험지 기본 정보 =====
    examInfo: {
      gradeCode: null,
      gradeName: '',
      subjectId: null,
      subjectName: ''
    },
    
    // ===== 시험지 타입 =====
    examType: 'ALL', // 'TESTWIZARD', 'USER_CREATED', 'ALL'

    // ===== 선택된 과목 정보 =====
    subject: {
      id: null,
      name: '수학 1', // 기본값으로 수학 1 설정
      curriculum: '이준열(2015)', // 교육과정 정보
      publisher: '이준열', // 출판사
      grade: '중학교 1학년' // 학년 정보
    },

    // ===== API 데이터 =====
    loading: false, // 로딩 상태
    grades: [], // 학년 옵션 (API에서 가져옴)
    subjects: [], // 과목 옵션 (API에서 가져옴)
    terms: [], // 학기 옵션 (API에서 가져옴)
    examSearchResults: [], // 시험지 검색 결과
    totalPages: 0, // 전체 페이지 수
    totalElements: 0, // 전체 요소 수
    currentPage: 0, // 현재 페이지
    
    // ===== 필터 옵션 =====
    filterOptions: {
      grades: [],    // { code: '08', name: '중학교 2학년', count: 100 }
      terms: [],     // { code: '01', name: '1학기', count: 50 }
      subjects: []   // { code: 'MA', name: '수학', count: 30 } - 대문자 코드 사용 (MA, KO, EN, SC, SO, HS, MO)
    },

    // ===== 단원 및 챕터 정보 (실제 데이터로 교체 예정) =====
    chapters: [],

    // ===== 시험지 설정 데이터 =====
    wizardData: {
      testType: '단원순', // 문제 유형: 단원순, 난이도순, 혼합
      difficulty: '중', // 기본 난이도 설정
      // 각 난이도별 출제할 문항 수
      questionTypes: {
        '하': 0,
        '중': 0,
        '상': 0
      },
      // 총 출제할 문항 수
      totalQuestions: 0,
      // 시험지 정보
      examTitle: '', // 시험지 제목
      examDate: '', // 시험 날짜
      examTime: 60, // 시험 시간(분)
      instructions: '' // 시험 안내사항
    },

    // ===== 선택된 문제들 =====
    selectedQuestions: [], // Step2에서 편집할 문제 목록

    // ===== 최종 시험지 데이터 =====
    finalExam: null // Step3에서 생성된 최종 시험지 데이터
  }),

  getters: {
    /**
     * 선택된 단원지들을 반환
     * @returns {Array} 선택된 papers 배열
     */
    selectedPapers(state) {
      const selected = []
      state.chapters.forEach(chapter => {
        chapter.papers.forEach(paper => {
          if (paper.selected) {
            selected.push({
              ...paper,
              chapterName: chapter.name
            })
          }
        })
      })
      return selected
    },

    /**
     * 선택된 단원지들의 총 문항 수
     * @returns {Number} 총 선택된 문항 수
     */
    totalSelectedQuestions(state) {
      return this.selectedPapers.reduce((total, paper) => {
        return total + paper.questionCount
      }, 0)
    },

    /**
     * 설정된 출제 문항의 총합
     * @returns {Number} 총 출제할 문항 수
     */
    totalWizardQuestions(state) {
      return Object.values(state.wizardData.questionTypes).reduce((total, count) => {
        return total + count
      }, 0)
    },

    /**
     * 선택된 단원지들의 난이도별 문항 수 집계
     * @returns {Object} 난이도별 사용 가능한 문항 수
     */
    availableQuestionsByDifficulty(state) {
      const totals = { easy: 0, medium: 0, hard: 0 }

      this.selectedPapers.forEach(paper => {
        totals.easy += paper.difficulty.easy
        totals.medium += paper.difficulty.medium
        totals.hard += paper.difficulty.hard
      })

      return {
        '하': totals.easy,
        '중': totals.medium,
        '상': totals.hard
      }
    },

    /**
     * 마법사 완료 가능 여부 체크
     * @returns {Boolean} Step1 완료 가능 여부
     */
    canProceedToStep2(state) {
      return this.selectedPapers.length > 0 && this.totalWizardQuestions > 0
    }
  },

  actions: {
    /**
     * 현재 진행 단계 설정
     * @param {Number} step - 설정할 단계 (0, 1, 2, 3)
     */
    setCurrentStep(step) {
      if (step >= 0 && step <= 3) {
        this.currentStep = step
      }
    },

    /**
     * 모드 설정 (신규/편집)
     * @param {String} mode - 'new' 또는 'edit'
     */
    setMode(mode) {
      this.mode = mode
    },

    /**
     * 편집할 기존 시험지 설정
     * @param {Object} exam - 기존 시험지 정보
     */
    setSelectedExam(exam) {
      this.selectedExam = exam
      // 기존 시험지 데이터로 초기화 (향후 구현)
      if (exam) {
        // 시험지 제목 설정
        this.wizardData.examTitle = exam.title
        // 과목 정보 설정
        this.subject.name = exam.subjectName || exam.subject
        // 기타 데이터 매핑...
      }
    },

    /**
     * 시험지 기본 정보 설정
     * @param {Object} examInfo - 시험지 정보
     */
    setExamInfo(examInfo) {
      this.examInfo = { ...this.examInfo, ...examInfo }
    },

    /**
     * 마법사 모달 열기/닫기
     * @param {Boolean} isOpen - 열림 상태
     */
    setWizardOpen(isOpen) {
      this.isWizardOpen = isOpen
      // 모달을 닫을 때 초기화
      if (!isOpen) {
        this.resetWizard()
      }
    },

    /**
     * 단원 펼침/접힘 토글
     * @param {Number} chapterId - 단원 ID
     */
    toggleChapter(chapterId) {
      const chapter = this.chapters.find(ch => ch.id === chapterId)
      if (chapter) {
        chapter.expanded = !chapter.expanded
      }
    },

    /**
     * 모든 단원지 선택
     */
    selectAll() {
      this.chapters.forEach(chapter => {
        chapter.papers.forEach(paper => {
          paper.selected = true
        })
      })
      // 선택 후 자동으로 문항 수 업데이트
      this.updateQuestionCounts()
    },

    /**
     * 모든 단원지 선택 해제
     */
    deselectAll() {
      this.chapters.forEach(chapter => {
        chapter.papers.forEach(paper => {
          paper.selected = false
        })
      })
      // 선택 해제 후 문항 수 초기화
      this.wizardData.questionTypes = { '하': 0, '중': 0, '상': 0 }
    },

    /**
     * 특정 단원지 선택/해제
     * @param {Number} paperId - 단원지 ID
     */
    togglePaper(paperId) {
      this.chapters.forEach(chapter => {
        const paper = chapter.papers.find(p => p.id === paperId)
        if (paper) {
          paper.selected = !paper.selected
        }
      })
      this.updateQuestionCounts()
    },

    /**
     * 선택된 단원지 기반으로 문항 수 자동 설정
     * 각 난이도별로 사용 가능한 문항의 1/3씩 자동 설정
     */
    updateQuestionCounts() {
      const available = this.availableQuestionsByDifficulty

      // 사용 가능한 문항이 있을 때만 자동 설정
      this.wizardData.questionTypes['하'] = Math.min(5, Math.floor(available['하'] / 3))
      this.wizardData.questionTypes['중'] = Math.min(10, Math.floor(available['중'] / 3))
      this.wizardData.questionTypes['상'] = Math.min(5, Math.floor(available['상'] / 3))
    },

    /**
     * 난이도별 문항 수 직접 설정
     * @param {String} difficulty - 난이도 ('하', '중', '상')
     * @param {Number} count - 설정할 문항 수
     */
    setQuestionCount(difficulty, count) {
      const available = this.availableQuestionsByDifficulty

      // 사용 가능한 문항 수를 초과하지 않도록 제한
      const maxCount = available[difficulty] || 0
      this.wizardData.questionTypes[difficulty] = Math.min(Math.max(0, count), maxCount)
    },

    /**
     * 과목 정보 설정
     * @param {Object} subjectInfo - 과목 정보 객체
     */
    setSubject(subjectInfo) {
      this.subject = { ...this.subject, ...subjectInfo }
    },

    /**
     * 마법사 데이터 초기화
     */
    resetWizard() {
      this.currentStep = 0
      this.mode = null
      this.selectedExam = null

      // 모든 단원 접기 및 선택 해제
      this.chapters.forEach(chapter => {
        chapter.expanded = false
        chapter.papers.forEach(paper => {
          paper.selected = false
        })
      })

      // 설정 데이터 초기화
      this.wizardData = {
        testType: '단원순',
        difficulty: '중',
        questionTypes: { '하': 0, '중': 0, '상': 0 },
        totalQuestions: 0,
        examTitle: '',
        examDate: '',
        examTime: 60,
        instructions: ''
      }

      this.selectedQuestions = []
      this.finalExam = null
    },

    /**
     * Step1에서 Step2로 진행
     * 선택된 단원지들을 기반으로 문제 목록 생성
     */
    proceedToStep2() {
      if (!this.canProceedToStep2) {
        console.warn('Step2로 진행할 수 없습니다. 단원지를 선택하고 문항 수를 설정해주세요.')
        return false
      }

      // 여기서 실제로는 API를 호출하여 선택된 단원지의 문제들을 가져와야 합니다.
      // 현재는 더미 데이터로 시뮬레이션
      this.generateSelectedQuestions()
      this.setCurrentStep(2)
      return true
    },

    /**
     * 선택된 단원지 기반으로 문제 목록 생성 (더미 데이터)
     * 실제로는 API에서 문제 데이터를 가져와야 합니다.
     */
    generateSelectedQuestions() {
      this.selectedQuestions = []
      let questionId = 1

      this.selectedPapers.forEach(paper => {
        const difficulties = ['하', '중', '상']
        difficulties.forEach(diff => {
          const count = this.wizardData.questionTypes[diff]
          for (let i = 0; i < count; i++) {
            this.selectedQuestions.push({
              id: questionId++,
              paperId: paper.id,
              paperTitle: paper.title,
              chapterName: paper.chapterName,
              difficulty: diff,
              type: Math.random() > 0.5 ? '객관식' : '주관식',
              content: `${paper.title}에서 가져온 ${diff} 난이도 문제입니다.`,
              answer: '정답 예시',
              explanation: '해설 내용입니다.',
              order: questionId - 1
            })
          }
        })
      })
    },

    // ===== API 메서드 추가 =====
    
    /**
     * 필터 옵션 가져오기 (학년, 과목, 학기)
     */
    async fetchFilterOptions() {
      try {
        // 임시로 하드코딩된 데이터 사용
        const data = {
          grades: [
            { code: '07', name: '1학년', count: 500 },
            { code: '08', name: '2학년', count: 600 },
            { code: '09', name: '3학년', count: 587 }
          ],
          subjects: [
            { code: 'MA', name: '수학', count: 228 },
            { code: 'KO', name: '국어', count: 156 },
            { code: 'EN', name: '영어', count: 189 },
            { code: 'SC', name: '과학', count: 145 },
            { code: 'SO', name: '사회', count: 132 }
          ],
          terms: [
            { code: '01', name: '1학기', count: 850 },
            { code: '02', name: '2학기', count: 837 }
          ]
        }
        
        // 기존 배열에도 할당
        this.grades = data.grades || []
        this.subjects = data.subjects || []
        this.terms = data.terms || []
        
        // filterOptions 객체에도 할당
        this.filterOptions = {
          grades: data.grades || [],
          terms: data.terms || [],
          subjects: data.subjects || []
        }
        
        console.log('필터 옵션 로드 성공 (임시 데이터):', data)
        
        return data
      } catch (error) {
        console.error('필터 옵션 조회 실패:', error)
        throw error
      }
    },
    
    /**
     * 교과서 목록 가져오기
     */
    async fetchTextbooks(gradeCode, areaCode) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/subject`)
        const textbooks = response.data.data || []
        
        // 학년과 과목에 맞는 교과서만 필터링
        const filtered = textbooks.filter(textbook => {
          const matchGrade = !gradeCode || textbook.gradeCode === gradeCode
          const matchArea = !areaCode || textbook.areaCode === areaCode
          return matchGrade && matchArea
        })
        
        console.log('교과서 목록 로드:', filtered.length)
        return filtered
      } catch (error) {
        console.error('교과서 목록 조회 실패:', error)
        return []
      }
    },
    
    /**
     * 대단원 목록 가져오기
     */
    async fetchChapters(subjectId) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chapter/${subjectId}/tree`)
        const chapters = response.data.data || []
        
        console.log('대단원 목록 로드:', chapters.length)
        return chapters
      } catch (error) {
        console.error('대단원 목록 조회 실패:', error)
        return []
      }
    },

    /**
     * 시험지 검색 - 새로운 통합 API 사용
     * @param {Object} searchParams - 검색 파라미터
     */
    async searchExams(searchParams) {
      try {
        this.loading = true
        
        // API 파라미터 매핑
        const params = {
          keyword: searchParams.keyword || '',
          subjectId: searchParams.subjectId || null,  // 교과서 ID
          areaCode: searchParams.areaCode || null,     // 과목 코드 (MA, KO, EN 등)
          gradeCode: searchParams.gradeCode || null,
          termCode: searchParams.termCode || null,
          largeChapterCode: searchParams.largeChapterCode || null,
          examType: searchParams.examType || this.examType || 'ALL',
          visibility: searchParams.visibility ? searchParams.visibility.toUpperCase() : null, // 대문자로 변환
          page: searchParams.page || 0,
          size: searchParams.size || 20,
          sort: searchParams.sort || 'createdDate,desc'
        }
        
        // null 값 제거 (빈 문자열은 유지)
        console.log('파라미터 정리 전:', params)
        Object.keys(params).forEach(key => {
          if (params[key] === null) {
            delete params[key]
          }
        })
        
        console.log('시험지 검색 요청 (최종):', params)
        const response = await examApi.get('/search', { params })
        
        // 응답 데이터 처리
        const data = response.data
        this.examSearchResults = data.content || []
        this.totalPages = data.totalPages || 0
        this.totalElements = data.totalElements || 0
        this.currentPage = data.number || 0
        
        console.log('시험지 검색 성공:', {
          results: data.content?.length || 0,
          total: data.totalElements || 0
        })
        
        return data
      } catch (error) {
        console.error('시험지 검색 실패:', error)
        this.examSearchResults = []
        this.totalPages = 0
        this.totalElements = 0
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 접근 가능한 시험지 목록 가져오기
     */
    async fetchAccessibleExams(userId, page = 0, size = 20) {
      try {
        this.loading = true
        const response = await examApi.get('/accessible', {
          params: { 
            userId: userId || 1, // 임시 userId
            page, 
            size, 
            sort: 'createdDate,desc' 
          }
        })
        
        return response.data
      } catch (error) {
        console.error('접근 가능한 시험지 조회 실패:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 최근 시험지 가져오기
     */
    async fetchRecentExams(limit = 10) {
      try {
        const response = await examApi.get('/recent', {
          params: { limit }
        })
        return response.data
      } catch (error) {
        console.error('최근 시험지 조회 실패:', error)
        throw error
      }
    },
    
    /**
     * 인기 시험지 가져오기
     */
    async fetchPopularExams(limit = 10) {
      try {
        const response = await examApi.get('/popular', {
          params: { limit }
        })
        return response.data
      } catch (error) {
        console.error('인기 시험지 조회 실패:', error)
        throw error
      }
    },
    
    /**
     * 과목별 시험지 통계
     */
    async fetchExamStatistics(subjectId = null) {
      try {
        const response = await examApi.get('/statistics/subject', {
          params: { subjectId }
        })
        return response.data
      } catch (error) {
        console.error('시험지 통계 조회 실패:', error)
        throw error
      }
    },

    /**
     * 시험지 생성
     * @param {Object} examData - 시험지 생성 데이터
     */
    async createExam(examData) {
      try {
        this.loading = true
        const response = await examApi.post('', examData)
        
        if (response.data.success) {
          console.log('시험지 생성 성공:', response.data.data)
          return response.data.data
        }
      } catch (error) {
        console.error('시험지 생성 실패:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 시험지 상세 조회
     * @param {Number} id - 시험지 ID
     * @param {String} source - 시험지 타입 ('exam' 또는 'user_exam')
     */
    async getExamDetail(id, source = 'user_exam') {
      try {
        const response = await examApi.get(`/${id}`, {
          params: { source }
        })
        
        if (response.data.success) {
          return response.data.data
        }
      } catch (error) {
        console.error('시험지 상세 조회 실패:', error)
        throw error
      }
    }
  }
})
