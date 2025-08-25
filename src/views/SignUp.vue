<template>
  <div class="signup-page">
    <Header />
    <div class="signup-container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-lg border-0">
            <div class="card-header bg-primary text-white text-center py-4">
              <h3 class="mb-0 fw-bold">
                회원가입
              </h3>
            </div>
            
            <div class="card-body p-4 p-md-5">
              <!-- 단계 표시 -->
              <div class="step-indicator mb-4">
                <div class="row">
                  <div class="col-4">
                    <div class="step" :class="{ active: signupStep === 1, completed: signupStep > 1 }">
                      <div class="step-number">1</div>
                      <div class="step-text">약관동의<br/>유형선택</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="step" :class="{ 
                      active: signupStep === 2, 
                      completed: signupStep > 2,
                      'oauth2-skipped': signupForm.isOAuth2User && signupStep > 1
                    }">
                      <div class="step-number">2</div>
                      <div class="step-text">
                        휴대폰 인증
                        <small v-if="signupForm.isOAuth2User && signupStep > 1" class="d-block text-success">
                          <i class="bi bi-check-circle"></i> 건너뜀
                        </small>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="step" :class="{ active: signupStep === 3 }">
                      <div class="step-number">3</div>
                      <div class="step-text">정보 입력</div>
                    </div>
                  </div>
                </div>
              </div>

            <!-- Step 1: 약관동의 및 가입유형 선택 -->
            <div v-if="signupStep === 1">
              <!-- OAuth2 사용자 안내 -->
              <div v-if="signupForm.isOAuth2User" class="alert alert-info mb-4">
                <div class="d-flex align-items-center">
                  <i class="bi bi-info-circle me-2"></i>
                  <div>
                    <strong>{{ signupForm.socialProvider.toUpperCase() }} 소셜 로그인</strong>으로 간편 회원가입을 진행합니다.
                  </div>
                </div>
              </div>
              
              <h5 class="section-title mb-4">
                이용약관 동의
              </h5>
              
              <!-- 전체 동의 -->
              <div class="form-check mb-3">
                <input
                  class="form-check-input me-3"
                  type="checkbox"
                  id="agreeAll"
                  @change="toggleAllAgreements"
                  v-model="agreements.all"
                >
                <label class="form-check-label fw-bold" for="agreeAll">
                  전체 동의
                </label>
              </div>
              
              <hr class="my-4">
              
              <!-- 개별 약관 -->
              <div class="form-check mb-3">
                <input
                  class="form-check-input me-3"
                  type="checkbox"
                  id="agreeTerms"
                  v-model="agreements.terms"
                  @change="checkIndividualAgreements"
                >
                <label class="form-check-label" for="agreeTerms">
                  [필수] 이용약관 동의
                  <button type="button" @click="showTermsModal" class="btn btn-link text-decoration-none ms-2 p-0">보기</button>
                </label>
              </div>
              
              <div class="form-check mb-3">
                <input
                  class="form-check-input me-3"
                  type="checkbox"
                  id="agreePrivacy"
                  v-model="agreements.privacy"
                  @change="checkIndividualAgreements"
                >
                <label class="form-check-label" for="agreePrivacy">
                  [필수] 개인정보 수집 및 이용 동의
                  <button type="button" @click="showPrivacyModal" class="btn btn-link text-decoration-none ms-2 p-0">보기</button>
                </label>
              </div>
              
              <div class="form-check mb-4">
                <input
                  class="form-check-input me-3"
                  type="checkbox"
                  id="agreeMarketing"
                  v-model="agreements.marketing"
                  @change="checkIndividualAgreements"
                >
                <label class="form-check-label" for="agreeMarketing">
                  [선택] 마케팅 정보 수신 동의
                </label>
              </div>

              <!-- 사용자 유형 선택 -->
              <h5 class="section-title mb-4">
                가입 유형 선택
              </h5>
              
              <div class="row g-3 mb-4">
                <div class="col-6">
                  <div
                    class="user-type-card"
                    :class="{ active: signupForm.userType === 'teacher' }"
                    @click="signupForm.userType = 'teacher'"
                  >
                                      <div class="user-type-icon">
                    <img src="@/assets/icons/teacher-icon.png" alt="선생님" class="user-icon">
                  </div>
                    <h6 class="user-type-title">선생님</h6>
                  </div>
                </div>
                <div class="col-6">
                  <div
                    class="user-type-card"
                    :class="{ active: signupForm.userType === 'student' }"
                    @click="signupForm.userType = 'student'"
                  >
                                      <div class="user-type-icon">
                    <img src="@/assets/icons/student-icon.png" alt="학생" class="user-icon">
                  </div>
                    <h6 class="user-type-title">학생</h6>
                  </div>
                </div>
              </div>

              <!-- 다음 단계 버튼 -->
              <div class="d-grid">
                <button
                  @click="nextStep"
                  class="btn btn-primary btn-lg fw-bold"
                  :disabled="!canProceedToStep2"
                >
                  {{ signupForm.isOAuth2User ? '간편 회원가입하기' : '다음 단계' }}
                </button>
              </div>
            </div>

            <!-- Step 2: 휴대폰 인증 -->
            <div v-if="signupStep === 2">
              <h5 class="section-title mb-4">
                휴대폰 인증
              </h5>
              
              <!-- 휴대폰 번호 입력 -->
              <div class="mb-3">
                <label for="phone" class="form-label fw-bold">휴대폰 번호</label>
                <div class="input-group">
                  <input
                    type="tel"
                    class="form-control"
                    id="phone"
                    v-model="signupForm.phone"
                    @input="formatPhone"
                    placeholder="010-0000-0000"
                    maxlength="13"
                    :disabled="phoneVerified"
                  >
                  <button
                    class="btn btn-outline-primary"
                    type="button"
                    @click="sendVerificationCode"
                    :disabled="!isValidPhone || phoneVerified"
                  >
                    {{ phoneVerified ? '인증완료' : (verificationSent ? '재전송' : '인증번호 전송') }}
                  </button>
                </div>
              </div>

              <!-- 인증번호 입력 -->
              <div v-if="verificationSent" class="mb-3">
                <label for="verificationCode" class="form-label fw-bold">인증번호</label>
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    id="verificationCode"
                    v-model="verificationCode"
                    placeholder="인증번호 6자리"
                    maxlength="6"
                    :disabled="phoneVerified"
                  >
                  <button
                    class="btn"
                    :class="phoneVerified ? 'btn-success' : 'btn-outline-success'"
                    type="button"
                    @click="verifyPhone"
                    :disabled="phoneVerified"
                  >
                    {{ phoneVerified ? '인증완료' : '확인' }}
                  </button>
                </div>
                <div class="mt-2">
                                    <small v-if="!phoneVerified" class="text-muted">
                    {{ verificationTimer }}초 남음
                  </small>
                  <small v-if="phoneVerified" class="text-success">
                    휴대폰 인증이 완료되었습니다.
                  </small>
                </div>
              </div>

              <!-- 단계 이동 버튼 -->
              <div class="d-flex gap-3">
                <button @click="prevStep" class="btn btn-secondary flex-fill">
                  이전
                </button>
                                  <button
                    @click="nextStep"
                    class="btn btn-primary flex-fill"
                    :disabled="!phoneVerified"
                  >
                    다음 단계
                  </button>
              </div>
            </div>

            <!-- Step 3: 정보 입력 -->
            <div v-if="signupStep === 3">
              <!-- OAuth2 사용자 안내 -->
              <div v-if="signupForm.isOAuth2User" class="alert alert-success mb-4">
                <div class="d-flex align-items-center">
                  <i class="bi bi-check-circle me-2"></i>
                  <div>
                    <strong>{{ signupForm.socialProvider.toUpperCase() }} 로그인</strong>으로 간편 회원가입을 진행합니다.
                    <br>
                    <small class="text-muted">
                      이메일과 이름이 자동으로 입력되었습니다.
                    </small>
                  </div>
                </div>
              </div>
              
              <h5 class="section-title mb-4">
                회원 정보 입력
              </h5>
              
              <form @submit.prevent="handleSignup">
                <!-- 아이디 입력 -->
                <div class="mb-3">
                  <label for="username" class="form-label fw-bold">아이디</label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      id="username"
                      v-model="signupForm.username"
                      @input="checkUsernameAvailability"
                      placeholder="영문, 숫자 조합 4-20자"
                      required
                      minlength="4"
                      maxlength="20"
                    >
                    <button
                      type="button"
                      class="btn"
                      :class="usernameAvailable ? 'btn-success' : 'btn-outline-primary'"
                      @click="checkUsernameAvailability"
                      :disabled="usernameAvailable"
                    >
                      {{ usernameAvailable ? '확인완료' : '중복확인' }}
                    </button>
                  </div>
                  <div v-if="usernameCheckMessage" class="form-text" :class="usernameAvailable ? 'text-success' : 'text-danger'">
                    {{ usernameCheckMessage }}
                  </div>
                </div>

                                <!-- 비밀번호 입력 -->
                <div class="mb-3" v-if="!signupForm.isOAuth2User">
                  <label for="password" class="form-label fw-bold">비밀번호</label>
                  <div class="input-group">
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control"
                      id="password"
                      v-model="signupForm.password"
                      @input="checkPasswordStrength"
                      placeholder="영문(대+소), 숫자, 특수문자 조합 9-20자"
                      required
                      minlength="9"
                      maxlength="20"
                    >
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="togglePasswordVisibility"
                      title="비밀번호 보기/숨기기"
                    >
                      {{ showPassword ? '숨기기' : '보기' }}
                    </button>
                  </div>
                  <div v-if="passwordStrength" class="mt-2">
                    <div class="d-flex align-items-center">
                      <span class="me-2">보안도:</span>
                      <div class="progress flex-grow-1 me-2" style="height: 8px;">
                        <div 
                          class="progress-bar" 
                          :class="passwordStrengthClass"
                          :style="{ width: passwordStrengthWidth }"
                        ></div>
                      </div>
                      <small class="text-muted">{{ passwordStrengthText }}</small>
                    </div>
                  </div>
                </div>

                <!-- 소셜 로그인 사용자 휴대폰번호 입력 -->
                <div class="mb-3" v-if="signupForm.isOAuth2User">
                  <label for="phoneNumber" class="form-label fw-bold">휴대폰번호</label>
                  <input
                    type="tel"
                    class="form-control"
                    id="phoneNumber"
                    v-model="signupForm.phoneNumber"
                    placeholder="010-0000-0000"
                    required
                  >
                  <!-- <div class="form-text text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    휴대폰번호는 필수입니다. 010-0000-0000, 01000000000 등 어떤 형식으로 입력해도 됩니다.
                  </div> -->
                </div>
                


                <!-- 비밀번호 확인 -->
                <div class="mb-3" v-if="!signupForm.isOAuth2User">
                  <label for="passwordConfirm" class="form-label fw-bold">비밀번호 확인</label>
                  <div class="input-group">
                    <input
                      :type="showPasswordConfirm ? 'text' : 'password'"
                      class="form-control"
                      id="passwordConfirm"
                      v-model="signupForm.passwordConfirm"
                      placeholder="비밀번호를 다시 입력하세요"
                      required
                    >
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="togglePasswordConfirmVisibility"
                      title="비밀번호 보기/숨기기"
                    >
                      {{ showPasswordConfirm ? '숨기기' : '보기' }}
                    </button>
                  </div>
                  <div v-if="signupForm.passwordConfirm" class="form-text" :class="passwordsMatch ? 'text-success' : 'text-danger'">
                    {{ passwordsMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다' }}
                  </div>
                </div>

                <!-- 이메일 입력 -->
                <div class="mb-3">
                  <label for="email" class="form-label fw-bold">이메일</label>
                  <input
                    type="email"
                    class="form-control"
                    :class="{'is-invalid': !emailValid && emailErrorMessage, 'is-valid': emailValid}"
                    id="email"
                    v-model="signupForm.email"
                    @blur="checkEmailFormat"
                    @input="checkEmailFormat"
                    placeholder="example@email.com"
                    required
                  >
                  <div v-if="emailErrorMessage" class="invalid-feedback">{{ emailErrorMessage }}</div>
                  <div v-else-if="emailValid" class="valid-feedback">올바른 이메일 형식입니다.</div>
                </div>

                <!-- 생년월일 입력 -->
                <div class="mb-3">
                  <label for="birthDate" class="form-label fw-bold">생년월일</label>
                  <div class="row g-2">
                    <div class="col-4">
                      <select 
                        class="form-select" 
                        v-model="birthYear" 
                        @change="updateBirthDate"
                        required
                      >
                        <option value="">연도</option>
                        <option v-for="year in birthYears" :key="year" :value="year">{{ year }}년</option>
                      </select>
                    </div>
                    <div class="col-4">
                      <select 
                        class="form-select" 
                        v-model="birthMonth" 
                        @change="updateBirthDateAndDays"
                        required
                      >
                        <option value="">월</option>
                        <option v-for="month in birthMonths" :key="month" :value="month">{{ month }}월</option>
                      </select>
                    </div>
                    <div class="col-4">
                      <select 
                        class="form-select" 
                        v-model="birthDay" 
                        @change="updateBirthDate"
                        required
                      >
                        <option value="">일</option>
                        <option v-for="day in birthDays" :key="day" :value="day">{{ day }}일</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- 학교 검색 -->
                <div class="mb-4">
                  <label for="school" class="form-label fw-bold">학교 정보</label>
                  <div class="input-group">
                    <input
                      type="text"
                      class="form-control"
                      id="school"
                      v-model="signupForm.school"
                      placeholder="학교명을 입력하세요"
                      readonly
                      required
                    >
                                      <button
                    class="btn btn-outline-primary"
                    type="button"
                    @click="openSchoolSearchModal"
                  >
                    학교 검색
                  </button>
                  </div>
                  <small v-if="schoolSearchResults.length > 0" class="text-muted">
                    검색 결과: {{ schoolSearchResults.length }}개 학교
                  </small>
                </div>

                <!-- 가입완료 버튼 -->
                <div class="d-flex gap-3">
                  <button type="button" @click="prevStep" class="btn btn-secondary flex-fill">
                    이전
                  </button>
                  <button type="submit" class="btn btn-primary flex-fill">
                    {{ signupForm.isOAuth2User ? '간편 회원가입' : '가입완료' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- 로그인 링크 -->
            <div class="text-center mt-4">
              <p class="mb-0">
                이미 계정이 있으신가요? 
                <router-link to="/login" class="text-decoration-none fw-bold">로그인</router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer를 메인 컨테이너 안으로 이동 -->
      <div class="mt-5">
        <Footer />
      </div>
    </div>
  </div>

  <!-- 학교 검색 모달 -->
  <div v-if="showSchoolModal" class="modal-overlay" @click="closeSchoolModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title">
          학교 검색
        </h5>
        <button type="button" class="btn-close" @click="closeSchoolModal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <!-- 검색 입력 -->
        <div class="mb-3">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              v-model="schoolSearchKeyword"
              @keyup.enter="searchSchools"
              placeholder="학교명을 입력하세요"
            >
            <button 
              class="btn btn-primary" 
              @click="searchSchools"
              :disabled="!schoolSearchKeyword.trim() || isSchoolSearching"
            >
              <span v-if="isSchoolSearching" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSchoolSearching ? '검색 중...' : '검색' }}
            </button>
          </div>
        </div>

        <!-- 검색 결과 -->
        <div v-if="schoolSearchResults.length > 0" class="mb-3">
          <h6 class="fw-bold mb-2">검색 결과 ({{ schoolSearchResults.length }}건)</h6>
          <div class="list-group">
            <button 
              v-for="school in schoolSearchResults" 
              :key="school.id"
              type="button"
              class="list-group-item list-group-item-action"
              @click="selectSchool(school)"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="mb-1 fw-bold">{{ school.schoolName }}</h6>
                  <p class="mb-1 text-muted small">
                    {{ school.addressRoad || school.addressJibun }}
                  </p>
                  <small class="text-muted">
                    {{ school.sidoOffice }} | {{ school.eduOffice }}
                  </small>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- 검색 결과 없음 -->
        <div v-else-if="schoolSearchKeyword && !isSchoolSearching" class="text-center py-4">
          <p class="text-muted mb-0">검색 결과가 없습니다.</p>
        </div>

        <!-- 초기 상태 -->
        <div v-else-if="!schoolSearchKeyword" class="text-center py-4">
          <p class="text-muted mb-0">학교명을 입력하여 검색해주세요.</p>
        </div>
      </div>
          </div>
    </div>
  </div>
  
  <!-- 학교 검색 모달 -->
  <div v-if="showSchoolModal" class="modal-overlay" @click="closeSchoolModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title">
          학교 검색
        </h5>
        <button type="button" class="btn-close" @click="closeSchoolModal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <!-- 검색 입력 -->
        <div class="mb-3">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              v-model="schoolSearchKeyword"
              @keyup.enter="searchSchools"
              placeholder="학교명을 입력하세요"
            >
            <button 
              class="btn btn-primary" 
              @click="searchSchools"
              :disabled="!schoolSearchKeyword.trim() || isSchoolSearching"
            >
              <span v-if="isSchoolSearching" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSchoolSearching ? '검색 중...' : '검색' }}
            </button>
          </div>
        </div>

        <!-- 검색 결과 -->
        <div v-if="schoolSearchResults.length > 0" class="mb-3">
          <h6 class="fw-bold mb-2">검색 결과 ({{ schoolSearchResults.length }}건)</h6>
          <div class="list-group">
            <button 
              v-for="school in schoolSearchResults" 
              :key="school.id"
              type="button"
              class="list-group-item list-group-item-action"
              @click="selectSchool(school)"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="mb-1 fw-bold">{{ school.schoolName }}</h6>
                  <p class="mb-1 text-muted small">
                    {{ school.addressRoad || school.addressJibun }}
                  </p>
                  <small class="text-muted">
                    {{ school.sidoOffice }} | {{ school.eduOffice }}
                  </small>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- 검색 결과 없음 -->
        <div v-else-if="schoolSearchKeyword && !isSchoolSearching" class="text-center py-4">
          <p class="text-muted mb-0">검색 결과가 없습니다.</p>
        </div>

        <!-- 초기 상태 -->
        <div v-else-if="!schoolSearchKeyword" class="text-center py-4">
          <p class="text-muted mb-0">학교명을 입력하여 검색해주세요.</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 약관 모달 -->
  <div v-if="showTermsModalFlag" class="modal-overlay" @click="closeTermsModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title fw-bold">이용약관</h5>
        <button type="button" class="btn-close" @click="closeTermsModal"></button>
      </div>
      <div class="modal-body">
        <div class="terms-content">
          <h6 class="fw-bold mb-3">제1조 (목적)</h6>
          <p class="mb-3">이 약관은 PullIt(이하 "회사")이 제공하는 교육 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          
          <h6 class="fw-bold mb-3">제2조 (정의)</h6>
          <p class="mb-3">1. "서비스"라 함은 회사가 제공하는 교육 관련 서비스를 의미합니다.</p>
          <p class="mb-3">2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 의미합니다.</p>
          
          <h6 class="fw-bold mb-3">제3조 (약관의 효력 및 변경)</h6>
          <p class="mb-3">1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
          <p class="mb-3">2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 개인정보처리방침 모달 -->
  <div v-if="showPrivacyModalFlag" class="modal-overlay" @click="closePrivacyModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title fw-bold">개인정보처리방침</h5>
        <button type="button" class="btn-close" @click="closePrivacyModal"></button>
      </div>
      <div class="modal-body">
        <div class="privacy-content">
          <h6 class="fw-bold mb-3">1. 개인정보의 처리 목적</h6>
          <p class="mb-3">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
          
          <h6 class="fw-bold mb-3">2. 개인정보의 처리 및 보유기간</h6>
          <p class="mb-3">회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
          
          <h6 class="fw-bold mb-3">3. 개인정보의 제3자 제공</h6>
          <p class="mb-3">회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'

