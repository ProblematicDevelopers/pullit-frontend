<template>
  <div class="container py-3">
    <!-- 로딩 상태 -->
    <div v-if="chapterStore.loading" class="alert alert-info">
      챕터를 불러오는 중입니다...
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="chapterStore.error" class="alert alert-danger">
      ⚠️ {{ chapterStore.error }}
    </div>

    <!-- 챕터 목록 -->
    <div v-else-if="chapterStore.list.length > 0">
      <h3 class="mb-3">챕터 목록</h3>
      <div class="accordion" id="chapterAccordion">
        <div
          v-for="(chapter, index) in chapterStore.list"
          :key="chapter.id || index"
          class="accordion-item"
        >
          <h2 class="accordion-header" :id="`heading${index}`">
            <button
              class="accordion-button"
              :class="{ collapsed: !expandedChapters[index] }"
              type="button"
              data-bs-toggle="collapse"
              :data-bs-target="`#collapse${index}`"
              :aria-expanded="expandedChapters[index]"
              :aria-controls="`collapse${index}`"
              @click="toggleChapter(index)"
            >
              <div class="d-flex align-items-center w-100">
                <div class="form-check me-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :checked="checkedChapters[index]"
                    @click.stop="toggleChapterCheck(index)"
                  >
                </div>
                <span class="fw-semibold me-2">{{ chapter.name || '제목 없음' }}</span>
                <span class="badge bg-primary ms-auto">{{ chapter.children?.length || 0 }}개 단원</span>
              </div>
            </button>
          </h2>
          <div
            :id="`collapse${index}`"
            class="accordion-collapse collapse"
            :class="{ show: expandedChapters[index] }"
            :aria-labelledby="`heading${index}`"
            data-bs-parent="#chapterAccordion"
          >
            <div class="accordion-body">
              <!-- 중단원 아코디언 -->
              <div v-if="chapter.children && chapter.children.length > 0">
                <div class="accordion" :id="`unitAccordion${index}`">
                  <div
                    v-for="(unit, unitIndex) in chapter.children"
                    :key="unit.id"
                    class="accordion-item"
                  >
                    <!-- 중단원 헤더 -->
                    <h3 class="accordion-header" :id="`unitHeading${index}_${unitIndex}`">
                                              <button
                          class="accordion-button accordion-button-sm"
                          :class="{ collapsed: !expandedUnits[`${index}_${unitIndex}`] }"
                          type="button"
                          data-bs-toggle="collapse"
                          :data-bs-target="`#unitCollapse${index}_${unitIndex}`"
                          :aria-expanded="expandedUnits[`${index}_${unitIndex}`]"
                          :aria-controls="`unitCollapse${index}_${unitIndex}`"
                          @click="toggleUnit(index, unitIndex)"
                        >
                          <div class="d-flex align-items-center w-100">
                            <div class="form-check me-2">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                :checked="checkedUnits[`${index}_${unitIndex}`]"
                                @click.stop="toggleUnitCheck(index, unitIndex)"
                              >
                            </div>
                            <span class="fw-semibold me-2">{{ unit.name || '단원명 없음' }}</span>
                            <span class="badge bg-secondary ms-auto">{{ unit.children[0].topics?.length || 0 }}개 소단원</span>
                          </div>
                        </button>
                    </h3>

                    <!-- 중단원 콘텐츠 -->
                    <div
                      :id="`unitCollapse${index}_${unitIndex}`"
                      class="accordion-collapse collapse"
                      :class="{ show: expandedUnits[`${index}_${unitIndex}`] }"
                      :aria-labelledby="`unitHeading${index}_${unitIndex}`"
                      :data-bs-parent="`#unitAccordion${index}`"
                    >
                      <div class="accordion-body">
                        <!-- 소단원 아코디언 -->
                        <div v-if="unit.children && unit.children.length > 0">
                                                      <div class="sub-unit-list">
                              <div
                                v-for="subUnit in unit.children[0].topics"
                                :key="subUnit.id"
                                class="sub-unit-item"
                              >
                                <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                                  <div class="d-flex align-items-center">
                                    <span class="fw-medium me-2">{{ subUnit.name || '소단원명 없음' }}</span>
                                  </div>

                                </div>
                              </div>
                            </div>
                        </div>

                        <!-- 소단원이 없는 경우 -->
                        <div v-else class="text-muted text-center py-2">
                          이 단원에는 소단원이 없습니다.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-muted text-center py-3">
                이 챕터에는 단원이 없습니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="text-muted text-center py-5">
      표시할 챕터가 없습니다.
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props 정의
const props = defineProps({
  chapterStore: {
    type: Object,
    required: true
  }
})

// Emits 정의
const emit = defineEmits(['selection-change'])

