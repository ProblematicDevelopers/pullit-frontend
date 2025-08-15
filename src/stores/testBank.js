/**
 * 시험지 생성 마법사를 위한 Pinia Store
 * 
 * 이 스토어는 시험지 만들기 위자드의 전체 상태를 관리합니다.
 * - 현재 진행 단계 추적
 * - 선택된 과목 및 단원 정보
 * - 문제 설정 및 선택된 문제들
 * - 각 단계별 데이터 저장
 */

import { defineStore } from 'pinia'

export const useTestBankStore = defineStore('testBank', {
  state: () => ({
    // ===== 마법사 진행 상태 =====
    currentStep: 0, // 현재 진행 중인 단계 (0: 모드선택, 1: 단원선택, 2: 문항편집, 3: 시험지저장)
    isWizardOpen: false, // 마법사 모달 열림/닫힘 상태
    mode: null, // 'new' 또는 'edit' - 신규 생성 또는 편집 모드
    
    // ===== 선택된 기존 시험지 (편집 모드용) =====
    selectedExam: null, // 편집할 기존 시험지 정보
    
    // ===== 선택된 과목 정보 =====
    subject: {
      id: null,
      name: '수학 1', // 기본값으로 수학 1 설정
      curriculum: '이준열(2015)', // 교육과정 정보
      publisher: '이준열', // 출판사
      grade: '중학교 1학년' // 학년 정보
    },
    
    // ===== 단원 및 챕터 정보 =====
    chapters: [
      {
        id: 1,
        name: '1. 자연수의 성질',
        expanded: false, // 단원 펼침/접힘 상태
        papers: [
          {
            id: 11,
            title: '소인수분해와 거듭제곱',
            questionCount: 25,
            selected: false, // 선택 여부
            difficulty: {
              easy: 8,   // 하 난이도 문제 수
              medium: 12, // 중 난이도 문제 수
              hard: 5    // 상 난이도 문제 수
            }
          },
          {
            id: 12,
            title: '최대공약수와 최소공배수',
            questionCount: 18,
            selected: false,
            difficulty: {
              easy: 6,
              medium: 8,
              hard: 4
            }
          }
        ]
      },
      {
        id: 2,
        name: '2. 방정식과 부등식',
        expanded: false,
        papers: [
          {
            id: 21,
            title: '일차방정식과 연립방정식',
            questionCount: 30,
            selected: false,
            difficulty: {
              easy: 10,
              medium: 15,
              hard: 5
            }
          },
          {
            id: 22,
            title: '일차부등식과 연립부등식',
            questionCount: 22,
            selected: false,
            difficulty: {
              easy: 8,
              medium: 10,
              hard: 4
            }
          }
        ]
      },
      {
        id: 3,
        name: '3. 도형의 성질',
        expanded: false,
        papers: [
          {
            id: 31,
            title: '평면도형의 성질',
            questionCount: 28,
            selected: false,
            difficulty: {
              easy: 9,
              medium: 14,
              hard: 5
            }
          }
        ]
      }
    ],
    
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
    }
  }
})