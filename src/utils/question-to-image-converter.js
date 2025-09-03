/**
 * Question to Image Converter
 * Step2에서 선택된 문제들을 이미지로 변환하여 Step3로 전달
 * HTML 레이아웃을 그대로 보존하면서 PDF 생성을 단순화
 */

import html2canvas from 'html2canvas'
import api from '@/services/api'

// IMG 태그 정규화: data-src 등 lazy 속성을 src로 승격하고 CORS/스타일 보강
export function normalizeImgTags(html) {
  if (!html || typeof html !== 'string' || html.indexOf('<img') === -1) return html

  return html.replace(/<img([^>]*?)>/gi, (match, attrs) => {
    let newAttrs = attrs || ''

    // src 없으면 data-*에서 채우기
    const hasSrc = /\ssrc\s*=\s*['"][^'"]+['"]/i.test(newAttrs)
    if (!hasSrc) {
      const sources = [
        /\sdata-src\s*=\s*['"]([^'"]+)['"]/i,
        /\sdata-original\s*=\s*['"]([^'"]+)['"]/i,
        /\sdata-lazy-src\s*=\s*['"]([^'"]+)['"]/i
      ]
      for (const re of sources) {
        const m = newAttrs.match(re)
        if (m && m[1]) {
          newAttrs += ` src="${m[1]}"`
          break
        }
      }
      // srcset만 있는 경우 첫 URL을 src로 사용
      if (!/\ssrc\s*=\s*['"][^'"]+['"]/i.test(newAttrs)) {
        const mSrcset = newAttrs.match(/\ssrcset\s*=\s*['"]([^'"]+)['"]/i)
        if (mSrcset && mSrcset[1]) {
          const first = mSrcset[1].split(',')[0].trim().split(' ')[0]
          if (first) {
            newAttrs += ` src="${first}"`
          }
        }
      }
    }

    // loading=lazy 제거 (렌더링 영향 방지)
    newAttrs = newAttrs.replace(/\sloading\s*=\s*['"]lazy['"]/ig, '')

    // crossorigin 추가
    if (!/\scrossorigin\s*=\s*['"][^'"]*['"]/i.test(newAttrs)) {
      newAttrs += ' crossorigin="anonymous"'
    }

    // 스타일 보강
    if (!/\sstyle\s*=\s*['"][^'"]*['"]/i.test(newAttrs)) {
      newAttrs += ' style="max-width:100%; height:auto; display:inline-block; margin:6px 0;"'
    }

    return `<img${newAttrs}>`
  })
}

/**
 * 외부 이미지를 백엔드 프록시를 통해 data URL로 교체 (CORS 회피)
 * @param {HTMLElement} rootEl
 */
export async function replaceExternalImagesWithDataUrls(rootEl) {
  if (!rootEl) return
  const imgs = Array.from(rootEl.querySelectorAll('img'))
  console.log(`[Image Proxy] ${imgs.length}개 이미지 처리 시작`)
  
  for (const img of imgs) {
    try {
      const src = img.getAttribute('src') || ''
      if (!src) {
        console.warn('[Image Proxy] src 속성 없음:', img)
        continue
      }
      if (src.startsWith('data:')) {
        console.log('[Image Proxy] 이미 data URL:', src.substring(0, 50) + '...')
        continue
      }
      
      // URL 파싱 시도
      let urlObj
      try {
        urlObj = new URL(src, window.location.href)
      } catch (urlError) {
        console.error('[Image Proxy] URL 파싱 실패:', src, urlError)
        continue
      }
      
      // 동일 출처는 건너뜀
      if (urlObj.origin === window.location.origin) {
        console.log('[Image Proxy] 동일 출처, 프록시 불필요:', src)
        continue
      }

      console.log('[Image Proxy] 외부 이미지 프록시 요청:', urlObj.href)
      
      // 프록시 요청
      const res = await api.post('/proxy/image', { imageUrl: urlObj.href })
      const dataUrl = res?.data?.base64
      
      if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        console.log('[Image Proxy] 프록시 성공, data URL 길이:', dataUrl.length)
        img.setAttribute('src', dataUrl)
        
        // 로드 대기
        await new Promise((resolve) => {
          const tmp = new Image()
          tmp.onload = () => {
            console.log('[Image Proxy] 이미지 로드 성공')
            resolve()
          }
          tmp.onerror = (error) => {
            console.error('[Image Proxy] 이미지 로드 실패:', error)
            resolve()
          }
          tmp.src = dataUrl
        })
      } else {
        console.error('[Image Proxy] 프록시 응답 데이터 이상:', res?.data)
      }
    } catch (e) {
      console.error('[Image Proxy] 이미지 프록시 교체 실패:', img.src, e)
      // 실패한 경우 원본 URL 유지
    }
  }
  
  console.log('[Image Proxy] 이미지 프록시 처리 완료')
}

/**
 * 단일 문제 요소를 이미지로 변환
 * @param {HTMLElement} element - 변환할 HTML 요소
 * @param {Object} options - 변환 옵션
 * @returns {Promise<Object>} 이미지 데이터 객체
 */
export async function convertQuestionToImage(element, options = {}) {
  // 외부 이미지는 프록시를 통해 data URL로 교체해 CORS 회피
  await replaceExternalImagesWithDataUrls(element)

  // 먼저 모든 이미지가 로드될 때까지 대기
  const images = element.querySelectorAll('img')
  if (images.length > 0) {
    console.log(`이미지 ${images.length}개 로드 대기 중...`)
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve()
      }
      return new Promise((resolve, reject) => {
        const tempImg = new Image()
        tempImg.onload = () => {
          console.log('이미지 로드 완료:', img.src)
          resolve()
        }
        tempImg.onerror = (err) => {
          console.error('이미지 로드 실패:', img.src, err)
          resolve() // 에러가 나도 계속 진행
        }
        tempImg.src = img.src
      })
    }))
  }

  const defaultOptions = {
    scale: 2, // 고해상도를 위한 스케일
    useCORS: true,
    allowTaint: false, // false로 변경하여 CORS 이미지 처리
    backgroundColor: '#ffffff',
    logging: true, // 디버깅을 위해 활성화
    letterRendering: true,
    imageTimeout: 15000, // 이미지 로드 타임아웃 15초
    // width와 height를 자동으로 계산하도록 변경
    windowWidth: 794,
    foreignObjectRendering: false, // false로 변경하여 더 나은 호환성
    removeContainer: false, // 컨테이너 유지
    onclone: async (clonedDoc, clonedElement) => {
      // 클론된 요소 스타일 보정
      if (clonedElement) {
        // 클론된 요소가 화면에 보이도록 설정
        clonedElement.style.position = 'relative'
        clonedElement.style.left = '0'
        clonedElement.style.top = '0'
        clonedElement.style.padding = '20px'
        clonedElement.style.fontFamily = "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif"
        clonedElement.style.fontSize = '16px'  // 12pt는 16px에 해당
        clonedElement.style.lineHeight = '2.0'  // 줄간격도 조금 늘림
        clonedElement.style.width = '794px'
        clonedElement.style.boxSizing = 'border-box'
        clonedElement.style.visibility = 'visible'
        clonedElement.style.opacity = '1'
        clonedElement.style.display = 'block'
        clonedElement.style.background = 'white'

        // 모든 자식 요소들도 visible로 설정
        const allElements = clonedElement.querySelectorAll('*')
        allElements.forEach(el => {
          el.style.visibility = 'visible'
          el.style.opacity = '1'
          // 숨겨진 요소 강제 표시
          if (el.style.display === 'none') {
            el.style.display = 'block'
          }
        })

        // 클론된 요소의 이미지들 처리: 스타일만 보정
        const clonedImages = clonedElement.querySelectorAll('img')
        clonedImages.forEach(img => {
          img.style.maxWidth = '100%'
          img.style.height = 'auto'
          img.style.display = 'inline-block'
        })

        // 잠시 대기하여 이미지 렌더링 확실히 하기
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  try {
    // html2canvas로 변환하기 전, 외부 이미지가 남아있다면 한 번 더 프록시 교체 시도
    console.log('[convertQuestionToImage] 최종 이미지 프록시 처리')
    await replaceExternalImagesWithDataUrls(element)

    // HTML 내용 확인
    console.log('[convertQuestionToImage] 렌더링할 요소:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      hasContent: element.innerHTML.length > 0,
      textContent: element.textContent.substring(0, 100),
      imageCount: element.querySelectorAll('img').length
    })

    // MathJax 렌더링 대기
    if (window.MathJax && element.querySelector('.mathjax-content')) {
      console.log('MathJax 렌더링 시작...')
      await window.MathJax.typesetPromise([element])
      // 렌더링 완료 후 충분한 대기 시간
      await new Promise(resolve => setTimeout(resolve, 300))
      console.log('MathJax 렌더링 완료')
    }

    // 요소가 실제로 렌더링되었는지 확인
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      console.warn('경고: 요소가 렌더링되지 않았습니다. 강제 리플로우 시도...')
      // 강제 리플로우
      element.style.display = 'block'
      element.offsetHeight // 강제 리플로우 트리거
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // html2canvas로 이미지 변환
    console.log('html2canvas 시작...')
    const canvas = await html2canvas(element, { ...defaultOptions, ...options })

    // 캔버스 생성 결과 확인
    console.log('캔버스 생성 완료:', {
      width: canvas.width,
      height: canvas.height,
      isEmpty: canvas.width === 0 || canvas.height === 0
    })

    // 캔버스가 비어있는지 확인
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('경고: 빈 캔버스가 생성되었습니다!')
    }

    const dataUrl = canvas.toDataURL('image/png', 1.0)
    console.log('DataURL 생성:', {
      length: dataUrl.length,
      prefix: dataUrl.substring(0, 50)
    })

    return {
      canvas: canvas,
      dataUrl: dataUrl,
      width: canvas.width,
      height: canvas.height,
      naturalWidth: canvas.width / (defaultOptions.scale || 2),
      naturalHeight: canvas.height / (defaultOptions.scale || 2)
    }
  } catch (error) {
    console.error('이미지 변환 실패:', error)
    throw error
  }
}

