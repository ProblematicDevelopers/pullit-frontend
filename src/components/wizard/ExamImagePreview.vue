<template>
  <div class="exam-image-preview">
    <!-- Control Bar -->
    <div class="control-bar">
      <!-- Page Navigation -->
      <div class="page-navigation">
        <button @click="previousPage" :disabled="currentPage <= 1" class="nav-btn">
          <span>◀</span> 이전
        </button>
        <div class="page-info">
          <input
            v-model.number="currentPage"
            type="number"
            :min="1"
            :max="totalPages"
            @change="validatePageNumber"
            class="page-input"
          />
          <span class="page-total">/ {{ totalPages }}</span>
        </div>
        <button @click="nextPage" :disabled="currentPage >= totalPages" class="nav-btn">
          다음 <span>▶</span>
        </button>
      </div>

      <!-- Questions Per Page Control -->
      <div class="layout-controls">
        <label class="control-label">페이지당 문항:</label>
        <select v-model.number="questionsPerPage" @change="recalculatePagination" class="page-select">
          <option :value="2">2개</option>
          <option :value="4">4개 (권장)</option>
          <option :value="6">6개</option>
          <option :value="8">8개</option>
        </select>
      </div>

      <!-- Zoom Controls -->
      <div class="zoom-controls">
        <button @click="zoomOut" class="zoom-btn">-</button>
        <span class="zoom-level">{{ zoomLevel }}%</span>
        <button @click="zoomIn" class="zoom-btn">+</button>
        <button @click="resetZoom" class="zoom-btn">초기화</button>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="saveExam" class="save-btn" :disabled="isSaving">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2"/>
            <polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ isSaving ? '저장 중...' : '시험지 저장' }}
        </button>
        <button @click="downloadPDF" class="download-btn" :disabled="isGeneratingPDF">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ isGeneratingPDF ? 'PDF 생성 중...' : 'PDF 다운로드' }}
        </button>
      </div>
    </div>

    <!-- Preview Container -->
    <div class="preview-container">
      <div v-if="!hasImages" class="no-images-message">
        <div class="message-icon">📄</div>
        <h3>이미지가 없습니다</h3>
        <p>Step 2에서 문제를 선택하고 이미지로 변환해주세요.</p>
      </div>

      <div v-else class="a4-page" :style="{ transform: `scale(${Math.max(zoomLevel / 100, 0.1)})`, transformOrigin: 'top left' }">
        <!-- Page Header (First Page Only) -->
        <div v-if="currentPage === 1" class="page-header">
          <h1 class="exam-title">{{ examInfo.title || '시험지' }}</h1>
          <div class="exam-info" v-if="examInfo.grade || examInfo.subject">
            <span v-if="examInfo.grade">{{ examInfo.grade }}</span>
            <span v-if="examInfo.grade && examInfo.subject">·</span>
            <span v-if="examInfo.subject">{{ examInfo.subject }}</span>
          </div>
        </div>

        <!-- Image Content -->
        <div class="page-content layout-double">
          <!-- 2단 레이아웃으로 이미지 배치 -->
          <div class="columns-container">
            <!-- 왼쪽 컬럼 -->
            <div class="column left-column">
              <template v-for="image in currentPageImages.filter(img => img.column === 0 || img.column === undefined)" :key="`left-${image.questionNumber}`">
                <div class="image-wrapper">
                  <img
                    v-if="image && image.dataUrl"
                    :src="image.dataUrl"
                    :alt="`Question ${image.questionNumber || ''}`"
                    class="question-image"
                    @load="(e) => handleImageLoad(0, image, e)"
                    @error="(e) => handleImageError(0, image, e)"
                  />
                  <div v-else class="no-image-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>이미지를 불러올 수 없습니다</p>
                  </div>
                </div>
              </template>
            </div>

            <!-- 오른쪽 컬럼 -->
            <div class="column right-column">
              <template v-for="image in currentPageImages.filter(img => img.column === 1)" :key="`right-${image.questionNumber}`">
                <div class="image-wrapper">
                  <img
                    v-if="image && image.dataUrl"
                    :src="image.dataUrl"
                    :alt="`Question ${image.questionNumber || ''}`"
                    class="question-image"
                    @load="(e) => handleImageLoad(1, image, e)"
                    @error="(e) => handleImageError(1, image, e)"
                  />
                  <div v-else class="no-image-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>이미지를 불러올 수 없습니다</p>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 페이지에 이미지가 없을 때 -->
          <div v-if="currentPageImages.length === 0" style="padding: 40px; text-align: center; background: #f5f5f5;">
            이 페이지에 표시할 이미지가 없습니다.
          </div>
        </div>

        <!-- Page Footer -->
        <div class="page-footer">
          <span class="page-number">- {{ currentPage }} -</span>
        </div>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div v-if="isGeneratingPDF || isSaving" class="progress-overlay">
      <div class="progress-content">
        <div class="spinner"></div>
        <p>{{ isSaving ? '시험지 저장 중...' : 'PDF 생성 중...' }}</p>
        <p class="progress-text">{{ progressMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'
import { useTestBankStore } from '@/stores/testBank'
import { generatePDFFromImages, downloadPDF as downloadGeneratedPDF, pdfToBlob } from '@/utils/pdf-from-images'
import { createExamHeaderImage } from '@/utils/question-to-image-converter'
import userExamApi from '@/services/userExamApi'

// Props
const props = defineProps({
  convertedImages: {
    type: Array,
    default: () => []
  },
  examInfo: {
    type: Object,
    default: () => ({
      title: '시험지',
      grade: '',
      subject: '',
      duration: '',
      totalScore: ''
    })
  }
})

// Stores
const itemStore = useItemSelectionStore()
const testBankStore = useTestBankStore()

// State
const currentPage = ref(1)
const layoutMode = ref('double') // 2단 고정
const zoomLevel = ref(100) // 100%로 시작 - 70%는 너무 작아서 안 보일 수 있음
const isGeneratingPDF = ref(false)
const isSaving = ref(false)
const progressMessage = ref('')

// A4 페이지 설정 (실제 PDF와 동일하게)
const A4_CONFIG = {
  width: 210,  // mm
  height: 297, // mm
  margin: {
    top: 20,
    bottom: 20,
    left: 15,
    right: 15
  },
  columnGap: 10 // 2단 레이아웃일 때 컬럼 간격
}

// 미리보기용 픽셀 변환 (mm to px, 96dpi 기준)
const MM_TO_PX = 3.7795275591 // 1mm = 3.78px at 96dpi
const PREVIEW_CONFIG = {
  width: A4_CONFIG.width * MM_TO_PX,
  height: A4_CONFIG.height * MM_TO_PX,
  margin: {
    top: A4_CONFIG.margin.top * MM_TO_PX,
    bottom: A4_CONFIG.margin.bottom * MM_TO_PX,
    left: A4_CONFIG.margin.left * MM_TO_PX,
    right: A4_CONFIG.margin.right * MM_TO_PX
  },
  columnGap: A4_CONFIG.columnGap * MM_TO_PX
}

// Computed
const previewImages = computed(() => {
  // Props에서 받은 이미지를 우선 사용, 없으면 store에서 가져오기
  const images = props.convertedImages?.length > 0
    ? props.convertedImages
    : (itemStore.getConvertedImages() || [])

  console.log('[ExamImagePreview] Preview images source:',
    props.convertedImages?.length > 0 ? 'props' : 'store')
  console.log('[ExamImagePreview] Preview images count:', images.length)

  // 이미지 데이터 검증
  if (images.length > 0) {
    console.log('[ExamImagePreview] Image data validation:', images.map((img, idx) => ({
      index: idx,
      hasDataUrl: !!img.dataUrl,
      dataUrlType: typeof img.dataUrl,
      dataUrlStart: img.dataUrl ? img.dataUrl.substring(0, 50) : 'no dataUrl',
      type: img.type,
      questionNumber: img.questionNumber
    })))
  }

  return images
})

const hasImages = computed(() => previewImages.value.length > 0)

// 페이지당 문항 수 설정 (기본값: 4개)
const questionsPerPage = ref(4)

// 페이지별로 이미지 분할 (간단한 4개씩 분할 로직)
const paginatedImages = computed(() => {
  if (!hasImages.value) return []

  const pages = []
  const allImages = [...previewImages.value]
  
  // 페이지당 문항 수로 단순 분할
  const itemsPerPage = questionsPerPage.value
  
  for (let i = 0; i < allImages.length; i += itemsPerPage) {
    const pageImages = allImages.slice(i, i + itemsPerPage)
    
    // 2단 레이아웃을 위해 컬럼 할당
    // 짝수 인덱스는 왼쪽(0), 홀수 인덱스는 오른쪽(1)
    const processedImages = pageImages.map((img, idx) => ({
      ...img,
      column: idx % 2, // 0: 왼쪽, 1: 오른쪽
      pageIndex: idx
    }))
    
    pages.push(processedImages)
  }
  
  console.log('[ExamImagePreview] Pagination result:', {
    totalImages: allImages.length,
    questionsPerPage: itemsPerPage,
    totalPages: pages.length,
    pagesDetail: pages.map((p, idx) => ({ 
      page: idx + 1, 
      imageCount: p.length,
      questionNumbers: p.map(img => img.questionNumber || '?').join(', ')
    }))
  })

  return pages
})

const totalPages = computed(() => {
  return Math.max(paginatedImages.value.length, 1)
})

const currentPageImages = computed(() => {
  if (!hasImages.value || paginatedImages.value.length === 0) return []

  const pageIdx = currentPage.value - 1
  const pageImages = paginatedImages.value[pageIdx] || []

  console.log('[ExamImagePreview] currentPageImages detail:', {
    page: currentPage.value,
    count: pageImages.length,
    images: pageImages
  })

  // 실제 이미지 데이터 확인
  pageImages.forEach((img, idx) => {
    if (!img.dataUrl) {
      console.error(`[ExamImagePreview] Image ${idx} missing dataUrl!`, img)
    }
  })

  return pageImages
})

// props로 받은 examInfo를 사용하되, 없으면 기존 store에서 가져오기
const examInfo = computed(() => {
  // props.examInfo가 있으면 우선 사용
  if (props.examInfo && Object.keys(props.examInfo).length > 0) {
    return props.examInfo
  }
  
  // 없으면 기존 방식대로 store에서 가져오기
  const info = testBankStore.examInfo || {}
  return {
    title: info.title || info.examName || '2024학년도 시험',
    grade: info.gradeCode || '',
    subject: info.areaCode || info.subjectCode || '',
    duration: info.duration || 50,
    totalScore: info.totalScore || 100
  }
})

// Methods
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const validatePageNumber = () => {
  if (currentPage.value < 1) {
    currentPage.value = 1
  } else if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
}

const recalculatePagination = () => {
  // Reset to first page when layout changes
  currentPage.value = 1
}

const zoomIn = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value += 25
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 25
  }
}

