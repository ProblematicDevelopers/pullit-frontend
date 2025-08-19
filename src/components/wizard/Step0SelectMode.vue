<!--
  Step 0: 시험지 모드 선택 컴포넌트 (대용량 데이터 최적화 버전)
  
  1100개의 시험지 데이터를 효과적으로 탐색할 수 있도록 설계된 UI
  
  주요 기능:
  - 검색 중심 인터페이스
  - 계층적 필터링 시스템
  - 스마트 추천 섹션
  - 가상 스크롤/무한 스크롤
  - 자동완성 검색
-->

<template>
  <div class="step0-container">
    <!-- 검색 중심 헤더 (컴팩트) -->
    <div class="search-header">
      <div class="header-top">
        <h2 class="main-title">시험지 선택</h2>
        <div class="header-actions">
          <span class="exam-count">총 {{ totalExamCount }}개</span>
          <button class="btn-create-new" @click="createNewExam">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v16m8-8H4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            새 시험지 만들기
          </button>
        </div>
      </div>
      
      <!-- 검색 및 필터 영역 -->
      <div class="search-row">
        <!-- 메인 검색창 -->
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input 
            type="text"
            v-model="searchQuery"
            placeholder="시험지명, 과목, 단원 검색"
            class="search-input"
            @input="handleSearchWithDebounce"
            @focus="showSuggestions = true"
          >
          
          <!-- 자동완성 드롭다운 -->
          <div v-if="showSuggestions && (searchSuggestions.length > 0 || recentSearches.length > 0)" 
               class="search-suggestions">
            <div v-if="searchQuery && searchSuggestions.length > 0">
              <div class="suggestion-label">검색 제안</div>
              <div v-for="suggestion in searchSuggestions" 
                   :key="suggestion"
                   class="suggestion-item"
                   @click="selectSuggestion(suggestion)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2"/>
                </svg>
                {{ suggestion }}
              </div>
            </div>
            <div v-else-if="!searchQuery && recentSearches.length > 0">
              <div class="suggestion-label">최근 검색</div>
              <div v-for="recent in recentSearches" 
                   :key="recent"
                   class="suggestion-item"
                   @click="selectSuggestion(recent)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
                </svg>
                {{ recent }}
              </div>
            </div>
          </div>
        </div>

        <!-- 빠른 필터 칩들 -->
        <div class="quick-filters">
          <button 
            v-for="filter in quickFilters"
            :key="filter.id"
            class="filter-chip"
            :class="{ active: filter.active }"
            @click="toggleQuickFilter(filter)">
            {{ filter.label }}
            <span class="chip-count">{{ filter.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 메인 컨텐츠 2단 레이아웃 -->
    <div class="main-layout">
      <!-- 좌측: 계층적 필터 사이드바 -->
      <aside class="filter-sidebar">
        <div class="filter-header">
          <h3>상세 필터</h3>
          <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-filters">
            초기화
          </button>
        </div>

        <!-- 학년 필터 -->
        <div class="filter-group">
          <h4 class="filter-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke="currentColor" stroke-width="2"/>
            </svg>
            학년
          </h4>
          <div class="filter-options">
            <label class="checkbox-item" v-for="grade in grades" :key="grade.code">
              <input type="checkbox" v-model="filters.grades" :value="grade.code">
              <span>{{ grade.name }}</span>
              <span class="count">{{ grade.count }}</span>
            </label>
          </div>
        </div>

        <!-- 과목 필터 -->
        <div class="filter-group">
          <h4 class="filter-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2"/>
            </svg>
            과목
          </h4>
          <div class="filter-options">
            <label class="checkbox-item" v-for="subject in subjects" :key="subject.code">
              <input type="checkbox" v-model="filters.subjects" :value="subject.code" @change="onSubjectFilterChange">
              <span>{{ subject.name }}</span>
              <span class="count">{{ subject.count }}</span>
            </label>
          </div>
        </div>

        <!-- 교과서 필터 (과목 선택시 표시) -->
        <div v-if="filters.subjects.length > 0 && availableTextbooks.length > 0" class="filter-group">
          <h4 class="filter-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2"/>
            </svg>
            교과서
          </h4>
          <div class="filter-options">
            <label class="checkbox-item" v-for="textbook in availableTextbooks" :key="`textbook-${textbook.id}`">
              <input 
                type="checkbox" 
                :id="`textbook-checkbox-${textbook.id}`"
                v-model="filters.textbooks" 
                :value="textbook.id">
              <span>{{ textbook.name }}</span>
              <span class="count">{{ textbook.count || 0 }}</span>
            </label>
          </div>
        </div>

        <!-- 단원 필터 (교과서 선택시 표시) -->
        <div v-if="filters.textbooks.length > 0 && availableChapters.length > 0" class="filter-group">
          <h4 class="filter-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2"/>
            </svg>
            대단원
          </h4>
          <div class="filter-options">
            <label v-for="(chapter, index) in availableChapters" :key="`chapter-${index}-${chapter.id}`" class="checkbox-item">
              <input 
                type="checkbox" 
                :id="`chapter-checkbox-${index}-${chapter.id}`"
                :name="`chapter-checkbox-${index}`"
                :checked="filters.chapters.includes(String(chapter.code || chapter.id))"
                @change="toggleChapterSelection(String(chapter.code || chapter.id))">
              <span>{{ chapter.name }}</span>
              <span class="count">{{ chapter.count || 0 }}</span>
            </label>
          </div>
        </div>

        <!-- 문항 수 필터 -->
        <div class="filter-group">
          <h4 class="filter-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2"/>
            </svg>
            문항 수
          </h4>
          <div class="range-filter">
            <div class="range-values">
              <span>{{ filters.itemCount[0] }}문항</span>
              <span>{{ filters.itemCount[1] }}문항</span>
            </div>
            <div class="range-slider">
              <input type="range" v-model="filters.itemCount[0]" min="5" max="50" class="range-min">
              <input type="range" v-model="filters.itemCount[1]" min="5" max="50" class="range-max">
              <div class="range-track"></div>
              <div class="range-progress" :style="rangeProgressStyle"></div>
            </div>
          </div>
        </div>

        <!-- 공개 범위 필터 -->
        <div class="filter-group">
          <h4 class="filter-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/>
            </svg>
            공개 범위
          </h4>
          <div class="filter-options">
            <label class="radio-item">
              <input type="radio" v-model="filters.visibility" value="all">
              <span>전체</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="filters.visibility" value="PUBLIC">
              <span>공개</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="filters.visibility" value="SCHOOL">
              <span>학교</span>
            </label>
            <label class="radio-item">
              <input type="radio" v-model="filters.visibility" value="PRIVATE">
              <span>비공개</span>
            </label>
          </div>
        </div>
      </aside>

      <!-- 우측: 결과 영역 -->
      <main class="results-section">
        <!-- 추천 섹션 (검색 전 기본 화면) -->
        <div v-if="!searchQuery && !hasActiveFilters" class="recommendations">
          <!-- 새 시험지 만들기 카드 -->
          <div class="create-section">
            <div class="new-exam-card" @click="createNewExam">
              <div class="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h3>새 시험지 만들기</h3>
              <p>과목과 단원을 선택하여 새로운 시험지를 만드세요</p>
            </div>
          </div>

          <!-- 최근 사용 섹션 -->
          <section class="recent-section">
            <div class="section-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
                </svg>
                최근 사용한 시험지
              </h3>
              <button class="view-all">전체보기 →</button>
            </div>
            <div class="exam-cards">
              <div v-for="exam in recentExams" :key="exam.id" class="exam-card" @click="selectExam(exam)">
                <div class="exam-badge">{{ getSubjectName(exam.subject) }}</div>
                <h4 class="exam-title">{{ exam.title }}</h4>
                <div class="exam-meta">
                  <span>{{ exam.questionCount }}문항</span>
                  <span>{{ exam.grade }}</span>
                  <span>{{ formatDate(exam.updatedAt) }}</span>
                </div>
                <div class="exam-actions">
                  <button @click.stop="previewExam(exam)" class="btn-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                  <button @click.stop="editExam(exam)" class="btn-icon primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 인기 시험지 섹션 -->
          <section class="popular-section">
            <div class="section-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" stroke="currentColor" stroke-width="2"/>
                </svg>
                인기 시험지
              </h3>
              <select v-model="popularFilter" class="filter-select-small">
                <option value="all">전체</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
              </select>
            </div>
            <div class="popular-list">
              <div v-for="(exam, index) in popularExams" :key="exam.id" class="popular-item" @click="selectExam(exam)">
                <span class="rank">{{ index + 1 }}</span>
                <div class="exam-info">
                  <h4>{{ exam.title }}</h4>
                  <div class="exam-meta">
                    <span class="subject-tag">{{ getSubjectName(exam.subject) }}</span>
                    <span>{{ exam.grade }}</span>
                    <span>사용 {{ exam.useCount }}회</span>
                  </div>
                </div>
                <button @click.stop="editExam(exam)" class="btn-text">사용하기</button>
              </div>
            </div>
          </section>
        </div>

        <!-- 검색 결과 -->
        <div v-else class="search-results">
          <!-- 결과 헤더 -->
          <div class="results-header">
            <div class="results-info">
              <h3>검색 결과</h3>
              <span class="result-count">{{ totalCount }}개 시험지</span>
              <div v-if="searchQuery" class="search-term">
                "{{ searchQuery }}" 검색 결과
              </div>
            </div>
            <div class="results-controls">
              <div class="view-toggle">
                <button :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
                <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
              </div>
              <select v-model="sortBy" class="sort-select">
                <option value="relevance">관련도순</option>
                <option value="recent">최신순</option>
                <option value="popular">인기순</option>
                <option value="name">이름순</option>
              </select>
            </div>
          </div>

          <!-- 로딩 상태 -->
          <div v-if="isLoading && !searchResults.length" class="loading-state">
            <div class="spinner"></div>
            <p>시험지를 검색하고 있습니다...</p>
          </div>

          <!-- 검색 결과 없음 -->
          <div v-else-if="!isLoading && searchResults.length === 0" class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
            </svg>
            <h3>검색 결과가 없습니다</h3>
            <p>다른 검색어나 필터를 시도해보세요</p>
            <button @click="clearAllFilters" class="btn-primary">필터 초기화</button>
          </div>

          <!-- 검색 결과 목록 (가상 스크롤) -->
          <div v-else 
               ref="scrollContainer"
               class="results-container"
               :class="{ 'card-view': viewMode === 'card', 'list-view': viewMode === 'list' }"
               @scroll="handleScroll">
            
            <!-- 카드 뷰 -->
            <div v-if="viewMode === 'card'" class="results-grid">
              <div v-for="exam in visibleExams" :key="exam.id" class="result-card" @click="selectExam(exam)">
                <div class="card-header">
                  <span class="subject-badge" :class="`subject-${exam.subject}`">
                    {{ getSubjectName(exam.subject) }}
                  </span>
                  <span class="visibility-badge">
                    <svg v-if="exam.visibility === 'public'" width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <svg v-else-if="exam.visibility === 'school'" width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </span>
                </div>
                <h4 class="card-title">{{ exam.title }}</h4>
                <p class="card-chapter">{{ exam.chapterName }}</p>
                <div class="card-meta">
                  <span>{{ exam.grade }}</span>
                  <span>{{ exam.questionCount }}문항</span>
                  <span>{{ formatDate(exam.updatedAt) }}</span>
                </div>
                <div class="card-footer">
                  <div class="usage-stats">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    {{ exam.useCount }}회 사용
                  </div>
                  <div class="card-actions">
                    <button @click.stop="previewExam(exam)" class="btn-icon" title="미리보기">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                    <button @click.stop="editExam(exam)" class="btn-primary-small">
                      선택
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 리스트 뷰 -->
            <table v-else class="results-table">
              <thead>
                <tr>
                  <th>시험지명</th>
                  <th>과목</th>
                  <th>단원</th>
                  <th>학년</th>
                  <th>문항</th>
                  <th>공개</th>
                  <th>수정일</th>
                  <th>사용</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="exam in visibleExams" :key="exam.id" @click="selectExam(exam)">
                  <td class="exam-name">{{ exam.title }}</td>
                  <td>
                    <span class="subject-badge-small" :class="`subject-${exam.subject}`">
                      {{ getSubjectName(exam.subject) }}
                    </span>
                  </td>
                  <td class="chapter-name">{{ exam.chapterName }}</td>
                  <td>{{ exam.grade }}</td>
                  <td>{{ exam.questionCount }}</td>
                  <td>
                    <span class="visibility-icon">
                      {{ exam.visibility === 'public' ? '🌐' : exam.visibility === 'school' ? '🏫' : '🔒' }}
                    </span>
                  </td>
                  <td>{{ formatDate(exam.updatedAt) }}</td>
                  <td>{{ exam.useCount }}회</td>
                  <td>
                    <div class="table-actions">
                      <button @click.stop="previewExam(exam)" class="btn-text">미리보기</button>
                      <button @click.stop="editExam(exam)" class="btn-text primary">선택</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 추가 로딩 인디케이터 -->
            <div v-if="isLoadingMore" class="loading-more">
              <div class="spinner-small"></div>
              <span>추가 시험지를 불러오는 중...</span>
            </div>

            <!-- 끝 도달 메시지 -->
            <div v-if="!hasMore && searchResults.length > 0" class="end-message">
              <p>모든 시험지를 불러왔습니다</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 하단 액션 버튼 (선택된 시험지가 있을 때) -->
    <div v-if="selectedExamId || isCreatingNew" class="bottom-action">
      <div class="selected-info">
        <span v-if="selectedExamId">선택된 시험지: {{ selectedExamName }}</span>
        <span v-else>새 시험지 만들기</span>
      </div>
      <div class="action-buttons">
        <button @click="cancelSelection" class="btn-secondary">취소</button>
        <button @click="proceedToNext" class="btn-primary">
          {{ selectedExamId ? '이 시험지로 시작' : '새로 만들기' }} →
        </button>
      </div>
    </div>
    
    <!-- 선택한 시험지 하단 패널 -->
    <transition name="slide-up">
      <div v-if="showSelectedExamPanel" class="selected-exam-panel">
        <div class="panel-content">
          <div class="panel-info">
            <h3>선택한 시험지</h3>
            <p class="exam-name">{{ selectedExamName }}</p>
          </div>
          <div class="panel-actions">
            <button class="btn btn-secondary" @click="showSelectedExamPanel = false">
              취소
            </button>
            <button class="btn btn-primary" @click="proceedWithSelectedExam">
              이 시험지로 하기
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTestBankStore } from '@/stores/testBank'
import { storeToRefs } from 'pinia'
import examApi from '@/services/examApi'
import axios from 'axios'

// Props & Emits
const emit = defineEmits(['next', 'cancel', 'selectNew', 'selectExisting'])

// Store
const store = useTestBankStore()
const { loading, examSearchResults } = storeToRefs(store)

// API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// 통계 데이터
const totalExamCount = ref(0)
const myExamCount = ref(0)
const publicExamCount = ref(0)

// 검색 관련 상태
const searchQuery = ref('')
const searchSuggestions = ref([])
const recentSearches = ref([])
const showSuggestions = ref(false)
const isLoading = ref(false)
const isLoadingMore = ref(false)

// 필터 상태
const filters = reactive({
  grades: [], // 학년 (1학년, 2학년, 3학년)
  terms: [], // 학기
  subjects: [], // 과목
  textbooks: [], // 교과서
  chapters: [], // 단원
  itemCount: [5, 50],
  visibility: 'all'
})

// 빠른 필터
const quickFilters = ref([
  { id: 1, label: '최근 업데이트', count: 0, active: false },
  { id: 2, label: '내가 만든 시험지', count: 0, active: false },
  { id: 3, label: '우리 학교', count: 0, active: false },
  { id: 4, label: '공개 시험지', count: 0, active: false }
])

// 필터 옵션 데이터 (실제 API에서 로드)
const grades = ref([])
const subjects = ref([])
const terms = ref([])

// 교과서 목록 (과목 선택 시 동적으로 로드)
const availableTextbooks = ref([])

// 단원 목록 (교과서 선택 시 동적으로 로드)
const availableChapters = ref([])

// 검색 결과 관련
const searchResults = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 20
const hasMore = ref(true)
const visibleExams = ref([])

// UI 상태
const viewMode = ref('card') // 'card' or 'list'
const sortBy = ref('relevance')
const selectedExamId = ref(null)
const selectedExamName = ref('')
const selectedExamObject = ref(null) // 선택한 exam 객체 전체 저장
const isCreatingNew = ref(false)
const showSelectedExamPanel = ref(false)
const popularFilter = ref('week')

// 추천 시험지 데이터 (임시)
const recentExams = ref([
  {
    id: 1,
    title: '2024 1학기 중간고사',
    subject: 'math',
    grade: '중1',
    questionCount: 25,
    updatedAt: new Date('2024-03-15'),
    useCount: 234
  },
  {
    id: 2,
    title: '3월 모의고사 대비',
    subject: 'korean',
    grade: '중2',
    questionCount: 30,
    updatedAt: new Date('2024-03-10'),
    useCount: 189
  },
  {
    id: 3,
    title: '단원평가 - 미적분',
    subject: 'math',
    grade: '중3',
    questionCount: 20,
    updatedAt: new Date('2024-03-08'),
    useCount: 156
  }
])

const popularExams = ref([
  {
    id: 4,
    title: '2024 수학 1단원 총정리',
    subject: 'math',
    grade: '중1',
    useCount: 567
  },
  {
    id: 5,
    title: '영어 문법 기초',
    subject: 'english',
    grade: '중1',
    useCount: 432
  },
  {
    id: 6,
    title: '국어 문학 작품 분석',
    subject: 'korean',
    grade: '중2',
    useCount: 389
  },
  {
    id: 7,
    title: '과학 실험 보고서',
    subject: 'science',
    grade: '중3',
    useCount: 234
  },
  {
    id: 8,
    title: '역사 연표 정리',
    subject: 'social',
    grade: '중2',
    useCount: 198
  }
])

// Computed
const hasActiveFilters = computed(() => {
  return filters.grades.length > 0 ||
         filters.subjects.length > 0 ||
         filters.textbooks.length > 0 ||
         filters.chapters.length > 0 ||
         filters.visibility !== 'all' ||
         quickFilters.value.some(f => f.active)
})

const rangeProgressStyle = computed(() => {
  const min = 5
  const max = 50
  const leftPercent = ((filters.itemCount[0] - min) / (max - min)) * 100
  const rightPercent = ((filters.itemCount[1] - min) / (max - min)) * 100
  return {
    left: `${leftPercent}%`,
    width: `${rightPercent - leftPercent}%`
  }
})

// Methods
const handleSearchWithDebounce = (() => {
  let timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      performSearch()
    }, 300)
  }
})()

