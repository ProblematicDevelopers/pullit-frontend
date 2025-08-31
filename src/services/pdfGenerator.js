/**
 * PDF 생성 서비스
 * PDFMe를 사용한 시험지 PDF 생성 로직
 */

import { generate } from '@pdfme/generator';
import { text, image } from '@pdfme/schemas';
import { createExamTemplate, generateInputData } from '@/utils/pdftemplates/examTemplate';
import { getPDFMeFont } from '@/utils/pdfmeFonts';
import { applyFontToTemplate } from '@/utils/pdftemplates/addFont';
import { convertQuestionToImage } from '@/utils/htmlToPdfConverter';

/**
 * 시험지 PDF 생성 메인 함수
 * @param {Object} examData - 시험 정보
 * @param {Array} questions - 문항 목록
 * @param {String} type - 템플릿 타입 ('basic', 'withAnswer', 'withExplanation')
 * @param {String} layoutType - 레이아웃 타입 ('STANDARD', 'HALF_PAGE', 'SINGLE', 'COMPACT')
 * @returns {Promise<Blob>} PDF Blob 객체
 */
export const generateExamPDF = async (examData, questions, type = 'basic', layoutType = 'STANDARD') => {
  try {
    console.log('PDF 생성 시작:', { examData, questionsCount: questions.length, type, layoutType });
    
    // 1. 템플릿 생성 (레이아웃 옵션 포함)
    const baseTemplate = createExamTemplate(type, questions.length, layoutType);
    
    // 2. 템플릿에 폰트 적용
    const template = applyFontToTemplate(baseTemplate, 'NotoSansKR');
    
    // 3. 한글 폰트 로드
    const font = await getPDFMeFont();
    
    // 4. 입력 데이터 생성 (레이아웃 옵션 포함)
    const inputs = generateInputData(examData, questions, layoutType);
    
    // 5. PDF 생성
    console.log('템플릿:', template);
    console.log('입력 데이터:', inputs);
    console.log('폰트:', font);
    
    const pdf = await generate({
      template: template,
      inputs: inputs,
      plugins: {
        text,
        image
      },
      options: {
        font: font  // options 객체 안에 font 속성으로 전달
      }
    });
    
    // 6. Blob 변환
    const blob = new Blob([pdf.buffer || pdf], { 
      type: 'application/pdf' 
    });
    
    console.log('PDF 생성 완료:', blob.size, 'bytes');
    
    return blob;
    
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    throw new Error(`PDF 생성 중 오류 발생: ${error.message}`);
  }
};

/**
 * PDF 다운로드 함수
 * @param {Blob} pdfBlob - PDF Blob 객체
 * @param {String} filename - 다운로드 파일명
 */
export const downloadPDF = (pdfBlob, filename = 'exam.pdf') => {
  try {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 정리
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log('PDF 다운로드 완료:', filename);
  } catch (error) {
    console.error('PDF 다운로드 실패:', error);
    throw error;
  }
};

/**
 * PDF 미리보기 창 열기
 * @param {Blob} pdfBlob - PDF Blob 객체
 */
export const previewPDF = (pdfBlob) => {
  try {
    const url = URL.createObjectURL(pdfBlob);
    const win = window.open(url, '_blank');
    
    if (!win) {
      alert('팝업 차단을 해제해주세요.');
      return;
    }
    
    // 일정 시간 후 URL 해제
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000); // 1분 후
    
  } catch (error) {
    console.error('PDF 미리보기 실패:', error);
    throw error;
  }
};

/**
 * 문항 데이터 변환 함수 - HTML 콘텐츠 보존 버전
 * 백엔드 데이터를 PDF 생성용 형식으로 변환
 * @param {Array} items - 백엔드에서 받은 문항 데이터
 * @param {boolean} preserveHtml - HTML 보존 여부
 * @returns {Array} 변환된 문항 데이터
 */
