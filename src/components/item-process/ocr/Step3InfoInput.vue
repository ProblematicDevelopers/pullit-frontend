<template>
  <div class="step3-container">
    <!-- 좌측: 문제 미리보기 -->
    <div class="left-section">
      <div class="preview-panel">
        <h5 class="panel-title">작성한 문제 미리보기</h5>
        <div class="preview-content">
          <!-- 문제 영역 -->
          <div v-if="editedTexts.problem" class="preview-section problem-section">
            <h6>문제</h6>
            <div class="preview-html" v-html="editedTexts.problem"></div>
          </div>

          <!-- 지문 영역 -->
          <div v-if="editedTexts.question" class="preview-section question-section">
            <h6>지문</h6>
            <div class="preview-html" v-html="editedTexts.question"></div>
          </div>

          <!-- 이미지 영역 -->
          <div v-if="editedTexts.image" class="preview-section image-section">
            <h6>이미지</h6>
            <div class="preview-html" v-html="editedTexts.image"></div>
          </div>

          <!-- 보기 영역 -->
          <div v-if="editedTexts.options" class="preview-section options-section">
            <h6>보기</h6>
            <div class="preview-html" v-html="editedTexts.options"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 우측: 정보 입력 -->
    <div class="right-section">
      <!-- 문항 정보 입력 -->
      <div class="info-input-panel">
        <h5 class="panel-title">문항 정보 입력</h5>

        <div class="form-content">
          <!-- 문제 정보 -->
          <div class="form-section">
            <h6 class="section-title">문제 정보</h6>

            <div class="form-group">
              <label class="form-label">문제 형태</label>
              <select v-model="problemInfo.problemType" class="form-select">
                <option value="">선택 값</option>
                <option value="multiple_choice">객관식 (5지 선택)</option>
                <option value="short_answer">단답형</option>
                <option value="subjective">주관식</option>
                <option value="essay">서술형</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">난이도</label>
              <select v-model="problemInfo.difficulty" class="form-select">
                <option value="">선택 값</option>
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">지문 여부</label>
              <input
                v-model="problemInfo.hasPassage"
                type="checkbox"
                class="form-check-input"
                disabled
              />
              <span class="form-text">자동 입력 / 비활성화</span>
            </div>

            <div class="form-group">
              <label class="form-label">정답</label>
              <input
                v-model="problemInfo.answer"
                type="text"
                class="form-control"
                :placeholder="getAnswerPlaceholder()"
              />
            </div>
          </div>

          <!-- 단원 정보 -->
          <div class="form-section">
            <h6 class="section-title">단원 정보</h6>

            <!-- 챕터 로딩 상태 -->
            <div v-if="chaptersLoading" class="alert alert-info">
              <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">로딩 중...</span>
                </div>
                <span>단원 정보를 불러오는 중...</span>
              </div>
            </div>

            <!-- 챕터 에러 상태 -->
            <div v-else-if="chaptersError" class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>단원 정보 로드 실패:</strong> {{ chaptersError }}
              <button @click="loadChapters" class="btn btn-sm btn-outline-warning ms-2">
                다시 시도
              </button>
            </div>

            <!-- 챕터 선택 폼 -->
            <div v-else>
              <div class="form-group">
                <label class="form-label">대단원 챕터</label>
                <select v-model="problemInfo.majorChapter" class="form-select" :disabled="majorChapters.length === 0" @change="loadMiddleChapters(problemInfo.majorChapter)">
                  <option value="">{{ majorChapters.length === 0 ? '단원 정보가 없습니다' : '선택 값' }}</option>
                  <option v-for="chapter in majorChapters" :key="chapter.id" :value="chapter.id">
                    {{ chapter.name }}
                  </option>
                </select>
                <small v-if="majorChapters.length === 0" class="form-text text-muted">
                  교과서를 선택하면 단원 정보가 표시됩니다.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label">중단원 챕터</label>
                <select v-model="problemInfo.middleChapter" class="form-select" :disabled="middleChapters.length === 0" @change="loadMinorChapters(problemInfo.middleChapter)">
                  <option value="">{{ middleChapters.length === 0 ? '대단원을 먼저 선택하세요' : '선택 값' }}</option>
                  <option v-for="chapter in middleChapters" :key="chapter.id" :value="chapter.id">
                    {{ chapter.name }}
                  </option>
                </select>
                <small v-if="middleChapters.length === 0 && problemInfo.majorChapter" class="form-text text-muted">
                  대단원을 선택하면 중단원이 표시됩니다.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label">소단원 챕터</label>
                <select v-model="problemInfo.minorChapter" class="form-select" :disabled="minorChapters.length === 0" @change="loadTopicChapters(problemInfo.minorChapter)">
                  <option value="">{{ minorChapters.length === 0 ? '중단원을 먼저 선택하세요' : '선택 값' }}</option>
                  <option v-for="chapter in minorChapters" :key="chapter.id" :value="chapter.id">
                    {{ chapter.name }}
                  </option>
                </select>
                <small v-if="minorChapters.length === 0 && problemInfo.middleChapter" class="form-text text-muted">
                  중단원을 선택하면 소단원이 표시됩니다.
                </small>
              </div>

              <div class="form-group">
                <label class="form-label">토픽 챕터</label>
                <select v-model="problemInfo.topicChapter" class="form-select" :disabled="topicChapters.length === 0">
                  <option value="">{{ topicChapters.length === 0 ? '소단원을 먼저 선택하세요' : '선택 값' }}</option>
                  <option v-for="topic in topicChapters" :key="topic.id" :value="topic.id">
                    {{ topic.name }}
                  </option>
                </select>
                <small v-if="topicChapters.length === 0 && problemInfo.minorChapter" class="form-text text-muted">
                  소단원을 선택하면 토픽이 표시됩니다.
                </small>
              </div>
            </div>
          </div>

          <!-- 해설 입력 -->
          <div class="form-section">
            <h6 class="section-title">
              해설 입력
              <button @click="toggleExplanationEditor" class="btn btn-sm btn-outline-secondary">
                {{ showExplanationEditor ? '접기' : '펼치기' }}
              </button>
            </h6>

            <div v-show="showExplanationEditor" class="explanation-editor">
              <!-- TinyMCE 에디터 -->
              <div class="editor-container">
                <Editor
                  :key="explanationEditorKey"
                  :api-key="tinymceApiKey"
                  :model-value="problemInfo.explanation"
                  @update:model-value="updateExplanation"
                  :init="explanationEditorConfig"
                  class="explanation-tinymce-editor"
                />
              </div>

              <!-- 수식 도구 -->
              <div class="math-tools-section">
                <h6>수식 도구</h6>
                <div class="math-buttons">
                  <button @click="insertMathToExplanation('+')" class="math-btn">덧셈</button>
                  <button @click="insertMathToExplanation('-')" class="math-btn">뺄셈</button>
                  <button @click="insertMathToExplanation('\\times')" class="math-btn">곱셈</button>
                  <button @click="insertMathToExplanation('\\div')" class="math-btn">나눗셈</button>
                  <button @click="insertMathToExplanation('\\sqrt{}')" class="math-btn">제곱근</button>
                  <button @click="insertMathToExplanation('^{}')" class="math-btn">지수</button>
                  <button @click="insertMathToExplanation('\\log')" class="math-btn">로그</button>
                  <button @click="insertMathToExplanation('\\int')" class="math-btn">적분</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 네비게이션 -->
      <div class="navigation-panel">
        <button @click="prevStep" class="btn btn-secondary">이전</button>
        <button @click="nextStep" class="btn btn-primary" :disabled="!isFormValid">
          {{ isFormValid ? '다음' : '필수 항목을 입력하세요' }}
        </button>
      </div>

      <!-- 유효성 검사 메시지 -->
      <div v-if="!isFormValid && showValidationErrors" class="validation-errors">
        <div class="alert alert-warning">
          <h6>다음 항목들을 입력해주세요:</h6>
          <ul class="mb-0">
            <li v-if="!problemInfo.problemType">문제 형태</li>
            <li v-if="!problemInfo.difficulty">난이도</li>
            <li v-if="!problemInfo.answer">정답</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import chapterApi from '@/services/chapterApi'
