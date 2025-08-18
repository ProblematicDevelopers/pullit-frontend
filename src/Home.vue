<template>
  <div class="education-platform">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-pattern"></div>
        <div class="floating-elements">
          <div class="floating-element element-1"></div>
          <div class="floating-element element-2"></div>
          <div class="floating-element element-3"></div>
        </div>
      </div>
      
      <div class="container">
        <div class="hero-content">
          <div class="hero-text fade-in">
            <div class="hero-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" class="badge-icon">
                <path d="M12 2L3.09 8.26L12 14L20.91 8.26L12 2M21 16.25L12 22.5L3 16.25V10.75L12 17L21 10.75V16.25Z"/>
              </svg>
              대한민국 1위 교육 플랫폼
            </div>
            
            <h1 class="hero-title" v-if="userType === 'teacher'">
              중학교를 위한<br>
              <span class="highlight">스마트 문제은행 시스템</span>
            </h1>
            <h1 class="hero-title" v-else>
              나만의 학습 파트너<br>
              <span class="highlight">스마트 CBT 시험 시스템</span>
            </h1>
            
            <p class="hero-subtitle" v-if="userType === 'teacher'">
              AI 기반 문제 분석과 맞춤형 시험지 생성으로<br>
              교육의 질을 한 단계 높여보세요
            </p>
            <p class="hero-subtitle" v-else>
              온라인 시험 응시와 실시간 성적 분석으로<br>
              효과적인 학습 관리를 시작하세요
            </p>
            
            <div class="hero-actions">
              <button class="cta-button primary" @click="showRoleSelection">
                <svg viewBox="0 0 24 24" fill="currentColor" class="cta-icon">
                  <path d="M8 5V3L4 7L8 11V9H16V7H8M16 19V21L20 17L16 13V15H8V17H16Z"/>
                </svg>
                시작하기
              </button>
              <button class="cta-button secondary" @click="scrollToFeatures">
                <svg viewBox="0 0 24 24" fill="currentColor" class="cta-icon">
                  <path d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"/>
                </svg>
                둘러보기
              </button>
            </div>
            
            <div class="hero-stats">
              <div class="stat-item">
                <div class="stat-number">15,247</div>
                <div class="stat-label">등록 문제</div>
              </div>
              <div class="stat-separator"></div>
              <div class="stat-item">
                <div class="stat-number">523</div>
                <div class="stat-label">참여 학교</div>
              </div>
              <div class="stat-separator"></div>
              <div class="stat-item">
                <div class="stat-number">48,592</div>
                <div class="stat-label">활성 사용자</div>
              </div>
            </div>
          </div>
          
          <div class="hero-visual slide-up">
            <div class="dashboard-preview">
              <div class="preview-header">
                <div class="preview-dots">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                </div>
                <div class="preview-title">PULLIT Dashboard</div>
              </div>
              <div class="preview-content">
                <div class="preview-sidebar">
                  <div class="sidebar-item active">문제은행</div>
                  <div class="sidebar-item">시험관리</div>
                  <div class="sidebar-item">성적분석</div>
                </div>
                <div class="preview-main">
                  <div class="chart-area">
                    <div class="chart-bars">
                      <div class="chart-bar" style="height: 60%"></div>
                      <div class="chart-bar" style="height: 80%"></div>
                      <div class="chart-bar" style="height: 45%"></div>
                      <div class="chart-bar" style="height: 70%"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Role Selection Modal -->
    <div class="role-modal" v-if="showModal" @click="hideRoleSelection">
      <div class="role-modal-content" @click.stop>
        <button class="close-modal" @click="hideRoleSelection">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
        <div class="role-selection">
          <h3 class="role-title">사용자 유형을 선택해주세요</h3>
          <div class="role-cards">
            <button 
              class="role-card teacher-card"
              :class="{ active: selectedRole === 'teacher' }"
              @click="selectRole('teacher')"
            >
              <div class="role-icon teacher-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L1 9L12 15L21 9.18V17H23V9L12 3M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
                </svg>
              </div>
              <div class="role-info">
                <h4 class="role-name">선생님</h4>
                <p class="role-desc">문제 출제 및 시험 관리</p>
                <div class="role-features">
                  <span>• 시험지 생성</span>
                  <span>• 문제은행 관리</span>
                  <span>• 성적 분석</span>
                  <span>• 학급 관리</span>
                </div>
              </div>
            </button>
            
            <button 
              class="role-card student-card"
              :class="{ active: selectedRole === 'student' }"
              @click="selectRole('student')"
            >
              <div class="role-icon student-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14Q10.35 14 9.175 12.825Q8 11.65 8 10Q8 8.35 9.175 7.175Q10.35 6 12 6Q13.65 6 14.825 7.175Q16 8.35 16 10Q16 11.65 14.825 12.825Q13.65 14 12 14ZM6 22V19.5Q6 18.275 6.688 17.388Q7.375 16.5 8.4 16.1Q10.55 15.25 12.75 15.25Q14.95 15.25 17.1 16.1Q18.125 16.5 18.813 17.388Q19.5 18.275 19.5 19.5V22Z"/>
                </svg>
              </div>
              <div class="role-info">
                <h4 class="role-name">학생</h4>
                <p class="role-desc">학습 및 시험 응시</p>
                <div class="role-features">
                  <span>• 맞춤형 학습</span>
                  <span>• 모의고사 응시</span>
                  <span>• 학습 진도 확인</span>
                  <span>• 성적 분석</span>
                </div>
              </div>
            </button>
          </div>
          <button 
            class="get-started-btn"
            :disabled="!selectedRole"
            @click="startWithRole"
          >
            {{ selectedRole === 'teacher' ? '교사용 시작하기' : selectedRole === 'student' ? '학생용 시작하기' : '역할을 선택해주세요' }}
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Highlighted Features Section -->
    <section class="features-section" id="features">
      <div class="container">
        <div class="section-header slide-up">
          <div class="section-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" class="badge-icon">
              <path d="M12 2L1 9L12 15L21 9.18V17H23V9L12 3M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
            </svg>
            FEATURES
          </div>
          <h2 class="section-title">
            교육 현장을 위한<br>
            <span class="text-primary">전문적인 솔루션</span>
          </h2>
          <p class="section-subtitle">
            선생님과 학생 모두를 위한 강력한 기능들로<br>
            교육의 효율성을 극대화하세요
          </p>
        </div>
        
        <!-- Main Feature Tabs -->
        <div class="feature-tabs slide-up">
          <div class="tab-buttons">
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'teacher' }"
              @click="setActiveTab('teacher')"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="tab-icon">
                <path d="M12 3L1 9L12 15L21 9.18V17H23V9L12 3M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
              </svg>
              선생님 기능
            </button>
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'student' }"
              @click="setActiveTab('student')"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="tab-icon">
                <path d="M12 14Q10.35 14 9.175 12.825Q8 11.65 8 10Q8 8.35 9.175 7.175Q10.35 6 12 6Q13.65 6 14.825 7.175Q16 8.35 16 10Q16 11.65 14.825 12.825Q13.65 14 12 14ZM6 22V19.5Q6 18.275 6.688 17.388Q7.375 16.5 8.4 16.1Q10.55 15.25 12.75 15.25Q14.95 15.25 17.1 16.1Q18.125 16.5 18.813 17.388Q19.5 18.275 19.5 19.5V22Z"/>
              </svg>
              학생 기능
            </button>
          </div>
          
          <!-- Teacher Features -->
          <div class="tab-content" v-if="activeTab === 'teacher'">
            <div class="feature-grid">
              <div class="feature-card primary" @click="navigateTo('/test-bank')">
                <div class="feature-header">
                  <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div class="feature-badge new">NEW</div>
                </div>
                <h3 class="feature-title">AI 문제은행 시스템</h3>
                <p class="feature-description">
                  15,000+ 검증된 문제를 AI가 스마트하게 분류하고 관리합니다. 
                  과목별, 단원별, 난이도별 체계적인 분류로 원하는 문제를 쉽게 찾을 수 있습니다.
                </p>
                <div class="feature-highlights">
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    AI 기반 문제 분류
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    23개 과목 지원
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    실시간 검색 & 필터링
                  </div>
                </div>
              </div>

              <div class="feature-card" @click="navigateTo('/exam-management')">
                <div class="feature-header">
                  <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19M7 10H12V15H7"/>
                    </svg>
                  </div>
                  <div class="feature-badge hot">HOT</div>
                </div>
                <h3 class="feature-title">스마트 시험지 생성</h3>
                <p class="feature-description">
                  원클릭으로 완벽한 시험지를 생성하세요. AI가 난이도를 자동 조절하고 
                  문제 유형을 균형있게 배치해 최적의 시험지를 만들어 드립니다.
                </p>
                <div class="feature-highlights">
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    자동 난이도 조절
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    다양한 출제 템플릿
                  </div>
                </div>
              </div>

              <div class="feature-card" @click="navigateTo('/analytics')">
                <div class="feature-header">
                  <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6"/>
                    </svg>
                  </div>
                </div>
                <h3 class="feature-title">심화 성적 분석</h3>
                <p class="feature-description">
                  학생별, 문항별, 단원별 세밀한 분석 데이터를 제공합니다. 
                  개별 맞춤 지도와 효과적인 교육 전략을 수립하세요.
                </p>
                <div class="feature-highlights">
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    실시간 성적 분석
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    개별 리포트 생성
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Student Features -->
          <div class="tab-content" v-if="activeTab === 'student'">
            <div class="feature-grid">
              <div class="feature-card primary" @click="navigateTo('/student/practice')">
                <div class="feature-header">
                  <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84L10.74 11.06C10.86 11.22 11 11.46 11 11.75C11 12.04 10.86 12.28 10.74 12.44L7.17 16.03L7.76 16.61C8.78 17.64 10.44 17.64 11.47 16.61L16.14 11.94C16.57 11.5 17.24 11.5 17.68 11.94L21 8.64V9M2.08 18.5L4.5 20.92L13.05 12.37C13.1 12.31 13.1 12.22 13.05 12.16C13 12.11 12.91 12.11 12.86 12.16L4.31 20.71"/>
                    </svg>
                  </div>
                  <div class="feature-badge ai">AI</div>
                </div>
                <h3 class="feature-title">맞춤형 AI 학습</h3>
                <p class="feature-description">
                  개인의 학습 수준과 취약점을 AI가 분석하여 최적화된 문제를 추천합니다. 
                  효율적이고 체계적인 학습이 가능합니다.
                </p>
                <div class="feature-highlights">
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    AI 기반 문제 추천
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    약점 분석 & 보강
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    학습 패턴 분석
                  </div>
                </div>
              </div>

              <div class="feature-card" @click="navigateTo('/student/mock-exam')">
                <div class="feature-header">
                  <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L3 7L12 12L21 7L12 2M3 17L12 22L21 17M3 12L12 17L21 12"/>
                    </svg>
                  </div>
                  <div class="feature-badge popular">인기</div>
                </div>
                <h3 class="feature-title">실전 모의고사</h3>
                <p class="feature-description">
                  실제 시험과 동일한 환경에서 모의고사를 응시하고 실력을 정확히 진단하세요. 
                  시간 관리 능력과 실전 감각을 기를 수 있습니다.
                </p>
                <div class="feature-highlights">
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    실시간 채점 시스템
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    상세한 해설 제공
                  </div>
                </div>
              </div>

              <div class="feature-card" @click="navigateTo('/student/progress')">
                <div class="feature-header">
                  <div class="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.5 4A5.5 5.5 0 0 0 2 9.5C2 12 4 14 4 14S2 16 2 18.5A5.5 5.5 0 0 0 7.5 24A5.5 5.5 0 0 0 13 18.5C13 16 11 14 11 14S13 12 13 9.5A5.5 5.5 0 0 0 7.5 4M7.5 6A3.5 3.5 0 0 1 11 9.5C11 10.64 10.1 11.5 10.1 11.5S11 12.36 11 13.5S10.1 14.36 10.1 14.36S11 15.22 11 16.36S10.1 17.22 10.1 17.22S11 18.08 11 19.22A3.5 3.5 0 0 1 7.5 22.72A3.5 3.5 0 0 1 4 19.22C4 18.08 4.9 17.22 4.9 17.22S4 16.36 4 15.22S4.9 14.36 4.9 14.36S4 13.5 4 12.36S4.9 11.5 4.9 11.5S4 10.64 4 9.5A3.5 3.5 0 0 1 7.5 6Z"/>
                    </svg>
                  </div>
                </div>
                <h3 class="feature-title">학습 진도 관리</h3>
                <p class="feature-description">
                  체계적인 학습 계획 수립과 진도 관리로 목표를 달성하세요. 
                  개인별 맞춤 스케줄과 성취도 추적이 가능합니다.
                </p>
                <div class="feature-highlights">
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    진도율 시각화
                  </div>
                  <div class="highlight-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
                    </svg>
                    목표 설정 & 관리
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Stats Section -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-wrapper">
          <div class="stats-content">
            <h2 class="stats-title">실시간 플랫폼 현황</h2>
            <p class="stats-subtitle">전국 교육기관과 함께하는 PULLIT의 성장</p>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ animatedStats.questions.toLocaleString() }}</div>
                <div class="stat-label">총 문제 수</div>
                <div class="stat-change positive">+342 이번 달</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V8H19V19M7 10H12V15H7"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ animatedStats.exams.toLocaleString() }}</div>
                <div class="stat-label">생성된 시험지</div>
                <div class="stat-change positive">+89 이번 주</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14Q10.35 14 9.175 12.825Q8 11.65 8 10Q8 8.35 9.175 7.175Q10.35 6 12 6Q13.65 6 14.825 7.175Q16 8.35 16 10Q16 11.65 14.825 12.825Q13.65 14 12 14ZM6 22V19.5Q6 18.275 6.688 17.388Q7.375 16.5 8.4 16.1Q10.55 15.25 12.75 15.25Q14.95 15.25 17.1 16.1Q18.125 16.5 18.813 17.388Q19.5 18.275 19.5 19.5V22Z"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ animatedStats.users.toLocaleString() }}</div>
                <div class="stat-label">활성 사용자</div>
                <div class="stat-change positive">+1,247 이번 달</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7L12 12L21 7L12 2M3 17L12 22L21 17M3 12L12 17L21 12"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ animatedStats.schools.toLocaleString() }}</div>
                <div class="stat-label">참여 학교</div>
                <div class="stat-change positive">+12 이번 달</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <div class="cta-text">
            <h2 class="cta-title">
              지금 시작하여 교육의<br>
              <span class="text-primary">새로운 가능성</span>을 경험하세요
            </h2>
            <p class="cta-subtitle">
              무료 체험으로 PULLIT의 모든 기능을 사용해보세요.<br>
              더 스마트하고 효율적인 교육환경을 만들어 드립니다.
            </p>
          </div>
          <div class="cta-actions">
            <button class="cta-button primary large" @click="showRoleSelection">
              무료로 시작하기
              <svg viewBox="0 0 24 24" fill="currentColor" class="cta-icon">
                <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
              </svg>
            </button>
            <button class="cta-button secondary large" @click="contactSales">
              도입 문의하기
              <svg viewBox="0 0 24 24" fill="currentColor" class="cta-icon">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
