<template>
  <div class="exam-pdf-preview">
    <!-- Header -->
    <div class="preview-header">
      <div class="header-left">
        <h3>시험지 미리보기</h3>
        <div class="header-info">
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 11L12 14L20 4" stroke="currentColor" stroke-width="2"/>
            </svg>
            {{ allQuestions.length }}문항
          </span>
          <span class="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" stroke-width="2"/>
            </svg>
            {{ totalPages }}페이지
          </span>
        </div>
      </div>

      <!-- Enhanced Title Settings -->
      <div class="header-settings">
        <div class="settings-row">
          <input
            v-model="examTitle"
            type="text"
            placeholder="시험지 제목 (예: 2024학년도 1학기 중간고사)"
            class="title-input"
          />
        </div>
        <div class="settings-row">
          <select v-model="selectedGrade" @change="updateGradeInfo" class="grade-select">
            <option value="">학년 선택</option>
            <option value="07">중학교 1학년</option>
            <option value="08">중학교 2학년</option>
            <option value="09">중학교 3학년</option>
          </select>
          <select v-model="selectedSubject" @change="updateSubjectInfo" class="subject-select">
            <option value="">과목 선택</option>
            <option value="MA">수학</option>
            <option value="KO">국어</option>
            <option value="EN">영어</option>
            <option value="SC">과학</option>
            <option value="SO">사회</option>
          </select>
        </div>
      </div>

      <div class="header-controls">
        <!-- Layout Toggle -->
        <div class="control-group">
          <button
            @click="layoutMode = 'single'"
            :class="['layout-btn', { active: layoutMode === 'single' }]"
            title="1단 레이아웃"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button
            @click="layoutMode = 'double'"
            :class="['layout-btn', { active: layoutMode === 'double' }]"
            title="2단 레이아웃"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="7" height="16" stroke="currentColor" stroke-width="2"/>
              <rect x="13" y="4" width="7" height="16" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <!-- Zoom Controls -->
        <div class="control-group">
          <button @click="decreaseZoom" class="zoom-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <span class="zoom-level">{{ zoomLevel }}%</span>
          <button @click="increaseZoom" class="zoom-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <!-- Actions -->
        <button @click="downloadPDF" class="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V15" stroke="white" stroke-width="2"/>
            <path d="M7 10L12 15L17 10" stroke="white" stroke-width="2"/>
            <path d="M12 15V3" stroke="white" stroke-width="2"/>
          </svg>
          PDF 다운로드
        </button>
      </div>
    </div>

    <!-- Page Navigation -->
    <div class="page-navigation">
      <button
        @click="currentPage = Math.max(1, currentPage - 1)"
        :disabled="currentPage === 1"
        class="nav-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="page-info">
        <span>{{ currentPage }}</span>
        <span class="separator">/</span>
        <span>{{ totalPages }}</span>
      </div>
      <button
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="nav-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Preview Container -->
    <div class="preview-container" :style="{ transform: `scale(${zoomLevel / 100})` }">
      <!-- Debug Info -->
      <div v-if="true" style="position: fixed; top: 10px; right: 10px; background: yellow; padding: 10px; z-index: 9999; color: black; font-size: 12px; border: 2px solid #000; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <strong>Debug Panel</strong><br>
        Total Images: {{ previewImages.length }}<br>
        Current Page: {{ currentPage }}<br>
        Total Pages: {{ totalPages }}<br>
        Current Page Images: {{ currentPageImages.length }}<br>
        Layout Mode: {{ layoutMode }}
      </div>

      <!-- Image-based Preview (if available) -->
      <div v-if="previewImages.length > 0 && !isGeneratingPDF" class="image-preview-container">
        <div class="a4-page image-based">
          <!-- Header (First Page Only) -->
          <div v-if="currentPage === 1" class="page-header">
            <h1 class="exam-title">{{ examTitle || '2024학년도 중간고사' }}</h1>
            <div class="exam-info">
              <span>과목: {{ subject || '수학' }}</span>
              <span>시간: {{ duration || '50' }}분</span>
              <span>총점: {{ totalScore || '100' }}점</span>
            </div>
          </div>

          <!-- Image Content -->
          <div class="page-content" :class="`layout-${layoutMode}`">
            <div v-if="currentPageImages.length === 0" class="no-images-message">
              이미지가 없습니다. (currentPageImages.length = 0)
            </div>
            <div v-else class="images-wrapper">
              <!-- Debug info (remove in production) -->
              <div class="debug-info">
                현재 페이지 이미지 수: {{ currentPageImages.length }}
              </div>

              <!-- Images Grid -->
              <div class="images-grid" :class="`cols-${layoutMode === 'double' ? 2 : 1}`">
                <div v-for="(image, idx) in currentPageImages" :key="`img-${idx}`" class="image-container">
                  <!-- Debug info for each image -->
                  <div class="image-debug">
                    이미지 {{ idx + 1 }}: {{ image.type }}
                    <span v-if="image.questionNumber">(문제 {{ image.questionNumber }})</span>
                  </div>

                  <!-- Actual Image -->
                  <img
                    v-if="image.dataUrl"
                    :src="image.dataUrl"
                    :alt="`${image.type === 'passage' ? '지문' : '문제'} ${image.questionNumber || idx + 1}`"
                    class="converted-question-image"
                    @load="onImageLoad(idx, image)"
                    @error="onImageError(idx, image)"
                  />

                  <!-- Error fallback -->
                  <div v-else class="image-error">
                    이미지 데이터를 불러올 수 없습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Original HTML-based Preview (fallback) -->
      <div class="a4-page" v-else-if="!isGeneratingPDF">
        <!-- Header (First Page Only) -->
        <div v-if="currentPage === 1" class="page-header">
          <h1 class="exam-title">{{ examTitle || '2024학년도 중간고사' }}</h1>
          <div class="exam-info">
            <span>과목: {{ subject || '수학' }}</span>
            <span>시간: {{ duration || '50' }}분</span>
            <span>총점: {{ totalScore || '100' }}점</span>
          </div>
        </div>

        <!-- Questions Content -->
        <div class="page-content" :class="`layout-${layoutMode}`">
          <!-- Single column layout -->
          <div v-if="layoutMode === 'single'" class="questions-wrapper">
            <template v-for="(group, gIndex) in currentPageGroups" :key="`group-${gIndex}`">
              <!-- 지문과 문제가 함께 있는 그룹 -->
              <div v-if="group.type === 'passage-with-questions'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>

                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 지문만 있는 그룹 (분할된 경우) -->
              <div v-else-if="group.type === 'passage-only'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>
              </div>

              <!-- 이어지는 지문 (분할된 두 번째 부분) -->
              <div v-else-if="group.type === 'passage-continuation'" class="passage-group continuation">
                <div class="passage-section">
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>
              </div>

              <!-- 문제만 있는 그룹 (분할된 지문의 문제들) -->
              <div v-else-if="group.type === 'questions-only'" class="questions-only-group">
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 지문이 있는 그룹 (분할되지 않은 일반 그룹) -->
              <div v-else-if="group.type === 'passage-group'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  <!-- Split indicator if this is a split passage -->
                  <div v-if="group.isSplit" class="passage-continuation-indicator">
                    {{ group.splitPart < group.totalSplits ? '(다음 페이지에서 계속)' : '' }}
                  </div>
                </div>

                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 지문 연속 그룹 (이어지는 문제들) -->
              <div v-else-if="group.type === 'passage-group-continuation'" class="passage-group continuation">
                <div class="continuation-header">
                  (앞 페이지 지문에서 이어지는 문제)
                </div>

                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 독립 문제 (standalone) -->
              <div v-else-if="group.type === 'standalone-question'" class="standalone-questions">
                <div v-for="item in group.questions" :key="item.id" class="question-item standalone">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Two column layout for preview with CSS columns -->
          <div v-if="layoutMode === 'double'" class="two-column-wrapper">
            <template v-for="(group, gIndex) in currentPageGroups" :key="`group-${gIndex}`">
              <!-- 지문과 문제가 함께 있는 그룹 -->
              <div v-if="group.type === 'passage-with-questions'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>

                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 지문만 있는 그룹 (분할된 경우) -->
              <div v-else-if="group.type === 'passage-only'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>
              </div>

              <!-- 이어지는 지문 (분할된 두 번째 부분) -->
              <div v-else-if="group.type === 'passage-continuation'" class="passage-group continuation">
                <div class="passage-section">
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                </div>
              </div>

              <!-- 문제만 있는 그룹 (분할된 지문의 문제들) -->
              <div v-else-if="group.type === 'questions-only'" class="questions-only-group">
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 지문이 있는 그룹 (분할되지 않은 일반 그룹) -->
              <div v-else-if="group.type === 'passage-group'" class="passage-group">
                <div class="passage-section">
                  <div class="passage-header">
                    [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                  </div>
                  <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  <!-- Split indicator if this is a split passage -->
                  <div v-if="group.isSplit" class="passage-continuation-indicator">
                    {{ group.splitPart < group.totalSplits ? '(다음 페이지에서 계속)' : '' }}
                  </div>
                </div>

                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 지문 연속 그룹 (이어지는 문제들) -->
              <div v-else-if="group.type === 'passage-group-continuation'" class="passage-group continuation">
                <div class="continuation-header">
                  (앞 페이지 지문에서 이어지는 문제)
                </div>

                <!-- 그룹의 문제들 -->
                <div v-for="item in group.questions" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 독립 문제 (standalone) -->
              <div v-else-if="group.type === 'standalone-question'" class="standalone-questions">
                <div v-for="item in group.questions" :key="item.id" class="question-item standalone">
                  <div class="question-header">
                    <span class="question-number">{{ item.displayNumber }}.</span>
                    <span class="question-points">({{ item.points || 5 }}점)</span>
                  </div>
                  <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                  <!-- 선택지 -->
                  <div v-if="item.choices && item.choices.length" class="choices">
                    <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                      <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                      <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Page Footer -->
        <div class="page-footer">
          <span>- {{ currentPage }} -</span>
        </div>
      </div>

      <!-- All Pages for PDF Generation (Hidden) - HTML 기반 PDF 생성용 -->
      <div v-if="!previewImages.length && isGeneratingPDF" v-show="isGeneratingPDF" ref="pdfContent" class="pdf-pages">
        <div v-for="pageNum in totalPages" :key="pageNum" class="a4-page pdf-page">
          <!-- Header (First Page Only) -->
          <div v-if="pageNum === 1" class="page-header">
            <h1 class="exam-title">{{ examTitle || '2024학년도 중간고사' }}</h1>
            <div class="exam-info">
              <span>과목: {{ subject || '수학' }}</span>
              <span>시간: {{ duration || '50' }}분</span>
              <span>총점: {{ totalScore || '100' }}점</span>
            </div>
          </div>

          <!-- Questions for this page -->
          <div class="page-content" :class="`layout-${layoutMode}`">
            <!-- Single column layout -->
            <div v-if="layoutMode === 'single'" class="questions-wrapper">
              <template v-for="(group, gIndex) in getPageColumn(pageNum, 1)" :key="`pdf-group-${pageNum}-${gIndex}`">
                <!-- 지문이 있는 그룹 -->
                <div v-if="group.type === 'passage-group'" class="passage-group">
                  <div class="passage-section">
                    <div class="passage-header">
                      [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                    </div>
                    <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  </div>

                  <!-- 그룹의 문제들 -->
                  <div v-for="item in group.questions" :key="item.id" class="question-item">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 독립 문제 -->
                <template v-else>
                  <div v-for="item in group.questions" :key="item.id" class="question-item standalone">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>

            <!-- Two column layout with CSS columns for PDF -->
            <div v-if="layoutMode === 'double'" class="two-column-wrapper">
              <template v-for="(group, gIndex) in getPageGroups(pageNum)" :key="`pdf-group-${pageNum}-${gIndex}`">
                <!-- 지문이 있는 그룹 -->
                <div v-if="group.type === 'passage-group'" class="passage-group">
                  <div class="passage-section">
                    <div class="passage-header">
                      [{{ group.questionNumbers }}] 다음 글을 읽고 물음에 답하시오.
                    </div>
                    <div class="passage-content mathjax-content" v-html="sanitizeHtml(group.passageHtml)" data-mathjax-pending="true"></div>
                  </div>

                  <!-- 그룹의 문제들 -->
                  <div v-for="item in group.questions" :key="item.id" class="question-item">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 독립 문제 -->
                <template v-else>
                  <div v-for="item in group.questions" :key="item.id" class="question-item standalone">
                    <div class="question-header">
                      <span class="question-number">{{ item.displayNumber }}.</span>
                      <span class="question-points">({{ item.points || 5 }}점)</span>
                    </div>
                    <div class="question-text mathjax-content" v-html="sanitizeHtml(item.questionHtml)" data-mathjax-pending="true"></div>

                    <!-- 선택지 -->
                    <div v-if="item.choices && item.choices.length" class="choices">
                      <div v-for="(choice, idx) in item.choices" :key="idx" class="choice">
                        <span class="choice-number">{{ getChoiceNumber(idx) }}</span>
                        <span class="choice-text mathjax-content" v-html="sanitizeHtml(choice)" data-mathjax-pending="true"></span>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

          <!-- Page Footer -->
          <div class="page-footer">
            <span>- {{ pageNum }} -</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isGeneratingPDF" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>PDF 생성 중...</p>
      </div>
    </div>

    <!-- Footer with Actions -->
    <div class="preview-footer">
      <div class="footer-info">
        <span class="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L20 4" stroke="currentColor" stroke-width="2"/>
          </svg>
          총 {{ allQuestions.length }}문항
        </span>
        <span class="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ duration }}분
        </span>
        <span class="info-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ totalScore }}점 만점
        </span>
      </div>

      <div class="footer-actions">
        <button @click="downloadPDF" class="btn-action btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2"/>
            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 15V3" stroke="currentColor" stroke-width="2"/>
          </svg>
          PDF 다운로드
        </button>

        <button @click="handleSavePDF" class="btn-action btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="white" stroke-width="2"/>
            <polyline points="17 21 17 13 7 13 7 21" stroke="white" stroke-width="2"/>
            <polyline points="7 3 7 8 15 8" stroke="white" stroke-width="2"/>
          </svg>
          시험지 저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'
import { useTestBankStore } from '@/stores/testBank'
import { renderMathJaxSmartHybrid, renderMathJaxParallelHybrid } from '@/utils/mathjax-hybrid'
// 이미지 기반 PDF 생성 시스템
import {
  convertHTMLToPDF,
  generatePDFFromPages,
  savePDF,
  pdfToBlob,
  generatePreviewImages
} from '@/utils/pdf-image-generator'
// 새로운 이미지 기반 생성기
import {
  generateImageBasedPDF,
  convertGroupsToImages,
  createPDFFromImages
} from '@/utils/pdf-image-based-generator'
// 새로운 페이지네이션 시스템 사용
import {
  paginateContent,
  A4_CONFIG,
  ContentGrouper,
  PageSplitter
} from '@/utils/pdf-paginator-v2'
// HTML 기반 PDF 생성기 (html2pdf.js 사용)

// Props
const props = defineProps({
  selectedItems: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['download', 'save', 'update:gradeInfo', 'update:subjectInfo'])

// Stores
const itemSelectionStore = useItemSelectionStore()

// State
const currentPage = ref(1)
const layoutMode = ref('single') // 'single' or 'double'
const zoomLevel = ref(100)
const isGeneratingPDF = ref(false)

// Exam Settings
const examTitle = ref('2024학년도 중간고사')
const subject = ref('수학')
const selectedGrade = ref('08')
const selectedSubject = ref('MA')
const duration = ref(50)
const totalScore = ref(100)

// Grade and Subject mappings
const gradeMapping = {
  '07': '중1',
  '08': '중2',
  '09': '중3'
}

const subjectMapping = {
  'MA': '수학',
  'KO': '국어',
  'EN': '영어',
  'SC': '과학',
  'SO': '사회'
}

// Update grade info
const updateGradeInfo = () => {
  // Update display name
  if (gradeMapping[selectedGrade.value]) {
    // You can emit this to parent component
    emit('update:gradeInfo', {
      code: selectedGrade.value,
      name: gradeMapping[selectedGrade.value]
    })
  }
}

// Update subject info
const updateSubjectInfo = () => {
  if (subjectMapping[selectedSubject.value]) {
    subject.value = subjectMapping[selectedSubject.value]
    emit('update:subjectInfo', {
      code: selectedSubject.value,
      name: subjectMapping[selectedSubject.value]
    })
  }
}

// Process all questions and group by passage
const allQuestions = computed(() => {
  let items = props.selectedItems.length > 0
    ? props.selectedItems
    : itemSelectionStore.selectedItems || []

  console.log('Raw selected items:', items.length, items)

  // 테스트 데이터 (개발용)
  if (items.length === 0) {
    console.warn('No items found, using test data')
    items = Array.from({ length: 20 }, (_, i) => ({
      id: `test-${i}`,
      questionText: `문제 ${i + 1}: 이것은 테스트 문제입니다. 긴 문제 텍스트를 포함합니다.`,
      passageId: i < 3 ? 'passage-1' : i < 6 ? 'passage-2' : null,
      passageHtml: i < 3 ? '<p>이것은 첫 번째 지문입니다. 매우 긴 내용이 포함되어 있습니다. 지문은 여러 줄에 걸쳐 표시됩니다.</p>' :
                   i < 6 ? '<p>이것은 두 번째 지문입니다. 짧은 지문입니다.</p>' : null,
      choice1: '선택지 1',
      choice2: '선택지 2',
      choice3: '선택지 3',
      choice4: '선택지 4',
      choice5: '선택지 5',
      correctAnswer: '1',
      points: 5
    }))
  }

  const processed = items.map((item, index) => ({
    ...item,
    id: item.itemId || item.id || `q-${index}`,
    displayNumber: item.displayNumber || index + 1,
    questionHtml: item.questionHtml || item.questionText || item.question || '',
    passageHtml: item.passageHtml || item.passage || '',
    passageId: item.passageId || null,
    choices: [
      item.choice1Html || item.choice1,
      item.choice2Html || item.choice2,
      item.choice3Html || item.choice3,
      item.choice4Html || item.choice4,
      item.choice5Html || item.choice5
    ].filter(Boolean),
    points: item.points || 5
  }))

  console.log('Processed questions:', processed.length, processed)
  return processed
})

// Group questions by passage
const groupedQuestions = computed(() => {
  const groups = []
  const passageMap = new Map()
  const processedQuestions = new Set()

  allQuestions.value.forEach(question => {
    if (processedQuestions.has(question.id)) return

    if (question.passageId && question.passageHtml) {
      // 이미 처리된 지문인지 확인
      if (!passageMap.has(question.passageId)) {
        // 같은 passageId를 가진 모든 문제 찾기
        const relatedQuestions = allQuestions.value.filter(q =>
          q.passageId === question.passageId && !processedQuestions.has(q.id)
        )

        const group = {
          type: 'passage-group',
          passageId: question.passageId,
          passageHtml: question.passageHtml,
          questions: relatedQuestions,
          questionNumbers: relatedQuestions.map(q => q.displayNumber).join(', ')
        }

        groups.push(group)
        passageMap.set(question.passageId, group)

        // 처리된 문제들 기록
        relatedQuestions.forEach(q => processedQuestions.add(q.id))
      }
    } else {
      // 지문이 없는 독립 문제
      groups.push({
        type: 'single',
        questions: [question]
      })
      processedQuestions.add(question.id)
    }
  })

  return groups
})

// Items per page based on layout and page position
const itemsPerPage = computed(() => {
  const isFirstPage = currentPage.value === 1
  if (layoutMode.value === 'single') {
    return isFirstPage ? 3 : 5
  } else {
    return isFirstPage ? 6 : 10
  }
})

// Dynamic page content storage
const pageContents = ref([])

// Calculate dynamic pagination with real measurement
const calculateDynamicPagination = async () => {
  if (!allQuestions.value.length) {
    pageContents.value = [{ items: [] }]
    return
  }

  try {
    // 새로운 페이지네이션 시스템 사용
    const pages = await paginateContent(allQuestions.value, layoutMode.value)

    console.log('Pagination complete:', {
      totalPages: pages.length,
      layoutMode: layoutMode.value,
      questionsTotal: allQuestions.value.length
    })

    // 페이지 구조 변환 (호환성을 위해)
    if (layoutMode.value === 'double') {
      pageContents.value = pages
    } else {
      pageContents.value = pages.map(page => ({
        column1: page.items || [],
        column2: []
      }))
    }
  } catch (error) {
    console.error('Error in pagination:', error)
    // 기본값 설정
    pageContents.value = [{ column1: [], column2: [] }]
  }
}

// Fallback basic pagination 제거 (새 시스템 사용)
/*
const calculateBasicPagination = () => {
  // Removed - using new pagination system
}
*/

// Watch for changes and recalculate
watch([allQuestions, layoutMode], async () => {
  await calculateDynamicPagination()
}, { immediate: true })

// Old pagination code removed - using new measurement-based system

// Total pages from dynamic calculation
const totalPages = computed(() => {
  // 이미지 기반 미리보기일 때
  if (previewImages.value.length > 0) {
    const imagesPerPage = layoutMode.value === 'double' ? 6 : 3
    return Math.max(1, Math.ceil(previewImages.value.length / imagesPerPage))
  }
  // 기존 HTML 기반 미리보기
  return Math.max(1, pageContents.value.length)
})

// Get groups for current page
const currentPageGroups = computed(() => {
  const page = pageContents.value[currentPage.value - 1]
  if (!page) return []
  // For single column layout or preview, merge columns
  return [...(page.column1 || []), ...(page.column2 || [])]
})

// 이미지 미리보기 데이터
const previewImages = computed(() => {
  const itemStore = useItemSelectionStore()
  const images = itemStore.getConvertedImages() || []
  console.log('previewImages computed:', images.length, images)
  return images
})

// 현재 페이지에 표시할 이미지들
const currentPageImages = computed(() => {
  if (previewImages.value.length === 0) {
    console.log('No preview images available')
    return []
  }

  // 페이지당 이미지 수 계산 (레이아웃에 따라)
  const imagesPerPage = layoutMode.value === 'double' ? 6 : 3 // 예시 값
  const startIdx = (currentPage.value - 1) * imagesPerPage
  const endIdx = startIdx + imagesPerPage

  const pageImages = previewImages.value.slice(startIdx, endIdx)
  console.log('currentPageImages:', {
    count: pageImages.length,
    startIdx,
    endIdx,
    images: pageImages,
    firstImage: pageImages[0],
    hasDataUrl: pageImages[0]?.dataUrl ? 'YES' : 'NO'
  })
  return pageImages
})

// Image load/error handlers for debugging
const onImageLoad = (idx, image) => {
  console.log('✅ Image loaded successfully:', {
    index: idx,
    type: image.type,
    questionNumber: image.questionNumber,
    dimensions: {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: image.width,
      height: image.height
    },
    dataUrlLength: image.dataUrl?.length || 0,
    dataUrlPreview: image.dataUrl?.substring(0, 50) + '...'
  })
}

const onImageError = (idx, image) => {
  console.error('❌ Image failed to load:', {
    index: idx,
    type: image.type,
    questionNumber: image.questionNumber,
    hasDataUrl: !!image.dataUrl,
    dataUrlLength: image.dataUrl?.length || 0,
    error: 'Failed to render image element'
  })
}

// Render page content as HTML string
const renderPageContent = (groups, layout) => {
  let html = ''

  // 디버깅: 렌더링할 그룹 확인
  console.log('renderPageContent called with:', {
    groupsLength: groups.length,
    layout: layout,
    groups: groups
  })

  groups.forEach((group, index) => {
    console.log(`Processing group ${index}:`, group.type, group)

    // ContentGrouper가 생성하는 실제 타입명과 일치하도록 수정
    if (group.type === 'passage-with-questions') {
      // 지문과 문제가 함께
      html += `
        <div class="passage-group" style="margin-bottom: 30px;">
          <div class="passage-header" style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;">
            [${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.
          </div>
          <div class="passage-content" style="padding: 12px; background: #f8fafc; border: 1px solid #e0e6ed; border-radius: 6px; margin-bottom: 20px;">
            ${group.passageHtml || ''}
          </div>
          ${group.questions.map(q => renderQuestion(q)).join('')}
        </div>
      `
    } else if (group.type === 'standalone-question') {
      // 독립 문제
      html += `
        <div class="standalone-questions" style="margin-bottom: 30px;">
          ${group.questions.map(q => renderQuestion(q)).join('')}
        </div>
      `
    } else if (group.type === 'passage-only') {
      // 지문만 (페이지 분할 시 생성될 수 있음)
      html += `
        <div class="passage-group" style="margin-bottom: 30px;">
          <div class="passage-header" style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;">
            [${group.questionNumbers}] 다음 글을 읽고 물음에 답하시오.
          </div>
          <div class="passage-content" style="padding: 12px; background: #f8fafc; border: 1px solid #e0e6ed; border-radius: 6px;">
            ${group.passageHtml || ''}
          </div>
        </div>
      `
    } else if (group.type === 'questions-only') {
      // 문제만 (페이지 분할 시 생성될 수 있음)
      html += `
        <div class="questions-only" style="margin-bottom: 30px;">
          ${group.questions.map(q => renderQuestion(q)).join('')}
        </div>
      `
    }
  })

  return html
}

// Render individual question as HTML
const renderQuestion = (question) => {
  let html = `
    <div class="question-item" style="margin-bottom: 25px;">
      <div class="question-header" style="margin-bottom: 10px;">
        <span style="font-weight: 600; color: #2563eb; font-size: 16px;">${question.displayNumber || ''}.</span>
        <span style="color: #606f7b; font-size: 14px; margin-left: 8px;">(${question.points || 5}점)</span>
      </div>
      <div class="question-text" style="margin-bottom: 15px; line-height: 1.8;">
        ${question.questionHtml || question.questionText || ''}
      </div>
  `

  if (question.choices && question.choices.length > 0) {
    html += '<div class="choices" style="padding-left: 20px;">'
    question.choices.forEach((choice, idx) => {
      const num = ['①', '②', '③', '④', '⑤'][idx] || `${idx + 1}.`
      html += `
        <div class="choice" style="margin-bottom: 8px;">
          <span style="margin-right: 10px;">${num}</span>
          <span>${choice}</span>
        </div>
      `
    })
    html += '</div>'
  }

  html += '</div>'
  return html
}

// Get groups for specific page
const getPageGroups = (pageNum) => {
  const page = pageContents.value[pageNum - 1]
  if (!page) {
    console.warn(`Page ${pageNum} not found in pageContents`)
    return []
  }

  // 페이지 구조에 따라 다르게 처리
  if (page.items) {
    // 새로운 페이지네이션 시스템의 구조 (items 배열)
    return page.items || []
  } else {
    // 이전 구조 (column1, column2)
    return [...(page.column1 || []), ...(page.column2 || [])]
  }
}

// Get groups for specific column of a page
const getPageColumn = (pageNum, columnNum) => {
  const page = pageContents.value[pageNum - 1]
  if (!page) {
    console.warn(`Page ${pageNum} not found`)
    return []
  }

  const result = columnNum === 1 ? (page.column1 || []) : (page.column2 || [])
  console.log(`getPageColumn(${pageNum}, ${columnNum}):`, result.length, 'items')
  return result
}

// Zoom controls
const increaseZoom = () => {
  if (zoomLevel.value < 150) {
    zoomLevel.value += 10
  }
}

const decreaseZoom = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 10
  }
}

// Get choice number
const getChoiceNumber = (index) => {
  const numbers = ['①', '②', '③', '④', '⑤']
  return numbers[index] || `${index + 1}.`
}

// Sanitize HTML and remove input fields
const sanitizeHtml = (html) => {
  if (!html) return ''

  // MathJax 수식을 임시로 보호
  const mathPatterns = []
  let mathIndex = 0

  // LaTeX 수식 패턴들을 임시 플레이스홀더로 교체
  let cleaned = html
    // Display math $$ ... $$ 보호
    .replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })
    // Inline math $ ... $ 보호
    .replace(/\$[^\$\n]+?\$/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })
    // \[ ... \] 보호
    .replace(/\\\[[\s\S]*?\\\]/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })
    // \( ... \) 보호
    .replace(/\\\([\s\S]*?\\\)/g, (match) => {
      mathPatterns.push(match)
      return `__MATH_${mathIndex++}__`
    })

  // 위험한 요소 제거하되 이미지는 유지
  cleaned = cleaned
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 스크립트 제거
    .replace(/on\w+="[^"]*"/g, '') // 이벤트 핸들러 제거
    .replace(/on\w+='[^']*'/g, '')
    .replace(/<input[^>]*>/gi, '')  // input 제거
    .replace(/<textarea[^>]*>.*?<\/textarea>/gi, '')  // textarea 제거
    .replace(/contenteditable="true"/gi, '')  // contenteditable 제거

  // 보호했던 수식들을 다시 복원
  mathPatterns.forEach((math, index) => {
    cleaned = cleaned.replace(`__MATH_${index}__`, math)
  })

  return cleaned
}

