<template>
  <div class="ocr-result-modal" v-if="isVisible && capturedImage && capturedImageInfo">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-container">
      <!-- 모달 헤더 -->
      <OcrResultHeader
        :current-step="currentStep"
        :total-steps="steps.length"
        @close="closeModal"
        class="ocr-result-header"
      />

      <!-- 모달 내용 -->
      <div class="modal-content">
        <!-- 1단계: 영역 선택 -->
        <Step1AreaSelection
          v-if="currentStep === 1 && capturedImage && capturedImageInfo"
          :captured-image="capturedImage"
          :captured-image-info="capturedImageInfo"
          :selected-areas="selectedAreas"
          :active-selection-type="safeActiveSelectionType"
          :capture-mode="captureMode"
          :zoom-level="zoomLevel"
          :is-processing="isProcessing"
          :selection-canvas="selectionCanvas"
          @update:selected-areas="selectedAreas = $event"
          @update:active-selection-type="activeSelectionType = $event"
          @update:capture-mode="captureMode = $event"
          @update:zoom-level="zoomLevel = $event"
          @next-step="nextStep"
          @process-ocr="handleOcrProcessing"
        />



        <!-- 2단계: 텍스트 편집 -->
        <Step2TextEditing
          v-if="currentStep === 2 && hasValidSelectedAreas"
          :selected-areas="selectedAreas"
          :ocr-results="ocrResults"
          :edited-texts="editedTexts"
          :current-editing-area="currentEditingArea"
          :captureFullImg="capturedImage"
          @update:edited-texts="onEditedTextsUpdate"
          @update:current-editing-area="currentEditingArea = $event"
          @prev-step="prevStep"
          @next-step="nextStep"
        />

        <!-- 3단계: 문제 정보 입력 -->
        <Step3ItemInfo
          v-if="currentStep === 3 && hasValidSelectedAreas"
          :selected-areas="selectedAreas"
          :edited-texts="editedTexts"
          :selected-textbook="selectedTextbook"
          :is-new-file="isNewFile"
          :selected-file="selectedFile"
          :captureFullImg="capturedImage"
          @update:problemInfo="itemInfo = $event"
          @update:chapters="updateChapters"
        />


        <!-- 4단계: 문제 저장 -->
        <Step4ItemSave
          v-if="currentStep === 4 && hasValidSelectedAreas"
          :selected-areas="selectedAreas"
          :edited-texts="editedTexts"
          :item-info="itemInfo"
          :major-chapters="majorChapters"
          :middle-chapters="middleChapters"
          :minor-chapters="minorChapters"
          :topic-chapters="topicChapters"
          :captureFullImg="capturedImage"
          @save-complete="handleSaveComplete"
        />
      </div>

      <!-- 모달 액션 -->
      <div class="modal-actions">
        <div class="action-left">
          <button v-if="currentStep > 1" @click="prevStep" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>이전 단계
          </button>
        </div>

        <div class="action-right">
          <button v-if="currentStep < steps.length"
                  @click="nextStep"
                  :disabled="!canProceedToNext"
                  class="btn btn-primary">
            다음 단계<i class="bi bi-arrow-right ms-2"></i>
          </button>

          <button v-if="currentStep === steps.length"
                  @click="saveItem"
                  :disabled="!canSaveItem"
                  class="btn btn-success">
            <i class="bi bi-save me-2"></i>문제 저장
          </button>

          <button @click="closeModal" class="btn btn-secondary">
            <i class="bi bi-x-circle me-2"></i>닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, watch } from 'vue'
import { useItemProcessingError } from '@/composables/item-process/useItemProcessingError'
import { ocrApi } from '@/services/ocrApi'

// 분리된 컴포넌트들 import
import OcrResultHeader from './ocr/OcrResultHeader.vue'

// 단계별 컴포넌트들 import
import Step1AreaSelection from './ocr/Step1AreaSelection.vue'
import Step2TextEditing from './ocr/Step2TextEditing.vue'
import Step3ItemInfo from './ocr/Step3InfoInput.vue'
import Step4ItemSave from './ocr/Step4ItemSave.vue'