/**
 * PULLIT 교육 플랫폼 메인 페이지
 * 전문적인 교육 솔루션을 위한 풀스크린 레이아웃
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/store/layoutStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const layoutStore = useLayoutStore()
const { userName, schoolName, currentSchoolYear, currentSemester } = storeToRefs(layoutStore)

// 상태 관리
const selectedRole = ref(null)
const showModal = ref(false)
const userType = ref(localStorage.getItem('userType') || 'teacher') // 현재 사용자 타입
const activeTab = ref(userType.value) // 현재 사용자 타입에 따라 초기 탭 설정

// 애니메이션 통계 데이터
const animatedStats = ref({
  questions: 0,
  exams: 0,
  users: 0,
  schools: 0
})

const targetStats = {
  questions: 15247,
  exams: 2156,
  users: 48592,
  schools: 523
}

// 역할 선택 관련
const selectRole = (role) => {
  selectedRole.value = role
}

const showRoleSelection = () => {
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const hideRoleSelection = () => {
  showModal.value = false
  selectedRole.value = null
  document.body.style.overflow = 'auto'
}

const startWithRole = () => {
  if (!selectedRole.value) return
  
  // 역할에 따른 라우팅
  if (selectedRole.value === 'teacher') {
    router.push('/teacher/dashboard')
  } else if (selectedRole.value === 'student') {
    router.push('/student/dashboard')
  }
  
  hideRoleSelection()
  console.log(`${selectedRole.value} 역할로 시작`)
}

// 탭 관리
const setActiveTab = (tab) => {
  activeTab.value = tab
}

// 네비게이션
const navigateTo = (path) => {
  router.push(path)
}

const scrollToFeatures = () => {
  const featuresSection = document.getElementById('features')
  if (featuresSection) {
    featuresSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

const contactSales = () => {
  // 영업팀 문의 로직
  window.open('mailto:sales@pullit.co.kr?subject=PULLIT 도입 문의', '_blank')
}

// 통계 애니메이션
const animateStats = () => {
  const duration = 2000 // 2초
  const steps = 60
  const stepTime = duration / steps
  
  let currentStep = 0
  const interval = setInterval(() => {
    currentStep++
    const progress = currentStep / steps
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    
    animatedStats.value.questions = Math.floor(targetStats.questions * easeOutQuart)
    animatedStats.value.exams = Math.floor(targetStats.exams * easeOutQuart)
    animatedStats.value.users = Math.floor(targetStats.users * easeOutQuart)
    animatedStats.value.schools = Math.floor(targetStats.schools * easeOutQuart)
    
    if (currentStep >= steps) {
      clearInterval(interval)
      animatedStats.value = { ...targetStats }
    }
  }, stepTime)
}

// Intersection Observer for animations
const setupObserver = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate')
        
        // 통계 섹션이 보이면 애니메이션 시작
        if (entry.target.classList.contains('stats-section')) {
          animateStats()
        }
      }
    })
  }, observerOptions)
  
  // 애니메이션할 요소들 관찰
  document.querySelectorAll('.slide-up, .fade-in, .stats-section').forEach((el) => {
    observer.observe(el)
  })
}

// 키보드 이벤트 핸들러
const handleKeydown = (event) => {
  if (event.key === 'Escape' && showModal.value) {
    hideRoleSelection()
  }
}

// 라이프사이클
onMounted(() => {
  // 헤더 제목 설정 (메인 페이지는 제목 없음)
  layoutStore.setHeaderTitle('')
  
  // 애니메이션 관찰자 설정
  setTimeout(() => {
    setupObserver()
  }, 100)
  
  // 키보드 이벤트 리스너 추가
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 정리
  document.body.style.overflow = 'auto'
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Professional Full-Width Education Platform Design */
.education-platform {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}

