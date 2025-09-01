// TinyMCE 공통 설정 및 도구 유틸리티
import katex from 'katex'

// 공통 에디터 설정
export const createCommonEditorConfig = (options = {}) => {
  const {
    height = 400,
    minHeight = 300,
    maxHeight = 800,
    readonly = false,
    showToolbar = true,
    enableMathTools = true,
    enableShapeTools = true
  } = options

  // MathJax 렌더링 비활성화 옵션 처리
  const shouldEnableMathTools = enableMathTools !== false

  const config = {
    height,
    min_height: minHeight,
    max_height: maxHeight,
    readonly,
    branding: false,
    promotion: false,
    menubar: showToolbar,
    statusbar: true,
    resize: true,
    language: 'en',

    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
      'nonbreaking', 'pagebreak', 'quickbars'
    ],
    toolbar: 'undo redo | formatselect | bold italic underline strikethrough | ' +
      'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
      'link image media | codesample | table',

    content_style: `
      body {
        font-family: 'Noto Sans KR', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        margin: 0 !important;
        padding: 0 !important;
      }
      .math-latex {
        text-align: center;
        margin: 12px 0;
        padding: 4px 6px;
        font-size: 14px;
        color: #495057;
        border-radius: 4px;
        display: inline-block;
      }
      .shape-wrap{ display: inline-block; margin: 8px 4px; }
    `,
    verify_html: false,
    extended_valid_elements: 'span[*],div[*],svg[*],circle[*],rect[*],polygon[*],line[*],text[*],*[*]',
    custom_elements: '~math-latex',

    setup: (editor) => {
      // MathJax 렌더링 비활성화 옵션 처리
      if (!shouldEnableMathTools) {
        // MathJax 렌더링을 비활성화하고 LaTeX 코드만 표시
        const renderMathInEditor = () => {
          console.log('에디터 내 MathJax 렌더링 비활성화됨 - LaTeX 코드만 표시')
        }

        // 에디터 초기화 (렌더링 없음)
        editor.on('init', () => {
          console.log('에디터 초기화 - MathJax 렌더링 비활성화')
        })

        // 편집 함수들을 에디터에 노출 (빈 함수)
        editor.renderMath = renderMathInEditor
        editor.enterMathEditMode = () => {}
      } else {
        // 기존 MathJax 렌더링 로직
        const renderMathInEditor = () => {
          try {
            const body = editor.getBody()
            if (!body) return
            body.querySelectorAll('span.math-latex').forEach(el => {
              let latex = el.getAttribute('data-latex')
              if (!latex) {
                const raw = (el.textContent || '').trim()
                const m = raw.match(/^\$(.*)\$$/s)
                latex = m ? m[1] : raw
                el.setAttribute('data-latex', latex)
              }
              el.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode: false })
            })
          } catch (e) {
            console.warn('KaTeX 렌더 실패:', e)
          }
        }

        // 수식 편집 모드 진입
        const enterMathEditMode = (mathElement) => {
          const mathId = 'math-' + Date.now()
          mathElement.setAttribute('data-math-id', mathId)

          // 편집 UI 표시 (컴포넌트에서 구현)
          if (window.mathEditCallback) {
            window.mathEditCallback(mathElement, mathId)
          }
        }

        // 에디터 초기화
        editor.on('init', () => {
          renderMathInEditor()

          // 수식 더블클릭 → 편집 모드 진입
          editor.on('DblClick', (e) => {
            const target = e.target
            let mathElement = null

            if (target.classList && target.classList.contains('math-latex')) {
              mathElement = target
            } else if (target.closest) {
              mathElement = target.closest('span.math-latex')
            }

            if (mathElement) {
              e.preventDefault()
              e.stopPropagation()
              enterMathEditMode(mathElement)
            }
          })
        })

        // 내용 변경 시 렌더링
        editor.on('SetContent keyup change input undo redo', () => {
          renderMathInEditor()
        })

        // 편집 함수들을 에디터에 노출
        editor.renderMath = renderMathInEditor
        editor.enterMathEditMode = enterMathEditMode
      }
    }
  }

  // 이미지 업로드 핸들러 추가
  if (options.enableImageUpload) {
    config.images_upload_handler = (blobInfo) => {
      return new Promise((resolve, reject) => {
        try {
          const reader = new FileReader()
          reader.onload = () => {
            const base64Data = reader.result
            resolve(base64Data)
          }
          reader.readAsDataURL(blobInfo.blob())
        } catch (error) {
          reject(error)
        }
      })
    }
  }

  return config
}

