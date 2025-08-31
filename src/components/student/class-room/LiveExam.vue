<template>
  <div class="cbt-exam-container d-flex flex-column vh-100 bg-light">
    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-white-50 mb-0">잠시만 기다려주세요.</p>
      </div>
    </div>

    <!-- 시험 헤더 -->
    <div
      class="exam-header bg-white border-bottom shadow-sm p-3 d-flex justify-content-between align-items-center"
    >
      <div class="exam-info">
        <h2 class="exam-title h4 mb-1 fw-bold text-dark">{{ examTitle }}</h2>
        <div class="exam-meta d-flex gap-4">
          <span class="question-info text-muted fw-medium"
            >문항 {{ currentQuestion }}/{{ totalQuestions }}</span
          >
          <span class="time-info text-danger fw-bold">{{ formatTime(remainingTime) }}</span>
        </div>
      </div>
      <div class="exam-controls">
        <button class="btn btn-outline-primary me-2" @click="temporarySave">임시 저장</button>
        <button class="btn btn-outline-danger" @click="confirmExit">시험 종료</button>
      </div>
    </div>

    <!-- 메인 콘텐츠 영역 -->
    <div class="main-content flex-grow-1 d-flex justify-content-between gap-4 p-4">
      <!-- 시험 콘텐츠 -->
      <div class="exam-content flex-grow-1 col-10 overflow-auto" style="max-height: 730px">
        <div class="question-container bg-white rounded shadow-sm p-4">
          <div class="question-header d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
            <span class="question-number h5 mb-0 fw-bold text-primary"
              >{{ currentQuestion }}번</span
            >
            <span class="question-type badge bg-secondary">{{ questionType }}</span>
          </div>

          <div class="row">
            <!-- 지문 영역 (왼쪽) -->
            <div v-if="currentQuestionData?.passageHtml" class="col-6">
              <div class="passage-container h-100 p-3 bg-light rounded border">
                <h6 class="passage-title mb-2 fw-bold text-secondary">
                  <i class="bi bi-file-text me-2"></i>지문
                </h6>
                <div
                  class="passage-content fs-6 lh-base text-dark"
                  style="overflow-y: scroll; max-height: 630px"
                  v-html="renderMath(currentQuestionData.passageHtml)"
                ></div>
              </div>
            </div>

            <!-- 문제 + 선택지 영역 (오른쪽 또는 전체) -->
            <div :class="currentQuestionData?.passageHtml ? 'col-6' : 'col-12'">
              <div class="question-text mb-4">
                <div
                  class="fs-5 lh-base text-dark"
                  v-html="renderMath(currentQuestionData?.questionHtml || currentQuestionText)"
                ></div>
              </div>

              <!-- 객관식 (FREE_CHOICE, FIVE_CHOICE) -->
              <div v-if="isMultipleChoice" class="options-container d-flex flex-column gap-3">
                <div
                  class="option-item border rounded p-3 d-flex align-items-center cursor-pointer transition-all"
                  :class="{ 'border-primary bg-light': isOptionSelected(index) }"
                  v-for="(option, index) in options"
                  :key="index"
                  @click="selectAnswer(index)"
                >
                  <input
                    :type="
                      questionType === '객관식' &&
                      currentQuestionData?.questionType === 'FREE_CHOICE'
                        ? 'checkbox'
                        : 'radio'
                    "
                    :id="`option-${index}`"
                    :name="`question-${currentQuestion}`"
                    :value="index + 1"
                    :checked="isOptionSelected(index)"
                    @change="selectAnswer(index)"
                    class="form-check-input me-3"
                  />
                  <label
                    :for="`option-${index}`"
                    class="option-label d-flex align-items-center flex-grow-1 cursor-pointer"
                  >
                    <span
                      class="option-letter bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3"
                      style="width: 2rem; height: 2rem"
                    >
                      {{ String.fromCharCode(65 + index) }}
                    </span>
                    <span class="option-text fs-6 text-dark" v-html="renderMath(option)"></span>
                  </label>
                </div>
              </div>

              <!-- 주관식 (SHORT_ANSWER_ORDERED, SHORT_ANSWER_UNORDERED) -->
              <div v-else-if="isShortAnswer" class="short-answer-container">
                <div class="form-group">
                  <label for="shortAnswer" class="form-label fw-bold mb-2">답안 입력:</label>
                  <textarea
                    id="shortAnswer"
                    v-model="shortAnswer"
                    class="form-control"
                    rows="4"
                    placeholder="답안을 입력하세요..."
                    @input="saveShortAnswer"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측 사이드바 - 문제 네비게이션 -->
      <div
        class="question-sidebar bg-white rounded shadow-sm p-3 d-flex flex-column col-2"
        style="max-height: 730px"
      >
        <div
          class="sidebar-header d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom"
        >
          <h5 class="sidebar-title h6 mb-0 fw-bold text-dark">
            <i class="bi bi-list-ul me-2"></i>
            문제 목록
          </h5>
          <div class="progress-info d-flex flex-column gap-2">
            <span class="progress-text small text-muted fw-medium"
              >{{ answeredQuestions.length }}/{{ totalQuestions }}</span
            >
            <div class="progress" style="height: 8px">
              <div
                class="progress-bar bg-primary"
                :style="{ width: (answeredQuestions.length / totalQuestions) * 100 + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="question-grid-container overflow-auto" style="max-height: 670px">
          <div class="question-grid d-flex flex-column gap-2">
            <button
              v-for="num in totalQuestions"
              :key="num"
              class="question-btn btn w-100 p-2 text-start border"
              :class="{
                'btn-success': answeredQuestions.includes(num),
                'btn-primary': currentQuestion === num,
                'btn-outline-secondary':
                  !answeredQuestions.includes(num) && currentQuestion !== num,
              }"
              @click="goToQuestion(num)"
            >
              {{ num }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 네비게이션 -->
    <div
      class="exam-navigation bg-white border-top p-3 d-flex justify-content-between align-items-center fixed-bottom"
    >
      <div class="nav-info">
        <span class="current-question text-muted fw-medium">현재 {{ currentQuestion }}번 문제</span>
      </div>
      <div class="nav-buttons d-flex gap-3">
        <button
          class="btn btn-outline-secondary"
          @click="previousQuestion"
          :disabled="currentQuestion <= 1"
        >
          이전
        </button>
        <button
          class="btn btn-primary"
          @click="nextQuestion"
          :disabled="currentQuestion >= totalQuestions"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import classAPI from '@/services/classApi.js'
import { cbtAPI } from '@/store/cbtStore.js'
import { useClassWebSocket } from './composables/useClassWebSocket'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const route = useRoute()
const router = useRouter()

// 사용자 정보
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')))
const currentUserId = ref(userInfo.value.id)
const currentUserName = ref(userInfo.value.fullName)
const currentUserRole = ref(userInfo.value.role)

// 웹소켓 관련
const channelName = ref('')

// 시험 데이터
const examTitle = ref('실시간 시험')
const currentQuestion = ref(1)
const totalQuestions = ref(50)
const remainingTime = ref(30 * 60) // 30분
const selectedAnswer = ref(null)
const selectedAnswers = ref([]) // 다중 선택용
const shortAnswer = ref('') // 주관식 답안
const answeredQuestions = ref([])
const questionType = ref('객관식')
const currentQuestionText = ref('여기에 문제 내용이 표시됩니다.')

// 실제 시험 데이터
const examData = ref(null)
const examItems = ref([]) // 문제 목록
const currentQuestionData = ref(null) // 현재 문제 데이터
const savedAnswers = ref([]) // 저장된 답안 데이터

// Redis 관련 데이터
const attemptId = ref(null)
const questionStartTime = ref(Date.now())
const questionTimes = ref({}) // 문제별 체류 시간
const questionVisits = ref({}) // 문제별 방문 횟수
const questionAnswers = ref({}) // 문제별 답안

// 문제 옵션 (동적으로 설정)
const options = ref([])

// 로딩 상태
const isLoading = ref(true)

// 타이머
let timer = null

// 웹소켓 컴포저블 사용
const { connectWebSocket, disconnectWebSocket, sendExamProgressMessage } = useClassWebSocket(
  currentUserId.value,
  currentUserName.value,
  currentUserRole.value,
  () => {}, // scrollToBottom 콜백 (필요없으므로 빈 함수)
  channelName,
)

onMounted(async () => {
  try {
    const examId = route.params.examId
    const classId = route.query.classId

    // 웹소켓 채널명 설정
    channelName.value = `live_exam_${examId}_${classId}`
    // 1. Attempt 생성 또는 기존 Attempt 확인
    const attemptResponse = await classAPI.createOrGetAttempt(examId, classId)
    attemptId.value = attemptResponse.data.data.attemptId

    // 2. 시험 문제 데이터 로드
    const examDataResponse = await classAPI.getLiveExam(examId)

    // 3. 기존 답안 상태 로드 (있는 경우)
    const answersResponse = await cbtAPI.getAttemptAnswers(attemptResponse.data.data.attemptId)
    savedAnswers.value = answersResponse.data?.data?.answers || []

    // 4. Redis에서 실시간 데이터 로드
    await loadRedisData()

    // 5. 데이터 설정
    if (examDataResponse.data) {
      examData.value = examDataResponse.data.data
      examItems.value = examDataResponse.data.data.examItems || []
      examTitle.value = examDataResponse.data.data.examName || 'CBT 시험'
      totalQuestions.value = examDataResponse.data.data.totalItems || examItems.value.length
      remainingTime.value = attemptResponse.data.data.remainTime

      // 첫 번째 문제 설정
      if (examItems.value.length > 0) {
        setCurrentQuestion(1)
      }
    }
    // 6. 기존 답안 복원
    if (savedAnswers.value.length > 0) {
      answeredQuestions.value = savedAnswers.value
        .filter((answer) => answer.userAnswer !== null && answer.userAnswer !== '')
        .map((answer) => answer.itemOrder)

      savedAnswers.value.forEach((answer) => {
        let num = parseInt(answer.itemOrder)
        let userAnswer = answer.userAnswer
        if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
          if (
            questionAnswers.value[num] == null ||
            questionAnswers.value[num] == undefined ||
            questionAnswers.value[num] == ''
          ) {
            // 숫자일 때만 parseInt 적용
            if (!isNaN(parseInt(userAnswer))) {
              questionAnswers.value[num] = parseInt(userAnswer)
            } else {
              questionAnswers.value[num] = userAnswer
            }
          }
        }
      })
    }

    // Redis에서도 답안이 있는 문제들 추가
    Object.keys(questionAnswers.value).forEach((questionNum) => {
      const num = parseInt(questionNum)
      if (
        questionAnswers.value[num] !== null &&
        questionAnswers.value[num] !== '' &&
        !answeredQuestions.value.includes(num)
      ) {
        answeredQuestions.value.push(num)
      }
    })

    // 7. 현재 문제의 답안 상태 업데이트 (첫 번째 문제 로드 후)
    if (currentQuestionData.value) {
      const currentQuestionType = currentQuestionData.value.questionType
      const savedAnswer = questionAnswers.value[currentQuestion.value]
      if (savedAnswer !== undefined && savedAnswer !== null) {
        if (
          currentQuestionType === 'SHORT_ANSWER_ORDERED' ||
          currentQuestionType === 'SHORT_ANSWER_UNORDERED'
        ) {
          shortAnswer.value = savedAnswer
        } else if (currentQuestionType === 'FREE_CHOICE') {
          selectedAnswers.value = Array.isArray(savedAnswer) ? savedAnswer : [savedAnswer]
        } else {
          selectedAnswer.value = savedAnswer
        }
      }
    }

    // 7. 현재 문제 시작 시간 설정
    questionStartTime.value = Date.now()
    await updateRedisCurrentQuestion()

    // 8. 웹소켓 연결 (학생은 전송만, 구독은 하지 않음)
    if (connectWebSocket) {
      await connectWebSocket({})
    }
  } catch (error) {
    console.error('CBT 시험 로드 실패:', error)
    alert('시험을 불러오는데 실패했습니다. 다시 시도해주세요.')
    isLoading.value = false
  } finally {
    isLoading.value = false
  }

  // 타이머 시작
  startTimer()

  // 페이지 새로고침 방지 및 임시 저장
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handlePageHide)
})

