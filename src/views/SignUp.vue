<template>
  <div class="user-signup-container">
    <div class="signup-card">
      <h2 class="text-center mb-4">회원가입</h2>

      <!-- 단계 표시 -->
      <div class="step-indicator">
                    <div class="step" :class="{active: signupStep === 1, completed: signupStep > 1}">
              <div class="step-content">
                1. 약관동의/<br/>유형선택
              </div>
            </div>
                    <div class="step" :class="{active: signupStep === 2, completed: signupStep > 2}">
              <div class="step-content">2. 휴대폰 인증</div>
            </div>
                    <div class="step" :class="{active: signupStep === 3}">
              <div class="step-content">3. 정보 입력</div>
            </div>
      </div>

      <!-- Step 1: 약관동의 및 가입유형 선택 -->
      <div v-if="signupStep === 1">
        <div class="mb-4">
          <h5 class="section-title">이용약관 동의</h5>
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="agreeAll"
              @change="toggleAllAgreements"
              v-model="agreements.all"
            >
            <label class="form-check-label fw-bold" for="agreeAll">
              전체 동의
            </label>
          </div>
          <hr>
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="agreeTerms"
              v-model="agreements.terms"
            >
            <label class="form-check-label" for="agreeTerms">
              [필수] 이용약관 동의
              <a href="#" class="agreement-link">보기</a>
            </label>
          </div>
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="agreePrivacy"
              v-model="agreements.privacy"
            >
            <label class="form-check-label" for="agreePrivacy">
              [필수] 개인정보 수집 및 이용 동의
              <a href="#" class="agreement-link">보기</a>
            </label>
          </div>
          <div class="form-check mb-4">
            <input
              class="form-check-input"
              type="checkbox"
              id="agreeMarketing"
              v-model="agreements.marketing"
            >
            <label class="form-check-label" for="agreeMarketing">
              [선택] 마케팅 정보 수신 동의
            </label>
          </div>
        </div>

        <div class="mb-4">
          <h5 class="section-title">가입 유형 선택</h5>
          <div class="row">
            <div class="col-6">
              <div
                class="card text-center p-3"
                :class="{'border-primary': signupForm.userType === 'teacher'}"
                @click="signupForm.userType = 'teacher'"
                style="cursor: pointer;"
              >
                <div class="icon-wrapper">
                  <img src="@/assets/icons/teacher-icon.png" alt="선생님" class="user-icon">
                </div>
                <h5 class="user-type-text">선생님</h5>
              </div>
            </div>
            <div class="col-6">
              <div
                class="card text-center p-3 student-card"
                :class="{'border-primary': signupForm.userType === 'student'}"
                @click="signupForm.userType = 'student'"
                style="cursor: pointer;"
              >
                <div class="icon-wrapper">
                  <img src="@/assets/icons/student-icon.png" alt="학생" class="user-icon">
                </div>
                <h5 class="user-type-text">학생</h5>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="nextStep"
          class="btn btn-primary w-100"
          :disabled="!agreements.terms || !agreements.privacy || !signupForm.userType"
        >
          다음
        </button>
      </div>

      <!-- Step 2: 휴대폰 인증 -->
      <div v-if="signupStep === 2">
        <h5 class="section-title">휴대폰 인증</h5>
        <div class="mb-3">
          <label for="phone" class="form-label">휴대폰 번호</label>
          <div class="phone-input-wrapper">
            <input
              type="tel"
              class="form-control phone-input"
              id="phone"
              v-model="signupForm.phone"
              placeholder="010-0000-0000"
              maxlength="13"
              :disabled="phoneVerified"
            >
            <button
              class="btn btn-outline-primary send-btn"
              type="button"
              @click="sendVerificationCode"
              :disabled="!isValidPhone || phoneVerified"
            >
              {{ phoneVerified ? '인증완료' : (verificationSent ? '재전송' : '인증번호 전송') }}
            </button>
          </div>
        </div>

        <div v-if="verificationSent" class="mb-3">
          <label for="verificationCode" class="form-label">인증번호</label>
          <div class="verification-input-wrapper">
            <input
              type="text"
              class="form-control verification-input"
              id="verificationCode"
              v-model="verificationCode"
              placeholder="인증번호 6자리"
              maxlength="6"
              :disabled="phoneVerified"
            >
            <button
              class="btn verify-btn"
              :class="phoneVerified ? 'btn-success' : 'btn-outline-success'"
              type="button"
              @click="verifyPhone"
              :disabled="phoneVerified"
            >
              {{ phoneVerified ? '인증완료' : '확인' }}
            </button>
          </div>
          <small v-if="!phoneVerified" class="text-muted">{{ verificationTimer }}초 남음</small>
          <small v-if="phoneVerified" class="text-success">✓ 휴대폰 인증이 완료되었습니다.</small>
        </div>

        <div class="d-flex gap-2">
          <button @click="prevStep" class="btn btn-secondary flex-fill">이전</button>
          <button
            @click="nextStep"
            class="btn btn-primary flex-fill"
            :disabled="!phoneVerified"
          >
            다음
          </button>
        </div>
      </div>

      <!-- Step 3: 정보 입력 -->
      <div v-if="signupStep === 3">
        <h5 class="section-title">회원 정보 입력</h5>
        <form @submit.prevent="handleSignup">
          <div class="mb-3">
            <label for="username" class="form-label">아이디</label>
            <div class="username-input-wrapper">
              <input
                type="text"
                class="form-control username-input"
                id="username"
                v-model="signupForm.username"
                placeholder="영문, 숫자 조합 4-20자"
                required
              >
              <button
                class="btn username-check-btn"
                :class="usernameAvailable ? 'btn-success' : 'btn-outline-primary'"
                type="button"
                @click="checkUsername"
                :disabled="usernameAvailable"
              >
                {{ usernameAvailable ? '확인완료' : '중복확인' }}
              </button>
            </div>
            <small v-if="usernameCheckResult" :class="usernameAvailable ? 'text-success' : 'text-danger'">
              {{ usernameCheckResult }}
            </small>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">비밀번호</label>
            <div class="password-input-wrapper">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control password-input"
                id="password"
                v-model="signupForm.password"
                @input="checkPasswordStrength"
                placeholder="영문(대+소), 숫자, 특수문자 조합 9-20자"
                required
              >
              <button
                type="button"
                class="btn password-toggle-btn"
                @click="togglePasswordVisibility"
                :title="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
              >
                <i class="password-eye-icon" :class="showPassword ? 'eye-slash' : 'eye'"></i>
              </button>
            </div>
            <div v-if="passwordStrength" class="mt-2">
              <div class="password-strength" :class="passwordStrengthClass"></div>
              <small :class="passwordStrengthTextClass">{{ passwordStrengthText }}</small>
            </div>
          </div>

          <div class="mb-3">
            <label for="passwordConfirm" class="form-label">비밀번호 확인</label>
            <div class="password-input-wrapper">
              <input
                :type="showPasswordConfirm ? 'text' : 'password'"
                class="form-control password-input"
                id="passwordConfirm"
                v-model="signupForm.passwordConfirm"
                required
              >
              <button
                type="button"
                class="btn password-toggle-btn"
                @click="togglePasswordConfirmVisibility"
                :title="showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'"
              >
                <i class="password-eye-icon" :class="showPasswordConfirm ? 'eye-slash' : 'eye'"></i>
              </button>
            </div>
            <small v-if="signupForm.passwordConfirm && signupForm.password !== signupForm.passwordConfirm" class="text-danger">
              비밀번호가 일치하지 않습니다.
            </small>
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">이메일</label>
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
            <small v-if="emailErrorMessage" class="text-danger">{{ emailErrorMessage }}</small>
            <small v-else-if="emailValid" class="text-success">✓ 올바른 이메일 형식입니다.</small>
          </div>

          <div class="mb-3">
            <label for="birthDate" class="form-label">생년월일</label>
            <input
              type="date"
              class="form-control"
              id="birthDate"
              v-model="signupForm.birthDate"
              required
            >
          </div>

          <div class="mb-3">
            <label for="school" class="form-label">학교 정보</label>
            <div class="school-input-wrapper">
              <input
                type="text"
                class="form-control school-input"
                id="school"
                v-model="signupForm.school"
                @input="onSchoolInput"
                placeholder="학교명을 입력하세요"
                required
              >
              <button
                class="btn btn-outline-primary search-btn"
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



          <div class="d-flex gap-2">
            <button type="button" @click="prevStep" class="btn btn-secondary flex-fill">이전</button>
            <button type="submit" class="btn btn-primary flex-fill">가입완료</button>
          </div>
        </form>
      </div>

      <!-- 학교 검색 모달을 form 밖으로 이동 -->
      <div v-if="showSchoolModal" class="school-modal-overlay" @click="closeSchoolModal">
        <div class="school-modal" @click.stop>
          <div class="school-modal-header">
            <h5>학교 검색</h5>
            <button type="button" class="btn-close" @click="closeSchoolModal"></button>
          </div>
          <div class="school-modal-body">
            <div class="search-input-group mb-3">
              <input
                type="text"
                class="form-control"
                v-model="schoolSearchKeyword"
                @input="searchSchools"
                placeholder="학교명을 입력하세요"
              >
              <button
                class="btn btn-primary"
                @click="searchSchools"
                :disabled="!schoolSearchKeyword.trim()"
              >
                검색
              </button>
            </div>

            <div v-if="isSchoolSearching" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">검색 중...</span>
              </div>
            </div>

            <div v-else-if="schoolSearchResults.length > 0" class="school-results">
              <div
                v-for="school in schoolSearchResults"
                :key="school.schoolCode"
                class="school-item"
                @click="selectSchool(school)"
              >
                <div class="school-name">{{ school.schoolName }}</div>
                <div class="school-address">{{ school.address }}</div>
                <div class="school-region">{{ school.region }} {{ school.district }}</div>
              </div>
            </div>

            <div v-else-if="schoolSearchKeyword && !isSchoolSearching" class="text-center text-muted">
              검색 결과가 없습니다.
            </div>

            <div v-else class="text-center text-muted">
              학교명을 입력하고 검색해주세요.
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-3">
        <div class="signup-navigation">
          <router-link to="/" class="nav-link">HOME</router-link>
          <span class="nav-separator">|</span>
          <router-link to="/login" class="nav-link">로그인</router-link>
          <span class="nav-separator">|</span>
          <a href="#" class="nav-link">아이디찾기</a>
          <span class="nav-separator">|</span>
          <a href="#" class="nav-link">비밀번호찾기</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

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
  birthDate: '',
  school: ''
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
const usernameCheckResult = ref('')
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

