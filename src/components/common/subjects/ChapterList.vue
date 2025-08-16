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
              <!-- 단원 목록 -->
              <div v-if="chapter.children && chapter.children.length > 0">
                <div class="list-group list-group-flush">
                  <div
                    v-for="unit in chapter.children"
                    :key="unit.id"
                    class="list-group-item border-0 px-0"
                  >
                    <!-- 단원 헤더 -->
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="mb-0 fw-semibold">{{ unit.name || '단원명 없음' }}</h6>
                      <span class="badge bg-secondary">{{ unit.children?.length || 0 }}개 소단원</span>
                    </div>

                    <!-- 소단원 목록 -->
                    <div v-if="unit.children && unit.children.length > 0" class="ms-3">
                      <div
                        v-for="subUnit in unit.children"
                        :key="subUnit.id"
                        class="list-group-item border-0 px-0 py-2"
                      >
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <small class="fw-medium">{{ subUnit.name || '소단원명 없음' }}</small>
                            <div v-if="subUnit.topics && subUnit.topics.length > 0" class="mt-1">
                              <small class="text-muted">
                                {{ subUnit.topics.length }}개 주제
                              </small>
                            </div>
                          </div>
                          <button
                            class="btn btn-sm btn-outline-primary"
                            @click="selectUnit(subUnit)"
                          >
                            선택
                          </button>
                        </div>

                        <!-- 주제 목록 (선택적) -->
                        <div v-if="subUnit.topics && subUnit.topics.length > 0" class="mt-2">
                          <div class="list-group list-group-flush">
                            <div
                              v-for="topic in subUnit.topics"
                              :key="topic.id"
                              class="list-group-item border-0 px-0 py-1"
                            >
                              <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">{{ topic.name }}</small>
                                <button
                                  class="btn btn-sm btn-outline-secondary"
                                  @click="selectTopic(topic)"
                                >
                                  선택
                                </button>
                              </div>
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
const emit = defineEmits(['select-unit', 'select-topic'])

// 아코디언 확장 상태 관리
const expandedChapters = ref({})

// 챕터 토글 함수
function toggleChapter(index) {
  expandedChapters.value[index] = !expandedChapters.value[index]
}

// 소단원 선택 함수
function selectUnit(subUnit) {
  console.log('선택된 소단원:', subUnit)
  emit('select-unit', subUnit)
}

// 주제 선택 함수
function selectTopic(topic) {
  console.log('선택된 주제:', topic)
  emit('select-topic', topic)
}

// 챕터 목록이 변경될 때마다 확장 상태 초기화
watch(() => props.chapterStore.list, () => {
  expandedChapters.value = {}
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
</style>
