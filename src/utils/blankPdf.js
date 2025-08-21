/**
 * 빈 PDF 생성 유틸리티
 * PDFMe에서 사용할 빈 A4 PDF 생성
 */

import { PDFDocument, rgb } from 'pdf-lib';

/**
 * 빈 A4 PDF 생성 (Base64)
 * @param {number} pageCount - 생성할 페이지 수
 * @returns {Promise<string>} Base64 인코딩된 PDF
 */
export const createBlankPdf = async (pageCount = 1) => {
  // 새 PDF 문서 생성
  const pdfDoc = await PDFDocument.create();
  
  // A4 사이즈 (595.28 x 841.89 points)
  const width = 595.28;
  const height = 841.89;
  
  // 지정된 수만큼 빈 페이지 추가
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([width, height]);
    
    // 선택적: 페이지에 최소한의 내용 추가 (투명한 점)
    page.drawText(' ', {
      x: 50,
      y: height - 50,
      size: 1,
      color: rgb(1, 1, 1)
    });
  }
  
  // PDF를 Uint8Array로 저장
  const pdfBytes = await pdfDoc.save();
  
  // Base64로 인코딩
  const base64 = btoa(
    new Uint8Array(pdfBytes)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  
  return base64;
};

/**
 * 캐시된 빈 PDF
 */
let cachedBlankPdf = null;

/**
 * 캐시된 빈 PDF 가져오기
 * @returns {Promise<string>} Base64 인코딩된 빈 PDF
 */
export const getBlankPdf = async () => {
  if (!cachedBlankPdf) {
    cachedBlankPdf = await createBlankPdf(1);
  }
  return cachedBlankPdf;
};

/**
 * 여러 페이지 빈 PDF 생성
 * @param {number} pageCount - 페이지 수
 * @returns {Promise<string>} Base64 인코딩된 PDF
 */
export const createMultiPageBlankPdf = async (pageCount) => {
  return await createBlankPdf(pageCount);
};

export default {
  createBlankPdf,
  getBlankPdf,
  createMultiPageBlankPdf
};