export const transformQuestions = (items, preserveHtml = true) => {
  return items.map((item, index) => {
    // HTML 태그 제거 함수 (필요시 사용)
    const stripHtml = (html) => {
      if (!html) return '';
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };
    
    // 보기 처리 - HTML 보존
    const parseChoices = (item) => {
      const choices = [];
      
      // HTML 보기 우선 처리
      if (item.choice1Html || item.choice1Text || item.choice1) {
        choices.push({
          html: item.choice1Html,
          text: item.choice1Text || item.choice1 || stripHtml(item.choice1Html)
        });
      }
      if (item.choice2Html || item.choice2Text || item.choice2) {
        choices.push({
          html: item.choice2Html,
          text: item.choice2Text || item.choice2 || stripHtml(item.choice2Html)
        });
      }
      if (item.choice3Html || item.choice3Text || item.choice3) {
        choices.push({
          html: item.choice3Html,
          text: item.choice3Text || item.choice3 || stripHtml(item.choice3Html)
        });
      }
      if (item.choice4Html || item.choice4Text || item.choice4) {
        choices.push({
          html: item.choice4Html,
          text: item.choice4Text || item.choice4 || stripHtml(item.choice4Html)
        });
      }
      if (item.choice5Html || item.choice5Text || item.choice5) {
        choices.push({
          html: item.choice5Html,
          text: item.choice5Text || item.choice5 || stripHtml(item.choice5Html)
        });
      }
      
      // 빈 보기 제거
      return choices.filter(c => c.html || c.text);
    };
    
    // HTML 콘텐츠 여부 확인 (지문 포함)
    const hasHtmlContent = !!(
      item.questionHtml || 
      item.passageHtml ||
      item.choice1Html || 
      item.choice2Html || 
      item.choice3Html || 
      item.choice4Html || 
      item.choice5Html
    );
    
    // 문제 텍스트 처리
    let questionText = '';
    if (item.questionText) {
      questionText = item.questionText;
    } else if (item.questionHtml && !preserveHtml) {
      // HTML 제거가 필요한 경우만 stripHtml 사용
      questionText = stripHtml(item.questionHtml);
    }
    
    return {
      id: item.itemId || item.id || `q${index + 1}`,
      questionNumber: index + 1,
      globalIndex: index,
      
      // 지문 데이터 추가
      passageId: item.passageId || null,
      passageHtml: preserveHtml ? item.passageHtml : null,
      passageText: item.passageText || (item.passageHtml && !preserveHtml ? stripHtml(item.passageHtml) : ''),
      passageImage: item.passageImage || '',
      
      // HTML과 텍스트 모두 보존
      questionHtml: preserveHtml ? item.questionHtml : null,
      questionText: questionText,
      questionImageUrl: item.questionImageUrl || item.imageUrl || '',
      
      // 보기 (HTML 포함)
      choices: parseChoices(item),
      
      // 메타 정보
      answer: item.answer || item.correctAnswer || '',
      explanation: item.explanation || item.commentary || '',
      points: item.points || 5,
      difficulty: item.difficulty,
      questionForm: item.questionForm,
      chapterName: item.chapterName || item.topicChapter || '',
      
      // HTML 렌더링 플래그
      hasHtmlContent: preserveHtml && hasHtmlContent,
      needsImageConversion: preserveHtml && hasHtmlContent
    };
  });
};

/**
 * 지문별로 문항 그룹화
 * @param {Array} questions - 문항 목록
 * @returns {Array} 그룹화된 문항 목록
 */
export const groupQuestionsByPassage = (questions) => {
  const passageGroups = new Map();
  const individualQuestions = [];
  
  questions.forEach(question => {
    if (question.passageId) {
      if (!passageGroups.has(question.passageId)) {
        passageGroups.set(question.passageId, {
          passageId: question.passageId,
          passageHtml: question.passageHtml,
          passageText: question.passageText,
          passageImage: question.passageImage,
          questions: []
        });
      }
      passageGroups.get(question.passageId).questions.push(question);
    } else {
      individualQuestions.push(question);
    }
  });
  
  // 그룹화된 문항을 순서대로 재배열
  const groupedQuestions = [];
  
  // 지문이 있는 문항들을 먼저 추가
  passageGroups.forEach(group => {
    // 첫 번째 문항에 지문 정보 포함
    if (group.questions.length > 0) {
      group.questions[0].isFirstInPassage = true;
      group.questions[0].passageQuestionCount = group.questions.length;
    }
    groupedQuestions.push(...group.questions);
  });
  
  // 개별 문항들 추가
  groupedQuestions.push(...individualQuestions);
  
  // 문항 번호 재정렬
  groupedQuestions.forEach((question, index) => {
    question.questionNumber = index + 1;
    question.globalIndex = index;
  });
  
  return groupedQuestions;
};

/**
 * HTML 콘텐츠를 이미지로 변환하여 PDF 생성
 * @param {Array} questions - 문항 목록
 * @returns {Promise<Array>} 이미지 변환된 문항 목록
 */