/**
 * 여러 문제를 일괄 이미지로 변환
 * 지문은 별도 이미지로, 문제+보기는 하나의 이미지로 렌더링
 * @param {Array} questions - 문제 데이터 배열
 * @param {Function} onProgress - 진행 상황 콜백
 * @returns {Promise<Array>} 이미지 데이터 배열
 */
export async function convertQuestionsToImages(questions, onProgress) {
  console.log('convertQuestionsToImages 시작:', questions)

  const images = []
  const tempContainer = document.createElement('div')
  // html2canvas가 화면 밖 요소를 제대로 캡처하지 못하는 문제 해결
  // position: absolute로 변경하고 화면 내에 위치시키되 z-index로 숨김
  tempContainer.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: 794px;
    opacity: 1;
    z-index: -9999;
    pointer-events: none;
    background: white;
    visibility: visible;
    overflow: visible;
  `
  document.body.appendChild(tempContainer)

  try {
    // 문제들을 그룹으로 분류 (지문이 있는 문제들을 그룹화)
    const groups = groupQuestionsByPassage(questions)
    console.log('그룹화된 문제들:', groups)
    let processedCount = 0
    const totalItems = groups.reduce((sum, g) => sum + (g.passage ? 1 : 0) + g.questions.length, 0)

    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
      const group = groups[groupIdx]

      // 1. 지문이 있으면 지문을 별도 이미지로 변환
      if (group.passage) {
        processedCount++
        if (onProgress) {
          onProgress({
            current: processedCount,
            total: totalItems,
            percentage: Math.round((processedCount / totalItems) * 100),
            message: `지문 ${groupIdx + 1} 변환 중...`
          })
        }

        const passageElement = createPassageElement(group.passage, group.questionNumbers)
        tempContainer.appendChild(passageElement)

        // 요소가 실제로 렌더링되도록 보장
        passageElement.style.visibility = 'visible'
        passageElement.style.opacity = '1'
        passageElement.style.display = 'block'
        passageElement.style.position = 'relative'

        // 지문 요소의 외부 이미지를 프록시로 교체
        console.log(`[convertQuestionsToImages] 지문 ${groupIdx + 1} 이미지 프록시 처리 시작`)
        await replaceExternalImagesWithDataUrls(passageElement)

        // 강제 렌더링을 위한 대기
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            passageElement.offsetHeight // 강제 리플로우
            setTimeout(resolve, 300) // 렌더링 완료 대기 시간 증가
          })
        })

        const passageImage = await convertQuestionToImage(passageElement)
        images.push({
          ...passageImage,
          type: 'passage',
          questionNumbers: group.questionNumbers,
          metadata: {
            isPassage: true
          }
        })

        tempContainer.removeChild(passageElement)
      }

      // 2. 각 문제와 보기를 하나의 이미지로 변환
      for (let i = 0; i < group.questions.length; i++) {
        const question = group.questions[i]
        processedCount++

        if (onProgress) {
          onProgress({
            current: processedCount,
            total: totalItems,
            percentage: Math.round((processedCount / totalItems) * 100),
            message: `문제 ${question.displayNumber || question.itemNumber || processedCount} 변환 중...`
          })
        }

        // 문제와 보기를 함께 포함한 요소 생성
        const questionElement = createQuestionWithChoicesElement(question)
        tempContainer.appendChild(questionElement)

        // 요소가 실제로 렌더링되도록 보장
        questionElement.style.visibility = 'visible'
        questionElement.style.opacity = '1'
        questionElement.style.display = 'block'
        questionElement.style.position = 'relative'

        // 문제 요소 내의 모든 이미지 로드 대기 및 외부 이미지는 프록시로 교체
        console.log(`[convertQuestionsToImages] 문제 ${question.displayNumber} 이미지 프록시 처리 시작`)
        await replaceExternalImagesWithDataUrls(questionElement)
        
        const questionImages = questionElement.querySelectorAll('img')
        if (questionImages.length > 0) {
          console.log(`[convertQuestionsToImages] 문제 ${question.displayNumber}의 이미지 ${questionImages.length}개 로드 대기 중...`)

          // 각 이미지에 대해 처리
          for (const img of questionImages) {
            // 이미지 스타일 강제 적용
            img.style.maxWidth = '100%'
            img.style.height = 'auto'
            img.style.display = 'inline-block'

            if (!img.complete) {
              await new Promise((resolve) => {
                img.onload = () => {
                  console.log(`[convertQuestionsToImages] 문제 ${question.displayNumber} 이미지 로드 완료:`, img.src.substring(0, 50))
                  resolve()
                }
                img.onerror = () => {
                  console.error(`[convertQuestionsToImages] 문제 ${question.displayNumber} 이미지 로드 실패:`, img.src)
                  // 실패한 이미지 대체 처리
                  img.style.border = '1px solid red'
                  img.alt = '이미지 로드 실패'
                  resolve()
                }
                // src 재설정
                const currentSrc = img.src
                img.src = ''
                setTimeout(() => {
                  img.src = currentSrc
                }, 10)
              })
            }
          }

          // 이미지 로드 후 추가 대기
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // 강제 렌더링을 위한 대기
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            questionElement.offsetHeight // 강제 리플로우
            setTimeout(resolve, 300) // 렌더링 완료 대기 시간 증가
          })
        })

        // 이미지로 변환
        const imageData = await convertQuestionToImage(questionElement)

        // 메타데이터와 함께 저장
        images.push({
          ...imageData,
          questionId: question.itemId || question.id,
          questionNumber: question.displayNumber || question.itemNumber || processedCount,
          type: 'question-with-choices',
          metadata: {
            points: question.points || 5,
            difficulty: question.difficulty,
            chapterCode: question.chapterCode,
            hasPassage: group.passage !== null
          }
        })

        // 임시 요소 제거
        tempContainer.removeChild(questionElement)
      }
    }

    console.log('변환된 이미지 수:', images.length)

    // 각 이미지 데이터 검증
    images.forEach((img, idx) => {
      console.log(`이미지 ${idx + 1} 검증:`, {
        dataUrl존재: !!img.dataUrl,
        dataUrl길이: img.dataUrl?.length,
        dataUrl시작: img.dataUrl?.substring(0, 50),
        type: img.type,
        questionNumber: img.questionNumber,
        width: img.width,
        height: img.height
      })

      if (!img.dataUrl) {
        console.error(`❌ 이미지 ${idx + 1}에 dataUrl이 없습니다!`)
      } else if (!img.dataUrl.startsWith('data:image/')) {
        console.error(`❌ 이미지 ${idx + 1}의 dataUrl 형식이 잘못되었습니다!`)
      }
    })

    return images
  } catch (error) {
    console.error('이미지 변환 중 오류:', error)
    throw error
  } finally {
    // 정리
    document.body.removeChild(tempContainer)
  }
}

/**
 * 문제들을 지문별로 그룹화
 */
function groupQuestionsByPassage(questions) {
  const groups = []
  let currentGroup = null

  questions.forEach((question, index) => {
    // 지문이 있는 문제인 경우
    if (question.passageHtml) {
      // 새로운 그룹 시작
      if (!currentGroup || currentGroup.passage !== question.passageHtml) {
        currentGroup = {
          passage: question.passageHtml,
          questions: [],
          questionNumbers: []
        }
        groups.push(currentGroup)
      }
      currentGroup.questions.push(question)
      currentGroup.questionNumbers.push(question.displayNumber || question.itemNumber || index + 1)
    } else {
      // 지문이 없는 독립 문제
      groups.push({
        passage: null,
        questions: [question],
        questionNumbers: [question.displayNumber || question.itemNumber || index + 1]
      })
      currentGroup = null
    }
  })

  return groups
}

/**
 * 지문 요소 생성 - 내용 길이에 따라 높이 자동 조정
 */
function createPassageElement(passageHtml, questionNumbers) {
  // IMG 정규화
  passageHtml = normalizeImgTags(passageHtml)
  const container = document.createElement('div')
  container.className = 'passage-container'

  // 임시로 요소를 만들어서 실제 높이 측정
  const tempDiv = document.createElement('div')
  tempDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: 734px;
    padding: 30px;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 15px;
    line-height: 2.0;
  `
  tempDiv.innerHTML = passageHtml
  document.body.appendChild(tempDiv)

  // 실제 콘텐츠 높이 측정
  const contentHeight = tempDiv.scrollHeight
  document.body.removeChild(tempDiv)

  // 최소 높이는 300px, 최대는 내용에 맞춰 자동 조정
  const calculatedHeight = Math.max(300, contentHeight + 100) // 헤더와 패딩 고려

  container.style.cssText = `
    background: white;
    padding: 30px;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    font-family: 'Noto Sans KR', sans-serif;
    width: 794px;
    min-height: ${calculatedHeight}px;
    box-sizing: border-box;
    position: relative;
  `

  container.innerHTML = `
    <div style="background: #3b82f6; color: white; padding: 12px 20px; margin: -30px -30px 25px -30px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 15px;">
      [${questionNumbers.join(', ')}번] 다음 글을 읽고 물음에 답하시오.
    </div>
    <div class="mathjax-content" style="line-height: 2.0; font-size: 15px; color: #1f2937; text-align: justify; padding: 10px 0;">
      ${passageHtml}
    </div>
  `

  return container
}