// Generate PDF and save to S3
const generateAndSavePDF = async () => {
  try {
    console.log('generateAndSavePDF 호출됨')
    let pdfBlob = null

    try {
      // PDF 생성 시도 (실패해도 계속 진행)
      pdfBlob = await downloadPDF(true)
      console.log('PDF 생성 성공:', pdfBlob)
    } catch (pdfError) {
      console.warn('PDF 생성 실패, 하지만 계속 진행:', pdfError)
      // PDF 생성 실패해도 null로 계속 진행
    }

    // PDF 성공 여부와 관계없이 반환
    return pdfBlob
  } catch (error) {
    console.error('PDF 저장 오류:', error)
    throw error
  }
}

// Download PDF with NEW image-based generation (각 문제/지문을 개별 이미지로)
const downloadPDF = async (returnBlob = false) => {
  isGeneratingPDF.value = true

  try {
    await nextTick()

    console.log('새로운 이미지 기반 PDF 생성 시작')

    // Store에서 이미지 데이터 가져오기
    const itemStore = useItemSelectionStore()
    const storedImages = itemStore.getConvertedImages()

    if (storedImages && storedImages.length > 0) {
      // 이미 변환된 이미지가 있으면 바로 PDF 생성
      console.log('Store에 저장된 이미지 사용:', storedImages.length)

      const { generatePDFFromImages, pdfToBlob, downloadPDF } = await import('@/utils/pdf-from-images')

      const pdf = await generatePDFFromImages(storedImages, {
        examTitle: examTitle.value || '2024학년도 중간고사',
        subject: subject.value || '수학',
        grade: selectedGrade.value || '',
        duration: duration.value || '50',
        totalScore: totalScore.value || '100',
        layoutMode: layoutMode.value,
        showPageNumbers: true,
        onProgress: (progress) => {
          console.log('PDF 생성 진행:', progress.message)
        }
      })

      if (returnBlob) {
        return pdfToBlob(pdf)
      } else {
        downloadPDF(pdf, `${examTitle.value || 'exam'}_${new Date().toISOString().split('T')[0]}.pdf`)
      }

      console.log('이미지 기반 PDF 생성 완료')
      return pdf
    }

    // 이미지가 없으면 기존 방식으로 fallback
    console.log('Store에 이미지가 없어 기존 방식 사용')

    // 문제 그룹 생성 (ContentGrouper 사용)
    const groups = ContentGrouper.createGroups(allQuestions.value)
    console.log('생성된 그룹:', groups.length, groups)

    // 새로운 방식: 각 그룹을 개별 이미지로 변환 후 PDF 생성
    const result = await generateImageBasedPDF(groups, {
      filename: `${examTitle.value || 'exam'}_${new Date().toISOString().split('T')[0]}.pdf`,
      examTitle: examTitle.value || '2024학년도 중간고사',
      subject: subject.value || '수학',
      duration: duration.value || '50',
      totalScore: totalScore.value || '100',
      layoutMode: layoutMode.value, // 현재 레이아웃 모드 전달
      returnBlob: returnBlob,
      save: !returnBlob,
      onProgress: (progress) => {
        console.log(`PDF 생성 진행: ${progress.message}`)
      }
    })

    console.log('PDF 생성 완료')

    // generateImageBasedPDF가 returnBlob이 true일 때 이미 blob을 반환함
    return result

  } catch (error) {
    console.error('PDF 생성 오류:', error)
    console.error('에러 스택:', error.stack)
    console.error('에러 메시지:', error.message)
    alert(`PDF 생성 중 오류가 발생했습니다.\n${error.message || '알 수 없는 오류'}`)
    throw error  // 에러를 다시 던져서 상위에서 처리할 수 있도록
  } finally {
    isGeneratingPDF.value = false
  }
}