onUnmounted(() => {
  // 타이머 정리
  if (timer) {
    clearInterval(timer)
  }

  // 웹소켓 연결 해제
  if (disconnectWebSocket) {
    disconnectWebSocket()
  }

  // 이벤트 리스너 제거
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handlePageHide)
})

// 타이머 시작
function startTimer() {
  timer = setInterval(async () => {
    if (remainingTime.value > 0) {
      remainingTime.value--
      // Redis에 남은 시간 저장 (1분마다)
      if (remainingTime.value % 60 === 0) {
        try {
          await cbtAPI.updateRedisData(attemptId.value, {
            remainingTime: remainingTime.value,
          })
        } catch (error) {
          console.error('Redis 시간 업데이트 실패:', error)
        }
      }
    } else {
      // 시간 종료
      clearInterval(timer)
      alert('시험 시간이 종료되었습니다.')
      await submitExam()
    }
  }, 1000)
}

// 시간 포맷팅
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 이전 문제
async function previousQuestion() {
  if (currentQuestion.value > 1) {
    // 현재 문제 시간 저장
    await saveQuestionTime()
    setCurrentQuestion(currentQuestion.value - 1)
    await updateRedisCurrentQuestion()

    // 웹소켓으로 문제 이동 현황 전송
    sendAnswerStatus()
  }
}

