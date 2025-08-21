/**
 * 한글 폰트 Base64 데이터
 * PDFMe에서 한글을 지원하기 위한 폰트 데이터
 */

/**
 * 한글 폰트 로드 (로컬 파일 또는 CDN)
 * @returns {Promise<Object>} PDFMe용 폰트 객체
 */
export const getKoreanFontForPDFMe = async () => {
  try {
    // 방법 1: 로컬 폰트 파일 사용 (public 폴더)
    const response = await fetch('/NotoSansKR-VariableFont_wght.ttf');
    if (response.ok) {
      const fontBuffer = await response.arrayBuffer();
      return {
        NotoSansKR: {
          data: new Uint8Array(fontBuffer),
          fallback: true  // 메인 폰트를 fallback으로 설정
        }
      };
    }
  } catch (error) {
    console.log('로컬 폰트 로드 실패, CDN 시도:', error);
  }

  try {
    // 방법 2: CDN에서 폰트 다운로드
    const fontUrl = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2107@1.1/Pretendard-Regular.woff';
    const response = await fetch(fontUrl);
    
    if (!response.ok) {
      throw new Error('CDN 폰트 로드 실패');
    }
    
    const fontBuffer = await response.arrayBuffer();
    
    return {
      NotoSansKR: {
        data: new Uint8Array(fontBuffer),
        fallback: true  // 메인 폰트를 fallback으로 설정
      }
    };
  } catch (error) {
    console.error('폰트 로드 완전 실패:', error);
    
    // 방법 3: 기본 폰트 사용 (한글 깨짐)
    return {};
  }
};

export default getKoreanFontForPDFMe;