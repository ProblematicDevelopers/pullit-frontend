<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">일정 관리</h2>
        <button class="close-btn" @click="closeModal">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="calendar-wrapper">
          <!-- 캘린더 헤더 -->
          <div class="calendar-header">
            <button class="nav-btn" @click="previousMonth">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"/>
              </svg>
            </button>
            <h3 class="current-month">{{ currentMonthYear }}</h3>
            <button class="nav-btn" @click="nextMonth">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z"/>
              </svg>
            </button>
            <button class="today-btn" @click="goToToday">오늘</button>
            <button class="add-schedule-btn" @click="showAddSchedule = true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              일정 추가
            </button>
          </div>

          <!-- 요일 헤더 -->
          <div class="weekdays">
            <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
          </div>

          <!-- 캘린더 그리드 -->
          <div class="calendar-grid">
            <div
              v-for="day in calendarDays"
              :key="day.date"
              class="calendar-day"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday,
                'selected': day.isSelected
              }"
              @click="selectDate(day)"
            >
              <div class="day-number">{{ day.dayNumber }}</div>
              <div class="day-events">
                <div
                  v-for="event in day.events"
                  :key="event.id"
                  class="event-dot"
                  :class="{ 'upcoming-dot': event.isUpcoming }"
                  :style="{ backgroundColor: event.color || '#94a3b8' }"
                  :title="event.title"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 선택된 날짜의 일정 목록 -->
        <div class="schedule-list" v-if="selectedDate">
          <h4 class="list-title">{{ selectedDateFormatted }} 일정</h4>
          <div v-if="selectedDateSchedules.length > 0" class="schedules">
            <div
              v-for="schedule in selectedDateSchedules"
              :key="schedule.id"
              class="schedule-item"
              :class="{ 'upcoming-schedule': schedule.isUpcoming }"
            >
              <div class="schedule-time">{{ formatTime(schedule.scheduledDate) }}</div>
              <div class="schedule-content">
                <div class="schedule-title">
                  {{ schedule.title }}
                  <span v-if="schedule.isUpcoming" class="upcoming-badge">예정</span>
                </div>
                <div class="schedule-description" v-if="schedule.description">
                  {{ schedule.description }}
                </div>
              </div>
              <div class="schedule-actions" v-if="!schedule.isUpcoming">
                <button class="edit-btn" @click="editSchedule(schedule)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/>
                  </svg>
                </button>
                <button class="delete-btn" @click="deleteSchedule(schedule.id)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="no-schedules">
            일정이 없습니다.
          </div>
        </div>
      </div>

      <!-- 일정 추가 모달 -->
      <div v-if="showAddSchedule" class="add-schedule-modal">
        <div class="modal-overlay" @click="showAddSchedule = false"></div>
        <div class="modal-content">
          <h3>새 일정 추가</h3>
          <form @submit.prevent="addSchedule">
            <div class="form-group">
              <label>제목</label>
              <input
                v-model="newSchedule.title"
                type="text"
                required
                placeholder="일정 제목을 입력하세요"
              />
            </div>
            <div class="form-group">
              <label>설명</label>
              <textarea
                v-model="newSchedule.description"
                placeholder="일정 설명을 입력하세요"
                rows="3"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>날짜</label>
                <input
                  v-model="newSchedule.date"
                  type="date"
                  required
                />
              </div>
              <div class="form-group">
                <label>시간</label>
                <input
                  v-model="newSchedule.time"
                  type="time"
                  required
                />
              </div>
            </div>
            <div class="form-group">
              <label>유형</label>
              <select v-model="newSchedule.type" required>
                <option value="exam">시험</option>
                <option value="meeting">회의</option>
                <option value="deadline">마감일</option>
                <option value="class">수업</option>
                <option value="event">이벤트</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="showAddSchedule = false">
                취소
              </button>
              <button type="submit" class="submit-btn">
                추가
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import scheduleApi from '@/services/scheduleApi'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  upcomingEvents: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'schedule-added'])

// 상태 관리
const currentDate = ref(new Date())
const selectedDate = ref(null)
const schedules = ref([])
const showAddSchedule = ref(false)
const newSchedule = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  type: 'class'
})

// 요일 배열
const weekDays = ['일', '월', '화', '수', '목', '금', '토']

