/**
 * PDF Content Pagination Utilities
 *
 * Provides accurate content measurement and intelligent splitting
 * for A4 page-based PDF generation
 */

import { nextTick } from 'vue'

/**
 * A4 Page Constants (in pixels at 96 DPI)
 * 더 정확한 값으로 조정
 */
export const A4_CONSTANTS = {
  MM_TO_PX: 3.78, // Conversion factor from mm to pixels
  PAGE_HEIGHT_MM: 297, // A4 height in mm
  PAGE_WIDTH_MM: 210, // A4 width in mm
  TOP_MARGIN_MM: 30, // 더 넉넉한 상단 여백
  BOTTOM_MARGIN_MM: 30, // 더 넉넉한 하단 여백
  LEFT_MARGIN_MM: 20,
  RIGHT_MARGIN_MM: 20,
  HEADER_HEIGHT_PX: 100, // 첫 페이지 헤더 (시험 제목 등)
  FOOTER_HEIGHT_PX: 30, // 페이지 번호
  LINE_HEIGHT_PX: 22, // 실제 라인 높이
  PARAGRAPH_MARGIN_PX: 15, // 단락 간격
  QUESTION_BASE_HEIGHT_PX: 60, // 문제 기본 높이 (번호 + 텍스트)
  CHOICE_HEIGHT_PX: 26, // 선택지 하나당 높이
  PASSAGE_HEADER_HEIGHT_PX: 40, // 지문 헤더 "[1-3] 다음 글을..."
  GROUP_MARGIN_PX: 30 // 그룹 간 여백
}

// Calculate usable heights (적절한 여백으로 조정)
export const USABLE_HEIGHT = {
  FIRST_PAGE: Math.floor((A4_CONSTANTS.PAGE_HEIGHT_MM - A4_CONSTANTS.TOP_MARGIN_MM - A4_CONSTANTS.BOTTOM_MARGIN_MM) * A4_CONSTANTS.MM_TO_PX - A4_CONSTANTS.HEADER_HEIGHT_PX - A4_CONSTANTS.FOOTER_HEIGHT_PX) - 20, // 적절한 여백
  REGULAR_PAGE: Math.floor((A4_CONSTANTS.PAGE_HEIGHT_MM - A4_CONSTANTS.TOP_MARGIN_MM - A4_CONSTANTS.BOTTOM_MARGIN_MM) * A4_CONSTANTS.MM_TO_PX - A4_CONSTANTS.FOOTER_HEIGHT_PX) - 15 // 적절한 여백
}

/**
 * Creates a hidden measurement container for accurate DOM measurements
 */