// 다음 문제
async function nextQuestion() {
  if (
    selectedAnswer.value !== null ||
    selectedAnswers.value.length > 0 ||
    shortAnswer.value !== ''
  ) {
    if (!answeredQuestions.value.includes(currentQuestion.value)) {
      answeredQuestions.value.push(currentQuestion.value)
    }
  }

  if (currentQuestion.value < totalQuestions.value) {
    // 현재 문제 시간 저장
    await saveQuestionTime()
    setCurrentQuestion(currentQuestion.value + 1)
    await updateRedisCurrentQuestion()

    // 웹소켓으로 문제 이동 현황 전송
    sendAnswerStatus()
  }
}

// 특정 문제로 이동
async function goToQuestion(questionNumber) {
  if (questionNumber !== currentQuestion.value) {
    // 현재 문제 시간 저장
    await saveQuestionTime()

    // 현재 문제에 답안이 있으면 answeredQuestions에 추가
    if (
      selectedAnswer.value !== null ||
      selectedAnswers.value.length > 0 ||
      shortAnswer.value !== ''
    ) {
      if (!answeredQuestions.value.includes(currentQuestion.value)) {
        answeredQuestions.value.push(currentQuestion.value)
      }
    }

    setCurrentQuestion(questionNumber)
    await updateRedisCurrentQuestion()

    // 웹소켓으로 문제 이동 현황 전송
    sendAnswerStatus()
  }
}

