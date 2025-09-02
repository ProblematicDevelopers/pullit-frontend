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
                <div class="step-progress">
                  <div class="step-line" :class="{ 'completed': signupStep > 1 }"></div>
                  <div class="step-line" :class="{ 'completed': signupStep > 2 }"></div>
                  <div class="step-line" :class="{ 'completed': signupStep > 3 }"></div>
                </div>

                <div class="steps-container">
                  <div class="step-item" :class="{
                    'active': signupStep === 1,
                    'completed': signupStep > 1
                  }">
                    <div class="step-icon">
                      <div v-if="signupStep <= 1" class="step-number">1</div>
                      <div v-if="signupStep > 1" class="step-check">
                        <i class="bi bi-check-lg"></i>
                      </div>
                    </div>
                    <div class="step-content">
                      <div class="step-title">약관동의</div>
                    </div>
                  </div>

                  <div class="step-item" :class="{
                    'active': signupStep === 2,
                    'completed': signupStep > 2
                  }">
                    <div class="step-icon">
                      <div v-if="signupStep <= 2" class="step-number">2</div>
                      <div v-if="signupStep > 2" class="step-check">
                        <i class="bi bi-check-lg"></i>
                      </div>
                    </div>
                    <div class="step-content">
                      <div class="step-title">유형선택</div>
                    </div>
                  </div>

                  <div class="step-item" :class="{
                    'active': signupStep === 3,
                    'completed': signupStep > 3,
                    'oauth2-skipped': signupForm.isOAuth2User && signupStep > 2
                  }">
                    <div class="step-icon">
                      <div v-if="signupStep <= 3" class="step-number">3</div>
                      <div v-if="signupStep > 3" class="step-check">
                        <i class="bi bi-check-lg"></i>
                      </div>
                      <div v-if="signupForm.isOAuth2User && signupStep > 2" class="step-skip">
                        <i class="bi bi-forward"></i>
                      </div>
                    </div>
                    <div class="step-content">
                      <div class="step-title">휴대폰 인증</div>
                      <div v-if="signupForm.isOAuth2User && signupStep > 2" class="step-subtitle text-success">
                        <i class="bi bi-check-circle"></i> 건너뜀
                      </div>
                    </div>
                  </div>

                  <div class="step-item" :class="{
                    'active': signupStep === 4,
                    'completed': false
                  }">
                    <div class="step-icon">
                      <div class="step-number">4</div>
                    </div>
                    <div class="step-content">
                      <div class="step-title">정보 입력</div>
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

              <!-- 다음 단계 버튼 -->
              <div class="d-grid">
                <button
                  @click="nextStep"
                  class="btn btn-primary btn-lg fw-bold"
                  :disabled="!canProceedToStep2"
                >
                  다음 단계
                </button>
              </div>
            </div>

            <!-- Step 2: 가입 유형 선택 -->
            <div v-if="signupStep === 2">
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

              <!-- 단계 이동 버튼 -->
              <div class="d-flex gap-3">
                <button @click="prevStep" class="btn btn-secondary flex-fill">
                  이전
                </button>
                <button
                  @click="nextStep"
                  class="btn btn-primary flex-fill"
                  :disabled="!signupForm.userType"
                >
                  다음 단계
                </button>
              </div>
            </div>

            <!-- Step 3: 휴대폰 인증 -->
            <div v-if="signupStep === 3">
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

            <!-- Step 4: 정보 입력 -->
            <div v-if="signupStep === 4">
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
                {{ infoInputStep === 1 ? '계정 정보 입력' : infoInputStep === 2 ? '개인 정보 입력' : '학교 정보 입력' }}
              </h5>

              <form @submit.prevent="handleSignup">
                <!-- Step 4-1: 계정정보 입력 -->
                <div v-if="infoInputStep === 1">
                  <!-- 아이디 입력 -->
                  <div class="mb-3">
                    <label for="username" class="form-label fw-bold">아이디</label>
                    <div class="input-group">
                      <input
                        type="text"
                        class="form-control"
                        id="username"
                        v-model="signupForm.username"
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
                  </div>

                  <!-- 비밀번호 확인 -->
                  <div class="mb-4" v-if="!signupForm.isOAuth2User">
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

                  <!-- 다음 단계 버튼 -->
                  <div class="d-flex gap-3">
                    <button type="button" @click="prevStep" class="btn btn-secondary flex-fill">
                      이전
                    </button>
                    <button type="button" @click="nextInfoStep" class="btn btn-primary flex-fill" :disabled="!canProceedToNextInfoStep">
                      다음 단계
                    </button>
                  </div>
                </div>

                <!-- Step 4-2: 개인정보 입력 -->
                <div v-if="infoInputStep === 2">
                  <!-- 이름 입력 -->
                  <div class="mb-3">
                    <label for="fullName" class="form-label fw-bold">이름</label>
                    <input
                      type="text"
                      class="form-control"
                      :class="{'is-invalid': !nameValid && nameErrorMessage, 'is-valid': nameValid}"
                      id="fullName"
                      v-model="signupForm.fullName"
                      @blur="checkNameFormat"
                      @input="checkNameFormat"
                      placeholder="이름을 입력하세요"
                      required
                      maxlength="20"
                    >
                    <div v-if="nameErrorMessage" class="invalid-feedback">{{ nameErrorMessage }}</div>
                    <div v-else-if="nameValid" class="valid-feedback">올바른 이름 형식입니다.</div>
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
                  <div class="mb-4">
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

                  <!-- 단계 이동 버튼 -->
                  <div class="d-flex gap-3">
                    <button type="button" @click="prevInfoStep" class="btn btn-secondary flex-fill">
                      이전
                    </button>
                    <button type="button" @click="nextInfoStep" class="btn btn-primary flex-fill" :disabled="!canProceedToNextInfoStep">
                      다음 단계
                    </button>
                  </div>
                </div>

                <!-- Step 4-3: 학교정보 입력 -->
                <div v-if="infoInputStep === 3">
                  <!-- 선생님인 경우 과목 선택 -->
                  <div class="mb-3" v-if="signupForm.userType === 'teacher'">
                    <label for="subject" class="form-label fw-bold">담당 과목</label>
                    <select
                      class="form-select"
                      id="subject"
                      v-model="signupForm.subject"
                      required
                    >
                      <option value="">과목을 선택하세요</option>
                      <option value="MA">수학</option>
                      <option value="KO">국어</option>
                      <option value="EN">영어</option>
                      <option value="SC">과학</option>
                      <option value="SO">사회</option>
                    </select>
                  </div>

                  <!-- 학생인 경우 학년 선택 -->
                  <div class="mb-3" v-if="signupForm.userType === 'student'">
                    <label for="grade" class="form-label fw-bold">학년 (선택사항)</label>
                    <select
                      class="form-select"
                      id="grade"
                      v-model="signupForm.grade"
                    >
                      <option :value="null">학년을 선택하세요</option>
                      <option :value="{ code: '07', name: '중학교 1학년' }">중학교 1학년</option>
                      <option :value="{ code: '08', name: '중학교 2학년' }">중학교 2학년</option>
                      <option :value="{ code: '09', name: '중학교 3학년' }">중학교 3학년</option>
                    </select>
                    <div class="form-text">나중에 선생님이 반에 초대할 때 설정할 수도 있습니다.</div>
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
                    <button type="button" @click="prevInfoStep" class="btn btn-secondary flex-fill">
                      이전
                    </button>
                    <button type="submit" class="btn btn-primary flex-fill">
                      {{ signupForm.isOAuth2User ? '간편 회원가입' : '가입완료' }}
                    </button>
                  </div>
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
import { authAPI } from '@/services/api'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'

