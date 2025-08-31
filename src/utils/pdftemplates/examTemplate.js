/**
 * 시험지 PDF 템플릿 모음
 * PDFMe 라이브러리용 템플릿 정의
 */

import { BLANK_PDF } from '@pdfme/common';

// HTML 태그 제거 헬퍼 함수
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// 페이지별 문항 수 설정 (기본값) - 이미지를 위해 공간 늘림
const DEFAULT_QUESTIONS_PER_FIRST_PAGE = 3;  // 첫 페이지는 헤더가 있어서 3개
const DEFAULT_QUESTIONS_PER_PAGE = 4;  // 다음 페이지는 4개
const QUESTION_HEIGHT = 65;  // 문항당 높이 늘림

// 페이지당 문제 수 옵션 - 이미지 공간 고려
export const LAYOUT_OPTIONS = {
  STANDARD: { firstPage: 3, otherPages: 4 },  // 표준 레이아웃
  HALF_PAGE: { firstPage: 2, otherPages: 2 },  // 반페이지 레이아웃
  SINGLE: { firstPage: 1, otherPages: 1 },     // 한 페이지 한 문제
  COMPACT: { firstPage: 5, otherPages: 6 }     // 압축 레이아웃
};

/**
 * 첫 페이지 스키마 생성 (헤더 포함)
 * @param {number} questionsPerPage - 페이지당 문제 수
 */
export const createFirstPageSchema = (questionsPerPage = DEFAULT_QUESTIONS_PER_FIRST_PAGE) => {
  const schema = [
    // 시험지 제목
    {
      name: 'examTitle',
      type: 'text',
      position: { x: 30, y: 15 },
      width: 150,
      height: 12,
      alignment: 'center',
      fontSize: 20,
      fontName: 'NotoSansKR',
      fontWeight: '700'
    },
    // 부제목
    {
      name: 'examSubtitle',
      type: 'text',
      position: { x: 30, y: 30 },
      width: 150,
      height: 8,
      alignment: 'center',
      fontSize: 14
    },
    // 학교명
    {
      name: 'schoolName',
      type: 'text',
      position: { x: 20, y: 45 },
      width: 60,
      height: 7,
      fontSize: 11
    },
    // 과목/학년
    {
      name: 'gradeInfo',
      type: 'text',
      position: { x: 85, y: 45 },
      width: 50,
      height: 7,
      alignment: 'center',
      fontSize: 11
    },
    // 시험 날짜
    {
      name: 'examDate',
      type: 'text',
      position: { x: 140, y: 45 },
      width: 50,
      height: 7,
      alignment: 'right',
      fontSize: 11
    },
    // 학생 정보란
    {
      name: 'studentInfo',
      type: 'text',
      position: { x: 20, y: 55 },
      width: 100,
      height: 8,
      fontSize: 11
    },
    // 점수란
    {
      name: 'scoreBox',
      type: 'text',
      position: { x: 125, y: 55 },
      width: 65,
      height: 8,
      alignment: 'right',
      fontSize: 11
    },
    // 출제자 정보
    {
      name: 'teacherName',
      type: 'text',
      position: { x: 20, y: 65 },
      width: 80,
      height: 7,
      fontSize: 10
    },
    // 총 문항수/시간
    {
      name: 'examInfo',
      type: 'text',
      position: { x: 105, y: 65 },
      width: 85,
      height: 7,
      alignment: 'right',
      fontSize: 10
    },
    // 페이지 번호
    {
      name: 'pageNumber',
      type: 'text',
      position: { x: 95, y: 285 },
      width: 20,
      height: 6,
      alignment: 'center',
      fontSize: 10
    }
  ];

  // 첫 페이지 문항 추가
  for (let i = 0; i < questionsPerPage; i++) {
    const questionNum = i + 1;
    const yPos = 85 + (QUESTION_HEIGHT * i);
    
    // 문제 번호
    schema.push({
      name: `questionNumber${questionNum}`,
      type: 'text',
      position: { x: 20, y: yPos },
      width: 15,
      height: 8,
      fontSize: 11,
      fontWeight: 'bold'
    });
    
    // 문제 이미지 (HTML 변환된 이미지 또는 원본 이미지)
    schema.push({
      name: `questionImage${questionNum}`,
      type: 'image',
      position: { x: 20, y: yPos },
      width: 170,
      height: 50,
      fit: 'contain'  // 이미지가 잘리지 않도록
    });
    
    // 문제 텍스트
    schema.push({
      name: `questionText${questionNum}`,
      type: 'text',
      position: { x: 38, y: yPos },
      width: 152,
      height: 20,
      fontSize: 11
    });
    
    // 보기
    schema.push({
      name: `choices${questionNum}`,
      type: 'text',
      position: { x: 38, y: yPos + 22 },
      width: 152,
      height: 25,
      fontSize: 10
    });
  }

  return schema;
};

/**
 * 일반 페이지 스키마 생성 (2페이지부터)
 * @param {number} startQuestionNum - 시작 문제 번호
 * @param {number} questionsPerPage - 페이지당 문제 수
 */
