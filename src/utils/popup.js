/**
 * 팝업 창 관리 유틸리티
 *
 * 새창 팝업을 열고 관리하는 유틸리티 함수들을 제공합니다.
 * 팝업 창 간의 데이터 통신은 localStorage를 통해 이루어집니다.
 */

/**
 * 시험지 마법사 팝업 열기
 * @param {Object} options - 팝업 옵션
 * @param {string} options.subject - 선택된 과목 정보
 * @param {number} options.width - 팝업 가로 크기 (기본값: 1200)
 * @param {number} options.height - 팝업 세로 크기 (기본값: 800)
 * @param {boolean} options.center - 화면 중앙 위치 여부 (기본값: true)
 * @returns {Window|null} 열린 팝업 창 객체
 */
export function openTestWizardPopup(options = {}) {
  // 기본 설정값들
  const defaultOptions = {
    width: 1200,
    height: 800,
    center: true,
    scrollbars: 'yes',
    resizable: 'yes',
    toolbar: 'no',
    menubar: 'no',
    location: 'no',
    directories: 'no',
    status: 'no'
  }

  // 전달받은 옵션과 기본값 병합
  const config = { ...defaultOptions, ...options }

  // 화면 중앙 위치 계산
  let left = 0
  let top = 0

  if (config.center) {
    // 사용자 화면의 중앙에 팝업 위치 계산
    const screenWidth = window.screen.availWidth
    const screenHeight = window.screen.availHeight
    left = Math.round((screenWidth - config.width) / 2)
    top = Math.round((screenHeight - config.height) / 2)
  }

  // 팝업 창 옵션 문자열 생성
  const features = [
    `width=${config.width}`,
    `height=${config.height}`,
    `left=${left}`,
    `top=${top}`,
    `scrollbars=${config.scrollbars}`,
    `resizable=${config.resizable}`,
    `toolbar=${config.toolbar}`,
    `menubar=${config.menubar}`,
    `location=${config.location}`,
    `directories=${config.directories}`,
    `status=${config.status}`
  ].join(',')

  try {
    // 팝업 열기 전에 현재 상태를 localStorage에 저장
    // 이렇게 하면 팝업 창에서 부모 창의 데이터에 접근할 수 있습니다
    if (options.subject) {
      localStorage.setItem('wizard_subject_data', JSON.stringify(options.subject))
    }

    // 팝업 창 열기
    const popup = window.open(
      '/exam/wizard', // 팝업에서 로드할 경로
      'testWizardPopup', // 창 이름 (같은 이름으로 다시 열면 기존 창을 재사용)
      features
    )

    // 팝업이 성공적으로 열렸는지 확인
    if (!popup) {
      throw new Error('팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해주세요.')
    }

    // 팝업 창에 포커스 설정
    popup.focus()

    // 팝업 창이 닫힐 때 이벤트 리스너 등록
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        // 팝업 창이 닫히면 임시 데이터 정리
        cleanupPopupData()
        // 부모 창에서 팝업 닫힘 이벤트 처리
        handlePopupClosed()
      }
    }, 1000)

    return popup

  } catch (error) {
    console.error('팝업 열기 실패:', error)
    alert('팝업을 열 수 없습니다. 브라우저 설정을 확인해주세요.')
    return null
  }
}

/**
 * 문제 은행 탐색 팝업 열기
 * @param {Object} options - 팝업 옵션
 * @returns {Window|null} 열린 팝업 창 객체
 */
export function openQuestionBankPopup(options = {}) {
  const config = {
    width: 1400,
    height: 900,
    center: true,
    ...options
  }

  return openTestWizardPopup({
    ...config,
    // 문제 은행 전용 경로로 설정 (향후 구현)
    // url: '/question-bank'
  })
}

/**
 * 시험지 미리보기 팝업 열기
 * @param {Object} examData - 시험지 데이터
 * @param {Object} options - 팝업 옵션
 * @returns {Window|null} 열린 팝업 창 객체
 */
export function openExamPreviewPopup(examData, options = {}) {
  const config = {
    width: 900,
    height: 700,
    center: true,
    ...options
  }

  // 시험지 데이터를 localStorage에 저장
  localStorage.setItem('exam_preview_data', JSON.stringify(examData))

  return openTestWizardPopup({
    ...config,
    // 미리보기 전용 경로로 설정 (향후 구현)
    // url: '/exam-preview'
  })
}

/**
 * 팝업 창 간 데이터 통신을 위한 localStorage 키 정의
 */
export const POPUP_STORAGE_KEYS = {
  WIZARD_SUBJECT: 'wizard_subject_data',
  WIZARD_STATE: 'wizard_state_data',
  EXAM_PREVIEW: 'exam_preview_data',
  QUESTION_BANK: 'question_bank_filter'
}

