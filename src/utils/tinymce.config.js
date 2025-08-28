/**
 * TinyMCE 에디터 기본 설정
 * CKEditor에서 TinyMCE로의 마이그레이션을 위한 설정
 */

export const tinymceDefaultConfig = {
  // 기본 에디터 설정
  height: 500,
  menubar: true,
  plugins: [
    +   'advlist','autolink','lists','link','image','charmap','preview',
    +   'anchor','searchreplace','visualblocks','code','fullscreen',
    +   'insertdatetime','media','table','help','wordcount','codesample',
    +   'nonbreaking','pagebreak','quickbars',
    +   'advtemplate' +
    'powerpaste'
  ],
  toolbar:
    + 'undo redo | formatselect | bold italic underline strikethrough | ' +
    'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +

    + 'link image media | template | codesample | table | help',


  // 한국어 설정 - Tiny Cloud CDN에서 자동으로 불러오기
  language: 'ko',
  verify_html: false,
  extended_valid_elements: 'span[*],div[*],svg[*],circle[*],rect[*],polygon[*],line[*],text[*],*[*]',
  custom_elements: '~math-latex',

  // 이미지 업로드 설정
  images_upload_url: '/api/upload/image',
  images_upload_handler: (blobInfo) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blobInfo.blob());
    });
  },
  // 콘텐츠 스타일 설정
  content_style: `
    body { font-family: 'Noto Sans KR', Arial, sans-serif; font-size: 14px; }
    .mce-content-body { max-width: 100%; }
  `,


  valid_children: '+body[style]',

  // 자동 저장 설정 (안전한 기본값)
  auto_save: false,

  // 에디터 초기화 후 콜백
  setup: function (editor) {
    editor.on('init', function () {
      console.log('TinyMCE 에디터가 초기화되었습니다.');
    });

    editor.on('change', function () {
      console.log('에디터 내용이 변경되었습니다.');
    });
  }
};

// 특정 용도별 설정
export const tinymceExamConfig = {
  ...tinymceDefaultConfig,
  height: 300,
  plugins: [
    'advlist','autolink','lists','link','image','charmap','preview',
     'anchor','searchreplace','visualblocks','code','fullscreen',
     'insertdatetime','media','table','help','wordcount','codesample',
     'paste','template','textpattern','nonbreaking','pagebreak','quickbars'
  ],
  toolbar: 'undo redo | formatselect | ' +
    'bold italic underline | alignleft aligncenter ' +
    'alignright | bullist numlist | link image | help',

  // 시험 문제 작성에 최적화된 설정
  content_style: `
    body { font-family: 'Noto Sans KR', Arial, sans-serif; font-size: 16px; line-height: 1.6; }
    .question { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007cba; }
    .answer { margin-left: 20px; padding: 10px; background-color: #f9f9f9; }
  `
};

export const tinymceReportConfig = {
  ...tinymceDefaultConfig,
  height: 600,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount',
    'emoticons', 'template', 'quickbars', 'codesample'
  ],
  toolbar: 'undo redo | formatselect | ' +
    'bold italic backcolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | image media table | code | help',

  // 리포트 작성에 최적화된 설정
  content_style: `
    body { font-family: 'Noto Sans KR', Arial, sans-serif; font-size: 14px; line-height: 1.8; }
    .report-section { margin-bottom: 25px; }
    .report-title { font-size: 18px; font-weight: bold; color: #333; }
    .report-content { margin-top: 10px; }
  `
};

export default tinymceDefaultConfig;
