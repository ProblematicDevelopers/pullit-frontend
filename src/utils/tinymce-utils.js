/**
 * TinyMCE 에디터 유틸리티 함수들
 * CKEditor에서 TinyMCE로의 마이그레이션을 위한 헬퍼 함수들
 */

/**
 * TinyMCE 에디터 인스턴스를 안전하게 가져오는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {Object|null} TinyMCE 에디터 인스턴스 또는 null
 */
export function getTinyMCEInstance(editorId) {
  if (typeof window.tinymce === 'undefined') {
    console.warn('TinyMCE가 로드되지 않았습니다.');
    return null;
  }

  try {
    return window.tinymce.get(editorId);
  } catch (error) {
    console.error('TinyMCE 에디터 인스턴스를 가져오는 중 오류 발생:', error);
    return null;
  }
}

/**
 * TinyMCE 에디터 내용을 가져오는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {string} 에디터 내용
 */
export function getTinyMCEContent(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return '';
  }

  try {
    return editor.getContent();
  } catch (error) {
    console.error('에디터 내용을 가져오는 중 오류 발생:', error);
    return '';
  }
}

/**
 * TinyMCE 에디터 내용을 설정하는 함수
 * @param {string} editorId - 에디터 ID
 * @param {string} content - 설정할 내용
 */
export function setTinyMCEContent(editorId, content) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    editor.setContent(content);
  } catch (error) {
    console.error('에디터 내용을 설정하는 중 오류 발생:', error);
  }
}

/**
 * TinyMCE 에디터 내용을 HTML로 가져오는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {string} HTML 내용
 */
export function getTinyMCEHTML(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return '';
  }

  try {
    return editor.getContent({ format: 'html' });
  } catch (error) {
    console.error('HTML 내용을 가져오는 중 오류 발생:', error);
    return '';
  }
}

/**
 * TinyMCE 에디터 내용을 텍스트로 가져오는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {string} 텍스트 내용
 */
export function getTinyMCEText(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return '';
  }

  try {
    return editor.getContent({ format: 'text' });
  } catch (error) {
    console.error('텍스트 내용을 가져오는 중 오류 발생:', error);
    return '';
  }
}

/**
 * TinyMCE 에디터가 준비되었는지 확인하는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {boolean} 에디터 준비 상태
 */
export function isTinyMCEReady(editorId) {
  const editor = getTinyMCEInstance(editorId);
  return editor && editor.initialized;
}

/**
 * TinyMCE 에디터의 현재 모드를 확인하는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {string} 에디터 모드 ('design' 또는 'readonly')
 */
export function getTinyMCEMode(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return 'design';
  }

  try {
    // TinyMCE 6+ 에서는 getMode가 없을 수 있음
    if (typeof editor.getMode === 'function') {
      return editor.getMode();
    }

    // 대안: readonly 속성 확인
    if (editor.readonly !== undefined) {
      return editor.readonly ? 'readonly' : 'design';
    }

    // 기본값
    return 'design';
  } catch (error) {
    console.error('에디터 모드 확인 중 오류 발생:', error);
    return 'design';
  }
}

/**
 * TinyMCE 에디터를 읽기 전용으로 설정하는 함수
 * @param {string} editorId - 에디터 ID
 * @param {boolean} readonly - 읽기 전용 여부
 */
export function setTinyMCEReadonly(editorId, readonly) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    if (typeof editor.setMode === 'function') {
      editor.setMode(readonly ? 'readonly' : 'design');
    } else if (editor.readonly !== undefined) {
      editor.readonly = readonly;
    } else {
      console.warn('에디터 모드 설정을 지원하지 않습니다');
    }
  } catch (error) {
    console.error('에디터 읽기 전용 모드 설정 중 오류 발생:', error);
  }
}

/**
 * TinyMCE 에디터를 비활성화/활성화하는 함수
 * @param {string} editorId - 에디터 ID
 * @param {boolean} disabled - 비활성화 여부
 */