const router = useRouter()

// 반응형 데이터
const signupStep = ref(1)

// 회원가입 폼
const signupForm = ref({
  userType: '',
  username: '',
  password: '',
  passwordConfirm: '',
  email: '',
  phone: '',
  phoneNumber: '',
  birthDate: '',
  school: '',
  fullName: '',
  socialProvider: '',
  socialProviderId: '',
  isOAuth2User: false
})

// 약관 동의
const agreements = ref({
  all: false,
  terms: false,
  privacy: false,
  marketing: false
})

// 휴대폰 인증
const verificationSent = ref(false)
const verificationCode = ref('')
const phoneVerified = ref(false)
const verificationTimer = ref(180)
let timerInterval = null

// 아이디 중복 확인
const usernameCheckMessage = ref('')
const usernameAvailable = ref(false)

// 비밀번호 강도
const passwordStrength = ref('')
const passwordStrengthClass = ref('')
const passwordStrengthText = ref('')

// 비밀번호 표시/숨김 상태
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

// 이메일 유효성 검사
const emailValid = ref(false)
const emailErrorMessage = ref('')

// 학교 검색
const showSchoolModal = ref(false)
const schoolSearchKeyword = ref('')
const schoolSearchResults = ref([])
const isSchoolSearching = ref(false)

