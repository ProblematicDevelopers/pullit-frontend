<template>
  <div class="class-management-page">
    <!-- Page Header -->
    <div class="cm-page-header">
      <div class="cm-container">
        <div class="cm-header-content">
          <div>
            <h1 class="cm-page-title">학급 관리</h1>
            <p class="cm-page-subtitle">학급 정보를 확인하고 학생을 관리하세요.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="cm-container cm-main-content">
      <!-- 학급이 없는 경우 -->
      <div v-if="!classInfo && !loading" class="empty-state">
        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">학급이 없습니다</h3>
          <p class="mt-1 text-sm text-gray-500">새로운 학급을 생성하여 학생들을 관리하세요.</p>
          <div class="mt-6">
            <button
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              학급 생성하기
            </button>
          </div>
        </div>
      </div>

      <!-- 학급이 있는 경우 -->
      <div v-else-if="classInfo" class="space-y-6">
        <!-- 학급 정보 카드 -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-medium text-gray-900">학급 정보</h2>
              <div class="flex gap-2">
                <button
                  @click="showInviteModal = true"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  학생 초대
                </button>
                <button
                  @click="editClass"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  수정
                </button>
              </div>
            </div>
          </div>
          <div class="px-6 py-4">
            <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">학급명</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ classInfo.className }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">학년</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ getGradeName(classInfo.classGrade) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">담당 과목</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ getSubjectName(classInfo.classSubject) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">담당 교사</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ classInfo.teacher?.teacherName || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">총 학생 수</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ classInfo.totalStudents || 0 }}명</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">생성일</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(classInfo.createdDate) }}</dd>
              </div>
              <div v-if="classInfo.invitationCode">
                <dt class="text-sm font-medium text-gray-500">초대 코드</dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono font-bold">{{ classInfo.invitationCode }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- 학생 목록 -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">학생 목록</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    번호
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
                    가입일
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="!classInfo.students || classInfo.students.length === 0">
                  <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                    아직 등록된 학생이 없습니다.
                  </td>
                </tr>
                <tr v-else v-for="(student, index) in classInfo.students" :key="student.studentId">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ student.studentNumber || index + 1 }}
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(student.enrolledDate) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      student.status === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                    ]">
                      {{ student.status === 'ONLINE' ? '온라인' : '오프라인' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="removeStudent(student.studentId)"
                      class="text-red-600 hover:text-red-900"
                    >
                      제거
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-else class="flex justify-center items-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>

    <!-- 학급 생성 모달 -->
    <ClassCreateModal
      :isOpen="showCreateModal"
      @close="showCreateModal = false"
      @created="handleClassCreated"
    />

    <!-- 학생 초대 모달 -->
    <StudentInviteModal
      v-if="classInfo"
      :isOpen="showInviteModal"
      :classId="classInfo.classId"
      @close="showInviteModal = false"
      @invited="loadClassInfo"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import authService from '@/services/auth'
import { useToast } from '@/composables/useToast'
import ClassCreateModal from '@/components/ClassCreateModal.vue'
import StudentInviteModal from '@/components/StudentInviteModal.vue'

const router = useRouter()
const { showToast } = useToast()

// 상태
const loading = ref(true)
const classInfo = ref(null)
const showCreateModal = ref(false)
const showInviteModal = ref(false)

// 과목 매핑 (DB 코드 -> 한글명)
const subjectMap = {
  'KO': '국어',
  'MA': '수학',
  'EN': '영어',
  'SC': '과학',
  'SO': '사회'
}

// 학급 정보 로드
const loadClassInfo = async () => {
  loading.value = true
  try {
    // 선생님인 경우 담당 학급 조회
    const userInfo = authService.getCurrentUser()
    let response = null
    
    if (userInfo?.role === 'TEACHER') {
      response = await authService.getTeacherClass()
    } else {
      response = await authService.getClassInfo()
    }
    
    classInfo.value = response
  } catch (error) {
    console.error('Failed to load class info:', error)
    // 404 에러는 학급이 없는 경우
    if (error.response?.status !== 404) {
      showToast('학급 정보를 불러오는데 실패했습니다.', 'error')
    }
  } finally {
    loading.value = false
  }
}

// 학급 생성 완료 처리
const handleClassCreated = async (createdClass) => {
  classInfo.value = null // 임시로 null 설정
  await loadClassInfo() // 새로운 학급 정보 로드
  showCreateModal.value = false
}

// 학생 제거
const removeStudent = async (studentId) => {
  if (!confirm('정말로 이 학생을 학급에서 제거하시겠습니까?')) return
  
  try {
    await axios.delete(`/api/classes/${classInfo.value.classId}/students/${studentId}`)
    showToast('학생이 학급에서 제거되었습니다.', 'success')
    await loadClassInfo()
  } catch (error) {
    console.error('Failed to remove student:', error)
    showToast('학생 제거에 실패했습니다.', 'error')
  }
}

// 학급 수정
const editClass = () => {
  showToast('학급 수정 기능은 준비 중입니다.', 'info')
}

// 날짜 포맷팅
const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 학년 매핑 (DB 코드 -> 한글명)
const gradeMap = {
  '07': '1학년',
  '08': '2학년',
  '09': '3학년'
}

// 과목명 가져오기
const getSubjectName = (code) => {
  return subjectMap[code] || code
}

// 학년명 가져오기
const getGradeName = (code) => {
  return gradeMap[code] || code
}

onMounted(() => {
  loadClassInfo()
})
</script>

<style scoped>
.class-management-page {
  min-height: 100vh;
  background-color: #f9fafb;
}

.cm-page-header {
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 0;
}

.cm-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.cm-main-content {
  margin-top: 1.5rem;
}

.cm-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cm-page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.cm-page-subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Empty State Styles */
.empty-state {
  margin-top: 2rem;
}

.empty-state .bg-white {
  background-color: white;
}

.empty-state .rounded-lg {
  border-radius: 0.5rem;
}

.empty-state .shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.empty-state .p-8 {
  padding: 2rem;
}

.empty-state .text-center {
  text-align: center;
}

.empty-state .mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.empty-state .h-12 {
  height: 3rem;
}

.empty-state .w-12 {
  width: 3rem;
}

.empty-state .text-gray-400 {
  color: #9ca3af;
}

.empty-state .mt-2 {
  margin-top: 0.5rem;
}

.empty-state .text-sm {
  font-size: 0.875rem;
}

.empty-state .font-medium {
  font-weight: 500;
}

.empty-state .text-gray-900 {
  color: #111827;
}

.empty-state .mt-1 {
  margin-top: 0.25rem;
}

.empty-state .text-gray-500 {
  color: #6b7280;
}

.empty-state .mt-6 {
  margin-top: 1.5rem;
}

/* Button Styles */
.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.border {
  border-width: 1px;
}

.border-transparent {
  border-color: transparent;
}

.border-gray-300 {
  border-color: #d1d5db;
}

.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.text-sm {
  font-size: 0.875rem;
}

.font-medium {
  font-weight: 500;
}

.rounded-md {
  border-radius: 0.375rem;
}

.text-white {
  color: white;
}

.text-gray-700 {
  color: #374151;
}

.bg-blue-600 {
  background-color: #2563eb;
}

.bg-white {
  background-color: white;
}

.hover\:bg-blue-700:hover {
  background-color: #1d4ed8;
}

.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}

.focus\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.focus\:ring-2:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

.focus\:ring-offset-2:focus {
  box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(59, 130, 246, 0.5);
}

.focus\:ring-blue-500:focus {
  --tw-ring-color: rgba(59, 130, 246, 0.5);
}

.-ml-1 {
  margin-left: -0.25rem;
}

.-ml-0\.5 {
  margin-left: -0.125rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.h-5 {
  height: 1.25rem;
}

.w-5 {
  width: 1.25rem;
}

.h-4 {
  height: 1rem;
}

.w-4 {
  width: 1rem;
}

/* Loading State */
.flex {
  display: flex;
}

.justify-center {
  justify-content: center;
}

.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.h-8 {
  height: 2rem;
}

.w-8 {
  width: 2rem;
}

.text-blue-500 {
  color: #3b82f6;
}

.opacity-25 {
  opacity: 0.25;
}

.opacity-75 {
  opacity: 0.75;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Additional Table and Layout Styles */
.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.shadow {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.border-b {
  border-bottom-width: 1px;
}

.border-gray-200 {
  border-color: #e5e7eb;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 0.5rem;
}

.text-lg {
  font-size: 1.125rem;
}

.leading-4 {
  line-height: 1rem;
}
</style>