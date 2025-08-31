<template>
  <div class="tinymce-example">
    <div class="container py-4">
      <h2 class="mb-4">TinyMCE 공통 컴포넌트 사용 예시</h2>
      
      <!-- 기본 사용법 -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">기본 에디터</h5>
            </div>
            <div class="card-body">
              <TinyMCEEditor
                v-model="basicContent"
                :height="300"
                @editor-ready="onEditorReady"
                @editor-change="onEditorChange"
                @math-inserted="onMathInserted"
              />
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">미리보기</h5>
            </div>
            <div class="card-body">
              <div class="content-preview" v-html="basicContent"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 고급 사용법 -->
      <div class="row mb-4">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">고급 에디터 (커스텀 설정)</h5>
            </div>
            <div class="card-body">
              <TinyMCEEditor
                ref="advancedEditor"
                v-model="advancedContent"
                :height="400"
                :custom-config="customEditorConfig"
                :show-math-toolbar="true"
                @editor-ready="onAdvancedEditorReady"
                @editor-error="onEditorError"
              />
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">도구</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button 
                  @click="insertSampleMath"
                  class="btn btn-outline-primary btn-sm"
                >
                  샘플 수식 삽입
                </button>
                <button 
                  @click="getEditorContent"
                  class="btn btn-outline-secondary btn-sm"
                >
                  콘텐츠 가져오기
                </button>
                <button 
                  @click="setSampleContent"
                  class="btn btn-outline-success btn-sm"
                >
                  샘플 콘텐츠 설정
                </button>
                <button 
                  @click="toggleReadonly"
                  class="btn btn-outline-warning btn-sm"
                >
                  읽기 전용 토글
                </button>
              </div>
              
              <hr class="my-3">
              
              <div class="form-check">
                <input 
                  v-model="showMathToolbar" 
                  type="checkbox" 
                  class="form-check-input" 
                  id="showMathToolbar"
                >
                <label class="form-check-label" for="showMathToolbar">
                  수식 도구 표시
                </label>
              </div>
              
              <div class="form-check">
                <input 
                  v-model="isDisabled" 
                  type="checkbox" 
                  class="form-check-input" 
                  id="isDisabled"
                >
                <label class="form-check-label" for="isDisabled">
                  비활성화
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 읽기 전용 모드 -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">읽기 전용 모드</h5>
            </div>
            <div class="card-body">
              <TinyMCEEditor
                v-model="readonlyContent"
                :height="200"
                :readonly="true"
                :show-math-toolbar="false"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 상태 정보 -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">상태 정보</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>기본 에디터</h6>
                  <ul class="list-unstyled">
                    <li><strong>콘텐츠 길이:</strong> {{ basicContent.length }} 문자</li>
                    <li><strong>수식 개수:</strong> {{ (basicContent.match(/class="math-latex"/g) || []).length }}개</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h6>고급 에디터</h6>
                  <ul class="list-unstyled">
                    <li><strong>콘텐츠 길이:</strong> {{ advancedContent.length }} 문자</li>
                    <li><strong>수식 개수:</strong> {{ (advancedContent.match(/class="math-latex"/g) || []).length }}개</li>
                    <li><strong>에디터 준비됨:</strong> {{ advancedEditorReady ? '예' : '아니오' }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TinyMCEEditor from './TinyMCEEditor.vue'

export default {
  name: 'TinyMCEEditorExample',
  components: { TinyMCEEditor },
  data() {
    return {
      // 기본 에디터
      basicContent: '<p>기본 에디터입니다. 수식 버튼을 클릭하거나 <strong>Cmd+E</strong>를 눌러 수식을 삽입할 수 있습니다.</p>',
      
      // 고급 에디터
      advancedContent: '<p>고급 에디터입니다. 커스텀 설정과 다양한 기능을 사용할 수 있습니다.</p>',
      advancedEditorReady: false,
      
      // 읽기 전용 에디터
      readonlyContent: '<p>이것은 읽기 전용 모드입니다. 편집할 수 없습니다.</p><p>수식 예시: <span class="math-latex" data-latex="\\frac{a}{b}">\\frac{a}{b}</span></p>',
      
      // 설정
      showMathToolbar: true,
      isDisabled: false,
      
      // 커스텀 에디터 설정
      customEditorConfig: {
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
          'nonbreaking', 'pagebreak', 'quickbars', 'emoticons'
        ],
        toolbar: 'undo redo | formatselect | bold italic underline strikethrough | ' +
                'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
                'link image media | codesample | table | emoticons | help',
        content_style: `
          body {
            font-family: 'Noto Sans KR', Arial, sans-serif;
            font-size: 16px;
            line-height: 1.8;
            margin: 0 !important;
            padding: 0 !important;
          }
          .math-latex {
            text-align: center;
            margin: 16px 0;
            padding: 8px 12px;
            font-size: 16px;
            color: #495057;
            border-radius: 6px;
            display: inline-block;
            cursor: pointer;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
          }
          .math-latex:hover {
            background-color: #e9ecef;
            border-color: #dee2e6;
          }
        `
      }
    }
  },
  watch: {
    showMathToolbar(newVal) {
      // 동적으로 수식 도구 표시/숨김 (실제로는 컴포넌트 재렌더링이 필요할 수 있음)
      console.log('수식 도구 표시:', newVal)
    },
    
    isDisabled(newVal) {
      // 동적으로 비활성화 상태 변경
      console.log('에디터 비활성화:', newVal)
    }
  },
  methods: {
    // 기본 에디터 이벤트
    onEditorReady(editor) {
      console.log('기본 에디터 준비 완료:', editor)
    },
    
    onEditorChange(content) {
      console.log('에디터 내용 변경:', content.length, '문자')
    },
    
    onMathInserted(latex) {
      console.log('수식 삽입됨:', latex)
      this.$toast?.success(`수식이 삽입되었습니다: ${latex}`)
    },
    
    // 고급 에디터 이벤트
    onAdvancedEditorReady(editor) {
      console.log('고급 에디터 준비 완료:', editor)
      this.advancedEditorReady = true
    },
    
    onEditorError(error) {
      console.error('에디터 오류:', error)
      this.$toast?.error('에디터 오류가 발생했습니다.')
    },
    
    // 도구 메서드
    insertSampleMath() {
      const sampleLatex = '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
      const success = this.$refs.advancedEditor?.insertMathFromExternal(sampleLatex)
      
      if (success) {
        this.$toast?.success('샘플 수식이 삽입되었습니다.')
      } else {
        this.$toast?.error('수식 삽입에 실패했습니다.')
      }
    },
    
    getEditorContent() {
      const content = this.$refs.advancedEditor?.getContent()
      console.log('현재 에디터 콘텐츠:', content)
      this.$toast?.info('콘솔에서 콘텐츠를 확인하세요.')
    },
    
    setSampleContent() {
      const sampleContent = `
        <h2>샘플 콘텐츠</h2>
        <p>이것은 <strong>샘플 콘텐츠</strong>입니다.</p>
        <ul>
          <li>목록 항목 1</li>
          <li>목록 항목 2</li>
          <li>목록 항목 3</li>
        </ul>
        <p>수식 예시: <span class="math-latex" data-latex="\\int_0^1 x^2 dx">\\int_0^1 x^2 dx</span></p>
      `
      
      this.$refs.advancedEditor?.setContent(sampleContent)
      this.$toast?.success('샘플 콘텐츠가 설정되었습니다.')
    },
    
    toggleReadonly() {
      // readonly 속성은 컴포넌트에서 직접 변경할 수 없으므로
      // 실제 구현에서는 별도의 상태 관리가 필요할 수 있습니다
      this.$toast?.info('읽기 전용 모드는 컴포넌트 속성으로 설정하세요.')
    }
  }
}
</script>

<style scoped>
.tinymce-example {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.content-preview {
  min-height: 200px;
  padding: 15px;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow-y: auto;
}

.content-preview :deep(.math-latex) {
  text-align: center;
  margin: 8px 0;
  padding: 4px 8px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  display: inline-block;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.form-check {
  margin-bottom: 0.5rem;
}

.btn {
  font-size: 0.875rem;
}

.list-unstyled li {
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}
</style>
