<template>
  <div class="passage-group-section">
    <h6 class="section-subtitle">
      <i class="bi bi-collection me-2"></i>지문 그룹
    </h6>
    <div class="passage-group-controls">
      <div class="form-group">
        <select v-model="selectedPassageGroup" class="form-select" @change="onPassageGroupChange">
          <option value="none">해당 문제지에 아직 지문이 없습니다.</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'none'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const selectedPassageGroup = ref(props.modelValue)

// 부모 컴포넌트의 값이 변경될 때 동기화
watch(() => props.modelValue, (newValue) => {
  selectedPassageGroup.value = newValue
})

// 로컬 값이 변경될 때 부모에게 알림
watch(selectedPassageGroup, (newValue) => {
  emit('update:modelValue', newValue)
})

const onPassageGroupChange = () => {
  emit('change', selectedPassageGroup.value)
}
</script>

<style scoped>
/* 지문 그룹 관리 섹션 */
.passage-group-section {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.passage-group-section .section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.passage-group-controls .form-group {
  margin-bottom: 0;
}

.passage-group-controls .form-select {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  width: 100%;
}

.passage-group-controls .form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.me-2 {
  margin-right: 0.5rem;
}
</style>
