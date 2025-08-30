<template>
  <div class="ocr-result-modal" v-if="isVisible">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-container">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <h2 class="section-title">문제 가공 진행</h2>
        <button @click="closeModal" class="btn-close">
          <span>&times;</span>
        </button>
      </div>

      <!-- 모달 내용 -->
      <div class="modal-content">
        <div class="content-layout">
          <!-- 왼쪽 컬럼: 캡처한 문제 -->
          <div class="left-column">
            <div class="section-header">
              <h3 class="section-subtitle">캡처한 문제</h3>
              <div class="zoom-controls">
                <button @click="zoomOut" class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-zoom-out"></i>
                </button>
                <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                <button @click="zoomIn" class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-zoom-in"></i>
                </button>
              </div>
            </div>

            <div class="image-container">
              <!-- 디버깅 정보 -->
              <div v-if="!capturedImage" class="no-image">
                <div class="text-center">
                  <i class="bi bi-image display-4 text-muted"></i>
                  <p class="mt-3">캡처된 이미지가 없습니다.</p>
                  <p class="text-muted small">이미지 데이터 길이: {{ capturedImage ? capturedImage.length : 0 }}</p>
                </div>
              </div>

              <!-- Canvas 기반 이미지 표시 및 영역 선택 -->
              <div class="canvas-container" v-if="capturedImage">
                <canvas
                  ref="imageCanvas"
                  class="image-canvas"
                  :style="{ transform: `scale(${zoomLevel})` }"
                ></canvas>

                <!-- 영역 선택을 위한 Canvas 오버레이 -->
                <canvas
                  ref="selectionCanvas"
                  class="selection-canvas"
                  @click="handleCanvasClick"
                ></canvas>

                <!-- 선택 영역 표시 -->
                <div
                  v-if="currentSelection.active"
                  class="selection-area"
                  :style="currentSelectionStyle"
                >
                  <span class="selection-type-label">{{ getSelectionTypeLabel(activeSelectionType) }}</span>
                </div>

                <!-- 첫 번째 클릭 후 대기 중인 상태 표시 -->
                <div
                  v-if="currentSelection.waitingForSecondClick"
                  class="waiting-selection-point"
                  :style="waitingSelectionStyle"
                >
                  <div class="waiting-indicator">
                    <i class="bi bi-mouse"></i>
                    <span class="waiting-text">두 번째 클릭</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="image-controls">
              <div v-if="!captureMode" class="text-center">
                <button
                  @click="startCapture"
                  class="btn btn-primary"
                >
                  <i class="bi bi-cursor"></i> 영역 선택 시작
                </button>
              </div>

              <div v-if="captureMode" class="capture-info">
                <div class="alert alert-info mb-0">
                  <i class="bi bi-info-circle me-2"></i>
                  <strong>영역 선택 모드가 활성화되었습니다.</strong>
                  <br><small>오른쪽에서 지문, 이미지, 보기 영역을 선택하세요.</small>
                </div>
              </div>
            </div>
          </div>

          <!-- 오른쪽 컬럼: 영역 선택 -->
          <div class="right-column">
            <div class="section-header">
              <h3 class="section-subtitle">영역 선택</h3>
              <button @click="resetCapture" class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-arrow-clockwise"></i> 초기화
              </button>
            </div>

            <!-- 영역 선택 안내 -->
            <div class="area-selection-guide">
              <div class="alert alert-light">
                <h6 class="alert-heading">
                  <i class="bi bi-lightbulb me-2"></i>영역 선택 가이드
                </h6>
                <p class="mb-2">아래 영역들을 클릭하여 해당 부분을 선택하세요.</p>
                <p class="mb-0 text-warning">
                  <i class="bi bi-exclamation-triangle me-1"></i>
                  지문과 보기는 필수, 이미지는 선택사항입니다.
                </p>
              </div>

              <div v-if="captureMode && activeSelectionType" class="selection-status">
                <div class="alert alert-primary">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-cursor-fill me-2"></i>
                    <div>
                      <strong>{{ getSelectionTypeLabel(activeSelectionType) }}</strong> 영역 선택 중...
                      <br><small class="text-muted">이미지에서 클릭하여 영역을 선택하세요</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 영역 선택 공간들 -->
            <div class="area-selection-container">
              <!-- 지문 영역 -->
              <div class="area-selection-item">
                <h4 class="area-title">
                  <i class="bi bi-file-text me-2"></i>지문
                  <span class="badge bg-primary ms-2">필수</span>
                </h4>
                <div
                  class="area-selection-box question-box"
                  :class="{ selected: selectedAreas.question }"
                  @click="selectArea('question')"
                >
                  <div v-if="!selectedAreas.question" class="area-placeholder">
                    <i class="bi bi-plus-circle display-6 text-muted"></i>
                    <span class="placeholder-text">지문 선택 공간</span>
                  </div>
                  <div v-else class="selected-area-content">
                    <img
                      :src="selectedAreas.question.imageData"
                      :alt="'선택된 지문 영역'"
                      class="selected-area-image"
                    />
                    <span class="area-badge bg-primary">지문</span>
                    <span class="area-check">
                      <i class="bi bi-check-circle-fill"></i>
                    </span>
                  </div>
                </div>
              </div>

              <!-- 이미지 영역 -->
              <div class="area-selection-item">
                <h4 class="area-title">
                  <i class="bi bi-image me-2"></i>이미지
                  <span class="badge bg-warning ms-2">선택사항</span>
                </h4>
                <div
                  class="area-selection-box image-box"
                  :class="{ selected: selectedAreas.image }"
                  @click="selectArea('image')"
                >
                  <div v-if="!selectedAreas.image" class="area-placeholder">
                    <i class="bi bi-plus-circle display-6 text-muted"></i>
                    <span class="placeholder-text">이미지 선택 공간</span>
                  </div>
                  <div v-else class="selected-area-content">
                    <img
                      :src="selectedAreas.image.imageData"
                      :alt="'선택된 이미지 영역'"
                      class="selected-area-image"
                    />
                    <span class="area-badge bg-success">이미지</span>
                    <span class="area-check">
                      <i class="bi bi-check-circle-fill"></i>
                    </span>
                  </div>
                </div>
              </div>

              <!-- 보기 영역 -->
              <div class="area-selection-item">
                <h4 class="area-title">
                  <i class="bi bi-list-check me-2"></i>보기
                  <span class="badge bg-primary ms-2">필수</span>
                </h4>
                <div
                  class="area-selection-box options-box"
                  :class="{ selected: selectedAreas.options }"
                  @click="selectArea('options')"
                >
                  <div v-if="!selectedAreas.options" class="area-placeholder">
                    <i class="bi bi-plus-circle display-6 text-muted"></i>
                    <span class="placeholder-text">보기 선택 공간</span>
                  </div>
                  <div v-else class="selected-area-content">
                    <img
                      :src="selectedAreas.options.imageData"
                      :alt="'선택된 보기 영역'"
                      class="selected-area-image"
                    />
                    <span class="area-badge bg-warning">보기</span>
                    <span class="area-check">
                      <i class="bi bi-check-circle-fill"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 처리 버튼 -->
            <div class="processing-section">
              <div class="processing-status mb-3">
                <div class="row g-2">
                  <div class="col-4">
                    <div class="status-item" :class="{ completed: selectedAreas.question }">
                      <i class="bi" :class="selectedAreas.question ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                      <span class="ms-2">지문</span>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="status-item" :class="{ completed: selectedAreas.image }">
                      <i class="bi" :class="selectedAreas.image ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                      <span class="ms-2">이미지</span>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="status-item" :class="{ completed: selectedAreas.options }">
                      <i class="bi" :class="selectedAreas.options ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'"></i>
                      <span class="ms-2">보기</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                @click="processAreas"
                :disabled="!canConvert || isProcessing"
                class="btn btn-success w-100"
                :class="{ 'btn-lg': canConvert }"
              >
                <i class="bi bi-arrow-right-circle me-2"></i>
                {{ isProcessing ? '처리 중...' : (canConvert ? '처리 시작' : '필수 영역을 선택해주세요') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 모달 액션 -->
      <div class="modal-actions">
        <button @click="saveProblems" class="btn btn-primary">
          <i class="bi bi-save me-2"></i>저장
        </button>
        <button @click="closeModal" class="btn btn-secondary">
          <i class="bi bi-x-circle me-2"></i>닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, watch } from 'vue'

export default {
  name: 'OcrResultModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    capturedImage: {
      type: String,
      default: ''
    },
    ocrResults: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {


    // 상태 관리
    const zoomLevel = ref(1) // 기본 줌 레벨, 이미지 로드 시 자동으로 조정됨
    const selectedArea = ref(null)
    const selectedProblemIndex = ref(0)
    const captureMode = ref(false)
    const imageCanvas = ref(null)
    const selectionCanvas = ref(null)
    const isProcessing = ref(false) // 처리 중 상태

    // 선택된 영역들
    const selectedAreas = ref({
      question: null,  // 지문 영역
      image: null,     // 이미지 영역 (nullable)
      options: null    // 보기 영역
    })

    // 현재 선택 중인 영역 타입
    const activeSelectionType = ref(null)

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

    const problems = ref([
      {
        title: 'Choose all correct statements from the following? (2 answers)',
        content: '다음 중 옳은 것을 모두 고르시오. (2개)',
        type: 'multiple',
        ocrText: ''
      },
      {
        title: 'Problem 2',
        content: '두 번째 문제 내용',
        type: 'multiple',
        ocrText: ''
      },
      {
        title: 'Problem 3',
        content: '세 번째 문제 내용',
        type: 'subjective',
        ocrText: ''
      }
    ])

    // 계산된 속성
    const selectedProblem = computed(() => problems.value[selectedProblemIndex.value])

    // 변환 가능 여부 (지문 + 보기 선택 완료 시)
    const canConvert = computed(() => {
      return selectedAreas.value.question && selectedAreas.value.options
    })

    // 영역별 스타일 계산
    const getAreaStyle = (areaType) => {
      const area = selectedAreas.value[areaType]
      if (!area) return {}

      return {
        left: `${area.x}px`,
        top: `${area.y}px`,
        width: `${area.width}px`,
        height: `${area.height}px`
      }
    }

    // 현재 선택 중인 영역 스타일
    const currentSelectionStyle = computed(() => {
      if (!currentSelection.value.active) return {}

      // 줌 레벨을 고려한 좌표 계산
      const x = currentSelection.value.x
      const y = currentSelection.value.y
      const width = currentSelection.value.width
      const height = currentSelection.value.height

      return {
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`
      }
    })

    // 첫 번째 클릭 후 대기 중인 상태 스타일
    const waitingSelectionStyle = computed(() => {
      if (!currentSelection.value.waitingForSecondClick) return {}

      return {
        left: `${currentSelection.value.startX}px`,
        top: `${currentSelection.value.startY}px`,
        width: '4px',
        height: '4px'
      }
    })

    // 선택 타입 라벨
    const getSelectionTypeLabel = (type) => {
      const labels = {
        question: '지문',
        image: '이미지',
        options: '보기'
      }
      return labels[type] || ''
    }

    // 메서드
    const closeModal = () => {
      emit('close')
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

      const canvas = selectionCanvas.value
      if (!canvas) {
        console.log('선택 Canvas가 준비되지 않음')
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      console.log('클릭 좌표:', { clientX: event.clientX, clientY: event.clientY, rect, x, y })

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

      const canvas = selectionCanvas.value
      if (!canvas) {
        console.log('선택 Canvas가 준비되지 않음')
        return
      }

      const rect = canvas.getBoundingClientRect()
      const endX = event.clientX - rect.left
      const endY = event.clientY - rect.top

      console.log('두 번째 클릭 좌표:', { clientX: event.clientX, clientY: event.clientY, rect, endX, endY })

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

      // 화면 좌표와 이미지 데이터를 함께 저장
      selectedAreas.value[activeSelectionType.value] = {
        ...selectedArea, // 화면 좌표 (UI 표시용)
        pixelCoordinates, // 픽셀 좌표 (캡처용)
        imageData: capturedImageData
      }

      console.log(`${activeSelectionType.value} 영역 선택 완료:`, selectedArea)

      // 선택 모드 종료
      activeSelectionType.value = null
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



    const processAreas = async () => {
      if (isProcessing.value) return

      try {
        isProcessing.value = true
        console.log('영역 처리 시작:', selectedAreas.value)

        // 성공 메시지 표시
        showSuccessMessage('영역이 성공적으로 처리되었습니다!')

        // 처리 완료 후 상태 초기화
        resetCapture()

        // 모달 닫기
        closeModal()

      } catch (error) {
        console.error('영역 처리 실패:', error)
        showSuccessMessage(`처리 실패: ${error.message}`)
      } finally {
        isProcessing.value = false
      }
    }

    const resetCapture = () => {
      captureMode.value = false
      activeSelectionType.value = null
      selectedAreas.value = {
        question: null,
        image: null,
        options: null
      }
      clearCurrentSelection()
      console.log('영역 선택 초기화')
    }

    const selectProblem = (index) => {
      selectedProblemIndex.value = index
    }

    const resetProblems = () => {
      problems.value.forEach(problem => {
        problem.type = 'multiple'
        problem.ocrText = ''
      })
      selectedProblemIndex.value = 0
    }

    const performOcr = () => {
      // OCR 실행 로직
      console.log('OCR 실행')
    }

    const saveProblems = () => {
      emit('save', problems.value)
      closeModal()
    }

    // Canvas 설정 및 이미지 렌더링
    const setupCanvas = () => {
      if (!props.capturedImage || !imageCanvas.value) return

      try {
        // capturedImage가 JSON 문자열인지 확인
        let imageData = props.capturedImage

                // JSON 문자열인 경우 파싱
        if (props.capturedImage.startsWith('{')) {
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
        }

        const canvas = imageCanvas.value
        const ctx = canvas.getContext('2d')

        const img = new Image()
        img.onload = () => {
          // 컨테이너 크기 가져오기
          const container = imageCanvas.value?.parentElement
          if (!container) return

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
    }

    // 화면 좌표를 픽셀 좌표로 변환
    const convertScreenToPixelCoordinates = (screenSelection) => {
      try {
        if (!imageCanvas.value) {
          console.error('이미지 Canvas가 준비되지 않음')
          return screenSelection
        }

        const canvas = imageCanvas.value
        const rect = canvas.getBoundingClientRect()

        // 화면 표시 크기와 실제 픽셀 크기의 비율 계산
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        // 화면 좌표를 픽셀 좌표로 변환
        const pixelX = Math.round(screenSelection.x * scaleX)
        const pixelY = Math.round(screenSelection.y * scaleY)
        const pixelWidth = Math.round(screenSelection.width * scaleX)
        const pixelHeight = Math.round(screenSelection.height * scaleY)

        console.log('좌표 변환:', {
          화면좌표: screenSelection,
          픽셀좌표: { x: pixelX, y: pixelY, width: pixelWidth, height: pixelHeight },
          스케일: { scaleX, scaleY },
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
      if (newImage) {
        nextTick(() => {
          setupCanvas()
        })
      }
    }, { immediate: true })

    // 줌 레벨 변경 감지하여 Canvas 오버레이 재설정
    watch(zoomLevel, () => {
      if (imageCanvas.value && selectionCanvas.value) {
        nextTick(() => {
          updateSelectionCanvasPosition()
        })
      }
    })

    // 줌 레벨 변경 시 selection-canvas 위치만 업데이트
    const updateSelectionCanvasPosition = () => {
      if (!imageCanvas.value || !selectionCanvas.value) return

      const imageCanvasEl = imageCanvas.value
      const selectionCanvasEl = selectionCanvas.value

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
    }

    return {
      zoomLevel,
      selectedArea,
      selectedProblemIndex,
      problems,
      selectedProblem,
      captureMode,
      imageCanvas,
      selectionCanvas,
      selectedAreas,
      activeSelectionType,
      currentSelection,
      canConvert,
      getAreaStyle,
      currentSelectionStyle,
      waitingSelectionStyle,
      getSelectionTypeLabel,
      closeModal,
      zoomIn,
      zoomOut,
      startCapture,
      selectProblem,
      resetProblems,
      performOcr,
      saveProblems,
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

      processAreas,
      resetCapture,
      showSuccessMessage,
      isProcessing
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
  width: 90vw;
  max-width: 1400px;
  height: 90vh;
  max-height: 800px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  overflow: hidden;
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

/* 처리 섹션 */
.processing-section {
  padding: 1.5rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0 0 12px 12px;
}

.processing-status {
  margin-bottom: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;
}

.status-item.completed {
  background-color: #d1fae5;
  color: #065f46;
  border-color: #10b981;
}

/* 모달 액션 */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
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
</style>