// 약관 모달
const showTermsModalFlag = ref(false)
const showPrivacyModalFlag = ref(false)

// 생년월일 선택
const birthYear = ref('')
const birthMonth = ref('')
const birthDay = ref('')
const birthYears = ref([])
const birthMonths = ref([])
const birthDays = ref([])

// API 설정
const apiBaseUrl = 'http://localhost:8080/api'

// computed properties
const canProceedToStep2 = computed(() => {
  return agreements.value.terms && agreements.value.privacy && signupForm.value.userType
})

const isValidPhone = computed(() => {
  const phoneRegex = /^010-\d{4}-\d{4}$/
  return phoneRegex.test(signupForm.value.phone)
})

const passwordsMatch = computed(() => {
  return signupForm.value.password === signupForm.value.passwordConfirm
})

const passwordStrengthWidth = computed(() => {
  if (!passwordStrength.value) return '0%'
  const strength = passwordStrength.value
  if (strength <= 2) return '33%'
  if (strength <= 3) return '66%'
  return '100%'
})

// 메서드들
const toggleAllAgreements = () => {
  agreements.value.terms = agreements.value.all
  agreements.value.privacy = agreements.value.all
  agreements.value.marketing = agreements.value.all
}

const checkIndividualAgreements = () => {
  if (agreements.value.terms && agreements.value.privacy && agreements.value.marketing) {
    agreements.value.all = true
  } else {
    agreements.value.all = false
  }
}

