<template>
  <div class="signup-page">
    <Header />

    <!-- Animated Background -->
    <div class="background-animation">
      <div class="gradient-sphere sphere-1"></div>
      <div class="gradient-sphere sphere-2"></div>
      <div class="gradient-sphere sphere-3"></div>
    </div>

    <div class="signup-container">
      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-info">
          <span class="progress-step">Step {{ signupStep }} of 3</span>
          <span class="progress-percent">{{ Math.round((signupStep / 3) * 100) }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(signupStep / 3) * 100}%` }"></div>
        </div>
      </div>

      <!-- Main Card -->
      <div class="signup-card">
        <!-- Step Indicators -->
        <div class="step-indicators">
          <div
            v-for="step in 3"
            :key="step"
            class="step-indicator"
            :class="{
              'active': signupStep === step,
              'completed': signupStep > step,
              'oauth-skipped': step === 2 && signupForm.isOAuth2User && signupStep > 1
            }"
          >
            <div class="step-icon">
              <component :is="getStepIcon(step)" />
            </div>
            <div class="step-label">{{ getStepLabel(step) }}</div>
          </div>
        </div>

        <!-- Form Content -->
        <transition name="slide-fade" mode="out-in">
          <div v-if="signupStep === 1" key="step1" class="form-step">
            <!-- Step 1: Terms & Role -->
            <div class="step-header">
              <h2 class="step-title">시작하기</h2>
              <p class="step-subtitle">약관에 동의하고 역할을 선택해주세요</p>
            </div>

            <!-- OAuth2 Info -->
            <div v-if="signupForm.isOAuth2User" class="oauth-info">
              <div class="oauth-badge">
                <component :is="getSocialIcon(signupForm.socialProvider)" />
                <span>{{ signupForm.socialProvider }} 계정으로 가입중</span>
              </div>
            </div>

            <!-- Terms Agreement -->
            <div class="terms-section">
              <label class="checkbox-group main-checkbox">
                <input
                  type="checkbox"
                  v-model="agreements.all"
                  @change="toggleAllAgreements"
                  class="checkbox-input"
                >
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">전체 동의</span>
              </label>

              <div class="divider"></div>

              <div class="terms-list">
                <label class="checkbox-group">
                  <input
                    type="checkbox"
                    v-model="agreements.terms"
                    @change="checkIndividualAgreements"
                    class="checkbox-input"
                  >
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-label">
                    <span class="required">[필수]</span> 이용약관 동의
                  </span>
                  <button @click.prevent="showTermsModal" class="link-btn">보기</button>
                </label>

                <label class="checkbox-group">
                  <input
                    type="checkbox"
                    v-model="agreements.privacy"
                    @change="checkIndividualAgreements"
                    class="checkbox-input"
                  >
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-label">
                    <span class="required">[필수]</span> 개인정보 수집 및 이용 동의
                  </span>
                  <button @click.prevent="showPrivacyModal" class="link-btn">보기</button>
                </label>

                <label class="checkbox-group">
                  <input
                    type="checkbox"
                    v-model="agreements.marketing"
                    @change="checkIndividualAgreements"
                    class="checkbox-input"
                  >
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-label">
                    <span class="optional">[선택]</span> 마케팅 정보 수신 동의
                  </span>
                </label>
              </div>
            </div>

            <!-- Role Selection -->
            <div class="role-section">
              <h3 class="section-title">가입 유형 선택</h3>
              <div class="role-cards">
                <button
                  class="role-card"
                  :class="{ active: signupForm.userType === 'teacher' }"
                  @click="signupForm.userType = 'teacher'"
                >
                  <div class="role-icon">
                    <UserCheck :size="32" />
                  </div>
                  <h4>선생님</h4>
                  <p>가르치고 영감을 주는 교육자</p>
                </button>

                <button
                  class="role-card"
                  :class="{ active: signupForm.userType === 'student' }"
                  @click="signupForm.userType = 'student'"
                >
                  <div class="role-icon">
                    <GraduationCap :size="32" />
                  </div>
                  <h4>학생</h4>
                  <p>배우고 성장하는 학습자</p>
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="signupStep === 2" key="step2" class="form-step">
            <!-- Step 2: Phone Verification -->
            <div class="step-header">
              <h2 class="step-title">휴대폰 인증</h2>
              <p class="step-subtitle">본인 확인을 위한 휴대폰 인증을 진행해주세요</p>
            </div>

            <div class="form-group">
              <label class="form-label">휴대폰 번호</label>
              <div class="input-with-button">
                <div class="input-wrapper">
                  <Phone :size="20" class="input-icon" />
                  <input
                    type="tel"
                    v-model="signupForm.phone"
                    @input="formatPhone"
                    placeholder="010-0000-0000"
                    maxlength="13"
                    :disabled="phoneVerified"
                    class="form-input with-icon"
                  >
                </div>
                <button
                  @click="sendVerificationCode"
                  :disabled="!isValidPhone || phoneVerified"
                  class="verify-button"
                  :class="{ verified: phoneVerified }"
                >
                  <template v-if="phoneVerified">
                    <Check :size="16" />
                    인증완료
                  </template>
                  <template v-else>
                    {{ verificationSent ? '재전송' : '인증번호 전송' }}
                  </template>
                </button>
              </div>
            </div>

            <transition name="fade">
              <div v-if="verificationSent && !phoneVerified" class="form-group">
                <label class="form-label">인증번호</label>
                <div class="verification-input-wrapper">
                  <input
                    type="text"
                    v-model="verificationCode"
                    placeholder="000000"
                    maxlength="6"
                    class="form-input verification-input"
                  >
                  <div class="timer" v-if="verificationTimer > 0">
                    {{ Math.floor(verificationTimer / 60) }}:{{ String(verificationTimer % 60).padStart(2, '0') }}
                  </div>
                </div>
                <button
                  @click="verifyPhone"
                  :disabled="verificationCode.length !== 6"
                  class="verify-complete-button"
                >
                  확인
                </button>
              </div>
            </transition>

            <div v-if="phoneVerified" class="success-message">
              <Check :size="20" />
              휴대폰 인증이 완료되었습니다
            </div>
          </div>

          <!-- Step 3: Account Information -->
          <div v-else-if="signupStep === 3" key="step3" class="form-step">
            <div class="step-header">
              <h2 class="step-title">계정 정보 입력</h2>
              <p class="step-subtitle">마지막 단계입니다. 정보를 입력해주세요</p>
            </div>

            <!-- OAuth2 Info -->
            <div v-if="signupForm.isOAuth2User" class="oauth-connected">
              <component :is="getSocialIcon(signupForm.socialProvider)" />
              <span>{{ signupForm.socialProvider }} 계정 연결됨</span>
            </div>

            <div class="form-grid">
              <!-- Full Name -->
              <div class="form-group">
                <label class="form-label">이름</label>
                <div class="input-wrapper">
                  <User :size="20" class="input-icon" />
                  <input
                    type="text"
                    v-model="signupForm.fullName"
                    placeholder="홍길동"
                    class="form-input with-icon"
                    required
                  >
                </div>
              </div>

              <!-- Username -->
              <div class="form-group">
                <label class="form-label">아이디</label>
                <div class="input-wrapper">
                  <AtSign :size="20" class="input-icon" />
                  <input
                    type="text"
                    v-model="signupForm.username"
                    @input="checkUsernameAvailability"
                    placeholder="username"
                    class="form-input with-icon"
                    :class="{
                      'valid': usernameAvailable,
                      'invalid': !usernameAvailable && signupForm.username
                    }"
                    required
                  >
                  <transition name="fade">
                    <Check v-if="usernameAvailable" :size="16" class="validation-icon success" />
                    <X v-else-if="!usernameAvailable && signupForm.username" :size="16" class="validation-icon error" />
                  </transition>
                </div>
                <p v-if="usernameCheckMessage" class="form-hint" :class="{ error: !usernameAvailable }">
                  {{ usernameCheckMessage }}
                </p>
              </div>

              <!-- Email -->
              <div class="form-group">
                <label class="form-label">이메일</label>
                <div class="input-wrapper">
                  <Mail :size="20" class="input-icon" />
                  <input
                    type="email"
                    v-model="signupForm.email"
                    @blur="checkEmailFormat"
                    placeholder="example@email.com"
                    class="form-input with-icon"
                    :class="{
                      'valid': emailValid,
                      'invalid': !emailValid && signupForm.email
                    }"
                    required
                  >
                </div>
                <p v-if="emailErrorMessage" class="form-hint error">{{ emailErrorMessage }}</p>
              </div>

              <!-- Password (if not OAuth2) -->
              <div v-if="!signupForm.isOAuth2User" class="form-group">
                <label class="form-label">비밀번호</label>
                <div class="input-wrapper">
                  <Lock :size="20" class="input-icon" />
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    v-model="signupForm.password"
                    @input="checkPasswordStrength"
                    placeholder="비밀번호"
                    class="form-input with-icon"
                    required
                  >
                  <button @click="togglePasswordVisibility" class="password-toggle">
                    <Eye v-if="!showPassword" :size="16" />
                    <EyeOff v-else :size="16" />
                  </button>
                </div>
                <div v-if="passwordStrength" class="password-strength">
                  <div class="strength-bar">
                    <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: passwordStrengthWidth }"></div>
                  </div>
                  <span class="strength-text">{{ passwordStrengthText }}</span>
                </div>
              </div>

              <!-- Birth Date -->
              <div class="form-group">
                <label class="form-label">생년월일</label>
                <div class="date-selects">
                  <select v-model="birthYear" @change="updateBirthDate" class="form-select">
                    <option value="">연도</option>
                    <option v-for="year in birthYears" :key="year" :value="year">{{ year }}년</option>
                  </select>
                  <select v-model="birthMonth" @change="updateBirthDateAndDays" class="form-select">
                    <option value="">월</option>
                    <option v-for="month in birthMonths" :key="month" :value="month">{{ month }}월</option>
                  </select>
                  <select v-model="birthDay" @change="updateBirthDate" class="form-select">
                    <option value="">일</option>
                    <option v-for="day in birthDays" :key="day" :value="day">{{ day }}일</option>
                  </select>
                </div>
              </div>

              <!-- Subject (for teachers) -->
              <div v-if="signupForm.userType === 'teacher'" class="form-group">
                <label class="form-label">담당 과목</label>
                <select v-model="signupForm.subject" class="form-select full-width" required>
                  <option value="">과목을 선택하세요</option>
                  <option value="MA">수학</option>
                  <option value="KO">국어</option>
                  <option value="EN">영어</option>
                  <option value="SC">과학</option>
                  <option value="SO">사회</option>
                </select>
              </div>

              <!-- School -->
              <div class="form-group full-width">
                <label class="form-label">학교</label>
                <button @click="openSchoolSearchModal" class="school-select-button">
                  <School :size="20" />
                  <span>{{ signupForm.school || '학교 검색...' }}</span>
                  <Search :size="16" />
                </button>
              </div>
            </div>

            <!-- Social Login Options -->
            <div v-if="!signupForm.isOAuth2User" class="social-section">
              <div class="divider-with-text">
                <span>또는 소셜 계정으로 가입</span>
              </div>
              <div class="social-buttons">
                <button class="social-button google">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button class="social-button kakao">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#3C1E1E" d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.94-.123.49.18.483.376.351.156-.103 2.466-1.674 3.464-2.353.541.08 1.1.123 1.67.123 4.97 0 9-3.186 9-7.115C21 6.185 16.97 3 12 3z"/>
                  </svg>
                  카카오
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- Navigation Buttons -->
        <div class="form-navigation">
          <button
            v-if="signupStep > 1"
            @click="prevStep"
            class="nav-button secondary"
          >
            <ArrowLeft :size="20" />
            이전
          </button>

          <button
            v-if="signupStep < 3"
            @click="nextStep"
            :disabled="!canProceedToNextStep"
            class="nav-button primary"
          >
            다음
            <ArrowRight :size="20" />
          </button>

          <button
            v-if="signupStep === 3"
            @click="handleSignup"
            :disabled="!canCompleteSignup"
            class="nav-button primary submit"
          >
            가입완료
            <Check :size="20" />
          </button>
        </div>

        <!-- Login Link -->
        <div class="login-link">
          이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
        </div>
      </div>
    </div>

    <!-- School Search Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showSchoolModal" class="modal-overlay" @click="closeSchoolModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>학교 검색</h3>
              <button @click="closeSchoolModal" class="modal-close">
                <X :size="24" />
              </button>
            </div>

            <div class="modal-body">
              <div class="search-input-wrapper">
                <Search :size="20" class="search-icon" />
                <input
                  type="text"
                  v-model="schoolSearchKeyword"
                  @keyup.enter="searchSchools"
                  placeholder="학교명을 입력하세요"
                  class="search-input"
                >
              </div>

              <div v-if="isSchoolSearching" class="loading-spinner">
                <div class="spinner"></div>
                <span>검색 중...</span>
              </div>

              <div v-else-if="schoolSearchResults.length > 0" class="school-results">
                <button
                  v-for="school in schoolSearchResults"
                  :key="school.id"
                  @click="selectSchool(school)"
                  class="school-item"
                >
                  <div class="school-info">
                    <h4>{{ school.schoolName }}</h4>
                    <p>{{ school.addressRoad || school.addressJibun }}</p>
                    <span class="school-type">{{ school.sidoOffice }} | {{ school.eduOffice }}</span>
                  </div>
                  <ArrowRight :size="16" />
                </button>
              </div>

              <div v-else-if="schoolSearchKeyword && !isSchoolSearching" class="no-results">
                <School :size="48" />
                <p>검색 결과가 없습니다</p>
              </div>

              <div v-else class="search-prompt">
                <Search :size="48" />
                <p>학교명을 입력하여 검색해주세요</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Terms Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showTermsModalFlag" class="modal-overlay" @click="closeTermsModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>이용약관</h3>
              <button @click="closeTermsModal" class="modal-close">
                <X :size="24" />
              </button>
            </div>
            <div class="modal-body">
              <div class="terms-content">
                <h4>제1조 (목적)</h4>
                <p>이 약관은 PullIt(이하 "회사")이 제공하는 교육 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

                <h4>제2조 (정의)</h4>
                <p>1. "서비스"라 함은 회사가 제공하는 교육 관련 서비스를 의미합니다.</p>
                <p>2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 의미합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Privacy Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showPrivacyModalFlag" class="modal-overlay" @click="closePrivacyModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>개인정보처리방침</h3>
              <button @click="closePrivacyModal" class="modal-close">
                <X :size="24" />
              </button>
            </div>
            <div class="modal-body">
              <div class="privacy-content">
                <h4>1. 개인정보의 처리 목적</h4>
                <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>

                <h4>2. 개인정보의 처리 및 보유기간</h4>
                <p>회사는 법령에 따른 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  User,
  Mail,
  Phone,
  Lock,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  School,
  UserCheck,
  GraduationCap,
  X,
  AtSign,
  FileText,
  Shield,
  CheckCircle
} from 'lucide-vue-next'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'

const router = useRouter()

// Reactive data
const signupStep = ref(1)

// Form data
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
  subject: '',
  fullName: '', // 새로 추가된 필드
  socialProvider: '',
  socialProviderId: '',
  isOAuth2User: false
})

// Agreements
const agreements = ref({
  all: false,
  terms: false,
  privacy: false,
  marketing: false
})

// Phone verification
const verificationSent = ref(false)
const verificationCode = ref('')
const phoneVerified = ref(false)
const verificationTimer = ref(180)
let timerInterval = null

// Username check
const usernameCheckMessage = ref('')
const usernameAvailable = ref(false)

// Password strength
const passwordStrength = ref('')
const passwordStrengthClass = ref('')
const passwordStrengthText = ref('')
const passwordStrengthWidth = ref('0%')

// UI states
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const emailValid = ref(false)
const emailErrorMessage = ref('')
const showSchoolModal = ref(false)
const schoolSearchKeyword = ref('')
const schoolSearchResults = ref([])
const isSchoolSearching = ref(false)
const showTermsModalFlag = ref(false)
const showPrivacyModalFlag = ref(false)

// Birth date
const birthYear = ref('')
const birthMonth = ref('')
const birthDay = ref('')
const birthYears = ref([])
const birthMonths = ref([])
const birthDays = ref([])

// API configuration
const apiBaseUrl = 'http://localhost:8080/api'

// Computed properties
const canProceedToNextStep = computed(() => {
  switch(signupStep.value) {
    case 1:
      return agreements.value.terms && agreements.value.privacy && signupForm.value.userType
    case 2:
      return signupForm.value.isOAuth2User || phoneVerified.value
    default:
      return false
  }
})

const canCompleteSignup = computed(() => {
  return signupForm.value.fullName &&
         signupForm.value.username &&
         usernameAvailable.value &&
         signupForm.value.email &&
         emailValid.value &&
         (signupForm.value.isOAuth2User || signupForm.value.password) &&
         signupForm.value.birthDate &&
         signupForm.value.school
})

const isValidPhone = computed(() => {
  const phoneRegex = /^010-\d{4}-\d{4}$/
  return phoneRegex.test(signupForm.value.phone)
})

const passwordsMatch = computed(() => {
  return signupForm.value.password === signupForm.value.passwordConfirm
})

// Icon helpers
const getStepIcon = (step) => {
  switch(step) {
    case 1:
      return FileText
    case 2:
      return Shield
    case 3:
      return CheckCircle
    default:
      return Check
  }
}

const getStepLabel = (step) => {
  const labels = {
    1: '약관동의',
    2: '본인인증',
    3: '정보입력'
  }
  return labels[step]
}

const getSocialIcon = (provider) => {
  // Return appropriate icon based on provider
  return Check
}

// Methods
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

const initBirthDateOptions = () => {
  const currentYear = new Date().getFullYear()
  birthYears.value = Array.from({length: 100}, (_, i) => currentYear - i)
  birthMonths.value = Array.from({length: 12}, (_, i) => i + 1)
  birthDays.value = Array.from({length: 31}, (_, i) => i + 1)
}

const updateBirthDate = () => {
  if (birthYear.value && birthMonth.value && birthDay.value) {
    const month = birthMonth.value.toString().padStart(2, '0')
    const day = birthDay.value.toString().padStart(2, '0')
    signupForm.value.birthDate = `${birthYear.value}-${month}-${day}`
  }
}

const updateBirthDateAndDays = () => {
  updateBirthDate()
  if (birthYear.value && birthMonth.value) {
    const daysInMonth = new Date(birthYear.value, birthMonth.value, 0).getDate()
    birthDays.value = Array.from({length: daysInMonth}, (_, i) => i + 1)
    if (birthDay.value > daysInMonth) {
      birthDay.value = ''
      updateBirthDate()
    }
  }
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
  if (signupForm.value.phone === '010-1111-1111') {
    verificationSent.value = true
    startTimer()
    return
  }

  try {
    const response = await axios.post(`${apiBaseUrl}/auth/phone/send`, {
      phone: signupForm.value.phone
    })
    if (response.data.success) {
      verificationSent.value = true
      startTimer()
    }
  } catch (error) {
    console.error('인증번호 전송 실패:', error)
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
  if (signupForm.value.phone === '010-1111-1111' && verificationCode.value === '000000') {
    phoneVerified.value = true
    clearInterval(timerInterval)
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
    }
  } catch (error) {
    console.error('인증 실패:', error)
  }
}

const checkUsernameAvailability = async () => {
  if (!signupForm.value.username) {
    usernameCheckMessage.value = '아이디를 입력해주세요'
    usernameAvailable.value = false
    return
  }

  try {
    const response = await axios.get(`${apiBaseUrl}/users/check/username/${signupForm.value.username}`)
    const isAvailable = response?.data?.data === true
    if (isAvailable) {
      usernameCheckMessage.value = '사용 가능한 아이디입니다'
      usernameAvailable.value = true
    } else {
      usernameCheckMessage.value = '이미 사용중인 아이디입니다'
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

const checkEmailFormat = () => {
  const email = signupForm.value.email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    emailValid.value = false
    emailErrorMessage.value = ''
    return
  }

  if (!emailRegex.test(email)) {
    emailValid.value = false
    emailErrorMessage.value = '올바른 이메일 형식을 입력해주세요'
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
    passwordStrengthClass.value = 'strong'
    passwordStrengthText.value = '매우 안전'
    passwordStrengthWidth.value = '100%'
  } else if (strength >= 3) {
    passwordStrengthClass.value = 'medium'
    passwordStrengthText.value = '보통'
    passwordStrengthWidth.value = '66%'
  } else {
    passwordStrengthClass.value = 'weak'
    passwordStrengthText.value = '약함'
    passwordStrengthWidth.value = '33%'
  }

  passwordStrength.value = true
}

const openSchoolSearchModal = () => {
  showSchoolModal.value = true
  schoolSearchKeyword.value = ''
  schoolSearchResults.value = []
}

const closeSchoolModal = () => {
  showSchoolModal.value = false
  schoolSearchKeyword.value = ''
  schoolSearchResults.value = []
}

const searchSchools = async () => {
  if (!schoolSearchKeyword.value.trim()) return

  isSchoolSearching.value = true
  try {
    const response = await axios.get(`${apiBaseUrl}/schools/search?keyword=${encodeURIComponent(schoolSearchKeyword.value.trim())}`)
    schoolSearchResults.value = response.data
  } catch (error) {
    console.error('학교 검색 실패:', error)
    schoolSearchResults.value = []
  } finally {
    isSchoolSearching.value = false
  }
}

const selectSchool = (school) => {
  signupForm.value.school = school.schoolName
  closeSchoolModal()
}

const nextStep = () => {
  if (signupStep.value === 1 && signupForm.value.isOAuth2User) {
    signupStep.value = 3
  } else if (signupStep.value < 3) {
    signupStep.value++
  }
}

const prevStep = () => {
  if (signupStep.value === 3 && signupForm.value.isOAuth2User) {
    signupStep.value = 1
  } else if (signupStep.value > 1) {
    signupStep.value--
  }
}

const formatPhoneForAPI = (phone) => {
  if (!phone) return ''
  return phone.replace(/[^0-9]/g, '')
}

const handleSignup = async () => {
  if (!canCompleteSignup.value) return

  try {
    const signupData = {
      username: signupForm.value.username,
      password: signupForm.value.password || 'SOCIAL_LOGIN_' + Date.now(),
      email: signupForm.value.email,
      phone: signupForm.value.isOAuth2User ?
        formatPhoneForAPI(signupForm.value.phoneNumber || '') :
        formatPhoneForAPI(signupForm.value.phone || ''),
      fullName: signupForm.value.fullName,
      role: signupForm.value.userType.toUpperCase(),
      marketingAgree: agreements.value.marketing,
      socialProvider: signupForm.value.socialProvider,
      socialProviderId: signupForm.value.socialProviderId
    }

    if (signupForm.value.userType === 'teacher') {
      const subjectMapping = {
        'MA': { code: 'MA', name: '수학' },
        'KO': { code: 'KO', name: '국어' },
        'EN': { code: 'EN', name: '영어' },
        'SC': { code: 'SC', name: '과학' },
        'SO': { code: 'SO', name: '사회' }
      }

      const selectedSubject = subjectMapping[signupForm.value.subject] || { code: '', name: '' }

      signupData.teacherInfo = {
        schoolName: signupForm.value.school,
        areaCode: selectedSubject.code,
        areaName: selectedSubject.name
      }
    }

    if (signupForm.value.userType === 'student') {
      signupData.studentInfo = {
        classGroupId: null,
        studentNo: null,
        grade: null
      }
    }

    const response = await axios.post(`${apiBaseUrl}/auth/register`, signupData)

    if (response.status === 201 || response.data.success || response.data.code === '200') {
      alert('회원가입이 완료되었습니다!')
      router.push('/login')
    }
  } catch (error) {
    console.error('회원가입 에러:', error)
    alert('회원가입 실패: ' + (error.response?.data?.message || '알 수 없는 오류가 발생했습니다.'))
  }
}

const checkOAuth2Info = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const isOAuth2 = urlParams.get('oauth2')

  if (isOAuth2 === 'true') {
    const provider = urlParams.get('provider')
    const email = urlParams.get('email')
    const name = urlParams.get('name')
    const providerId = urlParams.get('providerId')
    const username = urlParams.get('username')

    if (email) {
      signupForm.value.email = email
      checkEmailFormat()
    }

    if (name) {
      signupForm.value.fullName = name
    }

    if (username) {
      signupForm.value.username = username
      setTimeout(() => {
        checkUsernameAvailability()
      }, 500)
    }

    signupForm.value.socialProvider = provider
    signupForm.value.socialProviderId = providerId
    signupForm.value.isOAuth2User = true
  }
}

onMounted(() => {
  checkOAuth2Info()
  initBirthDateOptions()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
/* Base styles */
.signup-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

/* Animated background */
.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: float 15s infinite ease-in-out;
}

.sphere-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #667eea, #4c1d95);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.sphere-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  bottom: -100px;
  right: -100px;
  animation-delay: 5s;
}

.sphere-3 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* Container */
.signup-container {
  position: relative;
  z-index: 1;
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Progress bar */
.progress-container {
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8));
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* Main card */
.signup-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Step indicators */
.step-indicators {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  position: relative;
}

.step-indicators::before {
  content: '';
  position: absolute;
  top: 24px;
  left: 60px;
  right: 60px;
  height: 2px;
  background: #e5e7eb;
  z-index: 0;
}

.step-indicator {
  position: relative;
  z-index: 1;
  text-align: center;
  flex: 1;
}

.step-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 0.5rem;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.3s ease;
}

.step-indicator.active .step-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transform: scale(1.1);
}

.step-indicator.completed .step-icon {
  background: #10b981;
  color: white;
}

.step-indicator.oauth-skipped .step-icon {
  background: #6366f1;
  color: white;
}

.step-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.step-indicator.active .step-label {
  color: #667eea;
  font-weight: 600;
}

/* Step content */
.form-step {
  animation: slideIn 0.4s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.step-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

/* OAuth info */
.oauth-info, .oauth-connected {
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border: 1px solid #667eea30;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.oauth-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #667eea;
  font-weight: 500;
}

/* Terms section */
.terms-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  cursor: pointer;
  position: relative;
  padding-left: 2rem;
}

.checkbox-group.main-checkbox {
  font-weight: 600;
  margin-bottom: 1rem;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  position: absolute;
  left: 0;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.checkbox-input:checked ~ .checkbox-custom {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: #667eea;
}

.checkbox-custom::after {
  content: '';
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-input:checked ~ .checkbox-custom::after {
  display: block;
}

.checkbox-label {
  flex: 1;
  color: #374151;
  font-size: 0.95rem;
}

.required {
  color: #dc2626;
  font-weight: 500;
}

.optional {
  color: #6b7280;
  font-weight: 500;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  margin-left: auto;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 1rem 0;
}

.terms-list {
  margin-top: 1rem;
}

/* Role selection */
.role-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.role-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.role-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.1);
}

.role-card.active {
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-color: #667eea;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.15);
}

.role-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.3s ease;
}

.role-card.active .role-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.role-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.role-card p {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Form elements */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.with-icon {
  padding-left: 2.75rem;
}

.form-input.valid {
  border-color: #10b981;
}

.form-input.invalid {
  border-color: #ef4444;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.validation-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.validation-icon.success {
  color: #10b981;
}

.validation-icon.error {
  color: #ef4444;
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.form-hint.error {
  color: #ef4444;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  width: 33%;
  background: #ef4444;
}

.strength-fill.medium {
  width: 66%;
  background: #f59e0b;
}

.strength-fill.strong {
  width: 100%;
  background: #10b981;
}

.strength-text {
  font-size: 0.75rem;
  color: #6b7280;
  display: inline-block;
  margin-top: 0.25rem;
}

/* Phone verification */
.input-with-button {
  display: flex;
  gap: 0.75rem;
}

.input-with-button .input-wrapper {
  flex: 1;
}

.verify-button {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verify-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.verify-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verify-button.verified {
  background: #10b981;
}

.verification-input-wrapper {
  position: relative;
}

.verification-input {
  text-align: center;
  font-size: 1.25rem;
  letter-spacing: 0.5rem;
  font-weight: 600;
}

.timer {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #667eea;
  font-weight: 600;
  font-size: 0.875rem;
}

.verify-complete-button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.verify-complete-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.verify-complete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-message {
  background: #10b98115;
  border: 1px solid #10b98130;
  color: #10b981;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

/* Form grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

/* Date selects */
.date-selects {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-select.full-width {
  grid-column: 1 / -1;
}

/* School select */
.school-select-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  color: #374151;
}

.school-select-button:hover {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.school-select-button svg:last-child {
  margin-left: auto;
  color: #9ca3af;
}

/* Social section */
.social-section {
  margin-top: 2rem;
}

.divider-with-text {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider-with-text::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider-with-text span {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.social-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9rem;
}

.social-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.social-button.google:hover {
  border-color: #4285f4;
  background: #4285f410;
}

.social-button.kakao:hover {
  border-color: #fee500;
  background: #fee50010;
}

/* Navigation buttons */
.form-navigation {
  display: flex;
  gap: 0.75rem;
  margin-top: 2rem;
}

.nav-button {
  flex: 1;
  padding: 0.875rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.nav-button.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.nav-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.nav-button.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-button.secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.nav-button.secondary:hover {
  background: #e5e7eb;
}

.nav-button.submit {
  background: linear-gradient(135deg, #10b981, #059669);
}

/* Login link */
.login-link {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.9rem;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.school-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.school-item {
  width: 100%;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.school-item:hover {
  background: white;
  border-color: #667eea;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
}

.school-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.school-info p {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.school-type {
  font-size: 0.75rem;
  color: #9ca3af;
}

.no-results, .search-prompt {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.no-results svg, .search-prompt svg {
  margin: 0 auto 1rem;
  color: #d1d5db;
}

.terms-content h4,
.privacy-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.terms-content h4:first-child,
.privacy-content h4:first-child {
  margin-top: 0;
}

.terms-content p,
.privacy-content p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content {
  transform: scale(0.9);
}

.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 640px) {
  .signup-container {
    padding: 1rem 0.5rem;
  }

  .signup-card {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .role-cards {
    grid-template-columns: 1fr;
  }

  .social-buttons {
    grid-template-columns: 1fr;
  }

  .date-selects {
    grid-template-columns: 1fr;
  }
}
</style>
