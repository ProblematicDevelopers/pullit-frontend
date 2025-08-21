/**
 * 스키마에 폰트 추가 유틸리티
 * 모든 텍스트 필드에 한글 폰트 적용
 */

/**
 * 스키마 배열의 모든 텍스트 요소에 폰트 추가
 * @param {Array} schemas - PDFMe 스키마 배열
 * @param {String} fontName - 적용할 폰트 이름
 * @returns {Array} 폰트가 적용된 스키마
 */
export const addFontToSchemas = (schemas, fontName = 'NotoSansKR') => {
  return schemas.map(schema => {
    // 단일 스키마인 경우
    if (Array.isArray(schema)) {
      return schema.map(field => addFontToField(field, fontName));
    }
    // 페이지별 스키마 배열인 경우
    return addFontToField(schema, fontName);
  });
};

/**
 * 개별 필드에 폰트 추가
 * @param {Object} field - 스키마 필드
 * @param {String} fontName - 폰트 이름
 * @returns {Object} 폰트가 적용된 필드
 */
const addFontToField = (field, fontName) => {
  // text 타입인 경우에만 폰트 추가
  if (field.type === 'text' && !field.fontName) {
    return {
      ...field,
      fontName: fontName
    };
  }
  return field;
};

/**
 * 템플릿의 모든 페이지에 폰트 적용
 * @param {Object} template - PDFMe 템플릿
 * @param {String} fontName - 폰트 이름
 * @returns {Object} 폰트가 적용된 템플릿
 */
export const applyFontToTemplate = (template, fontName = 'NotoSansKR') => {
  return {
    ...template,
    schemas: addFontToSchemas(template.schemas, fontName)
  };
};

export default {
  addFontToSchemas,
  applyFontToTemplate
};