const performSearch = async () => {
  console.log('===== performSearch 시작 =====')
  console.log('현재 filters.grades:', filters.grades)
  
  // 검색어와 필터가 모두 없을 때는 전체 검색
  const isEmptySearch = !searchQuery.value && !hasActiveFilters.value
  
  // 초기화
  searchResults.value = []
  visibleExams.value = []

  isLoading.value = true
  currentPage.value = 0  // 0부터 시작
  
  try {
    // 검색 파라미터 준비 - 여러 과목 선택 지원
    const gradeCodeValue = filters.grades.length > 0 ? filters.grades.join(',') : null
    console.log('gradeCode 계산 결과:', gradeCodeValue)
    
    const searchParams = {
      keyword: searchQuery.value,
      gradeCode: gradeCodeValue,
      termCode: filters.terms.length > 0 ? filters.terms.join(',') : null,
      areaCode: filters.subjects.length > 0 ? filters.subjects.join(',') : null,  // 과목 코드
      subjectId: filters.textbooks.length > 0 ? filters.textbooks[0] : null,    // 교과서 ID (단일 선택)
      largeChapterCode: filters.chapters.length > 0 ? filters.chapters.join(',') : null, // 대단원 코드 (복수 선택 지원)
      visibility: filters.visibility !== 'all' ? filters.visibility : null,  // visibility 필터 추가
      page: currentPage.value,  // 이미 0부터 시작
      size: pageSize,
      examType: 'ALL'
    }
    
    // 디버깅용 로그
    console.log('=== 시험지 검색 시작 ===')
    console.log('검색 파라미터:', searchParams)
    console.log('선택된 과목 코드:', filters.subjects)
    console.log('선택된 학년 코드:', filters.grades)
    console.log('학년 필터 상세:', {
      grades: filters.grades,
      gradeCode: searchParams.gradeCode,
      전체필터: JSON.stringify(filters)
    })
    
    // API 호출
    const result = await store.searchExams(searchParams)
    
    console.log('API 응답 결과:', result)
    console.log('응답 content 개수:', result?.content?.length || 0)
    console.log('총 개수:', result?.totalElements || 0)
    
    if (result && result.content && Array.isArray(result.content)) {
      searchResults.value = transformSearchResults(result.content)
      visibleExams.value = [...searchResults.value]  // 첫 페이지 전체 표시
      totalCount.value = result.totalElements || 0
      hasMore.value = result.totalPages > 1  // 다음 페이지 존재 여부
      currentPage.value = 1  // 다음 로드를 위해 1로 설정
      
      console.log('변환된 검색 결과:', searchResults.value.slice(0, 3)) // 처음 3개만 로그
    } else {
      console.warn('검색 결과가 없거나 형식이 잘못됨:', result)
      searchResults.value = []
      visibleExams.value = []
      totalCount.value = 0
    }
    
    // 검색 제안 업데이트
    if (searchQuery.value) {
      searchSuggestions.value = [
        `${searchQuery.value} 중간고사`,
        `${searchQuery.value} 기말고사`,
        `${searchQuery.value} 단원평가`,
        `${searchQuery.value} 모의고사`
      ]
    }
  } catch (error) {
    console.error('검색 실패:', error)
    searchResults.value = []
    visibleExams.value = []
  } finally {
    isLoading.value = false
  }
}