// 약관 모달 관련 함수들
const showTermsModal = () => {
  showTermsModalFlag.value = true
}

const closeTermsModal = () => {
  showTermsModalFlag.value = false
}

const showPrivacyModal = () => {
  showPrivacyModalFlag.value = true
}

const closePrivacyModal = () => {
  showPrivacyModalFlag.value = false
}

// 생년월일 관련 함수들
const initBirthDateOptions = () => {
  // 연도 옵션 (현재 연도부터 100년 전까지)
  const currentYear = new Date().getFullYear()
  birthYears.value = Array.from({length: 100}, (_, i) => currentYear - i)
  
  // 월 옵션 (1~12월)
  birthMonths.value = Array.from({length: 12}, (_, i) => i + 1)
  
  // 일 옵션 (1~31일)
  birthDays.value = Array.from({length: 31}, (_, i) => i + 1)
}

const updateBirthDate = () => {
  if (birthYear.value && birthMonth.value && birthDay.value) {
    // YYYY-MM-DD 형식으로 변환
    const month = birthMonth.value.toString().padStart(2, '0')
    const day = birthDay.value.toString().padStart(2, '0')
    signupForm.value.birthDate = `${birthYear.value}-${month}-${day}`
  } else {
    signupForm.value.birthDate = ''
  }
}

