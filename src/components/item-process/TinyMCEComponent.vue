<template>
  <div class="tinymce-editor">
    <!-- API 키가 유효하지 않을 때 표시할 경고 메시지 -->
    <div v-if="!isApiKeyValid" class="api-key-warning">
      <div class="warning-content">
        <i class="warning-icon">⚠️</i>
        <div>
          <strong>TinyMCE API 키가 설정되지 않았습니다</strong>
          <p>환경 변수 VITE_TINYMCE_KEY를 설정하거나 Tiny Cloud에서 API 키를 발급받으세요.</p>
          <a href="https://www.tiny.cloud/auth/signup/" target="_blank" rel="noopener noreferrer" class="signup-link">
            무료 API 키 발급받기
          </a>
        </div>
      </div>
    </div>

    <!-- 에디터 컴포넌트 -->
    <Editor
      v-else
      :api-key="apiKey"
      v-model="editorContent"
      :init="editorConfig"
      @onInit="onEditorInit"
      @onChange="onEditorChange"
      @onBlur="onEditorBlur"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Editor from '@tinymce/tinymce-vue'

// Props 정의
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: [String, Number],
    default: 400
  },
  placeholder: {
    type: String,
    default: '내용을 입력하세요...'
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  apiKey: {
    type: String,
    default: ''
  }
})

// Emits 정의
const emit = defineEmits(['update:modelValue', 'change', 'blur', 'init', 'error'])

// 반응형 데이터
const editorContent = ref(props.modelValue)
const editorInstance = ref(null)
const isApiKeyValid = ref(false)

// API 키 계산 (props에서 받거나 환경 변수에서 가져오기)
const finalApiKey = computed(() => {
  // TinyMCE 공식 문서에 따라 환경 변수 이름 확인
  const envApiKey = import.meta.env.VITE_TINYMCE_KEY ||
                   import.meta.env.VITE_TINYMCE_API_KEY ||
                   import.meta.env.VUE_APP_TINYMCE_API_KEY || ''

  // API 키가 없으면 기본값 사용 (TinyMCE는 무료 버전도 제공)
  if (!envApiKey && !props.apiKey) {
    console.warn('TinyMCE API 키가 설정되지 않았습니다. 무료 버전을 사용합니다.')
    return ''
  }

  return props.apiKey || envApiKey
})

// 에디터 설정
const editorConfig = computed(() => ({
  height: props.height,
  language: 'ko-KR', // TinyMCE 공식 언어 코드 형식
  placeholder: props.placeholder,
  readonly: props.readonly, // 이 값이 제대로 전달되는지 확인 필요
  menubar: props.showToolbar,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
    'paste', 'textpattern', 'nonbreaking', 'pagebreak', 'quickbars'
  ],
  toolbar: props.showToolbar ? [
    'undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify',
    'bullist numlist outdent indent | link image media table | codesample code | fullscreen'
  ].join(' | ') : false,
  content_style: `
    body {
      font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    .math {
      font-family: 'KaTeX_Main', serif;
      text-align: center;
      margin: 10px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    table td, table th {
      border: 1px solid #ddd;
      padding: 8px;
    }
    table th {
      background-color: #f2f2f2;
    }
  `,
  setup: (editor) => {
    editorInstance.value = editor

    // 에디터 초기화 성공 이벤트
    editor.on('init', () => {
      console.log('TinyMCE 에디터 초기화 성공')
      console.log('에디터 설정:', {
        readonly: props.readonly,
        apiKey: finalApiKey.value,
        propsReadonly: props.readonly
      })

      // readonly 상태 설정
      try {
        if (typeof editor.setMode === 'function') {
          if (props.readonly) {
            editor.setMode('readonly')
            console.log('에디터를 readonly 모드로 설정했습니다')
          } else {
            editor.setMode('design')
            console.log('에디터를 편집 모드로 설정했습니다')
          }
        } else {
          // setMode가 없는 경우 readonly 속성으로 설정
          if (editor.readonly !== undefined) {
            editor.readonly = props.readonly
            console.log(`에디터 readonly 속성을 ${props.readonly}로 설정했습니다`)
          } else {
            console.log('setMode와 readonly 속성을 사용할 수 없습니다')
          }
        }
      } catch (error) {
        console.warn('readonly 상태 설정 중 오류가 발생했습니다:', error)
      }

      emit('init', editor)
    })

    // 에디터 에러 이벤트
    editor.on('error', (e) => {
      console.error('TinyMCE 에러 발생:', e)
      emit('error', e)
    })

    // 수식 입력 버튼 추가
    editor.ui.registry.addButton('math', {
      text: '수식',
      tooltip: 'LaTeX 수식 입력',
      onAction: () => {
        showMathDialog()
      }
    })

    // 수식 입력 버튼을 툴바에 추가
    editor.ui.registry.addMenuItem('math', {
      text: '수식 입력',
      onAction: () => {
        showMathDialog()
      }
    })
  },
  // 파일 업로드 설정
  images_upload_url: '/api/upload/image',
  images_upload_handler: (blobInfo) => {
    return handleImageUpload(blobInfo)
  },
  // 자동 저장 설정 (안전한 기본값)
  auto_save: false,
  // 붙여넣기 설정 (안전한 기본값)
  paste_data_images: false,
  paste_as_text: true,
  // 코드 샘플 설정
  codesample_languages: [
    { text: 'HTML/XML', value: 'markup' },
    { text: 'JavaScript', value: 'javascript' },
    { text: 'CSS', value: 'css' },
    { text: 'PHP', value: 'php' },
    { text: 'Python', value: 'python' },
    { text: 'Java', value: 'java' },
    { text: 'C++', value: 'cpp' },
    { text: 'C#', value: 'csharp' },
    { text: 'SQL', value: 'sql' }
  ]
}))