// 현재 월/년 표시
const currentMonthYear = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}년 ${month}월`
})

// 선택된 날짜 포맷
const selectedDateFormatted = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
})

// 캘린더 날짜 계산
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateString = date.toISOString().split('T')[0]
    const dayEvents = schedules.value.filter(s => {
      if (!s.scheduledDate) return false
      try {
        // scheduledDate가 유효한 날짜 문자열인지 확인
        if (s.scheduledDate.includes('T') || s.scheduledDate.includes('-')) {
          const scheduleDate = s.scheduledDate.split('T')[0]
          return scheduleDate === dateString
        }
        return false
      } catch (error) {
        return false
      }
    })
    
    days.push({
      date: dateString,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.getTime() === today.getTime(),
      isSelected: selectedDate.value === dateString,
      events: dayEvents
    })
  }
  
  return days
})

// 선택된 날짜의 일정
const selectedDateSchedules = computed(() => {
  if (!selectedDate.value) return []
  return schedules.value.filter(s => {
    // scheduledDate가 유효한지 확인
    if (!s.scheduledDate) return false
    
    try {
      // scheduledDate가 이미 ISO 형식 날짜 문자열인 경우
      let scheduleDate
      if (s.scheduledDate.includes('T') || s.scheduledDate.includes('-')) {
        scheduleDate = s.scheduledDate.split('T')[0]
      } else {
        // 다른 형식의 날짜인 경우 (예: "12월 25일")
        // 이 경우 파싱이 필요하므로 일단 false 반환
        return false
      }
      return scheduleDate === selectedDate.value
    } catch (error) {
      console.error('날짜 파싱 오류:', s.scheduledDate, error)
      return false
    }
  })
})

// 월 이동
const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
  loadMonthSchedules()
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
  loadMonthSchedules()
}

const goToToday = () => {
  currentDate.value = new Date()
  const today = new Date().toISOString().split('T')[0]
  selectedDate.value = today
  loadMonthSchedules()
}

// 날짜 선택
const selectDate = (day) => {
  selectedDate.value = day.date
}

// 일정 로드
const loadMonthSchedules = async () => {
  try {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth() + 1
    const response = await scheduleApi.getMonthlySchedules(year, month)
    if (response.success) {
      // API로부터 받은 일정
      const apiSchedules = response.data || []
      
      // upcomingEvents를 일정 형식으로 변환
      const upcomingSchedules = props.upcomingEvents.map(event => {
        // event.date가 여러 형식일 수 있음
        let scheduledDate = null
        if (event.date) {
          // ISO 날짜 형식인 경우 (2024-12-25)
          if (event.date.includes('-')) {
            scheduledDate = `${event.date}T${event.time || '09:00'}:00`
          }
          // "12월 25일" 형식인 경우
          else if (event.date.includes('월')) {
            const currentYear = new Date().getFullYear()
            const dateMatch = event.date.match(/(\d+)월\s*(\d+)일/)
            if (dateMatch) {
              const month = parseInt(dateMatch[1]) - 1 // JavaScript Date는 0부터 시작
              const day = parseInt(dateMatch[2])
              const date = new Date(currentYear, month, day)
              scheduledDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${event.time || '09:00'}:00`
            }
          }
          // "오늘", "내일" 등의 경우
          else if (event.date === '오늘') {
            const today = new Date()
            scheduledDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${event.time || '09:00'}:00`
          }
          else if (event.date === '내일') {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            scheduledDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T${event.time || '09:00'}:00`
          }
        }
        
        return {
          id: `upcoming-${event.id}`,
          title: event.title,
          scheduledDate: scheduledDate,
          description: event.time || '',
          type: event.type || 'exam',
          isUpcoming: true // 예정된 일정임을 표시
        }
      }).filter(s => s.scheduledDate !== null) // 유효한 날짜만 포함
      
      // 두 일정 목록을 합치고 중복 제거
      // API 일정 중에서 upcomingEvents와 중복되지 않는 것만 필터링
      const filteredApiSchedules = apiSchedules.filter(apiSchedule => {
        // upcoming 일정과 제목이 같은 경우 제외 (upcomingEvents를 우선)
        return !upcomingSchedules.some(upcoming => 
          apiSchedule.title === upcoming.title ||
          (apiSchedule.scheduledDate && upcoming.scheduledDate && 
           apiSchedule.scheduledDate.split('T')[0] === upcoming.scheduledDate.split('T')[0] &&
           apiSchedule.title.includes(upcoming.title))
        )
      })
      
      // upcomingEvents를 우선하여 합치기
      const allSchedules = [...upcomingSchedules, ...filteredApiSchedules]
      
      schedules.value = allSchedules
    }
  } catch (error) {
    console.error('일정 로드 실패:', error)
  }
}