/**
 * 팝업 관련 임시 데이터 정리
 * 팝업이 닫힐 때 localStorage의 임시 데이터를 제거합니다
 */
export function cleanupPopupData() {
  Object.values(POPUP_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

/**
 * 팝업 창에서 부모 창으로 데이터 전송
 * @param {string} eventType - 이벤트 타입
 * @param {any} data - 전송할 데이터
 */
export function sendToParent(eventType, data) {
  try {
    // opener는 팝업을 연 부모 창을 참조합니다
    if (window.opener && !window.opener.closed) {
      // postMessage를 사용한 안전한 데이터 전송
      window.opener.postMessage({
        type: 'POPUP_EVENT',
        eventType,
        data,
        timestamp: Date.now()
      }, window.location.origin)
    }
  } catch (error) {
    console.error('부모 창으로 데이터 전송 실패:', error)
  }
}

/**
 * 부모 창에서 팝업 메시지 수신 처리
 * 부모 창에서 이 함수를 호출하여 팝업으로부터의 메시지를 처리합니다
 * @param {Function} callback - 메시지 처리 콜백 함수
 */
export function listenToPopupMessages(callback) {
  const messageHandler = (event) => {
    // 보안을 위해 origin 검증
    if (event.origin !== window.location.origin) {
      return
    }

    // 팝업에서 온 메시지인지 확인
    if (event.data && event.data.type === 'POPUP_EVENT') {
      callback(event.data.eventType, event.data.data)
    }
  }

  window.addEventListener('message', messageHandler)

  // 이벤트 리스너 제거 함수 반환
  return () => {
    window.removeEventListener('message', messageHandler)
  }
}

/**
 * 팝업 창이 닫혔을 때 처리 로직
 * 부모 창에서 팝업의 닫힘을 감지하고 필요한 후처리를 수행합니다
 */
function handlePopupClosed() {
  // 팝업에서 저장된 결과 데이터가 있는지 확인
  const wizardResult = localStorage.getItem('wizard_result_data')

  if (wizardResult) {
    try {
      const result = JSON.parse(wizardResult)

      // 사용자 정의 이벤트 발생으로 다른 컴포넌트에 알림
      window.dispatchEvent(new CustomEvent('wizardCompleted', {
        detail: result
      }))

      // 결과 데이터 정리
      localStorage.removeItem('wizard_result_data')

    } catch (error) {
      console.error('마법사 결과 처리 실패:', error)
    }
  }
}

/**
 * 현재 창이 팝업인지 확인
 * @returns {boolean} 팝업 창 여부
 */
export function isPopupWindow() {
  return window.opener != null && !window.opener.closed
}

/**
 * 팝업 창 닫기
 * 팝업 창에서 호출하여 자신을 닫습니다
 * @param {any} result - 부모 창으로 전달할 결과 데이터
 */
export function closePopup(result = null) {
  if (isPopupWindow()) {
    // 결과 데이터가 있으면 localStorage에 저장
    if (result) {
      localStorage.setItem('wizard_result_data', JSON.stringify(result))
    }

    // 부모 창에 닫힘 알림
    sendToParent('POPUP_CLOSING', result)

    // 창 닫기
    window.close()
  }
}

/**
 * 브라우저의 팝업 차단 여부 확인
 * @returns {Promise<boolean>} 팝업 차단 여부
 */
export function checkPopupBlocked() {
  return new Promise((resolve) => {
    try {
      // 작은 테스트 팝업을 열어서 차단 여부 확인
      const testPopup = window.open('', 'popupTest', 'width=1,height=1,left=0,top=0')

      if (!testPopup) {
        resolve(true) // 팝업 차단됨
      } else {
        testPopup.close()
        resolve(false) // 팝업 허용됨
      }
    } catch (error) {
      resolve(true) // 오류 발생 시 차단된 것으로 간주
    }
  })
}

/**
 * 반응형 팝업 크기 계산
 * 사용자 화면 크기에 따라 적절한 팝업 크기를 계산합니다
 * @param {Object} preferredSize - 선호하는 크기 { width, height }
 * @returns {Object} 계산된 크기 { width, height }
 */
export function calculateResponsivePopupSize(preferredSize = {}) {
  const screenWidth = window.screen.availWidth
  const screenHeight = window.screen.availHeight

  // 기본값 설정
  const defaultSize = { width: 1200, height: 800 }
  const desired = { ...defaultSize, ...preferredSize }

  // 화면 크기의 90%를 최대값으로 설정
  const maxWidth = Math.floor(screenWidth * 0.9)
  const maxHeight = Math.floor(screenHeight * 0.9)

  return {
    width: Math.min(desired.width, maxWidth),
    height: Math.min(desired.height, maxHeight)
  }
}
