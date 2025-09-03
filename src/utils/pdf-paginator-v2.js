/**
 * PDF Paginator V2 - Real Measurement Based System
 * 
 * 실제 DOM 측정을 기반으로 정확한 페이지 분할을 수행
 */

import { nextTick } from 'vue'

/**
 * A4 페이지 상수 (96 DPI 기준)
 */
export const A4_CONFIG = {
  // A4 크기 (mm -> px)
  WIDTH_MM: 210,
  HEIGHT_MM: 297,
  MM_TO_PX: 3.78, // 96 DPI에서 1mm = 3.78px
  
  // 여백 설정 (mm)
  MARGIN_TOP: 25,
  MARGIN_BOTTOM: 25,
  MARGIN_LEFT: 20,
  MARGIN_RIGHT: 20,
  
  // 특수 요소 높이
  HEADER_HEIGHT: 80, // 첫 페이지 헤더 (제목, 정보 등)
  FOOTER_HEIGHT: 30, // 페이지 번호
  
  // 계산된 값들
  get PAGE_WIDTH() {
    return this.WIDTH_MM * this.MM_TO_PX
  },
  get PAGE_HEIGHT() {
    return this.HEIGHT_MM * this.MM_TO_PX
  },
  get CONTENT_WIDTH() {
    return (this.WIDTH_MM - this.MARGIN_LEFT - this.MARGIN_RIGHT) * this.MM_TO_PX
  },
  get CONTENT_HEIGHT() {
    return (this.HEIGHT_MM - this.MARGIN_TOP - this.MARGIN_BOTTOM) * this.MM_TO_PX
  },
  get FIRST_PAGE_HEIGHT() {
    return this.CONTENT_HEIGHT - this.HEADER_HEIGHT - this.FOOTER_HEIGHT
  },
  get REGULAR_PAGE_HEIGHT() {
    return this.CONTENT_HEIGHT - this.FOOTER_HEIGHT
  }
}

/**
 * 측정용 컨테이너 생성
 */
class MeasurementContainer {
  constructor(layoutMode = 'single') {
    this.layoutMode = layoutMode
    this.container = null
    this.innerWrapper = null
  }

  create() {
    if (this.container) return this.container

    const container = document.createElement('div')
    container.id = 'pdf-measurement-container'
    
    // A4 콘텐츠 폭으로 설정 (2단일 때는 CSS columns 사용)
    const width = A4_CONFIG.CONTENT_WIDTH
    
    container.style.cssText = `
      position: fixed;
      top: -99999px;
      left: -99999px;
      width: ${width}px;
      visibility: hidden;
      font-family: 'Noto Sans KR', sans-serif;
      font-size: 12pt;
      line-height: 1.8;
      background: white;
      padding: 0;
      margin: 0;
    `
    // 내부 래퍼 (2단은 CSS columns 적용)
    const wrapper = document.createElement('div')
    if (this.layoutMode === 'double') {
      wrapper.style.cssText = `
        column-count: 2;
        column-gap: 32px; /* 2rem 기준 */
        column-rule: 1px solid #e0e6ed;
        column-fill: balance;
        break-before: auto; break-after: auto; break-inside: auto;
      `
    } else {
      wrapper.style.cssText = 'display:block;'
    }
    container.appendChild(wrapper)
    document.body.appendChild(container)
    this.container = container
    this.innerWrapper = wrapper
    return container
  }

  destroy() {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }

  /**
   * HTML 콘텐츠의 실제 높이 측정
   */
  async measureHeight(htmlContent) {
    this.create()
    // 내부 래퍼에 HTML 설정
    this.innerWrapper.innerHTML = htmlContent
    
    // DOM 업데이트 대기
    await nextTick()

    // 수식이 있는 경우 MathJax 렌더링을 반영하여 실측 정확도 향상
    try {
      if (window && window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        await window.MathJax.typesetPromise([this.innerWrapper])
      }
    } catch (e) {
      // 렌더링 실패해도 측정은 계속 진행
      // console.warn('MathJax typeset in measurement failed:', e)
    }
    
    // 브라우저 리플로우 강제
    void this.container.offsetHeight
    
    // 실제 높이 측정
    const height = this.innerWrapper.scrollHeight
    
    return height
  }

  /**
   * 여러 요소의 높이를 한 번에 측정
   */
  async measureMultiple(items) {
    const results = []
    
    for (const item of items) {
      const height = await this.measureHeight(item.html)
      results.push({
        ...item,
        measuredHeight: height
      })
    }
    
    return results
  }

  async willFit(fullHtml, availableHeightPx, safety = 24) {
    const h = await this.measureHeight(fullHtml)
    return h <= (availableHeightPx - safety)
  }

  clear() {
    if (this.innerWrapper) this.innerWrapper.innerHTML = ''
  }
}

/**
 * 문제 그룹 생성기
 */
