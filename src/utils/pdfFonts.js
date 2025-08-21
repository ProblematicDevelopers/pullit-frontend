/**
 * PDF 폰트 설정
 * 한글 폰트 (Noto Sans KR) 로딩 및 설정
 */

// 폰트 캐시
let fontCache = null;

/**
 * Google Fonts에서 Noto Sans KR 폰트 로드
 * @returns {Promise<Object>} 폰트 객체
 */
export const loadNotoSansKR = async () => {
  try {
    // 이미 캐시된 경우 재사용
    if (fontCache) {
      return fontCache;
    }
    
    // Google Fonts CDN URL
    const fontUrl = 'https://fonts.gstatic.com/s/notosanskr/v27/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.woff2';
    
    // 폰트 다운로드
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error('폰트 로드 실패');
    }
    
    // ArrayBuffer로 변환
    const fontBuffer = await response.arrayBuffer();
    
    // Base64로 인코딩
    const fontBase64 = btoa(
      new Uint8Array(fontBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // 폰트 객체 생성
    const fontObject = {
      NotoSansKR: {
        data: fontBase64,
        fallback: true
      }
    };
    
    // 캐시 저장
    fontCache = fontObject;
    
    console.log('Noto Sans KR 폰트 로드 완료');
    return fontObject;
    
  } catch (error) {
    console.error('폰트 로드 실패:', error);
    // 폴백 폰트 반환
    return getDefaultFont();
  }
};

/**
 * 로컬 폰트 파일 로드 (대체 방법)
 * public/fonts/ 폴더에 폰트 파일이 있는 경우
 * @returns {Promise<Object>} 폰트 객체
 */
export const loadLocalFont = async () => {
  try {
    const response = await fetch('/fonts/NotoSansKR-Regular.ttf');
    const fontBuffer = await response.arrayBuffer();
    
    const fontBase64 = btoa(
      new Uint8Array(fontBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return {
      NotoSansKR: {
        data: fontBase64,
        fallback: true
      }
    };
  } catch (error) {
    console.error('로컬 폰트 로드 실패:', error);
    return getDefaultFont();
  }
};

/**
 * 기본 폰트 설정 (폴백)
 * @returns {Object} 기본 폰트 객체
 */
export const getDefaultFont = () => {
  // PDFMe 기본 폰트 사용 - 빈 객체 반환
  return {};
};

/**
 * 폰트 스타일 객체 생성
 * @param {String} fontName - 폰트 이름
 * @returns {Object} 폰트 스타일 객체
 */
export const getFontStyle = (fontName = 'NotoSansKR') => {
  return {
    fontName: fontName,
    fontSize: 11,
    alignment: 'left',
    lineHeight: 1.4,
    characterSpacing: 0,
    fontColor: '#000000'
  };
};

/**
 * 메인 폰트 로드 함수
 * @returns {Promise<Object>} 사용 가능한 폰트 객체
 */
export const getFont = async () => {
  try {
    // 먼저 Google Fonts에서 시도
    const font = await loadNotoSansKR();
    return font;
  } catch (error) {
    console.warn('Google Fonts 로드 실패, 로컬 폰트 시도:', error);
    
    try {
      // 로컬 폰트 시도
      return await loadLocalFont();
    } catch (localError) {
      console.warn('로컬 폰트도 실패, 기본 폰트 사용:', localError);
      // 최종 폴백
      return getDefaultFont();
    }
  }
};

/**
 * 폰트 프리로드 (성능 최적화)
 * 애플리케이션 시작 시 호출
 */
export const preloadFonts = async () => {
  try {
    await getFont();
    console.log('폰트 프리로드 완료');
  } catch (error) {
    console.error('폰트 프리로드 실패:', error);
  }
};

/**
 * 텍스트 측정 유틸리티
 * PDF에서 텍스트가 차지할 크기 계산
 * @param {String} text - 측정할 텍스트
 * @param {Number} fontSize - 폰트 크기
 * @returns {Object} 너비와 높이
 */
export const measureText = (text, fontSize = 11) => {
  // Canvas를 사용한 텍스트 측정
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px 'Noto Sans KR', sans-serif`;
  
  const metrics = context.measureText(text);
  
  return {
    width: metrics.width,
    height: fontSize * 1.4 // 대략적인 높이
  };
};

/**
 * 긴 텍스트 자동 줄바꿈
 * @param {String} text - 원본 텍스트
 * @param {Number} maxWidth - 최대 너비
 * @param {Number} fontSize - 폰트 크기
 * @returns {Array} 줄바꿈된 텍스트 배열
 */
export const wrapText = (text, maxWidth, fontSize = 11) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const { width } = measureText(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

/**
 * 폰트 설정 검증
 * @param {Object} fontObject - 검증할 폰트 객체
 * @returns {Boolean} 유효성 여부
 */
export const validateFont = (fontObject) => {
  if (!fontObject) return false;
  
  const fontNames = Object.keys(fontObject);
  if (fontNames.length === 0) return false;
  
  for (const fontName of fontNames) {
    const font = fontObject[fontName];
    if (!font || (!font.data && !font.fallback)) {
      return false;
    }
  }
  
  return true;
};

// 폰트 매핑 테이블 (다국어 지원용)
export const fontMapping = {
  'ko': 'NotoSansKR',      // 한국어
  'en': 'Helvetica',        // 영어
  'ja': 'NotoSansJP',       // 일본어
  'zh': 'NotoSansSC',       // 중국어 간체
  'default': 'NotoSansKR'   // 기본값
};

/**
 * 언어별 폰트 선택
 * @param {String} language - 언어 코드
 * @returns {String} 폰트 이름
 */
export const getFontByLanguage = (language = 'ko') => {
  return fontMapping[language] || fontMapping.default;
};

// 내보내기
export default {
  loadNotoSansKR,
  loadLocalFont,
  getDefaultFont,
  getFontStyle,
  getFont,
  preloadFonts,
  measureText,
  wrapText,
  validateFont,
  fontMapping,
  getFontByLanguage
};