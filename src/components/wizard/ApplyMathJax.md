# MathJax Integration Guide for Components

## Components to Update

### Wizard Components
- [x] Step2ItemSelection.vue - Updated
- [x] Step2SimpleGeneration.vue - Updated
- [ ] Step2ExamPreview.vue
- [ ] Step3ExamSave.vue
- [ ] ItemPreviewModal.vue
- [ ] ExamPDFPreview.vue
- [ ] ExamPDFPreviewFixed.vue

### Student Report Components
- [ ] BasicReport.vue
- [ ] DetailReport.vue
- [ ] QuestionHtmlModal.vue

### CBT Components  
- [ ] CBTExam.vue

### Item Process Components
- [ ] PdfOcrEditor.vue
- [ ] CKEditorComponent.vue

## Integration Steps for Each Component

### 1. Add Import
```javascript
import { useMathJax } from '@/composables/useMathJax'
```

### 2. Initialize Composable
```javascript
// MathJax 컴포저블 사용
const { render: renderMath } = useMathJax({
  immediate: false,
  watchContent: false,
  hideBeforeRender: true,
  clearFirst: true,
  debounceDelay: 100
})
```

### 3. Add Rendering Calls
```javascript
// After data loads
await nextTick()
await renderMath()

// In watchers
watch(dataSource, async () => {
  await nextTick()
  await renderMath()
})
```

### 4. Clean up old MathJax code
- Remove old renderMath functions
- Remove MathJax initialization code
- Keep CSS styles for MathJax containers