export class ContentGrouper {
  /**
   * 문제들을 그룹으로 조직화
   */
  static createGroups(questions) {
    const groups = []
    const processedIds = new Set()
    
    questions.forEach(question => {
      if (processedIds.has(question.id)) return
      
      if (question.passageId && question.passageHtml) {
        // 같은 지문을 공유하는 문제들 찾기
        const relatedQuestions = questions.filter(q => 
          q.passageId === question.passageId && !processedIds.has(q.id)
        )
        
        if (relatedQuestions.length > 0) {
          groups.push({
            type: 'passage-with-questions',
            passageId: question.passageId,
            passageHtml: question.passageHtml,
            passageText: question.passageText || question.passage || '',
            questions: relatedQuestions,
            questionNumbers: relatedQuestions.map(q => q.displayNumber).join(', ')
          })
          
          relatedQuestions.forEach(q => processedIds.add(q.id))
        }
      } else {
        // 독립 문제
        groups.push({
          type: 'standalone-question',
          questions: [question]
        })
        processedIds.add(question.id)
      }
    })
    
    return groups
  }
}

/**
 * 페이지 분할기 - 실제 측정 기반
 */
export class PageSplitter {
  constructor(layoutMode = 'single') {
    this.layoutMode = layoutMode
    this.measurer = new MeasurementContainer(layoutMode)
    // 단일 컬럼 측정용 (2단 배치 결정할 때 사용)
    this.colMeasurer = new MeasurementContainer('single')
  }

  /**
   * 그룹들을 페이지로 분할
   */
  async splitIntoPages(groups) {
    if (this.layoutMode === 'double') {
      return await this.splitIntoPagesDouble(groups)
    }
    const pages = []
    let currentPage = this.createEmptyPage()
    let currentPageNum = 1

    // 누적 HTML (레이아웃 래퍼 포함)
    let currentHtml = this.wrapStart()
    const avail = (n) => this.getAvailableHeight(n)

    // 2단 모드 전용: 컬럼별 누적 HTML
    let col1Html = ''
    let col2Html = ''

    for (const group of groups) {
      const groupHtml = this.renderGroupHTML(group)
      const tryHtml = currentHtml + groupHtml + this.wrapEnd()

      if (await this.measurer.willFit(tryHtml, avail(currentPageNum))) {
        // 현재 페이지에 수용
        if (this.layoutMode === 'double') {
          // 어떤 컬럼에 넣을지 결정 (단일 컬럼 높이 기준)
          const [h1, h2] = await Promise.all([
            this.measureColumnHeight(col1Html + groupHtml),
            this.measureColumnHeight(col2Html + groupHtml)
          ])
          const targetCol = h1 <= h2 ? 1 : 2
          if (targetCol === 1) {
            currentPage.column1.push(group)
            col1Html += groupHtml
          } else {
            currentPage.column2.push(group)
            col2Html += groupHtml
          }
        } else {
          this.addToPage(currentPage, group)
        }
        currentHtml += groupHtml
      } else {
        // 먼저 현재 페이지의 남은 공간을 최대한 채우도록 시도
        const usedHeight = await this.measurer.measureHeight(currentHtml + this.wrapEnd())
        const remaining = Math.max(0, avail(currentPageNum) - usedHeight)

        const partial = await this.splitGroupForRemaining(group, remaining, avail(currentPageNum))

        if (partial.firstChunk) {
          const firstHtml = this.renderGroupHTML(partial.firstChunk)
          const tryFirst = currentHtml + firstHtml + this.wrapEnd()
          if (await this.measurer.willFit(tryFirst, avail(currentPageNum))) {
            // 남은 공간에 첫 청크를 채움
            if (this.layoutMode === 'double') {
              const [h1, h2] = await Promise.all([
                this.measureColumnHeight(col1Html + firstHtml),
                this.measureColumnHeight(col2Html + firstHtml)
              ])
              if (h1 <= h2) {
                currentPage.column1.push(partial.firstChunk)
                col1Html += firstHtml
              } else {
                currentPage.column2.push(partial.firstChunk)
                col2Html += firstHtml
              }
            } else {
              this.addToPage(currentPage, partial.firstChunk)
            }
            currentHtml += firstHtml
          }
        }

        // 현재 페이지 마감
        if (this.hasContent(currentPage)) pages.push(currentPage)
        currentPage = this.createEmptyPage()
        currentPageNum++
        currentHtml = this.wrapStart()
        col1Html = ''
        col2Html = ''

        // 나머지 청크들 배치
        const restChunks = partial.restChunks.length > 0
          ? partial.restChunks
          : (async () => {
              // 통째로도 안 들어가는 경우 블록 분할 후 사용
              const singleHtml = this.wrapStart() + groupHtml + this.wrapEnd()
              const fitsOnEmpty = await this.measurer.willFit(singleHtml, avail(currentPageNum))
              if (!fitsOnEmpty) return await this.splitLargeGroupByBlocks(group, avail(currentPageNum))
              return [group]
            })()

        const resolvedRest = Array.isArray(restChunks) ? restChunks : await restChunks
        for (const chunk of resolvedRest) {
          const chunkHtml = this.renderGroupHTML(chunk)
          const tryChunk = currentHtml + chunkHtml + this.wrapEnd()
          if (!(await this.measurer.willFit(tryChunk, avail(currentPageNum)))) {
            if (this.hasContent(currentPage)) pages.push(currentPage)
            currentPage = this.createEmptyPage()
            currentPageNum++
            currentHtml = this.wrapStart()
            col1Html = ''
            col2Html = ''
          }
          if (this.layoutMode === 'double') {
            const [h1, h2] = await Promise.all([
              this.measureColumnHeight(col1Html + chunkHtml),
              this.measureColumnHeight(col2Html + chunkHtml)
            ])
            if (h1 <= h2) {
              currentPage.column1.push(chunk)
              col1Html += chunkHtml
            } else {
              currentPage.column2.push(chunk)
              col2Html += chunkHtml
            }
          } else {
            this.addToPage(currentPage, chunk)
          }
          currentHtml += chunkHtml
        }
      }
    }

    // 마지막 페이지 추가
    if (this.hasContent(currentPage)) pages.push(currentPage)

    this.measurer.clear()
    this.measurer.destroy()
    return pages
  }