export const createNormalPageSchema = (startQuestionNum, questionsPerPage = DEFAULT_QUESTIONS_PER_PAGE) => {
  const schema = [
    // 페이지 번호
    {
      name: 'pageNumber',
      type: 'text',
      position: { x: 95, y: 285 },
      width: 20,
      height: 6,
      alignment: 'center',
      fontSize: 10
    }
  ];

  // 문항 추가
  for (let i = 0; i < questionsPerPage; i++) {
    const questionNum = startQuestionNum + i;
    const yPos = 25 + (QUESTION_HEIGHT * i);
    
    // 문제 번호
    schema.push({
      name: `questionNumber${questionNum}`,
      type: 'text',
      position: { x: 20, y: yPos },
      width: 15,
      height: 8,
      fontSize: 11,
      fontWeight: 'bold'
    });
    
    // 문제 이미지 (HTML 변환된 이미지 또는 원본 이미지)
    schema.push({
      name: `questionImage${questionNum}`,
      type: 'image',
      position: { x: 20, y: yPos },
      width: 170,
      height: 50,
      fit: 'contain'  // 이미지가 잘리지 않도록
    });
    
    // 문제 텍스트
    schema.push({
      name: `questionText${questionNum}`,
      type: 'text',
      position: { x: 38, y: yPos },
      width: 152,
      height: 20,
      fontSize: 11
    });
    
    // 보기
    schema.push({
      name: `choices${questionNum}`,
      type: 'text',
      position: { x: 38, y: yPos + 22 },
      width: 152,
      height: 25,
      fontSize: 10
    });
  }

  return schema;
};

/**
 * 정답 표시 스키마 추가
 */
export const addAnswerFields = (schema, startNum, count, startY) => {
  const newSchema = [...schema];
  
  for (let i = 0; i < count; i++) {
    const questionNum = startNum + i;
    const yPos = startY + (QUESTION_HEIGHT * i);
    
    newSchema.push({
      name: `answer${questionNum}`,
      type: 'text',
      position: { x: 165, y: yPos },
      width: 25,
      height: 8,
      fontSize: 11,
      fontWeight: 'bold',
      fontColor: '#FF0000',
      alignment: 'center'
    });
  }
  
  return newSchema;
};

/**
 * 전체 시험지 템플릿 생성
 * @param {number} totalQuestions - 총 문제 수
 * @param {boolean} includeAnswer - 정답 포함 여부
 * @param {string} layoutType - 레이아웃 타입 (STANDARD, HALF_PAGE, SINGLE, COMPACT)
 */
export const generateCompleteExamTemplate = (totalQuestions, includeAnswer = false, layoutType = 'STANDARD') => {
  const layout = LAYOUT_OPTIONS[layoutType] || LAYOUT_OPTIONS.STANDARD;
  const questionsPerFirstPage = layout.firstPage;
  const questionsPerPage = layout.otherPages;
  
  const schemas = [];
  let currentQuestion = 1;
  let pageNum = 1;
  
  // 첫 페이지
  let firstPageSchema = createFirstPageSchema(questionsPerFirstPage);
  
  if (includeAnswer) {
    firstPageSchema = addAnswerFields(firstPageSchema, 1, questionsPerFirstPage, 85);
  }
  
  schemas.push(firstPageSchema);
  currentQuestion = questionsPerFirstPage + 1;
  pageNum++;
  
  // 나머지 페이지들
  while (currentQuestion <= totalQuestions) {
    const remainingQuestions = totalQuestions - currentQuestion + 1;
    const questionsToAdd = Math.min(questionsPerPage, remainingQuestions);
    
    let pageSchema = createNormalPageSchema(currentQuestion, questionsPerPage);
    
    if (includeAnswer) {
      pageSchema = addAnswerFields(pageSchema, currentQuestion, questionsToAdd, 25);
    }
    
    schemas.push(pageSchema);
    currentQuestion += questionsToAdd;
    pageNum++;
  }
  
  return {
    basePdf: BLANK_PDF,
    schemas: schemas
  };
};

/**
 * 입력 데이터 생성 - HTML 이미지 지원
 * @param {Object} examData - 시험 정보
 * @param {Array} questions - 문제 목록
 * @param {string} layoutType - 레이아웃 타입
 */