export default {
  name: 'OcrResultModal',
  components: {
    OcrResultHeader,
    Step1AreaSelection,
    Step2TextEditing,
    Step3ItemInfo,
    Step4ItemSave
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    capturedImage: {
      type: String,
      default: ''
    },
    capturedImageInfo: {
      type: Object,
      default: () => ({})
    },
    ocrResults: {
      type: Array,
      default: () => []
    },
    subjectCode: {
      type: String,
      default: ''
    },
    selectedTextbook: {
      type: Object,
      default: () => ({})
    },
    isNewFile: {
      type: Boolean,
      default: true
    },
    selectedFile: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    // 에러 처리 컴포지블
    const { handleGeneralError } = useItemProcessingError()

    // 단계 관리
    const currentStep = ref(1)
    const steps = ref([
      { label: '추출', key: 'extract' },
      { label: '편집', key: 'edit' },
      { label: '정보입력', key: 'info' },
      { label: '미리보기', key: 'preview' }
    ])

    // 상태 관리
    const zoomLevel = ref(1)
    const selectedArea = ref(null)
    const selectedProblemIndex = ref(0)
    const captureMode = ref(true) // true로 초기화하여 Canvas 클릭이 바로 작동하도록 함
    const imageCanvas = ref(null)
    const selectionCanvas = ref(null)
    const isProcessing = ref(false)
    const processingOcr = ref(false)

    // 선택된 영역들 (확장된 영역 타입)
    const selectedAreas = ref({
      question: null,   // 지문 영역
      problem: null,    // 문제 영역
      image: null,      // 이미지 영역
      options: null     // 보기 영역
    })

    // selectedAreas가 유효한지 확인하는 computed
    const hasValidSelectedAreas = computed(() => {
      return selectedAreas?.value &&
             typeof selectedAreas.value === 'object' &&
             Object.keys(selectedAreas.value).length > 0
    })



    // 편집된 텍스트
    const editedTexts = ref({
      question: '',
      problem: '',
      image: '',
      options: ''
    })

    // editedTexts 업데이트를 렌더 완료 후 반영 (동시성 충돌 방지)
    const onEditedTextsUpdate = (patch) => {
      // 렌더 완료 후 반영: 같은 tick에 patch 재진입 방지
      queueMicrotask(() => Object.assign(editedTexts.value, patch))
    }

    // 현재 선택 중인 영역 타입
    const activeSelectionType = ref('problem')

    // activeSelectionType이 null이 되지 않도록 보호하는 computed
    const safeActiveSelectionType = computed(() => {
      return activeSelectionType.value || 'problem'
    })

    // 2단계 편집에서 사용
    const currentEditingArea = ref('question')
    const availableAreaTypes = computed(() => {
      // null-safe 처리: selectedAreas.value가 undefined/null인 경우 빈 배열 반환
      if (!selectedAreas?.value || typeof selectedAreas.value !== 'object') {
        console.warn('availableAreaTypes: selectedAreas.value가 유효하지 않음:', selectedAreas.value)
        return []
      }

      return Object.keys(selectedAreas.value).filter(key => selectedAreas.value?.[key] !== null)
    })

    // 현재 선택 중인 영역
    const currentSelection = ref({
      active: false,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      waitingForSecondClick: false
    })

    // 지문 그룹 관리 (국어, 영어, 사회, 역사만)
    const captureFullImgGroups = ref([])
    const selectedCaptureFullImgGroup = ref('')
    const newCaptureFullImgGroupTitle = ref('')
    const showCaptureFullImgGroupSection = computed(() => {
      // 과목 코드에 따라 지문 그룹 섹션 표시 결정
      // 추후 과목 정보를 props로 받아서 처리
      return true // 임시로 true
    })

    // 문제 정보 (Step3InfoInput 구조에 맞춤)
    const itemInfo = ref({
      majorChapter: '',
      middleChapter: '',
      minorChapter: '',
      topicChapter: '',
      problemType: '',
      difficulty: '',
      hasCaptureFullImg: false,
      answer: '',
      explanation: ''
    })

    // 단원 정보
    const majorChapters = ref([])
    const middleChapters = ref([])
    const minorChapters = ref([])
    const topicChapters = ref([])

    // 계산된 속성 제거 (더 이상 problems 배열 사용하지 않음)

    // 변환 가능 여부 (문제 + 보기는 필수)
    const canConvert = computed(() => {
      // null-safe 처리: selectedAreas.value가 undefined/null인 경우 false 반환
      if (!selectedAreas?.value || typeof selectedAreas.value !== 'object') {
        console.warn('canConvert: selectedAreas.value가 유효하지 않음:', selectedAreas.value)
        return false
      }

      return selectedAreas.value?.problem && selectedAreas.value?.options
    })

    // 다음 단계로 진행 가능 여부
    const canProceedToNext = computed(() => {
      switch (currentStep.value) {
        case 1: // 추출 단계
          return canConvert.value
        case 2: // 편집 단계
          // null-safe 처리: editedTexts.value가 undefined/null인 경우 false 반환
          if (!editedTexts?.value || typeof editedTexts.value !== 'object') {
            console.warn('canProceedToNext case 2: editedTexts.value가 유효하지 않음:', editedTexts.value)
            return false
          }
          return availableAreaTypes.value.every(areaType => editedTexts.value?.[areaType]?.trim())
        case 3: // 정보입력 단계 (Step3InfoInput 구조에 맞춤)
          return !!(
            itemInfo.value.problemType &&
            itemInfo.value.difficulty &&
            itemInfo.value.answer && itemInfo.value.answer.trim()
          )
        case 4: // 미리보기 단계
          return false // 마지막 단계이므로 다음 단계 없음
        default:
          return false
      }
    })

    // 문제 저장 가능 여부
    const canSaveItem = computed(() => {
      return canProceedToNext.value || currentStep.value === 4
    })



    // 현재 선택 중인 영역 스타일
    const currentSelectionStyle = computed(() => {
      if (!currentSelection.value.active) return {}

      // 줌 레벨을 고려한 좌표 계산
      const x = currentSelection.value.x
      const y = currentSelection.value.y
      const width = currentSelection.value.width
      const height = currentSelection.value.height

      // 줌 레벨을 고려한 스케일링 적용
      const scaledX = x / zoomLevel.value
      const scaledY = y / zoomLevel.value
      const scaledWidth = width / zoomLevel.value
      const scaledHeight = height / zoomLevel.value

      return {
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`
      }
    })

    // 첫 번째 클릭 후 대기 중인 상태 스타일
    const waitingSelectionStyle = computed(() => {
      if (!currentSelection.value.waitingForSecondClick) return {}

      // 줌 레벨을 고려한 스케일링 적용
      const scaledX = currentSelection.value.startX / zoomLevel.value
      const scaledY = currentSelection.value.startY / zoomLevel.value

      return {
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${4 / zoomLevel.value}px`,
        height: `${4 / zoomLevel.value}px`
      }
    })

    // TinyMCE 에디터 정리 함수
    const cleanupTinyMCEEditors = async () => {
      try {
        if (window.tinymce && window.tinymce.editors) {
          // 각 에디터를 개별적으로 정리
          for (let editor of window.tinymce.editors) {
            if (editor && !editor.destroyed) {
              try {
                editor.destroy()
              } catch (e) {
                console.warn('개별 에디터 정리 중 오류:', e)
              }
            }
          }

          // 전체 TinyMCE 제거
          try {
            window.tinymce.remove()
          } catch (e) {
            console.warn('TinyMCE 전체 제거 중 오류:', e)
          }

          // DOM 정리 대기
          await new Promise(resolve => setTimeout(resolve, 150))
        }
      } catch (error) {
        console.warn('TinyMCE 정리 중 전체 오류:', error)
        // 에러가 있어도 계속 진행
      }
    }

    // 컴포넌트 정리 함수 (단계 변경 시 사용)
    const cleanupComponents = async () => {
      try {
        // TinyMCE 에디터 정리
        await cleanupTinyMCEEditors()
        
        // MathJax 정리 (필요한 경우)
        if (window.MathJax && window.MathJax.startup) {
          try {
            // MathJax 큐 정리
            window.MathJax.startup.document.clear()
          } catch (error) {
            console.warn('MathJax 정리 중 오류:', error)
          }
        }
        
        // 추가 대기 시간
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        console.warn('컴포넌트 정리 중 오류:', error)
      }
    }

    // 단계 네비게이션
    const nextStep = async () => {
      try {
        console.log('🚀 [OcrResultModal] nextStep 시작 - 현재 단계:', currentStep.value)

        if (currentStep.value === 1) {
          // 1단계에서 2단계로 이동 시 OCR 처리
          console.log('📝 [OcrResultModal] Step1에서 OCR 처리 시작')
          await processAllSelectedAreas()
        }

                if (currentStep.value < steps.value.length) {
          const previousStep = currentStep.value
          
          // 현재 단계의 컴포넌트 정리
          await cleanupTinyMCEEditors()
          
          // 단계 변경
          currentStep.value++
          console.log('✅ [OcrResultModal] 단계 이동:', previousStep, '→', currentStep.value)

          try {
            // DOM 업데이트를 기다린 후 추가 작업 수행
            await nextTick()

            // 2단계 진입 시 첫 번째 사용 가능한 영역으로 설정
            if (currentStep.value === 2 && availableAreaTypes?.value?.length > 0) {
              currentEditingArea.value = availableAreaTypes.value[0]
              console.log('📝 [OcrResultModal] Step2 진입 - 편집 영역 설정:', currentEditingArea.value)
            }

            // 추가 DOM 업데이트 대기
            await nextTick()
            
            // 추가 대기 시간을 주어 DOM이 완전히 업데이트되도록 함
            await new Promise(resolve => setTimeout(resolve, 100))

            // DOM 요소가 여전히 유효한지 확인
            if (!imageCanvas.value || !selectionCanvas.value) {
              console.warn('Canvas 요소가 유효하지 않음 - nextStep 완료')
            }

            console.log('✅ [OcrResultModal] nextStep 완료')
          } catch (stepError) {
            console.error('❌ [OcrResultModal] 단계 이동 중 오류:', stepError)
            // 오류가 발생해도 단계는 이동된 상태로 유지
          }
        }
      } catch (error) {
        console.error('❌ [OcrResultModal] nextStep 실행 중 오류:', error)
        console.error('❌ [OcrResultModal] 오류 상세 정보:', error.stack)
      }
    }

    const prevStep = async () => {
      try {
        console.log('⬅️ [OcrResultModal] prevStep 시작 - 현재 단계:', currentStep.value)

        if (currentStep.value > 1) {
          const previousStep = currentStep.value
          
          // 현재 단계의 컴포넌트 정리
          await cleanupTinyMCEEditors()
          
          // 단계 변경
          currentStep.value--
          console.log('✅ [OcrResultModal] 단계 이동:', previousStep, '→', currentStep.value)

          // DOM 업데이트를 기다린 후 추가 작업 수행
          await nextTick()
          
          // 추가 대기 시간을 주어 DOM이 완전히 업데이트되도록 함
          await new Promise(resolve => setTimeout(resolve, 100))
          
          console.log('✅ [OcrResultModal] prevStep 완료')
        }
      } catch (error) {
        console.error('❌ [OcrResultModal] prevStep 실행 중 오류:', error)
      }
    }

    // 챕터 데이터 업데이트 함수
    const updateChapters = (chaptersData) => {
      console.log('📚 [OcrResultModal] updateChapters 함수 호출됨!')
      console.log('📚 [OcrResultModal] 받은 데이터:', chaptersData)
      if (chaptersData.majorChapters) {
        majorChapters.value = chaptersData.majorChapters
        console.log('📚 [OcrResultModal] majorChapters 업데이트됨:', majorChapters.value)
      }
      if (chaptersData.middleChapters) {
        middleChapters.value = chaptersData.middleChapters
        console.log('📚 [OcrResultModal] middleChapters 업데이트됨:', middleChapters.value)
      }
      if (chaptersData.minorChapters) {
        minorChapters.value = chaptersData.minorChapters
        console.log('📚 [OcrResultModal] minorChapters 업데이트됨:', minorChapters.value)
      }
      if (chaptersData.topicChapters) {
        topicChapters.value = chaptersData.topicChapters
        console.log('📚 [OcrResultModal] topicChapters 업데이트됨:', topicChapters.value)
      }

      console.log('📚 [OcrResultModal] 최종 챕터 상태:', {
        majorChapters: majorChapters.value,
        middleChapters: middleChapters.value,
        minorChapters: minorChapters.value,
        topicChapters: topicChapters.value
      })
    }

    // 상태 초기화 함수
    const resetState = async () => {
      try {
        // TinyMCE 에디터 정리
        await cleanupTinyMCEEditors()

        // 모든 상태를 초기값으로 리셋
        selectedAreas.value = {
          question: null,
          problem: null,
          image: null,
          options: null
        }

        editedTexts.value = {
          question: '',
          problem: '',
          image: '',
          options: ''
        }

        currentEditingArea.value = 'question'
        activeSelectionType.value = 'problem'
        captureMode.value = true
        zoomLevel.value = 1
        currentStep.value = 1

        // DOM 업데이트를 기다린 후 추가 작업 수행
        await nextTick()

        clearCurrentSelection()
        console.log('모든 상태 초기화 완료')
      } catch (error) {
        console.error('상태 초기화 중 오류:', error)
      }
    }

    // 문제 저장 완료 처리
    const handleSaveComplete = () => {
      console.log('문제 저장 완료')
      // 성공 메시지 표시
      showSuccessMessage('문제가 성공적으로 저장되었습니다!')
      // 상태 초기화
      resetState()
      // 모달 닫기
      closeModal()
    }

    const closeModal = async () => {
      // 1) 먼저 닫아서 자식 언마운트
      emit('close')
      // 2) 다음 틱에 TinyMCE 정리
      await nextTick()
      try {
        await cleanupTinyMCEEditors()
      } catch (error) {
        console.warn('모달 닫기 중 TinyMCE 정리 오류:', error)
      }
    }

    const zoomIn = () => {
      zoomLevel.value = Math.min(zoomLevel.value + 0.1, 4)  // 10%씩 증가, 최대 400%
    }

    const zoomOut = () => {
      zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.1)  // 10%씩 감소, 최소 10%
    }

    const startCapture = () => {
      captureMode.value = true
      console.log('영역 선택 모드 시작')
    }

    const handleCanvasClick = (event) => {
      console.log('Canvas 클릭:', {
        captureMode: captureMode.value,
        activeSelectionType: activeSelectionType.value,
        waitingForSecondClick: currentSelection.value?.waitingForSecondClick
      })

      if (!captureMode.value || !activeSelectionType.value) {
        console.log('영역 선택 모드가 활성화되지 않음')
        return
      }

      // 첫 번째 클릭인지 두 번째 클릭인지 확인
      if (currentSelection.value.waitingForSecondClick) {
        console.log('두 번째 클릭 - 영역 완성')
        secondClick(event)
      } else {
        console.log('첫 번째 클릭 - 시작 지점')
        firstClick(event)
      }
    }

    // 지문 그룹 변경 처리
    const onCaptureFullImgGroupChange = (newValue) => {
      console.log('지문 그룹 변경:', newValue)
      // 필요한 경우 추가 로직 구현
    }

    const selectArea = (areaType) => {
      // 영역 선택 모드 활성화
      activeSelectionType.value = areaType
      captureMode.value = true

      // 사용자에게 명확한 안내 제공
      console.log(`${areaType} 영역 선택 모드 시작`, { areaType, captureMode: captureMode.value })

      // 기존 선택된 영역이 있다면 제거
      if (selectedAreas.value[areaType]) {
        selectedAreas.value[areaType] = null
      }
    }

    // 첫 번째 클릭 - 시작 지점
    const firstClick = (event) => {
      console.log('firstClick 호출됨')
      if (!activeSelectionType.value) {
        console.log('activeSelectionType이 없음')
        return
      }

      event.preventDefault()
      event.stopPropagation()

      // imageCanvas를 직접 사용하여 더 정확한 좌표 계산
      const canvas = imageCanvas.value
      if (!canvas) {
        console.log('이미지 Canvas가 준비되지 않음')
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      console.log('첫 번째 클릭 좌표:', {
        clientX: event.clientX,
        clientY: event.clientY,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        calculated: { x, y }
      })

      // 좌표 범위 검증
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        console.log('좌표가 Canvas 범위를 벗어남:', { x, y, rectWidth: rect.width, rectHeight: rect.height })
        return
      }

      // 선택 시작 - 더 명확한 시각적 피드백
      currentSelection.value = {
        active: true, // active를 true로 설정하여 즉시 표시
        startX: x,
        startY: y,
        x: x,
        y: y,
        width: 0,
        height: 0,
        waitingForSecondClick: true
      }

      console.log('첫 번째 클릭 - 시작 지점 설정 완료:', currentSelection.value)
    }

    // 두 번째 클릭 - 종료 지점 및 영역 완성
    const secondClick = (event) => {
      console.log('secondClick 호출됨')
      if (!activeSelectionType.value || !currentSelection.value.waitingForSecondClick) {
        console.log('secondClick 조건 불만족:', {
          activeSelectionType: activeSelectionType.value,
          waitingForSecondClick: currentSelection.value?.waitingForSecondClick
        })
        return
      }

      event.preventDefault()
      event.stopPropagation()

      // imageCanvas를 직접 사용하여 더 정확한 좌표 계산
      const canvas = imageCanvas.value
      if (!canvas) {
        console.log('이미지 Canvas가 준비되지 않음')
        return
      }

      const rect = canvas.getBoundingClientRect()
      const endX = event.clientX - rect.left
      const endY = event.clientY - rect.top

      console.log('두 번째 클릭 좌표:', {
        clientX: event.clientX,
        clientY: event.clientY,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        calculated: { endX, endY }
      })

      // 좌표 범위 검증
      if (endX < 0 || endX > rect.width || endY < 0 || endY > rect.height) {
        console.log('두 번째 클릭 좌표가 이미지 범위를 벗어남:', { endX, endY, rectWidth: rect.width, rectHeight: rect.height })
        clearCurrentSelection()
        return
      }

      const startX = currentSelection.value.startX
      const startY = currentSelection.value.startY

      // 좌표 정규화
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)

      console.log('영역 계산:', { startX, startY, endX, endY, x, y, width, height })

      // 최소 크기 체크 (더 관대하게)
      if (width < 15 || height < 15) {
        console.log('선택 영역이 너무 작음:', { width, height })
        clearCurrentSelection()
        return
      }

      // 영역 선택 완료 (화면 좌표)
      const selectedArea = { x, y, width, height }

      // 화면 좌표를 픽셀 좌표로 변환
      const pixelCoordinates = convertScreenToPixelCoordinates(selectedArea)

      // 선택된 영역을 이미지로 캡처 (픽셀 좌표 사용)
      const capturedImageData = captureSelectedArea(pixelCoordinates)

      // activeSelectionType이 null인 경우 처리하지 않음
      if (!activeSelectionType.value) {
        console.warn('선택할 영역 타입이 지정되지 않았습니다')
        return
      }

      // 화면 좌표와 이미지 데이터를 함께 저장
      selectedAreas.value[activeSelectionType.value] = {
        ...selectedArea, // 화면 좌표 (UI 표시용)
        pixelCoordinates, // 픽셀 좌표 (캡처용)
        imageData: capturedImageData
      }

      console.log(`${activeSelectionType.value} 영역 선택 완료:`, selectedArea)

      // 선택 모드 종료 (activeSelectionType을 null로 설정하지 않음)
      // activeSelectionType.value = null
      clearCurrentSelection()

      // 모든 필수 영역이 선택되었는지 확인
      if (canConvert.value) {
        console.log('모든 필수 영역 선택 완료! 변환 가능합니다.')
        // 사용자에게 성공 메시지 표시
        showSuccessMessage('모든 필수 영역이 선택되었습니다!')
      }
    }

    // 성공 메시지 표시
    const showSuccessMessage = (message) => {
      // 간단한 토스트 메시지 또는 알림 표시
      console.log('✅', message)
    }

        // 영역 타입 선택 함수 (탭 방식)
    const selectAreaType = (areaType) => {
      // areaType이 유효한지 확인
      if (!areaType || typeof areaType !== 'string') {
        console.warn('유효하지 않은 영역 타입:', areaType)
        return
      }

      // 해당 영역 타입 활성화
      activeSelectionType.value = areaType
      // 선택 모드 활성화
      captureMode.value = true
      // 현재 선택 초기화
      clearCurrentSelection()

      // 사용자에게 명확한 안내 제공
      console.log(`${areaType} 탭 선택됨 - 이미지에서 영역을 드래그하여 선택하세요`)
    }

    // 현재 선택 초기화
    const clearCurrentSelection = () => {
      currentSelection.value = {
        active: false,
        startX: 0,
        startY: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        waitingForSecondClick: false
      }
    }



    // OCR 처리 메서드들 - 개별 영역 처리
    const processOcr = async (areaType) => {
      if (!selectedAreas.value[areaType]) {
        throw new Error(`${areaType} 영역이 선택되지 않았습니다.`)
      }

      const selectedArea = selectedAreas.value[areaType]

      // 이미지 데이터 유효성 확인
      if (!selectedArea.imageData) {
        throw new Error(`${areaType} 영역의 이미지 데이터가 없습니다.`)
      }

      console.log(`${areaType} OCR 처리 시작:`, {
        areaType,
        hasImageData: !!selectedArea.imageData,
        imageDataLength: selectedArea.imageData.length,
        imageDataPrefix: selectedArea.imageData.substring(0, 50) + '...'
      })

      // props에서 과목 코드를 받아오거나 기본값 사용
      const areaCode = props.subjectCode || 'KO'
      console.log(`${areaType} 영역에 대한 과목 코드: ${areaCode} (props: ${props.subjectCode})`)

      const result = await ocrApi.processImage(
        selectedArea.imageData,
        areaCode
      )

      console.log(`${areaType} OCR API 응답:`, result)

      // OCR 결과에서 텍스트 추출 (message 필드 사용)
      const extractedText = result.message || result.text || result.data || ''
      console.log(`${areaType} 추출된 텍스트:`, extractedText)

      // 결과 반환
      return {
        areaType,
        text: extractedText,
        confidence: result.confidence || 0,
        processingTime: Date.now(),
        success: true
      }
    }

    // 병렬 OCR 처리 - Promise.all 방식
    const processAllSelectedAreas = async () => {
      if (isProcessing.value) return

      try {
        isProcessing.value = true
        console.log('전체 영역 OCR 처리 시작 (병렬 방식):', selectedAreas.value)

        // 선택된 영역 타입들 가져오기
        const selectedAreaTypes = availableAreaTypes.value.filter(areaType =>
          selectedAreas.value[areaType] && selectedAreas.value[areaType].imageData
        )

        if (selectedAreaTypes.length === 0) {
          throw new Error('처리할 영역이 없습니다.')
        }

        console.log(`선택된 영역 타입: ${selectedAreaTypes.join(', ')}`)

        // 병렬 OCR 요청 생성
        const ocrPromises = selectedAreaTypes.map(areaType =>
          processOcr(areaType).catch(error => ({
            areaType,
            text: '',
            confidence: 0,
            processingTime: Date.now(),
            success: false,
            error: error.message
          }))
        )

        // 병렬 처리 실행
        const ocrResults = await Promise.all(ocrPromises)
        console.log('OCR 처리 완료:', ocrResults)

        // 성공한 결과만 필터링
        const successfulResults = ocrResults.filter(result => result.success)
        const failedResults = ocrResults.filter(result => !result.success)

        if (failedResults.length > 0) {
          console.warn('일부 OCR 처리 실패:', failedResults)
        }

        // areaType에 따라 결과를 분기 처리하여 저장
        const resultMap = {
          question: '',
          problem: '',
          image: '',
          options: ''
        }

        successfulResults.forEach((result) => {
          const { areaType, text } = result
          if (text && areaType && areaType in resultMap) {
            resultMap[areaType] = text
            editedTexts.value[areaType] = text
            console.log(`${areaType} 영역 OCR 결과 저장:`, text)
          }
        })

        console.log('최종 결과 맵:', resultMap)
        console.log('편집 텍스트 상태:', editedTexts.value)

        // DOM 업데이트를 기다린 후 상태 초기화
        await nextTick()

        console.log('OCR 결과를 편집 텍스트에 적용 완료:', editedTexts.value)

        // OCR 결과를 itemInfo에 자동 매핑
        if (resultMap.problem) {
          itemInfo.value.solution = resultMap.problem
          console.log('문제 내용을 solution에 설정:', resultMap.problem)
        }

        if (resultMap.question) {
          // 지문이 있는 경우 explanation에 추가
          if (itemInfo.value.explanation) {
            itemInfo.value.explanation += '\n\n지문: ' + resultMap.question
          } else {
            itemInfo.value.explanation = '지문: ' + resultMap.question
          }
          console.log('지문을 explanation에 추가:', resultMap.question)
        }

        // 성공/실패 통계 표시
        showSuccessMessage(
          `OCR 처리 완료: ${successfulResults.length}개 성공, ${failedResults.length}개 실패`
        )

      } catch (error) {
        console.error('전체 OCR 처리 실패:', error)
        handleGeneralError(error, '전체 OCR 처리')
        showSuccessMessage('OCR 처리 중 오류가 발생했습니다.')
      } finally {
        isProcessing.value = false
      }
    }

    // 순차 OCR 처리 - for...of 방식 (에러 발생 시 중단)
    const processAllSelectedAreasSequential = async () => {
      if (isProcessing.value) return

      try {
        isProcessing.value = true
        console.log('전체 영역 OCR 처리 시작 (순차 방식):', selectedAreas.value)

        // 선택된 영역 타입들 가져오기
        const selectedAreaTypes = availableAreaTypes.value.filter(areaType =>
          selectedAreas.value[areaType] && selectedAreas.value[areaType].imageData
        )

        if (selectedAreaTypes.length === 0) {
          throw new Error('처리할 영역이 없습니다.')
        }

        console.log(`선택된 영역 타입: ${selectedAreaTypes.join(', ')}`)

        const ocrResults = []
        let successCount = 0
        let failureCount = 0

        // 순차 처리 (에러 발생 시 중단)
        for (const areaType of selectedAreaTypes) {
          try {
            console.log(`${areaType} 영역 OCR 처리 중...`)
            const result = await processOcr(areaType)
            ocrResults.push(result)
            successCount++

            // 실시간 진행 상황 표시
            showSuccessMessage(`${areaType} OCR 처리 완료`)

          } catch (error) {
            console.error(`${areaType} OCR 처리 실패:`, error)
            failureCount++

            // 에러 발생 시 중단 여부 선택
            const shouldContinue = confirm(`${areaType} OCR 처리에 실패했습니다. 계속 진행하시겠습니까?`)
            if (!shouldContinue) {
              throw new Error(`${areaType} OCR 처리 실패로 인해 중단되었습니다.`)
            }
          }
        }

        console.log('순차 OCR 처리 완료:', ocrResults)

        // areaType에 따라 결과를 분기 처리하여 저장
        const resultMap = {
          question: '',
          problem: '',
          image: '',
          options: ''
        }

        ocrResults.forEach((result) => {
          const { areaType, text } = result
          if (text && areaType && areaType in resultMap) {
            resultMap[areaType] = text
            editedTexts.value[areaType] = text
            console.log(`${areaType} 영역 OCR 결과 저장:`, text)
          }
        })

        console.log('최종 결과 맵:', resultMap)
        console.log('편집 텍스트 상태:', editedTexts.value)

        // DOM 업데이트를 기다린 후 상태 초기화
        await nextTick()

        console.log('OCR 결과를 편집 텍스트에 적용 완료:', editedTexts.value)

        // OCR 결과를 itemInfo에 자동 매핑
        if (resultMap.problem) {
          itemInfo.value.solution = resultMap.problem
          console.log('문제 내용을 solution에 설정:', resultMap.problem)
        }

        if (resultMap.question) {
          // 지문이 있는 경우 explanation에 추가
          if (itemInfo.value.explanation) {
            itemInfo.value.explanation += '\n\n지문: ' + resultMap.question
          } else {
            itemInfo.value.explanation = '지문: ' + resultMap.question
          }
          console.log('지문을 explanation에 추가:', resultMap.question)
        }

        // 성공/실패 통계 표시
        showSuccessMessage(
          `OCR 처리 완료: ${successCount}개 성공, ${failureCount}개 실패`
        )

      } catch (error) {
        console.error('순차 OCR 처리 실패:', error)
        handleGeneralError(error, '순차 OCR 처리')
        showSuccessMessage('OCR 처리 중 오류가 발생했습니다.')
      } finally {
        isProcessing.value = false
      }
    }

    // OCR 처리 방식 선택 핸들러
    const handleOcrProcessing = async (processingType) => {
      try {
        console.log(`선택된 OCR 처리 방식: ${processingType}`)

        switch (processingType) {
          case 'parallel':
            await processAllSelectedAreas()
            break
          case 'sequential':
            await processAllSelectedAreasSequential()
            break
          case 'batch':
            await processAllSelectedAreasBatch()
            break
          default:
            console.warn('알 수 없는 처리 방식:', processingType)
            showSuccessMessage('올바른 처리 방식을 선택해주세요.')
            return
        }

        // OCR 처리 완료 후 다음 단계로 자동 진행
        if (currentStep.value === 1) {
          await nextTick()
          nextStep()
        }

      } catch (error) {
        console.error('OCR 처리 방식 선택 오류:', error)
        showSuccessMessage('OCR 처리 중 오류가 발생했습니다.')
      }
    }

    // 하이브리드 OCR 처리 - 배치 방식 (그룹별 병렬 처리)
    const processAllSelectedAreasBatch = async (batchSize = 2) => {
      if (isProcessing.value) return

      try {
        isProcessing.value = true
        console.log(`전체 영역 OCR 처리 시작 (배치 방식, 배치 크기: ${batchSize}):`, selectedAreas.value)

        // 선택된 영역 타입들 가져오기
        const selectedAreaTypes = availableAreaTypes.value.filter(areaType =>
          selectedAreas.value[areaType] && selectedAreas.value[areaType].imageData
        )

        if (selectedAreaTypes.length === 0) {
          throw new Error('처리할 영역이 없습니다.')
        }

        console.log(`선택된 영역 타입: ${selectedAreaTypes.join(', ')}`)

        const allResults = []
        let successCount = 0
        let failureCount = 0

        // 배치 단위로 처리
        for (let i = 0; i < selectedAreaTypes.length; i += batchSize) {
          const batch = selectedAreaTypes.slice(i, i + batchSize)
          console.log(`배치 ${Math.floor(i / batchSize) + 1} 처리 중: ${batch.join(', ')}`)

          try {
            // 배치 내에서 병렬 처리
            const batchPromises = batch.map(areaType =>
              processOcr(areaType).catch(error => ({
                areaType,
                text: '',
                confidence: 0,
                processingTime: Date.now(),
                success: false,
                error: error.message
              }))
            )

            const batchResults = await Promise.all(batchPromises)
            allResults.push(...batchResults)

            // 배치 결과 통계
            const batchSuccess = batchResults.filter(r => r.success).length
            const batchFailure = batchResults.filter(r => !r.success).length
            successCount += batchSuccess
            failureCount += batchFailure

            console.log(`배치 ${Math.floor(i / batchSize) + 1} 완료: ${batchSuccess}개 성공, ${batchFailure}개 실패`)

            // 배치 간 짧은 지연 (서버 부하 분산)
            if (i + batchSize < selectedAreaTypes.length) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }

          } catch (error) {
            console.error(`배치 ${Math.floor(i / batchSize) + 1} 처리 실패:`, error)
            failureCount += batch.length
          }
        }

        console.log('배치 OCR 처리 완료:', allResults)

        // areaType에 따라 결과를 분기 처리하여 저장
        const resultMap = {
          question: '',
          problem: '',
          image: '',
          options: ''
        }

        allResults.forEach((result) => {
          const { areaType, text, success } = result
          if (success && text && areaType && areaType in resultMap) {
            resultMap[areaType] = text
            editedTexts.value[areaType] = text
            console.log(`${areaType} 영역 OCR 결과 저장:`, text)
          }
        })

        console.log('최종 결과 맵:', resultMap)
        console.log('편집 텍스트 상태:', editedTexts.value)

        // DOM 업데이트를 기다린 후 상태 초기화
        await nextTick()

        console.log('OCR 결과를 편집 텍스트에 적용 완료:', editedTexts.value)

        // OCR 결과를 itemInfo에 자동 매핑
        if (resultMap.problem) {
          itemInfo.value.solution = resultMap.problem
          console.log('문제 내용을 solution에 설정:', resultMap.problem)
        }

        if (resultMap.question) {
          // 지문이 있는 경우 explanation에 추가
          if (itemInfo.value.explanation) {
            itemInfo.value.explanation += '\n\n지문: ' + resultMap.question
          } else {
            itemInfo.value.explanation = '지문: ' + resultMap.question
          }
          console.log('지문을 explanation에 추가:', resultMap.question)
        }

        // 성공/실패 통계 표시
        showSuccessMessage(
          `OCR 처리 완료: ${successCount}개 성공, ${failureCount}개 실패 (배치 방식)`
        )

      } catch (error) {
        console.error('배치 OCR 처리 실패:', error)
        handleGeneralError(error, '배치 OCR 처리')
        showSuccessMessage('OCR 처리 중 오류가 발생했습니다.')
      } finally {
        isProcessing.value = false
      }
    }

    const resetCapture = async () => {
      try {
        captureMode.value = false

        // 상태 초기화
        selectedAreas.value = {
          question: null,
          problem: null,
          image: null,
          options: null
        }

        editedTexts.value = {
          question: '',
          problem: '',
          image: '',
          options: ''
        }

        clearCurrentSelection()

        // DOM 업데이트를 기다린 후 추가 작업 수행
        await nextTick()

        console.log('영역 선택 초기화 완료')
      } catch (error) {
        console.error('resetCapture 실행 중 오류:', error)
      }
    }

    // 편집 관련 메서드 (DOM 안정성 강화)
    const selectEditingArea = async (areaType) => {
      try {
        // 1단계: 현재 상태 백업
        const previousArea = currentEditingArea.value

        // 2단계: 새 영역으로 전환 (안전하게)
        if (areaType && typeof areaType === 'string') {
          currentEditingArea.value = areaType
          console.log('편집 영역 전환 요청:', { from: previousArea, to: areaType })
        } else {
          console.warn('유효하지 않은 영역 타입:', areaType)
          return
        }

        // 3단계: DOM 업데이트 완료 대기
        await nextTick()

        // 4단계: 상태 검증
        if (currentEditingArea.value === areaType) {
          console.log('편집 영역 변경 완료:', {
            area: areaType,
            timestamp: new Date().toISOString()
          })
        } else {
          console.warn('편집 영역 변경 실패:', { expected: areaType, actual: currentEditingArea.value })
        }

      } catch (error) {
        console.error('편집 영역 변경 중 치명적 오류:', error)
        // 에러 발생 시 기본 상태로 복구 시도
        try {
          currentEditingArea.value = 'problem'
          console.log('복구: 기본 영역으로 설정')
        } catch (recoveryError) {
          console.error('복구 시도 실패:', recoveryError)
        }
      }
    }

    const copyOcrToEditor = () => {
      // props의 ocrResults는 읽기 전용이므로 로컬 상태로 관리
      console.log('OCR 결과를 편집기에 복사')
    }

    const clearEditor = () => {
      editedTexts.value[currentEditingArea.value] = ''
    }

    // 단원 선택 관련 메서드
    const onMajorChapterChange = () => {
      itemInfo.value.middleChapter = ''
      itemInfo.value.minorChapter = ''
      // 중단원 목록 업데이트
      middleChapters.value = [
        { id: 1, name: '중단원 1-1' },
        { id: 2, name: '중단원 1-2' }
      ]
    }

    const onMiddleChapterChange = () => {
      itemInfo.value.minorChapter = ''
      // 소단원 목록 업데이트
      minorChapters.value = [
        { id: 1, name: '소단원 1-1-1' },
        { id: 2, name: '소단원 1-1-2' }
      ]
    }

    // 단원 경로 문자열 생성
    const getChapterPath = () => {
      const parts = []
      if (itemInfo.value.majorChapter) {
        const major = majorChapters.value.find(c => c.id === itemInfo.value.majorChapter)
        if (major) parts.push(major.name)
      }
      if (itemInfo.value.middleChapter) {
        const middle = middleChapters.value.find(c => c.id === itemInfo.value.middleChapter)
        if (middle) parts.push(middle.name)
      }
      if (itemInfo.value.minorChapter) {
        const minor = minorChapters.value.find(c => c.id === itemInfo.value.minorChapter)
        if (minor) parts.push(minor.name)
      }
      return parts.join(' > ') || '단원 미선택'
    }

    // 최종 저장
    const saveItem = () => {
      const itemData = {
        // 기본 정보 (Step3InfoInput 구조에 맞춤)
        itemType: itemInfo.value.problemType,
        difficulty: itemInfo.value.difficulty,
        answer: itemInfo.value.answer,
        majorChapter: itemInfo.value.majorChapter,
        middleChapter: itemInfo.value.middleChapter,
        minorChapter: itemInfo.value.minorChapter,
        topicChapter: itemInfo.value.topicChapter,
        explanation: itemInfo.value.explanation,

        // 선택된 영역 데이터
        selectedAreas: selectedAreas.value,

        // 편집된 텍스트
        editedTexts: editedTexts.value,

        // 지문 그룹 (해당하는 경우)
        captureFullImgGroup: selectedCaptureFullImgGroup.value,
        newCaptureFullImgGroupTitle: newCaptureFullImgGroupTitle.value
      }

      emit('save', itemData)
      closeModal()
    }

    // Canvas 설정 및 이미지 렌더링
    const setupCanvas = () => {
      if (!props.capturedImage || !imageCanvas.value) {
        console.log('Canvas 설정 실패:', {
          hasCapturedImage: !!props.capturedImage,
          hasImageCanvas: !!imageCanvas.value,
          capturedImage: props.capturedImage ? props.capturedImage.substring(0, 100) + '...' : 'null'
        })
        return
      }

      try {
        // capturedImage가 base64 이미지 데이터인지 확인
        let imageData = props.capturedImage

        // base64 이미지 데이터인 경우 직접 사용
        if (props.capturedImage.startsWith('data:image/')) {
          console.log('base64 이미지 데이터 직접 사용')
          imageData = props.capturedImage
        }
        // JSON 문자열인 경우 파싱
        else if (props.capturedImage.startsWith('{')) {
          try {
            const areaInfo = JSON.parse(props.capturedImage)
            console.log('선택된 영역 정보:', areaInfo)

            // 캡처된 이미지가 있으면 사용, 없으면 더미 이미지 생성
            if (areaInfo.imageData) {
              console.log('캡처된 이미지 데이터 사용')
              imageData = areaInfo.imageData
            } else {
              console.log('더미 이미지 생성')
              // 더미 이미지 생성 (실제 이미지 대신)
              const dummyCanvas = document.createElement('canvas')
              dummyCanvas.width = areaInfo.width || 400
              dummyCanvas.height = areaInfo.height || 300
              const dummyCtx = dummyCanvas.getContext('2d')

              // 더미 이미지 그리기
              dummyCtx.fillStyle = '#f0f8ff'
              dummyCtx.fillRect(0, 0, dummyCanvas.width, dummyCanvas.height)
              dummyCtx.fillStyle = '#333'
              dummyCtx.font = '16px Arial'
              dummyCtx.fillText('선택된 영역', 20, 30)
              dummyCtx.fillText(`위치: (${areaInfo.x}, ${areaInfo.y})`, 20, 50)
              dummyCtx.fillText(`크기: ${areaInfo.width} x ${areaInfo.height}`, 20, 70)
              dummyCtx.fillText(`페이지: ${areaInfo.pageIndex + 1}`, 20, 90)

              // 더미 이미지를 data URL로 변환
              imageData = dummyCanvas.toDataURL('image/png')
            }

          } catch (parseError) {
            console.error('JSON 파싱 실패:', parseError)
            return
          }
        } else {
          console.error('지원하지 않는 이미지 데이터 형식:', typeof props.capturedImage)
          return
        }

        const canvas = imageCanvas.value

        // DOM 요소가 여전히 유효한지 확인
        if (!canvas || !canvas.getContext) {
          console.warn('Canvas 요소가 유효하지 않음 - setupCanvas 중단')
          return
        }

        const ctx = canvas.getContext('2d')

        const img = new Image()
        img.onload = () => {
          // 컨테이너 크기 가져오기
          const container = imageCanvas.value?.parentElement
          if (!container) return

          // DOM 요소가 여전히 유효한지 확인
          if (!container || !container.getBoundingClientRect) {
            console.warn('컨테이너 요소가 유효하지 않음 - setupCanvas 중단')
            return
          }

          const containerRect = container.getBoundingClientRect()
          const maxContainerWidth = containerRect.width - 32 // padding 제외
          const maxContainerHeight = containerRect.height - 32 // padding 제외

          // 이미지 크기를 컨테이너에 맞게 조정
          let displayWidth = img.naturalWidth
          let displayHeight = img.naturalHeight

          // 컨테이너보다 큰 경우 비율을 유지하면서 크기 조정
          if (displayWidth > maxContainerWidth || displayHeight > maxContainerHeight) {
            const scaleX = maxContainerWidth / displayWidth
            const scaleY = maxContainerHeight / displayHeight
            const scale = Math.min(scaleX, scaleY, 1) // 1보다 크게 확대하지 않음

            displayWidth = displayWidth * scale
            displayHeight = displayHeight * scale
          }

          // Canvas 크기를 조정된 크기로 설정
          canvas.width = displayWidth
          canvas.height = displayHeight

          // 이미지를 Canvas에 그리기 (조정된 크기로)
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight)

          console.log('Canvas 설정 완료:', {
            originalSize: { width: img.naturalWidth, height: img.naturalHeight },
            adjustedSize: { width: displayWidth, height: displayHeight },
            containerSize: { width: maxContainerWidth, height: maxContainerHeight },
            scale: displayWidth / img.naturalWidth
          })

          // Canvas 오버레이 설정
          nextTick(() => {
            setupCanvasOverlay()
          })
        }

        img.onerror = (error) => {
          console.error('이미지 로드 실패:', error)
        }

        img.src = imageData
      } catch (error) {
        console.error('Canvas 설정 오류:', error)
      }
    }

            // Canvas 오버레이 설정
    const setupCanvasOverlay = () => {
      if (!imageCanvas.value || !selectionCanvas.value) return

      const imageCanvasEl = imageCanvas.value
      const selectionCanvasEl = selectionCanvas.value

      // DOM 요소가 여전히 유효한지 확인
      if (!imageCanvasEl || !selectionCanvasEl || !imageCanvasEl.parentElement) {
        console.warn('Canvas 요소가 유효하지 않음 - setupCanvasOverlay 중단')
        return
      }

      try {
        // image-canvas의 실제 화면 크기 가져오기
        const imageRect = imageCanvasEl.getBoundingClientRect()
        const containerRect = imageCanvasEl.parentElement.getBoundingClientRect()

        // 컨테이너 기준으로 상대 위치 계산
        const relativeTop = imageRect.top - containerRect.top
        const relativeLeft = imageRect.left - containerRect.left

        // selection-canvas를 image-canvas와 정확히 같은 크기와 위치로 설정
        // 1. 픽셀 크기 설정 (실제 Canvas 크기)
        selectionCanvasEl.width = imageCanvasEl.width
        selectionCanvasEl.height = imageCanvasEl.height

        // 2. CSS 스타일 크기 설정 (화면 표시 크기)
        // 줌 레벨이 100% 이상일 때도 컨테이너 영역을 벗어나지 않도록 제한
        const maxWidth = Math.min(imageRect.width, containerRect.width - 32) // padding 고려
        const maxHeight = Math.min(imageRect.height, containerRect.height - 32) // padding 고려

        // image-canvas의 CSS 크기도 제한
        imageCanvasEl.style.width = `${maxWidth}px`
        imageCanvasEl.style.height = `${maxHeight}px`

        // selection-canvas 크기 설정
        selectionCanvasEl.style.width = `${maxWidth}px`
        selectionCanvasEl.style.height = `${maxHeight}px`

        // 3. 위치 설정 - 컨테이너 중앙에 맞춤
        selectionCanvasEl.style.position = 'absolute'

        // image-canvas가 컨테이너보다 클 때 중앙 정렬
        if (imageRect.width > containerRect.width - 32 || imageRect.height > containerRect.height - 32) {
          // 컨테이너 중앙에 맞춰서 위치 조정
          const centerTop = (containerRect.height - maxHeight) / 2
          const centerLeft = (containerRect.width - maxWidth) / 2

          // image-canvas도 중앙 정렬
          imageCanvasEl.style.position = 'absolute'
          imageCanvasEl.style.top = `${centerTop}px`
          imageCanvasEl.style.left = `${centerLeft}px`

          // selection-canvas도 같은 위치에
          selectionCanvasEl.style.top = `${centerTop}px`
          selectionCanvasEl.style.left = `${centerLeft}px`
        } else {
          // image-canvas와 동일한 위치
          selectionCanvasEl.style.top = `${relativeTop}px`
          selectionCanvasEl.style.left = `${relativeLeft}px`
        }

        console.log('Canvas 오버레이 설정 완료:', {
          imageCanvas: {
            pixelWidth: imageCanvasEl.width,
            pixelHeight: imageCanvasEl.height,
            displayWidth: maxWidth,
            displayHeight: maxHeight
          },
          selectionCanvas: {
            pixelWidth: selectionCanvasEl.width,
            pixelHeight: selectionCanvasEl.height,
            styleWidth: maxWidth,
            styleHeight: maxHeight
          },
          container: {
            width: containerRect.width - 32,
            height: containerRect.height - 32
          },
          position: {
            top: selectionCanvasEl.style.top,
            left: selectionCanvasEl.style.left
          }
        })
      } catch (error) {
        console.warn('Canvas 오버레이 설정 중 오류:', error)
      }
    }

    // 화면 좌표를 픽셀 좌표로 변환
    const convertScreenToPixelCoordinates = (screenSelection) => {
      try {
        if (!imageCanvas.value) {
          console.error('이미지 Canvas가 준비되지 않음')
          return screenSelection
        }

        const canvas = imageCanvas.value

        // DOM 요소가 여전히 유효한지 확인
        if (!canvas || !canvas.getBoundingClientRect) {
          console.warn('Canvas 요소가 유효하지 않음 - convertScreenToPixelCoordinates 중단')
          return screenSelection
        }

        const rect = canvas.getBoundingClientRect()

        // 화면 표시 크기와 실제 픽셀 크기의 비율 계산 (줌 레벨 고려)
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        // 화면 좌표를 픽셀 좌표로 변환 (줌 레벨 고려)
        const pixelX = Math.round(screenSelection.x * scaleX)
        const pixelY = Math.round(screenSelection.y * scaleY)
        const pixelWidth = Math.round(screenSelection.width * scaleX)
        const pixelHeight = Math.round(screenSelection.height * scaleY)

        console.log('좌표 변환:', {
          화면좌표: screenSelection,
          픽셀좌표: { x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight },
          스케일: { scaleX, scaleY },
          줌레벨: zoomLevel.value,
          Canvas크기: { width: canvas.width, height: canvas.height },
          화면크기: { width: rect.width, height: rect.height }
        })

        return {
          x: pixelX,
          y: pixelY,
          width: pixelWidth,
          height: pixelHeight
        }

      } catch (error) {
        console.error('좌표 변환 오류:', error)
        return screenSelection
      }
    }

    // 선택된 영역을 이미지로 캡처
    const captureSelectedArea = (selection) => {
      try {
        if (!imageCanvas.value) {
          console.error('이미지 Canvas가 준비되지 않음')
          return null
        }

        const canvas = imageCanvas.value

        // DOM 요소가 여전히 유효한지 확인
        if (!canvas || !canvas.getContext) {
          console.warn('Canvas 요소가 유효하지 않음 - captureSelectedArea 중단')
          return null
        }

        // 선택된 영역의 좌표와 크기
        const { x, y, width, height } = selection

        // 새로운 Canvas 생성하여 선택된 영역만 복사
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height

        const tempCtx = tempCanvas.getContext('2d')

        // 원본 Canvas에서 선택된 영역을 새 Canvas로 복사
        tempCtx.drawImage(
          canvas,
          x, y, width, height,  // 원본에서 잘라낼 영역
          0, 0, width, height   // 새 Canvas에 그릴 위치와 크기
        )

        // Base64 이미지 데이터로 변환
        const imageDataUrl = tempCanvas.toDataURL('image/png')

        console.log('영역 캡처 완료:', {
          selection,
          capturedSize: { width, height },
          imageDataLength: imageDataUrl.length
        })

        return imageDataUrl

      } catch (error) {
        console.error('영역 캡처 오류:', error)
        return null
      }
    }

    // capturedImage 변경 감지하여 Canvas 설정
    watch(() => props.capturedImage, (newImage) => {
      console.log('=== capturedImage 변경 감지 ===')
      console.log('새로운 이미지:', {
        hasImage: !!newImage,
        imageType: typeof newImage,
        imageLength: newImage ? newImage.length : 0,
        imagePrefix: newImage ? newImage.substring(0, 100) + '...' : 'null'
      })

      if (newImage) {
        nextTick(() => {
          console.log('nextTick 실행 - setupCanvas 호출')
          // DOM 요소가 여전히 유효한지 확인
          if (imageCanvas.value) {
            setupCanvas()
          }
        })
      } else {
        console.log('capturedImage가 null이거나 빈 값')
      }
    }, { immediate: true })

    // 줌 레벨 변경 감지하여 Canvas 오버레이 재설정
    watch(zoomLevel, () => {
      if (imageCanvas.value && selectionCanvas.value) {
        nextTick(() => {
          // DOM 요소가 여전히 유효한지 확인
          if (imageCanvas.value && selectionCanvas.value) {
            updateSelectionCanvasPosition()
          }
        })
      }
    })

    // selectedAreas 변경 시 hasCaptureFullImg 업데이트
    watch(selectedAreas, (newAreas) => {
      if (itemInfo.value) {
        itemInfo.value.hasCaptureFullImg = !!newAreas?.question
      }
    }, { deep: true })

    // 줌 레벨 변경 시 selection-canvas 위치만 업데이트
    const updateSelectionCanvasPosition = () => {
      if (!imageCanvas.value || !selectionCanvas.value) return

      const imageCanvasEl = imageCanvas.value
      const selectionCanvasEl = selectionCanvas.value

      // DOM 요소가 여전히 유효한지 확인
      if (!imageCanvasEl || !selectionCanvasEl || !imageCanvasEl.parentElement) {
        console.warn('Canvas 요소가 유효하지 않음 - updateSelectionCanvasPosition 중단')
        return
      }

      try {
        // image-canvas의 현재 화면 크기 가져오기
        const imageRect = imageCanvasEl.getBoundingClientRect()
        const containerRect = imageCanvasEl.parentElement.getBoundingClientRect()

        // selection-canvas를 image-canvas와 정확히 같은 크기와 위치로 설정
        selectionCanvasEl.width = imageCanvasEl.width
        selectionCanvasEl.height = imageCanvasEl.height

        // image-canvas의 실제 CSS 스타일 값을 직접 사용
        const computedStyle = window.getComputedStyle(imageCanvasEl)
        const imageTop = computedStyle.top
        const imageLeft = computedStyle.left
        const imagePosition = computedStyle.position
        const imageWidth = computedStyle.width
        const imageHeight = computedStyle.height

        // selection-canvas를 image-canvas와 정확히 같은 크기와 위치로 설정
        selectionCanvasEl.style.position = 'absolute'
        selectionCanvasEl.style.width = imageWidth
        selectionCanvasEl.style.height = imageHeight
        selectionCanvasEl.style.top = imageTop
        selectionCanvasEl.style.left = imageLeft

        console.log('Selection Canvas 위치 업데이트 완료:', {
          zoomLevel: zoomLevel.value,
          imageCanvas: {
            computedStyle: { top: imageTop, left: imageLeft, position: imagePosition },
            displayWidth: imageRect.width,
            displayHeight: imageRect.height,
            rect: { top: imageRect.top, left: imageRect.left }
          },
          container: {
            rect: { top: containerRect.top, left: containerRect.left }
          },
          selectionCanvas: {
            styleWidth: imageWidth,
            styleHeight: imageHeight,
            style: { top: imageTop, left: imageLeft, position: imagePosition }
          }
        })
      } catch (error) {
        console.warn('Selection Canvas 위치 업데이트 중 오류:', error)
      }
    }

    return {
      // 단계 관리
      currentStep,
      steps,
      nextStep,
      prevStep,
      canProceedToNext,
      canSaveItem,

      // 상태 관리
      zoomLevel,
      selectedArea,
      selectedProblemIndex,
      captureMode,
      imageCanvas,
      selectionCanvas,
      selectedAreas,
      hasValidSelectedAreas,
      activeSelectionType,
      safeActiveSelectionType,
      currentSelection,
      canConvert,
      isProcessing,
      processingOcr,

      // 편집 관리
      currentEditingArea,
      availableAreaTypes,
      editedTexts,
      onEditedTextsUpdate,
      selectEditingArea,
      copyOcrToEditor,
      clearEditor,
      processOcr,

      // 문제 정보
      itemInfo,
      captureFullImgGroups,
      selectedCaptureFullImgGroup,
      newCaptureFullImgGroupTitle,
      showCaptureFullImgGroupSection,

      // 단원 정보
      majorChapters,
      middleChapters,
      minorChapters,
      topicChapters,
      updateChapters,
      onMajorChapterChange,
      onMiddleChapterChange,
      getChapterPath,



      // 이벤트 핸들러
      closeModal,
      zoomIn,
      zoomOut,
      startCapture,
      saveItem,
      onCaptureFullImgGroupChange,
      handleSaveComplete,

      // Canvas 관리
      currentSelectionStyle,
      waitingSelectionStyle,
      setupCanvas,
      setupCanvasOverlay,
      updateSelectionCanvasPosition,
      convertScreenToPixelCoordinates,
      captureSelectedArea,
      handleCanvasClick,
      selectArea,
      firstClick,
      secondClick,
      clearCurrentSelection,
      processAllSelectedAreas,
      processAllSelectedAreasSequential,
      processAllSelectedAreasBatch,
      handleOcrProcessing,
      resetCapture,
      resetState,
      showSuccessMessage,
      selectAreaType
    }
  }
}
</script>

