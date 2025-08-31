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
  }

  create() {
    if (this.container) return this.container

    const container = document.createElement('div')
    container.id = 'pdf-measurement-container'
    
    // A4 페이지와 동일한 크기로 설정
    const width = this.layoutMode === 'double' 
      ? (A4_CONFIG.CONTENT_WIDTH / 2 - 10) // 2단일 때는 절반 (간격 제외)
      : A4_CONFIG.CONTENT_WIDTH
    
    container.style.cssText = `
      position: fixed;
      top: -99999px;
      left: -99999px;
      width: ${width}px;
      visibility: hidden;
      font-family: 'Noto Sans KR', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      background: white;
      padding: 0;
      margin: 0;
    `
    
    document.body.appendChild(container)
    this.container = container
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
    const container = this.create()
    
    // HTML 설정
    container.innerHTML = htmlContent
    
    // DOM 업데이트 대기
    await nextTick()
    
    // 브라우저 리플로우 강제
    void container.offsetHeight
    
    // 실제 높이 측정
    const height = container.scrollHeight
    
    // 내용 초기화
    container.innerHTML = ''
    
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
  }

  /**
   * 그룹들을 페이지로 분할
   */
  async splitIntoPages(groups) {
    const pages = []
    let currentPage = this.createEmptyPage()
    let currentPageNum = 1
    
    // 각 그룹의 실제 높이 측정
    const measuredGroups = await this.measureGroups(groups)
    
    for (const group of measuredGroups) {
      const availableHeight = this.getAvailableHeight(currentPageNum)
      
      // 현재 페이지의 사용된 높이 계산
      const currentHeight = this.calculatePageHeight(currentPage)
      
      if (currentHeight + group.measuredHeight > availableHeight) {
        // 현재 페이지가 가득 참
        if (this.hasContent(currentPage)) {
          pages.push(currentPage)
          currentPage = this.createEmptyPage()
          currentPageNum++
        }
        
        // 그룹이 한 페이지보다 큰 경우 분할 필요
        if (group.measuredHeight > this.getAvailableHeight(currentPageNum)) {
          const splitGroups = await this.splitLargeGroup(group, currentPageNum)
          
          for (const splitGroup of splitGroups) {
            const splitHeight = splitGroup.measuredHeight || 
              await this.measurer.measureHeight(this.renderGroupHTML(splitGroup))
            
            if (this.calculatePageHeight(currentPage) + splitHeight > this.getAvailableHeight(currentPageNum)) {
              if (this.hasContent(currentPage)) {
                pages.push(currentPage)
                currentPage = this.createEmptyPage()
                currentPageNum++
              }
            }
            
            this.addToPage(currentPage, splitGroup)
          }
        } else {
          // 그룹을 현재 페이지에 추가
          this.addToPage(currentPage, group)
        }
      } else {
        // 현재 페이지에 추가 가능
        this.addToPage(currentPage, group)
      }
    }
    
    // 마지막 페이지 추가
    if (this.hasContent(currentPage)) {
      pages.push(currentPage)
    }
    
    // 정리
    this.measurer.destroy()
    
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

  /**
   * 그룹을 HTML로 렌더링
   */
  renderGroupHTML(group) {
    let html = ''
    
    if (group.type === 'passage-with-questions') {
      // 지문 헤더
      html += `<div style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px;">
        [${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.
      </div>`
      
      // 지문 내용
      if (group.passageHtml) {
        html += `<div style="padding: 12px; background: #f8fafc; border: 1px solid #e0e6ed; border-radius: 6px; margin-bottom: 16px;">
          ${group.passageHtml}
        </div>`
      }
      
      // 문제들
      if (group.questions) {
        group.questions.forEach(q => {
          html += this.renderQuestion(q)
        })
      }
    } else if (group.type === 'standalone-question') {
      group.questions.forEach(q => {
        html += this.renderQuestion(q)
      })
    } else if (group.type === 'passage-only') {
      // 분할된 지문만
      html += `<div style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px;">
        [${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.
      </div>`
      html += `<div style="padding: 12px; background: #f8fafc; border: 1px solid #e0e6ed; border-radius: 6px;">
        ${group.passageHtml}
      </div>`
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