export function setTinyMCEDisabled(editorId, disabled) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    if (typeof editor.setMode === 'function') {
      if (disabled) {
        editor.setMode('readonly');
      } else {
        editor.setMode('design');
      }
    } else if (editor.readonly !== undefined) {
      editor.readonly = disabled;
    } else {
      console.warn('에디터 모드 설정을 지원하지 않습니다');
    }
  } catch (error) {
    console.error('에디터 비활성화 설정 중 오류 발생:', error);
  }
}

/**
 * TinyMCE 에디터 내용을 지우는 함수
 * @param {string} editorId - 에디터 ID
 */
export function clearTinyMCEContent(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    editor.setContent('');
  } catch (error) {
    console.error('에디터 내용을 지우는 중 오류 발생:', error);
  }
}

/**
 * TinyMCE 에디터 내용이 변경되었는지 확인하는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {boolean} 내용 변경 여부
 */
export function isTinyMCEContentChanged(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return false;
  }

  try {
    return editor.isDirty();
  } catch (error) {
    console.error('에디터 변경 상태 확인 중 오류 발생:', error);
    return false;
  }
}

/**
 * TinyMCE 에디터 내용을 저장하는 함수
 * @param {string} editorId - 에디터 ID
 */
export function saveTinyMCEContent(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    editor.save();
  } catch (error) {
    console.error('에디터 내용 저장 중 오류 발생:', error);
  }
}

/**
 * TinyMCE 에디터 내용을 복사하는 함수
 * @param {string} editorId - 에디터 ID
 */
export function copyTinyMCEContent(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    const content = editor.getContent();
    navigator.clipboard.writeText(content).then(() => {
      console.log('에디터 내용이 클립보드에 복사되었습니다.');
    }).catch(err => {
      console.error('클립보드 복사 실패:', err);
    });
  } catch (error) {
    console.error('에디터 내용 복사 중 오류 발생:', error);
  }
}

/**
 * TinyMCE 에디터 내용을 붙여넣는 함수
 * @param {string} editorId - 에디터 ID
 * @param {string} content - 붙여넣을 내용
 */
export function pasteTinyMCEContent(editorId, content) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    editor.insertContent(content);
  } catch (error) {
    console.error('에디터 내용 붙여넣기 중 오류 발생:', error);
  }
}

/**
 * TinyMCE 에디터에서 선택된 텍스트를 가져오는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {string} 선택된 텍스트
 */
export function getTinyMCESelectedText(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return '';
  }

  try {
    return editor.selection.getContent({ format: 'text' });
  } catch (error) {
    console.error('선택된 텍스트를 가져오는 중 오류 발생:', error);
    return '';
  }
}

/**
 * TinyMCE 에디터에서 선택된 HTML을 가져오는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {string} 선택된 HTML
 */
export function getTinyMCESelectedHTML(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return '';
  }

  try {
    return editor.selection.getContent({ format: 'html' });
  } catch (error) {
    console.error('선택된 HTML을 가져오는 중 오류 발생:', error);
    return '';
  }
}

/**
 * TinyMCE 에디터에서 특정 명령을 실행하는 함수
 * @param {string} editorId - 에디터 ID
 * @param {string} command - 실행할 명령
 * @param {boolean} showUI - UI 표시 여부
 * @param {*} value - 명령 값
 */
export function execTinyMCECommand(editorId, command, showUI = false, value = null) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    editor.execCommand(command, showUI, value);
  } catch (error) {
    console.error(`명령 실행 중 오류 발생 (${command}):`, error);
  }
}

/**
 * TinyMCE 에디터에서 특정 플러그인이 로드되었는지 확인하는 함수
 * @param {string} editorId - 에디터 ID
 * @param {string} pluginName - 플러그인 이름
 * @returns {boolean} 플러그인 로드 여부
 */