const handleScroll = (event) => {
  const container = event.target
  const scrollPercentage = (container.scrollTop + container.clientHeight) / container.scrollHeight
  
  if (scrollPercentage > 0.9 && !isLoadingMore.value && hasMore.value) {
    loadMoreExams()
  }
}

const loadMoreExams = async () => {
  if (isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  
  try {
    // 다음 페이지 데이터를 서버에서 가져오기
    const searchParams = {
      keyword: searchQuery.value,
      gradeCode: filters.grades.length > 0 ? filters.grades.join(',') : '',
      termCode: filters.terms.length > 0 ? filters.terms.join(',') : '',
      areaCode: filters.subjects.length > 0 ? filters.subjects.join(',') : '',
      textbook: filters.textbooks.length > 0 ? filters.textbooks.join(',') : '',
      page: currentPage.value, // 현재 페이지 (0부터 시작이므로 증가 전 값 사용)
      size: pageSize,
      includeSystemExams: true,
      includeUserExams: true
    }
    
    console.log('더 많은 시험지 로드 중... 페이지:', currentPage.value + 1)
    
    const result = await store.searchExams(searchParams)
    
    if (result && result.content) {
      const newExams = transformSearchResults(result.content)
      visibleExams.value.push(...newExams)
      searchResults.value.push(...newExams)
      
      // 다음 페이지 여부 확인
      hasMore.value = currentPage.value < result.totalPages - 1
      currentPage.value++
      
      console.log(`추가 로드 완료: ${newExams.length}개, 전체: ${visibleExams.value.length}개`)
    }
  } catch (error) {
    console.error('추가 로드 실패:', error)
    hasMore.value = false
  } finally {
    isLoadingMore.value = false
  }
}

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  performSearch()
}

