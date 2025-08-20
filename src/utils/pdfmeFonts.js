/**
 * PDFMe용 한글 폰트 설정
 * Noto Sans KR 폰트를 PDFMe에서 사용할 수 있도록 설정
 */

/**
 * 한글 폰트 로드 (로컬 TTF 파일)
 * @returns {Promise<Object>} 폰트 객체
 */
export const loadKoreanFont = async () => {
  try {
    // public 폴더의 TTF 파일 로드
    const response = await fetch('/NotoSansKR-VariableFont_wght.ttf');
    
    if (!response.ok) {
      throw new Error('TTF 폰트 파일 로드 실패');
    }
    
    // ArrayBuffer로 변환
    const fontData = await response.arrayBuffer();
    
    // Uint8Array로 변환
    const fontBytes = new Uint8Array(fontData);
    
    console.log('TTF 폰트 로드 성공, 크기:', fontBytes.length);
    
    // PDFMe가 요구하는 형식으로 반환
    return {
      'NotoSansKR': {
        data: fontBytes,
        fallback: true  // 메인 폰트를 fallback으로 설정
      }
    };
  } catch (error) {
    console.error('TTF 폰트 로드 실패:', error);
    
    // 대체 방법: CDN에서 시도
    try {
      const fontUrl = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/Pretendard-Regular.woff';
      const response = await fetch(fontUrl);
      const fontData = await response.arrayBuffer();
      
      return {
        'NotoSansKR': {
          data: new Uint8Array(fontData),
          fallback: true  // 메인 폰트를 fallback으로 설정
        }
      };
    } catch (altError) {
      console.error('대체 폰트도 로드 실패:', altError);
      return {};
    }
  }
};

/**
 * 캐시된 폰트
 */
let cachedFont = null;

/**
 * PDFMe용 폰트 가져오기
 * @returns {Promise<Object>} PDFMe 폰트 객체
 */
export const getPDFMeFont = async () => {
  if (!cachedFont) {
    cachedFont = await loadKoreanFont();
  }
  return cachedFont;
};

export default {
  loadKoreanFont,
  getPDFMeFont
};