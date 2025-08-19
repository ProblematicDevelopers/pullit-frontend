import { ref } from 'vue'

/**
 * Item Processing 에러 처리를 담당하는 Composable
 * 에러 발생 시 일관된 처리와 상태 초기화를 담당
 */
export function useItemProcessingError() {
  // 현재 에러 상태
  const currentError = ref(null)
  const errorContext = ref(null)

  /**
   * 에러 설정
   * @param {Error|string} error - 에러 객체 또는 메시지
   * @param {string} context - 에러 발생 컨텍스트
   */
  const setError = (error, context = '') => {
    const errorMessage = error instanceof Error ? error.message : error
    currentError.value = errorMessage
    errorContext.value = context

    console.error(`[${context}] 에러 발생:`, errorMessage)

    // 에러가 Error 객체인 경우 스택 트레이스도 로깅
    if (error instanceof Error) {
      console.error('에러 스택:', error.stack)
    }
  }

  /**
   * 에러 초기화
   */
  const clearError = () => {
    currentError.value = null
    errorContext.value = null
  }

  /**
   * PDF 관련 에러 처리
   * @param {Error} error - PDF 처리 에러
   * @param {Function} resetCallback - 상태 초기화 콜백
   */
  const handlePdfError = (error, resetCallback) => {
    let userMessage = 'PDF 파일을 처리하는 중 오류가 발생했습니다.'

    // 에러 타입별 사용자 친화적 메시지 생성
    if (error.message.includes('파일 읽기 실패')) {
      userMessage = 'PDF 파일을 읽을 수 없습니다. 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.'
    } else if (error.message.includes('문서 로딩 실패')) {
      userMessage = 'PDF 문서를 로드할 수 없습니다. 파일이 올바른 PDF 형식인지 확인해주세요.'
    } else if (error.message.includes('페이지 생성 실패')) {
      userMessage = 'PDF 페이지를 처리하는 중 오류가 발생했습니다. 파일을 다시 확인해주세요.'
    }

    setError(userMessage, 'PDF 처리')

    // 상태 초기화 콜백 실행
    if (typeof resetCallback === 'function') {
      try {
        resetCallback()
      } catch (resetError) {
        console.error('상태 초기화 중 오류:', resetError)
      }
    }

    // 사용자에게 에러 메시지 표시 (Toast 또는 alert)
    if (typeof window !== 'undefined') {
      alert(userMessage)
    }
  }

  /**
   * 교과서 관련 에러 처리
   * @param {Error} error - 교과서 처리 에러
   */
  const handleTextbookError = (error) => {
    let userMessage = '교과서 정보를 처리하는 중 오류가 발생했습니다.'

    if (error.message.includes('API')) {
      userMessage = '교과서 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.'
    } else if (error.message.includes('선택')) {
      userMessage = '교과서 선택 중 오류가 발생했습니다.'
    }

    setError(userMessage, '교과서 처리')

    if (typeof window !== 'undefined') {
      alert(userMessage)
    }
  }

  /**
   * 일반적인 에러 처리
   * @param {Error|string} error - 에러 객체 또는 메시지
   * @param {string} context - 에러 컨텍스트
   */
  const handleGeneralError = (error, context = '일반') => {
    setError(error, context)

    const message = currentError.value
    if (typeof window !== 'undefined') {
      alert(message)
    }
  }

  /**
   * 에러가 발생했는지 확인
   */
  const hasError = () => currentError.value !== null

  /**
   * 현재 에러 메시지 반환
   */
  const getErrorMessage = () => currentError.value

  /**
   * 에러 컨텍스트 반환
   */
  const getErrorContext = () => errorContext.value

  return {
    // 상태
    currentError,
    errorContext,

    // 메서드
    setError,
    clearError,
    handlePdfError,
    handleTextbookError,
    handleGeneralError,
    hasError,
    getErrorMessage,
    getErrorContext
  }
}
