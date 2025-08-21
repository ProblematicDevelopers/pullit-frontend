/**
 * PDFMe용 한글 폰트 설정
 * Noto Sans KR 폰트를 PDFMe에서 사용할 수 있도록 설정
 */

/**
 * 한글 폰트 로드 (로컬 TTF 파일)
 * @returns {Promise<Object>} 폰트 객체
 */
export const loadKoreanFont = async () => {
  // 시도할 폰트 URL 목록
  const fontUrls = [
    '/NotoSansKR-Regular.ttf',  // 다운로드한 파일명으로 수정
    '/NotoSansKR-VariableFont_wght.ttf',  // 기존 파일명도 시도
    'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/NotoSansKR-Regular.ttf',
    'https://cdn.jsdelivr.net/gh/noonfonts/noonfonts_2107@1.1/Pretendard-Regular.woff'
  ];

  for (const fontUrl of fontUrls) {
    try {
      console.log(`폰트 로드 시도: ${fontUrl}`);
      const response = await fetch(fontUrl);

      if (!response.ok) {
        console.warn(`폰트 로드 실패 (${fontUrl}): HTTP ${response.status}`);
        continue;
      }

      // ArrayBuffer로 변환
      const fontData = await response.arrayBuffer();

      // Uint8Array로 변환
      const fontBytes = new Uint8Array(fontData);

      console.log(`TTF 폰트 로드 성공 (${fontUrl}), 크기:`, fontBytes.length);

      // PDFMe가 요구하는 형식으로 반환
      return {
        'NotoSansKR': {
          data: fontBytes,
          fallback: true  // 메인 폰트를 fallback으로 설정
        }
      };
    } catch (error) {
      console.warn(`폰트 로드 실패 (${fontUrl}):`, error.message);
      continue;
    }
  }

  console.error('모든 폰트 로드 시도 실패, 기본 폰트 사용');
  // 빈 객체 대신 기본 설정 반환
  return {
    'NotoSansKR': {
      data: new Uint8Array(),
      fallback: true
    }
  };
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
