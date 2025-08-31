<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- 배경 오버레이 -->
      <div class="fixed inset-0 transition-opacity" @click="close">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- 모달 -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
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
                    <td colspan="5" class="px-6 py-4 text-gray-500">
                      추가 가능한 학생이 없습니다.
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