const router = useRouter()

// 반응형 데이터
const signupStep = ref(1)
const infoInputStep = ref(1) // Step 4 내에서의 하위 단계 (1: 계정정보, 2: 개인정보, 3: 학교정보)

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
  subject: '',  // 과목 추가
  grade: null, // 학년 추가 (학생용)
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

// 이름 유효성 검사
const nameValid = ref(false)
const nameErrorMessage = ref('')

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
  return agreements.value.terms && agreements.value.privacy
})

const canProceedToNextInfoStep = computed(() => {
  if (infoInputStep.value === 1) {
    // 계정정보 단계: 아이디 중복확인 완료, 비밀번호 일치 확인
    if (!usernameAvailable.value) return false
    if (!signupForm.value.isOAuth2User) {
      if (!signupForm.value.password || !signupForm.value.passwordConfirm) return false
      if (!passwordsMatch.value) return false
    }
    return true
  } else if (infoInputStep.value === 2) {
    // 개인정보 단계: 이름, 이메일, 생년월일 모두 입력
    if (!nameValid.value || !emailValid.value) return false
    if (!birthYear.value || !birthMonth.value || !birthDay.value) return false
    return true
  }
  return true
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
    const response = await authAPI.sendVerificationCode(signupForm.value.phone)

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
    const response = await authAPI.verifyCode(signupForm.value.phone, verificationCode.value)

    if (response.data.success && response.data.verified) {
      phoneVerified.value = true
      clearInterval(timerInterval)
      alert('휴대폰 인증이 완료되었습니다.')
    } else {
      alert('인증 실패: ' + (response.data.message || '잘못된 인증번호입니다.'))
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
    const response = await fetch(`${apiBaseUrl}/users/check/username/${signupForm.value.username}`)
    const data = await response.json()
    
    console.log('아이디 중복확인 응답:', data)
    
    // 백엔드 응답 구조에 맞게 확인
    // success: true이고 data: true이면 사용 가능
    // success: true이고 data: false이면 중복
    const isAvailable = data.success && data.data === true
    
    if (isAvailable) {
      usernameCheckMessage.value = '사용 가능한 아이디입니다.'
      usernameAvailable.value = true
    } else {
      usernameCheckMessage.value = '이미 사용중인 아이디입니다.'
      usernameAvailable.value = false
    }
  } catch (error) {
    console.error('아이디 중복확인 에러:', error)
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

const validateName = (name) => {
  // 한글, 영어만 허용하는 정규식 (공백 허용하지 않음)
  const nameRegex = /^[가-힣a-zA-Z]{2,20}$/
  return nameRegex.test(name)
}

const checkNameFormat = () => {
  const name = signupForm.value.fullName

  if (!name) {
    nameValid.value = false
    nameErrorMessage.value = ''
    return
  }

  if (name.length < 2) {
    nameValid.value = false
    nameErrorMessage.value = '이름은 최소 2글자 이상 입력해주세요.'
  } else if (!validateName(name)) {
    nameValid.value = false
    nameErrorMessage.value = '이름은 한글 또는 영어만 입력 가능합니다.'
  } else {
    nameValid.value = true
    nameErrorMessage.value = ''
  }
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

    const response = await fetch(`http://localhost:8080/api/schools/search?keyword=${encodeURIComponent(keyword)}`)
    const data = await response.json()
    console.log('검색 결과:', data)
    schoolSearchResults.value = data
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
    // Step 1 (약관동의) → Step 2 (유형선택)
    signupStep.value = 2
  } else if (signupStep.value === 2) {
    // Step 2 (유형선택) → Step 3 (휴대폰 인증) 또는 Step 4 (정보 입력)
    if (signupForm.value.isOAuth2User) {
      // OAuth2 사용자는 휴대폰 인증 건너뛰고 바로 정보 입력 단계로
      signupStep.value = 4
      infoInputStep.value = 1 // 하위 단계 초기화
      console.log('OAuth2 사용자: 휴대폰 인증 건너뛰고 정보 입력 단계로 이동')
    } else {
      // 일반 사용자는 휴대폰 인증 단계로
      signupStep.value = 3
    }
  } else if (signupStep.value === 3) {
    // Step 3 (휴대폰 인증) → Step 4 (정보 입력)
    signupStep.value = 4
    infoInputStep.value = 1 // 하위 단계 초기화
  }
}

const prevStep = () => {
  if (signupStep.value > 1) {
    signupStep.value--
  }
}

const nextInfoStep = () => {
  if (infoInputStep.value < 3) {
    infoInputStep.value++
  }
}

const prevInfoStep = () => {
  if (infoInputStep.value > 1) {
    infoInputStep.value--
  } else {
    // Step 4의 첫 번째 하위 단계에서 이전 버튼을 누르면 Step 3으로 이동
    prevStep()
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
      checkNameFormat() // 이름 유효성 검사 실행
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

  if (!signupForm.value.fullName.trim()) {
    alert('이름을 입력해주세요.')
    return
  }

  if (!nameValid.value) {
    alert('올바른 이름 형식을 입력해주세요.')
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

    // Teacher인 경우 teacherInfo 추가
    if (signupForm.value.userType === 'teacher') {
      // 과목 선택값을 areaCode와 areaName으로 매핑 (기존 시스템과 동일한 코드 사용)
      const subjectMapping = {
        'MA': { code: 'MA', name: '수학' },
        'KO': { code: 'KO', name: '국어' },
        'EN': { code: 'EN', name: '영어' },
        'SC': { code: 'SC', name: '과학' },
        'SO': { code: 'SO', name: '사회' }
      }

      const selectedSubject = subjectMapping[signupForm.value.subject] || { code: '', name: '' }

      signupData.teacherInfo = {
        schoolName: signupForm.value.school, // 학교명 또는 ID
        areaCode: selectedSubject.code, // 과목 코드
        areaName: selectedSubject.name // 과목명
      }
    }

    // Student인 경우 studentInfo 추가
    if (signupForm.value.userType === 'student') {
      signupData.studentInfo = {
        classGroupId: null, // 선생님이 나중에 초대할 때 설정
        studentNo: null, // 선생님이 나중에 설정
        grade: signupForm.value.grade ? {
          code: signupForm.value.grade.code,
          name: signupForm.value.grade.name
        } : null, // 학년 선택 (선택사항)
        schoolName: signupForm.value.school // 학교명 추가
      }
    }

    console.log('회원가입 데이터:', signupData)

    const response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    })

    const responseData = await response.json()
    console.log('회원가입 응답:', responseData)

    // 백엔드 응답 구조에 따라 성공 여부 확인
    if (response.status === 201 || responseData.success || responseData.code === '200') {
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')
      router.push('/login')
    } else {
      alert('회원가입에 실패했습니다: ' + (responseData.message || '알 수 없는 오류'))
    }
  } catch (error) {
    console.error('회원가입 에러:', error)
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } else {
      alert('회원가입 실패: ' + (error.message || '알 수 없는 오류가 발생했습니다.'))
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

/* 현대적인 단계 표시 스타일 */
.step-indicator {
  margin-bottom: 3rem;
  position: relative;
}

/* 하위 단계 표시 스타일 */
.sub-step-indicator {
  margin-bottom: 2rem;
  position: relative;
}

.sub-step-progress {
  position: absolute;
  top: 1.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: #e9ecef;
  z-index: 1;
}

.sub-step-line {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #0d6efd;
  width: 0;
  transition: width 0.6s ease;
  border-radius: 1px;
}

.sub-step-line.completed {
  width: 100%;
}

.sub-steps-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

.sub-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  max-width: 150px;
  position: relative;
}

.sub-step-icon {
  position: relative;
  width: 3rem;
  height: 3rem;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sub-step-item.active .sub-step-icon {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  border-color: #0d6efd;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.3);
}

.sub-step-item.completed .sub-step-icon {
  background: linear-gradient(135deg, #198754 0%, #146c43 100%);
  border-color: #198754;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(25, 135, 84, 0.3);
}

.sub-step-number {
  font-weight: 600;
  font-size: 1rem;
  color: #6c757d;
  transition: all 0.3s ease;
}

.sub-step-item.active .sub-step-number {
  color: white;
}

.sub-step-item.completed .sub-step-number {
  color: white;
}

.sub-step-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.25rem;
  animation: checkIn 0.4s ease-out;
}

.sub-step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sub-step-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #495057;
  transition: color 0.3s ease;
}

.sub-step-item.active .sub-step-title {
  color: #0d6efd;
  font-weight: 700;
}

.sub-step-item.completed .sub-step-title {
  color: #198754;
  font-weight: 600;
}

.step-progress {
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  height: 2px;
  background: #e9ecef;
  z-index: 1;
}

.step-line {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #0d6efd;
  width: 0;
  transition: width 0.6s ease;
  border-radius: 1px;
}

.step-line.completed {
  width: 100%;
}

.steps-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  max-width: 200px;
  position: relative;
}

.step-icon {
  position: relative;
  width: 4rem;
  height: 4rem;
  background: #f8f9fa;
  border: 3px solid #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step-item.active .step-icon {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  border-color: #0d6efd;
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(13, 110, 253, 0.3);
}

.step-item.completed .step-icon {
  background: linear-gradient(135deg, #198754 0%, #146c43 100%);
  border-color: #198754;
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(25, 135, 84, 0.3);
}

.step-item.oauth2-skipped .step-icon {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  border-color: #17a2b8;
}

.step-number {
  font-weight: 700;
  font-size: 1.25rem;
  color: #6c757d;
  transition: all 0.3s ease;
}

.step-item.active .step-number {
  color: white;
}

.step-item.completed .step-number {
  color: white;
}

.step-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.5rem;
  animation: checkIn 0.4s ease-out;
}

.step-skip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.25rem;
  animation: skipIn 0.4s ease-out;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-title {
  font-weight: 600;
  font-size: 1rem;
  color: #495057;
  margin-bottom: 0.25rem;
  transition: color 0.3s ease;
}

.step-subtitle {
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.3;
  transition: color 0.3s ease;
}

.step-item.active .step-title {
  color: #0d6efd;
  font-weight: 700;
}

.step-item.active .step-subtitle {
  color: #0d6efd;
}

.step-item.completed .step-title {
  color: #198754;
  font-weight: 600;
}

.step-item.completed .step-subtitle {
  color: #198754;
}

/* 애니메이션 */
@keyframes checkIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes skipIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5) rotate(-90deg);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2) rotate(-45deg);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
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