const updateBirthDateAndDays = () => {
  updateBirthDate()
  updateBirthDays()
}

const updateBirthDays = () => {
  if (birthYear.value && birthMonth.value) {
    const year = birthYear.value
    const month = birthMonth.value
    const daysInMonth = new Date(year, month, 0).getDate()
    birthDays.value = Array.from({length: daysInMonth}, (_, i) => i + 1)
    
    // 현재 선택된 일이 해당 월의 최대 일수보다 크면 리셋
    if (birthDay.value > daysInMonth) {
      birthDay.value = ''
      updateBirthDate()
    }
  }
}

// 휴대폰번호를 API 전송용 형식으로 변환 (숫자만)
const formatPhoneForAPI = (phone) => {
  if (!phone) return ''
  
  // 숫자만 추출하여 반환
  return phone.replace(/[^0-9]/g, '')
}

const formatPhone = () => {
  let phone = signupForm.value.phone.replace(/[^0-9]/g, '')
  if (phone.length > 3 && phone.length <= 7) {
    phone = phone.slice(0, 3) + '-' + phone.slice(3)
  } else if (phone.length > 7) {
    phone = phone.slice(0, 3) + '-' + phone.slice(3, 7) + '-' + phone.slice(7, 11)
  }
  signupForm.value.phone = phone
}

const sendVerificationCode = async () => {
  // 테스트용 번호 체크
  if (signupForm.value.phone === '010-1111-1111') {
    verificationSent.value = true
    startTimer()
    alert('(테스트) 인증번호가 전송되었습니다. 인증번호: 000000')
    return
  }

  try {
    const response = await axios.post(`${apiBaseUrl}/auth/phone/send`, {
      phone: signupForm.value.phone
    })

    if (response.data.success) {
      verificationSent.value = true
      startTimer()
      alert('인증번호가 전송되었습니다.')
    }
  } catch (error) {
    alert('인증번호 전송 실패: ' + (error.response?.data?.message || '알 수 없는 오류'))
  }
}

