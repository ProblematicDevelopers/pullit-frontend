<template>
  <div class="ocr-step1-container">
    <!-- 왼쪽: PDF 이미지 내 선택된 영역 -->
    <div class="left-section">
      <div class="section-header">
        <h4 class="section-title">문제 추출</h4>
        <div class="page-info">
          <button class="btn btn-outline-secondary btn-sm">이전</button>
          <span class="page-indicator">1 / 8</span>
          <button class="btn btn-outline-secondary btn-sm">다음</button>
        </div>
      </div>

      <div class="image-viewer">
        <img
          :src="capturedImage"
          :alt="'PDF 페이지 이미지'"
          class="pdf-image"
          @load="onImageLoad"
          @error="onImageError"
          @click="onImageClick"
        />

        <!-- 선택된 영역 표시 -->
        <div
          v-for="(area, areaType) in visibleAreas"
          :key="areaType"
          class="selected-area-overlay"
          :class="`${areaType}-area`"
          :style="getScaledAreaStyle(area)"
        >
          <div class="area-label">{{ getAreaLabel(areaType) }}</div>
        </div>

        <!-- 현재 선택 중인 영역 표시 -->
        <div
          v-if="currentSelection.active"
          class="current-selection"
          :style="currentSelectionStyle"
        >
          <div class="selection-guide">{{ getAreaLabel(activeSelectionType) }} 영역을 드래그하여 선택</div>
        </div>
      </div>
    </div>

    <!-- 오른쪽: 지문/OCR 변환 관련 메뉴 -->
    <div class="right-section">
      <div class="section-header">
        <h4 class="section-title">영역 선택</h4>
        <p class="section-subtitle">PDF에서 텍스트를 추출할 영역을 드래그하여 선택하세요</p>
      </div>

      <!-- 현재 활성 지문 선택 -->
      <div class="passage-selection" v-if="showPassageGroupSection">
        <label class="form-label">현재 활성 지문</label>
        <select class="form-select" v-model="selectedPassageGroup">
          <option value="">지문 1 (ID = 1)</option>
          <option value="group2">지문 2 (ID = 2)</option>
          <option value="none">|| Not Exist</option>
        </select>
      </div>

      <!-- 통합된 영역 타입 선택 및 진행 상태 -->
      <div class="area-type-tabs">
        <div class="tab-buttons">
          <button
            v-for="areaType in areaTypes"
            :key="areaType.key"
            class="tab-btn"
            :class="{
              active: activeSelectionType === areaType.key,
              disabled: isTabDisabled(areaType.key),
              completed: selectedAreas[areaType.key]
            }"
            @click="selectAreaType(areaType.key)"
            :disabled="isTabDisabled(areaType.key)"
          >
            <i :class="areaType.icon"></i>
            {{ areaType.label }}
            <span class="required-badge" v-if="areaType.required">(필수)</span>
            <span class="optional-badge" v-else>(선택)</span>
            <i v-if="selectedAreas[areaType.key]" class="bi bi-check-circle-fill text-success ms-1"></i>
            <i v-else-if="areaType.required" class="bi bi-circle text-muted ms-1"></i>
            <!-- 선택 영역은 선택되지 않았을 때 아무것도 표시하지 않음 -->
          </button>
        </div>
      </div>

      <!-- 선택된 영역 미리보기 -->
      <div class="selected-area-preview">
        <!-- 활성 선택 타입이 있을 때 -->
                  <div v-if="safeActiveSelectionType" class="preview-content">
            <h5 class="preview-title">
              {{ getAreaLabel(safeActiveSelectionType) }} 영역 미리보기
            </h5>

            <div v-if="selectedAreas?.value?.[safeActiveSelectionType]" class="preview-image-container">
              <img
                :src="selectedAreas?.value?.[safeActiveSelectionType]?.imageData"
                :alt="`${getAreaLabel(safeActiveSelectionType)} 미리보기`"
                class="preview-image"
              />
              <div class="preview-info">
                <small class="text-muted">
                  선택된 영역: {{ selectedAreas?.value?.[safeActiveSelectionType]?.width || 0 }} x {{ selectedAreas?.value?.[safeActiveSelectionType]?.height || 0 }}px<br>
                  위치: ({{ selectedAreas?.value?.[safeActiveSelectionType]?.x || 0 }}, {{ selectedAreas?.value?.[safeActiveSelectionType]?.y || 0 }})<br>
                  <span class="text-info">화면 좌표 기준</span>
                </small>
              </div>
            </div>

            <div v-else class="no-selection">
              <i class="bi bi-cursor text-muted"></i>
              <p class="text-muted mb-0">{{ getAreaLabel(safeActiveSelectionType) }} 영역을 이미지에서 드래그하여 선택하세요</p>
            </div>
          </div>

        <!-- 활성 선택 타입이 없을 때 (영역 선택 완료 후) -->
        <div v-else class="preview-content">
          <h5 class="preview-title">선택된 영역들</h5>

          <!-- 선택된 영역들이 있는지 확인 -->
          <div v-if="selectedAreas?.value && Object.values(selectedAreas.value).some(area => area !== null)" class="selected-areas-summary">
              <div v-for="areaType in areaTypes" :key="areaType.key" class="area-summary-item">
                <div v-if="selectedAreas?.value?.[areaType.key] && selectedAreas.value[areaType.key]?.imageData" class="area-summary-content">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <span class="area-label">{{ getAreaLabel(areaType.key) }}</span>
                  <span class="area-size">{{ selectedAreas?.value?.[areaType.key]?.width || 0 }} x {{ selectedAreas?.value?.[areaType.key]?.height || 0 }}px</span>
                  <button @click="selectAreaType(areaType.key)" class="btn btn-sm btn-outline-primary ms-2">
                    다시 선택
                  </button>
                </div>
              </div>
            </div>

          <!-- 선택된 영역이 없을 때 -->
          <div v-else class="no-selection">
            <i class="bi bi-cursor text-muted"></i>
            <p class="text-muted mb-0">위 탭에서 영역 유형을 클릭하여 영역을 선택하세요</p>
          </div>

          <!-- OCR 처리 방식 선택 -->
          <div v-if="selectedAreas?.value && Object.values(selectedAreas.value).some(area => area !== null)" class="ocr-processing-options">
            <h6 class="processing-title">OCR 처리 방식 선택</h6>
            <div class="processing-buttons">
              <button
                @click="$emit('process-ocr', 'parallel')"
                class="btn btn-primary me-2"
                :disabled="isProcessing"
                title="모든 영역을 동시에 처리 (빠름, 서버 부하 높음)"
              >
                <i class="bi bi-lightning-charge me-1"></i>
                병렬 처리
              </button>

              <button
                @click="$emit('process-ocr', 'sequential')"
                class="btn btn-outline-primary me-2"
                :disabled="isProcessing"
                title="영역을 하나씩 순차 처리 (안전함, 시간 소요)"
              >
                <i class="bi bi-arrow-right me-1"></i>
                순차 처리
              </button>

              <button
                @click="$emit('process-ocr', 'batch')"
                class="btn btn-outline-secondary"
                :disabled="isProcessing"
                title="배치 단위로 처리 (균형잡힌 방식)"
              >
                <i class="bi bi-collection me-1"></i>
                배치 처리
              </button>
            </div>

            <div class="processing-info">
              <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                <strong>병렬:</strong> 빠름, <strong>순차:</strong> 안전함, <strong>배치:</strong> 균형
              </small>
            </div>
          </div>
        </div>
      </div>




    </div>
  </div>