const resetZoom = () => {
  zoomLevel.value = 100
}

const handleImageLoad = (idx, image, event) => {
  const imgElement = event?.target
  if (imgElement) {
    // getBoundingClientRect를 사용하여 더 정확한 크기 확인
    const rect = imgElement.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(imgElement)

    console.log('[ExamImagePreview] ✅ Image loaded successfully:', {
      index: idx,
      type: image.type,
      questionNumber: image.questionNumber,
      naturalWidth: imgElement.naturalWidth,
      naturalHeight: imgElement.naturalHeight,
      displayWidth: imgElement.width,
      displayHeight: imgElement.height,
      boundingRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      computedDisplay: computedStyle.display,
      computedVisibility: computedStyle.visibility,
      computedOpacity: computedStyle.opacity,
      complete: imgElement.complete,
      visible: rect.width > 0 && rect.height > 0,
      src: imgElement.src?.substring(0, 100)
    })

    // 이미지가 실제로 보이는지 확인 (getBoundingClientRect 사용)
    if (rect.width === 0 || rect.height === 0) {
      console.warn(`[ExamImagePreview] ⚠️ Image loaded but not visible! Index: ${idx}`)

      // 강제로 스타일 재적용
      imgElement.style.display = 'block'
      imgElement.style.visibility = 'visible'
      imgElement.style.opacity = '1'
      imgElement.style.width = '100%'
      imgElement.style.height = 'auto'
    }
  } else {
    console.log(`[ExamImagePreview] Image loaded without event: ${idx}`, image.type)
  }
}