export const generateInputData = (examData, questions, layoutType = 'STANDARD') => {
  const layout = LAYOUT_OPTIONS[layoutType] || LAYOUT_OPTIONS.STANDARD;
  const questionsPerFirstPage = layout.firstPage;
  const questionsPerPage = layout.otherPages;
  
  const inputs = [];
  let currentQuestion = 1;
  let pageNum = 1;
  
  // 첫 페이지 데이터
  const firstPageInput = {
    examTitle: examData.title || '2024학년도 1학기 중간고사',
    examSubtitle: examData.subtitle || '수학 평가',
    schoolName: examData.schoolName || '○○중학교',
    gradeInfo: `${examData.grade || '2'}학년 ${examData.subject || '수학'}`,
    examDate: examData.date || '2024년 4월 15일',
    studentInfo: '반: ____ 번호: ____ 이름: __________',
    scoreBox: '점수: _____ / 100',
    teacherName: `출제: ${examData.teacherName || ''}`,
    examInfo: `총 ${questions.length}문항 | ${examData.timeLimit || 50}분`,
    pageNumber: '1'
  };
  
  // 첫 페이지 문항 추가
  for (let i = 0; i < questionsPerFirstPage && currentQuestion <= questions.length; i++) {
    const q = questions[currentQuestion - 1];
    const qNum = currentQuestion;
    
    firstPageInput[`questionNumber${qNum}`] = `${qNum}.`;
    
    // 이미지로 변환된 경우 (수식 등)
    if (q.renderedImageUrl) {
      firstPageInput[`questionImage${qNum}`] = q.renderedImageUrl;
    } 
    // 기존 이미지가 있는 경우
    else if (q.questionImageUrl) {
      firstPageInput[`questionImage${qNum}`] = q.questionImageUrl;
    }
    // 텍스트 문제 (지문 포함)
    else {
      let fullText = '';
      
      // 지문이 있는 경우
      if (q.isFirstInPassage && (q.passageText || q.passageHtml)) {
        const passageText = q.passageText || stripHtml(q.passageHtml || '');
        fullText += `【지문】\n${passageText}\n\n`;
      }
      
      // 문제 텍스트
      const questionText = q.questionText || stripHtml(q.questionHtml || '');
      fullText += questionText;
      
      firstPageInput[`questionText${qNum}`] = fullText;
      
      // 보기
      if (q.choices && q.choices.length > 0) {
        firstPageInput[`choices${qNum}`] = formatChoices(q.choices);
      }
    }
    
    if (examData.includeAnswer) {
      firstPageInput[`answer${qNum}`] = `정답: ${q.answer}`;
    }
    
    currentQuestion++;
  }
  
  inputs.push(firstPageInput);
  pageNum++;
  
  // 나머지 페이지들
  while (currentQuestion <= questions.length) {
    const pageInput = {
      pageNumber: pageNum.toString()
    };
    
    for (let i = 0; i < questionsPerPage && currentQuestion <= questions.length; i++) {
      const q = questions[currentQuestion - 1];
      const qNum = currentQuestion;
      
      pageInput[`questionNumber${qNum}`] = `${qNum}.`;
      
      // 이미지로 변환된 경우 (수식 등)
      if (q.renderedImageUrl) {
        pageInput[`questionImage${qNum}`] = q.renderedImageUrl;
      } 
      // 기존 이미지가 있는 경우
      else if (q.questionImageUrl) {
        pageInput[`questionImage${qNum}`] = q.questionImageUrl;
      }
      // 텍스트 문제 (지문 포함)
      else {
        let fullText = '';
        
        // 지문이 있는 경우
        if (q.isFirstInPassage && (q.passageText || q.passageHtml)) {
          const passageText = q.passageText || stripHtml(q.passageHtml || '');
          fullText += `【지문】\n${passageText}\n\n`;
        }
        
        // 문제 텍스트
        const questionText = q.questionText || stripHtml(q.questionHtml || '');
        fullText += questionText;
        
        pageInput[`questionText${qNum}`] = fullText;
        
        // 보기
        if (q.choices && q.choices.length > 0) {
          pageInput[`choices${qNum}`] = formatChoices(q.choices);
        }
      }
      
      if (examData.includeAnswer) {
        pageInput[`answer${qNum}`] = `정답: ${q.answer}`;
      }
      
      currentQuestion++;
    }
    
    inputs.push(pageInput);
    pageNum++;
  }
  
  return inputs;
};

/**
 * 보기 포맷팅 함수 - HTML 지원
 */
function formatChoices(choices) {
  if (!choices || choices.length === 0) return '';
  
  return choices.map((choice, index) => {
    const num = ['①', '②', '③', '④', '⑤'][index];
    // choice가 객체인 경우 (HTML 포함)
    if (typeof choice === 'object' && choice !== null) {
      return `${num} ${choice.text || ''}`;
    }
    // choice가 문자열인 경우
    return `${num} ${choice}`;
  }).join('\n');
}

/**
 * 템플릿 타입별 생성 헬퍼
 * @param {string} type - 템플릿 타입 (basic, withAnswer)
 * @param {number} totalQuestions - 총 문제 수
 * @param {string} layoutType - 레이아웃 타입 (STANDARD, HALF_PAGE, SINGLE, COMPACT)
 */
export const createExamTemplate = (type = 'basic', totalQuestions = 20, layoutType = 'STANDARD') => {
  switch (type) {
    case 'basic':
      return generateCompleteExamTemplate(totalQuestions, false, layoutType);
    case 'withAnswer':
      return generateCompleteExamTemplate(totalQuestions, true, layoutType);
    default:
      return generateCompleteExamTemplate(totalQuestions, false, layoutType);
  }
};