// 기존 downloadPDF 함수 백업 (필요시 복구용)
const downloadPDF_OLD = async (returnBlob = false) => {
  /* 기존 방식 - 전체 페이지를 한번에 이미지로
  isGeneratingPDF.value = true

  try {
    await nextTick()

    // 페이지 요소들을 생성
    const pageElements = []

    for (let pageNum = 1; pageNum <= totalPages.value; pageNum++) {
      const pageDiv = document.createElement('div')
      pageDiv.className = 'pdf-page a4-page'
      pageDiv.style.cssText = `
        width: 794px;
        height: 1122px;
        padding: 75px;
        background: white;
        box-sizing: border-box;
        font-family: 'Noto Sans KR', sans-serif;
        position: relative;
      `

      // 첫 페이지 헤더
      if (pageNum === 1) {
        const headerHTML = `
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
            <h1 style="font-size: 28px; margin: 0 0 15px 0; color: #2c3e50;">
              ${examTitle.value || '2024학년도 중간고사'}
            </h1>
            <div style="font-size: 16px; color: #606f7b;">
              <span>과목: ${subject.value || '수학'}</span>
              <span style="margin: 0 20px;">|</span>
              <span>시간: ${duration.value || '50'}분</span>
              <span style="margin: 0 20px;">|</span>
              <span>총점: ${totalScore.value || '100'}점</span>
            </div>
          </div>
        `
        pageDiv.innerHTML = headerHTML
      }

      // 페이지 콘텐츠 추가
      const pageGroups = getPageGroups(pageNum)

      // 디버깅: 페이지 그룹 데이터 확인
      console.log(`Page ${pageNum} groups:`, pageGroups)
      console.log(`Page ${pageNum} groups length:`, pageGroups.length)
      if (pageGroups.length > 0) {
        console.log('First group:', pageGroups[0])
      }

      const contentDiv = document.createElement('div')

      // 레이아웃에 따른 스타일 설정
      if (layoutMode.value === 'double') {
        // 2단 레이아웃을 위한 CSS Grid 사용
        contentDiv.style.cssText = `
          font-size: 14px;
          line-height: 1.8;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          column-fill: balance;
        `
      } else {
        // 1단 레이아웃
        contentDiv.style.cssText = 'font-size: 14px; line-height: 1.8;'
      }

      contentDiv.innerHTML = renderPageContent(pageGroups, layoutMode.value)
      pageDiv.appendChild(contentDiv)

      // 페이지 푸터
      const footerDiv = document.createElement('div')
      footerDiv.style.cssText = `
        position: absolute;
        bottom: 40px;
        left: 0;
        right: 0;
        text-align: center;
        color: #606f7b;
        font-size: 14px;
      `
      footerDiv.innerHTML = `- ${pageNum} -`
      pageDiv.appendChild(footerDiv)

      pageElements.push(pageDiv)
    }

    // 임시 컨테이너에 추가
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px;'
    pageElements.forEach(el => tempContainer.appendChild(el))
    document.body.appendChild(tempContainer)

    // MathJax 렌더링
    await renderMathJaxForPDF(tempContainer)

    // 렌더링 완료 대기 (MathJax 및 이미지 로딩)
    await new Promise(resolve => setTimeout(resolve, 500))

    // 각 페이지에 data-element-id 추가 (html2canvas onclone 콜백용)
    pageElements.forEach((el, index) => {
      el.setAttribute('data-element-id', `page-${index}`)
    })

    // 이미지 기반 PDF 생성 (개선된 옵션)
    const pdf = await generatePDFFromPages(pageElements, {
      filename: `${examTitle.value || 'exam'}_${new Date().toISOString().split('T')[0]}.pdf`,
      imageFormat: 'png', // jpeg -> png로 변경 (텍스트 선명도 향상)
      imageQuality: 1.0, // 0.95 -> 1.0으로 품질 최대화
      margin: 10,
      onProgress: (progress) => {
        console.log(`PDF 생성 진행: ${progress.message}`)
      }
    })

    // 정리
    document.body.removeChild(tempContainer)

    if (returnBlob) {
      return pdfToBlob(pdf)
    } else {
      // PDF 다운로드
      savePDF(pdf, `${examTitle.value || 'exam'}_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    console.log('PDF 생성 완료')
    return pdf
  */

  // 임시로 빈 함수 반환 (기존 코드는 위에 주석처리)
  return null
}