  get columnWidthPx() {
    const gap = 32 // px
    return (A4_CONFIG.CONTENT_WIDTH - gap) / 2
  }

  async measureColumnHeight(contentHtml) {
    // 단일 컬럼 폭으로 감싸서 높이 측정
    const html = `<div style="width:${this.columnWidthPx}px;">${contentHtml}</div>`
    return await this.colMeasurer.measureHeight(html)
  }

  /**
   * 2단 레이아웃 전용 페이지 분할: 컬럼별 높이로 판단
   */
  async splitIntoPagesDouble(groups) {
    const pages = []
    let currentPage = this.createEmptyPage()
    let currentPageNum = 1
    let maxHeight = this.getAvailableHeight(currentPageNum)
    let col1Html = ''
    let col2Html = ''
    let hLeft = 0
    let hRight = 0
    const itemGap = 16 // px, 요소 간 간격 보정

    const placeHtmlInColumns = async (chunkHtml) => {
      const currentMax = this.getAvailableHeight(currentPageNum)
      // 청크 자체 높이 측정 (컬럼 폭 기준)
      const chunkH = await this.measureColumnHeight(chunkHtml)
      // 더 낮은 컬럼부터 시도 (동일하면 왼쪽 우선)
      const tryLeftFirst = hLeft <= hRight
      const tryOrder = tryLeftFirst ? ['left', 'right'] : ['right', 'left']
      for (const side of tryOrder) {
        if (side === 'left') {
          if (hLeft + chunkH + (hLeft > 0 ? itemGap : 0) <= currentMax) {
            col1Html += chunkHtml
            hLeft += chunkH + (hLeft > 0 ? itemGap : 0)
            return 1
          }
        } else {
          if (hRight + chunkH + (hRight > 0 ? itemGap : 0) <= currentMax) {
            col2Html += chunkHtml
            hRight += chunkH + (hRight > 0 ? itemGap : 0)
            return 2
          }
        }
      }
      return 0
    }

    const flushPage = () => {
      if (this.hasContent(currentPage)) {
        pages.push(currentPage)
      }
      currentPage = this.createEmptyPage()
      currentPageNum++
      col1Html = ''
      col2Html = ''
      hLeft = 0
      hRight = 0
      maxHeight = this.getAvailableHeight(currentPageNum)
    }

    for (const group of groups) {
      const groupHtml = this.renderGroupHTML(group)
      const placed = await placeHtmlInColumns(groupHtml)
      if (placed) {
        if (placed === 1) currentPage.column1.push(group)
        else currentPage.column2.push(group)
        continue
      }

      // 여기서 남은 컬럼별 높이에 맞춰 우선 분할 시도 (왼쪽→오른쪽), 그래도 안되면 페이지 넘김
      const currentMax = this.getAvailableHeight(currentPageNum)
      const leftRemain = Math.max(0, currentMax - hLeft)
      const rightRemain = Math.max(0, currentMax - hRight)
      const minChunk = 40

      let queue = [group]
      let progressed = false

      // 왼쪽 컬럼 남은 공간에 일부 먼저 채우기
      if (leftRemain > minChunk) {
        const partialL = await this.splitGroupForRemaining(group, leftRemain, currentMax)
        if (partialL.firstChunk) {
          const firstHtml = this.renderGroupHTML(partialL.firstChunk)
          const pl = await placeHtmlInColumns(firstHtml)
          if (pl) {
            if (pl === 1) currentPage.column1.push(partialL.firstChunk)
            else currentPage.column2.push(partialL.firstChunk)
            progressed = true
            queue = [...partialL.restChunks]
          }
        }
      }

      // 오른쪽 컬럼 남은 공간에도 시도
      if (!progressed && rightRemain > minChunk) {
        const partialR = await this.splitGroupForRemaining(group, rightRemain, currentMax)
        if (partialR.firstChunk) {
          const firstHtml = this.renderGroupHTML(partialR.firstChunk)
          const pr = await placeHtmlInColumns(firstHtml)
          if (pr) {
            if (pr === 1) currentPage.column1.push(partialR.firstChunk)
            else currentPage.column2.push(partialR.firstChunk)
            progressed = true
            queue = [...partialR.restChunks]
          }
        }
      }

      // 남은 청크들을 현재 페이지 컬럼들에 최대한 채워넣기
      if (progressed) {
        while (queue.length > 0) {
          const c = queue[0]
          const cHtml = this.renderGroupHTML(c)
          const plc = await placeHtmlInColumns(cHtml)
          if (plc) {
            if (plc === 1) currentPage.column1.push(c)
            else currentPage.column2.push(c)
            queue.shift()
          } else {
            break
          }
        }
        if (queue.length === 0) continue
        // 아직 남았으면 페이지 넘김 후 계속
        flushPage()
        while (queue.length > 0) {
          const c = queue.shift()
          const cHtml = this.renderGroupHTML(c)
          const plc = await placeHtmlInColumns(cHtml)
          if (plc === 1) currentPage.column1.push(c)
          else if (plc === 2) currentPage.column2.push(c)
          else {
            // 그래도 안되면 더 잘게 분할
            const more = await this.splitLargeGroupByBlocks(c, this.getAvailableHeight(currentPageNum))
            queue = more.concat(queue)
          }
        }
        continue
      }

      // 남은 공간에 맞추기 실패 → 큰 그룹을 블록 단위로 분할 후 순차 배치
      const chunks = await this.splitLargeGroupByBlocks(group, this.getAvailableHeight(currentPageNum))
      for (const chunk of chunks) {
        const chunkHtml = this.renderGroupHTML(chunk)
        let result = await placeHtmlInColumns(chunkHtml)
        if (!result) {
          flushPage()
          result = await placeHtmlInColumns(chunkHtml)
          if (result === 1) currentPage.column1.push(chunk)
          else if (result === 2) currentPage.column2.push(chunk)
          else {
            // 극단적으로 큰 경우 반복 분할
            const reChunks = await this.splitLargeGroupByBlocks(chunk, this.getAvailableHeight(currentPageNum))
            for (const c2 of reChunks) {
              const cHtml = this.renderGroupHTML(c2)
              const placed2 = await placeHtmlInColumns(cHtml)
              if (placed2 === 1) currentPage.column1.push(c2)
              else if (placed2 === 2) currentPage.column2.push(c2)
              else {
                flushPage()
                const finalPlace = await placeHtmlInColumns(cHtml)
                if (finalPlace === 1) currentPage.column1.push(c2)
                else currentPage.column2.push(c2)
              }
            }
          }
        } else {
          if (result === 1) currentPage.column1.push(chunk)
          else currentPage.column2.push(chunk)
        }
      }
    }

    if (this.hasContent(currentPage)) pages.push(currentPage)
    return pages
  }

