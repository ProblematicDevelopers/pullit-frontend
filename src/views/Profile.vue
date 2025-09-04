<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card shadow-lg border-0">
            <div class="card-header bg-primary text-white text-center py-4">
              <h3 class="mb-0 fw-bold">
                내 프로필
              </h3>
            </div>

            <div class="card-body p-4 p-md-5">
              <!-- 프로필 정보 표시 -->
              <div v-if="!isEditing" class="profile-info">
                <!-- 프로필 이미지 섹션 -->
                <div class="text-center mb-4">
                  <div class="profile-avatar">
                    <div class="avatar-placeholder">
                      <img 
                        :src="roleIconSrc" 
                        :alt="userTypeDisplay"
                        class="role-icon"
                      >
                    </div>
                  </div>
                  <h5 class="mt-3 mb-1 fw-bold">{{ userInfo.fullName || userInfo.username }}</h5>
                  <span class="badge bg-primary">{{ userTypeDisplay }}</span>
                </div>

                <!-- 기본 정보 -->
                <div class="info-section mb-4">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-person me-2"></i>기본 정보
                  </h6>
                  <div class="row g-3">
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted">아이디</label>
                      <p class="mb-0 info-text">{{ userInfo.username }}</p>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted">이름</label>
                      <p class="mb-0 info-text">{{ userInfo.fullName }}</p>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted">이메일</label>
                      <p class="mb-0 info-text">{{ userInfo.email }}</p>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted">휴대폰</label>
                      <p class="mb-0 info-text">{{ formatPhone(userInfo.phone) }}</p>
                    </div>
                  </div>
                </div>

                <!-- 역할별 정보 -->
                <div class="info-section mb-4" v-if="userInfo.role === 'TEACHER'">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-mortarboard me-2"></i>선생님 정보
                  </h6>
                  <div class="row g-3">
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted">학교</label>
                      <p class="mb-0 info-text">{{ teacherInfo.schoolName || '미설정' }}</p>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted">담당 과목</label>
                      <p class="mb-0 info-text">{{ teacherInfo.areaName || '미설정' }}</p>
                    </div>
                  </div>
                </div>

                <div class="info-section mb-4" v-if="userInfo.role === 'STUDENT'">
                  <h6 class="section-title mb-3">
                    <i class="bi bi-book me-2"></i>학생 정보
                  </h6>
                  <div class="row g-3">
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted small">학교</label>
                      <p class="mb-0">{{ studentInfo.schoolName || '미설정' }}</p>
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold text-muted small">학년</label>
                      <p class="mb-0">{{ studentInfo.grade?.name || '미설정' }}</p>
                    </div>
                    <div class="col-6" v-if="studentInfo.classGroupId">
                      <label class="form-label fw-bold text-muted small">반</label>
                      <p class="mb-0">{{ studentInfo.className || '미설정' }}</p>
                    </div>
                    <div class="col-6" v-if="studentInfo.studentNo">
                      <label class="form-label fw-bold text-muted small">학번</label>
                      <p class="mb-0">{{ studentInfo.studentNo }}</p>
                    </div>
                  </div>
                </div>



                <!-- 편집 버튼 -->
                <div class="d-grid gap-2">
                  <button @click="startEditing" class="btn btn-primary">
                    <i class="bi bi-pencil me-2"></i> 정보 수정
                  </button>
                  <button @click="changePassword" class="btn btn-outline-secondary">
                    <i class="bi bi-key me-2"></i>비밀번호 변경
                  </button>
                </div>
              </div>

              <!-- 프로필 편집 폼 -->
              <div v-else class="profile-edit">
                <form @submit.prevent="saveProfile">
                  <!-- 기본 정보 편집 -->
                  <div class="mb-4">
                    <h6 class="section-title mb-3">
                      <i class="bi bi-person me-2"></i>기본 정보
                    </h6>
                    <div class="row g-3">
                      <div class="col-12">
                        <label for="editFullName" class="form-label fw-bold">이름</label>
                        <input
                          type="text"
                          class="form-control"
                          id="editFullName"
                          v-model="editForm.fullName"
                          readonly
                          disabled
                        >
                      </div>
                      <div class="col-12">
                        <label for="editEmail" class="form-label fw-bold">이메일</label>
                        <input
                          type="email"
                          class="form-control"
                          id="editEmail"
                          v-model="editForm.email"
                          required
                        >
                      </div>
                      <div class="col-12">
                        <label for="editPhone" class="form-label fw-bold">휴대폰</label>
                        <input
                          type="tel"
                          class="form-control"
                          id="editPhone"
                          v-model="editForm.phone"
                          readonly
                          disabled
                        >
                      </div>
                    </div>
                  </div>

                  <!-- 역할별 정보 편집 -->
                  <div class="mb-4" v-if="userInfo.role === 'TEACHER'">
                    <h6 class="section-title mb-3">
                      <i class="bi bi-mortarboard me-2"></i>선생님 정보
                    </h6>
                    <div class="row g-3">
                      <div class="col-12">
                        <label for="editSchool" class="form-label fw-bold">학교</label>
                        <div class="input-group">
                          <input
                            type="text"
                            class="form-control"
                            id="editSchool"
                            v-model="editForm.school"
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
                      </div>
                      <div class="col-12">
                        <label for="editSubject" class="form-label fw-bold">담당 과목</label>
                        <select
                          class="form-select"
                          id="editSubject"
                          v-model="editForm.subject"
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
                    </div>
                  </div>

                  <div class="mb-4" v-if="userInfo.role === 'STUDENT'">
                    <h6 class="section-title mb-3">
                      <i class="bi bi-book me-2"></i>학생 정보
                    </h6>
                    <div class="row g-3">
                      <div class="col-12">
                        <label for="editGrade" class="form-label fw-bold">학년 (선택사항)</label>
                        <select
                          class="form-select"
                          id="editGrade"
                          v-model="editForm.grade"
                        >
                          <option :value="null">학년을 선택하세요</option>
                          <option :value="{ code: '07', name: '중학교 1학년' }">중학교 1학년</option>
                          <option :value="{ code: '08', name: '중학교 2학년' }">중학교 2학년</option>
                          <option :value="{ code: '09', name: '중학교 3학년' }">중학교 3학년</option>
                        </select>
                      </div>
                      <div class="col-12">
                        <label for="editStudentSchool" class="form-label fw-bold">학교</label>
                        <div class="input-group">
                          <input
                            type="text"
                            class="form-control"
                            id="editStudentSchool"
                            v-model="editForm.school"
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
                      </div>
                    </div>
                  </div>

                  <!-- 버튼 -->
                  <div class="d-flex gap-3">
                    <button type="button" @click="cancelEditing" class="btn btn-secondary flex-fill" :disabled="isSaving">
                      취소
                    </button>
                    <button type="submit" class="btn btn-primary flex-fill" :disabled="isSaving">
                      <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status"></span>
                      {{ isSaving ? '저장 중...' : '저장' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 학교 검색 모달 -->
    <div v-if="showSchoolModal" class="modal-overlay" @click="closeSchoolModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5 class="modal-title">학교 검색</h5>
          <button type="button" class="btn-close" @click="closeSchoolModal"></button>
        </div>
        <div class="modal-body">
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

          <div v-else-if="schoolSearchKeyword && !isSchoolSearching" class="text-center py-4">
            <p class="text-muted mb-0">검색 결과가 없습니다.</p>
          </div>

          <div v-else-if="!schoolSearchKeyword" class="text-center py-4">
            <p class="text-muted mb-0">학교명을 입력하여 검색해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 반응형 데이터
const isEditing = ref(false)
const isSaving = ref(false)
const showSchoolModal = ref(false)
const schoolSearchKeyword = ref('')
const schoolSearchResults = ref([])
const isSchoolSearching = ref(false)

// 사용자 정보
const userInfo = ref({})
const teacherInfo = ref({})
const studentInfo = ref({})

// 편집 폼
const editForm = ref({
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  school: '',
  grade: null
})

// computed properties
const userTypeDisplay = computed(() => {
  if (userInfo.value.role === 'TEACHER') return '선생님'
  if (userInfo.value.role === 'STUDENT') return '학생'
  if (userInfo.value.role === 'ADMIN') return '관리자'
  return '사용자'
})

import api from '@/services/api'
import { schoolApi } from '@/services/schoolApi'

const roleIconSrc = computed(() => {
  if (userInfo.value.role === 'TEACHER') {
    return new URL('@/assets/icons/teacher-icon.png', import.meta.url).href
  } else if (userInfo.value.role === 'STUDENT') {
    return new URL('@/assets/icons/student-icon.png', import.meta.url).href
  } else {
    return new URL('@/assets/icons/teacher-icon.png', import.meta.url).href // 기본값
  }
})

// 메서드들
const loadUserInfo = async () => {
  try {
    console.log('사용자 정보 로드 시작')
    const token = localStorage.getItem('accessToken')
    console.log('토큰:', token ? '있음' : '없음')
    
    const response = await api.get('/users/me')
    console.log('API 응답 상태:', response.status)
    
    if (response.status === 200) {
      const data = response.data
      console.log('API 응답 데이터:', data)
      userInfo.value = data.data
      console.log('설정된 사용자 정보:', userInfo.value)
      
      // 편집 폼 초기화
      editForm.value = {
        fullName: userInfo.value.fullName || '',
        email: userInfo.value.email || '',
        phone: userInfo.value.phone || '',
        subject: '',
        school: '',
        grade: null
      }
    } else {
      console.error('API 응답 실패:', response.status, response.statusText)
      
      // API 실패 시 localStorage에서 기본 정보 로드
      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        userInfo.value = JSON.parse(storedUserInfo)
        console.log('localStorage에서 로드된 사용자 정보:', userInfo.value)
        
        // 편집 폼 초기화
        editForm.value = {
          fullName: userInfo.value.fullName || '',
          email: userInfo.value.email || '',
          phone: userInfo.value.phone || '',
          subject: '',
          school: '',
          grade: null
        }
      }
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
    // localStorage에서 기본 정보 로드
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      userInfo.value = JSON.parse(storedUserInfo)
      console.log('localStorage에서 로드된 사용자 정보:', userInfo.value)
    }
  }
}

const loadRoleInfo = async () => {
  try {
    console.log('역할 정보 로드 시작, 사용자 역할:', userInfo.value.role)
    
    if (userInfo.value.role === 'TEACHER') {
      console.log('선생님 정보 로드 시작')
      // 선생님 정보를 직접 가져오기
      const teacherResponse = await api.get('/teachers/me')
      console.log('선생님 API 응답 상태:', teacherResponse.status)
      
      if (teacherResponse.status === 200) {
        const teacherData = teacherResponse.data
        console.log('선생님 API 응답 데이터:', teacherData)
        
        if (teacherData.data) {
          teacherInfo.value = {
            areaName: teacherData.data.areaName || '미설정',
            schoolName: teacherData.data.schoolName || '미설정'
          }
          editForm.value.subject = teacherData.data.areaCode || ''
          editForm.value.school = teacherData.data.schoolName || ''
          console.log('선생님 정보 로드됨:', teacherInfo.value)
        } else {
          // 선생님 정보가 없는 경우 기본값 설정
          teacherInfo.value = {
            areaName: '미설정',
            schoolName: '미설정'
          }
          editForm.value.subject = ''
          editForm.value.school = ''
          console.log('선생님 정보 기본값 설정:', teacherInfo.value)
        }
      } else {
        console.log('선생님 API 응답 실패:', teacherResponse.status, teacherResponse.statusText)
        console.error('선생님 API 에러 상태:', teacherResponse.status)
        // API 실패 시 기본값 설정
        teacherInfo.value = {
          areaName: '미설정',
          schoolName: '미설정'
        }
        editForm.value.subject = ''
        editForm.value.school = ''
      }
    } else if (userInfo.value.role === 'STUDENT') {
      console.log('학생 정보 로드 시작')
      // 학생 정보 로드
      const response = await api.get(`/students/${userInfo.value.userId || userInfo.value.id}`)
      console.log('학생 API 응답 상태:', response.status)
      
      if (response.status === 200) {
        const data = response.data
        console.log('학생 API 응답 데이터:', data)
        studentInfo.value = data.data || {}
        console.log('설정된 학생 정보:', studentInfo.value)
        
        // 편집 폼에 학년 정보 설정
        if (studentInfo.value.grade) {
          editForm.value.grade = studentInfo.value.grade
        } else {
          editForm.value.grade = null
        }
        
        // 학교 정보 설정 - API 응답에서 바로 사용
        if (studentInfo.value.schoolName) {
          console.log('학생 학교 정보:', studentInfo.value.schoolName)
          editForm.value.school = studentInfo.value.schoolName
        } else {
          console.log('학생에게 학교 정보가 없음')
          studentInfo.value.schoolName = '미설정'
          editForm.value.school = ''
        }
        
        // 클래스 정보 가져오기
        if (studentInfo.value.classGroupId) {
          console.log('클래스 ID로 클래스 정보 조회:', studentInfo.value.classGroupId)
          try {
            const classResponse = await api.get(`/classes/${studentInfo.value.classGroupId}`)
            console.log('클래스 API 응답 상태:', classResponse.status)
            
            if (classResponse.status === 200) {
              const classData = classResponse.data
              console.log('클래스 API 응답 데이터:', classData)
              studentInfo.value.className = classData.data?.className || classData.className || '미설정'
              console.log('학생 클래스 정보 로드됨:', studentInfo.value.className)
            } else {
              console.error('클래스 API 응답 실패:', classResponse.status)
              studentInfo.value.className = '미설정'
            }
          } catch (error) {
            console.error('클래스 정보 로드 실패:', error)
            studentInfo.value.className = '미설정'
          }
        } else {
          console.log('학생에게 classGroupId가 없음')
          studentInfo.value.className = '미설정'
        }
      } else {
        console.error('학생 API 응답 실패:', response.status, response.statusText)
        try {
          const errorData = await response.json()
          console.error('학생 API 에러 데이터:', errorData)
        } catch (error) {
          console.error('학생 API 에러 응답 파싱 실패:', error)
        }
        // API 실패 시 기본값 설정
        studentInfo.value = {
          grade: null,
          schoolName: '미설정',
          className: '미설정',
          studentNo: null
        }
        editForm.value.grade = null
        editForm.value.school = ''
      }
    }
  } catch (error) {
    console.error('역할 정보 로드 실패:', error)
  }
}

const formatPhone = (phone) => {
  if (!phone) return '미설정'
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
}

const formatPhoneInput = () => {
  let phone = editForm.value.phone.replace(/[^0-9]/g, '')
  if (phone.length > 3 && phone.length <= 7) {
    phone = phone.slice(0, 3) + '-' + phone.slice(3)
  } else if (phone.length > 7) {
    phone = phone.slice(0, 3) + '-' + phone.slice(3, 7) + '-' + phone.slice(7, 11)
  }
  editForm.value.phone = phone
}

const formatDate = (dateString) => {
  if (!dateString) return '미설정'
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const startEditing = () => {
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  // 편집 폼을 원래 값으로 복원
  editForm.value = {
    fullName: userInfo.value.fullName || '',
    email: userInfo.value.email || '',
    phone: userInfo.value.phone || '',
    subject: '',
    school: '',
    grade: null
  }
}

const saveProfile = async () => {
  isSaving.value = true
  
  try {
    const updateData = {
      email: editForm.value.email
    }

    const response = await api.put('/users/me', updateData)

    if (response.status === 200 && response.data?.success) {
      // 사용자 정보 업데이트
      const updatedUser = response.data
      userInfo.value = { ...userInfo.value, ...updatedUser.data }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      
      // 역할별 정보 업데이트 (별도 처리)
      if (userInfo.value.role === 'TEACHER' && (editForm.value.subject || editForm.value.school)) {
        // 선생님 정보 업데이트
        try {
          const teacherUpdateData = {
            areaCode: editForm.value.subject,
            schoolName: editForm.value.school
          }
          
          const teacherResponse = await api.put('/teachers/me', teacherUpdateData)
          
          if (teacherResponse.status === 200) {
            console.log('선생님 정보 업데이트 성공')
          } else {
            console.error('선생님 정보 업데이트 실패:', teacherResponse.status)
          }
        } catch (error) {
          console.error('선생님 정보 업데이트 에러:', error)
        }
      } else if (userInfo.value.role === 'STUDENT' && (editForm.value.grade || editForm.value.school)) {
        // 학생 정보 업데이트
        try {
          const studentUpdateData = {
            grade: editForm.value.grade,
            schoolName: editForm.value.school
          }
          
          console.log('학생 정보 업데이트 데이터:', studentUpdateData)
          
          const studentResponse = await api.put('/students/me', studentUpdateData)
          
          if (studentResponse.status === 200) {
            console.log('학생 정보 업데이트 성공')
          } else {
            console.error('학생 정보 업데이트 실패:', studentResponse.status)
          }
        } catch (error) {
          console.error('학생 정보 업데이트 에러:', error)
        }
      }
      
      // 역할 정보 다시 로드
      await loadRoleInfo()
      
      isEditing.value = false
      alert('프로필이 성공적으로 수정되었습니다.')
    } else {
      const errorData = response.data
      if (response.status === 429) {
        throw new Error('너무 빠른 요청입니다. 1분 후에 다시 시도해주세요.')
      } else {
        throw new Error(errorData?.message || '프로필 수정 실패')
      }
    }
  } catch (error) {
    console.error('프로필 수정 에러:', error)
    alert('프로필 수정 중 오류가 발생했습니다.')
  } finally {
    isSaving.value = false
  }
}

const changePassword = () => {
  // 비밀번호 변경 페이지로 이동
  router.push('/change-password')
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
    const { data } = await schoolApi.searchSchools(schoolSearchKeyword.value.trim())
    schoolSearchResults.value = Array.isArray(data) ? data : (data?.data || [])
  } catch (error) {
    console.error('학교 검색 실패:', error)
    schoolSearchResults.value = []
    alert('학교 검색 중 오류가 발생했습니다.')
  } finally {
    isSchoolSearching.value = false
  }
}

const selectSchool = (school) => {
  editForm.value.school = school.schoolName
  closeSchoolModal()
}

// 생명주기 훅
onMounted(async () => {
  await loadUserInfo()
  await loadRoleInfo()
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 80px); /* 헤더 높이만큼 뺌 */
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.profile-container {
  padding: 2rem 1rem;
}

.card {
  border-radius: 1rem;
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-header {
  border-radius: 1rem 1rem 0 0 !important;
  border-bottom: none;
}

.profile-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.role-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.info-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6c757d;
  margin-top: 0.25rem;
}

.section-title {
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.info-section {
  background: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

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

/* 반응형 디자인 */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem 0.5rem;
  }

  .card-body {
    padding: 1.5rem !important;
  }

  .info-section {
    padding: 1rem;
  }
}
</style>