// Save PDF handler for footer button (기존 함수명 변경)
const handleSavePDF = () => {
  // Emit save event to parent component (Step3ExamSave) with actual exam data
  const examData = {
    examTitle: examTitle.value,
    gradeCode: selectedGrade.value,
    gradeName: gradeMapping[selectedGrade.value],
    areaCode: selectedSubject.value,
    areaName: subjectMapping[selectedSubject.value],
    duration: duration.value,
    totalScore: totalScore.value,
    // 실제 문항 데이터 포함
    items: allQuestions.value,
    totalQuestions: allQuestions.value.length,
    createdAt: new Date().toISOString()
  }

  console.log('Saving exam data with items:', examData)
  emit('save', examData)
}

// Expose method for parent component
defineExpose({
  generateAndSavePDF
})

// PDF용 MathJax 렌더링
const renderMathJaxForPDF = async (container) => {
  // 모든 수식 요소에 mathjax-content 클래스 추가
  const mathElements = container.querySelectorAll('.question-text, .passage-content, .choice-text')
  mathElements.forEach(el => {
    if (!el.classList.contains('mathjax-content')) {
      el.classList.add('mathjax-content')
      el.setAttribute('data-mathjax-pending', 'true')
    }
  })

  // 스마트 병렬 렌더링
  await renderMathJaxSmartHybrid(container, {
    hideBeforeRender: false,
    clearFirst: false
  })

  // MathJax 렌더링 후 이미지 크기 조정 (더 크게)
  console.log('MathJax 렌더링 후 이미지 크기 조정 시작')
  const allImages = container.querySelectorAll('img')
  console.log(`총 ${allImages.length}개의 이미지 발견`)

  allImages.forEach(img => {
    // img_box 내부 이미지 처리 (표 이미지)
    const imgBox = img.closest('.img_box')
    if (imgBox) {
      console.log('img_box 내부 이미지 발견')
      imgBox.style.setProperty('max-width', '300px', 'important')
      imgBox.style.setProperty('display', 'inline-block', 'important')
      imgBox.style.setProperty('vertical-align', 'middle', 'important')
      img.style.setProperty('max-width', '100%', 'important')
      img.style.setProperty('max-height', '160px', 'important')
      img.style.setProperty('object-fit', 'scale-down', 'important')
    } else {
      // 일반 이미지
      img.style.setProperty('max-width', '250px', 'important')
      img.style.setProperty('max-height', '180px', 'important')
      img.style.setProperty('object-fit', 'scale-down', 'important')
      img.style.setProperty('display', 'inline-block', 'important')
      img.style.setProperty('vertical-align', 'middle', 'important')
    }

    // 천재교육 플랫폼 이미지
    if (img.src && img.src.includes('chunjae-platform')) {
      console.log('천재교육 이미지 발견:', img.src)
      img.style.setProperty('max-width', '280px', 'important')
      img.style.setProperty('max-height', '150px', 'important')
    }
  })

  console.log('이미지 크기 조정 완료')
}