/**
 * 문제와 보기를 함께 포함한 요소 생성 - 실제 시험지 스타일
 */
function createQuestionWithChoicesElement(question) {
  const container = document.createElement('div')
  container.className = 'question-with-choices-container'
  container.setAttribute('data-question-id', question.itemId || question.id)
  container.style.cssText = `
    background: white;
    padding: 25px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-family: 'Noto Sans KR', sans-serif;
    width: 794px;
    box-sizing: border-box;
    margin-bottom: 15px;
  `

  // 문제 번호와 점수
  const questionHeader = document.createElement('div')
  questionHeader.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
  `
  questionHeader.innerHTML = `
    <span style="font-weight: 700; font-size: 18px; color: #1f2937;">
      ${question.displayNumber || question.itemNumber || '1'}.
    </span>
    <span style="color: #6b7280; font-size: 16px;">
      (${question.points || 5}점)
    </span>
  `
  container.appendChild(questionHeader)

  // 문제 내용
  const questionContent = document.createElement('div')
  questionContent.className = 'question-content mathjax-content'
  questionContent.style.cssText = `
    margin-bottom: 25px;
    line-height: 2.0;
    color: #374151;
    font-size: 16px;
  `
  // 다양한 속성명 지원을 위한 HTML 콘텐츠 찾기
  let htmlContent = question.questionHtml ||
                      question.itemHtml ||
                      question.html ||
                      question.questionText ||
                      question.itemText ||
                      ''
  // IMG 정규화
  htmlContent = normalizeImgTags(htmlContent)

  // 디버깅 로그
  console.log('Question HTML content:', {
    itemId: question.itemId || question.id,
    hasQuestionHtml: !!question.questionHtml,
    hasItemHtml: !!question.itemHtml,
    hasHtml: !!question.html,
    hasQuestionText: !!question.questionText,
    contentLength: htmlContent.length,
    contentPreview: htmlContent.substring(0, 200),
    fullQuestion: question // 전체 question 객체 확인
  })

  // 내용이 없으면 대체 텍스트 표시
  if (!htmlContent || htmlContent.trim() === '') {
    htmlContent = `<div style="color: red; font-weight: bold;">문제 내용이 없습니다. (ID: ${question.itemId || question.id})</div>`
    console.warn('문제 내용이 비어있음:', question)
  }

  questionContent.innerHTML = htmlContent
  container.appendChild(questionContent)

  // 선택지 (choice1Html ~ choice5Html 형식 또는 choice1Text ~ choice5Text)
  const choices = []
  for (let i = 1; i <= 5; i++) {
    let choiceHtml = question[`choice${i}Html`] || question[`choice${i}Text`] || question[`choice${i}`]
    if (choiceHtml) {
      // IMG 정규화
      if (typeof choiceHtml === 'string') {
        choiceHtml = normalizeImgTags(choiceHtml)
      }
      choices.push(choiceHtml)
    }
  }

  // 디버깅: 선택지 확인
  console.log('Choices found:', {
    itemId: question.itemId || question.id,
    choiceCount: choices.length,
    hasChoice1Html: !!question.choice1Html,
    hasChoice1Text: !!question.choice1Text,
    hasChoice1: !!question.choice1
  })

  if (choices.length > 0) {
    const choicesContainer = document.createElement('div')
    choicesContainer.className = 'choices-container'
    choicesContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 25px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    `

    choices.forEach((choice, idx) => {
      const choiceElement = document.createElement('div')
      choiceElement.className = 'choice-item'
      choiceElement.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 12px;
        background: white;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
      `
      choiceElement.innerHTML = `
        <span style="font-weight: 600; color: #3b82f6; font-size: 16px; min-width: 24px;">
          ${['①', '②', '③', '④', '⑤'][idx]}
        </span>
        <span class="mathjax-content" style="flex: 1; font-size: 16px; line-height: 2.0;">
          ${choice}
        </span>
      `
      choicesContainer.appendChild(choiceElement)
    })

    container.appendChild(choicesContainer)
  }

  return container
}

/**
 * 시험 제목 헤더를 이미지로 변환
 * @param {Object} examInfo - 시험 정보 (title, subject, grade, duration, totalScore 등)
 * @returns {Promise<Object>} 헤더 이미지 데이터
 */
export async function createExamHeaderImage(examInfo) {
  const {
    title = '시험지',
    subject = '',
    grade = '',
    duration = '',
    totalScore = '',
    schoolName = '',
    examDate = ''
  } = examInfo

  // 임시 컨테이너 생성
  const tempContainer = document.createElement('div')
  tempContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: -9999;
    visibility: visible;
    opacity: 1;
  `
  document.body.appendChild(tempContainer)

  try {
    // 헤더 요소 생성
    const headerElement = document.createElement('div')
    headerElement.style.cssText = `
      width: 794px;
      padding: 40px 30px;
      background: white;
      font-family: 'Noto Sans KR', sans-serif;
      text-align: center;
      box-sizing: border-box;
    `

    // 제목
    const titleDiv = document.createElement('div')
    titleDiv.style.cssText = `
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 20px;
      letter-spacing: 2px;
    `
    titleDiv.textContent = title
    headerElement.appendChild(titleDiv)

    // 정보 라인
    const infoDiv = document.createElement('div')
    infoDiv.style.cssText = `
      font-size: 16px;
      color: #475569;
      margin-bottom: 10px;
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
    `

    const infoItems = []
    if (schoolName) infoItems.push(`학교: ${schoolName}`)
    if (grade) infoItems.push(`학년: ${grade}`)
    if (subject) infoItems.push(`과목: ${subject}`)
    if (examDate) infoItems.push(`시험일: ${examDate}`)

    if (infoItems.length > 0) {
      infoDiv.innerHTML = infoItems.map(item => `<span>${item}</span>`).join('')
      headerElement.appendChild(infoDiv)
    }

    // 시험 정보 (시간, 배점)
    const examInfoDiv = document.createElement('div')
    examInfoDiv.style.cssText = `
      font-size: 15px;
      color: #64748b;
      margin-top: 15px;
      display: flex;
      justify-content: center;
      gap: 30px;
    `

    const examInfoItems = []
    if (duration) examInfoItems.push(`시험시간: ${duration}분`)
    if (totalScore) examInfoItems.push(`총점: ${totalScore}점`)

    if (examInfoItems.length > 0) {
      examInfoDiv.innerHTML = examInfoItems.map(item => `<span>${item}</span>`).join('')
      headerElement.appendChild(examInfoDiv)
    }

    // 구분선
    const divider = document.createElement('div')
    divider.style.cssText = `
      margin-top: 25px;
      height: 2px;
      background: linear-gradient(to right, transparent, #cbd5e1 20%, #cbd5e1 80%, transparent);
    `
    headerElement.appendChild(divider)

    tempContainer.appendChild(headerElement)

    // 렌더링 대기
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        headerElement.offsetHeight // 강제 리플로우
        setTimeout(resolve, 100)
      })
    })

    // html2canvas로 이미지 변환
    const canvas = await html2canvas(headerElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      foreignObjectRendering: false
    })

    const imageData = {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      naturalWidth: 794,
      naturalHeight: Math.ceil(canvas.height / 2),
      type: 'header',
      isHeader: true
    }

    return imageData
  } catch (error) {
    console.error('헤더 이미지 생성 오류:', error)
    throw error
  } finally {
    document.body.removeChild(tempContainer)
  }
}