  /**
   * 그룹들의 실제 높이 측정
   */
  async measureGroups(groups) {
    const measured = []
    
    for (const group of groups) {
      const html = this.renderGroupHTML(group)
      const height = await this.measurer.measureHeight(html)
      
      measured.push({
        ...group,
        measuredHeight: height
      })
    }
    
    return measured
  }

  // 레이아웃 래퍼 HTML
  wrapStart() {
    if (this.layoutMode === 'double') {
      return `<div style="column-count:2; column-gap:32px; column-rule:1px solid #e0e6ed; column-fill:balance; break-inside:auto;">`
    }
    return `<div>`
  }
  wrapEnd() { return `</div>` }

  /**
   * 그룹을 HTML로 렌더링
   */
  renderGroupHTML(group) {
    let html = ''
    
    if (group.type === 'passage-with-questions') {
      // 지문 헤더
      html += `<div style="margin-bottom: 8px; font-weight:600; color:#2563eb;">
        [${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.
      </div>`
      
      // 지문 내용
      if (group.passageHtml) {
        const clean = this.sanitizePassageHtml(group.passageHtml, group.passageText)
        html += `<div style="margin-bottom: 12px;">${clean}</div>`
      }
      
      // 문제들
      if (group.questions) {
        group.questions.forEach(q => {
          html += this.renderQuestion(q)
        })
      }
    } else if (group.type === 'standalone-question' || group.type === 'single') {
      group.questions.forEach(q => {
        html += this.renderQuestion(q)
      })
    } else if (group.type === 'passage-only') {
      // 분할된 지문만
      html += `<div style="margin-bottom: 8px; font-weight:600; color:#2563eb;">
        [${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.
      </div>`
      const clean = this.sanitizePassageHtml(group.passageHtml, group.passageText)
      html += `<div>${clean}</div>`
    } else if (group.type === 'questions-only') {
      // 분할된 문제들만
      group.questions.forEach(q => {
        html += this.renderQuestion(q)
      })
    }
    
    return html
  }