// Initialize exam info from store
const initializeExamInfo = () => {
  const testBankStore = useTestBankStore()
  const examInfo = testBankStore.examInfo

  if (examInfo) {
    // Set grade
    if (examInfo.gradeCode) {
      selectedGrade.value = examInfo.gradeCode
    }

    // Set subject
    if (examInfo.areaCode) {
      selectedSubject.value = examInfo.areaCode
    } else if (examInfo.subjectCode) {
      selectedSubject.value = examInfo.subjectCode
    }

    // Set exam title if available
  if (examInfo.title || examInfo.examName) {
    examTitle.value = examInfo.title || examInfo.examName
  }

  // Update subject display name
  if (examInfo.areaName) {
    subject.value = examInfo.areaName
  } else {
    updateSubjectInfo()
  }

  // 총점 동기화 (store에 값이 있으면 우선 적용)
  if (typeof examInfo.totalPoints === 'number' && !isNaN(examInfo.totalPoints)) {
    totalScore.value = examInfo.totalPoints
  }
  }
}

// Initialize MathJax and render
onMounted(async () => {
  // Initialize exam info from store
  initializeExamInfo()

  // Calculate initial pagination
  calculateDynamicPagination()

  // Check for converted images
  const itemStore = useItemSelectionStore()
  const convertedImages = itemStore.getConvertedImages()
  console.log('Converted images on mount:', convertedImages)

  // Debug logging
  console.log('ExamPDFPreviewFixed mounted:', {
    selectedItems: props.selectedItems,
    allQuestions: allQuestions.value,
    convertedImages: convertedImages,
    previewImagesLength: previewImages.value.length,
    totalPages: totalPages.value,
    currentPage: currentPage.value
  })

  // MathJax 초기화
  if (!window.MathJax) {
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js'
    script.async = true
    document.head.appendChild(script)
  }

  // 초기 렌더링
  await nextTick()
  await renderCurrentPageMath()
})