// 답안 선택
function selectAnswer(answerIndex) {
  const answerValue = answerIndex + 1

  if (isFreeChoice.value) {
    // 자유 선지형: 다중 선택
    const index = selectedAnswers.value.indexOf(answerValue)
    if (index > -1) {
      selectedAnswers.value.splice(index, 1) // 선택 해제
    } else {
      selectedAnswers.value.push(answerValue) // 선택 추가
    }
    saveAnswerToRedis(selectedAnswers.value)
  } else {
    // 5지 선택형: 단일 선택
    selectedAnswer.value = answerValue
    saveAnswerToRedis(answerValue)
  }
}

// 현재 문제 설정
function setCurrentQuestion(questionNumber) {
  if (questionNumber >= 1 && questionNumber <= examItems.value.length) {
    currentQuestion.value = questionNumber
    currentQuestionData.value = examItems.value[questionNumber - 1]

    // 문제 텍스트 설정
    currentQuestionText.value =
      currentQuestionData.value.questionText || '문제를 불러올 수 없습니다.'

    // 문제 타입 설정
    questionType.value = getQuestionTypeText(currentQuestionData.value.questionType)

    // 선택지 설정
    if (currentQuestionData.value.choices && currentQuestionData.value.choices.length > 0) {
      options.value = currentQuestionData.value.choices
    } else {
      options.value = []
    }

    // 기존 답안 복원
    const savedAnswer = questionAnswers.value[questionNumber]
    const currentQuestionType = currentQuestionData.value.questionType

    if (savedAnswer !== undefined && savedAnswer !== null) {
      // Redis에서 복원
      if (
        currentQuestionType === 'SHORT_ANSWER_ORDERED' ||
        currentQuestionType === 'SHORT_ANSWER_UNORDERED'
      ) {
        shortAnswer.value = savedAnswer
      } else if (currentQuestionType === 'FREE_CHOICE') {
        selectedAnswers.value = Array.isArray(savedAnswer) ? savedAnswer : [savedAnswer]
      } else {
        selectedAnswer.value = savedAnswer
      }
    } else {
      // Redis에 없으면 API 응답에서 찾기
      const apiAnswer = savedAnswers.value.find(
        (answer) => answer.questionNumber === questionNumber,
      )
      if (apiAnswer && apiAnswer.userAnswer) {
        if (
          currentQuestionType === 'SHORT_ANSWER_ORDERED' ||
          currentQuestionType === 'SHORT_ANSWER_UNORDERED'
        ) {
          shortAnswer.value = apiAnswer.userAnswer
        } else if (currentQuestionType === 'FREE_CHOICE') {
          // 구분자로 분리된 답안 처리
          selectedAnswers.value = apiAnswer.userAnswer.includes('|')
            ? apiAnswer.userAnswer.split('|').map(Number)
            : [Number(apiAnswer.userAnswer)]
        } else {
          selectedAnswer.value = Number(apiAnswer.userAnswer)
        }
      } else {
        // 답안 초기화
        if (
          currentQuestionType === 'SHORT_ANSWER_ORDERED' ||
          currentQuestionType === 'SHORT_ANSWER_UNORDERED'
        ) {
          shortAnswer.value = ''
        } else if (currentQuestionType === 'FREE_CHOICE') {
          selectedAnswers.value = []
        } else {
          selectedAnswer.value = null
        }
      }
    }

    // 수식 렌더링을 위한 강제 업데이트
    setTimeout(() => {
      // DOM 업데이트 후 수식 렌더링
      const mathElements = document.querySelectorAll('.question-text, .option-text')
      mathElements.forEach((element) => {
        if (element.innerHTML.includes('\\(') || element.innerHTML.includes('\\[')) {
          // 이미 렌더링된 수식이 있으면 다시 렌더링
          element.innerHTML = renderMath(element.innerHTML)
        }
      })
    }, 100)
  }
}