const handleImageError = (idx, image, event) => {
  console.error('[ExamImagePreview] ❌ Image failed to load:', {
    index: idx,
    type: image.type,
    questionNumber: image.questionNumber,
    dataUrlExists: !!image.dataUrl,
    dataUrlLength: image.dataUrl?.length,
    dataUrlStart: image.dataUrl?.substring(0, 50),
    error: event?.type
  })

  // dataUrl이 있는데도 로드 실패한 경우 더 자세히 확인
  if (image.dataUrl) {
    console.error('[ExamImagePreview] DataURL format check:', {
      startsWithDataImage: image.dataUrl.startsWith('data:image/'),
      hasBase64: image.dataUrl.includes('base64,'),
      length: image.dataUrl.length
    })
  }
}

const saveExam = async () => {
  if (!hasImages.value) {
    alert('이미지가 없습니다. 먼저 문제를 이미지로 변환해주세요.')
    return
  }

  isSaving.value = true
  progressMessage.value = 'PDF 생성 중...'

  try {
    // 1. PDF 생성
    console.log('PDF 생성 시작...')

    // 시험 제목 헤더 이미지 생성
    const headerImage = await createExamHeaderImage(examInfo.value)

    // 헤더 이미지를 포함한 전체 이미지 배열
    const allImages = [headerImage, ...previewImages.value]

    // PDF 생성
    const pdf = await generatePDFFromImages(allImages, {
      examTitle: examInfo.value.title,
      subject: examInfo.value.subject,
      grade: examInfo.value.grade,
      duration: examInfo.value.duration,
      totalScore: examInfo.value.totalScore,
      layoutMode: layoutMode.value,
      showPageNumbers: true,
      onProgress: (progress) => {
        progressMessage.value = progress.message || 'PDF 생성 중...'
      }
    })

    // PDF를 Blob으로 변환
    const pdfBlob = pdfToBlob(pdf)
    console.log('PDF Blob 생성 완료:', pdfBlob)

    // 2. 시험지 데이터 준비
    const selectedItems = itemStore.selectedItems || []

    // UserExam 데이터
    const examData = {
      // 기본 정보
      examName: examInfo.value.title || `${new Date().getFullYear()}년 시험지`,
      gradeCode: testBankStore.examInfo?.gradeCode || '08',
      gradeName: testBankStore.examInfo?.gradeName || '중2',
      termCode: testBankStore.examInfo?.termCode || '1',
      termName: testBankStore.examInfo?.termName || '1학기',
      areaCode: testBankStore.examInfo?.areaCode || testBankStore.examInfo?.subjectCode || 'MAT',
      areaName: testBankStore.examInfo?.areaName || testBankStore.examInfo?.subject || '수학',
      examType: 'TESTWIZARD',

      // 시험 설정
      visibility: 'PRIVATE', // 기본값
      timeLimit: examInfo.value.duration || 50,
      examDate: new Date().toISOString().split('T')[0],
      description: `${examInfo.value.title} - ${examInfo.value.subject}`,
      totalScore: examInfo.value.totalScore || 100,

      // 문항 데이터 (백엔드 items 필드로 매핑)
      items: selectedItems.map((item, index) => ({
        itemId: item.itemId || item.id,  // Item 테이블의 ID
        subjectId: item.subjectId || null,  // 과목 ID 추가
        itemOrder: index + 1,  // 시험지 내 문제 순서
        points: item.points || 5  // 문제 배점
      }))
    }

    console.log('시험지 저장 데이터:', examData)

    // 3. FormData 생성 (PDF와 함께 전송)
    const formData = new FormData()
    formData.append('examData', JSON.stringify(examData))

    const fileName = `${examData.examName}_${new Date().toISOString().split('T')[0]}.pdf`
    formData.append('pdfFile', pdfBlob, fileName)
    console.log('PDF 파일 추가됨:', fileName)

    progressMessage.value = '서버에 저장 중...'

    // 4. API 호출
    try {
      console.log('API 호출 시작 - userExamApi.createExamWithPDF')
      const response = await userExamApi.createExamWithPDF(formData)
      console.log('API 응답 받음:', response)

      if (response && response.data) {
        console.log('시험지 및 PDF 저장 성공:', response.data)
        alert('시험지가 성공적으로 저장되었습니다!')

        // Store 정보 업데이트
        testBankStore.setExamInfo({
          savedExamId: response.data.id,
          pdfUrl: response.data.pdfUrl,
          savedAt: new Date().toISOString()
        })
      } else {
        throw new Error('응답 데이터가 없습니다')
      }
    } catch (apiError) {
      console.error('시험지 저장 실패:', apiError)
      alert('시험지 저장에 실패했습니다: ' + apiError.message)
    }

    isSaving.value = false
    progressMessage.value = ''
  } catch (error) {
    console.error('[ExamImagePreview] Exam save failed:', error)
    alert('시험지 저장 중 오류가 발생했습니다.')
    isSaving.value = false
    progressMessage.value = ''
  }
}

