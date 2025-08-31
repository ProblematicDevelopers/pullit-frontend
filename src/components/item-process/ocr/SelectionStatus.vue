<template>
  <div v-if="captureMode && activeSelectionType" class="selection-status">
    <div class="alert alert-primary">
      <div class="d-flex align-items-center">
        <i class="bi bi-cursor-fill me-2"></i>
        <div>
          <strong>{{ getSelectionTypeLabel(activeSelectionType) }}</strong> 영역 선택 중...
          <br><small class="text-muted">이미지에서 클릭하여 영역을 선택하세요</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  captureMode: {
    type: Boolean,
    required: true
  },
  activeSelectionType: {
    type: String,
    required: true
  }
})

const getSelectionTypeLabel = (type) => {
  const labels = {
    question: '지문',
    options: '보기',
    problem: '문제',
    image: '이미지'
  }
  return labels[type] || type
}
</script>

<style scoped>
.selection-status {
  margin-bottom: 1rem;
}

.alert {
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid transparent;
}

.alert-primary {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.alert .d-flex {
  display: flex;
}

.alert .align-items-center {
  align-items: center;
}

.alert .me-2 {
  margin-right: 0.5rem;
}

.alert strong {
  font-weight: 600;
}

.alert small {
  font-size: 0.875rem;
}

.alert .text-muted {
  color: #6b7280;
}
</style>
