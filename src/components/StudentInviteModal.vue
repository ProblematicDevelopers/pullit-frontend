<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- 배경 오버레이 -->
      <div class="fixed inset-0 transition-opacity">
        <div class="absolute inset-0 bg-gray-500 opacity-75" @click="close"></div>
      </div>

      <!-- 모달 -->
      <div class="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">학생 추가</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 탭 네비게이션 제거 - 직접 추가만 사용 -->

        <!-- 학생 추가 -->
        <div class="space-y-4">
          <!-- 검색 및 필터 -->
          <div class="flex gap-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="이름 또는 이메일로 검색"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="debouncedSearch"
              />
            </div>
            <select
              v-model="selectedGrade"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="fetchAvailableStudents"
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>
          </div>

          <!-- 학생 목록 -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div class="max-h-96 overflow-y-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        v-model="selectAll"
                        @change="toggleSelectAll"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학년
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="loading" class="text-center">
                    <td colspan="5" class="px-6 py-4 text-gray-500">
                      <div class="flex justify-center items-center">
                        <svg class="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        학생 목록을 불러오는 중...
                      </div>
                    </td>
                  </tr>
                  <tr v-else-if="availableStudents.length === 0" class="text-center">
                    <td colspan="5" class="px-6 py-8">
                      <div class="flex flex-col items-center justify-center">
                        <svg class="w-12 h-12 text-gray-400 mb-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9A3.5 3.5 0 0 1 12 12.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8C5.56 8 6.08 8.15 6.53 8.42C6.38 9.85 6.8 11.27 7.66 12.38C7.16 13.34 6.16 14 5 14A3 3 0 0 1 2 11A3 3 0 0 1 5 8M19 8A3 3 0 0 1 22 11A3 3 0 0 1 19 14C17.84 14 16.84 13.34 16.34 12.38C17.2 11.27 17.62 9.85 17.47 8.42C17.92 8.15 18.44 8 19 8M5.5 18.25C5.5 16.18 8.41 14.5 12 14.5C15.59 14.5 18.5 16.18 18.5 18.25V20H5.5V18.25Z"/>
                        </svg>
                        <h3 class="text-gray-900 font-medium mb-1">추가 가능한 학생이 없습니다</h3>
                        <p class="text-gray-500 text-sm">같은 학교의 학급 미배정 학생이 없습니다.</p>
                        <p class="text-gray-500 text-sm">학생이 아직 가입하지 않았다면, 먼저 학생 회원가입을 안내해 주세요.</p>
                      </div>
                    </td>
                  </tr>
                  <tr v-else v-for="student in availableStudents" :key="student.studentId">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        v-model="selectedStudents"
                        :value="student.studentId"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ student.studentName }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ student.grade }}학년
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ student.email }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        추가 가능
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 선택된 학생 수 및 초대 버튼 -->
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">
              {{ selectedStudents.length }}명 선택됨
            </span>
            <button
              @click="inviteSelectedStudents"
              :disabled="isButtonDisabled"
              :class="[
                selectedStudents.length === 0 || inviting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700',
                'px-4 py-2 text-white font-medium rounded-md transition-colors'
              ]"
            >
              <span v-if="inviting" class="flex items-center">
                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                추가 중...
              </span>
              <span v-else>선택한 학생 추가</span>
            </button>
          </div>
        </div>

        <!-- 추가 결과 표시 -->
        <div v-if="invitationResults.length > 0" class="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 class="text-sm font-medium text-blue-900 mb-2">학생 추가 결과</h4>
          <div class="space-y-1">
            <div v-for="result in invitationResults" :key="result.email" class="text-sm">
              <span v-if="result.success" class="text-green-600">✓ {{ result.email }} - 추가 완료</span>
              <span v-else class="text-red-600">✗ {{ result.email }} - {{ result.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import api from '@/services/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  classId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'invited'])

// Toast 함수 정의
const showToast = (message, type = 'info') => {
  // 간단한 alert으로 대체 (실제로는 toast 라이브러리 사용 권장)
  if (type === 'error') {
    console.error(message)
    alert(`오류: ${message}`)
  } else if (type === 'success') {
    console.log(message)
    alert(`성공: ${message}`)
  } else {
    console.log(message)
    alert(message)
  }
}

// 상태 관리
const searchQuery = ref('')
const selectedGrade = ref('')
const availableStudents = ref([])
const selectedStudents = ref([])
const selectAll = ref(false)
const loading = ref(false)
const inviting = ref(false)
const invitationResults = ref([])

// 디바운스 타이머
let searchTimer = null

// 버튼 비활성화 상태 계산
const isButtonDisabled = computed(() => {
  const disabled = selectedStudents.value.length === 0 || inviting.value
  console.log('Button disabled state:', disabled, 'selectedCount:', selectedStudents.value.length, 'inviting:', inviting.value)
  return disabled
})

// 초대 가능한 학생 목록 조회
const fetchAvailableStudents = async () => {
  console.log('=== fetchAvailableStudents called ===')
  console.log('Current time:', new Date().toISOString())
  loading.value = true
  try {
    const params = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedGrade.value) params.grade = selectedGrade.value

    console.log('Fetching with params:', params)
    console.log('API endpoint: /classes/available-students')
    const response = await api.get('/classes/available-students', { params })
    console.log('Response status:', response.status)
    console.log('Response data:', response.data)
    availableStudents.value = response.data.data || []
    console.log('Available students loaded count:', availableStudents.value.length)
    console.log('Available students:', availableStudents.value)
  } catch (error) {
    console.error('Failed to fetch available students:', error)
    console.error('Error details:', error.response?.data)
    showToast('학생 목록을 불러오는데 실패했습니다.', 'error')
  } finally {
    loading.value = false
  }
}

// 디바운스된 검색
const debouncedSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchAvailableStudents()
  }, 300)
}