// Parent-friendly hook: Generate PDF Blob from current images (no upload)
// Used by Step3ExamSave via ref
async function generateAndSavePDF() {
  if (!hasImages.value) return null

  // 시험 제목 헤더 이미지 포함
  const headerImage = await createExamHeaderImage(examInfo.value)
  const allImages = [headerImage, ...previewImages.value]

  const pdf = await generatePDFFromImages(allImages, {
    examTitle: examInfo.value.title,
    subject: examInfo.value.subject,
    grade: examInfo.value.grade,
    duration: examInfo.value.duration,
    totalScore: examInfo.value.totalScore,
    layoutMode: layoutMode.value,
    showPageNumbers: true
  })

  return pdfToBlob(pdf)
}

// Expose to parent
defineExpose({ generateAndSavePDF })

const downloadPDF = async () => {
  if (!hasImages.value) {
    alert('이미지가 없습니다. 먼저 문제를 이미지로 변환해주세요.')
    return
  }

  isGeneratingPDF.value = true
  progressMessage.value = 'PDF 생성 준비 중...'

  try {
    // 시험 제목 헤더 이미지 생성
    progressMessage.value = '시험 제목 생성 중...'
    const headerImage = await createExamHeaderImage(examInfo.value)

    // 헤더 이미지를 포함한 전체 이미지 배열
    const allImages = [headerImage, ...previewImages.value]

    // Generate PDF from images with questions per page setting
    const pdf = await generatePDFFromImages(allImages, {
      examTitle: examInfo.value.title,
      subject: examInfo.value.subject,
      grade: examInfo.value.grade,
      duration: examInfo.value.duration,
      totalScore: examInfo.value.totalScore,
      layoutMode: layoutMode.value,
      questionsPerPage: questionsPerPage.value, // 페이지당 문항 수 전달
      showPageNumbers: true,
      onProgress: (progress) => {
        progressMessage.value = progress.message || 'PDF 생성 중...'
      }
    })

    // Download the PDF
    const filename = `exam_${new Date().toISOString().split('T')[0]}.pdf`
    downloadGeneratedPDF(pdf, filename)

    progressMessage.value = 'PDF 다운로드 완료!'
    setTimeout(() => {
      isGeneratingPDF.value = false
      progressMessage.value = ''
    }, 2000)
  } catch (error) {
    console.error('[ExamImagePreview] PDF generation failed:', error)
    alert('PDF 생성 중 오류가 발생했습니다.')
    isGeneratingPDF.value = false
    progressMessage.value = ''
  }
}