// API 키 유효성 검사
const validateApiKey = () => {
  const apiKey = finalApiKey.value
  isApiKeyValid.value = apiKey &&
                        apiKey.trim() !== '' &&
                        apiKey !== 'your-api-key-here' &&
                        apiKey.length > 10 // 기본적인 길이 검증

  if (!isApiKeyValid.value) {
    console.warn('TinyMCE API 키가 유효하지 않습니다:', {
      apiKey: apiKey,
      message: '환경 변수 VITE_TINYMCE_KEY를 설정하거나 Tiny Cloud에서 API 키를 발급받으세요.'
    })
  } else {
    console.log('TinyMCE API 키가 유효합니다')
  }
}

// 에디터 이벤트 핸들러
const onEditorInit = () => {
  console.log('TinyMCE 에디터가 초기화되었습니다.')
}

const onEditorChange = () => {
  emit('change', editorContent.value)
}

const onEditorBlur = () => {
  emit('blur', editorContent.value)
}

// 수식 입력 다이얼로그
const showMathDialog = () => {
  const math = prompt('LaTeX 수식을 입력하세요:\n\n예시:\nx^2 + y^2 = r^2\n\\frac{a}{b}\n\\sqrt{x}')
  if (math && math.trim()) {
    insertMath(math.trim())
  }
}

// 수식 삽입
const insertMath = (math) => {
  if (editorInstance.value) {
    try {
      // KaTeX가 있다면 렌더링, 없다면 원본 LaTeX 표시
      let mathHtml
      if (typeof window.katex !== 'undefined') {
        const rendered = window.katex.renderToString(math, {
          throwOnError: false,
          displayMode: true
        })
        mathHtml = `<div class="math" style="text-align: center; margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">${rendered}</div>`
      } else {
        mathHtml = `<div class="math" style="text-align: center; margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; font-family: monospace;">$${math}$</div>`
      }

      editorInstance.value.insertContent(mathHtml)
    } catch (error) {
      console.error('수식 삽입 오류:', error)
      // 오류가 발생해도 원본 LaTeX를 삽입
      const mathHtml = `<div class="math" style="text-align: center; margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; font-family: monospace;">$${math}$</div>`
      editorInstance.value.insertContent(mathHtml)
    }
  }
}

// 이미지 업로드 처리
const handleImageUpload = async (blobInfo) => {
  try {
    // 실제 구현에서는 서버로 파일을 업로드
    // 여기서는 base64로 변환하여 반환
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result)
      }
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'))
      }
      reader.readAsDataURL(blobInfo.blob())
    })
  } catch (error) {
    console.error('이미지 업로드 오류:', error)
    throw error
  }
}