const startTimer = () => {
  verificationTimer.value = 180
  timerInterval = setInterval(() => {
    verificationTimer.value--
    if (verificationTimer.value <= 0) {
      clearInterval(timerInterval)
      verificationSent.value = false
    }
  }, 1000)
}

const verifyPhone = async () => {
  // 테스트용 인증 체크
  if (signupForm.value.phone === '010-1111-1111' && verificationCode.value === '000000') {
    phoneVerified.value = true
    clearInterval(timerInterval)
    alert('(테스트) 휴대폰 인증이 완료되었습니다.')
    return
  }

  try {
    const response = await axios.post(`${apiBaseUrl}/auth/phone/verify`, {
      phone: signupForm.value.phone,
      code: verificationCode.value
    })

    if (response.data.success) {
      phoneVerified.value = true
      clearInterval(timerInterval)
      alert('휴대폰 인증이 완료되었습니다.')
    }
  } catch (error) {
    alert('인증 실패: ' + (error.response?.data?.message || '잘못된 인증번호입니다.'))
  }
}

const checkUsernameAvailability = async () => {
  if (!signupForm.value.username) {
    usernameCheckMessage.value = '아이디를 입력해주세요.'
    usernameAvailable.value = false
    return
  }

  try {
    const response = await axios.get(`${apiBaseUrl}/users/check/username/${signupForm.value.username}`)

    if (response.data.success) {
      usernameCheckMessage.value = '사용 가능한 아이디입니다.'
      usernameAvailable.value = true
    } else {
      usernameCheckMessage.value = '이미 사용중인 아이디입니다.'
      usernameAvailable.value = false
    }
  } catch {
    usernameCheckMessage.value = '중복 확인 실패'
    usernameAvailable.value = false
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const togglePasswordConfirmVisibility = () => {
  showPasswordConfirm.value = !showPasswordConfirm.value
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const checkEmailFormat = () => {
  const email = signupForm.value.email

  if (!email) {
    emailValid.value = false
    emailErrorMessage.value = ''
    return
  }

  if (!validateEmail(email)) {
    emailValid.value = false
    emailErrorMessage.value = '올바른 이메일 형식을 입력해주세요.'
  } else {
    emailValid.value = true
    emailErrorMessage.value = ''
  }
}

const checkPasswordStrength = () => {
  const password = signupForm.value.password

  if (!password) {
    passwordStrength.value = ''
    return
  }

  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isLongEnough = password.length >= 9 && password.length <= 20

  let strength = 0
  if (hasLower) strength++
  if (hasUpper) strength++
  if (hasNumber) strength++
  if (hasSpecial) strength++
  if (isLongEnough) strength++

  if (strength >= 5) {
    passwordStrengthClass.value = 'bg-success'
    passwordStrengthText.value = '보안 우수'
  } else if (strength >= 3) {
    passwordStrengthClass.value = 'bg-warning'
    passwordStrengthText.value = '보안 양호'
  } else {
    passwordStrengthClass.value = 'bg-danger'
    passwordStrengthText.value = '보안 취약'
  }

  passwordStrength.value = true
}

const openSchoolSearchModal = () => {
  console.log('openSchoolSearchModal 함수 실행 시작')
  showSchoolModal.value = true
  schoolSearchKeyword.value = ''
  schoolSearchResults.value = []
  console.log('openSchoolSearchModal 함수 실행 완료')
}

const closeSchoolModal = () => {
  showSchoolModal.value = false
  schoolSearchKeyword.value = ''
  schoolSearchResults.value = []
}

const searchSchools = async () => {
  console.log('🚀 searchSchools 함수 실행 시작')
  console.log('🚀 schoolSearchKeyword.value:', schoolSearchKeyword.value)
  
  if (!schoolSearchKeyword.value.trim()) {
    console.log('🚀 검색어가 없어서 함수 종료')
    return
  }

  isSchoolSearching.value = true

  try {
    console.log('학교 검색 시작 (실제 API):', schoolSearchKeyword.value.trim())

    // 실제 API로 학교 검색
    const keyword = schoolSearchKeyword.value.trim()
    console.log('검색 키워드:', keyword)
    console.log('검색 키워드 길이:', keyword.length)
    console.log('검색 키워드 바이트:', new TextEncoder().encode(keyword))
    
    const response = await axios.get(`http://localhost:8080/api/schools/search?keyword=${encodeURIComponent(keyword)}`)
    console.log('검색 결과:', response.data)
    schoolSearchResults.value = response.data
  } catch (error) {
    console.error('학교 검색 실패:', error)
    console.error('에러 상세:', error.response?.data)
    console.error('에러 상태:', error.response?.status)
    schoolSearchResults.value = []
    alert('학교 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    isSchoolSearching.value = false
  }
}

const selectSchool = (school) => {
  signupForm.value.school = school.schoolName
  closeSchoolModal()
}

const nextStep = () => {
  if (signupStep.value === 1) {
    // Step 1 (약관동의) → Step 2 (휴대폰 인증) 또는 Step 3 (정보 입력)
    if (signupForm.value.isOAuth2User) {
      // OAuth2 사용자는 휴대폰 인증 건너뛰고 바로 정보 입력 단계로
      signupStep.value = 3
      console.log('OAuth2 사용자: 휴대폰 인증 건너뛰고 정보 입력 단계로 이동')
    } else {
      // 일반 사용자는 휴대폰 인증 단계로
      signupStep.value = 2
    }
  } else if (signupStep.value === 2 && signupStep.value < 3) {
    // Step 2 (휴대폰 인증) → Step 3 (정보 입력)
    signupStep.value = 3
  }
}

const prevStep = () => {
  if (signupStep.value > 1) {
    signupStep.value--
  }
}

// OAuth2 소셜 로그인 정보 확인 및 폼 자동 채우기
const checkOAuth2Info = () => {
  // URL 쿼리 파라미터에서 OAuth2 정보 확인
  const urlParams = new URLSearchParams(window.location.search)
  const isOAuth2 = urlParams.get('oauth2')
  
  if (isOAuth2 === 'true') {
    console.log('OAuth2 소셜 로그인으로 회원가입 진행')
    
    // URL 쿼리에서 소셜 정보 가져오기
    const provider = urlParams.get('provider')
    const email = urlParams.get('email')
    const name = urlParams.get('name')
    const providerId = urlParams.get('providerId')
    const username = urlParams.get('username')
    
    // sessionStorage에서도 확인 (OAuth2Callback에서 저장한 정보)
    const oauth2Info = sessionStorage.getItem('oauth2_social_info')
    let socialInfo = {}
    
    if (oauth2Info) {
      try {
        socialInfo = JSON.parse(oauth2Info)
        console.log('sessionStorage에서 OAuth2 정보:', socialInfo)
      } catch (error) {
        console.error('OAuth2 정보 파싱 오류:', error)
      }
    }
    
    // 폼에 정보 자동 채우기
    if (email) {
      signupForm.value.email = email
      checkEmailFormat() // 이메일 유효성 검사 실행
    }
    
    if (name) {
      signupForm.value.fullName = name
    }
    
    if (username) {
      signupForm.value.username = username
      // 아이디 중복 확인 자동 실행
      setTimeout(() => {
        checkUsernameAvailability()
      }, 500)
    }
    
    // 소셜 로그인 정보를 회원가입 데이터에 포함
    signupForm.value.socialProvider = provider
    signupForm.value.socialProviderId = providerId
    
    // OAuth2 사용자임을 표시
    signupForm.value.isOAuth2User = true
    
    console.log('OAuth2 정보로 폼 자동 채움 완료:', {
      email: signupForm.value.email,
      fullName: signupForm.value.fullName,
      username: signupForm.value.username,
      provider: signupForm.value.socialProvider
    })
    
    // OAuth2 사용자는 약관동의부터 시작 (일반 사용자와 동일)
    console.log('OAuth2 사용자: 약관동의부터 시작')
  }
}

const handleSignup = async () => {
  // 필수 필드 검증
  if (!signupForm.value.username.trim()) {
    alert('아이디를 입력해주세요.')
    return
  }

  // OAuth2 사용자가 아닌 경우에만 비밀번호 검증
  if (!signupForm.value.isOAuth2User) {
    if (!signupForm.value.password) {
      alert('비밀번호를 입력해주세요.')
      return
    }

    if (signupForm.value.password !== signupForm.value.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
  }

  if (!usernameAvailable.value) {
    alert('아이디 중복 확인을 해주세요.')
    return
  }

  if (!signupForm.value.email.trim()) {
    alert('이메일을 입력해주세요.')
    return
  }

  if (!emailValid.value) {
    alert('올바른 이메일 형식을 입력해주세요.')
    return
  }

  if (!signupForm.value.userType) {
    alert('가입 유형을 선택해주세요.')
    return
  }

  // OAuth2 사용자가 아닌 경우에만 휴대폰 인증 검증
  if (!signupForm.value.isOAuth2User && !phoneVerified.value) {
    alert('휴대폰 인증을 완료해주세요.')
    return
  }

  // OAuth2 사용자의 경우 휴대폰번호 입력 검증 (필수)
  if (signupForm.value.isOAuth2User && !signupForm.value.phoneNumber.trim()) {
    alert('휴대폰번호를 입력해주세요.')
    return
  }

  try {
    const signupData = {
      username: signupForm.value.username,
      password: signupForm.value.password || 'SOCIAL_LOGIN_' + Date.now(), // OAuth2 사용자는 임시 비밀번호
      email: signupForm.value.email,
      phone: signupForm.value.isOAuth2User ? 
        formatPhoneForAPI(signupForm.value.phoneNumber || '') : 
        formatPhoneForAPI(signupForm.value.phone || ''),
      fullName: signupForm.value.fullName || signupForm.value.username,
      role: signupForm.value.userType.toUpperCase(),
      marketingAgree: agreements.value.marketing,
      socialProvider: signupForm.value.socialProvider,
      socialProviderId: signupForm.value.socialProviderId
    }

    console.log('회원가입 데이터:', signupData)
    console.log('API 엔드포인트:', `${apiBaseUrl}/auth/register`)

    const response = await axios.post(`${apiBaseUrl}/auth/register`, signupData)

    console.log('회원가입 응답:', response.data)

    // 백엔드 응답 구조에 따라 성공 여부 확인
    if (response.status === 201 || response.data.success || response.data.code === '200') {
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')
      router.push('/login')
    } else {
      alert('회원가입에 실패했습니다: ' + (response.data.message || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('회원가입 에러:', error)
    console.error('에러 응답:', error.response?.data)
    console.error('에러 상태:', error.response?.status)
    
    if (error.response?.status === 400) {
      alert('입력 정보를 확인해주세요: ' + (error.response.data.message || '잘못된 요청입니다.'))
    } else if (error.response?.status === 409) {
      alert('이미 존재하는 사용자입니다: ' + (error.response.data.message || '아이디나 이메일이 중복됩니다.'))
    } else if (error.response?.status === 500) {
      alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } else {
      alert('회원가입 실패: ' + (error.response?.data?.message || '알 수 없는 오류가 발생했습니다.'))
    }
  }
}

// 감시자
watch(() => signupForm.value.phone, () => {
  formatPhone()
})

// 생명주기 훅
onMounted(() => {
  console.log('Signup 컴포넌트 마운트 완료')
  
  // OAuth2 소셜 로그인 정보 확인 및 폼 자동 채우기
  checkOAuth2Info()
  
  // 생년월일 옵션 초기화
  initBirthDateOptions()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.card {
  border-radius: 1rem;
}

.card-header {
  border-radius: 1rem 1rem 0 0 !important;
}

.section-title {
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

/* 단계 표시 스타일 */
.step-indicator {
  margin-bottom: 2rem;
}

.step {
  text-align: center;
  padding: 1.5rem 1rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  position: relative;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.step.active {
  background: #0d6efd;
  border-color: #0d6efd;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.step.completed {
  background: #198754;
  border-color: #198754;
  color: white;
}

.step.oauth2-skipped {
  background: #17a2b8;
  border-color: #17a2b8;
  color: white;
  position: relative;
}

.step.oauth2-skipped::after {
  content: '⏭️';
  position: absolute;
  top: -8px;
  right: -8px;
  background: #17a2b8;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.step-number {
  font-weight: 700;
  font-size: 1.5rem;
  margin: 0 auto 0.75rem;
  transition: all 0.3s ease;
  color: #6c757d;
}

.step.active .step-number {
  color: white;
  transform: scale(1.1);
}

.step.completed .step-number {
  color: white;
}

.step-text {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
}

/* 사용자 유형 선택 카드 */
.user-type-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.user-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #0d6efd;
}

.user-type-card.active {
  background: #e7f1ff;
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

 .user-type-icon {
   margin-bottom: 1rem;
   display: flex;
   align-items: center;
   justify-content: center;
 }

 .user-icon {
   width: 60px;
   height: 60px;
   object-fit: contain;
   transition: all 0.3s ease;
 }

 .user-type-card:nth-child(2) .user-icon {
   height: 50px;
   width: 50px;
 }

 .user-type-card.active .user-icon {
   transform: scale(1.1);
 }

.user-type-title {
  margin: 0;
  font-weight: 600;
  color: #495057;
}

.user-type-card.active .user-type-title {
  color: #0d6efd;
}

/* 폼 스타일 */
.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  border: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.progress {
  border-radius: 10px;
  background-color: #e9ecef;
}

.progress-bar {
  border-radius: 10px;
  transition: width 0.3s ease;
}

.list-group-item {
  border-left: none;
  border-right: none;
  transition: all 0.2s ease;
}

.list-group-item:hover {
  background-color: #f8f9fa;
  transform: translateX(5px);
}

.list-group-item:first-child {
  border-top: none;
}

.list-group-item:last-child {
  border-bottom: none;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  border-bottom: 1px solid #e9ecef;
  border-radius: 1rem 1rem 0 0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-check-input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* 체크박스 간격 개선 */
.form-check-input.me-3 {
  margin-right: 1rem !important;
}

/* 약관 모달 스타일 */
.terms-content,
.privacy-content {
  line-height: 1.6;
}

.terms-content h6,
.privacy-content h6 {
  color: #0d6efd;
  margin-top: 1.5rem;
}

.terms-content h6:first-child,
.privacy-content h6:first-child {
  margin-top: 0;
}

/* 생년월일 선택 스타일 */
.form-select {
  border-radius: 0.5rem;
  border: 1px solid #ced4da;
  transition: all 0.2s ease;
}

.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-select:hover {
  border-color: #0d6efd;
}

/* 전역 스크롤 설정 */
html {
  scroll-behavior: smooth;
}

body {
  overflow-y: auto;
  height: auto;
}

/* 회원가입 페이지 전체 스타일 */
.signup-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  overflow-y: auto;
}

.signup-container {
  padding: 2rem 1rem;
  min-height: calc(100vh - 80px); /* Header 높이 제외 */
  overflow-y: auto;
}

/* 스크롤바 스타일링 */
.signup-container::-webkit-scrollbar {
  width: 8px;
}

.signup-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.signup-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.signup-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.card {
  max-height: none;
  overflow: visible;
  margin-bottom: 2rem;
}

.card-body {
  overflow: visible;
  max-height: none;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .signup-container {
    padding: 1rem 0.5rem;
  }
  
  .card-body {
    padding: 1.5rem !important;
  }
  
  .col-12 {
    padding: 0 0.5rem;
  }
  
  .step-text {
    font-size: 0.875rem;
  }
  
  .step {
    height: 120px;
    padding: 1rem 0.5rem;
  }
  
  .step-number {
    font-size: 1.25rem;
  }
  
  .user-type-card {
    padding: 1rem;
  }
  
  /* 모바일에서 스크롤 강화 */
  .signup-page {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