// 전체 선택/해제
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedStudents.value = availableStudents.value.map(s => s.studentId)
  } else {
    selectedStudents.value = []
  }
}

// 선택된 학생 학급에 추가
const inviteSelectedStudents = async () => {
  console.log('=== inviteSelectedStudents called ===')
  console.log('Button clicked at:', new Date().toISOString())
  console.log('selectedStudents.value:', selectedStudents.value)
  console.log('selectedStudents.value.length:', selectedStudents.value.length)
  console.log('inviting.value:', inviting.value)
  console.log('props.classId:', props.classId)
  
  if (selectedStudents.value.length === 0) {
    console.log('No students selected - returning early')
    showToast('학생을 선택해주세요.', 'warning')
    return
  }

  inviting.value = true
  invitationResults.value = []
  
  try {
    // 선택된 학생들의 이메일 수집
    const studentsToInvite = availableStudents.value
      .filter(s => selectedStudents.value.includes(s.studentId))
      .map(s => ({
        email: s.email,
        name: s.studentName
      }))

    const response = await api.post(`/classes/${props.classId}/invitations`, {
      students: studentsToInvite
    })

    invitationResults.value = response.data.data.results || []
    
    const successCount = invitationResults.value.filter(r => r.success).length
    const failedCount = invitationResults.value.filter(r => !r.success).length
    
    if (successCount > 0) {
      showToast(`${successCount}명의 학생을 학급에 추가했습니다.`, 'success')
      emit('invited')
      
      // 성공한 학생들 목록에서 제거
      const successEmails = invitationResults.value
        .filter(r => r.success)
        .map(r => r.email)
      
      availableStudents.value = availableStudents.value.filter(
        s => !successEmails.includes(s.email)
      )
      selectedStudents.value = []
    }
    
    if (failedCount > 0) {
      showToast(`${failedCount}명의 학생 추가에 실패했습니다.`, 'warning')
    }
  } catch (error) {
    console.error('Failed to invite students:', error)
    showToast('학생 추가에 실패했습니다.', 'error')
  } finally {
    inviting.value = false
  }
}


// 모달 닫기
const close = () => {
  emit('close')
  // 상태 초기화
  selectedStudents.value = []
  searchQuery.value = ''
  selectedGrade.value = ''
  invitationResults.value = []
}

// 모달이 열릴 때 데이터 로드
watch(() => props.isOpen, (newVal) => {
  console.log('=== StudentInviteModal isOpen changed ===')
  console.log('isOpen:', newVal)
  console.log('classId:', props.classId)
  if (newVal) {
    fetchAvailableStudents()
  }
})

// 선택 상태 감시
watch(selectedStudents, (newVal, oldVal) => {
  console.log('=== selectedStudents changed ===')
  console.log('Old value:', oldVal)
  console.log('New value:', newVal)
  console.log('New length:', newVal.length)
  selectAll.value = newVal.length === availableStudents.value.length && availableStudents.value.length > 0
})
</script>

<style scoped>
/* 모달 오버레이 */
.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.z-50 {
  z-index: 50;
}

.z-60 {
  z-index: 60;
}

.overflow-y-auto {
  overflow-y: auto;
}