// 외부에서 호출할 수 있는 메서드들
const focus = () => {
  if (editorInstance.value) {
    editorInstance.value.focus()
  }
}

const getContent = () => {
  return editorContent.value
}

const setContent = (content) => {
  editorContent.value = content
  if (editorInstance.value) {
    editorInstance.value.setContent(content)
  }
}

const insertContent = (content) => {
  if (editorInstance.value) {
    editorInstance.value.insertContent(content)
  }
}

const isDirty = () => {
  return editorInstance.value ? editorInstance.value.isDirty() : false
}

// Props 변경 감지
watch(() => props.modelValue, (newVal) => {
  if (newVal !== editorContent.value) {
    editorContent.value = newVal
  }
})

watch(editorContent, (newVal) => {
  emit('update:modelValue', newVal)
})

watch(() => props.height, (newVal) => {
  if (editorInstance.value) {
    editorInstance.value.theme.resizeTo(null, newVal)
  }
})

watch(() => props.readonly, (newVal) => {
  if (editorInstance.value) {
    editorInstance.value.setMode(newVal ? 'readonly' : 'design')
  }
})

// 컴포넌트 마운트 시 실행
onMounted(() => {
  // API 키 유효성 검사
  validateApiKey()

  // 환경 변수 로딩 확인
  console.log('TinyMCE 환경 변수 확인:', {
    'VITE_TINYMCE_KEY': import.meta.env.VITE_TINYMCE_KEY,
    'VITE_TINYMCE_API_KEY': import.meta.env.VITE_TINYMCE_API_KEY,
    'VUE_APP_TINYMCE_API_KEY': import.meta.env.VUE_APP_TINYMCE_API_KEY,
    'MODE': import.meta.env.MODE,
    'DEV': import.meta.env.DEV,
    'finalApiKey': finalApiKey.value,
    'propsReadonly': props.readonly
  })

  // readonly props 값 확인
  console.log('Props readonly 값:', props.readonly)
  console.log('Props 타입:', typeof props.readonly)

  // API 키가 없어도 에디터가 작동하는지 확인
  if (!finalApiKey.value) {
    console.log('API 키가 없지만 TinyMCE 무료 버전을 시도합니다.')
  }
})

// 외부에서 사용할 수 있는 메서드들을 expose
defineExpose({
  focus,
  getContent,
  setContent,
  insertContent,
  isDirty
})
</script>

<style scoped>
.tinymce-editor {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

/* API 키 경고 메시지 스타일 */
.api-key-warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-content strong {
  color: #856404;
  font-size: 16px;
  margin-bottom: 8px;
  display: block;
}

.warning-content p {
  color: #856404;
  margin: 8px 0;
  line-height: 1.5;
}

.signup-link {
  display: inline-block;
  background: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  margin-top: 10px;
  transition: background-color 0.2s;
}

.signup-link:hover {
  background: #0056b3;
  color: white;
  text-decoration: none;
}

/* TinyMCE 에디터 스타일링 */
:deep(.tox-tinymce) {
  border: none !important;
  border-radius: 8px;
}

:deep(.tox-toolbar) {
  background-color: #f8f9fa !important;
  border-bottom: 1px solid #dee2e6 !important;
}

:deep(.tox-edit-area) {
  background-color: white !important;
}

:deep(.tox-edit-area__iframe) {
  background-color: white !important;
}

:deep(.tox-statusbar) {
  background-color: #f8f9fa !important;
  border-top: 1px solid #dee2e6 !important;
}

:deep(.tox-menubar) {
  background-color: #f8f9fa !important;
  border-bottom: 1px solid #dee2e6 !important;
}

:deep(.tox-toolbar__group) {
  padding: 0 5px !important;
}

:deep(.tox-tbtn) {
  margin: 2px !important;
}

:deep(.tox-tbtn:hover) {
  background-color: #e9ecef !important;
}

:deep(.tox-tbtn--enabled) {
  background-color: #007bff !important;
  color: white !important;
}

:deep(.tox-tbtn--enabled:hover) {
  background-color: #0056b3 !important;
}
</style>