const toggleQuickFilter = (filter) => {
  filter.active = !filter.active
  performSearch()
}

const toggleChapter = (chapterId) => {
  const chapter = availableChapters.value.find(c => c.id === chapterId)
  if (chapter) {
    chapter.expanded = !chapter.expanded
  }
}

// 과목 필터 변경 이벤트 핸들러
const onSubjectFilterChange = async () => {
  console.log('과목 필터 변경됨:', filters.subjects)
  
  // 교과서 목록 로드
  await loadTextbooksForSubject()
  
  // 검색 수행
  console.log('과목 변경으로 검색 시작')
  performSearch()
}

// 과목별 교과서 로드 (실제 subjects 테이블에서 로드)
const loadTextbooksForSubject = async () => {
  try {
    if (filters.subjects.length === 0) {
      availableTextbooks.value = []
      return
    }
    
    console.log('선택된 과목의 교과서 목록 로드 중...', filters.subjects)
    
    // 선택된 학년과 과목 코드
    const gradeCode = filters.grades.length > 0 ? filters.grades[0] : null
    const areaCode = filters.subjects[0] // 첫 번째 과목 코드
    
    // store의 fetchTextbooks 함수 사용
    const textbooks = await store.fetchTextbooks(gradeCode, areaCode)
    
    // 각 교과서별 시험지 개수 조회
    const textbooksWithCount = await Promise.all(textbooks.map(async t => {
      try {
        const countResponse = await axios.get(`${API_BASE_URL}/api/exams/count`, {
          params: {
            subjectId: t.subjectId,
            gradeCode: gradeCode,
            areaCode: areaCode
          }
        })
        const count = countResponse.data.totalCount || 0
        
        return {
          id: t.subjectId,
          code: t.subjectId,
          name: t.subjectName,
          areaCode: t.areaCode,
          gradeCode: t.gradeCode,
          count: count
        }
      } catch (error) {
        console.error(`교과서 ${t.subjectId} 카운트 조회 실패:`, error)
        return {
          id: t.subjectId,
          code: t.subjectId,
          name: t.subjectName,
          areaCode: t.areaCode,
          gradeCode: t.gradeCode,
          count: 0
        }
      }
    }))
    
    availableTextbooks.value = textbooksWithCount
    console.log('교과서 목록 로드 완료 (카운트 포함):', availableTextbooks.value)
  } catch (error) {
    console.error('교과서 목록 로드 실패:', error)
    availableTextbooks.value = []
  }
}