// 수식 삽입 유틸리티
export const insertMathToEditor = (editor, latex) => {
  if (!editor || !latex) return

  const html = `<span class="math-latex" data-latex="${latex}">$${latex}$</span>`
  editor.insertContent(html)

  // 수식 렌더링
  if (editor.renderMath) {
    editor.renderMath()
  }
}

// 도형 삽입 유틸리티
export const insertShapeToEditor = (editor, shapeData) => {
  if (!editor || !shapeData) return

  const { type, color, size, strokeWidth, text, latex } = shapeData

  let svg = ''
  const canvasSize = size || 100

  switch (type) {
    case 'circle':
      svg = `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${canvasSize/2}" cy="${canvasSize/2}" r="${(canvasSize-20)/2}"
                stroke="${color || '#000'}" stroke-width="${strokeWidth || 2}" fill="none" />
        ${text ? `<text x="${canvasSize/2}" y="${canvasSize/2}" text-anchor="middle" dominant-baseline="middle"
                fill="${color || '#000'}">${text}</text>` : ''}
        ${latex ? `<text x="${canvasSize/2}" y="${canvasSize/2 + 20}" text-anchor="middle" dominant-baseline="middle"
                fill="${color || '#000'}">$${latex}$</text>` : ''}
      </svg>`
      break

    case 'rectangle':
      svg = `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="${canvasSize-20}" height="${canvasSize-20}"
              stroke="${color || '#000'}" stroke-width="${strokeWidth || 2}" fill="none" />
        ${text ? `<text x="${canvasSize/2}" y="${canvasSize/2}" text-anchor="middle" dominant-baseline="middle"
                fill="${color || '#000'}">${text}</text>` : ''}
        ${latex ? `<text x="${canvasSize/2}" y="${canvasSize/2 + 20}" text-anchor="middle" dominant-baseline="middle"
                fill="${color || '#000'}">$${latex}$</text>` : ''}
      </svg>`
      break

    case 'triangle':
      const h = canvasSize - 20
      const w = h * 0.866
      const x = (canvasSize - w) / 2
      const y = 10
      svg = `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${x + w/2},${y} ${x},${y + h} ${x + w},${y + h}"
                 stroke="${color || '#000'}" stroke-width="${strokeWidth || 2}" fill="none" />
        ${text ? `<text x="${canvasSize/2}" y="${canvasSize/2}" text-anchor="middle" dominant-baseline="middle"
                fill="${color || '#000'}">${text}</text>` : ''}
        ${latex ? `<text x="${canvasSize/2}" y="${canvasSize/2 + 20}" text-anchor="middle" dominant-baseline="middle"
                fill="${color || '#000'}">$${latex}$</text>` : ''}
      </svg>`
      break

    default:
      svg = `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="${canvasSize-20}" height="${canvasSize-20}"
              stroke="${color || '#000'}" stroke-width="${strokeWidth || 2}" fill="none" />
      </svg>`
  }

  const html = `<div class="shape-wrap">${svg}</div>`
  editor.insertContent(html)
}

// API 키 처리 유틸리티
export const getTinyMCEApiKey = () => {
  const envApiKey = import.meta.env.VITE_TINYMCE_KEY || ''
  const cleanEnvApiKey = envApiKey ? envApiKey.replace(/%$/, '') : ''

  if (!cleanEnvApiKey) {
    console.warn('TinyMCE API 키가 설정되지 않았습니다. 무료 버전을 사용합니다.')
    return ''
  }

  return cleanEnvApiKey
}