export function createMeasurementContainer(layoutMode = 'single') {
  const container = document.createElement('div')
  container.id = 'pdf-measurement-container'
  container.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${layoutMode === 'double' ? '340px' : '700px'};
    visibility: hidden;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
  `
  document.body.appendChild(container)
  return container
}

/**
 * Removes the measurement container
 */
export function removeMeasurementContainer() {
  const container = document.getElementById('pdf-measurement-container')
  if (container) {
    container.remove()
  }
}

/**
 * Measures the actual rendered height of HTML content
 */
export async function measureContentHeight(htmlContent, layoutMode = 'single') {
  const container = createMeasurementContainer(layoutMode)

  try {
    // Set the HTML content
    container.innerHTML = htmlContent

    // Wait for DOM to update
    await nextTick()

    // Force browser reflow to get accurate measurements
    void container.offsetHeight

    // Get the actual height including margins
    const height = container.scrollHeight

    return height
  } finally {
    removeMeasurementContainer()
  }
}

/**
 * Splits HTML content at appropriate boundaries (paragraphs, sentences)
 */
export function splitHtmlContent(htmlContent, maxHeight, layoutMode = 'single') {
  // Parse HTML to work with DOM nodes
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const body = doc.body

  const splitPoints = []
  let currentSplit = []
  let currentHeight = 0

  // Helper to serialize nodes back to HTML
  const serializeNodes = (nodes) => {
    const temp = document.createElement('div')
    nodes.forEach(node => temp.appendChild(node.cloneNode(true)))
    return temp.innerHTML
  }

  // Process each top-level element
  const elements = Array.from(body.children)

  if (elements.length === 0 && body.textContent) {
    // Handle plain text content
    const text = body.textContent
    const sentences = text.split(/(?<=[.!?])\s+/)

    let currentChunk = ''
    for (const sentence of sentences) {
      const testChunk = currentChunk + ' ' + sentence
      const testHeight = estimateTextHeight(testChunk, layoutMode)

      if (testHeight > maxHeight && currentChunk) {
        splitPoints.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk = testChunk
      }
    }

    if (currentChunk) {
      splitPoints.push(currentChunk.trim())
    }

    return splitPoints
  }

  // Process structured HTML elements
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    const elementHeight = estimateElementHeight(element, layoutMode)

    if (currentHeight + elementHeight > maxHeight && currentSplit.length > 0) {
      // Save current split
      splitPoints.push(serializeNodes(currentSplit))
      currentSplit = [element]
      currentHeight = elementHeight
    } else if (elementHeight > maxHeight) {
      // Single element is too tall, need to split it
      if (currentSplit.length > 0) {
        splitPoints.push(serializeNodes(currentSplit))
        currentSplit = []
        currentHeight = 0
      }

      // Split large element (like long paragraph)
      const subSplits = splitLargeElement(element, maxHeight, layoutMode)
      subSplits.forEach((split, index) => {
        if (index < subSplits.length - 1) {
          splitPoints.push(split)
        } else {
          // Keep last part for next group
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = split
          currentSplit = Array.from(tempDiv.children)
          currentHeight = estimateTextHeight(split, layoutMode)
        }
      })
    } else {
      currentSplit.push(element)
      currentHeight += elementHeight
    }
  }

  // Add remaining content
  if (currentSplit.length > 0) {
    splitPoints.push(serializeNodes(currentSplit))
  }

  return splitPoints
}

/**
 * Splits a large element (like a long paragraph) into smaller chunks
 */
function splitLargeElement(element, maxHeight, layoutMode) {
  const tagName = element.tagName.toLowerCase()
  const content = element.innerHTML

  if (tagName === 'p' || tagName === 'div') {
    // Try to split at sentence boundaries
    const sentences = content.split(/(?<=[.!?。])\s*/)
    const splits = []
    let currentSplit = ''
    let currentHeight = 0

    for (const sentence of sentences) {
      const sentenceHeight = estimateTextHeight(sentence, layoutMode)

      if (currentHeight + sentenceHeight > maxHeight && currentSplit) {
        splits.push(`<${tagName}>${currentSplit}</${tagName}>`)
        currentSplit = sentence
        currentHeight = sentenceHeight
      } else {
        currentSplit += ' ' + sentence
        currentHeight += sentenceHeight
      }
    }

    if (currentSplit) {
      splits.push(`<${tagName}>${currentSplit}</${tagName}>`)
    }

    return splits
  }

  // For other elements, return as is
  return [element.outerHTML]
}

/**
 * Estimates the height of an element based on its content
 */
function estimateElementHeight(element, layoutMode) {
  const tagName = element.tagName.toLowerCase()
  const textLength = element.textContent.length
  const charsPerLine = layoutMode === 'double' ? 30 : 60
  const lines = Math.ceil(textLength / charsPerLine)

  let baseHeight = lines * A4_CONSTANTS.LINE_HEIGHT_PX

  // Add margins based on element type
  switch (tagName) {
    case 'p':
      baseHeight += A4_CONSTANTS.PARAGRAPH_MARGIN_PX
      break
    case 'h1':
    case 'h2':
    case 'h3':
      baseHeight += A4_CONSTANTS.PARAGRAPH_MARGIN_PX * 1.5
      break
    case 'ul':
    case 'ol':
      const items = element.getElementsByTagName('li').length
      baseHeight = items * A4_CONSTANTS.LINE_HEIGHT_PX * 1.2
      break
  }

  return baseHeight
}

/**
 * Estimates text height based on character count
 */
function estimateTextHeight(text, layoutMode) {
  const cleanText = text.replace(/<[^>]*>/g, '') // Remove HTML tags
  const charsPerLine = layoutMode === 'double' ? 30 : 60
  const lines = Math.ceil(cleanText.length / charsPerLine)
  return lines * A4_CONSTANTS.LINE_HEIGHT_PX
}

/**
 * Creates a continuation indicator for split passages
 */
export function createContinuationIndicator(pageNum, isStart = false, isEnd = false) {
  if (isStart && !isEnd) {
    return '<div class="passage-continuation">(계속 →)</div>'
  } else if (!isStart && isEnd) {
    return '<div class="passage-continuation">(← 이어서)</div>'
  } else if (!isStart && !isEnd) {
    return '<div class="passage-continuation">(← 계속 →)</div>'
  }
  return ''
}

/**
 * Calculates optimal page breaks for content groups
 * 주요 개선: 컬럼/페이지 경계에서만 분할하도록 수정
 */
export async function calculateOptimalPageBreaks(groups, layoutMode = 'single') {
  const pages = []
  let currentPage = layoutMode === 'double' ? { column1: [], column2: [] } : { column1: [] }
  let column1Height = 0
  let column2Height = 0
  let pageNum = 1

  for (const group of groups) {
    // Estimate group height first (faster than actual measurement)
    const estimatedHeight = estimateGroupHeightFast(group, layoutMode)

    // Calculate available height for current page
    const availableHeight = pageNum === 1
      ? USABLE_HEIGHT.FIRST_PAGE
      : USABLE_HEIGHT.REGULAR_PAGE

    if (layoutMode === 'double') {
      // Two-column layout - 더 스마트한 분할 로직
      let placed = false

      console.log(`Trying to place group. Col1: ${column1Height}px, Col2: ${column2Height}px, Group: ${estimatedHeight}px, Available: ${availableHeight}px`)

      // 컬럼 높이의 절반을 기준으로 분할 여부 결정 (2단이므로 실제로는 페이지의 1/2)
      const columnThreshold = Math.floor(availableHeight * 0.45) // 조금 더 여유 있게

      // 첫 번째 컬럼이 비어있으면 우선 배치
      if (currentPage.column1.length === 0 && column1Height === 0) {
        // 그룹이 한 컬럼 높이를 초과하면 분할 검토
        if (estimatedHeight > availableHeight * 0.9) { // 90% 이상이면 분할 검토
          console.log('First column: Group too tall for page, splitting', estimatedHeight, 'vs', availableHeight)
          // 컬럼에 맞게 분할 (적절한 크기로)
          const splitGroups = await splitPassageAtBoundary(group, columnThreshold * 1.3, layoutMode)

          for (const splitGroup of splitGroups) {
            const splitHeight = estimateGroupHeightFast(splitGroup, layoutMode)
            if (column1Height + splitHeight <= availableHeight) {
              currentPage.column1.push(splitGroup)
              column1Height += splitHeight + A4_CONSTANTS.GROUP_MARGIN_PX
            } else if (column2Height + splitHeight <= availableHeight) {
              currentPage.column2.push(splitGroup)
              column2Height += splitHeight + A4_CONSTANTS.GROUP_MARGIN_PX
            } else {
              // 다음 페이지로
              pages.push(currentPage)
              currentPage = { column1: [splitGroup], column2: [] }
              column1Height = splitHeight + A4_CONSTANTS.GROUP_MARGIN_PX
              column2Height = 0
              pageNum++
            }
          }
          placed = true
        } else {
          currentPage.column1.push(group)
          column1Height += estimatedHeight + A4_CONSTANTS.GROUP_MARGIN_PX
          placed = true
        }
      }
      // 첫 번째 컬럼이 두 번째보다 짧고 공간이 있으면 배치
      else if (column1Height <= column2Height && column1Height + estimatedHeight <= availableHeight) {
        currentPage.column1.push(group)
        column1Height += estimatedHeight + A4_CONSTANTS.GROUP_MARGIN_PX
        placed = true
      }
      // 두 번째 컬럼에 배치 가능하면 배치
      else if (column2Height + estimatedHeight <= availableHeight) {
        currentPage.column2.push(group)
        column2Height += estimatedHeight + A4_CONSTANTS.GROUP_MARGIN_PX
        placed = true
      }

      // 두 컬럼 모두 공간이 부족한 경우에만 페이지 넘김
      if (!placed) {
        // 현재 페이지 저장
        if (currentPage.column1.length > 0 || currentPage.column2.length > 0) {
          pages.push(currentPage)
        }

        // 새 페이지 시작
        pageNum++
        const nextPageHeight = USABLE_HEIGHT.REGULAR_PAGE

        // 그룹이 페이지 높이의 80% 이상이면 분할 검토
        if (estimatedHeight > nextPageHeight * 0.8) {
          // 지문이 긴 경우 분할
          console.log('Splitting large group:', estimatedHeight, 'vs', nextPageHeight * 0.7)
          const splitGroups = await splitPassageAtBoundary(group, nextPageHeight, layoutMode)

          // 분할된 그룹 추가
          currentPage = { column1: [], column2: [] }
          column1Height = 0
          column2Height = 0

          for (const splitGroup of splitGroups) {
            const splitHeight = estimateGroupHeightFast(splitGroup, layoutMode)

            if (column1Height + splitHeight <= nextPageHeight) {
              currentPage.column1.push(splitGroup)
              column1Height += splitHeight + A4_CONSTANTS.GROUP_MARGIN_PX
            } else {
              // 다음 페이지로
              pages.push(currentPage)
              currentPage = { column1: [splitGroup], column2: [] }
              column1Height = splitHeight + A4_CONSTANTS.GROUP_MARGIN_PX
              column2Height = 0
              pageNum++
            }
          }
        } else {
          // 분할하지 않고 새 페이지에 전체 그룹 배치
          currentPage = { column1: [group], column2: [] }
          column1Height = estimatedHeight + A4_CONSTANTS.GROUP_MARGIN_PX
          column2Height = 0
        }
      }
    } else {
      // Single column layout - 단순화된 로직
      if (column1Height + estimatedHeight > availableHeight) {
        // 현재 페이지가 차면 새 페이지로
        if (currentPage.column1.length > 0) {
          pages.push(currentPage)
          currentPage = { column1: [] }
          column1Height = 0
          pageNum++
        }

        const nextPageHeight = pageNum === 1 ? USABLE_HEIGHT.FIRST_PAGE : USABLE_HEIGHT.REGULAR_PAGE

        // 그룹이 페이지 높이의 80% 이상이면 분할 검토
        if (estimatedHeight > nextPageHeight * 0.8) {
          console.log('Splitting large group (single column):', estimatedHeight, 'vs', nextPageHeight * 0.7)
          const splitGroups = await splitPassageAtBoundary(group, nextPageHeight, layoutMode)

          for (const splitGroup of splitGroups) {
            const splitHeight = estimateGroupHeightFast(splitGroup, layoutMode)

            if (column1Height + splitHeight <= nextPageHeight) {
              currentPage.column1.push(splitGroup)
              column1Height += splitHeight + A4_CONSTANTS.GROUP_MARGIN_PX
            } else {
              pages.push(currentPage)
              currentPage = { column1: [splitGroup] }
              column1Height = splitHeight + A4_CONSTANTS.GROUP_MARGIN_PX
              pageNum++
            }
          }
        } else {
          currentPage.column1.push(group)
          column1Height = estimatedHeight + A4_CONSTANTS.GROUP_MARGIN_PX
        }
      } else {
        // 현재 페이지에 추가
        currentPage.column1.push(group)
        column1Height += estimatedHeight + A4_CONSTANTS.GROUP_MARGIN_PX
      }
    }
  }

  // 마지막 페이지 추가
  if (currentPage.column1.length > 0 || (currentPage.column2 && currentPage.column2.length > 0)) {
    pages.push(currentPage)
  }

  return pages
}

/**
 * Fast height estimation without DOM measurement
 */
function estimateGroupHeightFast(group, layoutMode) {
  let height = A4_CONSTANTS.GROUP_MARGIN_PX

  if (group.type === 'passage-group') {
    height += A4_CONSTANTS.PASSAGE_HEADER_HEIGHT_PX

    // Estimate passage height based on character count - 더 정확한 계산
    if (group.passageHtml) {
      const plainText = group.passageHtml.replace(/<[^>]*>/g, '')
      // 한글과 영문 구분하여 더 정확한 계산
      const koreanRatio = (plainText.match(/[가-힣]/g) || []).length / plainText.length
      const baseCharsPerLine = layoutMode === 'double' ? 35 : 65
      const charsPerLine = koreanRatio > 0.5 ? baseCharsPerLine * 0.85 : baseCharsPerLine
      const estimatedLines = Math.ceil(plainText.length / charsPerLine)
      // 제한 없이 실제 높이 반영
      height += estimatedLines * A4_CONSTANTS.LINE_HEIGHT_PX
    }

    // Add question heights
    if (group.questions && group.questions.length > 0) {
      group.questions.forEach(q => {
        height += A4_CONSTANTS.QUESTION_BASE_HEIGHT_PX
        // choices 배열 체크
        if (q.choices && q.choices.length > 0) {
          height += q.choices.length * A4_CONSTANTS.CHOICE_HEIGHT_PX
        } else {
          // 개별 choice 체크
          const choiceCount = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
            .filter(c => c).length
          height += choiceCount * A4_CONSTANTS.CHOICE_HEIGHT_PX
        }
      })
    }
  } else if (group.type === 'passage-only') {
    // 지문만 있는 경우 (분할된 첫 부분)
    height += A4_CONSTANTS.PASSAGE_HEADER_HEIGHT_PX

    if (group.passageHtml) {
      const plainText = group.passageHtml.replace(/<[^>]*>/g, '')
      const koreanRatio = (plainText.match(/[가-힣]/g) || []).length / plainText.length || 0
      const baseCharsPerLine = layoutMode === 'double' ? 35 : 65
      const charsPerLine = koreanRatio > 0.5 ? baseCharsPerLine * 0.85 : baseCharsPerLine
      const estimatedLines = Math.ceil(plainText.length / charsPerLine)
      height += estimatedLines * A4_CONSTANTS.LINE_HEIGHT_PX
    }
  } else if (group.type === 'passage-continuation') {
    // 이어지는 지문 (분할된 두 번째 부분)
    height += 30 // 작은 헤더 공간

    if (group.passageHtml) {
      const plainText = group.passageHtml.replace(/<[^>]*>/g, '')
      const koreanRatio = (plainText.match(/[가-힣]/g) || []).length / plainText.length || 0
      const baseCharsPerLine = layoutMode === 'double' ? 35 : 65
      const charsPerLine = koreanRatio > 0.5 ? baseCharsPerLine * 0.85 : baseCharsPerLine
      const estimatedLines = Math.ceil(plainText.length / charsPerLine)
      height += estimatedLines * A4_CONSTANTS.LINE_HEIGHT_PX
    }
  } else if (group.type === 'questions-only') {
    // 문제만 있는 경우 (분할된 지문의 문제들)
    height += 20 // 작은 여백

    if (group.questions && group.questions.length > 0) {
      group.questions.forEach(q => {
        height += A4_CONSTANTS.QUESTION_BASE_HEIGHT_PX
        if (q.choices && q.choices.length > 0) {
          height += q.choices.length * A4_CONSTANTS.CHOICE_HEIGHT_PX
        } else {
          const choiceCount = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
            .filter(c => c).length
          height += choiceCount * A4_CONSTANTS.CHOICE_HEIGHT_PX
        }
      })
    }
  } else if (group.type === 'passage-group-continuation') {
    height += 40 // Continuation header 높이 증가

    if (group.questions && group.questions.length > 0) {
      group.questions.forEach(q => {
        height += A4_CONSTANTS.QUESTION_BASE_HEIGHT_PX
        if (q.choices && q.choices.length > 0) {
          height += q.choices.length * A4_CONSTANTS.CHOICE_HEIGHT_PX
        } else {
          const choiceCount = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
            .filter(c => c).length
          height += choiceCount * A4_CONSTANTS.CHOICE_HEIGHT_PX
        }
      })
    }
  } else {
    // Single questions
    if (group.questions && group.questions.length > 0) {
      group.questions.forEach(q => {
        height += A4_CONSTANTS.QUESTION_BASE_HEIGHT_PX
        if (q.choices && q.choices.length > 0) {
          height += q.choices.length * A4_CONSTANTS.CHOICE_HEIGHT_PX
        } else {
          const choiceCount = [q.choice1Html, q.choice2Html, q.choice3Html, q.choice4Html, q.choice5Html]
            .filter(c => c).length
          height += choiceCount * A4_CONSTANTS.CHOICE_HEIGHT_PX
        }
      })
    }
  }

  console.log('Estimated height for group:', group.type, height, 'px')
  return height
}

/**
 * Split passage only at page boundaries (not within columns)
 */
async function splitPassageAtBoundary(group, maxHeight, layoutMode) {
  if (group.type !== 'passage-group') {
    return [group]
  }

  // 최소 분할 크기 설정 - 적절한 분할을 위해 조정
  const MIN_CHAR_COUNT = 500      // 최소 500자는 유지해야 분할

  // 지문 높이 추정
  const passageHeight = A4_CONSTANTS.PASSAGE_HEADER_HEIGHT_PX
  let passageContentHeight = 0

  if (!group.passageHtml) {
    return [group]
  }

  const plainText = group.passageHtml.replace(/<[^>]*>/g, '')
  // 한글과 영문 구분하여 더 정확한 계산
  const koreanRatio = (plainText.match(/[가-힣]/g) || []).length / plainText.length
  const baseCharsPerLine = layoutMode === 'double' ? 35 : 70
  const charsPerLine = koreanRatio > 0.5 ? baseCharsPerLine * 0.85 : baseCharsPerLine
  const estimatedLines = Math.ceil(plainText.length / charsPerLine)
  passageContentHeight = estimatedLines * A4_CONSTANTS.LINE_HEIGHT_PX

  const totalPassageHeight = passageHeight + passageContentHeight

  // 분할 기준: 최대 높이의 1.2배를 초과하고 충분히 긴 경우
  // 적절한 분할을 위해 조건 완화
  const shouldSplit = totalPassageHeight > maxHeight * 1.2 && plainText.length > MIN_CHAR_COUNT

  if (!shouldSplit) {
    console.log('No split needed:', totalPassageHeight, 'vs maxHeight * 1.5:', maxHeight * 1.5, 'chars:', plainText.length)
    return [group]
  }

  console.log('Splitting passage:', totalPassageHeight, 'vs maxHeight:', maxHeight)

  const splitGroups = []
  let passageContent = group.passageHtml

  // 단순히 반으로 나누기 - 복잡한 로직 제거
  const targetSplitPoint = Math.floor(plainText.length / 2)

  // <p> 태그가 있는 경우
  if (passageContent.includes('<p>') || passageContent.includes('<P>')) {
    // DOM 파서를 사용하여 안전하게 처리
    const parser = new DOMParser()
    const doc = parser.parseFromString(passageContent, 'text/html')
    const paragraphs = doc.querySelectorAll('p')

    if (paragraphs.length > 0) {
      let firstHalf = ''
      let secondHalf = ''
      let currentLength = 0
      let splitIndex = Math.floor(paragraphs.length / 2) // 단락의 중간 지점

      // 전체 텍스트 길이의 중간에 가장 가까운 단락 찾기
      let bestSplitIndex = splitIndex
      let bestDiff = Math.abs(targetSplitPoint)

      for (let i = 0; i < paragraphs.length; i++) {
        const paraText = paragraphs[i].textContent || ''
        currentLength += paraText.length

        const diff = Math.abs(currentLength - targetSplitPoint)
        if (diff < bestDiff) {
          bestDiff = diff
          bestSplitIndex = i + 1 // 다음 단락부터 두 번째 그룹
        }
      }

      // 단락을 두 그룹으로 나누기
      for (let i = 0; i < paragraphs.length; i++) {
        if (i < bestSplitIndex) {
          firstHalf += paragraphs[i].outerHTML
        } else {
          secondHalf += paragraphs[i].outerHTML
        }
      }

      if (firstHalf && secondHalf) {
        // 첫 번째 부분: 지문만
        splitGroups.push({
          type: 'passage-only',
          passageId: group.passageId,
          passageHtml: firstHalf + '<p style="text-align: right; font-style: italic; color: #666; margin-top: 10px;">(계속)</p>',
          questions: [],
          questionNumbers: group.questionNumbers,
          isSplit: true,
          splitPart: 1
        })

        // 두 번째 부분: 나머지 지문만
        splitGroups.push({
          type: 'passage-continuation',
          passageId: group.passageId,
          passageHtml: '<p style="font-style: italic; color: #666; margin-bottom: 10px;">(이어서)</p>' + secondHalf,
          questions: [],
          questionNumbers: group.questionNumbers,
          isSplit: true,
          splitPart: 2
        })

        // 세 번째 부분: 문제들만 별도 그룹으로
        if (group.questions && group.questions.length > 0) {
          splitGroups.push({
            type: 'questions-only',
            passageId: group.passageId,
            questions: group.questions,
            questionNumbers: group.questionNumbers,
            relatedToSplitPassage: true
          })
        }

        console.log(`Split passage into ${splitGroups.length} groups:`)
        splitGroups.forEach((g, i) => {
          const passageLength = g.passageHtml ? g.passageHtml.replace(/<[^>]*>/g, '').length : 0
          console.log(`  Group ${i + 1}: ${passageLength} chars, ${g.questions ? g.questions.length : 0} questions`)
        })

        return splitGroups
      }
    }
  }

  // <p> 태그가 없거나 파싱 실패한 경우 - 단순 텍스트 분할
  // 문장 단위로 분할 시도
  const sentences = passageContent.split(/(?<=[.!?。])\s+/)

  if (sentences.length > 1) {
    let firstPart = ''
    let secondPart = ''
    let currentLength = 0

    for (const sentence of sentences) {
      if (currentLength < targetSplitPoint) {
        firstPart += sentence + ' '
        currentLength += sentence.length
      } else {
        secondPart += sentence + ' '
      }
    }

    if (firstPart && secondPart) {
      // 첫 번째 부분: 지문만
      splitGroups.push({
        type: 'passage-only',
        passageId: group.passageId,
        passageHtml: firstPart.trim() + '<div style="text-align: right; font-style: italic; color: #666; margin-top: 10px;">(계속)</div>',
        questions: [],
        questionNumbers: group.questionNumbers,
        isSplit: true,
        splitPart: 1
      })

      // 두 번째 부분: 나머지 지문만
      splitGroups.push({
        type: 'passage-continuation',
        passageId: group.passageId,
        passageHtml: '<div style="font-style: italic; color: #666; margin-bottom: 10px;">(이어서)</div>' + secondPart.trim(),
        questions: [],
        questionNumbers: group.questionNumbers,
        isSplit: true,
        splitPart: 2
      })

      // 세 번째 부분: 문제들만 별도 그룹으로
      if (group.questions && group.questions.length > 0) {
        splitGroups.push({
          type: 'questions-only',
          passageId: group.passageId,
          questions: group.questions,
          questionNumbers: group.questionNumbers,
          relatedToSplitPassage: true
        })
      }
    }
  }

  // 분할 결과 로그
  console.log(`Split passage into ${splitGroups.length} groups:`)
  splitGroups.forEach((g, i) => {
    const passageLength = g.passageHtml ? g.passageHtml.replace(/<[^>]*>/g, '').length : 0
    console.log(`  Group ${i + 1}: ${passageLength} chars, ${g.questions ? g.questions.length : 0} questions`)
  })

  return splitGroups.length > 0 ? splitGroups : [group]
}

/**
 * Splits a large group (passage group with questions) across pages
 * @deprecated - Use splitPassageAtBoundary instead
 */
async function splitLargeGroup(group, maxHeight, layoutMode) {
  if (group.type !== 'passage-group') {
    // For non-passage groups, return as is
    return [group]
  }

  const splitGroups = []

  // Measure passage height
  const passageHeight = await measureContentHeight(group.passageHtml, layoutMode)

  if (passageHeight > maxHeight * 0.7) {
    // Passage itself needs splitting
    const passageSplits = splitHtmlContent(
      group.passageHtml,
      maxHeight * 0.7, // Leave room for at least one question
      layoutMode
    )

    // Create groups for each passage split
    passageSplits.forEach((splitContent, index) => {
      const isFirst = index === 0
      const isLast = index === passageSplits.length - 1

      const splitGroup = {
        type: 'passage-group',
        passageId: group.passageId,
        passageHtml: splitContent + createContinuationIndicator(index + 1, isFirst, isLast),
        questions: isLast ? group.questions : [],
        questionNumbers: group.questionNumbers,
        isSplit: true,
        splitPart: index + 1,
        totalSplits: passageSplits.length
      }

      splitGroups.push(splitGroup)
    })

    // If questions exist and last split doesn't have room, create another group
    if (group.questions.length > 0 && splitGroups[splitGroups.length - 1].questions.length === 0) {
      splitGroups[splitGroups.length - 1].questions = group.questions
    }
  } else {
    // Passage fits, but maybe with questions it doesn't
    // Split questions across pages if needed
    let currentGroup = {
      ...group,
      questions: []
    }

    let currentHeight = passageHeight + A4_CONSTANTS.PASSAGE_HEADER_HEIGHT_PX

    for (const question of group.questions) {
      const questionHeight = A4_CONSTANTS.QUESTION_BASE_HEIGHT_PX +
        (question.choices ? question.choices.length * A4_CONSTANTS.CHOICE_HEIGHT_PX : 0)

      if (currentHeight + questionHeight > maxHeight && currentGroup.questions.length > 0) {
        splitGroups.push(currentGroup)
        currentGroup = {
          type: 'passage-group-continuation',
          passageId: group.passageId,
          questions: [question],
          questionNumbers: group.questionNumbers,
          isContinuation: true
        }
        currentHeight = questionHeight
      } else {
        currentGroup.questions.push(question)
        currentHeight += questionHeight
      }
    }

    if (currentGroup.questions.length > 0) {
      splitGroups.push(currentGroup)
    }
  }

  return splitGroups
}

/**
 * Renders a group to HTML for measurement
 */
async function renderGroupToHtml(group) {
  let html = '<div class="group-container">'

  if (group.type === 'passage-group') {
    html += `
      <div class="passage-header">[${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.</div>
      <div class="passage-content">${group.passageHtml}</div>
    `

    for (const question of group.questions) {
      html += renderQuestionToHtml(question)
    }
  } else if (group.type === 'passage-group-continuation') {
    html += '<div class="continuation-note">(앞 페이지에서 계속)</div>'

    for (const question of group.questions) {
      html += renderQuestionToHtml(question)
    }
  } else {
    for (const question of group.questions) {
      html += renderQuestionToHtml(question)
    }
  }

  html += '</div>'
  return html
}

/**
 * Renders a question to HTML
 */
function renderQuestionToHtml(question) {
  let html = '<div class="question-item">'
  html += `
    <div class="question-header">
      <span class="question-number">${question.displayNumber}.</span>
      <span class="question-points">(${question.points || 5}점)</span>
    </div>
    <div class="question-text">${question.questionHtml}</div>
  `

  if (question.choices && question.choices.length > 0) {
    html += '<div class="choices">'
    question.choices.forEach((choice, idx) => {
      const numbers = ['①', '②', '③', '④', '⑤']
      html += `
        <div class="choice">
          <span class="choice-number">${numbers[idx]}</span>
          <span class="choice-text">${choice}</span>
        </div>
      `
    })
    html += '</div>'
  }

  html += '</div>'
  return html
}