/* === HERO SECTION === */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #0053ed 0%, #003db8 100%);
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  color: white;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.03"><circle cx="30" cy="30" r="2"/></g></svg>') repeat;
}

.floating-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  animation: float 6s ease-in-out infinite;
}

.element-1 {
  width: 120px;
  height: 120px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.element-2 {
  width: 80px;
  height: 80px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.element-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  min-height: 70vh;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 32px;
}

.badge-icon {
  width: 16px;
  height: 16px;
  color: #60a5fa;
}

.hero-title {
  font-size: clamp(32px, 5vw, 64px);
  font-weight: 900;
  line-height: 1.1;
  margin: 0 0 24px 0;
  letter-spacing: -1px;
}

.highlight {
  color: #60a5fa;
  display: block;
  margin-top: 12px;
}

.hero-subtitle {
  font-size: 20px;
  line-height: 1.6;
  margin: 0 0 40px 0;
  opacity: 0.9;
  font-weight: 400;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 60px;
}

.cta-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.cta-button.primary {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cta-button.primary:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

.cta-button.secondary {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.cta-button.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.cta-icon {
  width: 20px;
  height: 20px;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 24px;
}

.hero-stats .stat-item {
  text-align: center;
}

.hero-stats .stat-number {
  display: block;
  font-size: 32px;
  font-weight: 800;
  color: #60a5fa;
  line-height: 1.2;
}

.hero-stats .stat-label {
  display: block;
  font-size: 14px;
  opacity: 0.8;
  margin-top: 4px;
}

.stat-separator {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

/* Hero Visual */
.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-preview {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.preview-header {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27ca3f; }

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.preview-content {
  display: flex;
  height: 300px;
}

.preview-sidebar {
  width: 120px;
  background: rgba(255, 255, 255, 0.05);
  padding: 20px 0;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-item {
  padding: 12px 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  cursor: pointer;
}

.sidebar-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-right: 2px solid #60a5fa;
}

.preview-main {
  flex: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-area {
  width: 100%;
  height: 120px;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 8px;
  height: 100%;
}

.chart-bar {
  background: linear-gradient(180deg, #60a5fa 0%, rgba(96, 165, 250, 0.5) 100%);
  border-radius: 4px 4px 0 0;
  flex: 1;
  min-height: 20px;
  animation: growUp 1s ease-out 0.5s both;
}

@keyframes growUp {
  from { height: 0; }
  to { height: var(--height, 60%); }
}

/* Role Selection Modal */
.role-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.role-modal-content {
  background: white;
  border-radius: 24px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.close-modal {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: #f8fafc;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-modal:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.close-modal svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.role-selection {
  padding: 60px 40px 40px;
}

.role-title {
  text-align: center;
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 40px 0;
}

.role-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.role-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.role-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #0053ed, #60a5fa);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.role-card:hover::before,
.role-card.active::before {
  transform: scaleX(1);
}

.role-card:hover {
  border-color: #0053ed;
  box-shadow: 0 12px 40px rgba(0, 83, 237, 0.1);
  transform: translateY(-4px);
}

.role-card.active {
  border-color: #0053ed;
  background: #eff6ff;
  box-shadow: 0 12px 40px rgba(0, 83, 237, 0.15);
}

.role-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.teacher-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.student-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.role-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.role-name {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.role-desc {
  font-size: 16px;
  color: #64748b;
  margin: 0 0 20px 0;
}

.role-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.role-features span {
  font-size: 14px;
  color: #475569;
  text-align: left;
}

.get-started-btn {
  width: 100%;
  background: linear-gradient(135deg, #0053ed, #003db8);
  border: none;
  border-radius: 16px;
  padding: 18px 32px;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.get-started-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #003db8, #002a8f);
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 83, 237, 0.4);
}

.get-started-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

/* === FEATURES SECTION === */
.features-section {
  width: 100%;
  padding: 80px 0;
  background: #f8fafc;
  margin: 0;
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 50px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #0053ed;
  letter-spacing: 1px;
  margin-bottom: 24px;
}

.section-title {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 900;
  color: #1e293b;
  margin: 0 0 24px 0;
  line-height: 1.2;
  letter-spacing: -1px;
}

.section-subtitle {
  font-size: 20px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* Feature Tabs */
.feature-tabs {
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tab-buttons {
  display: flex;
  background: #f1f5f9;
  padding: 8px;
  margin: 24px;
  border-radius: 16px;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 24px;
  background: transparent;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: #1e293b;
  background: rgba(0, 83, 237, 0.05);
}

.tab-button.active {
  background: #0053ed;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 83, 237, 0.3);
}

.tab-icon {
  width: 20px;
  height: 20px;
}

.tab-content {
  padding: 40px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 32px;
}

.feature-card {
  background: #ffffff;
  border: 2px solid #f1f5f9;
  border-radius: 24px;
  padding: 40px;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #0053ed, #60a5fa);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.feature-card:hover::before,
.feature-card.primary::before {
  transform: scaleX(1);
}

.feature-card:hover {
  border-color: #0053ed;
  box-shadow: 0 20px 60px rgba(0, 83, 237, 0.1);
  transform: translateY(-8px);
}

.feature-card.primary {
  border-color: #0053ed;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
  box-shadow: 0 12px 40px rgba(0, 83, 237, 0.08);
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.feature-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #0053ed, #003db8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 83, 237, 0.2);
}

.feature-icon svg {
  width: 36px;
  height: 36px;
  color: white;
}

.feature-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.feature-badge.new {
  background: #dcfce7;
  color: #16a34a;
}

.feature-badge.hot {
  background: #fef3c7;
  color: #d97706;
}

.feature-badge.ai {
  background: #ede9fe;
  color: #7c3aed;
}

.feature-badge.popular {
  background: #fecaca;
  color: #dc2626;
}

.feature-title {
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.feature-description {
  font-size: 16px;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 24px 0;
  flex: 1;
}

.feature-highlights {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.highlight-item svg {
  width: 16px;
  height: 16px;
  color: #10b981;
  flex-shrink: 0;
}

/* === STATS SECTION === */
.stats-section {
  width: 100%;
  padding: 80px 0;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  position: relative;
  overflow: hidden;
  margin: 0;
}

.stats-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.02"><rect width="2" height="2"/></g></svg>') repeat;
}

.stats-wrapper {
  position: relative;
  z-index: 1;
}

.stats-content {
  text-align: center;
  margin-bottom: 60px;
}

.stats-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 12px 0;
  color: white;
}

.stats-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  transition: all 0.4s ease;
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(96, 165, 250, 0.3);
}

.stat-icon svg {
  width: 36px;
  height: 36px;
  color: white;
}

.stat-info {
  flex: 1;
  text-align: left;
}

.stat-number {
  font-size: 48px;
  font-weight: 900;
  color: white;
  line-height: 1;
  margin-bottom: 8px;
  display: block;
}

.stat-label {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 600;
}

.stat-change {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: #10b981;
}

/* === CTA SECTION === */
.cta-section {
  width: 100%;
  padding: 80px 0;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  position: relative;
  margin: 0;
}

.cta-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.cta-title {
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 900;
  color: #1e293b;
  margin: 0 0 24px 0;
  line-height: 1.2;
  letter-spacing: -1px;
}

.cta-subtitle {
  font-size: 20px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 48px 0;
}

.cta-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button.large {
  padding: 20px 40px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.cta-button.primary.large {
  background: linear-gradient(135deg, #0053ed, #003db8);
  color: white;
  border: none;
  box-shadow: 0 8px 24px rgba(0, 83, 237, 0.3);
}

.cta-button.primary.large:hover {
  background: linear-gradient(135deg, #003db8, #002a8f);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 83, 237, 0.4);
}

.cta-button.secondary.large {
  background: white;
  color: #0053ed;
  border: 2px solid #0053ed;
}

.cta-button.secondary.large:hover {
  background: #0053ed;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 83, 237, 0.2);
}

/* === ANIMATIONS === */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Intersection Observer Animations */
.fade-in {
  opacity: 0;
  transition: all 0.8s ease-out;
}

.fade-in.animate {
  opacity: 1;
}

.slide-up {
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s ease-out;
}

.slide-up.animate {
  opacity: 1;
  transform: translateY(0);
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 1400px) {
  .hero-content {
    gap: 60px;
  }
}

@media (max-width: 1200px) {
  .hero-content {
    gap: 50px;
  }
  
  .hero-title {
    font-size: clamp(28px, 4vw, 48px);
  }
  
  .feature-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 90vh;
    padding: 40px 0;
  }
  
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
    min-height: auto;
    padding: 0 3%;
  }
  
  .hero-badge {
    justify-content: center;
  }
  
  .hero-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .hero-stats {
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }
  
  .hero-stats .stat-number {
    font-size: 28px;
  }
  
  .hero-visual {
    order: -1;
  }
  
  .dashboard-preview {
    max-width: 400px;
  }
  
  .features-section {
    padding: 60px 0;
  }
  
  .section-header {
    margin-bottom: 50px;
    padding: 0 3%;
  }
  
  .feature-tabs {
    margin: 0;
  }
  
  .tab-buttons {
    margin: 16px;
  }
  
  .tab-content {
    padding: 24px 16px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .feature-card {
    padding: 32px 24px;
  }
  
  .role-modal {
    padding: 16px;
  }
  
  .role-cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .role-selection {
    padding: 40px 24px 24px;
  }
  
  .stats-section {
    padding: 60px 0;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .stats-content {
    padding: 0 3%;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 32px 24px;
  }
  
  .stat-info {
    text-align: center;
  }
  
  .cta-section {
    padding: 60px 0;
  }
  
  .cta-content {
    padding: 0 3%;
  }
  
  .cta-actions {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .cta-button.large {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .hero-section {
    min-height: 80vh;
    padding: 40px 0;
  }
  
  .hero-content {
    padding: 0 4%;
  }
  
  .hero-badge {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .cta-button {
    padding: 14px 24px;
    font-size: 15px;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-separator {
    width: 60px;
    height: 1px;
  }
  
  .dashboard-preview {
    max-width: 100%;
  }
  
  .preview-content {
    height: 250px;
  }
  
  .preview-sidebar {
    width: 100px;
  }
  
  .sidebar-item {
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .feature-tabs {
    border-radius: 16px;
  }
  
  .tab-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .tab-button {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .feature-card {
    padding: 24px 20px;
  }
  
  .feature-icon {
    width: 60px;
    height: 60px;
  }
  
  .feature-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .feature-title {
    font-size: 20px;
  }
  
  .role-card {
    padding: 24px;
  }
  
  .role-icon {
    width: 56px;
    height: 56px;
  }
  
  .role-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
  }
  
  .stat-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .stat-number {
    font-size: 36px;
  }
  
  .stat-label {
    font-size: 16px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .feature-card {
    border: 2px solid #1e293b;
  }
  
  .stat-card {
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .floating-element,
  .chart-bar {
    animation: none !important;
  }
  
  .fade-in,
  .slide-up,
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* Focus styles for accessibility */
.cta-button:focus,
.role-card:focus,
.feature-card:focus,
.tab-button:focus {
  outline: 3px solid #60a5fa;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .education-platform {
    background: white !important;
  }
  
  .hero-section {
    background: white !important;
    color: black !important;
  }
  
  .stats-section {
    background: white !important;
    color: black !important;
  }
  
  .floating-elements,
  .hero-visual {
    display: none !important;
  }
}
</style>