// Watch for page changes
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = Math.max(1, newTotal)
  }
})

// Watch for current page changes
watch(currentPage, async () => {
  console.log(`[ExamImagePreview] Page changed to ${currentPage.value}`)
  await nextTick()
  await forceRenderImages()
})

// Watch for layout mode changes
watch(layoutMode, async () => {
  console.log(`[ExamImagePreview] Layout changed to ${layoutMode.value}`)
  await nextTick()
  await forceRenderImages()
})

// Watch for props changes
watch(() => props.convertedImages, (newImages) => {
  console.log('[ExamImagePreview] Props images changed:', newImages?.length || 0)
  if (newImages && newImages.length > 0) {
    console.log('[ExamImagePreview] New images received via props:', {
      count: newImages.length,
      firstImage: {
        hasDataUrl: !!newImages[0].dataUrl,
        type: newImages[0].type,
        questionNumber: newImages[0].questionNumber
      }
    })
  }
}, { deep: true, immediate: true })

// Force render images
const forceRenderImages = async () => {
  await nextTick()
  const images = document.querySelectorAll('.question-image')
  const wrappers = document.querySelectorAll('.image-wrapper')
  const a4Page = document.querySelector('.a4-page')
  const previewContainer = document.querySelector('.preview-container')

  console.log(`[ExamImagePreview] Force render: ${images.length} images, ${wrappers.length} wrappers`)

  // 컨테이너 스타일 확인 및 수정
  if (previewContainer) {
    previewContainer.style.overflow = 'auto'
    console.log('[ExamImagePreview] Preview container overflow set to auto')
  }

  if (a4Page) {
    // transform 제거하여 원본 크기로 표시 (디버깅용)
    const currentTransform = a4Page.style.transform
    console.log('[ExamImagePreview] Current A4 page transform:', currentTransform)

    // 스크롤 위치 초기화
    if (previewContainer) {
      previewContainer.scrollTop = 0
      previewContainer.scrollLeft = 0
    }
  }

  // 래퍼 스타일 강제 적용
  wrappers.forEach((wrapper, idx) => {
    wrapper.style.display = 'block'
    wrapper.style.visibility = 'visible'
    wrapper.style.opacity = '1'
    wrapper.style.minHeight = '100px'
    wrapper.style.overflow = 'visible'
    console.log(`[ExamImagePreview] Wrapper ${idx} style applied`)
  })

  images.forEach((img, idx) => {
    const rect = img.getBoundingClientRect()
    console.log(`[ExamImagePreview] Force checking image ${idx}:`, {
      src: img.src?.substring(0, 100),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      boundingRect: { width: rect.width, height: rect.height },
      parentElement: img.parentElement?.className,
      style: img.style.cssText
    })

    // Force display with important - 모든 가능한 숨김 속성 제거
    img.style.setProperty('display', 'block', 'important')
    img.style.setProperty('visibility', 'visible', 'important')
    img.style.setProperty('opacity', '1', 'important')
    img.style.setProperty('width', '100%', 'important')
    img.style.setProperty('height', 'auto', 'important')
    img.style.setProperty('max-width', '100%', 'important')
    img.style.setProperty('transform', 'none', 'important')
    img.style.setProperty('filter', 'none', 'important')
    img.style.setProperty('clip-path', 'none', 'important')
    img.style.setProperty('mask', 'none', 'important')
    img.style.setProperty('position', 'relative', 'important')
    img.style.setProperty('z-index', '1', 'important')
  })
}

