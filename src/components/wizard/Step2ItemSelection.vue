<!--
  Step2 문항 선택 - UI 개선 버전
  
  개선사항:
  - 통합 헤더로 공간 최적화
  - 사이드바 필터 방식으로 변경
  - 트리 구조 기본 확장
  - 컨텐츠 영역 최대화
  - 깔끔한 디자인
-->

<template>
  <div class="step2-improved">
    <!-- 통합 컴팩트 헤더 -->
    <header class="unified-header">
      <div class="header-left">
        <button class="btn-back" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          이전
        </button>
        <div class="header-info">
          <h2>문항 선택</h2>
          <div class="exam-meta">
            <span class="meta-item">{{ examInfo?.gradeName }}</span>
            <span class="divider">·</span>
            <span class="meta-item">{{ examInfo?.subjectName }}</span>
            <span class="divider">·</span>
            <span class="meta-item primary">{{ selectedItems.length }}문항 선택</span>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <!-- 검색바 -->
        <div class="search-wrapper">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="문항 검색..."
            class="search-input"
            @input="handleSearchWithDebounce"
          />
        </div>

        <!-- 뷰 모드 토글 -->
        <div class="view-toggle">
          <button 
            :class="['view-btn', { active: viewMode === 'grid' }]"
            @click="viewMode = 'grid'"
            title="그리드 보기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button 
            :class="['view-btn', { active: viewMode === 'list' }]"
            @click="viewMode = 'list'"
            title="리스트 보기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- 선택된 문항 패널 토글 -->
        <button 
          class="btn-selected"
          @click="showSelectedPanel = !showSelectedPanel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" 
                  stroke="currentColor" stroke-width="2"/>
          </svg>
          선택 목록
          <span class="badge">{{ selectedItems.length }}</span>
        </button>
      </div>
    </header>

    <!-- 메인 레이아웃 -->
    <div class="main-layout">
      <!-- 왼쪽 사이드바 필터 -->
      <aside class="filter-sidebar" :class="{ collapsed: filterCollapsed }">
        <div class="sidebar-header">
          <h3>필터</h3>
          <button 
            class="btn-toggle"
            @click="filterCollapsed = !filterCollapsed"
            :title="filterCollapsed ? '필터 열기' : '필터 닫기'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path :d="filterCollapsed ? 'M9 18L15 12L9 6' : 'M15 18L9 12L15 6'" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div v-if="!filterCollapsed" class="filter-content">
          <!-- 학년 선택 -->
          <div class="filter-section">
            <h4>학년</h4>
            <div class="grade-filters">
              <label 
                v-for="grade in gradeOptions"
                :key="grade.code"
                class="filter-chip"
                :class="{ active: selectedGrade === grade.code }"
              >
                <input 
                  type="radio"
                  :value="grade.code"
                  v-model="selectedGrade"
                  @change="handleGradeChange"
                />
                <span>{{ grade.name }}</span>
              </label>
            </div>
          </div>

          <!-- 과목 선택 -->
          <div class="filter-section">
            <h4>과목</h4>
            <div class="subject-filters">
              <label 
                v-for="subject in subjectOptions"
                :key="subject.code"
                class="filter-chip"
                :class="{ active: selectedSubject === subject.code }"
              >
                <input 
                  type="radio"
                  :value="subject.code"
                  v-model="selectedSubject"
                  @change="handleSubjectChange"
                />
                <span>{{ subject.name }}</span>
              </label>
            </div>
          </div>

          <!-- 교과서 선택 -->
          <div class="filter-section">
            <h4>교과서</h4>
            <select 
              v-model="selectedTextbook" 
              @change="handleTextbookChange"
              class="select-input"
              :disabled="!selectedGrade || !selectedSubject"
            >
              <option value="">{{ (!selectedGrade || !selectedSubject) ? '학년과 과목을 먼저 선택하세요' : '전체' }}</option>
              <option 
                v-for="textbook in textbooks" 
                :key="textbook.subjectId"
                :value="textbook.subjectId"
              >
                {{ textbook.subjectName }} ({{ textbook.itemCount }}문항)
              </option>
            </select>
          </div>

          <!-- 단원 트리 -->
          <div class="filter-section" v-if="chapterTree.length > 0">
            <h4>단원</h4>
            <div class="chapter-tree">
              <div 
                v-for="chapter in chapterTree" 
                :key="chapter.id"
                class="chapter-node"
              >
                <label class="chapter-item">
                  <input 
                    type="checkbox"
                    :value="chapter.id"
                    :checked="isChapterSelected(chapter)"
                    @change="handleLargeChapterChange(chapter, $event)"
                  />
                  <span class="chapter-name">{{ chapter.name }}</span>
                  <span class="item-count">{{ chapter.itemCount }}</span>
                </label>
                
                <!-- 중단원 -->
                <div v-if="chapter.children" class="sub-chapters">
                  <label 
                    v-for="subChapter in chapter.children"
                    :key="subChapter.id"
                    class="chapter-item sub"
                  >
                    <input 
                      type="checkbox"
                      :value="subChapter.id"
                      v-model="selectedMediumChapters"
                      @change="handleMediumChapterChange"
                    />
                    <span class="chapter-name">{{ subChapter.name }}</span>
                    <span class="item-count">{{ subChapter.itemCount }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 난이도 필터 -->
          <div class="filter-section">
            <h4>난이도</h4>
            <div class="difficulty-filters">
              <label 
                v-for="level in difficultyLevels"
                :key="level.code"
                class="filter-chip"
                :class="{ active: difficultyFilters.includes(level.code) }"
              >
                <input 
                  type="checkbox"
                  :value="level.code"
                  v-model="difficultyFilters"
                  @change="applyFilters"
                />
                <span :class="'difficulty-' + level.code">{{ level.name }}</span>
              </label>
            </div>
          </div>

          <!-- 문제 유형 필터 -->
          <div class="filter-section">
            <h4>문제 유형</h4>
            <div class="type-filters">
              <label 
                v-for="type in questionTypes"
                :key="type.code"
                class="filter-chip"
                :class="{ active: questionFormFilters.includes(type.code) }"
              >
                <input 
                  type="checkbox"
                  :value="type.code"
                  v-model="questionFormFilters"
                  @change="applyFilters"
                />
                <span>{{ type.name }}</span>
              </label>
            </div>
          </div>

          <!-- 필터 초기화 -->
          <button 
            v-if="hasActiveFilters"
            class="btn-reset-filters"
            @click="resetFilters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12V9C4 5.68629 6.68629 3 10 3H20M20 3L17 6M20 3L17 0M20 12V15C20 18.3137 17.3137 21 14 21H4M4 21L7 18M4 21L7 24" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            필터 초기화
          </button>
        </div>
      </aside>

      <!-- 중앙 컨텐츠 영역 -->
      <main class="content-area">
        <!-- 컨텐츠 헤더 -->
        <div class="content-header">
          <div class="result-info">
            <span>검색 결과</span>
            <strong>{{ totalItems }}개</strong>
          </div>
          
          <div class="content-actions">
            <label class="select-all">
              <input 
                type="checkbox" 
                @change="toggleSelectAll"
                :checked="isAllSelected"
              />
              전체 선택
            </label>
            
            <button 
              class="btn-random"
              @click="showRandomGenerator = true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 3L21 5L19 7M5 12H21M19 17L21 19L19 21M5 19H9M14 5H5" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              랜덤 생성
            </button>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>문항을 불러오는 중...</p>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="items.length === 0" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어나 필터를 시도해보세요</p>
        </div>

        <!-- 지문 그룹 표시 (passageId가 있는 문제들) -->
        <div v-if="hasPassageGroups && viewMode === 'grid'" class="passage-groups">
          <div 
            v-for="group in passageGroups"
            :key="group.passageId"
            class="passage-group"
          >
            <!-- 왼쪽: 지문 영역 -->
            <div class="passage-section">
              <div class="passage-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" 
                        stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>지문</span>
              </div>
              <div class="passage-content">
                <div v-if="group.passageHtml" v-html="sanitizeHtml(group.passageHtml)" class="passage-text"></div>
                <div v-else-if="group.passageText" class="passage-text">{{ group.passageText }}</div>
              </div>
            </div>
            
            <!-- 오른쪽: 문제 영역 -->
            <div class="passage-items">
              <div 
                v-for="item in group.items"
                :key="item.itemId"
                :class="['item-card', { selected: isSelected(item.itemId) }]"
                @click="toggleSelection(item)"
              >
                <!-- 카드 헤더 -->
                <div class="card-header">
                  <label class="item-checkbox">
                    <input
                      type="checkbox"
                      :checked="isSelected(item.itemId)"
                      @click.stop="toggleSelection(item)"
                    />
                    <span class="checkbox-icon"></span>
                  </label>
                  <span class="item-id">#{{ item.itemId }}</span>
                  <div class="item-badges">
                    <span :class="'badge-difficulty difficulty-' + item.difficulty?.code">
                      {{ item.difficulty?.name }}
                    </span>
                    <span class="badge-type">{{ item.questionForm?.name }}</span>
                  </div>
                </div>
                
                <!-- 카드 내용 -->
                <div class="card-body">
                  <!-- 문제 내용 -->
                  <div class="question-section">
                    <div v-if="item.questionHtml" class="item-html" v-html="sanitizeHtml(item.questionHtml)"></div>
                    <div v-else-if="item.questionImageUrl" class="item-image">
                      <img 
                        :src="item.questionImageUrl" 
                        :alt="`문항 ${item.itemId}`"
                        loading="lazy"
                        @click.stop="showImageModal(item.questionImageUrl)"
                      />
                    </div>
                    <div v-else class="item-text">
                      {{ item.questionText || '내용 없음' }}
                    </div>
                  </div>

                  <!-- 선택지 (객관식인 경우) -->
                  <div v-if="hasChoices(item)" class="item-choices">
                    <div v-if="item.choice1Html || item.choice1Text" class="choice">
                      ① <span v-if="item.choice1Html" v-html="sanitizeHtml(item.choice1Html)"></span>
                      <span v-else>{{ item.choice1Text }}</span>
                    </div>
                    <div v-if="item.choice2Html || item.choice2Text" class="choice">
                      ② <span v-if="item.choice2Html" v-html="sanitizeHtml(item.choice2Html)"></span>
                      <span v-else>{{ item.choice2Text }}</span>
                    </div>
                    <div v-if="item.choice3Html || item.choice3Text" class="choice">
                      ③ <span v-if="item.choice3Html" v-html="sanitizeHtml(item.choice3Html)"></span>
                      <span v-else>{{ item.choice3Text }}</span>
                    </div>
                    <div v-if="item.choice4Html || item.choice4Text" class="choice">
                      ④ <span v-if="item.choice4Html" v-html="sanitizeHtml(item.choice4Html)"></span>
                      <span v-else>{{ item.choice4Text }}</span>
                    </div>
                    <div v-if="item.choice5Html || item.choice5Text" class="choice">
                      ⑤ <span v-if="item.choice5Html" v-html="sanitizeHtml(item.choice5Html)"></span>
                      <span v-else>{{ item.choice5Text }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 카드 푸터 -->
                <div class="card-footer">
                  <span class="chapter-info">{{ item.chapterName }}</span>
                  <div class="card-actions">
                    <button 
                      class="btn-icon"
                      @click.stop="showItemDetail(item)"
                      title="상세보기"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" 
                              stroke="currentColor" stroke-width="2"/>
                        <path d="M2.45825 12C3.73253 7.94288 7.52281 5 12 5C16.4772 5 20.2675 7.94288 21.5418 12C20.2675 16.0571 16.4772 19 12 19C7.52281 19 3.73253 16.0571 2.45825 12Z" 
                              stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 일반 문항 그리드 뷰 (지문이 없는 문제들) -->
        <div v-if="!hasPassageGroups && viewMode === 'grid'" class="items-grid">
          <div
            v-for="item in paginatedItems"
            :key="item.itemId"
            :class="['item-card', { selected: isSelected(item.itemId) }]"
            @click="toggleSelection(item)"
          >
            <!-- 카드 헤더 -->
            <div class="card-header">
              <label class="item-checkbox">
                <input
                  type="checkbox"
                  :checked="isSelected(item.itemId)"
                  @click.stop="toggleSelection(item)"
                />
                <span class="checkbox-icon"></span>
              </label>
              <span class="item-id">#{{ item.itemId }}</span>
              <div class="item-badges">
                <span :class="'badge-difficulty difficulty-' + item.difficulty?.code">
                  {{ item.difficulty?.name }}
                </span>
                <span class="badge-type">{{ item.questionForm?.name }}</span>
              </div>
            </div>

            <!-- 카드 내용 -->
            <div class="card-body">
              <!-- 문제 내용 -->
              <div class="question-section">
                <div v-if="item.questionHtml" class="item-html" v-html="sanitizeHtml(item.questionHtml)"></div>
                <div v-else-if="item.questionImageUrl" class="item-image">
                  <img 
                    :src="item.questionImageUrl" 
                    :alt="`문항 ${item.itemId}`"
                    loading="lazy"
                    @click.stop="showImageModal(item.questionImageUrl)"
                  />
                </div>
                <div v-else class="item-text">
                  {{ item.questionText || '내용 없음' }}
                </div>
              </div>

              <!-- 선택지 (객관식인 경우) -->
              <div v-if="hasChoices(item)" class="item-choices">
                <div v-if="item.choice1Html || item.choice1Text" class="choice">
                  ① <span v-if="item.choice1Html" v-html="sanitizeHtml(item.choice1Html)"></span>
                  <span v-else>{{ item.choice1Text }}</span>
                </div>
                <div v-if="item.choice2Html || item.choice2Text" class="choice">
                  ② <span v-if="item.choice2Html" v-html="sanitizeHtml(item.choice2Html)"></span>
                  <span v-else>{{ item.choice2Text }}</span>
                </div>
                <div v-if="item.choice3Html || item.choice3Text" class="choice">
                  ③ <span v-if="item.choice3Html" v-html="sanitizeHtml(item.choice3Html)"></span>
                  <span v-else>{{ item.choice3Text }}</span>
                </div>
                <div v-if="item.choice4Html || item.choice4Text" class="choice">
                  ④ <span v-if="item.choice4Html" v-html="sanitizeHtml(item.choice4Html)"></span>
                  <span v-else>{{ item.choice4Text }}</span>
                </div>
                <div v-if="item.choice5Html || item.choice5Text" class="choice">
                  ⑤ <span v-if="item.choice5Html" v-html="sanitizeHtml(item.choice5Html)"></span>
                  <span v-else>{{ item.choice5Text }}</span>
                </div>
              </div>
            </div>

            <!-- 카드 푸터 -->
            <div class="card-footer">
              <span class="chapter-info">{{ item.chapterName }}</span>
              <div class="card-actions">
                <button 
                  class="btn-icon"
                  @click.stop="showItemDetail(item)"
                  title="상세보기"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" 
                          stroke="currentColor" stroke-width="2"/>
                    <path d="M2.45825 12C3.73253 7.94288 7.52281 5 12 5C16.4772 5 20.2675 7.94288 21.5418 12C20.2675 16.0571 16.4772 19 12 19C7.52281 19 3.73253 16.0571 2.45825 12Z" 
                          stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
                <button 
                  class="btn-icon"
                  @click.stop="findSimilarItems(item)"
                  title="유사문항"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" 
                          stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 문항 리스트 뷰 -->
        <div v-else-if="viewMode === 'list'" class="items-list">
          <table class="items-table">
            <thead>
              <tr>
                <th width="40">
                  <input 
                    type="checkbox" 
                    @change="toggleSelectAll"
                    :checked="isAllSelected"
                  />
                </th>
                <th width="80">번호</th>
                <th>문제</th>
                <th width="100">난이도</th>
                <th width="100">유형</th>
                <th width="150">단원</th>
                <th width="100">작업</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in paginatedItems"
                :key="item.itemId"
                :class="{ selected: isSelected(item.itemId) }"
                @click="toggleSelection(item)"
              >
                <td>
                  <input
                    type="checkbox"
                    :checked="isSelected(item.itemId)"
                    @click.stop="toggleSelection(item)"
                  />
                </td>
                <td class="text-center">#{{ item.itemId }}</td>
                <td class="question-cell">
                  <div v-if="item.questionHtml" v-html="sanitizeHtml(item.questionHtml)" class="question-preview"></div>
                  <div v-else>{{ item.questionText || '내용 없음' }}</div>
                </td>
                <td class="text-center">
                  <span :class="'badge-difficulty difficulty-' + item.difficulty?.code">
                    {{ item.difficulty?.name }}
                  </span>
                </td>
                <td class="text-center">{{ item.questionForm?.name }}</td>
                <td>{{ item.chapterName }}</td>
                <td class="text-center">
                  <button 
                    class="btn-icon"
                    @click.stop="showItemDetail(item)"
                    title="상세보기"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" 
                            stroke="currentColor" stroke-width="2"/>
                      <path d="M2.45825 12C3.73253 7.94288 7.52281 5 12 5C16.4772 5 20.2675 7.94288 21.5418 12C20.2675 16.0571 16.4772 19 12 19C7.52281 19 3.73253 16.0571 2.45825 12Z" 
                            stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="page-btn"
            @click="currentPage = 1"
            :disabled="currentPage === 1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M11 17L6 12L11 7M18 17L13 12L18 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button 
            class="page-btn"
            @click="currentPage--"
            :disabled="currentPage === 1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in visiblePages"
              :key="page"
              :class="['page-number', { active: page === currentPage }]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            class="page-btn"
            @click="currentPage++"
            :disabled="currentPage === totalPages"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button 
            class="page-btn"
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 17L18 12L13 7M6 17L11 12L6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </main>

      <!-- 오른쪽 선택된 문항 패널 -->
      <aside 
        v-if="showSelectedPanel" 
        class="selected-panel"
      >
        <div class="panel-header">
          <h3>선택된 문항</h3>
          <button 
            class="btn-close"
            @click="showSelectedPanel = false"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="selected-summary">
          <div class="summary-item">
            <span class="label">총 문항:</span>
            <span class="value">{{ selectedItems.length }}개</span>
          </div>
          <button 
            v-if="selectedItems.length > 0"
            class="btn-clear"
            @click="clearSelection"
          >
            전체 해제
          </button>
        </div>

        <div 
          class="selected-list"
          @dragover.prevent="handleDragOver"
          @drop="handleDrop"
          @dragleave="handleDragLeave"
        >
          <!-- 지문으로 그룹화된 문항들 -->
          <div 
            v-for="(group, index) in selectedItemGroups"
            :key="group.id"
            class="item-group"
            :draggable="true"
            @dragstart="handleDragStart(index, 'group')"
            @dragend="handleDragEnd"
            @dragover.prevent="handleDragOver"
            @dragenter.prevent="handleDragEnter(index)"
            :class="{ 
              dragging: draggedItem?.index === index && draggedItem?.type === 'group',
              'drop-target': dropTargetIndex === index
            }"
          >
            <!-- 지문 그룹 헤더 -->
            <div v-if="group.passageId" class="group-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M8 10H16M8 14H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="group-title">지문 #{{ group.passageId }}</span>
              <span class="group-count">{{ group.items.length }}문항</span>
            </div>
            
            <!-- 그룹 내 문항들 -->
            <div class="group-items">
              <div 
                v-for="(item, itemIndex) in group.items"
                :key="item.itemId"
                class="selected-item"
                :draggable="!group.passageId"
                @dragstart.stop="!group.passageId && handleDragStart(index, 'item', itemIndex)"
                :class="{ 'in-passage': group.passageId }"
              >
                <div class="drag-handle">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
                    <circle cx="16" cy="6" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="18" r="1.5" fill="currentColor"/>
                    <circle cx="16" cy="18" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
                <div class="item-info">
                  <span class="item-number">#{{ item.itemId }}</span>
                  <span :class="'badge-difficulty difficulty-' + item.difficulty?.code">
                    {{ item.difficulty?.name }}
                  </span>
                </div>
                <button 
                  class="btn-remove"
                  @click="removeFromSelection(item)"
                  title="제거"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <button 
            class="btn-primary"
            @click="proceedToNext"
            :disabled="selectedItems.length === 0"
          >
            다음 단계
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </aside>
    </div>

    <!-- 랜덤 문항 생성 모달 -->
    <RandomItemModal
      :show="showRandomGenerator"
      :selectedChapters="getSelectedChapterInfo()"
      :currentFilters="getCurrentFilters()"
      :existingItems="selectedItems"
      :textbooks="textbooks"
      @close="showRandomGenerator = false"
      @generate="handleRandomGenerate"
    />

    <!-- 이미지 모달 -->
    <div v-if="imageModalUrl" class="image-modal" @click="imageModalUrl = null">
      <img :src="imageModalUrl" @click.stop />
      <button class="btn-close" @click="imageModalUrl = null">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 18L18 6M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 문항 상세 모달 -->
    <ItemPreviewModal
      v-if="detailItem"
      :item="detailItem"
      @close="detailItem = null"
      @select="handleItemSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useItemSelectionStore } from '@/stores/itemSelection'
import itemApiService from '@/services/itemApi'
import chapterApi from '@/services/chapterApi'
import examApi from '@/services/examApi'
import { debounce } from 'lodash-es'
import RandomItemModal from './RandomItemModal.vue'
import ItemPreviewModal from './ItemPreviewModal.vue'

// Props & Emits
const props = defineProps({
  examInfo: Object
})

const emit = defineEmits(['back', 'next'])

// Store
const itemStore = useItemSelectionStore()

// State
const items = ref([])
const selectedItems = ref([])
const totalItems = ref(0)
const currentPage = ref(1)
const itemsPerPage = 6  // 한 페이지에 6개 문제 표시 (3열 x 2행)
const isLoading = ref(false)
const isLoadingTextbooks = ref(false) // 교과서 로딩 상태 추가
const draggedItem = ref(null) // 드래그 중인 아이템 정보
const dropTargetIndex = ref(null) // 드롭 대상 인덱스

// UI State
const viewMode = ref('grid') // 'grid' | 'list'
const filterCollapsed = ref(false)
const showSelectedPanel = ref(false)
const showRandomGenerator = ref(false)
const imageModalUrl = ref(null)
const detailItem = ref(null)

// Search & Filters
const searchKeyword = ref('')
const selectedGrade = ref(null) // 학년 선택
const selectedSubject = ref(null) // 과목 선택
const selectedTextbook = ref(null)
const selectedChapters = ref([])
const selectedMediumChapters = ref([]) // 중단원 선택 추가
const difficultyFilters = ref([])
const questionFormFilters = ref([])

// Data
const textbooks = ref([])
const chapterTree = ref([])
const expandedChapters = ref([]) // 확장된 챕터 ID 추가
const expandedPassages = ref([]) // 확장된 지문 ID 추가

// 학년 옵션 (Step1과 동일)
const gradeOptions = ref([
  { code: '07', name: '중1', grade: '1', desc: '중등 1학년 과정' },
  { code: '08', name: '중2', grade: '2', desc: '중등 2학년 과정' },
  { code: '09', name: '중3', grade: '3', desc: '중등 3학년 과정' }
])

// 과목 옵션 (Step1과 동일)
const subjectOptions = ref([
  { code: 'MA', name: '수학', color: '#3B82F6' },
  { code: 'KO', name: '국어', color: '#10B981' },
  { code: 'EN', name: '영어', color: '#F59E0B' },
  { code: 'SC', name: '과학', color: '#8B5CF6' },
  { code: 'SO', name: '사회', color: '#EF4444' }
])

const difficultyLevels = ref([
  { code: 1, name: '매우쉬움' },
  { code: 2, name: '쉬움' },
  { code: 3, name: '보통' },
  { code: 4, name: '어려움' },
  { code: 5, name: '매우어려움' }
])
const questionTypes = ref([
  { code: 'OBJ', name: '객관식' },
  { code: 'SUB', name: '주관식' },
  { code: 'ESS', name: '서술형' }
])

// Computed
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

// 지문이 있는 문제들만 그룹화
const passageGroups = computed(() => {
  const groups = new Map()
  
  paginatedItems.value.forEach(item => {
    if (item.passageId) {
      if (!groups.has(item.passageId)) {
        groups.set(item.passageId, {
          passageId: item.passageId,
          passageHtml: item.passageHtml,
          passageText: item.passageText,
          items: []
        })
      }
      groups.get(item.passageId).items.push(item)
    }
  })
  
  return Array.from(groups.values())
})

// 지문이 없는 일반 문제들
const regularItems = computed(() => {
  return paginatedItems.value.filter(item => !item.passageId)
})

// 지문 그룹이 있는지 확인
const hasPassageGroups = computed(() => {
  return passageGroups.value.length > 0
})

const paginatedItems = computed(() => {
  // 서버에서 이미 페이지네이션된 데이터를 받으므로 그대로 사용
  return items.value
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  const maxVisible = 5
  
  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = Math.min(total, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const isAllSelected = computed(() => {
  return items.value.length > 0 && items.value.every(item => isSelected(item.itemId))
})

const hasActiveFilters = computed(() => {
  return selectedTextbook.value || 
         selectedChapters.value.length > 0 || 
         selectedMediumChapters.value.length > 0 ||
         difficultyFilters.value.length > 0 || 
         questionFormFilters.value.length > 0
})

// 선택된 문항을 지문별로 그룹화
const selectedItemGroups = computed(() => {
  const groups = []
  const passageGroups = new Map()
  const regularItems = []
  
  // 지문별로 그룹화
  selectedItems.value.forEach(item => {
    if (item.passageId) {
      if (!passageGroups.has(item.passageId)) {
        passageGroups.set(item.passageId, {
          id: `passage-${item.passageId}`,
          passageId: item.passageId,
          items: []
        })
      }
      passageGroups.get(item.passageId).items.push(item)
    } else {
      regularItems.push({
        id: `item-${item.itemId}`,
        passageId: null,
        items: [item]
      })
    }
  })
  
  // 지문 그룹 먼저 추가
  passageGroups.forEach(group => {
    groups.push(group)
  })
  
  // 일반 문항 추가
  groups.push(...regularItems)
  
  return groups
})

// Methods
const loadItems = async () => {
  // 교과서가 선택되지 않았으면 검색하지 않음
  if (!selectedTextbook.value) {
    console.log('교과서가 선택되지 않아 검색을 수행하지 않습니다.')
    items.value = []
    totalItems.value = 0
    return
  }
  
  isLoading.value = true
  try {
    // itemStore를 통한 검색 실행
    const searchParams = {
      page: currentPage.value - 1,
      size: itemsPerPage,
      keyword: searchKeyword.value,
      subjects: selectedTextbook.value ? [selectedTextbook.value] : [],
      chapterIds: selectedMediumChapters.value.length > 0 ? selectedMediumChapters.value : selectedChapters.value,
      difficulties: difficultyFilters.value,
      categories: questionFormFilters.value // 문제유형 필터 적용
    }
    
    console.log('검색 파라미터:', searchParams)
    
    await itemStore.searchItems(searchParams)
    
    // store에서 데이터 가져오기 - 서버에서 이미 페이지네이션된 데이터를 받음
    items.value = itemStore.items || []
    totalItems.value = itemStore.totalItems || 0
    
    console.log(`페이지 ${currentPage.value} 검색 완료: ${itemStore.items?.length}개 문항 찾음, 전체: ${totalItems.value}개`)
  } catch (error) {
    console.error('Failed to load items:', error)
    items.value = []
    totalItems.value = 0
  } finally {
    isLoading.value = false
  }
}

// 교과서 목록 로드 (Step1에서 선택한 gradeCode와 areaCode 기반)
const loadSubjectsAndTextbooks = async () => {
  try {
    isLoadingTextbooks.value = true
    
    // Step1에서 선택한 gradeCode와 areaCode로 필터링된 교과서 로드
    const gradeCode = props.examInfo?.gradeCode || props.examInfo?.grade
    const areaCode = props.examInfo?.areaCode // MA, KO, EN, SC, SO 등
    
    console.log('=== 교과서 로드 시작 ===')
    console.log('전체 examInfo:', props.examInfo)
    console.log('gradeCode:', gradeCode, 'areaCode:', areaCode)
    
    // itemStore의 loadSubjects를 gradeCode와 areaCode 옵션과 함께 호출
    await itemStore.loadSubjects({
      gradeCode: gradeCode,
      areaCode: areaCode,
      includeTextbooks: true
    })
    
    // subjects 데이터를 textbooks 형태로 변환
    // API에서 이미 gradeCode와 areaCode로 필터링된 데이터를 받음
    const subjects = itemStore.subjects
    console.log('Store에서 가져온 subjects (이미 필터링됨):', subjects)
    
    if (subjects && subjects.length > 0) {
      // 이미 API에서 필터링된 데이터이므로 바로 textbooks 형태로 변환
      textbooks.value = subjects.map(subject => ({
        id: subject.subjectId || subject.id,
        subjectId: subject.subjectId || subject.id,
        subjectName: subject.name || subject.subjectName,
        gradeName: props.examInfo?.gradeName,
        areaName: props.examInfo?.areaName,
        gradeCode: subject.gradeCode || subject.grade,
        areaCode: subject.areaCode || subject.area,
        itemCount: subject.itemCount || 0
      }))
      
      console.log('필터링된 textbooks:', textbooks.value)
      
      // 교과서가 하나만 있으면 자동 선택
      if (textbooks.value.length === 1) {
        selectedTextbook.value = textbooks.value[0].id || textbooks.value[0].subjectId
        await loadChapters()
      }
    } else {
      console.warn('subjects 데이터가 비어있습니다.')
    }
  } catch (error) {
    console.error('Failed to load textbooks:', error)
  } finally {
    isLoadingTextbooks.value = false
  }
}

// 챕터 트리 로드
const loadChapters = async () => {
  if (!selectedTextbook.value) {
    chapterTree.value = []
    return
  }
  
  try {
    console.log('챕터 트리 로드 시작 - textbookId:', selectedTextbook.value)
    // chapterApi를 사용하여 챕터 트리 로드
    const response = await chapterApi.getChapterTree(selectedTextbook.value)
    
    console.log('챕터 API 응답:', response)
    
    if (response.success && response.data) {
      chapterTree.value = response.data
      console.log('챕터 트리 로드 성공:', chapterTree.value)
      
      // Store에도 챕터 정보 저장
      itemStore.setChapters(response.data)
      
      // 첫 번째 대단원 자동 확장
      if (chapterTree.value.length > 0) {
        expandedChapters.value = [chapterTree.value[0].id]
      }
    } else if (response.data?.success && response.data?.data) {
      // response.data 안에 success가 있는 경우
      chapterTree.value = response.data.data
      console.log('챕터 트리 로드 성공 (nested):', chapterTree.value)
      
      // Store에도 챕터 정보 저장
      itemStore.setChapters(response.data.data)
      
      // 첫 번째 대단원 자동 확장
      if (chapterTree.value.length > 0) {
        expandedChapters.value = [chapterTree.value[0].id]
      }
    } else {
      console.warn('챕터 트리 데이터가 비어있습니다:', response)
    }
  } catch (error) {
    console.error('Failed to load chapters:', error)
  }
}


const handleSearchWithDebounce = debounce(() => {
  currentPage.value = 1
  loadItems()
}, 300)

// 학년 변경 핸들러
const handleGradeChange = () => {
  // 과목 초기화
  selectedSubject.value = null
  selectedTextbook.value = null
  selectedChapters.value = []
  selectedMediumChapters.value = []
  chapterTree.value = []
  textbooks.value = []
  
  // 학년과 과목이 모두 선택되면 교과서 로드
  if (selectedGrade.value && selectedSubject.value) {
    loadSubjectsAndTextbooks()
  }
}

// 과목 변경 핸들러
const handleSubjectChange = () => {
  // 교과서와 단원 초기화
  selectedTextbook.value = null
  selectedChapters.value = []
  selectedMediumChapters.value = []
  chapterTree.value = []
  textbooks.value = []
  
  // 학년과 과목이 모두 선택되면 교과서 로드
  if (selectedGrade.value && selectedSubject.value) {
    // examInfo 업데이트 (loadSubjectsAndTextbooks에서 사용)
    props.examInfo.gradeCode = selectedGrade.value
    props.examInfo.areaCode = selectedSubject.value
    loadSubjectsAndTextbooks()
  }
}

const handleTextbookChange = () => {
  selectedChapters.value = []
  loadChapters()
  loadItems()
}

// 대단원 체크박스 변경 처리
const handleLargeChapterChange = (chapter, event) => {
  const isChecked = event.target.checked
  
  if (isChecked) {
    // 대단원 선택 시 모든 중단원 선택
    if (chapter.children) {
      chapter.children.forEach(subChapter => {
        if (!selectedMediumChapters.value.includes(subChapter.id)) {
          selectedMediumChapters.value.push(subChapter.id)
        }
      })
    }
    // 대단원 ID도 추가
    if (!selectedChapters.value.includes(chapter.id)) {
      selectedChapters.value.push(chapter.id)
    }
  } else {
    // 대단원 선택 해제 시 모든 중단원 선택 해제
    if (chapter.children) {
      chapter.children.forEach(subChapter => {
        const index = selectedMediumChapters.value.indexOf(subChapter.id)
        if (index > -1) {
          selectedMediumChapters.value.splice(index, 1)
        }
      })
    }
    // 대단원 ID도 제거
    const chapterIndex = selectedChapters.value.indexOf(chapter.id)
    if (chapterIndex > -1) {
      selectedChapters.value.splice(chapterIndex, 1)
    }
  }
  
  loadItems()
}

// 중단원 체크박스 변경 처리
const handleMediumChapterChange = () => {
  loadItems()
}

// 대단원이 선택되었는지 확인 (모든 중단원이 선택되었을 때)
const isChapterSelected = (chapter) => {
  if (!chapter.children || chapter.children.length === 0) {
    return selectedChapters.value.includes(chapter.id)
  }
  
  // 모든 중단원이 선택되었는지 확인
  return chapter.children.every(subChapter => 
    selectedMediumChapters.value.includes(subChapter.id)
  )
}

const toggleChapter = (chapterId) => {
  const index = expandedChapters.value.indexOf(chapterId)
  if (index > -1) {
    expandedChapters.value.splice(index, 1)
  } else {
    expandedChapters.value.push(chapterId)
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadItems()
}

const resetFilters = () => {
  selectedTextbook.value = null
  selectedChapters.value = []
  selectedMediumChapters.value = []
  difficultyFilters.value = []
  questionFormFilters.value = []
  searchKeyword.value = ''
  loadItems()
}

const isSelected = (itemId) => {
  return selectedItems.value.some(item => item.itemId === itemId)
}

const toggleSelection = (item) => {
  const index = selectedItems.value.findIndex(selected => selected.itemId === item.itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
    itemStore.deselectItem(item.itemId)
  } else {
    selectedItems.value.push(item)
    itemStore.selectItem(item)
  }
}

// 지문 확장/축소 토글
const togglePassageExpand = (passageId) => {
  const index = expandedPassages.value.indexOf(passageId)
  if (index > -1) {
    expandedPassages.value.splice(index, 1)
  } else {
    expandedPassages.value.push(passageId)
  }
}

const toggleSelectAll = (event) => {
  if (event.target.checked) {
    items.value.forEach(item => {
      if (!isSelected(item.itemId)) {
        selectedItems.value.push(item)
      }
    })
  } else {
    items.value.forEach(item => {
      const index = selectedItems.value.findIndex(selected => selected.itemId === item.itemId)
      if (index > -1) {
        selectedItems.value.splice(index, 1)
      }
    })
  }
}

const clearSelection = () => {
  selectedItems.value = []
}

const removeFromSelection = (item) => {
  const index = selectedItems.value.findIndex(selected => selected.itemId === item.itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  }
}

const hasChoices = (item) => {
  return item.choice1Html || item.choice2Html || item.choice3Html || 
         item.choice4Html || item.choice5Html ||
         item.choice1Text || item.choice2Text || item.choice3Text ||
         item.choice4Text || item.choice5Text
}

const showImageModal = (url) => {
  imageModalUrl.value = url
}

const showItemDetail = (item) => {
  detailItem.value = item
}

const handleItemSelect = (item) => {
  if (!isSelected(item.itemId)) {
    selectedItems.value.push(item)
  }
}

const findSimilarItems = async (item) => {
  try {
    const response = await itemApiService.getSimilarItems({
      topicChapterId: item.topicChapterId,
      difficultyCode: item.difficulty?.code,
      excludeItemIds: [item.itemId],
      size: 10
    })
    if (response.success) {
      console.log('Similar items:', response.data)
      // TODO: Show similar items in modal or panel
    }
  } catch (error) {
    console.error('Failed to find similar items:', error)
  }
}

// 선택된 단원 정보 가져오기
const getSelectedChapterInfo = () => {
  return chapterTree.value
    .flatMap(chapter => chapter.children || [])
    .filter(subChapter => selectedMediumChapters.value.includes(subChapter.id))
}

// 현재 필터 정보 가져오기
const getCurrentFilters = () => {
  return {
    grade: selectedGrade.value,
    subject: selectedSubject.value,
    textbook: selectedTextbook.value,
    difficulties: difficultyFilters.value,
    questionTypes: questionFormFilters.value
  }
}

const handleRandomGenerate = async (config) => {
  console.log('랜덤 문항 생성 설정:', config)
  
  try {
    isLoading.value = true
    
    // 랜덤 문항 생성 API 호출
    const searchParams = {
      subjects: [selectedSubject.value].filter(Boolean),
      chapterIds: selectedMediumChapters.value,
      difficulties: config.difficultyDistribution ? 
        Object.keys(config.difficultyDistribution).map(k => parseInt(k)) : [],
      categories: questionFormFilters.value,
      size: config.totalCount || 20,
      random: true // 랜덤 선택 플래그
    }
    
    const result = await itemApiService.searchItems(searchParams)
    
    if (result.success && result.data) {
      // 랜덤으로 선택된 문항들을 선택 목록에 추가
      result.data.forEach(item => {
        if (!selectedItems.value.find(selected => selected.itemId === item.itemId)) {
          selectedItems.value.push(item)
          itemStore.selectItem(item)
        }
      })
      
      console.log(`${result.data.length}개 문항이 랜덤으로 선택되었습니다.`)
    }
  } catch (error) {
    console.error('랜덤 문항 생성 오류:', error)
  } finally {
    isLoading.value = false
    showRandomGenerator.value = false
  }
}

const handleBack = () => {
  emit('back')
}

const proceedToNext = () => {
  // itemStore에 선택된 아이템 저장
  selectedItems.value.forEach(item => {
    itemStore.selectItem(item)
  })
  emit('next')
}

// 드래그 앤 드롭 관련 메서드
const handleDragStart = (index, type, itemIndex = null) => {
  draggedItem.value = {
    index,
    type,
    itemIndex
  }
}

const handleDragEnd = () => {
  draggedItem.value = null
  dropTargetIndex.value = null
}

const handleDragOver = (event) => {
  event.preventDefault()
}

const handleDragEnter = (index) => {
  if (draggedItem.value && index !== draggedItem.value.index) {
    dropTargetIndex.value = index
  }
}

const handleDragLeave = () => {
  // 드래그가 컨테이너를 완전히 벗어날 때만 초기화
  setTimeout(() => {
    if (dropTargetIndex.value !== null) {
      dropTargetIndex.value = null
    }
  }, 50)
}

const handleDrop = (event) => {
  event.preventDefault()
  
  if (!draggedItem.value) return
  
  // 드롭 위치 계산
  const dropTarget = dropTargetIndex.value !== null ? dropTargetIndex.value : findDropTarget(event)
  
  if (dropTarget !== null && dropTarget !== draggedItem.value.index) {
    reorderItems(draggedItem.value.index, dropTarget)
  }
  
  draggedItem.value = null
  dropTargetIndex.value = null
}

const findDropTarget = (event) => {
  const items = document.querySelectorAll('.item-group')
  const dropY = event.clientY
  
  // 마우스 위치에 가장 가까운 아이템 찾기
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rect = item.getBoundingClientRect()
    
    // 드래그 중인 아이템은 건너뜀
    if (draggedItem.value && i === draggedItem.value.index) continue
    
    // 마우스가 아이템의 상단 절반에 있으면 그 위치에 삽입
    if (dropY < rect.top + rect.height / 2) {
      return i > draggedItem.value.index ? i - 1 : i
    }
  }
  
  // 마지막 위치에 드롭
  return items.length - 1
}

const reorderItems = (fromIndex, toIndex) => {
  if (fromIndex === toIndex) return
  
  // 현재 그룹 배열 복사
  const groups = [...selectedItemGroups.value]
  const draggedGroup = groups[fromIndex]
  
  // 새로운 그룹 배열 생성
  const newGroups = []
  
  if (fromIndex < toIndex) {
    // 아래로 이동
    for (let i = 0; i < groups.length; i++) {
      if (i === fromIndex) continue // 드래그한 항목은 건너뜀
      newGroups.push(groups[i])
      if (i === toIndex) {
        newGroups.push(draggedGroup) // 목표 위치에 삽입
      }
    }
  } else {
    // 위로 이동
    for (let i = 0; i < groups.length; i++) {
      if (i === toIndex) {
        newGroups.push(draggedGroup) // 목표 위치에 삽입
      }
      if (i === fromIndex) continue // 드래그한 항목은 건너뜀
      newGroups.push(groups[i])
    }
  }
  
  // 새로운 순서로 selectedItems 재구성
  const newItems = []
  newGroups.forEach(group => {
    group.items.forEach(item => newItems.push(item))
  })
  
  // selectedItems 업데이트
  selectedItems.value = newItems
}

// 시험지의 기존 문항들을 불러오는 함수
const loadExamItems = async (examId) => {
  try {
    console.log('시험지 문항 로드 시작 - examId:', examId)
    
    const response = await examApi.getExamItems(examId)
    console.log('시험지 문항 API 전체 응답:', response)
    
    // API 응답에서 itemIds 추출
    if (response.data?.success && response.data?.data) {
      const examData = response.data.data
      console.log('시험지 데이터:', examData)
      
      // itemIds가 있는 경우 각 문항의 상세 정보를 가져옴
      if (examData.itemIds && Array.isArray(examData.itemIds) && examData.itemIds.length > 0) {
        console.log(`${examData.itemIds.length}개 문항 ID 발견:`, examData.itemIds)
        
        // 시험지 정보를 저장 (교과서 정보 업데이트)
        if (examData.subjectId) {
          selectedTextbook.value = examData.subjectId
          await loadChapters() // 챕터 트리 로드
        }
        
        // 각 itemId로 문항 상세 정보 가져오기
        const itemPromises = examData.itemIds.map(async (itemId) => {
          try {
            const itemResponse = await itemApiService.getItemDetail(itemId)
            if (itemResponse.success && itemResponse.data) {
              return itemResponse.data
            }
            return null
          } catch (error) {
            console.error(`문항 ${itemId} 로드 실패:`, error)
            return null
          }
        })
        
        // 모든 문항 정보 가져오기
        const items = await Promise.all(itemPromises)
        const validItems = items.filter(item => item !== null)
        
        console.log(`${validItems.length}개 문항 상세 정보 로드 완료`)
        
        if (validItems.length > 0) {
          // 불러온 문항들을 자동으로 선택
          validItems.forEach(item => {
            if (!selectedItems.value.some(selected => selected.itemId === item.itemId)) {
              selectedItems.value.push(item)
              itemStore.selectItem(item)
            }
          })
          
          // 선택된 패널 자동으로 열기
          showSelectedPanel.value = true
          
          return validItems
        }
      } else {
        console.log('시험지에 문항이 없습니다.')
      }
    }
    
    return []
  } catch (error) {
    console.error('시험지 문항 로드 실패:', error)
    return []
  }
}

// HTML 정리 함수 (수식 이미지 제거)
const sanitizeHtml = (html) => {
  if (!html) return ''
  
  // 수식 이미지 제거 
  let cleaned = html
    .replace(/<img[^>]*>/gi, '') // 모든 이미지 제거
    .replace(/<script(?! type="math\/tex)[^>]*>[\s\S]*?<\/script>/gi, '') // 위험한 스크립트 제거
    .replace(/on\w+="[^"]*"/g, '') // 이벤트 핸들러 제거
    .replace(/on\w+='[^']*'/g, '')
  
  return cleaned
}

// MathJax 즉시 렌더링 함수
const renderMath = async () => {
  if (!window.MathJax || !window.MathJax.startup) return
  
  try {
    // 기존 렌더링된 요소 제거
    const existingMath = document.querySelectorAll('mjx-container, .MathJax, .MathJax_Display, .MathJax_Preview')
    existingMath.forEach(el => {
      if (el.tagName && el.tagName.toLowerCase() !== 'script') {
        el.remove()
      }
    })
    
    // MathJax 문서 초기화
    if (window.MathJax.startup.document) {
      window.MathJax.startup.document.clear()
      window.MathJax.startup.document.updateDocument()
    }
    
    await nextTick()
    
    // 즉시 렌더링 수행
    if (window.MathJax.typeset) {
      window.MathJax.typeset()
    } else {
      await window.MathJax.typesetPromise()
    }
  } catch (e) {
    console.warn('MathJax 렌더링 경고:', e)
  }
}

// Lifecycle
onMounted(async () => {
  console.log('Step2 onMounted - examInfo:', props.examInfo)
  
  // Store 초기화 - 기존 선택된 아이템이 있으면 유지
  if (itemStore.resetFilters) {
    itemStore.resetFilters()
  }
  // selectedItems가 이미 있는 경우(기존 시험지 편집)는 초기화하지 않음
  if (itemStore.setSelectedItems && !props.examInfo?.selectedItems?.length) {
    itemStore.setSelectedItems([])
  }
  
  // MathJax가 준비되면 즉시 렌더링
  if (window.MathJax && window.MathJax.startup) {
    if (window.MathJax.startup.document) {
      renderMath()
    } else {
      await window.MathJax.startup.promise
      renderMath()
    }
  } else {
    // MathJax가 아직 로드되지 않은 경우 대기 후 렌더링
    const checkMathJax = setInterval(() => {
      if (window.MathJax && window.MathJax.startup && window.MathJax.startup.document) {
        clearInterval(checkMathJax)
        renderMath()
      }
    }, 50)
    
    // 5초 후에도 로드되지 않으면 타임아웃
    setTimeout(() => clearInterval(checkMathJax), 5000)
  }
  
  // 편집 모드 또는 기존 문항이 있는 경우: 기존 시험지 정보 사용
  // mode가 'edit'이거나 selectedItems가 있으면 기존 시험지 편집으로 처리
  if (props.examInfo?.mode === 'edit' || props.examInfo?.selectedItems?.length > 0) {
    // 학년과 과목 설정
    if (props.examInfo.gradeCode) {
      selectedGrade.value = props.examInfo.gradeCode
    }
    if (props.examInfo.areaCode) {
      selectedSubject.value = props.examInfo.areaCode
    }
    
    // 과목 및 교과서 정보 로드
    if (selectedGrade.value && selectedSubject.value) {
      await loadSubjectsAndTextbooks()
    }
    
    // examId가 있으면 해당 시험지의 문항들을 불러오기
    if (props.examInfo?.examId && !props.examInfo?.selectedItems?.length) {
      console.log('편집 모드 - 기존 시험지 문항 로드')
      await loadExamItems(props.examInfo.examId)
    }
    // 또는 기존 문항이 있으면 선택 상태로 설정
    else if (props.examInfo?.selectedItems?.length > 0) {
      console.log(`기존 문항 ${props.examInfo.selectedItems.length}개를 선택 상태로 설정`)
      props.examInfo.selectedItems.forEach(item => {
        itemStore.selectItem(item)
        selectedItems.value.push(item)
      })
    }
  }
  // 새로 만들기 모드: 학년/과목 선택 필요
  else {
    // 학년과 과목 초기화 (사용자가 선택해야 함)
    selectedGrade.value = null
    selectedSubject.value = null
    textbooks.value = []
    chapterTree.value = []
  }
})

// Watchers
watch(() => props.examInfo, () => {
  loadSubjectsAndTextbooks()
  loadItems()
})

// 페이지 변경 시 데이터 로드 및 수식 렌더링
watch(currentPage, async () => {
  await loadItems()
  // 데이터 로드 후 수식 렌더링
  nextTick(() => renderMath())
})

// 뷰 모드 변경 시 수식 재렌더링
watch(viewMode, () => {
  nextTick(() => renderMath())
})

// 문항 데이터 변경 감지
watch(() => paginatedItems.value, () => {
  nextTick(() => renderMath())
}, { deep: true })
</script>

<style scoped>
/* 전체 컨테이너 */
.step2-improved {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
  overflow: hidden;
}

/* 통합 헤더 */
.unified-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  min-height: 56px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f3f4f6;
  color: #111827;
}

.header-info h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.exam-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.exam-meta .divider {
  color: #d1d5db;
}

.exam-meta .primary {
  color: #3b82f6;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 검색바 */
.search-wrapper {
  position: relative;
  width: 240px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 뷰 토글 */
.view-toggle {
  display: flex;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 0.5rem;
  background: white;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.view-btn:hover {
  background: #f3f4f6;
}

.view-btn.active {
  background: #3b82f6;
  color: white;
}

/* 선택 목록 버튼 */
.btn-selected {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-selected:hover {
  background: #f3f4f6;
}

.btn-selected .badge {
  padding: 0.125rem 0.375rem;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* 메인 레이아웃 */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 사이드바 필터 */
.filter-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}

.filter-sidebar.collapsed {
  width: 48px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.btn-toggle {
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle:hover {
  color: #111827;
}

.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0 0 0.75rem 0;
  letter-spacing: 0.025em;
}

.select-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

/* 단원 트리 */
.chapter-tree {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chapter-node {
  display: flex;
  flex-direction: column;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.chapter-item:hover {
  background: #f3f4f6;
}

.chapter-item input[type="checkbox"] {
  margin-right: 0.5rem;
}

.chapter-name {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
}

.item-count {
  font-size: 0.75rem;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.sub-chapters {
  margin-left: 1.25rem;
  margin-top: 0.25rem;
}

.chapter-item.sub {
  font-size: 0.8125rem;
}

/* 필터 칩 */
.difficulty-filters,
.type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: #e5e7eb;
}

.filter-chip.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.filter-chip input[type="checkbox"] {
  display: none;
}

/* 난이도 색상 */
.difficulty-very_easy { color: #10b981; }
.difficulty-easy { color: #34d399; }
.difficulty-normal { color: #fbbf24; }
.difficulty-hard { color: #fb923c; }
.difficulty-very_hard { color: #ef4444; }

/* 필터 초기화 */
.btn-reset-filters {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset-filters:hover {
  background: #f3f4f6;
  color: #111827;
}

/* 컨텐츠 영역 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8f9fa;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.result-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.result-info strong {
  color: #111827;
  font-weight: 600;
  margin-left: 0.25rem;
}

.content-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.btn-random {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-random:hover {
  background: #f3f4f6;
}

/* 로딩/빈 상태 */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* 문항 그리드 */
.items-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3열 유지 */
  gap: 1.25rem;
  padding: 1rem;
  overflow-y: auto;
}

.item-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
  min-height: 280px; /* 원래 크기로 복원 */
  max-height: 350px; /* 원래 크기로 복원 */
  display: flex;
  flex-direction: column;
}

.item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.item-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem; /* 패딩 감소 */
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.item-checkbox {
  position: relative;
  display: inline-block;
}

.item-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

.item-id {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.item-badges {
  display: flex;
  gap: 0.5rem;
}

.badge-difficulty,
.badge-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-difficulty {
  background: #fef3c7;
  color: #92400e;
}

.badge-difficulty.difficulty-1 {
  background: #d1fae5;
  color: #065f46;
}

.badge-difficulty.difficulty-2 {
  background: #d1fae5;
  color: #047857;
}

.badge-difficulty.difficulty-3 {
  background: #fed7aa;
  color: #92400e;
}

.badge-difficulty.difficulty-4 {
  background: #fed7aa;
  color: #c2410c;
}

.badge-difficulty.difficulty-5 {
  background: #fee2e2;
  color: #991b1b;
}

.badge-type {
  background: #e0e7ff;
  color: #3730a3;
}

.card-body {
  padding: 1rem;
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 지문 영역 내 카드 바디는 스크롤 없이 전체 표시 */
.passage-items .card-body {
  overflow-y: visible;
  max-height: none;
}

.question-section {
  flex-shrink: 0;
}

.item-html,
.item-text {
  font-size: 0.8125rem;
  color: #1f2937;
  line-height: 1.5;
  /* 전체 텍스트 표시 - 수식 있는 문제 때문에 자르지 않음 */
}

/* 지문이 있는 문제 */
/* 지문 스타일 제거 - 별도 처리 예정 */

.item-html {
  word-break: break-word;
}

.item-html :deep(p) {
  margin: 0 0 0.5rem 0;
}

.item-html :deep(img) {
  max-width: 100%;
  height: auto;
}

.item-image img {
  max-width: 100%;
  max-height: 120px; /* 이미지 높이 증가 */
  height: auto;
  border-radius: 4px;
  cursor: zoom-in;
  object-fit: contain;
}

.item-choices {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-choices .choice {
  display: flex;
  gap: 0.5rem;
  color: #4b5563;
  line-height: 1.5;
  /* 전체 텍스트 표시를 위해 white-space 관련 속성 제거 */
}

.card-footer {
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  font-size: 0.75rem;
}

.card-footer .chapter-info {
  font-size: 0.75rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.choice {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
  color: #374151;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.chapter-info {
  font-size: 0.75rem;
  color: #6b7280;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.375rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* 문항 리스트 뷰 */
.items-list {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.items-table {
  width: 100%;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  border-collapse: collapse;
}

.items-table thead {
  background: #f9fafb;
}

.items-table th {
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-bottom: 1px solid #e5e7eb;
}

.items-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.items-table tbody tr:hover {
  background: #f9fafb;
}

.items-table tbody tr.selected {
  background: #eff6ff;
}

.items-table td {
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
}

.text-center {
  text-align: center;
}

.question-cell {
  max-width: 400px;
}

.question-preview {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-preview :deep(p) {
  margin: 0;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  min-width: 32px;
  padding: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f3f4f6;
}

.page-number.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* 선택된 문항 패널 */
.selected-panel {
  width: 360px;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.btn-close {
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #111827;
}

.selected-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.summary-item .label {
  color: #6b7280;
}

.summary-item .value {
  color: #111827;
  font-weight: 600;
}

.btn-clear {
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.selected-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

/* 문항 그룹 */
.item-group {
  margin-bottom: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: move;
}

.item-group:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-group.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.item-group.drop-target {
  border: 2px dashed #3b82f6;
  background: #eff6ff;
}

/* 지문 그룹 헤더 */
.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #eff6ff;
  border-bottom: 1px solid #dbeafe;
  color: #1e40af;
  font-size: 0.875rem;
  font-weight: 600;
}

.group-title {
  flex: 1;
}

.group-count {
  padding: 0.125rem 0.375rem;
  background: white;
  border-radius: 10px;
  font-size: 0.75rem;
  color: #3b82f6;
}

/* 그룹 내 문항들 */
.group-items {
  padding: 0.5rem;
  background: #f9fafb;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem;
  margin-bottom: 0.375rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
}

.selected-item:last-child {
  margin-bottom: 0;
}

.selected-item:hover {
  background: #f3f4f6;
}

.selected-item.in-passage {
  border-left: 3px solid #3b82f6;
}

/* 드래그 핸들 */
.drag-handle {
  display: flex;
  align-items: center;
  color: #9ca3af;
  cursor: move;
  padding: 0.25rem;
}

.drag-handle:hover {
  color: #6b7280;
}

.selected-item .item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.selected-item .item-number {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.btn-remove {
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-remove:hover {
  opacity: 0.7;
}

.panel-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 이미지 모달 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.image-modal img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
}

.image-modal .btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr); /* 태블릿에서는 2열 */
  }
  
  .selected-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .header-right {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .search-wrapper {
    width: 100%;
    order: 2;
  }
  
  .filter-sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
  
  .filter-sidebar.collapsed {
    left: -260px;
  }
  
  .items-grid {
    grid-template-columns: 1fr; /* 모바일에서는 1열 */
  }
  
  .selected-panel {
    position: fixed;
    right: 0;
    top: 56px;
    bottom: 0;
    z-index: 100;
  }
}

/* 지문 그룹 스타일 */
.passage-groups {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.passage-group {
  display: flex;
  gap: 1.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  /* min-height 제거하여 컨텐츠에 맞게 높이 조정 */
}

/* 왼쪽 지문 영역 */
.passage-section {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #e5e7eb;
  padding-right: 1.5rem;
  height: 100%;
  min-width: 0; /* flexbox에서 오버플로우 방지 */
  overflow: hidden; /* 섹션 전체 오버플로우 숨김 */
}

.passage-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 600;
}

.passage-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 가로 스크롤 제거 */
  width: 100%;
  padding-right: 0.5rem; /* 스크롤바 공간 확보 */
}

.passage-text {
  line-height: 1.8;
  color: #4b5563;
  font-size: 0.9375rem;
  /* 모든 내용이 컨테이너 내에 들어가도록 설정 */
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word; /* 긴 단어도 줄바꿈 */
  hyphens: auto; /* 자동 하이픈 추가 */
}

/* 지문 HTML 내부 요소 스타일 */
.passage-text :deep(*) {
  max-width: 100% !important; /* 모든 요소가 컨테이너 너비를 초과하지 않도록 */
  box-sizing: border-box;
}

.passage-text :deep(p),
.passage-text :deep(div) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.passage-text :deep(img) {
  max-width: 100% !important;
  height: auto;
  display: block;
  margin: 0.5rem 0;
}

.passage-text :deep(table) {
  max-width: 100% !important;
  width: 100% !important;
  overflow: hidden;
  table-layout: fixed; /* 테이블 레이아웃 고정 */
  border-collapse: collapse;
}

.passage-text :deep(table td),
.passage-text :deep(table th) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  padding: 0.25rem;
}

.passage-text :deep(pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  max-width: 100%;
  background: #f6f8fa;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem; /* 코드 블록 폰트 크기 줄임 */
}

/* LaTeX 소스 코드 숨기기 (렌더링 전) */
.item-html :deep(script[type="math/tex"]),
.passage-text :deep(script[type="math/tex"]),
.question-preview :deep(script[type="math/tex"]),
.choice :deep(script[type="math/tex"]) {
  display: none !important;
}

/* 수식 이미지 제거 */
.item-html :deep(img),
.passage-text :deep(img[src*="latex"]),
.passage-text :deep(img[src*="math"]),
.question-preview :deep(img[src*="latex"]),
.question-preview :deep(img[src*="math"]) {
  display: none !important;
}

/* 수식 관련 요소 - 스크롤 가능하게 하되 컨테이너 내에서만 */
.passage-text :deep(.MathJax),
.passage-text :deep(.MathJax_Display),
.passage-text :deep(.katex),
.passage-text :deep(.math-tex),
.passage-text :deep(mjx-container) {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100% !important;
  display: block;
  margin: 0.5rem 0;
  /* 수식이 길 경우 스크롤바 표시 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

/* 수식 요소 스크롤바 스타일 */
.passage-text :deep(.MathJax)::-webkit-scrollbar,
.passage-text :deep(.MathJax_Display)::-webkit-scrollbar,
.passage-text :deep(.katex)::-webkit-scrollbar,
.passage-text :deep(.math-tex)::-webkit-scrollbar {
  height: 6px;
}

.passage-text :deep(.MathJax)::-webkit-scrollbar-thumb,
.passage-text :deep(.MathJax_Display)::-webkit-scrollbar-thumb,
.passage-text :deep(.katex)::-webkit-scrollbar-thumb,
.passage-text :deep(.math-tex)::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

/* MathJax 컨테이너 스타일 */
.item-html :deep(mjx-container),
.passage-text :deep(mjx-container),
.question-preview :deep(mjx-container),
.choice :deep(mjx-container) {
  display: inline-block !important;
  margin: 0 0.2em !important;
  vertical-align: middle !important;
}

/* 인라인 수식 */
.passage-text :deep(.MathJax_inline),
.passage-text :deep(.katex-inline),
.item-html :deep(.MathJax_inline),
.question-preview :deep(.MathJax_inline) {
  display: inline-block;
  max-width: 100%;
  overflow-x: auto;
  vertical-align: middle;
}

/* iframe 처리 */
.passage-text :deep(iframe) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto;
  min-height: 200px;
}

/* 오른쪽 문제 영역 */
.passage-items {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2열로 배치 */
  gap: 1rem;
  align-content: start;
}

/* 지문 섹션 내 문제 카드 */
.passage-items .item-card {
  min-height: 200px;
  max-height: none;
  width: 100%;
}
</style>