// 교과서에 따른 단원 로드
const loadChaptersForFilters = async () => {
  // 필수 조건: 교과서가 선택되어야 함
  if (filters.textbooks.length === 0) {
    availableChapters.value = []
    filters.chapters = [] // 단원 선택도 초기화
    return
  }

  try {
    // 선택된 첫 번째 교과서 ID
    const subjectId = filters.textbooks[0]
    
    console.log(`대단원 로드 중... 교과서 ID: ${subjectId}`)
    
    // store의 fetchChapters 함수 사용
    const chapters = await store.fetchChapters(subjectId)
    
    if (chapters && chapters.length > 0) {
      console.log(`대단원 로드 성공:`, chapters)
      
      // API 응답이 LargeNode 형식 (id, name, children)
      // 각 대단원별로 시험지 개수 조회
      const chaptersWithCount = []
      
      for (const largeChapter of chapters) {
        // LargeNode 구조: { id: Long, name: String, children: [] }
        const chapterCode = String(largeChapter.id)
        const chapterName = largeChapter.name
        
        // 각 대단원별 시험지 개수를 개별 조회
        try {
          const countResponse = await axios.get(`${API_BASE_URL}/api/exams/count`, {
            params: {
              largeChapterCode: chapterCode,
              subjectId: subjectId,
              gradeCode: filters.grades.length > 0 ? filters.grades[0] : null,
              areaCode: filters.subjects.length > 0 ? filters.subjects[0] : null
            }
          })
          
          const count = countResponse.data.totalCount || 0
          console.log(`대단원 "${chapterName}" (코드: ${chapterCode}): ${count}개 시험지`)
          
          chaptersWithCount.push({
            id: chapterCode,
            code: chapterCode,
            name: chapterName,
            count: count
          })
        } catch (error) {
          console.error(`대단원 ${chapterCode} 카운트 조회 실패:`, error)
          chaptersWithCount.push({
            id: chapterCode,
            code: chapterCode,
            name: chapterName,
            count: 0
          })
        }
      }
      
      availableChapters.value = chaptersWithCount
      console.log('대단원 로드 완료 (카운트 포함):', availableChapters.value)
    } else {
      console.log('대단원 데이터가 없습니다')
      availableChapters.value = []
      filters.chapters = []
    }
  } catch (error) {
    console.error('대단원 로드 실패:', error)
    availableChapters.value = []
    filters.chapters = []
  }
}

// 과목별 챕터 로드 (레거시 호환성 유지)
const loadChaptersForSubject = async (areaCode) => {
  // 새 함수로 리다이렉트
  await loadChaptersForFilters()
}

// 교과서 변경 시 챕터 다시 로드
const onTextbookChange = () => {
  loadChaptersForFilters()
}

// 대단원 선택 토글 함수
const toggleChapterSelection = (chapterCode) => {
  console.log('토글 전 chapters 배열:', [...filters.chapters])
  console.log('토글할 chapterCode:', chapterCode)
  
  const index = filters.chapters.findIndex(code => code === chapterCode)
  
  if (index > -1) {
    // 이미 선택되어 있으면 제거
    filters.chapters.splice(index, 1)
    console.log(`대단원 ${chapterCode} 제거됨`)
  } else {
    // 선택되어 있지 않으면 추가
    filters.chapters.push(chapterCode)
    console.log(`대단원 ${chapterCode} 추가됨`)
  }
  
  console.log('토글 후 chapters 배열:', [...filters.chapters])
  
  // 강제로 Vue의 반응성 트리거
  filters.chapters = [...filters.chapters]
}

const clearAllFilters = () => {
  filters.grades = []
  filters.subjects = []
  filters.textbooks = []
  filters.chapters = []
  filters.itemCount = [5, 50]
  filters.visibility = 'all'
  quickFilters.value.forEach(f => f.active = false)
  searchQuery.value = ''
  searchResults.value = []
  visibleExams.value = []
  availableTextbooks.value = []
  availableChapters.value = []
  totalCount.value = 0
  performSearch()
}

const createNewExam = () => {
  console.log('새 시험지 만들기 클릭')
  isCreatingNew.value = true
  store.setMode('new')
  // 다음 단계로 이동
  emit('next', { mode: 'create' })
}

const selectExam = async (exam) => {
  console.log('기존 시험지 선택:', exam)
  console.log('exam.areaCode:', exam.areaCode, 'exam.areaName:', exam.areaName)
  console.log('exam.gradeCode:', exam.gradeCode, 'exam.gradeName:', exam.gradeName)
  console.log('exam.examType:', exam.examType)
  
  selectedExamId.value = exam.id
  selectedExamName.value = exam.title || exam.examName
  selectedExamObject.value = exam // exam 객체 전체 저장
  store.setMode('edit')
  store.setSelectedExam(exam)
  
  // 해당 시험지의 문항 정보 로드
  try {
    // examType 확인 (없으면 기본값 TESTWIZARD)
    const examType = exam.examType || 'TESTWIZARD'
    
    // USER_CREATED 타입은 아직 지원하지 않음
    if (examType === 'USER_CREATED') {
      alert('사용자가 생성한 시험지는 현재 편집 기능을 지원하지 않습니다.')
      store.existingItemIds = []
      store.originalExamData = null
    } else {
      await store.loadExistingExamItems(exam.id, examType)
      console.log('기존 문항 로드 완료:', store.existingItemIds)
    }
  } catch (error) {
    console.error('기존 문항 로드 실패:', error)
    // 로드 실패해도 계속 진행 (빈 문항으로 시작)
  }
  
  // 하단 패널 표시 (바로 이동하지 않고 사용자가 선택)
  showSelectedExamPanel.value = true
}

const editExam = async (exam) => {
  await selectExam(exam)
  proceedToNext()
}

const proceedWithSelectedExam = () => {
  if (selectedExamId.value && selectedExamObject.value) {
    // exam 객체 전체를 emit - TestWizardView에서 examInfo를 설정하기 위해
    emit('selectExisting', selectedExamObject.value)
    emit('next', { mode: 'edit', examId: selectedExamId.value })
  }
}

const previewExam = (exam) => {
  console.log('미리보기:', exam)
  // 미리보기 모달 열기
}

const cancelSelection = () => {
  selectedExamId.value = null
  selectedExamName.value = ''
  selectedExamObject.value = null
  isCreatingNew.value = false
}