// 일정 추가
const addSchedule = async () => {
  try {
    const dateTime = `${newSchedule.value.date}T${newSchedule.value.time}:00`
    const scheduleData = {
      title: newSchedule.value.title,
      description: newSchedule.value.description,
      type: newSchedule.value.type,
      scheduledDate: dateTime
    }
    
    const response = await scheduleApi.createSchedule(scheduleData)
    if (response.success) {
      await loadMonthSchedules()
      showAddSchedule.value = false
      newSchedule.value = {
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'class'
      }
      emit('schedule-added')
    }
  } catch (error) {
    console.error('일정 추가 실패:', error)
    alert('일정 추가에 실패했습니다.')
  }
}

// 일정 수정
const editSchedule = (schedule) => {
  // 수정 모달 구현 (필요시)
  console.log('Edit schedule:', schedule)
}

// 일정 삭제
const deleteSchedule = async (scheduleId) => {
  if (!confirm('이 일정을 삭제하시겠습니까?')) return
  
  try {
    const response = await scheduleApi.deleteSchedule(scheduleId)
    if (response.success) {
      await loadMonthSchedules()
    }
  } catch (error) {
    console.error('일정 삭제 실패:', error)
    alert('일정 삭제에 실패했습니다.')
  }
}

// 시간 포맷
const formatTime = (dateTimeString) => {
  try {
    if (!dateTimeString) return ''
    
    const date = new Date(dateTimeString)
    // 날짜가 유효한지 확인
    if (isNaN(date.getTime())) {
      // 날짜가 유효하지 않으면 빈 문자열 반환
      return ''
    }
    
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? '오후' : '오전'
    const displayHours = hours % 12 || 12
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('시간 포맷 오류:', dateTimeString, error)
    return ''
  }
}

// 모달 닫기
const closeModal = () => {
  emit('close')
}

// 모달이 열릴 때 데이터 로드
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    loadMonthSchedules()
    // 오늘 날짜 선택
    const today = new Date().toISOString().split('T')[0]
    selectedDate.value = today
  }
})

// upcomingEvents가 변경될 때 캘린더 업데이트
watch(() => props.upcomingEvents, () => {
  if (props.isOpen) {
    loadMonthSchedules()
  }
}, { deep: true })

onMounted(() => {
  if (props.isOpen) {
    loadMonthSchedules()
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #64748b;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1e293b;
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.calendar-wrapper {
  background: white;
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.nav-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
  fill: #64748b;
}

.current-month {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 1rem;
}

.today-btn {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.today-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.add-schedule-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #2563eb;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-schedule-btn:hover {
  background: #1d4ed8;
}

.add-schedule-btn svg {
  width: 20px;
  height: 20px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
  background: #e2e8f0;
}

.weekday {
  background: white;
  padding: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
}

.calendar-day {
  background: white;
  min-height: 80px;
  padding: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.calendar-day:hover {
  background: #f8fafc;
}

.calendar-day.other-month {
  color: #cbd5e1;
}

.calendar-day.today {
  background: #eff6ff;
}

.calendar-day.selected {
  background: #dbeafe;
  border: 2px solid #2563eb;
}

.day-number {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.day-events {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  margin: 1px;
}

.event-dot.upcoming-dot {
  /* 예정된 일정도 동일한 크기, 색상만 약간 진하게 */
  width: 6px;
  height: 6px;
  background: #64748b;
}

.schedule-list {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
}

.list-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.schedules {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.schedule-item.upcoming-schedule {
  /* 일반 일정과 동일한 스타일 유지 */
  background: white;
  border: 1px solid #e2e8f0;
}

.schedule-item.upcoming-schedule .schedule-time {
  /* 일반 일정과 동일한 스타일 */
  color: #64748b;
}

.schedule-item.upcoming-schedule .schedule-title {
  /* 일반 일정과 동일한 스타일 */
  color: #1e293b;
}

.schedule-item.upcoming-schedule .schedule-description {
  color: #94a3b8;
}

.upcoming-badge {
  display: inline-block;
  padding: 2px 6px;
  margin-left: 8px;
  background: #e2e8f0;
  color: #64748b;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.schedule-time {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.schedule-content {
  flex: 1;
}

.schedule-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.schedule-description {
  font-size: 0.875rem;
  color: #64748b;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s;
}

.edit-btn:hover {
  color: #2563eb;
}

.delete-btn:hover {
  color: #ef4444;
}

.edit-btn svg,
.delete-btn svg {
  width: 16px;
  height: 16px;
}

.no-schedules {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
}

/* 일정 추가 모달 */
.add-schedule-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #2563eb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn,
.submit-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.submit-btn {
  background: #2563eb;
  border: none;
  color: white;
}

.submit-btn:hover {
  background: #1d4ed8;
}

@media (max-width: 768px) {
  .modal-body {
    grid-template-columns: 1fr;
  }
  
  .calendar-header {
    flex-wrap: wrap;
  }
  
  .calendar-day {
    min-height: 60px;
  }
}
</style>