// 현재 페이지 MathJax 렌더링
const renderCurrentPageMath = async () => {
  await nextTick()

  // requestAnimationFrame을 사용하여 렌더링 최적화 (Step2와 동일)
  requestAnimationFrame(async () => {
    const container = document.querySelector('.a4-page') || document.querySelector('.preview-content')
    if (container) {
      // 스마트 하이브리드 렌더링 (Step2와 동일한 옵션)
      await renderMathJaxSmartHybrid(container, {
        hideBeforeRender: true,
        clearFirst: false
      })

      // 렌더링 후 이미지 크기 조정 (더 크게)
      const allImages = container.querySelectorAll('img')
      allImages.forEach(img => {
        // img_box 내부 이미지 처리 (표 이미지)
        const imgBox = img.closest('.img_box')
        if (imgBox) {
          // img_box 컨테이너 스타일
          imgBox.style.setProperty('max-width', '320px', 'important')
          imgBox.style.setProperty('display', 'inline-block', 'important')
          imgBox.style.setProperty('vertical-align', 'middle', 'important')
          // 내부 이미지 스타일
          img.style.setProperty('max-width', '100%', 'important')
          img.style.setProperty('max-height', '160px', 'important')
          img.style.setProperty('object-fit', 'scale-down', 'important')
        }

        // 천재교육 플랫폼 이미지
        if (img.src && img.src.includes('chunjae-platform')) {
          img.style.setProperty('max-width', '280px', 'important')
          img.style.setProperty('max-height', '150px', 'important')
        }
      })
    }
  })
}

// 페이지 변경 시 MathJax 재렌더링
watch(currentPage, async () => {
  await renderCurrentPageMath()
  // 병렬 하이브리드로 추가 처리 (Step2 방식)
  const elements = document.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  if (elements.length > 0) {
    await renderMathJaxParallelHybrid(elements)
  }
})

// 레이아웃 변경 시 MathJax 재렌더링
watch(layoutMode, async () => {
  await renderCurrentPageMath()
  // 병렬 하이브리드로 추가 처리
  const elements = document.querySelectorAll('.mathjax-content[data-mathjax-pending="true"]')
  if (elements.length > 0) {
    await renderMathJaxParallelHybrid(elements)
  }
})
</script>

<style scoped>
.exam-pdf-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  background: #f5f7fa;
  overflow: hidden; /* 전체 컨테이너 overflow 방지 */
}

/* Header */
.preview-header {
  background: white;
  border-bottom: 1px solid #e0e6ed;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.header-left h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.header-info {
  display: flex;
  gap: 1rem;
}

/* Header Settings */
.header-settings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  max-width: 600px;
  margin: 0 1rem;
}

.settings-row {
  display: flex;
  gap: 0.75rem;
}

.grade-select,
.subject-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  min-width: 150px;
}