/**
 * [DEPRECATED] 기존 문제 요소 생성 함수 - 더 이상 사용하지 않음
 * createPassageElement와 createQuestionWithChoicesElement로 대체됨
 * @param {Object} question - 문제 데이터
 * @returns {HTMLElement} 생성된 HTML 요소
 */
function createQuestionElement_DEPRECATED(question) {
  const container = document.createElement('div')
  container.className = 'question-container'
  container.setAttribute('data-question-id', question.itemId || question.id)
  container.style.cssText = `
    background: white;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-family: 'Noto Sans KR', sans-serif;
  `

  // 지문이 있는 경우
  if (question.passageHtml) {
    const passageSection = document.createElement('div')
    passageSection.className = 'passage-section'
    passageSection.style.cssText = `
      background: #f8fafc;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    `
    passageSection.innerHTML = `
      <div style="font-weight: 600; color: #1e40af; margin-bottom: 10px;">
        [지문] 다음 글을 읽고 물음에 답하시오.
      </div>
      <div class="mathjax-content" style="line-height: 1.8;">
        ${question.passageHtml}
      </div>
    `
    container.appendChild(passageSection)
  }

  // 문제 헤더
  const questionHeader = document.createElement('div')
  questionHeader.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  `
  questionHeader.innerHTML = `
    <span style="font-weight: 700; font-size: 16px; color: #1f2937;">
      ${question.displayNumber || question.itemNumber || '1'}.
    </span>
    <span style="color: #6b7280; font-size: 14px;">
      (${question.points || 5}점)
    </span>
  `
  container.appendChild(questionHeader)

  // 문제 내용
  const questionContent = document.createElement('div')
  questionContent.className = 'question-content mathjax-content'
  questionContent.style.cssText = `
    margin-bottom: 15px;
    line-height: 1.8;
    color: #374151;
  `

  // 디버깅: 사용 가능한 HTML 필드 확인
  let htmlContent = question.questionHtml || question.itemHtml || question.html || question.questionText || ''
  console.log('문제 HTML 내용:', {
    questionNumber: question.displayNumber || question.itemNumber,
    hasQuestionHtml: !!question.questionHtml,
    hasItemHtml: !!question.itemHtml,
    hasHtml: !!question.html,
    hasQuestionText: !!question.questionText,
    actualContent: htmlContent.substring(0, 100),
    availableFields: Object.keys(question).filter(key => key.toLowerCase().includes('html') || key.toLowerCase().includes('text'))
  })

  // IMG 정규화
  htmlContent = normalizeImgTags(htmlContent)
  questionContent.innerHTML = htmlContent
  container.appendChild(questionContent)

  // 선택지가 있는 경우 (choice1Html ~ choice5Html 형식)
  const choices = []
  for (let i = 1; i <= 5; i++) {
    let choiceHtml = question[`choice${i}Html`] || question[`choice${i}`]
    if (choiceHtml && choiceHtml.trim()) {
      choices.push(typeof choiceHtml === 'string' ? normalizeImgTags(choiceHtml) : choiceHtml)
    }
  }

  // 기존 choices 배열이 있는 경우도 처리
  if (!choices.length && question.choices && question.choices.length > 0) {
    choices.push(...question.choices)
  }

  console.log('선택지 처리:', {
    questionNumber: question.displayNumber || question.itemNumber,
    choicesCount: choices.length,
    hasChoice1Html: !!question.choice1Html,
    hasChoice1: !!question.choice1,
    firstChoice: choices[0]?.substring(0, 50)
  })

  if (choices.length > 0) {
    const choicesContainer = document.createElement('div')
    choicesContainer.className = 'choices-container'
    choicesContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 15px;
    `

    choices.forEach((choice, idx) => {
      const choiceElement = document.createElement('div')
      choiceElement.className = 'choice-item'
      choiceElement.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px;
        background: #f9fafb;
        border-radius: 4px;
      `
      choiceElement.innerHTML = `
        <span style="font-weight: 600; color: #4b5563;">
          ${['①', '②', '③', '④', '⑤'][idx]}
        </span>
        <span class="mathjax-content" style="flex: 1;">
          ${choice}
        </span>
      `
      choicesContainer.appendChild(choiceElement)
    })

    container.appendChild(choicesContainer)
  }

  return container
}

/**
 * 이미지 데이터를 압축 (선택적)
 * @param {String} dataUrl - 원본 이미지 데이터 URL
 * @param {Number} quality - 압축 품질 (0-1)
 * @returns {Promise<String>} 압축된 데이터 URL
 */
export async function compressImage(dataUrl, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // JPEG로 압축 (PNG보다 작은 파일 크기)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

/**
 * 이미지 배열을 청크로 분할 (메모리 관리)
 * @param {Array} images - 이미지 데이터 배열
 * @param {Number} chunkSize - 청크 크기
 * @returns {Array} 청크 배열
 */
export function chunkImages(images, chunkSize = 10) {
  const chunks = []
  for (let i = 0; i < images.length; i += chunkSize) {
    chunks.push(images.slice(i, i + chunkSize))
  }
  return chunks
}


export default {
  convertQuestionToImage,
  convertQuestionsToImages,
  createExamHeaderImage,
  compressImage,
  chunkImages
}
