<!--
  시험지 마법사 Step 2: 문항 선택 (Enhanced)
  
  이 컴포넌트는 시험지에 포함할 문항들을 선택하는 단계입니다.
  주요 기능:
  - 실제 Backend API 연동
  - Elasticsearch 유사 문항 검색
  - 실시간 검색 with 디바운싱
  - 가상 스크롤링으로 성능 최적화
  - Toast 알림 시스템
  - 반응형 디자인
  - 문항 이미지 lazy loading
  - 향상된 UX/UI
-->

<template>
  <div class="step2-container">
    <!-- 헤더 영역 -->
    <div class="selection-header">
      <div class="header-left">
        <button class="btn-back" @click="handleBack">← 이전</button>
        <h2>문항 선택</h2>
      </div>
      <div class="header-info">
        <span class="exam-name">{{ examInfo?.examName || '새 시험지' }}</span>
        <span class="divider">|</span>
        <span class="grade">{{ examInfo?.gradeName }}</span>
        <span class="divider">|</span>
        <span class="subject">{{ examInfo?.subjectName }}</span>
      </div>
    </div>

    <!-- 검색 바 -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="문항 내용 검색... (예: 이차방정식, 삼각함수)"
            class="search-input"
            @keyup.enter="performSearch"
          />
          <button class="search-button" @click="performSearch" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-mini"></span>
            <span v-else>🔍</span>
          </button>
        </div>
        <div class="search-stats" v-if="totalItems > 0">
          총 {{ totalItems }}개 문항 중 {{ selectedItems.length }}개 선택
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 영역 -->
    <div class="content-wrapper">
      <!-- 왼쪽 사이드바: 교과서 선택 및 필터 -->
      <div class="left-sidebar">
        <div class="sidebar-scroll">
          <!-- 교과서 선택 섹션 -->
          <div class="textbook-section" v-if="subjects.length > 0">
            <div class="section-header">
              <h3>
                <span class="section-icon">📚</span>
                교과서 선택
              </h3>
              <span class="section-desc">하나의 교과서를 선택하여 문제를 검색합니다</span>
            </div>
          
            <!-- 로딩 상태 -->
            <div v-if="isSubjectsLoading" class="textbook-loading">
              <div class="spinner"></div>
              <p>교과서 정보를 불러오는 중...</p>
            </div>
          
            <!-- 교과서 그리드 -->
            <div v-else class="textbook-grid">
              <div 
                v-for="subject in subjects" 
                :key="subject.subjectId"
                :class="['textbook-card', { 'selected': selectedTextbook === subject.subjectId }]"
                @click="selectTextbook(subject.subjectId)"
              >
                <!-- 교과서 표지 이미지 -->
                <div class="textbook-icon">
                  <img 
                    v-if="subject.subjectThumbnail" 
                    :src="subject.subjectThumbnail" 
                    :alt="subject.subjectName"
                    class="textbook-cover"
                    @error="handleCoverImageError($event)"
                  />
                  <span v-else>📖</span>
                </div>
                
                <div class="textbook-info">
                  <h5>{{ subject.subjectName }}</h5>
                  <p class="publisher">{{ subject.gradeName }} | {{ subject.areaName }}</p>
                  <span class="year-badge">{{ subject.termName || '전체' }}</span>
                </div>
                
                <div class="item-count">
                  <span class="count-number">{{ subject.itemCount || 0 }}</span>
                  <span class="count-label">문항</span>
                </div>
                
                <div class="textbook-radio">
                  <span v-if="selectedTextbook === subject.subjectId">●</span>
                  <span v-else>○</span>
                </div>
              </div>
            </div>
          </div> <!-- textbook-section 닫기 -->

          <!-- 필터 섹션 -->
          <div class="filter-section">
            <div class="section-header">
              <h3>
                <span class="section-icon">🔍</span>
                상세 필터
              </h3>
              <button class="btn-reset" @click="resetFilters">
                <span>↻</span> 초기화
              </button>
            </div>
          
            <div class="filter-content">
              <!-- 단원 선택 (트리 구조) -->
              <div class="filter-group" v-if="selectedTextbook && chapterTree.length > 0">
                <label class="filter-label">
                  <span class="label-icon">📑</span>
                  단원 선택
                  <span class="filter-subtitle">대단원을 클릭하여 중단원을 선택하세요</span>
                </label>
                <div class="chapter-tree-container">
                  <div class="chapter-tree">
                    <div v-for="largeChapter in chapterTree" :key="largeChapter.id" class="large-chapter">
                      <div 
                        class="large-chapter-header" 
                        @click="toggleLargeChapter(largeChapter.id)"
                        :class="{ 'expanded': expandedChapters.includes(largeChapter.id) }"
                      >
                        <div class="chapter-header-left">
                          <span class="expand-icon">
                            <svg v-if="!expandedChapters.includes(largeChapter.id)" width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M5 9L12 16L19 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </span>
                          <span class="chapter-name">{{ largeChapter.name }}</span>
                        </div>
                        <div class="chapter-header-right">
                          <span class="item-count">
                            <span class="count-value">{{ largeChapter.itemCount || 0 }}</span>
                            <span class="count-label">문항</span>
                          </span>
                          <span v-if="getSelectedCountInChapter(largeChapter) > 0" class="selected-indicator">
                            {{ getSelectedCountInChapter(largeChapter) }}개 선택
                          </span>
                        </div>
                      </div>
                      
                      <transition name="slide">
                        <div v-if="expandedChapters.includes(largeChapter.id)" class="medium-chapters">
                          <div v-if="largeChapter.mediumChapters && largeChapter.mediumChapters.length > 0">
                            <label 
                              v-for="mediumChapter in largeChapter.mediumChapters" 
                              :key="mediumChapter.id"
                              class="medium-chapter-item"
                              :class="{ 'selected': selectedMediumChapters.includes(mediumChapter.id) }"
                            >
                              <div class="checkbox-wrapper">ㄴ
                                <input 
                                  type="checkbox"
                                  :id="`medium-${mediumChapter.id}`"
                                  :value="mediumChapter.id"
                                  v-model="selectedMediumChapters"
                                  @change="updateChapterFilter"
                                />
                                <label :for="`medium-${mediumChapter.id}`" class="custom-checkbox">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="check-icon">
                                    <path d="M5 12L10 17L20 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </label>
                              </div>
                              <div class="chapter-info">
                                <span class="chapter-name">{{ mediumChapter.name }}</span>
                              </div>
                              <span class="item-count">
                                <span class="count-value">{{ mediumChapter.itemCount || 0 }}</span>
                                <span class="count-label">문항</span>
                              </span>
                            </label>
                          </div>
                          <div v-else class="no-medium-chapters">
                            중단원이 없습니다
                          </div>
                        </div>
                      </transition>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 교과서 미선택 안내 -->
              <div v-else-if="!selectedTextbook" class="filter-group">
                <div class="no-textbook-message">
                  <span class="icon">📚</span>
                  <p>먼저 교과서를 선택해주세요</p>
                </div>
              </div>

              <!-- 난이도 선택 (실제 DB 코드 사용) -->
              <div class="filter-group">
                <label class="filter-label">
                  <span class="label-icon">📊</span>
                  난이도
                </label>
                <div class="difficulty-buttons">
                  <button 
                    :class="['difficulty-btn', 'diff-high', { 'active': filters.difficulties.includes('4') }]"
                    @click="toggleDifficulty('4')"
                  >
                    <span class="diff-icon">🔴</span>
                    <span>상</span>
                  </button>
                  <button 
                    :class="['difficulty-btn', 'diff-medium', { 'active': filters.difficulties.includes('3') }]"
                    @click="toggleDifficulty('3')"
                  >
                    <span class="diff-icon">🟡</span>
                    <span>중</span>
                  </button>
                  <button 
                    :class="['difficulty-btn', 'diff-low', { 'active': filters.difficulties.includes('2') }]"
                    @click="toggleDifficulty('2')"
                  >
                    <span class="diff-icon">🟢</span>
                    <span>하</span>
                  </button>
                </div>
              </div>

              <!-- 문제 유형 (실제 DB 코드 사용) -->
              <div class="filter-group">
                <label class="filter-label">
                  <span class="label-icon">📝</span>
                  문제 유형
                </label>
                <div class="type-buttons">
                  <button 
                    :class="['type-btn', { 'active': questionFormFilters.includes('50') }]"
                    @click="toggleQuestionForm('50')"
                  >
                    <span class="type-icon">🔘</span>
                    <span>5지선택</span>
                  </button>
                  <button 
                    :class="['type-btn', { 'active': questionFormFilters.includes('60') }]"
                    @click="toggleQuestionForm('60')"
                  >
                    <span class="type-icon">✏️</span>
                    <span>단답유순</span>
                  </button>
                  <button 
                    :class="['type-btn', { 'active': questionFormFilters.includes('70') }]"
                    @click="toggleQuestionForm('70')"
                  >
                    <span class="type-icon">📄</span>
                    <span>서술형</span>
                  </button>
                </div>
              </div>

              <button class="btn-search" @click="searchItems">
                <span>🔍</span> 검색하기
              </button>
            </div>
          </div> <!-- filter-section 닫기 -->
        </div> <!-- sidebar-scroll 닫기 -->
      </div> <!-- left-sidebar 닫기 -->

      <!-- 중앙: 문항 목록 -->
      <div class="center-panel">
        <div class="items-header">
          <span>검색 결과 ({{ totalItems }}개)</span>
          <label class="select-all">
            <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected">
            전체 선택
          </label>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>문항을 불러오는 중...</p>
        </div>

        <!-- 문항 그리드 (가상 스크롤링 적용) -->
        <div v-else class="items-grid" ref="itemsContainer">
          <div 
            v-for="item in visibleItems" 
            :key="item.itemId"
            :class="['item-card', { selected: isSelected(item.itemId) }]"
            :style="{ transform: `translateY(${offsetY}px)` }"
            @click="toggleSelection(item)"
          >
            <!-- 가상 스크롤 스페이서 -->
            <div class="virtual-spacer" :style="{ height: totalHeight + 'px' }"></div>
            
            <!-- 카드 헤더 -->
            <div class="item-card-header">
              <div class="item-header-left">
                <label class="custom-item-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="isSelected(item.itemId)"
                    @click.stop="toggleSelection(item)"
                  />
                  <span class="checkbox-mark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L20 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </label>
                <span class="item-number">No. {{ item.itemId }}</span>
              </div>
              <div class="item-header-right">
                <span :class="['difficulty-badge', `difficulty-${item.difficulty?.code}`]">
                  {{ getDifficultyName(item.difficulty?.code) }}
                </span>
                <span class="type-badge">
                  {{ getQuestionFormName(item.questionForm?.code) }}
                </span>
              </div>
            </div>

            <!-- 문항 내용 -->
            <div class="item-content">
              <!-- 이미지가 있는 경우 -->
              <div v-if="item.hasImageData && item.questionImageUrl" class="item-image-container">
                <img 
                  :src="item.questionImageUrl" 
                  :alt="`문항 ${item.itemId}`"
                  loading="lazy"
                  @error="handleImageError($event, item)"
                  @click.stop="showImageModal(item.questionImageUrl)"
                  class="item-image"
                />
                <button class="btn-zoom" @click.stop="showImageModal(item.questionImageUrl)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>

              <!-- HTML 콘텐츠가 있는 경우 -->
              <div v-else-if="item.hasHtmlData" class="item-html-content">
                <div class="question-text" v-html="truncateHtml(item.questionHtml, 200)"></div>
              </div>

              <!-- 콘텐츠가 없는 경우 -->
              <div v-else class="item-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>문항 내용이 없습니다</span>
              </div>
            </div>

            <!-- 카드 푸터 -->
            <div class="item-card-footer">
              <div class="chapter-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>{{ item.chapterName || item.chapter?.name || '단원 미지정' }}</span>
              </div>
              <button 
                class="btn-similar"
                @click.stop="showSimilarItems(item)"
                :disabled="isSimilarItemsLoading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 9L3 3M9 3L3 9M15 9L21 3M21 9L15 3M15 15L21 21M15 21L21 15M9 15L3 21M3 15L9 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                유사
              </button>
            </div>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-if="!isLoading && items.length === 0" class="empty-state">
          <p>검색 결과가 없습니다.</p>
          <p class="empty-hint">다른 검색 조건을 시도해보세요.</p>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="page-btn prev"
            :disabled="currentPage === 1"
            @click="loadPage(currentPage - 1)"
          >
            ‹
          </button>
          
          <button 
            v-for="page in displayPages" 
            :key="page"
            :class="['page-btn', { active: page === currentPage }]"
            @click="loadPage(page)"
            :disabled="page === '...'"
          >
            {{ page }}
          </button>
          
          <button 
            class="page-btn next"
            :disabled="currentPage === totalPages"
            @click="loadPage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div> <!-- center-panel 닫기 -->

      <!-- 오른쪽: 선택된 문항 -->
      <div class="right-sidebar">
        <div class="selected-header">
          <h3>선택된 문항</h3>
          <span class="selected-count">{{ selectedItems.length }}개</span>
        </div>

        <!-- 선택된 문항이 없을 때 -->
        <div v-if="selectedItems.length === 0" class="no-selection">
          <p>선택된 문항이 없습니다.</p>
          <p class="hint">왼쪽에서 문항을 선택해주세요.</p>
        </div>

        <!-- 선택된 문항 목록 (드래그 가능) -->
        <div v-else class="selected-items-list">
          <transition-group name="list" tag="div">
            <div 
              v-for="(item, index) in selectedItems" 
              :key="item.itemId"
              class="selected-item"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent
              @drop="handleDrop($event, index)"
            >
              <span class="drag-handle">≡</span>
              <span class="item-order">{{ index + 1 }}</span>
              <div class="item-info">
                <span class="item-title">문항 #{{ item.itemId }}</span>
                <span class="item-meta">
                  {{ item.difficulty?.name }} | {{ item.questionForm?.name }}
                </span>
              </div>
              <button class="btn-remove" @click="removeItem(item.itemId)">
                ×
              </button>
            </div>
          </transition-group>
        </div>

        <!-- 선택된 문항 액션 -->
        <div class="selected-actions">
          <button class="btn btn-outline" @click="clearSelection">
            전체 해제
          </button>
          <button class="btn btn-outline" @click="randomizeOrder">
            순서 섞기
          </button>
        </div>
      </div> <!-- right-sidebar 닫기 -->
    </div> <!-- content-wrapper 닫기 -->

    <!-- 하단 액션 버튼 -->
    <div class="footer-actions">
      <button class="btn btn-secondary" @click="handleBack">
        ← 이전 단계
      </button>
      <div class="footer-info">
        <span>선택된 문항: {{ selectedItems.length }}개</span>
      </div>
      <button 
        class="btn btn-primary"
        :disabled="selectedItems.length === 0"
        @click="proceedToNext"
      >
        다음 단계 →
      </button>
    </div>

    <!-- 이미지 확대 모달 -->
    <div v-if="showModal" class="image-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">×</button>
        <img :src="modalImageUrl" alt="확대 이미지" />
      </div>
    </div>

    <!-- 유사문항 모달 -->
    <div v-if="showSimilarModal" class="similar-modal" @click="closeSimilarModal">
      <div class="similar-modal-content" @click.stop>
        <div class="similar-modal-header">
          <h3>유사 문항 검색 결과</h3>
          <button class="modal-close" @click="closeSimilarModal">×</button>
        </div>
        
        <div class="similar-modal-body">
          <!-- 기준 문항 -->
          <div class="base-item-section">
            <h4>기준 문항</h4>
            <div class="base-item-card">
              <div class="item-number">문항 #{{ currentBaseItem?.itemId }}</div>
              <div class="item-preview">
                <div v-if="currentBaseItem?.questionImageUrl" class="item-image-small">
                  <img :src="currentBaseItem.questionImageUrl" :alt="`문항 ${currentBaseItem.itemId}`" />
                </div>
                <div v-else-if="currentBaseItem?.questionHtml" class="item-html-small" v-html="truncateHtml(currentBaseItem.questionHtml, 100)"></div>
                <div v-else class="no-content">문항 내용 없음</div>
              </div>
            </div>
          </div>

          <!-- 유사 문항 목록 -->
          <div class="similar-items-section">
            <h4>유사 문항 ({{ currentSimilarItems.length }}개)</h4>
            
            <div v-if="isSimilarItemsLoading" class="similar-loading">
              <div class="spinner"></div>
              <p>유사 문항을 검색하는 중...</p>
            </div>
            
            <div v-else-if="currentSimilarItems.length === 0" class="no-similar-items">
              <p>유사한 문항을 찾을 수 없습니다.</p>
            </div>
            
            <div v-else class="similar-items-list">
              <div 
                v-for="similar in currentSimilarItems" 
                :key="similar.itemId"
                :class="['similar-item-card', { 'selected': isSelected(similar.itemId) }]"
                @click="toggleSelection(similar)"
              >
                <div class="similarity-score">
                  유사도: {{ Math.round(similar.score * 100) }}%
                </div>
                
                <div class="item-checkbox">
                  <input 
                    type="checkbox"
                    :checked="isSelected(similar.itemId)"
                    @click.stop="toggleSelection(similar)"
                  />
                </div>
                
                <div class="item-number">문항 #{{ similar.itemId }}</div>
                
                <div class="item-content-small">
                  <div v-if="similar.questionImageUrl" class="item-image-small">
                    <img :src="similar.questionImageUrl" :alt="`문항 ${similar.itemId}`" loading="lazy" />
                  </div>
                  <div v-else-if="similar.questionHtml" class="item-html-small" v-html="truncateHtml(similar.questionHtml, 100)"></div>
                  <div v-else class="no-content">문항 내용 없음</div>
                </div>
                
                <div class="similar-item-meta">
                  <span class="difficulty-badge">{{ getDifficultyName(similar.difficulty?.code) }}</span>
                  <span class="type-badge">{{ getQuestionFormName(similar.questionForm?.code) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="similar-modal-footer">
          <button class="btn btn-secondary" @click="closeSimilarModal">
            취소
          </button>
          <button class="btn btn-primary" @click="selectAllSimilarItems" :disabled="currentSimilarItems.length === 0">
            모두 선택 ({{ currentSimilarItems.filter(item => !isSelected(item.itemId)).length }}개)
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 알림 컨테이너 -->
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
        >
          <div class="toast-icon">
            <span v-if="toast.type === 'success'">✅</span>
            <span v-else-if="toast.type === 'error'">❌</span>
            <span v-else-if="toast.type === 'warning'">⚠️</span>
            <span v-else>ℹ️</span>
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" @click="removeToast(toast.id)">×</button>
        </div>
      </transition-group>
    </div>
  </div> <!-- step2-container 닫기 -->
</template>