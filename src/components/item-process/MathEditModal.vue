<template>
  <!-- 수식 편집 UI -->
  <div v-if="show" class="math-edit-ui">
    <div class="math-edit-header">
      <h6 class="mb-0">
        <i class="bi bi-pencil-square me-2"></i>수식 편집
      </h6>
      <button @click="cancelEdit" class="btn-close" type="button"></button>
    </div>
    <div class="math-edit-content">
      <div class="math-preview mb-3">
        <label class="form-label small fw-semibold">현재 수식:</label>
        <div class="preview-box" v-html="mathPreviewHtml"></div>
      </div>
      <div class="math-input mb-3">
        <label class="form-label small fw-semibold">LaTeX 코드:</label>
        <textarea
          v-model="editingLatex"
          class="form-control"
          rows="3"
          placeholder="LaTeX 수식을 입력하세요"
          @keydown.ctrl.enter="applyEdit"
        ></textarea>
      </div>
      <div class="math-edit-actions">
        <button @click="applyEdit" class="btn btn-primary btn-sm me-2">
          <i class="bi bi-check me-1"></i>적용
        </button>
        <button @click="cancelEdit" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-x me-1"></i>취소
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default {
  name: 'MathEditModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    latex: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      editingLatex: ''
    }
  },
  computed: {
    mathPreviewHtml() {
      if (!this.editingLatex.trim()) return ''
      try {
        return katex.renderToString(this.editingLatex, { throwOnError: false, displayMode: false })
      } catch {
        return `<span class="text-danger">LaTeX 오류: ${this.editingLatex}</span>`
      }
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.editingLatex = this.latex
      }
    },
    latex(newVal) {
      if (this.show) {
        this.editingLatex = newVal
      }
    }
  },
  methods: {
    applyEdit() {
      this.$emit('apply', this.editingLatex);
      this.closeModal();
    },

    cancelEdit() {
      this.$emit('cancel');
      this.closeModal();
    },
  }
}
</script>

<style scoped>
/* 수식 편집 UI */
.math-edit-ui {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1050;
}

.math-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.math-edit-content {
  padding: 1.5rem;
}

.math-preview .preview-box {
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.math-input textarea {
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.math-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 모달 배경 */
.math-edit-ui::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}
</style>