  /**
   * 개별 문제 렌더링
   */
  renderQuestion(question) {
    let html = `<div style="margin-bottom: 20px;">`
    
    // 문제 번호와 점수
    html += `<div style="margin-bottom: 8px;">
      <span style="font-weight: 600; color: #2563eb;">${question.displayNumber || ''}.</span>
      <span style="color: #606f7b; font-size: 0.875rem;">(${question.points || 5}점)</span>
    </div>`
    
    // 문제 텍스트
    html += `<div style="margin-bottom: 12px; line-height: 1.6;">${question.questionHtml || ''}</div>`
    
    // 선택지
    if (question.choices && question.choices.length > 0) {
      html += `<div style="padding-left: 16px;">`
      question.choices.forEach((choice, idx) => {
        const num = ['①', '②', '③', '④', '⑤'][idx] || `${idx + 1}.`
        html += `<div style="margin-bottom: 6px;">
          <span>${num}</span>
          <span style="margin-left: 8px;">${choice}</span>
        </div>`
      })
      html += `</div>`
    }
    
    html += `</div>`
    return html
  }

  /**
   * 큰 그룹을 여러 페이지로 분할
   */
  async splitLargeGroup(group, pageNum) {
    if (group.type !== 'passage-with-questions') {
      return [group] // 지문이 없는 그룹은 분할하지 않음
    }
    
    const availableHeight = this.getAvailableHeight(pageNum)
    const splitGroups = []
    
    // 지문이 너무 긴 경우
    const passageHeight = await this.measurer.measureHeight(
      `<div style="padding: 12px; background: #f8fafc; border: 1px solid #e0e6ed; border-radius: 6px;">
        ${group.passageHtml}
      </div>`
    )
    
    if (passageHeight > availableHeight * 0.7) {
      // 지문을 분할해야 함
      const splitPassages = await this.splitPassageContent(group.passageHtml, availableHeight * 0.6)
      
      // 첫 번째 부분: 지문만
      splitGroups.push({
        type: 'passage-only',
        passageId: group.passageId,
        passageHtml: splitPassages[0] + '<div style="text-align: right; margin-top: 10px; color: #666;">(계속)</div>',
        questionNumbers: group.questionNumbers
      })
      
      // 나머지 지문이 있다면
      if (splitPassages.length > 1) {
        splitGroups.push({
          type: 'passage-only',
          passageId: group.passageId,
          passageHtml: '<div style="margin-bottom: 10px; color: #666;">(이어서)</div>' + splitPassages[1],
          questionNumbers: group.questionNumbers
        })
      }
      
      // 문제들
      splitGroups.push({
        type: 'questions-only',
        questions: group.questions,
        questionNumbers: group.questionNumbers
      })
    } else {
      // 지문은 한 페이지에 들어가지만 문제까지 포함하면 넘침
      splitGroups.push({
        type: 'passage-only',
        passageId: group.passageId,
        passageHtml: group.passageHtml,
        questionNumbers: group.questionNumbers
      })
      
      splitGroups.push({
        type: 'questions-only',
        questions: group.questions,
        questionNumbers: group.questionNumbers
      })
    }
    
    return splitGroups
  }

  /**
   * 지문 내용을 적절한 크기로 분할
   */
  async splitPassageContent(passageHtml, maxHeight) {
    // 간단한 구현 - 실제로는 더 정교한 분할 필요
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = passageHtml
    
    const elements = Array.from(tempDiv.children)
    if (elements.length === 0) {
      // 단순 텍스트인 경우 중간에서 자르기
      const text = tempDiv.textContent || ''
      const midPoint = Math.floor(text.length / 2)
      
      return [
        text.substring(0, midPoint),
        text.substring(midPoint)
      ]
    }
    
    // 요소들을 절반으로 나누기
    const midIndex = Math.floor(elements.length / 2)
    const firstHalf = elements.slice(0, midIndex).map(el => el.outerHTML).join('')
    const secondHalf = elements.slice(midIndex).map(el => el.outerHTML).join('')
    
    return [firstHalf, secondHalf]
  }