const proceedToNext = () => {
  if (isCreatingNew.value) {
    emit('selectNew')
  } else if (selectedExamId.value) {
    const exam = searchResults.value.find(e => e.id === selectedExamId.value) ||
                 recentExams.value.find(e => e.id === selectedExamId.value) ||
                 popularExams.value.find(e => e.id === selectedExamId.value)
    emit('selectExisting', exam)
  }
  store.setCurrentStep(1)
  emit('next')
}

const getSubjectName = (subject) => {
  const subjects = {
    MA: '수학',
    KO: '국어',
    EN: '영어',
    SC: '과학',
    SO: '사회',
    HS: '역사',
    MO: '도덕',
    // 소문자 호환성 유지
    math: '수학',
    korean: '국어',
    english: '영어',
    science: '과학',
    social: '사회'
  }
  return subjects[subject] || subjects[subject?.toUpperCase()] || subject
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff < 7) return `${diff}일 전`
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`
  
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// Helper 함수들 추가
const loadAccessibleExams = async () => {
  try {
    // 초기 시험지 목록 로드 (전체 검색)
    const searchParams = {
      page: 0,
      size: 20,
      examType: 'ALL',
      sort: 'createdDate,desc'
    }
    
    console.log('초기 시험지 목록 로드 중...')
    const result = await store.searchExams(searchParams)
    
    if (result && result.content) {
      // 검색 결과를 searchResults와 visibleExams에 설정
      searchResults.value = transformSearchResults(result.content)
      visibleExams.value = [...searchResults.value]
      totalCount.value = result.totalElements || 0
      hasMore.value = result.totalPages > 1
      currentPage.value = 1  // 다음 페이지 로드를 위해 1로 설정
      
      // 최근 시험지도 동일한 데이터로 설정
      recentExams.value = searchResults.value.slice(0, 10)
      
      console.log(`초기 시험지 ${result.content.length}개 로드 완료, 전체: ${result.totalElements}개`)
      
      // 빠른 필터 업데이트
      const myExamFilter = quickFilters.value.find(f => f.id === 2)
      if (myExamFilter) {
        myExamFilter.count = result.totalElements || 0
      }
    }
  } catch (error) {
    console.error('초기 시험지 로드 실패:', error)
    // 실패 시 빈 배열로 초기화
    searchResults.value = []
    visibleExams.value = []
    recentExams.value = []
  }
}

const loadStatistics = async () => {
  try {
    // 전체 시험지 수 조회
    const allExamsResult = await store.searchExams({
      page: 0,
      size: 1,
      includeSystemExams: true,
      includeUserExams: true
    })
    
    if (allExamsResult) {
      totalExamCount.value = allExamsResult.totalElements || 0
    }
    
    // 공개 시험지 수 조회
    const publicExamsResult = await store.searchExams({
      page: 0,
      size: 1,
      visibility: 'public'
    })
    
    if (publicExamsResult) {
      publicExamCount.value = publicExamsResult.totalElements || 0
      
      // 빠른 필터 업데이트
      const publicFilter = quickFilters.value.find(f => f.id === 4)
      if (publicFilter) {
        publicFilter.count = publicExamsResult.totalElements || 0
      }
    }
    
    // 각 과목별 시험지 수 조회 - count API 사용
    console.log('=== 과목별 통계 로드 시작 ===')
    for (const subject of subjects.value) {
      try {
        const response = await examApi.getExamCounts({
          areaCode: subject.code  // subject.id가 아니라 subject.code 사용
        })
        
        if (response.data) {
          // API 응답에서 직접 카운트 추출
          subject.count = response.data.totalCount || 0
          console.log(`✓ ${subject.name} (${subject.code}): ${subject.count}개`)
        }
      } catch (error) {
        console.error(`✗ ${subject.name} (${subject.code}) 카운트 로드 실패:`, error.response?.data || error.message)
        // 에러 시 기존 searchExams API 사용 (폴백)
        try {
          const result = await store.searchExams({
            areaCode: subject.code,  // subject.code 사용
            page: 0,
            size: 1,
            examType: 'ALL'
          })
          
          if (result) {
            subject.count = result.totalElements || 0
            console.log(`${subject.name} (${subject.code}): ${subject.count}개 (폴백)`)
          }
        } catch (fallbackError) {
          console.error(`${subject.name} 폴백 카운트도 실패:`, fallbackError)
        }
      }
    }
    
    // 필터 옵션에서 학교급별 통계 업데이트 (schoolLevels 제거)
    console.log('통계 로드 완료 - 중학교 과목별 통계 집계 완료')
    
    // 최근 업데이트 시험지 수 (임시로 전체의 일부로 설정)
    const recentFilter = quickFilters.value.find(f => f.id === 1)
    if (recentFilter) {
      recentFilter.count = Math.floor(totalExamCount.value * 0.15) // 임시로 15%
    }
    
    // 우리 학교 시험지 수 (임시로 설정)
    const schoolFilter = quickFilters.value.find(f => f.id === 3)
    if (schoolFilter) {
      schoolFilter.count = Math.floor(totalExamCount.value * 0.1) // 임시로 10%
    }
  } catch (error) {
    console.error('통계 데이터 로드 실패:', error)
  }
}

const transformSearchResults = (exams) => {
  console.log('변환 중인 시험지 데이터:', exams.slice(0, 2)) // 디버깅용
  return exams.map(exam => ({
    id: exam.id,
    title: exam.examName,
    subject: exam.subjectName || exam.areaName || 'Unknown', // subjectName 또는 areaName 사용
    grade: exam.gradeName || '', // gradeName 그대로 사용
    gradeCode: exam.gradeCode || '', // gradeCode도 저장
    areaCode: exam.areaCode || '', // areaCode 추가
    areaName: exam.areaName || '', // areaName 추가
    subjectId: exam.subjectId, // 교과서 ID도 추가
    chapterName: exam.chapterName || exam.examType || '단원평가',
    questionCount: exam.itemCount || 0, // itemCount 사용
    updatedAt: exam.updatedDate || new Date(),
    useCount: exam.useCount || 0,
    visibility: exam.visibility ? exam.visibility.toLowerCase() : 'private'
  }))
}

const getGradeCode = (gradeName) => {
  const gradeMap = {
    '중1': '07',
    '중2': '08', 
    '중3': '09'
  }
  return gradeMap[gradeName] || ''
}

// 인기 시험지 로드
const loadPopularExams = async () => {
  try {
    const result = await store.fetchPopularExams(10)
    if (result && Array.isArray(result)) {
      popularExams.value = transformSearchResults(result)
    }
  } catch (error) {
    console.error('인기 시험지 로드 실패:', error)
  }
}

// Lifecycle
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  
  // 필터 옵션 로드
  try {
    await store.fetchFilterOptions()
    console.log('필터 옵션 로드 완료')
    
    // store에서 가져온 데이터로 업데이트
    const filterOptions = store.filterOptions
    
    if (filterOptions) {
      // 학년 데이터 업데이트
      if (filterOptions.grades && filterOptions.grades.length > 0) {
        grades.value = filterOptions.grades.map(grade => ({
          code: grade.code,
          name: grade.name,
          count: grade.count || 0
        }))
      }
      
      // 과목 데이터 업데이트  
      if (filterOptions.subjects && filterOptions.subjects.length > 0) {
        subjects.value = filterOptions.subjects.map(subj => ({
          code: subj.code,
          name: subj.name,
          count: subj.count || 0
        }))
      }
      
      // 학기 데이터 업데이트
      if (filterOptions.terms && filterOptions.terms.length > 0) {
        terms.value = filterOptions.terms.map(term => ({
          code: term.code,
          name: term.name,
          count: term.count || 0
        }))
      }
      
      console.log('필터 옵션 업데이트 완료:', {
        grades: grades.value.length,
        subjects: subjects.value.length,
        terms: terms.value.length
      })
    }
    
    // 초기 시험지 목록 로드 (접근 가능한 시험지)
    await loadAccessibleExams()
    
    // 인기 시험지 로드
    await loadPopularExams()
    
    // 통계 데이터 로드
    await loadStatistics()
  } catch (error) {
    console.error('초기 데이터 로드 실패:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event) => {
  if (!event.target.closest('.search-box-large')) {
    showSuggestions.value = false
  }
}

// Watchers - 순차적 필터링을 위한 감시자

// Watch 함수들

// 1. 학년 변경 시
watch(() => filters.grades, (newVal) => {
  console.log('===== 학년 필터 변경 =====')
  console.log('선택된 학년 코드:', newVal)
  console.log('학년 데이터:', grades.value)
  console.log('전체 필터 상태:', JSON.stringify(filters))
  performSearch()
}, { deep: true })

// 2. 과목 변경 시 - 교과서 목록 로드
watch(() => filters.subjects, async (newVal, oldVal) => {
  console.log('과목 필터 변경됨:', { 이전: oldVal, 현재: newVal })
  
  if (newVal.length === 0) {
    // 과목 해제 시 하위 필터 초기화
    filters.textbooks = []
    filters.chapters = []
    availableTextbooks.value = []
    availableChapters.value = []
    console.log('과목 필터 해제 - 하위 필터 초기화')
  } else {
    // 과목 선택 시 교과서 목록 로드
    console.log('과목 선택됨 - 교과서 로드 시작:', newVal)
    await loadTextbooksForSubject()
  }
  
  console.log('과목 변경으로 인한 검색 시작')
  performSearch()
}, { deep: true })

// 3. 교과서 변경 시 - 단원 목록 로드
watch(() => filters.textbooks, async (newVal) => {
  if (newVal.length === 0) {
    // 교과서 해제 시 단원 초기화
    filters.chapters = []
    availableChapters.value = []
  } else {
    // 교과서 선택 시 단원 로드
    await loadChaptersForFilters()
  }
  performSearch()
})

// 4. 단원 변경 시 - 검색만 수행
watch(() => filters.chapters, () => {
  performSearch()
})

// 5. 기타 필터 변경 시 - 검색만 수행
watch([() => filters.itemCount, () => filters.visibility], () => {
  performSearch()
})
</script>

<style scoped>
/* 메인 컨테이너 */
.step0-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
}

/* 검색 헤더 (컴팩트) */
.search-header {
  background: white;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e4e8;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.btn-create-new {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create-new:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-create-new svg {
  flex-shrink: 0;
}

.main-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #24292e;
  margin: 0;
}

.exam-count {
  font-size: 0.875rem;
  color: #586069;
  padding: 0.25rem 0.5rem;
  background: #f6f8fa;
  border-radius: 4px;
}

/* 검색 영역 */
.search-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  font-size: 0.875rem;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #959da5;
}

/* 자동완성 드롭다운 */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  margin-top: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-label {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #586069;
  border-bottom: 1px solid #e1e4e8;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.suggestion-item:hover {
  background: #f6f8fa;
}

.suggestion-item svg {
  color: #959da5;
}

/* 빠른 필터 */
.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-chip {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.filter-chip:hover {
  border-color: #0366d6;
  background: #f1f8ff;
}

.filter-chip.active {
  background: #0366d6;
  color: white;
  border-color: #0366d6;
}

.chip-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* 메인 레이아웃 */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 필터 사이드바 */
.filter-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e1e4e8;
  overflow-y: auto;
  flex-shrink: 0;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e1e4e8;
}

.filter-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.clear-filters {
  font-size: 0.875rem;
  color: #0366d6;
  background: none;
  border: none;
  cursor: pointer;
}

.clear-filters:hover {
  text-decoration: underline;
}

/* 필터 그룹 */
.filter-group {
  padding: 1.5rem;
  border-bottom: 1px solid #e1e4e8;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #24292e;
  margin: 0 0 1rem 0;
}

.filter-title svg {
  color: #586069;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-item,
.radio-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0;
  position: relative;
}

.checkbox-item:hover,
.radio-item:hover {
  color: #0366d6;
}

.checkbox-item input[type="checkbox"],
.radio-item input[type="radio"] {
  cursor: pointer;
  margin: 0;
  width: 16px;
  height: 16px;
}

/* 체크박스 독립성 보장 */
.checkbox-item input[type="checkbox"] {
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

.checkbox-item .count {
  margin-left: auto;
  font-size: 0.75rem;
  color: #959da5;
}

.sub-filter {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
}

.grade-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* 단원 트리 */
.chapter-tree {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chapter-item {
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  overflow: hidden;
}

.chapter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: #f6f8fa;
  border: none;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.chapter-toggle:hover {
  background: #e1e4e8;
}

.chapter-toggle svg {
  flex-shrink: 0;
  color: #586069;
}

.chapter-toggle .count {
  margin-left: auto;
  font-size: 0.75rem;
  color: #959da5;
}

.sub-chapters {
  padding: 0.5rem;
  background: white;
  border-top: 1px solid #e1e4e8;
}

/* 범위 슬라이더 */
.range-filter {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.range-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #586069;
}

.range-slider {
  position: relative;
  height: 32px;
}

.range-slider input[type="range"] {
  position: absolute;
  width: 100%;
  height: 4px;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  z-index: 2;
}

.range-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0366d6;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-track {
  position: absolute;
  top: 14px;
  left: 0;
  right: 0;
  height: 4px;
  background: #e1e4e8;
  border-radius: 2px;
}

.range-progress {
  position: absolute;
  top: 14px;
  height: 4px;
  background: #0366d6;
  border-radius: 2px;
}

/* 결과 섹션 */
.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 추천 섹션 */
.recommendations {
  padding: 2rem;
  overflow-y: auto;
}

.create-section {
  margin-bottom: 2rem;
}

.new-exam-card {
  background: white;
  border: 2px dashed #0366d6;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.new-exam-card:hover {
  border-style: solid;
  background: #f1f8ff;
}

.new-exam-card .card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: #0366d6;
  border-radius: 50%;
  color: white;
  margin-bottom: 1rem;
}

.new-exam-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #24292e;
  margin: 0 0 0.5rem 0;
}

.new-exam-card p {
  font-size: 0.875rem;
  color: #586069;
  margin: 0;
}

/* 섹션 스타일 */
.recent-section,
.popular-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #24292e;
  margin: 0;
}

.section-header svg {
  color: #586069;
}

.view-all {
  font-size: 0.875rem;
  color: #0366d6;
  background: none;
  border: none;
  cursor: pointer;
}

.view-all:hover {
  text-decoration: underline;
}

.filter-select-small {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* 시험지 카드 */
.exam-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.exam-card {
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.exam-card:hover {
  border-color: #0366d6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.exam-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f1f8ff;
  color: #0366d6;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.exam-title {
  font-size: 1rem;
  font-weight: 600;
  color: #24292e;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exam-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #586069;
  margin-bottom: 0.75rem;
}

.exam-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon {
  padding: 0.375rem;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f6f8fa;
  border-color: #0366d6;
}

.btn-icon.primary {
  background: #0366d6;
  color: white;
  border-color: #0366d6;
}

.btn-icon.primary:hover {
  background: #0256c7;
}

/* 인기 리스트 */
.popular-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.popular-item:hover {
  border-color: #0366d6;
  background: #f6f8fa;
}

.rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #f6f8fa;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #586069;
}

.exam-info {
  flex: 1;
}

.exam-info h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #24292e;
  margin: 0 0 0.25rem 0;
}

.subject-tag {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: #f1f8ff;
  color: #0366d6;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
}

.btn-text {
  padding: 0.375rem 0.75rem;
  background: none;
  border: none;
  color: #0366d6;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-text.primary {
  font-weight: 500;
}

/* 검색 결과 */
.search-results {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e1e4e8;
}

.results-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #24292e;
  margin: 0;
}

.result-count {
  font-size: 0.875rem;
  color: #586069;
  margin-left: 0.5rem;
}

.search-term {
  font-size: 0.875rem;
  color: #586069;
  margin-top: 0.25rem;
}

.results-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: #f6f8fa;
  border-radius: 4px;
}

.view-toggle button {
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #586069;
  transition: all 0.15s;
}

.view-toggle button:hover {
  background: white;
}

.view-toggle button.active {
  background: white;
  color: #0366d6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.sort-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
}

/* 로딩 상태 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e1e4e8;
  border-top-color: #0366d6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e1e4e8;
  border-top-color: #0366d6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p,
.empty-state p {
  font-size: 0.875rem;
  color: #586069;
  margin: 0.5rem 0;
}

.empty-state svg {
  color: #d1d5da;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #24292e;
  margin: 0 0 0.5rem 0;
}

/* 결과 컨테이너 */
.results-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f6f8fa;
}

/* 카드 뷰 */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.result-card {
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.result-card:hover {
  border-color: #0366d6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.subject-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 교과서 필터 스타일 */
.checkbox-item .publisher {
  font-size: 0.75rem;
  color: #959da5;
  margin-left: 0.25rem;
}

.subject-MA, .subject-math {
  background: #dbeafe;
  color: #1e40af;
}

.subject-KO, .subject-korean {
  background: #fce7f3;
  color: #be185d;
}

.subject-EN, .subject-english {
  background: #ede9fe;
  color: #7c3aed;
}

.subject-SC, .subject-science {
  background: #d1fae5;
  color: #065f46;
}

.subject-SO, .subject-social {
  background: #fed7aa;
  color: #c2410c;
}

.subject-HS {
  background: #fef3c7;
  color: #92400e;
}

.subject-MO {
  background: #e0e7ff;
  color: #3730a3;
}

.visibility-badge {
  display: flex;
  align-items: center;
  color: #586069;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #24292e;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-chapter {
  font-size: 0.875rem;
  color: #586069;
  margin: 0 0 0.75rem 0;
}

.card-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #586069;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e1e4e8;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-stats {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #586069;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary-small {
  padding: 0.375rem 0.75rem;
  background: #0366d6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary-small:hover {
  background: #0256c7;
}

/* 리스트 뷰 */
.results-table {
  width: 100%;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  overflow: hidden;
  border-collapse: collapse;
}

.results-table th {
  padding: 0.75rem;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #24292e;
}

.results-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e1e4e8;
  font-size: 0.875rem;
}

.results-table tr:hover {
  background: #f6f8fa;
}

.exam-name {
  font-weight: 500;
  color: #24292e;
}

.chapter-name {
  color: #586069;
}

.subject-badge-small {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
}

.visibility-icon {
  font-size: 1rem;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

/* 추가 로딩 */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #586069;
  font-size: 0.875rem;
}

.end-message {
  text-align: center;
  padding: 2rem;
  color: #586069;
  font-size: 0.875rem;
}

/* 하단 액션 */
.bottom-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-top: 2px solid #0366d6;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.selected-info {
  font-size: 0.875rem;
  color: #24292e;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: white;
  color: #24292e;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: #f6f8fa;
}

.btn-primary {
  padding: 0.625rem 1.25rem;
  background: #0366d6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #0256c7;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  
  .filter-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e1e4e8;
    max-height: 40vh;
  }
  
  .exam-cards,
  .results-grid {
    grid-template-columns: 1fr;
  }
}

/* 선택한 시험지 하단 패널 */
.selected-exam-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 2px solid #3b82f6;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 1.5rem 2rem;
}

.panel-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-info h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.panel-info .exam-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 1rem;
}

.panel-actions .btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.panel-actions .btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.panel-actions .btn-secondary:hover {
  background: #e5e7eb;
}

.panel-actions .btn-primary {
  background: #3b82f6;
  color: white;
}

.panel-actions .btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 슬라이드 업 애니메이션 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>