// API 설정
const apiBaseUrl = 'http://localhost:8080/api'

// 계산된 속성
const isValidPhone = computed(() => {
  const phoneRegex = /^010-\d{4}-\d{4}$/
  return phoneRegex.test(signupForm.value.phone)
})

const passwordStrengthTextClass = computed(() => {
  if (passwordStrengthClass.value.includes('strong')) return 'text-success'
  if (passwordStrengthClass.value.includes('medium')) return 'text-warning'
  return 'text-danger'
})

// 메서드들
const toggleAllAgreements = () => {
  agreements.value.terms = agreements.value.all
  agreements.value.privacy = agreements.value.all
  agreements.value.marketing = agreements.value.all
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

const checkUsername = async () => {
  if (!signupForm.value.username) {
    usernameCheckResult.value = '아이디를 입력해주세요.'
    return
  }

  try {
    const response = await axios.get(`${apiBaseUrl}/users/check/username/${signupForm.value.username}`)

    if (response.data.success) {
      usernameCheckResult.value = '사용 가능한 아이디입니다.'
      usernameAvailable.value = true
    } else {
      usernameCheckResult.value = '이미 사용중인 아이디입니다.'
      usernameAvailable.value = false
    }
  } catch {
    usernameCheckResult.value = '중복 확인 실패'
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
    passwordStrengthClass.value = 'strength-strong'
    passwordStrengthText.value = '보안 우수'
  } else if (strength >= 3) {
    passwordStrengthClass.value = 'strength-medium'
    passwordStrengthText.value = '보안 양호'
  } else {
    passwordStrengthClass.value = 'strength-weak'
    passwordStrengthText.value = '보안 취약'
  }

  passwordStrength.value = true
}

const onSchoolInput = () => {
  // 학교 입력 시 검색 결과 초기화
  schoolSearchResults.value = []
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
  if (!schoolSearchKeyword.value.trim()) {
    return
  }

  isSchoolSearching.value = true

  try {
    console.log('학교 검색 시작 (모의 데이터):', schoolSearchKeyword.value.trim())

    // 모의 데이터로 학교 검색 (나중에 디비 연동 예정)
    const result = getMockSchools(schoolSearchKeyword.value.trim())
    console.log('검색 결과:', result)
    schoolSearchResults.value = result
  } catch (error) {
    console.error('학교 검색 실패:', error)
    schoolSearchResults.value = []
  } finally {
    isSchoolSearching.value = false
  }
}

const selectSchool = (school) => {
  signupForm.value.school = school.schoolName || school.name
  closeSchoolModal()
}

const getMockSchools = (keyword) => {
  // 모의 중학교 데이터 (나중에 디비 연동 예정)
  const mockSchools = [
    { schoolCode: '1', schoolName: '서울중학교', address: '서울특별시 강남구 테헤란로 123', region: '서울특별시', district: '강남구' },
    { schoolCode: '2', schoolName: '부산중학교', address: '부산광역시 해운대구 해운대로 456', region: '부산광역시', district: '해운대구' },
    { schoolCode: '3', schoolName: '대구중학교', address: '대구광역시 중구 동성로 789', region: '대구광역시', district: '중구' },
    { schoolCode: '4', schoolName: '인천중학교', address: '인천광역시 남동구 구월로 321', region: '인천광역시', district: '남동구' },
    { schoolCode: '5', schoolName: '광주중학교', address: '광주광역시 서구 상무대로 654', region: '광주광역시', district: '서구' },
    { schoolCode: '6', schoolName: '대전중학교', address: '대전광역시 유성구 대학로 987', region: '대전광역시', district: '유성구' },
    { schoolCode: '7', schoolName: '울산중학교', address: '울산광역시 남구 삼산로 147', region: '울산광역시', district: '남구' },
    { schoolCode: '8', schoolName: '세종중학교', address: '세종특별자치시 한누리대로 258', region: '세종특별자치시', district: '세종시' },
    { schoolCode: '9', schoolName: '수원중학교', address: '경기도 수원시 영통구 창룡대로 369', region: '경기도', district: '수원시' },
    { schoolCode: '10', schoolName: '성남중학교', address: '경기도 성남시 분당구 판교로 741', region: '경기도', district: '성남시' },
    { schoolCode: '11', schoolName: '용인중학교', address: '경기도 용인시 기흥구 동백로 852', region: '경기도', district: '용인시' },
    { schoolCode: '12', schoolName: '부천중학교', address: '경기도 부천시 원미구 상동로 963', region: '경기도', district: '부천시' },
    { schoolCode: '13', schoolName: '안산중학교', address: '경기도 안산시 단원구 중앙대로 159', region: '경기도', district: '안산시' },
    { schoolCode: '14', schoolName: '안양중학교', address: '경기도 안양시 만안구 안양로 753', region: '경기도', district: '안양시' },
    { schoolCode: '15', schoolName: '평택중학교', address: '경기도 평택시 평택로 951', region: '경기도', district: '평택시' }
  ]

  if (!keyword) return mockSchools

  const lowerKeyword = keyword.toLowerCase()
  return mockSchools.filter(school =>
    school.schoolName.toLowerCase().includes(lowerKeyword) ||
    school.region.toLowerCase().includes(lowerKeyword) ||
    school.district.toLowerCase().includes(lowerKeyword) ||
    school.address.toLowerCase().includes(lowerKeyword)
  )
}

const handleSignup = async () => {
  if (signupForm.value.password !== signupForm.value.passwordConfirm) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  if (!usernameAvailable.value) {
    alert('아이디 중복 확인을 해주세요.')
    return
  }

  if (!emailValid.value) {
    alert('올바른 이메일 형식을 입력해주세요.')
    return
  }

  if (!signupForm.value.school.trim()) {
    alert('학교 정보를 입력해주세요.')
    return
  }

  try {
    // OAuth2 소셜 정보 확인
    const urlParams = new URLSearchParams(window.location.search)
    const isOAuth2Signup = urlParams.get('oauth2') === 'true'
    const socialInfo = isOAuth2Signup ? JSON.parse(sessionStorage.getItem('oauth2_social_info') || '{}') : null

    const signupData = {
      username: signupForm.value.username,
      password: signupForm.value.password,
      email: signupForm.value.email,
      phone: signupForm.value.phone,
      fullName: signupForm.value.username, // 임시로 username을 fullName으로 사용
      role: signupForm.value.userType.toUpperCase(),
      marketingAgree: agreements.value.marketing
    }

    // OAuth2 소셜 정보가 있으면 추가
    if (socialInfo && socialInfo.provider) {
      signupData.socialProvider = socialInfo.provider
      signupData.socialProviderId = socialInfo.providerId
      // 소셜 로그인에서 받은 이름이 있으면 사용
      if (socialInfo.name) {
        signupData.fullName = socialInfo.name
      }
    }

    const response = await axios.post(`${apiBaseUrl}/auth/register`, signupData)

    if (response.data.success) {
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')

      // OAuth2 소셜 정보 정리
      if (isOAuth2Signup) {
        sessionStorage.removeItem('oauth2_social_info')
      }

      router.push('/login')
      resetSignupForm()
    }
  } catch (error) {
    alert('회원가입 실패: ' + (error.response?.data?.message || '알 수 없는 오류'))
  }
}

const nextStep = () => {
  if (signupStep.value < 3) {
    signupStep.value++
  }
}

const prevStep = () => {
  if (signupStep.value > 1) {
    signupStep.value--
  }
}

const resetSignupForm = () => {
  signupStep.value = 1
  signupForm.value = {
    userType: '',
    username: '',
    password: '',
    passwordConfirm: '',
    email: '',
    phone: '',
    birthDate: '',
    school: ''
  }
  agreements.value = {
    all: false,
    terms: false,
    privacy: false,
    marketing: false
  }
  phoneVerified.value = false
  usernameAvailable.value = false
  showPassword.value = false
  showPasswordConfirm.value = false
  emailValid.value = false
  emailErrorMessage.value = ''
  showSchoolModal.value = false
  schoolSearchResults.value = []
}

// 감시자
watch(() => signupForm.value.phone, () => {
  formatPhone()
})

// 개별 약관 동의 상태 변화 감시 (전체 동의는 제외)
watch([
  () => agreements.value.terms,
  () => agreements.value.privacy,
  () => agreements.value.marketing
], () => {
  // 모든 필수/선택 약관이 체크되면 전체 동의도 체크
  if (agreements.value.terms && agreements.value.privacy && agreements.value.marketing) {
    agreements.value.all = true
  } else {
    agreements.value.all = false
  }
})

// 생명주기 훅
onMounted(() => {
  // JWT 토큰 확인
  const token = localStorage.getItem('jwt_token')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // OAuth2 소셜 정보 확인 및 폼 자동 입력
  checkOAuth2SocialInfo()
})

// OAuth2 소셜 정보 확인 및 폼 자동 입력
const checkOAuth2SocialInfo = () => {
  // URL 쿼리에서 소셜 정보 확인
  const urlParams = new URLSearchParams(window.location.search)
  const isOAuth2Signup = urlParams.get('oauth2') === 'true'

  if (isOAuth2Signup) {
    // 세션 스토리지에서 소셜 정보 가져오기
    const sessionSocialInfo = sessionStorage.getItem('oauth2_social_info')
    if (sessionSocialInfo) {
      try {
        const socialInfo = JSON.parse(sessionSocialInfo)
        console.log('OAuth2 소셜 정보 발견:', socialInfo)

        // 폼에 소셜 정보 자동 입력
        if (socialInfo.email) {
          signupForm.value.email = socialInfo.email
          checkEmailFormat() // 이메일 유효성 검사 실행
        }

        if (socialInfo.name) {
          // 이름을 사용자명으로 자동 생성 (중복 확인 필요)
          const suggestedUsername = generateUsernameFromName(socialInfo.name)
          signupForm.value.username = suggestedUsername
        }

        // OAuth2 사용자임을 표시
        showOAuth2Info(socialInfo)

      } catch (e) {
        console.error('OAuth2 소셜 정보 파싱 실패:', e)
      }
    }
  }
}

// 이름으로부터 사용자명 생성
const generateUsernameFromName = (name) => {
  // 한글 이름을 영문으로 변환 (간단한 매핑)
  const nameMapping = {
    '김': 'kim', '이': 'lee', '박': 'park', '최': 'choi', '정': 'jung',
    '강': 'kang', '조': 'cho', '윤': 'yoon', '장': 'jang', '임': 'lim'
  }

  let username = name
  // 한글을 영문으로 변환
  Object.entries(nameMapping).forEach(([korean, english]) => {
    username = username.replace(new RegExp(korean, 'g'), english)
  })

  // 특수문자 제거 및 영문/숫자만 허용
  username = username.replace(/[^a-zA-Z0-9]/g, '')

  // 길이 조정 (4-20자)
  if (username.length > 20) {
    username = username.substring(0, 20)
  } else if (username.length < 4) {
    username = username + '123'
  }

  return username.toLowerCase()
}

// OAuth2 정보 표시
const showOAuth2Info = (socialInfo) => {
  // OAuth2 사용자임을 알리는 UI 표시
  const oauth2Info = document.createElement('div')
  oauth2Info.className = 'alert alert-info oauth2-info'
  oauth2Info.innerHTML = `
    <i class="fas fa-info-circle"></i>
    <strong>소셜 계정 연동</strong><br>
    ${socialInfo.provider} 계정으로 가입 중입니다.
    이메일과 사용자명이 자동으로 입력되었습니다.
  `

  // 회원가입 카드 상단에 삽입
  const signupCard = document.querySelector('.signup-card')
  if (signupCard) {
    signupCard.insertBefore(oauth2Info, signupCard.firstChild)
  }
}

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.user-signup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 20px;
}