  /**
   * 블록 기반 분할: 큰 그룹을 안전하게 쪼갠다
   */
  async splitLargeGroupByBlocks(group, maxPageHeightPx) {
    const parts = []
    if (group.type === 'passage-with-questions') {
      // 지문을 요소 단위로 분할
      const passageChunks = await this.splitPassageByElements(group.passageHtml, maxPageHeightPx * 0.9)
      passageChunks.forEach(chunk => {
        parts.push({ type: 'passage-only', passageId: group.passageId, passageHtml: chunk, questionNumbers: group.questionNumbers })
      })
      // 문제를 페이지 높이에 맞춰 묶음 분할
      const qGroups = await this.splitQuestionsByFit(group.questions, maxPageHeightPx)
      qGroups.forEach(qs => parts.push({ type: 'questions-only', questions: qs, questionNumbers: group.questionNumbers }))
      return parts
    }
    if (group.type === 'standalone-question' || group.type === 'single') {
      const qGroups = await this.splitQuestionsByFit(group.questions, maxPageHeightPx)
      return qGroups.map(qs => ({ type: 'standalone-question', questions: qs }))
    }
    return [group]
  }

  /**
   * 지문을 자식 노드 단위로 분할하여 높이에 맞추기
   */
  async splitPassageByElements(passageHtml, maxHeightPx) {
    // 1) 원본 파싱 + 장식 제거 + 테이블 언랩
    const sanitized = this.sanitizePassageHtml(passageHtml)
    const temp = document.createElement('div')
    temp.innerHTML = sanitized

    // 2) 문단 단위 조각 추출 (.paragraph 우선)
    const pieces = []

    const pushPiece = (html) => {
      if (!html) return
      // 각 조각을 block으로 강제 + 분리 금지
      pieces.push(`<div style=\"break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; margin-bottom:8px;\">${html}</div>`)
    }

    // a) 명시적 문단 클래스 우선
    const paragraphs = temp.querySelectorAll('.paragraph')
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => pushPiece(p.outerHTML))
    } else {
      // b) 테이블 내부 문단 탐색
      const tableParas = temp.querySelectorAll('td .paragraph, td p, td div')
      if (tableParas.length > 0) {
        tableParas.forEach(p => {
          // 실제 텍스트가 있는 것만
          const text = (p.textContent || '').trim()
          if (text.length > 0) pushPiece(p.outerHTML)
        })
      } else {
        // c) 일반 블록 요소 기준 분해
        const blocks = temp.querySelectorAll('p, li, div')
        if (blocks.length > 0) {
          blocks.forEach(b => {
            const txt = (b.textContent || '').trim()
            if (txt.length > 0) pushPiece(b.outerHTML)
          })
        } else {
          // d) 마지막 수단: 전체 텍스트를 문장 단위로 대략 분할
          const txt = (temp.textContent || '').trim()
          if (txt.length > 0) {
            const sentences = txt.split(/(?<=[\.!?\u3002\uFF01\uFF1F])\s+/)
            sentences.forEach(s => pushPiece(`<p>${s}</p>`))
          }
        }
      }
    }

    // 3) 높이 기준으로 조각들을 묶어 Chunk로 생성 (문단은 가능하면 그대로 유지, 필요한 경우에만 문단 내부 분할)
    const chunks = []
    let current = ''
    const wrapPassage = (content) => this.wrapStart() + `<div>${content}</div>` + this.wrapEnd()

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i]

      // 이미지 태그 단위 원자적 처리
      if (/^\s*<img\b/i.test(piece)) {
        const tryImg = current + piece
        const fitsImg = await this.measurer.willFit(wrapPassage(tryImg), maxHeightPx)
        if (fitsImg) {
          current = tryImg
        } else {
          if (current) chunks.push(current)
          // 이미지가 단독으로도 안 들어갈 경우: 다음 페이지(컬럼)로 넘김
          current = piece
        }
        continue
      }

      // 일반 문단: 먼저 통째로 시도
      const tryPara = current + piece
      const fitsPara = await this.measurer.willFit(wrapPassage(tryPara), maxHeightPx)
      if (fitsPara) {
        current = tryPara
        continue
      }

      // 통째로는 안 들어가면, 문단 내부에서 라인 기반으로 최소 분할
      // 문단 내부 이미지가 있으면 이미지 기준으로 나눔
      const imgSplit = piece.split(/(<img[^>]*>)/i).filter(Boolean)
      if (imgSplit.length > 1) {
        // 이미지/텍스트 파트 순서대로 추가, 텍스트 파트는 필요한 경우만 잘라서 넣음
        for (const part of imgSplit) {
          if (/^<img/i.test(part)) {
            const tryPart = current + part
            const fitsPart = await this.measurer.willFit(wrapPassage(tryPart), maxHeightPx)
            if (fitsPart) {
              current = tryPart
            } else {
              if (current) chunks.push(current)
              current = part
            }
          } else {
            const result = await this.cutTextHTMLToFit(part, maxHeightPx, current, wrapPassage)
            if (result.fitted) {
              current = result.current
              if (result.remaining) {
                // 현재 페이지를 마감하고 남은 텍스트는 다음 쪽에서 처리
                chunks.push(current)
                current = result.remaining
              }
            } else {
              // 전혀 못 넣는 경우: 현재를 마감하고 다음으로 전체 위임
              if (current) chunks.push(current)
              current = part
            }
          }
        }
        continue
      }

      // 이미지가 없는 순수 텍스트 문단: 필요한 만큼만 잘라서 현재에 넣고, 나머지는 다음으로
      const result = await this.cutTextHTMLToFit(piece, maxHeightPx, current, wrapPassage)
      if (result.fitted) {
        current = result.current
        if (result.remaining) {
          chunks.push(current)
          current = result.remaining
        }
      } else {
        if (current) chunks.push(current)
        current = piece
      }
    }
    if (current) chunks.push(current)

    // 4) 조각을 만들지 못했다면 원본 반환
    return chunks.length ? chunks : [passageHtml]
  }

  /**
   * 텍스트 HTML 조각을 현재 컨텐츠에 맞춰 잘라서 넣기
   * - currentHTML: 현재까지 누적된 컨텐츠
   * - pieceHTML: 추가할 텍스트 HTML (문단 내부 텍스트)
   * - wrap: 전체 측정용 래퍼 함수
   */
  async cutTextHTMLToFit(pieceHTML, maxHeightPx, currentHTML, wrap) {
    const clean = pieceHTML.trim()
    if (!clean) return { fitted: false }

    // 전체 시도 (이미 실패했을 수 있음)
    let tryAll = currentHTML + clean
    if (await this.measurer.willFit(wrap(tryAll), maxHeightPx)) {
      return { fitted: true, current: tryAll, remaining: '' }
    }

    // 텍스트만 추출하여 이진 탐색 (태그는 제거하고 plain으로 자른 뒤 문단 래퍼로 감싸서 보수적 분할)
    const tmp = document.createElement('div')
    tmp.innerHTML = clean
    const text = (tmp.textContent || '').trim()
    if (text.length === 0) return { fitted: false }

    let lo = 0, hi = text.length, best = 0
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const prefix = text.slice(0, mid)
      // 라인 수 추정: 평균 글꼴로 약 50자/라인, 1.8 line-height → 보수적으로 여유 반영
      // (실측으로 fit 여부를 확인하므로 여기선 candidate만 구성)
      const candidate = currentHTML + `<div>${this.escapeHtml(prefix)}</div>`
      const fits = await this.measurer.willFit(wrap(candidate), maxHeightPx)
      if (fits) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    if (best === 0) return { fitted: false }

    const head = `<div>${this.escapeHtml(text.slice(0, best))}</div>`
    const tailText = text.slice(best)
    const newCurrent = currentHTML + head
    const remaining = tailText.trim().length > 0 ? `<div>${this.escapeHtml(tailText)}</div>` : ''
    return { fitted: true, current: newCurrent, remaining }
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * 장식 제거 + 테이블 언랩: border/background/box-shadow 제거, table → div 블록으로 변환
   */
  sanitizePassageHtml(html, plainText = '') {
    try {
      const root = document.createElement('div')
      root.innerHTML = html || ''

      // 테이블을 블록으로 언랩
      const tables = Array.from(root.querySelectorAll('table'))
      for (const table of tables) {
        const replacement = document.createElement('div')
        const cells = table.querySelectorAll('td, th')
        if (cells.length > 0) {
          cells.forEach(cell => {
            const div = document.createElement('div')
            div.innerHTML = cell.innerHTML
            replacement.appendChild(div)
          })
        } else {
          // tbody/tr 구조이지만 실제 셀 없는 경우
          replacement.innerHTML = table.innerHTML
        }
        table.replaceWith(replacement)
      }

      // 스타일 제거 함수
      const stripStyles = (el) => {
        if (el.nodeType !== 1) return
        const style = el.getAttribute('style') || ''
        if (style) {
          // border/background/box-shadow/outline 제거
          const filtered = style
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !/^border/i.test(s) && !/^background/i.test(s) && !/^box-shadow/i.test(s) && !/^outline/i.test(s))
            .join('; ')
          if (filtered) el.setAttribute('style', filtered)
          else el.removeAttribute('style')
        }
        // class 이름으로 배경/보더 유추되는 경우 제거 (간단 휴리스틱)
        const cls = el.className || ''
        if (/(border|bg|table|box|panel)/i.test(cls)) {
          el.className = ''
        }
        Array.from(el.childNodes).forEach(stripStyles)
      }
      stripStyles(root)

      // 불필요한 wrapper를 최대한 간소화 (td/tr/tbody 잔재 제거)
      const unwrapTags = ['tbody', 'tr', 'td', 'th']
      unwrapTags.forEach(tag => {
        root.querySelectorAll(tag).forEach(node => {
          const container = document.createElement('div')
          container.innerHTML = node.innerHTML
          node.replaceWith(...Array.from(container.childNodes))
        })
      })

      const result = root.innerHTML
      if (result && result.trim().length > 0) return result
      // 비어 있으면 plainText 사용
      if (plainText) return `<div>${this.escapeHtml(plainText)}</div>`
      return ''
    } catch (e) {
      return html || ''
    }
  }

  /**
   * 문제들을 높이에 맞게 묶음으로 분할
   */
  async splitQuestionsByFit(questions, maxHeightPx) {
    const groups = []
    let batch = []
    let htmlAccum = this.wrapStart()
    for (let i = 0; i < questions.length; i++) {
      const qHtml = this.renderQuestion(questions[i])
      const trial = htmlAccum + qHtml + this.wrapEnd()
      const fits = await this.measurer.willFit(trial, maxHeightPx)
      if (fits) {
        batch.push(questions[i])
        htmlAccum += qHtml
      } else {
        if (batch.length > 0) groups.push(batch)
        batch = [questions[i]]
        htmlAccum = this.wrapStart() + qHtml
      }
    }
    if (batch.length > 0) groups.push(batch)
    return groups
  }

  /**
   * 현재 페이지의 남은 공간을 채우기 위해 그룹을 분할
   * firstChunk는 남은 공간에 넣고, 나머지는 restChunks로 다음 페이지에 배치
   */
  async splitGroupForRemaining(group, remainingPx, fullPagePx) {
    const result = { firstChunk: null, restChunks: [] }
    if (remainingPx < 40) return result // 남은 공간이 너무 적으면 생략

    if (group.type === 'passage-with-questions') {
      // 1) 지문을 남은 공간에 맞게 첫 청크 생성
      const passFirst = await this.splitPassageByElements(group.passageHtml, remainingPx)
      if (passFirst.length > 0) {
        result.firstChunk = { type: 'passage-only', passageId: group.passageId, passageHtml: passFirst[0], questionNumbers: group.questionNumbers }
      }
      // 2) 남은 지문 청크들을 모음
      const passRest = passFirst.slice(1)
      passRest.forEach(chunk => result.restChunks.push({ type: 'passage-only', passageId: group.passageId, passageHtml: chunk, questionNumbers: group.questionNumbers }))
      // 3) 질문들을 전체 페이지 기준으로 분할하여 rest에 추가
      const qGroups = await this.splitQuestionsByFit(group.questions || [], fullPagePx)
      qGroups.forEach(qs => result.restChunks.push({ type: 'questions-only', questions: qs, questionNumbers: group.questionNumbers }))
      return result
    }

    if (group.type === 'standalone-question' || group.type === 'single') {
      const qGroups = await this.splitQuestionsByFit(group.questions || [], remainingPx)
      if (qGroups.length > 0) {
        result.firstChunk = { type: 'standalone-question', questions: qGroups[0] }
        const rest = qGroups.slice(1)
        rest.forEach(qs => result.restChunks.push({ type: 'standalone-question', questions: qs }))
      }
      return result
    }

    // 기타 타입은 남은 공간에 시도하지 않음
    return result
  }

  /**
   * 빈 페이지 생성
   */
  createEmptyPage() {
    if (this.layoutMode === 'double') {
      return { column1: [], column2: [] }
    }
    return { items: [] }
  }

  /**
   * 페이지에 그룹 추가
   */
  addToPage(page, group) {
    if (this.layoutMode === 'double') {
      // 2단 레이아웃: 더 짧은 컬럼에 추가
      const col1Height = this.calculateColumnHeight(page.column1)
      const col2Height = this.calculateColumnHeight(page.column2)
      
      if (col1Height <= col2Height) {
        page.column1.push(group)
      } else {
        page.column2.push(group)
      }
    } else {
      page.items.push(group)
    }
  }

  /**
   * 페이지에 콘텐츠가 있는지 확인
   */
  hasContent(page) {
    if (this.layoutMode === 'double') {
      return page.column1.length > 0 || page.column2.length > 0
    }
    return page.items.length > 0
  }

  /**
   * 페이지의 현재 높이 계산
   */
  calculatePageHeight(page) {
    if (this.layoutMode === 'double') {
      return Math.max(
        this.calculateColumnHeight(page.column1),
        this.calculateColumnHeight(page.column2)
      )
    }
    return this.calculateColumnHeight(page.items)
  }

  /**
   * 컬럼의 높이 계산
   */
  calculateColumnHeight(items) {
    return items.reduce((sum, item) => sum + (item.measuredHeight || 0), 0)
  }

  /**
   * 사용 가능한 높이 계산
   */
  getAvailableHeight(pageNum) {
    return pageNum === 1 
      ? A4_CONFIG.FIRST_PAGE_HEIGHT 
      : A4_CONFIG.REGULAR_PAGE_HEIGHT
  }
}

/**
 * 메인 페이지네이션 함수
 */
export async function paginateContent(questions, layoutMode = 'single') {
  // 1. 문제들을 그룹으로 조직화
  const groups = ContentGrouper.createGroups(questions)
  
  // 2. 페이지로 분할
  const splitter = new PageSplitter(layoutMode)
  const pages = await splitter.splitIntoPages(groups)
  
  return pages
}