// 문제 타입 텍스트 변환
function getQuestionTypeText(type) {
  const typeMap = {
    FREE_CHOICE: '객관식',
    FIVE_CHOICE: '객관식',
    SHORT_ANSWER_ORDERED: '주관식',
    SHORT_ANSWER_UNORDERED: '주관식',
  }
  return typeMap[type] || '객관식'
}

// 문제 유형별 computed 속성
const isMultipleChoice = computed(() => {
  return (
    currentQuestionData.value?.questionType === 'FREE_CHOICE' ||
    currentQuestionData.value?.questionType === 'FIVE_CHOICE'
  )
})

const isShortAnswer = computed(() => {
  return (
    currentQuestionData.value?.questionType === 'SHORT_ANSWER_ORDERED' ||
    currentQuestionData.value?.questionType === 'SHORT_ANSWER_UNORDERED'
  )
})

const isFreeChoice = computed(() => {
  return currentQuestionData.value?.questionType === 'FREE_CHOICE'
})

// 선택지 선택 상태 확인
function isOptionSelected(index) {
  if (isFreeChoice.value) {
    return selectedAnswers.value.includes(index + 1)
  } else {
    return selectedAnswer.value === index + 1
  }
}

// 주관식 답안 저장
function saveShortAnswer() {
  saveAnswerToRedis(shortAnswer.value)
}

