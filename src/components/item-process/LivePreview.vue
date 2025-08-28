<template>
  <div class="card shadow-sm border-0 mb-3">
    <div class="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
      <h6 class="card-title mb-0 fw-semibold text-dark">
        <i class="bi bi-eye me-2"></i>미리보기
      </h6>
      <small class="text-muted">에디터 내용이 실시간 반영됩니다</small>
    </div>
    <div class="card-body">
      <div ref="previewRef" class="preview-surface" v-html="previewHtml"></div>
    </div>
  </div>
</template>

<script>
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default {
  name: 'LivePreview',
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      previewHtml: '',
      previewDebounceTimer: null
    }
  },
  watch: {
    content: {
      handler() {
        this.schedulePreviewRender()
      },
      immediate: true
    }
  },
  methods: {
    schedulePreviewRender() {
      clearTimeout(this.previewDebounceTimer)
      this.previewDebounceTimer = setTimeout(this.renderPreview, 150)
    },

    renderPreview() {
      this.previewHtml = this.content || ''

      this.$nextTick(() => {
        try {
          const root = this.$refs.previewRef
          if (!root) {
            console.warn('previewRef를 찾을 수 없음')
            return
          }

          console.log('미리보기 렌더링 시작:', this.previewHtml)

          const mathElements = root.querySelectorAll('span.math-latex')
          console.log('찾은 수식 요소 개수:', mathElements.length)

          mathElements.forEach((el, index) => {
            let latex = el.getAttribute('data-latex')
            if (!latex) {
              const raw = (el.textContent || '').trim()
              const m = raw.match(/^\$(.*)\$$/s)
              latex = m ? m[1] : raw
              el.setAttribute('data-latex', latex)
            }

            try {
              el.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode: false })
              console.log(`수식 ${index + 1} 렌더링 성공:`, latex)
            } catch (e) {
              console.warn(`수식 ${index + 1} 렌더링 실패:`, e, latex)
              el.textContent = `$${latex}$`
            }
          })
        } catch (e) {
          console.warn('미리보기 렌더 실패:', e)
        }
      })
    }
  },
  beforeUnmount() {
    clearTimeout(this.previewDebounceTimer)
  }
}
</script>

<style scoped>
.preview-surface {
  min-height: 120px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  word-break: break-word;
}
</style>
