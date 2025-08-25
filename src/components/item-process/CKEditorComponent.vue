<template>
  <div>
    <h2>CKEditor 5 테스트</h2>
    <ckeditor :editor="editor" v-model="editorData" :config="editorConfig"></ckeditor>
    <div class="output">
      <h3>에디터 내용:</h3>
      <div v-html="editorData"></div>
    </div>
  </div>
</template>

<script>
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/ko'; // 한국어 언어팩

import CKEditor from '@ckeditor/ckeditor5-vue';

// MathJax 플러그인 설치 및 설정은 별도로 필요합니다.
// 예시로만 보여드리며, 실제 프로젝트에서는 해당 플러그인을 설치 후 import 해야 합니다.
// import MathType from '@wiris/mathtype-ckeditor5';

export default {
  name: 'CKEditorComponent',
  components: {
    ckeditor: CKEditor.component
  },
  data() {
    return {
      editor: ClassicEditor,
      editorData: '<h1>수식 및 텍스트 편집 테스트</h1><p>다음 수식을 수정해 보세요.</p><p>$$x^2 + y^2 = r^2$$</p>',
      editorConfig: {
        language: 'ko',
        // toolbar: {
        //   items: [
        //     'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
        //     'insertTable', '|', 'undo', 'redo', 'MathType'
        //   ]
        // },
        // plugins: [
        //   // MathType 또는 KaTeX/MathJax 플러그인 추가
        // ]
      }
    };
  }
}
</script>

<style scoped>
.output {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
h2, h3 {
  color: #333;
}
</style>
