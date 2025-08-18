<!-- src/components/student/StudentMain.vue -->
<template>
  <div class="hero-wrap py-5">
    <!-- 기능 카드 3개 -->
    <div class="container mt-4">
      <div class="row g-4">
        <!-- 1) AI 문제은행 시스템 -->
        <div class="col-12 col-md-6 col-lg-4">
          <router-link to="/student/cbtstep01" class="text-decoration-none">
            <div class="card feature-card active h-100 rounded-4 border-0 shadow-sm">
              <div class="card-body p-4">
                <!-- 아이콘 + NEW 뱃지 -->
                <div class="d-flex align-items-start justify-content-between">
                  <div class="icon-blob">
                    <!-- 간단한 문서 아이콘 SVG -->
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2
                      2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                  </div>
                  <span class="badge rounded-pill bg-success-subtle text-success fw-semibold">NEW</span>
                </div>

                <h4 class="mt-3 mb-2 text-dark fw-bold">AI 문제은행 시스템</h4>
                <p class="text-secondary mb-3">
                  15,000+ 검증된 문제를 AI가 스마트하게 분류하고 관리합니다. 과목별, 단원별, 난이도별 체계적인 분류로 원하는 문제를 쉽게 찾을 수 있습니다.
                </p>

                <ul class="list-unstyled m-0 text-secondary small">
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> AI 기반 문제 분류
                  </li>
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 23개 과목 지원
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <span class="check text-success">✓</span> 실시간 검색 & 필터링
                  </li>
                </ul>
              </div>
            </div>
          </router-link>
        </div>

        <!-- 2) 스마트 시험지 생성 -->
        <div class="col-12 col-md-6 col-lg-4">
          <router-link to="" class="text-decoration-none">
            <div class="card feature-card h-100 rounded-4 border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex align-items-start justify-content-between">
                  <div class="icon-blob">
                    <!-- 캘린더 느낌 아이콘 -->
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2v2M17 2v2M3 7h18M5 22h14a2 2 0 0 0 2-2V7H3v13a2 2 0 0 0 2 2Z"/>
                    </svg>
                  </div>
                  <span class="badge rounded-pill bg-warning-subtle text-warning fw-semibold">HOT</span>
                </div>

                <h4 class="mt-3 mb-2 text-dark fw-bold">스마트 시험지 생성</h4>
                <p class="text-secondary mb-3">
                  원클릭으로 완벽한 시험지를 생성하세요. AI가 난이도를 자동 조절하고 문항 유형을 균형 있게 배치해 최적의 시험지를 만들어 드립니다.
                </p>

                <ul class="list-unstyled m-0 text-secondary small">
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 자동 난이도 조정
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <span class="check text-success">✓</span> 다양한 출제 템플릿
                  </li>
                </ul>
              </div>
            </div>
          </router-link>
        </div>

        <!-- 3) 심화 성적 분석 -->
        <div class="col-12 col-md-6 col-lg-4">
          <router-link to="/student/report" class="text-decoration-none">
            <div class="card feature-card h-100 rounded-4 border-0 shadow-sm">
              <div class="card-body p-4">
                <div class="d-flex align-items-start justify-content-between">
                  <div class="icon-blob">
                    <!-- 차트 아이콘 -->
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3v18h18M7 15v3M11 12v6M15 9v9M19 6v12"/>
                    </svg>
                  </div>
                </div>

                <h4 class="mt-3 mb-2 text-dark fw-bold">심화 성적 분석</h4>
                <p class="text-secondary mb-3">
                  학생별, 문항별, 단원별 세밀한 분석 데이터를 제공합니다. 개별 맞춤 지도와 효과적인 교육 전략을 수립하세요.
                </p>

                <ul class="list-unstyled m-0 text-secondary small">
                  <li class="d-flex align-items-start gap-2 mb-2">
                    <span class="check text-success">✓</span> 실시간 성적 분석
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <span class="check text-success">✓</span> 개별 리포트 생성
                  </li>
                </ul>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'StudentMain' }
</script>

<style scoped>
/* 배경 영역 (연한 회색 + 패턴 느낌) */
.hero-wrap {
  background: linear-gradient(180deg, #f6f8fc 0%, #f8fafc 100%);
  min-height: 60vh;
}

/* 상단 탭 감싸는 영역 여백/둥근모서리 */
.nav-surface {
  border-radius: 18px;
}

/* 카드 공통 */
.feature-card {
  transition: box-shadow .2s ease, transform .15s ease, border-color .2s ease;
  background-color: #fff;
}

.feature-card.active {
  box-shadow: 0 10px 24px rgba(33, 114, 255, 0.08) !important;
}

/* hover 효과 */
.feature-card:hover {
  transform: translateY(-2px);
  outline: 2px solid rgba(33, 114, 255, 0.35);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
}

/* 아이콘 파란 원형 배경 */
.icon-blob {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #0d6efd;           /* Bootstrap primary */
  color: #fff;
  box-shadow: 0 6px 18px rgba(13, 110, 253, 0.2);
}

/* 체크 마크 정렬용 */
.check {
  line-height: 1.2;
  font-weight: 700;
}
</style>