import { useSubjectStore } from '@/store/subjectStore.js'
import { fileHistoryAPI } from '@/services/fileHistoryApi.js'

export default {
  name: 'Step3InfoInput',
  components: {
    Editor
  },
  props: {
    editedTexts: {
      type: Object,
      required: true
    },
    selectedAreas: {
      type: Object,
      required: true
    },
    selectedTextbook: {
      type: Object,
      required: true
    },
    isNewFile: {
      type: Boolean,
      default: false
    },
    selectedFile: {
      type: Object,
      default: null
    }
  },
  emits: [
    'update:problemInfo',
    'prev-step',
    'next-step'
  ],
  setup(props, { emit }) {
    // 문제 정보 상태
    const problemInfo = ref({
      majorChapter: '',
      middleChapter: '',
      minorChapter: '',
      topicChapter: '',
      problemType: '',
      difficulty: '',
      hasPassage: !!props.selectedAreas.question,
      answer: '',
      explanation: ''
    })

    // 해설 에디터 상태
    const showExplanationEditor = ref(false)
    const explanationEditorKey = ref(0)
    const showValidationErrors = ref(false)

    // 챕터 데이터 상태
    const majorChapters = ref([])
    const middleChapters = ref([])
    const minorChapters = ref([])
    const topicChapters = ref([])
    const chaptersLoading = ref(false)
    const chaptersError = ref(null)

    // 폼 유효성 검사
    const isFormValid = computed(() => {
      return !!(
        problemInfo.value.problemType &&
        problemInfo.value.difficulty &&
        problemInfo.value.answer.trim()
      )
    })

    // 대단원 선택 시 중단원 로드
    const loadMiddleChapters = (majorChapterId) => {
      const majorChapter = majorChapters.value.find(ch => ch.id === majorChapterId)
      if (majorChapter && majorChapter.children) {
        middleChapters.value = majorChapter.children.map(chapter => ({
          id: chapter.id,
          name: chapter.name,
          children: chapter.children || []
        }))
        console.log('📚 [Step3InfoInput] 중단원 로드 완료:', middleChapters.value.length)

        // 중단원, 소단원, 토픽 초기화
        minorChapters.value = []
        topicChapters.value = []
        problemInfo.value.middleChapter = majorChapterId
        problemInfo.value.minorChapter = ''
        problemInfo.value.topicChapter = ''
      }
    }

    // 중단원 선택 시 소단원 로드
    const loadMinorChapters = (middleChapterId) => {
      const middleChapter = middleChapters.value.find(ch => ch.id === middleChapterId)
      if (middleChapter && middleChapter.children) {
        minorChapters.value = middleChapter.children.map(chapter => ({
          id: chapter.id,
          name: chapter.name,
          topics: chapter.topics || []
        }))
        console.log('📚 [Step3InfoInput] 소단원 로드 완료:', minorChapters.value.length)

        // 소단원, 토픽 초기화
        topicChapters.value = []
        problemInfo.value.minorChapter = middleChapterId
        problemInfo.value.topicChapter = ''
      }
    }

    // 소단원 선택 시 토픽 로드
    const loadTopicChapters = (minorChapterId) => {
      const minorChapter = minorChapters.value.find(ch => ch.id === minorChapterId)
      if (minorChapter && minorChapter.topics) {
        topicChapters.value = minorChapter.topics.map(topic => ({
          id: topic.id,
          name: topic.name
        }))
        console.log('📚 [Step3InfoInput] 토픽 로드 완료:', topicChapters.value.length)
        problemInfo.value.topicChapter = minorChapterId
      }
    }

    // 챕터 데이터 로드
    const loadChapters = async () => {
      console.log('🚀 [Step3InfoInput] loadChapters 시작')

      let subjectId = null

      if (props.isNewFile) {
        // 새 파일: 교과서에서 subjectId
        subjectId = props.selectedTextbook?.subjectId
                 || props.selectedTextbook?.id   // 혹시 id로 오는 경로 대비
                 || props.selectedTextbook?.code || null
      } else if (props.selectedFile?.id) {
        // 기존 파일: selectedFile.subjectId 우선 사용 (상위에서 이미 설정됨)
        subjectId = props.selectedFile?.subjectId || props.selectedFile?.subject?.id

        if (!subjectId) {
          // subjectId가 없는 경우에만 fileHistoryId로 조회
          try {
            const { subjectId: sid, areaCode } = await fileHistoryAPI.getSubjectIdByFileHistoryId(props.selectedFile.id)
            subjectId = sid
            if (!subjectId && areaCode) {
              // areaCode만 왔다면 매핑(필요시 subjectStore 사용)
              const subjectStore = useSubjectStore()
              if (subjectStore.list.length === 0) {
                await subjectStore.fetchSubjects()
              }
              const subject = subjectStore.list.find(s => s.areaCode === areaCode)
              if (subject) {
                subjectId = subject.subjectId
                console.log('✅ [Step3InfoInput] areaCode 매핑 성공:', areaCode, '→', subjectId)
              }
            }
          } catch (e) {
            console.warn('⚠️ fileHistory→subjectId 조회 실패:', e)
          }
        }
      }

      if (!subjectId) {
        console.warn('⚠️ subjectId 없음 → 챕터 로드 중단', {
          selectedTextbook: props.selectedTextbook,
          selectedFile: props.selectedFile
        })
        chaptersError.value = '과목 정보를 찾을 수 없어 챕터를 로드할 수 없습니다.'
        return
      }

      try {
        chaptersLoading.value = true
        chaptersError.value = null

        console.log('📚 [Step3InfoInput] API 호출 정보:', {
          method: 'GET',
          endpoint: `/chapter/${subjectId}/tree`,
          subjectId,
          textbookName: props.selectedTextbook?.name,
          fileName: props.selectedFile?.name
        })

        const startTime = Date.now()
        const response = await chapterApi.getChapterTree(subjectId)
        const endTime = Date.now()

        console.log('📊 [Step3InfoInput] API 응답 정보:', {
          status: response.status,
          statusText: response.statusText,
          responseTime: `${endTime - startTime}ms`,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          success: response.data?.success
        })

        // 실제 응답 데이터 구조 상세 확인
        console.log('🔍 [Step3InfoInput] 전체 응답 데이터:', response.data)
        if (response.data?.data) {
          console.log('🔍 [Step3InfoInput] 챕터 데이터 상세:', response.data.data)
          console.log('🔍 [Step3InfoInput] 대단원 배열:', response.data.data.majorChapters)
          console.log('🔍 [Step3InfoInput] 중단원 배열:', response.data.data.middleChapters)
          console.log('🔍 [Step3InfoInput] 소단원 배열:', response.data.data.minorChapters)
        }

                  if (response.data && response.data.success) {
            const chapterData = response.data.data
            console.log('✅ [Step3InfoInput] 챕터 데이터 로드 완료')
            console.log('📊 [Step3InfoInput] 챕터 데이터 구조:', {
              isArray: Array.isArray(chapterData),
              length: Array.isArray(chapterData) ? chapterData.length : 0,
              sampleChapter: Array.isArray(chapterData) ? chapterData[0] : null
            })

            // API 응답이 배열 형태로 오므로 직접 사용
            if (Array.isArray(chapterData)) {
              // 대단원: 최상위 배열 요소들
              majorChapters.value = chapterData.map(chapter => ({
                id: chapter.id,
                name: chapter.name,
                children: chapter.children || []
              }))

              console.log('📚 [Step3InfoInput] 대단원 설정 완료:', majorChapters.value.length)
              console.log('📚 [Step3InfoInput] 대단원 내용:', majorChapters.value)

              // 중단원, 소단원, 토픽은 선택된 대단원에 따라 동적으로 설정
              middleChapters.value = []
              minorChapters.value = []
              topicChapters.value = []

              // 선택된 챕터들도 초기화
              problemInfo.value.middleChapter = ''
              problemInfo.value.minorChapter = ''
              problemInfo.value.topicChapter = ''

              console.log('🔄 [Step3InfoInput] 하위 챕터 초기화 완료')
              console.log('🔄 [Step3InfoInput] 대단원 개수:', majorChapters.value.length)
              console.log('🔄 [Step3InfoInput] 첫 번째 대단원:', majorChapters.value[0])
            } else {
              console.warn('⚠️ [Step3InfoInput] 챕터 데이터가 배열 형태가 아님:', chapterData)
              majorChapters.value = []
              middleChapters.value = []
              minorChapters.value = []
              topicChapters.value = []
            }

        } else {
          console.error('❌ [Step3InfoInput] API 응답이 성공하지 않음:', response.data)
          throw new Error(response.data?.message || '챕터 데이터 로드 실패')
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 챕터 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        })
        chaptersError.value = error.message || '챕터 데이터를 불러오는데 실패했습니다.'
      } finally {
        chaptersLoading.value = false
        console.log('🏁 [Step3InfoInput] 챕터 로드 완료 (성공/실패 여부와 관계없이)')
      }
    }

    // 대단원 변경 시 중단원 로드
    const onMajorChapterChange = async () => {
      console.log('🔄 [Step3InfoInput] onMajorChapterChange 호출됨')
      console.log('📋 [Step3InfoInput] 선택된 대단원:', problemInfo.value.majorChapter)

      if (!problemInfo.value.majorChapter) {
        console.log('🔄 [Step3InfoInput] 대단원이 선택되지 않음 - 하위 챕터 초기화')
        middleChapters.value = []
        minorChapters.value = []
        topicChapters.value = []
        problemInfo.value.middleChapter = ''
        problemInfo.value.minorChapter = ''
        problemInfo.value.topicChapter = ''
        return
      }

      try {
        console.log('🔍 [Step3InfoInput] 대단원에서 중단원 정보 찾는 중...')
        const majorChapter = majorChapters.value.find(c => c.id === problemInfo.value.majorChapter)

        if (majorChapter && majorChapter.children) {
          console.log('✅ [Step3InfoInput] 중단원 데이터 발견:', {
            majorChapterId: majorChapter.id,
            majorChapterName: majorChapter.name,
            middleChaptersCount: majorChapter.children.length,
            sampleMiddleChapter: majorChapter.children[0] || null
          })

          middleChapters.value = majorChapter.children
          minorChapters.value = []
          topicChapters.value = []
          problemInfo.value.middleChapter = ''
          problemInfo.value.minorChapter = ''
          problemInfo.value.topicChapter = ''

          console.log('🔄 [Step3InfoInput] 하위 챕터 초기화 완료')
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 대단원에 중단원 데이터가 없음:', {
            majorChapterId: problemInfo.value.majorChapter,
            hasMajorChapter: !!majorChapter,
            hasChildren: !!(majorChapter && majorChapter.children)
          })
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 중단원 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          majorChapterId: problemInfo.value.majorChapter
        })
      }
    }

    // 중단원 변경 시 소단원 로드
    const onMiddleChapterChange = async () => {
      console.log('🔄 [Step3InfoInput] onMiddleChapterChange 호출됨')
      console.log('📋 [Step3InfoInput] 선택된 중단원:', problemInfo.value.middleChapter)

      if (!problemInfo.value.middleChapter) {
        console.log('🔄 [Step3InfoInput] 중단원이 선택되지 않음 - 하위 챕터 초기화')
        minorChapters.value = []
        topicChapters.value = []
        problemInfo.value.minorChapter = ''
        problemInfo.value.topicChapter = ''
        return
      }

      try {
        console.log('🔍 [Step3InfoInput] 중단원에서 소단원 정보 찾는 중...')
        const middleChapter = middleChapters.value.find(c => c.id === problemInfo.value.middleChapter)

        if (middleChapter && middleChapter.children) {
          console.log('✅ [Step3InfoInput] 소단원 데이터 발견:', {
            middleChapterId: middleChapter.id,
            middleChapterName: middleChapter.name,
            minorChaptersCount: middleChapter.children.length,
            sampleMinorChapter: middleChapter.children[0] || null
          })

          minorChapters.value = middleChapter.children
          topicChapters.value = []
          problemInfo.value.minorChapter = ''
          problemInfo.value.topicChapter = ''

          console.log('🔄 [Step3InfoInput] 하위 챕터 초기화 완료')
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 중단원에 소단원 데이터가 없음:', {
            middleChapterId: problemInfo.value.middleChapter,
            hasMiddleChapter: !!middleChapter,
            hasChildren: !!(middleChapter && middleChapter.children)
          })
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 소단원 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          middleChapterId: problemInfo.value.middleChapter
        })
      }
    }

    // 소단원 변경 시 토픽 로드
    const onMinorChapterChange = async () => {
      console.log('🔄 [Step3InfoInput] onMinorChapterChange 호출됨')
      console.log('📋 [Step3InfoInput] 선택된 소단원:', problemInfo.value.minorChapter)

      if (!problemInfo.value.minorChapter) {
        console.log('🔄 [Step3InfoInput] 소단원이 선택되지 않음 - 토픽 초기화')
        topicChapters.value = []
        problemInfo.value.topicChapter = ''
        return
      }

      try {
        console.log('🔍 [Step3InfoInput] 소단원에서 토픽 정보 찾는 중...')
        const minorChapter = minorChapters.value.find(c => c.id === problemInfo.value.minorChapter)

        if (minorChapter && minorChapter.children) {
          console.log('✅ [Step3InfoInput] 토픽 데이터 발견:', {
            minorChapterId: minorChapter.id,
            minorChapterName: minorChapter.name,
            topicChaptersCount: minorChapter.children.length,
            sampleTopicChapter: minorChapter.children[0] || null
          })

          topicChapters.value = minorChapter.children
          problemInfo.value.topicChapter = ''

          console.log('🔄 [Step3InfoInput] 토픽 초기화 완료')
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 소단원에 토픽 데이터가 없음:', {
            minorChapterId: problemInfo.value.minorChapter,
            hasMinorChapter: !!minorChapter,
            hasChildren: !!(minorChapter && minorChapter.children)
          })
        }
      } catch (error) {
        console.error('❌ [Step3InfoInput] 토픽 데이터 로드 실패')
        console.error('❌ [Step3InfoInput] 오류 상세:', {
          message: error.message,
          stack: error.stack,
          minorChapterId: problemInfo.value.minorChapter
        })
      }
    }

    // 문제 정보 업데이트
    const updateProblemInfo = () => {
      console.log('📝 [Step3InfoInput] updateProblemInfo 호출됨')
      console.log('📋 [Step3InfoInput] 업데이트할 문제 정보:', problemInfo.value)

      const problemInfoCopy = { ...problemInfo.value }
      emit('update:problemInfo', problemInfoCopy)

      console.log('✅ [Step3InfoInput] 문제 정보 업데이트 완료 - 부모 컴포넌트로 전달됨')
    }

    // 다음 단계로
    const nextStep = () => {
      console.log('🚀 [Step3InfoInput] nextStep 호출됨')
      console.log('📋 [Step3InfoInput] 현재 폼 상태:', {
        isFormValid: isFormValid.value,
        problemType: problemInfo.value.problemType,
        difficulty: problemInfo.value.difficulty,
        hasAnswer: !!problemInfo.value.answer?.trim(),
        answer: problemInfo.value.answer,
        majorChapter: problemInfo.value.majorChapter,
        middleChapter: problemInfo.value.middleChapter,
        minorChapter: problemInfo.value.minorChapter,
        topicChapter: problemInfo.value.topicChapter
      })

      if (isFormValid.value) {
        console.log('✅ [Step3InfoInput] 폼 유효성 검사 통과, 다음 단계로 이동')
        updateProblemInfo()
        emit('next-step')
        console.log('✅ [Step3InfoInput] next-step 이벤트 발생 완료')
      } else {
        console.log('❌ [Step3InfoInput] 폼 유효성 검사 실패, 에러 표시')
        console.log('❌ [Step3InfoInput] 실패 원인:', {
          missingProblemType: !problemInfo.value.problemType,
          missingDifficulty: !problemInfo.value.difficulty,
          missingAnswer: !problemInfo.value.answer?.trim()
        })
        showValidationErrors.value = true
      }
    }

    // 이전 단계로
    const prevStep = () => {
      console.log('⬅️ [Step3InfoInput] prevStep 호출됨')
      console.log('📋 [Step3InfoInput] 현재 문제 정보 상태:', problemInfo.value)

      updateProblemInfo()
      emit('prev-step')
      console.log('⬅️ [Step3InfoInput] prev-step 이벤트 발생 완료')
    }

        // 컴포넌트 마운트 시 챕터 데이터 로드
    onMounted(() => {
      console.log('🚀 [Step3InfoInput] 컴포넌트 마운트됨')
      console.log('📋 [Step3InfoInput] 초기 props 상태:', {
        selectedTextbook: props.selectedTextbook,
        hasSubjectId: !!props.selectedTextbook?.subjectId,
        subjectId: props.selectedTextbook?.subjectId,
        isNewFile: props.isNewFile,
        selectedFile: props.selectedFile,
        fileSubjectId: props.selectedFile?.subjectId || props.selectedFile?.subject?.id
      })

      // 신규 파일 또는 기존 파일에서 subjectId가 있는 경우 챕터 데이터 로드
      if (props.isNewFile && props.selectedTextbook?.subjectId) {
        console.log('📚 [Step3InfoInput] 신규 파일 - 교과서 정보 발견 - 챕터 데이터 로드 시작')
        loadChapters()
      } else if (!props.isNewFile && (props.selectedFile?.subjectId || props.selectedFile?.subject?.id)) {
        console.log('📚 [Step3InfoInput] 기존 파일 - FileHistory에서 subjectId 발견 - 챕터 데이터 로드 시작')
        loadChapters()
      } else {
        console.warn('⚠️ [Step3InfoInput] subjectId를 찾을 수 없어 챕터 데이터를 로드할 수 없음')
        console.warn('⚠️ [Step3InfoInput] 신규 파일 여부:', props.isNewFile)
        console.warn('⚠️ [Step3InfoInput] 교과서 정보:', props.selectedTextbook)
        console.warn('⚠️ [Step3InfoInput] 파일 정보:', props.selectedFile)
      }
    })

        // 교과서 변경 시 챕터 데이터 재로드 (신규 파일)
    watch(() => props.selectedTextbook?.subjectId, (newSubjectId, oldSubjectId) => {
      console.log('🔄 [Step3InfoInput] 교과서 변경 감지 (신규 파일):', {
        oldSubjectId,
        newSubjectId,
        hasChanged: oldSubjectId !== newSubjectId,
        isNewFile: props.isNewFile
      })

      if (newSubjectId && props.isNewFile) {
        console.log('📚 [Step3InfoInput] 새로운 교과서 선택됨 (신규 파일) - 챕터 데이터 재로드')
        loadChapters()
      } else if (!newSubjectId && props.isNewFile) {
        console.warn('⚠️ [Step3InfoInput] 교과서 정보가 제거됨 (신규 파일)')
      }
    })

    // 파일 변경 시 챕터 데이터 재로드 (기존 파일)
    watch(() => props.selectedFile, (newFile, oldFile) => {
      console.log('🔄 [Step3InfoInput] 파일 변경 감지 (기존 파일):', {
        oldFileId: oldFile?.id,
        newFileId: newFile?.id,
        oldSubjectId: oldFile?.subjectId || oldFile?.subject?.id,
        newSubjectId: newFile?.subjectId || newFile?.subject?.id,
        hasChanged: oldFile?.id !== newFile?.id,
        isNewFile: props.isNewFile
      })

      if (newFile && !props.isNewFile) {
        const newSubjectId = newFile.subjectId || newFile.subject?.id
        if (newSubjectId) {
          console.log('📚 [Step3InfoInput] 새로운 파일 선택됨 (기존 파일) - 챕터 데이터 재로드')
          loadChapters()
        } else {
          console.warn('⚠️ [Step3InfoInput] 선택된 파일에 subjectId가 없음 (기존 파일)')
        }
      }
    }, { deep: true })

    // 챕터 선택 변경 시 하위 챕터 로드
    watch(() => problemInfo.value.majorChapter, (newMajorChapter, oldMajorChapter) => {
      console.log('🔄 [Step3InfoInput] 대단원 변경 감지:', {
        oldMajorChapter,
        newMajorChapter,
        hasChanged: oldMajorChapter !== newMajorChapter
      })
      onMajorChapterChange()
    })

    watch(() => problemInfo.value.middleChapter, (newMiddleChapter, oldMiddleChapter) => {
      console.log('🔄 [Step3InfoInput] 중단원 변경 감지:', {
        oldMiddleChapter,
        newMiddleChapter,
        hasChanged: oldMiddleChapter !== newMiddleChapter
      })
      onMiddleChapterChange()
    })

    watch(() => problemInfo.value.minorChapter, (newMinorChapter, oldMinorChapter) => {
      console.log('🔄 [Step3InfoInput] 소단원 변경 감지:', {
        oldMinorChapter,
        newMinorChapter,
        hasChanged: oldMinorChapter !== newMinorChapter
      })
      onMinorChapterChange()
    })

    // 문제 정보 변경 시 부모 컴포넌트에 전달
    watch(problemInfo, (newProblemInfo, oldProblemInfo) => {
      console.log('🔄 [Step3InfoInput] 문제 정보 변경 감지')
      console.log('📋 [Step3InfoInput] 변경된 내용:', {
        old: oldProblemInfo,
        new: newProblemInfo,
        changedFields: Object.keys(newProblemInfo).filter(key =>
          newProblemInfo[key] !== oldProblemInfo[key]
        )
      })

      updateProblemInfo()
    }, { deep: true })

    // TinyMCE 설정
    const tinymceApiKey = import.meta.env.VITE_TINYMCE_KEY || 'no-api-key'
    const explanationEditorConfig = {
      height: 300,
      min_height: 200,
      max_height: 400,
      branding: false,
      promotion: false,
      menubar: false,
      statusbar: true,
      resize: true,
      language: 'en',

      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code',
        'insertdatetime', 'help', 'wordcount'
      ],
      toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | mathformula',

      content_style: `
        body {
          font-family: 'Noto Sans KR', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          margin: 8px !important;
          padding: 8px !important;
        }
        .math-latex {
          background: #f0f8ff;
          padding: 4px 6px;
          border-radius: 4px;
          border: 1px solid #d0e7ff;
          font-family: 'Times New Roman', serif;
          color: #1e40af;
          display: inline-block;
          margin: 0 2px;
        }
      `,

      setup: (editor) => {
        editor.ui.registry.addButton('mathformula', {
          text: '수식',
          icon: 'equation',
          onAction: () => {
            const mathText = prompt('LaTeX 수식을 입력하세요:', 'x^2 + y^2 = r^2')
            if (mathText) {
              const html = `<span class="math-latex" data-latex="${mathText}">$${mathText}$</span>`
              editor.insertContent(html)
            }
          }
        })
      }
    }

    // 정답 플레이스홀더
    const getAnswerPlaceholder = () => {
      switch (problemInfo.value.problemType) {
        case 'multiple_choice':
          return '예: 4'
        case 'short_answer':
          return '예: 12'
        case 'subjective':
          return '주관식 답안'
        default:
          return '정답을 입력하세요'
      }
    }

    // 해설 에디터 토글
    const toggleExplanationEditor = () => {
      showExplanationEditor.value = !showExplanationEditor.value
    }

    // 해설 업데이트
    const updateExplanation = (content) => {
      problemInfo.value.explanation = content
    }

    // 수식 삽입 (해설 에디터)
    const insertMathToExplanation = () => {
      // 실제 구현에서는 에디터 인스턴스에 접근해서 삽입
      console.log('📝 [Step3InfoInput] 수식 삽입 기능 호출됨')
      // TODO: TinyMCE 에디터 인스턴스에 접근하여 수식 삽입 구현
    }

    return {
      problemInfo,
      showExplanationEditor,
      explanationEditorKey,
      showValidationErrors,
      isFormValid,
      majorChapters,
      middleChapters,
      minorChapters,
      topicChapters,
      chaptersLoading,
      chaptersError,
      tinymceApiKey,
      explanationEditorConfig,
      getAnswerPlaceholder,
      toggleExplanationEditor,
      updateExplanation,
      insertMathToExplanation,
      prevStep,
      nextStep,
      loadChapters,
      loadMiddleChapters,
      loadMinorChapters,
      loadTopicChapters
    }
  }
}
</script>