/* 플렉스 레이아웃 */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.items-start {
  align-items: flex-start;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.justify-end {
  justify-content: flex-end;
}

/* 레이아웃 */
.min-h-screen {
  min-height: 100vh;
}

.inline-block {
  display: inline-block;
}

.align-bottom {
  vertical-align: bottom;
}

.align-middle {
  vertical-align: middle;
}

/* 배경 오버레이 */
.bg-gray-500 {
  background-color: rgb(107 114 128);
}

.bg-black {
  background-color: rgb(0 0 0);
}

.opacity-75 {
  opacity: 0.75;
}

.opacity-30 {
  opacity: 0.3;
}

/* 모달 박스 */
.bg-white {
  background-color: rgb(255 255 255);
}

.rounded-lg {
  border-radius: 0.5rem;
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* 패딩과 마진 */
.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.pt-4 {
  padding-top: 1rem;
}

.pt-5 {
  padding-top: 1.25rem;
}

.pb-4 {
  padding-bottom: 1rem;
}

.pb-20 {
  padding-bottom: 5rem;
}

.p-4 {
  padding: 1rem;
}

.p-6 {
  padding: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mr-3 {
  margin-right: 0.75rem;
}

.mx-4 {
  margin-left: 1rem;
  margin-right: 1rem;
}

/* 텍스트 스타일 */
.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}

.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.text-gray-900 {
  color: rgb(17 24 39);
}

.text-gray-700 {
  color: rgb(55 65 81);
}

.text-gray-600 {
  color: rgb(75 85 99);
}

.text-gray-500 {
  color: rgb(107 114 128);
}

.text-gray-400 {
  color: rgb(156 163 175);
}

.text-blue-600 {
  color: rgb(37 99 235);
}

.text-blue-500 {
  color: rgb(59 130 246);
}

.text-blue-900 {
  color: rgb(30 58 138);
}

.text-green-600 {
  color: rgb(22 163 74);
}

.text-green-800 {
  color: rgb(22 101 52);
}

.text-red-600 {
  color: rgb(220 38 38);
}

.text-white {
  color: rgb(255 255 255);
}

/* hover 스타일 */
.hover\:text-gray-500:hover {
  color: rgb(107 114 128);
}

.hover\:bg-gray-50:hover {
  background-color: rgb(249 250 251);
}

.hover\:bg-blue-700:hover {
  background-color: rgb(29 78 216);
}

/* 버튼 스타일 */
button {
  cursor: pointer;
}

.cursor-not-allowed {
  cursor: not-allowed;
}

/* 테이블 스타일 */
.min-w-full {
  min-width: 100%;
}

.divide-y {
  border-top-width: 0;
  border-bottom-width: 1px;
}

.divide-gray-200 > :not([hidden]) ~ :not([hidden]) {
  border-color: rgb(229 231 235);
}

.bg-gray-50 {
  background-color: rgb(249 250 251);
}

.bg-green-100 {
  background-color: rgb(220 252 231);
}

.bg-blue-50 {
  background-color: rgb(239 246 255);
}

.bg-blue-600 {
  background-color: rgb(37 99 235);
}

.bg-gray-300 {
  background-color: rgb(209 213 219);
}

/* 보더 스타일 */
.border {
  border-width: 1px;
}

.border-gray-300 {
  border-color: rgb(209 213 219);
}

.border-gray-200 {
  border-color: rgb(229 231 235);
}

.rounded-md {
  border-radius: 0.375rem;
}

.rounded-full {
  border-radius: 9999px;
}

.rounded {
  border-radius: 0.25rem;
}

/* 기타 유틸리티 */
.overflow-hidden {
  overflow: hidden;
}

.max-h-96 {
  max-height: 24rem;
}

.whitespace-nowrap {
  white-space: nowrap;
}

.uppercase {
  text-transform: uppercase;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.leading-5 {
  line-height: 1.25rem;
}

.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 1rem;
}

.space-y-1 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 0.25rem;
}

.gap-4 {
  gap: 1rem;
}

.gap-2 {
  gap: 0.5rem;
}

.flex-1 {
  flex: 1 1 0%;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.w-full {
  width: 100%;
}

.w-12 {
  width: 3rem;
}

.w-6 {
  width: 1.5rem;
}

.w-5 {
  width: 1.25rem;
}

.w-4 {
  width: 1rem;
}

.h-12 {
  height: 3rem;
}

.h-6 {
  height: 1.5rem;
}

.h-5 {
  height: 1.25rem;
}

.h-4 {
  height: 1rem;
}

.max-w-4xl {
  max-width: 56rem;
}

.max-w-md {
  max-width: 28rem;
}

/* 포커스 스타일 */
.focus\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.focus\:ring-2:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

.focus\:ring-blue-500:focus {
  --tw-ring-color: rgb(59 130 246);
}

/* 애니메이션 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 반응형 스타일 */
@media (min-width: 640px) {
  .sm\:block {
    display: block;
  }
  
  .sm\:p-0 {
    padding: 0;
  }
  
  .sm\:p-6 {
    padding: 1.5rem;
  }
  
  .sm\:my-8 {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
  
  .sm\:align-middle {
    vertical-align: middle;
  }
  
  .sm\:max-w-4xl {
    max-width: 56rem;
  }
  
  .sm\:w-full {
    width: 100%;
  }
}

/* 절대 위치 */
.absolute {
  position: absolute;
}

.relative {
  position: relative;
}

/* 인라인 플렉스 */
.inline-flex {
  display: inline-flex;
}
</style>