/* 체크박스를 정사각형으로 만들기 - 더 강력한 방법 */
.form-check-input {
  width: 20px !important;
  height: 20px !important;
  border-radius: 4px !important;
  flex-shrink: 0 !important;
  min-width: 20px !important;
  min-height: 20px !important;
  max-width: 20px !important;
  max-height: 20px !important;
  box-sizing: border-box !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-color: #fff !important;
  border: 2px solid #dee2e6 !important;
  position: relative !important;
  cursor: pointer !important;
  padding: 0 !important;
  margin: 0 !important;
  display: inline-block !important;
  vertical-align: middle !important;
  line-height: 1 !important;
  font-size: 0 !important;
  overflow: hidden !important;
}

.form-check-input:checked {
  background-color: #0d6efd !important;
  border-color: #0d6efd !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e") !important;
  background-size: 75% !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

/* 체크박스 컨테이너도 정사각형으로 강제 */
.form-check {
  display: flex !important;
  align-items: center !important;
  min-height: 20px !important;
}

.form-check-input {
  flex: 0 0 20px !important;
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

  .step-title {
    font-size: 0.875rem;
  }

  .step-subtitle {
    font-size: 0.75rem;
  }

  .step-icon {
    width: 3rem;
    height: 3rem;
  }

  .step-number {
    font-size: 1rem;
  }

  .step-check {
    font-size: 1.25rem;
  }

  .step-skip {
    font-size: 1rem;
  }

  .sub-step-icon {
    width: 2.5rem;
    height: 2.5rem;
  }

  .sub-step-number {
    font-size: 0.875rem;
  }

  .sub-step-check {
    font-size: 1rem;
  }

  .sub-step-title {
    font-size: 0.75rem;
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