// 테스트용 이미지 추가 함수
const addTestImage = () => {
  // 테스트용 1x1 빨간 픽셀 이미지
  const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='

  console.log('[ExamImagePreview] Adding test image to verify rendering')

  // 임시로 테스트 이미지 추가
  const testImage = {
    dataUrl: testDataUrl,
    type: 'test',
    questionNumber: 999,
    questionId: 'test-999'
  }

  // Store의 이미지 배열 끝에 테스트 이미지 추가
  const currentImages = itemStore.getConvertedImages() || []
  if (currentImages.length > 0 && !currentImages.some(img => img.questionId === 'test-999')) {
    currentImages.push(testImage)
    itemStore.setConvertedImages(currentImages)
    console.log('[ExamImagePreview] Test image added. Total images:', currentImages.length)
  }
}

// Lifecycle
onMounted(async () => {
  console.log('[ExamImagePreview] 🚀 Component mounted')
  console.log('[ExamImagePreview] Props images:', props.convertedImages?.length || 0)
  console.log('[ExamImagePreview] Store images:', itemStore.getConvertedImages()?.length || 0)
  console.log('[ExamImagePreview] Total images available:', previewImages.value.length)

  // 이미지 데이터 검증
  if (previewImages.value.length > 0) {
    const firstImg = previewImages.value[0]
    console.log('[ExamImagePreview] First image validation:', {
      hasDataUrl: !!firstImg.dataUrl,
      dataUrlLength: firstImg.dataUrl?.length,
      isValidDataUrl: firstImg.dataUrl?.startsWith('data:image/'),
      type: firstImg.type,
      questionNumber: firstImg.questionNumber
    })
  }

  // 테스트 이미지 추가 (디버깅용) - 실제 이미지가 없을 때만
  if (previewImages.value.length === 0 && !props.convertedImages?.length) {
    console.log('[ExamImagePreview] No images found, adding test image for debugging')
    addTestImage()
  }

  if (previewImages.value.length > 0) {
    console.log('[ExamImagePreview] First image sample:', {
      type: previewImages.value[0].type,
      questionNumber: previewImages.value[0].questionNumber,
      hasDataUrl: !!previewImages.value[0].dataUrl,
      dataUrlLength: previewImages.value[0].dataUrl?.length,
      dataUrlStart: previewImages.value[0].dataUrl?.substring(0, 100)
    })

    // 데이터 구조 전체 확인
    console.log('[ExamImagePreview] Full image data structure:',
      previewImages.value.map((img, idx) => ({
        index: idx,
        type: img.type,
        questionNumber: img.questionNumber,
        questionId: img.questionId,
        hasDataUrl: !!img.dataUrl,
        dataUrlLength: img.dataUrl?.length
      }))
    )
  }

  // Force render after mount
  await nextTick()
  await forceRenderImages()

  // Check again after delay
  setTimeout(() => {
    console.log('[ExamImagePreview] Checking images after delay...')
    forceRenderImages()

    // DOM에 실제로 이미지가 있는지 확인
    const imgElements = document.querySelectorAll('.image-wrapper img, .exam-image-preview img')
    console.log(`[ExamImagePreview] Found ${imgElements.length} img elements in DOM`)

    imgElements.forEach((img, idx) => {
      console.log(`[ExamImagePreview] DOM Image ${idx}:`, {
        src: img.src?.substring(0, 50),
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        visible: img.offsetWidth > 0 && img.offsetHeight > 0,
        display: window.getComputedStyle(img).display,
        visibility: window.getComputedStyle(img).visibility,
        opacity: window.getComputedStyle(img).opacity
      })
    })
  }, 1000)
})
</script>