// KaTeX 렌더링 함수
function renderMath(text) {
  if (!text) return ''

  try {
    // HTML 엔티티를 실제 문자로 변환
    let processedText = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    // LaTeX 수식 패턴 찾기 (예: \( ... \), \[ ... \], $ ... $)
    return processedText.replace(
      /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$([\s\S]*?)\$/g,
      (match, inline, display, dollar) => {
        const tex = inline || display || dollar
        if (tex) {
          try {
            return katex.renderToString(tex, {
              throwOnError: false,
              displayMode: !!display, // \[ ... \]는 display 모드
              strict: false,
              trust: true,
            })
          } catch (e) {
            console.error('KaTeX 렌더링 오류:', e, '수식:', tex)
            return match // 렌더링 실패 시 원본 반환
          }
        }
        return match
      },
    )
  } catch (e) {
    console.error('수식 처리 오류:', e)
    return text
  }
}

// Redis 관련 함수들
async function loadRedisData() {
  try {
    // Redis에서 실시간 데이터 로드
    const redisData = await cbtAPI.getRedisData(attemptId.value)
    if (redisData.data) {
      questionTimes.value = redisData.data.questionTimes || {}
      questionVisits.value = redisData.data.questionVisits || {}
      questionAnswers.value = redisData.data.questionAnswers || {}
      remainingTime.value = redisData.data.remainingTime || remainingTime.value
      currentQuestion.value = redisData.data.currentQuestion || 1
    }
  } catch (error) {
    console.error('Redis 데이터 로드 실패:', error)
  }
}

async function updateRedisCurrentQuestion() {
  try {
    await cbtAPI.updateRedisData(attemptId.value, {
      currentQuestion: currentQuestion.value,
      remainingTime: remainingTime.value,
    })
  } catch (error) {
    console.error('Redis 업데이트 실패:', error)
  }
}

// 답안 현황 전송 함수
function sendAnswerStatus() {
  if (sendExamProgressMessage) {
    const answerStatus = {
      userId: currentUserId.value,
      currentQuestion: currentQuestion.value,
      answeredQuestions: answeredQuestions.value,
      questionAnswers: questionAnswers.value,
      remainingTime: remainingTime.value,
      timestamp: new Date().toISOString(),
    }
    console.log('answerStatus', answerStatus)
    sendExamProgressMessage(JSON.stringify(answerStatus))
  }
}

async function saveAnswerToRedis(answerValue) {
  try {
    questionAnswers.value[currentQuestion.value] = answerValue
    await cbtAPI.updateRedisData(attemptId.value, {
      questionAnswers: questionAnswers.value,
    })

    // 웹소켓으로 답안 현황 전송
    sendAnswerStatus()
  } catch (error) {
    console.error('답안 Redis 저장 실패:', error)
  }
}

async function saveQuestionTime() {
  try {
    const currentTime = Date.now()
    const timeSpent = Math.floor((currentTime - questionStartTime.value) / 1000) // 초 단위

    // 현재 문제 체류 시간 누적
    if (!questionTimes.value[currentQuestion.value]) {
      questionTimes.value[currentQuestion.value] = 0
    }
    questionTimes.value[currentQuestion.value] += timeSpent

    // 방문 횟수 증가
    if (!questionVisits.value[currentQuestion.value]) {
      questionVisits.value[currentQuestion.value] = 0
    }
    questionVisits.value[currentQuestion.value]++

    // Redis에 저장
    await cbtAPI.updateRedisData(attemptId.value, {
      questionTimes: questionTimes.value,
      questionVisits: questionVisits.value,
    })

    // 새로운 문제 시작 시간 설정
    questionStartTime.value = currentTime
  } catch (error) {
    console.error('문제 시간 Redis 저장 실패:', error)
  }
}