<style scoped>
.step3-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
}

/* 좌측 영역 - 미리보기 */
.left-section {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.preview-panel {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.panel-title {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid #e9ecef;
}

.preview-content {
  padding: 1rem;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
}

.preview-section h6 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.preview-html {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #333;
}

/* 우측 영역 - 정보 입력 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.info-input-panel {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.form-content {
  padding: 1rem;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
}

.form-select,
.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus,
.form-control:focus {
  border-color: #007bff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-text {
  font-size: 0.75rem;
  color: #6c757d;
}

/* 해설 에디터 */
.explanation-editor {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
}

.editor-container {
  margin-bottom: 1rem;
}

.math-tools-section h6 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.math-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.math-btn {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.math-btn:hover {
  background: #e9ecef;
}

/* 네비게이션 */
.navigation-panel {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.navigation-panel .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 유효성 검사 */
.validation-errors {
  margin-top: 1rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.alert h6 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.alert ul {
  margin: 0;
  padding-left: 1.25rem;
}

.alert li {
  margin-bottom: 0.25rem;
}

/* TinyMCE 스타일링 */
:deep(.tox-tinymce) {
  border: 1px solid #ced4da !important;
  border-radius: 4px !important;
}

/* 챕터 로딩 및 에러 상태 */
.d-flex {
  display: flex !important;
}

.align-items-center {
  align-items: center !important;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: text-bottom;
  border: 0.125em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.125em;
}

.me-2 {
  margin-right: 0.5rem !important;
}

.ms-2 {
  margin-left: 0.5rem !important;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.2rem;
}

.btn-outline-warning {
  color: #ffc107;
  border-color: #ffc107;
}

.btn-outline-warning:hover {
  color: #212529;
  background-color: #ffc107;
  border-color: #ffc107;
}

.bi {
  display: inline-block;
  font-family: bootstrap-icons !important;
  font-style: normal;
  font-weight: normal !important;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  vertical-align: text-bottom;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.bi-exclamation-triangle::before {
  content: "\F33A";
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .step3-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .preview-content,
  .form-content {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .step3-container {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .math-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .navigation-panel {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