<style scoped>
.exam-image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* Control Bar */
.control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  gap: 20px;
  flex-wrap: wrap;
}

.page-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn {
  padding: 8px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #0056b3;
}

.nav-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-input {
  width: 50px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.page-total {
  font-size: 14px;
  color: #666;
}

/* Layout Controls */
.layout-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.page-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-select:hover {
  border-color: #007bff;
}

.page-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.layout-fixed {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 4px;
}

/* Zoom Controls */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #f0f0f0;
}

.zoom-level {
  font-size: 14px;
  min-width: 50px;
  text-align: center;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 10px;
}

.save-btn,
.download-btn {
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn {
  background: #007bff;
}

.save-btn:hover:not(:disabled) {
  background: #0056b3;
}

.download-btn {
  background: #28a745;
}

.download-btn:hover:not(:disabled) {
  background: #218838;
}

.save-btn:disabled,
.download-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.save-btn svg,
.download-btn svg {
  width: 16px;
  height: 16px;
}

/* Preview Container */
.preview-container {
  flex: 1;
  overflow: auto;
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f5f5f5;
  min-height: 600px;
}

/* No Images Message */
.no-images-message {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.message-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.no-images-message h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.no-images-message p {
  font-size: 16px;
  color: #666;
}

/* A4 Page */
.a4-page {
  width: 794px; /* A4 width at 96dpi */
  min-height: 1123px; /* A4 height at 96dpi */
  background: white;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  padding: 40px 30px; /* 적절한 여백 */
  margin: 0 auto; /* 중앙 정렬 */
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  overflow: visible;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #333;
}

.exam-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.exam-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.exam-info span {
  position: relative;
}

.exam-info span:not(:last-child)::after {
  content: '|';
  position: absolute;
  right: -12px;
  color: #ccc;
}

/* Page Content */
.page-content {
  flex: 1;
  padding: 15px;
  overflow: visible;
  width: 100%;
}

/* 2단 레이아웃 컨테이너 */
.columns-container {
  display: flex;
  gap: 15px;
  width: 100%;
  height: 100%;
  align-items: flex-start;
}

/* 각 컬럼 스타일 */
.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.left-column {
  border-right: 1px dashed #e0e0e0;
  padding-right: 15px;
}

.right-column {
  padding-left: 0;
}

/* Image Wrapper - 이미지 컨테이너 스타일 */
.image-wrapper {
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
  background: white;
  box-sizing: border-box;
  position: relative;
  display: block;
  overflow: visible;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.image-wrapper img,
.question-image {
  width: 100% !important;
  height: auto !important;
  display: block !important;
  max-width: 100% !important;
  visibility: visible !important;
  opacity: 1 !important;
  object-fit: contain !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Question Image Styles - 통합 */
.question-image {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background-color: white;
  object-fit: contain;
}

.no-image-placeholder {
  padding: 40px;
  background: #f9f9f9;
  border: 2px dashed #ddd;
  border-radius: 4px;
  text-align: center;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.no-image-placeholder svg {
  color: #ccc;
  margin-bottom: 10px;
}

.no-image-placeholder p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.debug-info {
  padding: 5px;
  background: #f0f0f0;
  margin-bottom: 10px;
  font-size: 12px;
  border-radius: 4px;
}

/* Page Footer */
.page-footer {
  text-align: center;
  padding-top: 20px;
  margin-top: auto;
}

.page-number {
  font-size: 12px;
  color: #999;
}

/* Progress Overlay */
.progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.progress-content {
  background: white;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-text {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

/* Print Styles */
@media print {
  .control-bar,
  .progress-overlay {
    display: none !important;
  }

  .preview-container {
    padding: 0;
    transform: scale(1) !important;
  }

  .a4-page {
    box-shadow: none;
    page-break-after: always;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .control-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .page-navigation,
  .layout-controls,
  .zoom-controls {
    justify-content: center;
  }

  .a4-page {
    width: 100%;
    min-height: auto;
    padding: 15mm 10mm;
  }
}
</style>