export function isTinyMCEPluginLoaded(editorId, pluginName) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return false;
  }

  try {
    return editor.plugins && editor.plugins[pluginName];
  } catch (error) {
    console.error('플러그인 확인 중 오류 발생:', error);
    return false;
  }
}

/**
 * TinyMCE 에디터 내용의 단어 수를 계산하는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {number} 단어 수
 */
export function getTinyMCEContentWordCount(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return 0;
  }

  try {
    const content = editor.getContent({ format: 'text' });
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  } catch (error) {
    console.error('단어 수 계산 중 오류 발생:', error);
    return 0;
  }
}

/**
 * TinyMCE 에디터 내용의 문자 수를 계산하는 함수
 * @param {string} editorId - 에디터 ID
 * @returns {number} 문자 수
 */
export function getTinyMCEContentCharCount(editorId) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return 0;
  }

  try {
    const content = editor.getContent({ format: 'text' });
    return content.length;
  } catch (error) {
    console.error('문자 수 계산 중 오류 발생:', error);
    return 0;
  }
}

/**
 * TinyMCE 에디터 내용을 검색하는 함수
 * @param {string} editorId - 에디터 ID
 * @param {string} searchText - 검색할 텍스트
 * @param {boolean} caseSensitive - 대소문자 구분 여부
 * @returns {Array} 검색 결과 배열
 */
export function searchTinyMCEContent(editorId, searchText, caseSensitive = false) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return [];
  }

  try {
    const content = editor.getContent({ format: 'text' });
    const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
    const matches = content.match(regex);
    return matches || [];
  } catch (error) {
    console.error('내용 검색 중 오류 발생:', error);
    return [];
  }
}

/**
 * TinyMCE 에디터 내용을 교체하는 함수
 * @param {string} editorId - 에디터 ID
 * @param {string} searchText - 검색할 텍스트
 * @param {string} replaceText - 교체할 텍스트
 * @param {boolean} caseSensitive - 대소문자 구분 여부
 * @returns {number} 교체된 횟수
 */
export function replaceTinyMCEContent(editorId, searchText, replaceText, caseSensitive = false) {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return 0;
  }

  try {
    const content = editor.getContent();
    const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
    const newContent = content.replace(regex, replaceText);
    const replacedCount = (content.match(regex) || []).length;

    editor.setContent(newContent);
    return replacedCount;
  } catch (error) {
    console.error('내용 교체 중 오류 발생:', error);
    return 0;
  }
}

/**
 * TinyMCE 에디터 내용을 내보내는 함수 (HTML 파일)
 * @param {string} editorId - 에디터 ID
 * @param {string} filename - 파일명
 */
export function exportTinyMCEContentAsHTML(editorId, filename = 'content.html') {
  const editor = getTinyMCEInstance(editorId);
  if (!editor) {
    return;
  }

  try {
    const content = editor.getContent();
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename.replace('.html', '')}</title>
    <style>
        body { font-family: 'Noto Sans KR', Arial, sans-serif; line-height: 1.6; margin: 20px; }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('HTML 파일이 내보내졌습니다:', filename);
  } catch (error) {
    console.error('HTML 내보내기 중 오류 발생:', error);
  }
}

export default {
  getTinyMCEInstance,
  getTinyMCEContent,
  setTinyMCEContent,
  getTinyMCEHTML,
  getTinyMCEText,
  isTinyMCEReady,
  setTinyMCEReadonly,
  setTinyMCEDisabled,
  clearTinyMCEContent,
  isTinyMCEContentChanged,
  saveTinyMCEContent,
  copyTinyMCEContent,
  pasteTinyMCEContent,
  getTinyMCESelectedText,
  getTinyMCESelectedHTML,
  execTinyMCECommand,
  isTinyMCEPluginLoaded,
  getTinyMCEContentWordCount,
  getTinyMCEContentCharCount,
  searchTinyMCEContent,
  replaceTinyMCEContent,
  exportTinyMCEContentAsHTML
};