// 아코디언 확장 상태 관리
const expandedChapters = ref({})
const expandedUnits = ref({})

// 체크박스 상태 관리
const checkedChapters = ref({})
const checkedUnits = ref({})

// 챕터 토글 함수
function toggleChapter(index) {
  expandedChapters.value[index] = !expandedChapters.value[index]
}

// 중단원 토글 함수
function toggleUnit(chapterIndex, unitIndex) {
  const key = `${chapterIndex}_${unitIndex}`
  expandedUnits.value[key] = !expandedUnits.value[key]
}

// 선택된 항목들을 부모에게 전달
function emitSelectionChange() {
  const selectedData = []

  // 체크된 중단원들을 챕터별로 그룹화
  const chapterGroups = {}

  Object.keys(checkedUnits.value).forEach(unitKey => {
    if (checkedUnits.value[unitKey]) {
      const [chapterIndex, unitIndex] = unitKey.split('_')
      const chapter = props.chapterStore.list[chapterIndex]
      const unit = chapter.children[unitIndex]

      // 챕터별로 유닛ID 그룹화
      if (!chapterGroups[chapter.id]) {
        chapterGroups[chapter.id] = []
      }
      chapterGroups[chapter.id].push(unit.id)
    }
  })

  // 노드 형태로 변환
  Object.keys(chapterGroups).forEach(chapterId => {
    selectedData.push({
      chapter: chapterId,
      units: chapterGroups[chapterId]
    })
  })

  emit('selection-change', selectedData)
}

// 대단원 체크박스 토글
function toggleChapterCheck(chapterIndex) {
  const chapter = props.chapterStore.list[chapterIndex]
  const isChecked = !checkedChapters.value[chapterIndex]

  // 대단원 체크 상태 변경
  checkedChapters.value[chapterIndex] = isChecked

  // 중단원들도 모두 체크/해제
  if (chapter.children && chapter.children.length > 0) {
    chapter.children.forEach((unit, unitIndex) => {
      const unitKey = `${chapterIndex}_${unitIndex}`
      checkedUnits.value[unitKey] = isChecked
    })
  }

  // 선택 변경사항을 부모에게 전달
  emitSelectionChange()
}

// 중단원 체크박스 토글
function toggleUnitCheck(chapterIndex, unitIndex) {
  const unitKey = `${chapterIndex}_${unitIndex}`
  checkedUnits.value[unitKey] = !checkedUnits.value[unitKey]

  // 대단원 체크 상태 업데이트 (모든 중단원이 체크되었는지 확인)
  updateChapterCheckState(chapterIndex)

  // 선택 변경사항을 부모에게 전달
  emitSelectionChange()
}

// 대단원 체크 상태 업데이트
function updateChapterCheckState(chapterIndex) {
  const chapter = props.chapterStore.list[chapterIndex]
  if (chapter.children && chapter.children.length > 0) {
    const allUnitsChecked = chapter.children.every((unit, unitIndex) => {
      const unitKey = `${chapterIndex}_${unitIndex}`
      return checkedUnits.value[unitKey]
    })
    checkedChapters.value[chapterIndex] = allUnitsChecked
  }
}


// 챕터 목록이 변경될 때마다 확장 상태 초기화
watch(() => props.chapterStore.list, () => {
  expandedChapters.value = {}
  expandedUnits.value = {}
  checkedChapters.value = {}
  checkedUnits.value = {}
}, { deep: true })
</script>

<style scoped>
.accordion-button:not(.collapsed) {
  background-color: #e7f1ff;
  color: #0c63e4;
}

.accordion-button:focus {
  box-shadow: none;
  border-color: rgba(0, 0, 0, 0.125);
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

/* 중단원과 소단원 아코디언 버튼 크기 조정 */
.accordion-button-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.accordion .accordion .accordion-button {
  background-color: #f8f9fa;
  border: none;
}

.accordion .accordion .accordion-button:not(.collapsed) {
  background-color: #e3f2fd;
  color: #1976d2;
}

/* 소단원 목록 스타일 */
.sub-unit-list {
  margin-top: 0.5rem;
}

.sub-unit-item {
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.sub-unit-item:hover {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sub-unit-item .border-bottom {
  border-bottom: 1px solid #e9ecef !important;
}

.sub-unit-item:last-child .border-bottom {
  border-bottom: none !important;
}

/* 체크박스 스타일 */
.form-check-input {
  cursor: pointer;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.accordion-button .form-check {
  margin: 0;
}

.accordion-button .form-check-input {
  margin: 0;
}

.form-check{
  margin: 0;
  padding: 0;
}
.form-check-input{
  width: 26px;
  height: 26px;
}
</style>