<style scoped>
/* 모달 오버레이 */
.ocr-result-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
  position: relative;
  width: 95vw;
  max-width: 1400px;
  height: 95vh;
  max-height: 800px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* OcrResultHeader 컴포넌트 스타일 */
.ocr-result-header {
  flex-shrink: 0;
  z-index: 10;
  border-radius: 12px 12px 0 0;
}

/* 모달 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 단계 진행 표시 */
.step-progress {
  margin-top: 0.5rem;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.step-item.active {
  color: #3b82f6;
  font-weight: 600;
}

.step-item.completed {
  color: #10b981;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid currentColor;
  background-color: white;
}

.step-item.active .step-circle {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.step-item.completed .step-circle {
  background-color: #10b981;
  color: white;
  border-color: #10b981;
}

.step-label {
  font-weight: inherit;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.section-subtitle {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background-color: #f3f4f6;
  color: #374151;
}

/* 모달 내용 */
.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow:auto;
}

.content-layout {
  display: grid;
  grid-template-columns: 0.6fr 1fr;
  gap: 2rem;
  height: 100%;
}

/* 왼쪽 컬럼: 이미지 자르기 */
.left-column {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #f8fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: white;
  border-radius: 12px 12px 0 0;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-level {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  min-width: 50px;
  text-align: center;
}

.image-container {
  flex: 1;
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  min-height: 400px;
  max-height: 500px;
  background-color: #f8fafc;
}

.canvas-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden; /* selection-canvas가 밖으로 튀어나가지 않도록 제한 */
}

.image-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selection-canvas {
  position: absolute;
  pointer-events: auto;
  cursor: crosshair;
  background: transparent;
  /* top과 left는 JavaScript에서 동적으로 설정 */
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background-color: #f8fafc;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  text-align: center;
  width: 100%;
}

.no-image p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

/* 영역 선택 스타일 */
.selection-area {
  position: absolute;
  border: 2px dashed #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  pointer-events: none;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 40px;
  transition: all 0.2s ease;
}

.selection-area:hover {
  transform: scale(1.02);
}

.selection-type-label {
  position: absolute;
  top: -25px;
  left: 0;
  background-color: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.waiting-selection-point {
  position: absolute;
  pointer-events: none;
  z-index: 25;
}

.waiting-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite;
}

.waiting-text {
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.image-controls {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: white;
  border-radius: 0 0 12px 12px;
}

/* 오른쪽 컬럼: 영역 선택 */
.right-column {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #f8fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.area-selection-guide {
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.area-selection-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0 1rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.area-selection-container::-webkit-scrollbar {
  width: 6px;
}

.area-selection-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.area-selection-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.area-selection-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.area-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.area-selection-box {
  height: 120px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: white;
}

.area-selection-box:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.question-box {
  border-color: #3b82f6;
}

.problem-box {
  border-color: #8b5cf6;
}

.image-box {
  border-color: #10b981;
}

.options-box {
  border-color: #f59e0b;
}

.area-selection-box.selected {
  border-style: solid;
  border-width: 3px;
  background-color: #f0f9ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.area-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.placeholder-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.selected-area-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  position: relative;
}

.selected-area-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
  max-width: 100%;
  max-height: 100%;
}

.area-badge {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.area-check {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #10b981;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}



/* 단계별 컨텐츠 스타일 */
.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

/* 2단계: 편집 레이아웃 */
.editing-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.area-tabs {
  display: flex;
  gap: 0.5rem;
}

.area-tab {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.area-tab:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.area-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.area-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editing-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 1.5rem;
  flex: 1;
}

.editing-left {
  display: flex;
  flex-direction: column;
}

.selected-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  min-height: 300px;
}

.area-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.editing-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ocr-result-section,
.text-editor-section {
  flex: 1;
}

.ocr-result-section h4,
.text-editor-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #1e293b;
}

.ocr-result-box {
  margin-bottom: 0.75rem;
}

.ocr-textarea,
.editor-textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
}

.ocr-textarea {
  background-color: #f8fafc;
}

.ocr-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* 3단계: 정보 입력 레이아웃 */
.info-input-layout {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-sections {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-control,
.form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-control:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.captureFullImgGroupControls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chapter-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.solution-textarea {
  min-height: 100px;
  resize: vertical;
}

/* 4단계: 미리보기 레이아웃 */
.preview-layout {
  padding: 1.5rem;
  overflow-y: auto;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.preview-info {
  display: flex;
  gap: 0.5rem;
}

.preview-content {
  max-width: 800px;
  margin: 0 auto;
}

.preview-item-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.item-header {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-meta {
  display: flex;
  gap: 0.5rem;
}

.item-type,
.item-difficulty,
.item-score {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-type {
  background: #dbeafe;
  color: #1e40af;
}

.item-difficulty {
  background: #fef3c7;
  color: #92400e;
}

.item-score {
  background: #d1fae5;
  color: #065f46;
}

.item-chapter {
  font-size: 0.875rem;
  color: #6b7280;
}

.item-content {
  padding: 1.5rem;
}

.itemCaptureFullImg,
.item-problem,
.item-image,
.item-options,
.item-answer,
.item-solution,
.item-explanation {
  margin-bottom: 1.5rem;
}

.itemCaptureFullImg h5,
.item-problem h5,
.item-image h5,
.item-options h5,
.item-answer h5,
.item-solution h5,
.item-explanation h5 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.content-text {
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}

.preview-image {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.image-caption {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

.answer-text {
  font-weight: 600;
  color: #059669;
}

/* 모달 액션 */
.modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.action-left,
.action-right {
  display: flex;
  gap: 1rem;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 0.6fr 1fr;
    gap: 1rem;
  }

  .modal-container {
    width: 95vw;
    height: 95vh;
  }
}

@media (max-width: 768px) {
  .modal-header,
  .modal-content,
  .modal-actions {
    padding: 1rem;
  }

  .section-header {
    padding: 0.75rem;
  }

  .content-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .left-column {
    order: 2;
  }

  .right-column {
    order: 1;
  }
}

/* 지문 그룹 관리 섹션 */
.captureFullImgGroupSection {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.captureFullImgGroupSection .section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.captureFullImgGroupControls .form-group {
  margin-bottom: 0;
}

.captureFullImgGroupControls .form-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.captureFullImgGroupControls .form-select {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
}

/* 영역 타입 선택 섹션 */
.area-type-selection {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.area-type-selection .section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.area-type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.area-type-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.area-type-btn:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
  color: #1e40af;
}

.area-type-btn.active {
  border-color: #3b82f6;
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.area-type-btn i {
  font-size: 0.75rem;
}

/* 지문 그룹 관리 섹션 */
.captureFullImgGroupSection {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.captureFullImgGroupSection .section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.captureFullImgGroupControls .form-group {
  margin-bottom: 0;
}

.captureFullImgGroupControls .form-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.captureFullImgGroupControls .form-select {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
}

/* 영역 타입 선택 섹션 */
.area-type-selection {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.area-type-selection .section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.area-type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.area-type-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.area-type-btn:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
  color: #1e40af;
}

.area-type-btn.active {
  border-color: #3b82f6;
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.area-type-btn i {
  font-size: 0.75rem;
}

/* 영역 선택 컨테이너 개선 */
.area-selection-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
  max-height: 800px;
  overflow-y: auto;
  padding: 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
  min-height: 600px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.area-selection-container::-webkit-scrollbar {
  width: 8px;
}

.area-selection-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.area-selection-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.area-selection-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.area-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
}

.area-selection-box {
  min-height: 160px;
  height: auto;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: white;
  padding: 1.5rem;
}

.area-selection-box:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.area-selection-box.selected {
  border-style: solid;
  border-width: 3px;
  background-color: #f0f9ff;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transform: scale(1.02);
}

.area-selection-box.active-type {
  border-color: #f59e0b;
  border-width: 3px;
  background-color: #fffbeb;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  transform: scale(1.01);
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.5);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .area-selection-container {
    max-height: 600px;
    padding: 1rem;
    gap: 1.5rem;
  }

  .area-selection-box {
    min-height: 140px;
    padding: 1rem;
  }

  .area-title {
    margin: 0 0 0.75rem 0;
  }

  .area-type-buttons {
    flex-direction: column;
  }

  .area-type-btn {
    width: 100%;
    justify-content: center;
  }
}

/* 영역 타입 선택 탭 스타일 */
.area-type-tabs {
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  overflow: hidden;
}

.tab-header {
  display: flex;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.tab-btn {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border: none;
  background-color: transparent;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  justify-content: center;
  position: relative;
  border-right: 1px solid #e2e8f0;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.tab-btn.active {
  background-color: white;
  color: #1e293b;
  font-weight: 600;
  border-bottom: 2px solid #3b82f6;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3b82f6;
}

.tab-btn i {
  font-size: 0.875rem;
  margin-right: 0.5rem;
}

.tab-content {
  padding: 1rem;
  background-color: white;
}
</style>