export const prepareQuestionsForPdf = async (questions) => {
  console.log('prepareQuestionsForPdf 시작:', questions.length, '문항');
  
  // 지문별로 그룹화
  const groupedQuestions = groupQuestionsByPassage(questions);
  const preparedQuestions = [];
  
  // 수식이나 복잡한 HTML 감지 함수
  const hasMath = (html) => {
    if (!html) return false;
    return html.includes('$') || 
           html.includes('\\(') || 
           html.includes('\\[') || 
           html.includes('MathJax') ||
           html.includes('katex') ||
           html.includes('<math') ||
           html.includes('\\frac') ||
           html.includes('\\sum');
  };
  
  const hasComplexHtml = (html) => {
    if (!html) return false;
    return html.includes('<table') || 
           html.includes('<img') ||
           html.includes('<svg') ||
           html.includes('<canvas');
  };
  
  for (let i = 0; i < groupedQuestions.length; i++) {
    const question = groupedQuestions[i];
    
    // 수식이나 복잡한 HTML이 포함된 경우만 이미지 변환
    const needsImageConversion = 
      hasMath(question.questionHtml) || 
      hasMath(question.passageHtml) ||
      hasComplexHtml(question.questionHtml) ||
      hasComplexHtml(question.passageHtml) ||
      question.choices?.some(c => hasMath(c.html) || hasComplexHtml(c.html));
    
    console.log(`문제 ${i + 1} 처리:`, {
      hasMath: hasMath(question.questionHtml) || hasMath(question.passageHtml),
      hasComplexHtml: hasComplexHtml(question.questionHtml) || hasComplexHtml(question.passageHtml),
      needsImageConversion: needsImageConversion
    });
    
    if (needsImageConversion) {
      console.log(`문제 ${i + 1}: 수식/복잡한 HTML → 이미지 변환`);
      const convertedQuestion = await convertQuestionToImage(question);
      preparedQuestions.push(convertedQuestion);
    } else {
      console.log(`문제 ${i + 1}: 일반 텍스트 → 직접 사용`);
      preparedQuestions.push(question);
    }
  }
  
  console.log('prepareQuestionsForPdf 완료:', preparedQuestions.length, '문항');
  return preparedQuestions;
};

/**
 * 시험 정보 데이터 변환
 * @param {Object} wizardData - 위자드에서 수집한 데이터
 * @returns {Object} PDF 생성용 시험 정보
 */
export const transformExamData = (wizardData) => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  
  return {
    title: wizardData.title || '시험지',
    subtitle: wizardData.subtitle || '',
    schoolName: wizardData.schoolName || '',
    grade: wizardData.gradeName || '',
    subject: wizardData.subjectName || wizardData.areaName || '',
    date: wizardData.examDate || dateStr,
    teacherName: wizardData.teacherName || '',
    timeLimit: wizardData.timeLimit || 50,
    includeAnswer: wizardData.includeAnswerSheet || false,
    includeExplanation: wizardData.includeExplanation || false,
    shuffleQuestions: wizardData.shuffleQuestions || false,
    showPoints: wizardData.showPoints || true
  };
};

/**
 * 문항 순서 섞기
 * @param {Array} questions - 원본 문항 배열
 * @returns {Array} 섞인 문항 배열
 */
export const shuffleQuestions = (questions) => {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 정답지 별도 생성
 * @param {Object} examData - 시험 정보
 * @param {Array} questions - 문항 목록
 * @returns {Promise<Blob>} 정답지 PDF Blob
 */
export const generateAnswerSheet = async (examData, questions) => {
  const answerData = {
    ...examData,
    title: examData.title + ' - 정답지'
  };
  
  // 정답만 포함된 간단한 형식
  const answerOnlyQuestions = questions.map(q => ({
    ...q,
    questionText: `문제 ${q.questionNumber}`,
    choices: [],
    imageUrl: ''
  }));
  
  return generateExamPDF(answerData, answerOnlyQuestions, 'withAnswer');
};

/**
 * PDF 파일 서버 업로드
 * @param {Blob} pdfBlob - PDF Blob
 * @param {Object} metadata - 메타데이터
 * @returns {Promise<Object>} 업로드 결과
 */
export const uploadPDFToServer = async (pdfBlob, metadata) => {
  try {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, `${metadata.title}.pdf`);
    formData.append('metadata', JSON.stringify(metadata));
    
    // API 호출 (실제 엔드포인트로 변경 필요)
    const response = await fetch('/api/exams/upload-pdf', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('PDF 업로드 실패');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('PDF 업로드 오류:', error);
    throw error;
  }
};

/**
 * 여러 시험지 버전 생성 (기본, 정답, 해설)
 * @param {Object} examData - 시험 정보
 * @param {Array} questions - 문항 목록
 * @returns {Promise<Object>} 생성된 PDF Blob 객체들
 */
export const generateAllVersions = async (examData, questions) => {
  try {
    const results = {};
    
    // 기본 시험지
    results.basic = await generateExamPDF(examData, questions, 'basic');
    
    // 정답 포함 시험지
    if (examData.includeAnswer) {
      results.withAnswer = await generateExamPDF(examData, questions, 'withAnswer');
    }
    
    // 해설 포함 시험지
    if (examData.includeExplanation) {
      results.withExplanation = await generateExamPDF(examData, questions, 'withExplanation');
    }
    
    return results;
    
  } catch (error) {
    console.error('버전별 PDF 생성 실패:', error);
    throw error;
  }
};

// 기본 export
export default {
  generateExamPDF,
  downloadPDF,
  previewPDF,
  transformQuestions,
  transformExamData,
  shuffleQuestions,
  generateAnswerSheet,
  uploadPDFToServer,
  generateAllVersions
};