</template>

<script>
import { ref, computed, toRefs } from 'vue'

export default {
  name: 'Step1AreaSelection',
  props: {
    capturedImage: {
      type: String,
      default: ''
    },
    capturedImageInfo: {
      type: Object,
      required: true,
      default: () => ({})
    },
    selectedAreas: {
      type: Object,
      required: true,
      default: () => ({
        question: null,
        problem: null,
        image: null,
        options: null
      })
    },
    activeSelectionType: {
      type: String,
      required: false,
      default: null
    },
    captureMode: {
      type: Boolean,
      required: true,
      default: false
    },
    zoomLevel: {
      type: Number,
      default: 1
    },
    isProcessing: {
      type: Boolean,
      required: true,
      default: false
    },
    selectionCanvas: {
      type: Object,
      required: false,
      default: () => null
    }
  },
  emits: [
    'update:selectedAreas',
    'update:activeSelectionType',
    'update:captureMode',
    'update:zoomLevel',
    'process-ocr'
  ],
  setup(props, { emit }) {
    // 디버깅을 위한 props 로깅
    console.log('Step1AreaSelection setup - props:', {
      selectedAreas: props.selectedAreas,
      activeSelectionType: props.activeSelectionType,
      captureMode: props.captureMode,
      zoomLevel: props.zoomLevel,
      capturedImage: props.capturedImage ? '있음' : '없음',
      capturedImageInfo: props.capturedImageInfo
    })

    // props를 반응형 참조로 변환
    const { selectedAreas, activeSelectionType, captureMode, zoomLevel } = toRefs(props)

    // activeSelectionType이 null이 되지 않도록 보호하는 computed
    const safeActiveSelectionType = computed(() => {
      return activeSelectionType.value || 'problem'
    })

    // 현재 드래그 선택 상태
    const currentSelection = ref({
      active: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      isDragging: false
    })

    // 지문 그룹 관리
    const selectedPassageGroup = ref('')
    const showPassageGroupSection = computed(() => true) // 임시

    // 영역 타입 정의
    const areaTypes = ref([
      { key: 'question', label: '지문', icon: 'bi bi-file-text', required: false },
      { key: 'options', label: '보기', icon: 'bi bi-list-ul', required: true },
      { key: 'problem', label: '문제', icon: 'bi bi-question-circle', required: true },
      { key: 'image', label: '이미지', icon: 'bi bi-image', required: false }
    ])

    // 계산된 속성
    const canProceedToNext = computed(() => {
      // null-safe 처리: selectedAreas.value가 undefined/null인 경우 false 반환
      if (!selectedAreas?.value || typeof selectedAreas.value !== 'object') {
        console.warn('canProceedToNext: selectedAreas.value가 유효하지 않음:', selectedAreas.value)
        return false
      }

      // 필수 영역들이 모두 선택되었는지 확인
      const requiredAreas = areaTypes.value.filter(type => type.required)
      return requiredAreas.every(type => selectedAreas.value?.[type.key])
    })

    // 선택된 영역이 있는지 확인 (사용하지 않으므로 제거)
    // const hasSelectedAreas = computed(() => {
    //   const result = Object.values(selectedAreas.value).some(area => area !== null)
    //   console.log('hasSelectedAreas 계산:', {
    //     selectedAreas: selectedAreas.value,
    //     values: Object.values(selectedAreas.value),
    //     result
    //   })
    //   return result
    // })

    const currentSelectionStyle = computed(() => {
      if (!currentSelection.value.active) return {}

      const { startX, startY, endX, endY } = currentSelection.value
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)

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

    // 영역 라벨 가져오기
    const getAreaLabel = (areaType) => {
      if (!areaType) return '선택되지 않음'
      const area = areaTypes.value.find(type => type.key === areaType)
      return area ? area.label : areaType
    }

    // 줌 레벨을 고려한 영역 스타일 계산
    const getScaledAreaStyle = (area) => {
      if (!area) return {}

      // 줌 레벨을 고려한 스케일링 적용
      const scaledX = area.x / zoomLevel.value
      const scaledY = area.y / zoomLevel.value
      const scaledWidth = area.width / zoomLevel.value
      const scaledHeight = area.height / zoomLevel.value

      return {
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`
      }
    }

    // 보이는 영역들만 필터링하는 computed property
    const visibleAreas = computed(() => {
      // null-safe 처리: selectedAreas.value가 undefined/null인 경우 빈 객체 반환
      if (!selectedAreas?.value || typeof selectedAreas.value !== 'object') {
        console.warn('selectedAreas.value가 유효하지 않음:', selectedAreas.value)
        return {}
      }

      return Object.fromEntries(
        Object.entries(selectedAreas.value).filter(([, area]) => area !== null)
      )
    })

    // 탭 비활성화 여부 (지문 선택 시 다른 탭 비활성화 로직)
    const isTabDisabled = () => {
      // 지문을 선택했을 때 다른 탭 비활성화하는 로직을 여기에 구현
      return false
    }

    // 영역 타입 선택
    const selectAreaType = (areaType) => {
      // areaType이 유효한지 확인
      if (!areaType || typeof areaType !== 'string') {
        console.warn('유효하지 않은 영역 타입:', areaType)
        return
      }

      emit('update:activeSelectionType', areaType)
      emit('update:captureMode', true) // 선택 모드 활성화
      console.log('영역 타입 선택:', areaType)
    }

    // 이미지 클릭 시 드래그 시작
    const onImageClick = (event) => {
      if (!captureMode.value || !safeActiveSelectionType.value) {
        console.log('드래그 시작 불가: captureMode 또는 activeSelectionType이 없음')
        return
      }

      startDrag(event)
    }

    // 드래그 시작
    const startDrag = (event) => {
      const rect = event.target.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      currentSelection.value = {
        active: true,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        isDragging: true
      }

      // 마우스 이벤트 리스너 추가
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    // 마우스 이동 시 드래그 업데이트
    const onMouseMove = (event) => {
      if (!currentSelection.value.isDragging) return

      const imageEl = document.querySelector('.pdf-image')
      if (!imageEl) return

      const rect = imageEl.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      currentSelection.value.endX = x
      currentSelection.value.endY = y
    }

    // 마우스 업 시 드래그 완료
    const onMouseUp = () => {
      if (!currentSelection.value.isDragging) return

      currentSelection.value.isDragging = false

      // 이벤트 리스너 제거
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      // 선택된 영역 처리
      processSelectedArea()
    }

    // 선택된 영역 처리
    const processSelectedArea = async () => {
      const { startX, startY, endX, endY } = currentSelection.value
      const areaType = safeActiveSelectionType.value

      // activeSelectionType이 null인 경우 처리하지 않음
      if (!areaType) {
        console.warn('선택할 영역 타입이 지정되지 않았습니다')
        clearCurrentSelection()
        return
      }

      // 영역 좌표 계산
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)

      // 최소 크기 체크
      if (width < 10 || height < 10) {
        console.warn('선택된 영역이 너무 작습니다')
        clearCurrentSelection()
        return
      }

      console.log('영역 선택 완료:', { areaType, x, y, width, height })

      // 이미지 데이터 캡처
      const imageData = await captureSelectedArea({ x, y, width, height })

      // 영역 정보 생성 (화면 좌표와 원본 좌표 모두 저장)
      const areaInfo = {
        // 화면 좌표 (UI 표시용)
        x, y, width, height,
        // 이미지 데이터
        imageData,
        // 디버깅을 위한 추가 정보
        screenCoordinates: { x, y, width, height },
        timestamp: new Date().toISOString()
      }

      // 선택된 영역 업데이트
      const newSelectedAreas = { ...(selectedAreas.value || {}) }
      newSelectedAreas[areaType] = areaInfo
      emit('update:selectedAreas', newSelectedAreas)

      // 선택 초기화
      clearCurrentSelection()

      // 선택 모드 종료
      emit('update:captureMode', false)
      // activeSelectionType을 null로 설정하지 않고 기본값 유지
      // emit('update:activeSelectionType', null)
    }

    // 선택된 영역을 이미지로 캡처
    const captureSelectedArea = ({ x, y, width, height }) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          try {
            // 화면 좌표를 원본 이미지 좌표로 변환
            const imageEl = document.querySelector('.pdf-image')
            if (!imageEl) {
              console.error('PDF 이미지 요소를 찾을 수 없습니다')
              resolve(null)
              return
            }

            const rect = imageEl.getBoundingClientRect()

            // 줌 레벨을 고려한 스케일링 (줌 레벨은 이미 화면 좌표에 반영되어 있음)
            const scaleX = img.naturalWidth / rect.width
            const scaleY = img.naturalHeight / rect.height

            const originalX = Math.round(x * scaleX)
            const originalY = Math.round(y * scaleY)
            const originalWidth = Math.round(width * scaleX)
            const originalHeight = Math.round(height * scaleY)

            console.log('좌표 변환:', {
              화면좌표: { x, y, width, height },
              원본좌표: { x: originalX, y: originalY, width: originalWidth, height: originalHeight },
              스케일: { scaleX, scaleY },
              줌레벨: zoomLevel.value,
              이미지크기: { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight },
              화면크기: { width: rect.width, height: rect.height }
            })

            // Canvas에서 영역 추출
            const canvas = document.createElement('canvas')
            canvas.width = originalWidth
            canvas.height = originalHeight

            const ctx = canvas.getContext('2d')
            ctx.drawImage(
              img,
              originalX, originalY, originalWidth, originalHeight,
              0, 0, originalWidth, originalHeight
            )

            const imageData = canvas.toDataURL('image/png')
            resolve(imageData)
          } catch (error) {
            console.error('이미지 캡처 오류:', error)
            resolve(null)
          }
        }

        img.onerror = () => resolve(null)
        img.src = props.capturedImage
      })
    }

    // 선택 초기화
    const clearCurrentSelection = () => {
      currentSelection.value = {
        active: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        isDragging: false
      }
    }

    // 이미지 로드/에러 핸들러
    const onImageLoad = () => {
      console.log('이미지 로드 완료')
    }

    const onImageError = (error) => {
      console.error('이미지 로드 실패:', error)
    }

    // 다음 단계로 진행
    const nextStep = () => {
      if (canProceedToNext.value) {
        emit('next-step')
      }
    }

    return {
      // 상태
      currentSelection,
      selectedPassageGroup,
      showPassageGroupSection,
      areaTypes,

      // 계산된 속성
      safeActiveSelectionType,
      getScaledAreaStyle,
      canProceedToNext,
      currentSelectionStyle,
      visibleAreas,

      // 메서드
      getAreaLabel,
      isTabDisabled,
      selectAreaType,
      onImageClick,
      onImageLoad,
      onImageError,
      nextStep
    }
  }
}
</script>

<style scoped>
.ocr-step1-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: 600px;
  padding: 1rem;
}

/* 왼쪽 섹션: 이미지 뷰어 */
.left-section {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.section-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.section-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.5rem 0 0 0;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-indicator {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.image-viewer {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.pdf-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
}

/* 선택된 영역 오버레이 */
.selected-area-overlay {
  position: absolute;
  border: 2px solid;
  border-radius: 4px;
  background-color: rgba(59, 130, 246, 0.1);
  pointer-events: none;
  z-index: 10;
}

.question-area {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.options-area {
  border-color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
}

.problem-area {
  border-color: #8b5cf6;
  background-color: rgba(139, 92, 246, 0.1);
}

.image-area {
  border-color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.area-label {
  position: absolute;
  top: -25px;
  left: 0;
  background: #1e293b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* 현재 선택 중인 영역 */
.current-selection {
  position: absolute;
  border: 2px dashed #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  pointer-events: none;
  z-index: 20;
}

.selection-guide {
  position: absolute;
  top: -30px;
  left: 0;
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
}

/* 오른쪽 섹션: 컨트롤 */
.right-section {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.right-section .section-header {
  flex-shrink: 0;
}

/* 지문 선택 */
.passage-selection {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  display: block;
}

.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

/* 탭 버튼 */
.area-type-tabs {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.tab-buttons {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #f0f9ff;
  color: #1e40af;
}

.tab-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.tab-btn.completed {
  border-color: #10b981;
  background: #ecfdf5;
  color: #047857;
}

.tab-btn.completed.active {
  background: #10b981;
  color: white;
}

.tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-btn i {
  margin-right: 0.5rem;
}

/* 선택된 영역 미리보기 */
.selected-area-preview {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.preview-image-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  margin-bottom: 0.5rem;
}

.preview-info {
  margin-top: 0.5rem;
}

.no-selection,
.no-active-type {
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
}

.no-selection i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

/* 필수/선택 배지 */
.required-badge {
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 500;
  margin-left: 0.25rem;
}

.optional-badge {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-left: 0.25rem;
}

.text-info {
  color: #0ea5e9;
  font-size: 0.75rem;
}

/* 선택된 영역 요약 */
.selected-areas-summary {
  margin-top: 1rem;
}

.area-summary-item {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
}

.area-summary-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.area-label {
  font-weight: 500;
  color: #1e293b;
  flex: 1;
}

.area-size {
  font-size: 0.875rem;
  color: #64748b;
  font-family: monospace;
}

/* OCR 처리 방식 선택 UI */
.ocr-processing-options {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.processing-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  text-align: center;
}

.processing-buttons {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.processing-buttons .btn {
  min-width: 120px;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

.processing-info {
  text-align: center;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.processing-info small {
  font-size: 0.8rem;
  line-height: 1.4;
}

/* 반응형 처리 버튼 */
@media (max-width: 768px) {
  .processing-buttons {
    flex-direction: column;
    align-items: center;
  }

  .processing-buttons .btn {
    width: 100%;
    max-width: 200px;
  }
}



/* 반응형 디자인 */
@media (max-width: 1024px) {
  .ocr-step1-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .right-section {
    max-height: 500px;
  }
}

@media (max-width: 768px) {
  .ocr-step1-container {
    padding: 0.5rem;
    gap: 1rem;
  }

  .tab-buttons {
    grid-template-columns: 1fr;
  }

  .section-header {
    padding: 0.75rem;
  }

  .page-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
