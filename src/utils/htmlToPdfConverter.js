/**
 * HTML 콘텐츠를 PDF용 이미지로 변환하는 유틸리티
 * MathJax 및 KaTeX 수식 렌더링 지원
 */

import html2canvas from 'html2canvas';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// MathJax 전역 설정
if (typeof window !== 'undefined' && !window.MathJax) {
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process'
    },
    startup: {
      pageReady: () => {
        return window.MathJax.startup.defaultPageReady();
      }
    }
  };
}

/**
 * MathJax 스크립트 동적 로드
 */
const loadMathJax = async () => {
  if (window.MathJax && window.MathJax.typesetPromise) {
    return; // 이미 로드됨
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.onload = () => {
      // MathJax 로드 완료 대기
      setTimeout(resolve, 500);
    };
    document.head.appendChild(script);
  });
};

/**
 * HTML 콘텐츠를 이미지 데이터 URL로 변환
 * @param {string} htmlContent - 변환할 HTML 콘텐츠
 * @param {Object} options - 변환 옵션
 * @returns {Promise<string>} 이미지 데이터 URL
 */
export const renderHtmlToImage = async (htmlContent, options = {}) => {
  if (!htmlContent) return null;

  const {
    width = 720,
    padding = 20,
    backgroundColor = '#ffffff',
    fontSize = '16px',
    useMathJax = true // MathJax 사용 여부
  } = options;

  try {
    // MathJax 로드 (필요한 경우)
    if (useMathJax) {
      await loadMathJax();
    }

    // 임시 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'tex2jax_process'; // MathJax 처리 클래스
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: ${width}px;
      padding: ${padding}px;
      background-color: ${backgroundColor};
      font-size: ${fontSize};
      font-family: 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      line-height: 1.6;
    `;
    
    // HTML 콘텐츠 설정
    container.innerHTML = htmlContent;
    
    // DOM에 추가
    document.body.appendChild(container);
    
    // MathJax 렌더링 (있는 경우)
    if (useMathJax && window.MathJax && window.MathJax.typesetPromise) {
      try {
        await window.MathJax.typesetPromise([container]);
        // 렌더링 완료 대기
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (mathJaxError) {
        console.warn('MathJax 렌더링 경고:', mathJaxError);
      }
    }
    
    // KaTeX 렌더링 (MathJax로 처리되지 않은 수식)
    await renderMathInElement(container);
    
    // 렌더링 완료 대기
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // HTML을 캔버스로 변환
    const canvas = await html2canvas(container, {
      backgroundColor: backgroundColor,
      scale: 2, // 고해상도를 위해 2배 스케일
      logging: false,
      useCORS: true, // 외부 이미지 CORS 처리
      allowTaint: true,
      onclone: (clonedDoc) => {
        // 클론된 문서에서 MathJax 스타일 유지
        const mathElements = clonedDoc.querySelectorAll('.MathJax, .MathJax_Display, mjx-container');
        mathElements.forEach(elem => {
          elem.style.position = 'relative';
          elem.style.display = 'inline-block';
        });
      }
    });
    
    // 정리
    document.body.removeChild(container);
    
    // 이미지 데이터 URL로 변환
    return canvas.toDataURL('image/png');
    
  } catch (error) {
    console.error('HTML to Image 변환 실패:', error);
    return null;
  }
};

/**
 * 엘리먼트 내의 수식을 KaTeX로 렌더링
 * @param {HTMLElement} element - 수식을 포함한 엘리먼트
 */
const renderMathInElement = async (element) => {
  // LaTeX 수식 패턴 찾기
  const mathPatterns = [
    { pattern: /\$\$(.*?)\$\$/gs, display: true },  // Display 수식
    { pattern: /\$(.*?)\$/g, display: false },      // Inline 수식
    { pattern: /\\\[(.*?)\\\]/gs, display: true },  // Display 수식 (대체 문법)
    { pattern: /\\\((.*?)\\\)/g, display: false }   // Inline 수식 (대체 문법)
  ];
  
  // 수식 클래스를 가진 엘리먼트 찾기
  const mathElements = element.querySelectorAll('.math, .katex, .latex');
  
  for (const elem of mathElements) {
    try {
      const mathText = elem.textContent || elem.innerText;
      katex.render(mathText, elem, {
        throwOnError: false,
        displayMode: elem.classList.contains('display')
      });
    } catch (error) {
      console.warn('수식 렌더링 실패:', error);
    }
  }
  
  // 텍스트 노드에서 수식 패턴 찾아 렌더링
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  for (const textNode of textNodes) {
    let text = textNode.textContent;
    let hasMatch = false;
    
    for (const { pattern, display } of mathPatterns) {
      if (pattern.test(text)) {
        hasMatch = true;
        break;
      }
    }
    
    if (hasMatch) {
      const span = document.createElement('span');
      span.innerHTML = text.replace(/\$\$(.*?)\$\$/gs, (match, math) => {
        const mathSpan = document.createElement('span');
        try {
          katex.render(math, mathSpan, { displayMode: true, throwOnError: false });
          return mathSpan.outerHTML;
        } catch {
          return match;
        }
      }).replace(/\$(.*?)\$/g, (match, math) => {
        const mathSpan = document.createElement('span');
        try {
          katex.render(math, mathSpan, { displayMode: false, throwOnError: false });
          return mathSpan.outerHTML;
        } catch {
          return match;
        }
      });
      
      textNode.parentNode.replaceChild(span, textNode);
    }
  }
};

/**
 * 여러 HTML 콘텐츠를 일괄 변환
 * @param {Array<string>} htmlContents - HTML 콘텐츠 배열
 * @param {Object} options - 변환 옵션
 * @returns {Promise<Array<string>>} 이미지 데이터 URL 배열
 */
export const batchRenderHtmlToImages = async (htmlContents, options = {}) => {
  const results = [];
  
  for (const content of htmlContents) {
    const imageUrl = await renderHtmlToImage(content, options);
    results.push(imageUrl);
  }
  
  return results;
};

/**
 * 문항 HTML을 PDF용 포맷으로 변환
 * @param {Object} question - 문항 객체
 * @returns {Promise<Object>} 변환된 문항 객체
 */
export const convertQuestionToImage = async (question) => {
  console.log('convertQuestionToImage 시작:', {
    id: question.id,
    hasPassage: !!question.passageHtml || !!question.passageText,
    hasHtml: !!question.questionHtml,
    hasText: !!question.questionText,
    choicesCount: question.choices?.length || 0
  });
  
  // 지문과 문제 내용이 모두 없는 경우
  if (!question.passageHtml && !question.passageText && !question.questionHtml && !question.questionText && (!question.choices || question.choices.length === 0)) {
    console.log('변환할 콘텐츠 없음');
    return question;
  }
  
  // HTML 콘텐츠 구성
  let htmlContent = '<div class="question-wrapper">';
  
  // 지문이 있는 경우
  if (question.passageHtml || question.passageText) {
    htmlContent += '<div class="passage-section">';
    htmlContent += '<div class="passage-label">【지문】</div>';
    if (question.passageHtml) {
      htmlContent += `<div class="passage-content tex2jax_process">${question.passageHtml}</div>`;
    } else if (question.passageText) {
      htmlContent += `<div class="passage-content">${question.passageText}</div>`;
    }
    htmlContent += '</div>';
  }
  
  // 문제 내용
  if (question.questionHtml || question.questionText) {
    htmlContent += '<div class="question-section">';
    if (question.passageHtml || question.passageText) {
      htmlContent += `<div class="question-label">【문제 ${question.questionNumber || ''}】</div>`;
    }
    if (question.questionHtml) {
      htmlContent += `<div class="question-text tex2jax_process">${question.questionHtml}</div>`;
    } else if (question.questionText) {
      htmlContent += `<div class="question-text">${question.questionText}</div>`;
    }
    htmlContent += '</div>';
  }
  
  // 보기가 있는 경우
  if (question.choices && question.choices.length > 0) {
    htmlContent += '<div class="choices">';
    question.choices.forEach((choice, index) => {
      const label = ['①', '②', '③', '④', '⑤'][index];
      if (typeof choice === 'object' && choice !== null) {
        if (choice.html) {
          htmlContent += `<div class="choice-item tex2jax_process">${label} ${choice.html}</div>`;
        } else if (choice.text) {
          htmlContent += `<div class="choice-item">${label} ${choice.text}</div>`;
        }
      } else if (typeof choice === 'string') {
        htmlContent += `<div class="choice-item">${label} ${choice}</div>`;
      }
    });
    htmlContent += '</div>';
  }
  
  htmlContent += '</div>';
  
  // 스타일 추가 - 더 크고 선명한 폰트
  const styledContent = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
      
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .question-wrapper {
        font-family: 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
        line-height: 2;
        color: #000;
        background: white;
        font-weight: 400;
      }
      
      .passage-section {
        margin-bottom: 25px;
        padding: 20px;
        background-color: #f0f8f0;
        border-left: 5px solid #4CAF50;
        border-radius: 4px;
      }
      
      .passage-label {
        font-weight: 700;
        font-size: 18px;
        color: #2e7d32;
        margin-bottom: 12px;
      }
      
      .passage-content {
        font-size: 16px;
        line-height: 2;
        color: #222;
        font-weight: 400;
      }
      
      .passage-content p {
        margin: 8px 0;
      }
      
      .question-section {
        margin-bottom: 20px;
      }
      
      .question-label {
        font-weight: 700;
        font-size: 18px;
        color: #1976d2;
        margin-bottom: 10px;
      }
      
      .question-text {
        margin-bottom: 20px;
        font-size: 17px;
        line-height: 2;
        color: #111;
        font-weight: 400;
      }
      
      .choices {
        margin-left: 15px;
      }
      
      .choice-item {
        margin: 12px 0;
        font-size: 16px;
        line-height: 1.8;
        color: #222;
        font-weight: 400;
      }
      
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 15px 0;
      }
      
      table {
        border-collapse: collapse;
        margin: 15px 0;
        width: 100%;
      }
      
      table td, table th {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
        font-size: 15px;
      }
      
      /* MathJax 스타일 */
      .MathJax, .MathJax_Display, mjx-container {
        margin: 8px 0 !important;
        font-size: 110% !important;
      }
      
      /* 숫자와 특수문자 강조 */
      .choice-item:first-child { margin-top: 5px; }
      .choice-item:last-child { margin-bottom: 5px; }
    </style>
    ${htmlContent}
  `;
  
  console.log('HTML 콘텐츠 생성 완료, 이미지 변환 시작...');
  
  // 이미지로 변환 - A4 크기에 맞게 조정 (210mm = 794px at 96dpi)
  const imageUrl = await renderHtmlToImage(styledContent, {
    width: 720,  // A4 width minus margins (794 - 74 for margins)
    padding: 20,
    backgroundColor: '#ffffff',
    fontSize: '16px',  // 더 큰 폰트 사이즈
    useMathJax: true
  });
  
  console.log('이미지 변환 완료:', !!imageUrl);
  
  return {
    ...question,
    renderedImageUrl: imageUrl,
    hasHtmlContent: true
  };
};

export default {
  renderHtmlToImage,
  batchRenderHtmlToImages,
  convertQuestionToImage
};