.grade-select:focus,
.subject-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.title-input,
.subject-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.title-input {
  flex: 2;
}

.subject-input {
  flex: 1;
}

.title-input:focus,
.subject-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #606f7b;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.layout-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.layout-btn:hover:not(.active) {
  border-color: #cbd5e0;
}

.zoom-btn {
  padding: 0.375rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn:hover {
  border-color: #cbd5e0;
  background: #f8fafc;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 0.875rem;
  color: #606f7b;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

/* Page Navigation */
.page-navigation {
  background: white;
  padding: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #e0e6ed;
}

.nav-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.separator {
  color: #cbd5e0;
}

/* Preview Container */
.preview-container {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto; /* 세로 스크롤만 허용 */
  overflow-x: hidden; /* 가로 스크롤 방지 */
  background: #f5f7fa;
  transform-origin: top center;
  max-height: calc(100% - 150px); /* 헤더와 네비게이션 높이 제외 */
  min-height: 0; /* Important for flexbox overflow */
}

/* A4 Page */
.a4-page {
  width: 210mm;
  min-height: 297mm; /* 고정 높이 대신 최소 높이 사용 */
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 15mm 20mm 20mm 20mm; /* 상단 여백 줄임 */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: visible; /* hidden에서 visible로 변경 */
  position: relative;
  box-sizing: border-box;
}

/* 이미지 기반 미리보기 스타일 */
.image-preview-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.a4-page.image-based {
  width: 210mm;
  min-height: 297mm;
  max-height: 297mm;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.a4-page.image-based .page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

.a4-page.image-based .page-content.layout-double {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
}

.image-item {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.image-item img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Image Grid Layout */
.images-wrapper {
  padding: 20px;
  width: 100%;
}

.debug-info {
  background: #f0f0f0;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

.images-grid.cols-1 {
  flex-direction: column;
}

.images-grid.cols-2 {
  flex-direction: row;
  justify-content: space-between;
}

.images-grid.cols-2 .image-container {
  width: calc(50% - 10px);
}

.image-container {
  width: 100%;
  margin-bottom: 20px;
}

.image-debug {
  background: #e8f4f8;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #555;
  border-left: 3px solid #007bff;
}

/* 변환된 문제 이미지 스타일 */
.converted-question-image {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  margin-bottom: 0 !important;
  border: 2px solid #007bff !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  background: white !important;
}

.image-error {
  background: #fee;
  color: #c00;
  padding: 20px;
  text-align: center;
  border: 2px dashed #c00;
  border-radius: 4px;
}

.no-images-message {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 16px;
  background: #f9f9f9;
  border: 2px dashed #ddd;
  border-radius: 8px;
  margin: 20px;
}

.pdf-page {
  page-break-after: always;
  margin-bottom: 20mm;
  min-height: 297mm; /* A4 height */
  max-height: 297mm;
  overflow: hidden;
  position: relative;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #2563eb;
}

.exam-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.exam-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.9375rem;
  color: #606f7b;
}

/* Page Content */
.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* PDF를 위한 적절한 페이지 브레이크 */
  break-before: auto;
  break-after: auto;
  page-break-before: auto;
  page-break-after: auto;
}

/* Single Column Layout */
.page-content.layout-single .questions-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Two-column layout with CSS columns for automatic flow */
.two-column-wrapper {
  /* Use CSS columns for automatic content flow */
  column-count: 2;
  column-gap: 2rem;
  column-rule: 1px solid #e0e6ed;
  column-fill: balance; /* 균형있게 채우기 */
  /* Ensure proper page breaks */
  break-before: auto;
  break-after: auto;
  break-inside: auto;
}

/* Remove manual column styling for CSS columns */
.two-column-wrapper .column {
  /* Columns are handled automatically by CSS columns */
  display: none; /* Hide manual column divs */
}

/* Direct children of two-column wrapper for automatic flow */
.two-column-wrapper > .passage-group,
.two-column-wrapper > .question-item {
  break-inside: avoid;
  margin-bottom: 0.75rem;
  display: block;
}

/* Passage Group */
.passage-group {
  margin-bottom: 1rem;
  page-break-inside: avoid;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
}

.passage-section {
  margin-bottom: 1rem;
}

.passage-header {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  break-inside: avoid;
  break-after: avoid;
  page-break-inside: avoid;
  page-break-after: avoid;
}

.passage-content {
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #2c3e50;
  /* 긴 지문은 필요시 페이지 경계에서 분할 */
  break-inside: avoid-page;
  page-break-inside: avoid;
}

/* Image sizing in all content areas - 더 크게 조정 */
.passage-content img,
.question-text img,
.choice-text img {
  max-width: 60% !important;
  width: auto !important;
  height: auto !important;
  max-height: 200px !important;
  display: inline-block !important;
  margin: 0.5rem 0.8rem !important;
  object-fit: contain !important;
  vertical-align: middle !important;
}

/* img_box 클래스를 가진 컨테이너의 이미지 특별 처리 - 표 이미지 */
.img_box {
  display: inline-block !important;
  max-width: 350px !important;
  width: auto !important;
  margin: 0.8rem auto !important;
  vertical-align: middle !important;
}

.img_box img {
  max-width: 100% !important;
  max-height: 180px !important;
  width: auto !important;
  height: auto !important;
  object-fit: scale-down !important;
  display: block !important;
}

/* 문제 내 img_box 표 이미지 */
.question-text .img_box,
.choice-text .img_box,
.passage-content .img_box {
  max-width: 320px !important;
}

.question-text .img_box img,
.choice-text .img_box img,
.passage-content .img_box img {
  max-height: 160px !important;
}

/* JPG 이미지 특별 처리 (천재교육 플랫폼) */
img[src*="chunjae-platform"],
img[src$=".JPG"],
img[src$=".jpg"] {
  max-width: 300px !important;
  max-height: 160px !important;
  object-fit: scale-down !important;
  display: inline-block !important;
}

/* 표 이미지는 특별히 더 작게 */
.passage-content table,
.question-text table {
  max-width: 80%;
  margin: 0.5rem auto;
}

.passage-content table img,
.question-text table img {
  max-width: 100%;
  max-height: 100px; /* 200px -> 100px로 축소 */
}

/* 일반 표 형태의 이미지 (표처럼 보이는 PNG) */
.passage-content img[src*="table"],
.question-text img[src*="table"],
.passage-content img[src*="표"],
.question-text img[src*="표"],
.passage-content img.table-image,
.question-text img.table-image {
  max-width: 70%;
  max-height: 120px;
  display: block;
  margin: 0.5rem auto;
}

/* Math formulas in images - 수식은 더 작게 */
.passage-content img[src*="math"],
.question-text img[src*="math"],
.choice-text img[src*="math"],
.passage-content img[src*="formula"],
.question-text img[src*="formula"],
.choice-text img[src*="formula"] {
  max-height: 40px; /* 60px -> 40px */
  max-width: auto;
  display: inline-block;
  vertical-align: middle;
  margin: 0 0.25rem;
}

/* Allow tables and complex HTML in passages to flow naturally */
.passage-content table,
.passage-content div {
  break-inside: auto;
}

.question-item {
  break-inside: avoid;
  page-break-inside: avoid;
  column-break-inside: avoid;
  -webkit-column-break-inside: avoid;
  margin-bottom: 0.75rem;
  position: relative;
  /* Prevent orphaned questions */
  orphans: 3;
  widows: 3;
}

/* Force page break after every 10-12 questions */
.question-item:nth-child(12n) {
  page-break-after: always;
}

.question-item.standalone {
  margin-bottom: 1rem;
  break-inside: avoid;
  page-break-inside: avoid;
  column-break-inside: avoid;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.question-number {
  font-weight: 600;
  color: #2563eb;
  font-size: 0.9rem;
}

.question-points {
  font-size: 0.875rem;
  color: #606f7b;
}

.question-text {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: #2c3e50;
  font-size: 0.875rem;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-left: 1rem;
}

.choice {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.choice-number {
  color: #606f7b;
  min-width: 20px;
}

.choice-text {
  flex: 1;
  line-height: 1.5;
  color: #2c3e50;
  font-size: 0.825rem;
}

/* Page Footer */
.page-footer {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #606f7b;
  font-size: 0.875rem;
  width: 100%;
}

/* PDF Generation */
.pdf-pages {
  background: white;
  /* Handle multiple pages properly */
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e6ed;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* MathJax Styles */
.mathjax-content mjx-container {
  font-size: inherit !important;
  margin: 0.25em 0;
}

.mathjax-content mjx-container[display="true"] {
  margin: 1em 0;
  text-align: center;
}

/* MathJax 처리된 콘텐츠 내부의 이미지 강제 크기 조정 */
.mathjax-processed .img_box,
.mathjax-rendered .img_box,
.mathjax-content .img_box {
  max-width: 80px !important;
  width: auto !important;
  display: inline-block !important;
  vertical-align: middle !important;
}

.mathjax-processed .img_box img,
.mathjax-rendered .img_box img,
.mathjax-content .img_box img {
  max-width: 80px !important;
  max-height: 18px !important;
  width: auto !important;
  height: auto !important;
  object-fit: scale-down !important;
}

/* MathJax 처리된 콘텐츠의 모든 이미지 강제 축소 */
.mathjax-processed img,
.mathjax-rendered img,
.mathjax-content img,
.question-text.mathjax-processed img,
.question-text.mathjax-rendered img {
  max-width: 70px !important;
  max-height: 18px !important;
  width: auto !important;
  height: auto !important;
  object-fit: scale-down !important;
  display: inline-block !important;
  vertical-align: middle !important;
}

/* 천재교육 플랫폼 이미지 특별 강제 처리 */
img[src*="chunjae-platform"] {
  max-width: 70px !important;
  max-height: 16px !important;
  width: auto !important;
  height: auto !important;
}

.question-text mjx-container,
.choice-text mjx-container {
  display: inline-block;
  vertical-align: middle;
}

.passage-content mjx-container {
  font-size: 0.95em;
}

/* Continuation Indicators for Split Content */
.passage-continuation-indicator,
.passage-continue-indicator,
.passage-continue,
p.passage-continue,
.continuation-header {
  color: #606f7b;
  font-style: italic;
  font-size: 0.875rem;
  margin: 0.75rem 0;
  padding: 0.375rem 0.75rem;
  background: #f8f9fa;
  border-left: 3px solid #cbd5e0;
  display: block;
  clear: both;
}

.passage-group.continuation {
  margin-top: 1.5rem;
}

.continuation-header {
  margin-bottom: 1rem;
  font-weight: 500;
}

/* PDF Page Break Control */
.question-block,
.question-item,
.passage-group {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

.page-break-before {
  page-break-before: always !important;
}

.page-break-after {
  page-break-after: always !important;
}

/* PDF Font Optimization */
/* Print Mode Classes for html2canvas */
.print-mode {
  /* 인쇄용 최적화 스타일 */
  font-family: 'Noto Sans KR', sans-serif !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}

.print-mode * {
  /* 모든 자식 요소에 인쇄 최적화 적용 */
  box-decoration-break: clone !important;
  -webkit-box-decoration-break: clone !important;
}

.print-mode .layout-double {
  /* 2단 레이아웃 인쇄 최적화 */
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 15px !important;
  break-inside: avoid !important;
}

.print-mode .passage-group,
.print-mode .question-item {
  /* 문제 그룹이 페이지를 넘어가지 않도록 */
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

@media print {
  /* A4 page setup */
  @page {
    size: A4;
    margin: 15mm 15mm 20mm 15mm;
  }

  body {
    font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif !important;
  }

  .exam-title {
    font-size: 18pt !important;
    font-weight: bold !important;
    margin-bottom: 10mm !important;
  }

  .question-number {
    font-size: 10pt !important;
    font-weight: bold !important;
  }

  .question-text {
    font-size: 10pt !important;
    line-height: 1.5 !important;
  }

  .passage-content {
    font-size: 9.5pt !important;
    line-height: 1.6 !important;
    text-align: justify !important;
  }

  .choice-text {
    font-size: 9.5pt !important;
    line-height: 1.4 !important;
  }

  /* MathJax 수식 크기 */
  mjx-container {
    font-size: 10pt !important;
  }

  mjx-container[display="false"] {
    font-size: 9.5pt !important;
  }

  mjx-container[display="true"] {
    font-size: 10pt !important;
    margin: 8px 0 !important;
  }

  /* 페이지 설정 */
  @page {
    size: A4;
    margin: 15mm 10mm;
  }

  /* 문제가 페이지를 넘어가지 않도록 */
  .question-item {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-bottom: 10mm !important;
  }

  .passage-group {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* 지문과 관련 문제 함께 유지 */
  .passage-section + .question-item {
    page-break-before: avoid !important;
  }

  /* 숨김 요소 */
  .preview-header,
  .page-navigation,
  .loading-overlay {
    display: none !important;
  }

  .preview-container {
    padding: 0;
    transform: none !important;
  }

  .a4-page {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
    width: 100%;
    height: auto;
    padding: 0;
  }

  .pdf-page {
    page-break-after: always !important;
    min-height: 277mm !important; /* A4 minus margins */
    max-height: 277mm !important;
  }

  /* Image sizing for print - 인쇄 시 더 작게 */
  .passage-content img,
  .question-text img,
  .choice-text img {
    max-width: 50% !important;
    max-height: 60px !important;
    page-break-inside: avoid !important;
  }

  /* 표 이미지는 인쇄 시 특별 처리 */
  .passage-content table img,
  .question-text table img,
  .passage-content img[src*="table"],
  .question-text img[src*="table"],
  /* PNG 파일 및 표 이미지 특별 처리 - 매우 작게 */
  .passage-content img[src*="표"],
  .question-text img[src*="표"],
  .passage-content img[src*="table"],
  .question-text img[src*="table"],
  .passage-content img[src$=".png"],
  .question-text img[src$=".png"],
  .choice-text img[src$=".png"] {
    max-width: 80px !important;
    max-height: 20px !important;
    object-fit: scale-down !important;
    display: inline-block !important;
  }

  /* 수식 이미지는 인쇄 시 더 작게 */
  img[src*="math"],
  img[src*="formula"],
  img[src*="equation"] {
    max-height: 25px !important;
    max-width: auto !important;
  }

  /* 일반 이미지도 인쇄시 더 작게 */
  .passage-content img,
  .question-text img,
  .choice-text img {
    max-height: 40px !important;
    max-width: 35% !important;
  }

  /* Hide input elements in print */
  input, textarea, [contenteditable] {
    display: none !important;
  }

  /* Ensure columns work in print */
  .two-column-wrapper {
    column-count: 2 !important;
    column-gap: 15mm !important;
  }
}

/* Footer Styles */
.preview-footer {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e0e6ed;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.04);
  z-index: 100;
  margin-top: auto;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.footer-actions {
  display: flex;
  gap: 1rem;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-action.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e0e6ed;
}

.btn-action.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
}

.btn-action.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
}

.btn-action.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}
</style>
