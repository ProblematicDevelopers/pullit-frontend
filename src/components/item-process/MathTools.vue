<template>
  <div v-show="activeToolTab === 'math'" class="tab-content">
    <div class="row g-2">
      <!-- 수식 검색 -->
      <div class="col-12">
        <div class="math-search">
          <label class="form-label fw-semibold small">수식 검색:</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-light border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchQuery"
              placeholder="덧셈, 방정식, 분수..."
              class="form-control border-start-0"
              @input="filterMathTemplates"
            />
          </div>
          <div class="search-results mt-2" v-if="filteredTemplates.length > 0 && searchQuery">
            <div
              v-for="template in filteredTemplates"
              :key="template.id"
              @click="insertMath(template.latex)"
              class="search-result-item small p-2 border rounded mb-1 cursor-pointer"
            >
              <div class="template-name fw-semibold">{{ template.name }}</div>
              <div class="template-preview text-muted">{{ template.preview }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 수식 카테고리 -->
      <div class="col-12">
        <div class="math-categories">
          <label class="form-label fw-semibold small">수식 카테고리:</label>
          <ul class="nav nav-tabs nav-fill" role="tablist">
            <li class="nav-item" v-for="category in categories" :key="category.id">
              <button
                @click="activeCategory = category.id"
                :class="['nav-link', { active: activeCategory === category.id }]"
                type="button"
                role="tab"
                class="small"
              >
                {{ category.name }}
              </button>
            </li>
          </ul>

          <!-- 카테고리별 수식 버튼 -->
          <div class="tab-content mt-3">
            <div v-for="category in categories" :key="category.id" v-show="activeCategory === category.id">
              <div class="d-grid gap-2">
                <button
                  v-for="template in category.templates"
                  :key="template.id"
                  @click="insertMath(template.latex)"
                  class="btn btn-outline-primary btn-sm"
                  :title="template.description"
                >
                  {{ template.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 커스텀 수식 입력 -->
      <div class="col-12">
        <div class="custom-math">
          <label class="form-label fw-semibold small">커스텀 수식:</label>
          <div class="input-group input-group-sm">
            <input
              v-model="customMath"
              placeholder="LaTeX 수식 입력"
              class="form-control"
              @keyup.enter="insertCustomMath"
            />
            <button
              @click="insertCustomMath"
              class="btn btn-primary btn-sm"
              :disabled="!customMath.trim()"
            >
              삽입
            </button>
          </div>
          <div class="math-preview mt-2" v-if="customMath.trim()">
            <small class="text-muted">미리보기:</small>
            <div class="preview-content border rounded p-2 bg-light mt-1" v-html="previewMathContent"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default {
  name: 'MathTools',
  props: {
    activeToolTab: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      searchQuery: '',
      activeCategory: 'basic',
      customMath: '',
      filteredTemplates: [],
      categories: [
        {
          id: 'basic',
          name: '기본',
          templates: [
            { id: 1, name: '덧셈', latex: 'a + b = c', description: '기본 덧셈', preview: 'a + b = c' },
            { id: 2, name: '뺄셈', latex: 'a - b = c', description: '기본 뺄셈', preview: 'a × b = c' },
            { id: 3, name: '곱셈', latex: 'a \\times b = c', description: '기본 곱셈', preview: 'a × b = c' },
            { id: 4, name: '나눗셈', latex: '\\frac{a}{b} = c', description: '기본 나눗셈', preview: 'a/b = c' }
          ]
        },
        {
          id: 'advanced',
          name: '고급',
          templates: [
            { id: 5, name: '제곱근', latex: '\\sqrt{a} = b', description: '제곱근', preview: '√a = b' },
            { id: 6, name: '지수', latex: 'a^b = c', description: '지수', preview: 'a^b = c' },
            { id: 7, name: '로그', latex: '\\log_a(b) = c', description: '로그', preview: 'log_a(b) = c' },
            { id: 8, name: '적분', latex: '\\int_a^b f(x) dx', description: '적분', preview: '∫f(x)dx' }
          ]
        }
      ]
    }
  },
  computed: {
    previewMathContent() {
      if (!this.customMath.trim()) return ''
      try {
        return katex.renderToString(this.customMath, { throwOnError: false, displayMode: false })
      } catch {
        return `<span class="text-danger">LaTeX 오류: ${this.customMath}</span>`
      }
    }
  },
  methods: {
    filterMathTemplates() {
      if (!this.searchQuery.trim()) {
        this.filteredTemplates = [];
        return
      }
      const query = this.searchQuery.toLowerCase()
      this.filteredTemplates = this.categories
        .flatMap(category => category.templates)
        .filter(t => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query))
    },

    insertMath(latex) {
      this.$emit('insert-math', latex)
    },

    insertCustomMath() {
      if (!this.customMath.trim()) return
      this.insertMath(this.customMath)
      this.customMath = ''
    }
  }
}
</script>

<style scoped>
/* 검색 결과 */
.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background: white;
}

.search-result-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background-color: #f8f9fa;
}

.search-result-item:last-child {
  border-bottom: none;
}

.template-name {
  display: block;
  font-weight: 500;
  color: #495057;
}

.template-preview {
  display: block;
  font-size: 0.875rem;
  color: #6c757d;
}

/* 도구 내 작은 미리보기 */
.preview-content {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
