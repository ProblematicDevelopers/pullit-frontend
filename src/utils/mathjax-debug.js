/**
 * MathJax 디버깅 유틸리티
 */

export const debugMathJax = () => {
  console.log('=== MathJax 디버깅 정보 ===')
  
  // MathJax 상태 확인
  console.log('1. MathJax 로드 상태:')
  console.log('   - window.MathJax:', !!window.MathJax)
  console.log('   - MathJax.version:', window.MathJax?.version)
  console.log('   - MathJax.startup.document:', !!window.MathJax?.startup?.document)
  console.log('   - MathJax 설정:', window.MathJax?.config)
  
  // 렌더링된 요소 확인
  console.log('\n2. 렌더링된 요소:')
  const containers = document.querySelectorAll('mjx-container')
  console.log(`   - mjx-container 개수: ${containers.length}`)
  containers.forEach((container, index) => {
    console.log(`   - Container ${index + 1}:`, {
      visible: container.style.visibility !== 'hidden',
      display: container.style.display,
      content: container.textContent.substring(0, 50)
    })
  })
  
  // 수식 패턴 검색
  console.log('\n3. HTML 내 수식 패턴 검색:')
  const body = document.body.innerHTML
  
  const patterns = [
    { name: 'Inline math ($....$)', regex: /\$[^\$\n]+?\$/g },
    { name: 'Display math ($$....$$)', regex: /\$\$[\s\S]*?\$\$/g },
    { name: 'Inline math (\\(...\\))', regex: /\\\([^)]+\\\)/g },
    { name: 'Display math (\\[...\\])', regex: /\\\[[^\]]+\\\]/g }
  ]
  
  patterns.forEach(({ name, regex }) => {
    const matches = body.match(regex)
    if (matches && matches.length > 0) {
      console.log(`   - ${name}: ${matches.length}개 발견`)
      console.log(`     예시:`, matches.slice(0, 3))
    } else {
      console.log(`   - ${name}: 없음`)
    }
  })
  
  // item-card 내용 확인
  console.log('\n4. 문항 카드 내용:')
  const itemCards = document.querySelectorAll('.item-card')
  console.log(`   - 문항 카드 개수: ${itemCards.length}`)
  
  itemCards.forEach((card, index) => {
    if (index >= 3) return // 처음 3개만 확인
    
    const htmlContent = card.querySelector('.item-html')
    const textContent = card.querySelector('.item-text')
    const choices = card.querySelectorAll('.choice span')
    
    console.log(`   - Card ${index + 1}:`)
    if (htmlContent) {
      // 전체 HTML 내용 확인
      const fullHtml = htmlContent.innerHTML
      console.log('     HTML 길이:', fullHtml.length)
      console.log('     HTML 내용 (전체):', fullHtml)
      
      // 수식 패턴 체크
      const hasDollar = fullHtml.includes('$')
      const hasBackslash = fullHtml.includes('\\(') || fullHtml.includes('\\[')
      const hasMathML = fullHtml.includes('<math') || fullHtml.includes('</math>')
      const hasLatex = fullHtml.includes('\\frac') || fullHtml.includes('\\sqrt') || fullHtml.includes('\\sum')
      
      console.log('     수식 패턴 체크:')
      console.log('       - $ 기호 포함:', hasDollar)
      console.log('       - \\( 또는 \\[ 포함:', hasBackslash)
      console.log('       - MathML 포함:', hasMathML)
      console.log('       - LaTeX 명령어 포함:', hasLatex)
    }
    if (textContent) {
      console.log('     텍스트 내용:', textContent.textContent)
    }
    
    // 선택지 확인
    if (choices.length > 0) {
      console.log('     선택지 수식 체크:')
      choices.forEach((choice, i) => {
        const choiceHtml = choice.innerHTML
        if (choiceHtml.includes('$') || choiceHtml.includes('\\(') || choiceHtml.includes('\\[')) {
          console.log(`       - 선택지 ${i+1}: 수식 포함`)
          console.log(`         내용: ${choiceHtml}`)
        }
      })
    }
  })
  
  // 강제 렌더링 시도
  console.log('\n5. 강제 렌더링 시도...')
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([document.body])
      .then(() => {
        console.log('   - 렌더링 완료!')
        const newContainers = document.querySelectorAll('mjx-container')
        console.log(`   - 새로운 mjx-container 개수: ${newContainers.length}`)
      })
      .catch(err => {
        console.error('   - 렌더링 오류:', err)
      })
  }
}

// 전역 함수로 등록
window.debugMathJax = debugMathJax

export default debugMathJax