async function saveExamToDatabase(status = 'DONE') {
  try {
    // 마지막 문제 시간 저장
    isLoading.value = true
    await saveQuestionTime()

    // Redis 데이터를 DB로 마이그레이션
    await cbtAPI.migrateRedisToDatabase(attemptId.value, {
      questionTimes: questionTimes.value,
      questionVisits: questionVisits.value,
      questionAnswers: questionAnswers.value,
      remainingTime: remainingTime.value, // 남은 시간 저장
      status: status, // DONE 또는 IN_PROGRESS
    })
  } catch (error) {
    console.error('DB 저장 실패:', error)
    throw error
  } finally {
    isLoading.value = false
  }
}

// 시험 종료 확인
function confirmExit() {
  if (confirm('정말로 시험을 종료하시겠습니까?')) {
    submitExam()
  }
}

// 시험 제출
async function submitExam() {
  try {
    // 타이머 정리
    if (timer) {
      clearInterval(timer)
    }

    // Redis 데이터를 DB로 저장 (DONE 상태)
    await saveExamToDatabase('DONE')

    // 팝업창 닫고 부모 창에서 결과 페이지로 이동
    if (window.opener) {
      window.opener.location.href = `/student/report/${attemptId.value}`
      window.close()
    } else {
      // 팝업이 아닌 경우 직접 이동
      router.push(`/student/report/${attemptId.value}`)
    }
  } catch (error) {
    console.error('시험 제출 실패:', error)
    alert('시험 제출에 실패했습니다. 다시 시도해주세요.')
  }
}

// 임시 저장
async function temporarySave() {
  try {
    await saveExamToDatabase('IN_PROGRESS')
    alert('임시 저장되었습니다.')
    // 팝업창 닫고 부모 창에서 결과 페이지로 이동
    if (window.opener) {
      window.opener.location.href = `/student/report/${attemptId.value}`
      window.close()
    } else {
      // 팝업이 아닌 경우 직접 이동
      router.push(`/student/report`)
    }
  } catch (error) {
    console.error('임시 저장 실패:', error)
    alert('임시 저장에 실패했습니다. 다시 시도해주세요.')
  }
}

// 페이지 새로고침 또는 닫을 때 임시 저장
function handleBeforeUnload(e) {
  if (remainingTime.value > 0) {
    e.preventDefault()
    e.returnValue = '시험 중에는 페이지를 새로고침하거나 닫을 수 없습니다.'
    return '시험 중에는 페이지를 새로고침하거나 닫을 수 없습니다.'
  }
}

function handlePageHide() {
  if (remainingTime.value > 0) {
    // 페이지가 숨겨지기 전에 임시 저장
    temporarySave()
  }
}
</script>

<style scoped>
/* 커서 포인터 스타일 */
.cursor-pointer {
  cursor: pointer;
}

/* 부드러운 전환 효과 */
.transition-all {
  transition: all 0.2s ease;
}

/* 로딩 오버레이 스타일 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-content .spinner-border {
  width: 4rem;
  height: 4rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column !important;
    gap: 1rem !important;
    padding: 1rem !important;
  }

  .question-sidebar {
    width: 100% !important;
    padding: 1rem !important;
  }

  .question-grid-container {
    max-height: none !important;
  }

  .exam-navigation {
    flex-direction: column !important;
    gap: 1rem !important;
  }
}

/* 체크박스 원형 스타일 */
.form-check-input[type='checkbox'] {
  border-radius: 50% !important;
  width: 1.2rem !important;
  height: 1.2rem !important;
}

.form-check-input[type='radio'] {
  border-radius: 50% !important;
  width: 1.2rem !important;
  height: 1.2rem !important;
}
</style>