.signup-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 600px;
  padding: 48px;
  position: relative;
}

.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 12px;
}

.step {
  flex: 1;
  text-align: center;
  padding: 20px 15px;
  background: #f8fafc;
  position: relative;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.step-content {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
  line-height: 1.4;
}

.step.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.step.active .step-content {
  color: white;
}

.step.completed {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #64748b;
}

.step.completed .step-content {
  color: #64748b;
}

.password-strength {
  height: 5px;
  border-radius: 3px;
  transition: all 0.3s;
}

.strength-weak {
  background: #dc3545;
  width: 33%;
}

.strength-medium {
  background: #ffc107;
  width: 66%;
}

.strength-strong {
  background: #198754;
  width: 100%;
}

.card {
  transition: all 0.3s ease;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.card.border-primary {
  border-color: #3b82f6 !important;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.card.border-primary:hover {
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}

.signup-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-link {
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #0d6efd;
  text-decoration: underline;
}

.nav-separator {
  color: #d1d5db;
  font-size: 12px;
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease;
}

/* 학생 아이콘만 세로 크기 조정 */
.student-card .user-icon {
  height: calc(100% - 10px);
}

.card:hover .user-icon {
  transform: scale(1.05);
}

.user-type-text {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0;
  color: #495057;
}

.section-title {
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

/* Form Styles */
.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
  display: block;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.form-check-label {
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agreement-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  margin-left: 8px;
}

.agreement-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.form-check-input {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
}

.form-check-input:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-outline-primary {
  background: transparent;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.btn-outline-primary:hover {
  background: #3b82f6;
  color: white;
}

.btn-outline-success {
  background: transparent;
  color: #10b981;
  border: 2px solid #10b981;
}

.btn-outline-success:hover {
  background: #10b981;
  color: white;
}

/* 휴대폰 인증 스타일 */
.phone-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.phone-input {
  flex: 1;
}

.send-btn {
  white-space: nowrap;
  min-width: 120px;
}

.verification-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.verification-input {
  flex: 1;
}

.verify-btn {
  white-space: nowrap;
  min-width: 80px;
}

/* 아이디 중복확인 스타일 */
.username-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.username-input {
  flex: 1;
}

.username-check-btn {
  white-space: nowrap;
  min-width: 100px;
}

/* 학교 검색 스타일 */
.school-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.school-input {
  flex: 1;
}

.search-btn {
  white-space: nowrap;
  min-width: 100px;
}

/* 학교 검색 모달 스타일 */
.school-modal-overlay {
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

.school-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.school-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.school-modal-header h5 {
  margin: 0;
  font-weight: 600;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #374151;
}

.school-modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.search-input-group {
  display: flex;
  gap: 12px;
}

.search-input-group .form-control {
  flex: 1;
}

.school-results {
  max-height: 400px;
  overflow-y: auto;
}

.school-item {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.school-item:hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.school-name {
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 4px;
}

.school-address {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
}

.school-region {
  font-size: 12px;
  color: #9ca3af;
}

.spinner-border {
  width: 2rem;
  height: 2rem;
}

/* 비밀번호 입력 스타일 */
.password-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
}

.password-input {
  flex: 1;
  padding-right: 50px;
}

.password-toggle-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 8px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  min-width: auto;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.password-toggle-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.password-eye-icon {
  width: 20px;
  height: 20px;
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.password-eye-icon.eye {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /%3E%3C/svg%3E");
}

.password-eye-icon.eye-slash {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0 8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21' /%3E%3C/svg%3E");
}

/* OAuth2 소셜 계정 연동 정보 스타일 */
.oauth2-info {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  color: white;
  border-radius: 12px;
  margin-bottom: 24px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.oauth2-info i {
  margin-right: 8px;
  font-size: 18px;
}

.oauth2-info strong {
  font-weight: 600;
}

/* OAuth2 사용자용 추가 스타일 */
.oauth2-signup .form-control[readonly] {
  background-color: #f8fafc;
  border-color: #cbd5e0;
  color: #4a5568;
}

.oauth2-signup .form-control[readonly]:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
</style>
